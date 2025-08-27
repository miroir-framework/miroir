/**
 * Configuration Service - Central mechanism for fetching Miroir & App configurations
 * 
 * This service provides a centralized way to initialize and fetch configurations
 */

import {
  Action2Error,
  Action2ReturnType,
  adminConfigurationDeploymentAdmin,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  defaultMiroirMetaModel,
  Domain2ElementFailed,
  MiroirConfigForRestClient,
  DomainControllerInterface,
  entityDeployment,
  LoggerInterface,
  MiroirConfigClient,
  MiroirLoggerFactory,
  StoreOrBundleAction,
  StoreUnitConfiguration,
} from "miroir-core";
import type { Deployment } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';

import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ConfigurationService")
).then((logger: LoggerInterface) => {log = logger});

export interface ConfigurationServiceOptions {
  domainController: DomainControllerInterface;
  miroirConfig: MiroirConfigClient;
  onSuccess?: (message: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Fetches Miroir & App configurations from the database
 * 
 * CRITICAL TWO-STEP BATCHING STRATEGY:
 * - Step 1: Open all stores first using Promise.all for batched execution
 * - Step 2: Execute all rollbacks after stores are opened using Promise.all
 * - Uses .then() chaining to maintain execution context for React 18 batching
 * - No intermediate awaits that would break the batching context
 * 
 * @param options Configuration options including domain controller and callbacks
 * @returns Promise that resolves when configuration fetching is complete
 */
export function fetchMiroirAndAppConfigurations(
  options: ConfigurationServiceOptions
): Promise<void> {
  const { domainController, miroirConfig, onSuccess, onError } = options;

  // Validate miroir configuration first
  if (!miroirConfig) {
    return Promise.reject(new Error(
      "no miroirConfig given, it has to be given on the command line starting the server!"
    ));
  }

  const configurations = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig
    : (miroirConfig.client as MiroirConfigForRestClient).serverConfig.storeSectionConfiguration;

  if (!configurations[adminConfigurationDeploymentAdmin.uuid]) {
    return Promise.reject(new Error(
      "no configuration for Admin selfApplication Deployment given, can not fetch data. Admin deployment uuid=" +
        adminConfigurationDeploymentAdmin.uuid +
        " configurations=" +
        JSON.stringify(configurations, null, 2)
    ));
  }

  log.info(
    "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FETCH CONFIGURATIONS START @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
  );

  // CRITICAL: Single promise chain with no intermediate awaits
  return domainController.handleAction(
    {
      actionType: "rollback",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
    },
    defaultMiroirMetaModel
  ).then(() => {
    // Query for deployments
    const subQueryName = "deployments";
    const adminDeploymentsQuery: BoxedQueryTemplateWithExtractorCombinerTransformer = {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
      pageParams: {},
      queryParams: {},
      contextResults: {},
      extractorTemplates: {
        [subQueryName]: {
          extractorTemplateType: "extractorTemplateForObjectListByEntity",
          applicationSection: "data",
          parentName: "Deployment",
          parentUuid: {
            transformerType: "constantUuid",
            interpolation: "build",
            value: entityDeployment.uuid,
          },
        },
      },
    };

    return domainController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY({
      actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
      actionName: "runQuery",
      deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
      endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
      payload: {
        applicationSection: "data",
        query: adminDeploymentsQuery,
      },
    });
  }).then((adminDeployments: Action2ReturnType) => {
    // Validate query results
    if (adminDeployments instanceof Action2Error) {
      throw new Error("found adminDeployments with error " + adminDeployments);
    }

    if (adminDeployments.returnedDomainElement instanceof Domain2ElementFailed) {
      throw new Error(
        "found adminDeployments failed " + adminDeployments.returnedDomainElement
      );
    }

    if (typeof adminDeployments.returnedDomainElement != "object") {
      throw new Error(
        "found adminDeployments query result not an object as expected " +
          adminDeployments.returnedDomainElement
      );
    }

    if (!adminDeployments.returnedDomainElement["deployments"]) {
      throw new Error(
        "found adminDeployments query result object does not have attribute deployments as expected " +
          adminDeployments.returnedDomainElement
      );
    }

    const foundDeployments = adminDeployments.returnedDomainElement["deployments"];
    log.info("found adminDeployments", foundDeployments);

    // Build store opening actions first
    const openStoreActions: Promise<any>[] = [];
    const deploymentsToLoad: Deployment[] = foundDeployments;

    // Add all store opening actions
    for (const deployment of Object.values(deploymentsToLoad)) {
      const deploymentData = deployment as any;
      
      openStoreActions.push(
        domainController.handleAction({
          actionType: "storeManagementAction_openStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" as const,
          configuration: {
            [deploymentData.uuid]: deploymentData.configuration as StoreUnitConfiguration,
          },
          deploymentUuid: deploymentData.uuid,
        })
      );
    }

    // STEP 1: Execute all store opening actions first
    return Promise.all(openStoreActions).then(() => {
      // STEP 2: Build and execute rollback actions after stores are opened
      const rollbackActions: Promise<any>[] = [];
      
      for (const deployment of Object.values(deploymentsToLoad)) {
        const deploymentData = deployment as any;
        
        rollbackActions.push(
          domainController.handleAction({
            actionType: "rollback",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" as const,
            deploymentUuid: deploymentData.uuid,
          }, defaultMiroirMetaModel)
        );
      }

      // Execute all rollback actions
      return Promise.all(rollbackActions);
    });
  }).then(() => {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FETCH CONFIGURATIONS DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
    );

    // Call success callback if provided
    if (onSuccess) {
      onSuccess("Miroir & App configurations fetched successfully");
    }
  }).catch((error) => {
    log.error("Error fetching configurations:", error);
    
    // Call error callback if provided
    if (onError) {
      onError(error as Error);
    } else {
      // Re-throw if no error handler provided
      throw error;
    }
  });
}

/**
 * React hook for accessing the configuration fetching functionality
 * This provides a convenient way to use the service within React components
 */
export function useConfigurationService() {
  return {
    fetchMiroirAndAppConfigurations,
  };
}

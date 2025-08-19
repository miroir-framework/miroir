/**
 * Configuration Service - Central mechanism for fetching Miroir & App configurations
 * 
 * This service provides a centralized way to initialize and fetch configurations
 * for deployments, handling the complex async operations with proper error handling
 * and batching for optimal performance.
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
 * This function performs the following operations:
 * 1. Validates the miroir configuration
 * 2. Performs rollback on admin deployment
 * 3. Queries for all deployments
 * 4. Opens stores for all found deployments
 * 5. Performs rollback on all deployments to load their configurations
 * 
 * @param options Configuration options including domain controller and callbacks
 * @returns Promise that resolves when configuration fetching is complete
 */
export async function fetchMiroirAndAppConfigurations(
  options: ConfigurationServiceOptions
): Promise<void> {
  const { domainController, miroirConfig, onSuccess, onError } = options;

  try {
    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FETCH CONFIGURATIONS START @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
    );

    // Validate miroir configuration
    if (!miroirConfig) {
      throw new Error(
        "no miroirConfig given, it has to be given on the command line starting the server!"
      );
    }

    const configurations = miroirConfig.client.emulateServer
      ? miroirConfig.client.deploymentStorageConfig
      : (miroirConfig.client as MiroirConfigForRestClient).serverConfig.storeSectionConfiguration;

    if (!configurations[adminConfigurationDeploymentAdmin.uuid]) {
      throw new Error(
        "no configuration for Admin selfApplication Deployment given, can not fetch data. Admin deployment uuid=" +
          adminConfigurationDeploymentAdmin.uuid +
          " configurations=" +
          JSON.stringify(configurations, null, 2)
      );
    }

    // Step 1: Perform rollback on admin deployment to get latest state
    await domainController.handleAction(
      {
        actionType: "rollback",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
      },
      defaultMiroirMetaModel
    );

    // Step 2: Query for all deployments
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

    const adminDeployments: Action2ReturnType =
      await domainController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY({
        actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
        actionName: "runQuery",
        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
        endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
        payload: {
          applicationSection: "data",
          query: adminDeploymentsQuery,
        },
      });

    // Step 3: Validate query results
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

    if (!adminDeployments.returnedDomainElement[subQueryName]) {
      throw new Error(
        "found adminDeployments query result object does not have attribute " +
          subQueryName +
          " as expected " +
          adminDeployments.returnedDomainElement
      );
    }

    const foundDeployments = adminDeployments.returnedDomainElement[subQueryName];
    log.info("found adminDeployments", foundDeployments);

    // Step 4: Prepare batch operations for all deployments
    const openStoreActions: StoreOrBundleAction[] = [];
    const rollbackActions: Array<{
      actionType: "rollback";
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e";
      deploymentUuid: string;
    }> = [];

    const deploymentsToLoad: Deployment[] = foundDeployments;

    // Build arrays of actions to execute in batches
    for (const deployment of Object.values(deploymentsToLoad)) {
      const deploymentData = deployment as any;
      
      openStoreActions.push({
        actionType: "storeManagementAction_openStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" as const,
        configuration: {
          [deploymentData.uuid]: deploymentData.configuration as StoreUnitConfiguration,
        },
        deploymentUuid: deploymentData.uuid,
      });

      rollbackActions.push({
        actionType: "rollback",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" as const,
        deploymentUuid: deploymentData.uuid,
      });
    }

    // Step 5: Execute all open store actions in parallel
    await Promise.all(
      openStoreActions.map((action) => domainController.handleAction(action))
    );

    // Step 6: Execute all rollback actions in parallel to load configurations
    await Promise.all(
      rollbackActions.map((action) =>
        domainController.handleAction(action, defaultMiroirMetaModel)
      )
    );

    log.info(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FETCH CONFIGURATIONS DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
    );

    // Call success callback if provided
    if (onSuccess) {
      onSuccess("Miroir & App configurations fetched successfully");
    }
  } catch (error) {
    log.error("Error fetching configurations:", error);
    
    // Call error callback if provided
    if (onError) {
      onError(error as Error);
    } else {
      // Re-throw if no error handler provided
      throw error;
    }
  }
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

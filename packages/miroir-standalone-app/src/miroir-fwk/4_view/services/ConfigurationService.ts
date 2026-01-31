/**
 * Configuration Service - Central mechanism for fetching Miroir & App configurations
 * 
 * This service provides a centralized way to initialize and fetch configurations
 */

import {
  Action2Error,
  Action2ReturnType,
  ACTION_OK,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentParis,
  adminSelfApplication,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  Domain2ElementFailed,
  DomainControllerInterface,
  entityDeployment,
  LoggerInterface,
  MiroirConfigClient,
  MiroirConfigForRestClient,
  MiroirLoggerFactory,
  StoreUnitConfiguration,
  type Action2VoidReturnType,
  type ApplicationDeploymentMap
} from "miroir-core";
import type { Deployment } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';

import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { logStartupError } from './ErrorLogService.js';

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
): Promise<Action2VoidReturnType> {
  const { domainController, miroirConfig, onSuccess, onError } = options;

  // Validate miroir configuration first
  if (!miroirConfig) {
    const error = new Error(
      "no miroirConfig given, it has to be given on the command line starting the server!"
    );
    return Promise.reject(error);
  }

  const configurations = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig
    : (miroirConfig.client as MiroirConfigForRestClient).serverConfig.storeSectionConfiguration;

  if (!configurations[adminConfigurationDeploymentAdmin.uuid]) {
    const error = new Error(
      "no configuration for Admin selfApplication Deployment given, can not fetch data. Admin deployment uuid=" +
        adminConfigurationDeploymentAdmin.uuid +
        " configurations=" +
        JSON.stringify(configurations, null, 2)
    );
    return Promise.reject(error);
  }

  log.info(
    "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FETCH CONFIGURATIONS START @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
  );

  let deploymentsToLoad: Deployment[] = []; // UGLY HACK to make it accessible in final .then()
  let applicationDeploymentMapForLoading: ApplicationDeploymentMap; // UGLY HACK to make it accessible in final .then()
  // CRITICAL: Single promise chain with no intermediate awaits to maintain React 18 batching
  return domainController
    .handleAction(
      {
        actionType: "rollback",
        application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: adminSelfApplication.uuid,
          // deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
        },
      },
      defaultSelfApplicationDeploymentMap,
      defaultMiroirModelEnvironment
    )
    .then((rollbackResult: Action2VoidReturnType) => {
      // Check if the rollback action failed
      if (rollbackResult && rollbackResult.status === "error") {
        throw new Error(
          `Failed to rollback admin configuration: ${
            rollbackResult.errorMessage || "Unknown error"
          }`
        );
      }

      // Query for deployments
      const subQueryName = "deployments";
      const adminDeploymentsQuery: BoxedQueryTemplateWithExtractorCombinerTransformer = {
        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        application: adminSelfApplication.uuid,
        // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
        // deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
        pageParams: {},
        queryParams: {},
        contextResults: {},
        extractorTemplates: {
          [subQueryName]: {
            extractorOrCombinerType: "extractorForObjectListByEntity",
            applicationSection: "data",
            parentName: "Deployment",
            parentUuid: {
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
              interpolation: "build",
              value: entityDeployment.uuid,
            } as any,
          },
        },
      };

      return domainController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
        {
          actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: adminSelfApplication.uuid,
            // applicationDeploymentMap: defaultSelfApplicationDeploymentMap,
            // deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
            applicationSection: "data",
            query: adminDeploymentsQuery,
          },
        },
        defaultSelfApplicationDeploymentMap,
        defaultMiroirModelEnvironment
      );
    })
    .then((adminDeployments: Action2ReturnType) => {
      // Validate query results with structured error handling
      if (adminDeployments instanceof Action2Error) {
        throw new Error(
          `Error fetching deployments: ${
            adminDeployments.errorMessage || adminDeployments.errorType
          }`
        );
      }

      if (adminDeployments.returnedDomainElement instanceof Domain2ElementFailed) {
        throw new Error(
          `Failed to fetch deployments: ${
            adminDeployments.returnedDomainElement.elementType
          } - ${JSON.stringify(adminDeployments.returnedDomainElement, null, 2)}`
        );
      }

      if (typeof adminDeployments.returnedDomainElement != "object") {
        throw new Error(
          "Deployments query returned unexpected result type. Expected object but got: " +
            typeof adminDeployments.returnedDomainElement
        );
      }

      if (!adminDeployments.returnedDomainElement["deployments"]) {
        throw new Error(
          "Deployments query result missing 'deployments' property. Available properties: " +
            Object.keys(adminDeployments.returnedDomainElement).join(", ")
        );
      }

      const foundDeployments = adminDeployments.returnedDomainElement["deployments"].filter(
        (dep: Deployment) => {
          return dep.uuid !== adminConfigurationDeploymentParis.uuid;
        }
      );
      log.info(
        "fetchMiroirAndAppConfigurations found adminDeployments",
        foundDeployments,
        "defaultSelfApplicationDeploymentMap",
        defaultSelfApplicationDeploymentMap
      );

      // Build store opening actions first
      const openStoreActions: Promise<any>[] = [];
      deploymentsToLoad  = foundDeployments.filter((deployment: Deployment) => {
        return (
          // deployment.adminApplication !== selfApplicationLibrary.uuid && // remove library to debug
          deployment.adminApplication !== adminSelfApplication.uuid
        ); // no need to load admin app deployment, it was already loaded in the firs step
        // return deployment.adminApplication !== adminSelfApplication.uuid; // no need to load admin app deployment, it was already loaded in the firs step
      });

      log.info("fetchMiroirAndAppConfigurations deploymentsToLoad", deploymentsToLoad);

      applicationDeploymentMapForLoading = deploymentsToLoad
        ? Object.fromEntries(
            deploymentsToLoad.map((deployment: Deployment) => {
              return [deployment.adminApplication, deployment.uuid];
            })
          )
        : defaultSelfApplicationDeploymentMap;

      log.info(
        "fetchMiroirAndAppConfigurations applicationDeploymentMapForLoading",
        applicationDeploymentMapForLoading
      );

      // Add all store opening actions
      for (const deployment of Object.values(deploymentsToLoad)) {
        // const deploymentData = deployment as any;
        log.info(
          "fetchMiroirAndAppConfigurations preparing to open store for deployment",
          deployment
        );
        openStoreActions.push(
          domainController.handleAction(
            {
              actionType: "storeManagementAction_openStore",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f" as const,
              payload: {
                application: deployment.adminApplication,
                deploymentUuid: deployment.uuid,
                configuration: {
                  [deployment.uuid]: deployment.configuration as StoreUnitConfiguration,
                },
              },
            },
            applicationDeploymentMapForLoading,
            defaultMiroirModelEnvironment
          )
        );
      }

      // STEP 1: Execute all store opening actions first
      return Promise.all(openStoreActions)
    })
    .then((openResults) => {
      // Check for any failures in store opening
      const failedStores = openResults.filter((result) => result && result.status === "error");
      if (failedStores.length > 0) {
        const failureMessages = failedStores
          .map((result) => result.errorMessage || "Unknown error")
          .join("; ");
        throw new Error(`Failed to open ${failedStores.length} store(s): ${failureMessages}`);
      }

      // STEP 2: Build and execute rollback actions after stores are opened
      const rollbackActions: Promise<Action2ReturnType>[] = [];

      for (const deployment of Object.values(deploymentsToLoad)) {
        rollbackActions.push(
          domainController.handleAction(
            {
              actionType: "rollback",
              application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" as const,
              payload: {
                application: deployment.adminApplication,
                // deploymentUuid: deployment.uuid,
              },
            },
            applicationDeploymentMapForLoading,
            defaultMiroirModelEnvironment
          )
        );
      }

      // Execute all rollback actions
      return Promise.all(rollbackActions);
    })
    // .then((rollbackResults: {value: any[]}) => {
    .then(((rollbackResults: any[]) => {
      // Check for any failures in rollback actions
      const failedRollbacks = (rollbackResults as any).filter(
        // (result: any) => result && result.status === "error"
        (result: any) => result && result instanceof Action2Error
      );
      log.info("fetchMiroirAndAppConfigurations rollbackResults", rollbackResults, "failedRollbacks", failedRollbacks.length);
      if (failedRollbacks.length > 0) {
        const failureMessages = failedRollbacks
          .map((result: any) => result.errorMessage || "Unknown error")
          .join("; ");
        if (onError) {
          const structuredError = new Error(
            `Configuration loading failed for deployments: ${failureMessages}`
          );
          // Preserve original error details
          // (structuredError as any).originalError = error;
          (structuredError as any).errorType = "ConfigurationLoadingError";
          (structuredError as any).isStartupError = true;
          // (structuredError as any).errorId = errorEntry.id;
          onError(structuredError);
        }
        return Promise.resolve(
          new Action2Error(
            "FailedToHandleAction",
            `Failed to rollback ${failedRollbacks.length} deployment(s): ${failureMessages}`
          )
        );
        // throw new Error(
        //   `Failed to rollback ${failedRollbacks.length} deployment(s): ${failureMessages}`
        // );
      }

      log.info(
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ FETCH CONFIGURATIONS DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
      );

      // Call success callback if provided
      if (onSuccess) {
        onSuccess("Miroir & App configurations fetched successfully");
      }
      return Promise.resolve(ACTION_OK);
    }) as any)// TODO: fix typing!!
    .catch((error) => {
      log.error("Error fetching configurations:", error);

      // Log the startup error to the global error service
      const errorEntry = logStartupError(error, {
        functionName: "fetchMiroirAndAppConfigurations",
        miroirConfigPresent: !!miroirConfig,
        timestamp: new Date().toISOString(),
      });

      // Create a structured error for better error reporting
      const structuredError = new Error(
        `Configuration loading failed: ${error.message || error.toString()}`
      );
      // Preserve original error details
      (structuredError as any).originalError = error;
      (structuredError as any).errorType = "ConfigurationLoadingError";
      (structuredError as any).isStartupError = true;
      (structuredError as any).errorId = errorEntry.id;

      // Call error callback if provided
      if (onError) {
        onError(structuredError);
      } else {
        // Re-throw the structured error if no error handler provided
        // throw structuredError;
        return Promise.resolve(new Action2Error("FailedToHandleAction", structuredError.message));
      }
      return Promise.resolve(new Action2Error("FailedToHandleAction", structuredError.message));
    }) as any; // TODO: fix typing!!
}/**
 * React hook for accessing the configuration fetching functionality
 * This provides a convenient way to use the service within React components
 */
export function useConfigurationService() {
  return {
    fetchMiroirAndAppConfigurations,
  };
}

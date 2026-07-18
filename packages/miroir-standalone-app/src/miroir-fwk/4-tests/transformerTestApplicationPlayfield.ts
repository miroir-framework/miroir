/**
 * Shared transformer testApplication seed + storage helpers.
 * Usable with local PSC (IntegrationTestSession) or remote DomainController (realServer).
 */
import {
  Action2Error,
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  getBasicApplicationConfiguration,
  type ApplicationDeploymentMap,
  type Deployment,
  type DomainControllerInterface,
  type Entity,
  type MiroirConfigClient,
  type StoreUnitConfiguration,
  type Uuid,
} from "miroir-core";
import { deployment_Admin, deployment_Miroir } from "miroir-test-app_deployment-admin";
import { deployment_Library_DO_NO_USE } from "miroir-test-app_deployment-library";

import {
  buildIntegrationTestModelEnvironment,
  INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES,
  type IntegrationTestApplicationIdentity,
} from "./IntegrationTestSession.js";

/** Postgres / identifier-safe name derived from applicationName. */
export function sanitizeStoreIdentifier(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "_");
  return /^[a-zA-Z_]/.test(cleaned) ? cleaned : `app_${cleaned}`;
}

/**
 * Clone a template (usually Library) StoreUnitConfiguration for an ephemeral
 * testApplication — mirrors tests/4_view/RunnerIntegTestTools.testApplicationStorageConfiguration.
 */
export function deriveEphemeralTestApplicationStorageConfiguration(
  template: StoreUnitConfiguration,
  applicationName: string,
): StoreUnitConfiguration {
  const id = sanitizeStoreIdentifier(applicationName);
  switch (template.model.emulatedServerType) {
    case "indexedDb":
      return {
        admin: template.admin,
        model: { emulatedServerType: "indexedDb", indexedDbName: id },
        data: { emulatedServerType: "indexedDb", indexedDbName: id },
      };
    case "filesystem":
      return {
        admin: template.admin,
        model: { emulatedServerType: "filesystem", directory: `./test_data/${id}` },
        data: { emulatedServerType: "filesystem", directory: `./test_data/${id}` },
      };
    case "sql": {
      const connectionString =
        "connectionString" in template.model && typeof template.model.connectionString === "string"
          ? template.model.connectionString
          : "postgres://postgres:postgres@localhost:5432/postgres";
      return {
        admin: template.admin,
        model: {
          emulatedServerType: "sql",
          connectionString,
          schema: id,
          forceNullOptionalAttributeToUndefined: true,
        },
        data: {
          emulatedServerType: "sql",
          connectionString,
          schema: id,
          forceNullOptionalAttributeToUndefined: true,
        },
      };
    }
    case "mongodb": {
      const connectionString =
        "connectionString" in template.model && typeof template.model.connectionString === "string"
          ? template.model.connectionString
          : "mongodb://localhost:27017";
      return {
        admin: template.admin,
        model: { emulatedServerType: "mongodb", connectionString, database: id },
        data: { emulatedServerType: "mongodb", connectionString, database: id },
      };
    }
    default:
      throw new Error(
        `deriveEphemeralTestApplicationStorageConfiguration: unsupported emulatedServerType ${template.model.emulatedServerType}`,
      );
  }
}

export function resolveStoreSectionConfigurationFromMiroirConfig(
  miroirConfig: MiroirConfigClient,
  deploymentUuid: Uuid,
): StoreUnitConfiguration {
  if (miroirConfig.client.emulateServer === true) {
    const cfg = miroirConfig.client.deploymentStorageConfig?.[deploymentUuid];
    if (!cfg) {
      throw new Error(
        `Missing deploymentStorageConfig for ${deploymentUuid} (emulated profile)`,
      );
    }
    return cfg as StoreUnitConfiguration;
  }
  const cfg = miroirConfig.client.serverConfig?.storeSectionConfiguration?.[deploymentUuid];
  if (!cfg) {
    throw new Error(
      `Missing serverConfig.storeSectionConfiguration for ${deploymentUuid} (realServer profile)`,
    );
  }
  return cfg as StoreUnitConfiguration;
}

export function resolveAdminDeploymentFromMiroirConfig(
  miroirConfig: MiroirConfigClient,
): Deployment {
  const adminStorage =
    resolveStoreSectionConfigurationFromMiroirConfig(miroirConfig, deployment_Admin.uuid) ??
    (deployment_Admin.configuration as StoreUnitConfiguration);
  return {
    ...deployment_Admin,
    configuration: adminStorage,
  };
}

export function resolveLibraryTemplateStorageFromMiroirConfig(
  miroirConfig: MiroirConfigClient,
): StoreUnitConfiguration {
  return resolveStoreSectionConfigurationFromMiroirConfig(
    miroirConfig,
    deployment_Library_DO_NO_USE.uuid,
  );
}

export function resolveMiroirStorageFromMiroirConfig(
  miroirConfig: MiroirConfigClient,
): StoreUnitConfiguration {
  return resolveStoreSectionConfigurationFromMiroirConfig(miroirConfig, deployment_Miroir.uuid);
}

export function buildTransformerApplicationDeploymentMap(
  identity: IntegrationTestApplicationIdentity,
): ApplicationDeploymentMap {
  return {
    ...defaultSelfApplicationDeploymentMap,
    [identity.applicationUuid]: identity.deploymentUuid,
  };
}

export function buildTransformerInitApplicationParameters(
  identity: IntegrationTestApplicationIdentity,
) {
  return getBasicApplicationConfiguration(
    identity.applicationName,
    identity.applicationUuid,
    identity.deploymentUuid,
    identity.modelBranchUuid,
    identity.versionUuid,
  );
}

/**
 * Seed / re-seed the transformer testApplication (Author/Book/Publisher fixtures).
 * Works for local or remote DomainController.
 */
export async function seedTransformerTestApplicationData(
  domainController: DomainControllerInterface,
  identity: IntegrationTestApplicationIdentity,
  applicationDeploymentMap: ApplicationDeploymentMap,
): Promise<void> {
  const initParams = buildTransformerInitApplicationParameters(identity);
  const modelEnvironment = buildIntegrationTestModelEnvironment(identity.deploymentUuid);

  const resetResult = await domainController.handleAction(
    {
      actionType: "resetModel",
      actionLabel: "resetTestStore",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: { application: identity.applicationUuid },
    },
    applicationDeploymentMap,
    modelEnvironment,
  );
  if (resetResult instanceof Action2Error) {
    throw new Error(
      "seedTransformerTestApplicationData: resetModel failed: " + JSON.stringify(resetResult),
    );
  }

  const initResult = await domainController.handleAction(
    {
      actionType: "initModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: identity.applicationUuid,
        params: {
          dataStoreType: "app",
          metaModel: defaultMiroirMetaModel,
          selfApplication: initParams.selfApplication,
          applicationModelBranch: initParams.applicationModelBranch,
          applicationVersion: initParams.applicationVersion,
        },
      },
    },
    applicationDeploymentMap,
    modelEnvironment,
  );
  if (initResult instanceof Action2Error) {
    throw new Error(
      "seedTransformerTestApplicationData: initModel failed: " + JSON.stringify(initResult),
    );
  }

  const createEntityResult = await domainController.handleAction(
    {
      actionType: "createEntity",
      actionLabel: "CreateLibraryStoreEntities",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        application: identity.applicationUuid,
        transactional: false,
        entities: INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES.flatMap((entry) => ({
          entity: entry.entity as Entity,
          entityDefinition: entry.entityDefinition,
        })),
      },
    },
    applicationDeploymentMap,
    modelEnvironment,
  );
  if (createEntityResult instanceof Action2Error) {
    throw new Error(
      "seedTransformerTestApplicationData: createEntity failed: " +
        JSON.stringify(createEntityResult),
    );
  }

  const createInstanceResult = await domainController.handleAction(
    {
      actionType: "createInstance",
      actionLabel: "CreateLibraryStoreInstances",
      endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      payload: {
        application: identity.applicationUuid,
        applicationSection: "data",
        objects: INTEG_TEST_LIBRARY_ENTITIES_AND_INSTANCES.flatMap((entry) => entry.instances),
      },
    },
    applicationDeploymentMap,
    modelEnvironment,
  );
  if (createInstanceResult instanceof Action2Error) {
    throw new Error(
      "seedTransformerTestApplicationData: createInstance failed: " +
        JSON.stringify(createInstanceResult),
    );
  }
}

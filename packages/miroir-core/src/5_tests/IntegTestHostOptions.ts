import type {
  Deployment,
  EntityInstance,
  MetaModelPartial,
  MiroirConfigClient,
  Runner,
  StoreUnitConfiguration,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Uuid } from "../0_interfaces/1_core/EntityVersion.js";
import type { InitApplicationParameters } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import type { ApplicationDeploymentMap, ApplicationEntitiesAndInstances } from "../1_core/Deployment.js";
import type { MiroirActivityTracker } from "../3_controllers/MiroirActivityTracker";
import type { MiroirEventService } from "../3_controllers/MiroirEventService";
import type {
  DomainControllerSessionProfile,
  IntegrationTestBootstrapPhase,
  IntegrationTestHostMode,
  IntegrationTestSessionKind,
} from "./IntegrationTestBootstrap.js";
import type { LibraryPlayfieldEnsureMode } from "./LibraryPlayfield.js";
import type { MiroirPlatformEnsureMode } from "./MiroirPlatformPlayfield.js";
import type { MiroirTestExecutionEnvironment } from "./MiroirTestTools.js";
import type { TestbedUuids } from "./TestbedUuids.js";

/**
 * Host-mode knobs shared by emulated app-stack bootstrap and realServer client bootstrap.
 */
export type IntegTestHostOptions = {
  hostMode?: IntegrationTestHostMode;
  hostExecutionEnvironment?: Partial<MiroirTestExecutionEnvironment>;
  skipBootstrapPhases?: readonly IntegrationTestBootstrapPhase[];
  platformEnsureMode?: MiroirPlatformEnsureMode;
};

export type TestApplicationStoreOptions =
  | { emulatedServerType: "sql"; postgresHostName?: string; connectionString?: string }
  | {
      emulatedServerType: "filesystem";
      applicationRootDirectory: string;
    }
  | { emulatedServerType: "indexedDb"; rootIndexDbName: string }
  | {
      emulatedServerType: "mongodb";
      connectionString?: string;
      database?: string;
    };

export type AdminStoreOptions =
  | {
      emulatedServerType: "filesystem";
      adminAssetsRootDirectory: string;
      filesystemDeploymentRootDirectory: string;
    }
  | {
      emulatedServerType: "sql";
      postgresHostName?: string;
      connectionString?: string;
      schema?: string;
    }
  | { emulatedServerType: "indexedDb"; rootIndexDbName: string }
  | {
      emulatedServerType: "mongodb";
      connectionString?: string;
      database?: string;
    }
  | { emulatedServerType: "bundled"; deploymentUuid: Uuid };

export type IntegrationTestApplicationIdentity = {
  applicationName: string;
  applicationUuid: Uuid;
  deploymentUuid: Uuid;
  modelBranchUuid: Uuid;
  versionUuid: Uuid;
};

export type IntegrationTestBundledSectionData = Record<string, EntityInstance[]>;

export type IntegrationTestBundledDeploymentData = {
  admin: IntegrationTestBundledSectionData;
  model: IntegrationTestBundledSectionData;
  data: IntegrationTestBundledSectionData;
};

export type TestSessionForIntegOptions = {
  applicationName?: string;
  testApplicationStore: TestApplicationStoreOptions;
  adminStore: AdminStoreOptions;
  filesystemDeploymentRootDirectory?: string;
  bundledDeploymentData?: Record<string, IntegrationTestBundledDeploymentData>;
  applicationIdentity?: IntegrationTestApplicationIdentity;
};

export type RealServerTransformerIntegrationSessionOptions = IntegTestHostOptions & {
  /** Discriminant — orchestrator routes on this (or `isRealServerTransformerSessionOptions`). */
  transport: "realServer";
  miroirConfig?: MiroirConfigClient;
  applicationIdentity?: IntegrationTestApplicationIdentity;
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
  customFetch?: typeof fetch;
};

export type TransformerIntegrationSessionOptions =
  | TestSessionForIntegOptions
  | RealServerTransformerIntegrationSessionOptions;

/**
 * Checks if the options are for a realServer transformer session.
 * @param options - The options to check.
 * @returns True if the options are for a realServer transformer session, false otherwise.
 */
export function isRealServerTransformerSessionOptions(
  options: TransformerIntegrationSessionOptions | undefined,
): options is RealServerTransformerIntegrationSessionOptions {
  return (
    typeof options === "object" &&
    options !== null &&
    "transport" in options &&
    options.transport === "realServer"
  );
}

export type AppStackIntegrationSessionOptions = IntegTestHostOptions & {
  applicationDeploymentMap: ApplicationDeploymentMap;
  adminDeployment: Deployment;
  libraryDeploymentStorageConfiguration: StoreUnitConfiguration;
  libraryPlayfieldEnsureMode?: LibraryPlayfieldEnsureMode;
};

/** Alias kept for existing standalone-app imports. */
export type AppStackSessionOptions = AppStackIntegrationSessionOptions;

export type DomainControllerIntegrationSessionOptions = AppStackIntegrationSessionOptions & {
  miroirDeploymentStorageConfiguration: StoreUnitConfiguration;
  miroirActivityTracker?: MiroirActivityTracker;
  miroirEventService?: MiroirEventService;
  customFetch?: typeof fetch;
  skipResetMiroirModelInInit?: boolean;
};

export type DomainControllerOrchestratorSessionOptions =
  DomainControllerIntegrationSessionOptions & {
    profile: DomainControllerSessionProfile;
  };

export type RunnerLibraryPlayfieldSeed = {
  testbedEntitiesAndInstances: ApplicationEntitiesAndInstances;
  testbedInitApplicationParameters: InitApplicationParameters;
  testbedModel: MetaModelPartial;
};

export type ActionIntegrationSessionOptions = IntegTestHostOptions & {
  pageLabel?: string;
  runTarget: TestbedUuids;
  suiteTestParams?: Record<string, unknown>;
  testBedModelAndInstances: RunnerLibraryPlayfieldSeed;
};

export type RunnerIntegrationSessionOptions = IntegTestHostOptions & {
  pageLabel?: string;
  runTarget: TestbedUuids;
  suiteTestParams?: Record<string, unknown>;
  skipRunTargetPlayfieldReset?: boolean;
  testBedModelAndInstances?: RunnerLibraryPlayfieldSeed;
  /** Runner definitions keyed by Runner uuid for leaf `runnerRef` lookup. */
  runnerUuidIndex?: Record<string, Runner>;
};

// export type IntegrationTestSessionOptionsByKind = {
//   transformer: TransformerIntegrationSessionOptions | undefined;
//   appStackPersistenceStoreController: AppStackIntegrationSessionOptions;
//   domainController: DomainControllerOrchestratorSessionOptions;
//   runner: RunnerIntegrationSessionOptions | undefined;
// };


import {
  ApplicationSection,
  BundledStoreSectionConfiguration,
  EntityInstance,
  ErrorAdminStore,
  ErrorDataStore,
  ErrorModelStore,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreDataOrModelSectionInterface,
  PersistenceStoreDataSectionInterface,
  StoreSectionConfiguration,
  type ConfigurationServiceInner,
} from "miroir-core";
import { cleanLevel } from "./4_services/constants.js";
import { BundledAdminStore } from "./4_services/BundledAdminStore.js";
import { BundledDataStoreSection } from "./4_services/BundledDataStoreSection.js";
import { BundledModelStoreSection } from "./4_services/BundledModelStoreSection.js";
import { packageName } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "startup")
).then((logger: LoggerInterface) => {
  log = logger;
});

export type BundledSectionData = Record<string, EntityInstance[]>;

export type BundledDeploymentData = {
  admin: BundledSectionData;
  model: BundledSectionData;
  data: BundledSectionData;
};

const bundledDataRegistry: Map<string, BundledDeploymentData> = new Map();

export function registerBundledDeploymentData(
  deploymentUuid: string,
  data: BundledDeploymentData,
): void {
  bundledDataRegistry.set(deploymentUuid, data);
}

export function miroirBundledStoreSectionStartup(
  configurationService: ConfigurationServiceInner,
  bundledData: Record<string, BundledDeploymentData>,
): void {
  for (const [deploymentUuid, data] of Object.entries(bundledData)) {
    registerBundledDeploymentData(deploymentUuid, data);
  }

  configurationService.registerAdminStoreFactory(
    "bundled",
    async (
      config: StoreSectionConfiguration,
      _filesystemDeploymentRootDirectory: string,
    ): Promise<PersistenceStoreAdminSectionInterface> => {
      if (config.emulatedServerType === "bundled") {
        const bundledConfig = config as BundledStoreSectionConfiguration;
        log.info("registerAdminStoreFactory bundled for deploymentUuid", bundledConfig.deploymentUuid);
        return Promise.resolve(new BundledAdminStore(bundledConfig.deploymentUuid));
      }
      log.warn("registerAdminStoreFactory bundled: unexpected config", config);
      return Promise.resolve(new ErrorAdminStore());
    },
  );

  configurationService.registerStoreSectionFactory(
    "bundled",
    "model",
    async (
      _section: ApplicationSection,
      config: StoreSectionConfiguration,
      _filesystemDeploymentRootDirectory: string,
      dataStore?: PersistenceStoreDataSectionInterface,
    ): Promise<PersistenceStoreDataOrModelSectionInterface> => {
      if (config.emulatedServerType === "bundled" && dataStore) {
        const bundledConfig = config as BundledStoreSectionConfiguration;
        const deploymentData = bundledDataRegistry.get(bundledConfig.deploymentUuid);
        if (!deploymentData) {
          log.error(
            "registerStoreSectionFactory bundled model: no data found for deploymentUuid",
            bundledConfig.deploymentUuid,
          );
          return Promise.resolve(new ErrorModelStore());
        }
        log.info(
          "registerStoreSectionFactory bundled model for deploymentUuid",
          bundledConfig.deploymentUuid,
        );
        return Promise.resolve(
          new BundledModelStoreSection(
            bundledConfig.deploymentUuid + "-model",
            "model",
            deploymentData.model,
            dataStore,
          ),
        );
      }
      log.warn("registerStoreSectionFactory bundled model: unexpected config or missing dataStore", config);
      return Promise.resolve(new ErrorModelStore());
    },
  );

  configurationService.registerStoreSectionFactory(
    "bundled",
    "data",
    async (
      _section: ApplicationSection,
      config: StoreSectionConfiguration,
      _filesystemDeploymentRootDirectory: string,
    ): Promise<PersistenceStoreDataOrModelSectionInterface> => {
      if (config.emulatedServerType === "bundled") {
        const bundledConfig = config as BundledStoreSectionConfiguration;
        const deploymentData = bundledDataRegistry.get(bundledConfig.deploymentUuid);
        if (!deploymentData) {
          log.error(
            "registerStoreSectionFactory bundled data: no data found for deploymentUuid",
            bundledConfig.deploymentUuid,
          );
          return Promise.resolve(new ErrorDataStore());
        }
        log.info(
          "registerStoreSectionFactory bundled data for deploymentUuid",
          bundledConfig.deploymentUuid,
        );
        return Promise.resolve(
          new BundledDataStoreSection(
            bundledConfig.deploymentUuid + "-data",
            "data",
            deploymentData.data,
          ),
        );
      }
      log.warn("registerStoreSectionFactory bundled data: unexpected config", config);
      return Promise.resolve(new ErrorDataStore());
    },
  );
}

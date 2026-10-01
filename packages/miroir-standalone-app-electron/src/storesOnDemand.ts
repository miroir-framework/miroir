import {
  ConfigurationServiceInner,
  type ApplicationSection,
  type PersistenceStoreAdminSectionFactory,
  type PersistenceStoreSectionFactory,
} from "miroir-core";

type StorageType = Parameters<ConfigurationServiceInner["registerAdminStoreFactory"]>[0];

type StoreSectionStartup = (configurationService: ConfigurationServiceInner) => void;

const SECTIONS: ApplicationSection[] = ["model", "data", "modelVersion"];

/**
 * Registers the factories of a store type whose package loads the first time one of them runs
 * (#370): the Electron main process reads no MongoDB or PostgreSQL driver unless the environment
 * opens a section on that store. The package's own startup registers its real factories on a
 * scratch configuration service; they replace these placeholders and serve every later call.
 */
export function registerStoreOnDemand(
  configurationService: ConfigurationServiceInner,
  storageType: StorageType,
  loadStartup: () => Promise<StoreSectionStartup>,
): void {
  let loaded: Promise<ConfigurationServiceInner> | undefined;
  const load = () =>
    (loaded ??= loadStartup().then((startup) => {
      const scratch = new ConfigurationServiceInner();
      startup(scratch);
      for (const [key, factory] of scratch.adminStoreFactoryRegister) {
        configurationService.adminStoreFactoryRegister.set(key, factory);
      }
      for (const [key, factory] of scratch.StoreSectionFactoryRegister) {
        configurationService.StoreSectionFactoryRegister.set(key, factory);
      }
      return scratch;
    }));

  const adminStoreFactory: PersistenceStoreAdminSectionFactory = async (...args) => {
    const factory = (await load()).adminStoreFactoryRegister.get(JSON.stringify({ storageType }));
    if (!factory) {
      throw new Error(`store package for ${storageType} registers no admin store factory`);
    }
    return factory(...args);
  };
  configurationService.registerAdminStoreFactory(storageType, adminStoreFactory);

  for (const section of SECTIONS) {
    const storeSectionFactory: PersistenceStoreSectionFactory = async (...args) => {
      const factory = (await load()).StoreSectionFactoryRegister.get(JSON.stringify({ storageType, section }));
      if (!factory) {
        throw new Error(`store package for ${storageType} registers no ${section} section factory`);
      }
      return factory(...args);
    };
    configurationService.registerStoreSectionFactory(storageType, section, storeSectionFactory);
  }
}

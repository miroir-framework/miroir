/**
 * #232 Slice 5.1 — Backend support policy for the modelVersion section.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import type {
  ApplicationSection,
  StoreUnitConfiguration,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { Action2Error } from "../../src/0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../../src/1_core/constants.js";
import { ConfigurationService } from "../../src/3_controllers/ConfigurationService.js";
import type {
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
} from "../../src/0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { PersistenceStoreControllerManager } from "../../src/4_services/PersistenceStoreControllerManager.js";
import {
  BUNDLED_MODEL_VERSION_UNSUPPORTED_MESSAGE,
  miroirBundledStoreSectionStartup,
} from "miroir-store-bundled";
import { entitySelfApplicationVersion } from "miroir-test-app_deployment-miroir";

const DEPLOYMENT_UUID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const HISTORY_PARENT_UUID = entitySelfApplicationVersion.uuid!;
const INSTANCE = {
  uuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  parentUuid: HISTORY_PARENT_UUID,
  parentName: "SelfApplicationVersion",
  name: "232-bundled-policy-test",
};

class RecordingSectionStore implements PersistenceStoreDataSectionInterface {
  public opened = false;

  constructor(
    public readonly section: ApplicationSection,
    public readonly name: string,
  ) {}

  getStoreName() {
    return this.name;
  }
  async open() {
    this.opened = true;
    return ACTION_OK;
  }
  async close() {
    return ACTION_OK;
  }
  async bootFromPersistedState() {
    return ACTION_OK;
  }
  getEntityUuids() {
    return [];
  }
  getEntityIdAttribute() {
    return "uuid";
  }
  async clear() {
    return ACTION_OK;
  }
  async getInstance() {
    return { returnedDomainElement: { elementType: "void", elementValue: {} as any } } as any;
  }
  async getInstances() {
    return {
      returnedDomainElement: {
        elementType: "entityInstanceCollection",
        elementValue: {
          parentUuid: HISTORY_PARENT_UUID,
          applicationSection: this.section,
          instances: this.section === "modelVersion" ? [INSTANCE] : [],
        },
      },
    } as any;
  }
  async handleQueryTemplateActionForServerONLY() {
    return { returnedDomainElement: { elementType: "void", elementValue: undefined } } as any;
  }
  async handleBoxedQueryAction() {
    return { returnedDomainElement: { elementType: "void", elementValue: undefined } } as any;
  }
  async upsertInstance() {
    return ACTION_OK;
  }
  async deleteInstance() {
    return ACTION_OK;
  }
  async deleteInstances() {
    return ACTION_OK;
  }
  async dropStorageSpaceForInstancesOfEntity() {
    return ACTION_OK;
  }
  async createStorageSpaceForInstancesOfEntity() {
    return ACTION_OK;
  }
  async renameStorageSpaceForInstancesOfEntity() {
    return ACTION_OK;
  }
  async getState() {
    return {};
  }
}

class RecordingModelStore extends RecordingSectionStore implements PersistenceStoreModelSectionInterface {
  existsEntity() {
    return false;
  }
  async createEntity() {
    return ACTION_OK;
  }
  async createEntities() {
    return ACTION_OK;
  }
  async renameEntityClean() {
    return ACTION_OK;
  }
  async alterEntityAttribute() {
    return ACTION_OK;
  }
  async dropEntity() {
    return ACTION_OK;
  }
  async dropEntities() {
    return ACTION_OK;
  }
}

function makeAdminStub(): PersistenceStoreAdminSectionInterface {
  return {
    getStoreName: () => "admin",
    open: async () => ACTION_OK,
    close: async () => ACTION_OK,
    createStore: async () => ACTION_OK,
    deleteStore: async () => ACTION_OK,
  };
}

function registerBackendFactories(
  storageType: "indexedDb" | "mongodb",
  modelStore: RecordingModelStore,
  dataStore: RecordingSectionStore,
  historyStore: RecordingSectionStore,
) {
  const configService = ConfigurationService.configurationService;
  configService.adminStoreFactoryRegister.clear();
  configService.StoreSectionFactoryRegister.clear();
  configService.registerAdminStoreFactory(storageType, async () => makeAdminStub());
  configService.registerStoreSectionFactory(storageType, "data", async () => dataStore);
  configService.registerStoreSectionFactory(storageType, "model", async () => modelStore);
  configService.registerStoreSectionFactory(storageType, "modelVersion", async () => historyStore);
}

function buildBackendConfig(
  storageType: "indexedDb" | "mongodb",
  rootDir: string,
  withHistory: boolean,
): StoreUnitConfiguration {
  const config: StoreUnitConfiguration = {
    admin: {
      emulatedServerType: storageType,
      ...(storageType === "indexedDb"
        ? { indexedDbName: join(rootDir, "admin") }
        : { connectionString: "mongodb://localhost:27017", database: join(rootDir, "admin") }),
    },
    model: {
      emulatedServerType: storageType,
      ...(storageType === "indexedDb"
        ? { indexedDbName: join(rootDir, "model") }
        : { connectionString: "mongodb://localhost:27017", database: join(rootDir, "model") }),
    },
    data: {
      emulatedServerType: storageType,
      ...(storageType === "indexedDb"
        ? { indexedDbName: join(rootDir, "data") }
        : { connectionString: "mongodb://localhost:27017", database: join(rootDir, "data") }),
    },
  };
  if (withHistory) {
    config.modelVersion = {
      emulatedServerType: storageType,
      ...(storageType === "indexedDb"
        ? { indexedDbName: join(rootDir, "modelVersion") }
        : { connectionString: "mongodb://localhost:27017", database: join(rootDir, "modelVersion") }),
    };
  }
  return config;
}

function buildBundledConfig(withHistory: boolean): StoreUnitConfiguration {
  const bundledSection = {
    emulatedServerType: "bundled" as const,
    deploymentUuid: DEPLOYMENT_UUID,
  };
  const config: StoreUnitConfiguration = {
    admin: bundledSection,
    model: bundledSection,
    data: bundledSection,
  };
  if (withHistory) {
    config.modelVersion = bundledSection;
  }
  return config;
}

describe("232 Slice 5.1 — modelVersion backend support policy", () => {
  let tempRoot: string;

  afterEach(async () => {
    ConfigurationService.configurationService.adminStoreFactoryRegister.clear();
    ConfigurationService.configurationService.StoreSectionFactoryRegister.clear();
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it.each(["indexedDb", "mongodb"] as const)(
    "5.1 — %s registers distinct modelVersion storage and routes history reads there",
    async (storageType) => {
      tempRoot = await mkdtemp(join(tmpdir(), `232-${storageType}-`));
      const modelStore = new RecordingModelStore("model", `${storageType}-model`);
      const dataStore = new RecordingSectionStore("data", `${storageType}-data`);
      const historyStore = new RecordingSectionStore("modelVersion", `${storageType}-history`);
      registerBackendFactories(storageType, modelStore, dataStore, historyStore);

      const manager = new PersistenceStoreControllerManager(
        ConfigurationService.configurationService.adminStoreFactoryRegister,
        ConfigurationService.configurationService.StoreSectionFactoryRegister,
        tempRoot,
      );

      expect(
        await manager.addPersistenceStoreController(
          DEPLOYMENT_UUID,
          buildBackendConfig(storageType, tempRoot, true),
        ),
      ).toBe(ACTION_OK);

      const controller = manager.getPersistenceStoreController(DEPLOYMENT_UUID)!;
      await controller.open();
      expect(historyStore.opened).toBe(true);
      expect(historyStore.name).toBe(`${storageType}-history`);
      expect(modelStore.name).not.toBe(historyStore.name);

      const historyRead = await controller.getInstances("modelVersion", HISTORY_PARENT_UUID);
      expect(historyRead instanceof Action2Error).toBe(false);
      const historyItems = (historyRead.returnedDomainElement as any).elementValue?.instances ?? [];
      expect(historyItems).toHaveLength(1);
    },
  );

  it("5.1 — bundled modelVersion rejects history persistence with an explicit read-only error", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "232-bundled-"));
    miroirBundledStoreSectionStartup(ConfigurationService.configurationService, {
      [DEPLOYMENT_UUID]: { admin: {}, model: {}, data: {} },
    });

    const manager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      tempRoot,
    );

    expect(
      await manager.addPersistenceStoreController(DEPLOYMENT_UUID, buildBundledConfig(true)),
    ).toBe(ACTION_OK);

    const controller = manager.getPersistenceStoreController(DEPLOYMENT_UUID)!;
    await controller.open();

    const writeResult = await controller.upsertInstance("modelVersion", INSTANCE);
    expect(writeResult instanceof Action2Error).toBe(true);
    if (writeResult instanceof Action2Error) {
      expect(writeResult.errorMessage).toBe(BUNDLED_MODEL_VERSION_UNSUPPORTED_MESSAGE);
    }
  });

  it("5.1 — bundled deployments without modelVersion remain valid (read-only live model only)", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "232-bundled-unversioned-"));
    miroirBundledStoreSectionStartup(ConfigurationService.configurationService, {
      [DEPLOYMENT_UUID]: { admin: {}, model: {}, data: {} },
    });

    const manager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      tempRoot,
    );

    expect(
      await manager.addPersistenceStoreController(DEPLOYMENT_UUID, buildBundledConfig(false)),
    ).toBe(ACTION_OK);

    const controller = manager.getPersistenceStoreController(DEPLOYMENT_UUID)!;
    await controller.open();

    const historyRead = await controller.getInstances("modelVersion", HISTORY_PARENT_UUID);
    expect(historyRead instanceof Action2Error).toBe(true);
    if (historyRead instanceof Action2Error) {
      expect(historyRead.errorMessage).toMatch(/modelVersion/i);
    }
  });
});

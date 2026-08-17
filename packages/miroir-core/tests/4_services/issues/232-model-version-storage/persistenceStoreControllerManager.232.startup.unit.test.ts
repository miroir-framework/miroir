/**
 * #232 Slice 2.2 — PersistenceStoreControllerManager opens configured history storage.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import type {
  ApplicationSection,
  StoreUnitConfiguration,
} from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { Action2Error } from "../../../../src/0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../../../../src/1_core/constants.js";
import { ConfigurationService } from "../../../../src/3_controllers/ConfigurationService.js";
import type {
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
} from "../../../../src/0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import { PersistenceStoreControllerManager } from "../../../../src/4_services/PersistenceStoreControllerManager.js";

const DEPLOYMENT_UUID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ENTITY_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const INSTANCE = {
  uuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  parentUuid: ENTITY_UUID,
};

class RecordingSectionStore implements PersistenceStoreDataSectionInterface {
  public opened = false;
  public closed = false;

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
    this.closed = true;
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
          parentUuid: ENTITY_UUID,
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

function registerRecordingFactories(
  modelStore: RecordingModelStore,
  dataStore: RecordingSectionStore,
  historyStore?: RecordingSectionStore,
) {
  const configService = ConfigurationService.configurationService;
  configService.adminStoreFactoryRegister.clear();
  configService.StoreSectionFactoryRegister.clear();

  configService.registerAdminStoreFactory("filesystem", async () => makeAdminStub());
  configService.registerStoreSectionFactory(
    "filesystem",
    "data",
    async () => dataStore,
  );
  configService.registerStoreSectionFactory(
    "filesystem",
    "model",
    async () => modelStore,
  );
  if (historyStore) {
    configService.registerStoreSectionFactory(
      "filesystem",
      "modelVersion",
      async () => historyStore,
    );
  }
}

function buildFilesystemConfig(rootDir: string, withHistory: boolean): StoreUnitConfiguration {
  const config: StoreUnitConfiguration = {
    admin: {
      emulatedServerType: "filesystem",
      directory: join(rootDir, "admin"),
    },
    model: {
      emulatedServerType: "filesystem",
      directory: join(rootDir, "app_model"),
    },
    data: {
      emulatedServerType: "filesystem",
      directory: join(rootDir, "app_data"),
    },
  };
  if (withHistory) {
    config["modelVersion"] = {
      emulatedServerType: "filesystem",
      directory: join(rootDir, "app_model_version"),
    };
  }
  return config;
}

describe("232 Slice 2.2 — PersistenceStoreControllerManager startup", () => {
  let tempRoot: string;

  afterEach(async () => {
    if (tempRoot) {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  it("2.2 — versioned deployment registers distinct modelVersion storage and opens it", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "232-modelVersion-"));
    const modelStore = new RecordingModelStore("model", "model-store");
    const dataStore = new RecordingSectionStore("data", "data-store");
    const historyStore = new RecordingSectionStore("modelVersion", "history-store");
    registerRecordingFactories(modelStore, dataStore, historyStore);

    const manager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      tempRoot,
    );

    const addResult = await manager.addPersistenceStoreController(
      DEPLOYMENT_UUID,
      buildFilesystemConfig(tempRoot, true),
    );
    expect(addResult).toBe(ACTION_OK);

    const controller = manager.getPersistenceStoreController(DEPLOYMENT_UUID);
    expect(controller).toBeDefined();

    await controller!.open();
    expect(modelStore.opened).toBe(true);
    expect(dataStore.opened).toBe(true);
    expect(historyStore.opened).toBe(true);

    const historyRead = await controller!.getInstances("modelVersion", ENTITY_UUID);
    expect(historyRead instanceof Action2Error).toBe(false);
    if (historyRead instanceof Action2Error) return;
    const historyItems = (historyRead.returnedDomainElement as any).elementValue?.instances ?? [];
    expect(historyItems).toHaveLength(1);

    const modelRead = await controller!.getInstances("modelVersion", ENTITY_UUID);
    expect(modelStore.name).not.toBe(historyStore.name);
    expect(historyStore.name).toBe("history-store");
    expect(modelRead instanceof Action2Error).toBe(false);
  });

  it("2.2 — unversioned deployment without modelVersion still opens model and data", async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "232-unversioned-"));
    const modelStore = new RecordingModelStore("model", "model-store");
    const dataStore = new RecordingSectionStore("data", "data-store");
    registerRecordingFactories(modelStore, dataStore);

    const manager = new PersistenceStoreControllerManager(
      ConfigurationService.configurationService.adminStoreFactoryRegister,
      ConfigurationService.configurationService.StoreSectionFactoryRegister,
      tempRoot,
    );

    const addResult = await manager.addPersistenceStoreController(
      DEPLOYMENT_UUID,
      buildFilesystemConfig(tempRoot, false),
    );
    expect(addResult).toBe(ACTION_OK);

    const controller = manager.getPersistenceStoreController(DEPLOYMENT_UUID);
    await controller!.open();
    expect(modelStore.opened).toBe(true);
    expect(dataStore.opened).toBe(true);

    const historyRead = await controller!.getInstances("modelVersion", ENTITY_UUID);
    expect(historyRead instanceof Action2Error).toBe(true);
    if (!(historyRead instanceof Action2Error)) return;
    expect(historyRead.errorMessage).toMatch(/modelVersion/i);
  });
});

/**
 * #232 Slice 2 — PersistenceStoreController section routing.
 *
 * Verifies that the controller resolves "modelVersion" to a registered history
 * section and returns a named error when it is unconfigured, without falling
 * back to model or data.
 *
 * Uses a minimal stub implementing the data-section interface. No mocking of
 * controller internals.
 */
import { describe, expect, it } from "vitest";
import type {
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
} from "../../../../src/0_interfaces/4-services/PersistenceStoreControllerInterface.js";
import type {
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2ReturnType,
  Action2VoidReturnType,
} from "../../../../src/0_interfaces/2_domain/DomainElement.js";
import { Action2Error } from "../../../../src/0_interfaces/2_domain/DomainElement.js";
import { ACTION_OK } from "../../../../src/1_core/constants.js";
import { PersistenceStoreController } from "../../../../src/4_services/PersistenceStoreController.js";
import type { ApplicationDeploymentMap } from "../../../../src/1_core/Deployment.js";
import type { MiroirModelEnvironment } from "../../../../src/0_interfaces/1_core/Transformer.js";
import { entitySelfApplicationVersion } from "miroir-test-app_deployment-miroir";

// ---------------------------------------------------------------------------
// Minimal test stubs
// ---------------------------------------------------------------------------

function makeAdminStub(name: string): PersistenceStoreAdminSectionInterface {
  return {
    getStoreName: () => name,
    open: async () => ACTION_OK,
    close: async () => ACTION_OK,
    createStore: async () => ACTION_OK,
    deleteStore: async () => ACTION_OK,
  };
}

/** Minimal data-section stub that records upserts and returns recorded instances. */
class DataSectionStub implements PersistenceStoreDataSectionInterface {
  public upserted: Record<string, unknown[]> = {};
  public stored: Record<string, unknown[]> = {};

  constructor(public readonly name: string) {}

  getStoreName() { return this.name; }
  async open(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async close(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async bootFromPersistedState(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  getEntityUuids(): string[] { return Object.keys(this.stored); }
  getEntityIdAttribute(): string { return "uuid"; }
  async clear(): Promise<Action2VoidReturnType> { this.stored = {}; this.upserted = {}; return ACTION_OK; }

  async getInstance(): Promise<Action2EntityInstanceReturnType> {
    return { returnedDomainElement: { elementType: "void", elementValue: {} as any } } as any;
  }

  async getInstances(parentUuid: string): Promise<Action2EntityInstanceCollectionOrFailure> {
    return {
      returnedDomainElement: {
        elementType: "entityInstanceCollection",
        elementValue: {
          parentUuid,
          applicationSection: "data" as any,
          instances: (this.stored[parentUuid] ?? []) as any[],
        },
      },
    } as any;
  }

  async handleQueryTemplateActionForServerONLY(): Promise<Action2ReturnType> {
    return { returnedDomainElement: { elementType: "void", elementValue: undefined } } as any;
  }

  async handleBoxedQueryAction(): Promise<Action2ReturnType> {
    return { returnedDomainElement: { elementType: "void", elementValue: undefined } } as any;
  }

  async upsertInstance(parentUuid: string, instance: unknown): Promise<Action2VoidReturnType> {
    (this.upserted[parentUuid] ??= []).push(instance);
    return ACTION_OK;
  }

  async deleteInstance(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async deleteInstances(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async dropStorageSpaceForInstancesOfEntity(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async createStorageSpaceForInstancesOfEntity(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async renameStorageSpaceForInstancesOfEntity(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async getState() { return {}; }
}

/** Minimal model-section stub (extends data-section with entity management). */
class ModelSectionStub extends DataSectionStub implements PersistenceStoreModelSectionInterface {
  private entities: string[] = [];

  constructor(name: string) { super(name); }

  existsEntity(entityUuid: string): boolean { return this.entities.includes(entityUuid); }
  async createEntity(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async createEntities(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async renameEntityClean(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async alterEntityAttribute(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async dropEntity(): Promise<Action2VoidReturnType> { return ACTION_OK; }
  async dropEntities(): Promise<Action2VoidReturnType> { return ACTION_OK; }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ENTITY_UUID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
/** Version-history parent entity used for modelVersion upsert ensure-storage path (#232 Slice 4). */
const HISTORY_ENTITY_UUID = entitySelfApplicationVersion.uuid!;
const INSTANCE = { uuid: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", parentUuid: ENTITY_UUID };
const HISTORY_INSTANCE = {
  uuid: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  parentUuid: HISTORY_ENTITY_UUID,
};
const DEPLOY_MAP = {} as ApplicationDeploymentMap;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("232 Slice 2 — PersistenceStoreController section routing", () => {
  it("2.1 RED — getInstances routes modelVersion to its registered store", async () => {
    const admin = makeAdminStub("admin");
    const modelStore = new ModelSectionStub("model-store");
    const dataStore = new DataSectionStub("data-store");
    const historyStore = new DataSectionStub("modelVersion-store");

    historyStore.stored[ENTITY_UUID] = [INSTANCE];

    const controller = new PersistenceStoreController(admin, modelStore, dataStore, historyStore);

    const result = await controller.getInstances("modelVersion", ENTITY_UUID);
    expect(result instanceof Action2Error).toBe(false);
    if (result instanceof Action2Error) return;
    const items = (result.returnedDomainElement as any).elementValue?.instances ?? [];
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ uuid: INSTANCE.uuid });
  });

  it("2.1 RED — getInstances model still routes to model store", async () => {
    const admin = makeAdminStub("admin");
    const modelStore = new ModelSectionStub("model-store");
    const dataStore = new DataSectionStub("data-store");

    modelStore.stored[ENTITY_UUID] = [INSTANCE];

    const controller = new PersistenceStoreController(admin, modelStore, dataStore);

    const result = await controller.getInstances("model", ENTITY_UUID);
    expect(result instanceof Action2Error).toBe(false);
    if (result instanceof Action2Error) return;
    const items = (result.returnedDomainElement as any).elementValue?.instances ?? [];
    expect(items).toHaveLength(1);
  });

  it("2.1 RED — getInstances data still routes to data store", async () => {
    const admin = makeAdminStub("admin");
    const modelStore = new ModelSectionStub("model-store");
    const dataStore = new DataSectionStub("data-store");

    dataStore.stored[ENTITY_UUID] = [INSTANCE];

    const controller = new PersistenceStoreController(admin, modelStore, dataStore);

    const result = await controller.getInstances("data", ENTITY_UUID);
    expect(result instanceof Action2Error).toBe(false);
    if (result instanceof Action2Error) return;
    const items = (result.returnedDomainElement as any).elementValue?.instances ?? [];
    expect(items).toHaveLength(1);
  });

  it("2.1 RED — getInstances modelVersion unconfigured returns named error", async () => {
    const admin = makeAdminStub("admin");
    const modelStore = new ModelSectionStub("model-store");
    const dataStore = new DataSectionStub("data-store");

    // no history store passed
    const controller = new PersistenceStoreController(admin, modelStore, dataStore);

    const result = await controller.getInstances("modelVersion", ENTITY_UUID);
    expect(result instanceof Action2Error).toBe(true);
    if (!(result instanceof Action2Error)) return;
    expect(result.errorMessage).toMatch(/modelVersion/i);
  });

  it("2.1 RED — upsertInstance routes modelVersion to history store (no entity-check)", async () => {
    const admin = makeAdminStub("admin");
    const modelStore = new ModelSectionStub("model-store");
    const dataStore = new DataSectionStub("data-store");
    const historyStore = new DataSectionStub("modelVersion-store");

    const controller = new PersistenceStoreController(admin, modelStore, dataStore, historyStore);

    const result = await controller.upsertInstance("modelVersion", HISTORY_INSTANCE as any);
    expect(result instanceof Action2Error).toBe(false);
    expect(historyStore.upserted[HISTORY_ENTITY_UUID]).toHaveLength(1);
  });

  it("2.1 RED — upsertInstance modelVersion unconfigured returns named error", async () => {
    const admin = makeAdminStub("admin");
    const modelStore = new ModelSectionStub("model-store");
    const dataStore = new DataSectionStub("data-store");

    const controller = new PersistenceStoreController(admin, modelStore, dataStore);

    const result = await controller.upsertInstance("modelVersion", INSTANCE as any);
    expect(result instanceof Action2Error).toBe(true);
    if (!(result instanceof Action2Error)) return;
    expect(result.errorMessage).toMatch(/modelVersion/i);
  });
});

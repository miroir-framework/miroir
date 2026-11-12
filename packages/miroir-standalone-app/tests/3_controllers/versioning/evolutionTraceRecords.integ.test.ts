/**
 * #708: evolution trace records. An application whose `evolutionTraces` are on gets one
 * `EvolutionTraceRecord` per commit in its `modelVersion` section.
 *
 * Not reachable through MiroirTest: the tests observe the client and the emulated server
 * DomainControllers, the client's local cache during a sequence, and the `modelVersion` files.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceRecords
 * ```
 */
import { beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  defaultMiroirModelEnvironment,
  EVOLUTION_TRACE_RECORD_ENTITY_UUID,
  resetAndinitializeDeploymentCompositeAction,
  type DomainAction,
  type Entity,
  type EntityInstance,
} from "@miroir-framework/core";
import { entityAuthor, selfApplicationLibrary } from "miroir-example-library";
import { defaultAppForTestModel, entityPublisher, selfApplicationAppForTest } from "miroir-fixture-appForTest";
import { appForTestTestbedInitParams } from "miroir-react-testing/src/4-tests/uiIntegrationAppForTestPlayfieldSeed.js";

import {
  APP_FOR_TEST,
  APP_FOR_TEST_DEPLOYMENT,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectOk,
  INSTANCE_ENDPOINT,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  MODEL_ENDPOINT,
  modelEnvironment,
  openVersioningTestContext,
  storedAppForTestRows,
  storedRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const SELF_APPLICATION_ENTITY = "a659d350-dd97-4da9-91de-524fa01745dc";
const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";

const noteEntity = {
  uuid: "708a0001-0000-4000-8000-000000000001",
  parentName: "Entity",
  parentUuid: ENTITY_ENTITY,
  selfApplication: APP_FOR_TEST,
  name: "Note708",
  conceptLevel: "Model",
  description: "#708: an Entity created in a traced commit",
  mlSchema: {
    type: "object",
    definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" }, name: { type: "string" } },
  },
} as unknown as Entity;

type StoredRecord = EntityInstance & {
  application: string;
  sequenceNumber: number;
  previousTrace?: string;
  kind: string;
  actions?: any[];
  complete?: boolean;
  commitUuid?: string;
};

let context: VersioningTestContext;

beforeAll(async () => {
  context = await openVersioningTestContext();
}, 120000);

/** Whether the client's local cache holds appForTest's SelfApplication row. */
function clientCacheHoldsAppForTestRow(): boolean {
  const domainState = context.domainController.getDomainState() as Record<string, any>;
  return !!domainState?.[APP_FOR_TEST_DEPLOYMENT]?.model?.[SELF_APPLICATION_ENTITY]?.[APP_FOR_TEST];
}

/** Sets appForTest's `evolutionTraces` with a direct write from the client, which updates its local cache too. */
async function setAppForTestTraces(on: boolean): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: APP_FOR_TEST,
          applicationSection: "model",
          objects: [{ ...selfApplicationAppForTest, evolutionTraces: on } as EntityInstance],
        },
      } as any,
      applicationDeploymentMap,
      appForTestModelEnvironment(context.domainController),
    ),
    `evolutionTraces ${on}`,
  );
}

/** Sends an update of an appForTest model row inside the client's transaction. */
async function updateInTransaction(object: EntityInstance, application: string = APP_FOR_TEST): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "transactionalInstanceAction",
        endpoint: DOMAIN_ENDPOINT,
        payload: {
          application,
          instanceAction: {
            actionType: "updateInstance",
            endpoint: INSTANCE_ENDPOINT,
            payload: { application, applicationSection: "model", objects: [object] },
          },
        },
      } as any,
      applicationDeploymentMap,
      modelEnvironment(context.domainController, application),
    ),
    "transactional update",
  );
}

async function commitAppForTest() {
  return context.domainController.handleAction(
    { actionType: "commit", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST } } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(context.domainController),
  );
}

/** Makes Library versioned-internal with its traces on, with a direct write from the client. */
async function setLibraryVersionedWithTraces(): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: LIBRARY_APPLICATION,
          applicationSection: "model",
          objects: [
            { ...selfApplicationLibrary, versioningMode: "versioned-internal", evolutionTraces: true } as EntityInstance,
          ],
        },
      } as any,
      applicationDeploymentMap,
      modelEnvironment(context.domainController, LIBRARY_APPLICATION),
    ),
    "Library versioned with traces",
  );
  // the client had not loaded Library: a rollback loads it from the store, with its new row
  expectOk(
    await context.domainController.handleAction(
      { actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION } } as any,
      applicationDeploymentMap,
      modelEnvironment(context.domainController, LIBRARY_APPLICATION),
    ),
    "load Library",
  );
}

async function storedLibraryRecords(): Promise<StoredRecord[]> {
  const rows = (await storedRows(context, LIBRARY_DEPLOYMENT, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID)) as StoredRecord[];
  return rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

async function storedRecords(): Promise<StoredRecord[]> {
  const rows = (await storedAppForTestRows(context, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID)) as StoredRecord[];
  return rows.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

describe("evolutionTraceRecords (#708)", () => {
  it("one commit, one record: a committed Entity-row update of appForTest, traces on", async () => {
    await setAppForTestTraces(true);
    const updatedPublisher = { ...entityPublisher, description: "#708 one commit, one record" } as EntityInstance;
    await updateInTransaction(updatedPublisher);
    expectOk(await commitAppForTest(), "commit");

    const records = await storedRecords();
    expect(records).toHaveLength(1);
    const [record] = records;
    expect(record).toMatchObject({
      application: APP_FOR_TEST,
      kind: "commit",
      sequenceNumber: 1,
      complete: true,
    });
    expect(record.previousTrace).toBeUndefined();
    expect(typeof record.commitUuid).toBe("string");
    expect(record.actions).toEqual([
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: {
          application: APP_FOR_TEST,
          applicationSection: "model",
          parentUuid: entityPublisher.parentUuid,
          objects: [updatedPublisher],
        },
      },
    ]);
  }, 60000);

  it("a second commit continues the chain: sequenceNumber 2, previousTrace the first record", async () => {
    const before = await storedRecords();
    await updateInTransaction({ ...entityPublisher, description: "#708 second commit" } as EntityInstance);
    expectOk(await commitAppForTest(), "commit");
    const records = await storedRecords();
    expect(records).toHaveLength(before.length + 1);
    const [previous, last] = records.slice(-2);
    expect(last.sequenceNumber).toBe(previous.sequenceNumber + 1);
    expect(last.previousTrace).toBe(previous.uuid);
  }, 60000);

  it("a commit with a createEntity and an instance update records both Actions, in replay order", async () => {
    const before = await storedRecords();
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "createEntity",
          endpoint: MODEL_ENDPOINT,
          payload: { application: APP_FOR_TEST, entities: [noteEntity] },
        } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "createEntity",
    );
    const publisher = { ...entityPublisher, description: "#708 with a createEntity" } as EntityInstance;
    await updateInTransaction(publisher);
    expectOk(await commitAppForTest(), "commit");
    const records = await storedRecords();
    expect(records).toHaveLength(before.length + 1);
    const actions = records[records.length - 1].actions ?? [];
    expect(actions.map((action) => action.actionType)).toEqual(["createEntity", "updateInstance"]);
    expect(actions[0].payload.entities.map((entity: Entity) => entity.uuid)).toEqual([noteEntity.uuid]);
    expect(actions[1].payload.objects).toEqual([publisher]);
  }, 60000);

  it("a commit holding changes of appForTest and of Library makes one record in each, with one commitUuid", async () => {
    await setLibraryVersionedWithTraces();
    const appForTestBefore = await storedRecords();
    const libraryBefore = await storedLibraryRecords();
    await updateInTransaction({ ...entityPublisher, description: "#708 two applications" } as EntityInstance);
    await updateInTransaction({ ...entityAuthor, description: "#708 two applications" } as EntityInstance, LIBRARY_APPLICATION);
    expectOk(await commitAppForTest(), "commit");
    const appForTestRecords = await storedRecords();
    const libraryRecords = await storedLibraryRecords();
    expect(appForTestRecords).toHaveLength(appForTestBefore.length + 1);
    expect(libraryRecords).toHaveLength(libraryBefore.length + 1);
    const appForTestRecord = appForTestRecords[appForTestRecords.length - 1];
    const libraryRecord = libraryRecords[libraryRecords.length - 1];
    expect(libraryRecord.commitUuid).toBe(appForTestRecord.commitUuid);
    expect(appForTestRecord.actions?.map((action) => action.payload.application)).toEqual([APP_FOR_TEST]);
    expect(libraryRecord.actions?.map((action) => action.payload.application)).toEqual([LIBRARY_APPLICATION]);
  }, 60000);

  it("a commit whose second Action fails records the first one, with complete: false", async () => {
    // noteEntity is in the client's local cache; dropping it on the server only makes the client's
    // rename of it fail in the store, after the update before it reached the store
    expectOk(
      await context.serverDomainController.handleAction(
        {
          actionType: "dropEntity",
          endpoint: MODEL_ENDPOINT,
          payload: { application: APP_FOR_TEST, transactional: false, entityUuid: noteEntity.uuid },
        } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.serverDomainController),
      ),
      "server dropEntity",
    );
    const publisher = { ...entityPublisher, description: "#708 partial commit" } as EntityInstance;
    await updateInTransaction(publisher);
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "renameEntity",
          endpoint: MODEL_ENDPOINT,
          payload: { application: APP_FOR_TEST, entityUuid: noteEntity.uuid, entityName: "Note708", targetValue: "Note708Renamed" },
        } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "renameEntity in the transaction",
    );
    const before = await storedRecords();
    const result = await commitAppForTest();
    expect(result instanceof Action2Error, "the commit fails at the rename").toBe(true);
    const records = await storedRecords();
    expect(records.length).toBeGreaterThan(before.length);
    const last = records[records.length - 1];
    expect(last.complete).toBe(false);
    expect(last.actions?.map((action) => action.actionType)).toEqual(["updateInstance"]);
    expect(last.actions?.[0].payload.objects).toEqual([publisher]);
    expectOk(
      await context.domainController.handleAction(
        { actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST } } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "rollback",
    );
  }, 60000);
});

describe("evolutionTraceRecords (#708), init", () => {
  /**
   * Slice 0, characterization. Deployment init runs `resetModel`, `initModel`, then commits
   * `createEntity`. The trace switch is read from the SelfApplication row in the local cache, so
   * what init records depends on whether that row is there when each step runs.
   */
  it("init: where appForTest's SelfApplication row is in the client's local cache", async () => {
    const sequence = resetAndinitializeDeploymentCompositeAction(
      APP_FOR_TEST,
      APP_FOR_TEST_DEPLOYMENT,
      appForTestTestbedInitParams,
      [],
      defaultAppForTestModel,
    );
    const rowBeforeStep: Record<string, boolean> = {};
    for (const step of sequence.payload.actionSequence as DomainAction[]) {
      const label = (step as { actionLabel?: string }).actionLabel ?? step.actionType;
      rowBeforeStep[label] = clientCacheHoldsAppForTestRow();
      const result = await context.domainController.handleAction(
        step as any,
        applicationDeploymentMap,
        defaultMiroirModelEnvironment,
      );
      expectOk(result, label);
    }
    expect(rowBeforeStep).toMatchInlineSnapshot(`
      {
        "resetAndinitializeDeploymentCompositeAction_InitModel": true,
        "resetAndinitializeDeploymentCompositeAction_Rollback": true,
        "resetAndinitializeDeploymentCompositeAction_commitEntities": true,
        "resetAndinitializeDeploymentCompositeAction_commitInitModel": true,
        "resetAndinitializeDeploymentCompositeAction_createEntities": true,
        "resetAndinitializeDeploymentCompositeAction_createMetaModelInstances_model": true,
        "resetAndinitializeDeploymentCompositeAction_createMetaModelInstances_modelVersion": true,
        "resetAndinitializeDeploymentCompositeAction_resetModel": true,
      }
    `);
  }, 120000);
});

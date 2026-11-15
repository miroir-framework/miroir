/**
 * #708 part B: the states of an application's model. The local cache's model of an application has every
 * `MetaModel` collection (analysis D7-a), read from the section where its Entity's rows live.
 *
 * Not reachable through MiroirTest: the tests read the client's cached model, and later the stored rows
 * of each section, outside any action.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- modelStates
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  getApplicationSection,
  metaModelCollections,
  metaModelEntityList,
  type DomainController,
  type Entity,
  type EntityInstance,
  type EvolutionTraceRecordRow,
  type MetaModel,
} from "@miroir-framework/core";
import {
  diffModelStates,
  frozenModelState,
  liveModelState,
  replayEvolutionTraceRecords,
  type ModelState,
} from "@miroir-framework/versioning";
import { entityPublisher } from "miroir-fixture-appForTest";

import {
  APP_FOR_TEST,
  APP_FOR_TEST_DEPLOYMENT,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectOk,
  freezeAppForTest,
  INSTANCE_ENDPOINT,
  MIROIR_APPLICATION,
  MODEL_ENDPOINT,
  modelEnvironment,
  openVersioningTestContext,
  storedRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const MIROIR_MASTER_BRANCH = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";
const MIROIR_TEST_CONFIGURATION = "431e0903-80ff-45be-aec7-12fe272dcef0";
const DOMAIN_ENDPOINT = "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5";
const ENDPOINT_ENTITY = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";

const liveEntity = {
  uuid: "708b0001-0000-4000-8000-000000000001",
  parentName: "Entity",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  selfApplication: APP_FOR_TEST,
  name: "Live708",
  conceptLevel: "Model",
  description: "#708 part B: an Entity added to appForTest by a commit",
  mlSchema: {
    type: "object",
    definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" }, name: { type: "string" } },
  },
} as unknown as Entity;

const replayEntity = {
  ...liveEntity,
  uuid: "708b0006-0000-4000-8000-000000000001",
  name: "Replay708",
  description: "#708 B6: an Entity created in a commit replayed on a frozen state",
} as unknown as Entity;

/** appForTest's model has no Report store: the Endpoint row stands for a model element other than an Entity. */
const replayEndpoint = {
  uuid: "708b0006-0000-4000-8000-000000000002",
  parentName: "Endpoint",
  parentUuid: ENDPOINT_ENTITY,
  application: APP_FOR_TEST,
  name: "replay708Endpoint",
  version: "1",
  description: "#708 B6: an Endpoint created in a commit replayed on a frozen state",
  definition: { actions: [] },
} as unknown as EntityInstance;

let context: VersioningTestContext;

function modelAction(action: Record<string, unknown>) {
  return context.domainController.handleAction(
    { endpoint: MODEL_ENDPOINT, ...action } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(context.domainController),
  );
}

function host(): DomainController {
  return context.domainController as DomainController;
}

async function liveAppForTest(): Promise<ModelState> {
  const state = await liveModelState(host(), APP_FOR_TEST, applicationDeploymentMap);
  expect(state instanceof Action2Error, JSON.stringify(state)).toBe(false);
  return state as ModelState;
}

const SNAPSHOTTED = [
  "entities", "storedQueries", "reports", "menus", "endpoints", "runners", "themes",
  "transformerDefinitions", "mlSchemas", "tests", "blobs", "testConfigurations",
] as const;
const META_MODEL_ENTITIES = new Set(metaModelEntityList.map(({ entity }) => entity.uuid));

/**
 * The snapshotted collections of a model state, rows sorted by uuid, without what a freeze does not keep:
 * `parentDefinitionVersionUuid`, `conceptLevel` but on Entities, and the meta-model Entities an application's
 * model holds (they are not the application's own).
 */
function snapshotted(state: ModelState): Record<string, unknown[]> {
  return Object.fromEntries(
    SNAPSHOTTED.map((collection) => [
      collection,
      (state[collection] as Record<string, unknown>[])
        .filter((row) => collection !== "entities" || !META_MODEL_ENTITIES.has(row.uuid as string))
        .map(({ parentDefinitionVersionUuid: _p, conceptLevel, ...row }) =>
          collection === "entities" ? { ...row, conceptLevel } : row,
        )
        .sort((a, b) => String(a.uuid).localeCompare(String(b.uuid))),
    ]),
  );
}

/** Per collection, the uuids of its rows, sorted. */
function rowUuids(collections: Record<string, readonly { uuid?: string }[]>): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(collections).map(([collection, rows]) => [collection, rows.map((row) => row.uuid ?? "").sort()]),
  );
}

beforeAll(async () => {
  context = await openVersioningTestContext();
  expectOk(
    await context.domainController.handleAction(
      { actionType: "rollback", endpoint: MODEL_ENDPOINT, payload: { application: MIROIR_APPLICATION } } as any,
      applicationDeploymentMap,
      modelEnvironment(context.domainController, MIROIR_APPLICATION),
    ),
    "load Miroir in the local cache",
  );
}, 120000);

afterAll(async () => {
  for (const entity of [liveEntity, replayEntity]) {
    await modelAction({ actionType: "dropEntity", payload: { application: APP_FOR_TEST, transactional: false, entityUuid: entity.uuid } });
  }
  await instanceAction("deleteInstance", replayEndpoint);
}, 60000);

/** A direct write of an appForTest model row, outside a transaction. */
function instanceAction(actionType: string, object: EntityInstance) {
  return context.domainController.handleAction(
    {
      actionType,
      endpoint: INSTANCE_ENDPOINT,
      payload: { application: APP_FOR_TEST, applicationSection: "model", objects: [object] },
    } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(context.domainController),
  );
}

/** Sets appForTest's `evolutionTraces` on its stored SelfApplication row. */
async function setAppForTestTraces(on: boolean): Promise<void> {
  const selfApplication = (await liveAppForTest()).applications.find((row) => row.uuid === APP_FOR_TEST)!;
  expectOk(await instanceAction("updateInstance", { ...selfApplication, evolutionTraces: on } as EntityInstance), `evolutionTraces ${on}`);
}

describe("model states (#708 B)", () => {
  // Blob rows are not loaded with the others (`cacheAllInstancesOnRefresh: false`): the cached model holds
  // only those read since; the live model state reads them from the store.
  it("B1: the cached model of Miroir has its branch and its test configuration", () => {
    const model = context.domainController.currentModel(MIROIR_APPLICATION, applicationDeploymentMap);
    expect({
      applicationModelBranches: model.applicationModelBranches.map((branch) => branch.uuid),
      testConfigurations: model.testConfigurations.map((testConfiguration) => testConfiguration.uuid),
    }).toEqual({ applicationModelBranches: [MIROIR_MASTER_BRANCH], testConfigurations: [MIROIR_TEST_CONFIGURATION] });
  });

  it("B2: the live model state of appForTest holds a committed Entity, and every collection holds the stored rows", async () => {
    expectOk(await modelAction({ actionType: "createEntity", payload: { application: APP_FOR_TEST, entities: [liveEntity] } }), "createEntity");
    expectOk(await modelAction({ actionType: "commit", payload: { application: APP_FOR_TEST } }), "commit");

    const state = await liveAppForTest();

    const stored = Object.fromEntries(
      await Promise.all(
        metaModelCollections.map(async ({ entity, collection }) => [
          collection,
          await storedRows(context, APP_FOR_TEST_DEPLOYMENT, getApplicationSection(APP_FOR_TEST, entity.uuid) as "model", entity.uuid),
        ]),
      ),
    );
    const collections = Object.fromEntries(metaModelCollections.map(({ collection }) => [collection, (state as MetaModel)[collection]]));
    expect((state as MetaModel).entities.map((entity) => entity.uuid)).toContain(liveEntity.uuid);
    expect(rowUuids(collections)).toEqual(rowUuids(stored));
  }, 60000);

  it("B3: the model at a frozen version equals the model that was frozen", async () => {
    const before = await liveAppForTest();
    const versionName = `B3-${Date.now()}`;
    expectOk(await freezeAppForTest(context.domainController, versionName), "freeze");
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "updateInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: {
            application: APP_FOR_TEST,
            applicationSection: "model",
            objects: [{ ...entityPublisher, description: "#708 B3: changed after the freeze" }],
          },
        } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "change after the freeze",
    );
    const version = (await liveAppForTest()).applicationVersions.find((row) => row.name === versionName);
    expect(version, "the frozen Application Version").toBeDefined();

    const frozen = await frozenModelState(host(), APP_FOR_TEST, applicationDeploymentMap, version!.uuid);

    expect(frozen instanceof Action2Error, JSON.stringify(frozen)).toBe(false);
    expect(snapshotted(frozen as ModelState)).toEqual(snapshotted(before));
  }, 60000);

  it("B5: the diff of a frozen state against the live state names the Entity attribute added since", async () => {
    const versionName = `B5-${Date.now()}`;
    expectOk(await freezeAppForTest(context.domainController, versionName), "freeze");
    const stored = (await liveAppForTest()).entities.find((entity) => entity.uuid === liveEntity.uuid)!;
    const withEdition = {
      ...stored,
      mlSchema: { ...stored.mlSchema, definition: { ...stored.mlSchema.definition, edition708: { type: "string", optional: true } } },
    };
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "updateInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: { application: APP_FOR_TEST, applicationSection: "model", objects: [withEdition] },
        } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "add an attribute",
    );
    const live = await liveAppForTest();
    const version = live.applicationVersions.find((row) => row.name === versionName)!;

    const frozen = await frozenModelState(host(), APP_FOR_TEST, applicationDeploymentMap, version.uuid);

    expect(diffModelStates(frozen as ModelState, live).entityAttributes).toEqual([
      { entityUuid: liveEntity.uuid, name: "Live708", added: ["edition708"], removed: [], changed: [] },
    ]);
  }, 60000);

  it("B6: the frozen state replayed with the commit records since its marker gives the live state", async () => {
    await setAppForTestTraces(true);
    try {
      const versionName = `B6-${Date.now()}`;
      expectOk(await freezeAppForTest(context.domainController, versionName), "freeze");
      expectOk(await instanceAction("updateInstance", { ...entityPublisher, description: "#708 B6: a direct write" }), "Entity-row update");
      expectOk(await modelAction({ actionType: "createEntity", payload: { application: APP_FOR_TEST, entities: [replayEntity] } }), "createEntity");
      expectOk(
        await context.domainController.handleAction(
          {
            actionType: "transactionalInstanceAction",
            endpoint: DOMAIN_ENDPOINT,
            payload: {
              application: APP_FOR_TEST,
              instanceAction: {
                actionType: "createInstance",
                endpoint: INSTANCE_ENDPOINT,
                payload: { application: APP_FOR_TEST, applicationSection: "model", objects: [replayEndpoint] },
              },
            },
          } as any,
          applicationDeploymentMap,
          appForTestModelEnvironment(context.domainController),
        ),
        "Endpoint creation in the transaction",
      );
      expectOk(await modelAction({ actionType: "commit", payload: { application: APP_FOR_TEST } }), "commit");
      expectOk(await instanceAction("updateInstance", { ...replayEndpoint, description: "#708 B6: an Endpoint update" } as EntityInstance), "Endpoint update");

      const live = await liveAppForTest();
      const version = live.applicationVersions.find((row) => row.name === versionName)!;
      const frozen = await frozenModelState(host(), APP_FOR_TEST, applicationDeploymentMap, version.uuid);
      expect(frozen instanceof Action2Error, JSON.stringify(frozen)).toBe(false);

      const replayed = replayEvolutionTraceRecords(frozen as ModelState, live.evolutionTraceRecords as EvolutionTraceRecordRow[]);

      expect(replayed instanceof Action2Error, JSON.stringify(replayed)).toBe(false);
      expect(snapshotted(replayed as ModelState)).toEqual(snapshotted(live));
    } finally {
      await setAppForTestTraces(false);
    }
  }, 60000);
});

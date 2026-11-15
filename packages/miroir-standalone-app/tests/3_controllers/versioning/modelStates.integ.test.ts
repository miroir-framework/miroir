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
  getApplicationSection,
  metaModelCollections,
  type DomainController,
  type Entity,
  type MetaModel,
} from "@miroir-framework/core";
import { liveModelState } from "@miroir-framework/versioning";

import {
  APP_FOR_TEST,
  APP_FOR_TEST_DEPLOYMENT,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectOk,
  MIROIR_APPLICATION,
  MODEL_ENDPOINT,
  modelEnvironment,
  openVersioningTestContext,
  storedRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const MIROIR_MASTER_BRANCH = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";
const MIROIR_TEST_CONFIGURATION = "431e0903-80ff-45be-aec7-12fe272dcef0";

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

let context: VersioningTestContext;

function modelAction(action: Record<string, unknown>) {
  return context.domainController.handleAction(
    { endpoint: MODEL_ENDPOINT, ...action } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(context.domainController),
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
  await modelAction({ actionType: "dropEntity", payload: { application: APP_FOR_TEST, transactional: false, entityUuid: liveEntity.uuid } });
}, 60000);

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

    const state = await liveModelState(context.domainController as DomainController, APP_FOR_TEST, applicationDeploymentMap);

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
});

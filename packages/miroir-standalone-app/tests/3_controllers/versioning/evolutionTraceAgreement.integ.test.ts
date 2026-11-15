/**
 * #708 part C: the agreement check at freeze (`versioned-internal`). With appForTest's traces on, its last
 * version replayed with the commit records since must give its stored model: a freeze after recorded
 * changes goes on, a freeze after a change made outside Miroir is refused and names it.
 *
 * Not reachable through MiroirTest: the test edits the store behind the DomainController's back, as a file
 * edited outside Miroir would.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- evolutionTraceAgreement
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Action2Error, type EntityInstance, type EvolutionTraceRecordRow } from "@miroir-framework/core";
import { EVOLUTION_TRACES_DISAGREE, liveModelState, type ModelState } from "@miroir-framework/versioning";
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
  storedVersionNames,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

let context: VersioningTestContext;

async function liveAppForTest(): Promise<ModelState> {
  const state = await liveModelState(context.domainController as any, APP_FOR_TEST, applicationDeploymentMap);
  expect(state instanceof Action2Error, JSON.stringify(state)).toBe(false);
  return state as ModelState;
}

/** A direct write of an appForTest model row, through the DomainController: recorded when traces are on. */
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

/** A write of an appForTest model row straight to the server's store: no record, as an edit outside Miroir. */
async function writeOutsideMiroir(object: EntityInstance): Promise<void> {
  const written = await context.serverStores.getPersistenceStoreController(APP_FOR_TEST_DEPLOYMENT)!.upsertInstance("model", object);
  expect(written instanceof Action2Error, JSON.stringify(written)).toBe(false);
}

async function setAppForTestTraces(on: boolean): Promise<void> {
  const selfApplication = (await liveAppForTest()).applications.find((row) => row.uuid === APP_FOR_TEST)!;
  expectOk(await instanceAction("updateInstance", { ...selfApplication, evolutionTraces: on } as EntityInstance), `evolutionTraces ${on}`);
}

/** `rebaselineEvolutionTraces` of appForTest, sent by the client. */
function rebaseline(payload: { versionName?: string }) {
  return context.domainController.handleAction(
    { actionType: "rebaselineEvolutionTraces", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST, ...payload } } as any,
    applicationDeploymentMap,
    appForTestModelEnvironment(context.domainController),
  );
}

async function storedPublisher(): Promise<EntityInstance> {
  return (await liveAppForTest()).entities.find((entity) => entity.uuid === entityPublisher.uuid) as EntityInstance;
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
  await setAppForTestTraces(true);
}, 120000);

afterAll(async () => {
  await setAppForTestTraces(false);
  await writeOutsideMiroir(entityPublisher as EntityInstance);
}, 60000);

describe("evolution trace agreement at freeze (#708 C)", () => {
  it("C1: a freeze goes on after recorded changes", async () => {
    // the first freeze since traces went on: the chain has nothing to check yet
    expectOk(await freezeAppForTest(context.domainController, `C1-start-${Date.now()}`), "first freeze");
    const publisher = await storedPublisher();
    expectOk(await instanceAction("updateInstance", { ...publisher, description: "#708 C1: a recorded change" }), "recorded change");

    const versionName = `C1-recorded-${Date.now()}`;
    expectOk(await freezeAppForTest(context.domainController, versionName), "freeze after a recorded change");

    expect(await storedVersionNames(context)).toContain(versionName);
  }, 60000);

  it("C1: a freeze is refused after a change made outside Miroir, and names it", async () => {
    const publisher = await storedPublisher();
    await writeOutsideMiroir({ ...publisher, description: "#708 C1: edited outside Miroir" } as EntityInstance);
    const versionName = `C1-refused-${Date.now()}`;

    const refused = await freezeAppForTest(context.domainController, versionName);

    expect(refused instanceof Action2Error, JSON.stringify(refused)).toBe(true);
    const { reason, differences } = (refused as Action2Error).errorContext ?? {};
    expect({
      reason,
      entities: differences?.collections?.entities,
      message: (refused as Action2Error).errorMessage?.includes("entities: changed Publisher (description)"),
      versions: (await storedVersionNames(context)).includes(versionName),
    }).toEqual({
      reason: EVOLUTION_TRACES_DISAGREE,
      entities: { added: [], removed: [], changed: [{ uuid: entityPublisher.uuid, name: "Publisher", attributes: ["description"] }] },
      message: true,
      versions: false,
    });
  }, 60000);

  it("C2: once traces were turned off and on, a freeze goes on, then checks again from its version", async () => {
    await setAppForTestTraces(false);
    const publisher = await storedPublisher();
    expectOk(await instanceAction("updateInstance", { ...publisher, description: "#708 C2: changed while traces were off" }), "unrecorded change");
    await setAppForTestTraces(true);
    expectOk(await freezeAppForTest(context.domainController, `C2-restart-${Date.now()}`), "freeze after traces off and on");

    await writeOutsideMiroir({ ...publisher, description: "#708 C2: edited outside Miroir" } as EntityInstance);
    const refused = await freezeAppForTest(context.domainController, `C2-refused-${Date.now()}`);

    expect((refused as Action2Error).errorContext?.reason, JSON.stringify(refused)).toBe(EVOLUTION_TRACES_DISAGREE);
  }, 60000);

  it("C3: a re-baseline freezes the model as it is, and the next freeze checks from it", async () => {
    // the model still holds the edit made outside Miroir by C2
    const noName = await rebaseline({});
    const versionName = `C3-rebaseline-${Date.now()}`;

    expectOk(await rebaseline({ versionName }), "re-baseline");
    const records = (await liveAppForTest()).evolutionTraceRecords as EvolutionTraceRecordRow[];
    const last = [...records].sort((a, b) => b.sequenceNumber - a.sequenceNumber)[0];
    const version = (await liveAppForTest()).applicationVersions.find((row) => row.name === versionName);
    const publisher = await storedPublisher();
    expectOk(await instanceAction("updateInstance", { ...publisher, description: "#708 C3: recorded after the re-baseline" }), "recorded change");

    expect({
      noName: (noName as Action2Error).errorType,
      last: { kind: last.kind, version: last.version },
      next: (await freezeAppForTest(context.domainController, `C3-next-${Date.now()}`)) instanceof Action2Error,
    }).toEqual({ noName: "InvalidAction", last: { kind: "rebaseline", version: version?.uuid }, next: false });
  }, 60000);
});

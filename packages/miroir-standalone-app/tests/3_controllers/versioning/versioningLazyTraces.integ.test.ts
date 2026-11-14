/**
 * #696, #708: evolution trace records are written by `@miroir-framework/versioning`, which a process loads
 * on the first record it appends. With an application's traces off, a write loads nothing. With them on,
 * a write from the client is recorded once: the client's DomainController asks for the record, and the
 * emulated server, which stores it, does not record the write it receives over REST again.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningLazyTraces
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { EVOLUTION_TRACE_RECORD_ENTITY_UUID, type EntityInstance, type InstanceAction } from "@miroir-framework/core";
import { entityPublisher, selfApplicationAppForTest } from "miroir-fixture-appForTest";

import {
  APP_FOR_TEST,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectOk,
  INSTANCE_ENDPOINT,
  MODEL_ENDPOINT,
  openVersioningTestContext,
  setCapabilities,
  storedAppForTestRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

let context: VersioningTestContext;
let loaderCalls = 0;
const recordWrites = { client: 0, server: 0 };
const stopListening: Array<() => void> = [];

function countRecordWrites(side: "client" | "server") {
  return (action: InstanceAction) => {
    const objects = (action.payload as { objects?: EntityInstance[] }).objects ?? [];
    recordWrites[side] += objects.filter((object) => object.parentUuid === EVOLUTION_TRACE_RECORD_ENTITY_UUID).length;
  };
}

function resetRecordWrites() {
  recordWrites.client = 0;
  recordWrites.server = 0;
}

async function storedRecordCount(): Promise<number> {
  return (await storedAppForTestRows(context, "modelVersion", EVOLUTION_TRACE_RECORD_ENTITY_UUID)).length;
}

async function directWrite(objects: EntityInstance[], label: string): Promise<void> {
  expectOk(
    await context.domainController.handleAction(
      {
        actionType: "updateInstance",
        endpoint: INSTANCE_ENDPOINT,
        payload: { application: APP_FOR_TEST, applicationSection: "model", objects },
      } as any,
      applicationDeploymentMap,
      appForTestModelEnvironment(context.domainController),
    ),
    label,
  );
}

beforeAll(async () => {
  context = await openVersioningTestContext({
    versioningLoader: () => {
      loaderCalls += 1;
      return import("@miroir-framework/versioning");
    },
  });
  stopListening.push(context.domainController.addInstanceActionListener(countRecordWrites("client")));
  stopListening.push(context.serverDomainController.addInstanceActionListener(countRecordWrites("server")));
}, 120000);

afterAll(() => {
  stopListening.forEach((stop) => stop());
});

describe("versioningLazyTraces", () => {
  it("with traces off, a direct write and a commit load nothing and write no record", async () => {
    setCapabilities(context, {});
    resetRecordWrites();
    const before = await storedRecordCount();
    await directWrite([{ ...entityPublisher, description: "#708 traces off" } as EntityInstance], "direct write");
    expectOk(
      await context.domainController.handleAction(
        { actionType: "commit", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST } } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "commit",
    );
    expect(recordWrites).toEqual({ client: 0, server: 0 });
    expect(await storedRecordCount()).toBe(before);
    expect(loaderCalls).toBe(0);
  }, 60000);

  it("with traces on, the first record loads the package once, and each write is recorded once, by the server", async () => {
    setCapabilities(context, {});
    await directWrite([{ ...selfApplicationAppForTest, evolutionTraces: true } as EntityInstance], "traces on");
    resetRecordWrites();
    const before = await storedRecordCount();
    await directWrite([{ ...entityPublisher, description: "#708 traces on" } as EntityInstance], "first traced write");
    expect(loaderCalls).toBe(1);
    expect(recordWrites).toEqual({ client: 0, server: 1 });
    expect(await storedRecordCount()).toBe(before + 1);

    await directWrite([{ ...entityPublisher, description: "#708 traces on again" } as EntityInstance], "second traced write");
    expect(loaderCalls).toBe(1);
    expect(recordWrites).toEqual({ client: 0, server: 2 });
    expect(await storedRecordCount()).toBe(before + 2);
  }, 60000);
});

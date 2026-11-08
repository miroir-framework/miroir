/**
 * #696 Slice 0: which DomainController writes evolution trace rows, and that a freeze works today.
 *
 * With an emulated server, the client and the server each have a DomainController, and both run
 * `handleInstanceAction`. This test records which of them writes trace rows for an update of a model
 * row and for a committed `createEntity` of Library (the fixture whose model has the trace Entities),
 * so that #696 can register the trace recorder on the persistence side only and keep the same rows.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- traceWriters.696.phase0
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Entity, EntityInstance, InstanceAction } from "@miroir-framework/core";

import {
  applicationDeploymentMap,
  expectOk,
  freezeAppForTest,
  INSTANCE_ENDPOINT,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  MODEL_ENDPOINT,
  modelEnvironment,
  openVersioningTestContext,
  storedRows,
  storedVersionNames,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const TRACE_ENTITY = "de089f57-5fa5-4c0e-a43e-20f1a6df5a37";
const TRACE_EVENT_ENTITY = "f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c";
const LIBRARY_ENDPOINT = "9884c1a4-5122-488a-85db-a99fbc02e678";
const ENDPOINT_ENTITY = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";

const noteEntity = {
  uuid: "696a0001-0000-4000-8000-000000000001",
  parentName: "Entity",
  parentUuid: ENTITY_ENTITY,
  selfApplication: LIBRARY_APPLICATION,
  name: "Note696",
  conceptLevel: "Model",
  description: "#696: an Entity whose creation is traced",
  mlSchema: {
    type: "object",
    definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" }, name: { type: "string" } },
  },
} as unknown as Entity;

let context: VersioningTestContext;
const traceWrites = { client: 0, server: 0 };
const stopListening: Array<() => void> = [];
const previousTraceSetting = process.env.MIROIR_EVOLUTION_TRACE;

function countTraceWrites(side: "client" | "server") {
  return (action: InstanceAction) => {
    const objects = (action.payload as { objects?: EntityInstance[] }).objects ?? [];
    traceWrites[side] += objects.filter(
      (object) => object.parentUuid === TRACE_ENTITY || object.parentUuid === TRACE_EVENT_ENTITY,
    ).length;
  };
}

async function storedTraceEventCount(): Promise<number> {
  return (await storedRows(context, LIBRARY_DEPLOYMENT, "model", TRACE_EVENT_ENTITY)).length;
}

beforeAll(async () => {
  context = await openVersioningTestContext();
  stopListening.push(context.domainController.addInstanceActionListener(countTraceWrites("client")));
  stopListening.push(context.serverDomainController.addInstanceActionListener(countTraceWrites("server")));
}, 120000);

afterAll(() => {
  stopListening.forEach((stop) => stop());
  if (previousTraceSetting === undefined) {
    delete process.env.MIROIR_EVOLUTION_TRACE;
  } else {
    process.env.MIROIR_EVOLUTION_TRACE = previousTraceSetting;
  }
});

describe("traceWriters.696.phase0", () => {
  it("a freeze of appForTest sent by the client writes its version", async () => {
    expectOk(await freezeAppForTest(context.domainController, "696-phase0"), "freeze");
    expect(await storedVersionNames(context)).toContain("696-phase0");
  }, 60000);

  it("with traces off, an update of a model row writes no trace row", async () => {
    delete process.env.MIROIR_EVOLUTION_TRACE;
    traceWrites.client = 0;
    traceWrites.server = 0;
    const before = await storedTraceEventCount();
    const [endpoint] = (await storedRows(context, LIBRARY_DEPLOYMENT, "model", ENDPOINT_ENTITY)).filter(
      (row) => row.uuid === LIBRARY_ENDPOINT,
    );
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "updateInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: {
            application: LIBRARY_APPLICATION,
            applicationSection: "model",
            objects: [{ ...endpoint, description: "#696 phase 0, traces off" }],
          },
        } as any,
        applicationDeploymentMap,
        modelEnvironment(context.domainController, LIBRARY_APPLICATION),
      ),
      "updateInstance",
    );
    expect(traceWrites).toEqual({ client: 0, server: 0 });
    expect(await storedTraceEventCount()).toBe(before);
  }, 60000);

  it("with traces on, an update of a model row is traced on both the client and the server", async () => {
    process.env.MIROIR_EVOLUTION_TRACE = "1";
    traceWrites.client = 0;
    traceWrites.server = 0;
    const before = await storedTraceEventCount();
    const [endpoint] = (await storedRows(context, LIBRARY_DEPLOYMENT, "model", ENDPOINT_ENTITY)).filter(
      (row) => row.uuid === LIBRARY_ENDPOINT,
    );
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "updateInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: {
            application: LIBRARY_APPLICATION,
            applicationSection: "model",
            objects: [{ ...endpoint, description: "#696 phase 0, traces on" }],
          },
        } as any,
        applicationDeploymentMap,
        modelEnvironment(context.domainController, LIBRARY_APPLICATION),
      ),
      "updateInstance",
    );
    const stored = (await storedTraceEventCount()) - before;
    console.log("#696 phase 0, instance write: trace writes", JSON.stringify(traceWrites), "stored events", stored);
    // Characterization (measured: client 3, server 6, 4 stored events): the client DomainController
    // records a trace, and its writes reach the server DomainController through REST, which records
    // its own trace as well. Slice 4 moves recording to the persistence side only.
    expect(traceWrites.client).toBeGreaterThan(0);
    expect(traceWrites.server).toBeGreaterThan(traceWrites.client);
    expect(stored).toBeGreaterThan(0);
  }, 60000);

  it("with traces on, records which side writes the trace rows of a committed createEntity", async () => {
    process.env.MIROIR_EVOLUTION_TRACE = "1";
    traceWrites.client = 0;
    traceWrites.server = 0;
    const before = await storedTraceEventCount();
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "createEntity",
          endpoint: MODEL_ENDPOINT,
          payload: { application: LIBRARY_APPLICATION, entities: [noteEntity] },
        } as any,
        applicationDeploymentMap,
        modelEnvironment(context.domainController, LIBRARY_APPLICATION),
      ),
      "createEntity",
    );
    expectOk(
      await context.domainController.handleAction(
        { actionType: "commit", endpoint: MODEL_ENDPOINT, payload: { application: LIBRARY_APPLICATION } } as any,
        applicationDeploymentMap,
        modelEnvironment(context.domainController, LIBRARY_APPLICATION),
      ),
      "commit",
    );
    const stored = (await storedTraceEventCount()) - before;
    console.log("#696 phase 0, commit: trace writes", JSON.stringify(traceWrites), "stored events", stored);
    expect(traceWrites.client + traceWrites.server).toBeGreaterThan(0);
    expect(stored).toBeGreaterThan(0);
  }, 60000);
});

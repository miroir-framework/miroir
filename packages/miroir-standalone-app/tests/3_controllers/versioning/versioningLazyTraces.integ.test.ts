/**
 * #696: evolution traces are recorded by `@miroir-framework/versioning`, which a process loads on
 * its first traced write. Core checks first that traces are on (`MIROIR_EVOLUTION_TRACE`), that the action
 * is traceable and that the process has the `versioning` capability; a write failing one of these loads
 * nothing. The trace rows written match the counts measured before the move (Slice 0.2).
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningLazyTraces
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Entity, EntityInstance, InstanceAction } from "@miroir-framework/core";

import {
  applicationDeploymentMap,
  expectOk,
  INSTANCE_ENDPOINT,
  LIBRARY_APPLICATION,
  LIBRARY_DEPLOYMENT,
  MODEL_ENDPOINT,
  modelEnvironment,
  openVersioningTestContext,
  setCapabilities,
  storedRows,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const TRACE_ENTITY = "de089f57-5fa5-4c0e-a43e-20f1a6df5a37";
const TRACE_EVENT_ENTITY = "f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c";
const LIBRARY_ENDPOINT = "9884c1a4-5122-488a-85db-a99fbc02e678";
const ENDPOINT_ENTITY = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";

const noteEntity = {
  uuid: "696a0004-0000-4000-8000-000000000004",
  parentName: "Entity",
  parentUuid: ENTITY_ENTITY,
  selfApplication: LIBRARY_APPLICATION,
  name: "Note696Phase4",
  conceptLevel: "Model",
  description: "#696: an Entity created with traces off",
  mlSchema: {
    type: "object",
    definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" }, name: { type: "string" } },
  },
} as unknown as Entity;

let context: VersioningTestContext;
let loaderCalls = 0;
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

function resetTraceWrites() {
  traceWrites.client = 0;
  traceWrites.server = 0;
}

async function storedTraceEventCount(): Promise<number> {
  return (await storedRows(context, LIBRARY_DEPLOYMENT, "model", TRACE_EVENT_ENTITY)).length;
}

async function updateLibraryEndpoint(description: string): Promise<void> {
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
          objects: [{ ...endpoint, description }],
        },
      } as any,
      applicationDeploymentMap,
      modelEnvironment(context.domainController, LIBRARY_APPLICATION),
    ),
    "updateInstance",
  );
}

beforeAll(async () => {
  context = await openVersioningTestContext({
    versioningLoader: () => {
      loaderCalls += 1;
      return import("@miroir-framework/versioning");
    },
  });
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

describe("versioningLazyTraces", () => {
  it("with traces off, an instance write and a committed createEntity load nothing and write no trace row", async () => {
    delete process.env.MIROIR_EVOLUTION_TRACE;
    setCapabilities(context, {});
    resetTraceWrites();
    const before = await storedTraceEventCount();
    await updateLibraryEndpoint("#696 phase 4, traces off");
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
    expect(traceWrites).toEqual({ client: 0, server: 0 });
    expect(await storedTraceEventCount()).toBe(before);
    expect(loaderCalls).toBe(0);
  }, 60000);

  it("with traces on and the capability off, a write loads nothing and writes no trace row", async () => {
    process.env.MIROIR_EVOLUTION_TRACE = "1";
    setCapabilities(context, { client: { versioning: false }, server: { versioning: false } });
    resetTraceWrites();
    const before = await storedTraceEventCount();
    await updateLibraryEndpoint("#696 phase 4, capability off");
    expect(traceWrites).toEqual({ client: 0, server: 0 });
    expect(await storedTraceEventCount()).toBe(before);
    expect(loaderCalls).toBe(0);
  }, 60000);

  it("with traces on, the first write loads the package once and writes the trace rows of Slice 0.2", async () => {
    process.env.MIROIR_EVOLUTION_TRACE = "1";
    setCapabilities(context, {});
    resetTraceWrites();
    const before = await storedTraceEventCount();
    await updateLibraryEndpoint("#696 phase 4, traces on");
    expect(loaderCalls).toBe(1);
    // Slice 0.2: the client records 3 rows, which reach the server through REST, where it records its own 3.
    expect(traceWrites).toEqual({ client: 3, server: 6 });
    expect((await storedTraceEventCount()) - before).toBeGreaterThan(0);

    await updateLibraryEndpoint("#696 phase 4, traces on again");
    expect(loaderCalls).toBe(1);
  }, 60000);
});

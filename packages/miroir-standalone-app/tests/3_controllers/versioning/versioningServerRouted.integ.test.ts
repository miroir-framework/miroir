/**
 * #696: a client that talks to a server sends the freeze to the server, which runs it.
 *
 * The client checks its own capability, refuses while it has unsaved Miroir changes of the application,
 * then forwards; the server checks its capability and runs the freeze; the client reloads the application.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningServerRouted
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  SERVER_ROUTED_MIROIR_ACTION_TYPES,
  type Entity,
  type EntityInstance,
  type InstanceAction,
} from "@miroir-framework/core";

import {
  APP_FOR_TEST,
  appForTestModelEnvironment,
  applicationDeploymentMap,
  expectFeatureUnavailable,
  expectOk,
  freezeAppForTest,
  MODEL_ENDPOINT,
  openVersioningTestContext,
  SELF_APPLICATION_VERSION_ENTITY,
  setCapabilities,
  storedVersionNames,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";

let context: VersioningTestContext;
const versionWrites = { client: 0, server: 0 };
const stopListening: Array<() => void> = [];

function countVersionWrites(side: "client" | "server") {
  return (action: InstanceAction) => {
    const objects = (action.payload as { objects?: EntityInstance[] }).objects ?? [];
    versionWrites[side] += objects.filter((object) => object.parentUuid === SELF_APPLICATION_VERSION_ENTITY).length;
  };
}

beforeAll(async () => {
  context = await openVersioningTestContext();
  stopListening.push(context.domainController.addInstanceActionListener(countVersionWrites("client")));
  stopListening.push(context.serverDomainController.addInstanceActionListener(countVersionWrites("server")));
}, 120000);

afterAll(() => {
  stopListening.forEach((stop) => stop());
});

describe("versioningServerRouted", () => {
  it("the freeze is a server-routed action", () => {
    expect(SERVER_ROUTED_MIROIR_ACTION_TYPES).toContain("freezeApplicationVersion");
  });

  it("a client with versioning on cannot freeze through a server with versioning off", async () => {
    setCapabilities(context, { client: { versioning: true }, server: { versioning: false } });
    const before = await storedVersionNames(context);
    expectFeatureUnavailable(await freezeAppForTest(context.domainController, "696-phase2-server-off"), "versioning");
    expect(await storedVersionNames(context)).toEqual(before);
  }, 60000);

  it("the server runs the freeze, and the client shows the new version", async () => {
    setCapabilities(context, {});
    versionWrites.client = 0;
    versionWrites.server = 0;
    expectOk(await freezeAppForTest(context.domainController, "696-phase2-routed"), "freeze");
    expect(await storedVersionNames(context)).toContain("696-phase2-routed");
    expect(versionWrites.client, "the client's DomainController wrote no version row").toBe(0);
    expect(versionWrites.server).toBeGreaterThan(0);
    // the client's local cache was reloaded from the server
    const versionRows = (context.domainController.getDomainState() as any)[applicationDeploymentMap[APP_FOR_TEST]]
      ?.modelVersion?.[SELF_APPLICATION_VERSION_ENTITY] ?? {};
    const versionNames = Object.values(versionRows).map((row: any) => row.name);
    expect(versionNames).toContain("696-phase2-routed");
  }, 60000);

  it("a freeze is refused while the client has unsaved Miroir changes of the application", async () => {
    setCapabilities(context, {});
    const pendingEntity = {
      uuid: "696a0002-0000-4000-8000-000000000002",
      parentName: "Entity",
      parentUuid: ENTITY_ENTITY,
      selfApplication: APP_FOR_TEST,
      name: "Pending696",
      conceptLevel: "Model",
      mlSchema: { type: "object", definition: { uuid: { type: "uuid" }, parentUuid: { type: "uuid" } } },
    } as unknown as Entity;
    expectOk(
      await context.domainController.handleAction(
        {
          actionType: "createEntity",
          endpoint: MODEL_ENDPOINT,
          payload: { application: APP_FOR_TEST, entities: [pendingEntity] },
        } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "createEntity",
    );
    const before = await storedVersionNames(context);
    const result = await freezeAppForTest(context.domainController, "696-phase2-pending");
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
    expect((result as Action2Error).errorType).toBe("InvalidAction");
    expect((result as Action2Error).errorContext?.reason).toBe("openMiroirTransaction");
    expect(await storedVersionNames(context)).toEqual(before);
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

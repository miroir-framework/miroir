/**
 * #696: the freeze runs from `@miroir-framework/versioning`, which a process loads on its first
 * freeze and never before. The test registers a counted loader in place of setupMiroirTest's own.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningLazyFreeze
 * ```
 */
import { beforeAll, describe, expect, it } from "vitest";

import {
  appForTestModelEnvironment,
  applicationDeploymentMap,
  APP_FOR_TEST,
  expectFeatureUnavailable,
  expectOk,
  freezeAppForTest,
  MODEL_ENDPOINT,
  openVersioningTestContext,
  setCapabilities,
  storedVersionNames,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

let context: VersioningTestContext;
let loaderCalls = 0;

beforeAll(async () => {
  context = await openVersioningTestContext({
    versioningLoader: () => {
      loaderCalls += 1;
      return import("@miroir-framework/versioning");
    },
  });
}, 120000);

describe("versioningLazyFreeze", () => {
  it("starting a session and committing a model change load nothing of the package", async () => {
    expectOk(
      await context.domainController.handleAction(
        { actionType: "commit", endpoint: MODEL_ENDPOINT, payload: { application: APP_FOR_TEST } } as any,
        applicationDeploymentMap,
        appForTestModelEnvironment(context.domainController),
      ),
      "commit",
    );
    expect(loaderCalls).toBe(0);
  }, 60000);

  it("with the capability off, a freeze is refused and loads nothing", async () => {
    setCapabilities(context, { client: { versioning: false }, server: { versioning: false } });
    expectFeatureUnavailable(await freezeAppForTest(context.domainController, "696-phase3-off"), "versioning");
    setCapabilities(context, { client: { versioning: true }, server: { versioning: false } });
    expectFeatureUnavailable(await freezeAppForTest(context.domainController, "696-phase3-server-off"), "versioning");
    expect(loaderCalls).toBe(0);
  }, 60000);

  it("the first freeze loads the package once, and a second freeze does not load it again", async () => {
    setCapabilities(context, {});
    expectOk(await freezeAppForTest(context.domainController, "696-phase3-first"), "first freeze");
    expect(loaderCalls).toBe(1);
    expectOk(await freezeAppForTest(context.domainController, "696-phase3-second"), "second freeze");
    expect(loaderCalls).toBe(1);
    expect(await storedVersionNames(context)).toEqual(expect.arrayContaining(["696-phase3-first", "696-phase3-second"]));
  }, 60000);
});

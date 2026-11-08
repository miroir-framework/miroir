/**
 * #696 Slice 1: the `versioning` process capability refuses a freeze.
 *
 * The freeze action carries `requiredCapability: "versioning"` on its Endpoint definition. With the
 * capability off, the freeze returns `FeatureUnavailable` (capability `versioning`) and writes nothing,
 * whatever the application's versioning mode (the capability is checked first, D7).
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningCapability.696.phase1
 * ```
 */
import { beforeAll, describe, expect, it } from "vitest";

import {
  applicationDeploymentMap,
  expectFeatureUnavailable,
  expectOk,
  freezeAppForTest,
  LIBRARY_APPLICATION,
  MODEL_ENDPOINT,
  modelEnvironment,
  openVersioningTestContext,
  setCapabilities,
  storedVersionNames,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

let context: VersioningTestContext;

beforeAll(async () => {
  context = await openVersioningTestContext();
}, 120000);

describe("versioningCapability.696.phase1", () => {
  it("the base snapshot of a process has versioning on", () => {
    expect(context.baseCapabilities.versioning).toBe(true);
  });

  it("with the capability off, a freeze of a versioned application is refused and writes nothing", async () => {
    setCapabilities(context, { client: { versioning: false }, server: { versioning: false } });
    const before = await storedVersionNames(context);
    expectFeatureUnavailable(await freezeAppForTest(context.domainController, "696-phase1-off"), "versioning");
    expect(await storedVersionNames(context)).toEqual(before);
  }, 60000);

  it("with the capability off, a freeze of an unversioned application names the capability, not the mode", async () => {
    setCapabilities(context, { client: { versioning: false }, server: { versioning: false } });
    const result = await context.domainController.handleAction(
      {
        actionType: "freezeApplicationVersion",
        endpoint: MODEL_ENDPOINT,
        payload: { application: LIBRARY_APPLICATION, versionName: "696-phase1-unversioned" },
      } as any,
      applicationDeploymentMap,
      modelEnvironment(context.domainController, LIBRARY_APPLICATION),
    );
    expectFeatureUnavailable(result, "versioning");
  }, 60000);

  it("with the capability on, the freeze works as before", async () => {
    setCapabilities(context, {});
    expectOk(await freezeAppForTest(context.domainController, "696-phase1-on"), "freeze");
    expect(await storedVersionNames(context)).toContain("696-phase1-on");
  }, 60000);
});

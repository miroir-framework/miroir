/**
 * #696 Slice 3: a process with the capability on but without the versioning package registered refuses a
 * freeze, and names the package. In its own file: a registration cannot be undone within a test process.
 * ```bash
 * MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- versioningNotInstalled.696.phase3
 * ```
 */
import { beforeAll, describe, expect, it } from "vitest";

import { Action2Error } from "@miroir-framework/core";

import {
  freezeAppForTest,
  openVersioningTestContext,
  setCapabilities,
  storedVersionNames,
  type VersioningTestContext,
} from "./versioningTestSetup.js";

let context: VersioningTestContext;

beforeAll(async () => {
  context = await openVersioningTestContext({ versioningLoader: false });
}, 120000);

describe("versioningNotInstalled.696.phase3", () => {
  it("a freeze names the missing package and writes nothing", async () => {
    setCapabilities(context, {});
    const before = await storedVersionNames(context);
    const result = await freezeAppForTest(context.domainController, "696-phase3-not-installed");
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(true);
    expect((result as Action2Error).errorType).toBe("FeatureUnavailable");
    expect((result as Action2Error).errorContext?.capability).toBe("versioning");
    expect((result as Action2Error).errorMessage).toContain("@miroir-framework/versioning");
    expect(await storedVersionNames(context)).toEqual(before);
  }, 60000);
});

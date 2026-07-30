/**
 * #216 Phase 7 — commit does not publish Application Version tips / Cross snapshots.
 */
import { describe, expect, it } from "vitest";

import {
  APPLICATION_VERSION_PLACEHOLDER_NAMES,
  isApplicationVersionPlaceholder,
  resolvePreviousApplicationVersion,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type { ApplicationVersion } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";

function sav(uuid: string, name: string): ApplicationVersion {
  return {
    uuid,
    parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
    parentName: "ApplicationVersion",
    name,
    selfApplication: APP_UUID,
    branch: BRANCH_UUID,
  };
}

describe("216 Phase 7 — commit / Initial hygiene", () => {
  it("locks placeholder name set used by tip resolution", () => {
    expect(APPLICATION_VERSION_PLACEHOLDER_NAMES.has("Initial")).toBe(true);
    expect(
      APPLICATION_VERSION_PLACEHOLDER_NAMES.has("TODO: No label was given to this version."),
    ).toBe(true);
    expect(isApplicationVersionPlaceholder({ name: "V1" })).toBe(false);
  });

  it("tip stays undefined when only fixture/commit placeholders exist (no freeze Cross)", () => {
    const versions = [
      sav("11111111-1111-4111-8111-111111111111", "Initial"),
      sav(
        "12121212-1212-4121-8121-121212121212",
        "TODO: No label was given to this version.",
      ),
    ];
    expect(
      resolvePreviousApplicationVersion(versions, {
        selfApplicationUuid: APP_UUID,
        branchUuid: BRANCH_UUID,
      }),
    ).toBeUndefined();
  });
});

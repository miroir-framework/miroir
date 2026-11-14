import { describe, expect, it } from "vitest";

import type {
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  loadApplicationMiroirTestCatalog,
  loadMiroirTestEntityFromFolders,
} from "../../src/5_tests/loadApplicationMiroirTestsFromFolders";
import {
  miroirTestSuiteForEnvironment,
  miroirTestUnmetRequirement,
  VERSIONING_TAG,
  VERSIONING_TESTS_NEED_VERSIONING,
} from "../../src/5_tests/miroirTestRequirements";
import { getMiroirTestAllowedTags } from "../../src/5_tests/miroirTestTags";

const suite: MiroirTestSuite = {
  miroirTestType: "miroirTestSuite",
  miroirTestLabel: "s",
  miroirTests: [],
} as unknown as MiroirTestSuite;

function instanceWithTags(tags: string[]): MiroirTestDefinition {
  return { uuid: "u", tags, definition: suite } as unknown as MiroirTestDefinition;
}

describe("MiroirTest requirements (#589)", () => {
  it("a suite without a requirement tag always runs", () => {
    expect(miroirTestUnmetRequirement(instanceWithTags(["integ"]), { versioning: false })).toBeUndefined();
    expect(miroirTestUnmetRequirement({ uuid: "u" } as MiroirTestDefinition)).toBeUndefined();
  });

  // #708: the evolution-trace tag no longer gates a suite: traces are a per-application switch
  it("action.scenario.evolutionTrace runs wherever versioning is on", () => {
    const entry = loadApplicationMiroirTestCatalog().find(
      (candidate) => candidate.suiteKey === "action.scenario.evolutionTrace",
    );

    expect(entry?.instance.tags).not.toContain("evolution-trace");
    expect(miroirTestUnmetRequirement(entry!.instance, { versioning: true })).toBeUndefined();
  });

  // #696
  it("a versioning suite is skipped, with the reason, when the versioning capability is off", () => {
    const instance = instanceWithTags([VERSIONING_TAG, "integ"]);
    expect(miroirTestUnmetRequirement(instance, { versioning: false })).toBe(VERSIONING_TESTS_NEED_VERSIONING);
    expect(VERSIONING_TESTS_NEED_VERSIONING).toContain("features.versioning");
    expect(miroirTestSuiteForEnvironment(instance, suite, { versioning: false })).toEqual({
      suite: { ...suite, skip: true },
      skipReason: VERSIONING_TESTS_NEED_VERSIONING,
    });
  });

  it("a versioning suite runs when the capability is on, or when no snapshot is given", () => {
    const instance = instanceWithTags([VERSIONING_TAG]);
    expect(miroirTestUnmetRequirement(instance, { versioning: true })).toBeUndefined();
    expect(miroirTestUnmetRequirement(instance)).toBeUndefined();
    expect(miroirTestSuiteForEnvironment(instance, suite, { versioning: true })).toEqual({ suite });
    expect(miroirTestUnmetRequirement(instanceWithTags(["integ"]), { versioning: false })).toBeUndefined();
  });

  it("the freeze suites carry the versioning tag", () => {
    const tagged = loadApplicationMiroirTestCatalog()
      .filter((candidate) => candidate.instance.tags?.includes(VERSIONING_TAG))
      .map((candidate) => candidate.suiteKey);
    expect(tagged).toContain("action.domainController.freezeApplicationVersion");
    expect(getMiroirTestAllowedTags(loadMiroirTestEntityFromFolders())).toContain(VERSIONING_TAG);
  });
});

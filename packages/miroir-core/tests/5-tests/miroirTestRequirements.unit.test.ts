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
  EVOLUTION_TRACE_TAG,
  EVOLUTION_TRACE_TESTS_NEED_TRACES,
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
  it("an evolution-trace suite is skipped, with the reason, when traces are off", () => {
    const instance = instanceWithTags(["integ", EVOLUTION_TRACE_TAG]);

    expect(miroirTestUnmetRequirement(instance, {})).toBe(EVOLUTION_TRACE_TESTS_NEED_TRACES);
    expect(miroirTestUnmetRequirement(instance, { MIROIR_EVOLUTION_TRACE: "0" })).toBe(
      EVOLUTION_TRACE_TESTS_NEED_TRACES,
    );
    expect(miroirTestSuiteForEnvironment(instance, suite, {})).toEqual({
      suite: { ...suite, skip: true },
      skipReason: EVOLUTION_TRACE_TESTS_NEED_TRACES,
    });
  });

  it("an evolution-trace suite runs when traces are on", () => {
    const instance = instanceWithTags([EVOLUTION_TRACE_TAG]);

    expect(miroirTestUnmetRequirement(instance, { MIROIR_EVOLUTION_TRACE: "1" })).toBeUndefined();
    expect(miroirTestUnmetRequirement(instance, { VITE_MIROIR_EVOLUTION_TRACE: "true" })).toBeUndefined();
    expect(miroirTestSuiteForEnvironment(instance, suite, { MIROIR_EVOLUTION_TRACE: "1" })).toEqual({ suite });
  });

  it("a suite without the tag always runs", () => {
    expect(miroirTestUnmetRequirement(instanceWithTags(["integ"]), {})).toBeUndefined();
    expect(miroirTestUnmetRequirement({ uuid: "u" } as MiroirTestDefinition, {})).toBeUndefined();
  });

  it("the MiroirTest Entity allows the evolution-trace tag", () => {
    expect(getMiroirTestAllowedTags(loadMiroirTestEntityFromFolders())).toContain(EVOLUTION_TRACE_TAG);
  });

  it("action.scenario.evolutionTrace carries the evolution-trace tag", () => {
    const entry = loadApplicationMiroirTestCatalog().find(
      (candidate) => candidate.suiteKey === "action.scenario.evolutionTrace",
    );

    expect(entry?.instance.tags).toContain(EVOLUTION_TRACE_TAG);
    expect(miroirTestUnmetRequirement(entry!.instance, {})).toBe(EVOLUTION_TRACE_TESTS_NEED_TRACES);
  });

  // #696
  it("a versioning suite is skipped, with the reason, when the versioning capability is off", () => {
    const instance = instanceWithTags([VERSIONING_TAG, "integ"]);
    expect(miroirTestUnmetRequirement(instance, {}, { versioning: false })).toBe(VERSIONING_TESTS_NEED_VERSIONING);
    expect(VERSIONING_TESTS_NEED_VERSIONING).toContain("features.versioning");
    expect(miroirTestSuiteForEnvironment(instance, suite, {}, { versioning: false })).toEqual({
      suite: { ...suite, skip: true },
      skipReason: VERSIONING_TESTS_NEED_VERSIONING,
    });
  });

  it("a versioning suite runs when the capability is on, or when no snapshot is given", () => {
    const instance = instanceWithTags([VERSIONING_TAG]);
    expect(miroirTestUnmetRequirement(instance, {}, { versioning: true })).toBeUndefined();
    expect(miroirTestUnmetRequirement(instance, {})).toBeUndefined();
    expect(miroirTestSuiteForEnvironment(instance, suite, {}, { versioning: true })).toEqual({ suite });
    expect(miroirTestUnmetRequirement(instanceWithTags(["integ"]), {}, { versioning: false })).toBeUndefined();
  });

  it("the freeze suites carry the versioning tag", () => {
    const tagged = loadApplicationMiroirTestCatalog()
      .filter((candidate) => candidate.instance.tags?.includes(VERSIONING_TAG))
      .map((candidate) => candidate.suiteKey);
    expect(tagged).toContain("action.domainController.freezeApplicationVersion");
    expect(getMiroirTestAllowedTags(loadMiroirTestEntityFromFolders())).toContain(VERSIONING_TAG);
  });
});

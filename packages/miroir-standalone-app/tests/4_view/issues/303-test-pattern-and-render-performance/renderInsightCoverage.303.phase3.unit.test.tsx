/**
 * Issue #303 Slice 3: every MlElementEditor component reports its renders (analysis T2, T3).
 *
 * The test pattern of `MlTestPattern_ComponentTestSuite` (its suite `componentProps` and display
 * leaf, read from the instance JSON) is run through `createReactComponentTestRunner` with a suite
 * context whose `stepKinds` contains `measureRendering`: the runner then builds the suite wrapper
 * with `trackRenders` (`initialShowPerformanceDisplay` on `MiroirContextReactProvider`), and every
 * editor component rendered by the pattern must appear in `renderInsightRegistry` with a timing.
 *
 * vitest, not a MiroirTest: the assertion reads a React-internal registry fed by component
 * renders, not reachable through a MiroirTest step before `measureRendering` (Slice 4).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- renderInsightCoverage.303.phase3
 * ```
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { configure, getConfig } from "@testing-library/dom";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  reactComponentTestSuiteStepKinds,
  type MiroirTestForReactComponent,
  type ReactComponentTestSuite,
  type ReactComponentTestSuiteContext,
} from "miroir-core";

import { createReactComponentTestRunner } from "../../../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";
import { renderInsightRegistry } from "../../../../src/miroir-fwk/4_view/tools/renderInsightRegistry";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

const TEST_PATTERN_INSTANCE_FILE = join(
  resolveRepoRoot(),
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/26ef2886-2cd8-4f91-b846-1525b24d5f41.json",
);

/**
 * The editor components that the test pattern renders (analysis T2, plan Slice 3 RED). The
 * pattern's `anAny` (object value) renders through `MlObjectEditor` (inside any);
 * `MlElementEditor` renders `MlAnyEditor` only for an `any` schema with
 * `tag.value.display.any.format` (the app's file-bundle fields): the pattern's `anAnyFile` since
 * #303 Slice 4, and the separate `anyFileSuite` case.
 */
const EXPECTED_PATTERN_COMPONENT_IDS = [
  "MlElementEditor",
  "MlAnyEditor",
  "MlEnumEditor",
  "MlLiteralEditor",
  "MlElementStringEditor",
  "MlUnionEditor",
  "MlArrayEditor",
  "MlTupleEditor",
  "MlObjectEditor",
  "MlRecordEditor",
];

const patternSuite: ReactComponentTestSuite = JSON.parse(readFileSync(TEST_PATTERN_INSTANCE_FILE, "utf-8"))
  .definition.miroirTests[0];
const displayLeaf: MiroirTestForReactComponent = patternSuite.miroirTests[0];

function suiteContext(stepKinds: ReactComponentTestSuiteContext["stepKinds"]): ReactComponentTestSuiteContext {
  return {
    suitePath: ["MlTestPattern_ComponentTestSuite", patternSuite.miroirTestLabel],
    component: patternSuite.component,
    componentProps: patternSuite.componentProps ?? {},
    caseLabels: [displayLeaf.miroirTestLabel],
    stepKinds,
  };
}

/** An `any` attribute with `display.any.format: "file"`, as `applicationBundle` of the Miroir deployment. */
const anyFileSuite: ReactComponentTestSuiteContext = {
  suitePath: ["renderInsightCoverage", "AnyFile"],
  component: "MlElementEditor",
  componentProps: {
    label: "Test Label",
    name: "testField",
    listKey: "ROOT.testField",
    rootLessListKey: "testField",
    rootLessListKeyArray: ["testField"],
    rawMlSchema: {
      type: "object",
      definition: {
        aFile: { type: "any", tag: { value: { display: { any: { format: "file" } } } } },
      },
    },
    initialFormState: { aFile: "" },
  },
  caseLabels: ["AnyFile: displayed"],
  stepKinds: ["measureRendering"],
};

let sandboxElement: HTMLElement;
let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;

// The component test driver does not use React `act` (#286 analysis §5.3), and the runner
// configures `@testing-library/dom` without `act` wrappers (`configureComponentTestDom`). Both are
// global to the worker: they are restored after the file, so that a later file relying on `act`
// (e.g. `RenderInsightSummary.unit.test.tsx`, matched by the same `testByFile … RenderInsight`) is
// not affected.
let previousActEnvironment: unknown;
let previousDomConfig: ReturnType<typeof getConfig>;
beforeAll(() => {
  previousActEnvironment = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  previousDomConfig = { ...getConfig() };
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
});

afterAll(() => {
  configure(previousDomConfig);
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

beforeEach(() => {
  renderInsightRegistry.resetAll();
  sandboxElement = document.createElement("div");
  document.body.appendChild(sandboxElement);
});

afterEach(() => {
  runner?.close();
  runner = undefined;
  sandboxElement.remove();
  renderInsightRegistry.resetAll();
});

async function runDisplayLeaf(stepKinds: ReactComponentTestSuiteContext["stepKinds"]) {
  runner = createReactComponentTestRunner({ sandboxElement });
  const suite = suiteContext(stepKinds);
  const result = await runner({
    testNamePath: [...suite.suitePath, displayLeaf.miroirTestLabel],
    leaf: displayLeaf,
    suite,
  });
  return result;
}

function timedComponentIds(): Set<string> {
  return new Set(
    renderInsightRegistry
      .getSnapshot()
      .filter((node) => node.totalRenderTime !== undefined)
      .map((node) => node.componentId),
  );
}

function missingTimedComponentIds(expected: string[]): string[] {
  const timed = timedComponentIds();
  return expected.filter((componentId) => !timed.has(componentId));
}

// ################################################################################################
describe("renderInsightCoverage.303.phase3", () => {
  it("reactComponentTestSuiteStepKinds lists the distinct step kinds of the suite's leaves", () => {
    const kinds = reactComponentTestSuiteStepKinds(patternSuite);
    expect(kinds).toContain("expectRenderedValues");
    expect(kinds).toContain("expectElement");
    expect(kinds).not.toContain("measureRendering");
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it(
    "with a measureRendering step in the suite, every editor component of the test pattern reports its renders with a timing",
    async () => {
      const result = await runDisplayLeaf(["expectRenderedValues", "expectElement", "measureRendering"]);
      expect(result).toEqual({ status: "ok" });
      expect(
        missingTimedComponentIds(EXPECTED_PATTERN_COMPONENT_IDS),
        `timed components: ${[...timedComponentIds()].join(", ")}`,
      ).toEqual([]);
    },
    30000,
  );

  it(
    "with a measureRendering step in the suite, MlAnyEditor (any with display.any.format) reports its renders with a timing",
    async () => {
      runner = createReactComponentTestRunner({ sandboxElement });
      const result = await runner({
        testNamePath: [...anyFileSuite.suitePath, anyFileSuite.caseLabels[0]],
        leaf: { miroirTestType: "reactComponentTest", miroirTestLabel: anyFileSuite.caseLabels[0], steps: [] },
        suite: anyFileSuite,
      });
      expect(result).toEqual({ status: "ok" });
      expect(missingTimedComponentIds(["MlAnyEditor"]), `timed components: ${[...timedComponentIds()].join(", ")}`).toEqual([]);
    },
    30000,
  );

  it(
    "without a measureRendering step in the suite, nothing is tracked (the existing suites keep their DOM)",
    async () => {
      const result = await runDisplayLeaf(reactComponentTestSuiteStepKinds(patternSuite));
      expect(result).toEqual({ status: "ok" });
      expect(renderInsightRegistry.getSnapshot()).toEqual([]);
      expect(sandboxElement.querySelector("[data-testid='render-insight-header']")).toBeNull();
    },
    30000,
  );
});

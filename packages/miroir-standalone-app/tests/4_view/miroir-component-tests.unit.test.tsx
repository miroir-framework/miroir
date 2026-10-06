/**
 * Issues #286, #292: React component tests run as MiroirTests.
 *
 * Loads every MiroirTest instance of the Miroir deployment folder that holds a `reactComponentTest`
 * leaf (one instance per editor since #292, e.g. `ui.mlElementEditor.enum`), registers
 * the component test runner, and runs each child of each instance root (a `reactComponentTestSuite`
 * or a legacy plain sub-suite) inside `describe(<child label>)` with the path
 * `[<instance name>, <child label>]`, through `runMiroirTests._runMiroirTestSuite`, with
 * `rethrowComponentTestFailures: true` so that a failing case fails its vitest test.
 *
 * A `reactComponentTestSuite` with `runOnDemand: true` (#303: `MlEditorRenderPerformance`) runs only
 * when `MIROIR_COMPONENT_PERF=1`; otherwise it is registered as `describe.skip(<child label>)` with one
 * `it.skip` per leaf label, so that the default run does not pay for it and `-t` still shows it
 * (skipped).
 *
 * The component test driver does not use React `act` (analysis §5.3), so `IS_REACT_ACT_ENVIRONMENT`
 * is set to `false` in a `beforeAll`: RTL's own `beforeAll` (registered by `tests/setup.ts`) sets it
 * to `true` after module scope.
 *
 * With `MIROIR_FEEDBACK_GLOW=1` (#438), the sandbox element is an enabled feedback glow boundary, as
 * in the app's Component Test Sandbox, so that the render-performance suite can be measured with the
 * glow on; by default no boundary is enabled.
 *
 * With `MIROIR_TEST_SUITES` (comma-separated instance names, set by `testMiroir --suites`, #406),
 * it runs only these instances; the entry checks still count every instance of the folder.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- miroir-component-tests
 * npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor
 * npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlArrayEditor"
 * MIROIR_COMPONENT_PERF=1 npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlEditorRenderPerformance"
 * ```
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import * as vitest from "vitest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  defaultMetaModelEnvironment,
  MiroirActivityTracker,
  MiroirEventService,
  runMiroirTests,
  splitSuiteKeys,
  type MiroirTestSuite,
} from "miroir-core";

import { attachFeedbackGlow } from "miroir-react";

import { createReactComponentTestRunner } from "../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";
import { resolveRepoRoot } from "../helpers/integrationTestProfiles.js";

const MIROIR_TEST_DATA_FOLDER = join(
  resolveRepoRoot(),
  "packages/miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b",
);

/**
 * Expected content of the folder: 7 per-editor instances, 68 leaves (#292 Slice 0 baseline), plus
 * the test pattern instance `ui.mlElementEditor.allTypesPattern` (#303: 1 display leaf, Slice 1, and 3
 * interaction leaves, Slice 2), plus the render-performance instance
 * `ui.mlElementEditor.renderPerformance` (#303 Slice 5: 15 leaves, `runOnDemand`), plus the
 * TransformerEditor instance `ui.transformerEditor` (#406: 8 leaves; #415: 11 leaves, the node actions, type changes and hint;
 * #411: 2 leaves, a getFromContext element in mapList and the instance mode use case; #447: 1 leaf,
 * a type change dropping only defaults; #453: 4 leaves, the type display), plus the block view
 * instance `ui.blockEditor` (#498: 2 leaves, the view switch; 5 leaves, the blocks of stored
 * TransformerDefinitions).
 *
 * `EXPECTED_LEAF_COUNT` counts every leaf of the folder, on-demand ones included (it checks the
 * folder content, not what the run executes); `EXPECTED_ON_DEMAND_LEAF_COUNT` is the part under a
 * `runOnDemand` suite, skipped unless `MIROIR_COMPONENT_PERF=1`.
 */
const EXPECTED_INSTANCE_COUNT = 11;
const EXPECTED_LEAF_COUNT = 120;
const EXPECTED_ON_DEMAND_LEAF_COUNT = 15;

/** On-demand suites (`runOnDemand: true`) run only with this environment variable set to `1`. */
const RUN_ON_DEMAND_SUITES = process.env.MIROIR_COMPONENT_PERF === "1";

type ComponentTestSuiteInstance = { uuid: string; name: string; definition: MiroirTestSuite };

/** The `reactComponentTest` leaves under `node`, at any depth. */
function reactComponentLeafCount(node: any): number {
  if (!node || typeof node !== "object") {
    return 0;
  }
  if (node.miroirTestType === "miroirTestSuite" || node.miroirTestType === "reactComponentTestSuite") {
    return (node.miroirTests ?? []).reduce(
      (count: number, child: any) => count + reactComponentLeafCount(child),
      0,
    );
  }
  return node.miroirTestType === "reactComponentTest" ? 1 : 0;
}

/** Every instance of the MiroirTest data folder with a `reactComponentTest` leaf, sorted by name. */
function loadComponentTestSuiteInstances(): ComponentTestSuiteInstance[] {
  return readdirSync(MIROIR_TEST_DATA_FOLDER)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => JSON.parse(readFileSync(join(MIROIR_TEST_DATA_FOLDER, fileName), "utf-8")))
    .filter((instance) => reactComponentLeafCount(instance?.definition) > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

const componentTestSuiteInstances = loadComponentTestSuiteInstances();

/** The instances named by `MIROIR_TEST_SUITES` (#406), every instance without it. */
const selectedSuiteNames = splitSuiteKeys(process.env.MIROIR_TEST_SUITES);
const selectedInstances =
  selectedSuiteNames.length > 0
    ? componentTestSuiteInstances.filter((instance) => selectedSuiteNames.includes(instance.name))
    : componentTestSuiteInstances;
if (selectedSuiteNames.length > 0 && selectedInstances.length !== selectedSuiteNames.length) {
  throw new Error(
    `MIROIR_TEST_SUITES names suites that are not component test instances: ${selectedSuiteNames
      .filter((name) => !componentTestSuiteInstances.some((instance) => instance.name === name))
      .join(", ")}`,
  );
}

const miroirActivityTracker = new MiroirActivityTracker();
new MiroirEventService(miroirActivityTracker);

// The sandbox element is never a render container, so RTL cleanup() does not detach it.
const sandboxElement = document.createElement("div");
sandboxElement.setAttribute("data-testid", "component-test-sandbox");
document.body.appendChild(sandboxElement);

let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;
const detachFeedbackGlow = process.env.MIROIR_FEEDBACK_GLOW === "1" ? attachFeedbackGlow(sandboxElement) : undefined;

beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  runner = createReactComponentTestRunner({ sandboxElement });
  ConfigurationService.configurationService.registerReactComponentTestRunner(runner);
});

afterAll(() => {
  try {
    // Unmounts the last case's React root and destroys the suite wrappers still open.
    runner?.close();
  } finally {
    ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
    detachFeedbackGlow?.();
    sandboxElement.remove();
  }
  // The last case's React root is unmounted and the sandbox element is removed.
  expect(sandboxElement.querySelectorAll('[data-testid="component-test-container"]')).toHaveLength(0);
  expect(document.body.contains(sandboxElement)).toBe(false);
});

// ################################################################################################
describe("entry checks", () => {
  it("IS_REACT_ACT_ENVIRONMENT is false inside a test body", () => {
    expect((globalThis as any).IS_REACT_ACT_ENVIRONMENT).toBe(false);
  });

  it(`loads ${EXPECTED_INSTANCE_COUNT} component test instances with ${EXPECTED_LEAF_COUNT} leaves`, () => {
    expect(componentTestSuiteInstances).toHaveLength(EXPECTED_INSTANCE_COUNT);
    expect(
      componentTestSuiteInstances.reduce(
        (count, instance) => count + reactComponentLeafCount(instance.definition),
        0,
      ),
    ).toBe(EXPECTED_LEAF_COUNT);
    expect(
      componentTestSuiteInstances.reduce(
        (count, instance) =>
          count +
          instance.definition.miroirTests
            .filter((child: any) => child.runOnDemand === true)
            .reduce((childCount: number, child: any) => childCount + reactComponentLeafCount(child), 0),
        0,
      ),
    ).toBe(EXPECTED_ON_DEMAND_LEAF_COUNT);
  });
});

// ################################################################################################
for (const instance of selectedInstances) {
  for (const child of instance.definition.miroirTests) {
    if (child.miroirTestType !== "miroirTestSuite" && child.miroirTestType !== "reactComponentTestSuite") {
      throw new Error(
        `${instance.name}: expected one sub-suite per editor, found a ${child.miroirTestType} leaf at the top level`,
      );
    }
    if (child.miroirTestType === "reactComponentTestSuite" && child.runOnDemand && !RUN_ON_DEMAND_SUITES) {
      describe.skip(`${child.miroirTestLabel} (runOnDemand: set MIROIR_COMPONENT_PERF=1 to run)`, () => {
        for (const leaf of child.miroirTests) {
          it.skip(leaf.miroirTestLabel, () => {});
        }
      });
      continue;
    }
    describe(child.miroirTestLabel, async () => {
      await runMiroirTests._runMiroirTestSuite(
        vitest,
        [instance.name, child.miroirTestLabel],
        child,
        undefined,
        defaultMetaModelEnvironment,
        miroirActivityTracker,
        undefined,
        true,
        runMiroirTests,
        { executionMode: "unit", rethrowComponentTestFailures: true },
      );
    });
  }
}

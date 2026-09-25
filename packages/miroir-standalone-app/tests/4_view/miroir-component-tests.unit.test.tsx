/**
 * Issues #286, #292: React component tests run as MiroirTests.
 *
 * Loads every MiroirTest instance of the Miroir deployment folder that holds a `reactComponentTest`
 * leaf (one instance per editor since #292, e.g. `JzodEnumEditor_ComponentTestSuite`), registers
 * the component test runner, and runs each child of each instance root (a `reactComponentTestSuite`
 * or a legacy plain sub-suite) inside `describe(<child label>)` with the path
 * `[<instance name>, <child label>]`, through `runMiroirTests._runMiroirTestSuite`, with
 * `rethrowComponentTestFailures: true` so that a failing case fails its vitest test.
 *
 * The component test driver does not use React `act` (analysis §5.3), so `IS_REACT_ACT_ENVIRONMENT`
 * is set to `false` in a `beforeAll`: RTL's own `beforeAll` (registered by `tests/setup.ts`) sets it
 * to `true` after module scope.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- miroir-component-tests
 * npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "JzodArrayEditor"
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
  type MiroirTestSuite,
} from "miroir-core";

import { createReactComponentTestRunner } from "../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";
import { resolveRepoRoot } from "../helpers/integrationTestProfiles.js";

const MIROIR_TEST_DATA_FOLDER = join(
  resolveRepoRoot(),
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b",
);

/** Expected content of the folder: 7 per-editor instances, 68 leaves (#292 Slice 0 baseline). */
const EXPECTED_INSTANCE_COUNT = 7;
const EXPECTED_LEAF_COUNT = 68;

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

const miroirActivityTracker = new MiroirActivityTracker();
new MiroirEventService(miroirActivityTracker);

// The sandbox element is never a render container, so RTL cleanup() does not detach it.
const sandboxElement = document.createElement("div");
sandboxElement.setAttribute("data-testid", "component-test-sandbox");
document.body.appendChild(sandboxElement);

let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;

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
  });
});

// ################################################################################################
for (const instance of componentTestSuiteInstances) {
  for (const child of instance.definition.miroirTests) {
    if (child.miroirTestType !== "miroirTestSuite" && child.miroirTestType !== "reactComponentTestSuite") {
      throw new Error(
        `${instance.name}: expected one sub-suite per editor, found a ${child.miroirTestType} leaf at the top level`,
      );
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

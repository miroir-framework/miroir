/**
 * Issue #286: React component tests run as MiroirTests.
 *
 * Loads the MiroirTest instance `JzodElementEditor_ComponentTestSuite` from the Miroir deployment
 * folder, registers the component test runner, and runs each sub-suite (one per editor) inside
 * `describe(<suite>)` through `runMiroirTests._runMiroirTestSuite`, with
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

import {
  componentTestSuiteInstanceName,
  componentTestSuiteInstanceUuid,
} from "../../src/miroir-fwk/4-tests/componentTests/componentTestManifest";
import { createReactComponentTestRunner } from "../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";
import { resolveRepoRoot } from "../helpers/integrationTestProfiles.js";

const MIROIR_TEST_DATA_FOLDER = join(
  resolveRepoRoot(),
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b",
);

function loadComponentTestSuiteInstance(): { uuid: string; name: string; definition: MiroirTestSuite } {
  for (const fileName of readdirSync(MIROIR_TEST_DATA_FOLDER)) {
    if (!fileName.endsWith(".json")) {
      continue;
    }
    const instance = JSON.parse(readFileSync(join(MIROIR_TEST_DATA_FOLDER, fileName), "utf-8"));
    if (instance?.uuid === componentTestSuiteInstanceUuid) {
      return instance;
    }
  }
  throw new Error(
    `suite ${componentTestSuiteInstanceName} not found in ${MIROIR_TEST_DATA_FOLDER}`,
  );
}

const componentTestSuiteInstance = loadComponentTestSuiteInstance();

const miroirActivityTracker = new MiroirActivityTracker();
new MiroirEventService(miroirActivityTracker);

// The sandbox element is never a render container, so RTL cleanup() does not detach it.
const sandboxElement = document.createElement("div");
sandboxElement.setAttribute("data-testid", "component-test-sandbox");
document.body.appendChild(sandboxElement);

beforeAll(() => {
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  ConfigurationService.configurationService.registerReactComponentTestRunner(
    createReactComponentTestRunner({ sandboxElement }),
  );
});

afterAll(() => {
  ConfigurationService.configurationService.registerReactComponentTestRunner(undefined);
});

// ################################################################################################
describe("entry checks", () => {
  it("IS_REACT_ACT_ENVIRONMENT is false inside a test body", () => {
    expect((globalThis as any).IS_REACT_ACT_ENVIRONMENT).toBe(false);
  });
});

// ################################################################################################
for (const subSuite of componentTestSuiteInstance.definition.miroirTests) {
  if (subSuite.miroirTestType !== "miroirTestSuite") {
    throw new Error(
      `${componentTestSuiteInstanceName}: expected one sub-suite per editor, found a ${subSuite.miroirTestType} leaf at the top level`,
    );
  }
  describe(subSuite.miroirTestLabel, async () => {
    await runMiroirTests._runMiroirTestSuite(
      vitest,
      [componentTestSuiteInstanceName, subSuite.miroirTestLabel],
      subSuite,
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

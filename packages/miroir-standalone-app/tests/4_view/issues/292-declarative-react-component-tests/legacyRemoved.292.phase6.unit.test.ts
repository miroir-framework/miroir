/**
 * Issue #292 Slice 6 (M1): no `componentTestRef` left (analysis D2, §7).
 * Issue #292 Slice 7 (M2): no `custom` step left (analysis D2, §7).
 *
 * - `miroirTestForReactComponent` in the MiroirTest Entity `a311f363-…` and EntityVersion
 *   `51c647fe-…` has no `componentTestRef`, and its `steps` are required;
 * - the `reactComponentTestStep` union of the Entity and the EntityVersion has no `custom` member;
 * - the legacy files `componentTestManifest.ts`, `componentTestRegistry.ts`, and the folder
 *   `jzodElementEditor/` are gone from `src/miroir-fwk/4-tests/componentTests/`;
 * - `customStepRegistry.ts` does not exist;
 * - a runner call without `suite` gives an `error` result.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- legacyRemoved.292.phase6
 * ```
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { MiroirTestForReactComponent } from "miroir-core";

import { createReactComponentTestRunner } from "../../../../src/miroir-fwk/4-tests/componentTests/runReactComponentTest";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

const REPO_ROOT = resolveRepoRoot();

const MIROIR_TEST_ENTITY_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a311f363-e238-4203-bdfc-29e8c160c26b.json",
);
const MIROIR_TEST_ENTITY_VERSION_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json",
);
const COMPONENT_TESTS_FOLDER = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests",
);

function miroirTestContext(path: string): any {
  const miroirTestModel = JSON.parse(readFileSync(path, { encoding: "utf-8" }));
  return miroirTestModel.mlSchema.definition.definition.context;
}

function reactComponentLeafSchema(path: string): any {
  return miroirTestContext(path).miroirTestForReactComponent;
}

function reactComponentTestStepMembers(path: string): string[] {
  const stepUnion = miroirTestContext(path).reactComponentTestStep;
  return stepUnion.definition.map((member: any) => member.definition.step.definition);
}

// ################################################################################################
describe("legacyRemoved.292.phase6: schema", () => {
  it.each([
    ["Entity", MIROIR_TEST_ENTITY_PATH],
    ["EntityVersion", MIROIR_TEST_ENTITY_VERSION_PATH],
  ])("the %s miroirTestForReactComponent has no componentTestRef and required steps", (_name, path) => {
    const leafSchema = reactComponentLeafSchema(path);
    expect(Object.keys(leafSchema.definition)).not.toContain("componentTestRef");
    expect(leafSchema.definition.steps).toBeDefined();
    expect(leafSchema.definition.steps.optional).not.toBe(true);
  });

  it.each([
    ["Entity", MIROIR_TEST_ENTITY_PATH],
    ["EntityVersion", MIROIR_TEST_ENTITY_VERSION_PATH],
  ])("the %s reactComponentTestStep union has no custom member (#292 M2)", (_name, path) => {
    expect(reactComponentTestStepMembers(path)).not.toContain("custom");
  });
});

// ################################################################################################
describe("legacyRemoved.292.phase6: legacy files", () => {
  it.each([
    "componentTestManifest.ts",
    "componentTestRegistry.ts",
    "jzodElementEditor",
    "customStepRegistry.ts",
  ])("componentTests/%s does not exist", (fileName) => {
    expect(existsSync(join(COMPONENT_TESTS_FOLDER, fileName))).toBe(false);
  });
});

// ################################################################################################
describe("legacyRemoved.292.phase6: runner", () => {
  let sandboxElement: HTMLElement;
  let runner: ReturnType<typeof createReactComponentTestRunner> | undefined;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = false;
  });

  beforeEach(() => {
    sandboxElement = document.createElement("div");
    document.body.appendChild(sandboxElement);
  });

  afterEach(() => {
    runner?.close();
    runner = undefined;
    sandboxElement.remove();
  });

  it("a runner call without suite gives an error result", async () => {
    runner = createReactComponentTestRunner({ sandboxElement });
    const leaf: MiroirTestForReactComponent = {
      miroirTestType: "reactComponentTest",
      miroirTestLabel: "Orphan: case",
      steps: [],
    };
    // `suite` is required by the runner type; a caller that bypasses it gets an error result.
    const result = await (runner as any)({ testNamePath: ["Orphan", "Orphan: case"], leaf });
    expect(result.status).toBe("error");
    expect(result.message).toContain("is not in a reactComponentTestSuite");
  });
});

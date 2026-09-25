/**
 * Issue #292 Slice 1: the 7 per-editor component test MiroirTest instances (analysis §5.6).
 *
 * - the MiroirTest data folder holds the 7 instances of the plan's UUID table, with those names;
 *   each root is a `miroirTestSuite` labelled with its name, with exactly one child labelled with
 *   the editor name;
 * - the 68 leaf labels, prefixed by the child label and sorted, equal the Slice 0 baseline
 *   `baseline-component-cases.txt`;
 * - `miroirTestDefinitionHasReactComponentTest` is true for each instance and for a fixture whose
 *   only component leaf is inside a `reactComponentTestSuite`;
 * - `miroir-test-app_deployment-miroir` exports `miroirTest_<name>` for the 7 names, and
 *   `defaultMiroirMetaModel.tests` holds the 7 uuids and not `JzodElementEditor_ComponentTestSuite`.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestInstances.292.phase1
 * ```
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import * as deploymentMiroir from "miroir-test-app_deployment-miroir";
import { defaultMiroirMetaModel } from "miroir-test-app_deployment-miroir";

import { miroirTestDefinitionHasReactComponentTest } from "../../../../src/miroir-fwk/4-tests/miroirTestSuiteUiExecution";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";

const REPO_ROOT = resolveRepoRoot();
const MIROIR_TEST_DATA_FOLDER = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b",
);
const BASELINE_PATH = join(
  REPO_ROOT,
  "packages/miroir-standalone-app/tests/4_view/issues/292-declarative-react-component-tests/baseline-component-cases.txt",
);

/** Editor name to instance uuid (plan, "Allocated UUIDs and keys"). */
const expectedInstances: Record<string, string> = {
  JzodEnumEditor: "761d4ed2-1a5c-4901-a9d9-897dbec0b27f",
  JzodArrayEditor: "1b71d68b-7dc9-468c-a251-4fa7889f20f4",
  JzodLiteralEditor: "3995a071-b8ae-48d3-a488-6d1fc828b725",
  JzodObjectEditor: "da353085-c62b-4aa6-bd54-8813d303dfe5",
  JzodSimpleTypeEditor: "590693b6-2125-43fc-89d7-1330ae8318db",
  JzodUnionEditor: "de517cd6-31a8-46d2-ac09-3a5162b630a7",
  JzodAnyEditor: "ec601bcc-a27d-450d-9c37-bdd6a12a1575",
};
const instanceName = (editor: string) => `${editor}_ComponentTestSuite`;

// ################################################################################################
function loadInstances(): any[] {
  return readdirSync(MIROIR_TEST_DATA_FOLDER)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => JSON.parse(readFileSync(join(MIROIR_TEST_DATA_FOLDER, fileName), "utf-8")));
}

/** Every `reactComponentTest` leaf label under `node`, at any depth. */
function componentLeafLabels(node: any): string[] {
  if (!node || typeof node !== "object") {
    return [];
  }
  if (node.miroirTestType === "miroirTestSuite" || node.miroirTestType === "reactComponentTestSuite") {
    return (node.miroirTests ?? []).flatMap(componentLeafLabels);
  }
  return node.miroirTestType === "reactComponentTest" ? [node.miroirTestLabel] : [];
}

const allInstances = loadInstances();
const componentInstances = allInstances.filter((instance) =>
  Object.values(expectedInstances).includes(instance.uuid),
);

// ################################################################################################
describe("per-editor component test MiroirTest instances", () => {
  it("the data folder holds the 7 instances with their names, each with one child labelled with the editor", () => {
    expect(
      Object.fromEntries(componentInstances.map((instance) => [instance.uuid, instance.name])),
    ).toEqual(
      Object.fromEntries(
        Object.entries(expectedInstances).map(([editor, uuid]) => [uuid, instanceName(editor)]),
      ),
    );
    for (const [editor, uuid] of Object.entries(expectedInstances)) {
      const instance = componentInstances.find((candidate) => candidate.uuid === uuid);
      expect(instance?.definition?.miroirTestType, editor).toBe("miroirTestSuite");
      expect(instance?.definition?.miroirTestLabel, editor).toBe(instanceName(editor));
      expect(
        instance?.definition?.miroirTests?.map((child: any) => child.miroirTestLabel),
        editor,
      ).toEqual([editor]);
    }
    // No other instance of the folder holds a component leaf (the combined instance is gone).
    const otherComponentInstances = allInstances
      .filter((instance) => !Object.values(expectedInstances).includes(instance.uuid))
      .filter((instance) => componentLeafLabels(instance.definition).length > 0)
      .map((instance) => instance.name);
    expect(otherComponentInstances).toEqual([]);
  });

  it("the 68 leaf labels, prefixed by the child label, equal the Slice 0 baseline", () => {
    const baseline = readFileSync(BASELINE_PATH, "utf-8")
      .split(/\r?\n/)
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/: passed$/, ""))
      .sort();
    const current = componentInstances
      .flatMap((instance) =>
        (instance.definition?.miroirTests ?? []).flatMap((child: any) =>
          componentLeafLabels(child).map((label) => `${child.miroirTestLabel} > ${label}`),
        ),
      )
      .sort();
    expect(baseline).toHaveLength(68);
    expect(current).toEqual(baseline);
  });

  it("miroirTestDefinitionHasReactComponentTest is true for each instance and inside a reactComponentTestSuite", () => {
    for (const instance of componentInstances) {
      expect(miroirTestDefinitionHasReactComponentTest(instance.definition), instance.name).toBe(true);
    }
    expect(componentInstances).toHaveLength(7);
    const fixture = {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "Root",
      miroirTests: [
        {
          miroirTestType: "reactComponentTestSuite",
          miroirTestLabel: "S",
          component: "JzodElementEditor",
          miroirTests: [{ miroirTestType: "reactComponentTest", miroirTestLabel: "A", steps: [] }],
        },
      ],
    };
    expect(miroirTestDefinitionHasReactComponentTest(fixture as any)).toBe(true);
  });

  it("the deployment package exports the 7 instances and lists them in defaultMiroirMetaModel.tests", () => {
    const exports = deploymentMiroir as Record<string, any>;
    const missingExports = Object.keys(expectedInstances).filter(
      (editor) => exports[`miroirTest_${instanceName(editor)}`]?.uuid !== expectedInstances[editor],
    );
    expect(missingExports).toEqual([]);
    expect(exports["miroirTest_JzodElementEditor_ComponentTestSuite"]).toBeUndefined();

    const testUuids = defaultMiroirMetaModel.tests.map((test: any) => test.uuid);
    const testNames = defaultMiroirMetaModel.tests.map((test: any) => test.name);
    for (const uuid of Object.values(expectedInstances)) {
      expect(testUuids).toContain(uuid);
    }
    expect(testNames).not.toContain("JzodElementEditor_ComponentTestSuite");
  });
});

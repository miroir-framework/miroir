/**
 * Issue #292 Slice 1: the MiroirTest schema holds the `reactComponentTestSuite` node and the step
 * vocabulary (analysis §5.1, §5.4), with the same text in the Entity and the EntityVersion.
 *
 * - the `mlSchema` contexts of the Entity `a311f363-…` and the EntityVersion `51c647fe-…` are equal;
 * - the issue's example suite (analysis §5.4, the Enum suite), wrapped in a MiroirTest instance
 *   with a `miroirTestSuite` root, passes `jzodTypeCheck` against both `mlSchema`s;
 * - a step of an unknown kind and a `reactComponentTestSuite` without `component` both fail.
 *
 * Issue #294: a `reactComponentTest` leaf is accepted only in `reactComponentTestSuite.miroirTests`.
 * The same leaf placed directly in a plain `miroirTestSuite.miroirTests` fails against both
 * `mlSchema`s (before #294 it passed and only failed at run time, with
 * `REACT_COMPONENT_TEST_NO_SUITE_MESSAGE`).
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentTestSchema.292.phase1
 * ```
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { defaultMiroirModelEnvironment, jzodTypeCheck, type MlElement } from "miroir-core";

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

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, { encoding: "utf-8" }));
}

const entity = readJson(MIROIR_TEST_ENTITY_PATH);
const entityVersion = readJson(MIROIR_TEST_ENTITY_VERSION_PATH);

const schemas: [string, MlElement][] = [
  ["Entity", entity.mlSchema],
  ["EntityVersion", entityVersion.mlSchema],
];

// ################################################################################################
/** The Enum suite of analysis §5.4 (P1 option (a)). */
function exampleEnumSuite(): any {
  return {
    miroirTestType: "reactComponentTestSuite",
    miroirTestLabel: "JzodEnumEditor",
    component: "JzodElementEditor",
    componentProps: {
      label: "Test Label",
      name: "testField",
      listKey: "ROOT.testField",
      rootLessListKey: "testField",
      rootLessListKeyArray: ["testField"],
      rawJzodSchema: { type: "enum", definition: ["value1", "value2", "value3"] },
      initialFormState: "value2",
    },
    miroirTests: [
      {
        miroirTestType: "reactComponentTest",
        miroirTestLabel: "JzodEnumEditor: renders select with correct value",
        steps: [{ step: "expectRenderedValues", label: "initial", expectedValue: { testField: "value2" } }],
      },
      {
        miroirTestType: "reactComponentTest",
        miroirTestLabel: "JzodEnumEditor: renders all enum options",
        steps: [
          { step: "expectRenderedValues", label: "initial", expectedValue: { testField: "value2" } },
          { step: "openSelect", field: "testField" },
          {
            step: "expectRenderedValues",
            label: "after click",
            detectOptions: true,
            expectedValue: {
              testField: "value2",
              $options: { testField: ["value1", "value2", "value3"] },
            },
          },
        ],
      },
      {
        miroirTestType: "reactComponentTest",
        miroirTestLabel: "JzodEnumEditor: form state is changed when selection changes",
        steps: [
          { step: "expectElement", target: { widget: "combobox", field: "testField" }, value: "value2" },
          { step: "openSelect", field: "testField" },
          { step: "filterSelect", field: "testField", text: "value3" },
          {
            step: "expectRenderedValues",
            label: "after selection change",
            expectedValue: { testField: "value2", $options: { testField: ["value3"] } },
          },
          { step: "keyboard", keys: "{Enter}" },
          {
            step: "waitForAttribute",
            target: { widget: "selectState", field: "testField" },
            attribute: "data-test-selected-value",
            value: "value3",
          },
          {
            step: "expectRenderedValues",
            label: "after selection commit",
            expectedValue: { testField: "value3" },
          },
        ],
      },
    ],
  };
}

function miroirTestInstanceOf(child: any): any {
  return {
    uuid: "761d4ed2-1a5c-4901-a9d9-897dbec0b27f",
    parentName: "MiroirTest",
    parentUuid: "a311f363-e238-4203-bdfc-29e8c160c26b",
    name: "JzodEnumEditor_ComponentTestSuite",
    selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
    description: "Issue #292 schema fixture",
    definition: {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "JzodEnumEditor_ComponentTestSuite",
      miroirTests: [child],
    },
  };
}

function typeCheckStatus(schema: MlElement, instance: any): string {
  return jzodTypeCheck(schema, instance, [], [], defaultMiroirModelEnvironment, {}).status;
}

// ################################################################################################
describe("MiroirTest schema for declarative component tests", () => {
  it("the mlSchema contexts of the Entity and the EntityVersion are equal", () => {
    expect(entityVersion.mlSchema.definition.definition.context).toEqual(
      entity.mlSchema.definition.definition.context,
    );
  });

  it.each(schemas)("the issue's example suite passes jzodTypeCheck against the %s mlSchema", (_name, schema) => {
    const result = jzodTypeCheck(
      schema,
      miroirTestInstanceOf(exampleEnumSuite()),
      [],
      [],
      defaultMiroirModelEnvironment,
      {},
    );
    expect(result.status, JSON.stringify(result).slice(0, 2000)).toBe("ok");
  });

  it.each(schemas)("a step of an unknown kind fails against the %s mlSchema", (_name, schema) => {
    const suite = exampleEnumSuite();
    suite.miroirTests[0].steps.push({ step: "fly" });
    expect(typeCheckStatus(schema, miroirTestInstanceOf(suite))).toBe("error");
  });

  it.each(schemas)("a reactComponentTestSuite without component fails against the %s mlSchema", (_name, schema) => {
    const suite = exampleEnumSuite();
    delete suite.component;
    expect(typeCheckStatus(schema, miroirTestInstanceOf(suite))).toBe("error");
  });

  // ##############################################################################################
  describe("#294: a reactComponentTest leaf is accepted only inside a reactComponentTestSuite", () => {
    it.each(schemas)(
      "a reactComponentTest leaf directly in a plain miroirTestSuite fails against the %s mlSchema",
      (_name, schema) => {
        const leaf = exampleEnumSuite().miroirTests[0];
        expect(typeCheckStatus(schema, miroirTestInstanceOf(leaf))).toBe("error");
      },
    );

    it.each(schemas)(
      "the same reactComponentTest leaf inside a reactComponentTestSuite passes against the %s mlSchema",
      (_name, schema) => {
        const suite = exampleEnumSuite();
        suite.miroirTests = [suite.miroirTests[0]];
        expect(typeCheckStatus(schema, miroirTestInstanceOf(suite))).toBe("ok");
      },
    );
  });
});

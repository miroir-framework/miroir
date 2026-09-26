/**
 * Issues #286, #292: the component test MiroirTest instances are valid and consistent (#292
 * analysis §5.7).
 *
 * For every instance of the Miroir deployment folder that holds a `reactComponentTest` leaf (the
 * 7 per-editor instances of #292):
 * - it passes `jzodTypeCheck` against the MiroirTest Entity `mlSchema` and the EntityVersion
 *   `mlSchema`;
 * - its leaf labels are unique over all the instances and start with `<child label>: `, the child
 *   being the `reactComponentTestSuite` under the instance root;
 * - each leaf has `steps` (#292 M1: the legacy TypeScript case bodies are gone).
 *
 * The comparison function is also run on fixtures, so that each kind of problem is shown to fail.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
 * ```
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { defaultMiroirModelEnvironment, jzodTypeCheck, type MlElement } from "miroir-core";

import { resolveRepoRoot } from "../helpers/integrationTestProfiles.js";

const REPO_ROOT = resolveRepoRoot();
const DEPLOYMENT_MIROIR = join(REPO_ROOT, "packages/miroir-test-app_deployment-miroir/assets");
const MIROIR_TEST_DATA_FOLDER = join(DEPLOYMENT_MIROIR, "miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b");
const MIROIR_TEST_ENTITY_PATH = join(
  DEPLOYMENT_MIROIR,
  "miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a311f363-e238-4203-bdfc-29e8c160c26b.json",
);
const MIROIR_TEST_ENTITY_VERSION_PATH = join(
  DEPLOYMENT_MIROIR,
  "miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json",
);

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, "utf-8"));
}

/** Every `reactComponentTest` leaf under `node`, at any depth. */
function reactComponentLeaves(node: any): any[] {
  if (!node || typeof node !== "object") {
    return [];
  }
  if (node.miroirTestType === "miroirTestSuite" || node.miroirTestType === "reactComponentTestSuite") {
    return (node.miroirTests ?? []).flatMap(reactComponentLeaves);
  }
  return node.miroirTestType === "reactComponentTest" ? [node] : [];
}

/** Every instance of the MiroirTest data folder with a `reactComponentTest` leaf. */
function loadComponentTestInstances(): any[] {
  return readdirSync(MIROIR_TEST_DATA_FOLDER)
    .filter((fileName) => fileName.endsWith(".json"))
    .map((fileName) => readJson(join(MIROIR_TEST_DATA_FOLDER, fileName)))
    .filter((instance) => reactComponentLeaves(instance?.definition).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ################################################################################################
/** Returns one message per problem in the component test instances. An empty list means none. */
export function componentTestConsistencyProblems(params: { instances: any[] }): string[] {
  const { instances } = params;
  const problems: string[] = [];

  // every leaf, with the label of the child of its instance root
  const leaves = instances.flatMap((instance) =>
    (instance?.definition?.miroirTests ?? []).flatMap((child: any) =>
      reactComponentLeaves(child).map((leaf) => ({ instanceName: instance.name, childLabel: child.miroirTestLabel, leaf })),
    ),
  );

  // labels: unique over all the instances, prefixed by the child label
  const seen = new Set<string>();
  for (const { instanceName, childLabel, leaf } of leaves) {
    const label: string = leaf.miroirTestLabel;
    if (seen.has(label)) {
      problems.push(`leaf label "${label}" is used more than once`);
    }
    seen.add(label);
    if (!label.startsWith(`${childLabel}: `)) {
      problems.push(`leaf "${label}" of ${instanceName} should start with "${childLabel}: "`);
    }
  }

  // every leaf has steps
  for (const { leaf } of leaves) {
    if (!Array.isArray(leaf.steps)) {
      problems.push(`leaf "${leaf.miroirTestLabel}" has no steps`);
    }
  }
  return problems;
}

// ################################################################################################
/** One instance per suite, each with a `reactComponentTestSuite` child holding step leaves. */
function fixtureInstances(suites: Record<string, readonly string[]>): any[] {
  return Object.entries(suites).map(([suite, cases]) => ({
    name: `${suite}_ComponentTestSuite`,
    definition: {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: `${suite}_ComponentTestSuite`,
      miroirTests: [
        {
          miroirTestType: "reactComponentTestSuite",
          miroirTestLabel: suite,
          component: "C",
          miroirTests: cases.map((caseLabel) => ({
            miroirTestType: "reactComponentTest",
            miroirTestLabel: `${suite}: ${caseLabel}`,
            steps: [],
          })),
        },
      ],
    },
  }));
}

const fixtureSuites = {
  SuiteA: ["case 1", "case 2"],
  SuiteB: ["case 3"],
};

const componentTestInstances = loadComponentTestInstances();
const schemas: [string, MlElement][] = [
  ["Entity", readJson(MIROIR_TEST_ENTITY_PATH).mlSchema],
  ["EntityVersion", readJson(MIROIR_TEST_ENTITY_VERSION_PATH).mlSchema],
];

// ################################################################################################
describe("componentMiroirTests consistency", () => {
  it("the 7 component test instances pass jzodTypeCheck against the Entity and EntityVersion mlSchemas", () => {
    expect(componentTestInstances.map((instance) => instance.name)).toHaveLength(7);
    const failures: string[] = [];
    for (const instance of componentTestInstances) {
      for (const [schemaName, schema] of schemas) {
        const result = jzodTypeCheck(schema, instance, [], [], defaultMiroirModelEnvironment, {});
        if (result.status !== "ok") {
          failures.push(`${instance.name} against the ${schemaName} mlSchema: ${JSON.stringify(result).slice(0, 500)}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("the real instances are consistent", () => {
    expect(componentTestConsistencyProblems({ instances: componentTestInstances })).toEqual([]);
  });

  it("fixtures: consistent fixtures give no problem", () => {
    expect(componentTestConsistencyProblems({ instances: fixtureInstances(fixtureSuites) })).toEqual([]);
  });

  it("fixtures: a leaf label used twice fails", () => {
    const instances = fixtureInstances(fixtureSuites);
    // SuiteB's leaf reuses its own label.
    const stepSuite = instances[1].definition.miroirTests[0];
    stepSuite.miroirTests.push({ ...stepSuite.miroirTests[0] });
    expect(componentTestConsistencyProblems({ instances })).toEqual([
      'leaf label "SuiteB: case 3" is used more than once',
    ]);
  });

  it("fixtures: a leaf label without its child label prefix fails", () => {
    const instances = fixtureInstances(fixtureSuites);
    instances[1].definition.miroirTests[0].miroirTests[0].miroirTestLabel = "case 3";
    expect(componentTestConsistencyProblems({ instances })).toEqual([
      'leaf "case 3" of SuiteB_ComponentTestSuite should start with "SuiteB: "',
    ]);
  });

  it("fixtures: a leaf without steps fails", () => {
    const instances = fixtureInstances(fixtureSuites);
    delete instances[1].definition.miroirTests[0].miroirTests[0].steps;
    expect(componentTestConsistencyProblems({ instances })).toEqual(['leaf "SuiteB: case 3" has no steps']);
  });
});

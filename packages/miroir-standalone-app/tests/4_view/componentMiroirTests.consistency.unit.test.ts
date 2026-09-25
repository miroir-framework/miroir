/**
 * Issues #286, #292: the component test MiroirTest instances are valid and agree with the
 * component test manifest and registry (#292 analysis §5.7).
 *
 * For every instance of the Miroir deployment folder that holds a `reactComponentTest` leaf (the
 * 7 per-editor instances of #292):
 * - it passes `jzodTypeCheck` against the MiroirTest Entity `mlSchema` and the EntityVersion
 *   `mlSchema`;
 * - its leaf labels are unique over all the instances and start with `<child label>: `, the child
 *   being the `reactComponentTestSuite` (or legacy sub-suite) under the instance root;
 * - each leaf has exactly one of `steps` and `componentTestRef`.
 *
 * Until #292 M1, the legacy (`componentTestRef`) leaves must equal the manifest, and the manifest
 * must equal the registry.
 *
 * The comparison function is also run on fixtures, so that each kind of disagreement is shown to
 * fail.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
 * ```
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { defaultMiroirModelEnvironment, jzodTypeCheck, type JzodElement } from "miroir-core";

import {
  componentTestLeafLabel,
  componentTestManifest,
} from "../../src/miroir-fwk/4-tests/componentTests/componentTestManifest";
import { componentTestRegistry } from "../../src/miroir-fwk/4-tests/componentTests/componentTestRegistry";
import { resolveRepoRoot } from "../helpers/integrationTestProfiles.js";

type ComponentTestManifest = Record<string, readonly string[]>;
type RegistryShape = Record<string, { cases: Record<string, unknown> }>;

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
/**
 * Returns one message per problem in the component test instances, or between their legacy leaves,
 * the manifest, and the registry. An empty list means they agree.
 */
export function componentTestConsistencyProblems(params: {
  manifest: ComponentTestManifest;
  registry: RegistryShape;
  instances: any[];
}): string[] {
  const { manifest, registry, instances } = params;
  const problems: string[] = [];
  const key = (suite: string, caseLabel: string) => JSON.stringify([suite, caseLabel]);

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

  // exactly one of steps and componentTestRef
  for (const { leaf } of leaves) {
    const hasSteps = leaf.steps !== undefined;
    const hasRef = leaf.componentTestRef !== undefined;
    if (hasSteps === hasRef) {
      problems.push(`leaf "${leaf.miroirTestLabel}" must have exactly one of steps and componentTestRef`);
    }
  }

  // legacy leaves and manifest
  const legacyLeaves = leaves.filter(({ leaf }) => leaf.componentTestRef !== undefined && leaf.steps === undefined);
  const leafRefs = new Set(
    legacyLeaves.map(({ leaf }) => key(leaf.componentTestRef.suite, leaf.componentTestRef.case)),
  );
  const manifestRefs = new Set<string>();
  for (const [suite, cases] of Object.entries(manifest)) {
    for (const caseLabel of cases) {
      manifestRefs.add(key(suite, caseLabel));
      if (!leafRefs.has(key(suite, caseLabel))) {
        problems.push(`manifest case "${suite}" / "${caseLabel}" has no reactComponentTest leaf in the JSON`);
      }
    }
  }
  for (const { instanceName, childLabel, leaf } of legacyLeaves) {
    const ref = leaf.componentTestRef;
    if (!manifestRefs.has(key(ref.suite, ref.case))) {
      problems.push(
        `JSON leaf "${leaf.miroirTestLabel}" (${instanceName} > ${childLabel}) refers to "${ref.suite}" / "${ref.case}", which is not in the manifest`,
      );
    }
    const expectedLabel = componentTestLeafLabel(ref.suite, ref.case);
    if (leaf.miroirTestLabel !== expectedLabel) {
      problems.push(`JSON leaf "${leaf.miroirTestLabel}" should be labelled "${expectedLabel}"`);
    }
  }

  // manifest and registry
  for (const [suite, cases] of Object.entries(manifest)) {
    const registrySuite = registry[suite];
    if (!registrySuite) {
      problems.push(`manifest suite "${suite}" is not in the registry`);
      continue;
    }
    for (const caseLabel of cases) {
      if (!(caseLabel in registrySuite.cases)) {
        problems.push(`manifest case "${suite}" / "${caseLabel}" is not in the registry`);
      }
    }
  }
  for (const [suite, registrySuite] of Object.entries(registry)) {
    const manifestCases = manifest[suite];
    if (!manifestCases) {
      problems.push(`registry suite "${suite}" is not in the manifest`);
      continue;
    }
    for (const caseLabel of Object.keys(registrySuite.cases)) {
      if (!manifestCases.includes(caseLabel)) {
        problems.push(`registry case "${suite}" / "${caseLabel}" is not in the manifest`);
      }
    }
  }
  return problems;
}

// ################################################################################################
const fixtureManifest: ComponentTestManifest = {
  SuiteA: ["case 1", "case 2"],
  SuiteB: ["case 3"],
};

function fixtureRegistry(manifest: ComponentTestManifest): RegistryShape {
  return Object.fromEntries(
    Object.entries(manifest).map(([suite, cases]) => [
      suite,
      { cases: Object.fromEntries(cases.map((caseLabel) => [caseLabel, {}])) },
    ]),
  );
}

/** One instance per suite, with a legacy sub-suite, plus one instance with a step suite. */
function fixtureInstances(manifest: ComponentTestManifest): any[] {
  return [
    ...Object.entries(manifest).map(([suite, cases]) => ({
      name: `${suite}_ComponentTestSuite`,
      definition: {
        miroirTestType: "miroirTestSuite",
        miroirTestLabel: `${suite}_ComponentTestSuite`,
        miroirTests: [
          {
            miroirTestType: "miroirTestSuite",
            miroirTestLabel: suite,
            miroirTests: cases.map((caseLabel) => ({
              miroirTestType: "reactComponentTest",
              miroirTestLabel: componentTestLeafLabel(suite, caseLabel),
              componentTestRef: { suite, case: caseLabel },
            })),
          },
        ],
      },
    })),
    {
      name: "SuiteC_ComponentTestSuite",
      definition: {
        miroirTestType: "miroirTestSuite",
        miroirTestLabel: "SuiteC_ComponentTestSuite",
        miroirTests: [
          {
            miroirTestType: "reactComponentTestSuite",
            miroirTestLabel: "SuiteC",
            component: "C",
            miroirTests: [{ miroirTestType: "reactComponentTest", miroirTestLabel: "SuiteC: case 4", steps: [] }],
          },
        ],
      },
    },
  ];
}

const componentTestInstances = loadComponentTestInstances();
const schemas: [string, JzodElement][] = [
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

  it("the real instances, manifest, and registry agree", () => {
    expect(
      componentTestConsistencyProblems({
        manifest: componentTestManifest,
        registry: componentTestRegistry,
        instances: componentTestInstances,
      }),
    ).toEqual([]);
  });

  it("fixtures: consistent fixtures give no problem", () => {
    expect(
      componentTestConsistencyProblems({
        manifest: fixtureManifest,
        registry: fixtureRegistry(fixtureManifest),
        instances: fixtureInstances(fixtureManifest),
      }),
    ).toEqual([]);
  });

  it("fixtures: a manifest case with no JSON leaf fails", () => {
    const problems = componentTestConsistencyProblems({
      manifest: fixtureManifest,
      registry: fixtureRegistry(fixtureManifest),
      instances: fixtureInstances({ SuiteA: ["case 1"], SuiteB: ["case 3"] }),
    });
    expect(problems).toEqual([
      'manifest case "SuiteA" / "case 2" has no reactComponentTest leaf in the JSON',
    ]);
  });

  it("fixtures: a registry case missing from the manifest fails", () => {
    const problems = componentTestConsistencyProblems({
      manifest: fixtureManifest,
      registry: fixtureRegistry({ ...fixtureManifest, SuiteB: ["case 3", "case 4"] }),
      instances: fixtureInstances(fixtureManifest),
    });
    expect(problems).toEqual(['registry case "SuiteB" / "case 4" is not in the manifest']);
  });

  it("fixtures: a leaf label used twice fails", () => {
    const instances = fixtureInstances(fixtureManifest);
    // SuiteC's step leaf reuses its own label.
    const stepSuite = instances[2].definition.miroirTests[0];
    stepSuite.miroirTests.push({ ...stepSuite.miroirTests[0] });
    const problems = componentTestConsistencyProblems({
      manifest: fixtureManifest,
      registry: fixtureRegistry(fixtureManifest),
      instances,
    });
    expect(problems).toEqual(['leaf label "SuiteC: case 4" is used more than once']);
  });

  it("fixtures: a leaf label without its child label prefix fails", () => {
    const instances = fixtureInstances(fixtureManifest);
    instances[2].definition.miroirTests[0].miroirTests[0].miroirTestLabel = "case 4";
    const problems = componentTestConsistencyProblems({
      manifest: fixtureManifest,
      registry: fixtureRegistry(fixtureManifest),
      instances,
    });
    expect(problems).toEqual(['leaf "case 4" of SuiteC_ComponentTestSuite should start with "SuiteC: "']);
  });

  it("fixtures: a leaf with both steps and componentTestRef fails", () => {
    const instances = fixtureInstances(fixtureManifest);
    instances[2].definition.miroirTests[0].miroirTests[0].componentTestRef = { suite: "SuiteC", case: "case 4" };
    const problems = componentTestConsistencyProblems({
      manifest: fixtureManifest,
      registry: fixtureRegistry(fixtureManifest),
      instances,
    });
    expect(problems).toEqual([
      'leaf "SuiteC: case 4" must have exactly one of steps and componentTestRef',
    ]);
  });
});

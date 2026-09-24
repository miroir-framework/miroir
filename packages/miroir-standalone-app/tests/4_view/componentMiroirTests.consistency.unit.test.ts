/**
 * Issue #286: the component test manifest, the registry, and the generated MiroirTest instance
 * `JzodElementEditor_ComponentTestSuite` agree (analysis §5.7).
 *
 * - every manifest case has one `reactComponentTest` leaf in the JSON, and every leaf is in the
 *   manifest;
 * - the registry has the same suites and cases as the manifest;
 * - no leaf label is used twice in the instance;
 * - a second generator run leaves the JSON byte-identical.
 *
 * The comparison function is also run on fixtures, so that each kind of disagreement is shown to
 * fail.
 *
 * Run:
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
 * ```
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  componentTestSuiteInstancePath,
  serializeComponentTestSuiteInstance,
} from "../../scripts/generate-component-miroir-tests";
import {
  componentTestLeafLabel,
  componentTestManifest,
} from "../../src/miroir-fwk/4-tests/componentTests/componentTestManifest";
import { componentTestRegistry } from "../../src/miroir-fwk/4-tests/componentTests/componentTestRegistry";

type ComponentTestManifest = Record<string, readonly string[]>;
type RegistryShape = Record<string, { cases: Record<string, unknown> }>;

/** Every `reactComponentTest` leaf of a MiroirTest instance, with its sub-suite path. */
function reactComponentLeaves(node: any, path: string[] = []): { path: string[]; leaf: any }[] {
  if (!node || typeof node !== "object") {
    return [];
  }
  if (node.miroirTestType === "miroirTestSuite") {
    return (node.miroirTests ?? []).flatMap((child: any) =>
      reactComponentLeaves(child, [...path, node.miroirTestLabel]),
    );
  }
  return node.miroirTestType === "reactComponentTest" ? [{ path, leaf: node }] : [];
}

/** Every leaf label of a MiroirTest instance (any leaf kind). */
function allLeafLabels(node: any): string[] {
  if (!node || typeof node !== "object") {
    return [];
  }
  if (node.miroirTestType === "miroirTestSuite") {
    return (node.miroirTests ?? []).flatMap((child: any) => allLeafLabels(child));
  }
  return [node.miroirTestLabel];
}

// ################################################################################################
/**
 * Returns one message per disagreement between the manifest, the registry, and the MiroirTest
 * instance. An empty list means they agree.
 */
export function componentTestConsistencyProblems(params: {
  manifest: ComponentTestManifest;
  registry: RegistryShape;
  instance: any;
}): string[] {
  const { manifest, registry, instance } = params;
  const problems: string[] = [];
  const key = (suite: string, caseLabel: string) => JSON.stringify([suite, caseLabel]);

  // manifest and JSON leaves
  const leaves = reactComponentLeaves(instance?.definition);
  const leafRefs = new Set(
    leaves.map(({ leaf }) => key(leaf.componentTestRef?.suite, leaf.componentTestRef?.case)),
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
  for (const { path, leaf } of leaves) {
    const ref = leaf.componentTestRef ?? {};
    if (!manifestRefs.has(key(ref.suite, ref.case))) {
      problems.push(
        `JSON leaf "${leaf.miroirTestLabel}" (${path.join(" > ")}) refers to "${ref.suite}" / "${ref.case}", which is not in the manifest`,
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

  // leaf labels are unique in the instance
  const seen = new Set<string>();
  for (const label of allLeafLabels(instance?.definition)) {
    if (seen.has(label)) {
      problems.push(`leaf label "${label}" is used more than once in the instance`);
    }
    seen.add(label);
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

function fixtureInstance(manifest: ComponentTestManifest): any {
  return {
    definition: {
      miroirTestType: "miroirTestSuite",
      miroirTestLabel: "Fixture",
      miroirTests: Object.entries(manifest).map(([suite, cases]) => ({
        miroirTestType: "miroirTestSuite",
        miroirTestLabel: suite,
        miroirTests: cases.map((caseLabel) => ({
          miroirTestType: "reactComponentTest",
          miroirTestLabel: componentTestLeafLabel(suite, caseLabel),
          componentTestRef: { suite, case: caseLabel },
        })),
      })),
    },
  };
}

// ################################################################################################
describe("componentMiroirTests consistency", () => {
  it("the real manifest, registry, and generated JSON agree", () => {
    const instance = JSON.parse(readFileSync(componentTestSuiteInstancePath, "utf-8"));
    expect(
      componentTestConsistencyProblems({
        manifest: componentTestManifest,
        registry: componentTestRegistry,
        instance,
      }),
    ).toEqual([]);
  });

  it("a second generator run leaves the JSON byte-identical", () => {
    const onDisk = readFileSync(componentTestSuiteInstancePath, "utf-8");
    expect(serializeComponentTestSuiteInstance(componentTestManifest)).toBe(onDisk);
  });

  it("fixtures: consistent fixtures give no problem", () => {
    expect(
      componentTestConsistencyProblems({
        manifest: fixtureManifest,
        registry: fixtureRegistry(fixtureManifest),
        instance: fixtureInstance(fixtureManifest),
      }),
    ).toEqual([]);
  });

  it("fixtures: a manifest case with no JSON leaf fails", () => {
    const problems = componentTestConsistencyProblems({
      manifest: fixtureManifest,
      registry: fixtureRegistry(fixtureManifest),
      instance: fixtureInstance({ SuiteA: ["case 1"], SuiteB: ["case 3"] }),
    });
    expect(problems).toEqual([
      'manifest case "SuiteA" / "case 2" has no reactComponentTest leaf in the JSON',
    ]);
  });

  it("fixtures: a registry case missing from the manifest fails", () => {
    const problems = componentTestConsistencyProblems({
      manifest: fixtureManifest,
      registry: fixtureRegistry({ ...fixtureManifest, SuiteB: ["case 3", "case 4"] }),
      instance: fixtureInstance(fixtureManifest),
    });
    expect(problems).toEqual(['registry case "SuiteB" / "case 4" is not in the manifest']);
  });

  it("fixtures: a leaf label used twice in the instance fails", () => {
    const instance = fixtureInstance(fixtureManifest);
    // SuiteB's leaf reuses SuiteA's first leaf label.
    instance.definition.miroirTests[1].miroirTests.push({
      ...instance.definition.miroirTests[0].miroirTests[0],
    });
    const problems = componentTestConsistencyProblems({
      manifest: fixtureManifest,
      registry: fixtureRegistry(fixtureManifest),
      instance,
    });
    expect(problems).toEqual([
      'leaf label "SuiteA: case 1" is used more than once in the instance',
    ]);
  });
});

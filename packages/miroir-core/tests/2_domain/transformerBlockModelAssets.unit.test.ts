import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import type { MiroirModelEnvironment } from "../../src/0_interfaces/1_core/Transformer";
import { defaultMiroirModelEnvironment } from "../../src/1_core/Model";
import { blockTree, transformerBlockTree } from "../../src/2_domain/TransformerBlockModel";
import { applicationTransformerDefinitions } from "../../src/2_domain/TransformersForRuntime";

// ################################################################################################
// Issue #498 (analysis #497, D8): every transformer stored in the package assets. A platform test,
// not a MiroirTest, because it reads the asset files of every package from the file system.
//
// The corpus is every object with a string `transformerType`, except the arguments of
// functionCallTest cases, `expected*` values, and the content of `returnValue.value`, which the
// runtime returns without evaluating it.
//
// Slice 2: each of them maps to blocks, one block per transformer node, with no JSON block.
// Slice 4: each category of block has a color in the default Theme.
// #504: every composite action sequence maps to command blocks, one per sequence and step, with no
// JSON block: each action type has an Endpoint action among the Endpoints of the assets.
// ################################################################################################

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "transformerBlockModelAssets" ||
  RUN_TEST === "transformerBlockModelAssets.unit.test";

const REPO_ROOT = join(import.meta.dirname, "../../../..");
const PACKAGES = join(REPO_ROOT, "packages");
const DEFAULT_THEME = join(
  PACKAGES,
  "miroir-app-miroir/assets/miroir_data/bdcf956a-771d-40a1-a878-06e0bf6efd3e/919803c4-979d-4d7c-9cec-e54d37bdac09.json",
);

type TransformerRoot = { path: (string | number)[]; value: Record<string, unknown> };

function isTransformerNode(value: unknown): value is Record<string, unknown> & { transformerType: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).transformerType === "string"
  );
}

function isSkippedKey(key: string): boolean {
  return key === "arguments" || key.startsWith("expected");
}

/** The outermost transformers of a JSON value, in document order. */
function transformerRoots(value: unknown, path: (string | number)[] = []): TransformerRoot[] {
  if (isTransformerNode(value)) {
    return [{ path, value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => transformerRoots(item, [...path, index]));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      isSkippedKey(key) ? [] : transformerRoots(child, [...path, key]),
    );
  }
  return [];
}

/** Every transformer node of a root, the root included, outside quoted `returnValue.value`. */
function transformerNodes(value: unknown): (Record<string, unknown> & { transformerType: string })[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => transformerNodes(item));
  }
  if (typeof value !== "object" || value === null) {
    return [];
  }
  const node = isTransformerNode(value) ? [value] : [];
  return [
    ...node,
    ...Object.entries(value).flatMap(([key, child]) =>
      isSkippedKey(key) || (isTransformerNode(value) && value.transformerType === "returnValue" && key === "value")
        ? []
        : transformerNodes(child),
    ),
  ];
}

function assetJsonFiles(): string[] {
  const files: string[] = [];
  const visit = (directory: string) => {
    for (const entry of readdirSync(directory).sort()) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
        visit(path);
      } else if (entry.endsWith(".json")) {
        files.push(path);
      }
    }
  };
  for (const pkg of readdirSync(PACKAGES).sort()) {
    const assets = join(PACKAGES, pkg, "assets");
    try {
      if (statSync(assets).isDirectory()) {
        visit(assets);
      }
    } catch {
      // a package without assets
    }
  }
  return files;
}

const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const COMPOSITE_ACTION_SEQUENCE = "compositeActionSequence";

type SequenceRoot = { path: (string | number)[]; value: Record<string, unknown> };

function isSequence(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).actionType === COMPOSITE_ACTION_SEQUENCE
  );
}

/** The outermost composite action sequences of a JSON value, in document order. */
function sequenceRoots(value: unknown, path: (string | number)[] = []): SequenceRoot[] {
  if (isSequence(value)) {
    return [{ path, value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => sequenceRoots(item, [...path, index]));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, child]) =>
      isSkippedKey(key) ? [] : sequenceRoots(child, [...path, key]),
    );
  }
  return [];
}

/** The number of actions of a sequence: itself and its steps, nested sequences counted with their steps. */
function actionCount(sequence: Record<string, unknown>): number {
  const steps = (sequence.payload as { actionSequence?: unknown } | undefined)?.actionSequence;
  return (
    1 +
    (Array.isArray(steps) ? steps : []).reduce<number>(
      (count, step) => count + (isSequence(step) ? actionCount(step) : 1),
      0,
    )
  );
}

const files = assetJsonFiles().map((file) => ({
  file: relative(REPO_ROOT, file),
  json: JSON.parse(readFileSync(file, "utf-8")),
}));

const corpus = files
  .map((entry) => ({ file: entry.file, roots: transformerRoots(entry.json) }))
  .filter((entry) => entry.roots.length > 0);

const sequenceCorpus = files
  .map((entry) => ({ file: entry.file, roots: sequenceRoots(entry.json) }))
  .filter((entry) => entry.roots.length > 0);

/** Miroir's environment, with the Endpoints of every package's assets: the Library's included. */
const assetsModelEnvironment: MiroirModelEnvironment = {
  ...defaultMiroirModelEnvironment,
  endpointsByUuid: {
    ...defaultMiroirModelEnvironment.endpointsByUuid,
    ...Object.fromEntries(
      files
        .map((entry) => entry.json)
        .filter((json) => json?.parentUuid === ENDPOINT_ENTITY_UUID && typeof json.uuid === "string")
        .map((json) => [json.uuid, json]),
    ),
  },
};

describe.runIf(shouldRun)("transformerBlockModelAssets", () => {
  it("finds the transformers of the package assets", () => {
    const nodes = corpus.flatMap((entry) => entry.roots.flatMap((root) => transformerNodes(root.value)));
    const interpolation = nodes.reduce<Record<string, number>>((counts, node) => {
      const key = typeof node.interpolation === "string" ? node.interpolation : "<absent>";
      return { ...counts, [key]: (counts[key] ?? 0) + 1 };
    }, {});
    console.log(
      "transformerBlockModelAssets:",
      JSON.stringify({
        files: corpus.length,
        roots: corpus.reduce((count, entry) => count + entry.roots.length, 0),
        nodes: nodes.length,
        types: new Set(nodes.map((node) => node.transformerType)).size,
        interpolation,
      }),
    );
    expect(corpus.length).toBeGreaterThan(0);
  });

  it.each(corpus.map((entry) => [entry.file, entry.roots] as const))(
    "%s: every transformer type has a TransformerDefinition",
    (_file, roots) => {
      const unknownTypes = roots
        .flatMap((root) => transformerNodes(root.value))
        .map((node) => node.transformerType)
        .filter((transformerType) => !applicationTransformerDefinitions[transformerType]);
      expect(unknownTypes).toEqual([]);
    },
  );

  it.each(corpus.map((entry) => [entry.file, entry.roots] as const))(
    "%s: every transformer maps to a block, none to JSON",
    (_file, roots) => {
      const mapped = roots.map((root) => {
        const tree = transformerBlockTree(root.value);
        return {
          path: root.path.join("."),
          nodes: transformerNodes(root.value).length,
          transformerBlocks: tree.stats.transformerBlocks,
          jsonBlocks: tree.stats.jsonBlocks,
        };
      });
      expect(mapped.filter((root) => root.jsonBlocks > 0 || root.transformerBlocks !== root.nodes)).toEqual([]);
    },
  );

  it("finds the composite action sequences of the package assets", () => {
    console.log(
      "transformerBlockModelAssets:",
      JSON.stringify({
        sequenceFiles: sequenceCorpus.length,
        sequences: sequenceCorpus.reduce((count, entry) => count + entry.roots.length, 0),
        actions: sequenceCorpus.reduce(
          (count, entry) => count + entry.roots.reduce((sum, root) => sum + actionCount(root.value), 0),
          0,
        ),
      }),
    );
    expect(sequenceCorpus.length).toBeGreaterThan(0);
  });

  it.each(sequenceCorpus.map((entry) => [entry.file, entry.roots] as const))(
    "%s: every action of every sequence maps to a command block, none to JSON",
    (_file, roots) => {
      const mapped = roots.map((root) => {
        const tree = blockTree(root.value, { modelEnvironment: assetsModelEnvironment });
        return {
          path: root.path.join("."),
          actions: actionCount(root.value),
          actionBlocks: tree.stats.actionBlocks,
          jsonBlocks: tree.stats.jsonBlocks,
        };
      });
      expect(mapped.filter((root) => root.jsonBlocks > 0 || root.actionBlocks !== root.actions)).toEqual([]);
    },
  );

  it("every block category has a color in the default Theme", () => {
    const categoryColors: Record<string, string> =
      JSON.parse(readFileSync(DEFAULT_THEME, "utf-8")).definition.components?.blockEditor?.categoryColors ?? {};
    const corpusCategories = corpus.flatMap((entry) =>
      entry.roots.flatMap((root) => transformerBlockTree(root.value).stats.categories),
    );
    const definitionCategories = Object.values(applicationTransformerDefinitions).map(
      (definition) => definition.classification ?? "unknown",
    );
    const withoutColor = [...new Set([...corpusCategories, ...definitionCategories])]
      .filter((category) => !categoryColors[category])
      .sort();
    console.log("transformerBlockModelAssets: categories without a Theme color:", JSON.stringify(withoutColor));
    expect(withoutColor).toEqual([]);
  });
});

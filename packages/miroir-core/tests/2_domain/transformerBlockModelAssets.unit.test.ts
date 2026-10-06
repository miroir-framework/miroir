import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { transformerBlockTree } from "../../src/2_domain/TransformerBlockModel";
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
// ################################################################################################

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "transformerBlockModelAssets" ||
  RUN_TEST === "transformerBlockModelAssets.unit.test";

const REPO_ROOT = join(import.meta.dirname, "../../../..");
const PACKAGES = join(REPO_ROOT, "packages");

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

const corpus = assetJsonFiles()
  .map((file) => ({
    file: relative(REPO_ROOT, file),
    roots: transformerRoots(JSON.parse(readFileSync(file, "utf-8"))),
  }))
  .filter((entry) => entry.roots.length > 0);

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
});

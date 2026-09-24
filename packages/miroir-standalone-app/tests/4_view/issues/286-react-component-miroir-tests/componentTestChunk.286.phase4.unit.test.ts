/**
 * Issue #286 Slice 4: bundle guard for the component test chunk (analysis §5.9, plan §4.3).
 *
 * Not a RED test and not in nonreg: it reads the production build, so it runs after
 * `npm run build -w miroir-standalone-app` (the build writes `dist/.vite/manifest.json` because
 * `build.manifest` is `true` in `vite.config.js`, and one `.map` per chunk because `sourcemap` is
 * `true`).
 *
 * - The chunks that the `index.html` entry loads statically (the `imports` closure in the
 *   manifest) have no source under `node_modules/@testing-library/`.
 * - The chunks that the `componentTests/index.ts` dynamic import adds to them have no source under
 *   `node_modules/@testing-library/react/` and no `routes/TransformerBuilderPage`, and they do hold
 *   `@testing-library/dom` and `@testing-library/user-event` (so the guard is not vacuous).
 *
 * Run:
 * ```bash
 * npm run build -w miroir-standalone-app
 * npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4
 * ```
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

type ManifestChunk = {
  file: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
};
type Manifest = Record<string, ManifestChunk>;

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const distDirectory = join(packageRoot, "dist");
const manifestPath = join(distDirectory, ".vite", "manifest.json");
const srcDirectory = join(packageRoot, "src");
const componentTestEntryKey = "miroir-fwk/4-tests/componentTests/index.ts";
const buildFirstMessage = "run `npm run build -w miroir-standalone-app` first";

function newestModificationTime(directory: string): { time: number; path: string } {
  let newest = { time: 0, path: directory };
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    const candidate = entry.isDirectory()
      ? newestModificationTime(entryPath)
      : { time: statSync(entryPath).mtimeMs, path: entryPath };
    if (candidate.time > newest.time) {
      newest = candidate;
    }
  }
  return newest;
}

/** Reads the manifest, or throws the "build first" message when it is missing or stale. */
function readBuildManifest(): Manifest {
  if (!existsSync(manifestPath)) {
    throw new Error(`${manifestPath} is missing: ${buildFirstMessage}`);
  }
  const manifestTime = statSync(manifestPath).mtimeMs;
  const newestSource = newestModificationTime(srcDirectory);
  if (newestSource.time > manifestTime) {
    throw new Error(
      `${manifestPath} is older than ${newestSource.path} (the build is stale): ${buildFirstMessage}`,
    );
  }
  return JSON.parse(readFileSync(manifestPath, "utf-8"));
}

/** Manifest keys of `key` and of every chunk it imports statically, transitively. */
function staticImportClosure(manifest: Manifest, key: string): Set<string> {
  const closure = new Set<string>();
  const pending = [key];
  while (pending.length > 0) {
    const current = pending.pop()!;
    if (closure.has(current)) {
      continue;
    }
    const chunk = manifest[current];
    if (!chunk) {
      throw new Error(`manifest has no chunk "${current}"`);
    }
    closure.add(current);
    pending.push(...(chunk.imports ?? []));
  }
  return closure;
}

/** Source paths of a chunk from its sourcemap, normalized to forward slashes. */
function chunkSources(manifest: Manifest, key: string): string[] {
  const chunkFile = join(distDirectory, manifest[key].file);
  const mapFile = `${chunkFile}.map`;
  if (!existsSync(mapFile)) {
    throw new Error(`sourcemap ${mapFile} is missing (build.sourcemap must be true): ${buildFirstMessage}`);
  }
  const map = JSON.parse(readFileSync(mapFile, "utf-8")) as { sources: string[] };
  return map.sources.map((source) => resolve(dirname(mapFile), source).replace(/\\/g, "/"));
}

function sourcesMatching(manifest: Manifest, keys: Iterable<string>, pattern: string): string[] {
  const matches: string[] = [];
  for (const key of keys) {
    for (const source of chunkSources(manifest, key)) {
      if (source.includes(pattern)) {
        matches.push(`${manifest[key].file}: ${source}`);
      }
    }
  }
  return matches;
}

// ################################################################################################
describe("component test chunk bundle guard", () => {
  const manifest = readBuildManifest();
  const entryKeys = Object.keys(manifest).filter((key) => manifest[key].isEntry);
  const entryClosure = new Set(entryKeys.flatMap((key) => [...staticImportClosure(manifest, key)]));

  it("the index.html entry is the only entry", () => {
    expect(entryKeys).toEqual(["index.html"]);
  });

  it("no chunk loaded statically by the entry has a source under node_modules/@testing-library/", () => {
    expect(sourcesMatching(manifest, entryClosure, "node_modules/@testing-library/")).toEqual([]);
  });

  it("componentTests/index.ts is a dynamic entry of its own", () => {
    expect(manifest[componentTestEntryKey], `manifest key ${componentTestEntryKey}`).toBeDefined();
    expect(manifest[componentTestEntryKey].isDynamicEntry).toBe(true);
    expect(entryClosure.has(componentTestEntryKey)).toBe(false);
  });

  it("the chunks the component test import() adds hold @testing-library/dom and user-event, not @testing-library/react or TransformerBuilderPage", () => {
    const addedKeys = [...staticImportClosure(manifest, componentTestEntryKey)].filter(
      (key) => !entryClosure.has(key),
    );
    expect(sourcesMatching(manifest, addedKeys, "node_modules/@testing-library/react/")).toEqual([]);
    expect(sourcesMatching(manifest, addedKeys, "routes/TransformerBuilderPage")).toEqual([]);
    expect(sourcesMatching(manifest, addedKeys, "node_modules/@testing-library/dom/").length).toBeGreaterThan(0);
    expect(
      sourcesMatching(manifest, addedKeys, "node_modules/@testing-library/user-event/").length,
    ).toBeGreaterThan(0);
    expect(sourcesMatching(manifest, addedKeys, "componentTests/jzodElementEditor/JzodArrayEditor").length).toBe(1);
  });
});

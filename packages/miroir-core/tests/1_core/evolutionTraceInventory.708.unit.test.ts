/**
 * #708: inventory of the files that name the old evolution traces.
 *
 * The old traces are the `ApplicationEvolutionTrace` and `ApplicationEvolutionTraceEvent` Entities
 * (`de089f57-…`, `f4c2b3a1-…`) and the `MIROIR_EVOLUTION_TRACE` switch. #708 replaces them with
 * `EvolutionTraceRecord`. This guard locks the list of files that name them, so each removal
 * shows in the diff; when they are gone, only the frozen `EntityVersion` rows of Miroir's
 * `modelVersion` keep naming them.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("evolutionTraceInventory");

const REPO_ROOT = join(import.meta.dirname, "../../../..");

const OLD_TRACE_TERMS = [
  "de089f57-5fa5-4c0e-a43e-20f1a6df5a37",
  "f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c",
  "ApplicationEvolutionTrace",
  "MIROIR_EVOLUTION_TRACE",
];

const SCANNED_ROOTS = ["packages", "docs", "scripts", "environments", ".github", "AGENTS.md"];
const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist", "release", "build", ".vite", "coverage", "preprocessor-generated"]);
const SCANNED_EXTENSIONS = [".ts", ".tsx", ".json", ".md", ".py", ".yml", ".mjs"];
/** This file names the terms on purpose. */
const SELF = "packages/miroir-core/tests/1_core/evolutionTraceInventory.708.unit.test.ts";

function filesNamingOldTraces(): string[] {
  const found: string[] = [];
  const visit = (path: string) => {
    const stats = statSync(path, { throwIfNoEntry: false });
    if (!stats) return;
    if (stats.isDirectory()) {
      for (const name of readdirSync(path)) {
        if (SKIPPED_DIRECTORIES.has(name) || name.startsWith(".miroir")) continue;
        visit(join(path, name));
      }
      return;
    }
    if (!SCANNED_EXTENSIONS.some((extension) => path.endsWith(extension))) return;
    const text = readFileSync(path, "utf8");
    if (OLD_TRACE_TERMS.some((term) => text.includes(term))) {
      found.push(relative(REPO_ROOT, path).split("\\").join("/"));
    }
  };
  for (const root of SCANNED_ROOTS) visit(join(REPO_ROOT, root));
  return found.filter((file) => file !== SELF).sort();
}

/** Files that name the old traces today. Each slice that removes a use removes its line. */
const EXPECTED_FILES = [
  "docs/internals/code-splitting.md",
  "docs/reference/versioning.md",
  "packages/miroir-app-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/20e86585-e18f-4995-a141-486369acd4f8.json",
  "packages/miroir-app-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/45491bf9-a923-4a9c-a0da-6b0c3df2f296.json",
];

describe.runIf(runThis)("evolutionTraceInventory (#708)", () => {
  it("lists the files that name the old evolution traces", () => {
    expect(filesNamingOldTraces()).toEqual(EXPECTED_FILES);
  });
});

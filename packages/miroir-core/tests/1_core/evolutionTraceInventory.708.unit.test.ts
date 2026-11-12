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
  "docs/reference/testing.md",
  "docs/reference/versioning.md",
  "packages/miroir-app-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/230467a6-ecc3-4945-bd05-5d9e826c44fb.json",
  "packages/miroir-app-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/b2c3d4e5-f6a7-4890-b123-4567890abcde.json",
  "packages/miroir-app-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c4d5e6f7-a8b9-4c01-a345-67890abcdef1.json",
  "packages/miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/2427ef3a-3cd1-4b87-afe7-433bb04b25d2.json",
  "packages/miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/ce3f9603-824e-41da-9c6c-27ace3b01678.json",
  "packages/miroir-app-miroir/assets/miroir_data/de089f57-5fa5-4c0e-a43e-20f1a6df5a37/ea4b571f-f4b6-4ada-abd4-a3dbeb3e5138.json",
  "packages/miroir-app-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/de089f57-5fa5-4c0e-a43e-20f1a6df5a37.json",
  "packages/miroir-app-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c.json",
  "packages/miroir-app-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/20e86585-e18f-4995-a141-486369acd4f8.json",
  "packages/miroir-app-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/45491bf9-a923-4a9c-a0da-6b0c3df2f296.json",
  "packages/miroir-app-miroir/index.d.ts",
  "packages/miroir-app-miroir/index.ts",
  "packages/miroir-app-miroir/src/Model.ts",
  "packages/miroir-core/scripts/generate-ts-types.ts",
  "packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts",
  "packages/miroir-core/src/1_core/Deployment.ts",
  "packages/miroir-core/src/2_domain/evolutionTraceBaseline.ts",
  "packages/miroir-core/src/2_domain/evolutionTracePolicy.ts",
  "packages/miroir-core/src/5_tests/miroirTestRequirements.ts",
  "packages/miroir-core/src/index.ts",
  "packages/miroir-core/tests/1_core/reduxSerializable.unit.test.ts",
  "packages/miroir-core/tests/1_core/versioningSurface.unit.test.ts",
  "packages/miroir-core/tests/2_domain/evolutionTrace.baseline.unit.test.ts",
  "packages/miroir-core/tests/2_domain/evolutionTrace.reports.unit.test.ts",
  "packages/miroir-core/tests/2_domain/evolutionTrace.schema.unit.test.ts",
  "packages/miroir-core/tests/2_domain/evolutionTracePolicy.unit.test.ts",
  "packages/miroir-core/tests/5-tests/issues/575-run-miroirtest/runMiroirTestAction.unit.test.ts",
  "packages/miroir-core/tests/5-tests/miroirTestRequirements.unit.test.ts",
  "packages/miroir-react/src/components/TransformerEditor/EntityInstanceSelectorPanel.tsx",
  "packages/miroir-standalone-app/tests/3_controllers/versioning/evolutionTraceWriters.integ.test.ts",
  "packages/miroir-standalone-app/tests/3_controllers/versioning/versioningLazyTraces.integ.test.ts",
  "packages/miroir-standalone-app/tests/4_view/selfTest/runSelfTestInteg.integ.test.ts",
  "packages/miroir-versioning/src/evolutionTraceCompaction.ts",
  "packages/miroir-versioning/src/evolutionTraceRuntime.ts",
  "packages/miroir-versioning/src/evolutionTraceWriter.ts",
  "packages/miroir-versioning/tests/evolutionTrace.compaction.unit.test.ts",
  "packages/miroir-versioning/tests/evolutionTrace.persist.unit.test.ts",
  "packages/miroir-versioning/tests/evolutionTrace.policy.unit.test.ts",
  "packages/miroir-versioning/tests/evolutionTrace.runtime.unit.test.ts",
  "scripts/nonreg-manifest.json",
];

describe.runIf(runThis)("evolutionTraceInventory (#708)", () => {
  it("lists the files that name the old evolution traces", () => {
    expect(filesNamingOldTraces()).toEqual(EXPECTED_FILES);
  });
});

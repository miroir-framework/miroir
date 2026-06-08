#!/usr/bin/env node
/**
 * Phase 0 — scan packages/miroir-core/tests and emit catalog.json
 *
 * Usage (from repo root):
 *   node "code-helpers/features/195-FEATURE- enable execution of miroir-core unit tests in UI/generate-unit-test-catalog.mjs"
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, posix } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const REPO_ROOT = join(__dirname, "..", "..", "..");
const TESTS_ROOT = join(REPO_ROOT, "packages", "miroir-core", "tests");
const OUTPUT_PATH = join(__dirname, "catalog.json");

/** @typedef {'A'|'A+G'|'B'|'C'|'D'|'E'|'F'|'—'} TestClass */

/** @type {Record<string, { class: TestClass, unitTestKind: string|null, vitestOnly: boolean, priority: string, notes?: string, exclude?: boolean }>} */
const FILE_METADATA = {
  "2_domain/transformers.unit.test.ts": {
    class: "A",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "done",
    notes: "RUN_TEST=transformers.unit.test; entity transformerTest_miroirCoreTransformers",
  },
  "2_domain/adminTransformers.unit.test.ts": {
    class: "A",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "done",
    notes: "entity transformerTest_adminTransformers",
  },
  "1_core/jzod/jzodTypeCheck.test.ts": {
    class: "A",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "done",
    notes: "entity transformerTestSuite_jzodTypeCheck",
  },
  "1_core/jzod/resolveConditionalSchema.test.ts": {
    class: "A",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "done",
    notes: "entity transformerTest_resolveConditionalSchema; dedicated UI report",
  },
  "1_core/jzod/unfoldSchemaOnce.test.ts": {
    class: "A",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "done",
  },
  "1_core/defaultValueForJzodSchema.unit.test.ts": {
    class: "A",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "done",
  },
  "1_core/jzod/resolveSchemaReferenceInContext.test.ts": {
    class: "A",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "done",
  },
  "2_domain/menu.unit.test.ts": {
    class: "A",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "migrate to store",
    notes: "inline TransformerTestSuite; not yet a store instance",
  },
  "4_services/transformers.integ.test.ts": {
    class: "A+G",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "done (integration)",
    notes: "runTransformerIntegrationTest + Postgres",
  },
  "1_core/mustache.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "pilot",
  },
  "1_core/jzod/jzodToJsonSchema.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "pilot",
  },
  "1_core/EntityPrimaryKey.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "high",
  },
  "1_core/alterObject.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "high",
  },
  "1_core/jzod/jzod.typeCheckToFail.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "medium",
    notes: "candidate migration to transformerTest via jzodTypeCheck",
  },
  "1_core/jzod/jzod.typeCheckToPass.unit.test.ts": {
    class: "A",
    unitTestKind: "transformerTest",
    vitestOnly: false,
    priority: "deprecate file",
    notes: "target: migrate to jzodTypeCheck transformer entity; 12k-line file",
  },
  "tools.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "medium",
  },
  "1_core/blobUtils.unit.test.ts": {
    class: "E",
    unitTestKind: null,
    vitestOnly: true,
    priority: "vitest-only",
    notes: "FileReader mock in beforeAll, async blob I/O",
  },
  "2_domain/queries.unit.test.ts": {
    class: "C",
    unitTestKind: "queryRunnerTest",
    vitestOnly: false,
    priority: "high",
    notes: "testExtractorParams table-driven; domainState.json fixture",
  },
  "2_domain/resolveQueryTemplates.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "medium",
  },
  "2_domain/domainStateToDeploymentEntityState.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "medium",
  },
  "2_domain/modelUpdates.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "low",
  },
  "2_domain/resolveCompositeActionTemplate.unit.test.ts": {
    class: "D",
    unitTestKind: "compositeActionTest",
    vitestOnly: false,
    priority: "medium",
  },
  "2_domain/transformer_tools.transformerInterfaceFromDefinition.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "low",
  },
  "2_domain/transformer_tools.substituteTranformerReferencesInJzodElement.unit.test.ts": {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "low",
  },
  "3_controllers/TestTracker.unit.test.ts": {
    class: "E",
    unitTestKind: null,
    vitestOnly: true,
    priority: "vitest-only",
  },
  "3_controllers/MiroirEventTracker.unit.test.ts": {
    class: "E",
    unitTestKind: null,
    vitestOnly: true,
    priority: "vitest-only",
  },
  "3_controllers/RunActionTracker.unit.test.ts": {
    class: "E",
    unitTestKind: null,
    vitestOnly: true,
    priority: "vitest-only",
  },
  "4_views/ViewParams.integ.test.ts": {
    class: "E",
    unitTestKind: null,
    vitestOnly: true,
    priority: "vitest-only",
    notes: "misnamed .integ — pure class state tests",
  },
  "1_core/zodParseError.test.ts": {
    class: "F",
    unitTestKind: null,
    vitestOnly: true,
    priority: "vitest-only",
  },
  "1_core/zodParseCheckMiroirTransformerDefinitions.test.ts": {
    class: "F",
    unitTestKind: null,
    vitestOnly: true,
    priority: "vitest-only",
  },
  "1_core/zodParseActions.test.ts": {
    class: "F",
    unitTestKind: null,
    vitestOnly: true,
    priority: "vitest-only",
    notes: "TypeScript compile-time type assignment checks",
  },
  "experiments/discriminatedOpt-inUnions.test.ts": {
    class: "—",
    unitTestKind: null,
    vitestOnly: true,
    priority: "exclude",
    exclude: true,
    notes: "exploratory; not production",
  },
  "1_core/jzod/jzod.resolveReferenceInContext.OLD.unit.test.ts": {
    class: "—",
    unitTestKind: null,
    vitestOnly: true,
    priority: "delete",
    exclude: true,
    notes: "superseded; do not migrate",
  },
};

/** Default class B for unlisted jzod utility files under 1_core/jzod/ */
function defaultMetadata(relativePath) {
  if (relativePath.startsWith("experiments/")) {
    return {
      class: "—",
      unitTestKind: null,
      vitestOnly: true,
      priority: "exclude",
      exclude: true,
      notes: "experiments folder",
    };
  }
  if (relativePath.startsWith("1_core/jzod/")) {
    return {
      class: "B",
      unitTestKind: "functionCallTest",
      vitestOnly: false,
      priority: "medium",
      notes: "jzod utility; default Class B",
    };
  }
  return {
    class: "B",
    unitTestKind: "functionCallTest",
    vitestOnly: false,
    priority: "medium",
    notes: "unlisted file; default Class B — review mapping",
  };
}

function walkTestFiles(dir, base = dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkTestFiles(full, base));
    } else if (/\.(unit\.)?test\.ts$/.test(entry)) {
      files.push(relative(base, full).split("\\").join("/"));
    }
  }
  return files.sort();
}

/** @param {string} content */
function extractDescribeSuites(content) {
  const suites = [];
  const re = /describe\s*(?:\.(?:only|skip|sequential))?\s*\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    suites.push(m[1]);
  }
  return suites;
}

/** @param {string} content */
function countDirectItTests(content) {
  const matches = content.match(/^\s*(?:it|test)\s*(?:\.(?:only|skip|todo|fails))?\s*\(/gm);
  return matches ? matches.length : 0;
}

/** @param {string} content */
function countItEach(content) {
  return (content.match(/\bit\.each\s*\(/g) ?? []).length;
}

/**
 * Estimate expanded case count from table-driven `const xxx = { key: {` patterns.
 * @param {string} content
 * @param {string} relativePath
 */
function estimateTableDrivenCases(content, relativePath) {
  /** @type {{ source: string, count: number }[]} */
  const sources = [];

  const namedTables = [
    "testExtractorParams",
    "tests",
    "testFormat",
  ];
  for (const name of namedTables) {
    const re = new RegExp(`const\\s+${name}\\s*(?::[^=]+)?=\\s*\\{`, "m");
    if (re.test(content)) {
      const start = content.search(re);
      const slice = content.slice(start);
      // Top-level keys only (2-space indent) — avoids counting nested object keys
      const keyCount = (slice.match(/^  ["'`][^"'`]+["'`]\s*:\s*\{/gm) ?? []).length;
      if (keyCount > 0) {
        sources.push({ source: name, count: keyCount });
      }
    }
  }

  // alterObject-style nested tests object inside it()
  const nestedTestsRe = /const\s+tests\s*:\s*\{[^}]+\}\s*=\s*\{/;
  if (nestedTestsRe.test(content) && !sources.some((s) => s.source === "tests")) {
    const m = content.match(/const\s+tests\s*:[^=]*=\s*\{([\s\S]*?)\n\s*\};/);
    if (m) {
      const keyCount = (m[1].match(/^\s+test\d+:/gm) ?? []).length;
      if (keyCount > 0) sources.push({ source: "tests (nested)", count: keyCount });
    }
  }

  return sources;
}

/** @param {string} content */
function detectExecutionPattern(content) {
  if (/runUnitTransformerTests/.test(content)) return "runUnitTransformerTests";
  if (/runTransformerTestSuite/.test(content) && !/runUnitTransformerTests/.test(content)) {
    return "runTransformerTestSuite";
  }
  if (/it\.each\s*\(\s*Object\.entries/.test(content)) return "vitest-it.each-table";
  if (/for\s*\(\s*const\s+test\s+of\s+Object\.entries/.test(content)) return "vitest-loop-table";
  return "vitest-standard";
}

/** @param {string} content */
function detectStoreEntityRefs(content) {
  const refs = new Set();
  const importRe = /transformerTest(?:Suite)?_(\w+)/g;
  let m;
  while ((m = importRe.exec(content)) !== null) {
    refs.add(`transformerTest_${m[1]}`);
  }
  const fromDeploymentRe = /from\s+["']miroir-test-app_deployment-miroir["']/g;
  if (fromDeploymentRe.test(content) && refs.size === 0) {
    refs.add("(deployment import — inspect manually)");
  }
  return [...refs];
}

/** @param {string} relativePath @param {string} content */
function analyzeFile(relativePath, content) {
  const meta = FILE_METADATA[relativePath] ?? defaultMetadata(relativePath);
  const suites = extractDescribeSuites(content);
  const directCaseCount = countDirectItTests(content);
  const itEachCount = countItEach(content);
  const tableSources = estimateTableDrivenCases(content, relativePath);
  const tableCaseCount = tableSources.reduce((sum, s) => sum + s.count, 0);

  const entityBacked = /await runUnitTransformerTests/.test(content);

  let caseCount = directCaseCount;
  let caseCountMethod = "direct-it-test-count";
  let caseCountNote = null;
  if (entityBacked) {
    caseCount = null;
    caseCountMethod = "entity-backed";
    caseCountNote =
      "Test cases live in TransformerTestDefinition store JSON, not as vitest it() blocks in this file";
  } else if (itEachCount > 0 && tableCaseCount > 0) {
    caseCount = tableCaseCount;
    caseCountMethod = `it.each expanded (${tableSources.map((s) => `${s.source}=${s.count}`).join(", ")})`;
  } else if (directCaseCount === 0 && tableCaseCount > 0) {
    caseCount = tableCaseCount;
    caseCountMethod = `table-keys (${tableSources.map((s) => s.source).join(", ")})`;
  }

  const usesRunTestEnv = /RUN_TEST\s*[=!]/.test(content);
  const runTestSuiteName =
    content.match(/const\s+testSuiteName\s*=\s*["'`]([^"'`]+)["'`]/)?.[1] ??
    content.match(/const\s+testSuiteName\s*=\s*transformerTestSuite_\w+\.definition\.transformerTestLabel/)?.[0] ??
    null;

  return {
    file: relativePath,
    suite: suites[0] ?? relativePath.replace(/\.(unit\.)?test\.ts$/, ""),
    suites,
    label: suites[0] ?? relativePath,
    class: meta.class,
    unitTestKind: meta.unitTestKind,
    vitestOnly: meta.vitestOnly,
    exclude: meta.exclude ?? false,
    priority: meta.priority,
    notes: meta.notes ?? null,
    caseCount,
    caseCountMethod,
    caseCountNote,
    entityBacked,
    directItCount: directCaseCount,
    itEachBlocks: itEachCount,
    tableDrivenSources: tableSources,
    executionPattern: detectExecutionPattern(content),
    usesRunUnitTransformerTests: /runUnitTransformerTests/.test(content),
    usesRunTestEnv,
    runTestSuiteName: typeof runTestSuiteName === "string" ? runTestSuiteName : null,
    storeEntityRefs: detectStoreEntityRefs(content),
  };
}

function renderCatalogMarkdown(catalog) {
  const included = catalog.files.filter((f) => !f.exclude);
  const lines = [
    "# Unit test catalog (Phase 0)",
    "",
    `Generated: ${catalog.generatedAt}`,
    "",
    "Regenerate:",
    "```bash",
    'node "code-helpers/features/195-FEATURE- enable execution of miroir-core unit tests in UI/generate-unit-test-catalog.mjs"',
    "```",
    "",
    "Machine-readable source: [`catalog.json`](./catalog.json)",
    "",
    "## Summary",
    "",
    "| Metric | Value |",
    "|--------|-------|",
    `| Total test files | ${catalog.summary.totalFiles} |`,
    `| Included in catalog | ${catalog.summary.includedFiles} |`,
    `| Excluded (experiments / deprecated) | ${catalog.summary.excludedFiles} |`,
    `| Vitest-only (Classes E, F) | ${catalog.summary.vitestOnlyFiles} |`,
    `| UI-migratable | ${catalog.summary.uiMigratableFiles} |`,
    `| Cases in vitest files (estimated) | ${catalog.summary.totalCaseCountInVitestFiles} |`,
    `| Entity-backed loader files (Class A) | ${catalog.summary.entityBackedFiles} |`,
    "",
    "> Entity-backed files load test cases from `TransformerTestDefinition` store JSON; case counts are not in the vitest file.",
    "",
    "## By class",
    "",
    "| Class | Kind | Files | Vitest cases | Entity-backed loaders |",
    "|-------|------|-------|--------------|----------------------|",
  ];

  for (const [cls, stats] of Object.entries(catalog.summary.byClass)) {
    const kind = catalog.classLegend[cls]?.name ?? cls;
    lines.push(
      `| ${cls} | ${kind} | ${stats.fileCount} | ${stats.caseCountInVitestFiles} | ${stats.entityBackedFiles} |`
    );
  }

  lines.push(
    "",
    "## By target `unitTestKind`",
    "",
    "| Kind | Files | Vitest cases | Entity-backed |",
    "|------|-------|--------------|---------------|"
  );
  for (const [kind, stats] of Object.entries(catalog.summary.byUnitTestKind)) {
    lines.push(`| ${kind} | ${stats.fileCount} | ${stats.caseCountInVitestFiles} | ${stats.entityBackedFiles} |`);
  }

  lines.push(
    "",
    "## File index",
    "",
    "| File | Class | Kind | Cases | Vitest only | Notes |",
    "|------|-------|------|-------|-------------|-------|"
  );
  for (const f of included) {
    const cases = f.entityBacked ? "*(entity)*" : String(f.caseCount ?? 0);
    lines.push(
      `| \`${f.file}\` | ${f.class} | ${f.unitTestKind ?? "—"} | ${cases} | ${f.vitestOnly ? "yes" : "no"} | ${f.notes ?? ""} |`
    );
  }

  const excluded = catalog.files.filter((f) => f.exclude);
  if (excluded.length > 0) {
    lines.push("", "## Excluded files", "");
    for (const f of excluded) {
      lines.push(`- \`${f.file}\` — ${f.notes ?? f.priority}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function main() {
  const files = walkTestFiles(TESTS_ROOT);
  /** @type {ReturnType<typeof analyzeFile>[]} */
  const entries = [];
  for (const rel of files) {
    const content = readFileSync(join(TESTS_ROOT, rel), "utf8");
    entries.push(analyzeFile(rel, content));
  }

  const included = entries.filter((e) => !e.exclude);
  const excluded = entries.filter((e) => e.exclude);

  const byClass = {};
  for (const e of included) {
    byClass[e.class] = byClass[e.class] ?? [];
    byClass[e.class].push(e.file);
  }

  const catalog = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    generator: "generate-unit-test-catalog.mjs",
    sourceRoot: "packages/miroir-core/tests",
    issue: "https://github.com/miroir-framework/miroir/issues/195",
    phase: 0,
    summary: {
      totalFiles: entries.length,
      includedFiles: included.length,
      excludedFiles: excluded.length,
      vitestOnlyFiles: included.filter((e) => e.vitestOnly).length,
      uiMigratableFiles: included.filter((e) => !e.vitestOnly).length,
      totalCaseCountInVitestFiles: included.reduce((s, e) => s + (e.caseCount ?? 0), 0),
      entityBackedFiles: included.filter((e) => e.entityBacked).length,
      byClass: Object.fromEntries(
        Object.entries(byClass).map(([k, v]) => [
          k,
          {
            fileCount: v.length,
            caseCountInVitestFiles: included
              .filter((e) => e.class === k)
              .reduce((s, e) => s + (e.caseCount ?? 0), 0),
            entityBackedFiles: included.filter((e) => e.class === k && e.entityBacked).length,
          },
        ])
      ),
      byUnitTestKind: Object.fromEntries(
        [...new Set(included.map((e) => e.unitTestKind).filter(Boolean))].map((kind) => [
          kind,
          {
            fileCount: included.filter((e) => e.unitTestKind === kind).length,
            caseCountInVitestFiles: included
              .filter((e) => e.unitTestKind === kind)
              .reduce((s, e) => s + (e.caseCount ?? 0), 0),
            entityBackedFiles: included.filter((e) => e.unitTestKind === kind && e.entityBacked).length,
          },
        ])
      ),
      transformerEntityBacked: included.filter((e) => e.usesRunUnitTransformerTests && e.storeEntityRefs.length > 0).length,
    },
    classLegend: {
      A: { name: "transformerTest", description: "Transformer build/runtime; already partially in store" },
      "A+G": { name: "transformerTest (integration)", description: "Transformer tests against Postgres" },
      B: { name: "functionCallTest", description: "Pure function input → expected output" },
      C: { name: "queryRunnerTest", description: "In-memory query/template runner + assertions" },
      D: { name: "compositeActionTest", description: "Composite action template resolution and execution" },
      E: { name: "statefulBehaviorTest", description: "Mocks, lifecycle, class state — vitestOnly" },
      F: { name: "schemaValidationTest", description: "Zod/TS compile-time — vitestOnly" },
      "—": { name: "excluded", description: "Experiments or deprecated; not in catalog scope" },
    },
    files: entries,
  };

  writeFileSync(OUTPUT_PATH, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  const mdPath = join(__dirname, "CATALOG.md");
  writeFileSync(mdPath, renderCatalogMarkdown(catalog), "utf8");
  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Wrote ${mdPath}`);
  console.log(
    `  ${catalog.summary.includedFiles} included files, ${catalog.summary.totalCaseCountInVitestFiles} vitest cases (est.), ${catalog.summary.entityBackedFiles} entity-backed loaders`
  );
  console.log(`  ${catalog.summary.vitestOnlyFiles} vitest-only, ${catalog.summary.uiMigratableFiles} UI-migratable`);
}

main();

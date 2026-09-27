/**
 * #316 Slice 0: characterization of the MiroirTest catalog before the rename.
 * Keyed on uuid, so it stays valid while names change.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { MiroirTestSuite } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { inferUiIntegrationRunnerSuiteKind } from "../../../../src/5_tests/applicationMiroirTestCatalog";
import {
  loadApplicationMiroirTestCatalog,
  resolveMonorepoRoot,
} from "../../../../src/5_tests/loadApplicationMiroirTestsFromFolders";
import { walkMiroirTestLeaves } from "../../../../src/5_tests/inferIntegrationSessionKind";

type RenameMapEntry = {
  uuid: string;
  deployment: string;
  kind: "fn" | "query" | "tr" | "action" | "runner" | "ui";
  oldName: string;
  newName: string;
};

const repoRoot = resolveMonorepoRoot();
const renameMap: RenameMapEntry[] = JSON.parse(
  readFileSync(
    join(repoRoot, "code-helpers/features/316-REFACTOR-miroirtest-naming/rename-map.json"),
    "utf-8",
  ),
);
const catalog = loadApplicationMiroirTestCatalog(repoRoot);
const catalogByUuid = new Map(catalog.map((entry) => [entry.instance.uuid, entry]));

/** Kind of a suite, from its leaf types (analysis D7). */
function kindFromLeaves(suite: MiroirTestSuite): RenameMapEntry["kind"] {
  const types = new Set(walkMiroirTestLeaves(suite).map((leaf) => leaf.miroirTestType));
  if (types.has("reactComponentTest")) return "ui";
  if (types.has("runnerTest")) return "runner";
  if (types.has("actionTest")) return "action";
  if (types.has("queryTest")) return "query";
  if (types.has("functionCallTest")) return "fn";
  return "tr";
}

describe("#316 phase 0: MiroirTest catalog characterization", () => {
  it("the catalog holds exactly the 66 instances of the rename map", () => {
    expect(catalog).toHaveLength(66);
    expect([...catalogByUuid.keys()].sort()).toEqual(renameMap.map((entry) => entry.uuid).sort());
  });

  it("new names are unique", () => {
    expect(new Set(renameMap.map((entry) => entry.newName)).size).toBe(renameMap.length);
  });

  it("each instance's leaf types give the kind of the rename map", () => {
    const mismatches = renameMap
      .map((entry) => ({
        uuid: entry.uuid,
        expected: entry.kind,
        actual: kindFromLeaves(catalogByUuid.get(entry.uuid)!.suiteDefinition),
      }))
      .filter((row) => row.expected !== row.actual);
    expect(mismatches).toEqual([]);
  });

  it("each new name starts with its kind", () => {
    const wrong = renameMap.filter((entry) => !entry.newName.startsWith(`${entry.kind}.`));
    expect(wrong).toEqual([]);
  });

  it("UI runner kinds: 8 DomainController suites, 7 runner suites, 3 action scenarios", () => {
    const expectedByKind = (predicate: (entry: RenameMapEntry) => boolean) =>
      renameMap.filter(predicate).map((entry) => entry.uuid).sort();
    const actualByKind = (kind: string) =>
      catalog
        .filter(
          (entry) =>
            inferUiIntegrationRunnerSuiteKind(entry.suiteDefinition, entry.suiteKey) === kind,
        )
        .map((entry) => entry.instance.uuid)
        .sort();

    expect(actualByKind("domainControllerTest")).toEqual(
      expectedByKind((entry) => entry.newName.startsWith("action.domainController.")),
    );
    expect(actualByKind("runnerTest")).toEqual(expectedByKind((entry) => entry.kind === "runner"));
    expect(actualByKind("actionTest")).toEqual(
      expectedByKind((entry) => entry.newName.startsWith("action.scenario.")),
    );
  });

  it("CLI launch kinds: 18 runner-integration, 1 mixed, 47 unit", () => {
    const count = (kind: string) => catalog.filter((entry) => entry.cliLaunchKind === kind).length;
    expect(count("runner-integration")).toBe(18);
    expect(count("mixed-unit-transformer")).toBe(1);
    expect(count("unit")).toBe(47);
  });
});

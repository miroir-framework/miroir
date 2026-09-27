/**
 * #316 Slice 0: characterization of the MiroirTest catalog before the rename.
 * Keyed on uuid, so it stays valid while names change.
 */
import { describe, expect, it } from "vitest";

import { inferUiIntegrationRunnerSuiteKind } from "../../../../src/5_tests/applicationMiroirTestCatalog";
import {
  loadApplicationMiroirTestCatalog,
  resolveMonorepoRoot,
} from "../../../../src/5_tests/loadApplicationMiroirTestsFromFolders";
import { kindFromLeaves, loadRenameMap, type RenameMapEntry } from "./miroirTestKind.316";

const repoRoot = resolveMonorepoRoot();
const renameMap = loadRenameMap(repoRoot);
const catalog = loadApplicationMiroirTestCatalog(repoRoot);
const catalogByUuid = new Map(catalog.map((entry) => [entry.instance.uuid, entry]));

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

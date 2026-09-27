/**
 * #316 Slice 1: `unit`, `integ`, `ui` mode tags, derived from what a suite can run.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  listCliUnitSuiteKeysFromFolders,
  loadApplicationMiroirTestCatalog,
  loadMiroirTestEntityFromFolders,
  resolveCliSuiteKeysFromCatalog,
  resolveMonorepoRoot,
} from "../../../../src/5_tests/loadApplicationMiroirTestsFromFolders";
import {
  getMiroirTestAllowedTags,
  getMiroirTestInstanceTags,
  MIROIR_TEST_MODE_TAGS,
  miroirTestSuiteModeTags,
} from "../../../../src/5_tests/miroirTestTags";

const repoRoot = resolveMonorepoRoot();
const catalog = loadApplicationMiroirTestCatalog(repoRoot);
const miroirTestEntityVersion = JSON.parse(
  readFileSync(
    join(
      repoRoot,
      "packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/51c647fe-07ec-411c-89cc-02689dc66d6a.json",
    ),
    "utf-8",
  ),
);

describe("#316 phase 1: mode tags", () => {
  it("the MiroirTest Entity allows unit, integ and ui, identically in its EntityVersion", () => {
    const allowed = getMiroirTestAllowedTags(loadMiroirTestEntityFromFolders(repoRoot));
    expect(allowed).toEqual(expect.arrayContaining([...MIROIR_TEST_MODE_TAGS]));
    expect(getMiroirTestAllowedTags(miroirTestEntityVersion)).toEqual(allowed);
  });

  it("mode tags follow the suite's capabilities: 9 ui, 39 unit, 19 integ", () => {
    const count = (tag: string) =>
      catalog.filter((entry) => miroirTestSuiteModeTags(entry.suiteDefinition).includes(tag as any))
        .length;
    expect(count("ui")).toBe(9);
    expect(count("unit")).toBe(39);
    expect(count("integ")).toBe(19);
  });

  it("every MiroirTest instance carries exactly its mode tags", () => {
    const wrong = catalog
      .map((entry) => ({
        name: entry.suiteKey,
        expected: miroirTestSuiteModeTags(entry.suiteDefinition),
        actual: getMiroirTestInstanceTags(entry.instance).filter((tag) =>
          (MIROIR_TEST_MODE_TAGS as readonly string[]).includes(tag),
        ),
      }))
      .filter((row) => row.expected.join(",") !== row.actual.join(","));
    expect(wrong).toEqual([]);
  });

  it("--tags ui selects the 9 component suites", () => {
    const selected = resolveCliSuiteKeysFromCatalog(
      [],
      listCliUnitSuiteKeysFromFolders(repoRoot),
      catalog,
      ["ui"],
    );
    expect(selected).toHaveLength(9);
  });
});

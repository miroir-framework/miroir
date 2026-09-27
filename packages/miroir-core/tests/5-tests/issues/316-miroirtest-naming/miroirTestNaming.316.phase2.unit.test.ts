/**
 * #316 Slice 2+: naming guards, on every MiroirTest instance.
 */
import { describe, expect, it } from "vitest";

import {
  loadApplicationMiroirTestCatalog,
  resolveMonorepoRoot,
} from "../../../../src/5_tests/loadApplicationMiroirTestsFromFolders";
import { kindFromLeaves } from "./miroirTestKind.316";

const checked = loadApplicationMiroirTestCatalog(resolveMonorepoRoot());

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

describe("#316 naming guards", () => {
  it("names use only letters, digits, '.', '_', '-'", () => {
    expect(checked.map((entry) => entry.suiteKey).filter((name) => !/^[A-Za-z0-9._-]+$/.test(name))).toEqual([]);
  });

  it("a name is its kind followed by camelCase segments", () => {
    const wrong = checked
      .filter((entry) => {
        const kind = kindFromLeaves(entry.suiteDefinition);
        return !new RegExp(`^${kind}(\\.[a-z][A-Za-z0-9]*)+$`).test(entry.suiteKey);
      })
      .map((entry) => entry.suiteKey);
    expect(wrong).toEqual([]);
  });

  it("the root miroirTestLabel equals the name", () => {
    expect(
      checked
        .filter((entry) => entry.suiteDefinition.miroirTestLabel !== entry.suiteKey)
        .map((entry) => `${entry.suiteKey} / ${entry.suiteDefinition.miroirTestLabel}`),
    ).toEqual([]);
  });

  it("a description is one sentence with no issue number, uuid or history", () => {
    const wrong = checked
      .filter((entry) => {
        const description = entry.instance.description ?? "";
        return (
          !description.endsWith(".") ||
          /\. [A-Z]/.test(description) ||
          /#\d|\b(Issue|Feature|Phase|Slice|Migrated)\b/.test(description) ||
          UUID.test(description)
        );
      })
      .map((entry) => `${entry.suiteKey}: ${entry.instance.description}`);
    expect(wrong).toEqual([]);
  });
});

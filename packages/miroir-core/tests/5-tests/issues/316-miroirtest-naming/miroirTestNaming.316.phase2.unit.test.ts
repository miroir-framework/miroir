/**
 * #316 Slice 2+: naming guards. Kinds still awaiting their rename are listed in
 * PENDING_KINDS; each rename slice removes its kinds.
 */
import { describe, expect, it } from "vitest";

import {
  loadApplicationMiroirTestCatalog,
  resolveMonorepoRoot,
} from "../../../../src/5_tests/loadApplicationMiroirTestsFromFolders";
import { kindFromLeaves, loadRenameMap, type MiroirTestKind } from "./miroirTestKind.316";

const PENDING_KINDS: MiroirTestKind[] = ["fn", "query", "tr", "action", "runner"];

const repoRoot = resolveMonorepoRoot();
const kindByUuid = new Map(loadRenameMap(repoRoot).map((entry) => [entry.uuid, entry.kind]));
const checked = loadApplicationMiroirTestCatalog(repoRoot).filter(
  (entry) => !PENDING_KINDS.includes(kindByUuid.get(entry.instance.uuid)!),
);

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

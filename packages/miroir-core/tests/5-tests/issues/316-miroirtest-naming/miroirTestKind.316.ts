/** #316: helpers shared by the issue-scoped naming tests. */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { MiroirTestSuite } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { walkMiroirTestLeaves } from "../../../../src/5_tests/inferIntegrationSessionKind";

export type MiroirTestKind = "fn" | "query" | "tr" | "action" | "runner" | "ui";

export type RenameMapEntry = {
  uuid: string;
  deployment: string;
  kind: MiroirTestKind;
  oldName: string;
  newName: string;
};

export function loadRenameMap(repoRoot: string): RenameMapEntry[] {
  return JSON.parse(
    readFileSync(
      join(repoRoot, "code-helpers/features/316-REFACTOR-miroirtest-naming/rename-map.json"),
      "utf-8",
    ),
  );
}

/** Kind of a suite, from its leaf types (analysis D7). */
export function kindFromLeaves(suite: MiroirTestSuite): MiroirTestKind {
  const types = new Set(walkMiroirTestLeaves(suite).map((leaf) => leaf.miroirTestType));
  if (types.has("reactComponentTest")) return "ui";
  if (types.has("runnerTest")) return "runner";
  if (types.has("actionTest")) return "action";
  if (types.has("queryTest")) return "query";
  if (types.has("functionCallTest")) return "fn";
  return "tr";
}

/**
 * #221 Slice 5 / Group E — Legitimate EntityVersion characterization lock.
 *
 * No migration in this slice. Documents that historical EntityVersion / freeze
 * remain history-only and must not be used as live Report schema.
 *
 * Out of scope (leave alone):
 * - Asset folder `54b9c72f-…` EntityVersion rows (persistence layout)
 * - Evolution-trace / Action op strings (`createEntityDefinition`, etc.)
 * - #216 freeze Action / Cross linking implementation
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  snapshotEntitiesAsHistoricalEntityVersions,
  type Entity,
  type EntityVersion,
} from "miroir-core";

const REPO_ROOT = join(import.meta.dirname, "../../../../../..");
const VIEW_ROOT = join(REPO_ROOT, "packages/miroir-standalone-app/src/miroir-fwk/4_view");

const FORBIDDEN_LIVE_SCHEMA_IMPORTS = [
  "applicationVersionFreeze",
  "snapshotEntitiesAsHistoricalEntityVersions",
  "ApplicationVersionCrossEntityVersion",
  "applicationVersionCrossEntityVersion",
] as const;

function listTsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && /\.(ts|tsx)$/.test(d.name))
    .map((d) => join(dir, d.name));
}

describe("221 Phase 5 — EntityVersion history ≠ live Report schema", () => {
  it("freeze snapshot mints historical EntityVersion uuid ≠ live Entity uuid", () => {
    const entity: Entity = {
      uuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "Book",
      parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
      parentName: "Entity",
      mlSchema: { type: "object", definition: { title: { type: "string" } } },
    };
    const [ev]: EntityVersion[] = snapshotEntitiesAsHistoricalEntityVersions([entity], {
      newUuid: () => "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
    expect(ev.uuid).not.toBe(entity.uuid);
    expect(ev.entityUuid).toBe(entity.uuid);
    expect(ev.parentName).toBe("EntityVersion");
    expect(ev.mlSchema).toEqual(entity.mlSchema);
  });

  it("Report components and object dialogs do not import freeze / Cross for schema", () => {
    const reportFiles = listTsxFiles(join(VIEW_ROOT, "components/Reports"));
    const dialogFiles = [
      join(VIEW_ROOT, "components/JsonObjectEditFormDialog.tsx"),
      join(VIEW_ROOT, "components/JsonObjectDeleteFormDialog.tsx"),
    ];
    for (const filePath of [...reportFiles, ...dialogFiles]) {
      const source = readFileSync(filePath, "utf8");
      for (const symbol of FORBIDDEN_LIVE_SCHEMA_IMPORTS) {
        expect(source, `${filePath} must not reference ${symbol}`).not.toContain(symbol);
      }
    }
  });
});

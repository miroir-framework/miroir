import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Phase 4 — #219 is model/display prep only; enforcement is #71.
 * Guard: no runtime allow/deny hooks for MiroirRight landed accidentally.
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const ENFORCEMENT_PATTERN =
  /checkMiroirRight|authorizeMiroir|hasMiroirAccess|evaluateMiroirRight/;

const SCAN_ROOTS = [
  join(REPO_ROOT, "packages/miroir-core/src"),
  join(REPO_ROOT, "packages/miroir-server/src"),
  join(REPO_ROOT, "packages/miroir-store-filesystem/src"),
  join(REPO_ROOT, "packages/miroir-store-indexedDb/src"),
  join(REPO_ROOT, "packages/miroir-store-postgres/src"),
  join(REPO_ROOT, "packages/miroir-store-mongodb/src"),
  join(REPO_ROOT, "packages/miroir-store-bundled/src"),
  join(REPO_ROOT, "packages/miroir-localcache-redux/src"),
  join(REPO_ROOT, "packages/miroir-localcache-zustand/src"),
];

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      collectSourceFiles(full, acc);
    } else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

describe("miroirUserRights.219.phase4 — no MiroirRight enforcement yet (#219 prep; #71 owns authz)", () => {
  it("has no checkMiroirRight / authorizeMiroir / hasMiroirAccess / evaluateMiroirRight symbols in core/server/stores", () => {
    const hits: { file: string; match: string }[] = [];
    for (const root of SCAN_ROOTS) {
      for (const file of collectSourceFiles(root)) {
        const text = readFileSync(file, "utf8");
        const match = text.match(ENFORCEMENT_PATTERN);
        if (match) {
          hits.push({ file, match: match[0] });
        }
      }
    }
    expect(hits).toEqual([]);
  });
});

/**
 * #273 Slice 8 — Versioning AppBar item follows browsed-app resolveVersioningMode.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { isVersioningAppBarItemVisible } from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilitiesVersioning.273.phase8" ||
  RUN_TEST.startsWith("processCapabilitiesVersioning.273");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

if (runThis) {
  describe("processCapabilitiesVersioning.273.phase8 — isVersioningAppBarItemVisible", () => {
    it("is false when there is no browsed SelfApplication", () => {
      expect(isVersioningAppBarItemVisible({ browsedSelfApplication: undefined })).toBe(false);
    });

    it("is false when the browsed application is unversioned", () => {
      expect(
        isVersioningAppBarItemVisible({
          browsedSelfApplication: { versioningMode: "unversioned" },
        }),
      ).toBe(false);
    });

    it("is false when the browsed application is versioned-external", () => {
      expect(
        isVersioningAppBarItemVisible({
          browsedSelfApplication: { versioningMode: "versioned-external" },
        }),
      ).toBe(false);
    });

    it("is true when the browsed application is versioned-internal", () => {
      expect(
        isVersioningAppBarItemVisible({
          browsedSelfApplication: { versioningMode: "versioned-internal" },
        }),
      ).toBe(true);
    });

    it("is true for legacy versioningEnabled: true with no mode", () => {
      expect(
        isVersioningAppBarItemVisible({
          browsedSelfApplication: { versioningEnabled: true },
        }),
      ).toBe(true);
    });

    it("is false when the browsed row has no versioning fields", () => {
      expect(isVersioningAppBarItemVisible({ browsedSelfApplication: {} })).toBe(false);
    });
  });

  describe("processCapabilitiesVersioning.273.phase8 — AppBar wiring", () => {
    it("AppBar filters Versioning with isVersioningAppBarItemVisible and still navigates via resolveAppBarReportLinkApplication", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx",
      );
      expect(src).toContain("isVersioningAppBarItemVisible");
      expect(src).toContain("resolveAppBarReportLinkApplication");
    });

    it("appBarReportNavigation still returns the item SelfApplication", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/appBarReportNavigation.ts",
      );
      expect(src).toContain("return params.itemSelfApplication");
    });
  });
}

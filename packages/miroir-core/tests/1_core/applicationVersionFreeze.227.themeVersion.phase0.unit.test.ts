/**
 * #227 Phase 0 — ThemeVersion freeze contracts.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  APPLICATION_VERSION_CROSS_THEME_VERSION_UUID,
  THEME_VERSION_ENTITY_UUID,
  snapshotThemesAsHistoricalThemeVersions,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const freezeSource = readFileSync(
  join(__dirname, "../../src/1_core/versioning/applicationVersionFreeze.ts"),
  "utf8",
);

describe("227 Phase 0 — ThemeVersion freeze contracts", () => {
  it("exports stable entity UUID constants", () => {
    expect(THEME_VERSION_ENTITY_UUID).toBe("a7b8c9d0-e1f2-4012-a3b4-c5d6e7f8a9c0");
    expect(APPLICATION_VERSION_CROSS_THEME_VERSION_UUID).toBe(
      "b8c9d0e1-f2a3-4123-a4b5-c6d7e8f9a0c1",
    );
  });

  it("exports snapshotThemesAsHistoricalThemeVersions", () => {
    expect(typeof snapshotThemesAsHistoricalThemeVersions).toBe("function");
  });

  it("FreezeApplicationVersionPlan includes ThemeVersion fields", () => {
    const source = freezeSource;
    expect(source).toMatch(/themeVersions:\s*ThemeVersionSnapshot\[\]/);
    expect(source).toMatch(/crossThemeVersions:\s*ApplicationVersionCrossThemeVersionRow\[\]/);
    expect(source).toMatch(/themeVersionApplicationSection:\s*ApplicationSection/);
  });
});

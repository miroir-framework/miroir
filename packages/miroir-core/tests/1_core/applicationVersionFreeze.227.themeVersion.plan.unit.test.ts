/**
 * #227 Phase 2 — ThemeVersion in freeze plan.
 */
import { describe, expect, it } from "vitest";

import { buildFreezeApplicationVersionPlan } from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

function sequentialUuid() {
  let n = 0;
  return () => {
    n += 1;
    return `dddddddd-dddd-4ddd-8ddd-${String(n).padStart(12, "0")}`;
  };
}

describe("227 Phase 2 — ThemeVersion freeze plan", () => {
  it("assembles ThemeVersions + Cross rows alongside Entity freeze", () => {
    const themes = [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "defaultMiroirTheme",
        defaultLabel: "Default Miroir Theme",
        definition: { id: "default", name: "Default Light", colors: { primary: "#7c67bcff" } },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "darkTheme",
        defaultLabel: "Dark Theme",
        definition: { id: "dark", name: "Dark", colors: { primary: "#111111" } },
      },
    ];
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-Themes",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      themes,
      newUuid: sequentialUuid(),
    });

    expect(plan.themeVersions).toHaveLength(2);
    expect(plan.crossThemeVersions).toHaveLength(2);
    const tvUuids = new Set(plan.themeVersions.map((tv) => tv.uuid));
    expect(tvUuids.size).toBe(2);
    for (const cross of plan.crossThemeVersions) {
      expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
      expect(tvUuids.has(cross.themeVersion)).toBe(true);
    }
  });

  it("omits ThemeVersion rows when themes is empty", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-NoThemes",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      themes: [],
      newUuid: sequentialUuid(),
    });
    expect(plan.themeVersions).toEqual([]);
    expect(plan.crossThemeVersions).toEqual([]);
  });
});

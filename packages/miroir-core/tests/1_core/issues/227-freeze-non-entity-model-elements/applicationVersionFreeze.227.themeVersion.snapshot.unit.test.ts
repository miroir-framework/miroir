/**
 * #227 Phase 1 — snapshotThemesAsHistoricalThemeVersions.
 */
import { describe, expect, it } from "vitest";

import {
  THEME_VERSION_ENTITY_UUID,
  snapshotThemesAsHistoricalThemeVersions,
  type StoredThemeForFreeze,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

function makeTheme(
  uuid: string,
  name: string,
  extra?: Partial<StoredThemeForFreeze>,
): StoredThemeForFreeze {
  return {
    uuid,
    name,
    defaultLabel: `${name} Label`,
    definition: {
      id: name.toLowerCase(),
      name: `${name} Theme`,
      colors: { primary: "#7c67bcff" },
    },
    description: `${name} description`,
    ...extra,
  };
}

describe("227 Phase 1 — snapshotThemesAsHistoricalThemeVersions", () => {
  const deterministic = (() => {
    let counter = 0;
    return () => `tttttttt-tttt-4ttt-8ttt-${String(++counter).padStart(12, "0")}`;
  })();

  it("produces ThemeVersion with new UUID ≠ live theme uuid", () => {
    const theme = makeTheme("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "defaultMiroirTheme");
    const [tv] = snapshotThemesAsHistoricalThemeVersions([theme], { newUuid: deterministic });
    expect(tv.uuid).not.toBe(theme.uuid);
  });

  it("sets themeUuid to live Theme.uuid", () => {
    const theme = makeTheme("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "darkTheme");
    const [tv] = snapshotThemesAsHistoricalThemeVersions([theme], { newUuid: deterministic });
    expect(tv.themeUuid).toBe(theme.uuid);
  });

  it("sets parentUuid/parentName to historical ThemeVersion entity", () => {
    const theme = makeTheme("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "compactTheme");
    const [tv] = snapshotThemesAsHistoricalThemeVersions([theme], { newUuid: deterministic });
    expect(tv.parentUuid).toBe(THEME_VERSION_ENTITY_UUID);
    expect(tv.parentName).toBe("ThemeVersion");
  });

  it("copies name, defaultLabel, description, definition", () => {
    const theme = makeTheme("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "materialTheme");
    const [tv] = snapshotThemesAsHistoricalThemeVersions([theme], { newUuid: deterministic });
    expect(tv.name).toBe("materialTheme");
    expect(tv.defaultLabel).toBe("materialTheme Label");
    expect(tv.description).toBe("materialTheme description");
    expect(tv.definition).toEqual(theme.definition);
  });

  it("deep isolation: mutating source definition after snapshot does not affect copy", () => {
    const theme = makeTheme("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "Mutable");
    const [tv] = snapshotThemesAsHistoricalThemeVersions([theme], { newUuid: deterministic });
    (theme.definition as { name?: string }).name = "mutated";
    expect((tv.definition as { name?: string }).name).toBe("Mutable Theme");
  });

  it("empty theme list produces empty result", () => {
    expect(snapshotThemesAsHistoricalThemeVersions([])).toEqual([]);
  });

  it("throws on Theme without definition", () => {
    const incomplete = {
      uuid: "11111111-1111-4111-8111-111111111111",
      name: "Incomplete",
      defaultLabel: "Incomplete",
    } as StoredThemeForFreeze;
    expect(() => snapshotThemesAsHistoricalThemeVersions([incomplete])).toThrow(/definition/);
  });
});

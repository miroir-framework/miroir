/**
 * #227 Phase 1 — snapshotMenusAsHistoricalMenuVersions.
 */
import { describe, expect, it } from "vitest";

import {
  MENU_VERSION_ENTITY_UUID,
  snapshotMenusAsHistoricalMenuVersions,
  type StoredMenuForFreeze,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";

function makeMenu(
  uuid: string,
  name: string,
  extra?: Partial<StoredMenuForFreeze>,
): StoredMenuForFreeze {
  return {
    uuid,
    name,
    defaultLabel: `${name} Label`,
    description: `${name} description`,
    definition: {
      menuType: "simpleMenu",
      definition: [
        {
          miroirMenuItemType: "miroirMenuReportLink",
          label: "Home",
          section: "model",
          selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        },
      ],
    },
    ...extra,
  };
}

describe("227 Phase 1 — snapshotMenusAsHistoricalMenuVersions", () => {
  const deterministic = (() => {
    let counter = 0;
    return () => `mmmmmmmm-mmmm-4mmm-8mmm-${String(++counter).padStart(12, "0")}`;
  })();

  it("produces MenuVersion with new UUID ≠ live menu uuid", () => {
    const menu = makeMenu("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "LibraryMenu");
    const [mv] = snapshotMenusAsHistoricalMenuVersions([menu], { newUuid: deterministic });
    expect(mv.uuid).not.toBe(menu.uuid);
  });

  it("sets menuUuid to live Menu.uuid", () => {
    const menu = makeMenu("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "AppMenu");
    const [mv] = snapshotMenusAsHistoricalMenuVersions([menu], { newUuid: deterministic });
    expect(mv.menuUuid).toBe(menu.uuid);
  });

  it("sets parentUuid/parentName to historical MenuVersion entity", () => {
    const menu = makeMenu("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "NavMenu");
    const [mv] = snapshotMenusAsHistoricalMenuVersions([menu], { newUuid: deterministic });
    expect(mv.parentUuid).toBe(MENU_VERSION_ENTITY_UUID);
    expect(mv.parentName).toBe("MenuVersion");
  });

  it("copies name, definition, defaultLabel, description from live Menu", () => {
    const menu = makeMenu("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "MainMenu");
    const [mv] = snapshotMenusAsHistoricalMenuVersions([menu], { newUuid: deterministic });
    expect(mv.name).toBe("MainMenu");
    expect(mv.definition).toEqual(menu.definition);
    expect(mv.defaultLabel).toBe("MainMenu Label");
    expect(mv.description).toBe("MainMenu description");
  });

  it("deep isolation: mutating source definition after snapshot does not affect copy", () => {
    const menu = makeMenu("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "Mutable");
    const [mv] = snapshotMenusAsHistoricalMenuVersions([menu], { newUuid: deterministic });
    (menu.definition as any).menuType = "complexMenu";
    expect((mv.definition as any).menuType).toBe("simpleMenu");
  });

  it("empty menu list produces empty result", () => {
    expect(snapshotMenusAsHistoricalMenuVersions([])).toEqual([]);
  });

  it("throws on Menu without definition", () => {
    const incomplete = {
      uuid: "11111111-1111-4111-8111-111111111111",
      name: "Incomplete",
    } as StoredMenuForFreeze;
    expect(() => snapshotMenusAsHistoricalMenuVersions([incomplete])).toThrow(/definition/);
  });
});

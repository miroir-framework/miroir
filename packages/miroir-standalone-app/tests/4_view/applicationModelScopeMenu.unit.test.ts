import { describe, expect, it } from "vitest";

import type { Menu, MiroirMenuItem } from "miroir-core";
import { adminSelfApplication } from "miroir-test-app_deployment-admin";
import {
  menuApplicationModelScopeTemplate,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import { selfApplicationLibrary } from "miroir-test-app_deployment-library";

import {
  isApplicationModelScopeInjectionActive,
  mergeApplicationModelScopeMenuItems,
  shouldShowAppMenuItem,
  type ApplicationModelScopeMenuItemContext,
} from "../../src/miroir-fwk/4_view/components/Page/applicationModelScopeMenu.js";

const APPLICATION_DETAILS_REPORT = "cd24df86-204c-4a72-9ac0-87f2b92f25fe";
const ENTITY_LIST_REPORT = "c9ea3359-690c-4620-9603-b5b402e4a2b9";
const MIROIR_PLACEHOLDER = selfApplicationMiroir.uuid;
const LIBRARY_UUID = selfApplicationLibrary.uuid;

function baseCtx(
  overrides: Partial<ApplicationModelScopeMenuItemContext> = {},
): ApplicationModelScopeMenuItemContext {
  return {
    generalEditMode: false,
    showModelTools: false,
    sectionApplicationUuid: LIBRARY_UUID,
    injectionActive: false,
    adminSelfApplicationUuid: adminSelfApplication.uuid,
    miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
    ...overrides,
  };
}

function reportLink(overrides: Partial<MiroirMenuItem> = {}): MiroirMenuItem {
  return {
    miroirMenuItemType: "miroirMenuReportLink",
    label: "Library Books",
    section: "data",
    selfApplication: LIBRARY_UUID,
    reportUuid: "74b010b6-afee-44e7-8590-5f0849e4a5c9",
    icon: "auto_stories",
    ...overrides,
  };
}

describe("mergeApplicationModelScopeMenuItems", () => {
  const template = menuApplicationModelScopeTemplate as Menu;

  it("rewrites selfApplication on every item for the target app", () => {
    const merged = mergeApplicationModelScopeMenuItems(template, LIBRARY_UUID);

    expect(merged).toHaveLength(9);
    for (const item of merged) {
      expect(item.selfApplication).toBe(LIBRARY_UUID);
    }
  });

  it("does not mutate the template menu", () => {
    const before = structuredClone(template);
    mergeApplicationModelScopeMenuItems(template, LIBRARY_UUID);
    expect(template).toEqual(before);
    expect(
      (template.definition as any).definition[0].items[0].selfApplication,
    ).toBe(MIROIR_PLACEHOLDER);
  });

  it("preserves canonical block shape, order, and generic labels", () => {
    const merged = mergeApplicationModelScopeMenuItems(template, LIBRARY_UUID);

    expect(merged.map((item) => item.label)).toEqual([
      "Application",
      "Entities",
      "Queries",
      "Reports",
      "Menus",
      "Endpoints",
      "Runners",
      "Tests",
      "Model-Data Divider",
    ]);

    const application = merged[0];
    expect(application.miroirMenuItemType).toBe("miroirMenuReportLink");
    expect(application.reportUuid).toBe(APPLICATION_DETAILS_REPORT);
    expect(application.instanceUuid).toBe(LIBRARY_UUID);

    const entities = merged[1];
    expect(entities.reportUuid).toBe(ENTITY_LIST_REPORT);
    expect(entities.label).toBe("Entities");
    expect(entities.menuItemScope).toBe("model");
    expect(entities.section).toBe("model");
    expect(entities.icon).toBe("category");

    const divider = merged[8];
    expect(divider.miroirMenuItemType).toBe("miroirMenuItemDivider");
    expect(divider.menuItemScope).toBe("model");
  });

  it("returns [] for invalid or empty templates without throwing", () => {
    expect(mergeApplicationModelScopeMenuItems({} as Menu, LIBRARY_UUID)).toEqual([]);
    expect(
      mergeApplicationModelScopeMenuItems(
        {
          definition: { menuType: "simpleMenu", definition: [] },
        } as Menu,
        LIBRARY_UUID,
      ),
    ).toEqual([]);
    expect(
      mergeApplicationModelScopeMenuItems(
        {
          definition: { menuType: "complexMenu", definition: [{ label: "x", items: [] }] },
        } as Menu,
        LIBRARY_UUID,
      ),
    ).toEqual([]);
  });
});

describe("isApplicationModelScopeInjectionActive", () => {
  it("is false when edit mode is off", () => {
    expect(isApplicationModelScopeInjectionActive(false, LIBRARY_UUID)).toBe(false);
    expect(isApplicationModelScopeInjectionActive(false, selfApplicationMiroir.uuid)).toBe(false);
  });

  it("is false for Miroir and Admin even in edit mode", () => {
    expect(isApplicationModelScopeInjectionActive(true, selfApplicationMiroir.uuid)).toBe(false);
    expect(isApplicationModelScopeInjectionActive(true, adminSelfApplication.uuid)).toBe(false);
  });

  it("is true for other apps in edit mode", () => {
    expect(isApplicationModelScopeInjectionActive(true, LIBRARY_UUID)).toBe(true);
  });
});

describe("shouldShowAppMenuItem", () => {
  it.each([
    {
      case: "data item, edit off",
      item: reportLink(),
      ctx: baseCtx(),
      expectShow: true,
    },
    {
      case: "model item, edit off",
      item: reportLink({ menuItemScope: "model", section: "model" }),
      ctx: baseCtx(),
      expectShow: false,
    },
    {
      case: "model item, edit on, Miroir item — hidden without showModelTools",
      item: reportLink({
        selfApplication: selfApplicationMiroir.uuid,
        menuItemScope: "model",
        section: "model",
      }),
      ctx: baseCtx({ generalEditMode: true, showModelTools: false }),
      expectShow: false,
    },
    {
      case: "model item, edit on, Miroir item — shown with showModelTools",
      item: reportLink({
        selfApplication: selfApplicationMiroir.uuid,
        menuItemScope: "model",
        section: "model",
      }),
      ctx: baseCtx({ generalEditMode: true, showModelTools: true }),
      expectShow: true,
    },
    {
      case: "model item, edit on, injection active — suppressed",
      item: reportLink({ menuItemScope: "model", section: "model" }),
      ctx: baseCtx({ generalEditMode: true, injectionActive: true }),
      expectShow: false,
    },
    {
      case: "data item, edit on, injection active",
      item: reportLink({ menuItemScope: "data", section: "data" }),
      ctx: baseCtx({ generalEditMode: true, injectionActive: true }),
      expectShow: true,
    },
    {
      case: "unscoped item, edit on, injection active",
      item: reportLink({ section: "data" }),
      ctx: baseCtx({ generalEditMode: true, injectionActive: true }),
      expectShow: true,
    },
    {
      case: "model item, edit on, injection off — legacy reveal",
      item: reportLink({ menuItemScope: "model", section: "model" }),
      ctx: baseCtx({ generalEditMode: true, injectionActive: false }),
      expectShow: true,
    },
  ])("$case", ({ item, ctx, expectShow }) => {
    expect(shouldShowAppMenuItem(item, ctx)).toBe(expectShow);
  });
});

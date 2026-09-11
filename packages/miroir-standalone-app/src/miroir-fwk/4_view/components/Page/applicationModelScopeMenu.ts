import type { Menu, MiroirMenuItem } from "miroir-core";
import { adminSelfApplication } from "miroir-test-app_deployment-admin";
import { selfApplicationMiroir } from "miroir-test-app_deployment-miroir";

const APPLICATION_DETAILS_REPORT_UUID = "cd24df86-204c-4a72-9ac0-87f2b92f25fe";

export type ApplicationModelScopeMenuItemContext = {
  generalEditMode: boolean;
  showModelTools: boolean;
  sectionApplicationUuid: string;
  injectionActive: boolean;
  adminSelfApplicationUuid: string;
  miroirSelfApplicationUuid: string;
};

/** True when edit mode is on and the app is not Miroir or Admin. */
export function isApplicationModelScopeInjectionActive(
  generalEditMode: boolean,
  applicationUuid: string,
): boolean {
  if (!generalEditMode) {
    return false;
  }
  return (
    applicationUuid !== adminSelfApplication.uuid &&
    applicationUuid !== selfApplicationMiroir.uuid
  );
}

function templateMenuItems(templateMenu: Menu): MiroirMenuItem[] | undefined {
  if (templateMenu.definition?.menuType !== "complexMenu") {
    return undefined;
  }
  const sections = templateMenu.definition.definition;
  if (!Array.isArray(sections) || sections.length === 0) {
    return undefined;
  }
  const items = sections[0]?.items;
  if (!Array.isArray(items) || items.length === 0) {
    return undefined;
  }
  return items;
}

/**
 * Resolve template menu items for a target application:
 * rewrite selfApplication (+ instanceUuid on Application link), preserve labels/report UUIDs.
 */
export function mergeApplicationModelScopeMenuItems(
  templateMenu: Menu,
  targetApplicationUuid: string,
): MiroirMenuItem[] {
  const sourceItems = templateMenuItems(templateMenu);
  if (!sourceItems) {
    return [];
  }

  return sourceItems.map((item) => {
    const cloned = structuredClone(item);
    if ("selfApplication" in cloned && cloned.selfApplication !== undefined) {
      cloned.selfApplication = targetApplicationUuid;
    }
    if (
      cloned.miroirMenuItemType === "miroirMenuReportLink" &&
      cloned.reportUuid === APPLICATION_DETAILS_REPORT_UUID &&
      "instanceUuid" in cloned
    ) {
      cloned.instanceUuid = targetApplicationUuid;
    }
    return cloned;
  });
}

/**
 * Whether an app-menu item should render given injection + existing Sidebar rules.
 * When injection is active, app items with menuItemScope === "model" are hidden even
 * though generalEditMode is on.
 */
export function shouldShowAppMenuItem(
  item: MiroirMenuItem,
  ctx: ApplicationModelScopeMenuItemContext,
): boolean {
  if (!("selfApplication" in item)) {
    return false;
  }

  const selfApplication = item.selfApplication;
  if (
    selfApplication === ctx.adminSelfApplicationUuid ||
    selfApplication === ctx.miroirSelfApplicationUuid
  ) {
    return ctx.showModelTools;
  }

  if (
    selfApplication !== ctx.adminSelfApplicationUuid &&
    selfApplication !== ctx.miroirSelfApplicationUuid
  ) {
    const scope = "menuItemScope" in item ? item.menuItemScope : undefined;
    if (!scope || scope === "data") {
      return true;
    }
    if (scope === "model") {
      if (ctx.injectionActive) {
        return false;
      }
      return ctx.generalEditMode;
    }
  }

  return false;
}

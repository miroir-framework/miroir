/**
 * #696: the designer entries that need the `versioning` process capability, hidden when it is off. The menu
 * Reports and the Runner are model data named here in code, as the AppBar item is; #712 replaces this list
 * with a visibility condition on the model elements themselves.
 */
import {
  isVersioningAppBarItemVisible,
  type MiroirMenuItem,
  type ProcessCapabilities,
  type VersioningModeInput,
} from "@miroir-framework/core";

/** Miroir menu items 1, 2 and 14: Entity versions, Application versions, evolution trace records (#708). */
export const VERSIONING_MENU_REPORT_UUIDS: readonly string[] = [
  "f9aff35d-8636-4519-8361-c7648e0ddc68",
  "0810de28-fdab-4baf-8935-7e04a8f779a9",
  "45735607-4711-45af-be04-4b4d36fa585c",
];

/** The freeze Runner, listed in the Miroir Runners report and in the Versioning report. */
export const VERSIONING_RUNNER_UUIDS: readonly string[] = ["20d51c4c-52e5-4077-baf3-5e87bd75e496"];

type VersioningSnapshot = Pick<ProcessCapabilities, "versioning">;

export function isMenuItemAllowedByVersioning(item: MiroirMenuItem, capabilities: VersioningSnapshot): boolean {
  if (capabilities.versioning === true) {
    return true;
  }
  return !(
    item.miroirMenuItemType === "miroirMenuReportLink" && VERSIONING_MENU_REPORT_UUIDS.includes(item.reportUuid ?? "")
  );
}

export function isRunnerAllowedByVersioning(runnerUuid: string, capabilities: VersioningSnapshot): boolean {
  return capabilities.versioning === true || !VERSIONING_RUNNER_UUIDS.includes(runnerUuid);
}

/** The AppBar Versioning item: the capability, then the browsed application's mode (D7). */
export function isVersioningAppBarItemShown(args: {
  browsedSelfApplication?: VersioningModeInput;
  capabilities: VersioningSnapshot;
}): boolean {
  return (
    args.capabilities.versioning === true &&
    isVersioningAppBarItemVisible({ browsedSelfApplication: args.browsedSelfApplication })
  );
}

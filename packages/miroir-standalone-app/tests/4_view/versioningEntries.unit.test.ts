/**
 * #696: with the `versioning` capability off, a designer sees no Versioning AppBar item, no
 * version or trace items in the Miroir menu and no freeze Runner. The predicates are those AppBar,
 * SidebarSection and RunnerView call; the uuids are checked against the Miroir model they name.
 * ```bash
 * RUN_TEST=versioningEntries npm run testByFile -w miroir-standalone-app -- versioningEntries
 * ```
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import type { MiroirMenuItem } from "@miroir-framework/core";
import {
  isMenuItemAllowedByVersioning,
  isRunnerAllowedByVersioning,
  isVersioningAppBarItemShown,
  VERSIONING_MENU_REPORT_UUIDS,
  VERSIONING_RUNNER_UUIDS,
} from "@miroir-framework/react";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("versioningEntries");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const MIROIR_DATA = join(REPO_ROOT, "packages/miroir-app-miroir/assets/miroir_data");
const MIROIR_MENU = join(MIROIR_DATA, "dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json");
const MIROIR_RUNNERS = join(MIROIR_DATA, "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd");
const FREEZE_RUNNER = "20d51c4c-52e5-4077-baf3-5e87bd75e496";

const on = { versioning: true };
const off = { versioning: false };

function menuItems(): MiroirMenuItem[] {
  const menu = JSON.parse(readFileSync(MIROIR_MENU, "utf8"));
  return menu.definition.definition.flatMap((section: { items: MiroirMenuItem[] }) => section.items);
}

if (runThis) {
  describe("versioningEntries", () => {
    it("the AppBar item needs the capability and a versioned-internal application", () => {
      const versioned = { versioningMode: "versioned-internal" } as any;
      expect(isVersioningAppBarItemShown({ browsedSelfApplication: versioned, capabilities: on })).toBe(true);
      expect(isVersioningAppBarItemShown({ browsedSelfApplication: versioned, capabilities: off })).toBe(false);
      expect(
        isVersioningAppBarItemShown({ browsedSelfApplication: { versioningMode: "unversioned" } as any, capabilities: on }),
      ).toBe(false);
    });

    it("with the capability off, the Miroir menu drops its version and trace items, and only them", () => {
      const items = menuItems();
      const kept = items.filter((item) => isMenuItemAllowedByVersioning(item, off));
      const dropped = items.filter((item) => !isMenuItemAllowedByVersioning(item, off));
      expect(dropped.map((item) => item.label)).toEqual([
        "Miroir Entity Versions",
        "Miroir Application Versions",
        "Miroir Evolution Trace Records",
      ]);
      expect(kept.length).toBe(items.length - VERSIONING_MENU_REPORT_UUIDS.length);
      expect(items.filter((item) => isMenuItemAllowedByVersioning(item, on))).toEqual(items);
    });

    it("with the capability off, the freeze Runner is hidden and the other Runners are kept", () => {
      expect(VERSIONING_RUNNER_UUIDS).toEqual([FREEZE_RUNNER]);
      const freezeRunner = JSON.parse(readFileSync(join(MIROIR_RUNNERS, `${FREEZE_RUNNER}.json`), "utf8"));
      expect(JSON.stringify(freezeRunner)).toContain("freezeApplicationVersion");
      expect(isRunnerAllowedByVersioning(FREEZE_RUNNER, off)).toBe(false);
      expect(isRunnerAllowedByVersioning(FREEZE_RUNNER, on)).toBe(true);
      expect(isRunnerAllowedByVersioning("e2d2d0b2-0000-4000-8000-000000000000", off)).toBe(true);
    });

    it("AppBar, SidebarSection and RunnerView call the predicates with the process capabilities", () => {
      const read = (path: string) => readFileSync(join(REPO_ROOT, "packages/miroir-react/src/components", path), "utf8");
      expect(read("Page/AppBar.tsx")).toContain("isVersioningAppBarItemShown");
      expect(read("Page/SidebarSection.tsx")).toContain(
        "isMenuItemAllowedByVersioning(curr, context.processCapabilities)",
      );
      expect(read("Runners/RunnerView.tsx")).toContain(
        "isRunnerAllowedByVersioning(props.runnerUuid, context.processCapabilities)",
      );
    });
  });
}

/**
 * #273 Slice 7 — designer tools visibility, leftover sessionStorage, Transformer Builder.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  ADMIN_APPLICATION_UUID,
  effectiveShowModelTools,
  isDesignerToolsVisible,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilitiesDesigner.273.phase7" ||
  RUN_TEST.startsWith("processCapabilitiesDesigner.273");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const CAROL_UUID = "30634877-08ae-44f3-a230-d899e22333d5";
const ALICE_ADMIN_RIGHT_UUID = "86a73f7e-17f8-462d-8203-af1f323a7cdc";
const MIROIR_RIGHT_ENTITY_UUID = "a6136fc7-949b-4d64-9f13-dd3afce1ab3c";

const aliceAdminGrant = {
  miroirUser: ALICE_UUID,
  targetType: "application" as const,
  targetUuid: ADMIN_APPLICATION_UUID,
};

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

if (runThis) {
  describe("processCapabilitiesDesigner.273.phase7 — isDesignerToolsVisible", () => {
    it("is false when designerTools is false, regardless of grants or auth", () => {
      expect(
        isDesignerToolsVisible({
          designerTools: false,
          authEnabled: false,
          principal: { miroirUserUuid: ALICE_UUID },
          grants: [aliceAdminGrant],
        }),
      ).toBe(false);
      expect(
        isDesignerToolsVisible({
          designerTools: false,
          authEnabled: true,
          principal: { miroirUserUuid: ALICE_UUID },
          grants: [aliceAdminGrant],
        }),
      ).toBe(false);
    });

    it("is true when designerTools is true and auth is off", () => {
      expect(
        isDesignerToolsVisible({
          designerTools: true,
          authEnabled: false,
          principal: undefined,
          grants: [],
        }),
      ).toBe(true);
    });

    it("is false when designerTools is true, auth is on, Carol has no grants", () => {
      expect(
        isDesignerToolsVisible({
          designerTools: true,
          authEnabled: true,
          principal: { miroirUserUuid: CAROL_UUID },
          grants: [],
        }),
      ).toBe(false);
    });

    it("is true when designerTools is true, auth is on, Alice has an explicit Admin grant", () => {
      expect(
        isDesignerToolsVisible({
          designerTools: true,
          authEnabled: true,
          principal: { miroirUserUuid: ALICE_UUID },
          grants: [aliceAdminGrant],
        }),
      ).toBe(true);
    });

    it("is false when designerTools is true, auth is on, Alice has no explicit Admin grant", () => {
      expect(
        isDesignerToolsVisible({
          designerTools: true,
          authEnabled: true,
          principal: { miroirUserUuid: ALICE_UUID },
          grants: [],
        }),
      ).toBe(false);
    });
  });

  describe("processCapabilitiesDesigner.273.phase7 — effectiveShowModelTools", () => {
    it("leftover sessionStorage does not win when designer tools are hidden", () => {
      expect(effectiveShowModelTools(false, true)).toBe(false);
    });

    it("stored preference is honored when designer tools are visible", () => {
      expect(effectiveShowModelTools(true, true)).toBe(true);
      expect(effectiveShowModelTools(true, false)).toBe(false);
    });
  });

  describe("processCapabilitiesDesigner.273.phase7 — AppBar Transformer Builder follows designer tools", () => {
    it("Transformer Builder is not gated by showAgentUi; AI icons may still use showAgentUi", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx",
      );
      expect(src).toContain("showAgentUi");
      expect(src).not.toContain("...(showAgentUi ? [transformerBuilderMenuItem] : [])");
      expect(src).toMatch(
        /\.\.\.\(\s*designerToolsVisible\s*\?\s*\[transformerBuilderMenuItem\]\s*:\s*\[\]\s*\)/,
      );
    });
  });

  describe("processCapabilitiesDesigner.273.phase7 — Alice Admin MiroirRight seed", () => {
    it("seed file exists and index.ts / index.d.ts export miroirRight_AliceAdminApplication", () => {
      const seedPath = join(
        REPO_ROOT,
        "packages/miroir-test-app_deployment-admin/assets/admin_data",
        MIROIR_RIGHT_ENTITY_UUID,
        `${ALICE_ADMIN_RIGHT_UUID}.json`,
      );
      expect(existsSync(seedPath)).toBe(true);
      const seed = JSON.parse(readFileSync(seedPath, "utf8")) as Record<string, unknown>;
      expect(seed.uuid).toBe(ALICE_ADMIN_RIGHT_UUID);
      expect(seed.miroirUser).toBe(ALICE_UUID);
      expect(seed.targetType).toBe("application");
      expect(seed.targetUuid).toBe(ADMIN_APPLICATION_UUID);

      const indexTs = readRepoFile("packages/miroir-test-app_deployment-admin/index.ts");
      const indexDts = readRepoFile("packages/miroir-test-app_deployment-admin/index.d.ts");
      expect(indexTs).toContain("miroirRight_AliceAdminApplication");
      expect(indexDts).toContain("miroirRight_AliceAdminApplication");
    });
  });
}

/**
 * #273 Slice 5 — AI hide, no CopilotKit mount when snapshot ai is false; ViewParams.agents is gone.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { shouldMountCopilotKitRoute } from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "processCapabilities.273" ||
  RUN_TEST.startsWith("processCapabilities.273") ||
  RUN_TEST === "processCapabilitiesAi.273.phase5" ||
  RUN_TEST.startsWith("processCapabilitiesAi.273");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const VIEW_PARAMS_ENTITY_UUID = "b9765b7c-b614-4126-a0e2-634463f99937";
const VIEW_PARAMS_SEED_UUID = "441cb6fd-2728-4a16-b170-ebceec1ce6c2";

function readRepoFile(...relativeParts: string[]): string {
  return readFileSync(join(REPO_ROOT, ...relativeParts), "utf8");
}

function readJson(...relativeParts: string[]): Record<string, unknown> {
  return JSON.parse(readRepoFile(...relativeParts)) as Record<string, unknown>;
}

if (runThis) {
  describe("processCapabilitiesAi.273.phase5 — CopilotKit route helper", () => {
    it("shouldMountCopilotKitRoute is false when ai is false and true when ai is true", () => {
      expect(shouldMountCopilotKitRoute(false)).toBe(false);
      expect(shouldMountCopilotKitRoute(true)).toBe(true);
    });
  });

  describe("processCapabilitiesAi.273.phase5 — Settings has no Agents switch", () => {
    it("SettingsPage FormControlLabel no longer uses the Agents switch label", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/SettingsPage.tsx",
      );
      expect(src).not.toContain('label="Agents"');
      expect(src).not.toContain('aria-label: "Agents"');
      expect(src).not.toContain('"aria-label": "Agents"');
    });
  });

  describe("processCapabilitiesAi.273.phase5 — AppBar AI gate is snapshot ai", () => {
    it("showAgentUi is not gated by viewParams.agents or MIROIR_IS_SANDBOX", () => {
      const src = readRepoFile(
        "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx",
      );
      expect(src).toContain("showAgentUi");
      expect(src).not.toContain("viewParams.agents");
      expect(src).not.toContain("MIROIR_IS_SANDBOX");
      const showAgentUiIdx = src.indexOf("showAgentUi");
      expect(showAgentUiIdx).toBeGreaterThanOrEqual(0);
      const assignmentWindow = src.slice(showAgentUiIdx, showAgentUiIdx + 280);
      expect(assignmentWindow).toMatch(/processCapabilities\.ai|\.ai\b|agentsEnabled/);
    });
  });

  describe("processCapabilitiesAi.273.phase5 — ViewParams.agents is gone", () => {
    it("ViewParams.ts has no agents field", () => {
      const src = readRepoFile("packages/miroir-core/src/0_interfaces/4-views/ViewParams.ts");
      expect(src).not.toMatch(/\bagents\b/);
    });

    it("Admin ViewParams entity mlSchema.definition has no agents", () => {
      const entity = readJson(
        "packages/miroir-test-app_deployment-admin/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        `${VIEW_PARAMS_ENTITY_UUID}.json`,
      );
      const mlSchema = entity.mlSchema as { definition?: Record<string, unknown> };
      expect(mlSchema.definition).not.toHaveProperty("agents");
    });

    it("Default ViewParams seed has no agents key", () => {
      const seed = readJson(
        "packages/miroir-test-app_deployment-admin/assets/admin_data",
        VIEW_PARAMS_ENTITY_UUID,
        `${VIEW_PARAMS_SEED_UUID}.json`,
      );
      expect(seed).not.toHaveProperty("agents");
    });
  });
}

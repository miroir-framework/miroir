/**
 * #71 Slice 6 — CopilotKit reuses the same gate; launchers force hatch off; policy stays process-agnostic.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "authentication.71" ||
  RUN_TEST.startsWith("authentication.71");

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");

if (runThis) {
  describe("authentication.71.phase6 R1 surface and hatch docs", () => {
    it("CopilotKit mount reuses assertRequestAllowed", () => {
      const server = readFileSync(join(REPO_ROOT, "packages/miroir-server/src/server.ts"), "utf8");
      expect(server).toContain('app.use("/api/copilotkit"');
      expect(server).toContain("assertRequestAllowed({");
      const mountIdx = server.indexOf('app.use("/api/copilotkit"');
      const gateIdx = server.indexOf("shouldMountCopilotKitRoute");
      expect(gateIdx).toBeGreaterThanOrEqual(0);
      expect(gateIdx).toBeLessThan(mountIdx);
      const copilotBlock = server.slice(mountIdx);
      expect(copilotBlock).toContain("assertRequestAllowed");
    });

    it("AuthenticationPolicy has no Express import", () => {
      const policy = readFileSync(
        join(REPO_ROOT, "packages/miroir-core/src/1_core/authentication/AuthenticationPolicy.ts"),
        "utf8",
      );
      expect(policy).not.toMatch(/from ["']express["']/);
    });

    it("test launchers default MIROIR_AUTH_ENABLED to 0 when unset", () => {
      const byFile = readFileSync(
        join(REPO_ROOT, "packages/miroir-standalone-app/scripts/testByFileLauncher.ts"),
        "utf8",
      );
      const testMiroir = readFileSync(
        join(REPO_ROOT, "packages/miroir-standalone-app/scripts/testMiroirLauncher.ts"),
        "utf8",
      );
      expect(byFile).toContain('MIROIR_AUTH_ENABLED: env.MIROIR_AUTH_ENABLED ?? "0"');
      expect(testMiroir).toContain('MIROIR_AUTH_ENABLED: env.MIROIR_AUTH_ENABLED ?? "0"');
    });

    it("AgentsCopilotKit sends the session Bearer on CopilotKit headers", () => {
      const src = readFileSync(
        join(
          REPO_ROOT,
          "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ai/AgentsCopilotKit.tsx",
        ),
        "utf8",
      );
      expect(src).toContain("headers=");
      expect(src).toContain("authorizationHeaders");
      expect(src).toContain("useAuthSession");
    });
  });
}

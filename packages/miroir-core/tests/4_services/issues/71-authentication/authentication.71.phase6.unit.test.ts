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
      const copilotBlock = server.slice(server.indexOf('app.use("/api/copilotkit"'));
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
  });
}

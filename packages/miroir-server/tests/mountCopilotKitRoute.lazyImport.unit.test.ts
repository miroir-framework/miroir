/**
 * Agent backends (#409): the server loads miroir-ai only when the `ai` capability is on.
 * Child-process probe: a resolve hook records every specifier the child resolves while it
 * mounts the CopilotKit route from `src/mountCopilotKitRoute.ts`.
 * Requires built miroir-core and miroir-ai.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("mountCopilotKitRoute");

const TEST_DIR = dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = join(TEST_DIR, "..");
const PROBE_REGISTER = join(SERVER_DIR, "../miroir-ai/tests/support/moduleLoadProbeRegister.mjs");
const PROBE_CHILD = join(SERVER_DIR, "tests/support/mountProbeChild.mjs");

function capabilities(ai: boolean) {
  return {
    ai,
    mcp: true,
    agentBackend: "none",
    designerTools: true,
    availableStoreTypes: [],
    creatableStoreTypes: [],
    storeAdministration: false,
  };
}

function runMountProbe(ai: boolean): { resolved: Set<string>; stdout: string } {
  const workDir = mkdtempSync(join(tmpdir(), "miroir-server-probe-"));
  const recordFile = join(workDir, "resolved.txt");
  try {
    const child = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "--no-warnings", "--import", PROBE_REGISTER, PROBE_CHILD],
      {
        cwd: SERVER_DIR,
        encoding: "utf8",
        timeout: 60_000,
        env: {
          ...process.env,
          NODE_ENV: "test",
          MIROIR_PROBE_RECORD_FILE: recordFile,
          MIROIR_PROBE_STUBS: "{}",
          MIROIR_PROBE_SCENARIO: JSON.stringify({ capabilities: capabilities(ai) }),
        },
      },
    );
    if (child.status !== 0) {
      throw new Error(`server probe child failed (${child.status}):\n${child.stderr}`);
    }
    let recorded = "";
    try {
      recorded = readFileSync(recordFile, "utf8");
    } catch {
      recorded = "";
    }
    return { resolved: new Set(recorded.split("\n").filter((line) => line.length > 0)), stdout: child.stdout };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

if (runThis) {
  describe("mountCopilotKitRoute: miroir-ai is imported only when ai is on", () => {
    it("with ai off, the server mounts no CopilotKit route and never resolves miroir-ai", () => {
      const probe = runMountProbe(false);
      expect(probe.stdout).toContain("probe-mounted:false:");
      expect(probe.resolved.has("miroir-ai")).toBe(false);
    }, 60_000);

    it("with ai on, the server resolves miroir-ai and mounts /api/copilotkit", () => {
      const probe = runMountProbe(true);
      expect(probe.stdout).toContain("probe-mounted:true:/api/copilotkit");
      expect(probe.resolved.has("miroir-ai")).toBe(true);
    }, 60_000);

    it("server.ts has no static import of miroir-ai", () => {
      const source = readFileSync(join(SERVER_DIR, "src/server.ts"), "utf8");
      expect(source).not.toMatch(/^import[^;]*from\s+["']miroir-ai["']/m);
    });

    it("the release bundle keeps the miroir-ai import dynamic", () => {
      // ncc hoists an external dynamic import into a static one unless webpackIgnore survives
      // the TypeScript transpilation, which needs removeComments off.
      const mountSource = readFileSync(join(SERVER_DIR, "src/mountCopilotKitRoute.ts"), "utf8");
      const tsconfig = readFileSync(join(SERVER_DIR, "tsconfig.json"), "utf8");
      expect(mountSource).toMatch(/import\(\/\* webpackIgnore: true \*\/ "miroir-ai"\)/);
      expect(tsconfig).toMatch(/"removeComments":\s*false/);
    });
  });
}

/**
 * #409 module-load probe: runs a child Node process that builds the CopilotKit router from the
 * built `miroir-ai` package and records every module specifier it resolves. Agent SDKs resolve
 * to offline stubs, so a scenario needs no key and no network.
 * Requires `npm run build -w miroir-ai` (the child imports the built package, as servers do).
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SUPPORT_DIR = dirname(fileURLToPath(import.meta.url));

export const AGENT_SDK_SPECIFIERS = ["@cursor/sdk", "@anthropic-ai/claude-agent-sdk"] as const;

export type ModuleLoadProbeScenario = {
  capabilities: Record<string, unknown>;
  secrets?: Record<string, string>;
  /** `aiConfig.backend` of one agent request; omit to only build the router. */
  request?: string;
};

export type ModuleLoadProbeResult = {
  resolvedSpecifiers: Set<string>;
  status?: number;
  stdout: string;
  stderr: string;
};

export function runModuleLoadProbe(scenario: ModuleLoadProbeScenario): ModuleLoadProbeResult {
  const workDir = mkdtempSync(join(tmpdir(), "miroir-module-probe-"));
  const recordFile = join(workDir, "resolved.txt");
  try {
    const stubs = {
      "@cursor/sdk": pathToFileURL(join(SUPPORT_DIR, "sdkStubs/cursor-sdk.mjs")).href,
      "@anthropic-ai/claude-agent-sdk": pathToFileURL(join(SUPPORT_DIR, "sdkStubs/claude-agent-sdk.mjs")).href,
    };
    const child = spawnSync(
      process.execPath,
      ["--import", join(SUPPORT_DIR, "moduleLoadProbeRegister.mjs"), join(SUPPORT_DIR, "moduleLoadProbeChild.mjs")],
      {
        cwd: workDir,
        encoding: "utf8",
        timeout: 60_000,
        env: {
          ...process.env,
          NODE_ENV: "test",
          MIROIR_PROBE_RECORD_FILE: recordFile,
          MIROIR_PROBE_STUBS: JSON.stringify(stubs),
          MIROIR_PROBE_SCENARIO: JSON.stringify(scenario),
        },
      },
    );
    if (child.status !== 0) {
      throw new Error(`module-load probe child failed (${child.status}):\n${child.stderr}`);
    }
    let recorded = "";
    try {
      recorded = readFileSync(recordFile, "utf8");
    } catch {
      recorded = "";
    }
    const statusMatch = child.stdout.match(/probe-status:(\d+)/);
    return {
      resolvedSpecifiers: new Set(recorded.split("\n").filter((line) => line.length > 0)),
      status: statusMatch ? Number(statusMatch[1]) : undefined,
      stdout: child.stdout,
      stderr: child.stderr,
    };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

export function loadedAgentSdks(result: ModuleLoadProbeResult): string[] {
  return AGENT_SDK_SPECIFIERS.filter((specifier) => result.resolvedSpecifiers.has(specifier));
}

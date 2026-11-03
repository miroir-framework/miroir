import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ################################################################################################
// Facts about the Miroir repository that agent-run:record stores with each run (#550). A copy of
// packages/miroir-app-miroir/scripts/devData/repoInfo.ts, kept here so that the AgentRuns application
// does not reach into the platform packages (#671).
// ################################################################################################

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");

export function git(...args: string[]): string | undefined {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return undefined;
  }
}

export function miroirVersion(): string | undefined {
  return JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8")).version;
}

export function repoInfo(): { gitCommit?: string; gitBranch?: string; miroirVersion?: string } {
  return {
    gitCommit: git("rev-parse", "HEAD"),
    gitBranch: git("rev-parse", "--abbrev-ref", "HEAD"),
    miroirVersion: miroirVersion(),
  };
}

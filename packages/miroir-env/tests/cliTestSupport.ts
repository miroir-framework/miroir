import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../src/cli";

export const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const repositoryRoot = path.resolve(packageDirectory, "../..");

export type RunResult = { exitCode: number; stdout: string; stderr: string };

export async function run(argv: string[], cwd: string, env: Record<string, string> = {}): Promise<RunResult> {
  let stdout = "";
  let stderr = "";
  const exitCode = await main(argv, {
    cwd,
    env,
    stdout: (text) => (stdout += text),
    stderr: (text) => (stderr += text),
  });
  return { exitCode, stdout, stderr };
}

/** A throwaway repository root holding only the given environments/<name>.json files. */
export function temporaryRepository(environments: Record<string, unknown>): string {
  const root = mkdtempSync(path.join(tmpdir(), "miroir-env-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "r", workspaces: ["packages/*"] }));
  mkdirSync(path.join(root, "environments"));
  for (const [name, definition] of Object.entries(environments)) {
    writeFileSync(
      path.join(root, "environments", `${name}.json`),
      typeof definition === "string" ? definition : JSON.stringify(definition),
    );
  }
  return root;
}

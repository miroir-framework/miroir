// #321 Slice 1: `miroir-env show` resolves the tracked `dev` environment.
// vitest, not MiroirTest: file loading, repository-root discovery and CLI exit codes are not
// reachable through the ML. The resolution rules themselves are the MiroirTest suite
// fn.environment.deriveDeployments.
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { main } from "../src/cli";

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(packageDirectory, "../..");

type RunResult = { exitCode: number; stdout: string; stderr: string };

async function run(argv: string[], cwd: string): Promise<RunResult> {
  let stdout = "";
  let stderr = "";
  const exitCode = await main(argv, {
    cwd,
    env: {},
    stdout: (text) => (stdout += text),
    stderr: (text) => (stderr += text),
  });
  return { exitCode, stdout, stderr };
}

function temporaryRepository(environments: Record<string, unknown>): string {
  const root = mkdtempSync(path.join(tmpdir(), "miroir-env-"));
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "r", workspaces: ["packages/*"] }));
  mkdirSync(path.join(root, "environments"));
  for (const [name, definition] of Object.entries(environments)) {
    writeFileSync(path.join(root, "environments", `${name}.json`), JSON.stringify(definition));
  }
  return root;
}

describe("miroir-env show", () => {
  it("resolves dev to the model, data and modelVersion sections the dev server opens today", async () => {
    const result = await run(["show", "--json"], repositoryRoot);
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);

    const shown = JSON.parse(result.stdout);
    expect(shown.name).toBe("dev");

    const today = JSON.parse(
      readFileSync(path.join(packageDirectory, "tests/fixtures/dev-deployments.today.json"), "utf-8"),
    ).deployments as Record<string, { selfApplication: string; configuration: Record<string, unknown> }>;
    const shownByUuid = Object.fromEntries(
      (shown.deployments as { deployment: string; selfApplication: string; configuration: Record<string, unknown> }[]).map(
        (d) => [d.deployment, d],
      ),
    );
    expect(Object.keys(shownByUuid).sort()).toEqual(Object.keys(today).sort());
    for (const [uuid, row] of Object.entries(today)) {
      const { admin: _ignoredAdmin, ...sections } = row.configuration;
      const { admin: _derivedAdmin, ...shownSections } = shownByUuid[uuid].configuration;
      expect(shownByUuid[uuid].selfApplication).toBe(row.selfApplication);
      expect(shownSections).toEqual(sections);
    }
  });

  it("finds the repository root from a package subdirectory", async () => {
    const result = await run(["show", "--json"], path.join(repositoryRoot, "packages/miroir-core"));
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).repositoryRoot).toBe(repositoryRoot);
  });

  it("prints a readable view by default", async () => {
    const result = await run(["show"], repositoryRoot);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("environment dev");
    expect(result.stdout).toContain("packages/miroir-test-app_deployment-library/assets/library_model");
  });

  it("rejects a definition that does not match the miroirEnvironment schema, naming the path", async () => {
    const root = temporaryRepository({
      dev: { applications: { library: { package: "p", selfApplication: "x", deployment: "y", store: "floppy", mode: "live" } } },
    });
    const result = await run(["show"], root);
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("applications.library.store");
  });

  it("fails outside a repository", async () => {
    const result = await run(["show"], mkdtempSync(path.join(tmpdir(), "no-repo-")));
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("repository root");
  });
});

// #321 Slice 1: `miroir-env show` resolves the tracked `dev` environment.
// vitest, not MiroirTest: file loading, repository-root discovery and CLI exit codes are not
// reachable through the ML. The resolution rules themselves are the MiroirTest suite
// fn.environment.deriveDeployments.
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { packageDirectory, repositoryRoot, run, temporaryRepository } from "./cliTestSupport";

describe("miroir-env show", () => {
  it("resolves dev to the sections the dev server opened before #321, Admin data aside", async () => {
    const result = await run(["show", "--json", "--name", "dev"], repositoryRoot);
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
    // Slice 3: Admin data leaves the package assets for the environment state
    const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
    today[ADMIN_DEPLOYMENT].configuration.data = { emulatedServerType: "filesystem", directory: ".miroir/dev/admin/data" };
    for (const [uuid, row] of Object.entries(today)) {
      const { admin: _ignoredAdmin, ...sections } = row.configuration;
      const { admin: _derivedAdmin, ...shownSections } = shownByUuid[uuid].configuration;
      expect(shownByUuid[uuid].selfApplication).toBe(row.selfApplication);
      expect(shownSections).toEqual(sections);
    }
  });

  it("finds the repository root from a package subdirectory", async () => {
    const result = await run(["show", "--json", "--name", "dev"], path.join(repositoryRoot, "packages/miroir-core"));
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).repositoryRoot).toBe(repositoryRoot);
  });

  it("prints a readable view by default", async () => {
    const result = await run(["show", "--name", "dev"], repositoryRoot);
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

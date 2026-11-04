import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";

import { applicationAssetsDirectory } from "@miroir-framework/core";

// Agent cost benchmark (#550): `npm run agent-run:record` turns the run.json of a benchmark run
// into an AgentRunMeasurement instance of the AgentRuns application (#671). Here, not next to the
// recorder: the AgentRuns folder is no package, and this package installs AgentRuns in dev. The
// recorder runs as the npm script does, through tsx, so this package does not compile it.

const ENTITY_AGENT_RUN_MEASUREMENT_UUID = "954de789-6350-4f54-a809-5f2b8b91d067";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixture = join(repoRoot, "scripts/tests/fixtures/agent_bench/run.json");
const recorder = join(repoRoot, "code-helpers/features/550-FEATURE-agent-cost-measurement/scripts/recordAgentRun.ts");

/** Runs the recorder; its exit code and what it printed. */
function main(args: string[]): { code: number | null; stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [join(repoRoot, "node_modules/tsx/dist/cli.mjs"), recorder, ...args], { cwd: repoRoot, encoding: "utf-8" });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

const readFixture = () => JSON.parse(readFileSync(fixture, "utf-8"));

const tempDirs: string[] = [];
function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), `agentRuns-${prefix}-`));
  tempDirs.push(dir);
  return dir;
}
afterAll(() => tempDirs.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function writeRun(dir: string, change: (run: any) => void = () => {}): string {
  const run = readFixture();
  change(run);
  const file = join(dir, `run-${readdirSync(dir).length}.json`);
  writeFileSync(file, JSON.stringify(run));
  return file;
}

function instances(dataDir: string): any[] {
  const entityDir = join(dataDir, ENTITY_AGENT_RUN_MEASUREMENT_UUID);
  try {
    return readdirSync(entityDir)
      .filter((name) => name.endsWith(".json"))
      .map((name) => JSON.parse(readFileSync(join(entityDir, name), "utf-8")));
  } catch {
    return [];
  }
}

describe("agent-run:record", () => {
  it("writes, by default, in the data section the dev environment opens for AgentRuns", () => {
    const dev = JSON.parse(readFileSync(join(repoRoot, "environments/dev.json"), "utf-8"));
    const expected = join(repoRoot, applicationAssetsDirectory("agentRuns", dev.applications.agentRuns, "data", dev.packagesDirectory));

    const result = main(["--print-data-dir"]);

    expect(result.code).toBe(0);
    expect(result.stdout.trim()).toBe(expected);
  });

  it("writes one instance with the measures of the run", () => {
    const dataDir = tempDir("data");
    const run = readFixture();

    expect(main([fixture, "--data-dir", dataDir]).code).toBe(0);

    const [instance, ...others] = instances(dataDir);
    expect(others).toEqual([]);
    expect(instance).toMatchObject({
      parentName: "AgentRunMeasurement",
      parentUuid: ENTITY_AGENT_RUN_MEASUREMENT_UUID,
      runId: run.runId,
      arm: "miroir-mcp",
      feature: "overdue-loans",
      pilot: true,
      model: "claude-sonnet-5-5",
      turns: 42,
      costUsd: 1.42,
      cacheReadTokens: 2100000,
      uuidCharShare: 0.31,
      acceptancePassed: true,
      acceptanceScenariosPassed: 4,
      acceptanceScenariosTotal: 4,
      valid: true,
      taskHash: run.taskHash,
    });
    expect(instance.gitCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(typeof instance.miroirVersion).toBe("string");
    expect(instance).not.toHaveProperty("invalidReason");
    expect(instance).not.toHaveProperty("workspace");
  });

  it("records a failed acceptance as not passed", () => {
    const dataDir = tempDir("data");
    const file = writeRun(tempDir("runs"), (run) => (run.acceptance = { passed: 2, total: 4 }));

    expect(main([file, "--data-dir", dataDir]).code).toBe(0);

    expect(instances(dataDir)[0]).toMatchObject({ acceptancePassed: false, acceptanceScenariosPassed: 2 });
  });

  it("writes nothing the second time for the same run", () => {
    const dataDir = tempDir("data");

    expect(main([fixture, "--data-dir", dataDir]).code).toBe(0);
    expect(main([fixture, "--data-dir", dataDir]).code).toBe(0);

    expect(instances(dataDir)).toHaveLength(1);
  });

  it("writes nothing when a measure is missing, and names it", () => {
    const dataDir = tempDir("data");
    const file = writeRun(tempDir("runs"), (run) => {
      delete run.costUsd;
    });
    const result = main([file, "--data-dir", dataDir]);
    expect(result.code).toBe(1);

    expect(instances(dataDir)).toEqual([]);
    expect(result.stderr).toContain("costUsd");
  });
});

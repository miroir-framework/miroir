import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ENTITY_AGENT_RUN_MEASUREMENT_UUID } from "../../scripts/devData/agentRunHistory";
import { main } from "../../scripts/devData/recordAgentRun";

// Agent cost benchmark (#550): `npm run agent-run:record` turns the run.json of a benchmark run
// into an AgentRunMeasurement instance of the Miroir devData section.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const fixture = join(repoRoot, "scripts/tests/fixtures/agent_bench/run.json");

const readFixture = () => JSON.parse(readFileSync(fixture, "utf-8"));

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), `devData-${prefix}-`));
}

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
  it("writes one instance with the measures of the run", async () => {
    const dataDir = tempDir("data");
    const run = readFixture();

    expect(await main([fixture, "--data-dir", dataDir])).toBe(0);

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

  it("records a failed acceptance as not passed", async () => {
    const dataDir = tempDir("data");
    const file = writeRun(tempDir("runs"), (run) => (run.acceptance = { passed: 2, total: 4 }));

    expect(await main([file, "--data-dir", dataDir])).toBe(0);

    expect(instances(dataDir)[0]).toMatchObject({ acceptancePassed: false, acceptanceScenariosPassed: 2 });
  });

  it("writes nothing the second time for the same run", async () => {
    const dataDir = tempDir("data");

    expect(await main([fixture, "--data-dir", dataDir])).toBe(0);
    expect(await main([fixture, "--data-dir", dataDir])).toBe(0);

    expect(instances(dataDir)).toHaveLength(1);
  });

  it("writes nothing when a measure is missing, and names it", async () => {
    const dataDir = tempDir("data");
    const file = writeRun(tempDir("runs"), (run) => {
      delete run.costUsd;
    });
    const errors: string[] = [];
    const error = console.error;
    console.error = (message: string) => errors.push(message);
    try {
      expect(await main([file, "--data-dir", dataDir])).toBe(1);
    } finally {
      console.error = error;
    }

    expect(instances(dataDir)).toEqual([]);
    expect(errors.join("\n")).toContain("costUsd");
  });
});

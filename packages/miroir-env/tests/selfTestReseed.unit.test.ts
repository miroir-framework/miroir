// #587: a self-test environment (client.selfTest.enabled) is reseeded at each server or Electron
// start, so that a change to a seeded MiroirTest reaches the next self-test run; any other
// environment keeps its state. vitest, not MiroirTest: seeding copies files on disk.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  describeSeedReport,
  ENVIRONMENT_PROCESS_FILE,
  resolveEnvironmentFromFiles,
  seedEnvironmentStateAtStart,
} from "../src/index";
import { temporaryRepository } from "./cliTestSupport";

const MIROIR_TEST_ENTITY = "a311f363-e238-4203-bdfc-29e8c160c26b";
const TEST_ROW = `${MIROIR_TEST_ENTITY}/t.json`;

const application = (name: string, selfApplication: string, deployment: string) => ({
  package: `miroir-app-${name}`,
  selfApplication,
  deployment,
  store: "filesystem",
  mode: "copy",
});
const definition = (selfTest: boolean) => ({
  server: { rootApiUrl: "https://localhost:3080" },
  ...(selfTest ? { client: { selfTest: { enabled: true, tags: ["unit"] } } } : {}),
  applications: {
    miroir: application("miroir", "360fcf1f-f0d4-4f8a-9262-07886e70fa15", "10ff36f2-50a3-48d8-b80f-e48e5d13af8e"),
    admin: application("admin", "55af124e-8c05-4bae-a3ef-0933d41daa92", "18db21bf-f8d3-4f6a-8296-84b69f6dc48b"),
  },
});

/** A repository whose miroir app carries one MiroirTest row, and a writer for its new version. */
function repositoryWithMiroirTest(name: string, selfTest: boolean) {
  const root = temporaryRepository({ [name]: definition(selfTest) });
  const asset = path.join(root, "packages/miroir-app-miroir/assets/miroir_data", TEST_ROW);
  mkdirSync(path.dirname(asset), { recursive: true });
  const writeTest = (version: string) => writeFileSync(asset, JSON.stringify({ version }));
  writeTest("first");
  const resolved = resolveEnvironmentFromFiles({ cwd: root, env: { MIROIR_ENV: name } });
  const seededTest = () =>
    JSON.parse(readFileSync(path.join(root, `.miroir/${name}/miroir/data`, TEST_ROW), "utf-8")).version;
  const processFile = path.join(root, `.miroir/${name}`, ENVIRONMENT_PROCESS_FILE);
  return { resolved, writeTest, seededTest, processFile };
}

describe("seeding at start", () => {
  it("a self-test environment is reseeded at each start: a changed MiroirTest reaches the next run", () => {
    const { resolved, writeTest, seededTest } = repositoryWithMiroirTest("self-test", true);
    seedEnvironmentStateAtStart(resolved);
    expect(seededTest()).toBe("first");

    writeTest("second");
    const seed = seedEnvironmentStateAtStart(resolved);

    expect(seededTest()).toBe("second");
    expect(seed.reseed).toBe(true);
    expect(seed.seeded).toEqual(expect.arrayContaining(["miroir/data", "admin/data"]));
    expect(seed.kept).toEqual([]);
    expect(describeSeedReport(seed)).toMatch(/^environment state reseeded from package assets \(self-test environment, reseeded at each start\): /);
  });

  it("any other environment keeps its copies at later starts", () => {
    const { resolved, writeTest, seededTest } = repositoryWithMiroirTest("dev", false);
    seedEnvironmentStateAtStart(resolved);

    writeTest("second");
    const seed = seedEnvironmentStateAtStart(resolved);

    expect(seededTest()).toBe("first");
    expect(seed.reseed).toBe(false);
    expect(seed.seeded).toEqual([]);
    expect(describeSeedReport(seed)).toBeUndefined();
  });

  it("a self-test start keeps the copies while another process started on them still runs", () => {
    const { resolved, writeTest, seededTest, processFile } = repositoryWithMiroirTest("self-test", true);
    seedEnvironmentStateAtStart(resolved);
    expect(readFileSync(processFile, "utf-8").trim()).toBe(String(process.pid));

    // the parent of the test process stands for a server already started on the state
    writeFileSync(processFile, `${process.ppid}\n`);
    writeTest("second");
    const seed = seedEnvironmentStateAtStart(resolved);

    expect(seededTest()).toBe("first");
    expect(seed.reseed).toBe(false);
    expect(seed.runningProcess).toBe(process.ppid);
    expect(describeSeedReport(seed)).toBe(
      `environment state not reseeded: process ${process.ppid} started on it is still running`,
    );
  });

  it("a self-test start reseeds when the recorded process has ended", () => {
    const { resolved, writeTest, seededTest, processFile } = repositoryWithMiroirTest("self-test", true);
    seedEnvironmentStateAtStart(resolved);
    writeFileSync(processFile, "999999999\n");
    writeTest("second");

    expect(seedEnvironmentStateAtStart(resolved).reseed).toBe(true);
    expect(seededTest()).toBe("second");
  });
});

import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ENTITY_BUNDLE_SIZE_MEASUREMENT_UUID } from "../src/bundleSizeHistory";
import { main } from "../scripts/recordBundleSize";

// Bundle size history (#473): `npm run bundle-size:record` turns a bundle report into a
// BundleSizeMeasurement instance of miroir-app-meta.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixture = join(repoRoot, "scripts/tests/fixtures/bundle_policy/bundle-report.json");
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const readFixture = () => JSON.parse(readFileSync(fixture, "utf-8"));

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), `meta-${prefix}-`));
}

function writeReport(dir: string, change: (report: any) => void = () => {}): string {
  const report = readFixture();
  change(report);
  const file = join(dir, `bundle-report-${readdirSync(dir).length}.json`);
  writeFileSync(file, JSON.stringify(report));
  return file;
}

function instances(dataDir: string): any[] {
  const entityDir = join(dataDir, ENTITY_BUNDLE_SIZE_MEASUREMENT_UUID);
  return readdirSync(entityDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(entityDir, name), "utf-8")));
}

async function record(dataDir: string, report: string, ...options: string[]): Promise<number> {
  return main([report, "--data-dir", dataDir, "--no-policy", ...options]);
}

describe("bundle-size:record", () => {
  it("writes one instance from the report", async () => {
    const dataDir = tempDir("data");
    const report = readFixture();

    expect(await record(dataDir, fixture)).toBe(0);

    const [instance, ...others] = instances(dataDir);
    expect(others).toEqual([]);
    expect(instance).toMatchObject({
      parentName: "BundleSizeMeasurement",
      parentUuid: ENTITY_BUNDLE_SIZE_MEASUREMENT_UUID,
      application: report.app,
      eagerGzipBytes: report.totals.eager.gzipBytes,
      eagerRawBytes: report.totals.eager.rawBytes,
      eagerChunks: report.totals.eager.chunks,
      totalGzipBytes: report.totals.gzipBytes,
      totalRawBytes: report.totals.rawBytes,
      totalChunks: report.totals.chunks,
      baseline: report.totals.eager.gzipBytes,
    });
    expect(instance.uuid).toMatch(uuidV4);
    expect(new Date(instance.measuredAt).toISOString()).toBe(instance.measuredAt);
    expect(instance.previousBaseline).toBeUndefined();
  });

  it("links the previous measurement of the same application", async () => {
    const dataDir = tempDir("data");
    const reports = tempDir("reports");
    expect(await record(dataDir, fixture)).toBe(0);
    const electron = writeReport(reports, (report) => {
      report.app = "miroir-standalone-app-electron";
      report.totals.eager.gzipBytes = 1_000_000;
    });
    expect(await record(dataDir, electron)).toBe(0);
    const smaller = writeReport(reports, (report) => {
      report.totals.eager.gzipBytes = 2_700_000;
    });

    expect(await record(dataDir, smaller, "--reason", "smaller page")).toBe(0);

    const newest = instances(dataDir).find((instance) => instance.eagerGzipBytes === 2_700_000);
    expect(newest).toMatchObject({
      application: "miroir-standalone-app",
      previousBaseline: readFixture().totals.eager.gzipBytes,
      baselineChange: 2_700_000 - readFixture().totals.eager.gzipBytes,
      reason: "smaller page",
    });
  });

  it("--baseline keeps the measured size and records the chosen baseline", async () => {
    const dataDir = tempDir("data");

    expect(await record(dataDir, fixture, "--baseline", "2750000")).toBe(0);

    expect(instances(dataDir)[0]).toMatchObject({
      eagerGzipBytes: readFixture().totals.eager.gzipBytes,
      baseline: 2_750_000,
    });
  });

  it("refuses an instance the Entity rejects", async () => {
    const dataDir = tempDir("data");
    const reports = tempDir("reports");
    const broken = writeReport(reports, (report) => {
      report.totals.eager.gzipBytes = "large";
    });

    expect(await record(dataDir, broken)).not.toBe(0);

    expect(readdirSync(dataDir)).toEqual([]);
  });
});

// Slice 3: recording the baseline writes the policy and the instance; the bundle guard
// (scripts/check_bundle_policy.py) runs for real on the new baseline first.

const guard = join(repoRoot, "scripts/check_bundle_policy.py");
const python = process.env.PYTHON ?? "python3";

/** A policy the fixture report passes, written by the guard's --init. */
function fixturePolicy(dir: string): string {
  const policy = join(dir, "bundle-policy.json");
  execFileSync(python, [guard, fixture, policy, "--init", "--no-history"], { stdio: "ignore" });
  return policy;
}

const readPolicy = (policy: string) => JSON.parse(readFileSync(policy, "utf-8"));

function guardPasses(report: string, policy: string): boolean {
  return spawnSync(python, [guard, report, policy, "--no-history"], { stdio: "ignore" }).status === 0;
}

async function recordWithPolicy(dataDir: string, policy: string, report: string, ...options: string[]): Promise<number> {
  return main([report, "--data-dir", dataDir, "--policy", policy, ...options]);
}

describe("bundle-size:record with the bundle policy", () => {
  it("writes the policy baseline and the instance, and the guard then passes", async () => {
    const dir = tempDir("policy");
    const dataDir = tempDir("data");
    const policy = fixturePolicy(dir);
    const smaller = writeReport(dir, (report) => {
      report.totals.eager.gzipBytes = Math.round(report.totals.eager.gzipBytes * 0.9);
    });
    expect(guardPasses(smaller, policy)).toBe(false);

    expect(await recordWithPolicy(dataDir, policy, smaller)).toBe(0);

    const measured = JSON.parse(readFileSync(smaller, "utf-8")).totals.eager.gzipBytes;
    expect(readPolicy(policy).eagerGzipBaseline).toBe(measured);
    expect(instances(dataDir).map((instance) => instance.baseline)).toEqual([measured]);
    expect(guardPasses(smaller, policy)).toBe(true);
  });

  it("--baseline writes the chosen baseline in both", async () => {
    const dir = tempDir("policy");
    const dataDir = tempDir("data");
    const policy = fixturePolicy(dir);

    expect(await recordWithPolicy(dataDir, policy, fixture, "--baseline", "2720000")).toBe(0);

    expect(readPolicy(policy).eagerGzipBaseline).toBe(2_720_000);
    expect(instances(dataDir)[0].baseline).toBe(2_720_000);
  });

  it("refuses a build the guard still rejects, and writes nothing", async () => {
    const dir = tempDir("policy");
    const dataDir = tempDir("data");
    const policy = fixturePolicy(dir);
    const before = readFileSync(policy, "utf-8");
    const withNewPackage = writeReport(dir, (report) => {
      report.packages.push({ name: "left-pad", kind: "npm", loadKind: "lazy", via: "" });
    });

    expect(await recordWithPolicy(dataDir, policy, withNewPackage)).toBe(1);

    expect(readFileSync(policy, "utf-8")).toBe(before);
    expect(readdirSync(dataDir)).toEqual([]);
  });

  it("--init rewrites the package lists too", async () => {
    const dir = tempDir("policy");
    const dataDir = tempDir("data");
    const policy = fixturePolicy(dir);
    const withNewPackage = writeReport(dir, (report) => {
      report.packages.push({ name: "left-pad", kind: "npm", loadKind: "lazy", via: "" });
    });

    expect(await recordWithPolicy(dataDir, policy, withNewPackage, "--init", "--reason", "left-pad")).toBe(0);

    expect(readPolicy(policy).lazy).toContain("left-pad");
    expect(instances(dataDir)).toHaveLength(1);
  });

  it("finds the policy of the report's application", async () => {
    const { policyOf } = await import("../scripts/recordBundleSize");

    expect(policyOf("miroir-standalone-app-electron")).toBe(
      join(repoRoot, "packages/miroir-standalone-app-electron/bundle-policy.json"),
    );
    expect(policyOf("miroir-standalone-app")).toBe(join(repoRoot, "packages/miroir-standalone-app/bundle-policy.json"));
  });
});

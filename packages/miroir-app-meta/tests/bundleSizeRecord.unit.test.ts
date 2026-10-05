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

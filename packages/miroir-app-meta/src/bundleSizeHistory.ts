import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  type MlElement,
} from "miroir-core";

import bundleSizeMeasurementEntityJson from "../assets/meta_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b.json" with { type: "json" };

// ################################################################################################
// Bundle size history (#473): one BundleSizeMeasurement instance per recorded bundle size, written
// in the tracked data section of miroir-app-meta by `npm run bundle-size:record` (from a bundle
// report) and `npm run bundle-size:backfill` (from the git history of the bundle policies).
// ################################################################################################

export const ENTITY_BUNDLE_SIZE_MEASUREMENT_UUID = bundleSizeMeasurementEntityJson.uuid;

/** The bundle policy of each application whose bundle size is recorded, relative to the repository root. */
export const BUNDLE_POLICIES: Record<string, string> = {
  "miroir-standalone-app": "packages/miroir-standalone-app/bundle-policy.json",
  "miroir-standalone-app-electron": "packages/miroir-standalone-app-electron/bundle-policy.json",
};

/** The part of `bundle-report.json` (miroir-standalone-app/vite/bundleReportCore.js) a measurement uses. */
export type BundleReport = {
  app: string;
  totals: {
    chunks: number;
    rawBytes: number;
    gzipBytes: number;
    eager: { chunks: number; rawBytes: number; gzipBytes: number };
  };
};

export type BundleSizeMeasurement = {
  uuid: string;
  parentName: "BundleSizeMeasurement";
  parentUuid: string;
  application: string;
  measuredAt: string;
  eagerGzipBytes: number;
  baseline: number;
  previousBaseline?: number;
  baselineChange?: number;
  reason?: string;
  gitCommit?: string;
  gitBranch?: string;
  miroirVersion?: string;
  eagerChunks?: number;
  eagerRawBytes?: number;
  totalChunks?: number;
  totalRawBytes?: number;
  totalGzipBytes?: number;
};

export type MeasurementContext = {
  measuredAt: string;
  previous?: BundleSizeMeasurement;
  reason?: string;
  gitCommit?: string;
  gitBranch?: string;
  miroirVersion?: string;
};

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as T;
}

function measurement(
  application: string,
  eagerGzipBytes: number,
  baseline: number,
  context: MeasurementContext,
  sizes: Partial<BundleSizeMeasurement> = {},
): BundleSizeMeasurement {
  const previousBaseline = context.previous?.baseline;
  return withoutUndefined({
    uuid: randomUUID(),
    parentName: "BundleSizeMeasurement",
    parentUuid: ENTITY_BUNDLE_SIZE_MEASUREMENT_UUID,
    application,
    measuredAt: context.measuredAt,
    eagerGzipBytes,
    baseline,
    previousBaseline,
    baselineChange: previousBaseline === undefined ? undefined : baseline - previousBaseline,
    reason: context.reason,
    gitCommit: context.gitCommit,
    gitBranch: context.gitBranch,
    miroirVersion: context.miroirVersion,
    ...sizes,
  });
}

/** A measurement of a build, from its bundle report; `baseline` defaults to the measured eager gzip size. */
export function measurementFromReport(
  report: BundleReport,
  context: MeasurementContext & { baseline?: number },
): BundleSizeMeasurement {
  const { totals } = report;
  return measurement(report.app, totals.eager.gzipBytes, context.baseline ?? totals.eager.gzipBytes, context, {
    eagerChunks: totals.eager.chunks,
    eagerRawBytes: totals.eager.rawBytes,
    totalChunks: totals.chunks,
    totalRawBytes: totals.rawBytes,
    totalGzipBytes: totals.gzipBytes,
  });
}

/** A measurement rebuilt from a baseline found in the git history of a bundle policy: the baseline is the only size known. */
export function measurementFromBaseline(
  application: string,
  baseline: number,
  context: MeasurementContext,
): BundleSizeMeasurement {
  return measurement(application, baseline, baseline, context);
}

export function readMeasurements(dataDir: string): BundleSizeMeasurement[] {
  const entityDir = join(dataDir, ENTITY_BUNDLE_SIZE_MEASUREMENT_UUID);
  if (!existsSync(entityDir)) {
    return [];
  }
  return readdirSync(entityDir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => JSON.parse(readFileSync(join(entityDir, name), "utf-8")) as BundleSizeMeasurement);
}

/** The latest measurement of an application (largest `measuredAt`), if any. */
export function newestMeasurement(application: string, dataDir: string): BundleSizeMeasurement | undefined {
  return readMeasurements(dataDir)
    .filter((instance) => instance.application === application)
    .reduce<BundleSizeMeasurement | undefined>(
      (newest, instance) => (newest === undefined || instance.measuredAt > newest.measuredAt ? instance : newest),
      undefined,
    );
}

/** The type check errors of an instance against the BundleSizeMeasurement Entity, or undefined when it is valid. */
export function measurementErrors(instance: BundleSizeMeasurement): unknown {
  const check = checkModelValidationInstance(
    bundleSizeMeasurementEntityJson.mlSchema as unknown as MlElement,
    instance,
    instance.uuid,
    defaultMiroirModelEnvironment,
  );
  return check.status === "ok" ? undefined : check.innermostError;
}

/** Writes the instance file; throws, writing nothing, when the Entity rejects the instance. */
export function writeMeasurement(instance: BundleSizeMeasurement, dataDir: string): string {
  const errors = measurementErrors(instance);
  if (errors !== undefined) {
    throw new Error(`the BundleSizeMeasurement Entity rejects the instance: ${JSON.stringify(errors)}`);
  }
  const entityDir = join(dataDir, ENTITY_BUNDLE_SIZE_MEASUREMENT_UUID);
  mkdirSync(entityDir, { recursive: true });
  const file = join(entityDir, `${instance.uuid}.json`);
  writeFileSync(file, `${JSON.stringify(instance, null, 2)}\n`);
  return file;
}

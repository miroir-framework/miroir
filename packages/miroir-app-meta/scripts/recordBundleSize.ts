import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  measurementFromReport,
  newestMeasurement,
  writeMeasurement,
  type BundleReport,
} from "../src/bundleSizeHistory";

// ################################################################################################
// `npm run bundle-size:record -w miroir-app-meta -- <bundle-report.json> [options]` (#473):
// records the size of a build as a BundleSizeMeasurement instance of miroir-app-meta.
//
//   --baseline N      the baseline to record (default: the measured eager gzip size)
//   --reason TEXT     why the size moved
//   --data-dir DIR    data section to write in (default: miroir-app-meta/assets/meta_data)
//   --no-policy       write the instance only, leave bundle-policy.json alone
// ################################################################################################

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(packageRoot, "../..");
const defaultDataDir = join(packageRoot, "assets/meta_data");

function git(...args: string[]): string | undefined {
  try {
    return execFileSync("git", args, { cwd: repoRoot, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return undefined;
  }
}

function miroirVersion(): string | undefined {
  return JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf-8")).version;
}

export async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      baseline: { type: "string" },
      reason: { type: "string" },
      "data-dir": { type: "string" },
      "no-policy": { type: "boolean", default: false },
    },
  });
  if (positionals.length !== 1) {
    console.error("usage: bundle-size:record <bundle-report.json> [--baseline N] [--reason TEXT] [--data-dir DIR] [--no-policy]");
    return 2;
  }
  if (!values["no-policy"]) {
    console.error("bundle-size:record: writing bundle-policy.json is not supported yet, pass --no-policy");
    return 2;
  }
  const report = JSON.parse(readFileSync(resolve(positionals[0]), "utf-8")) as BundleReport;
  const dataDir = resolve(values["data-dir"] ?? defaultDataDir);
  const baseline = values.baseline === undefined ? undefined : Number(values.baseline);
  if (baseline !== undefined && !Number.isInteger(baseline)) {
    console.error(`bundle-size:record: --baseline must be a number of bytes, got ${values.baseline}`);
    return 2;
  }

  const instance = measurementFromReport(report, {
    baseline,
    measuredAt: new Date().toISOString(),
    previous: newestMeasurement(report.app, dataDir),
    reason: values.reason,
    gitCommit: git("rev-parse", "HEAD"),
    gitBranch: git("rev-parse", "--abbrev-ref", "HEAD"),
    miroirVersion: miroirVersion(),
  });
  try {
    const file = writeMeasurement(instance, dataDir);
    console.log(`bundle-size:record: ${report.app} ${instance.eagerGzipBytes} bytes gzipped at start, baseline ${instance.baseline}: ${file}`);
    return 0;
  } catch (error) {
    console.error(`bundle-size:record: ${(error as Error).message}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}

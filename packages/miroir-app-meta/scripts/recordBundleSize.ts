import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  BUNDLE_POLICIES,
  measurementFromReport,
  newestMeasurement,
  writeMeasurement,
  type BundleReport,
  type BundleSizeMeasurement,
} from "../src/bundleSizeHistory";

// ################################################################################################
// `npm run bundle-size:record -w miroir-app-meta -- <bundle-report.json> [options]` (#473): records
// the size of a build as the new baseline of the bundle guard. It writes `eagerGzipBaseline` in the
// application's bundle-policy.json and a BundleSizeMeasurement instance of miroir-app-meta, after
// checking with the guard (scripts/check_bundle_policy.py, its history rule skipped) that the build
// passes with the new baseline; when it does not, it prints the guard's violations and writes nothing.
//
//   --baseline N      the baseline to record (default: the measured eager gzip size)
//   --reason TEXT     why the size moved
//   --init            also rewrite the policy's package lists from the report (the guard's --init)
//   --policy FILE     the policy to update (default: the bundle-policy.json of the report's app)
//   --data-dir DIR    data section to write in (default: miroir-app-meta/assets/meta_data)
//   --no-policy       write the instance only, leave the policy alone
// ################################################################################################

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = join(packageRoot, "../..");
const defaultDataDir = join(packageRoot, "assets/meta_data");
const guard = join(repoRoot, "scripts/check_bundle_policy.py");
const python = process.env.PYTHON ?? "python3";

const USAGE =
  "usage: bundle-size:record <bundle-report.json> [--baseline N] [--reason TEXT] [--init] [--policy FILE] [--data-dir DIR] [--no-policy]";

/** The bundle-policy.json of an application. */
export function policyOf(application: string): string {
  const policy = BUNDLE_POLICIES[application];
  if (policy === undefined) {
    throw new Error(`no bundle policy is known for ${application} (known: ${Object.keys(BUNDLE_POLICIES).join(", ")})`);
  }
  return join(repoRoot, policy);
}

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

function runGuard(...args: string[]): { status: number | null; output: string } {
  const run = spawnSync(python, [guard, ...args], { encoding: "utf-8" });
  return { status: run.status, output: `${run.stdout ?? ""}${run.stderr ?? ""}${run.error ? run.error.message : ""}` };
}

/**
 * The policy content with the new baseline (and, with `init`, the lists rewritten from the report),
 * or the guard's output when the build fails with it. The real policy is not touched.
 */
function candidatePolicy(
  reportFile: string,
  policyFile: string,
  baseline: number | undefined,
  init: boolean,
): { content: string; baseline: number } | { failure: string } {
  const workDir = mkdtempSync(join(tmpdir(), "bundle-size-record-"));
  try {
    const candidate = join(workDir, "bundle-policy.json");
    writeFileSync(candidate, readFileSync(policyFile, "utf-8"));
    if (init) {
      const initRun = runGuard(reportFile, candidate, "--init", "--no-history");
      if (initRun.status !== 0 && initRun.status !== 1) {
        return { failure: initRun.output };
      }
    }
    const policy = JSON.parse(readFileSync(candidate, "utf-8"));
    const report = JSON.parse(readFileSync(reportFile, "utf-8")) as BundleReport;
    policy.eagerGzipBaseline = baseline ?? report.totals.eager.gzipBytes;
    const content = `${JSON.stringify(policy, null, 2)}\n`;
    writeFileSync(candidate, content);
    const check = runGuard(reportFile, candidate, "--no-history");
    return check.status === 0 ? { content, baseline: policy.eagerGzipBaseline } : { failure: check.output };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

/**
 * Writes the instance, then the policy; when the policy write fails, removes the instance, which the
 * guard's history rule would otherwise reject. Returns the instance file, or undefined when nothing is written.
 */
export function writeRecord(
  instance: BundleSizeMeasurement,
  dataDir: string,
  policyUpdate: { file: string; content: string } | undefined,
  writePolicy: (file: string, content: string) => void = writeFileSync,
): string | undefined {
  let file: string;
  try {
    file = writeMeasurement(instance, dataDir);
  } catch (error) {
    console.error(`bundle-size:record: ${(error as Error).message}`);
    return undefined;
  }
  if (policyUpdate) {
    try {
      writePolicy(policyUpdate.file, policyUpdate.content);
    } catch (error) {
      rmSync(file, { force: true });
      console.error(`bundle-size:record: ${(error as Error).message}, nothing written`);
      return undefined;
    }
    console.log(`bundle-size:record: eagerGzipBaseline ${instance.baseline} written in ${policyUpdate.file}`);
  }
  return file;
}

export async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      baseline: { type: "string" },
      reason: { type: "string" },
      init: { type: "boolean", default: false },
      policy: { type: "string" },
      "data-dir": { type: "string" },
      "no-policy": { type: "boolean", default: false },
    },
  });
  if (positionals.length !== 1) {
    console.error(USAGE);
    return 2;
  }
  const reportFile = resolve(positionals[0]);
  const report = JSON.parse(readFileSync(reportFile, "utf-8")) as BundleReport;
  const dataDir = resolve(values["data-dir"] ?? defaultDataDir);
  let baseline = values.baseline === undefined ? undefined : Number(values.baseline);
  if (baseline !== undefined && !Number.isInteger(baseline)) {
    console.error(`bundle-size:record: --baseline must be a number of bytes, got ${values.baseline}`);
    return 2;
  }

  let policyUpdate: { file: string; content: string } | undefined;
  if (!values["no-policy"]) {
    const policyFile = resolve(values.policy ?? policyOf(report.app));
    const candidate = candidatePolicy(reportFile, policyFile, baseline, values.init);
    if ("failure" in candidate) {
      console.error(candidate.failure.trimEnd());
      console.error("bundle-size:record: the build fails the bundle guard with the new baseline, nothing written");
      return 1;
    }
    baseline = candidate.baseline;
    policyUpdate = { file: policyFile, content: candidate.content };
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
  const file = writeRecord(instance, dataDir, policyUpdate);
  if (file === undefined) {
    return 1;
  }
  console.log(`bundle-size:record: ${report.app} ${instance.eagerGzipBytes} bytes gzipped at start, baseline ${instance.baseline}: ${file}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}

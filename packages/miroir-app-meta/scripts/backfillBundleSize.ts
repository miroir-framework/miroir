import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  BUNDLE_POLICIES,
  measurementFromBaseline,
  readMeasurements,
  writeMeasurement,
  type BundleSizeMeasurement,
} from "../src/bundleSizeHistory";

// ################################################################################################
// `npm run bundle-size:backfill -w miroir-app-meta [-- --dry-run]` (#473): one BundleSizeMeasurement
// per change of eagerGzipBaseline in the git history of the bundle policies, oldest first. The
// baseline is the only size the history keeps, so it is also the measured size. A commit already
// recorded for an application is skipped, so the backfill can run again. So is a policy commit whose
// baseline `bundle-size:record` already wrote: that record carries the commit it ran on, an ancestor
// of the policy commit, and the same baseline.
//
//   --repo-root DIR   repository to read (default: this monorepo)
//   --data-dir DIR    data section to write in (default: miroir-app-meta/assets/meta_data)
//   --dry-run         print the measurements, write nothing
// ################################################################################################

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

type PolicyCommit = { commit: string; committedAt: string; subject: string };

function policyCommits(repoRoot: string, policy: string): PolicyCommit[] {
  const log = execFileSync("git", ["log", "--follow", "--format=%H %cI %s", "--", policy], {
    cwd: repoRoot,
    encoding: "utf-8",
  });
  return log
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => {
      const [commit, committedAt, ...subject] = line.split(" ");
      return { commit, committedAt, subject: subject.join(" ") };
    })
    .reverse();
}

function baselineAt(repoRoot: string, commit: string, policy: string): number | undefined {
  try {
    const content = execFileSync("git", ["show", `${commit}:${policy}`], {
      cwd: repoRoot,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(content).eagerGzipBaseline;
  } catch {
    return undefined; // the commit deleted or renamed the file
  }
}

function isAncestor(repoRoot: string, ancestor: string, commit: string): boolean {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, commit], { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false; // not an ancestor, or a commit this repository does not have
  }
}

/** Whether `bundle-size:record` wrote this baseline before its policy commit: the newest earlier record has it. */
function recordedBeforeCommit(repoRoot: string, measurement: BundleSizeMeasurement, recorded: BundleSizeMeasurement[]): boolean {
  const commit = measurement.gitCommit;
  if (commit === undefined) {
    return false;
  }
  const newestEarlier = recorded
    .filter((m) => m.application === measurement.application && m.gitCommit !== undefined && m.gitCommit !== commit)
    .filter((m) => isAncestor(repoRoot, m.gitCommit as string, commit))
    .reduce<BundleSizeMeasurement | undefined>((newest, m) => (newest === undefined || m.measuredAt > newest.measuredAt ? m : newest), undefined);
  return newestEarlier?.baseline === measurement.baseline;
}

/** The measurements the git history of one policy holds, oldest first. */
export function baselineHistory(repoRoot: string, application: string, policy: string): BundleSizeMeasurement[] {
  const measurements: BundleSizeMeasurement[] = [];
  for (const { commit, committedAt, subject } of policyCommits(repoRoot, policy)) {
    const baseline = baselineAt(repoRoot, commit, policy);
    const previous = measurements.at(-1);
    if (typeof baseline !== "number" || baseline === previous?.baseline) {
      continue;
    }
    measurements.push(
      measurementFromBaseline(application, baseline, {
        measuredAt: new Date(committedAt).toISOString(),
        previous,
        reason: subject,
        gitCommit: commit,
      }),
    );
  }
  return measurements;
}

export async function main(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    options: {
      "repo-root": { type: "string" },
      "data-dir": { type: "string" },
      "dry-run": { type: "boolean", default: false },
    },
  });
  const repoRoot = resolve(values["repo-root"] ?? join(packageRoot, "../.."));
  const dataDir = resolve(values["data-dir"] ?? join(packageRoot, "assets/meta_data"));
  const existing = readMeasurements(dataDir);
  const recorded = new Set(existing.map((m) => `${m.application} ${m.gitCommit}`));

  let written = 0;
  for (const [application, policy] of Object.entries(BUNDLE_POLICIES)) {
    for (const measurement of baselineHistory(repoRoot, application, policy)) {
      if (recorded.has(`${application} ${measurement.gitCommit}`) || recordedBeforeCommit(repoRoot, measurement, existing)) {
        continue;
      }
      const change = measurement.baselineChange === undefined ? "" : ` (${measurement.baselineChange > 0 ? "+" : ""}${measurement.baselineChange})`;
      console.log(
        `${application} ${measurement.measuredAt} ${measurement.gitCommit?.slice(0, 8)} ${measurement.baseline}${change} ${measurement.reason}`,
      );
      if (!values["dry-run"]) {
        writeMeasurement(measurement, dataDir);
        written++;
      }
    }
  }
  console.log(`bundle-size:backfill: ${values["dry-run"] ? "dry run, nothing written" : `${written} measurement(s) written in ${dataDir}`}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}

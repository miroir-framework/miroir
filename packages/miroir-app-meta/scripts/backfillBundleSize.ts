import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  measurementFromBaseline,
  readMeasurements,
  writeMeasurement,
  type BundleSizeMeasurement,
} from "../src/bundleSizeHistory";

// ################################################################################################
// `npm run bundle-size:backfill -w miroir-app-meta [-- --dry-run]` (#473): one BundleSizeMeasurement
// per change of eagerGzipBaseline in the git history of the bundle policies, oldest first. The
// baseline is the only size the history keeps, so it is also the measured size. A commit already
// recorded for an application is skipped, so the backfill can run again.
//
//   --repo-root DIR   repository to read (default: this monorepo)
//   --data-dir DIR    data section to write in (default: miroir-app-meta/assets/meta_data)
//   --dry-run         print the measurements, write nothing
// ################################################################################################

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** The bundle policy of each application whose bundle size is recorded. */
export const BUNDLE_POLICIES: Record<string, string> = {
  "miroir-standalone-app": "packages/miroir-standalone-app/bundle-policy.json",
  "miroir-standalone-app-electron": "packages/miroir-standalone-app-electron/bundle-policy.json",
};

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
  const recorded = new Set(readMeasurements(dataDir).map((m) => `${m.application} ${m.gitCommit}`));

  let written = 0;
  for (const [application, policy] of Object.entries(BUNDLE_POLICIES)) {
    for (const measurement of baselineHistory(repoRoot, application, policy)) {
      if (recorded.has(`${application} ${measurement.gitCommit}`)) {
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

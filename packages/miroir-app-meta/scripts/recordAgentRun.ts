import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import { measurementFromRun, missingFields, readRuns, writeRun, type RunSummary } from "../src/agentRunHistory";
import { repoInfo } from "../src/repoInfo";

// ################################################################################################
// `npm run agent-run:record -w miroir-app-meta -- <run.json> [--data-dir DIR]` (#550): records one
// run of the agent cost benchmark as an AgentRunMeasurement instance of miroir-app-meta. A run
// already recorded (same runId) is not written again.
//
//   --data-dir DIR    data section to write in (default: miroir-app-meta/assets/meta_data)
// ################################################################################################

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultDataDir = join(packageRoot, "assets/meta_data");

const USAGE = "usage: agent-run:record <run.json> [--data-dir DIR]";

export async function main(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { "data-dir": { type: "string" } },
  });
  if (positionals.length !== 1) {
    console.error(USAGE);
    return 2;
  }
  const dataDir = resolve(values["data-dir"] ?? defaultDataDir);
  const summary = JSON.parse(readFileSync(positionals[0], "utf-8")) as RunSummary;

  const missing = missingFields(summary);
  if (missing.length > 0) {
    console.error(`agent-run:record: ${positionals[0]} lacks ${missing.join(", ")}, nothing written`);
    return 1;
  }
  if (readRuns(dataDir).some((run) => run.runId === summary.runId)) {
    console.log(`agent-run:record: run ${summary.runId} is already recorded, nothing written`);
    return 0;
  }
  try {
    const file = writeRun(measurementFromRun(summary, repoInfo()), dataDir);
    console.log(`agent-run:record: ${summary.feature} ${summary.arm} run ${summary.runIndex}, $${summary.costUsd}: ${file}`);
    return 0;
  } catch (error) {
    console.error(`agent-run:record: ${(error as Error).message}, nothing written`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}

#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseMiroirRunnerTestCliConfig } from "miroir-core";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const argv = process.argv.slice(2);
const config = parseMiroirRunnerTestCliConfig(process.env, argv);

const env: NodeJS.ProcessEnv = {
  ...process.env,
  MIROIR_TEST_MODE: config.executionMode,
};
if (config.suiteKeys.length) {
  env.MIROIR_TEST_SUITES = config.suiteKeys.join(",");
}
if (config.filter !== undefined) {
  env.MIROIR_TEST_FILTER = JSON.stringify(config.filter);
}

const vitestArgs = [
  "vitest",
  "run",
  "--poolOptions.forks.singleFork",
  "--reporter=verbose",
  `tests/${config.vitestEntry}.ts`,
];

const result = spawnSync("npx", vitestArgs, {
  cwd: packageRoot,
  env,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);

#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  miroirTestCliConfigToEnv,
  miroirCoreTestVitestEntry,
  MIROIR_RUNNER_TEST_VITEST_ENTRY,
  parseMiroirRunnerTestCliConfig,
  parseMiroirTestCliArgs,
  parseMiroirTestCliConfig,
  splitSuiteKeys,
  listMiroirTestSuiteKeys,
} from "miroir-core";
import { miroirTest_runner_library } from "miroir-test-app_deployment-library";
import type { MiroirTestSuite } from "miroir-core";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const argv = process.argv.slice(2);
const env = process.env;

function listRunnerTestSuiteKeys(): string[] {
  return Object.keys(miroirTest_runner_library.definition as MiroirTestSuite);
}

function resolveRequestedSuiteKeys(): string[] {
  const fromArgs = parseMiroirTestCliArgs(argv, { integModeAlias: true });
  return fromArgs.suiteKeys ?? splitSuiteKeys(env.MIROIR_TEST_SUITES ?? env.MIROIR_TEST_SUITE);
}

function resolveVitestEntry(): { vitestEntry: string; spawnEnv: NodeJS.ProcessEnv } {
  const requestedSuiteKeys = resolveRequestedSuiteKeys();
  const coreKeys = new Set(listMiroirTestSuiteKeys());

  if (
    requestedSuiteKeys.length > 0 &&
    !requestedSuiteKeys.includes("*") &&
    requestedSuiteKeys.every((key) => coreKeys.has(key))
  ) {
    const coreConfig = parseMiroirTestCliConfig(env, argv);
    if (coreConfig.executionMode !== "integration") {
      throw new Error(
        "miroir-core integration suites require MIROIR_TEST_MODE=integ (or integration)",
      );
    }
    return {
      vitestEntry: miroirCoreTestVitestEntry(coreConfig.executionMode),
      spawnEnv: { ...env, ...miroirTestCliConfigToEnv(coreConfig) },
    };
  }

  const runnerConfig = parseMiroirRunnerTestCliConfig(env, argv);
  const runnerEnv: NodeJS.ProcessEnv = {
    ...env,
    MIROIR_TEST_MODE: runnerConfig.executionMode,
  };
  if (runnerConfig.suiteKeys.length) {
    runnerEnv.MIROIR_TEST_SUITES = runnerConfig.suiteKeys.join(",");
  }
  if (runnerConfig.filter !== undefined) {
    runnerEnv.MIROIR_TEST_FILTER = JSON.stringify(runnerConfig.filter);
  }
  return {
    vitestEntry: MIROIR_RUNNER_TEST_VITEST_ENTRY,
    spawnEnv: runnerEnv,
  };
}

const { vitestEntry, spawnEnv } = resolveVitestEntry();

const vitestArgs = [
  "vitest",
  "run",
  "--poolOptions.forks.singleFork",
  "--reporter=verbose",
  `tests/${vitestEntry}.ts`,
];

const result = spawnSync("npx", vitestArgs, {
  cwd: packageRoot,
  env: spawnEnv,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);

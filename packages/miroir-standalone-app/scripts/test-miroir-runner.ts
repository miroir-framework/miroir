#!/usr/bin/env tsx
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  miroirTestCliConfigToEnv,
  miroirCoreTestVitestEntry,
  MIROIR_RUNNER_TEST_VITEST_ENTRY,
  MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES,
  parseMiroirRunnerTestCliConfig,
  parseMiroirTestCliArgs,
  parseMiroirTestCliConfig,
  splitSuiteKeys,
  listMiroirTestSuiteKeys,
} from "miroir-core";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, "..");

const argv = process.argv.slice(2);
const env = process.env;

function listRunnerTestSuiteKeys(): string[] {
  return [...MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES];
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
  return {
    vitestEntry: MIROIR_RUNNER_TEST_VITEST_ENTRY,
    spawnEnv: { ...env, ...miroirTestCliConfigToEnv(runnerConfig) },
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

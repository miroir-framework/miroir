/**
 * #321: the test environment of a test run. Every store of a test environment (`environments/test-*.json`)
 * is a copy in .miroir/<environment>/ or a database named after the environment; the filesystem copies are
 * wiped and seeded from the package assets once per test file, so no test writes into tracked files.
 */
import { MiroirLoggerFactory, type LoggerInterface } from "miroir-core";
import { expect } from "vitest";
import {
  openTestEnvironment as openEnvironmentForTests,
  selectedTestEnvironment as selectedTestEnvironmentFromEnv,
  type TestEnvironment,
} from "miroir-env";

import { packageName } from "../../src/constants";
import { cleanLevel } from "../3_controllers/constants";
import { resolveRepoRoot } from "./integrationTestProfiles.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "testEnvironment");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

/** The environment of transformer sessions started without a profile. */
export const DEFAULT_TEST_ENVIRONMENT = "test-sql";

export type { TestEnvironment };

/**
 * Test environments already seeded by the running test file. A run that shares modules between test files
 * (nonreg shared runner, --no-isolate) keeps this module: a test file must not start from what an earlier
 * one left, so the record belongs to one test file.
 */
let seededTestEnvironments = { testFile: "", names: new Set<string>() };

function seededByCurrentTestFile(): Set<string> {
  const testFile = expect.getState().testPath ?? "";
  if (seededTestEnvironments.testFile !== testFile) {
    seededTestEnvironments = { testFile, names: new Set() };
  }
  return seededTestEnvironments.names;
}

/**
 * The test environment MIROIR_ENV names (set by `--profile`, or directly). A MIROIR_ENV that is not
 * `test-*` (a developer's `dev` or `local`) is ignored with a warning: tests never run on it.
 */
export function selectedTestEnvironment(env: NodeJS.ProcessEnv): string | undefined {
  return selectedTestEnvironmentFromEnv(env, (message) => log.warn(message));
}

/** Resolves a test environment, seeding its filesystem copies the first time this test file opens it. */
export function openTestEnvironment(name: string, env: NodeJS.ProcessEnv = process.env): TestEnvironment {
  const seeded = seededByCurrentTestFile();
  const reseed = !seeded.has(name);
  const testEnvironment = openEnvironmentForTests(name, { cwd: resolveRepoRoot(), env, reseed });
  if (reseed) {
    seeded.add(name);
    log.info(`environment ${name} seeded in .miroir/${name}:`, testEnvironment.seed?.seeded.join(", "));
    for (const warning of testEnvironment.warnings) {
      log.warn(warning);
    }
  }
  return testEnvironment;
}

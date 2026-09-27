/**
 * #321: the test environment of a test run. Every store of a test environment (`environments/test-*.json`)
 * is a copy in .miroir/<environment>/ or a database named after the environment; the filesystem copies are
 * wiped and seeded from the package assets once per test file, so no test writes into tracked files.
 */
import { isTestEnvironment, MiroirLoggerFactory, type LoggerInterface, type MiroirConfigClient } from "miroir-core";
import { expect } from "vitest";
import {
  environmentClientConfig,
  environmentRealServerClientConfig,
  missingConnectionPasswords,
  resolveEnvironmentFromFiles,
  seedEnvironmentState,
  type ResolvedEnvironment,
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

export type TestEnvironment = {
  name: string;
  resolved: ResolvedEnvironment;
  /**
   * Client configuration, with the Postgres password from the environment's `passwordEnv`: the client
   * emulates the server, or with MIROIR_TEST_CLIENT=realServer (realServer-* profiles) calls a running
   * miroir-server with the stores of the environment.
   */
  miroirConfig: MiroirConfigClient;
};

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
  const name = env.MIROIR_ENV;
  if (!name) {
    return undefined;
  }
  if (!isTestEnvironment(name)) {
    log.warn(`MIROIR_ENV=${name} is not a test environment (test-*); tests ignore it`);
    return undefined;
  }
  return name;
}

/** Resolves a test environment, seeding its filesystem copies the first time this test file opens it. */
export function openTestEnvironment(name: string, env: NodeJS.ProcessEnv = process.env): TestEnvironment {
  const resolved = resolveEnvironmentFromFiles({ cwd: resolveRepoRoot(), env: { MIROIR_ENV: name } });
  const runEnv = { ...process.env, ...env };
  const seeded = seededByCurrentTestFile();
  if (!seeded.has(name)) {
    const seed = seedEnvironmentState(resolved, { reseed: true });
    seeded.add(name);
    log.info(`environment ${name} seeded in .miroir/${name}:`, seed.seeded.join(", "));
    for (const warning of missingConnectionPasswords(resolved, runEnv)) {
      log.warn(warning);
    }
  }
  const miroirConfig =
    runEnv.MIROIR_TEST_CLIENT === "realServer"
      ? environmentRealServerClientConfig(resolved, runEnv)
      : environmentClientConfig(resolved, runEnv);
  return { name, resolved, miroirConfig };
}

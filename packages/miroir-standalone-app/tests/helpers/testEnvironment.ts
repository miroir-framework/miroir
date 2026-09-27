/**
 * #321: the test environment of a test run. Every store of a test environment (`environments/test-*.json`)
 * is a copy in .miroir/<environment>/ or a database named after the environment; the filesystem copies are
 * wiped and seeded from the package assets once per test file (vitest isolates modules per file), so no
 * test writes into tracked files.
 */
import { isTestEnvironment, MiroirLoggerFactory, type LoggerInterface, type MiroirConfigClient } from "miroir-core";
import {
  environmentClientConfig,
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
  /** Emulated-server client configuration, with the Postgres password from the environment's `passwordEnv`. */
  miroirConfig: MiroirConfigClient;
};

/** Test environments already seeded by this test file. */
const seededTestEnvironments = new Set<string>();

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
  if (!seededTestEnvironments.has(name)) {
    const seed = seedEnvironmentState(resolved, { reseed: true });
    seededTestEnvironments.add(name);
    log.info(`environment ${name} seeded in .miroir/${name}:`, seed.seeded.join(", "));
    for (const warning of missingConnectionPasswords(resolved, runEnv)) {
      log.warn(warning);
    }
  }
  return { name, resolved, miroirConfig: environmentClientConfig(resolved, runEnv) };
}

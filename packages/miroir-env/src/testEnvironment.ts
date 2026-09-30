import { rmSync } from "node:fs";
import path from "node:path";

import { environmentAppsDirectory, isTestEnvironment, type MiroirConfigClient } from "miroir-core";

import { resolveEnvironmentFromFiles, type ResolvedEnvironment } from "./environmentFiles.js";
import {
  environmentClientConfig,
  environmentRealServerClientConfig,
  missingConnectionPasswords,
  seedEnvironmentState,
  type SeedReport,
} from "./environmentState.js";

// ################################################################################################
// Test environments (#321, shared by every package's tests in #345): every store of a `test-*`
// environment is a copy in .miroir/<environment>/ or a database named after the environment, so no
// test writes into tracked files.
// ################################################################################################

/**
 * The test environment MIROIR_ENV names (set by `--profile`, or directly). A MIROIR_ENV that is not
 * `test-*` (a developer's `dev` or `local`) is ignored, and `warn` says so: tests never run on it.
 */
export function selectedTestEnvironment(
  env: Record<string, string | undefined>,
  warn: (message: string) => void = console.warn,
): string | undefined {
  const name = env.MIROIR_ENV;
  if (!name) {
    return undefined;
  }
  if (!isTestEnvironment(name)) {
    warn(`MIROIR_ENV=${name} is not a test environment (test-*); tests ignore it`);
    return undefined;
  }
  return name;
}

export type TestEnvironment = {
  name: string;
  resolved: ResolvedEnvironment;
  /**
   * Client configuration, with the Postgres password from the environment's `passwordEnv`: the client
   * emulates the server, or with MIROIR_TEST_CLIENT=realServer calls a running miroir-server with the
   * stores of the environment.
   */
  miroirConfig: MiroirConfigClient;
  /** What `reseed` copied from the package assets; undefined when the copies were kept. */
  seed?: SeedReport;
  /** Database passwords the run needs and cannot find. */
  warnings: string[];
};

/**
 * Resolves a test environment from the repository above `cwd`. `reseed` wipes its filesystem copies
 * and the stores of applications installed at runtime, then seeds the copies again from the package
 * assets: a test file starts from the seed.
 */
export function openTestEnvironment(
  name: string,
  options: { cwd?: string; env?: Record<string, string | undefined>; reseed?: boolean } = {},
): TestEnvironment {
  if (!isTestEnvironment(name)) {
    throw new Error(`openTestEnvironment: "${name}" is not a test environment (test-*)`);
  }
  const runEnv = { ...process.env, ...options.env };
  const resolved = resolveEnvironmentFromFiles({ cwd: options.cwd ?? process.cwd(), env: { MIROIR_ENV: name } });
  if (options.reseed) {
    rmSync(path.join(resolved.repositoryRoot, environmentAppsDirectory(name)), { recursive: true, force: true });
  }
  const seed = options.reseed ? seedEnvironmentState(resolved, { reseed: true }) : undefined;
  const miroirConfig =
    runEnv.MIROIR_TEST_CLIENT === "realServer"
      ? environmentRealServerClientConfig(resolved, runEnv)
      : environmentClientConfig(resolved, runEnv);
  return { name, resolved, miroirConfig, seed, warnings: missingConnectionPasswords(resolved, runEnv) };
}

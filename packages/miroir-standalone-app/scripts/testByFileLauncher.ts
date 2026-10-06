import { parseProfileArg, parseStorageArg } from "miroir-core";

import { applyIntegrationTestProfile } from "../tests/helpers/integrationTestProfiles.js";
import { realServerProfileNameForStorage } from "../tests/helpers/resolveRealServerUiIntegrationProfile.js";

/** Remove `--profile` / `-p` and `--storage` / `-S` pairs from argv before forwarding to vitest. */
export function stripProfileArgs(argv: string[]): string[] {
  const result: string[] = [];
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--profile" || arg === "-p" || arg === "--storage" || arg === "-S") {
      index++;
      continue;
    }
    result.push(arg);
  }
  return result;
}

/**
 * Apply `--profile` or `--storage` to process.env, then strip those flags from vitest argv.
 *
 * Homogeneous with other integ launches: **argv is the preferred parameter surface**.
 * `--storage <sql|filesystem|indexedDb|mongodb>` selects `realServer-<storage>` when
 * `--profile` is absent (UI launcher realServer Node proof). Explicit `--profile` wins.
 * Sets `MIROIR_TEST_STORAGE` so the Vitest child can resolve the same choice after flags
 * are stripped.
 */
export function prepareTestByFileLaunch(
  env: NodeJS.ProcessEnv,
  argv: string[],
): { vitestArgs: string[]; spawnEnv: NodeJS.ProcessEnv } {
  const profileFromArg = parseProfileArg(argv);
  const storageFromArg = parseStorageArg(argv);

  if (profileFromArg) {
    applyIntegrationTestProfile(profileFromArg);
  } else if (storageFromArg) {
    applyIntegrationTestProfile(realServerProfileNameForStorage(storageFromArg));
  }

  const spawnEnv: NodeJS.ProcessEnv = {
    ...env,
    VITE_TEST_MODE: "true",
    MIROIR_AUTH_ENABLED: env.MIROIR_AUTH_ENABLED ?? "0",
    MIROIR_MCP_AUTH_ENABLED: env.MIROIR_MCP_AUTH_ENABLED ?? "0",
  };

  // #318: tests that load a profile by name (UI launch tests) follow the launch profile.
  const launchProfile =
    profileFromArg ?? (storageFromArg ? realServerProfileNameForStorage(storageFromArg) : undefined);
  if (launchProfile) {
    spawnEnv.MIROIR_TEST_PROFILE = launchProfile;
  }

  // Profile wins over --storage for the resolved storage hint passed to Vitest.
  if (profileFromArg?.startsWith("realServer-")) {
    spawnEnv.MIROIR_TEST_STORAGE = profileFromArg.slice("realServer-".length);
  } else if (storageFromArg) {
    spawnEnv.MIROIR_TEST_STORAGE = storageFromArg;
  }

  return {
    vitestArgs: stripProfileArgs(argv),
    spawnEnv,
  };
}

const DEFAULT_BAIL = "--bail=1";

/**
 * Vitest argv (after the `vitest` binary) for `testByFile`.
 *
 * Bails after the first failing case by default. `--no-bail` or `--bail=0` / `--bail 0`
 * runs every case; any other user `--bail=<n>` / `--bail <n>` replaces the default.
 * Arguments are returned as given: the caller must spawn vitest without a shell so a
 * `-t` pattern with spaces stays one argument.
 */
export function buildTestByFileVitestArgs(userArgs: string[]): string[] {
  const forwarded: string[] = [];
  let bailArgs: string[] = [DEFAULT_BAIL];
  for (let index = 0; index < userArgs.length; index++) {
    const arg = userArgs[index];
    if (arg === "--no-bail") {
      bailArgs = [];
      continue;
    }
    if (arg.startsWith("--bail=")) {
      bailArgs = arg === "--bail=0" ? [] : [arg];
      continue;
    }
    if (arg === "--bail" && index + 1 < userArgs.length) {
      const value = userArgs[++index];
      bailArgs = value === "0" ? [] : [arg, value];
      continue;
    }
    forwarded.push(arg);
  }
  return ["run", "--reporter=verbose", "--maxWorkers=1", ...bailArgs, ...forwarded];
}

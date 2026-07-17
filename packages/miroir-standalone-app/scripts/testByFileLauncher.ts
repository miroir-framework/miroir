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
  };

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

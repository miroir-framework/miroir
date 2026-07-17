/**
 * Resolve which `realServer-*` UI-launcher profile to use for Node integ
 * (`uiIntegrationTestLauncher.realServer.integ.test.ts`).
 *
 * Precedence (argv-first — env is legacy / CI fallback):
 * 1. `--storage` / `-S` on argv
 * 2. `MIROIR_TEST_STORAGE` env (set by testByFile when `--storage` is applied)
 * 3. `--profile realServer-<storage>` on argv (when still present)
 * 4. `VITE_MIROIR_TEST_CONFIG_FILENAME` matching `miroirConfig.test-realServer-<storage>.json`
 * 5. Default: `sql` → `realServer-sql`
 */

import {
  isMiroirTestStorageType,
  parseProfileArg,
  parseStorageArg,
  type MiroirTestStorageType,
} from "miroir-core";

export const REAL_SERVER_UI_INTEGRATION_PROFILE_PREFIX = "realServer-";

export function realServerProfileNameForStorage(
  storage: MiroirTestStorageType,
): `realServer-${MiroirTestStorageType}` {
  return `${REAL_SERVER_UI_INTEGRATION_PROFILE_PREFIX}${storage}`;
}

export function storageFromRealServerProfileName(
  profileName: string,
): MiroirTestStorageType | undefined {
  if (!profileName.startsWith(REAL_SERVER_UI_INTEGRATION_PROFILE_PREFIX)) {
    return undefined;
  }
  const storage = profileName.slice(REAL_SERVER_UI_INTEGRATION_PROFILE_PREFIX.length);
  return isMiroirTestStorageType(storage) ? storage : undefined;
}

function storageFromConfigFilename(configFilename: string | undefined): MiroirTestStorageType | undefined {
  if (!configFilename) {
    return undefined;
  }
  const match = /miroirConfig\.test-realServer-([a-zA-Z]+)\.json/.exec(configFilename);
  if (!match?.[1] || !isMiroirTestStorageType(match[1])) {
    return undefined;
  }
  return match[1];
}

export type ResolveRealServerUiIntegrationProfileInput = {
  argv?: string[];
  env?: NodeJS.ProcessEnv;
  /** When unset, defaults to `sql`. */
  defaultStorage?: MiroirTestStorageType;
};

export type ResolveRealServerUiIntegrationProfileResult = {
  storage: MiroirTestStorageType;
  profileName: `realServer-${MiroirTestStorageType}`;
};

/**
 * Homogeneous with other integ entries: prefer CLI argv, fall back to env, then default.
 */
export function resolveRealServerUiIntegrationProfile(
  input: ResolveRealServerUiIntegrationProfileInput = {},
): ResolveRealServerUiIntegrationProfileResult {
  const argv = input.argv ?? [];
  const env = input.env ?? process.env;
  const defaultStorage = input.defaultStorage ?? "sql";

  const fromStorageArg = parseStorageArg(argv);
  if (fromStorageArg) {
    return {
      storage: fromStorageArg,
      profileName: realServerProfileNameForStorage(fromStorageArg),
    };
  }

  const fromEnvStorage = env.MIROIR_TEST_STORAGE;
  if (fromEnvStorage) {
    if (!isMiroirTestStorageType(fromEnvStorage)) {
      throw new Error(
        `Invalid MIROIR_TEST_STORAGE "${fromEnvStorage}" (expected sql | filesystem | indexedDb | mongodb)`,
      );
    }
    return {
      storage: fromEnvStorage,
      profileName: realServerProfileNameForStorage(fromEnvStorage),
    };
  }

  const fromProfileArg = parseProfileArg(argv);
  if (fromProfileArg) {
    const storage = storageFromRealServerProfileName(fromProfileArg);
    if (storage) {
      return {
        storage,
        profileName: realServerProfileNameForStorage(storage),
      };
    }
    throw new Error(
      `resolveRealServerUiIntegrationProfile: --profile "${fromProfileArg}" is not a realServer-* profile ` +
        `(expected realServer-sql | realServer-filesystem | realServer-indexedDb | realServer-mongodb)`,
    );
  }

  const fromConfigFile = storageFromConfigFilename(env.VITE_MIROIR_TEST_CONFIG_FILENAME);
  if (fromConfigFile) {
    return {
      storage: fromConfigFile,
      profileName: realServerProfileNameForStorage(fromConfigFile),
    };
  }

  return {
    storage: defaultStorage,
    profileName: realServerProfileNameForStorage(defaultStorage),
  };
}

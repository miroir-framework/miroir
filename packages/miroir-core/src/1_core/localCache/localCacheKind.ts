import { localCacheKinds, type LocalCacheKind } from "../../0_interfaces/4-services/LocalCacheModule";

// #446, #656: test platforms and UI test helpers start on the local cache MIROIR_TEST_LOCAL_CACHE
// names (set by `run-nonreg.py --local-cache`). Unset means redux.

export const LOCAL_CACHE_ENV = "MIROIR_TEST_LOCAL_CACHE";

/** The local cache a MIROIR_TEST_LOCAL_CACHE value names; throws on a value naming none. */
export function localCacheKindFromValue(value: string | undefined): LocalCacheKind {
  if (!value) {
    return "redux";
  }
  if (!(localCacheKinds as readonly string[]).includes(value)) {
    throw new Error(
      `${LOCAL_CACHE_ENV}=${value} is not a LocalCache implementation, use one of: ${localCacheKinds.join(", ")}`,
    );
  }
  return value as LocalCacheKind;
}

/**
 * The local cache the test environment names. The composition root passes its environment
 * (`process.env`); a browser has none (`undefined`), so it runs on redux.
 */
export function localCacheKindFromEnvironment(
  env: Record<string, string | undefined> | undefined,
): LocalCacheKind {
  return localCacheKindFromValue(env?.[LOCAL_CACHE_ENV]);
}

import { localCacheKindFromEnvironment, type LocalCacheKind, type LocalCacheModule } from "@miroir-framework/core";
import { loadLocalCache } from "@miroir-framework/react";

// #446, #656: the LocalCache implementation the tests build their DomainControllers on, chosen by
// MIROIR_TEST_LOCAL_CACHE (set by `run-nonreg.py --local-cache`, read by core). Unset means redux.
// Each implementation is a lazy entry of @miroir-framework/react: the webapp, which reaches this file
// through the Miroir Tests UI, has no MIROIR_TEST_LOCAL_CACHE and loads redux only.

export async function loadLocalCacheImplementation(
  implementation: LocalCacheKind = localCacheKindFromEnvironment(
    typeof process !== "undefined" ? process.env : undefined,
  ),
): Promise<LocalCacheModule> {
  return (await loadLocalCache(implementation)).localCacheModule;
}

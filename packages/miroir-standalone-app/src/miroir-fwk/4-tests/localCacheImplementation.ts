import { localCacheKindFromEnvironment, type LocalCacheKind, type LocalCacheModule } from "@miroir-framework/core";
// #652: the redux local cache, bundled into @miroir-framework/react; this entry carries no UI (Node test setups)
import * as LocalCacheRedux from "@miroir-framework/react/local-cache";

// #446, #656: the LocalCache implementation the tests build their DomainControllers on, chosen by
// MIROIR_TEST_LOCAL_CACHE (set by `run-nonreg.py --local-cache`, read by core). Unset means redux.

const reduxLocalCacheModule: LocalCacheModule = {
  kind: "redux",
  setupMiroirDomainController: LocalCacheRedux.setupMiroirDomainController,
  RestPersistenceClientAndRestClient: LocalCacheRedux.RestPersistenceClientAndRestClient,
};

// A computed specifier keeps zustand out of the webapp bundle, which reaches this file through the
// Miroir Tests UI: the browser has no MIROIR_TEST_LOCAL_CACHE, so it always runs on redux.
const zustandNodeEntry = "miroir-localcache-zustand/node";

/** Redux is already in the bundle; zustand is loaded only when chosen. */
export async function loadLocalCacheImplementation(
  implementation: LocalCacheKind = localCacheKindFromEnvironment(
    typeof process !== "undefined" ? process.env : undefined,
  ),
): Promise<LocalCacheModule> {
  if (implementation === "zustand") {
    return (await import(/* @vite-ignore */ zustandNodeEntry)).localCacheModule;
  }
  return reduxLocalCacheModule;
}

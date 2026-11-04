import {
  type LocalCacheInterface,
  type LocalCacheKind,
  type LocalCacheSliceState,
  type PersistenceStoreControllerManagerInterface,
  type PersistenceStoreLocalOrRemoteInterface,
  type RestPersistenceClientAndRestClientInterface,
} from "@miroir-framework/core";
import type { LoadedLocalCache, LocalCacheBinding, LocalCacheStateStore } from "@miroir-framework/react";
// types only: this file loads nothing. The caller hands it the entry of the local cache it started on, so a page holds
// one, and a vitest setup that loads this file does not load @miroir-framework/react's root before a test file's
// `vi.mock`s
import type * as ReduxEntryModule from "@miroir-framework/react/local-cache/redux";
import type * as ZustandEntryModule from "@miroir-framework/react/local-cache/zustand";

// #656: the local cache the UI test helpers build their stores on, the one the process started on. The app selects
// its own after `startMiroirClient` (`src/index.tsx`); the vitest setup (`tests/setup.ts`) selects the one
// MIROIR_TEST_LOCAL_CACHE names before any test runs.

/** How a test builds a local cache of the chosen implementation, without a domain controller. */
export interface TestLocalCache {
  readonly kind: LocalCacheKind;
  readonly localCacheBinding: LocalCacheBinding;
  /** A store holding a given model snapshot, without a domain controller (`LocalCacheStateStore`). */
  createLocalCacheStateStore(presentModelSnapshot: LocalCacheSliceState): LocalCacheStateStore;
  /** The implementation's `LocalCache` class, for spies on its prototype. */
  readonly LocalCache: { prototype: LocalCacheInterface };
  /**
   * A local cache, linked to a persistence store when `params` are given, as `setupMiroirDomainController` builds
   * them.
   */
  newLocalCache<P extends TestPersistenceStoreParams | undefined = undefined>(
    params?: P,
  ): {
    localCache: LocalCacheInterface;
    persistenceStore: P extends TestPersistenceStoreParams ? PersistenceStoreLocalOrRemoteInterface : undefined;
    /** Starts the persistence store on the local cache, as `setupMiroirDomainController` does (redux: its saga). */
    runPersistenceStore(): void;
  };
}

/** The parameters of the persistence store of a test local cache. */
export interface TestPersistenceStoreParams {
  persistenceStoreAccessMode: "local" | "remote";
  localPersistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
  remotePersistenceStoreRestClient?: RestPersistenceClientAndRestClientInterface;
}

type ReduxEntry = typeof ReduxEntryModule;
type ZustandEntry = typeof ZustandEntryModule;

function reduxTestLocalCache(entry: ReduxEntry): TestLocalCache {
  return {
    kind: "redux",
    localCacheBinding: entry.localCacheBinding,
    createLocalCacheStateStore: entry.createLocalCacheStateStore,
    LocalCache: entry.LocalCache,
    newLocalCache(params?: TestPersistenceStoreParams) {
      const persistenceStore = params ? new entry.PersistenceReduxSaga(params as any) : undefined;
      const localCache = new entry.LocalCache(persistenceStore);
      return { localCache, persistenceStore, runPersistenceStore: () => persistenceStore?.run(localCache) } as any;
    },
  };
}

function zustandTestLocalCache(entry: ZustandEntry): TestLocalCache {
  return {
    kind: "zustand",
    localCacheBinding: entry.localCacheBinding,
    createLocalCacheStateStore: entry.createLocalCacheStateStore,
    LocalCache: entry.LocalCache,
    newLocalCache(params?: TestPersistenceStoreParams) {
      const persistenceStore = params ? new entry.PersistenceAsyncStore(params) : undefined;
      const localCache = new entry.LocalCache(persistenceStore);
      // the zustand LocalCache links its persistence store when built: nothing to start
      return { localCache, persistenceStore, runPersistenceStore: () => persistenceStore?.setLocalCache(localCache) } as any;
    },
  };
}

// on globalThis, not in a module variable: a test that resets its modules (`vi.resetModules`) re-imports this file and
// keeps the selection
const SELECTED = Symbol.for("miroir.testLocalCache");
type WithSelected = { [SELECTED]?: TestLocalCache };

/** The local cache the UI test helpers build on: the one `selectTestLocalCache` selected. */
export function testLocalCache(): TestLocalCache {
  const selected = (globalThis as WithSelected)[SELECTED];
  if (!selected) {
    throw new Error("testLocalCache: no local cache selected; call selectTestLocalCache at startup");
  }
  return selected;
}

/**
 * Selects the local cache the UI test helpers build on: the process's own, given by its entry
 * (`loadLocalCache(kind)`, or `@miroir-framework/react/local-cache/<kind>`).
 */
export function selectTestLocalCache(entry: LoadedLocalCache | ReduxEntry | ZustandEntry): TestLocalCache {
  const selected =
    entry.localCacheBinding.kind === "zustand"
      ? zustandTestLocalCache(entry as ZustandEntry)
      : reduxTestLocalCache(entry as ReduxEntry);
  (globalThis as WithSelected)[SELECTED] = selected;
  return selected;
}

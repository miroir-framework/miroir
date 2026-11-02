// #656 (D9): the zustand local cache, `@miroir-framework/react/local-cache/zustand`: its React binding, the
// `LocalCacheModule` the startup builds domain controllers with, and its implementation classes (tests, sandboxes).
import { createStore } from "zustand/vanilla";

import type { LocalCacheSliceState, StateWithUndoRedo } from "@miroir-framework/core";
import { LocalCacheProvider, reduxStoreWithUndoRedoGetInitialState, useSelector } from "miroir-localcache-zustand";

import type { LocalCacheBinding, LocalCacheStateStore } from "./localCacheBinding.js";

export const localCacheBinding: LocalCacheBinding = {
  kind: "zustand",
  Provider: LocalCacheProvider as LocalCacheBinding["Provider"],
  useSelector: useSelector as LocalCacheBinding["useSelector"],
};

/** A zustand store holding `presentModelSnapshot` (`LocalCacheStateStore`). */
export function createLocalCacheStateStore(presentModelSnapshot: LocalCacheSliceState): LocalCacheStateStore {
  const store = createStore<StateWithUndoRedo>(() => ({ ...reduxStoreWithUndoRedoGetInitialState(), presentModelSnapshot }));
  return {
    store,
    setPresentModelSnapshot: (snapshot) => store.setState({ presentModelSnapshot: snapshot }),
  };
}

export {
  localCacheModule,
  LocalCache,
  PersistenceAsyncStore,
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController,
  reduxStoreWithUndoRedoGetInitialState,
  createLocalCacheStore,
} from "miroir-localcache-zustand";

// #656 (D9): the zustand local cache, `@miroir-framework/react/local-cache/zustand`: its React binding, the
// `LocalCacheModule` the startup builds domain controllers with, and its implementation classes (tests, sandboxes).
import { LocalCacheProvider, useSelector } from "miroir-localcache-zustand";

import type { LocalCacheBinding } from "./localCacheBinding.js";

export const localCacheBinding: LocalCacheBinding = {
  kind: "zustand",
  Provider: LocalCacheProvider as LocalCacheBinding["Provider"],
  useSelector: useSelector as LocalCacheBinding["useSelector"],
};

export {
  localCacheModule,
  LocalCache,
  PersistenceAsyncStore,
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController,
  reduxStoreWithUndoRedoGetInitialState,
  createLocalCacheStore,
} from "miroir-localcache-zustand";

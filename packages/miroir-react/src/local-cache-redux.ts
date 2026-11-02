// #656 (D9): the redux local cache, `@miroir-framework/react/local-cache/redux`: its React binding, the
// `LocalCacheModule` the startup builds domain controllers with, and its implementation classes (tests, sandboxes).
import { Provider, useSelector } from "react-redux";

import type { LocalCacheBinding } from "./localCacheBinding.js";

export const localCacheBinding: LocalCacheBinding = {
  kind: "redux",
  Provider: Provider as LocalCacheBinding["Provider"],
  useSelector: useSelector as LocalCacheBinding["useSelector"],
};

export {
  localCacheModule,
  LocalCache,
  PersistenceReduxSaga,
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController,
  reduxStoreWithUndoRedoGetInitialState,
  type ReduxStoreWithUndoRedo,
} from "miroir-localcache-redux/node";

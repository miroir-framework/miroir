// #656 (D9): the redux local cache, `@miroir-framework/react/local-cache/redux`: its React binding, the
// `LocalCacheModule` the startup builds domain controllers with, and its implementation classes (tests, sandboxes).
import { configureStore, createAction } from "@reduxjs/toolkit";
import { Provider, useSelector } from "react-redux";

import type { LocalCacheSliceState, StateWithUndoRedo } from "@miroir-framework/core";
import { reduxStoreWithUndoRedoGetInitialState } from "miroir-localcache-redux/node";

import type { LocalCacheBinding, LocalCacheStateStore } from "./localCacheBinding.js";

export const localCacheBinding: LocalCacheBinding = {
  kind: "redux",
  Provider: Provider as LocalCacheBinding["Provider"],
  useSelector: useSelector as LocalCacheBinding["useSelector"],
};

const setPresentModelSnapshot = createAction<LocalCacheSliceState>("localCacheStateStore/setPresentModelSnapshot");

/** A redux store holding `presentModelSnapshot` (`LocalCacheStateStore`). */
export function createLocalCacheStateStore(presentModelSnapshot: LocalCacheSliceState): LocalCacheStateStore {
  const initialState: StateWithUndoRedo = {
    ...reduxStoreWithUndoRedoGetInitialState(() => presentModelSnapshot),
    presentModelSnapshot,
  };
  const store = configureStore({
    reducer: (state: StateWithUndoRedo = initialState, action): StateWithUndoRedo =>
      setPresentModelSnapshot.match(action) ? { ...state, presentModelSnapshot: action.payload } : state,
  });
  return {
    store,
    setPresentModelSnapshot: (snapshot) => {
      store.dispatch(setPresentModelSnapshot(snapshot));
    },
  };
}

export {
  localCacheModule,
  LocalCache,
  PersistenceReduxSaga,
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController,
  reduxStoreWithUndoRedoGetInitialState,
  type ReduxStoreWithUndoRedo,
} from "miroir-localcache-redux/node";

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import {
  LocalCacheAction,
  LocalStoreInterface,
  RemoteDataStoreInterface,
  RemoteStoreAction,
  RemoteStoreActionReturnType
} from "miroir-core";
import {
  InstanceSlice,
  instanceSliceGeneratedActionNames,
  instanceSliceInputActionNamesObject
} from "src/4_services/localStore/InstanceReduxSlice";
import {
  createUndoRedoReducer,
  ReduxReducerWithUndoRedo,
  ReduxStoreWithUndoRedo
} from "src/4_services/localStore/UndoRedoReducer";
import InstanceRemoteAccessReduxSaga, {
  instanceSagaGeneratedActionNames,
  instanceSagaInputActionNamesArray
} from "src/4_services/remoteStore/InstanceRemoteAccessReduxSaga";


// ###############################################################################
/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalStoreInterface, RemoteDataStoreInterface {
  private innerReduxStore: ReduxStoreWithUndoRedo;
  private staticReducers: ReduxReducerWithUndoRedo;
  private sagaMiddleware: any;

  // ###############################################################################
  constructor(
    // public entityRemoteAccessReduxSaga: EntityRemoteAccessReduxSaga,
    public instanceRemoteAccessReduxSaga: InstanceRemoteAccessReduxSaga
  ) {
    this.staticReducers = createUndoRedoReducer(
      combineReducers(
        {
          miroirInstances: InstanceSlice.reducer,
        }
      )
    );

    this.sagaMiddleware = sagaMiddleware();

    const ignoredActionsList = [
      ...instanceSagaInputActionNamesArray,
      ...instanceSagaGeneratedActionNames,
      ...instanceSliceGeneratedActionNames,
    ];

    console.log('ReduxStore ignoredActionsList',ignoredActionsList);
    this.innerReduxStore = configureStore({
      reducer: this.staticReducers,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            // Ignore these action types
            ignoredActions: ignoredActionsList,
            // Ignore these field paths in all actions
            ignoredActionPaths: ["meta.promiseActions"],
          },
        })
        .concat(promiseMiddleware)
        .concat(this.sagaMiddleware),
    });
  } //end constructor

  // ###############################################################################
  getInnerStore() {
    return this.innerReduxStore;
  }

  // ###############################################################################
  public run(): void {
    this.sagaMiddleware.run(this.rootSaga.bind(this));
  }

  // ###############################################################################
  handleRemoteStoreAction(action: RemoteStoreAction): Promise<RemoteStoreActionReturnType> {
    return this.innerReduxStore.dispatch(
      this.instanceRemoteAccessReduxSaga.instanceSagaInputPromiseActions.handleRemoteStoreAction.creator(action)
    )
  }

  // ###############################################################################
  handleLocalCacheAction(action:LocalCacheAction) {
    this.innerReduxStore.dispatch(
      InstanceSlice.actionCreators[instanceSliceInputActionNamesObject.handleLocalCacheAction](action)
    );
  }

  // ###############################################################################
  private *rootSaga(
  ) {
    console.log("ReduxStore rootSaga running", this.instanceRemoteAccessReduxSaga);
    yield all([
      this.instanceRemoteAccessReduxSaga.instanceRootSaga.bind(this.instanceRemoteAccessReduxSaga)(),
    ]);
  }
}

  // ###############################################################################
  export default {};
import { combineReducers, configureStore, PayloadAction } from '@reduxjs/toolkit';
import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';

import {
  LocalCacheAction,
  LocalCacheInterface,
  RemoteDataStoreInterface,
  RemoteStoreAction,
  RemoteStoreActionReturnType,
  LocalCacheInfo,
} from "miroir-core";
import {
  LocalCacheSlice,
  localCacheSliceGeneratedActionNames,
  localCacheSliceInputActionNamesObject
} from "src/4_services/localStore/LocalCacheSlice";
import {
  createUndoRedoReducer,
  InnerStoreStateInterface,
  ReduxReducerWithUndoRedoInterface,
  ReduxStateChanges,
  ReduxStoreWithUndoRedo
} from "src/4_services/localStore/LocalCacheSliceUndoRedoReducer";
import RemoteStoreAccessReduxSaga, {
  RemoteStoreSagaGeneratedActionNames,
  RemoteStoreSagaInputActionNamesArray
} from "src/4_services/remoteStore/RemoteStoreAccessSaga";


function roughSizeOfObject( object ) {

  var objectList = [];
  var stack = [ object ];
  var bytes = 0;

  while ( stack.length ) {
      var value = stack.pop();

      if ( typeof value === 'boolean' ) {
          bytes += 4;
      }
      else if ( typeof value === 'string' ) {
          bytes += value.length * 2;
      }
      else if ( typeof value === 'number' ) {
          bytes += 8;
      }
      else if
      (
          typeof value === 'object'
          && objectList.indexOf( value ) === -1
      )
      {
          objectList.push( value );

          for( var i in value ) {
              stack.push( value[ i ] );
          }
      }
  }
  return bytes;
}
// ###############################################################################
/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalCacheInterface, RemoteDataStoreInterface {
  private innerReduxStore: ReduxStoreWithUndoRedo;
  private staticReducers: ReduxReducerWithUndoRedoInterface;
  private sagaMiddleware: any;

  // ###############################################################################
  constructor(
    // public entityRemoteAccessReduxSaga: EntityRemoteAccessReduxSaga,
    public RemoteStoreAccessReduxSaga: RemoteStoreAccessReduxSaga
  ) {
    this.staticReducers = createUndoRedoReducer(
      combineReducers<InnerStoreStateInterface,PayloadAction<LocalCacheAction>>(
      // combineReducers(
        {
          miroirInstances: LocalCacheSlice.reducer,
        }
      ) 
      // ) as Reducer<CombinedState<InnerStoreStateInterface>, PayloadAction<LocalCacheAction>>
    );

    this.sagaMiddleware = sagaMiddleware();

    const ignoredActionsList = [
      ...RemoteStoreSagaInputActionNamesArray,
      ...RemoteStoreSagaGeneratedActionNames,
      ...localCacheSliceGeneratedActionNames,
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
  public currentInfo(): LocalCacheInfo {
    // this.sagaMiddleware.run(this.rootSaga.bind(this));
    return {
      localCacheSize: roughSizeOfObject(this.innerReduxStore.getState().presentModelSnapshot)
    }
  }

  // ###############################################################################
  async handleRemoteStoreAction(action: RemoteStoreAction): Promise<RemoteStoreActionReturnType> {
    const result:Promise<RemoteStoreActionReturnType> = await this.innerReduxStore.dispatch( // remote store access is accomplished through asynchronous sagas
      this.RemoteStoreAccessReduxSaga.instanceSagaInputPromiseActions.handleRemoteStoreAction.creator(action)
    )
    console.log("handleRemoteStoreAction", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  handleLocalCacheAction(action:LocalCacheAction) {
    this.innerReduxStore.dispatch(
      LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction](action)
    );
  }

  // ###############################################################################
  currentTransaction():ReduxStateChanges[]{
    console.log("ReduxStore currentTransaction called");
    return this.innerReduxStore.getState().pastModelPatches;
  }

  // ###############################################################################
  private *rootSaga(
  ) {
    console.log("ReduxStore rootSaga running", this.RemoteStoreAccessReduxSaga);
    yield all([
      this.RemoteStoreAccessReduxSaga.instanceRootSaga.bind(this.RemoteStoreAccessReduxSaga)(),
    ]);
  }
}

  // ###############################################################################
  export default {};
import { combineReducers, configureStore, PayloadAction } from '@reduxjs/toolkit';
import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';


import {
  DomainAncillaryOrReplayableAction,
  DomainDataAction,
  DomainModelAncillaryOrReplayableAction,
  DomainModelReplayableAction,
  EntityDefinition,
  entityEntity,
  entityModelVersion,
  entityReport,
  entityStoreBasedConfiguration,
  LocalCacheInfo,
  LocalCacheInterface,
  MiroirMetaModel,
  MiroirModelVersion,
  MiroirReport,
  RemoteDataStoreInterface,
  RemoteStoreCRUDAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction,
  StoreBasedConfiguration
} from "miroir-core";
import {
  LocalCacheSlice,
  localCacheSliceGeneratedActionNames,
  localCacheSliceInputActionNamesObject
} from "src/4_services/localStore/LocalCacheSlice";
import {
  createUndoRedoReducer,
  InnerStoreStateInterface,
  ReduxReducerWithUndoRedoInterface, ReduxStoreWithUndoRedo
} from "src/4_services/localStore/UndoRedoReducer";
import RemoteStoreRestAccessReduxSaga, {
  RemoteStoreRestSagaGeneratedActionNames,
  RemoteStoreRestSagaInputActionNamesArray
} from "src/4_services/remoteStore/RemoteStoreRestAccessSaga";


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
    public RemoteStoreAccessReduxSaga: RemoteStoreRestAccessReduxSaga
  ) {
    this.staticReducers = createUndoRedoReducer(
      combineReducers<InnerStoreStateInterface,PayloadAction<DomainDataAction>>(
        {
          miroirInstances: LocalCacheSlice.reducer,
        }
      ) 
    );

    this.sagaMiddleware = sagaMiddleware();

    const ignoredActionsList = [
      ...RemoteStoreRestSagaInputActionNamesArray,
      ...RemoteStoreRestSagaGeneratedActionNames,
      ...localCacheSliceGeneratedActionNames,
    ];

    console.log('ReduxStore ignoredActionsList',ignoredActionsList);
    this.innerReduxStore = configureStore({
      reducer: this.staticReducers,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ignoredActionsList, // Ignore these action types
            ignoredActionPaths: [
              "meta.promiseActions",
              "pastModelPatches.0.action.asyncDispatch",
            ], // Ignore these field paths in all actions
          },
        })
        .concat(promiseMiddleware)
        .concat(this.sagaMiddleware)
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
  public currentModel():MiroirMetaModel{
    console.log('currentModel() from state:',this.innerReduxStore.getState());
    
    return {
      entities: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[entityEntity.uuid].entities) as EntityDefinition[],
      reports: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[entityReport.uuid].entities) as MiroirReport[],
      configuration: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[entityStoreBasedConfiguration.uuid].entities) as StoreBasedConfiguration[],
      modelVersions: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[entityModelVersion.uuid].entities) as MiroirModelVersion[],
    };
  }

  // ###############################################################################
  async handleRemoteStoreCRUDAction(action: RemoteStoreCRUDAction): Promise<RemoteStoreCRUDActionReturnType> {
    const result:Promise<RemoteStoreCRUDActionReturnType> = await this.innerReduxStore.dispatch( // remote store access is accomplished through asynchronous sagas
      this.RemoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreCRUDAction.creator(action)
    )
    console.log("handleRemoteStoreCRUDAction", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  async handleRemoteStoreModelAction(action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType> {
    const result:Promise<RemoteStoreCRUDActionReturnType> = await this.innerReduxStore.dispatch( // remote store access is accomplished through asynchronous sagas
      this.RemoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreModelAction.creator(action)
    )
    console.log("handleRemoteStoreModelAction", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  handleLocalCacheModelAction(action:DomainModelAncillaryOrReplayableAction) {
    this.innerReduxStore.dispatch(
      // LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheModelAction](action)
      LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction](action)
    );
  }

  // ###############################################################################
  handleLocalCacheDataAction(action:DomainDataAction) {
    this.innerReduxStore.dispatch(
      // LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheDataAction](action)
      LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction](action)
    );
  }

  // ###############################################################################
  handleLocalCacheAction(action:DomainAncillaryOrReplayableAction) {
    this.innerReduxStore.dispatch(
      // LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheDataAction](action)
      LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction](action)
    );
  }

  // ###############################################################################
  currentTransaction():DomainModelReplayableAction[]{
    console.log("ReduxStore currentTransaction called");
    return this.innerReduxStore.getState().pastModelPatches.map(p=>p.action);
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
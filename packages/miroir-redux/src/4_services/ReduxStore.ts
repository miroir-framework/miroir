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
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition,
  entityApplicationVersion,
  entityReport,
  entityStoreBasedConfiguration,
  LocalCacheInfo,
  LocalCacheInterface,
  MetaEntity,
  MiroirMetaModel,
  MiroirApplicationVersion,
  MiroirReport,
  RemoteDataStoreInterface,
  RemoteStoreCRUDAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction,
  StoreBasedConfiguration,
  applicationDeploymentMiroir,
  Uuid,
  DomainAncillaryOrReplayableActionWithDeployment,
  ApplicationSection
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

  var objectList:any[] = [];
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
      // combineReducers<InnerStoreStateInterface,PayloadAction<DomainDataAction>>(
      combineReducers<InnerStoreStateInterface,PayloadAction<DomainAncillaryOrReplayableActionWithDeployment>>(
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
  getState() {
    return this.innerReduxStore.getState();
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
  public currentModel(deploymentUuid:string):MiroirMetaModel{
    console.log('currentModel(',deploymentUuid,') from state:',this.innerReduxStore.getState());
    
    if (!deploymentUuid) {
      throw new Error('currentModel(deploymentUuid) parameter can not be undefined.');
    } else {
      if (deploymentUuid == applicationDeploymentMiroir.uuid) {
        return {
          entities: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[applicationDeploymentMiroir.uuid]['model'][entityEntity.uuid].entities) as MetaEntity[],
          entityDefinitions: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[applicationDeploymentMiroir.uuid]['model'][entityEntityDefinition.uuid].entities) as EntityDefinition[],
          reports: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[applicationDeploymentMiroir.uuid]['data'][entityReport.uuid].entities) as MiroirReport[],
          configuration: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[applicationDeploymentMiroir.uuid]['data'][entityStoreBasedConfiguration.uuid].entities) as StoreBasedConfiguration[],
          applicationVersions: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[applicationDeploymentMiroir.uuid]['data'][entityApplicationVersion.uuid].entities) as MiroirApplicationVersion[],
          applicationVersionCrossEntityDefinition: [],
        };
      } else {
        return {
          entities: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[deploymentUuid]['model'][entityEntity.uuid].entities) as MetaEntity[],
          entityDefinitions: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[deploymentUuid]['model'][entityEntityDefinition.uuid].entities) as EntityDefinition[],
          reports: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[deploymentUuid]['model'][entityReport.uuid].entities) as MiroirReport[],
          configuration: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[deploymentUuid]['model'][entityStoreBasedConfiguration.uuid].entities) as StoreBasedConfiguration[],
          applicationVersions: Object.values(this.innerReduxStore.getState().presentModelSnapshot.miroirInstances[deploymentUuid]['model'][entityApplicationVersion.uuid].entities) as MiroirApplicationVersion[],
          applicationVersionCrossEntityDefinition: [],
        };
      }
    }
  }

  // // ###############################################################################
  // async handleRemoteStoreCRUDAction(action: RemoteStoreCRUDAction): Promise<RemoteStoreCRUDActionReturnType> {
  //   const result:Promise<RemoteStoreCRUDActionReturnType> = await this.innerReduxStore.dispatch( // remote store access is accomplished through asynchronous sagas
  //     this.RemoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreCRUDAction.creator(action)
  //   )
  //   console.log("ReduxStore handleRemoteStoreCRUDAction", action, "returned", result)
  //   return Promise.resolve(result);
  // }

  // // ###############################################################################
  // async handleRemoteStoreModelAction(action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType> {
  //   const result:Promise<RemoteStoreCRUDActionReturnType> = await this.innerReduxStore.dispatch( // remote store access is accomplished through asynchronous sagas
  //     this.RemoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreModelAction.creator(action)
  //   )
  //   console.log("ReduxStore handleRemoteStoreModelAction", action, "returned", result)
  //   return Promise.resolve(result);
  // }

  // ###############################################################################
  async handleRemoteStoreCRUDActionWithDeployment(deploymentUuid: string, section: ApplicationSection, action: RemoteStoreCRUDAction): Promise<RemoteStoreCRUDActionReturnType> {
    const result:Promise<RemoteStoreCRUDActionReturnType> = await this.innerReduxStore.dispatch( // remote store access is accomplished through asynchronous sagas
      this.RemoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreCRUDActionWithDeployment.creator({deploymentUuid, section, action})
    )
    console.log("ReduxStore handleRemoteStoreCRUDActionWithDeployment", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  async handleRemoteStoreModelActionWithDeployment(deploymentUuid: string, action: RemoteStoreModelAction): Promise<RemoteStoreCRUDActionReturnType> {
    const result:Promise<RemoteStoreCRUDActionReturnType> = await this.innerReduxStore.dispatch( // remote store access is accomplished through asynchronous sagas
      this.RemoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreModelActionWithDeployment.creator({deploymentUuid, action})
    )
    console.log("ReduxStore handleRemoteStoreModelActionWithDeployment", action, "returned", result)
    return Promise.resolve(result);
  }

  // // ###############################################################################
  // handleLocalCacheModelAction(domainAction:DomainModelAncillaryOrReplayableAction) {
  handleLocalCacheModelAction(deploymentUuid: Uuid, domainAction:DomainModelAncillaryOrReplayableAction) {
    this.innerReduxStore.dispatch(
      // LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheModelAction](action)
      // LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction](applicationDeploymentMiroir.uuid,action)
      LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction]({deploymentUuid, domainAction})
    );
  }

  // // ###############################################################################
  // handleLocalCacheDataAction(domainAction:DomainDataAction) {
  handleLocalCacheDataAction(deploymentUuid: Uuid, domainAction:DomainDataAction) {
    this.innerReduxStore.dispatch(
      // LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheDataAction](action)
      // LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction](applicationDeploymentMiroir.uuid,action)
      LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction]({deploymentUuid, domainAction})
    );
  }

  // // ###############################################################################
  // handleLocalCacheAction(domainAction:DomainAncillaryOrReplayableAction) {
  handleLocalCacheAction(deploymentUuid: Uuid, domainAction:DomainAncillaryOrReplayableAction) {
    this.innerReduxStore.dispatch(
      // LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheDataAction](action)
      // LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction](applicationDeploymentMiroir.uuid,action)
      LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheAction]({deploymentUuid, domainAction})
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
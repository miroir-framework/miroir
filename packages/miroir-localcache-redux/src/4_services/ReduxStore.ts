import { configureStore } from '@reduxjs/toolkit';
import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';


import {
  ApplicationSection,
  DomainTransactionalActionWithCUDUpdate,
  ModelAction,
  EntityDefinition,
  JzodSchemaDefinition,
  LocalCacheCUDActionWithDeployment,
  LocalCacheModelActionWithDeployment,
  LocalCacheInfo,
  LocalCacheInterface,
  LocalCacheTransactionalActionWithDeployment,
  LoggerInterface,
  MetaEntity,
  MiroirApplicationVersionOLD_DO_NOT_USE,
  MiroirLoggerFactory,
  RemoteStoreActionReturnType,
  RemoteStoreCRUDAction,
  RemoteStoreInterface,
  // RemoteStoreOLDModelAction,
  Report,
  StoreBasedConfiguration,
  applicationDeploymentMiroir,
  entityApplicationVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  entityReport,
  entityStoreBasedConfiguration,
  getLoggerName,
  InstanceAction,
  EntityInstanceCollection,
  StoreAction,
  MiroirAction,
  ActionReturnType,
  ACTION_OK,
  MetaModel,
  JzodSchema
} from "miroir-core";
import RemoteStoreRestAccessReduxSaga, {
  RemoteStoreRestSagaGeneratedActionNames,
  RemoteStoreRestSagaInputActionNamesArray
} from "../4_services/remoteStore/RemoteStoreRestAccessSaga";
import { packageName } from '../constants';
import { cleanLevel } from './constants';
import {
  LocalCacheSlice,
  getLocalCacheSliceIndex,
  localCacheSliceGeneratedActionNames,
} from "./localCache/LocalCacheSlice";
import {
  createUndoRedoReducer,
} from "./localCache/UndoRedoReducer";
import { ReduxReducerWithUndoRedoInterface, ReduxStoreWithUndoRedo, localCacheSliceInputActionNamesObject } from './localCache/localCacheReduxSliceInterface';

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReduxStore");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
function roughSizeOfObject( object: any ) {

  const objectListReportSection:any[] = [];
  const stack = [ object ];
  let bytes = 0;

  while ( stack.length ) {
      const value = stack.pop();

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
          && objectListReportSection.indexOf( value ) === -1
      )
      {
          objectListReportSection.push( value );

          for( let i in value ) {
              stack.push( value[ i ] );
          }
      }
  }
  return bytes;
}

// ###############################################################################
function exceptionToActionReturnType(f:()=>void): ActionReturnType {
  try {
    f()
  } catch (e) {
    return {
      status: "error",
      error: {
        errorType: "FailedToDeployModule", // TODO: correct errorType
        errorMessage: e
      }
    }
  }
  return ACTION_OK;
}
// ###############################################################################
/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalCacheInterface, RemoteStoreInterface {
  private innerReduxStore: ReduxStoreWithUndoRedo;
  private staticReducers: ReduxReducerWithUndoRedoInterface;
  private sagaMiddleware: any;

  // ###############################################################################
  constructor(public remoteStoreAccessReduxSaga: RemoteStoreRestAccessReduxSaga) {
    this.staticReducers = createUndoRedoReducer(LocalCacheSlice.reducer);

    this.sagaMiddleware = sagaMiddleware();

    const ignoredActionsList = [
      ...RemoteStoreRestSagaInputActionNamesArray,
      ...RemoteStoreRestSagaGeneratedActionNames,
      ...localCacheSliceGeneratedActionNames,
    ];

    log.info("ReduxStore ignoredActionsList", ignoredActionsList);
    this.innerReduxStore = configureStore({
      reducer: this.staticReducers,
      middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware(
          {
            serializableCheck: {
              ignoredActions: ignoredActionsList, // Ignore these action types
              ignoredActionPaths: ["meta.promiseActions", "pastModelPatches.0.action.asyncDispatch"], // Ignore these field paths in all actions
            },
          }
        )
        .concat(promiseMiddleware)
        .concat(this.sagaMiddleware)
      },
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
      localCacheSize: roughSizeOfObject(this.innerReduxStore.getState().presentModelSnapshot),
    };
  }

  // ###############################################################################
  // FOR TESTING PURPOSES ONLY!!!!! TO REMOVE?
  public currentModel(deploymentUuid: string): MetaModel {
    log.info(
      "called currentModel(",
      deploymentUuid,")"
    );
    log.trace(
      "called currentModel(",
      deploymentUuid,
      ") from state:",
      this.innerReduxStore.getState().presentModelSnapshot
    );
    const reduxState = this.innerReduxStore.getState().presentModelSnapshot;

    if (!deploymentUuid) {
      throw new Error("currentModel(deploymentUuid) parameter can not be undefined.");
    } else {
      if (deploymentUuid == applicationDeploymentMiroir.uuid) {
        return {
          applicationVersions: Object.values(
            reduxState[getLocalCacheSliceIndex(applicationDeploymentMiroir.uuid, "data", entityApplicationVersion.uuid)]
              .entities
          ) as MiroirApplicationVersionOLD_DO_NOT_USE[],
          applicationVersionCrossEntityDefinition: [],
          configuration: Object.values(
            reduxState[
              getLocalCacheSliceIndex(applicationDeploymentMiroir.uuid, "data", entityStoreBasedConfiguration.uuid)
            ].entities
          ) as StoreBasedConfiguration[],
          entities: Object.values(
            reduxState[getLocalCacheSliceIndex(applicationDeploymentMiroir.uuid, "model", entityEntity.uuid)].entities
          ) as MetaEntity[],
          entityDefinitions: Object.values(
            reduxState[getLocalCacheSliceIndex(applicationDeploymentMiroir.uuid, "model", entityEntityDefinition.uuid)]
              .entities
          ) as EntityDefinition[],
          jzodSchemas: Object.values(
            reduxState[getLocalCacheSliceIndex(applicationDeploymentMiroir.uuid, "data", entityJzodSchema.uuid)]
              .entities
          ) as JzodSchema[],
          reports: Object.values(
            reduxState[getLocalCacheSliceIndex(applicationDeploymentMiroir.uuid, "data", entityReport.uuid)].entities
          ) as Report[],
        };
      } else {
        // log.info('currentModel reports',reports,getLocalCacheSliceIndex(deploymentUuid,'model',entityReport.uuid));

        return {
          applicationVersions: Object.values(
            reduxState[getLocalCacheSliceIndex(deploymentUuid, "model", entityApplicationVersion.uuid)]?.entities ?? {}
          ) as MiroirApplicationVersionOLD_DO_NOT_USE[],
          applicationVersionCrossEntityDefinition: [],
          configuration: Object.values(
            reduxState[getLocalCacheSliceIndex(deploymentUuid, "model", entityStoreBasedConfiguration.uuid)]
              ?.entities ?? {}
          ) as StoreBasedConfiguration[],
          entities: Object.values(
            reduxState[getLocalCacheSliceIndex(deploymentUuid, "model", entityEntity.uuid)]?.entities ?? {}
          ) as MetaEntity[],
          entityDefinitions: Object.values(
            reduxState[getLocalCacheSliceIndex(deploymentUuid, "model", entityEntityDefinition.uuid)]?.entities ?? {}
          ) as EntityDefinition[],
          jzodSchemas: Object.values(
            reduxState[getLocalCacheSliceIndex(deploymentUuid, "model", entityJzodSchema.uuid)]?.entities ?? {}
          ) as JzodSchema[],
          reports: Object.values(
            reduxState[getLocalCacheSliceIndex(deploymentUuid, "model", entityReport.uuid)]?.entities ?? {}
          ) as Report[],
        };
      }
    }
  }

  // ###############################################################################
  async handleRemoteStoreRestCRUDAction(
    deploymentUuid: string,
    section: ApplicationSection,
    action: RemoteStoreCRUDAction
  ): Promise<ActionReturnType> {
    // const result: RemoteStoreActionReturnType = await this.innerReduxStore.dispatch(
    const result: ActionReturnType = await this.innerReduxStore.dispatch(
      // remote store access is accomplished through asynchronous sagas
      this.remoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreRestCRUDAction.creator(
        { deploymentUuid, section, action }
      )
    );
    log.info("ReduxStore handleRemoteStoreRestCRUDAction done: action", action, "returned", result)
    return Promise.resolve(result);
  }

  // // ###############################################################################
  // async handleRemoteStoreOLDModelAction(
  //   deploymentUuid: string,
  //   action: RemoteStoreOLDModelAction
  // // ): Promise<RemoteStoreActionReturnType> {
  // ): Promise<ActionReturnType> {
  //   const result: ActionReturnType = await this.innerReduxStore.dispatch(
  //     // remote store access is accomplished through asynchronous sagas
  //     this.remoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreOLDModelAction.creator(
  //       { deploymentUuid, action }
  //     )
  //   );
  //   // log.info("ReduxStore handleRemoteStoreOLDModelAction", action, "returned", result)
  //   return Promise.resolve(result);
  // }

  // ###############################################################################
  async handleRemoteStoreModelAction(
    deploymentUuid: string,
    action: ModelAction,
  // ): Promise<RemoteStoreActionReturnType> {
  ): Promise<ActionReturnType> {
    const result: ActionReturnType = await this.innerReduxStore.dispatch(
      // remote store access is accomplished through asynchronous sagas
      this.remoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreModelAction.creator(
        { deploymentUuid, action }
      )
    );
    // log.info("ReduxStore handleRemoteStoreOLDModelAction", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  async handleRemoteAction(
    deploymentUuid: string,
    action: MiroirAction,
  // ): Promise<RemoteStoreActionReturnType> {
  ): Promise<ActionReturnType> {
    const result: ActionReturnType = await this.innerReduxStore.dispatch(
      // remote store access is accomplished through asynchronous sagas
      this.remoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteAction.creator(
        { deploymentUuid, action }
      )
    );
    // log.info("ReduxStore handleRemoteStoreOLDModelAction", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  handleLocalCacheTransactionalAction(localCacheTransactionalAction: LocalCacheTransactionalActionWithDeployment): ActionReturnType {
    // const result:ActionReturnType = this.innerReduxStore.dispatch(
    return exceptionToActionReturnType(
      ()=> this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheTransactionalAction](localCacheTransactionalAction)
      )
    )
    // return ACTION_OK;
  }

  // ###############################################################################
  handleLocalCacheModelAction(localCacheEntityAction: LocalCacheModelActionWithDeployment): ActionReturnType {
    // const result: ActionReturnType = this.innerReduxStore.dispatch(
    return exceptionToActionReturnType(
      ()=> this.innerReduxStore.dispatch(
      LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheModelAction](localCacheEntityAction)
    ));
  }

  // ###############################################################################
  handleEndpointAction(endPointAction: InstanceAction): ActionReturnType {
    // const result: ActionReturnType = this.innerReduxStore.dispatch(
    return exceptionToActionReturnType(() =>
      this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleEndpointAction](endPointAction)
      )
    );
  }

  // ###############################################################################
  createInstance(
    deploymentUuid: string,
    applicationSection: ApplicationSection,
    objects: EntityInstanceCollection[],
  ): ActionReturnType {
    // const result: ActionReturnType = this.innerReduxStore.dispatch(
      return exceptionToActionReturnType(() =>
        this.innerReduxStore.dispatch(
          LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.createInstance]({
            deploymentUuid,
            applicationSection,
            objects,
          })
        )
      );
  }

  // ###############################################################################
  handleLocalCacheCUDAction(instanceCUDAction: LocalCacheCUDActionWithDeployment): ActionReturnType {
    log.info("handleLocalCacheCUDAction", instanceCUDAction);
    
    return exceptionToActionReturnType(() =>
      this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheCUDAction](
          instanceCUDAction
        )
      )
    );
  }

  // ###############################################################################
  currentTransaction(): (DomainTransactionalActionWithCUDUpdate | LocalCacheModelActionWithDeployment)[] {
    // log.info("ReduxStore currentTransaction called");
    return this.innerReduxStore.getState().pastModelPatches.map((p) => p.action);
  }

  // ###############################################################################
  private *rootSaga() {
    // log.info("ReduxStore rootSaga running", this.RemoteStoreRestAccessReduxSaga);
    yield all([this.remoteStoreAccessReduxSaga.instanceRootSaga.bind(this.remoteStoreAccessReduxSaga)()]);
  }
}
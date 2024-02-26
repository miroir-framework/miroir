import { configureStore } from '@reduxjs/toolkit';
import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';


import {
  ACTION_OK,
  ActionReturnType,
  ApplicationSection,
  InstanceAction,
  LocalCacheInfo,
  LocalCacheInterface,
  LocalCacheTransactionalInstanceActionWithDeployment,
  LocalCacheUndoRedoAction,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ModelAction,
  RemoteStoreCRUDAction,
  RemoteStoreInterface,
  StoreOrBundleAction,
  getLoggerName
} from "miroir-core";
import RemoteStoreRestAccessReduxSaga, {
  RemoteStoreRestSagaGeneratedActionNames,
  RemoteStoreRestSagaInputActionNamesArray
} from "../4_services/remoteStore/RemoteStoreRestAccessSaga";
import { packageName } from '../constants';
import { cleanLevel } from './constants';
import {
  LocalCacheSlice,
  currentModel,
  localCacheSliceGeneratedActionNames
} from "./localCache/LocalCacheSlice";
import {
  createUndoRedoReducer,
} from "./localCache/UndoRedoReducer";
import {
  ReduxReducerWithUndoRedoInterface,
  ReduxStoreWithUndoRedo,
  localCacheSliceInputActionNamesObject,
} from "./localCache/localCacheReduxSliceInterface";

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

    return currentModel(deploymentUuid,reduxState);
  }

  // ###############################################################################
  async handleRemoteStoreRestCRUDAction(
    deploymentUuid: string,
    section: ApplicationSection,
    action: RemoteStoreCRUDAction
  ): Promise<ActionReturnType> {
    const result: ActionReturnType = await this.innerReduxStore.dispatch(
      // remote store access is accomplished through asynchronous sagas
      this.remoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreRestCRUDAction.creator(
        { deploymentUuid, section, action }
      )
    );
    log.info("ReduxStore handleRemoteStoreRestCRUDAction done: action", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  async handleRemoteStoreModelAction(
    deploymentUuid: string,
    action: ModelAction,
  ): Promise<ActionReturnType> {
    const result: ActionReturnType = await this.innerReduxStore.dispatch(
      // remote store access is accomplished through asynchronous sagas
      this.remoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreModelAction.creator(
        { deploymentUuid, action }
      )
    );
    // log.info("ReduxStore handleRemoteStoreModelAction", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  async handleRemoteStoreActionOrBundleAction(
    deploymentUuid: string,
    action: StoreOrBundleAction,
  ): Promise<ActionReturnType> {
    const result: ActionReturnType = await this.innerReduxStore.dispatch(
      // remote store access is accomplished through asynchronous sagas
      this.remoteStoreAccessReduxSaga.remoteStoreRestAccessSagaInputPromiseActions.handleRemoteStoreActionOrBundleAction.creator(
        { deploymentUuid, action }
      )
    );
    // log.info("ReduxStore handleRemoteStoreOLDModelAction", action, "returned", result)
    return Promise.resolve(result);
  }

  // ###############################################################################
  handleLocalCacheTransactionalInstanceAction(localCacheTransactionalAction: LocalCacheTransactionalInstanceActionWithDeployment): ActionReturnType {
    // const result:ActionReturnType = this.innerReduxStore.dispatch(
    return exceptionToActionReturnType(
      ()=> this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheTransactionalInstanceAction](localCacheTransactionalAction)
      )
    )
    // return ACTION_OK;
  }

  // ###############################################################################
  handleLocalCacheUndoRedoAction(localCacheUndoRedoAction: LocalCacheUndoRedoAction): ActionReturnType {
    // const result:ActionReturnType = this.innerReduxStore.dispatch(
    return exceptionToActionReturnType(
      ()=> this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheUndoRedoAction](localCacheUndoRedoAction)
      )
    )
    // return ACTION_OK;
  }

  // ###############################################################################
  handleLocalCacheModelAction(localCacheEntityAction: ModelAction): ActionReturnType {
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
  handleLocalCacheInstanceAction(instanceAction: InstanceAction): ActionReturnType {
    log.info("handleLocalCacheInstanceAction", instanceAction);
    
    return exceptionToActionReturnType(() =>
      this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleLocalCacheInstanceAction](
          instanceAction
        )
      )
    );
  }

  // ###############################################################################
  currentTransaction(): (LocalCacheTransactionalInstanceActionWithDeployment | ModelAction)[] {
    // log.info("ReduxStore currentTransaction called");
    return this.innerReduxStore.getState().pastModelPatches.map((p) => p.action);
  }

  // ###############################################################################
  private *rootSaga() {
    // log.info("ReduxStore rootSaga running", this.RemoteStoreRestAccessReduxSaga);
    yield all([this.remoteStoreAccessReduxSaga.instanceRootSaga.bind(this.remoteStoreAccessReduxSaga)()]);
  }
}
import { configureStore } from '@reduxjs/toolkit';
import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';


import {
  ACTION_OK,
  ActionReturnType,
  LocalCacheAction,
  LocalCacheInfo,
  LocalCacheInterface,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ModelAction,
  PersistenceAction,
  PersistenceInterface,
  TransactionalInstanceAction,
  getLoggerName
} from "miroir-core";
import PersistenceReduxSaga from "./persistence/PersistenceActionReduxSaga";
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
export class ReduxStore implements LocalCacheInterface, PersistenceInterface {
  private innerReduxStore: ReduxStoreWithUndoRedo;
  private staticReducers: ReduxReducerWithUndoRedoInterface;
  private sagaMiddleware: any;

  // ###############################################################################
  constructor(public remoteStoreAccessReduxSaga: PersistenceReduxSaga) {
    this.staticReducers = createUndoRedoReducer(LocalCacheSlice.reducer);

    this.sagaMiddleware = sagaMiddleware();

    const ignoredActionsList = [
      "handlePersistenceAction",
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
  async handlePersistenceAction(
    // deploymentUuid: string,
    action: PersistenceAction,
  ): Promise<ActionReturnType> {
    const result: ActionReturnType = await this.innerReduxStore.dispatch(
      // remote store access is accomplished through asynchronous sagas
      this.remoteStoreAccessReduxSaga.PersistenceActionReduxSaga.handlePersistenceAction.creator(
        { action }
        // { deploymentUuid, action }
      )
    );
    // log.info("ReduxStore handleRemoteStoreModelAction", action, "returned", result)
    return Promise.resolve(result);
  }
  
  
  // ###############################################################################
  handleLocalCacheAction(action: LocalCacheAction): ActionReturnType {
    log.info("handleAction", action);
    
    return exceptionToActionReturnType(() =>
      this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleAction](
          action
        )
      )
    );
  }

  // ###############################################################################
  currentTransaction(): (TransactionalInstanceAction | ModelAction)[] {
    // log.info("ReduxStore currentTransaction called");
    return this.innerReduxStore.getState().pastModelPatches.map((p) => p.action);
  }

  // ###############################################################################
  private *rootSaga() {
    // log.info("ReduxStore rootSaga running", this.PersistenceReduxSaga);
    yield all([this.remoteStoreAccessReduxSaga.persistenceRootSaga.bind(this.remoteStoreAccessReduxSaga)()]);
  }
}
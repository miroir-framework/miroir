import { configureStore } from '@reduxjs/toolkit';
// import reduxJsToolkit from '@reduxjs/toolkit';
// const { createEntityAdapter, createSlice, createSelector, configureStore } = reduxJsToolkit;

import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';


import {
  ACTION_OK,
  ActionReturnType,
  DomainState,
  getLoggerName,
  LocalCacheAction,
  LocalCacheInfo,
  LocalCacheInterface,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ModelActionReplayableAction,
  TransactionalInstanceAction
} from "miroir-core";
import { packageName } from '../constants';
import { cleanLevel } from './constants';
import {
  localCacheSliceInputActionNamesObject,
  ReduxReducerWithUndoRedoInterface,
  ReduxStoreWithUndoRedo,
} from "./localCache/localCacheReduxSliceInterface";
import {
  currentModel,
  LocalCacheSlice,
  localCacheSliceGeneratedActionNames,
  localCacheStateToDomainState
} from "./localCache/LocalCacheSlice";
import {
  createUndoRedoReducer,
} from "./localCache/UndoRedoReducer";

const loggerName: string = getLoggerName(packageName, cleanLevel,"LocalCache");
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
// export class LocalCache implements StoreInterface {
export class LocalCache implements LocalCacheInterface {
  public innerReduxStore: ReduxStoreWithUndoRedo;
  private staticReducers: ReduxReducerWithUndoRedoInterface;
  public sagaMiddleware: any;

  // ###############################################################################
  constructor(
    // public persistenceReduxSaga: PersistenceReduxSaga
  ) {
    this.staticReducers = createUndoRedoReducer(LocalCacheSlice.reducer);

    this.sagaMiddleware = sagaMiddleware();

    const ignoredActionsList = [
      "handlePersistenceAction",
      ...localCacheSliceGeneratedActionNames,
    ];

    log.info("LocalCache ignoredActionsList", ignoredActionsList);
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
  getDomainState():DomainState {
    return localCacheStateToDomainState(this.innerReduxStore.getState().presentModelSnapshot);
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
  handleLocalCacheAction(action: LocalCacheAction): ActionReturnType {
    log.info("LocalCache handleAction", action);
    
    const result:ActionReturnType = exceptionToActionReturnType(() =>
      this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators[localCacheSliceInputActionNamesObject.handleAction](
          action
        )
      )
    );
    log.info("LocalCache handleAction result=", result);
    return result;
  }

  // ###############################################################################
  currentTransaction(): (TransactionalInstanceAction | ModelActionReplayableAction)[] {
    // log.info("LocalCache currentTransaction called");
    return this.innerReduxStore.getState().pastModelPatches.map((p) => p.action);
  }
}
import { configureStore } from '@reduxjs/toolkit';
// import reduxJsToolkit from '@reduxjs/toolkit';
// const { createEntityAdapter, createSlice, createSelector, configureStore } = reduxJsToolkit;

import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";


import {
  ACTION_OK,
  Action2ReturnType,
  DomainElementSuccess,
  Domain2QueryReturnType,
  DomainState,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  getDomainStateExtractorRunnerMap,
  getExtractorRunnerParamsForDomainState,
  getQueryRunnerParamsForDomainState,
  LocalCacheAction,
  LocalCacheInfo,
  LocalCacheInterface,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ModelActionReplayableAction,
  RunBoxedExtractorOrQueryAction,
  TransactionalInstanceAction,
  Domain2ElementFailed,
  Action2Error,
  miroirFundamentalJzodSchema,
  defaultMiroirMetaModel,
  type JzodSchema,
  defaultMetaModelEnvironment,
  type MiroirModelEnvironment,
  type ApplicationDeploymentMap
} from "miroir-core";
import { packageName } from '../constants.js';
import { cleanLevel } from './constants.js';
import {
  localCacheSliceInputActionNamesObject,
  ReduxReducerWithUndoRedoInterface,
  ReduxStoreWithUndoRedo,
} from "./localCache/localCacheReduxSliceInterface.js";
import {
  LocalCacheSlice,
  localCacheSliceGeneratedActionNames,
  localCacheStateToDomainState
} from "./localCache/LocalCacheSlice.js";
import {
  createUndoRedoReducer,
} from "./localCache/UndoRedoReducer.js";
import PersistenceReduxSaga from './persistence/PersistenceReduxSaga.js';
import { currentModel, currentModelEnvironment } from './localCache/Model.js';
import { aP } from 'vitest/dist/chunks/reporters.d.BFLkQcL6.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCache")
).then((logger: LoggerInterface) => {log = logger});


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
function exceptionToActionReturnType(f:()=>void): Action2ReturnType {
  try {
    f()
  } catch (e: any) {
    return new Action2Error("FailedToHandleLocalCacheAction", e);
  }
  return ACTION_OK;
}
// ###############################################################################
/**
 * Local store implementation using Redux.
 * Facade to the Redux store, with undo/redo capabilities.
 * 
 */
export class LocalCache implements LocalCacheInterface {
  private innerReduxStore: ReduxStoreWithUndoRedo;
  private staticReducers: ReduxReducerWithUndoRedoInterface;

  // ###############################################################################
  constructor(persistenceStore: PersistenceReduxSaga) {
    this.staticReducers = createUndoRedoReducer(LocalCacheSlice.reducer);

    const ignoredActionsList = ["handlePersistenceAction", ...localCacheSliceGeneratedActionNames];

    log.info("LocalCache constructor ignoredActionsList=", ignoredActionsList);
    this.innerReduxStore = configureStore({
      reducer: this.staticReducers as any, // TODO: determine real type! now it says state parameter can be ReduxStoreWithUndoRedo | undefined. How could it be undefined?
      middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: ignoredActionsList, // Ignore these action types
            ignoredActionPaths: ["meta.promiseActions", "pastModelPatches.0.action.asyncDispatch"], // Ignore these field paths in all actions
          },
        })
          .concat(promiseMiddleware)
          .concat(persistenceStore.getSagaMiddleware());
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
  getDomainState(): DomainState {
    return localCacheStateToDomainState(this.innerReduxStore.getState().presentModelSnapshot);
  }

  // ###############################################################################
  public currentInfo(): LocalCacheInfo {
    return {
      localCacheSize: roughSizeOfObject(this.innerReduxStore.getState().presentModelSnapshot),
    };
  }

  // ###############################################################################
  // FOR TESTING PURPOSES ONLY!!!!! TO REMOVE?
  public currentModel(
    application: string,
    appliationDeploymentMap: ApplicationDeploymentMap,
    deploymentUuid: string): MetaModel {
    log.info("called currentModel(", deploymentUuid, ")");
    // log.trace(
    //   "called currentModel(",
    //   deploymentUuid,
    //   ") from state:",
    //   this.innerReduxStore.getState().presentModelSnapshot
    // );
    const reduxState = this.innerReduxStore.getState().presentModelSnapshot;

    return currentModel(application, appliationDeploymentMap, deploymentUuid, reduxState);
  }

  // ###############################################################################
  // FOR TESTING PURPOSES ONLY!!!!! TO REMOVE?
  public currentModelEnvironment(
    application: string,
    appliationDeploymentMap: ApplicationDeploymentMap,
    deploymentUuid: string): MiroirModelEnvironment {
    log.info("called currentModelEnvironment(", deploymentUuid, ")");
    log.trace(
      "called currentModelEnvironment(",
      deploymentUuid,
      ") from state:",
      this.innerReduxStore.getState().presentModelSnapshot
    );
    const reduxState = this.innerReduxStore.getState().presentModelSnapshot;

    return currentModelEnvironment(
      application,
      appliationDeploymentMap,
      deploymentUuid,
      reduxState
    );
  }

  // ###############################################################################
  handleLocalCacheAction(
    action: LocalCacheAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType {
    log.info("LocalCache handleAction", action);
    // log.info("LocalCache handleAction", JSON.stringify(action, undefined, 2));

    const result: Action2ReturnType = exceptionToActionReturnType(() =>
      this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators.handleAction({
          applicationDeploymentMap,
          action,
        })
      )
    );
    log.info("LocalCache handleAction result=", result);
    return result;
  }

  // ###############################################################################
  runBoxedExtractorOrQueryAction(
    action: RunBoxedExtractorOrQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType {
    // const domainState: DomainState = domainController.getDomainState();
    const domainState: DomainState = this.getDomainState();

    const extractorRunnerMapOnDomainState = getDomainStateExtractorRunnerMap();
    log.info("LocalCache action=", JSON.stringify(action, undefined, 2));
    // log.info("RestServer queryActionHandler domainState=", JSON.stringify(domainState, undefined, 2))
    let queryResult: Domain2QueryReturnType<DomainElementSuccess> =
      undefined as any as Domain2QueryReturnType<DomainElementSuccess>;
    switch (action.payload.query.queryType) {
      case "boxedExtractorOrCombinerReturningObject":
      case "boxedExtractorOrCombinerReturningObjectList": {
        queryResult = extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList(
          domainState,
          applicationDeploymentMap,
          getExtractorRunnerParamsForDomainState(
            action.payload.query,
            extractorRunnerMapOnDomainState
          ),
          defaultMetaModelEnvironment
        );
        break;
      }
      case "boxedQueryWithExtractorCombinerTransformer": {
        queryResult = extractorRunnerMapOnDomainState.runQuery(
          domainState,
          applicationDeploymentMap,
          getQueryRunnerParamsForDomainState(
            action.payload.query,
            extractorRunnerMapOnDomainState
          ),
          defaultMetaModelEnvironment
        );
        break;
      }
      default:
        break;
    }
    if (queryResult instanceof Domain2ElementFailed) {
      // return {
      //   status: "error",
      //   errorType: "FailedToRunBoxedExtractorOrQueryAction", // TODO: correct errorType
      //   errorMessage: queryResult.failureMessage,
      //   errorStack: queryResult.errorStack
      // }
      return new Action2Error(
        "FailedToRunBoxedExtractorOrQueryAction",
        queryResult.failureMessage,
        queryResult.errorStack,
        queryResult
      );
    } else {
      const result: Action2ReturnType = {
        status: "ok",
        returnedDomainElement: queryResult,
      };
      // log.info(
      //   "RestServer queryActionHandler used local cache result=",
      //   JSON.stringify(result, undefined, 2)
      // );

      return result;
    }
    //  return continuationFunction(response)(result);
  }

  // ###############################################################################
  // used only by PersistenceReduxSaga.handlePersistenceAction
  async dispatchToReduxStore(
    dispatchParam: any // TODO: give exact type!
  ): Promise<Action2ReturnType> {
    return this.innerReduxStore.dispatch(dispatchParam);
  }

  // ###############################################################################
  currentTransaction(): (TransactionalInstanceAction | ModelActionReplayableAction)[] {
    // log.info("LocalCache currentTransaction called");
    return this.innerReduxStore.getState().pastModelPatches.map((p) => p.action);
  }
}
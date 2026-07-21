import { configureStore } from '@reduxjs/toolkit';
// import reduxJsToolkit from '@reduxjs/toolkit';
// const { createEntityAdapter, createSlice, createSelector, configureStore } = reduxJsToolkit;

import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";


import {
  Action2Error,
  Action2ReturnType,
  ACTION_OK,
  defaultMetaModelEnvironment,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  DomainElementSuccess,
  DomainState,
  buildAttributedInstanceIndex,
  estimateObjectBytes,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  getDomainStateExtractorRunnerMap,
  getExtractorRunnerParamsForDomainState,
  getQueryRunnerParamsForDomainState,
  LocalCacheAction,
  LocalCacheInfo,
  LocalCacheInterface,
  LoggerInterface,
  MetaModel,
  measureLocalCacheMemory,
  MiroirLoggerFactory,
  ModelActionReplayableAction,
  // RunBoxedExtractorOrQueryAction,
  TransactionalInstanceAction,
  type ApplicationDeploymentMap,
  type LocalCacheMonitorSnapshot,
  type MiroirModelEnvironment,
  type RunBoxedQueryAction
} from "miroir-core";
import { packageName } from '../constants.js';
import { cleanLevel } from './constants.js';
import {
  ReduxReducerWithUndoRedoInterface,
  ReduxStoreWithUndoRedo
} from "./localCache/localCacheReduxSliceInterface.js";
import {
  LocalCacheSlice,
  localCacheSliceGeneratedActionNames,
  localCacheStateToDomainState
} from "./localCache/LocalCacheSlice.js";
import { currentModel, currentModelEnvironment } from './localCache/Model.js';
import {
  createUndoRedoReducer,
} from "./localCache/UndoRedoReducer.js";
import PersistenceReduxSaga from './persistence/PersistenceReduxSaga.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCache")
).then((logger: LoggerInterface) => {log = logger});


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
  private monitorEnabled = false;
  private monitorSnapshot: LocalCacheMonitorSnapshot | null = null;

  // ###############################################################################
  constructor(persistenceStore?: PersistenceReduxSaga) {
    this.staticReducers = createUndoRedoReducer(LocalCacheSlice.reducer);

    const ignoredActionsList = ["handlePersistenceAction", ...localCacheSliceGeneratedActionNames];

    log.info("LocalCache constructor ignoredActionsList=", ignoredActionsList);
    this.innerReduxStore = configureStore({
      reducer: this.staticReducers as any, // TODO: determine real type! now it says state parameter can be ReduxStoreWithUndoRedo | undefined. How could it be undefined?
      middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware({
          // Large local-cache snapshots make the default 32ms warn threshold noisy in
          // development (SerializableStateInvariantMiddleware / immutableCheck).
          // Both checks are already off in production builds.
          serializableCheck: {
            ignoredActions: ignoredActionsList, // Ignore these action types
            ignoredActionPaths: ["meta.promiseActions", "pastModelPatches.0.action.asyncDispatch"], // Ignore these field paths in all actions
            warnAfter: 256,
          },
          immutableCheck: {
            warnAfter: 256,
          },
        })
          .concat(promiseMiddleware)
          .concat(persistenceStore ? persistenceStore.getSagaMiddleware() : []);
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
      localCacheSize: estimateObjectBytes(
        this.innerReduxStore.getState().presentModelSnapshot
      ),
    };
  }

  // ###############################################################################
  public setLocalCacheMonitorEnabled(enabled: boolean): void {
    this.monitorEnabled = enabled;
    if (!enabled) {
      this.monitorSnapshot = null;
      return;
    }
    this.recalibrateMonitor();
  }

  // ###############################################################################
  public getLocalCacheMonitorSnapshot(): LocalCacheMonitorSnapshot | null {
    return this.monitorSnapshot;
  }

  // ###############################################################################
  private recalibrateMonitor(): void {
    if (!this.monitorEnabled) {
      return;
    }
    const state = this.innerReduxStore.getState();
    this.monitorSnapshot = {
      breakdown: measureLocalCacheMemory(state),
      attributedInstances: buildAttributedInstanceIndex(state.presentModelSnapshot),
    };
  }

  // ###############################################################################
  // FOR TESTING PURPOSES ONLY!!!!! TO REMOVE?
  public currentModel(
    application: string,
    appliationDeploymentMap: ApplicationDeploymentMap,
    // deploymentUuid: string
  ): MetaModel {
    log.info("called currentModel(", application, appliationDeploymentMap, ")");
    // log.trace(
    //   "called currentModel(",
    //   deploymentUuid,
    //   ") from state:",
    //   this.innerReduxStore.getState().presentModelSnapshot
    // );
    const reduxState = this.innerReduxStore.getState().presentModelSnapshot;

    return currentModel(application, appliationDeploymentMap, reduxState);
  }

  // ###############################################################################
  // FOR TESTING PURPOSES ONLY!!!!! TO REMOVE?
  public currentModelEnvironment(
    application: string,
    appliationDeploymentMap: ApplicationDeploymentMap,
    // deploymentUuid: string
  ): MiroirModelEnvironment {
    log.info("called currentModelEnvironment(", application, appliationDeploymentMap, ")");
    log.trace(
      "called currentModelEnvironment(",
      application,
      appliationDeploymentMap,
      ") from state:",
      this.innerReduxStore.getState().presentModelSnapshot
    );
    const reduxState = this.innerReduxStore.getState().presentModelSnapshot;

    return currentModelEnvironment(
      application,
      appliationDeploymentMap,
      reduxState
    );
  }

  // ###############################################################################
  handleLocalCacheAction(
    action: LocalCacheAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType {
    log.info("LocalCache handleLocalCacheAction", action, applicationDeploymentMap);
    // log.info("LocalCache handleAction", JSON.stringify(action, undefined, 2));

    const result: Action2ReturnType = exceptionToActionReturnType(() =>
      this.innerReduxStore.dispatch(
        LocalCacheSlice.actionCreators.handleAction({
          applicationDeploymentMap,
          action,
        })
      )
    );
    this.recalibrateMonitor();
    log.info("LocalCache handleAction result=", result);
    return result;
  }

  // ###############################################################################
  runBoxedExtractorOrQueryAction(
    // action: RunBoxedExtractorOrQueryAction,
    action: RunBoxedQueryAction,
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
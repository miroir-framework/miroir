/**
 * Local Cache implementation using Zustand.
 * Facade to the Zustand store, with undo/redo capabilities.
 */
import { StoreApi } from "zustand/vanilla";

import {
  ACTION_OK,
  Action2Error,
  Action2ReturnType,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  DomainElementSuccess,
  DomainState,
  buildAttributedInstanceIndex,
  estimateObjectBytes,
  LocalCacheAction,
  LocalCacheInfo,
  LocalCacheInterface,
  LoggerInterface,
  MetaModel,
  measureLocalCacheMemory,
  MiroirLoggerFactory,
  ModelActionReplayableAction,
  TransactionalInstanceAction,
  defaultMetaModelEnvironment,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  getDomainStateExtractorRunnerMap,
  getExtractorRunnerParamsForDomainState,
  getQueryRunnerParamsForDomainState,
  rejectPartialMutationInstanceAction,
  type ApplicationDeploymentMap,
  type LocalCacheMonitorSnapshot,
  type MiroirModelEnvironment,
  type RunBoxedQueryAction,
} from "miroir-core";

import {
  localCacheStateToDomainState,
} from "./localCache/LocalCacheSlice.js";
import {
  ZustandStateWithUndoRedo,
} from "./localCache/localCacheZustandInterface.js";
import { currentModel, currentModelEnvironment } from "./localCache/Model.js";
import {
  LocalCacheStore,
  createLocalCacheStore,
} from "./localCache/UndoRedoStore.js";
import { PersistenceAsyncStore } from "./persistence/PersistenceAsyncStore.js";

const packageName = "miroir-localcache-zustand";
const cleanLevel = "5_view";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCache")
).then((logger: LoggerInterface) => {log = logger});


// ###############################################################################
function exceptionToActionReturnType(f: () => void): Action2ReturnType {
  try {
    f();
  } catch (e: any) {
    return new Action2Error("FailedToHandleLocalCacheAction", e);
  }
  return ACTION_OK;
}

// ###############################################################################
/**
 * Local store implementation using Zustand.
 * Facade to the Zustand store, with undo/redo capabilities.
 */
export class LocalCache implements LocalCacheInterface {
  private store: StoreApi<LocalCacheStore>;
  private monitorEnabled = false;
  private monitorSnapshot: LocalCacheMonitorSnapshot | null = null;

  // ###############################################################################
  constructor(persistenceStore?: PersistenceAsyncStore) {
    this.store = createLocalCacheStore();
    
    if (persistenceStore) {
      persistenceStore.setLocalCache(this);
    }
    
    log.info("LocalCache constructor initialized Zustand store");
  }

  // ###############################################################################
  getInnerStore(): StoreApi<LocalCacheStore> {
    return this.store;
  }

  // ###############################################################################
  getState(): ZustandStateWithUndoRedo {
    return this.store.getState();
  }

  // ###############################################################################
  getDomainState(): DomainState {
    return localCacheStateToDomainState(this.store.getState().presentModelSnapshot);
  }

  // ###############################################################################
  public currentInfo(): LocalCacheInfo {
    return {
      localCacheSize: estimateObjectBytes(this.store.getState().presentModelSnapshot),
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
    const state = this.store.getState();
    this.monitorSnapshot = {
      breakdown: measureLocalCacheMemory(state),
      attributedInstances: buildAttributedInstanceIndex(state.presentModelSnapshot),
    };
  }

  // ###############################################################################
  public currentModel(
    application: string,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): MetaModel {
    log.info("called currentModel(", application, applicationDeploymentMap, ")");
    const state = this.store.getState().presentModelSnapshot;
    return currentModel(application, applicationDeploymentMap, state);
  }

  // ###############################################################################
  public currentModelEnvironment(
    application: string,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): MiroirModelEnvironment {
    log.info("called currentModelEnvironment(", application, applicationDeploymentMap, ")");
    const state = this.store.getState().presentModelSnapshot;
    return currentModelEnvironment(application, applicationDeploymentMap, state);
  }

  // ###############################################################################
  handleLocalCacheAction(
    action: LocalCacheAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType {
    log.info("LocalCache handleLocalCacheAction", action, applicationDeploymentMap);

    const actionType = (action as any)?.actionType;
    if (
      actionType === "createInstance" ||
      actionType === "updateInstance" ||
      actionType === "deleteInstance" ||
      actionType === "deleteInstanceWithCascade"
    ) {
      const rejected = rejectPartialMutationInstanceAction(action as any);
      if (rejected) {
        return rejected;
      }
    }
    if (actionType === "transactionalInstanceAction") {
      const inner = (action as TransactionalInstanceAction).payload?.instanceAction;
      if (inner) {
        const rejected = rejectPartialMutationInstanceAction(inner);
        if (rejected) {
          return rejected;
        }
      }
    }

    const result: Action2ReturnType = exceptionToActionReturnType(() =>
      this.store.getState().handleAction(action, applicationDeploymentMap)
    );
    this.recalibrateMonitor();
    log.info("LocalCache handleAction result=", result);
    return result;
  }

  // ###############################################################################
  runBoxedExtractorOrQueryAction(
    action: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType {
    const domainState: DomainState = this.getDomainState();
    const extractorRunnerMapOnDomainState = getDomainStateExtractorRunnerMap();
    
    log.info("LocalCache action=", JSON.stringify(action, undefined, 2));
    
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
      return new Action2Error(
        "FailedToRunBoxedExtractorOrQueryAction",
        queryResult.failureMessage,
        queryResult.errorStack,
        queryResult
      );
    } else {
      return {
        status: "ok",
        returnedDomainElement: queryResult,
      };
    }
  }

  // ###############################################################################
  currentTransaction(): (TransactionalInstanceAction | ModelActionReplayableAction)[] {
    return this.store.getState().pastModelPatches.map((p) => p.action);
  }

  // ###############################################################################
  // Additional methods for Zustand-specific operations
  undo(): void {
    this.store.getState().undo();
    this.recalibrateMonitor();
  }

  redo(): void {
    this.store.getState().redo();
    this.recalibrateMonitor();
  }

  commit(): void {
    this.store.getState().commit();
    this.recalibrateMonitor();
  }

  rollback(): void {
    this.store.getState().rollback();
    this.recalibrateMonitor();
  }

  subscribe(listener: (state: ZustandStateWithUndoRedo, prevState: ZustandStateWithUndoRedo) => void): () => void {
    return this.store.subscribe(listener);
  }
}

/**
 * Local Cache implementation using Zustand.
 * Facade to the Zustand store, with undo/redo capabilities.
 */
import { StoreApi } from "zustand/vanilla";

import {
  ACTION_OK,
  Action2ReturnType,
  Action2Error,
  DomainState,
  Domain2QueryReturnType,
  DomainElementSuccess,
  Domain2ElementFailed,
  LocalCacheAction,
  LocalCacheInfo,
  LocalCacheInterface,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ModelActionReplayableAction,
  RunBoxedExtractorOrQueryAction,
  TransactionalInstanceAction,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  getDomainStateExtractorRunnerMap,
  getExtractorRunnerParamsForDomainState,
  getQueryRunnerParamsForDomainState,
  defaultMetaModelEnvironment,
  type MiroirModelEnvironment,
  type ApplicationDeploymentMap,
} from "miroir-core";

import {
  createLocalCacheStore,
  LocalCacheStore,
} from "./localCache/UndoRedoStore.js";
import {
  localCacheStateToDomainState,
} from "./localCache/LocalCacheSlice.js";
import {
  ZustandStateWithUndoRedo,
} from "./localCache/localCacheZustandInterface.js";
import { currentModel, currentModelEnvironment } from "./localCache/Model.js";
import { PersistenceAsyncStore } from "./persistence/PersistenceAsyncStore.js";

const packageName = "miroir-localcache-zustand";
const cleanLevel = "5_view";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "LocalCache")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
function roughSizeOfObject(object: any): number {
  const objectList: any[] = [];
  const stack = [object];
  let bytes = 0;

  while (stack.length) {
    const value = stack.pop();

    if (typeof value === 'boolean') {
      bytes += 4;
    } else if (typeof value === 'string') {
      bytes += value.length * 2;
    } else if (typeof value === 'number') {
      bytes += 8;
    } else if (typeof value === 'object' && objectList.indexOf(value) === -1) {
      objectList.push(value);
      for (const i in value) {
        stack.push(value[i]);
      }
    }
  }
  return bytes;
}

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
      localCacheSize: roughSizeOfObject(this.store.getState().presentModelSnapshot),
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
    log.info("LocalCache handleLocalCacheAction", action);

    const result: Action2ReturnType = exceptionToActionReturnType(() =>
      this.store.getState().handleAction(action, applicationDeploymentMap)
    );
    log.info("LocalCache handleAction result=", result);
    return result;
  }

  // ###############################################################################
  runBoxedExtractorOrQueryAction(
    action: RunBoxedExtractorOrQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap
  ): Action2ReturnType {
    const domainState: DomainState = this.getDomainState();
    const extractorRunnerMapOnDomainState = getDomainStateExtractorRunnerMap();
    
    log.info("LocalCache action=", JSON.stringify(action, undefined, 2));
    
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
  }

  redo(): void {
    this.store.getState().redo();
  }

  commit(): void {
    this.store.getState().commit();
  }

  rollback(): void {
    this.store.getState().rollback();
  }

  subscribe(listener: (state: ZustandStateWithUndoRedo, prevState: ZustandStateWithUndoRedo) => void): () => void {
    return this.store.subscribe(listener);
  }
}

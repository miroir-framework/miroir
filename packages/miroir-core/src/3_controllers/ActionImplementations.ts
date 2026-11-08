import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement";
import type {
  ActionImplementationHandler,
  EvolutionTraceRecorder,
} from "../0_interfaces/3_controllers/DomainControllerActionHost";
import { handleAction_runReportAction } from "./RunReportAction";
import { GIT_ACTION_TYPES } from "../0_interfaces/3_controllers/GitAction";

/**
 * #341: library implementations of Miroir actions, by `inMemoryImplementationFunctionName`.
 * An Endpoint action definition refers to one of these through
 * `actionImplementation: { actionImplementationType: "libraryImplementation", ... }`,
 * as TransformerDefinitions do with `inMemoryTransformerImplementations`.
 */
const handleInstanceAction: ActionImplementationHandler = (host, action, context) =>
  host.handleInstanceAction(action, context.applicationDeploymentMap);

const handleModelAction: ActionImplementationHandler = async (host, action, context) => {
  if (!context.modelEnvironment) {
    return new Action2Error(
      "InvalidAction",
      "DomainController handleAction for modelAction needs a currentModel argument",
      [],
      undefined,
      { domainAction: action },
    );
  }
  return host.handleModelAction(action, context.applicationDeploymentMap, context.modelEnvironment);
};

/** createStore, deleteStore and resetAndInitApplicationDeployment need the storeAdministration capability. */
const storeManagementAction =
  (requiresStoreAdministration: boolean): ActionImplementationHandler =>
  (host, action, context) =>
    host.handleStoreManagementAction(
      action,
      context.applicationDeploymentMap,
      requiresStoreAdministration,
    );

const handleUndoRedoAction: ActionImplementationHandler = async (host, action, context) => {
  if (!context.modelEnvironment) {
    throw new Error("DomainController handleAction for undoRedoAction needs a currentModel argument");
  }
  return host.handleDomainUndoRedoAction(
    context.applicationDeploymentMap[action.payload.application],
    context.applicationDeploymentMap,
    action,
    context.modelEnvironment,
  );
};

/** #679: every Git action goes through the same host method, which forwards or runs it. */
const handleGitAction: ActionImplementationHandler = (host, action, context) =>
  host.handleGitAction(action, context.applicationDeploymentMap, context.principal);

export const miroirActionImplementations: Record<string, ActionImplementationHandler> = {
  ...Object.fromEntries(GIT_ACTION_TYPES.map((actionType) => [`handleAction_${actionType}`, handleGitAction])),
  // QueryEndpoint
  handleAction_runBoxedQueryAction: (host, action, context) =>
    host.handleBoxedExtractorOrQueryAction(
      action,
      context.applicationDeploymentMap,
      context.modelEnvironment,
      context.principal,
    ),
  handleAction_runBoxedQueryTemplateAction: (host, action, context) =>
    host.handleQueryTemplateActionForServerONLY(
      action,
      context.applicationDeploymentMap,
      context.modelEnvironment,
    ),

  // StoreManagementEndpoint
  handleAction_storeManagementAction_createStore: storeManagementAction(true),
  handleAction_storeManagementAction_deleteStore: storeManagementAction(true),
  handleAction_storeManagementAction_resetAndInitApplicationDeployment: storeManagementAction(true),
  handleAction_storeManagementAction_openStore: storeManagementAction(false),
  handleAction_storeManagementAction_closeStore: storeManagementAction(false),

  // UndoRedoEndpoint
  handleAction_undo: handleUndoRedoAction,
  handleAction_redo: handleUndoRedoAction,

  // ModelEndpoint (entity_DuplicateAttribute is a composite template)
  handleAction_initModel: handleModelAction,
  handleAction_commit: handleModelAction,
  handleAction_rollback: handleModelAction,
  handleAction_remoteLocalCacheRollback: handleModelAction,
  handleAction_resetModel: handleModelAction,
  handleAction_resetData: handleModelAction,
  handleAction_alterEntityAttribute: handleModelAction,
  handleAction_renameEntity: handleModelAction,
  handleAction_createEntity: handleModelAction,
  handleAction_dropEntity: handleModelAction,

  // InstanceEndpoint
  handleAction_createInstance: handleInstanceAction,
  handleAction_deleteInstance: handleInstanceAction,
  handleAction_deleteInstanceWithCascade: handleInstanceAction,
  handleAction_updateInstance: handleInstanceAction,
  handleAction_loadNewInstancesInLocalCache: handleInstanceAction,
  handleAction_getInstance: handleInstanceAction,
  handleAction_getInstances: handleInstanceAction,

  // DomainEndpoint
  handleAction_transactionalInstanceAction: (host, action, context) =>
    host.handleTransactionalInstanceAction(action, context.applicationDeploymentMap),
  handleAction_compositeActionSequence: (host, action, context) =>
    host.handleCompositeAction(
      action,
      context.applicationDeploymentMap,
      context.modelEnvironment ?? ({} as MiroirModelEnvironment),
      {}, // actionParamValues, unused by compositeActionSequence
      context.principal,
    ),
  handleAction_compositeRunBoxedQueryAction: (host, action, context) =>
    host.handleCompositeRunBoxedQueryAction(
      action,
      context.applicationDeploymentMap,
      {},
      context.principal,
    ),
  handleAction_compositeRunBoxedQueryTemplateAction: (host, action, context) =>
    host.handleCompositeRunBoxedQueryTemplateAction(
      action,
      context.applicationDeploymentMap,
      {},
      {},
      context.principal,
    ),
  handleAction_runReportAction,
  handleAction_connectExternalService: (host, action, context) =>
    host.handleConnectExternalService(action, context.applicationDeploymentMap, context.principal),
  handleAction_prepareOpenApiDocument: (host, action) => host.handlePrepareOpenApiDocument(action),
  handleAction_probeExternalService: (host, action, context) =>
    host.handleProbeExternalService(action, context.principal),
  handleAction_setExternalServiceCredential: (host, action, context) =>
    host.handleSetExternalServiceCredential(
      action,
      context.applicationDeploymentMap,
      context.principal,
    ),
};

/**
 * #575: adds a library implementation from a layer above, which layer 3 does not import (the MiroirTest
 * runner of `5_tests`). Called at startup, before any action runs.
 */
export function registerMiroirActionImplementation(
  implementationName: string,
  implementation: ActionImplementationHandler,
): void {
  miroirActionImplementations[implementationName] = implementation;
}

/**
 * The module a lazy registration loads: its action implementations by implementation name and, for the
 * `versioning` capability, the recorder of evolution traces (#696).
 */
export type LazyActionImplementationModule = {
  actionImplementations: Record<string, ActionImplementationHandler>;
  evolutionTraceRecorder?: EvolutionTraceRecorder;
};

/** The loader of each lazily registered capability module, for the callers that are not actions (#696). */
const lazyCapabilityModuleLoaders: Record<string, () => Promise<LazyActionImplementationModule>> = {};

/**
 * #696: the module registered for `capability`, loaded on the first call (the same load as its action
 * implementations); undefined when no host registered one or when it could not be loaded.
 */
export async function loadLazyCapabilityModule(
  capability: string,
): Promise<LazyActionImplementationModule | undefined> {
  const load = lazyCapabilityModuleLoaders[capability];
  if (!load) {
    return undefined;
  }
  try {
    return await load();
  } catch {
    return undefined;
  }
}

/**
 * #696: registers the implementations of a package that core does not import, loaded on the first action
 * that needs one of them. `load` is a dynamic `import()` of the package; it runs once (again only after a
 * failure). The DomainController checks the action's `requiredCapability` before calling the
 * implementation, so a process without the capability never loads the package.
 */
export function registerLazyActionImplementations(params: {
  capability: string;
  packageName: string;
  implementationNames: readonly string[];
  load: () => Promise<LazyActionImplementationModule>;
}): void {
  let loading: Promise<LazyActionImplementationModule> | undefined;
  const loadOnce = () => {
    if (!loading) {
      const started = params.load();
      loading = started;
      started.catch(() => {
        if (loading === started) {
          loading = undefined;
        }
      });
    }
    return loading;
  };
  lazyCapabilityModuleLoaders[params.capability] = loadOnce;
  for (const implementationName of params.implementationNames) {
    miroirActionImplementations[implementationName] = async (host, action, context) => {
      let module: LazyActionImplementationModule;
      try {
        module = await loadOnce();
      } catch (error) {
        return new Action2Error(
          "FeatureUnavailable",
          `${params.packageName} could not be loaded: ${error instanceof Error ? error.message : String(error)}`,
          undefined,
          undefined,
          { capability: params.capability, package: params.packageName },
        );
      }
      const implementation = module.actionImplementations[implementationName];
      if (!implementation) {
        return new Action2Error(
          "FeatureUnavailable",
          `${params.packageName} has no implementation ${implementationName}`,
          undefined,
          undefined,
          { capability: params.capability, package: params.packageName },
        );
      }
      return implementation(host, action, context);
    };
  }
}

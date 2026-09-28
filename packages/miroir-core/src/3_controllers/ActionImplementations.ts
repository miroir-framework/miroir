import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement";
import type { ActionImplementationHandler } from "../0_interfaces/3_controllers/DomainControllerActionHost";

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

export const miroirActionImplementations: Record<string, ActionImplementationHandler> = {
  // QueryEndpoint
  handleAction_runBoxedQueryAction: (host, action, context) =>
    host.handleBoxedExtractorOrQueryAction(
      action,
      context.applicationDeploymentMap,
      context.modelEnvironment,
      context.principal,
    ),
  handleAction_runBoxedQueryTemplateAction: (host, action, context) =>
    host.handleQueryTemplateActionForServerONLY(action, context.applicationDeploymentMap),

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
  handleAction_freezeApplicationVersion: handleModelAction,

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
  handleAction_connectExternalService: (host, action, context) =>
    host.handleConnectExternalService(action, context.applicationDeploymentMap, context.principal),
  handleAction_prepareOpenApiDocument: (host, action) => host.handlePrepareOpenApiDocument(action),
};

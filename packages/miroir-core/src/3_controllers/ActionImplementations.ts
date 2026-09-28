import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type { ActionImplementationHandler } from "../0_interfaces/3_controllers/DomainControllerActionHost";

/**
 * #341: library implementations of Miroir actions, by `inMemoryImplementationFunctionName`.
 * An Endpoint action definition refers to one of these through
 * `actionImplementation: { actionImplementationType: "libraryImplementation", ... }`,
 * as TransformerDefinitions do with `inMemoryTransformerImplementations`.
 */
const handleInstanceAction: ActionImplementationHandler = (host, action, context) =>
  host.handleInstanceAction(action, context.applicationDeploymentMap);

export const miroirActionImplementations: Record<string, ActionImplementationHandler> = {
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

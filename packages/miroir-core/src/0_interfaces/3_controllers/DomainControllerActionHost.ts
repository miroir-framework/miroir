import type { ApplicationDeploymentMap } from "../../1_core/Deployment";
import type { AuthPrincipal } from "../../1_core/authentication/AuthenticationPolicy";
import type { MiroirModelEnvironment } from "../1_core/Transformer";
import type {
  CompositeActionSequence,
  CompositeRunBoxedQueryAction,
  CompositeRunBoxedQueryTemplateAction,
  InstanceAction,
  ModelAction,
  TransactionalInstanceAction,
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import type { Action2ReturnType, Action2VoidReturnType } from "../2_domain/DomainElement";

/** Payload of the connectExternalService action (#284), as DomainController reads it. */
export type ConnectExternalServiceAction = {
  actionType: "connectExternalService";
  endpoint: string;
  payload: {
    application: string;
    endpointName: string;
    openApiDocument: string;
    baseUrl: string;
    userAgent?: string;
    authenticated: boolean;
    /** Slice 4: customToken | clientCredentials | authorizationCode when authenticated. */
    scheme?: string;
    authorizationTemplate?: string;
    credentialKey?: string;
    tokenUrl?: string;
    clientIdKey?: string;
    clientSecretKey?: string;
    refreshTokenKey?: string;
    scopes?: string;
    checkedOperationIds: string[];
    probeOperationId: string;
    probeParameters: Record<string, unknown>;
    /** Slice 2 / Slice 4: temporary process-map values for the probe. */
    processSecrets?: Record<string, string>;
  };
};

/**
 * #341: what a library action implementation may call on the DomainController running it.
 * Grows with each migrated action; handlers depend on this interface, not on the class.
 */
export interface DomainControllerActionHost {
  handleModelAction(
    modelAction: ModelAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    currentModelEnvironment: MiroirModelEnvironment,
  ): Promise<Action2VoidReturnType>;
  handleInstanceAction(
    instanceAction: InstanceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2VoidReturnType>;
  handlePrepareOpenApiDocument(domainAction: {
    actionType: "prepareOpenApiDocument";
    endpoint: string;
    payload: { text?: string; url?: string };
  }): Promise<Action2ReturnType>;
  handleTransactionalInstanceAction(
    domainAction: TransactionalInstanceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
  ): Promise<Action2VoidReturnType>;
  handleCompositeAction(
    compositeActionSequence: CompositeActionSequence,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment,
    actionParamValues: Record<string, any>,
    principal?: AuthPrincipal,
  ): Promise<Action2ReturnType>;
  handleCompositeRunBoxedQueryAction(
    currentAction: CompositeRunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    localContext: Record<string, any>,
    principal?: AuthPrincipal,
  ): Promise<Action2ReturnType>;
  handleCompositeRunBoxedQueryTemplateAction(
    currentAction: CompositeRunBoxedQueryTemplateAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    actionParamValues: Record<string, any>,
    localContext: Record<string, any>,
    principal?: AuthPrincipal,
  ): Promise<Action2ReturnType>;
  handleConnectExternalService(
    domainAction: ConnectExternalServiceAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    principal?: AuthPrincipal,
  ): Promise<Action2VoidReturnType>;
}

/** What DomainController passes to a library action implementation along with the action. */
export interface ActionImplementationContext {
  applicationDeploymentMap: ApplicationDeploymentMap;
  modelEnvironment?: MiroirModelEnvironment;
  actionParamValues?: Record<string, unknown>;
  principal?: AuthPrincipal;
}

export type ActionImplementationHandler = (
  host: DomainControllerActionHost,
  action: any,
  context: ActionImplementationContext,
) => Promise<Action2ReturnType>;

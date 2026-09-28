import type { ApplicationDeploymentMap } from "../../1_core/Deployment";
import type { AuthPrincipal } from "../../1_core/authentication/AuthenticationPolicy";
import type { MiroirModelEnvironment } from "../1_core/Transformer";
import type { Action2ReturnType } from "../2_domain/DomainElement";

/**
 * #341: what a library action implementation may call on the DomainController running it.
 * Grows with each migrated action; handlers depend on this interface, not on the class.
 */
export interface DomainControllerActionHost {
  handlePrepareOpenApiDocument(domainAction: {
    actionType: "prepareOpenApiDocument";
    endpoint: string;
    payload: { text?: string; url?: string };
  }): Promise<Action2ReturnType>;
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

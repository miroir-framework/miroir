import type { Action } from "./preprocessor-generated/miroirFundamentalType.js";

/**
 * Narrowing guards for Endpoint.definition (untagged key-union, issue #267 D1).
 *
 * Lives in layer 0 so bootstrap schema assembly
 * (`getMiroirFundamentalJzodSchema`) can import it without an upward
 * dependency on `1_core`.
 */

export type EndpointExternalService = {
  openApiDocument: string;
  baseUrl: string;
  securityScheme: {
    type: string;
    scheme: string;
    bearerFormat?: string;
  };
  credentialKey?: string;
  enabledOperations: string[];
  operations: Array<{
    operationId: string;
    method: string;
    path: string;
    parameterMappings: Array<{
      name: string;
      in: string;
      required?: boolean;
    }>;
    requestSchema?: unknown;
    responseSchema: unknown;
    security?: string[];
  }>;
};

export type EndpointActionsBranch = {
  actions: Action[];
  actionDefinition?: unknown;
  actionTransformer?: unknown;
  actionMigrations?: unknown;
};

export type EndpointExternalServiceBranch = {
  externalService: EndpointExternalService;
};

export type EndpointDefinitionLike = {
  definition?: EndpointActionsBranch | EndpointExternalServiceBranch | Record<string, unknown>;
};

function definitionRecord(
  endpoint: EndpointDefinitionLike | undefined | null,
): Record<string, unknown> | undefined {
  const definition = endpoint?.definition;
  if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
    return undefined;
  }
  return definition as Record<string, unknown>;
}

/**
 * Returns the actions array when `definition` is the actions branch.
 * Returns undefined for the externalService branch, missing definition, or
 * both-keys objects (XOR fail-closed).
 */
export function getEndpointActions(
  endpoint: EndpointDefinitionLike | undefined | null,
): Action[] | undefined {
  const definition = definitionRecord(endpoint);
  if (!definition) {
    return undefined;
  }
  if ("externalService" in definition && definition.externalService !== undefined) {
    return undefined;
  }
  const actions = definition.actions;
  if (Array.isArray(actions)) {
    return actions as Action[];
  }
  return undefined;
}

/**
 * Returns the externalService object when `definition` is that branch.
 * Returns undefined for the actions branch, missing definition, or both-keys
 * objects (XOR fail-closed).
 */
export function getExternalService(
  endpoint: EndpointDefinitionLike | undefined | null,
): EndpointExternalService | undefined {
  const definition = definitionRecord(endpoint);
  if (!definition) {
    return undefined;
  }
  if ("actions" in definition && definition.actions !== undefined) {
    return undefined;
  }
  const externalService = definition.externalService;
  if (externalService && typeof externalService === "object") {
    return externalService as EndpointExternalService;
  }
  return undefined;
}

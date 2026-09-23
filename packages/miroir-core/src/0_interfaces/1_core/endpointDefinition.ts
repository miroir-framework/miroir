import type { Action } from "./preprocessor-generated/miroirFundamentalType.js";

/**
 * Narrowing guards for Endpoint.definition (untagged key-union, issue #267 D1).
 *
 * Lives in layer 0 so bootstrap schema assembly
 * (`getMiroirFundamentalJzodSchema`) can import it without an upward
 * dependency on `1_core`.
 */

export type EndpointSecurityScheme =
  | {
      type: "none";
    }
  | {
      type: "http";
      scheme: string;
      bearerFormat?: string;
    }
  | {
      type: "oauth2ClientCredentials";
      tokenUrl: string;
      clientIdKey: string;
      clientSecretKey: string;
      scopes?: string;
    }
  | {
      /**
       * OAuth2 Authorization Code flow (user context). The framework only
       * performs the refresh-token grant: the refresh token is provisioned
       * once out-of-band (see packages/miroir-test-app_deployment-spotify/scripts/)
       * and supplied as a secret like the client id/secret.
       */
      type: "oauth2AuthorizationCode";
      tokenUrl: string;
      clientIdKey: string;
      clientSecretKey: string;
      refreshTokenKey: string;
      scopes?: string;
    };

export type EndpointOperationSyncEntity = {
  uuid: string;
  name?: string;
  entityVersionUuid?: string;
};

export type EndpointOperationSyncEntry = {
  boundPaths: string[];
  entity?: EndpointOperationSyncEntity;
};

export type EndpointExternalService = {
  openApiDocument: string;
  baseUrl: string;
  securityScheme: EndpointSecurityScheme;
  credentialKey?: string;
  extraHeaders?: Record<string, string>;
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
  operationSync?: Record<string, EndpointOperationSyncEntry>;
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
// TODO: defensive code
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

function hasOpenApiDocument(document: unknown): boolean {
  if (typeof document === "string") {
    return document.trim().length > 0;
  }
  return document !== null && typeof document === "object" && !Array.isArray(document);
}

/**
 * True when the instance carries a non-empty OpenAPI document.
 * Does not use the actions/externalService XOR: the details form can
 * keep both union keys on the value, and the document is still the
 * signal that this Endpoint is OpenAPI-based.
 */
export function isOpenApiExternalServiceEndpoint(
  endpoint: EndpointDefinitionLike | undefined | null,
): boolean {
  const definition = definitionRecord(endpoint);
  const externalService = definition?.externalService;
  if (!externalService || typeof externalService !== "object") {
    return false;
  }
  return hasOpenApiDocument((externalService as EndpointExternalService).openApiDocument);
}

/**
 * Copy used for syncExternalServiceSchema: drop a stray `actions` key so
 * getExternalService stays XOR-clean while keeping the OpenAPI document.
 */
export function asOpenApiSyncEndpoint<T extends EndpointDefinitionLike>(
  endpoint: T,
): T {
  const definition = definitionRecord(endpoint);
  if (!definition || !("actions" in definition)) {
    return endpoint;
  }
  const { actions: _actions, ...restDefinition } = definition;
  return {
    ...endpoint,
    definition: restDefinition,
  };
}

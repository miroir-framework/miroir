// ################################################################################################
// The client of the outbound HTTP requests to external services (#267, #339): OpenAPI documents of
// the connection wizard, OAuth2 tokens, operation calls. Its environment is injected by the
// composition root (server startup, runtimes, test sessions), never set on module state.
// ################################################################################################

import type { Action2Error, Action2ReturnType } from "../2_domain/DomainElement.js";
import type { EndpointDefinitionLike } from "../1_core/endpointDefinition.js";
import type { ResolveSecretResult } from "../../4_services/SecretStore.js";

export type OutboundFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export type ExternalServicePrincipal = { miroirUserUuid?: string };

export type ResolveExternalServiceSecret = (
  name: string,
  principal?: ExternalServicePrincipal,
) => ResolveSecretResult;

export type PersistRotatedSecret = (args: {
  name: string;
  value: string;
  scope: "process" | "user";
  miroirUserUuid?: string;
}) => Promise<void>;

/** OAuth2 access tokens and rotated refresh tokens, kept in memory for the life of an environment. */
export interface ExternalServiceTokenCache {
  readonly accessTokens: Map<string, { accessToken: string; expiresAtMs: number }>;
  /** Latest refresh token per secret key (providers may rotate it on refresh). */
  readonly rotatedRefreshTokens: Map<string, string>;
  clear(): void;
}

export interface ExternalServiceEnvironment {
  /** The fetch of every outbound request. */
  readonly fetch: OutboundFetch;
  readonly resolveSecret: ResolveExternalServiceSecret;
  readonly tokenCache: ExternalServiceTokenCache;
  /** Base URLs (or origins) allowed although they are plain http or private / loopback hosts. */
  readonly insecureBaseUrls: readonly string[];
  /** Stores a rotated refresh token whose secret is a persisted row. Absent: kept in memory only. */
  readonly persistRotatedSecret?: PersistRotatedSecret;
}

export interface ExternalServiceClientInterface {
  /** The fetch of the environment, for requests that are not operations (OpenAPI documents). */
  readonly fetch: OutboundFetch;
  executeOperation(
    endpointInstance: EndpointDefinitionLike,
    actionType: string,
    bindings: Record<string, unknown>,
    principal?: ExternalServicePrincipal,
  ): Promise<Action2ReturnType>;
  /** An error when the base URL is insecure or private and the environment does not allow it. */
  assertBaseUrlAllowed(baseUrl: string): Action2Error | undefined;
}

/**
 * Outbound HTTP for Endpoint.definition.externalService (issue #267).
 * Requests are built only from materialized operations[] — never from client URLs.
 */

import {
  getExternalService,
  type EndpointDefinitionLike,
  type EndpointExternalService,
} from "../0_interfaces/1_core/endpointDefinition.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import {
  Action2Error,
  type Action2ReturnType,
  type ActionErrorType,
} from "../0_interfaces/2_domain/DomainElement.js";
import { packageName } from "../constants.js";
import { resolveSecret } from "./SecretStore.js";
import { cleanLevel } from "./constants.js";
import { MiroirLoggerFactory } from "./MiroirLoggerFactory.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(
  packageName,
  cleanLevel,
  "ExternalServiceClient",
);
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

const allowedInsecureBaseUrls = new Set<string>();

export function allowInsecureBaseUrlsForTests(baseUrls: string[]): void {
  for (const url of baseUrls) {
    allowedInsecureBaseUrls.add(normalizeBaseUrl(url));
  }
}

export function clearAllowedInsecureBaseUrlsForTests(): void {
  allowedInsecureBaseUrls.clear();
}

type Oauth2TokenCacheEntry = { accessToken: string; expiresAtMs: number };
const oauth2TokenCache = new Map<string, Oauth2TokenCacheEntry>();
/** Latest refresh token per secret key (in-memory only; providers may rotate on refresh). */
const rotatedRefreshTokens = new Map<string, string>();
const TOKEN_EXPIRY_MARGIN_MS = 60_000;

export function clearExternalServiceTokenCacheForTests(): void {
  oauth2TokenCache.clear();
  rotatedRefreshTokens.clear();
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function isLoopbackOrPrivateHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]") {
    return true;
  }
  if (host.startsWith("192.168.") || host.startsWith("10.")) {
    return true;
  }
  const match172 = /^172\.(\d+)\./.exec(host);
  if (match172) {
    const second = Number(match172[1]);
    if (second >= 16 && second <= 31) {
      return true;
    }
  }
  if (host.startsWith("169.254.")) {
    return true;
  }
  return false;
}

function externalServiceError(
  errorType: ActionErrorType,
  message: string,
  context?: Record<string, unknown>,
): Action2Error {
  return new Action2Error(errorType, message, undefined, undefined, context);
}

function errorTypeForHttpStatus(status: number): ActionErrorType {
  if (status === 401 || status === 403) {
    return "ExternalServiceUnauthorized";
  }
  if (status === 404) {
    return "ExternalServiceNotFound";
  }
  if (status === 429) {
    return "ExternalServiceRateLimited";
  }
  return "ExternalServiceUpstreamFailure";
}

function messageForHttpStatus(status: number): string {
  if (status === 401 || status === 403) {
    return `External service returned HTTP ${status}. Token may have expired; restart the server with a fresh token.`;
  }
  if (status === 404) {
    return `External service returned HTTP ${status}: not found`;
  }
  if (status === 429) {
    return `External service returned HTTP ${status}: rate limited`;
  }
  return `External service returned HTTP ${status}: upstream failure`;
}

function assertBaseUrlAllowed(baseUrl: string): Action2Error | undefined {
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return externalServiceError("InvalidAction", "Invalid external service baseUrl", { baseUrl });
  }
  const insecure =
    parsed.protocol !== "https:" || isLoopbackOrPrivateHostname(parsed.hostname);
  if (!insecure) {
    return undefined;
  }
  if (
    allowedInsecureBaseUrls.has(normalizeBaseUrl(baseUrl)) ||
    allowedInsecureBaseUrls.has(parsed.origin)
  ) {
    return undefined;
  }
  return externalServiceError(
    "InvalidAction",
    "Insecure or private external service baseUrl is not allowed",
    { baseUrl },
  );
}

function substitutePath(
  pathTemplate: string,
  parameterMappings: Array<{ name: string; in: string; required?: boolean }>,
  bindings: Record<string, string>,
): string | Action2Error {
  let path = pathTemplate;
  for (const mapping of parameterMappings) {
    if (mapping.in !== "path") {
      continue;
    }
    const value = bindings[mapping.name];
    if ((mapping.required || path.includes(`{${mapping.name}}`)) && (value === undefined || value === "")) {
      return externalServiceError(
        "InvalidAction",
        `Missing path parameter ${mapping.name} for external service operation`,
        { parameter: mapping.name },
      );
    }
    if (value !== undefined) {
      path = path.replaceAll(`{${mapping.name}}`, encodeURIComponent(value));
    }
  }
  return path;
}

function jzodTypeName(schema: unknown): string | undefined {
  if (!schema || typeof schema !== "object") {
    return undefined;
  }
  const type = (schema as { type?: unknown }).type;
  return typeof type === "string" ? type : undefined;
}

function primitiveMatches(typeName: string, value: unknown): boolean {
  switch (typeName) {
    case "string":
    case "uuid":
    case "date":
      return typeof value === "string";
    case "number":
    case "bigint":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "any":
      return true;
    default:
      return true;
  }
}

type LenientValidationResult =
  | { status: "ok"; value: unknown; strippedKeys: string[] }
  | { status: "error"; error: string };

function lenientValidateJzod(schema: unknown, value: unknown, path: string): LenientValidationResult {
  const typeName = jzodTypeName(schema);
  if (!typeName) {
    return { status: "ok", value, strippedKeys: [] };
  }

  if (typeName === "object") {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { status: "error", error: `type mismatch at ${path || "$"}: expected object` };
    }
    const definition = (schema as { definition?: Record<string, unknown> }).definition ?? {};
    const record = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    const strippedKeys: string[] = [];
    for (const key of Object.keys(record)) {
      if (!(key in definition)) {
        strippedKeys.push(path ? `${path}.${key}` : key);
        continue;
      }
      const child = lenientValidateJzod(definition[key], record[key], path ? `${path}.${key}` : key);
      if (child.status === "error") {
        return child;
      }
      next[key] = child.value;
      strippedKeys.push(...child.strippedKeys);
    }
    for (const key of Object.keys(definition)) {
      const fieldSchema = definition[key] as { optional?: boolean };
      if (!(key in record) && !fieldSchema?.optional) {
        continue;
      }
    }
    return { status: "ok", value: next, strippedKeys };
  }

  if (typeName === "array") {
    if (!Array.isArray(value)) {
      return { status: "error", error: `type mismatch at ${path || "$"}: expected array` };
    }
    const itemSchema = (schema as { definition?: unknown }).definition;
    const next: unknown[] = [];
    const strippedKeys: string[] = [];
    for (let i = 0; i < value.length; i++) {
      const child = lenientValidateJzod(itemSchema, value[i], `${path}[${i}]`);
      if (child.status === "error") {
        return child;
      }
      next.push(child.value);
      strippedKeys.push(...child.strippedKeys);
    }
    return { status: "ok", value: next, strippedKeys };
  }

  if (!primitiveMatches(typeName, value)) {
    return {
      status: "error",
      error: `type mismatch at ${path || "$"}: expected ${typeName}`,
    };
  }
  return { status: "ok", value, strippedKeys: [] };
}

function bindingStrings(bindings: Record<string, unknown>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(bindings)) {
    if (value === undefined || value === null) {
      continue;
    }
    next[key] = String(value);
  }
  return next;
}

function toBase64(value: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8").toString("base64");
  }
  return btoa(value);
}

type OAuth2ClientCredentialsScheme = {
  type: "oauth2ClientCredentials";
  tokenUrl: string;
  clientIdKey: string;
  clientSecretKey: string;
  scopes?: string;
};

/**
 * OAuth2 Client Credentials exchange (issue #267): POST grant_type=client_credentials to the
 * scheme's tokenUrl with HTTP Basic client auth; cache the access token until expiry (60s margin).
 * Never logs client id/secret or access tokens.
 */
async function resolveClientCredentialsToken(
  scheme: OAuth2ClientCredentialsScheme,
  actionType: string,
  forceRefresh: boolean,
): Promise<string | Action2Error> {
  const cacheKey = `${normalizeBaseUrl(scheme.tokenUrl)}|${scheme.clientIdKey}`;
  const cached = oauth2TokenCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAtMs - TOKEN_EXPIRY_MARGIN_MS > Date.now()) {
    return cached.accessToken;
  }

  const tokenUrlError = assertBaseUrlAllowed(scheme.tokenUrl);
  if (tokenUrlError) {
    log.warn("external service call rejected: tokenUrl not allowed", { actionType });
    return tokenUrlError;
  }

  let clientId: string;
  let clientSecret: string;
  try {
    clientId = resolveSecret(scheme.clientIdKey).value;
    clientSecret = resolveSecret(scheme.clientSecretKey).value;
  } catch {
    log.warn(
      "external service call blocked: clientIdKey/clientSecretKey did not resolve to registered secrets (restart the server with --secret <name>=<value> or MIROIR_SECRET_<NAME>)",
      { actionType, clientIdKey: scheme.clientIdKey, clientSecretKey: scheme.clientSecretKey },
    );
    return externalServiceError("InvalidAction", "Unknown or empty secret");
  }

  const body = new URLSearchParams({ grant_type: "client_credentials" });
  if (scheme.scopes) {
    body.set("scope", scheme.scopes);
  }
  let response: Response;
  try {
    response = await fetch(scheme.tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${toBase64(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
  } catch {
    log.warn("external service token request failed (network)", { actionType });
    return externalServiceError(
      "ExternalServiceUpstreamFailure",
      "External service token request failed",
    );
  }
  if (response.status < 200 || response.status >= 300) {
    log.warn("external service token request failed", {
      actionType,
      httpStatus: response.status,
      errorType: errorTypeForHttpStatus(response.status),
    });
    return externalServiceError(
      errorTypeForHttpStatus(response.status),
      `External service token endpoint returned HTTP ${response.status}: check the client id/secret`,
      { httpStatus: response.status },
    );
  }

  let payload: { access_token?: unknown; expires_in?: unknown };
  try {
    payload = await response.json();
  } catch {
    return externalServiceError(
      "ExternalServiceUpstreamFailure",
      "External service token endpoint returned invalid JSON",
      { httpStatus: response.status },
    );
  }
  if (typeof payload.access_token !== "string" || payload.access_token.length === 0) {
    return externalServiceError(
      "ExternalServiceUpstreamFailure",
      "External service token endpoint response has no access_token",
    );
  }
  const expiresInSec =
    typeof payload.expires_in === "number" && payload.expires_in > 0 ? payload.expires_in : 3600;
  oauth2TokenCache.set(cacheKey, {
    accessToken: payload.access_token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  });
  log.debug("external service client-credentials token acquired", { actionType, expiresInSec });
  return payload.access_token;
}

type OAuth2AuthorizationCodeScheme = {
  type: "oauth2AuthorizationCode";
  tokenUrl: string;
  clientIdKey: string;
  clientSecretKey: string;
  refreshTokenKey: string;
  scopes?: string;
};

function oauth2AuthorizationCodeCacheKey(scheme: OAuth2AuthorizationCodeScheme): string {
  return `${normalizeBaseUrl(scheme.tokenUrl)}|${scheme.clientIdKey}|${scheme.refreshTokenKey}`;
}

/**
 * OAuth2 refresh-token grant (issue #267): POST grant_type=refresh_token to the scheme's
 * tokenUrl with HTTP Basic client auth. Uses the named refresh-token secret (or a rotated
 * in-memory value). Caches the access token until expiry (60s margin). Never logs secrets.
 */
async function resolveAuthorizationCodeToken(
  scheme: OAuth2AuthorizationCodeScheme,
  actionType: string,
  forceRefresh: boolean,
): Promise<string | Action2Error> {
  const cacheKey = oauth2AuthorizationCodeCacheKey(scheme);
  const cached = oauth2TokenCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAtMs - TOKEN_EXPIRY_MARGIN_MS > Date.now()) {
    return cached.accessToken;
  }

  const tokenUrlError = assertBaseUrlAllowed(scheme.tokenUrl);
  if (tokenUrlError) {
    log.warn("external service call rejected: tokenUrl not allowed", { actionType });
    return tokenUrlError;
  }

  let clientId: string;
  let clientSecret: string;
  try {
    clientId = resolveSecret(scheme.clientIdKey).value;
    clientSecret = resolveSecret(scheme.clientSecretKey).value;
  } catch {
    log.warn(
      "external service call blocked: clientIdKey/clientSecretKey did not resolve to registered secrets (restart the server with --secret <name>=<value> or MIROIR_SECRET_<NAME>)",
      { actionType, clientIdKey: scheme.clientIdKey, clientSecretKey: scheme.clientSecretKey },
    );
    return externalServiceError("InvalidAction", "Unknown or empty secret");
  }

  let refreshToken = rotatedRefreshTokens.get(scheme.refreshTokenKey);
  if (!refreshToken) {
    try {
      refreshToken = resolveSecret(scheme.refreshTokenKey).value;
    } catch {
      log.warn(
        "external service call blocked: refreshTokenKey did not resolve to a registered secret (restart the server with --secret <name>=<value> or MIROIR_SECRET_<NAME>)",
        { actionType, refreshTokenKey: scheme.refreshTokenKey },
      );
      return externalServiceError("InvalidAction", "Unknown or empty secret");
    }
  }

  const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
  if (scheme.scopes) {
    body.set("scope", scheme.scopes);
  }
  let response: Response;
  try {
    response = await fetch(scheme.tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${toBase64(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
  } catch {
    log.warn("external service token request failed (network)", { actionType });
    return externalServiceError(
      "ExternalServiceUpstreamFailure",
      "External service token request failed",
    );
  }
  if (response.status < 200 || response.status >= 300) {
    log.warn("external service token request failed", {
      actionType,
      httpStatus: response.status,
      errorType: errorTypeForHttpStatus(response.status),
    });
    return externalServiceError(
      errorTypeForHttpStatus(response.status),
      `External service token endpoint returned HTTP ${response.status}: check the client id/secret`,
      { httpStatus: response.status },
    );
  }

  let payload: { access_token?: unknown; expires_in?: unknown; refresh_token?: unknown };
  try {
    payload = await response.json();
  } catch {
    return externalServiceError(
      "ExternalServiceUpstreamFailure",
      "External service token endpoint returned invalid JSON",
      { httpStatus: response.status },
    );
  }
  if (typeof payload.access_token !== "string" || payload.access_token.length === 0) {
    return externalServiceError(
      "ExternalServiceUpstreamFailure",
      "External service token endpoint response has no access_token",
    );
  }
  if (typeof payload.refresh_token === "string" && payload.refresh_token.length > 0) {
    rotatedRefreshTokens.set(scheme.refreshTokenKey, payload.refresh_token);
    log.info("external service received rotated refresh token", {
      actionType,
      refreshTokenKey: scheme.refreshTokenKey,
    });
  }
  const expiresInSec =
    typeof payload.expires_in === "number" && payload.expires_in > 0 ? payload.expires_in : 3600;
  oauth2TokenCache.set(cacheKey, {
    accessToken: payload.access_token,
    expiresAtMs: Date.now() + expiresInSec * 1000,
  });
  log.debug("external service authorization-code token acquired", { actionType, expiresInSec });
  return payload.access_token;
}

function isCachedOAuth2Scheme(
  scheme: EndpointExternalService["securityScheme"] | undefined,
): scheme is OAuth2ClientCredentialsScheme | OAuth2AuthorizationCodeScheme {
  return scheme?.type === "oauth2ClientCredentials" || scheme?.type === "oauth2AuthorizationCode";
}

/**
 * Builds the Authorization header value for the endpoint's security scheme.
 * Returns undefined when the endpoint has no credentials configured.
 */
async function resolveAuthorizationHeader(
  externalService: EndpointExternalService,
  actionType: string,
  forceTokenRefresh: boolean,
): Promise<string | Action2Error | undefined> {
  const scheme = externalService.securityScheme;
  if (scheme && scheme.type === "oauth2ClientCredentials") {
    const token = await resolveClientCredentialsToken(scheme, actionType, forceTokenRefresh);
    if (token instanceof Action2Error) {
      return token;
    }
    return `Bearer ${token}`;
  }
  if (scheme && scheme.type === "oauth2AuthorizationCode") {
    const token = await resolveAuthorizationCodeToken(scheme, actionType, forceTokenRefresh);
    if (token instanceof Action2Error) {
      return token;
    }
    return `Bearer ${token}`;
  }
  if (externalService.credentialKey) {
    let token: string;
    try {
      token = resolveSecret(externalService.credentialKey).value;
    } catch {
      log.warn(
        "external service call blocked: credentialKey did not resolve to a registered secret (restart the server with --secret <name>=<value> or MIROIR_SECRET_<NAME>)",
        { credentialKey: externalService.credentialKey, actionType },
      );
      return externalServiceError("InvalidAction", "Unknown or empty secret");
    }
    return `Bearer ${token}`;
  }
  return undefined;
}

export async function executeExternalServiceOperation(
  endpointInstance: EndpointDefinitionLike,
  actionType: string,
  bindings: Record<string, unknown>,
): Promise<Action2ReturnType> {
  const externalService = getExternalService(endpointInstance);
  if (!externalService) {
    log.warn("external service call rejected: target endpoint is not an externalService endpoint", {
      endpointUuid: (endpointInstance as { uuid?: string }).uuid,
      actionType,
    });
    return externalServiceError(
      "InvalidAction",
      "extractorFromAction is restricted to external-service GET operations (target is not an externalService endpoint)",
    );
  }
  for (const [name, value] of Object.entries(bindings)) {
    if (value !== null && typeof value === "object") {
      const failure = value as { queryFailure?: string; failureMessage?: string };
      const message = failure.queryFailure
        ? `External service parameter "${name}" could not be resolved: ${failure.failureMessage ?? failure.queryFailure}`
        : `External service parameter "${name}" resolved to a non-scalar value (unresolved template parameter?)`;
      log.warn("external service call blocked: unresolvable parameter binding", {
        actionType,
        parameter: name,
        queryFailure: failure.queryFailure,
      });
      return externalServiceError("InvalidAction", message, { parameter: name });
    }
  }
  return fetchExternalServiceOperation(externalService, actionType, bindingStrings(bindings));
}

async function fetchExternalServiceOperation(
  externalService: EndpointExternalService,
  actionType: string,
  bindings: Record<string, string>,
): Promise<Action2ReturnType> {
  const operation = externalService.operations.find((op) => op.operationId === actionType);
  if (!operation) {
    log.warn("external service call rejected: unknown operation", { actionType });
    return externalServiceError(
      "InvalidAction",
      `Unknown external service operation: ${actionType}`,
      { actionType },
    );
  }
  if (!externalService.enabledOperations.includes(actionType)) {
    log.warn("external service call rejected: operation not enabled", { actionType });
    return externalServiceError(
      "InvalidAction",
      `External service operation is not enabled: ${actionType}`,
      { actionType },
    );
  }
  if (String(operation.method).toUpperCase() !== "GET") {
    log.warn("external service call rejected: non-GET operation", { actionType, method: operation.method });
    return externalServiceError(
      "InvalidAction",
      `extractorFromAction is restricted to GET operations; ${actionType} has method ${operation.method}`,
      { actionType, method: operation.method },
    );
  }

  const baseUrlError = assertBaseUrlAllowed(externalService.baseUrl);
  if (baseUrlError) {
    log.warn("external service call rejected: baseUrl not allowed", { baseUrl: externalService.baseUrl });
    return baseUrlError;
  }

  const pathOrError = substitutePath(operation.path, operation.parameterMappings, bindings);
  if (pathOrError instanceof Action2Error) {
    return pathOrError;
  }

  const url = `${normalizeBaseUrl(externalService.baseUrl)}${pathOrError.startsWith("/") ? "" : "/"}${pathOrError}`;
  const headers: Record<string, string> = {};
  const authorization = await resolveAuthorizationHeader(externalService, actionType, false);
  if (authorization instanceof Action2Error) {
    return authorization;
  }
  if (authorization) {
    headers.Authorization = authorization;
  }

  // Never log `headers` here: it contains the secret. The URL is built only from the materialized operation.
  log.info("external service call", { actionType, method: operation.method, url });

  const doFetch = async (): Promise<Response | Action2Error> => {
    try {
      return await fetch(url, {
        method: operation.method,
        headers,
      });
    } catch {
      log.warn("external service request failed (network)", { actionType, url });
      return externalServiceError(
        "ExternalServiceUpstreamFailure",
        "External service request failed",
      );
    }
  };

  let response = await doFetch();
  if (response instanceof Action2Error) {
    return response;
  }
  if (response.status === 401 && isCachedOAuth2Scheme(externalService.securityScheme)) {
    log.info(
      externalService.securityScheme.type === "oauth2AuthorizationCode"
        ? "external service call got 401; refreshing authorization-code token and retrying once"
        : "external service call got 401; refreshing client-credentials token and retrying once",
      { actionType },
    );
    const refreshedAuthorization = await resolveAuthorizationHeader(externalService, actionType, true);
    if (refreshedAuthorization instanceof Action2Error) {
      return refreshedAuthorization;
    }
    if (refreshedAuthorization) {
      headers.Authorization = refreshedAuthorization;
    }
    response = await doFetch();
    if (response instanceof Action2Error) {
      return response;
    }
  }

  if (response.status < 200 || response.status >= 300) {
    log.warn("external service call failed", {
      actionType,
      url,
      httpStatus: response.status,
      errorType: errorTypeForHttpStatus(response.status),
    });
    return externalServiceError(
      errorTypeForHttpStatus(response.status),
      messageForHttpStatus(response.status),
      { httpStatus: response.status },
    );
  }
  log.debug("external service call succeeded", { actionType, httpStatus: response.status });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return externalServiceError(
      "ExternalServiceUpstreamFailure",
      "External service returned invalid JSON",
      { httpStatus: response.status },
    );
  }

  const validated = lenientValidateJzod(operation.responseSchema, body, "");
  if (validated.status === "error") {
    log.warn("external service response validation failed", {
      actionType,
      url,
      error: validated.error,
    });
    return externalServiceError(
      "FailedToGetInstances",
      `Response validation failed: ${validated.error}`,
    );
  }
  if (validated.strippedKeys.length > 0) {
    log.info(
      "ExternalServiceClient stripped unknown response fields (schema drift)",
      validated.strippedKeys,
    );
  }
  return { status: "ok", returnedDomainElement: validated.value };
}

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
  if (allowedInsecureBaseUrls.has(normalizeBaseUrl(baseUrl))) {
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
  if (externalService.credentialKey) {
    let token: string;
    try {
      token = resolveSecret(externalService.credentialKey);
    } catch {
      log.warn(
        "external service call blocked: credentialKey did not resolve to a registered secret (restart the server with --secret <name>=<value> or MIROIR_SECRET_<NAME>)",
        { credentialKey: externalService.credentialKey, actionType },
      );
      return externalServiceError("InvalidAction", "Unknown or empty secret");
    }
    headers.Authorization = `Bearer ${token}`;
  }

  // Never log `headers` here: it contains the secret. The URL is built only from the materialized operation.
  log.info("external service call", { actionType, method: operation.method, url });

  let response: Response;
  try {
    response = await fetch(url, {
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

/**
 * #284 — flatten multistep wizard step bag into the flat connectExternalService payload.
 * If `application` is already a uuid string, the payload is left alone (phase1–4 bags).
 */
export type ConnectExternalServiceFlatPayload = {
  application: string;
  endpointName: string;
  openApiDocument: string;
  baseUrl: string;
  userAgent?: string;
  authenticated: boolean;
  scheme?: string;
  authorizationTemplate?: string;
  credentialKey?: string;
  clientIdKey?: string;
  clientSecretKey?: string;
  refreshTokenKey?: string;
  tokenUrl?: string;
  scopes?: string;
  checkedOperationIds: string[];
  probeOperationId: string;
  probeParameters: Record<string, unknown>;
  processSecrets?: Record<string, string>;
  /** Set when the review step already ran the probe. */
  probeSucceeded?: boolean;
  probeMessage?: string;
  /** Present when the outcome step is in the bag. Absent means: create the report, do not touch the menu. */
  createExampleReport?: boolean;
  addReportToMenu?: boolean;
};

const STEP_IDS = new Set([
  "application",
  "name",
  "document",
  "baseUrl",
  "authenticated",
  "scheme",
  "secretsAuthCode",
  "secretsClient",
  "secretsCustom",
  "operations",
  "probeParams",
  "review",
  "outcome",
]);

function isUuidString(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  return undefined;
}

/** Switches `{ operationId: true }`, a comma-separated string, or an array, into operation ids. */
function checkedOperationIdsFromForm(checkedRaw: unknown): string[] {
  if (Array.isArray(checkedRaw)) {
    return checkedRaw.filter((id): id is string => typeof id === "string" && id.length > 0);
  }
  if (typeof checkedRaw === "string" && checkedRaw.trim().length > 0) {
    return checkedRaw.split(",").map((part) => part.trim()).filter(Boolean);
  }
  if (checkedRaw && typeof checkedRaw === "object") {
    return Object.entries(checkedRaw as Record<string, unknown>)
      .filter(([, value]) => value === true)
      .map(([operationId]) => operationId);
  }
  return [];
}

/**
 * Detect nested §5.1 step bag vs flat phase1–4 payload.
 * Flat: `application` is a uuid string and no §5.1 step ids are present as keys.
 * Nested: step ids are present as keys, or `application` is an object.
 */
export function normalizeConnectExternalServicePayload(
  payload: Record<string, unknown>,
): ConnectExternalServiceFlatPayload {
  const hasStepKeys = Object.keys(payload).some((key) => STEP_IDS.has(key));

  // Phase1–4 flat bags: application is a uuid and there are no step envelopes.
  if (isUuidString(payload.application) && !hasStepKeys) {
    return payload as unknown as ConnectExternalServiceFlatPayload;
  }

  const looksNested =
    hasStepKeys || typeof payload.application === "object";
  if (!looksNested) {
    return payload as unknown as ConnectExternalServiceFlatPayload;
  }

  const applicationStep = asRecord(payload.application);
  const nameStep = asRecord(payload.name);
  const documentStep = asRecord(payload.document);
  const baseUrlStep = asRecord(payload.baseUrl);
  const authenticatedStep = asRecord(payload.authenticated);
  const schemeStep = asRecord(payload.scheme);
  const secretsAuthCode = asRecord(payload.secretsAuthCode);
  const secretsClient = asRecord(payload.secretsClient);
  const secretsCustom = asRecord(payload.secretsCustom);
  const operationsStep = asRecord(payload.operations);
  const probeParamsStep = asRecord(payload.probeParams);
  const reviewStep = asRecord(payload.review);
  const outcomeStep = asRecord(payload.outcome);
  const hasOutcome = Object.prototype.hasOwnProperty.call(payload, "outcome");

  const application =
    pickString(applicationStep.application, payload.application) ?? "";
  const endpointName =
    pickString(nameStep.endpointName, nameStep.name, payload.endpointName) ?? "";
  const openApiDocument =
    pickString(
      documentStep.openApiDocument,
      documentStep.text,
      payload.openApiDocument,
    ) ?? "";
  const baseUrl =
    pickString(baseUrlStep.baseUrl, payload.baseUrl) ?? "";
  const userAgent = pickString(baseUrlStep.userAgent, payload.userAgent);
  const authenticated =
    authenticatedStep.authenticated === true ||
    payload.authenticated === true;
  const scheme = pickString(schemeStep.scheme, payload.scheme);

  const processSecrets: Record<string, string> = {};
  const credentialKey = pickString(
    secretsCustom.credentialKey,
    secretsAuthCode.credentialKey,
    payload.credentialKey,
  );
  const token = pickString(secretsCustom.token, secretsCustom.secretValue);
  if (credentialKey && token) {
    processSecrets[credentialKey] = token;
  }
  const clientIdKey = pickString(
    secretsAuthCode.clientIdKey,
    secretsClient.clientIdKey,
    payload.clientIdKey,
  );
  const clientSecretKey = pickString(
    secretsAuthCode.clientSecretKey,
    secretsClient.clientSecretKey,
    payload.clientSecretKey,
  );
  const clientSecret = pickString(
    secretsAuthCode.clientSecret,
    secretsClient.clientSecret,
  );
  const clientId = pickString(secretsAuthCode.clientId, secretsClient.clientId);
  if (clientIdKey && clientId) {
    processSecrets[clientIdKey] = clientId;
  }
  if (clientSecretKey && clientSecret) {
    processSecrets[clientSecretKey] = clientSecret;
  }
  const refreshTokenKey = pickString(
    secretsAuthCode.refreshTokenKey,
    payload.refreshTokenKey,
  );
  const refreshToken = pickString(secretsAuthCode.refreshToken);
  if (refreshTokenKey && refreshToken) {
    processSecrets[refreshTokenKey] = refreshToken;
  }

  const existingProcessSecrets = asRecord(payload.processSecrets);
  for (const [name, value] of Object.entries(existingProcessSecrets)) {
    if (typeof value === "string" && value.length > 0) {
      processSecrets[name] = value;
    }
  }

  const checkedRaw = operationsStep.checkedOperationIds ?? payload.checkedOperationIds;
  const checkedOperationIds = checkedOperationIdsFromForm(checkedRaw);
  const probeOperationId =
    pickString(operationsStep.probeOperationId, payload.probeOperationId) ?? "";

  const probeParameters =
    Object.keys(probeParamsStep).length > 0
      ? probeParamsStep
      : asRecord(payload.probeParameters);

  return {
    application,
    endpointName,
    openApiDocument,
    baseUrl,
    ...(userAgent ? { userAgent } : {}),
    authenticated,
    ...(scheme ? { scheme } : {}),
    ...(pickString(secretsCustom.authorizationTemplate, payload.authorizationTemplate)
      ? {
          authorizationTemplate: pickString(
            secretsCustom.authorizationTemplate,
            payload.authorizationTemplate,
          ),
        }
      : {}),
    ...(credentialKey ? { credentialKey } : {}),
    ...(clientIdKey ? { clientIdKey } : {}),
    ...(clientSecretKey ? { clientSecretKey } : {}),
    ...(refreshTokenKey ? { refreshTokenKey } : {}),
    ...(pickString(
      secretsAuthCode.tokenUrl,
      secretsClient.tokenUrl,
      payload.tokenUrl,
    )
      ? {
          tokenUrl: pickString(
            secretsAuthCode.tokenUrl,
            secretsClient.tokenUrl,
            payload.tokenUrl,
          ),
        }
      : {}),
    ...(pickString(secretsAuthCode.scopes, secretsClient.scopes, payload.scopes)
      ? {
          scopes: pickString(
            secretsAuthCode.scopes,
            secretsClient.scopes,
            payload.scopes,
          ),
        }
      : {}),
    checkedOperationIds,
    probeOperationId,
    probeParameters,
    ...(Object.keys(processSecrets).length > 0 ? { processSecrets } : {}),
    ...(reviewStep.probeSucceeded === true || reviewStep.probeSucceeded === false
      ? {
          probeSucceeded: reviewStep.probeSucceeded === true,
          ...(typeof reviewStep.probeMessage === "string"
            ? { probeMessage: reviewStep.probeMessage }
            : {}),
        }
      : {}),
    ...(hasOutcome
      ? {
          createExampleReport: outcomeStep.createExampleReport !== false,
          addReportToMenu: outcomeStep.addReportToMenu !== false,
        }
      : {}),
  };
}

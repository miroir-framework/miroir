import {
  ENTITY_MIROIR_SECRET_UUID,
  ENTITY_MIROIR_USER_CREDENTIAL_UUID,
} from "../1_core/authentication/AuthenticationPolicy.js";
import { redactRegisteredSecretValuesInString } from "./SecretStore.js";

/** Exact-match denylist (lowercased). Includes #284 wizard bag fields before process-map registration. */
const SENSITIVE_KEYS = new Set([
  "authorization",
  "token",
  "credential",
  "secret",
  "clientsecret",
  "refreshtoken",
  "secretvalue",
  "processsecrets",
]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

function redactProcessSecretsMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const next: Record<string, string> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    next[key] = "[REDACTED]";
  }
  return next;
}

/**
 * Key-based (authorization/token/credential/secret + wizard denylist) + value-based
 * (registered secrets) + passwordHash/ciphertext strip (#267 D4 / P18 / #284 Slice 4).
 */
export function redactCredentialSecretsFromValue(value: unknown): unknown {
  if (typeof value === "string") {
    return redactRegisteredSecretValuesInString(value);
  }
  if (Array.isArray(value)) {
    return value.map(redactCredentialSecretsFromValue);
  }
  if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype) {
    return value;
  }
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  const stripHash =
    String(record.parentUuid ?? "") === ENTITY_MIROIR_USER_CREDENTIAL_UUID && "passwordHash" in record;
  const stripCiphertext =
    String(record.parentUuid ?? "") === ENTITY_MIROIR_SECRET_UUID && "ciphertext" in record;
  for (const [key, child] of Object.entries(record)) {
    if (stripHash && key === "passwordHash") {
      continue;
    }
    if (stripCiphertext && key === "ciphertext") {
      continue;
    }
    if (key.toLowerCase() === "processsecrets") {
      next[key] = redactProcessSecretsMap(child);
      continue;
    }
    if (isSensitiveKey(key)) {
      // String values are secret material. Object values are schema nodes (Report
      // inputMLSchema attributes named clientSecret / token / refreshToken). Replacing
      // those objects with "[REDACTED]" makes the wizard report fail to render.
      if (Array.isArray(child)) {
        next[key] = child.map((item) =>
          item !== null && typeof item === "object"
            ? redactCredentialSecretsFromValue(item)
            : "[REDACTED]",
        );
        continue;
      }
      if (child !== null && typeof child === "object") {
        next[key] = redactCredentialSecretsFromValue(child);
        continue;
      }
      next[key] = "[REDACTED]";
      continue;
    }
    next[key] = redactCredentialSecretsFromValue(child);
  }
  return next;
}

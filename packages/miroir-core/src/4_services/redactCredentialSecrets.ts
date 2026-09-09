import { ENTITY_MIROIR_USER_CREDENTIAL_UUID } from "../1_core/authentication/AuthenticationPolicy.js";
import { redactRegisteredSecretValuesInString } from "./SecretStore.js";

const SENSITIVE_KEYS = new Set(["authorization", "token", "credential", "secret"]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

/**
 * Key-based (authorization/token/credential/secret) + value-based (registered secrets)
 * + existing passwordHash strip on user-credential instances (#267 D4 / P18).
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
  for (const [key, child] of Object.entries(record)) {
    if (stripHash && key === "passwordHash") {
      continue;
    }
    if (isSensitiveKey(key)) {
      next[key] = "[REDACTED]";
      continue;
    }
    next[key] = redactCredentialSecretsFromValue(child);
  }
  return next;
}

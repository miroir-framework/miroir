/**
 * In-process named secrets (issue #267 D4).
 * Module-level map only — no serialization or iteration API.
 */

const secrets = new Map<string, string>();

export function registerSecrets(values: Record<string, string>): void {
  for (const [name, value] of Object.entries(values)) {
    secrets.set(name, value);
  }
}

export function resolveSecret(name: string): string {
  if (!name) {
    throw new Error("Unknown or empty secret");
  }
  const value = secrets.get(name);
  if (value === undefined || value === "") {
    throw new Error("Unknown or empty secret");
  }
  return value;
}

export function clearSecrets(): void {
  secrets.clear();
}

/** Replace registered secret VALUES inside a string. Does not expose map keys. */
export function redactRegisteredSecretValuesInString(text: string): string {
  let next = text;
  for (const value of secrets.values()) {
    if (!value) {
      continue;
    }
    next = next.split(value).join("[REDACTED]");
  }
  return next;
}

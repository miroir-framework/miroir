/**
 * In-process named secrets (issue #267 D4 / #270 D2).
 * Module-level maps only — no serialization or iteration API.
 */

export type ResolveSecretResult = {
  value: string;
  scope: "process" | "user";
  miroirUserUuid?: string;
  source: "row" | "hatch";
};

const processSecrets = new Map<string, ResolveSecretResult>();

export function registerSecrets(values: Record<string, string>): void {
  for (const [name, value] of Object.entries(values)) {
    processSecrets.set(name, { value, scope: "process", source: "hatch" });
  }
}

export function registerHydratedProcessSecret(name: string, value: string): void {
  processSecrets.set(name, { value, scope: "process", source: "row" });
}

export function resolveSecret(
  name: string,
  _principal?: { miroirUserUuid?: string },
): ResolveSecretResult {
  if (!name) {
    throw new Error("Unknown or empty secret");
  }
  const entry = processSecrets.get(name);
  if (entry === undefined || entry.value === "") {
    throw new Error("Unknown or empty secret");
  }
  return entry;
}

export function clearSecrets(): void {
  processSecrets.clear();
}

/** Replace registered secret VALUES inside a string. Does not expose map keys. */
export function redactRegisteredSecretValuesInString(text: string): string {
  let next = text;
  for (const entry of processSecrets.values()) {
    if (!entry.value) {
      continue;
    }
    next = next.split(entry.value).join("[REDACTED]");
  }
  return next;
}

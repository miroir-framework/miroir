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

/** Snapshot of one process secret before a temporary register (issue #284 D13). */
export type ProcessSecretSnapshot = {
  name: string;
  /** Undefined when resolveSecret threw / the name was absent. */
  previous: ResolveSecretResult | undefined;
};

const processSecrets = new Map<string, ResolveSecretResult>();
/** Keyed `userUuid:name`. */
const userSecrets = new Map<string, ResolveSecretResult>();

function userSecretKey(miroirUserUuid: string, name: string): string {
  return `${miroirUserUuid}:${name}`;
}

export function registerSecrets(values: Record<string, string>): void {
  for (const [name, value] of Object.entries(values)) {
    processSecrets.set(name, { value, scope: "process", source: "hatch" });
  }
}

export function registerHydratedProcessSecret(name: string, value: string): void {
  processSecrets.set(name, { value, scope: "process", source: "row" });
}

export function registerHydratedUserSecret(
  miroirUserUuid: string,
  name: string,
  value: string,
): void {
  userSecrets.set(userSecretKey(miroirUserUuid, name), {
    value,
    scope: "user",
    miroirUserUuid,
    source: "row",
  });
}

export function resolveSecret(
  name: string,
  principal?: { miroirUserUuid?: string },
): ResolveSecretResult {
  if (!name) {
    throw new Error("Unknown or empty secret");
  }
  if (principal?.miroirUserUuid) {
    const userEntry = userSecrets.get(userSecretKey(principal.miroirUserUuid, name));
    if (userEntry !== undefined && userEntry.value !== "") {
      return userEntry;
    }
  }
  const entry = processSecrets.get(name);
  if (entry === undefined || entry.value === "") {
    throw new Error("Unknown or empty secret");
  }
  return entry;
}

/** Remove one process-scoped secret. Does not call clearSecrets. */
export function unregisterProcessSecret(name: string): void {
  processSecrets.delete(name);
}

/**
 * Restore process secrets after a failed probe (issue #284 D13).
 * Re-registers the previous entry, or unregisters when the name was absent.
 * Does not call clearSecrets.
 */
export function restoreProcessSecretsFromSnapshot(snapshots: ProcessSecretSnapshot[]): void {
  for (const { name, previous } of snapshots) {
    if (previous === undefined) {
      unregisterProcessSecret(name);
    } else {
      processSecrets.set(name, previous);
    }
  }
}

export function clearSecrets(): void {
  processSecrets.clear();
  userSecrets.clear();
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
  for (const entry of userSecrets.values()) {
    if (!entry.value) {
      continue;
    }
    next = next.split(entry.value).join("[REDACTED]");
  }
  return next;
}

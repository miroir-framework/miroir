/**
 * #234 — Application versioning mode (internal vs external vs unversioned).
 */

export type VersioningMode = "unversioned" | "versioned-internal" | "versioned-external";

export const VERSIONING_MODES: readonly VersioningMode[] = [
  "unversioned",
  "versioned-internal",
  "versioned-external",
] as const;

export type VersioningModeInput = {
  versioningEnabled?: boolean | string | undefined;
  versioningMode?: VersioningMode | string | undefined;
};

function isExplicitVersioningMode(value: unknown): value is VersioningMode {
  return (
    value === "unversioned" ||
    value === "versioned-internal" ||
    value === "versioned-external"
  );
}

function legacyVersioningEnabledFlag(
  selfApplication: VersioningModeInput,
): boolean {
  const flag = selfApplication.versioningEnabled;
  return flag === true || flag === "true";
}

/** Resolve effective versioning mode; explicit `versioningMode` wins over legacy boolean. */
export function resolveVersioningMode(selfApplication: VersioningModeInput): VersioningMode {
  if (isExplicitVersioningMode(selfApplication.versioningMode)) {
    return selfApplication.versioningMode;
  }
  if (legacyVersioningEnabledFlag(selfApplication)) {
    return "versioned-internal";
  }
  return "unversioned";
}

/** True when the application participates in any versioning model (internal or external). */
export function isApplicationVersioningCapable(selfApplication: VersioningModeInput): boolean {
  return resolveVersioningMode(selfApplication) !== "unversioned";
}

/**
 * Gate for in-app freeze / modelVersion history writes.
 * Requires `versioned-internal` (explicit or legacy `versioningEnabled: true` default).
 */
export function assertApplicationVersioningEnabled(selfApplication: VersioningModeInput): void {
  const mode = resolveVersioningMode(selfApplication);
  if (mode === "versioned-internal") {
    return;
  }
  if (mode === "versioned-external") {
    throw new Error(
      "Application uses versioned-external mode; in-app freeze requires versioned-internal",
    );
  }
  throw new Error(
    `Application does not have versioning enabled (versioningMode: ${mode}, versioningEnabled: ${String(selfApplication.versioningEnabled)})`,
  );
}

/** @deprecated Prefer resolveVersioningMode; kept for callers expecting a boolean gate. */
export function isApplicationVersioningEnabled(selfApplication: VersioningModeInput): boolean {
  return isApplicationVersioningCapable(selfApplication);
}

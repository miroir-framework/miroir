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

/** AppBar Versioning item: only when the browsed SelfApplication is versioned-internal. */
export function isVersioningAppBarItemVisible(args: {
  browsedSelfApplication?: VersioningModeInput;
}): boolean {
  if (!args.browsedSelfApplication) {
    return false;
  }
  return resolveVersioningMode(args.browsedSelfApplication) === "versioned-internal";
}

/** Whether a freeze can target an application, and why not (#225). */
export type FreezeAvailability = { available: true } | { available: false; reason: string };

/**
 * #225: an application can be frozen only when its SelfApplication row is loaded and
 * resolves to `versioned-internal`. The reason is shown to the user (greyed option tooltip).
 * Same rule as {@link assertApplicationVersioningEnabled}, without throwing.
 */
export function getFreezeAvailability(
  selfApplication: VersioningModeInput | undefined,
): FreezeAvailability {
  if (!selfApplication) {
    return { available: false, reason: "Application not loaded in this session" };
  }
  switch (resolveVersioningMode(selfApplication)) {
    case "versioned-internal":
      return { available: true };
    case "versioned-external":
      return { available: false, reason: "History is kept outside Miroir (versioned-external)" };
    case "unversioned":
      return { available: false, reason: "Application is not versioned" };
  }
}

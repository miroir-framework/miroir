import type { JzodReference } from "miroir-core";

/** Options threaded through Jzod → JSON-Schema / resolved-Jzod conversion. */
export type JzodConversionOptions = {
  /** Absolute+relative paths currently being expanded (cycle detection). */
  resolvingRefs?: Set<string>;
  /** Current recursion depth (guard against pathological schemas). */
  depth?: number;
  /** Hard depth cap; cyclic refs degrade before this when possible. */
  maxDepth?: number;
  /**
   * Shared JSON Schema `$defs` collector. Populated by `schemaReference` conversion;
   * attached to the root schema by `jzodElementToJsonSchema` when this call owns the map.
   */
  defs?: Record<string, unknown>;
};

export const DEFAULT_JZOD_CONVERSION_MAX_DEPTH = 64;

export type NormalizedJzodConversionOptions = {
  resolvingRefs: Set<string>;
  depth: number;
  maxDepth: number;
  defs: Record<string, unknown>;
};

export function normalizeJzodConversionOptions(
  options?: JzodConversionOptions,
): NormalizedJzodConversionOptions {
  return {
    resolvingRefs: options?.resolvingRefs ?? new Set<string>(),
    depth: options?.depth ?? 0,
    maxDepth: options?.maxDepth ?? DEFAULT_JZOD_CONVERSION_MAX_DEPTH,
    defs: options?.defs ?? {},
  };
}

export function schemaReferenceKey(ref: JzodReference): string {
  const definition = ref.definition as { absolutePath?: string; relativePath?: string };
  return `${definition.absolutePath ?? ""}#${definition.relativePath ?? ""}`;
}

/**
 * Stable `$defs` key for a Jzod schemaReference key.
 * Avoids JSON Pointer-sensitive characters (`#`, `/`, `~`) in the def name.
 */
export function sanitizeJsonSchemaDefKey(refKey: string): string {
  return refKey.replace(/[^A-Za-z0-9_-]/g, "_");
}

export function jsonSchemaRefPointer(defKey: string): string {
  return `#/$defs/${defKey}`;
}

export function isJzodConversionLimitReached(
  options: NormalizedJzodConversionOptions,
  refKey?: string,
): boolean {
  if (options.depth >= options.maxDepth) {
    return true;
  }
  if (refKey !== undefined && options.resolvingRefs.has(refKey)) {
    return true;
  }
  return false;
}

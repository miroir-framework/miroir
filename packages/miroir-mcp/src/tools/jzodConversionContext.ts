import type { JzodReference } from "miroir-core";

/** Options threaded through Jzod → JSON-Schema / resolved-Jzod conversion. */
export type JzodConversionOptions = {
  /** Absolute+relative paths currently being expanded (cycle detection). */
  resolvingRefs?: Set<string>;
  /** Current recursion depth (guard against pathological schemas). */
  depth?: number;
  /** Hard depth cap; cyclic refs degrade before this when possible. */
  maxDepth?: number;
};

export const DEFAULT_JZOD_CONVERSION_MAX_DEPTH = 64;

export function normalizeJzodConversionOptions(
  options?: JzodConversionOptions,
): Required<JzodConversionOptions> {
  return {
    resolvingRefs: options?.resolvingRefs ?? new Set<string>(),
    depth: options?.depth ?? 0,
    maxDepth: options?.maxDepth ?? DEFAULT_JZOD_CONVERSION_MAX_DEPTH,
  };
}

export function schemaReferenceKey(ref: JzodReference): string {
  const definition = ref.definition as { absolutePath?: string; relativePath?: string };
  return `${definition.absolutePath ?? ""}#${definition.relativePath ?? ""}`;
}

export function isJzodConversionLimitReached(
  options: Required<JzodConversionOptions>,
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

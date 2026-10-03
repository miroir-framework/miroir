/**
 * Local-cache segment model for #214 Option C′.
 * At most two homogeneous segments per (deployment, section, entity): full | partial.
 */

export type CacheSegmentKind = "full" | "partial";
export type CacheFreshness = "fresh" | "stale";

export interface LocalCacheSegmentHeader {
  kind: CacheSegmentKind;
  freshness: CacheFreshness;
  /** Required when kind === "partial"; sorted canonical attribute allow-list. */
  projection?: string[];
}

/** Payload shape used when loading instances into the local cache. */
export interface LocalCacheLoadSegmentHint {
  cacheSegment?: CacheSegmentKind | null;
  attributes?: string[] | null;
  /** #381: "merge" upserts a subset of rows; default "replace" sets the whole segment. */
  cacheLoadMode?: CacheLoadMode | null;
}

export type CacheLoadMode = "replace" | "merge";

/** Suffix appended to the cache index key for the partial segment. */
export const LOCAL_CACHE_PARTIAL_SEGMENT_SUFFIX = "__partial";

/** Choose segment from query shape — never per instance. */
export function resolveCacheSegmentKind(query: {
  attributes?: string[] | null;
}): CacheSegmentKind {
  return query.attributes && query.attributes.length > 0 ? "partial" : "full";
}

/**
 * Resolve which segment a load targets.
 * Explicit `cacheSegment` wins; otherwise derive from `attributes` (D4 / Phase 2).
 */
export function resolveLoadCacheSegment(
  hint: LocalCacheLoadSegmentHint
): { kind: CacheSegmentKind; projection?: string[] } {
  const kind =
    hint.cacheSegment === "full" || hint.cacheSegment === "partial"
      ? hint.cacheSegment
      : resolveCacheSegmentKind(hint);
  if (kind === "partial") {
    const projection = hint.attributes?.length
      ? canonicalizeProjection(hint.attributes)
      : undefined;
    if (!projection || projection.length === 0) {
      throw new Error(
        "resolveLoadCacheSegment: partial segment requires non-empty attributes/projection"
      );
    }
    return { kind, projection };
  }
  return { kind: "full" };
}

/** Sorted unique attribute list for partial-segment hit comparisons (D5). */
export function canonicalizeProjection(attributes: readonly string[]): string[] {
  return [...new Set(attributes)].sort();
}

export function projectionsEqual(
  a: readonly string[] | undefined | null,
  b: readonly string[] | undefined | null
): boolean {
  if (!a || !b) return false;
  const ca = canonicalizeProjection(a);
  const cb = canonicalizeProjection(b);
  if (ca.length !== cb.length) return false;
  return ca.every((v, i) => v === cb[i]);
}

export function buildLocalCacheSegmentHeader(
  kind: CacheSegmentKind,
  freshness: CacheFreshness = "fresh",
  projection?: readonly string[] | null
): LocalCacheSegmentHeader {
  if (kind === "partial") {
    if (!projection || projection.length === 0) {
      throw new Error(
        "buildLocalCacheSegmentHeader: partial segment requires non-empty projection"
      );
    }
    return {
      kind: "partial",
      freshness,
      projection: canonicalizeProjection(projection),
    };
  }
  return { kind: "full", freshness };
}

/**
 * #381 — how a load writes one zone's segment, given that zone's current header.
 * - "replace" (default): the rows are the whole segment, which becomes fresh.
 * - "merge": the rows are a subset (e.g. one row fetched by primary key). They are
 *   upserted into a segment of the same shape, keeping its header. Otherwise they
 *   start a new segment marked stale: it holds some rows, not all of them.
 */
export function resolveLoadSegmentWrite(
  hint: LocalCacheLoadSegmentHint,
  existingHeader: LocalCacheSegmentHeader | undefined | null
): { kind: CacheSegmentKind; header: LocalCacheSegmentHeader; merge: boolean } {
  const { kind, projection } = resolveLoadCacheSegment(hint);
  if (hint.cacheLoadMode !== "merge") {
    return { kind, header: buildLocalCacheSegmentHeader(kind, "fresh", projection), merge: false };
  }
  const sameShape =
    !!existingHeader &&
    existingHeader.kind === kind &&
    (kind === "full" || projectionsEqual(existingHeader.projection, projection));
  if (sameShape) {
    return { kind, header: existingHeader, merge: true };
  }
  return { kind, header: buildLocalCacheSegmentHeader(kind, "stale", projection), merge: false };
}

/** True when index key addresses the partial segment. */
export function isPartialLocalCacheIndex(localCacheIndex: string): boolean {
  return localCacheIndex.endsWith(LOCAL_CACHE_PARTIAL_SEGMENT_SUFFIX);
}

/** Strip optional `__partial` suffix for parsers that expect the triple form. */
export function stripLocalCacheSegmentSuffix(localCacheIndex: string): string {
  if (isPartialLocalCacheIndex(localCacheIndex)) {
    return localCacheIndex.slice(
      0,
      -LOCAL_CACHE_PARTIAL_SEGMENT_SUFFIX.length
    );
  }
  return localCacheIndex;
}

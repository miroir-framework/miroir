/**
 * Segment sufficiency for #214 Phase 3 — report ensureLoaded short-circuit.
 * Pure helpers; LocalCache / DomainController supply the segment header lookup.
 */

import {
  canonicalizeProjection,
  projectionsEqual,
  resolveCacheSegmentKind,
  type CacheSegmentKind,
  type LocalCacheSegmentHeader,
} from "./localCacheSegment.js";
import { getReduxDeploymentsStateIndex } from "../../2_domain/ReduxDeploymentsState.js";
import type { ReportQueryLoadRequest } from "../../2_domain/ReportQueryLoadService.js";

/** One persistence read target derived from a resolved report query. */
export type ReportQueryLoadTarget = {
  parentUuid: string;
  /** Set for extractorByPrimaryKey — fetch via runBoxedQueryAction (storage), not CRUD /all. */
  instanceUuid?: string;
  /** Extractor label in resolvedQuery.extractors (required when instanceUuid is set). */
  extractorKey?: string;
};

function loadTargetKey(target: ReportQueryLoadTarget): string {
  return `${target.parentUuid}:${target.instanceUuid ?? ""}:${target.extractorKey ?? ""}`;
}

/**
 * Collects load targets from extractors in a resolved report query.
 * Supports extractorInstancesByEntity (all instances) and extractorByPrimaryKey
 * (single instance — e.g. BlobDetails when cacheAllInstancesOnRefresh is false).
 */
export function reportQueryLoadTargetsFromResolvedReportQuery(
  resolvedQuery: ReportQueryLoadRequest["resolvedQuery"],
): ReportQueryLoadTarget[] {
  const extractors = (resolvedQuery as { extractors?: Record<string, any> })
    ?.extractors;
  if (!extractors) {
    return [];
  }
  const targets: ReportQueryLoadTarget[] = [];
  const seen = new Set<string>();
  for (const [extractorKey, extractor] of Object.entries(extractors)) {
    if (!extractor || typeof extractor.parentUuid !== "string") {
      continue;
    }
    if (extractor.extractorOrCombinerType === "extractorInstancesByEntity") {
      const target: ReportQueryLoadTarget = { parentUuid: extractor.parentUuid };
      const key = loadTargetKey(target);
      if (!seen.has(key)) {
        seen.add(key);
        targets.push(target);
      }
      continue;
    }
    if (extractor.extractorOrCombinerType === "extractorByPrimaryKey") {
      const instanceUuid =
        typeof extractor.instanceUuid === "string"
          ? extractor.instanceUuid
          : undefined;
      const target: ReportQueryLoadTarget = {
        parentUuid: extractor.parentUuid,
        extractorKey,
        ...(instanceUuid ? { instanceUuid } : {}),
      };
      const key = loadTargetKey(target);
      if (!seen.has(key)) {
        seen.add(key);
        targets.push(target);
      }
    }
  }
  return targets;
}

/**
 * Collects entity UUIDs referenced by report extractors (report-triggered cache fill).
 */
export function parentUuidsFromResolvedReportQuery(
  resolvedQuery: ReportQueryLoadRequest["resolvedQuery"],
): string[] {
  const uuids = new Set<string>();
  for (const target of reportQueryLoadTargetsFromResolvedReportQuery(resolvedQuery)) {
    uuids.add(target.parentUuid);
  }
  return [...uuids];
}

/**
 * Collect attributes from extractorInstancesByEntity extractors in a resolved query.
 * When several extractors declare attributes, they must agree (sorted-set equality);
 * otherwise returns undefined (caller should set request.projection explicitly).
 */
export function attributesFromResolvedReportQueryExtractors(
  resolvedQuery: ReportQueryLoadRequest["resolvedQuery"]
): string[] | undefined {
  const extractors = (resolvedQuery as { extractors?: Record<string, any> })
    ?.extractors;
  if (!extractors) return undefined;

  let agreed: string[] | undefined;
  for (const extractor of Object.values(extractors)) {
    const extractorType = extractor?.extractorOrCombinerType;
    if (
      !extractor ||
      (extractorType !== "extractorInstancesByEntity" &&
        extractorType !== "extractorByPrimaryKey") ||
      !Array.isArray(extractor.attributes) ||
      extractor.attributes.length === 0
    ) {
      continue;
    }
    const next = canonicalizeProjection(extractor.attributes);
    if (!agreed) {
      agreed = next;
      continue;
    }
    if (!projectionsEqual(agreed, next)) {
      return undefined;
    }
  }
  return agreed;
}

/**
 * Attributes that drive partial-segment routing for a report load request.
 * Prefer explicit `request.projection`; else derive from extractor `attributes`.
 */
export function resolveReportQueryLoadAttributes(
  request: Pick<ReportQueryLoadRequest, "projection" | "resolvedQuery">
): string[] | undefined {
  const attrs = request.projection?.attributes;
  if (attrs && attrs.length > 0) {
    return canonicalizeProjection(attrs);
  }
  if (request.resolvedQuery) {
    return attributesFromResolvedReportQueryExtractors(request.resolvedQuery);
  }
  return undefined;
}

export function resolveReportQueryLoadSegmentKind(
  request: Pick<ReportQueryLoadRequest, "projection" | "resolvedQuery">
): CacheSegmentKind {
  return resolveCacheSegmentKind({
    attributes: resolveReportQueryLoadAttributes(request),
  });
}

/**
 * True when a single segment header satisfies the requested kind + projection (D5).
 * Missing header ⇒ not sufficient.
 */
export function isLocalCacheSegmentHeaderSufficient(
  header: LocalCacheSegmentHeader | undefined | null,
  kind: CacheSegmentKind,
  projection?: readonly string[] | null
): boolean {
  if (!header) return false;
  if (header.kind !== kind) return false;
  if (header.freshness !== "fresh") return false;
  if (kind === "partial") {
    return projectionsEqual(header.projection, projection);
  }
  return true;
}

export type LocalCacheSegmentSlice = {
  segment?: LocalCacheSegmentHeader;
  entities?: Record<string, unknown>;
};

export type LocalCacheSegmentHeaderLookup = (
  deploymentUuid: string,
  applicationSection: "data" | "model",
  entityUuid: string,
  kind: CacheSegmentKind
) => LocalCacheSegmentHeader | LocalCacheSegmentSlice | undefined;

function segmentHeaderFromLookupResult(
  result: LocalCacheSegmentHeader | LocalCacheSegmentSlice | undefined
): LocalCacheSegmentHeader | undefined {
  if (!result) return undefined;
  if ("freshness" in result && "kind" in result) {
    return result as LocalCacheSegmentHeader;
  }
  return (result as LocalCacheSegmentSlice).segment;
}

function segmentEntitiesFromLookupResult(
  result: LocalCacheSegmentHeader | LocalCacheSegmentSlice | undefined
): Record<string, unknown> | undefined {
  if (!result || ("freshness" in result && "kind" in result)) {
    return undefined;
  }
  return (result as LocalCacheSegmentSlice).entities;
}

/**
 * All load targets referenced by the report must have a sufficient segment.
 * No targets ⇒ vacuously sufficient (nothing to load).
 * extractorByPrimaryKey targets also require the instance row in the segment.
 */
export function isReportQueryLoadSegmentSufficient(
  request: ReportQueryLoadRequest,
  lookup: LocalCacheSegmentHeaderLookup
): boolean {
  const targets = reportQueryLoadTargetsFromResolvedReportQuery(
    request.resolvedQuery
  );
  if (targets.length === 0) return true;

  const section = request.applicationSection ?? "data";
  const kind = resolveReportQueryLoadSegmentKind(request);
  const projection = resolveReportQueryLoadAttributes(request);

  for (const target of targets) {
    const lookupResult = lookup(
      request.deploymentUuid,
      section,
      target.parentUuid,
      kind
    );
    const header = segmentHeaderFromLookupResult(lookupResult);
    if (!isLocalCacheSegmentHeaderSufficient(header, kind, projection)) {
      return false;
    }
    if (target.instanceUuid) {
      const entities = segmentEntitiesFromLookupResult(lookupResult);
      if (!entities?.[target.instanceUuid]) {
        return false;
      }
    }
  }
  return true;
}

/** Build a lookup over LocalCache presentModelSnapshot.current. */
export function createSegmentHeaderLookupFromLocalCacheSnapshot(snapshot: {
  current?: Record<
    string,
    { segment?: LocalCacheSegmentHeader; entities?: Record<string, unknown> } | undefined
  >;
}): LocalCacheSegmentHeaderLookup {
  return (deploymentUuid, applicationSection, entityUuid, kind) => {
    const index = getReduxDeploymentsStateIndex(
      deploymentUuid,
      applicationSection,
      entityUuid,
      kind
    );
    const slice = snapshot.current?.[index];
    if (!slice) return undefined;
    return { segment: slice.segment, entities: slice.entities };
  };
}

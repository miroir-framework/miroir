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
import { getReduxDeploymentsStateIndex } from "../2_domain/ReduxDeploymentsState.js";
import type { ReportQueryLoadRequest } from "../2_domain/ReportQueryLoadService.js";

/**
 * Collects entity UUIDs referenced by extractorInstancesByEntity extractors
 * in a resolved report query (report-triggered cache fill).
 */
export function parentUuidsFromResolvedReportQuery(
  resolvedQuery: ReportQueryLoadRequest["resolvedQuery"],
): string[] {
  const extractors = (resolvedQuery as { extractors?: Record<string, any> })
    ?.extractors;
  if (!extractors) {
    return [];
  }
  const uuids = new Set<string>();
  for (const extractor of Object.values(extractors)) {
    if (
      extractor &&
      extractor.extractorOrCombinerType === "extractorInstancesByEntity" &&
      typeof extractor.parentUuid === "string"
    ) {
      uuids.add(extractor.parentUuid);
    }
  }
  return [...uuids];
}

/** Attributes that drive partial-segment routing for a report load request. */
export function resolveReportQueryLoadAttributes(
  request: Pick<ReportQueryLoadRequest, "projection">
): string[] | undefined {
  const attrs = request.projection?.attributes;
  if (!attrs || attrs.length === 0) return undefined;
  return canonicalizeProjection(attrs);
}

export function resolveReportQueryLoadSegmentKind(
  request: Pick<ReportQueryLoadRequest, "projection">
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

export type LocalCacheSegmentHeaderLookup = (
  deploymentUuid: string,
  applicationSection: "data" | "model",
  entityUuid: string,
  kind: CacheSegmentKind
) => LocalCacheSegmentHeader | undefined;

/**
 * All entity parents referenced by the report must have a sufficient segment.
 * No parents ⇒ vacuously sufficient (nothing to load).
 */
export function isReportQueryLoadSegmentSufficient(
  request: ReportQueryLoadRequest,
  lookup: LocalCacheSegmentHeaderLookup
): boolean {
  const parentUuids = parentUuidsFromResolvedReportQuery(request.resolvedQuery);
  if (parentUuids.length === 0) return true;

  const section = request.applicationSection ?? "data";
  const kind = resolveReportQueryLoadSegmentKind(request);
  const projection = resolveReportQueryLoadAttributes(request);

  for (const entityUuid of parentUuids) {
    const header = lookup(request.deploymentUuid, section, entityUuid, kind);
    if (!isLocalCacheSegmentHeaderSufficient(header, kind, projection)) {
      return false;
    }
  }
  return true;
}

/** Build a lookup over LocalCache presentModelSnapshot.current. */
export function createSegmentHeaderLookupFromLocalCacheSnapshot(snapshot: {
  current?: Record<string, { segment?: LocalCacheSegmentHeader } | undefined>;
}): LocalCacheSegmentHeaderLookup {
  return (deploymentUuid, applicationSection, entityUuid, kind) => {
    const index = getReduxDeploymentsStateIndex(
      deploymentUuid,
      applicationSection,
      entityUuid,
      kind
    );
    return snapshot.current?.[index]?.segment;
  };
}

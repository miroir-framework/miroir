/**
 * #214 Phase 4 — mutation guardrails for Option C′ segments.
 * Partial payloads must not create/update; full-segment mutations stale the sibling partial.
 */

import type {
  ApplicationSection,
  InstanceAction,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { Action2Error } from "../0_interfaces/2_domain/DomainElement.js";
import { getReduxDeploymentsStateIndex } from "../2_domain/ReduxDeploymentsState.js";
import type { LocalCacheSegmentHeader } from "./localCacheSegment.js";

/** Soft tag on an instance or InstanceAction.payload identifying a partial-sourced edit. */
export const MIROIR_CACHE_SEGMENT_MARKER = "miroirCacheSegment" as const;

export function isPartialMutationInstance(
  instance: Record<string, unknown> | null | undefined
): boolean {
  if (!instance || typeof instance !== "object") return false;
  return (instance as Record<string, unknown>)[MIROIR_CACHE_SEGMENT_MARKER] === "partial";
}

/**
 * True when create/update carries an explicit partial marker (payload or any object).
 * Delete is never treated as a partial mutation (identity-only is allowed).
 */
export function isPartialMutationInstanceAction(action: InstanceAction): boolean {
  if (
    action.actionType !== "createInstance" &&
    action.actionType !== "updateInstance"
  ) {
    return false;
  }
  const payload = action.payload as {
    cacheSegment?: string;
    objects?: Record<string, unknown>[];
  };
  if (payload.cacheSegment === "partial") return true;
  return (payload.objects ?? []).some((obj) => isPartialMutationInstance(obj));
}

export const PARTIAL_MUTATION_REJECTED_MESSAGE =
  "Partial entity instance payloads cannot be created or updated (#214). Load or edit via the full segment.";

/** Returns Action2Error when the action is a partial create/update; otherwise undefined. */
export function rejectPartialMutationInstanceAction(
  action: InstanceAction
): Action2Error | undefined {
  if (!isPartialMutationInstanceAction(action)) return undefined;
  return new Action2Error(
    "FailedToHandleAction",
    PARTIAL_MUTATION_REJECTED_MESSAGE,
    ["rejectPartialMutationInstanceAction"],
    undefined,
    { actionType: action.actionType }
  );
}

/** Zone shape shared by Redux / Zustand presentModelSnapshot. */
export type LocalCacheSegmentZones = {
  current: Record<string, { segment?: LocalCacheSegmentHeader; [k: string]: unknown }>;
  loading?: Record<string, { segment?: LocalCacheSegmentHeader; [k: string]: unknown }>;
};

/**
 * After a successful full-segment create/update/delete, mark the sibling partial
 * segment stale when present (D7). No-op if the partial index is absent.
 */
export function markSiblingPartialSegmentStale(
  state: LocalCacheSegmentZones,
  deploymentUuid: string,
  section: ApplicationSection,
  entityUuid: string
): void {
  const partialIndex = getReduxDeploymentsStateIndex(
    deploymentUuid,
    section,
    entityUuid,
    "partial"
  );
  const existing = state.current?.[partialIndex];
  if (!existing) return;

  const prev = existing.segment;
  const nextHeader: LocalCacheSegmentHeader = {
    kind: "partial",
    freshness: "stale",
    ...(prev?.projection?.length ? { projection: [...prev.projection] } : {}),
  };
  state.current[partialIndex] = {
    ...existing,
    segment: nextHeader,
  };
  if (state.loading?.[partialIndex]) {
    const loadingExisting = state.loading[partialIndex];
    state.loading[partialIndex] = {
      ...loadingExisting,
      segment: {
        kind: "partial",
        freshness: "stale",
        ...(loadingExisting.segment?.projection?.length
          ? { projection: [...loadingExisting.segment.projection] }
          : nextHeader.projection
            ? { projection: [...nextHeader.projection] }
            : {}),
      },
    };
  }
}

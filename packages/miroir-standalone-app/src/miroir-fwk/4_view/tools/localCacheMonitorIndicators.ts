/**
 * Session efficiency indicators for LocalCache monitoring (#211 Phase 6).
 * Pure counters + sample math; cleared when the monitor gate turns OFF.
 */

import type { AttributedInstanceSize, LocalCacheMemoryBreakdown } from "miroir-core";
import { isLocalCacheMonitorEnabled } from "./localCacheMonitorConfig.js";

export type LocalCacheMonitorIndicators = {
  peakEffectiveBytes: number;
  /** Bytes/min between the last two effective samples; null until two samples exist. */
  growthBytesPerMinute: number | null;
  /** transactionHistoryBytes / presentSnapshotBytes; null when present is 0. */
  historyToPresentRatio: number | null;
  cacheHits: number;
  cacheMisses: number;
  /** hits / (hits + misses); null when no samples. */
  hitRatio: number | null;
  thrashCount: number;
  /**
   * Share of attributed bytes held by the top-N Entities (default 3).
   * Null when attributed total is 0.
   */
  topEntityShare: number | null;
};

type Sample = { effectiveBytes: number; atMs: number };

let peakEffectiveBytes = 0;
let lastSample: Sample | null = null;
let prevSample: Sample | null = null;
let cacheHits = 0;
let cacheMisses = 0;
let thrashCount = 0;
let historyToPresentRatio: number | null = null;
let topEntityShare: number | null = null;
/** PKs deleted in-session (best-effort thrash until #208 eviction). */
const deletedPks = new Set<string>();

export function computeHistoryToPresentRatio(
  transactionHistoryBytes: number,
  presentSnapshotBytes: number
): number | null {
  if (presentSnapshotBytes <= 0) {
    return null;
  }
  return transactionHistoryBytes / presentSnapshotBytes;
}

export function computeHitRatio(hits: number, misses: number): number | null {
  const total = hits + misses;
  if (total <= 0) {
    return null;
  }
  return hits / total;
}

export function computeTopEntityShare(
  attributedInstances: AttributedInstanceSize[],
  topN = 3
): number | null {
  if (!attributedInstances.length) {
    return null;
  }
  const byEntity = new Map<string, number>();
  let total = 0;
  for (const row of attributedInstances) {
    const key = `${row.deploymentUuid}|${row.applicationSection}|${row.entityUuid}`;
    const next = (byEntity.get(key) ?? 0) + row.bytes;
    byEntity.set(key, next);
    total += row.bytes;
  }
  if (total <= 0) {
    return null;
  }
  const ranked = [...byEntity.values()].sort((a, b) => b - a);
  const top = ranked.slice(0, topN).reduce((s, n) => s + n, 0);
  return top / total;
}

export function instanceMonitorKey(parts: {
  deploymentUuid: string;
  applicationSection: string;
  entityUuid: string;
  instanceId: string;
}): string {
  return `${parts.deploymentUuid}|${parts.applicationSection}|${parts.entityUuid}|${parts.instanceId}`;
}

function growthFromSamples(prev: Sample, last: Sample): number {
  const dtMs = last.atMs - prev.atMs;
  if (dtMs <= 0) {
    return 0;
  }
  const delta = last.effectiveBytes - prev.effectiveBytes;
  return delta / (dtMs / 60_000);
}

export const localCacheMonitorIndicators = {
  reset(): void {
    peakEffectiveBytes = 0;
    lastSample = null;
    prevSample = null;
    cacheHits = 0;
    cacheMisses = 0;
    thrashCount = 0;
    historyToPresentRatio = null;
    topEntityShare = null;
    deletedPks.clear();
  },

  recordBreakdownSample(
    breakdown: LocalCacheMemoryBreakdown,
    atMs: number = Date.now()
  ): void {
    if (!isLocalCacheMonitorEnabled()) {
      return;
    }
    const effective = breakdown.effectiveBytes;
    if (effective > peakEffectiveBytes) {
      peakEffectiveBytes = effective;
    }
    if (lastSample) {
      prevSample = lastSample;
    }
    lastSample = { effectiveBytes: effective, atMs };
    historyToPresentRatio = computeHistoryToPresentRatio(
      breakdown.transactionHistoryBytes,
      breakdown.presentSnapshotBytes
    );
  },

  recordAttributedInstances(instances: AttributedInstanceSize[]): void {
    if (!isLocalCacheMonitorEnabled()) {
      return;
    }
    topEntityShare = computeTopEntityShare(instances);
  },

  recordCacheHit(): void {
    if (!isLocalCacheMonitorEnabled()) {
      return;
    }
    cacheHits += 1;
  },

  recordCacheMiss(): void {
    if (!isLocalCacheMonitorEnabled()) {
      return;
    }
    cacheMisses += 1;
  },

  recordInstanceDeleted(key: string): void {
    if (!isLocalCacheMonitorEnabled()) {
      return;
    }
    deletedPks.add(key);
  },

  recordInstanceLoaded(key: string): void {
    if (!isLocalCacheMonitorEnabled()) {
      return;
    }
    if (deletedPks.has(key)) {
      thrashCount += 1;
      deletedPks.delete(key);
    }
  },

  getIndicators(): LocalCacheMonitorIndicators {
    return {
      peakEffectiveBytes,
      growthBytesPerMinute:
        prevSample && lastSample
          ? growthFromSamples(prevSample, lastSample)
          : null,
      historyToPresentRatio,
      cacheHits,
      cacheMisses,
      hitRatio: computeHitRatio(cacheHits, cacheMisses),
      thrashCount,
      topEntityShare,
    };
  },

  /** Non-zero session weight for gate/footprint tests. */
  size(): number {
    return (
      (peakEffectiveBytes > 0 ? 1 : 0) +
      cacheHits +
      cacheMisses +
      thrashCount +
      deletedPks.size
    );
  },
};

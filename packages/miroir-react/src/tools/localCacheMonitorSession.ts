/**
 * Clear / export helpers for LocalCache monitor session (#211 Phase 8).
 */

import {
  aggregateAttributedByEntity,
  selectTopLargest,
  type AttributedEntitySize,
  type AttributedInstanceSize,
  type LocalCacheMemoryBreakdown,
} from "miroir-core";
import {
  getLocalCacheMonitorConfig,
  type LocalCacheMonitorConfig,
} from "./localCacheMonitorConfig.js";
import {
  localCacheMonitorIndicators,
  type LocalCacheMonitorIndicators,
} from "./localCacheMonitorIndicators.js";
import { localCacheMonitorRegistry } from "./localCacheMonitorRegistry.js";

export type LocalCacheMonitorExportPayload = {
  timestamp: string;
  configuration: LocalCacheMonitorConfig;
  breakdown: LocalCacheMemoryBreakdown | null;
  attributedTopEntities: AttributedEntitySize[];
  topLargestInstances: AttributedInstanceSize[];
  indicators: LocalCacheMonitorIndicators;
};

/**
 * Reset session peaks / rates / hit / thrash samples.
 * Does **not** mutate LocalCache domain EntityInstances.
 */
export function clearLocalCacheMonitorSession(): void {
  localCacheMonitorIndicators.reset();
}

export function buildLocalCacheMonitorExportPayload(
  now: Date = new Date()
): LocalCacheMonitorExportPayload {
  const snap = localCacheMonitorRegistry.getSnapshot();
  const attributed = snap?.attributedInstances ?? [];
  const byEntity = aggregateAttributedByEntity(attributed);
  const attributedTopEntities = [...byEntity].sort(
    (a, b) => b.attributedBytes - a.attributedBytes
  );

  return {
    timestamp: now.toISOString(),
    configuration: getLocalCacheMonitorConfig(),
    breakdown: snap?.breakdown ?? null,
    attributedTopEntities,
    topLargestInstances: selectTopLargest(attributed, 10),
    indicators: localCacheMonitorIndicators.getIndicators(),
  };
}

export function downloadLocalCacheMonitorExport(
  payload: LocalCacheMonitorExportPayload = buildLocalCacheMonitorExportPayload()
): void {
  const dataStr = JSON.stringify(payload, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `localcache-monitor-${payload.timestamp.split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

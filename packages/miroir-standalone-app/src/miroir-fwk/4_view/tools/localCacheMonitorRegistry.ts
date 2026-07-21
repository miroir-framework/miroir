/**
 * In-session LocalCache monitor UI registry (#211).
 * Holds the last polled snapshot for the docked panel. Cleared when the gate turns OFF.
 */

import type {
  AttributedInstanceSize,
  LocalCacheMemoryBreakdown,
  LocalCacheMonitorSnapshot,
} from "miroir-core";
import { isLocalCacheMonitorEnabled } from "./localCacheMonitorConfig.js";
import { localCacheMonitorIndicators } from "./localCacheMonitorIndicators.js";

export type LocalCacheMonitorUiSnapshot = {
  breakdown: LocalCacheMemoryBreakdown;
  attributedInstances: AttributedInstanceSize[];
};

let snapshot: LocalCacheMonitorUiSnapshot | null = null;

export const localCacheMonitorRegistry = {
  setSnapshot(next: LocalCacheMonitorUiSnapshot | LocalCacheMonitorSnapshot | null): void {
    // Footprint: no registry growth when gate is OFF.
    if (!isLocalCacheMonitorEnabled()) {
      return;
    }
    if (!next) {
      snapshot = null;
      return;
    }
    snapshot = {
      breakdown: next.breakdown,
      attributedInstances: next.attributedInstances,
    };
    localCacheMonitorIndicators.recordBreakdownSample(next.breakdown);
    localCacheMonitorIndicators.recordAttributedInstances(next.attributedInstances);
  },

  getSnapshot(): LocalCacheMonitorUiSnapshot | null {
    return snapshot;
  },

  resetAll(): void {
    snapshot = null;
    localCacheMonitorIndicators.reset();
  },

  /** Observable size for gate/footprint tests (0 when empty). */
  size(): number {
    return (
      (snapshot ? 1 + snapshot.attributedInstances.length : 0) +
      localCacheMonitorIndicators.size()
    );
  },
};

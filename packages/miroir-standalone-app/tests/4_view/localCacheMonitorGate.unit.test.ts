import { beforeEach, describe, expect, it } from "vitest";
import {
  getLocalCacheMonitorConfig,
  resetLocalCacheMonitorConfig,
  LOCAL_CACHE_MONITOR_SESSION_KEY,
} from "../../src/miroir-fwk/4_view/tools/localCacheMonitorConfig.js";
import {
  applyLocalCacheMonitorGate,
  isLocalCacheMonitorEnabled,
} from "../../src/miroir-fwk/4_view/tools/localCacheMonitorGate.js";
import { localCacheMonitorRegistry } from "../../src/miroir-fwk/4_view/tools/localCacheMonitorRegistry.js";
import { localCacheMonitorIndicators } from "../../src/miroir-fwk/4_view/tools/localCacheMonitorIndicators.js";

describe("applyLocalCacheMonitorGate (Phase 7)", () => {
  beforeEach(() => {
    resetLocalCacheMonitorConfig();
    localCacheMonitorRegistry.resetAll();
    sessionStorage.removeItem(LOCAL_CACHE_MONITOR_SESSION_KEY);
  });

  it("clears registry when turning the gate off", () => {
    applyLocalCacheMonitorGate(true);
    localCacheMonitorRegistry.setSnapshot({
      breakdown: {
        presentSnapshotBytes: 100,
        transactionHistoryBytes: 20,
        queriesResultsCacheBytes: 5,
        effectiveBytes: 125,
      },
      attributedInstances: [
        {
          deploymentUuid: "d",
          applicationSection: "data",
          entityUuid: "e",
          instanceId: "i",
          bytes: 40,
        },
      ],
    });
    localCacheMonitorIndicators.recordCacheHit();
    expect(localCacheMonitorRegistry.size()).toBeGreaterThan(0);
    expect(localCacheMonitorIndicators.getIndicators().peakEffectiveBytes).toBe(125);

    applyLocalCacheMonitorGate(false);

    expect(isLocalCacheMonitorEnabled()).toBe(false);
    expect(getLocalCacheMonitorConfig().enabled).toBe(false);
    expect(localCacheMonitorRegistry.size()).toBe(0);
    expect(localCacheMonitorRegistry.getSnapshot()).toBeNull();
    expect(localCacheMonitorIndicators.getIndicators().peakEffectiveBytes).toBe(0);
    expect(localCacheMonitorIndicators.getIndicators().cacheHits).toBe(0);
  });

  it("applyLocalCacheMonitorGate(true) enables showLocalCacheMonitor", () => {
    applyLocalCacheMonitorGate(true);

    expect(isLocalCacheMonitorEnabled()).toBe(true);
    expect(getLocalCacheMonitorConfig().enabled).toBe(true);
    expect(JSON.parse(sessionStorage.getItem(LOCAL_CACHE_MONITOR_SESSION_KEY)!)).toBe(true);
  });
});

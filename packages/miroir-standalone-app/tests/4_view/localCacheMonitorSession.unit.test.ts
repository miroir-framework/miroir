import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyLocalCacheMonitorGate } from "../../src/miroir-fwk/4_view/tools/localCacheMonitorGate.js";
import {
  LOCAL_CACHE_MONITOR_SESSION_KEY,
  resetLocalCacheMonitorConfig,
} from "../../src/miroir-fwk/4_view/tools/localCacheMonitorConfig.js";
import { localCacheMonitorIndicators } from "../../src/miroir-fwk/4_view/tools/localCacheMonitorIndicators.js";
import { localCacheMonitorRegistry } from "../../src/miroir-fwk/4_view/tools/localCacheMonitorRegistry.js";
import {
  buildLocalCacheMonitorExportPayload,
  clearLocalCacheMonitorSession,
} from "../../src/miroir-fwk/4_view/tools/localCacheMonitorSession.js";
import { readLocalCacheMonitorBreakdown } from "../../src/miroir-fwk/4_view/components/LocalCacheMonitorSummary.js";

describe("LocalCache monitor session clear/export (Phase 8)", () => {
  beforeEach(() => {
    resetLocalCacheMonitorConfig();
    localCacheMonitorRegistry.resetAll();
    sessionStorage.removeItem(LOCAL_CACHE_MONITOR_SESSION_KEY);
    applyLocalCacheMonitorGate(true);
  });

  it("clear monitor session stats does not delete Entity instances", () => {
    const domain = {
      instances: {
        "pub-1": { uuid: "pub-1", name: "Gallimard" },
      },
    };
    const localCache = {
      getDomainState: () => domain,
      deleteInstance: vi.fn(),
      handleLocalCacheAction: vi.fn(),
    };

    localCacheMonitorRegistry.setSnapshot({
      breakdown: {
        presentSnapshotBytes: 2000,
        transactionHistoryBytes: 100,
        queriesResultsCacheBytes: 0,
        effectiveBytes: 2100,
      },
      attributedInstances: [
        {
          deploymentUuid: "d",
          applicationSection: "data",
          entityUuid: "publishers",
          instanceId: "pub-1",
          bytes: 200,
        },
      ],
    });
    localCacheMonitorIndicators.recordCacheHit();
    localCacheMonitorIndicators.recordCacheMiss();
    expect(localCacheMonitorIndicators.getIndicators().peakEffectiveBytes).toBe(2100);

    clearLocalCacheMonitorSession();

    expect(localCacheMonitorIndicators.getIndicators().peakEffectiveBytes).toBe(0);
    expect(localCacheMonitorIndicators.getIndicators().cacheHits).toBe(0);
    expect(localCacheMonitorIndicators.getIndicators().cacheMisses).toBe(0);
    // Domain data untouched
    expect(localCache.getDomainState().instances["pub-1"]).toEqual({
      uuid: "pub-1",
      name: "Gallimard",
    });
    expect(localCache.deleteInstance).not.toHaveBeenCalled();
    expect(localCache.handleLocalCacheAction).not.toHaveBeenCalled();
    // Size snapshot retained for display until next poll/gate-off
    expect(localCacheMonitorRegistry.getSnapshot()?.breakdown.effectiveBytes).toBe(2100);
  });

  it("export payload includes effective breakdown and indicators", () => {
    localCacheMonitorRegistry.setSnapshot({
      breakdown: {
        presentSnapshotBytes: 3922,
        transactionHistoryBytes: 120,
        queriesResultsCacheBytes: 48,
        effectiveBytes: 4090,
      },
      attributedInstances: [
        {
          deploymentUuid: "d",
          applicationSection: "data",
          entityUuid: "books",
          instanceId: "b1",
          bytes: 900,
        },
        {
          deploymentUuid: "d",
          applicationSection: "data",
          entityUuid: "authors",
          instanceId: "a1",
          bytes: 400,
        },
      ],
    });
    localCacheMonitorIndicators.recordCacheHit();

    const payload = buildLocalCacheMonitorExportPayload(new Date("2026-07-22T10:00:00.000Z"));

    expect(payload.timestamp).toBe("2026-07-22T10:00:00.000Z");
    expect(payload.configuration.enabled).toBe(true);
    expect(payload.breakdown).toEqual({
      presentSnapshotBytes: 3922,
      transactionHistoryBytes: 120,
      queriesResultsCacheBytes: 48,
      effectiveBytes: 4090,
    });
    expect(payload.indicators.peakEffectiveBytes).toBe(4090);
    expect(payload.indicators.cacheHits).toBe(1);
    expect(payload.attributedTopEntities[0].entityUuid).toBe("books");
    expect(payload.topLargestInstances[0].instanceId).toBe("b1");
  });
});

describe("localCacheMonitorFootprint acceptance (Phase 8.3)", () => {
  beforeEach(() => {
    resetLocalCacheMonitorConfig();
    localCacheMonitorRegistry.resetAll();
    sessionStorage.removeItem(LOCAL_CACHE_MONITOR_SESSION_KEY);
    applyLocalCacheMonitorGate(false);
  });

  it("when monitor off, action hooks do not grow monitor registry", () => {
    expect(localCacheMonitorRegistry.size()).toBe(0);

    localCacheMonitorRegistry.setSnapshot({
      breakdown: {
        presentSnapshotBytes: 999,
        transactionHistoryBytes: 1,
        queriesResultsCacheBytes: 0,
        effectiveBytes: 1000,
      },
      attributedInstances: [
        {
          deploymentUuid: "d",
          applicationSection: "data",
          entityUuid: "e",
          instanceId: "i",
          bytes: 50,
        },
      ],
    });
    localCacheMonitorIndicators.recordCacheHit();
    localCacheMonitorIndicators.recordCacheMiss();
    localCacheMonitorIndicators.recordInstanceDeleted("d|data|e|i");
    localCacheMonitorIndicators.recordInstanceLoaded("d|data|e|i");

    const presentModelSnapshot = {
      current: {
        dep_data_e: {
          ids: ["i"],
          entities: { i: { uuid: "i", name: "x" } },
        },
      },
      loading: {},
    };
    readLocalCacheMonitorBreakdown({
      getState: () => ({
        presentModelSnapshot,
        previousModelSnapshot: presentModelSnapshot,
        pastModelPatches: [],
        futureModelPatches: [],
        currentTransaction: [],
        queriesResultsCache: {},
      }),
    });

    expect(localCacheMonitorRegistry.getSnapshot()).toBeNull();
    expect(localCacheMonitorRegistry.size()).toBe(0);
    expect(localCacheMonitorIndicators.size()).toBe(0);
    expect(localCacheMonitorIndicators.getIndicators().peakEffectiveBytes).toBe(0);
    expect(localCacheMonitorIndicators.getIndicators().thrashCount).toBe(0);
  });
});

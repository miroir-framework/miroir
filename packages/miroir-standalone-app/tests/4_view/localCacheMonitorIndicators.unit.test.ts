import { beforeEach, describe, expect, it } from "vitest";
import {
  computeHitRatio,
  computeHistoryToPresentRatio,
  computeTopEntityShare,
  instanceMonitorKey,
  localCacheMonitorIndicators,
} from "../../src/miroir-fwk/4_view/tools/localCacheMonitorIndicators.js";

describe("localCacheMonitorIndicators (Phase 6)", () => {
  beforeEach(() => {
    localCacheMonitorIndicators.reset();
  });

  describe("6.1 growth / peak", () => {
    it("records peak effective bytes and positive growth after size increase", () => {
      localCacheMonitorIndicators.recordBreakdownSample(
        {
          presentSnapshotBytes: 1000,
          transactionHistoryBytes: 0,
          queriesResultsCacheBytes: 0,
          effectiveBytes: 1000,
        },
        1_000_000
      );
      localCacheMonitorIndicators.recordBreakdownSample(
        {
          presentSnapshotBytes: 2500,
          transactionHistoryBytes: 0,
          queriesResultsCacheBytes: 0,
          effectiveBytes: 2500,
        },
        1_000_000 + 60_000 // one minute later
      );

      const ind = localCacheMonitorIndicators.getIndicators();
      expect(ind.peakEffectiveBytes).toBe(2500);
      expect(ind.growthBytesPerMinute).toBe(1500);
    });
  });

  describe("6.2 history / present ratio", () => {
    it("exposes history-to-present ratio", () => {
      expect(computeHistoryToPresentRatio(50, 200)).toBe(0.25);
      expect(computeHistoryToPresentRatio(10, 0)).toBeNull();

      localCacheMonitorIndicators.recordBreakdownSample({
        presentSnapshotBytes: 400,
        transactionHistoryBytes: 100,
        queriesResultsCacheBytes: 0,
        effectiveBytes: 500,
      });
      expect(localCacheMonitorIndicators.getIndicators().historyToPresentRatio).toBe(0.25);
    });
  });

  describe("6.3 hit ratio & thrash", () => {
    it("hit-ratio counters compute ratio from hits and misses", () => {
      expect(computeHitRatio(0, 0)).toBeNull();
      expect(computeHitRatio(3, 1)).toBe(0.75);

      localCacheMonitorIndicators.recordCacheHit();
      localCacheMonitorIndicators.recordCacheHit();
      localCacheMonitorIndicators.recordCacheMiss();
      const ind = localCacheMonitorIndicators.getIndicators();
      expect(ind.cacheHits).toBe(2);
      expect(ind.cacheMisses).toBe(1);
      expect(ind.hitRatio).toBeCloseTo(2 / 3);
    });

    it("thrash counter increments when deleted PK is loaded again in-session", () => {
      const key = instanceMonitorKey({
        deploymentUuid: "d",
        applicationSection: "data",
        entityUuid: "e",
        instanceId: "pub-1",
      });

      localCacheMonitorIndicators.recordInstanceLoaded(key);
      expect(localCacheMonitorIndicators.getIndicators().thrashCount).toBe(0);

      localCacheMonitorIndicators.recordInstanceDeleted(key);
      localCacheMonitorIndicators.recordInstanceLoaded(key);
      expect(localCacheMonitorIndicators.getIndicators().thrashCount).toBe(1);

      // Second load of same PK without another delete is not thrash.
      localCacheMonitorIndicators.recordInstanceLoaded(key);
      expect(localCacheMonitorIndicators.getIndicators().thrashCount).toBe(1);
    });
  });

  describe("working-set concentration", () => {
    it("computes top-entity share of attributed bytes", () => {
      const share = computeTopEntityShare(
        [
          {
            deploymentUuid: "d",
            applicationSection: "data",
            entityUuid: "books",
            instanceId: "1",
            bytes: 70,
          },
          {
            deploymentUuid: "d",
            applicationSection: "data",
            entityUuid: "books",
            instanceId: "2",
            bytes: 30,
          },
          {
            deploymentUuid: "d",
            applicationSection: "data",
            entityUuid: "authors",
            instanceId: "a",
            bytes: 50,
          },
        ],
        1
      );
      // Top entity (books=100) / total 150
      expect(share).toBeCloseTo(100 / 150);
    });
  });
});

import { describe, expect, it } from "vitest";
import type { LocalCacheSliceState, StateWithUndoRedo } from "../../src/0_interfaces/2_domain/LocalCacheInterface.js";
import {
  estimateObjectBytes,
  measureLocalCacheMemory,
} from "../../src/2_domain/localCacheMemoryMeasure.js";

function emptyCommit(): StateWithUndoRedo["currentTransaction"] {
  return {
    date: new Date(0),
    name: "",
    actions: [],
    patches: [],
  };
}

describe("localCacheMemoryMeasure (Phase 1)", () => {
  describe("1.1 identity-aware size walk", () => {
    it("counts a shared object only once across two parent references", () => {
      const shared = { payload: "x".repeat(1000) };
      const once = estimateObjectBytes(shared);
      const twiceReachable = estimateObjectBytes({ a: shared, b: shared });

      // Parent object adds a little structure, but must not double-count `shared`.
      expect(twiceReachable).toBeLessThan(once * 2);
      expect(twiceReachable).toBeGreaterThanOrEqual(once);
      expect(twiceReachable - once).toBeLessThan(once / 2);
    });
  });

  describe("1.2 commit alias", () => {
    it("after commit alias, history incremental excludes present payload", () => {
      const present: LocalCacheSliceState = {
        loading: {},
        current: {
          "dep-1": {
            data: {
              "entity-1": {
                ids: ["inst-1"],
                entities: {
                  "inst-1": {
                    uuid: "inst-1",
                    parentUuid: "entity-1",
                    name: "big-".concat("Y".repeat(5000)),
                  },
                },
              },
            },
          },
        } as LocalCacheSliceState["current"],
        status: { initialLoadDone: true },
      };

      // Post-commit: previous and present are the same reference.
      const state: StateWithUndoRedo = {
        currentTransaction: emptyCommit(),
        previousModelSnapshot: present,
        pastModelPatches: [],
        presentModelSnapshot: present,
        futureModelPatches: [],
        queriesResultsCache: {},
      };

      const measured = measureLocalCacheMemory(state);
      const presentAlone = estimateObjectBytes(present);

      expect(measured.presentSnapshotBytes).toBe(presentAlone);
      expect(measured.transactionHistoryBytes).toBeLessThan(presentAlone / 10);
      expect(measured.queriesResultsCacheBytes).toBe(0);
      expect(measured.effectiveBytes).toBe(
        measured.presentSnapshotBytes +
          measured.transactionHistoryBytes +
          measured.queriesResultsCacheBytes
      );
      expect(measured.effectiveBytes).toBeLessThan(presentAlone * 1.2);
    });
  });

  describe("1.3 divergent previous with shared subtree", () => {
    it("history incremental reflects only non-shared nodes plus patches", () => {
      const largeShared = { blob: "Z".repeat(8000) };
      const onlyPrevious = { tag: "prev-only" };
      const onlyPresent = { tag: "present-only" };

      const previous: LocalCacheSliceState = {
        loading: {},
        current: {
          sharedKey: { ids: ["s"], entities: { s: largeShared as any } },
          prevKey: { ids: ["p"], entities: { p: onlyPrevious as any } },
        } as LocalCacheSliceState["current"],
        status: { initialLoadDone: true },
      };

      const present: LocalCacheSliceState = {
        loading: {},
        current: {
          sharedKey: { ids: ["s"], entities: { s: largeShared as any } },
          presentKey: { ids: ["n"], entities: { n: onlyPresent as any } },
        } as LocalCacheSliceState["current"],
        status: { initialLoadDone: true },
      };

      const state: StateWithUndoRedo = {
        currentTransaction: emptyCommit(),
        previousModelSnapshot: previous,
        pastModelPatches: [],
        presentModelSnapshot: present,
        futureModelPatches: [],
        queriesResultsCache: {},
      };

      const measured = measureLocalCacheMemory(state);
      const previousAlone = estimateObjectBytes(previous);
      const presentAlone = estimateObjectBytes(present);
      const naiveSum = previousAlone + presentAlone;
      const onlyPreviousBytes = estimateObjectBytes(onlyPrevious);

      expect(measured.presentSnapshotBytes).toBe(presentAlone);
      expect(measured.effectiveBytes).toBeLessThan(naiveSum);
      // History should be in the ballpark of the divergent previous-only payload,
      // not the full previous snapshot (which includes the large shared blob).
      expect(measured.transactionHistoryBytes).toBeLessThan(previousAlone / 2);
      expect(measured.transactionHistoryBytes).toBeGreaterThanOrEqual(onlyPreviousBytes);
    });
  });

  describe("1.4 action payloads excluded from history", () => {
    it("does not deep-size action payloads when measuring history", () => {
      const largeInstance = {
        uuid: "inst-1",
        parentUuid: "entity-1",
        body: "W".repeat(20000),
      };
      // Realistic: action payload holds a *copy* of instance data (distinct identity).
      const payloadCopy = {
        uuid: "inst-1",
        parentUuid: "entity-1",
        body: "W".repeat(20000),
      };

      const present: LocalCacheSliceState = {
        loading: {},
        current: {
          "dep_data_entity-1": {
            ids: ["inst-1"],
            entities: { "inst-1": largeInstance as any },
          },
        } as LocalCacheSliceState["current"],
        status: { initialLoadDone: true },
      };

      const hugePayloadAlone = estimateObjectBytes(payloadCopy);

      const state: StateWithUndoRedo = {
        currentTransaction: emptyCommit(),
        previousModelSnapshot: present,
        pastModelPatches: [
          {
            action: {
              actionType: "createInstance",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              payload: {
                applicationSection: "data",
                objects: [payloadCopy],
              },
            } as any,
            changes: [{ op: "add", path: ["current", "x"], value: 1 }],
            inverseChanges: [{ op: "remove", path: ["current", "x"] }],
          },
        ],
        presentModelSnapshot: present,
        futureModelPatches: [],
        queriesResultsCache: {},
      };

      const measured = measureLocalCacheMemory(state);

      // If action.payload were deep-sized, history would jump by ~hugePayloadAlone.
      expect(measured.transactionHistoryBytes).toBeLessThan(hugePayloadAlone / 5);
      expect(measured.effectiveBytes).toBeLessThan(
        measured.presentSnapshotBytes + hugePayloadAlone
      );
    });
  });
});

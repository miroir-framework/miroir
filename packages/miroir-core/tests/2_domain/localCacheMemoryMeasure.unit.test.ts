import { describe, expect, it } from "vitest";
import type {
  InstanceCUDAction,
  TransactionalInstanceAction,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type {
  LocalCacheSliceState,
  StateChanges,
  StateWithUndoRedo,
} from "../../src/0_interfaces/2_domain/LocalCacheInterface.js";
import type { ZEntityState } from "../../src/0_interfaces/2_domain/ReduxDeploymentsStateInterface.js";
import { getReduxDeploymentsStateIndex } from "../../src/2_domain/ReduxDeploymentsState.js";
import {
  estimateObjectBytes,
  measureLocalCacheMemory,
} from "../../src/2_domain/localCacheMemoryMeasure.js";

const DEPLOYMENT = "22222222-2222-2222-2222-222222222222";
const ENTITY = "33333333-3333-3333-3333-333333333333";
const ENTITY_SHARED = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ENTITY_PREV = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ENTITY_PRESENT = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const APPLICATION = "11111111-1111-1111-1111-111111111111";

/** Domain instances carry many attributes; EntityInstance type is intentionally narrow. */
type FatInstance = {
  uuid: string;
  parentUuid: string;
  [key: string]: unknown;
};

function emptyCommit(): StateWithUndoRedo["currentTransaction"] {
  return {
    date: new Date(0),
    name: "",
    actions: [],
    patches: [],
  };
}

function entityCollection(instances: Record<string, FatInstance>): ZEntityState {
  return {
    ids: Object.keys(instances),
    entities: instances as ZEntityState["entities"],
  };
}

function sliceWithEntities(
  entries: Array<{ entityUuid: string; instances: Record<string, FatInstance> }>
): LocalCacheSliceState {
  const current: LocalCacheSliceState["current"] = {};
  for (const entry of entries) {
    const index = getReduxDeploymentsStateIndex(DEPLOYMENT, "data", entry.entityUuid);
    current[index] = entityCollection(entry.instances);
  }
  return {
    loading: {},
    current,
    status: { initialLoadDone: true },
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
      const present = sliceWithEntities([
        {
          entityUuid: ENTITY,
          instances: {
            "inst-1": {
              uuid: "inst-1",
              parentUuid: ENTITY,
              name: "big-".concat("Y".repeat(5000)),
            },
          },
        },
      ]);

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
      const largeShared: FatInstance = {
        uuid: "s",
        parentUuid: ENTITY_SHARED,
        blob: "Z".repeat(8000),
      };
      const onlyPrevious: FatInstance = {
        uuid: "p",
        parentUuid: ENTITY_PREV,
        tag: "prev-only",
      };
      const onlyPresent: FatInstance = {
        uuid: "n",
        parentUuid: ENTITY_PRESENT,
        tag: "present-only",
      };

      const previous = sliceWithEntities([
        { entityUuid: ENTITY_SHARED, instances: { s: largeShared } },
        { entityUuid: ENTITY_PREV, instances: { p: onlyPrevious } },
      ]);
      const present = sliceWithEntities([
        { entityUuid: ENTITY_SHARED, instances: { s: largeShared } },
        { entityUuid: ENTITY_PRESENT, instances: { n: onlyPresent } },
      ]);

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
      const largeInstance: FatInstance = {
        uuid: "inst-1",
        parentUuid: ENTITY,
        body: "W".repeat(20000),
      };
      // Realistic: action payload holds a *copy* of instance data (distinct identity).
      const payloadCopy: FatInstance = {
        uuid: "inst-1",
        parentUuid: ENTITY,
        body: "W".repeat(20000),
      };

      const present = sliceWithEntities([
        { entityUuid: ENTITY, instances: { "inst-1": largeInstance } },
      ]);

      const hugePayloadAlone = estimateObjectBytes(payloadCopy);

      const createInstance: InstanceCUDAction = {
        actionType: "createInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: APPLICATION,
          applicationSection: "data",
          objects: [payloadCopy] as InstanceCUDAction["payload"]["objects"],
        },
      };

      const transactionalAction: TransactionalInstanceAction = {
        actionType: "transactionalInstanceAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        payload: {
          application: APPLICATION,
          instanceAction: createInstance,
        },
      };

      const pastPatch: StateChanges = {
        action: transactionalAction,
        changes: [{ op: "add", path: ["current", "x"], value: 1 }],
        inverseChanges: [{ op: "remove", path: ["current", "x"] }],
      };

      const state: StateWithUndoRedo = {
        currentTransaction: emptyCommit(),
        previousModelSnapshot: present,
        pastModelPatches: [pastPatch],
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

import { describe, expect, it } from "vitest";
import {
  author1,
  author2,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  deployment_Library_DO_NO_USE,
  entityAuthor,
  entityBook,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";
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

const LIBRARY_DEPLOYMENT = deployment_Library_DO_NO_USE.uuid;
const LIBRARY_APPLICATION = selfApplicationLibrary.uuid;

const libraryBooks = [book1, book2, book3, book4, book5, book6] as const;

function emptyCommit(): StateWithUndoRedo["currentTransaction"] {
  return {
    date: new Date(0),
    name: "",
    actions: [],
    patches: [],
  };
}

function entityCollection(
  instances: Array<{ uuid: string } & Record<string, unknown>>
): ZEntityState {
  const entities: ZEntityState["entities"] = {};
  const ids: string[] = [];
  for (const instance of instances) {
    ids.push(instance.uuid);
    entities[instance.uuid] = instance as ZEntityState["entities"][string];
  }
  return { ids, entities };
}

function librarySlice(args: {
  books?: typeof libraryBooks[number][];
  authors?: Array<typeof author1>;
}): LocalCacheSliceState {
  const current: LocalCacheSliceState["current"] = {};
  if (args.books && args.books.length > 0) {
    current[
      getReduxDeploymentsStateIndex(LIBRARY_DEPLOYMENT, "data", entityBook.uuid)
    ] = entityCollection(args.books);
  }
  if (args.authors && args.authors.length > 0) {
    current[
      getReduxDeploymentsStateIndex(LIBRARY_DEPLOYMENT, "data", entityAuthor.uuid)
    ] = entityCollection(args.authors);
  }
  return {
    loading: {},
    current,
    status: { initialLoadDone: true },
  };
}

describe("localCacheMemoryMeasure (Phase 1 — Library app fixtures)", () => {
  describe("1.1 identity-aware size walk", () => {
    it("counts a shared Library Book only once across two parent references", () => {
      const once = estimateObjectBytes(book1);
      const twiceReachable = estimateObjectBytes({ a: book1, b: book1 });

      expect(twiceReachable).toBeLessThan(once * 2);
      expect(twiceReachable).toBeGreaterThanOrEqual(once);
      expect(twiceReachable - once).toBeLessThan(once / 2);
    });
  });

  describe("1.2 commit alias", () => {
    it("after commit alias, history incremental excludes present Library Books payload", () => {
      const present = librarySlice({ books: [...libraryBooks] });

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
    it("history incremental reflects only non-shared Library Author plus patches", () => {
      // Shared Book collection (same object identities) across previous/present;
      // Author1 only in previous, Author2 only in present.
      const sharedBooks = [...libraryBooks];
      const previous = librarySlice({
        books: sharedBooks,
        authors: [author1],
      });
      const present = librarySlice({
        books: sharedBooks,
        authors: [author2],
      });

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
      const onlyPreviousBytes = estimateObjectBytes(author1);

      expect(measured.presentSnapshotBytes).toBe(presentAlone);
      expect(measured.effectiveBytes).toBeLessThan(naiveSum);
      expect(measured.transactionHistoryBytes).toBeLessThan(previousAlone / 2);
      expect(measured.transactionHistoryBytes).toBeGreaterThanOrEqual(onlyPreviousBytes);
    });
  });

  describe("1.4 action payloads excluded from history", () => {
    it("does not deep-size Library Book action payloads when measuring history", () => {
      const present = librarySlice({ books: [...libraryBooks] });
      // Distinct identities (copies) — realistic of action payloads vs present.
      const payloadBooks = structuredClone([...libraryBooks]);
      const hugePayloadAlone = estimateObjectBytes(payloadBooks);

      const createInstance: InstanceCUDAction = {
        actionType: "createInstance",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        payload: {
          application: LIBRARY_APPLICATION,
          applicationSection: "data",
          parentUuid: entityBook.uuid,
          objects: payloadBooks as InstanceCUDAction["payload"]["objects"],
        },
      };

      const transactionalAction: TransactionalInstanceAction = {
        actionType: "transactionalInstanceAction",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        payload: {
          application: LIBRARY_APPLICATION,
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

      expect(measured.transactionHistoryBytes).toBeLessThan(hugePayloadAlone / 5);
      expect(measured.effectiveBytes).toBeLessThan(
        measured.presentSnapshotBytes + hugePayloadAlone
      );
    });
  });
});

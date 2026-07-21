import { describe, expect, it } from "vitest";
import {
  author1,
  author2,
  book1,
  book2,
  book3,
  deployment_Library_DO_NO_USE,
  entityAuthor,
  entityBook,
} from "miroir-test-app_deployment-library";
import type { LocalCacheSliceState } from "../../src/0_interfaces/2_domain/LocalCacheInterface.js";
import type { ZEntityState } from "../../src/0_interfaces/2_domain/ReduxDeploymentsStateInterface.js";
import { getReduxDeploymentsStateIndex } from "../../src/2_domain/ReduxDeploymentsState.js";
import {
  aggregateAttributedByEntity,
  buildAttributedInstanceIndex,
  estimateObjectBytes,
  selectTopLargest,
} from "../../src/2_domain/localCacheMemoryMeasure.js";

const LIBRARY_DEPLOYMENT = deployment_Library_DO_NO_USE.uuid;

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

function libraryPresent(args: {
  books?: Array<{ uuid: string } & Record<string, unknown>>;
  authors?: Array<{ uuid: string } & Record<string, unknown>>;
  loadingBooks?: Array<{ uuid: string } & Record<string, unknown>>;
}): LocalCacheSliceState {
  const current: LocalCacheSliceState["current"] = {};
  const loading: LocalCacheSliceState["loading"] = {};
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
  if (args.loadingBooks && args.loadingBooks.length > 0) {
    loading[
      getReduxDeploymentsStateIndex(LIBRARY_DEPLOYMENT, "data", entityBook.uuid)
    ] = entityCollection(args.loadingBooks);
  }
  return {
    loading,
    current,
    status: { initialLoadDone: true },
  };
}

describe("localCacheMemoryMeasure attributed index (Phase 4)", () => {
  describe("4.1 per-Entity attributed totals", () => {
    it("attributes instance bytes per Entity under present.current", () => {
      const books = [book1, book2, book3];
      const authors = [author1, author2];
      const present = libraryPresent({ books, authors });

      const instances = buildAttributedInstanceIndex(present);
      const byEntity = aggregateAttributedByEntity(instances);

      const bookRow = byEntity.find((r) => r.entityUuid === entityBook.uuid);
      const authorRow = byEntity.find((r) => r.entityUuid === entityAuthor.uuid);

      expect(bookRow).toBeDefined();
      expect(authorRow).toBeDefined();
      expect(bookRow!.instanceCount).toBe(3);
      expect(authorRow!.instanceCount).toBe(2);

      const expectedBookBytes = books.reduce(
        (sum, b) => sum + estimateObjectBytes(b),
        0
      );
      const expectedAuthorBytes = authors.reduce(
        (sum, a) => sum + estimateObjectBytes(a),
        0
      );
      expect(bookRow!.attributedBytes).toBe(expectedBookBytes);
      expect(authorRow!.attributedBytes).toBe(expectedAuthorBytes);
    });
  });

  describe("4.2 top-N ordering", () => {
    it("selectTopLargest returns at most N instances by descending bytes", () => {
      // Eleven Library-shaped instances with distinct sizes.
      const sized = Array.from({ length: 11 }, (_, i) => ({
        uuid: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
        parentUuid: entityBook.uuid,
        name: "B".repeat((i + 1) * 50),
      }));
      const present = libraryPresent({ books: sized });
      const instances = buildAttributedInstanceIndex(present);
      const top10 = selectTopLargest(instances, 10);

      expect(top10).toHaveLength(10);
      for (let i = 0; i < top10.length - 1; i++) {
        expect(top10[i].bytes).toBeGreaterThanOrEqual(top10[i + 1].bytes);
      }
      expect(top10[0].instanceId).toBe(sized[10].uuid);
      expect(top10.map((r) => r.instanceId)).not.toContain(sized[0].uuid);
    });
  });

  describe("4.3 loading zone ignored", () => {
    it("attributed index ignores loading zone", () => {
      const present = libraryPresent({
        books: [book1],
        loadingBooks: [book2, book3],
      });

      const instances = buildAttributedInstanceIndex(present);
      const byEntity = aggregateAttributedByEntity(instances);

      expect(instances).toHaveLength(1);
      expect(instances[0].instanceId).toBe(book1.uuid);
      expect(byEntity.find((r) => r.entityUuid === entityBook.uuid)?.instanceCount).toBe(1);

      // loading contents still contribute to present heap size, but not attribution.
      expect(estimateObjectBytes(present)).toBeGreaterThan(estimateObjectBytes(present.current));
    });
  });
});

/**
 * #227 Phase 1 — snapshotQueriesAsHistoricalQueryVersions.
 */
import { describe, expect, it } from "vitest";

import {
  QUERY_VERSION_ENTITY_UUID,
  snapshotQueriesAsHistoricalQueryVersions,
  type StoredQueryForFreeze,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

function makeQuery(uuid: string, name: string, extra?: Partial<StoredQueryForFreeze>): StoredQueryForFreeze {
  return {
    uuid,
    name,
    definition: {
      extractorTemplates: {
        items: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          parentUuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        },
      },
    },
    ...extra,
  };
}

describe("227 Phase 1 — snapshotQueriesAsHistoricalQueryVersions", () => {
  const deterministic = (() => {
    let counter = 0;
    return () => `qqqqqqqq-qqqq-4qqq-8qqq-${String(++counter).padStart(12, "0")}`;
  })();

  it("produces QueryVersion with new UUID ≠ live query uuid", () => {
    const query = makeQuery("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "BookCount");
    const [qv] = snapshotQueriesAsHistoricalQueryVersions([query], { newUuid: deterministic });
    expect(qv.uuid).not.toBe(query.uuid);
  });

  it("sets queryUuid to live Query.uuid", () => {
    const query = makeQuery("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Authors");
    const [qv] = snapshotQueriesAsHistoricalQueryVersions([query], { newUuid: deterministic });
    expect(qv.queryUuid).toBe(query.uuid);
  });

  it("sets parentUuid/parentName to historical QueryVersion entity", () => {
    const query = makeQuery("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "Publishers");
    const [qv] = snapshotQueriesAsHistoricalQueryVersions([query], { newUuid: deterministic });
    expect(qv.parentUuid).toBe(QUERY_VERSION_ENTITY_UUID);
    expect(qv.parentName).toBe("QueryVersion");
  });

  it("copies name and definition from live Query", () => {
    const query = makeQuery("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "LendingStats");
    const [qv] = snapshotQueriesAsHistoricalQueryVersions([query], { newUuid: deterministic });
    expect(qv.name).toBe("LendingStats");
    expect(qv.definition).toEqual(query.definition);
  });

  it("deep isolation: mutating source definition after snapshot does not affect copy", () => {
    const query = makeQuery("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "Mutable");
    const [qv] = snapshotQueriesAsHistoricalQueryVersions([query], { newUuid: deterministic });
    (query.definition as any).extractorTemplates.newKey = { x: 1 };
    expect((qv.definition as any).extractorTemplates.newKey).toBeUndefined();
  });

  it("empty query list produces empty result", () => {
    expect(snapshotQueriesAsHistoricalQueryVersions([])).toEqual([]);
  });

  it("throws on Query without definition", () => {
    const incomplete = {
      uuid: "11111111-1111-4111-8111-111111111111",
      name: "Incomplete",
    } as StoredQueryForFreeze;
    expect(() => snapshotQueriesAsHistoricalQueryVersions([incomplete])).toThrow(/definition/);
  });
});

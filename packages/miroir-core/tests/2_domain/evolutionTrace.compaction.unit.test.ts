import { describe, expect, it } from "vitest";

import type { ApplicationEvolutionTraceEvent } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { fetchEvolutionHistory } from "../../src/2_domain/evolutionTraceCompaction.js";

// ── Shared fixtures: 3 raw events on one trace root across 2 commits ─────────
const TRACE_ROOT_UUID = "11111111-1111-4111-8111-111111111111";
const EVENT_ENTITY_UUID = "f4c2b3a1-8d6e-4f9a-b2c1-3d4e5f6a7b8c";
const COMMIT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const COMMIT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const VERSION_A = "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa";
const VERSION_B = "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb";
const TARGET_ENTITY = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function rawEvent(
  overrides: Partial<ApplicationEvolutionTraceEvent> &
    Pick<ApplicationEvolutionTraceEvent, "uuid" | "sequenceNumber" | "operationType" | "timestamp">,
): ApplicationEvolutionTraceEvent {
  return {
    parentUuid: EVENT_ENTITY_UUID,
    traceRootUuid: TRACE_ROOT_UUID,
    applicationSection: "model",
    compactionLevel: "raw",
    targetEntityUuid: TARGET_ENTITY,
    ...overrides,
  };
}

/** 3 events / 2 commits: seq 1–2 in COMMIT_A, seq 3 in COMMIT_B. */
const storeEvents: ApplicationEvolutionTraceEvent[] = [
  rawEvent({
    uuid: "11111111-0001-4001-8001-111111111111",
    sequenceNumber: 1,
    operationType: "createEntity",
    timestamp: "2024-01-01T10:00:00.000Z",
    commitUuid: COMMIT_A,
    fromVersionUuid: VERSION_A,
    toVersionUuid: VERSION_B,
  }),
  rawEvent({
    uuid: "11111111-0002-4002-8002-111111111111",
    sequenceNumber: 2,
    operationType: "renameEntity",
    timestamp: "2024-01-01T10:01:00.000Z",
    commitUuid: COMMIT_A,
    fromVersionUuid: VERSION_A,
    toVersionUuid: VERSION_B,
  }),
  rawEvent({
    uuid: "11111111-0003-4003-8003-111111111111",
    sequenceNumber: 3,
    operationType: "dropEntity",
    timestamp: "2024-01-01T11:00:00.000Z",
    commitUuid: COMMIT_B,
    fromVersionUuid: VERSION_A,
    toVersionUuid: VERSION_B,
  }),
];

describe("fetchEvolutionHistory", () => {
  it('compactionLevel "raw" returns the individual events in ascending sequenceNumber order', () => {
    const result = fetchEvolutionHistory(storeEvents, { compactionLevel: "raw" });

    expect(result).toHaveLength(3);
    expect(result.map((item) => ("sequenceNumber" in item ? item.sequenceNumber : undefined))).toEqual([
      1, 2, 3,
    ]);
    for (const item of result) {
      expect(item).toMatchObject({
        sequenceNumber: expect.any(Number),
        timestamp: expect.any(String),
        operationType: expect.any(String),
      });
    }
  });

  it('compactionLevel "commit" returns one block per commit (3 events → 2 blocks)', () => {
    const result = fetchEvolutionHistory(storeEvents, { compactionLevel: "commit" });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ commitId: COMMIT_A, eventCount: 2 });
    expect(result[1]).toMatchObject({ commitId: COMMIT_B, eventCount: 1 });
  });

  it('compactionLevel "version" returns one summary block spanning fromVersion → toVersion', () => {
    const result = fetchEvolutionHistory(storeEvents, {
      compactionLevel: "version",
      fromVersion: VERSION_A,
      toVersion: VERSION_B,
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      fromVersion: VERSION_A,
      toVersion: VERSION_B,
      totalEvents: 3,
    });
  });
});

/**
 * #227 Phase 1 — snapshotRunnersAsHistoricalRunnerVersions.
 */
import { describe, expect, it } from "vitest";

import {
  RUNNER_VERSION_ENTITY_UUID,
  snapshotRunnersAsHistoricalRunnerVersions,
  type StoredRunnerForFreeze,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

function makeRunner(
  uuid: string,
  name: string,
  extra?: Partial<StoredRunnerForFreeze>,
): StoredRunnerForFreeze {
  return {
    uuid,
    name,
    application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
    defaultLabel: `${name} Label`,
    definition: {
      runnerType: "actionRunner",
      endpoint: "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
      action: name,
    },
    description: `${name} description`,
    ...extra,
  };
}

describe("227 Phase 1 — snapshotRunnersAsHistoricalRunnerVersions", () => {
  const deterministic = (() => {
    let counter = 0;
    return () => `rrrrrrrr-rrrr-4rrr-8rrr-${String(++counter).padStart(12, "0")}`;
  })();

  it("produces RunnerVersion with new UUID ≠ live runner uuid", () => {
    const runner = makeRunner("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "returnDocument");
    const [rv] = snapshotRunnersAsHistoricalRunnerVersions([runner], { newUuid: deterministic });
    expect(rv.uuid).not.toBe(runner.uuid);
  });

  it("sets runnerUuid to live Runner.uuid", () => {
    const runner = makeRunner("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "lendDocument");
    const [rv] = snapshotRunnersAsHistoricalRunnerVersions([runner], { newUuid: deterministic });
    expect(rv.runnerUuid).toBe(runner.uuid);
  });

  it("sets parentUuid/parentName to historical RunnerVersion entity", () => {
    const runner = makeRunner("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "returnDocument");
    const [rv] = snapshotRunnersAsHistoricalRunnerVersions([runner], { newUuid: deterministic });
    expect(rv.parentUuid).toBe(RUNNER_VERSION_ENTITY_UUID);
    expect(rv.parentName).toBe("RunnerVersion");
  });

  it("copies name, application, defaultLabel, description, definition", () => {
    const runner = makeRunner("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "returnDocument");
    const [rv] = snapshotRunnersAsHistoricalRunnerVersions([runner], { newUuid: deterministic });
    expect(rv.name).toBe("returnDocument");
    expect(rv.application).toBe(runner.application);
    expect(rv.defaultLabel).toBe("returnDocument Label");
    expect(rv.description).toBe("returnDocument description");
    expect(rv.definition).toEqual(runner.definition);
  });

  it("deep isolation: mutating source definition after snapshot does not affect copy", () => {
    const runner = makeRunner("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "Mutable");
    const [rv] = snapshotRunnersAsHistoricalRunnerVersions([runner], { newUuid: deterministic });
    (runner.definition as any).action = "mutated";
    expect((rv.definition as any).action).toBe("Mutable");
  });

  it("empty runner list produces empty result", () => {
    expect(snapshotRunnersAsHistoricalRunnerVersions([])).toEqual([]);
  });

  it("throws on Runner without definition", () => {
    const incomplete = {
      uuid: "11111111-1111-4111-8111-111111111111",
      name: "Incomplete",
      application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
      defaultLabel: "Incomplete",
    } as StoredRunnerForFreeze;
    expect(() => snapshotRunnersAsHistoricalRunnerVersions([incomplete])).toThrow(/definition/);
  });
});

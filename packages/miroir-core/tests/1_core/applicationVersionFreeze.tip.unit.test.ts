/**
 * #216 Phase 3 — resolvePreviousApplicationVersion + second-freeze previousVersion link.
 */
import { describe, expect, it } from "vitest";

import {
  buildFreezeApplicationVersionPlan,
  resolvePreviousApplicationVersion,
} from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type {
  ApplicationVersion,
  Entity,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";
const OTHER_BRANCH = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

function sequentialUuid(start = 0) {
  let n = start;
  return () => {
    n += 1;
    return `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
  };
}

function sav(
  uuid: string,
  name: string,
  opts?: { previousVersion?: string; branch?: string },
): ApplicationVersion {
  return {
    uuid,
    parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
    parentName: "ApplicationVersion",
    name,
    selfApplication: APP_UUID,
    branch: opts?.branch ?? BRANCH_UUID,
    ...(opts?.previousVersion !== undefined
      ? { previousVersion: opts.previousVersion }
      : {}),
  };
}

describe("216 Phase 3 — resolvePreviousApplicationVersion", () => {
  it("returns undefined when no SAVs for app+branch", () => {
    expect(
      resolvePreviousApplicationVersion([], {
        selfApplicationUuid: APP_UUID,
        branchUuid: BRANCH_UUID,
      }),
    ).toBeUndefined();
  });

  it("ignores placeholder Initial when not freeze-produced", () => {
    const initial = sav("11111111-1111-4111-8111-111111111111", "Initial");
    expect(
      resolvePreviousApplicationVersion([initial], {
        selfApplicationUuid: APP_UUID,
        branchUuid: BRANCH_UUID,
        freezeProducedVersionUuids: [],
      }),
    ).toBeUndefined();
  });

  it("returns the single freeze-produced SAV as tip", () => {
    const v1 = sav("22222222-2222-4222-8222-222222222222", "V1");
    const tip = resolvePreviousApplicationVersion([v1], {
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      freezeProducedVersionUuids: [v1.uuid],
    });
    expect(tip?.uuid).toBe(v1.uuid);
  });

  it("returns chain head B when A←B", () => {
    const a = sav("33333333-3333-4333-8333-333333333333", "V1");
    const b = sav("44444444-4444-4444-8444-444444444444", "V2", {
      previousVersion: a.uuid,
    });
    const tip = resolvePreviousApplicationVersion([a, b], {
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      freezeProducedVersionUuids: [a.uuid, b.uuid],
    });
    expect(tip?.uuid).toBe(b.uuid);
  });

  it("ignores SAVs on other branches", () => {
    const other = sav("55555555-5555-4555-8555-555555555555", "V1", {
      branch: OTHER_BRANCH,
    });
    expect(
      resolvePreviousApplicationVersion([other], {
        selfApplicationUuid: APP_UUID,
        branchUuid: BRANCH_UUID,
        freezeProducedVersionUuids: [other.uuid],
      }),
    ).toBeUndefined();
  });

  it("throws when multiple freeze-produced chain heads exist", () => {
    const a = sav("66666666-6666-4666-8666-666666666666", "V1a");
    const b = sav("77777777-7777-4777-8777-777777777777", "V1b");
    expect(() =>
      resolvePreviousApplicationVersion([a, b], {
        selfApplicationUuid: APP_UUID,
        branchUuid: BRANCH_UUID,
        freezeProducedVersionUuids: [a.uuid, b.uuid],
      }),
    ).toThrow(/multiple/i);
  });
});

describe("216 Phase 3 — second freeze links previousVersion", () => {
  it("auto-links previousVersion to tip of existing freeze-produced SAVs", () => {
    const entity = makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book");
    const first = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities: [entity],
      newUuid: sequentialUuid(0),
    });

    const second = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V2",
      entities: [entity],
      existingApplicationVersions: [first.selfApplicationVersion],
      freezeProducedVersionUuids: [first.selfApplicationVersion.uuid],
      newUuid: sequentialUuid(100),
    });

    expect(second.selfApplicationVersion.previousVersion).toBe(
      first.selfApplicationVersion.uuid,
    );
  });

  it("explicit previousVersionUuid wins over auto tip resolution", () => {
    const entity = makeEntity("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "Book");
    const first = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1",
      entities: [entity],
      newUuid: sequentialUuid(0),
    });
    const explicitPrev = "99999999-9999-4999-8999-999999999999";
    const second = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V2",
      entities: [entity],
      existingApplicationVersions: [first.selfApplicationVersion],
      freezeProducedVersionUuids: [first.selfApplicationVersion.uuid],
      previousVersionUuid: explicitPrev,
      newUuid: sequentialUuid(100),
    });
    expect(second.selfApplicationVersion.previousVersion).toBe(explicitPrev);
  });
});

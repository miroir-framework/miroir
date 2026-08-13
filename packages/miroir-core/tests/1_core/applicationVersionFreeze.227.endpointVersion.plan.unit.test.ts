/**
 * #227 Phase 2 — EndpointVersion in freeze plan.
 */
import { describe, expect, it } from "vitest";

import { buildFreezeApplicationVersionPlan } from "../../src/1_core/versioning/applicationVersionFreeze.js";
import type { Entity } from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

const APP_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH_UUID = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";

function makeEntity(uuid: string, name: string): Entity {
  return {
    uuid,
    name,
    parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
    parentName: "Entity",
    mlSchema: { type: "object", definition: { title: { type: "string" } } },
  };
}

function sequentialUuid() {
  let n = 0;
  return () => {
    n += 1;
    return `cccccccc-cccc-4ccc-8ccc-${String(n).padStart(12, "0")}`;
  };
}

describe("227 Phase 2 — EndpointVersion freeze plan", () => {
  it("assembles EndpointVersions + Cross rows alongside Entity freeze", () => {
    const endpoints = [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "Books",
        version: "1",
        application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        definition: { actions: [] },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "Lend",
        version: "1",
        application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
        definition: { actions: [{ actionType: "lend" }] },
        transactionalEndpoint: true,
      },
    ];
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-Endpoints",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      endpoints,
      newUuid: sequentialUuid(),
    });

    expect(plan.endpointVersions).toHaveLength(2);
    expect(plan.crossEndpointVersions).toHaveLength(2);
    const evUuids = new Set(plan.endpointVersions.map((ev) => ev.uuid));
    expect(evUuids.size).toBe(2);
    for (const cross of plan.crossEndpointVersions) {
      expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
      expect(evUuids.has(cross.endpointVersion)).toBe(true);
    }
  });

  it("omits EndpointVersion rows when endpoints is empty", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-NoEndpoints",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      endpoints: [],
      newUuid: sequentialUuid(),
    });
    expect(plan.endpointVersions).toEqual([]);
    expect(plan.crossEndpointVersions).toEqual([]);
  });
});

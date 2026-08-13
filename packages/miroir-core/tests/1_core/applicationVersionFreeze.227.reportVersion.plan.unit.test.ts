/**
 * #227 Phase 2 — ReportVersion in freeze plan.
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
    return `bbbbbbbb-bbbb-4bbb-8bbb-${String(n).padStart(12, "0")}`;
  };
}

describe("227 Phase 2 — ReportVersion freeze plan", () => {
  it("assembles ReportVersions + Cross rows alongside Entity freeze", () => {
    const reports = [
      {
        uuid: "11111111-1111-4111-8111-111111111111",
        name: "CountryList",
        defaultLabel: "Countries",
        definition: { reportParameters: {}, section: { type: "list", definition: [] } },
      },
      {
        uuid: "22222222-2222-4222-8222-222222222222",
        name: "BookList",
        defaultLabel: "Books",
        definition: { reportParameters: {}, section: { type: "list", definition: [] } },
      },
    ];
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-Reports",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      reports,
      newUuid: sequentialUuid(),
    });

    expect(plan.reportVersions).toHaveLength(2);
    expect(plan.crossReportVersions).toHaveLength(2);

    const rvUuids = new Set(plan.reportVersions.map((rv) => rv.uuid));
    expect(rvUuids.size).toBe(2);
    for (const rv of plan.reportVersions) {
      expect(rv.uuid).not.toBe(rv.reportUuid);
      expect(rv.parentName).toBe("ReportVersion");
    }
    for (const cross of plan.crossReportVersions) {
      expect(cross.applicationVersion).toBe(plan.selfApplicationVersion.uuid);
      expect(rvUuids.has(cross.reportVersion)).toBe(true);
      expect(cross.parentUuid).toBe("f2b3c4d5-e6f7-4890-a1b2-c3d4e5f6a7b8");
      expect(cross.parentName).toBe("ApplicationVersionCrossReportVersion");
    }
  });

  it("omits ReportVersion rows when reports is empty", () => {
    const plan = buildFreezeApplicationVersionPlan({
      selfApplicationUuid: APP_UUID,
      branchUuid: BRANCH_UUID,
      versionName: "V1-NoReports",
      entities: [makeEntity("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "Book")],
      reports: [],
      newUuid: sequentialUuid(),
    });
    expect(plan.reportVersions).toEqual([]);
    expect(plan.crossReportVersions).toEqual([]);
  });
});

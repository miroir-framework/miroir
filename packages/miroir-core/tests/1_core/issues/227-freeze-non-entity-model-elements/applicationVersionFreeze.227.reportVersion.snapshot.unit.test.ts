/**
 * #227 Phase 1 — snapshotReportsAsHistoricalReportVersions.
 */
import { describe, expect, it } from "vitest";

import {
  REPORT_VERSION_ENTITY_UUID,
  snapshotReportsAsHistoricalReportVersions,
  type StoredReportForFreeze,
} from "../../../../src/1_core/versioning/applicationVersionFreeze.js";

function makeReport(
  uuid: string,
  name: string,
  extra?: Partial<StoredReportForFreeze>,
): StoredReportForFreeze {
  return {
    uuid,
    name,
    defaultLabel: `${name} Label`,
    definition: {
      reportParameters: {},
      section: {
        type: "list",
        definition: [{ type: "objectListReportSection", definition: { label: "Items" } }],
      },
    },
    ...extra,
  };
}

describe("227 Phase 1 — snapshotReportsAsHistoricalReportVersions", () => {
  const deterministic = (() => {
    let counter = 0;
    return () => `rrrrrrrr-rrrr-4rrr-8rrr-${String(++counter).padStart(12, "0")}`;
  })();

  it("produces ReportVersion with new UUID ≠ live report uuid", () => {
    const report = makeReport("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "CountryList");
    const [rv] = snapshotReportsAsHistoricalReportVersions([report], { newUuid: deterministic });
    expect(rv.uuid).not.toBe(report.uuid);
  });

  it("sets reportUuid to live Report.uuid", () => {
    const report = makeReport("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "BookList");
    const [rv] = snapshotReportsAsHistoricalReportVersions([report], { newUuid: deterministic });
    expect(rv.reportUuid).toBe(report.uuid);
  });

  it("sets parentUuid/parentName to historical ReportVersion entity", () => {
    const report = makeReport("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "AuthorList");
    const [rv] = snapshotReportsAsHistoricalReportVersions([report], { newUuid: deterministic });
    expect(rv.parentUuid).toBe(REPORT_VERSION_ENTITY_UUID);
    expect(rv.parentName).toBe("ReportVersion");
  });

  it("copies name and definition from live Report", () => {
    const report = makeReport("dddddddd-dddd-4ddd-8ddd-dddddddddddd", "PublisherList");
    const [rv] = snapshotReportsAsHistoricalReportVersions([report], { newUuid: deterministic });
    expect(rv.name).toBe("PublisherList");
    expect(rv.definition).toEqual(report.definition);
    expect(rv.defaultLabel).toBe("PublisherList Label");
  });

  it("deep isolation: mutating source definition after snapshot does not affect copy", () => {
    const report = makeReport("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", "Mutable");
    const [rv] = snapshotReportsAsHistoricalReportVersions([report], { newUuid: deterministic });
    (report.definition as any).reportParameters.afterFreeze = true;
    expect((rv.definition as any).reportParameters.afterFreeze).toBeUndefined();
  });

  it("empty report list produces empty result", () => {
    expect(snapshotReportsAsHistoricalReportVersions([])).toEqual([]);
  });

  it("throws on Report without definition", () => {
    const incomplete = {
      uuid: "11111111-1111-4111-8111-111111111111",
      name: "Incomplete",
    } as StoredReportForFreeze;
    expect(() => snapshotReportsAsHistoricalReportVersions([incomplete])).toThrow(/definition/);
  });
});

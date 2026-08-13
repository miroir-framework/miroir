import { describe, expect, it } from "vitest";

import {
  createSegmentHeaderLookupFromLocalCacheSnapshot,
  isLocalCacheSegmentHeaderSufficient,
  isReportQueryLoadSegmentSufficient,
  reportQueryLoadTargetsFromResolvedReportQuery,
  resolveReportQueryLoadAttributes,
  resolveReportQueryLoadSegmentKind,
} from "../../src/1_core/localCache/reportQueryLoadSegment.js";
import { getReduxDeploymentsStateIndex } from "../../src/2_domain/ReduxDeploymentsState.js";
import type { ReportQueryLoadRequest } from "../../src/2_domain/ReportQueryLoadService.js";

const APP = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const DEPLOY = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const ENT = "62209e4a-e429-4d7d-9b28-dcc1da6b51a2";

function request(
  overrides: Partial<ReportQueryLoadRequest> = {}
): ReportQueryLoadRequest {
  return {
    application: APP,
    deploymentUuid: DEPLOY,
    reportUuid: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    applicationSection: "data",
    resolvedQuery: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: APP,
      extractors: {
        blobs: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          parentUuid: ENT,
        },
      },
    },
    queryParams: {},
    ...overrides,
  };
}

describe("reportQueryLoadSegment routing (3.1)", () => {
  it("resolveReportQueryLoadSegmentKind follows projection attributes", () => {
    expect(resolveReportQueryLoadSegmentKind(request())).toBe("full");
    expect(
      resolveReportQueryLoadSegmentKind(
        request({ projection: { attributes: ["name", "uuid"] } })
      )
    ).toBe("partial");
  });

  it("resolveReportQueryLoadAttributes canonicalizes", () => {
    expect(
      resolveReportQueryLoadAttributes(
        request({ projection: { attributes: ["b", "a", "b"] } })
      )
    ).toEqual(["a", "b"]);
  });

  it("derives attributes from extractorInstancesByEntity when projection omitted", () => {
    const derived = request({
      resolvedQuery: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: APP,
        extractors: {
          blobs: {
            extractorOrCombinerType: "extractorInstancesByEntity",
            parentUuid: ENT,
            attributes: ["name", "defaultLabel", "uuid"],
          },
        },
      },
    });
    expect(resolveReportQueryLoadAttributes(derived)).toEqual([
      "defaultLabel",
      "name",
      "uuid",
    ]);
    expect(resolveReportQueryLoadSegmentKind(derived)).toBe("partial");
  });

  it("explicit request.projection wins over extractor attributes", () => {
    expect(
      resolveReportQueryLoadAttributes(
        request({
          projection: { attributes: ["uuid"] },
          resolvedQuery: {
            queryType: "boxedQueryWithExtractorCombinerTransformer",
            application: APP,
            extractors: {
              blobs: {
                extractorOrCombinerType: "extractorInstancesByEntity",
                parentUuid: ENT,
                attributes: ["name", "uuid"],
              },
            },
          },
        })
      )
    ).toEqual(["uuid"]);
  });
});

describe("segment header sufficiency (3.3)", () => {
  it("full segment sufficient only when fresh", () => {
    expect(
      isLocalCacheSegmentHeaderSufficient(
        { kind: "full", freshness: "fresh" },
        "full"
      )
    ).toBe(true);
    expect(
      isLocalCacheSegmentHeaderSufficient(
        { kind: "full", freshness: "stale" },
        "full"
      )
    ).toBe(false);
    expect(isLocalCacheSegmentHeaderSufficient(undefined, "full")).toBe(false);
  });

  it("partial segment requires fresh + D5 projection equality", () => {
    const header = {
      kind: "partial" as const,
      freshness: "fresh" as const,
      projection: ["name", "uuid"],
    };
    expect(
      isLocalCacheSegmentHeaderSufficient(header, "partial", ["uuid", "name"])
    ).toBe(true);
    expect(
      isLocalCacheSegmentHeaderSufficient(header, "partial", ["name"])
    ).toBe(false);
    expect(
      isLocalCacheSegmentHeaderSufficient(
        { ...header, freshness: "stale" },
        "partial",
        ["name", "uuid"]
      )
    ).toBe(false);
  });
});

describe("isReportQueryLoadSegmentSufficient (3.3)", () => {
  it("true when all parents have matching fresh segments", () => {
    const snap = {
      current: {
        [getReduxDeploymentsStateIndex(DEPLOY, "data", ENT, "partial")]: {
          segment: {
            kind: "partial" as const,
            freshness: "fresh" as const,
            projection: ["name", "uuid"],
          },
        },
      },
    };
    expect(
      isReportQueryLoadSegmentSufficient(
        request({ projection: { attributes: ["uuid", "name"] } }),
        createSegmentHeaderLookupFromLocalCacheSnapshot(snap)
      )
    ).toBe(true);
  });

  it("false when partial projection mismatches", () => {
    const snap = {
      current: {
        [getReduxDeploymentsStateIndex(DEPLOY, "data", ENT, "partial")]: {
          segment: {
            kind: "partial" as const,
            freshness: "fresh" as const,
            projection: ["name"],
          },
        },
      },
    };
    expect(
      isReportQueryLoadSegmentSufficient(
        request({ projection: { attributes: ["name", "uuid"] } }),
        createSegmentHeaderLookupFromLocalCacheSnapshot(snap)
      )
    ).toBe(false);
  });

  it("false when segment is stale", () => {
    const snap = {
      current: {
        [getReduxDeploymentsStateIndex(DEPLOY, "data", ENT, "full")]: {
          segment: { kind: "full" as const, freshness: "stale" as const },
        },
      },
    };
    expect(
      isReportQueryLoadSegmentSufficient(
        request(),
        createSegmentHeaderLookupFromLocalCacheSnapshot(snap)
      )
    ).toBe(false);
  });

  it("collects combiner parentUuid targets for entity collections", () => {
    const crossTable = "8bec933d-6287-4de7-8a88-5c24216de9f4";
    const entityVersion = "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd";
    const sav = "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24";
    const instanceUuid = "695826c2-aefa-4f5f-a131-dee46fe21c13";
    const targets = reportQueryLoadTargetsFromResolvedReportQuery({
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: APP,
      extractors: {
        applicationVersion: {
          extractorOrCombinerType: "extractorByPrimaryKey",
          parentUuid: sav,
          instanceUuid,
        },
      },
      combiners: {
        crossEntityVersions: {
          extractorOrCombinerType: "combinerOneToMany",
          parentUuid: crossTable,
        },
        entityVersions: {
          extractorOrCombinerType: "combinerManyToMany",
          parentUuid: entityVersion,
        },
      },
    });
    expect(targets).toEqual(
      expect.arrayContaining([
        { parentUuid: sav, instanceUuid, extractorKey: "applicationVersion" },
        { parentUuid: crossTable },
        { parentUuid: entityVersion },
      ])
    );
    expect(targets).toHaveLength(3);
  });

  it("extractorByPrimaryKey requires the instance row in full segment", () => {
    const instanceUuid = "f7f2fe87-df2e-4467-9a6c-ed11f8b6c34c";
    const fullIndex = getReduxDeploymentsStateIndex(DEPLOY, "data", ENT, "full");
    const detailRequest = request({
      resolvedQuery: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: APP,
        extractors: {
          blob: {
            extractorOrCombinerType: "extractorByPrimaryKey",
            parentUuid: ENT,
            instanceUuid,
          },
        },
      },
    });
    expect(
      reportQueryLoadTargetsFromResolvedReportQuery(detailRequest.resolvedQuery)
    ).toEqual([{ parentUuid: ENT, instanceUuid, extractorKey: "blob" }]);

    const freshEmptyFull = {
      current: {
        [fullIndex]: {
          segment: { kind: "full" as const, freshness: "fresh" as const },
          entities: {},
        },
      },
    };
    expect(
      isReportQueryLoadSegmentSufficient(
        detailRequest,
        createSegmentHeaderLookupFromLocalCacheSnapshot(freshEmptyFull)
      )
    ).toBe(false);

    const freshWithInstance = {
      current: {
        [fullIndex]: {
          segment: { kind: "full" as const, freshness: "fresh" as const },
          entities: {
            [instanceUuid]: { uuid: instanceUuid, name: "MiroirLogo" },
          },
        },
      },
    };
    expect(
      isReportQueryLoadSegmentSufficient(
        detailRequest,
        createSegmentHeaderLookupFromLocalCacheSnapshot(freshWithInstance)
      )
    ).toBe(true);
  });
});

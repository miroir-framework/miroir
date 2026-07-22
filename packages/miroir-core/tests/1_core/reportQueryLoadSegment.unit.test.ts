import { describe, expect, it } from "vitest";

import {
  createSegmentHeaderLookupFromLocalCacheSnapshot,
  isLocalCacheSegmentHeaderSufficient,
  isReportQueryLoadSegmentSufficient,
  resolveReportQueryLoadAttributes,
  resolveReportQueryLoadSegmentKind,
} from "../../src/1_core/reportQueryLoadSegment.js";
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
});

import { describe, expect, it } from "vitest";

import {
  buildLocalCacheSegmentHeader,
  canonicalizeProjection,
  isPartialLocalCacheIndex,
  projectionsEqual,
  resolveCacheSegmentKind,
  resolveLoadCacheSegment,
  stripLocalCacheSegmentSuffix,
} from "../../src/1_core/localCacheSegment.js";
import {
  getLocalCacheIndexDeploymentSection,
  getLocalCacheIndexEntityUuid,
  getReduxDeploymentsStateIndex,
} from "../../src/2_domain/ReduxDeploymentsState.js";

const DEP = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const ENT = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";

describe("localCacheSegment helpers", () => {
  it("resolveCacheSegmentKind routes by attributes presence", () => {
    expect(resolveCacheSegmentKind({})).toBe("full");
    expect(resolveCacheSegmentKind({ attributes: [] })).toBe("full");
    expect(resolveCacheSegmentKind({ attributes: ["name"] })).toBe("partial");
  });

  it("canonicalizeProjection sorts uniquely for hit comparisons", () => {
    expect(canonicalizeProjection(["b", "a", "b"])).toEqual(["a", "b"]);
    expect(projectionsEqual(["b", "a"], ["a", "b"])).toBe(true);
    expect(projectionsEqual(["a"], ["a", "b"])).toBe(false);
  });

  it("buildLocalCacheSegmentHeader requires projection for partial", () => {
    expect(() => buildLocalCacheSegmentHeader("partial", "fresh")).toThrow();
    expect(
      buildLocalCacheSegmentHeader("partial", "fresh", ["name", "uuid"])
    ).toEqual({
      kind: "partial",
      freshness: "fresh",
      projection: ["name", "uuid"],
    });
    expect(buildLocalCacheSegmentHeader("full", "stale")).toEqual({
      kind: "full",
      freshness: "stale",
    });
  });

  it("resolveLoadCacheSegment prefers explicit cacheSegment then attributes", () => {
    expect(resolveLoadCacheSegment({})).toEqual({ kind: "full" });
    expect(resolveLoadCacheSegment({ attributes: ["b", "a"] })).toEqual({
      kind: "partial",
      projection: ["a", "b"],
    });
    expect(resolveLoadCacheSegment({ cacheSegment: "full", attributes: ["a"] })).toEqual({
      kind: "full",
    });
    expect(() =>
      resolveLoadCacheSegment({ cacheSegment: "partial" })
    ).toThrow();
  });
});

describe("getReduxDeploymentsStateIndex segment keys", () => {
  it("keeps full index backward-compatible (no suffix)", () => {
    const full = getReduxDeploymentsStateIndex(DEP, "data", ENT);
    expect(full).toBe(`${DEP}_data_${ENT}`);
    expect(isPartialLocalCacheIndex(full)).toBe(false);
  });

  it("appends __partial for the partial segment", () => {
    const partial = getReduxDeploymentsStateIndex(DEP, "data", ENT, "partial");
    expect(partial).toBe(`${DEP}_data_${ENT}__partial`);
    expect(isPartialLocalCacheIndex(partial)).toBe(true);
  });

  it("parsers strip __partial and still return entity / section", () => {
    const partial = getReduxDeploymentsStateIndex(DEP, "model", ENT, "partial");
    expect(getLocalCacheIndexEntityUuid(partial)).toBe(ENT);
    expect(getLocalCacheIndexDeploymentSection(partial)).toBe("model");
    expect(stripLocalCacheSegmentSuffix(partial)).toBe(
      getReduxDeploymentsStateIndex(DEP, "model", ENT, "full")
    );
  });
});

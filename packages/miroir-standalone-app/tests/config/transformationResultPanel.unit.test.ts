import { describe, expect, it } from "vitest";

import { hasDisplayableTransformationResult } from "../../src/miroir-fwk/4_view/components/TransformerEditor/TransformationResultPanel.js";

describe("hasDisplayableTransformationResult", () => {
  it("returns false for null and undefined", () => {
    expect(hasDisplayableTransformationResult(null)).toBe(false);
    expect(hasDisplayableTransformationResult(undefined)).toBe(false);
  });

  it("returns false for arrays whose items are all empty", () => {
    expect(hasDisplayableTransformationResult([])).toBe(false);
    expect(hasDisplayableTransformationResult([undefined, null])).toBe(false);
  });

  it("returns true when at least one array item is present", () => {
    expect(hasDisplayableTransformationResult([undefined, "value"])).toBe(true);
    expect(hasDisplayableTransformationResult([{ ok: true }])).toBe(true);
  });

  it("returns true for non-array values", () => {
    expect(hasDisplayableTransformationResult("hello")).toBe(true);
    expect(hasDisplayableTransformationResult({ queryFailure: "ReferenceNotFound" })).toBe(true);
  });
});

/**
 * External-extractor routing still recognizes the #272 pre-rename discriminators.
 */
import { describe, expect, it } from "vitest";

import { queryContainsExternalExtractor } from "../../src/1_core/queryContainsExternalExtractor.js";

describe("queryContainsExternalExtractor", () => {
  it("detects current extractorForExternalService names", () => {
    expect(
      queryContainsExternalExtractor({
        extractors: {
          playlist: { extractorOrCombinerType: "extractorForExternalService" },
        },
      }),
    ).toBe(true);
    expect(
      queryContainsExternalExtractor({
        extractorTemplates: {
          playlist: { extractorOrCombinerType: "extractorTemplateForExternalService" },
        },
      }),
    ).toBe(true);
  });

  it("still detects pre-rename extractorFromAction names", () => {
    expect(
      queryContainsExternalExtractor({
        extractors: {
          playlist: { extractorOrCombinerType: "extractorFromAction" },
        },
      }),
    ).toBe(true);
    expect(
      queryContainsExternalExtractor({
        extractorTemplates: {
          playlist: { extractorOrCombinerType: "extractorTemplateFromAction" },
        },
      }),
    ).toBe(true);
  });
});

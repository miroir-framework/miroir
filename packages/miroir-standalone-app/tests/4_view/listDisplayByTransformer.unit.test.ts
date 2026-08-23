import {
  defaultMiroirModelEnvironment,
  defaultTransformerInput,
  TransformerFailure,
  transformer_extended_apply_wrapper,
  type CoreTransformerForBuildPlusRuntime,
} from "miroir-core";
import { book1, book2 } from "miroir-test-app_deployment-library";
import { describe, expect, it } from "vitest";

import {
  applyTransformerToListRows,
  buildRowMapListTransformer,
  DEFAULT_ROW_IDENTITY_TRANSFORMER,
} from "../../src/miroir-fwk/4_view/components/Reports/listDisplayByTransformer.js";

const identityRowTransformer: CoreTransformerForBuildPlusRuntime = {
  interpolation: "runtime",
  transformerType: "getFromContext",
  referenceName: "row",
};

const mapListIdentityTransformer: CoreTransformerForBuildPlusRuntime = {
  interpolation: "runtime",
  transformerType: "mapList",
  referenceToOuterObject: "row",
  elementTransformer: identityRowTransformer,
};

describe("listDisplayByTransformer — mapList on uuid-indexed list input", () => {
  it("applies mapList with getFromContext row to a uuid-indexed book index (identity per row)", () => {
    const bookIndex = {
      [book1.uuid]: book1,
      [book2.uuid]: book2,
    };

    const result = transformer_extended_apply_wrapper(
      undefined,
      "runtime",
      ["rootTransformer"],
      "mapList-lock",
      mapListIdentityTransformer,
      "value",
      defaultMiroirModelEnvironment,
      {},
      { [defaultTransformerInput]: bookIndex },
    );

    expect(result).not.toBeInstanceOf(TransformerFailure);
    expect(Array.isArray(result)).toBe(true);

    const rows = result as typeof book1[];
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(expect.arrayContaining([book1, book2]));
  });
});

describe("listDisplayByTransformer — helper API", () => {
  it("buildRowMapListTransformer wraps the element transformer in mapList", () => {
    expect(buildRowMapListTransformer(identityRowTransformer)).toEqual({
      interpolation: "runtime",
      transformerType: "mapList",
      referenceToOuterObject: "row",
      elementTransformer: identityRowTransformer,
    });
  });

  it("applyTransformerToListRows returns identity-projected books from a uuid index", () => {
    const bookIndex = {
      [book1.uuid]: book1,
      [book2.uuid]: book2,
    };

    const result = applyTransformerToListRows(bookIndex, DEFAULT_ROW_IDENTITY_TRANSFORMER);

    expect(result).not.toBeInstanceOf(TransformerFailure);
    expect(result).toEqual(expect.arrayContaining([book1, book2]));
  });

  it("applyTransformerToListRows maps every row through returnValue", () => {
    const bookIndex = {
      [book1.uuid]: book1,
      [book2.uuid]: book2,
    };

    const result = applyTransformerToListRows(bookIndex, {
      interpolation: "runtime",
      transformerType: "returnValue",
      value: 42,
    });

    expect(result).not.toBeInstanceOf(TransformerFailure);
    expect(result).toEqual([42, 42]);
  });

  it("applyTransformerToListRows returns per-row TransformerFailure without throwing", () => {
    const bookIndex = {
      [book1.uuid]: book1,
      [book2.uuid]: book2,
    };

    const result = applyTransformerToListRows(bookIndex, {
      interpolation: "runtime",
      transformerType: "getFromContext",
      referenceName: "missingRef",
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result.every((item) => item instanceof TransformerFailure)).toBe(true);
  });
});

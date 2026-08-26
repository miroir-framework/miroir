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
  LIST_TRANSFORMER_PAGE_SIZE,
  resolveListTransformationResultDisplaySchema,
  sliceInstancesToPage,
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

const sampleRowMlSchema = {
  type: "object",
  definition: {
    uuid: { type: "string" },
    name: { type: "string" },
  },
} as const;

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

  it("sliceInstancesToPage returns only the requested page", () => {
    const books = Object.fromEntries(
      Array.from({ length: 25 }, (_, index) => {
        const number = index + 1;
        const book = {
          ...book1,
          uuid: `00000000-0000-4000-8000-${String(number).padStart(12, "0")}`,
          name: `Book ${number}`,
        };
        return [book.uuid, book];
      }),
    );

    const firstPage = sliceInstancesToPage(books, 0, LIST_TRANSFORMER_PAGE_SIZE);
    const secondPage = sliceInstancesToPage(books, 1, LIST_TRANSFORMER_PAGE_SIZE);

    expect(Object.keys(firstPage)).toHaveLength(LIST_TRANSFORMER_PAGE_SIZE);
    expect(Object.keys(secondPage)).toHaveLength(LIST_TRANSFORMER_PAGE_SIZE);
    expect(Object.keys(firstPage)).not.toEqual(Object.keys(secondPage));
  });
});

describe("resolveListTransformationResultDisplaySchema", () => {
  it("returns array of rowMlSchema for the default identity transformer", () => {
    const result = applyTransformerToListRows(
      { [book1.uuid]: book1 },
      DEFAULT_ROW_IDENTITY_TRANSFORMER,
    );

    expect(
      resolveListTransformationResultDisplaySchema(
        DEFAULT_ROW_IDENTITY_TRANSFORMER,
        result,
        sampleRowMlSchema as any,
      ),
    ).toEqual({
      type: "array",
      definition: sampleRowMlSchema,
    });
  });

  it("falls back to valueToJzod arrayAsArray when rowMlSchema is omitted", () => {
    const result = applyTransformerToListRows(
      { [book1.uuid]: book1, [book2.uuid]: book2 },
      {
        interpolation: "runtime",
        transformerType: "returnValue",
        value: 42,
      },
    );

    const schema = resolveListTransformationResultDisplaySchema(
      {
        interpolation: "runtime",
        transformerType: "returnValue",
        value: 42,
      },
      result,
    );

    expect(schema).toEqual({ type: "array", definition: { type: "number" } });
    expect(schema.type).not.toBe("any");
  });

  it("falls back to valueToJzod when typed resolution fails (missing context ref)", () => {
    const failingTransformer: CoreTransformerForBuildPlusRuntime = {
      interpolation: "runtime",
      transformerType: "getFromContext",
      referenceName: "missingRef",
    };
    const result = applyTransformerToListRows(
      { [book1.uuid]: book1 },
      failingTransformer,
    );

    const schema = resolveListTransformationResultDisplaySchema(
      failingTransformer,
      result,
      sampleRowMlSchema as any,
    );

    expect(schema.type).not.toBe("any");
    expect(schema.type).toBe("array");
  });
});

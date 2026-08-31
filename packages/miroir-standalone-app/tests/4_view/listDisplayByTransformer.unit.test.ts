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
  buildRowAttributeOverrideTransformer,
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

  it("default row transformer is mergeIntoObject over row with an empty createObject overlay", () => {
    expect(DEFAULT_ROW_IDENTITY_TRANSFORMER).toEqual({
      interpolation: "runtime",
      transformerType: "mergeIntoObject",
      applyTo: {
        interpolation: "runtime",
        transformerType: "getFromContext",
        referenceName: "row",
      },
      definition: {
        interpolation: "runtime",
        transformerType: "createObject",
        definition: {},
      },
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

  it("applyTransformerToListRows overlays one calculated attribute on every row", () => {
    const bookIndex = {
      [book1.uuid]: book1,
      [book2.uuid]: book2,
    };

    const result = applyTransformerToListRows(
      bookIndex,
      buildRowAttributeOverrideTransformer({
        name: {
          interpolation: "runtime",
          transformerType: "returnValue",
          value: "Overridden Title",
        },
      }),
    );

    expect(result).not.toBeInstanceOf(TransformerFailure);
    expect(result).toEqual(
      expect.arrayContaining([
        { ...book1, name: "Overridden Title" },
        { ...book2, name: "Overridden Title" },
      ]),
    );
  });

  it("applyTransformerToListRows overlays several calculated attributes, each with its own transformer", () => {
    const bookIndex = {
      [book1.uuid]: book1,
      [book2.uuid]: book2,
    };

    const result = applyTransformerToListRows(
      bookIndex,
      buildRowAttributeOverrideTransformer({
        name: {
          interpolation: "runtime",
          transformerType: "returnValue",
          value: "Shared Title",
        },
        year: {
          interpolation: "runtime",
          transformerType: "returnValue",
          value: 2099,
        },
      }),
    );

    expect(result).not.toBeInstanceOf(TransformerFailure);
    expect(result).toEqual(
      expect.arrayContaining([
        { ...book1, name: "Shared Title", year: 2099 },
        { ...book2, name: "Shared Title", year: 2099 },
      ]),
    );
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

  it("empty getFromContext referencePath does not dump the list context into the overlay", () => {
    const bookIndex = {
      [book1.uuid]: book1,
      [book2.uuid]: book2,
    };

    const result = applyTransformerToListRows(
      bookIndex,
      buildRowAttributeOverrideTransformer({
        newRecordEntry: {
          interpolation: "runtime",
          transformerType: "getFromContext",
          referencePath: [],
        },
      }),
    );

    expect(Array.isArray(result)).toBe(true);
    for (const row of result as any[]) {
      if (row instanceof TransformerFailure) {
        continue;
      }
      expect(row).not.toHaveProperty("defaultInput");
      const overlay = row?.newRecordEntry;
      if (overlay instanceof TransformerFailure) {
        continue;
      }
      if (overlay && typeof overlay === "object") {
        expect(overlay).not.toHaveProperty("defaultInput");
        expect(overlay).not.toHaveProperty("row");
      }
    }
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

  it("sliceInstancesToPage keys rows by composite idAttribute, not uuid", () => {
    const compositePkEntity = { idAttribute: ["catalog_name", "schema_name"] as const };
    const schemata = {
      "postgres|ParisModel": {
        catalog_name: "postgres",
        schema_name: "ParisModel",
        schema_owner: "postgres",
      },
      "postgres|public": {
        catalog_name: "postgres",
        schema_name: "public",
        schema_owner: "pg_database_owner",
      },
      "postgres|library": {
        catalog_name: "postgres",
        schema_name: "library",
        schema_owner: "postgres",
      },
    };

    const page = sliceInstancesToPage(schemata, 0, 10, undefined, compositePkEntity);

    expect(Object.keys(page)).toHaveLength(3);
    expect(applyTransformerToListRows(page, DEFAULT_ROW_IDENTITY_TRANSFORMER)).toEqual(
      expect.arrayContaining([
        schemata["postgres|ParisModel"],
        schemata["postgres|public"],
        schemata["postgres|library"],
      ]),
    );
  });

  it("sliceInstancesToPage keys rows by non-uuid idAttribute", () => {
    const codePkEntity = { idAttribute: "code" as const };
    const rowsByCode = {
      alpha: { code: "alpha", label: "Alpha" },
      beta: { code: "beta", label: "Beta" },
    };

    const page = sliceInstancesToPage(rowsByCode, 0, 10, undefined, codePkEntity);

    expect(Object.keys(page)).toEqual(["alpha", "beta"]);
    expect(applyTransformerToListRows(page, DEFAULT_ROW_IDENTITY_TRANSFORMER)).toEqual(
      expect.arrayContaining([rowsByCode.alpha, rowsByCode.beta]),
    );
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

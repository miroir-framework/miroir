import { describe, expect, it } from "vitest";

import type { EndpointDefinition } from "@miroir-framework/core";
import { queryEndpointVersionV1 } from "@miroir-framework/core/meta-model";
import { entityBook, selfApplicationLibrary } from "miroir-example-library";

import { mcpToolEntry } from "../../src/tools/mcpHandlersForEndpoint.js";

// The payload of the query tools extends `shippingBox` (application, pageParams, queryParams, contextResults) through
// `object.extend`: the Zod conversion failed with "could not find eager reference shippingBox" on every call (#550).

const queryEndpoint = queryEndpointVersionV1 as unknown as EndpointDefinition;

const booksExtractor = {
  extractorOrCombinerType: "extractorInstancesByEntity",
  applicationSection: "data",
  parentName: "Book",
  parentUuid: entityBook.uuid,
};

describe("query tool payloads", () => {
  it("runBoxedQueryAction accepts a query with its shippingBox attributes", () => {
    const schema = mcpToolEntry(queryEndpoint, "runBoxedQueryAction", "Miroir_runBoxedQueryAction").payloadZodSchema;

    const parsed = schema.safeParse({
      application: selfApplicationLibrary.uuid,
      applicationSection: "data",
      query: {
        application: selfApplicationLibrary.uuid,
        pageParams: {},
        queryParams: {},
        contextResults: {},
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        extractors: { books: booksExtractor },
      },
    });

    expect(parsed.error?.issues).toBeUndefined();
  });

  it("runBoxedQueryTemplateAction accepts query parameters", () => {
    const schema = mcpToolEntry(
      queryEndpoint,
      "runBoxedQueryTemplateAction",
      "Miroir_runBoxedQueryTemplateAction",
    ).payloadZodSchema;

    const parsed = schema.safeParse({
      application: selfApplicationLibrary.uuid,
      applicationSection: "data",
      query: {
        application: selfApplicationLibrary.uuid,
        pageParams: {},
        queryParams: { startedBefore: "2026-07-02" },
        contextResults: {},
        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        extractorTemplates: { books: booksExtractor },
      },
    });

    expect(parsed.error?.issues).toBeUndefined();
  });

  it("runBoxedQueryTemplateAction accepts nested runtime transformers", () => {
    // transformers sit below the depth limit of the resolution: their optional attributes (e.g. `label`) must stay optional
    const schema = mcpToolEntry(
      queryEndpoint,
      "runBoxedQueryTemplateAction",
      "Miroir_runBoxedQueryTemplateAction",
    ).payloadZodSchema;
    const fromLoan = (attribute: string) => ({
      transformerType: "getFromContext",
      interpolation: "runtime",
      referencePath: ["loan", attribute],
    });

    const parsed = schema.safeParse({
      application: selfApplicationLibrary.uuid,
      applicationSection: "data",
      query: {
        application: selfApplicationLibrary.uuid,
        pageParams: {},
        queryParams: { startedBefore: "2026-07-02" },
        contextResults: {},
        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
        extractorTemplates: { books: booksExtractor },
        runtimeTransformers: {
          openBooks: {
            transformerType: "filterList",
            interpolation: "runtime",
            referenceToOuterObject: "loan",
            applyTo: {
              transformerType: "getObjectValues",
              interpolation: "runtime",
              applyTo: { transformerType: "getFromContext", interpolation: "runtime", referenceName: "books" },
            },
            predicate: {
              transformerType: "boolExpr",
              interpolation: "runtime",
              operator: "&&",
              left: { transformerType: "boolExpr", interpolation: "runtime", operator: "isNull", left: fromLoan("endDate") },
              right: {
                transformerType: "boolExpr",
                interpolation: "runtime",
                operator: "<",
                left: fromLoan("startDate"),
                right: { transformerType: "getFromParameters", interpolation: "runtime", referenceName: "startedBefore" },
              },
            },
          },
        },
      },
    });

    expect(parsed.error?.issues).toBeUndefined();
  });

  it("runBoxedQueryAction still requires the query's application", () => {
    const schema = mcpToolEntry(queryEndpoint, "runBoxedQueryAction", "Miroir_runBoxedQueryAction").payloadZodSchema;

    const parsed = schema.safeParse({
      application: selfApplicationLibrary.uuid,
      query: { queryType: "boxedQueryWithExtractorCombinerTransformer", extractors: { books: booksExtractor } },
    });

    expect(parsed.success).toBe(false);
  });
});

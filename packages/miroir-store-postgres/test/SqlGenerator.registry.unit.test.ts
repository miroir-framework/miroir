import { describe, expect, it } from "vitest";
import {
  Domain2ElementFailed,
  type AsyncQueryRunnerParams,
  type MiroirModelEnvironment,
  type TransformerDefinition,
} from "@miroir-framework/core";
import { sqlStringForQuery } from "../src/1_core/SqlGenerator";

// ################################################################################################
// #519: the SQL translation reads the TransformerDefinition registry of its model environment, so
// an application composite translates like a stock one; without it, the query is refused.
// ################################################################################################
const countBooksBody = {
  transformerType: "aggregate",
  interpolation: "runtime",
  applyTo: {
    transformerType: "getFromContext",
    interpolation: "runtime",
    referenceName: "books",
  },
};

const countBooks: TransformerDefinition = {
  uuid: "5f19c2a4-8d3e-4b7a-9c61-2e4d5b6a7c80",
  parentName: "TransformerDefinition",
  parentUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8",
  name: "countBooks",
  defaultLabel: "countBooks",
  transformerInterface: {
    transformerParameterSchema: {
      transformerType: { type: "literal", definition: "countBooks" },
      transformerDefinition: { type: "object", definition: {} },
    },
    transformerResultSchema: { returns: "mlSchema", definition: { type: "any" } },
  },
  transformerImplementation: {
    transformerImplementationType: "transformer",
    definition: countBooksBody,
  },
} as any;

function modelEnvironment(transformerDefinitions: TransformerDefinition[]): MiroirModelEnvironment {
  return {
    currentModel: { entities: [], entityVersions: [], transformerDefinitions } as any,
    endpointsByUuid: {},
    miroirFundamentalMlSchema: {} as any,
  };
}

function queryWith(runtimeTransformer: any): AsyncQueryRunnerParams {
  return {
    extractorRunnerMap: {} as any,
    extractor: {
      queryType: "boxedQueryWithExtractorCombinerTransformer",
      application: "5af03c98-fe5e-490b-b08f-e1230971c57f",
      extractors: {
        books: {
          extractorOrCombinerType: "extractorInstancesByEntity",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
        },
      },
      runtimeTransformers: { bookCount: runtimeTransformer },
    } as any,
  };
}

describe("sqlStringForQuery with an application composite TransformerDefinition", () => {
  it("translates the composite like its body, with the registry of the model environment", () => {
    const withComposite = sqlStringForQuery(
      queryWith({ transformerType: "countBooks", interpolation: "runtime" }),
      "library",
      [],
      modelEnvironment([countBooks]),
    );
    const inlined = sqlStringForQuery(queryWith(countBooksBody), "library", [], modelEnvironment([]));

    expect(withComposite instanceof Domain2ElementFailed, JSON.stringify(withComposite)).toBe(false);
    expect((withComposite as any).query).toEqual((inlined as any).query);
  });

  it("refuses the composite with QueryNotExecutable when the environment does not hold it", () => {
    const result = sqlStringForQuery(
      queryWith({ transformerType: "countBooks", interpolation: "runtime" }),
      "library",
      [],
      modelEnvironment([]),
    );

    expect(result instanceof Domain2ElementFailed).toBe(true);
    expect((result as Domain2ElementFailed).queryFailure).toBe("QueryNotExecutable");
  });
});

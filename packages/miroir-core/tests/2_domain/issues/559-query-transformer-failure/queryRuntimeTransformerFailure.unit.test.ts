import { describe, expect, it } from "vitest";

import { Domain2ElementFailed } from "../../../../src/0_interfaces/2_domain/DomainElement";
import {
  asyncApplyExtractorTransformerInMemory,
  asyncRunQuery,
  innermostFailureMessage,
} from "../../../../src/2_domain/AsyncQuerySelectors";

// #559: a Query whose runtime transformer fails answers an error naming the innermost failure.
const loans = [
  { uuid: "loan-1", endDate: null, startDate: "2026-01-01" },
  { uuid: "loan-2", endDate: "2026-02-01", startDate: "2026-01-01" },
];

function openLoans(applyTo: any) {
  return {
    transformerType: "filterList",
    interpolation: "runtime",
    referenceToOuterObject: "loan",
    applyTo,
    predicate: {
      transformerType: "boolExpr",
      interpolation: "runtime",
      operator: "isNull",
      left: { transformerType: "getFromContext", interpolation: "runtime", safe: true, referencePath: ["loan", "endDate"] },
    },
  };
}

function runQuery(runtimeTransformers: Record<string, any>) {
  return asyncRunQuery(
    {
      extractorRunnerMap: { applyExtractorTransformer: asyncApplyExtractorTransformerInMemory } as any,
      extractor: {
        queryType: "boxedQueryWithExtractorCombinerTransformer",
        application: "app",
        pageParams: {},
        queryParams: {},
        contextResults: { loans },
        extractors: {},
        runtimeTransformers,
      } as any,
    },
    { app: "deployment" } as any,
    {} as any,
  );
}

const loansFromContext = { transformerType: "getFromContext", interpolation: "runtime", referenceName: "loans" };

describe("#559 query runtime transformer failures", () => {
  it("returns the entry when its transformer succeeds", async () => {
    const result = await runQuery({ openLoans: openLoans(loansFromContext) });
    expect(result).not.toBeInstanceOf(Domain2ElementFailed);
    expect((result as any).openLoans.map((loan: any) => loan.uuid)).toEqual(["loan-1"]);
  });

  it("fails the query, naming the entry and the innermost failure", async () => {
    const result = await runQuery({
      openLoans: openLoans({ transformerType: "getObjectValues", interpolation: "runtime", applyTo: loansFromContext }),
    });
    expect(result).toBeInstanceOf(Domain2ElementFailed);
    const failure = result as Domain2ElementFailed;
    expect(failure.queryContext).toBe("openLoans");
    expect(failure.failureMessage).toBe(
      "runtime transformer openLoans failed: getObjectValues: applyTo is a list, expected an object",
    );
  });

  it("fails the query when a mapped element's transformer fails", async () => {
    const result = await runQuery({
      loanBooks: {
        transformerType: "mapList",
        interpolation: "runtime",
        referenceToOuterObject: "loan",
        applyTo: loansFromContext,
        elementTransformer: { transformerType: "getFromContext", interpolation: "runtime", referenceName: "noSuchName" },
      },
    });
    expect(result).toBeInstanceOf(Domain2ElementFailed);
    const failure = result as Domain2ElementFailed;
    expect(failure.queryContext).toBe("loanBooks");
    expect(failure.failureMessage).toMatch(/^runtime transformer loanBooks failed at 0: /);
  });

  it("innermostFailureMessage follows innerError to its end", () => {
    expect(
      innermostFailureMessage({ failureMessage: "outer", innerError: { queryContext: "middle", innerError: { failureMessage: "inner" } } }),
    ).toBe("inner");
  });
});

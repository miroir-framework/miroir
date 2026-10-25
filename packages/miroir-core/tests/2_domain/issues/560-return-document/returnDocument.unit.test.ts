import { describe, expect, it } from "vitest";

import { defaultLibraryAppModel } from "miroir-example-library";

import { buildPlusRuntimeDomainAction } from "../../../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { compositeFailError } from "../../../../src/2_domain/CompositeActionStep";
import { transformer_extended_apply } from "../../../../src/2_domain/TransformersForRuntime";
import { defaultMiroirModelEnvironment } from "../../../../src/index.js";

// #560: the Library's returnDocument closes the User's open loan of the Book, and refuses when there is none.
const lendingEndpoint: any = defaultLibraryAppModel.endpoints.find((endpoint) => endpoint.uuid == "212f2784-5b68-43b2-8ee0-89b1c6fdd0de");
const returnDocument = lendingEndpoint.definition.actions.find(
  (action: any) => action.actionParameters.actionType.definition == "returnDocument",
);
const steps: any[] = returnDocument.actionImplementation.definition.payload.actionSequence;
const noOpenLoanStep = steps.find((step) => step.actionLabel == "returnDocument_noOpenLoan");
const closeOpenLoanStep = steps.find((step) => step.actionLabel == "returnDocument_closeOpenLoan");

const params = { payload: { user: "user-1", book: "book-1", endDate: "2026-10-24" } };

function resolve(step: any, loans: any[]) {
  return transformer_extended_apply("runtime", [], step.actionLabel, step, "value", defaultMiroirModelEnvironment, params, {
    userLoans: { loans },
  });
}

describe("#560 returnDocument", () => {
  it("refuses before the update when the User has no open loan of the Book", () => {
    expect(steps.indexOf(noOpenLoanStep)).toBeLessThan(steps.indexOf(closeOpenLoanStep));
    for (const loans of [[], [{ uuid: "loan-1", user: "user-1", book: "book-1", endDate: "2026-10-01" }]]) {
      const error = compositeFailError(resolve(noOpenLoanStep, loans));
      expect(error?.errorType).toBe("FailedToReturnDocument");
      expect(error?.errorMessage).toBe("the User holds no open loan of this Book");
    }
  });

  it("closes the open loan of the Book", () => {
    const loans = [
      { uuid: "loan-1", user: "user-1", book: "book-1", endDate: "2026-10-01" },
      { uuid: "loan-2", user: "user-1", book: "book-2", endDate: null },
      { uuid: "loan-3", user: "user-1", book: "book-1", endDate: null },
    ];
    expect(compositeFailError(resolve(noOpenLoanStep, loans))).toBeUndefined();
    expect(resolve(closeOpenLoanStep, loans).payload.objects).toEqual([
      { uuid: "loan-3", user: "user-1", book: "book-1", endDate: "2026-10-24" },
    ]);
  });

  it("is a valid compositeFail template, its condition a transformer", () => {
    expect(buildPlusRuntimeDomainAction.safeParse(noOpenLoanStep).success).toBe(true);
  });
});

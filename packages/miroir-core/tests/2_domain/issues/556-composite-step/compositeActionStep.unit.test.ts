import { describe, expect, it } from "vitest";

import { TransformerFailure } from "../../../../src/0_interfaces/2_domain/DomainElement";
import {
  attachQueryRuntimeTransformers,
  detachQueryRuntimeTransformers,
  findTransformerFailure,
} from "../../../../src/2_domain/CompositeActionStep";

// #556: how one step of a composite action template is resolved.
const openLoanCount = { transformerType: "listLength", interpolation: "runtime", applyTo: { transformerType: "getFromContext", referenceName: "loans" } };

const queryStep = {
  actionType: "compositeRunBoxedQueryAction",
  actionLabel: "countOpenLoans",
  nameGivenToResult: "userLoans",
  payload: {
    actionType: "runBoxedQueryAction",
    payload: {
      application: "app",
      query: { queryType: "boxedQueryWithExtractorCombinerTransformer", extractors: { loans: {} }, runtimeTransformers: { openLoanCount } },
    },
  },
};

describe("#556 composite action steps", () => {
  it("detaches a query step's runtimeTransformers and puts them back with the action's parameters", () => {
    const { step, runtimeTransformers } = detachQueryRuntimeTransformers(queryStep);
    expect((step as any).payload.payload.query.runtimeTransformers).toBeUndefined();
    expect(runtimeTransformers).toEqual({ openLoanCount });
    expect(queryStep.payload.payload.query.runtimeTransformers).toEqual({ openLoanCount }); // unchanged

    const attached = attachQueryRuntimeTransformers(step, runtimeTransformers, { payload: { user: "u1" } });
    expect((attached as any).payload.payload.query.runtimeTransformers).toEqual({ openLoanCount });
    expect((attached as any).payload.payload.query.queryParams).toEqual({ payload: { user: "u1" } });
  });

  it("leaves other steps as they are", () => {
    const createStep = { actionType: "createInstance", payload: { objects: [] } };
    expect(detachQueryRuntimeTransformers(createStep)).toEqual({ step: createStep, runtimeTransformers: undefined });
    expect(attachQueryRuntimeTransformers(createStep, undefined, {})).toBe(createStep);
  });

  it("finds a failed transformer anywhere in a resolved step, with its path", () => {
    const failure = new TransformerFailure({ queryFailure: "ReferenceNotFound", failureMessage: "no referenceName missing in context" });
    expect(findTransformerFailure({ payload: { objects: [{ uuid: "a" }, failure] } })).toEqual({
      failure,
      path: ["payload", "objects", 1],
    });
    expect(findTransformerFailure({ payload: { objects: [{ uuid: "a" }] } })).toBeUndefined();
  });
});

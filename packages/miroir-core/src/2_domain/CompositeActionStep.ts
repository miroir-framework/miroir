// #556: how DomainController.handleCompositeActionTemplate resolves one step of a sequence.

import { Action2Error, TransformerFailure } from "../0_interfaces/2_domain/DomainElement";

const QUERY_STEP_TYPES = new Set(["compositeRunBoxedQueryAction", "compositeRunBoxedQueryTemplateAction"]);

/**
 * A query step without its query's runtimeTransformers, and those transformers: they belong to the query runner,
 * which evaluates them against the query's own extractors, not to the resolution of the step.
 */
export function detachQueryRuntimeTransformers<T>(step: T): {
  step: T;
  runtimeTransformers: Record<string, unknown> | undefined;
} {
  const query = (step as any)?.payload?.payload?.query;
  if (!QUERY_STEP_TYPES.has((step as any)?.actionType) || !query?.runtimeTransformers) {
    return { step, runtimeTransformers: undefined };
  }
  const { runtimeTransformers, ...queryWithoutTransformers } = query;
  return {
    step: {
      ...(step as any),
      payload: { ...(step as any).payload, payload: { ...(step as any).payload.payload, query: queryWithoutTransformers } },
    },
    runtimeTransformers,
  };
}

/**
 * Puts the runtimeTransformers back on a resolved query step. The action's parameters go in the query's
 * queryParams, so a `getFromParameters` of a runtime transformer reads them as it did when the step resolved it.
 */
export function attachQueryRuntimeTransformers<T>(
  resolvedStep: T,
  runtimeTransformers: Record<string, unknown> | undefined,
  actionParams: Record<string, any>,
): T {
  if (!runtimeTransformers) {
    return resolvedStep;
  }
  const query = (resolvedStep as any).payload.payload.query;
  return {
    ...(resolvedStep as any),
    payload: {
      ...(resolvedStep as any).payload,
      payload: {
        ...(resolvedStep as any).payload.payload,
        query: { ...query, queryParams: { ...actionParams, ...(query.queryParams ?? {}) }, runtimeTransformers },
      },
    },
  };
}

/** The first TransformerFailure inside a resolved value, with its path; a failed transformer anywhere fails the step. */
export function findTransformerFailure(
  value: unknown,
  path: (string | number)[] = [],
): { failure: TransformerFailure; path: (string | number)[] } | undefined {
  if (value instanceof TransformerFailure) {
    return { failure: value, path };
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findTransformerFailure(item, [...path, index]);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
  if (value && typeof value == "object" && Object.getPrototypeOf(value) === Object.prototype) {
    for (const [key, item] of Object.entries(value)) {
      const found = findTransformerFailure(item, [...path, key]);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * #557: the error a resolved `compositeFail` step stops its sequence with, when its condition is true. The
 * condition must resolve to a boolean: anything else is an error too, since a refusal rule that does not evaluate
 * must not let the action through.
 */
export function compositeFailError(step: {
  actionLabel?: string;
  payload: { condition: unknown; errorType: string; message: string };
}): Action2Error | undefined {
  const { condition, errorType, message } = step.payload;
  if (condition === false) {
    return undefined;
  }
  if (condition === true) {
    return new Action2Error(errorType as any, message, [step.actionLabel ?? "compositeFail"]);
  }
  return new Action2Error(
    "FailedToHandleAction",
    `compositeFail ${step.actionLabel ?? ""}: condition is not a boolean: ${JSON.stringify(condition)}`.replace("  ", " "),
    [step.actionLabel ?? "compositeFail"],
  );
}

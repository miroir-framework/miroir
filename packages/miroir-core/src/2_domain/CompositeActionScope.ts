import { transformerEnvironmentAt, type TransformerEnvironment } from "./TransformerEnvironmentBindings";

// ################################################################################################
// Issue #501 — the names visible at a position of a composite action sequence, as
// DomainController.handleCompositeActionTemplate and resolveCompositeActionTemplate bind them:
// - a template sees the parameters, as parameters and as context, and the templates before it;
// - a runtime node of an action sees the parameters as parameters, and as context the parameters,
//   the context the caller gives, the templates and the results of the earlier actions (by
//   `actionLabel`, or `nameGivenToResult` for a boxed query);
// - a build node (no interpolation, or build) is evaluated while the sequence resolves: it sees
//   the parameters and the templates as parameters, and no context;
// - a nested sequence starts with no templates and no earlier results of its parent;
// - a query in an action payload sees its own query and page parameters, and as context its
//   contextResults, the action's context, its extractors and combiners and the runtime
//   transformers before it.
// Inside a transformer, the scope rules of transformers apply (TransformerScope).
// ################################################################################################

type ActionRecord = Record<string, unknown>;

/**
 * The actions that bind their result under `nameGivenToResult` only. The test path
 * (handleCompositeAction) binds a boxed query under its `actionLabel` too, the Runner path
 * (handleCompositeActionTemplate) does not: only the name both bind is offered.
 */
const NAMED_RESULT_ACTION_TYPES = new Set(["compositeRunBoxedQueryAction", "compositeRunBoxedQueryTemplateAction"]);

interface SequenceScope {
  parameters: string[];
  /** The context the caller gives, seen by every action. */
  context: string[];
}

function isRecord(value: unknown): value is ActionRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keysOf(value: unknown): string[] {
  return isRecord(value) ? Object.keys(value) : [];
}

/** The keys of `record` before `key`, all of them when `key` is not one. */
function keysBefore(record: unknown, key: string | number | undefined): string[] {
  const keys = keysOf(record);
  const index = key === undefined ? -1 : keys.indexOf(String(key));
  return index < 0 ? keys : keys.slice(0, index);
}

function valueAt(value: unknown, path: (string | number)[]): unknown {
  return path.reduce<unknown>(
    (current, segment) =>
      typeof current === "object" && current !== null ? (current as Record<string, unknown>)[segment] : undefined,
    value,
  );
}

function isSequence(action: unknown): action is ActionRecord {
  return isRecord(action) && action.actionType === "compositeActionSequence";
}

function isQuery(value: unknown): value is ActionRecord {
  return isRecord(value) && ("queryParams" in value || "extractors" in value || "runtimeTransformers" in value);
}

/** The names the result of `action` is bound under, for the actions after it. */
function resultNamesOf(action: unknown): string[] {
  if (!isRecord(action) || action.actionType === "compositeRunTestAssertion") {
    return [];
  }
  if (NAMED_RESULT_ACTION_TYPES.has(String(action.actionType))) {
    return typeof action.nameGivenToResult === "string" ? [action.nameGivenToResult] : [];
  }
  return typeof action.actionLabel === "string" && action.actionLabel.length > 0 ? [action.actionLabel] : [];
}

/**
 * The names visible at `path` of the composite action `action` (#501), whether a node sits there
 * or not. `rootEnvironment` holds the action's parameters (a Runner's: `runnerEnvironment`) and the
 * context its caller gives.
 */
export function compositeActionEnvironmentAt(
  action: unknown,
  path: (string | number)[],
  rootEnvironment: TransformerEnvironment,
): TransformerEnvironment {
  return sequenceEnvironmentAt(action, path, {
    parameters: rootEnvironment.parameterNames,
    context: rootEnvironment.contextNames,
  });
}

/** The parameters of a Runner's sequence: its form values, under the Runner's name. */
export function runnerEnvironment(runnerName: string): TransformerEnvironment {
  return { contextNames: [], parameterNames: [runnerName] };
}

function sequenceEnvironmentAt(action: unknown, path: (string | number)[], scope: SequenceScope): TransformerEnvironment {
  if (!isSequence(action) || path[0] !== "payload" || path.length < 3) {
    return stepEnvironmentAt(action, path, scope, [], []);
  }
  const payload = isRecord(action.payload) ? action.payload : {};
  if (path[1] === "templates") {
    const templates = payload.templates;
    return transformerEnvironmentAt(valueAt(templates, [path[2]]), path.slice(3), {
      contextNames: [...scope.parameters, ...keysBefore(templates, path[2])],
      parameterNames: scope.parameters,
    });
  }
  if (path[1] === "actionSequence") {
    const sequence = Array.isArray(payload.actionSequence) ? payload.actionSequence : [];
    const index = Number(path[2]);
    const step = sequence[index];
    if (isSequence(step)) {
      return sequenceEnvironmentAt(step, path.slice(3), scope);
    }
    return stepEnvironmentAt(step, path.slice(3), scope, keysOf(payload.templates), sequence.slice(0, index).flatMap(resultNamesOf));
  }
  return stepEnvironmentAt(action, path, scope, [], []);
}

function stepEnvironmentAt(
  step: unknown,
  path: (string | number)[],
  scope: SequenceScope,
  templates: string[],
  earlierResults: string[],
): TransformerEnvironment {
  const actionContext = [...scope.parameters, ...scope.context, ...templates, ...earlierResults];
  const queryDepth = path.findIndex((segment, depth) => segment === "query" && isQuery(valueAt(step, path.slice(0, depth + 1))));
  if (queryDepth >= 0) {
    return queryEnvironmentAt(valueAt(step, path.slice(0, queryDepth + 1)) as ActionRecord, path.slice(queryDepth + 1), actionContext);
  }
  const target = valueAt(step, path);
  const isBuildNode =
    isRecord(target) && typeof target.transformerType === "string" && target.interpolation !== "runtime";
  return transformerEnvironmentAt(
    step,
    path,
    isBuildNode
      ? { contextNames: [], parameterNames: [...scope.parameters, ...templates] }
      : { contextNames: actionContext, parameterNames: scope.parameters },
  );
}

function queryEnvironmentAt(query: ActionRecord, path: (string | number)[], actionContext: string[]): TransformerEnvironment {
  const parameterNames = [...keysOf(query.queryParams), ...keysOf(query.pageParams)];
  const contextNames = [...keysOf(query.contextResults), ...actionContext];
  if (path[0] === "runtimeTransformers" && path.length >= 2) {
    return transformerEnvironmentAt(valueAt(query.runtimeTransformers, [path[1]]), path.slice(2), {
      contextNames: [
        ...contextNames,
        ...keysOf(query.extractors),
        ...keysOf(query.combiners),
        ...keysBefore(query.runtimeTransformers, path[1]),
      ],
      parameterNames,
    });
  }
  return transformerEnvironmentAt(query, path, { contextNames, parameterNames });
}

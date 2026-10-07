import type { MlElement } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { EndpointActionRegistry } from "./EndpointActionRegistry";

// ################################################################################################
// Issue #506 (analysis #497, G9) — composite Endpoint actions built and edited with blocks.
// - An Endpoint action declares its parameters in `actionParameters.payload` (an object ML schema);
//   a `compositeActionTemplate` implementation reads a parameter `p` as `getFromContext
//   ["payload", p]`, runtime, as `entity_DuplicateAttribute` (ModelEndpoint) does.
// - The hat of such an action (its "define" block) names it by its action type and lists its
//   parameters; they are added, renamed (their reads follow) and removed (refused while read).
// - A sequence of the sequence editor becomes an action: the Runner's form fields become its
//   parameters, and the reads of `[runner, field]` become reads of `["payload", field]`.
// - Action types are global across Endpoints, so a new action type must be free in the registry.
// ################################################################################################

type Path = (string | number)[];

export const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const PAYLOAD = "payload";
const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const READ_TYPES = new Set(["getFromParameters", "getFromContext"]);

export interface EndpointActionHat {
  /** The action type. */
  name: string;
  parameters: { name: string; type: string; read: boolean }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Copy of `value` with `update` applied at `path`; missing records are created. */
function updateAt(value: unknown, path: Path, update: (current: unknown) => unknown): unknown {
  if (path.length === 0) {
    return update(value);
  }
  const [head, ...rest] = path;
  if (Array.isArray(value)) {
    const copy = [...value];
    copy[Number(head)] = updateAt(value[Number(head)], rest, update);
    return copy;
  }
  const base = isRecord(value) ? value : {};
  return { ...base, [head]: updateAt(base[head], rest, update) };
}

/** The reads in `value` whose path starts with `prefix` (`referenceName` counts as a one-segment path); quoted values are not read. */
function readPaths(value: unknown, prefix: string[], path: Path = []): { path: Path; segments: unknown[] }[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => readPaths(item, prefix, [...path, index]));
  }
  if (!isRecord(value)) {
    return [];
  }
  const segments: unknown[] | undefined = !READ_TYPES.has(String(value.transformerType))
    ? undefined
    : typeof value.referenceName === "string" && value.referenceName.length > 0
      ? [value.referenceName]
      : Array.isArray(value.referencePath)
        ? value.referencePath
        : undefined;
  const own =
    segments && prefix.every((segment, index) => segments[index] === segment) ? [{ path, segments }] : [];
  const nested = Object.entries(value)
    .filter(([key]) => !(value.transformerType === "returnValue" && key === "value"))
    .flatMap(([key, entry]) => readPaths(entry, prefix, [...path, key]));
  return [...own, ...nested];
}

function compositeBody(action: unknown): unknown {
  const implementation = isRecord(action) ? action.actionImplementation : undefined;
  return isRecord(implementation) && implementation.actionImplementationType === "compositeActionTemplate"
    ? implementation.definition
    : undefined;
}

function actionTypeOf(action: unknown): string | undefined {
  const actionType = isRecord(action) && isRecord(action.actionParameters) ? action.actionParameters.actionType : undefined;
  return isRecord(actionType) && actionType.type === "literal" && typeof actionType.definition === "string"
    ? actionType.definition
    : undefined;
}

function payloadParameters(action: unknown): Record<string, MlElement> | undefined {
  const payload = isRecord(action) && isRecord(action.actionParameters) ? action.actionParameters.payload : undefined;
  return isRecord(payload) && payload.type === "object" && isRecord(payload.definition)
    ? (payload.definition as Record<string, MlElement>)
    : undefined;
}

/** The parameters of `action` its body reads. */
export function endpointActionParameterReads(action: unknown): string[] {
  return [
    ...new Set(
      readPaths(compositeBody(action), [PAYLOAD])
        .map((read) => read.segments[1])
        .filter((segment): segment is string => typeof segment === "string"),
    ),
  ];
}

/** The hat of a composite Endpoint action: its action type and parameters; `undefined` for any other value. */
export function endpointActionHat(action: unknown): EndpointActionHat | undefined {
  const name = actionTypeOf(action);
  const parameters = payloadParameters(action);
  if (!name || !parameters || compositeBody(action) === undefined) {
    return undefined;
  }
  const reads = new Set(endpointActionParameterReads(action));
  return {
    name,
    parameters: Object.entries(parameters).map(([parameter, schema]) => ({
      name: parameter,
      type: String(schema?.type ?? "any"),
      read: reads.has(parameter),
    })),
  };
}

function editableParameters(action: unknown): Record<string, MlElement> {
  const parameters = payloadParameters(action);
  if (!endpointActionHat(action) || !parameters) {
    throw new Error("the value is not a composite Endpoint action");
  }
  return parameters;
}

function withParameters(action: unknown, parameters: Record<string, MlElement>): Record<string, unknown> {
  return updateAt(action, ["actionParameters", PAYLOAD, "definition"], () => parameters) as Record<string, unknown>;
}

function checkNewName(names: Record<string, unknown>, name: string, what: string): void {
  if (!NAME.test(name)) {
    throw new Error(`"${name}" is not a ${what} name: use letters, digits and _, not starting with a digit`);
  }
  if (Object.hasOwn(names, name)) {
    throw new Error(`the action already has a parameter ${name}`);
  }
}

/** `action` with a new parameter `name` of ML type `type`, after the others. */
export function addEndpointActionParameter(action: unknown, name: string, type: string = "string"): Record<string, unknown> {
  const parameters = editableParameters(action);
  checkNewName(parameters, name, "parameter");
  return withParameters(action, { ...parameters, [name]: { type } as MlElement });
}

/** `action` with its parameter `from` named `to`, in place, and every read of `["payload", from, …]` in its body rewritten. */
export function renameEndpointActionParameter(action: unknown, from: string, to: string): Record<string, unknown> {
  const parameters = editableParameters(action);
  if (!Object.hasOwn(parameters, from)) {
    throw new Error(`the action has no parameter ${from}`);
  }
  if (from === to) {
    return action as Record<string, unknown>;
  }
  checkNewName(parameters, to, "parameter");
  const renamed = withParameters(
    action,
    Object.fromEntries(Object.entries(parameters).map(([name, schema]) => [name === from ? to : name, schema])),
  );
  const body = readPaths(compositeBody(action), [PAYLOAD, from]).reduce(
    (current, read) =>
      updateAt(current, [...read.path, "referencePath"], () =>
        read.segments.map((segment, index) => (index === 1 ? to : segment)),
      ),
    compositeBody(action),
  );
  return updateAt(renamed, ["actionImplementation", "definition"], () => body) as Record<string, unknown>;
}

/** `action` without its parameter `name`; refused while its body reads it. */
export function removeEndpointActionParameter(action: unknown, name: string): Record<string, unknown> {
  const parameters = editableParameters(action);
  if (!Object.hasOwn(parameters, name)) {
    throw new Error(`the action has no parameter ${name}`);
  }
  if (endpointActionParameterReads(action).includes(name)) {
    throw new Error(`the action reads ${name}: remove its reads first`);
  }
  const { [name]: _removed, ...kept } = parameters;
  return withParameters(action, kept);
}

/**
 * The composite action `actionType` of the Endpoint `endpointUuid` (#506), from the sequence of
 * the Runner `runnerName`: its form `fields` are the parameters of the action, and the reads of
 * `[runnerName, field, …]` read `["payload", field, …]` from the context. `actionType` must be
 * free in `registry`: action types are global across Endpoints.
 */
export function compositeEndpointAction(params: {
  actionType: string;
  endpointUuid: string;
  sequence: unknown;
  runnerName: string;
  fields: Record<string, MlElement>;
  registry?: EndpointActionRegistry;
}): Record<string, unknown> {
  if (!NAME.test(params.actionType)) {
    throw new Error(`"${params.actionType}" is not an action name: use letters, digits and _, not starting with a digit`);
  }
  if (params.registry && Object.hasOwn(params.registry, params.actionType)) {
    throw new Error(`the action ${params.actionType} exists in the Endpoint ${params.registry[params.actionType].endpointName}`);
  }
  const body = readPaths(params.sequence, [params.runnerName]).reduce(
    (current, read) =>
      updateAt(current, read.path, (node) => {
        const { referenceName: _name, referencePath: _path, ...rest } = node as Record<string, unknown>;
        return { ...rest, transformerType: "getFromContext", referencePath: [PAYLOAD, ...read.segments.slice(1)] };
      }),
    params.sequence,
  );
  return {
    actionParameters: {
      actionType: { type: "literal", tag: { value: { canBeTemplate: false } }, definition: params.actionType },
      actionLabel: { type: "string", optional: true },
      endpoint: { type: "literal", definition: params.endpointUuid },
      payload: { type: "object", definition: params.fields },
    },
    actionImplementation: { actionImplementationType: "compositeActionTemplate", definition: body },
  };
}

/** `endpoint` with `action` after its actions; refused for an Endpoint without actions (an external service). */
export function addEndpointAction(endpoint: unknown, action: unknown): Record<string, unknown> {
  const definition = isRecord(endpoint) ? endpoint.definition : undefined;
  if (!isRecord(endpoint) || !isRecord(definition) || !Array.isArray(definition.actions)) {
    throw new Error("the Endpoint declares no actions");
  }
  const actionType = actionTypeOf(action);
  if (definition.actions.some((existing) => actionTypeOf(existing) === actionType)) {
    throw new Error(`the Endpoint ${String(endpoint.name)} has an action ${actionType}`);
  }
  return { ...endpoint, definition: { ...definition, actions: [...definition.actions, action] } };
}

/** A new Endpoint of `application` named `name`, with `actions`. */
export function newEndpoint(params: { uuid: string; application: string; name: string; actions: unknown[] }): Record<string, unknown> {
  if (params.name.trim().length === 0) {
    throw new Error("an Endpoint needs a name");
  }
  return {
    uuid: params.uuid,
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: params.application,
    name: params.name,
    version: "1",
    definition: { actions: params.actions },
  };
}

import type {
  MlElement,
  MlObject,
  TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type { BlockInsertPosition } from "../0_interfaces/2_domain/TransformerTreeEditInterface";
import { defaultMiroirModelEnvironment } from "../1_core/Model";
import { compositeActionEnvironmentAt } from "./CompositeActionScope";
import { endpointActionRegistry, type EndpointActionRegistry } from "./EndpointActionRegistry";
import { isBlockAction } from "./TransformerBlockModel";
import { transformerDefinitionRegistry } from "./TransformerDefinitionRegistry";
import { transformerEnvironmentAt, type TransformerEnvironment } from "./TransformerEnvironmentBindings";
import { getDefaultValueForMlSchemaWithResolutionNonHook } from "./TransformersForRuntime";
import {
  insertTransformerNode,
  removeTransformerNode,
  transformerInsertPositions,
  transformerSlotAt,
} from "./TransformerTreeEdit";

// ################################################################################################
// Issue #505 (analysis #497, G8) — edits of a composite action sequence with blocks, next to the
// transformer edits of #500 (TransformerTreeEdit). A position owned by a transformer slot is edited
// as #500 does; the others belong to the actions:
// - a step of an `actionSequence` holds an action: a new one goes at the end, a move or a remove
//   shifts the list;
// - a declared payload attribute that is absent is an empty slot;
// - any value below a `payload` or the `templates` of an action can hold a transformer, since
//   DomainController.handleCompositeActionTemplate resolves the whole step: a literal, an object or
//   a list there can be replaced, and a plain list gets a new item at its end;
// - `templates` gets new entries.
// The payload of a query step is one block, read with the form or JSON views: nothing inside it.
// ################################################################################################

type PathSegment = string | number;
type Path = PathSegment[];
type ActionRecord = Record<string, unknown>;

const COMPOSITE_ACTION_SEQUENCE = "compositeActionSequence";
const TEST_ASSERTION = "compositeRunTestAssertion";
const QUERY_ACTION_TYPES = new Set(["compositeRunBoxedQueryAction", "compositeRunBoxedQueryTemplateAction"]);
const TEMPLATE_KEY = "template";

export interface BlockEditOptions {
  modelEnvironment?: MiroirModelEnvironment;
  transformerDefinitions?: Record<string, TransformerDefinition>;
  /** What a required transformer slot gets when its block is removed (#500). */
  slotDefault?: unknown;
}

function isPlainRecord(value: unknown): value is ActionRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTransformerNode(value: unknown): value is ActionRecord & { transformerType: string } {
  return isPlainRecord(value) && typeof value.transformerType === "string";
}

/** A value with a string `actionType` and no `transformerType`: a step of a sequence. */
function isActionValue(value: unknown): value is ActionRecord & { actionType: string } {
  return isPlainRecord(value) && !isTransformerNode(value) && typeof value.actionType === "string";
}

function valueAt(value: unknown, path: Path): unknown {
  return path.reduce<unknown>(
    (current, segment) =>
      Array.isArray(current) || isPlainRecord(current) ? (current as Record<string, unknown>)[segment] : undefined,
    value,
  );
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
  const base = isPlainRecord(value) ? value : {};
  return { ...base, [head]: updateAt(base[head], rest, update) };
}

/** `base`, or `base2`, `base3`… : the first key `record` does not hold yet. */
function freeKey(record: unknown, base: string): string {
  const keys = new Set(isPlainRecord(record) ? Object.keys(record) : []);
  if (!keys.has(base)) {
    return base;
  }
  let suffix = 2;
  while (keys.has(`${base}${suffix}`)) {
    suffix++;
  }
  return `${base}${suffix}`;
}

function definitionsOf(options: BlockEditOptions): Record<string, TransformerDefinition> {
  return options.transformerDefinitions ?? transformerDefinitionRegistry(options.modelEnvironment ?? defaultMiroirModelEnvironment);
}

/** The attributes the payload of an Endpoint action declares, when it is an inline object. */
function declaredPayloadAttributes(actions: EndpointActionRegistry, actionType: string): [string, MlElement][] {
  const payload = (actions[actionType]?.action as { actionParameters?: { payload?: MlElement } } | undefined)
    ?.actionParameters?.payload;
  return payload?.type === "object" ? Object.entries((payload as MlObject).definition ?? {}) : [];
}

interface PositionWalk {
  actions: EndpointActionRegistry;
  transformerDefinitions: Record<string, TransformerDefinition>;
  positions: BlockInsertPosition[];
}

function addPosition(walk: PositionWalk, position: BlockInsertPosition): void {
  if (!walk.positions.some((known) => known.path.length === position.path.length && known.path.every((segment, index) => String(segment) === String(position.path[index])))) {
    walk.positions.push(position);
  }
}

/** The positions inside a value an action holds: transformers, nested sequences, plain lists and records. */
function valuePositions(value: unknown, path: Path, walk: PositionWalk): void {
  if (isTransformerNode(value)) {
    for (const position of transformerInsertPositions(value, walk.transformerDefinitions)) {
      addPosition(walk, {
        ...position,
        path: [...path, ...position.path],
        container: [...path, ...position.container],
        holds: "transformer",
      });
    }
    return;
  }
  if (isActionValue(value)) {
    actionPositions(value, path, walk);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => valuePositions(item, [...path, index], walk));
    addPosition(walk, { path: [...path, value.length], container: path, kind: "listEnd", holds: "transformer" });
    return;
  }
  if (isPlainRecord(value)) {
    for (const [key, entry] of Object.entries(value)) {
      valuePositions(entry, [...path, key], walk);
    }
  }
}

function actionPositions(action: ActionRecord & { actionType: string }, path: Path, walk: PositionWalk): void {
  const payloadPath = [...path, "payload"];
  const payload = action.payload;
  if (isTransformerNode(payload)) {
    valuePositions(payload, payloadPath, walk);
    return;
  }
  if (action.actionType === COMPOSITE_ACTION_SEQUENCE) {
    const record = isPlainRecord(payload) ? payload : {};
    const templates = record.templates;
    for (const [key, template] of Object.entries(isPlainRecord(templates) ? templates : {})) {
      valuePositions(template, [...payloadPath, "templates", key], walk);
    }
    addPosition(walk, {
      path: [...payloadPath, "templates", freeKey(templates, TEMPLATE_KEY)],
      container: [...payloadPath, "templates"],
      kind: "recordEntry",
      holds: "transformer",
    });
    const steps = Array.isArray(record.actionSequence) ? record.actionSequence : [];
    steps.forEach((step, index) => {
      const stepPath = [...payloadPath, "actionSequence", index];
      if (isActionValue(step)) {
        actionPositions(step, stepPath, walk);
      } else {
        valuePositions(step, stepPath, walk);
      }
    });
    addPosition(walk, {
      path: [...payloadPath, "actionSequence", steps.length],
      container: [...payloadPath, "actionSequence"],
      kind: "listEnd",
      holds: "action",
    });
    for (const [key, entry] of Object.entries(record)) {
      if (key !== "templates" && key !== "actionSequence") {
        valuePositions(entry, [...payloadPath, key], walk);
      }
    }
    return;
  }
  if (QUERY_ACTION_TYPES.has(action.actionType) || (payload !== undefined && !isPlainRecord(payload))) {
    return;
  }
  const record = isPlainRecord(payload) ? payload : {};
  for (const [name] of declaredPayloadAttributes(walk.actions, action.actionType)) {
    if (!Object.prototype.hasOwnProperty.call(record, name)) {
      addPosition(walk, { path: [...payloadPath, name], container: [...payloadPath, name], kind: "slot", holds: "transformer" });
    }
  }
  for (const [key, entry] of Object.entries(record)) {
    valuePositions(entry, [...payloadPath, key], walk);
  }
}

/**
 * Where a new block can go in `root` (#505): for a transformer, the positions of
 * `transformerInsertPositions`; for an action or a sequence, the end of every `actionSequence`
 * (an action), every absent declared payload attribute, a new `templates` entry, the end of every
 * plain list below a payload or a template, and the positions of the transformers there.
 */
export function blockInsertPositions(root: unknown, options: BlockEditOptions = {}): BlockInsertPosition[] {
  const modelEnvironment = options.modelEnvironment ?? defaultMiroirModelEnvironment;
  const transformerDefinitions = definitionsOf(options);
  if (!isBlockAction(root, modelEnvironment)) {
    return transformerInsertPositions(root, transformerDefinitions).map((position) => ({ ...position, holds: "transformer" }));
  }
  const walk: PositionWalk = { actions: endpointActionRegistry(modelEnvironment), transformerDefinitions, positions: [] };
  actionPositions(root as ActionRecord & { actionType: string }, [], walk);
  return walk.positions;
}

/**
 * The owner of the position `path`: the nearest transformer or action above it, and whether
 * `path` is a position of it where a transformer or a value can sit.
 */
function ownerOf(
  root: unknown,
  path: Path,
  transformerDefinitions: Record<string, TransformerDefinition>,
): { kind: "transformer" | "action" | "none"; ownerLength: number; valuePosition: boolean } {
  for (let ownerLength = path.length - 1; ownerLength >= 0; ownerLength--) {
    const owner = valueAt(root, path.slice(0, ownerLength));
    if (isTransformerNode(owner)) {
      return {
        kind: "transformer",
        ownerLength,
        valuePosition: transformerSlotAt(root, path, transformerDefinitions)?.ownerLength === ownerLength,
      };
    }
    if (isActionValue(owner)) {
      const relative = path.slice(ownerLength);
      const isStep = owner.actionType === COMPOSITE_ACTION_SEQUENCE && relative[1] === "actionSequence";
      return {
        kind: "action",
        ownerLength,
        valuePosition: relative[0] === "payload" && !isStep && !insideQueryPayload(root, path, ownerLength),
      };
    }
  }
  return { kind: "none", ownerLength: -1, valuePosition: false };
}

/**
 * Whether `path` is inside the payload of a query step at or above `ownerLength`: the query, a
 * run query action with its own `actionType`, is one block.
 */
function insideQueryPayload(root: unknown, path: Path, ownerLength: number): boolean {
  for (let length = ownerLength; length >= 0; length--) {
    const action = valueAt(root, path.slice(0, length));
    if (isActionValue(action) && QUERY_ACTION_TYPES.has(action.actionType)) {
      return path[length] === "payload" && path.length > length + 1;
    }
  }
  return false;
}

/**
 * Whether the value at `path` of `root` can be replaced by a transformer (#505): a slot of a
 * transformer, or any value below the `payload` or the `templates` of an action, but a step of a
 * sequence (an action) and the inside of a query step's payload.
 */
export function isValuePosition(root: unknown, path: Path, options: BlockEditOptions = {}): boolean {
  return path.length > 0 && ownerOf(root, path, definitionsOf(options)).valuePosition;
}

/** Whether `path` of `root` is a step of an `actionSequence`, where an action goes. */
export function isStepPosition(root: unknown, path: Path): boolean {
  return (
    path.length >= 3 &&
    path[path.length - 2] === "actionSequence" &&
    path[path.length - 3] === "payload" &&
    isPlainRecord(valueAt(root, path.slice(0, -3))) &&
    (valueAt(root, path.slice(0, -3)) as ActionRecord).actionType === COMPOSITE_ACTION_SEQUENCE
  );
}

/**
 * Put `node` at `path` of `root`, a position of `blockInsertPositions` (#505): a transformer slot
 * as `insertTransformerNode` does; otherwise a list position is inserted before the item there
 * (the list length appends), a taken `templates` key gets a number suffix, an attribute is set.
 */
export function insertBlockNode(root: unknown, path: Path, node: unknown, options: BlockEditOptions = {}): unknown {
  if (path.length === 0) {
    if (root !== undefined) {
      throw new Error("insertBlockNode: the root is taken");
    }
    return node;
  }
  const transformerDefinitions = definitionsOf(options);
  const owner = ownerOf(root, path, transformerDefinitions);
  if (owner.kind === "transformer" && owner.valuePosition) {
    return insertTransformerNode(root, path, node, { slotDefault: options.slotDefault, transformerDefinitions });
  }
  const key = path[path.length - 1];
  const containerPath = path.slice(0, -1);
  return updateAt(root, containerPath, (container) => {
    if (Array.isArray(container) || (container === undefined && typeof key === "number")) {
      const list = Array.isArray(container) ? container : [];
      const index = Number(key);
      if (!Number.isInteger(index) || index < 0 || index > list.length) {
        throw new Error(`insertBlockNode: no position ${String(key)} in a list of ${list.length}`);
      }
      return [...list.slice(0, index), node, ...list.slice(index)];
    }
    const record = isPlainRecord(container) ? container : {};
    const entryKey = containerPath[containerPath.length - 1] === "templates" ? freeKey(record, String(key)) : String(key);
    return { ...record, [entryKey]: node };
  });
}

/** Remove the block at `path` of `root` (#505): as `removeTransformerNode`, which deletes a step or an attribute. */
export function removeBlockNode(root: unknown, path: Path, options: BlockEditOptions & { rootDefault?: unknown } = {}): unknown {
  return removeTransformerNode(root, path, {
    rootDefault: options.rootDefault,
    slotDefault: options.slotDefault,
    transformerDefinitions: definitionsOf(options),
  });
}

function isPrefixOf(prefix: Path, path: Path): boolean {
  return prefix.length <= path.length && prefix.every((segment, index) => String(segment) === String(path[index]));
}

/**
 * Move the block at `from` of `root` to the position `to` (#505), in one value: removed as
 * `removeBlockNode` does, then inserted as `insertBlockNode` does, at the position `to` names
 * before the move.
 */
export function moveBlockNode(root: unknown, from: Path, to: Path, options: BlockEditOptions = {}): unknown {
  if (from.length === 0) {
    throw new Error("moveBlockNode: the root cannot move");
  }
  if (isPrefixOf(from, to)) {
    throw new Error("moveBlockNode: a block cannot move into itself");
  }
  const node = valueAt(root, from);
  if (node === undefined) {
    throw new Error(`moveBlockNode: nothing at ${from.join(".")}`);
  }
  // an action goes to a step and nothing else does: checked before anything is removed
  if (isStepPosition(root, from) !== isStepPosition(root, to)) {
    throw new Error(
      isStepPosition(root, from) ? "an action moves only to a step of a sequence" : "only an action goes at a step of a sequence",
    );
  }
  const removed = removeBlockNode(root, from, options);
  const listPath = from.slice(0, -1);
  const fromIndex = Number(from[from.length - 1]);
  const shifts =
    Array.isArray(valueAt(root, listPath)) &&
    to.length > listPath.length &&
    isPrefixOf(listPath, to) &&
    Number(to[listPath.length]) > fromIndex;
  const target = shifts ? [...listPath, Number(to[listPath.length]) - 1, ...to.slice(listPath.length + 1)] : to;
  return insertBlockNode(removed, target, node, options);
}

/** Every `actionLabel` of the actions of `root`, nested sequences included. */
export function actionLabels(root: unknown): string[] {
  if (Array.isArray(root)) {
    return root.flatMap(actionLabels);
  }
  if (!isPlainRecord(root) || isTransformerNode(root)) {
    return [];
  }
  const own = isActionValue(root) && typeof root.actionLabel === "string" ? [root.actionLabel] : [];
  return [...own, ...Object.values(root).flatMap(actionLabels)];
}

/** `base`, or `base2`, `base3`… : the first of them not in `taken`. */
function freeLabel(base: string, taken: string[]): string {
  return freeKey(Object.fromEntries(taken.map((label) => [label, true])), base);
}

/**
 * `value` without the defaults that could not be computed: an `initializeTo` transformer reading a
 * parameter the editor does not have gives a failure, which leaves the attribute to fill instead.
 */
function withoutFailures(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.filter((item) => !isFailure(item)).map(withoutFailures);
  }
  if (!isPlainRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => !isFailure(entry))
      .map(([key, entry]) => [key, withoutFailures(entry)]),
  );
}

function isFailure(value: unknown): boolean {
  return isPlainRecord(value) && typeof value.queryFailure === "string";
}

/**
 * The step a palette action puts (#505): its `actionType`, the `endpoint` declaring it, its
 * `actionLabel` (the type, numbered when `takenLabels` has it: results are bound by label) and the
 * default of its payload schema. `parameters` are what the defaults of the schema read, as
 * `applicationUuid` for the `application` of an instance action.
 */
export function defaultActionNode(
  actionType: string,
  modelEnvironment: MiroirModelEnvironment = defaultMiroirModelEnvironment,
  takenLabels: string[] = [],
  parameters: Record<string, unknown> = {},
): Record<string, unknown> {
  const entry = endpointActionRegistry(modelEnvironment)[actionType];
  if (!entry) {
    throw new Error(`defaultActionNode: no Endpoint declares ${actionType}`);
  }
  const payloadSchema = (entry.action as { actionParameters?: { payload?: MlElement } }).actionParameters?.payload;
  let payload: unknown = undefined;
  if (payloadSchema) {
    try {
      payload = getDefaultValueForMlSchemaWithResolutionNonHook(
        "build",
        payloadSchema,
        undefined,
        "",
        undefined,
        [],
        false,
        undefined,
        undefined,
        undefined,
        modelEnvironment,
        parameters,
        parameters,
      );
    } catch {
      payload = payloadSchema.type === "object" ? {} : undefined;
    }
  }
  payload = withoutFailures(payload);
  return {
    actionType,
    actionLabel: freeLabel(actionType, takenLabels),
    endpoint: entry.endpointUuid,
    ...(payload === undefined ? {} : { payload }),
  };
}

/** A palette group of actions: those of one Endpoint (#505). */
export interface ActionPaletteGroup {
  endpointUuid: string;
  endpointName: string;
  actionTypes: string[];
}

/**
 * The actions of the block palette (#505): the Endpoint actions of the model environment grouped
 * by Endpoint, both sorted by name. The assert action is left out unless `withTestAssertion`: the
 * Runner and Endpoint paths refuse it (`handleCompositeActionTemplate`, analysis D10).
 */
export function actionPaletteGroups(
  modelEnvironment: MiroirModelEnvironment = defaultMiroirModelEnvironment,
  options: { withTestAssertion?: boolean } = {},
): ActionPaletteGroup[] {
  const groups = new Map<string, ActionPaletteGroup>();
  for (const [actionType, entry] of Object.entries(endpointActionRegistry(modelEnvironment))) {
    if (actionType === TEST_ASSERTION && !options.withTestAssertion) {
      continue;
    }
    const group = groups.get(entry.endpointUuid) ?? {
      endpointUuid: entry.endpointUuid,
      endpointName: entry.endpointName,
      actionTypes: [],
    };
    group.actionTypes.push(actionType);
    groups.set(entry.endpointUuid, group);
  }
  return [...groups.values()]
    .sort((a, b) => a.endpointName.localeCompare(b.endpointName))
    .map((group) => ({ ...group, actionTypes: [...group.actionTypes].sort() }));
}

/**
 * The names visible at `path` of `root` (#505): for an action, as the sequence binds them
 * (`compositeActionEnvironmentAt`); for a transformer, as the transformer scope rules do.
 */
export function blockEnvironmentAt(
  root: unknown,
  path: Path,
  rootEnvironment: TransformerEnvironment,
  modelEnvironment: MiroirModelEnvironment = defaultMiroirModelEnvironment,
): TransformerEnvironment {
  return isBlockAction(root, modelEnvironment)
    ? compositeActionEnvironmentAt(root, path, rootEnvironment)
    : transformerEnvironmentAt(root, path, rootEnvironment);
}

/**
 * `root` with the entry at `path` of a record renamed `to`, in place (#505): a block view names the
 * entries it adds `value`, `template`… and the user names them. Refused when `to` is empty or taken.
 */
export function renameBlockKey(root: unknown, path: Path, to: string): unknown {
  if (path.length === 0) {
    throw new Error("renameBlockKey: the root has no key");
  }
  const from = String(path[path.length - 1]);
  const containerPath = path.slice(0, -1);
  const container = valueAt(root, containerPath);
  if (!isPlainRecord(container) || !Object.prototype.hasOwnProperty.call(container, from)) {
    throw new Error(`renameBlockKey: no entry ${from} to rename`);
  }
  if (to === from) {
    return root;
  }
  if (to.length === 0) {
    throw new Error("a key cannot be empty");
  }
  if (Object.prototype.hasOwnProperty.call(container, to)) {
    throw new Error(`the key ${to} is taken`);
  }
  return updateAt(root, containerPath, () =>
    Object.fromEntries(Object.entries(container).map(([key, value]) => [key === from ? to : key, value])),
  );
}

/** The paths of the reads of `name` (`referenceName`, or the first segment of `referencePath`) in `value`; quoted values are not read. */
function nameReadPaths(value: unknown, name: string, path: Path = []): Path[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => nameReadPaths(item, name, [...path, index]));
  }
  if (!isPlainRecord(value)) {
    return [];
  }
  const own =
    (value.transformerType === "getFromContext" || value.transformerType === "getFromParameters") &&
    (value.referenceName === name || (Array.isArray(value.referencePath) && value.referencePath[0] === name))
      ? [path]
      : [];
  const nested = Object.entries(value)
    .filter(([key]) => !(value.transformerType === "returnValue" && key === "value"))
    .flatMap(([key, entry]) => nameReadPaths(entry, name, [...path, key]));
  return [...own, ...nested];
}

/** `value` with its reads of `from` reading `to`. */
function renameReads(value: unknown, from: string, to: string): unknown {
  return nameReadPaths(value, from).reduce(
    (current, path) =>
      updateAt(current, path, (read) => {
        const node = read as ActionRecord;
        return node.referenceName === from
          ? { ...node, referenceName: to }
          : { ...node, referencePath: (node.referencePath as unknown[]).map((segment, index) => (index === 0 ? to : segment)) };
      }),
    value,
  );
}

/**
 * `root` with the name at `path` changed to `to`, its reads following it (#505): the `actionLabel`
 * of a step (its result is bound under it) or a `templates` key of a sequence, whose reads in that
 * sequence are rewritten; any other record key as `renameBlockKey`. A step label taken by another
 * action, or an empty name, is refused.
 */
export function renameSequenceName(root: unknown, path: Path, to: string): unknown {
  const last = path[path.length - 1];
  if (last === "actionLabel" && isStepPosition(root, path.slice(0, -1))) {
    const from = valueAt(root, path);
    if (to === from) {
      return root;
    }
    if (to.length === 0) {
      throw new Error("an action label cannot be empty");
    }
    if (actionLabels(root).includes(to)) {
      throw new Error(`the label ${to} is taken`);
    }
    const sequencePath = path.slice(0, -4);
    const labelled = updateAt(root, path, () => to);
    return typeof from === "string" ? updateAt(labelled, sequencePath, (sequence) => renameReads(sequence, from, to)) : labelled;
  }
  const renamed = renameBlockKey(root, path, to);
  const sequencePath = path.slice(0, -3);
  const owner = valueAt(root, sequencePath);
  const isTemplateKey =
    path.length >= 3 &&
    path[path.length - 2] === "templates" &&
    path[path.length - 3] === "payload" &&
    isPlainRecord(owner) &&
    owner.actionType === COMPOSITE_ACTION_SEQUENCE;
  return isTemplateKey && renamed !== root
    ? updateAt(renamed, sequencePath, (sequence) => renameReads(sequence, String(last), to))
    : renamed;
}

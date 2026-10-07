import equal from "fast-deep-equal";

import type {
  InputOutputType,
  MlElement,
  MlObject,
  MlReference,
  TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultTransformerInput, type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type {
  TransformerChild,
  TransformerInsertPosition,
  TransformerSlot,
  TransformerTypeChange,
} from "../0_interfaces/2_domain/TransformerTreeEditInterface";
import { mlsTypeCheck } from "../1_core/mls/mlsTypeCheck";
import { resolveMlSchemaReferenceInContext } from "../1_core/mls/mlsResolveSchemaReferenceInContext";
import { LIST_ELEMENT_SLOTS, transformerTypesAcceptingInput } from "./TransformerInterfaceCheck";
import {
  applicationTransformerDefinitions,
  getDefaultValueForMlSchemaWithResolutionNonHook,
} from "./TransformersForRuntime";
import { transformerDefinitionRegistry } from "./TransformerDefinitionRegistry";

// ################################################################################################
// Issue #415 — structural edits of a transformer tree: wrap a node in a new transformer, pipe it
// into a new transformer, unwrap a node, remove a subtree, change a node's type keeping what fits.
// Every function takes plain transformer values and returns new ones; nothing is mutated.
// ################################################################################################

type TransformerNode = { transformerType: string } & Record<string, unknown>;

/** Schema references whose target is a transformer: the positions this module edits. */
const TRANSFORMER_SCHEMA_NAMES = new Set(["transformer", "coreTransformerForBuildPlusRuntime"]);
const APPLY_TO = "applyTo";
/** Attributes every transformer has, kept on a type change. */
const COMMON_TRANSFORMER_ATTRIBUTES = new Set(["label", "interpolation"]);
const ARRAY_ITEM = "[]";
const RECORD_VALUE = "{}";

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTransformerNode(value: unknown): value is TransformerNode {
  return isPlainRecord(value) && typeof value.transformerType === "string";
}

function slotName(template: string[]): string {
  return template.reduce(
    (name, segment) =>
      segment === ARRAY_ITEM || segment === RECORD_VALUE
        ? name + segment
        : name.length === 0
          ? segment
          : `${name}.${segment}`,
    "",
  );
}

function parameterSchemaOf(
  transformerType: string,
  transformerDefinitions: Record<string, TransformerDefinition>,
): MlElement | undefined {
  const definition = transformerDefinitions[transformerType];
  const parameterSchema = definition?.transformerInterface?.transformerParameterSchema as
    | { transformerDefinition?: MlElement }
    | undefined;
  return parameterSchema?.transformerDefinition;
}

/** Collect the transformer positions of a parameter schema, depth first, in declaration order. */
function collectSlots(
  schema: MlElement | undefined,
  template: string[],
  optional: boolean,
  slots: TransformerSlot[],
): void {
  if (!schema) {
    return;
  }
  switch (schema.type) {
    case "schemaReference": {
      const relativePath = (schema as MlReference).definition?.relativePath;
      if (relativePath && TRANSFORMER_SCHEMA_NAMES.has(relativePath) && template.length > 0) {
        const name = slotName(template);
        if (!slots.some((slot) => slot.name === name)) {
          slots.push({ name, template, optional: optional || !!schema.optional, isApplyTo: false });
        }
      }
      return;
    }
    case "object": {
      for (const [attribute, attributeSchema] of Object.entries((schema as MlObject).definition ?? {})) {
        if (template.length === 0 && attribute === APPLY_TO) {
          continue;
        }
        collectSlots(attributeSchema as MlElement, [...template, attribute], !!(attributeSchema as MlElement).optional, slots);
      }
      return;
    }
    case "array":
      collectSlots(schema.definition as MlElement, [...template, ARRAY_ITEM], false, slots);
      return;
    case "record":
      collectSlots(schema.definition as MlElement, [...template, RECORD_VALUE], false, slots);
      return;
    case "union":
      for (const member of schema.definition as MlElement[]) {
        collectSlots(member, template, optional || !!schema.optional, slots);
      }
      return;
    default:
      return;
  }
}

/**
 * The positions of a transformer type where another transformer can sit, read from its
 * TransformerDefinition: enclosed transformers first, in declaration order, then `applyTo` when
 * the definition declares it. Unknown types have no slot.
 */
export function transformerSlots(
  transformerType: string,
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): TransformerSlot[] {
  const schema = parameterSchemaOf(transformerType, transformerDefinitions);
  const slots: TransformerSlot[] = [];
  collectSlots(schema, [], false, slots);
  if (schema?.type === "object" && (schema as MlObject).definition?.[APPLY_TO]) {
    slots.push({ name: APPLY_TO, template: [APPLY_TO], optional: true, isApplyTo: true });
  }
  return slots;
}

/** Transformer types a node can be wrapped in at a position whose input is `givenInput` (D8). */
export function wrapCandidates(
  givenInput: InputOutputType,
  options: {
    transformerTypes?: string[];
    transformerDefinitions?: Record<string, TransformerDefinition>;
  } = {},
): string[] {
  const transformerDefinitions = options.transformerDefinitions ?? applicationTransformerDefinitions;
  const withSlot = (options.transformerTypes ?? Object.keys(transformerDefinitions)).filter((type) =>
    transformerSlots(type, transformerDefinitions).some((slot) => !slot.isApplyTo),
  );
  return transformerTypesAcceptingInput(givenInput, { transformerTypes: withSlot, transformerDefinitions }).offered;
}

/** Transformer types a node whose output is `nodeOutput` can be piped into (D14). */
export function pipeCandidates(
  nodeOutput: InputOutputType,
  options: {
    transformerTypes?: string[];
    transformerDefinitions?: Record<string, TransformerDefinition>;
  } = {},
): string[] {
  const transformerDefinitions = options.transformerDefinitions ?? applicationTransformerDefinitions;
  const withApplyTo = (options.transformerTypes ?? Object.keys(transformerDefinitions)).filter((type) =>
    transformerSlots(type, transformerDefinitions).some((slot) => slot.isApplyTo),
  );
  return transformerTypesAcceptingInput(nodeOutput, { transformerTypes: withApplyTo, transformerDefinitions })
    .offered;
}

/** The schema of the transformer union where a transformer position's values come from. */
const TRANSFORMER_UNION = "coreTransformerForBuildPlusRuntime";

/** The branches of the transformer union: each transformer type with the schema name of its branch. */
function transformerUnionBranches(modelEnvironment: MiroirModelEnvironment): { transformerType: string; schemaName: string }[] {
  const context: Record<string, MlElement> =
    (modelEnvironment.miroirFundamentalMlSchema.definition as MlReference | undefined)?.context ?? {};
  const union = context[TRANSFORMER_UNION];
  if (union?.type !== "union") {
    return [];
  }
  return (union.definition as MlElement[]).flatMap((member) => {
    const schemaName = (member as MlReference).definition?.relativePath;
    const transformerTypeSchema = schemaName ? (context[schemaName] as MlObject | undefined)?.definition?.transformerType : undefined;
    return schemaName && transformerTypeSchema?.type === "literal"
      ? [{ transformerType: String(transformerTypeSchema.definition), schemaName }]
      : [];
  });
}

/** The transformer types a transformer position accepts: those of the transformer union (#500). */
export function transformerUnionTypes(modelEnvironment: MiroirModelEnvironment): string[] {
  return transformerUnionBranches(modelEnvironment).map((branch) => branch.transformerType);
}

/**
 * The node of `transformerType` with its default values: the default of its branch of the
 * transformer union, as the form builds it for a type change. With `interpolation`, the node and
 * every transformer of its slots get it (#500 D2: the nodes the block view creates are explicit).
 */
export function defaultTransformerNode(
  transformerType: string,
  modelEnvironment: MiroirModelEnvironment,
  interpolation?: "build" | "runtime",
  transformerDefinitions: Record<string, TransformerDefinition> = transformerDefinitionRegistry(modelEnvironment),
): Record<string, unknown> {
  const branch = transformerUnionBranches(modelEnvironment).find(
    (candidate) => candidate.transformerType === transformerType,
  )?.schemaName;
  if (!branch) {
    throw new Error(`defaultTransformerNode: ${transformerType} is not a transformer type of ${TRANSFORMER_UNION}`);
  }
  const node = {
    ...getDefaultValueForMlSchemaWithResolutionNonHook(
      "build",
      { type: "schemaReference", definition: { absolutePath: modelEnvironment.miroirFundamentalMlSchema.uuid, relativePath: branch } },
      undefined,
      "",
      undefined,
      [],
      false,
      undefined,
      undefined,
      undefined,
      modelEnvironment,
      {},
      {},
    ),
    transformerType,
  };
  return interpolation ? withInterpolation(node, interpolation, transformerDefinitions) : node;
}

/** `node` and the transformers of its slots, at any depth, with `interpolation`. */
function withInterpolation(
  node: TransformerNode,
  interpolation: "build" | "runtime",
  transformerDefinitions: Record<string, TransformerDefinition>,
): TransformerNode {
  return transformerChildren(node, transformerDefinitions).reduce(
    (result, child) =>
      updateAt(result, child.path, (childNode) =>
        withInterpolation(childNode as TransformerNode, interpolation, transformerDefinitions),
      ) as TransformerNode,
    { ...node, interpolation } as TransformerNode,
  );
}

/** Put `node` at `template` inside `value`, keeping the first item of an existing array. */
function placeAt(value: unknown, template: string[], node: unknown, recordKey: string): unknown {
  const [head, ...rest] = template;
  if (head === ARRAY_ITEM) {
    const first = Array.isArray(value) && value.length > 0 ? value[0] : {};
    return [rest.length > 0 ? placeAt(first, rest, node, recordKey) : node];
  }
  if (head === RECORD_VALUE) {
    return { [recordKey]: rest.length > 0 ? placeAt({}, rest, node, recordKey) : node };
  }
  const base = isPlainRecord(value) ? value : {};
  return { ...base, [head]: rest.length > 0 ? placeAt(base[head], rest, node, recordKey) : node };
}

function slotOf(
  transformerType: string,
  slotNameOrUndefined: string | undefined,
  transformerDefinitions: Record<string, TransformerDefinition>,
): TransformerSlot {
  const enclosingSlots = transformerSlots(transformerType, transformerDefinitions).filter((slot) => !slot.isApplyTo);
  if (slotNameOrUndefined === undefined) {
    if (enclosingSlots.length !== 1) {
      throw new Error(
        `wrapTransformerNode: ${transformerType} has ${enclosingSlots.length} slots (${enclosingSlots
          .map((slot) => slot.name)
          .join(", ")}), a slot name is required`,
      );
    }
    return enclosingSlots[0];
  }
  const slot = enclosingSlots.find((candidate) => candidate.name === slotNameOrUndefined);
  if (!slot) {
    throw new Error(`wrapTransformerNode: ${transformerType} has no slot ${slotNameOrUndefined}`);
  }
  return slot;
}

/**
 * Enclose `node` in `enclosingNode` (the new transformer, usually the default value of its type)
 * at the slot `slot`, which may be omitted when the enclosing type has exactly one non-`applyTo`
 * slot. An array slot gets a one-item array; a record slot a one-entry record keyed by the
 * node's `label`, else `value`. When the array item is new, its other required slots
 * (`whens[].then` next to `whens[].when`) get `options.slotDefault`.
 */
export function wrapTransformerNode(
  node: unknown,
  enclosingNode: Record<string, unknown>,
  slot?: string,
  options: {
    slotDefault?: unknown;
    transformerDefinitions?: Record<string, TransformerDefinition>;
  } = {},
): Record<string, unknown> {
  if (!isTransformerNode(enclosingNode)) {
    throw new Error("wrapTransformerNode: the enclosing node has no transformerType");
  }
  const transformerDefinitions = options.transformerDefinitions ?? applicationTransformerDefinitions;
  const target = slotOf(enclosingNode.transformerType, slot, transformerDefinitions);
  const recordKey =
    isPlainRecord(node) && typeof node.label === "string" && node.label.length > 0 ? node.label : "value";
  const wrapped = placeAt(enclosingNode, target.template, node, recordKey) as Record<string, unknown>;
  const itemPrefixLength = target.template.indexOf(ARRAY_ITEM) + 1;
  if (itemPrefixLength === 0) {
    return wrapped;
  }
  const relativePath = target.template.map((segment) => (segment === ARRAY_ITEM ? 0 : segment));
  return fillRequiredItemSiblings(
    wrapped,
    enclosingNode.transformerType,
    relativePath,
    target,
    itemPrefixLength,
    options.slotDefault,
    transformerDefinitions,
    "wrapTransformerNode",
  ) as Record<string, unknown>;
}

/**
 * `owner` (a transformer of `ownerType`) where the array item of `slot` holding `relativePath` gets
 * `slotDefault` in its other required slots that are still empty (`whens[].then` next to
 * `whens[].when`). `itemPrefixLength` is the length of the slot template up to that item.
 */
function fillRequiredItemSiblings(
  owner: unknown,
  ownerType: string,
  relativePath: (string | number)[],
  slot: TransformerSlot,
  itemPrefixLength: number,
  slotDefault: unknown,
  transformerDefinitions: Record<string, TransformerDefinition>,
  functionName: string,
): unknown {
  const itemPrefix = slot.template.slice(0, itemPrefixLength);
  const itemPath = relativePath.slice(0, itemPrefixLength);
  const siblingSlots = transformerSlots(ownerType, transformerDefinitions).filter(
    (candidate) =>
      candidate.name !== slot.name &&
      !candidate.optional &&
      slotName(candidate.template.slice(0, itemPrefixLength)) === slotName(itemPrefix) &&
      !candidate.template.slice(itemPrefixLength).some((segment) => segment === ARRAY_ITEM || segment === RECORD_VALUE),
  );
  return siblingSlots.reduce((result, sibling) => {
    const siblingPath = [...itemPath, ...sibling.template.slice(itemPrefixLength)];
    if (valueAt(result, siblingPath) !== undefined) {
      return result;
    }
    if (slotDefault === undefined) {
      throw new Error(`${functionName}: ${sibling.name} is required and no slotDefault was given`);
    }
    return updateAt(result, siblingPath, () => slotDefault);
  }, owner);
}

/** Put `node` in the `applyTo` of `enclosingNode` (Pipe into, D14). */
export function pipeTransformerNode(
  node: unknown,
  enclosingNode: Record<string, unknown>,
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): Record<string, unknown> {
  if (!isTransformerNode(enclosingNode)) {
    throw new Error("pipeTransformerNode: the enclosing node has no transformerType");
  }
  if (!transformerSlots(enclosingNode.transformerType, transformerDefinitions).some((slot) => slot.isApplyTo)) {
    throw new Error(`pipeTransformerNode: ${enclosingNode.transformerType} has no applyTo`);
  }
  return { ...enclosingNode, [APPLY_TO]: node };
}

/** Values found in `value` along `template`, with their concrete paths. */
function valuesAlong(
  value: unknown,
  template: string[],
  path: (string | number)[],
): { path: (string | number)[]; value: unknown }[] {
  if (template.length === 0) {
    return value === undefined ? [] : [{ path, value }];
  }
  const [head, ...rest] = template;
  if (head === ARRAY_ITEM) {
    return Array.isArray(value) ? value.flatMap((item, index) => valuesAlong(item, rest, [...path, index])) : [];
  }
  if (head === RECORD_VALUE) {
    return isPlainRecord(value)
      ? Object.entries(value).flatMap(([key, item]) => valuesAlong(item, rest, [...path, key]))
      : [];
  }
  return isPlainRecord(value) ? valuesAlong(value[head], rest, [...path, head]) : [];
}

/** The typed transformers sitting in the slots of `node`, in slot order (D3). */
export function transformerChildren(
  node: unknown,
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): TransformerChild[] {
  if (!isTransformerNode(node)) {
    return [];
  }
  return transformerSlots(node.transformerType, transformerDefinitions).flatMap((slot) =>
    valuesAlong(node, slot.template, [])
      .filter((found) => isTransformerNode(found.value))
      .map((found) => ({
        path: found.path,
        slot: slot.name,
        transformerType: (found.value as TransformerNode).transformerType,
      })),
  );
}

function valueAt(value: unknown, path: (string | number)[]): unknown {
  return path.reduce<unknown>(
    (current, segment) =>
      Array.isArray(current) || isPlainRecord(current) ? (current as Record<string, unknown>)[segment] : undefined,
    value,
  );
}

/** Replace `node` by its typed child at `childPath` (D3). */
export function unwrapTransformerNode(
  node: unknown,
  childPath: (string | number)[],
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): unknown {
  const isChild = transformerChildren(node, transformerDefinitions).some(
    (child) => child.path.length === childPath.length && child.path.every((segment, i) => String(segment) === String(childPath[i])),
  );
  if (!isChild) {
    throw new Error(`unwrapTransformerNode: no transformer child at ${childPath.join(".")}`);
  }
  return valueAt(node, childPath);
}

/** Copy of `value` with `update` applied to the container at `path` (an array or a record). */
function updateAt(
  value: unknown,
  path: (string | number)[],
  update: (container: unknown) => unknown,
): unknown {
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

function matchesTemplate(template: string[], relativePath: (string | number)[]): boolean {
  return (
    template.length === relativePath.length &&
    template.every((segment, index) => {
      const pathSegment = relativePath[index];
      if (segment === ARRAY_ITEM) {
        return typeof pathSegment === "number" || /^\d+$/.test(String(pathSegment));
      }
      if (segment === RECORD_VALUE) {
        return true;
      }
      return segment === String(pathSegment);
    })
  );
}

/** The slot of the nearest transformer above `path`, if `path` is one of its slot positions. */
function slotAtPath(
  root: unknown,
  path: (string | number)[],
  transformerDefinitions: Record<string, TransformerDefinition>,
): TransformerSlot | undefined {
  return slotPositionAtPath(root, path, transformerDefinitions)?.slot;
}

/**
 * Remove the subtree at `path` of `root`: an array item or a record entry is deleted, an optional
 * attribute is deleted, a required attribute gets `slotDefault`, and the root gets `rootDefault`.
 */
export function removeTransformerNode(
  root: unknown,
  path: (string | number)[],
  options: {
    rootDefault?: unknown;
    slotDefault?: unknown;
    transformerDefinitions?: Record<string, TransformerDefinition>;
  } = {},
): unknown {
  if (path.length === 0) {
    return options.rootDefault;
  }
  const transformerDefinitions = options.transformerDefinitions ?? applicationTransformerDefinitions;
  const slot = slotAtPath(root, path, transformerDefinitions);
  const key = path[path.length - 1];
  const last = slot?.template[slot.template.length - 1];
  const deletes = !slot || last === ARRAY_ITEM || last === RECORD_VALUE || slot.optional;
  if (!deletes && options.slotDefault === undefined) {
    throw new Error(`removeTransformerNode: ${slot?.name} is required and no slotDefault was given`);
  }
  return updateAt(root, path.slice(0, -1), (container) => {
    if (Array.isArray(container)) {
      return container.filter((_, index) => index !== Number(key));
    }
    const record = isPlainRecord(container) ? container : {};
    if (deletes) {
      const { [String(key)]: _removed, ...kept } = record;
      return kept;
    }
    return { ...record, [key]: options.slotDefault };
  });
}

/** The nearest transformer above `path` with the slot `path` is a position of. */
function slotPositionAtPath(
  root: unknown,
  path: (string | number)[],
  transformerDefinitions: Record<string, TransformerDefinition>,
): { ownerLength: number; owner: TransformerNode; slot: TransformerSlot } | undefined {
  for (let ownerLength = path.length - 1; ownerLength >= 0; ownerLength--) {
    const owner = valueAt(root, path.slice(0, ownerLength));
    if (isTransformerNode(owner)) {
      const relativePath = path.slice(ownerLength);
      const slot = transformerSlots(owner.transformerType, transformerDefinitions).find((candidate) =>
        matchesTemplate(candidate.template, relativePath),
      );
      return slot ? { ownerLength, owner, slot } : undefined;
    }
  }
  return undefined;
}

/** `base`, or `base2`, `base3`… : the first key `record` does not hold yet. */
function freeRecordKey(record: Record<string, unknown>, base: string): string {
  if (!(base in record)) {
    return base;
  }
  let suffix = 2;
  while (`${base}${suffix}` in record) {
    suffix++;
  }
  return `${base}${suffix}`;
}

/** `value` with `node` put at `relativePath`, which follows `template`; arrays and records are created. */
function putAlong(value: unknown, relativePath: (string | number)[], template: string[], node: unknown): unknown {
  const [segment, ...restPath] = relativePath;
  const [kind, ...restTemplate] = template;
  if (kind === ARRAY_ITEM) {
    const array = Array.isArray(value) ? value : [];
    const index = Number(segment);
    if (!Number.isInteger(index) || index < 0 || index > array.length) {
      throw new Error(`insertTransformerNode: no position ${String(segment)} in a list of ${array.length}`);
    }
    if (restPath.length === 0) {
      return [...array.slice(0, index), node, ...array.slice(index)];
    }
    const copy = [...array];
    copy[index] = putAlong(array[index], restPath, restTemplate, node);
    return copy;
  }
  const record = isPlainRecord(value) ? value : {};
  const key = kind === RECORD_VALUE && restPath.length === 0 ? freeRecordKey(record, String(segment)) : String(segment);
  return { ...record, [key]: restPath.length === 0 ? node : putAlong(record[key], restPath, restTemplate, node) };
}

/**
 * Put `node` at `path` of `root`, a position of a slot (#500): a list position is inserted before
 * the item there (the list length appends), a record key that is taken gets a number suffix, an
 * attribute is set, replacing what it held. A new array item gets `slotDefault` in its other
 * required slots. A missing root gets `node`.
 */
export function insertTransformerNode(
  root: unknown,
  path: (string | number)[],
  node: unknown,
  options: {
    slotDefault?: unknown;
    transformerDefinitions?: Record<string, TransformerDefinition>;
  } = {},
): unknown {
  if (path.length === 0) {
    if (root !== undefined) {
      throw new Error("insertTransformerNode: the root is taken");
    }
    return node;
  }
  const transformerDefinitions = options.transformerDefinitions ?? applicationTransformerDefinitions;
  const position = slotPositionAtPath(root, path, transformerDefinitions);
  if (!position) {
    throw new Error(`insertTransformerNode: ${path.join(".")} is not a slot of a transformer`);
  }
  const { ownerLength, owner, slot } = position;
  const relativePath = path.slice(ownerLength);
  const placed = putAlong(owner, relativePath, slot.template, node);
  const lastItem = slot.template.lastIndexOf(ARRAY_ITEM);
  const filled =
    lastItem >= 0 && lastItem < slot.template.length - 1
      ? fillRequiredItemSiblings(
          placed,
          owner.transformerType,
          relativePath,
          slot,
          lastItem + 1,
          options.slotDefault,
          transformerDefinitions,
          "insertTransformerNode",
        )
      : placed;
  return updateAt(root, path.slice(0, ownerLength), () => filled);
}

function isPrefixOf(prefix: (string | number)[], path: (string | number)[]): boolean {
  return prefix.length <= path.length && prefix.every((segment, index) => String(segment) === String(path[index]));
}

/**
 * Move the subtree at `from` of `root` to the slot position `to` (#500), in one value: `from` is
 * removed as `removeTransformerNode` does (a required slot gets `slotDefault`), then the subtree is
 * inserted as `insertTransformerNode` does, at the position `to` names before the move.
 */
export function moveTransformerNode(
  root: unknown,
  from: (string | number)[],
  to: (string | number)[],
  options: {
    slotDefault?: unknown;
    transformerDefinitions?: Record<string, TransformerDefinition>;
  } = {},
): unknown {
  if (from.length === 0) {
    throw new Error("moveTransformerNode: the root cannot move");
  }
  if (isPrefixOf(from, to)) {
    throw new Error("moveTransformerNode: a node cannot move into itself");
  }
  const node = valueAt(root, from);
  if (node === undefined) {
    throw new Error(`moveTransformerNode: nothing at ${from.join(".")}`);
  }
  const removed = removeTransformerNode(root, from, options);
  // removing a list item shifts the later items of that list
  const listPath = from.slice(0, -1);
  const fromIndex = Number(from[from.length - 1]);
  const shifts =
    Array.isArray(valueAt(root, listPath)) &&
    to.length > listPath.length &&
    isPrefixOf(listPath, to) &&
    Number(to[listPath.length]) > fromIndex;
  const target = shifts
    ? [...listPath, Number(to[listPath.length]) - 1, ...to.slice(listPath.length + 1)]
    : to;
  return insertTransformerNode(removed, target, node, options);
}

/** Move the list item at `path` of `root` so that it ends at `toIndex` of its list (#500). */
export function reorderTransformerNode(root: unknown, path: (string | number)[], toIndex: number): unknown {
  const list = valueAt(root, path.slice(0, -1));
  const fromIndex = Number(path[path.length - 1]);
  if (!Array.isArray(list) || !Number.isInteger(fromIndex) || fromIndex < 0 || fromIndex >= list.length) {
    throw new Error(`reorderTransformerNode: ${path.join(".")} is not a list item`);
  }
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= list.length) {
    throw new Error(`reorderTransformerNode: no position ${toIndex} in a list of ${list.length}`);
  }
  return updateAt(root, path.slice(0, -1), () => {
    const rest = list.filter((_, index) => index !== fromIndex);
    return [...rest.slice(0, toIndex), list[fromIndex], ...rest.slice(toIndex)];
  });
}

/** A fresh path along `template`: a new list starts at 0, a new record entry is named `value`. */
function freshPath(template: string[]): (string | number)[] {
  return template.map((segment) => (segment === ARRAY_ITEM ? 0 : segment === RECORD_VALUE ? "value" : segment));
}

/** The insert positions of `value` along `template`, at `path`; one new item or entry per list or record. */
function positionsAlong(
  value: unknown,
  template: string[],
  path: (string | number)[],
  positions: Map<string, TransformerInsertPosition>,
): void {
  if (template.length === 0) {
    if (value === undefined) {
      positions.set(path.join("."), { path, container: path, kind: "slot" });
    }
    return;
  }
  const [head, ...rest] = template;
  if (head === ARRAY_ITEM || head === RECORD_VALUE) {
    const isList = head === ARRAY_ITEM;
    const entries: [string | number, unknown][] = isList
      ? (Array.isArray(value) ? value : []).map((item, index) => [index, item])
      : Object.entries(isPlainRecord(value) ? value : {});
    for (const [key, item] of entries) {
      positionsAlong(item, rest, [...path, key], positions);
    }
    const containerKey = `${path.join(".")}:new`;
    if (!positions.has(containerKey)) {
      // a new record entry is named as the insert names it, so its scope (#501) is that of the new entry
      positions.set(containerKey, {
        path: [
          ...path,
          isList ? entries.length : freeRecordKey(isPlainRecord(value) ? value : {}, "value"),
          ...freshPath(rest),
        ],
        container: path,
        kind: isList ? "listEnd" : "recordEntry",
      });
    }
    return;
  }
  positionsAlong(isPlainRecord(value) ? value[head] : undefined, rest, [...path, head], positions);
}

/**
 * Where a new node can go in `root` (#500): the root when there is none, every empty slot of
 * every transformer, one new item per list slot and one new entry per record slot. A transformer's
 * positions come in slot order, before those of its children. A list of item slots (`whens[].when`,
 * `whens[].then`) gets its new item in the first.
 */
export function transformerInsertPositions(
  root: unknown,
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): TransformerInsertPosition[] {
  if (root === undefined) {
    return [{ path: [], container: [], kind: "slot" }];
  }
  const positions = new Map<string, TransformerInsertPosition>();
  const visit = (node: unknown, path: (string | number)[]) => {
    if (!isTransformerNode(node)) {
      return;
    }
    for (const slot of transformerSlots(node.transformerType, transformerDefinitions)) {
      positionsAlong(node, slot.template, path, positions);
    }
    for (const child of transformerChildren(node, transformerDefinitions)) {
      visit(valueAt(node, child.path), [...path, ...child.path]);
    }
  };
  visit(root, []);
  return [...positions.values()];
}

/** Schemas of the attributes a transformer type declares, its `extend` clauses included. */
export function declaredAttributeSchemas(
  transformerType: string,
  modelEnvironment: MiroirModelEnvironment,
  transformerDefinitions: Record<string, TransformerDefinition>,
): Record<string, MlElement> {
  const schema = parameterSchemaOf(transformerType, transformerDefinitions);
  if (schema?.type !== "object") {
    return {};
  }
  const object = schema as MlObject;
  const extendClauses = object.extend === undefined ? [] : Array.isArray(object.extend) ? object.extend : [object.extend];
  const extended = extendClauses.flatMap((clause) => {
    if (!clause) {
      return [];
    }
    try {
      const resolved = resolveMlSchemaReferenceInContext(clause as MlReference, {}, modelEnvironment);
      return resolved.type === "object" ? Object.entries(resolved.definition ?? {}) : [];
    } catch {
      return [];
    }
  });
  return { ...Object.fromEntries(extended), ...(object.definition as Record<string, MlElement>) };
}

/**
 * `schema` with its transformer references replaced by `any`: the `transformer` schema of the
 * model is the narrow legacy union (`objectTransformer`, `recordOfTransformers`), while a
 * transformer position holds any transformer. The transformers found there are checked apart.
 */
function withTransformerPositionsAsAny(schema: MlElement): MlElement {
  switch (schema.type) {
    case "schemaReference": {
      const relativePath = (schema as MlReference).definition?.relativePath;
      return relativePath && TRANSFORMER_SCHEMA_NAMES.has(relativePath)
        ? ({ type: "any", optional: schema.optional } as MlElement)
        : schema;
    }
    case "object":
      return {
        ...schema,
        definition: Object.fromEntries(
          Object.entries((schema as MlObject).definition ?? {}).map(([key, value]) => [
            key,
            withTransformerPositionsAsAny(value as MlElement),
          ]),
        ),
      } as MlElement;
    case "array":
    case "record":
      return { ...schema, definition: withTransformerPositionsAsAny(schema.definition as MlElement) } as MlElement;
    case "union":
      return {
        ...schema,
        definition: (schema.definition as MlElement[]).map((member) => withTransformerPositionsAsAny(member)),
      } as MlElement;
    default:
      return schema;
  }
}

/** True when `value` fits `attribute` of `transformerType` (D4). */
function attributeAccepts(
  transformerType: string,
  attribute: string,
  attributeSchema: MlElement,
  value: unknown,
  modelEnvironment: MiroirModelEnvironment,
  transformerDefinitions: Record<string, TransformerDefinition>,
): boolean {
  let shapeAccepted: boolean;
  try {
    shapeAccepted =
      mlsTypeCheck(withTransformerPositionsAsAny(attributeSchema), value, [attribute], [attribute], modelEnvironment, {})
        .status === "ok";
  } catch {
    shapeAccepted = false;
  }
  if (!shapeAccepted) {
    return false;
  }
  // the transformers at the attribute's transformer positions must be known types
  return transformerSlots(transformerType, transformerDefinitions)
    .filter((slot) => slot.template[0] === attribute)
    .every((slot) =>
      valuesAlong(value, slot.template.slice(1), []).every(
        (found) => !isTransformerNode(found.value) || found.value.transformerType in transformerDefinitions,
      ),
    );
}

/**
 * The node a type change produces (D4): `newNode` (the default value of the new type) with every
 * attribute of `oldNode` that the new type declares and whose value type-checks against it, plus
 * `label` and `interpolation`. `dropped` lists the other attributes of `oldNode`.
 */
export function keepAttributesOnTypeChange(
  oldNode: Record<string, unknown>,
  newNode: Record<string, unknown>,
  modelEnvironment: MiroirModelEnvironment,
  transformerDefinitions: Record<string, TransformerDefinition> = transformerDefinitionRegistry(modelEnvironment),
): TransformerTypeChange {
  if (!isTransformerNode(newNode)) {
    throw new Error("keepAttributesOnTypeChange: the new node has no transformerType");
  }
  const declared = declaredAttributeSchemas(newNode.transformerType, modelEnvironment, transformerDefinitions);
  const kept: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [attribute, value] of Object.entries(oldNode)) {
    if (attribute === "transformerType" || value === undefined) {
      continue;
    }
    if (COMMON_TRANSFORMER_ATTRIBUTES.has(attribute)) {
      kept[attribute] = value;
      continue;
    }
    const attributeSchema = declared[attribute];
    const accepted =
      attributeSchema !== undefined &&
      attributeAccepts(newNode.transformerType, attribute, attributeSchema, value, modelEnvironment, transformerDefinitions);
    if (accepted) {
      kept[attribute] = value;
    } else {
      dropped.push(attribute);
    }
  }
  return { node: { ...newNode, ...kept, transformerType: newNode.transformerType }, dropped };
}

/**
 * The attributes of `attributes` whose value in `node` differs from the one in `defaultNode`, the
 * node the editor builds for `node`'s type (#447). A type change that drops only attributes still
 * holding these defaults loses nothing the user wrote.
 */
export function editedAttributes(
  node: Record<string, unknown>,
  defaultNode: Record<string, unknown>,
  attributes: string[],
): string[] {
  return attributes.filter((attribute) => !equal(node[attribute], defaultNode[attribute]));
}

/**
 * Whether one of `defaultNodes`, the nodes the editor may have filled in at `node`'s place, holds the
 * value of `node` for every attribute of `attributes` (#447). Each attribute matching some default is
 * not enough: an edited value can equal the default of another source, such as a root value edited to
 * the `0` of the slot default while it keeps the type default's `mlSchema`.
 */
export function holdsOneDefault(
  node: Record<string, unknown>,
  defaultNodes: Record<string, unknown>[],
  attributes: string[],
): boolean {
  return defaultNodes.some((defaultNode) => editedAttributes(node, defaultNode, attributes).length === 0);
}

/**
 * Paths of the `getFromParameters` nodes of `node` that read `defaultInput`: after a wrap in a
 * list transformer they still read the whole input, since only the context is rebound (D15).
 */
export function parameterReadsOfDefaultInput(
  node: unknown,
  path: (string | number)[] = [],
): (string | number)[][] {
  if (Array.isArray(node)) {
    return node.flatMap((item, index) => parameterReadsOfDefaultInput(item, [...path, index]));
  }
  if (!isPlainRecord(node)) {
    return [];
  }
  const readsDefaultInput =
    node.transformerType === "getFromParameters" &&
    (node.referenceName === defaultTransformerInput ||
      (Array.isArray(node.referencePath) && node.referencePath[0] === defaultTransformerInput));
  const nested = Object.entries(node).flatMap(([key, value]) => parameterReadsOfDefaultInput(value, [...path, key]));
  return readsDefaultInput ? [path, ...nested] : nested;
}

/**
 * Paths, from `node`, of the `getFromParameters` reads of `defaultInput` in the element slot of a
 * list transformer (`mapList`, `filterList`, `find`): they read the whole input, not each
 * element (D15). `applyTo` is not an element slot.
 */
export function elementParameterReadsOfDefaultInput(node: unknown): (string | number)[][] {
  if (!isTransformerNode(node)) {
    return [];
  }
  const elementSlot = LIST_ELEMENT_SLOTS[node.transformerType];
  return elementSlot ? parameterReadsOfDefaultInput(node[elementSlot], [elementSlot]) : [];
}

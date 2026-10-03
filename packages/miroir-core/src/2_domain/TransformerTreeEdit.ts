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
  TransformerSlot,
  TransformerTypeChange,
} from "../0_interfaces/2_domain/TransformerTreeEditInterface";
import { mlsTypeCheck } from "../1_core/mls/mlsTypeCheck";
import { resolveMlSchemaReferenceInContext } from "../1_core/mls/mlsResolveSchemaReferenceInContext";
import { transformerTypesAcceptingInput } from "./TransformerInterfaceCheck";
import { applicationTransformerDefinitions } from "./TransformersForRuntime";

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
 * node's `label`, else `value`.
 */
export function wrapTransformerNode(
  node: unknown,
  enclosingNode: Record<string, unknown>,
  slot?: string,
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): Record<string, unknown> {
  if (!isTransformerNode(enclosingNode)) {
    throw new Error("wrapTransformerNode: the enclosing node has no transformerType");
  }
  const target = slotOf(enclosingNode.transformerType, slot, transformerDefinitions);
  const recordKey =
    isPlainRecord(node) && typeof node.label === "string" && node.label.length > 0 ? node.label : "value";
  return placeAt(enclosingNode, target.template, node, recordKey) as Record<string, unknown>;
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
  for (let ownerLength = path.length - 1; ownerLength >= 0; ownerLength--) {
    const owner = valueAt(root, path.slice(0, ownerLength));
    if (isTransformerNode(owner)) {
      const relativePath = path.slice(ownerLength);
      return transformerSlots(owner.transformerType, transformerDefinitions).find((slot) =>
        matchesTemplate(slot.template, relativePath),
      );
    }
  }
  return undefined;
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

/** Schemas of the attributes a transformer type declares, its `extend` clauses included. */
function declaredAttributeSchemas(
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
 * The node a type change produces (D4): `newNode` (the default value of the new type) with every
 * attribute of `oldNode` that the new type declares and whose value type-checks against it, plus
 * `label` and `interpolation`. `dropped` lists the other attributes of `oldNode`.
 */
export function keepAttributesOnTypeChange(
  oldNode: Record<string, unknown>,
  newNode: Record<string, unknown>,
  modelEnvironment: MiroirModelEnvironment,
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
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
      mlsTypeCheck(attributeSchema, value, [attribute], [attribute], modelEnvironment, {}).status === "ok";
    if (accepted) {
      kept[attribute] = value;
    } else {
      dropped.push(attribute);
    }
  }
  return { node: { ...newNode, ...kept, transformerType: newNode.transformerType }, dropped };
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

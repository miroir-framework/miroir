import {
  inputOutputObject,
  type CoreTransformerForBuildPlusRuntime,
  type InputOutputObject,
  type InputOutputPayloadType,
  type InputOutputType,
  type MlElement,
  type TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultTransformerInput } from "../0_interfaces/1_core/Transformer";
import type {
  TransformerInterfaceCompatibility,
  TransformerInterfaceGivenTypes,
  TransformerInterfaceMismatch,
  TransformerInterfaceNodeReport,
  TransformerInterfaceTreeCompatibility,
  TransformerTypesAcceptingInput,
} from "../0_interfaces/2_domain/TransformerInterfaceCheckInterface";
import { isFailedTransformerInterfaceFromDefinition } from "../0_interfaces/2_domain/TransformerResultSchemaInterface";
import { inferTransformerOutputTypeFromSchema } from "./TransformerInterfaceInference";
import { liftInputOutputTypeToMlSchema } from "./TransformerMlSchemaCheck";
import {
  resolveTransformerResultSchema,
  type TransformerResultSchemaContext,
} from "./Transformer_ResultSchema";
import { applicationTransformerDefinitions } from "./TransformersForRuntime";

// ################################################################################################
// Issue #249 — transformer interface (`inputOutput`) adequacy checks.
//
// Compatibility is NOT a pure partial order: `any` is compatible with everything in both
// directions (lenient, confirmed in the feature analysis). The only strict subtyping rule is
// entity-uuid ⊂ object(-with-any-payload): an entity instance is accepted wherever an object is
// declared/expected, but a declared `object` output does NOT satisfy an entity-uuid expectation.
// ################################################################################################

const ENTITY_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type NormalizedInputOutputType =
  /** the six non-structured literals (any, undefined, bigint, number, string, boolean) */
  | { kind: "primitive"; value: string }
  | { kind: "entityUuid"; uuid: string }
  /** bare "object" / "array" literals normalize to this with payload "any" */
  | { kind: "object" | "array"; payload: InputOutputPayloadType };

function normalizeInputOutputType(type: InputOutputType): NormalizedInputOutputType {
  if (typeof type === "object") {
    return { kind: type.type, payload: type.payload ?? "any" };
  }
  if (type === "object" || type === "array") {
    return { kind: type, payload: "any" };
  }
  if (ENTITY_UUID_REGEX.test(type)) {
    return { kind: "entityUuid", uuid: type.toLowerCase() };
  }
  return { kind: "primitive", value: type };
}

type NormalizedPayloadType =
  | { kind: "any" }
  | { kind: "primitive"; value: string }
  | { kind: "entityUuid"; uuid: string };

function normalizePayloadType(payload: InputOutputPayloadType): NormalizedPayloadType {
  if (payload === "any") {
    return { kind: "any" };
  }
  if (ENTITY_UUID_REGEX.test(payload)) {
    return { kind: "entityUuid", uuid: payload.toLowerCase() };
  }
  return { kind: "primitive", value: payload };
}

function inputOutputPayloadsCompatible(
  actual: InputOutputPayloadType,
  expected: InputOutputPayloadType,
): boolean {
  const a = normalizePayloadType(actual);
  const e = normalizePayloadType(expected);
  if (a.kind === "any" || e.kind === "any") {
    return true;
  }
  if (a.kind === "entityUuid" || e.kind === "entityUuid") {
    return a.kind === "entityUuid" && e.kind === "entityUuid" && a.uuid === e.uuid;
  }
  return a.value === e.value;
}

/**
 * Lenient compatibility relation between two `inputOutput` types: is `actual` acceptable where
 * `expected` is wanted? Asymmetric only for entity uuids (entity uuid satisfies `object`,
 * not the reverse).
 */
export function inputOutputTypesCompatible(
  actual: InputOutputType,
  expected: InputOutputType,
): boolean {
  const a = normalizeInputOutputType(actual);
  const e = normalizeInputOutputType(expected);
  if ((a.kind === "primitive" && a.value === "any") || (e.kind === "primitive" && e.value === "any")) {
    return true;
  }
  switch (a.kind) {
    case "entityUuid":
      return (
        (e.kind === "entityUuid" && a.uuid === e.uuid) ||
        (e.kind === "object" && e.payload === "any")
      );
    case "primitive":
      return e.kind === "primitive" && e.value === a.value;
    case "object":
    case "array":
      return e.kind === a.kind && inputOutputPayloadsCompatible(a.payload, e.payload);
  }
}

/**
 * Adequacy of a transformer's declared `inputOutput` against the types its calling context
 * provides / expects. Input: the declared input must accept the given input — except when the
 * declared input is "undefined", meaning the transformer does not consume its piped input
 * (e.g. getFromContext), so any given input is acceptable. Output: the declared output must be
 * assignable to the expected output. An absent `inputOutput` means any/any
 * (never fails), so unannotated transformers stay unmarked.
 */
export function checkTransformerInterfaceCompatibility(
  given: TransformerInterfaceGivenTypes,
  declaredInputOutput: InputOutputObject | undefined,
): TransformerInterfaceCompatibility {
  const declared: InputOutputObject = declaredInputOutput ?? { input: "any", output: "any" };
  const failures: TransformerInterfaceMismatch[] = [];
  if (declared.input !== "undefined" && !inputOutputTypesCompatible(given.input, declared.input)) {
    failures.push({ direction: "input", given: given.input, declared: declared.input });
  }
  if (!inputOutputTypesCompatible(declared.output, given.output)) {
    failures.push({ direction: "output", given: given.output, declared: declared.output });
  }
  return failures.length === 0 ? { status: "ok" } : { status: "incompatible", failures };
}

/**
 * Declared `inputOutput` of the transformer definition registered for `transformerType`
 * (outmost `transformerType` of a transformer expression). Unknown types yield undefined,
 * which callers treat as any/any.
 */
export function getTransformerDefinitionInputOutput(
  transformerType: string,
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): InputOutputObject | undefined {
  return transformerDefinitions[transformerType]?.transformerInterface?.inputOutput;
}

/**
 * Names of stock transformer definitions whose declared `inputOutput` fails the (enhanced)
 * inputOutput schema. Definitions without `inputOutput` are fine (absent = any/any).
 * Deliberately scoped to `inputOutput`: full-definition validation surfaces pre-existing
 * unrelated debt (e.g. spreadSheetToMlSchema's transformerImplementation content).
 */
export function findInvalidStockTransformerInputOutputs(
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): string[] {
  return Object.entries(transformerDefinitions)
    .filter(([, definition]) => {
      const io = definition.transformerInterface?.inputOutput;
      return io !== undefined && !inputOutputObject.safeParse(io).success;
    })
    .map(([name]) => name)
    .sort();
}

/**
 * Declared `inputOutput` adequacy plus, when available, inferred actual output vs expected output.
 * The declared check alone misses transformers like `getFromContext` (`output: "any"`) whose
 * actual row output is the list entity type.
 */
export function checkTransformerInterfaceCompatibilityWithInference(
  given: TransformerInterfaceGivenTypes,
  declaredInputOutput: InputOutputObject | undefined,
  inferredOutputType?: InputOutputType,
): TransformerInterfaceCompatibility {
  const base = checkTransformerInterfaceCompatibility(given, declaredInputOutput);
  if (
    inferredOutputType === undefined ||
    inputOutputTypesCompatible(inferredOutputType, given.output)
  ) {
    return base;
  }
  const inferredFailure: TransformerInterfaceMismatch = {
    direction: "output",
    given: given.output,
    declared: inferredOutputType,
    source: "inferred",
  };
  if (base.status === "ok") {
    return { status: "incompatible", failures: [inferredFailure] };
  }
  return { status: "incompatible", failures: [...base.failures, inferredFailure] };
}

// ################################################################################################
// Issue #383 — the #249 check at every position of a transformer tree, and the transformer types
// a position offers. Unknown inputs are "any": a position is never wrongly restricted.
// ################################################################################################

/**
 * Does a transformer of type `transformerType` accept `consumedInput`? Declared input
 * "undefined" (the transformer does not consume its input), no `inputOutput` and unknown types
 * always accept.
 */
function transformerTypeAcceptsInput(
  transformerType: string,
  consumedInput: InputOutputType,
  transformerDefinitions: Record<string, TransformerDefinition>,
): boolean {
  const declared = getTransformerDefinitionInputOutput(transformerType, transformerDefinitions);
  return (
    declared === undefined ||
    declared.input === "undefined" ||
    inputOutputTypesCompatible(consumedInput, declared.input)
  );
}

/**
 * Split candidate transformer types into those offered for `consumedInput` and those hidden.
 * The current type stays offered even when incompatible, so an existing transformer still
 * displays and can be changed.
 */
export function transformerTypesAcceptingInput(
  consumedInput: InputOutputType,
  options: {
    transformerTypes?: string[];
    currentType?: string;
    transformerDefinitions?: Record<string, TransformerDefinition>;
  } = {},
): TransformerTypesAcceptingInput {
  const transformerDefinitions = options.transformerDefinitions ?? applicationTransformerDefinitions;
  const candidates = options.transformerTypes ?? Object.keys(transformerDefinitions);
  const offered: string[] = [];
  const hidden: string[] = [];
  for (const transformerType of candidates) {
    if (
      transformerType === options.currentType ||
      transformerTypeAcceptsInput(transformerType, consumedInput, transformerDefinitions)
    ) {
      offered.push(transformerType);
    } else {
      hidden.push(transformerType);
    }
  }
  return { offered, hidden };
}

type TypedTransformerNode = { transformerType: string } & Record<string, unknown>;

function isTypedTransformerNode(value: unknown): value is TypedTransformerNode {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { transformerType?: unknown }).transformerType === "string"
  );
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Coarse `inputOutput` type of a value: `array`, `object` or its primitive kind; `null` and
 * `undefined` give `any` (#383, root input of the TransformerEditor "here" mode).
 */
export function inputOutputTypeOfValue(value: unknown): InputOutputType {
  if (value === null || value === undefined) {
    return "any";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  switch (typeof value) {
    case "object":
      return "object";
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      return typeof value as InputOutputType;
    default:
      return "any";
  }
}

/** Element type of an array type; anything else gives `any`. */
function arrayElementInputOutputType(type: InputOutputType): InputOutputType {
  if (typeof type === "object" && type.type === "array") {
    return type.payload ?? "any";
  }
  return "any";
}

export interface TransformerInterfaceWalkOptions {
  transformerDefinitions?: Record<string, TransformerDefinition>;
  /** ML schemas of the entities known to the caller, by entity uuid (output inference, D8). */
  entityMlSchemas?: Record<string, MlElement>;
  /** Extra ML context bindings (e.g. `row` in the list transformer panel). */
  context?: TransformerResultSchemaContext;
}

interface WalkEnvironment {
  transformerDefinitions: Record<string, TransformerDefinition>;
  entityMlSchemas: Record<string, MlElement>;
  nodes: TransformerInterfaceNodeReport[];
}

/** A value bound in the walk: its coarse type and, for #88 inference, its ML schema. */
interface WalkValue {
  type: InputOutputType;
  schema: MlElement;
}

function walkValueOfType(type: InputOutputType, environment: WalkEnvironment): WalkValue {
  return { type, schema: liftInputOutputTypeToMlSchema(type, environment.entityMlSchemas) };
}

/** Output of a node: #88 inference converted to a coarse type, else the declared output (D8). */
function nodeOutput(
  transformer: TypedTransformerNode,
  declared: InputOutputObject | undefined,
  context: TransformerResultSchemaContext,
  environment: WalkEnvironment,
): WalkValue {
  const resolved = resolveTransformerResultSchema(
    transformer as unknown as CoreTransformerForBuildPlusRuntime,
    context,
    environment.transformerDefinitions,
  );
  if (!isFailedTransformerInterfaceFromDefinition(resolved)) {
    return {
      type: inferTransformerOutputTypeFromSchema(resolved, {
        entityMlSchemas: environment.entityMlSchemas,
      }),
      schema: resolved,
    };
  }
  return walkValueOfType(declared?.output ?? "any", environment);
}

const SKIP_WALK_KEYS = new Set(["transformerType", "interpolation", "mlSchema", "applyTo"]);
const LIST_ELEMENT_SLOTS: Record<string, string> = {
  mapList: "elementTransformer",
  filterList: "predicate",
  find: "predicate",
};

function walkNode(
  transformer: TypedTransformerNode,
  path: (string | number)[],
  given: WalkValue,
  context: TransformerResultSchemaContext,
  environment: WalkEnvironment,
): { report: TransformerInterfaceNodeReport; output: WalkValue } {
  const declared = getTransformerDefinitionInputOutput(
    transformer.transformerType,
    environment.transformerDefinitions,
  );
  const output = nodeOutput(transformer, declared, context, environment);
  const report: TransformerInterfaceNodeReport = {
    path,
    transformerType: transformer.transformerType,
    givenInput: given.type,
    consumedInput: given.type,
    declared,
    output: output.type,
    failures: [],
  };
  environment.nodes.push(report);

  // D1: a node consumes its own applyTo when it has one.
  let consumed: WalkValue = given;
  if (isTypedTransformerNode(transformer.applyTo)) {
    consumed = walkNode(transformer.applyTo, [...path, "applyTo"], given, context, environment).output;
  } else if (transformer.applyTo !== undefined) {
    consumed = walkValueOfType(inputOutputTypeOfValue(transformer.applyTo), environment);
  }
  report.consumedInput = consumed.type;

  walkChildren(transformer, path, given, consumed, context, environment);
  return { report, output };
}

/** Context binding of a value under `referenceToOuterObject`, else as `defaultInput` (D9). */
function bindOuterValue(
  transformer: TypedTransformerNode,
  given: WalkValue,
  bound: WalkValue,
  context: TransformerResultSchemaContext,
): { given: WalkValue; context: TransformerResultSchemaContext } {
  const outerName = transformer.referenceToOuterObject;
  if (typeof outerName === "string" && outerName.length > 0) {
    return { given, context: { ...context, [outerName]: bound.schema } };
  }
  return { given: bound, context: { ...context, [defaultTransformerInput]: bound.schema } };
}

/** Slot rules follow the runtime binding of `defaultInput` (D9, analysis §4.3). */
function walkChildren(
  transformer: TypedTransformerNode,
  path: (string | number)[],
  given: WalkValue,
  consumed: WalkValue,
  context: TransformerResultSchemaContext,
  environment: WalkEnvironment,
): void {
  const handledKeys = new Set<string>(SKIP_WALK_KEYS);
  const transformerType = transformer.transformerType;

  const elementSlot = LIST_ELEMENT_SLOTS[transformerType];
  if (elementSlot && isTypedTransformerNode(transformer[elementSlot])) {
    const element = walkValueOfType(arrayElementInputOutputType(consumed.type), environment);
    const binding = bindOuterValue(transformer, given, element, context);
    walkNode(
      transformer[elementSlot] as TypedTransformerNode,
      [...path, elementSlot],
      binding.given,
      binding.context,
      environment,
    );
    handledKeys.add(elementSlot);
  }

  if (transformerType === "createObjectFromPairs" || transformerType === "mergeIntoObject") {
    const bound =
      transformer.applyTo === undefined && transformerType === "createObjectFromPairs"
        ? walkValueOfType("object", environment)
        : consumed;
    const binding = bindOuterValue(transformer, given, bound, context);
    walkNested(transformer.definition, [...path, "definition"], binding.given, binding.context, environment);
    handledKeys.add("definition");
  }

  if (transformerType === "dataflowObject" && isPlainRecord(transformer.definition)) {
    let stepContext: TransformerResultSchemaContext = { ...context };
    for (const [stepName, step] of Object.entries(transformer.definition)) {
      if (!isTypedTransformerNode(step)) {
        continue;
      }
      const { output } = walkNode(step, [...path, "definition", stepName], given, stepContext, environment);
      stepContext = { ...stepContext, [stepName]: output.schema };
    }
    handledKeys.add("definition");
  }

  for (const [key, value] of Object.entries(transformer)) {
    if (!handledKeys.has(key)) {
      walkNested(value, [...path, key], given, context, environment);
    }
  }
}

/** Walk every typed transformer found in `value` (directly, in arrays or in plain records). */
function walkNested(
  value: unknown,
  path: (string | number)[],
  given: WalkValue,
  context: TransformerResultSchemaContext,
  environment: WalkEnvironment,
): void {
  if (isTypedTransformerNode(value)) {
    walkNode(value, path, given, context, environment);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkNested(item, [...path, index], given, context, environment));
    return;
  }
  if (isPlainRecord(value)) {
    for (const [key, nested] of Object.entries(value)) {
      walkNested(nested, [...path, key], given, context, environment);
    }
  }
}

/**
 * #249 check at every typed node of `transformer`, given the root input type. One report per
 * node, in tree order (a node before its `applyTo`, then its other slots).
 */
export function checkTransformerInterfaceRecursively(
  transformer: unknown,
  rootInput: InputOutputType,
  options: TransformerInterfaceWalkOptions = {},
): TransformerInterfaceTreeCompatibility {
  const environment: WalkEnvironment = {
    transformerDefinitions: options.transformerDefinitions ?? applicationTransformerDefinitions,
    entityMlSchemas: options.entityMlSchemas ?? {},
    nodes: [],
  };
  if (isTypedTransformerNode(transformer)) {
    const root = walkValueOfType(rootInput, environment);
    walkNode(transformer, [], root, { ...options.context, [defaultTransformerInput]: root.schema }, environment);
  }
  const nodes = environment.nodes;
  return {
    status:
      nodes.length === 0
        ? "unchecked"
        : nodes.some((node) => node.failures.length > 0)
          ? "incompatible"
          : "ok",
    nodes,
  };
}

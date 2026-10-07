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
  TransformerInterfaceLiteralReport,
  TransformerInterfaceMismatch,
  TransformerInterfaceNodeReport,
  TransformerInterfaceTreeCompatibility,
  TransformerNodeTypeStatus,
  TransformerTypesAcceptingInput,
} from "../0_interfaces/2_domain/TransformerInterfaceCheckInterface";
import { isFailedTransformerInterfaceFromDefinition } from "../0_interfaces/2_domain/TransformerResultSchemaInterface";
import { inferTransformerOutputTypeFromSchema, inputOutputTypeParameter } from "./TransformerInterfaceInference";
import { liftInputOutputTypeToMlSchema } from "./TransformerMlSchemaCheck";
import {
  resolveTransformerResultSchema,
  type TransformerResultSchemaContext,
} from "./Transformer_ResultSchema";
import { applicationTransformerDefinitions } from "./TransformersForRuntime";

// ################################################################################################
// Issue #249 — transformer interface (`inputOutput`) adequacy checks; #449 — array, record and
// tuple type parameters.
//
// Compatibility is NOT a pure partial order: `any` is compatible with everything in both
// directions (lenient, confirmed in the feature analysis). Otherwise (#449 analysis §3.1):
// - an entity instance is an `object` and a `record<any>`, but an `object` is not an entity;
// - a `record<P>` is an `object`, an `object` is only a `record<any>`;
// - a `tuple<P1..Pn>` is an `array<Q>` when every Pi is a Q, an array is never a tuple;
// - type parameters follow the same rules, element-wise for tuples.
// ################################################################################################

const ENTITY_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Normalized `inputOutput` type; bare `array` / `record` get the type parameter `any`. */
type CoarseType =
  | { kind: "any" }
  /** undefined, bigint, number, string, boolean (an unknown literal only matches itself) */
  | { kind: "primitive"; value: string }
  | { kind: "object" }
  | { kind: "entity"; uuid: string }
  | { kind: "array" | "record"; parameter: CoarseType }
  | { kind: "tuple"; elements: CoarseType[] };

const ANY_TYPE: CoarseType = { kind: "any" };

/** A type parameter that is itself an array, record or tuple is `any` (#449 D3, no nesting). */
function normalizeInputOutputType(
  type: InputOutputType | InputOutputPayloadType,
  isParameter = false,
): CoarseType {
  if (typeof type === "object") {
    if (isParameter) {
      return ANY_TYPE;
    }
    if (type.type === "tuple") {
      return { kind: "tuple", elements: type.payload.map((element) => normalizeInputOutputType(element, true)) };
    }
    return { kind: type.type, parameter: normalizeInputOutputType(type.payload ?? "any", true) };
  }
  switch (type) {
    case "any":
      return ANY_TYPE;
    case "object":
      return { kind: "object" };
    case "array":
    case "record":
      return isParameter ? ANY_TYPE : { kind: type, parameter: ANY_TYPE };
    default:
      return ENTITY_UUID_REGEX.test(type)
        ? { kind: "entity", uuid: type.toLowerCase() }
        : { kind: "primitive", value: type };
  }
}

function coarseTypesCompatible(actual: CoarseType, expected: CoarseType): boolean {
  if (actual.kind === "any" || expected.kind === "any") {
    return true;
  }
  switch (expected.kind) {
    case "primitive":
      return actual.kind === "primitive" && actual.value === expected.value;
    case "object":
      return actual.kind === "object" || actual.kind === "entity" || actual.kind === "record";
    case "entity":
      return actual.kind === "entity" && actual.uuid === expected.uuid;
    case "record":
      if (actual.kind === "record") {
        return coarseTypesCompatible(actual.parameter, expected.parameter);
      }
      return (actual.kind === "object" || actual.kind === "entity") && expected.parameter.kind === "any";
    case "array":
      if (actual.kind === "array") {
        return coarseTypesCompatible(actual.parameter, expected.parameter);
      }
      return (
        actual.kind === "tuple" &&
        actual.elements.every((element) => coarseTypesCompatible(element, expected.parameter))
      );
    case "tuple":
      return (
        actual.kind === "tuple" &&
        actual.elements.length === expected.elements.length &&
        actual.elements.every((element, index) => coarseTypesCompatible(element, expected.elements[index]))
      );
  }
}

/**
 * Lenient compatibility relation between two `inputOutput` types: is `actual` acceptable where
 * `expected` is wanted? See the rules above.
 */
export function inputOutputTypesCompatible(
  actual: InputOutputType,
  expected: InputOutputType,
): boolean {
  return coarseTypesCompatible(normalizeInputOutputType(actual), normalizeInputOutputType(expected));
}

/**
 * Human-readable label of an `inputOutput` type (#453, #449 G4): a known entity uuid gives the
 * entity name, type parameters follow their type, `array<Book>`, `record<string>`,
 * `tuple<string, Book>`. With `shortenUnknownUuids` (#453 D18), an unknown entity uuid gives its
 * first 8 characters.
 */
export function formatInputOutputTypeLabel(
  type: InputOutputType,
  entities?: { uuid: string; name?: string }[],
  options?: { shortenUnknownUuids?: boolean },
): string {
  const label = (element: InputOutputType) => formatInputOutputTypeLabel(element, entities, options);
  if (typeof type === "object") {
    return type.type === "tuple"
      ? `tuple<${type.payload.map(label).join(", ")}>`
      : `${type.type}<${label(type.payload ?? "any")}>`;
  }
  const entityName = entities?.find((entity) => entity.uuid === type)?.name;
  if (entityName) {
    return entityName;
  }
  return options?.shortenUnknownUuids && ENTITY_UUID_REGEX.test(type) ? type.slice(0, 8) : type;
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

/** The type parameter common to `types`, `any` when they differ or there are none (#449 D3). */
function commonTypeParameter(types: InputOutputType[]): InputOutputPayloadType {
  const parameters = types.map(inputOutputTypeParameter);
  return parameters.length > 0 && parameters.every((parameter) => parameter === parameters[0])
    ? parameters[0]
    : "any";
}

/**
 * Coarse `inputOutput` type of a value: its primitive kind; an object with a uuid `parentUuid` is
 * an instance of that entity, any other object is `object`; an array has the common type of its
 * elements as type parameter (`any` when they differ), an empty array is `array`; `null` and
 * `undefined` give `any` (#383, root input of the TransformerEditor; #453 D15; #449 §3.2).
 */
export function inputOutputTypeOfValue(value: unknown): InputOutputType {
  if (value === null || value === undefined) {
    return "any";
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "array";
    }
    return { type: "array", payload: commonTypeParameter(value.map(inputOutputTypeOfValue)) };
  }
  switch (typeof value) {
    case "object": {
      const parentUuid = (value as { parentUuid?: unknown }).parentUuid;
      return typeof parentUuid === "string" && ENTITY_UUID_REGEX.test(parentUuid) ? parentUuid : "object";
    }
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      return typeof value as InputOutputType;
    default:
      return "any";
  }
}

/** Element of an array value: its element schema when known, else lifted from the coarse type. */
function arrayElementValue(array: WalkValue, environment: WalkEnvironment): WalkValue {
  const type = arrayElementInputOutputType(array.type);
  const definition = (array.schema as { type?: string; definition?: unknown }).definition;
  if (
    array.schema.type === "array" &&
    definition &&
    typeof definition === "object" &&
    !Array.isArray(definition) &&
    "type" in definition
  ) {
    return { type, schema: definition as MlElement };
  }
  return walkValueOfType(type, environment);
}

/**
 * Element type of an array type, or the common element type of a tuple (#449 §3.2); anything else
 * gives `any`.
 */
function arrayElementInputOutputType(type: InputOutputType): InputOutputType {
  if (typeof type !== "object") {
    return "any";
  }
  switch (type.type) {
    case "array":
      return type.payload ?? "any";
    case "tuple":
      return commonTypeParameter(type.payload);
    default:
      return "any";
  }
}

export interface TransformerInterfaceWalkOptions {
  transformerDefinitions?: Record<string, TransformerDefinition>;
  /** ML schemas of the entities known to the caller, by entity uuid (output inference, D8). */
  entityMlSchemas?: Record<string, MlElement>;
  /**
   * Extra ML context bindings (e.g. `row` in the list transformer panel). A `defaultInput` entry
   * replaces the default binding of the root input.
   */
  context?: TransformerResultSchemaContext;
  /** #501: report the ML schemas of the context names each node sees (variable path pickers). */
  withContext?: boolean;
}

interface WalkEnvironment {
  transformerDefinitions: Record<string, TransformerDefinition>;
  entityMlSchemas: Record<string, MlElement>;
  withContext: boolean;
  nodes: TransformerInterfaceNodeReport[];
  literals: TransformerInterfaceLiteralReport[];
}

/** A value bound in the walk: its coarse type and, for #88 inference, its ML schema. */
interface WalkValue {
  type: InputOutputType;
  schema: MlElement;
}

function walkValueOfType(type: InputOutputType, environment: WalkEnvironment): WalkValue {
  return { type, schema: liftInputOutputTypeToMlSchema(type, environment.entityMlSchemas) };
}

/**
 * Output of a node: #88 inference converted to a coarse type, else the declared output (D8). A
 * `returnValue` without `mlSchema` has the type of its `value` (#453 D12), which #88 leaves `any`.
 */
function nodeOutput(
  transformer: TypedTransformerNode,
  declared: InputOutputObject | undefined,
  context: TransformerResultSchemaContext,
  environment: WalkEnvironment,
): WalkValue {
  if (transformer.transformerType === "returnValue" && transformer.mlSchema === undefined) {
    return walkValueOfType(inputOutputTypeOfValue(transformer.value), environment);
  }
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
/** The slot of a list transformer whose input is each element of the list (#415 D15 reads it too). */
export const LIST_ELEMENT_SLOTS: Record<string, string> = {
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
    ...(environment.withContext ? { context } : {}),
  };
  environment.nodes.push(report);

  // D1: a node consumes its own applyTo when it has one.
  let consumed: WalkValue = given;
  if (isTypedTransformerNode(transformer.applyTo)) {
    consumed = walkNode(transformer.applyTo, [...path, "applyTo"], given, context, environment).output;
  } else if (transformer.applyTo !== undefined) {
    consumed = walkValueOfType(inputOutputTypeOfValue(transformer.applyTo), environment);
    environment.literals.push({ path: [...path, "applyTo"], type: consumed.type });
  }
  report.consumedInput = consumed.type;
  if (
    declared !== undefined &&
    declared.input !== "undefined" &&
    !inputOutputTypesCompatible(consumed.type, declared.input)
  ) {
    report.failures.push({ direction: "input", given: consumed.type, declared: declared.input });
  }
  const valueFailure = returnValueFailure(transformer, environment);
  if (valueFailure) {
    report.failures.push(valueFailure);
  }

  const element = walkChildren(transformer, path, given, consumed, context, environment);
  // #88 resolves a list combinator's element transformer in the parent's context; the walk knows
  // the bound element, so it derives the output of mapList / filterList / find from it.
  const listOutput = element ? listCombinatorOutput(transformer.transformerType, consumed, element) : undefined;
  if (listOutput) {
    report.output = listOutput.type;
  }
  return { report, output: listOutput ?? output };
}

/**
 * Coarse type of a value in the shape of the type it is declared with: an array declared as a tuple
 * types element-wise, a plain object declared as a record types as the record of its values (#449).
 */
function inputOutputTypeOfValueAs(value: unknown, declared: InputOutputType): InputOutputType {
  if (typeof declared === "object" && declared.type === "tuple" && Array.isArray(value)) {
    return { type: "tuple", payload: value.map((element) => inputOutputTypeParameter(inputOutputTypeOfValue(element))) };
  }
  const isRecordDeclared = declared === "record" || (typeof declared === "object" && declared.type === "record");
  if (isRecordDeclared && isPlainRecord(value) && inputOutputTypeOfValue(value) === "object") {
    const values = Object.values(value).map(inputOutputTypeOfValue);
    return values.length === 0 ? "record" : { type: "record", payload: commonTypeParameter(values) };
  }
  return inputOutputTypeOfValue(value);
}

/** #453 D13: a `returnValue` whose `value` does not fit its `mlSchema`, compared as coarse types. */
function returnValueFailure(
  transformer: TypedTransformerNode,
  environment: WalkEnvironment,
): TransformerInterfaceMismatch | undefined {
  if (transformer.transformerType !== "returnValue" || transformer.mlSchema === undefined) {
    return undefined;
  }
  const declared = inferTransformerOutputTypeFromSchema(transformer.mlSchema as MlElement, {
    entityMlSchemas: environment.entityMlSchemas,
  });
  const given = inputOutputTypeOfValueAs(transformer.value, declared);
  return inputOutputTypesCompatible(given, declared) ? undefined : { direction: "value", given, declared };
}

function listCombinatorOutput(
  transformerType: string,
  consumed: WalkValue,
  element: { bound: WalkValue; output: WalkValue },
): WalkValue | undefined {
  switch (transformerType) {
    case "mapList":
      return {
        type: { type: "array", payload: inputOutputTypeParameter(element.output.type) },
        schema: { type: "array", definition: element.output.schema } as MlElement,
      };
    case "filterList":
      // Filtering a tuple keeps some of its elements: an array of its element type (#449 §3.2).
      return typeof consumed.type === "object" && consumed.type.type === "tuple"
        ? {
            type: { type: "array", payload: inputOutputTypeParameter(element.bound.type) },
            schema: { type: "array", definition: element.bound.schema } as MlElement,
          }
        : consumed;
    case "find":
      return element.bound;
    default:
      return undefined;
  }
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
): { bound: WalkValue; output: WalkValue } | undefined {
  const handledKeys = new Set<string>(SKIP_WALK_KEYS);
  const transformerType = transformer.transformerType;
  let element: { bound: WalkValue; output: WalkValue } | undefined;

  const elementSlot = LIST_ELEMENT_SLOTS[transformerType];
  if (elementSlot && isTypedTransformerNode(transformer[elementSlot])) {
    const bound = arrayElementValue(consumed, environment);
    const binding = bindOuterValue(transformer, given, bound, context);
    const { output } = walkNode(
      transformer[elementSlot] as TypedTransformerNode,
      [...path, elementSlot],
      binding.given,
      binding.context,
      environment,
    );
    element = { bound, output };
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
  return element;
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
    withContext: options.withContext ?? false,
    nodes: [],
    literals: [],
  };
  if (isTypedTransformerNode(transformer)) {
    const root = walkValueOfType(rootInput, environment);
    // The caller's context may bind `defaultInput` differently from the root input (the list
    // transformer panel restricts by the row, while the runtime keeps the list as `defaultInput`).
    walkNode(transformer, [], root, { [defaultTransformerInput]: root.schema, ...options.context }, environment);
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
    literals: environment.literals,
  };
}

/** #453 D17: badge status of a node of the walk. */
export function transformerNodeTypeStatus(node: TransformerInterfaceNodeReport): TransformerNodeTypeStatus {
  if (node.failures.length > 0) {
    return "mismatch";
  }
  if (
    node.declared === undefined ||
    node.declared.input === "any" ||
    node.declared.input === "undefined" ||
    node.consumedInput === "any"
  ) {
    return "unknown";
  }
  return "match";
}

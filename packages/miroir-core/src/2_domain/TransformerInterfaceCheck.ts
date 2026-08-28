import {
  inputOutputObject,
  type InputOutputObject,
  type InputOutputPayloadType,
  type InputOutputType,
  type TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type {
  TransformerInterfaceCompatibility,
  TransformerInterfaceGivenTypes,
  TransformerInterfaceMismatch,
} from "../0_interfaces/2_domain/TransformerInterfaceCheckInterface";
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
 * unrelated debt (e.g. spreadSheetToJzodSchema's transformerImplementation content).
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

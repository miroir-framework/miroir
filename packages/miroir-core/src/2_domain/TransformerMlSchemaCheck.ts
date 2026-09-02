import type {
  CoreTransformerForBuildPlusRuntime,
  InputOutputPayloadType,
  InputOutputType,
  JzodElement,
  TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultTransformerInput } from "../0_interfaces/1_core/Transformer";
import type {
  TransformerMlSchemaCompatibility,
  TransformerMlSchemaGivenTypes,
  TransformerMlSchemaMismatch,
  TransformerMlSchemaNodeReport,
} from "../0_interfaces/2_domain/TransformerMlSchemaCheckInterface";
import { isFailedTransformerInterfaceFromDefinition } from "../0_interfaces/2_domain/TransformerResultSchemaInterface";
import { isMlSchemaSubtype } from "../1_core/jzod/mlSchemaSubtype";
import {
  resolveTransformerResultSchema,
  type TransformerResultSchemaContext,
} from "./Transformer_ResultSchema";
import { applicationTransformerDefinitions } from "./TransformersForRuntime";

type TypedTransformer = CoreTransformerForBuildPlusRuntime & { transformerType: string };

const ANY_SCHEMA = { type: "any" } as JzodElement;
const UNDEFINED_SCHEMA = { type: "undefined" } as JzodElement;

function isTypedTransformer(
  value: unknown,
): value is TypedTransformer {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "transformerType" in value &&
    typeof (value as { transformerType?: unknown }).transformerType === "string"
  );
}

/**
 * Lift an input/output type to an ML schema.
 * @param type - The input/output type to lift.
 * @param entityMlSchemas - The entity ML schemas to use.
 * @returns The lifted ML schema.
 */
export function liftInputOutputTypeToMlSchema(
  type: InputOutputType,
  entityMlSchemas?: Record<string, JzodElement>,
): JzodElement {
  if (typeof type === "object") {
    const payload = type.payload ?? "any";
    const inner = liftPayloadToMlSchema(payload, entityMlSchemas);
    return { type: type.type, definition: inner } as JzodElement;
  }
  if (type === "object") {
    return { type: "object", nonStrict: true, definition: {} } as JzodElement;
  }
  if (type === "array") {
    return { type: "array", definition: ANY_SCHEMA } as JzodElement;
  }
  if (type === "any" || type === "undefined" || type === "bigint" || type === "number" || type === "string" || type === "boolean") {
    return { type } as JzodElement;
  }
  const entitySchema = entityMlSchemas?.[type.toLowerCase()] ?? entityMlSchemas?.[type];
  if (entitySchema) {
    return entitySchema;
  }
  return { type: "object", definition: {} } as JzodElement;
}

/**
 * Lift a payload type to an ML schema.
 * @param payload - The payload type to lift.
 * @param entityMlSchemas - The entity ML schemas to use.
 * @returns The lifted ML schema.
 */
function liftPayloadToMlSchema(
  payload: InputOutputPayloadType,
  entityMlSchemas?: Record<string, JzodElement>,
): JzodElement {
  if (payload === "any" || payload === "bigint" || payload === "number" || payload === "string" || payload === "boolean") {
    return { type: payload } as JzodElement;
  }
  return liftInputOutputTypeToMlSchema(payload, entityMlSchemas);
}

/**
 * Piped / contextual input of a transformer — `inputOutput.input` only.
 * Named parameters (`applyTo`, `left`, `right`, …) and result-schema
 * `addAttributesToContextBeingSubtypeOf` are not this function's job.
 */
export function getDeclaredInputMlSchema(
  definition: TransformerDefinition,
  entityMlSchemas?: Record<string, JzodElement>,
): JzodElement | undefined {
  const inputOutput = definition.transformerInterface.inputOutput;
  if (inputOutput?.input !== undefined) {
    return liftInputOutputTypeToMlSchema(inputOutput.input, entityMlSchemas);
  }
  return undefined;
}

function consumesPipedInput(acceptedInput: JzodElement | undefined): boolean {
  if (!acceptedInput) {
    return false;
  }
  return acceptedInput.type !== "undefined" && acceptedInput.type !== "any";
}

/**
 * Unwrap the element schema of an array schema.
 * @param schema - The array schema to unwrap.
 * @returns The element schema.
 */
function unwrapArrayElement(schema: JzodElement): JzodElement | undefined {
  if (schema.type !== "array") {
    return undefined;
  }
  if (Array.isArray(schema.definition)) {
    return schema.definition[0] as JzodElement | undefined;
  }
  if (schema.definition && typeof schema.definition === "object" && "type" in schema.definition) {
    return schema.definition as JzodElement;
  }
  return undefined;
}

/**
 * Resolve the output schema of a transformer.
 * @param transformer - The transformer to resolve the output schema for.
 * @param context - The context to use.
 * @param transformerDefinitions - The transformer definitions to use.
 * @returns The resolved output schema.
 */
function resolveOutputSchema(
  transformer: TypedTransformer,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
): JzodElement | undefined {
  const resolved = resolveTransformerResultSchema(transformer, context, transformerDefinitions);
  if (!isFailedTransformerInterfaceFromDefinition(resolved)) {
    return resolved;
  }
  const declared = transformerDefinitions[transformer.transformerType]?.transformerInterface
    .transformerResultSchema;
  if (declared?.returns === "mlSchema") {
    return declared.definition;
  }
  return undefined;
}

/**
 * Walk a seized transformer tree. At each typed node, compare given vs declared
 * input (from the TransformerDefinition) and derived vs expected output
 * (Proposal B / `resolveTransformerResultSchema`) with `isMlSchemaSubtype`.
 * @param transformer - The transformer to check.
 * @param given - The given input types.
 * @param context - The context to use.
 * @param transformerDefinitions - The transformer definitions to use.
 * @param entityMlSchemas - The entity ML schemas to use.
 * @returns The compatibility report.
 */
export function checkTransformerMlSchemaCompatibility(
  transformer: CoreTransformerForBuildPlusRuntime,
  given: TransformerMlSchemaGivenTypes,
  context: TransformerResultSchemaContext = {},
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
  entityMlSchemas?: Record<string, JzodElement>,
): TransformerMlSchemaCompatibility {
  const nodes: TransformerMlSchemaNodeReport[] = [];
  if (isTypedTransformer(transformer)) {
    checkNode(
      transformer,
      [],
      given.input,
      given.output,
      context,
      transformerDefinitions,
      entityMlSchemas,
      nodes,
    );
  }
  const hasFailure = nodes.some((node) => node.failures.length > 0);
  return {
    status: nodes.length === 0 ? "unchecked" : hasFailure ? "incompatible" : "ok",
    nodes,
  };
}

/**
 * Check a single node in the transformer tree.
 * @param transformer - The transformer to check.
 * @param path - The path to the transformer.
 * @param givenInput - The given input type.
 * @param expectedOutput - The expected output type.
 * @param context - The context to use.
 * @param transformerDefinitions - The transformer definitions to use.
 * @param entityMlSchemas - The entity ML schemas to use.
 * @param nodes - The nodes to use.
 * @returns The compatibility report.
 */
function checkNode(
  transformer: TypedTransformer,
  path: (string | number)[],
  givenInput: JzodElement,
  expectedOutput: JzodElement | undefined,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  entityMlSchemas: Record<string, JzodElement> | undefined,
  nodes: TransformerMlSchemaNodeReport[],
): TransformerMlSchemaNodeReport {
  const definition = transformerDefinitions[transformer.transformerType];
  const acceptedInput = definition
    ? getDeclaredInputMlSchema(definition, entityMlSchemas)
    : undefined;
  const actualOutput = resolveOutputSchema(transformer, context, transformerDefinitions);

  const failures: TransformerMlSchemaMismatch[] = [];
  if (definition && consumesPipedInput(acceptedInput) && acceptedInput) {
    if (!isMlSchemaSubtype(givenInput, acceptedInput)) {
      failures.push({ direction: "input", given: givenInput, declared: acceptedInput });
    }
  }
  if (expectedOutput && actualOutput) {
    if (!isMlSchemaSubtype(actualOutput, expectedOutput)) {
      failures.push({ direction: "output", given: expectedOutput, declared: actualOutput });
    }
  }

  const report: TransformerMlSchemaNodeReport = {
    path,
    transformerType: transformer.transformerType,
    givenInput,
    acceptedInput,
    actualOutput,
    expectedOutput,
    failures,
  };
  nodes.push(report);

  walkChildren(
    transformer,
    path,
    givenInput,
    expectedOutput,
    context,
    transformerDefinitions,
    entityMlSchemas,
    nodes,
  );
  return report;
}

const SKIP_WALK_KEYS = new Set(["transformerType", "interpolation", "mlSchema"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDefinitionRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && !isTypedTransformer(value);
}

function listElementGivenInput(
  record: Record<string, unknown>,
  parentGivenInput: JzodElement,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
): JzodElement {
  const applyToOutput = isTypedTransformer(record.applyTo)
    ? resolveOutputSchema(record.applyTo, context, transformerDefinitions)
    : parentGivenInput;
  return (applyToOutput && unwrapArrayElement(applyToOutput)) ?? ANY_SCHEMA;
}

/**
 * Runtime `mergeIntoObject` binds `applyTo` into context as
 * `referenceToOuterObject` (or `defaultInput`). That is context, not a pipe.
 */
function bindApplyToAsOuterContext(
  record: Record<string, unknown>,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
): TransformerResultSchemaContext {
  const applyToOutput = isTypedTransformer(record.applyTo)
    ? resolveOutputSchema(record.applyTo, context, transformerDefinitions)
    : undefined;
  if (!applyToOutput) {
    return context;
  }
  const outerName =
    typeof record.referenceToOuterObject === "string" && record.referenceToOuterObject.length > 0
      ? record.referenceToOuterObject
      : defaultTransformerInput;
  return { ...context, [outerName]: applyToOutput };
}

/**
 * Walk every nested typed transformer. Slot names only affect the *pipe*
 * passed to the child (`applyTo`, list-element slots, `then`/`else`).
 * `dataflowObject.definition` keeps Proposal B adjacency; other `definition`
 * records (e.g. `createObject`) are independent. `mergeIntoObject.definition`
 * is an overlay: no parent pipe, `applyTo` available as context.
 */
function walkChildren(
  transformer: TypedTransformer,
  path: (string | number)[],
  parentGivenInput: JzodElement,
  parentExpectedOutput: JzodElement | undefined,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  entityMlSchemas: Record<string, JzodElement> | undefined,
  nodes: TransformerMlSchemaNodeReport[],
): void {
  const record = transformer as unknown as Record<string, unknown>;
  const parentAccepted = transformerDefinitions[transformer.transformerType]
    ? getDeclaredInputMlSchema(
        transformerDefinitions[transformer.transformerType],
        entityMlSchemas,
      )
    : undefined;
  const handledKeys = new Set<string>(SKIP_WALK_KEYS);

  if (isDefinitionRecord(record.definition)) {
    if (transformer.transformerType === "dataflowObject") {
      walkDataflowDefinition(
        record.definition,
        path,
        parentGivenInput,
        context,
        transformerDefinitions,
        entityMlSchemas,
        nodes,
      );
    } else {
      walkIndependentDefinition(
        record.definition,
        path,
        parentGivenInput,
        context,
        transformerDefinitions,
        entityMlSchemas,
        nodes,
      );
    }
    handledKeys.add("definition");
  } else if (isTypedTransformer(record.definition)) {
    const isMergeOverlay = transformer.transformerType === "mergeIntoObject";
    checkNode(
      record.definition,
      [...path, "definition"],
      isMergeOverlay ? UNDEFINED_SCHEMA : parentGivenInput,
      undefined,
      isMergeOverlay
        ? bindApplyToAsOuterContext(record, context, transformerDefinitions)
        : context,
      transformerDefinitions,
      entityMlSchemas,
      nodes,
    );
    handledKeys.add("definition");
  }

  const walkSlot = (value: unknown, childPath: (string | number)[], slotKey: string): void => {
    if (isTypedTransformer(value)) {
      const givenInput =
        slotKey === "elementTransformer" || slotKey === "predicate"
          ? listElementGivenInput(record, parentGivenInput, context, transformerDefinitions)
          : parentGivenInput;
      const expectedOutput =
        slotKey === "applyTo"
          ? parentAccepted
          : slotKey === "then" || slotKey === "else"
            ? parentExpectedOutput
            : undefined;
      checkNode(
        value,
        childPath,
        givenInput,
        expectedOutput,
        context,
        transformerDefinitions,
        entityMlSchemas,
        nodes,
      );
      return;
    }
    if (Array.isArray(value)) {
      for (const [index, item] of value.entries()) {
        walkSlot(item, [...childPath, index], slotKey);
      }
      return;
    }
    if (isPlainObject(value)) {
      for (const [nestedKey, nested] of Object.entries(value)) {
        walkSlot(nested, [...childPath, nestedKey], nestedKey);
      }
    }
  };

  for (const [key, value] of Object.entries(record)) {
    if (handledKeys.has(key)) {
      continue;
    }
    walkSlot(value, [...path, key], key);
  }
}

function walkIndependentDefinition(
  definition: Record<string, unknown>,
  path: (string | number)[],
  parentGivenInput: JzodElement,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  entityMlSchemas: Record<string, JzodElement> | undefined,
  nodes: TransformerMlSchemaNodeReport[],
): void {
  for (const [stepName, step] of Object.entries(definition)) {
    if (!isTypedTransformer(step)) {
      continue;
    }
    checkNode(
      step,
      [...path, "definition", stepName],
      parentGivenInput,
      undefined,
      context,
      transformerDefinitions,
      entityMlSchemas,
      nodes,
    );
  }
}

function walkDataflowDefinition(
  definition: Record<string, unknown>,
  path: (string | number)[],
  parentGivenInput: JzodElement,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  entityMlSchemas: Record<string, JzodElement> | undefined,
  nodes: TransformerMlSchemaNodeReport[],
): void {
  let previousOutput: JzodElement | undefined;
  const accumulated: TransformerResultSchemaContext = { ...context };
  for (const [stepName, step] of Object.entries(definition)) {
    if (!isTypedTransformer(step)) {
      continue;
    }
    const stepGiven = previousOutput ?? parentGivenInput;
    const stepExpected =
      previousOutput === undefined
        ? undefined
        : transformerDefinitions[step.transformerType]
          ? getDeclaredInputMlSchema(
              transformerDefinitions[step.transformerType],
              entityMlSchemas,
            )
          : undefined;
    const child = checkNode(
      step,
      [...path, "definition", stepName],
      stepGiven,
      undefined,
      { ...accumulated },
      transformerDefinitions,
      entityMlSchemas,
      nodes,
    );
    if (previousOutput && stepExpected && consumesPipedInput(stepExpected)) {
      if (!isMlSchemaSubtype(previousOutput, stepExpected)) {
        child.failures.push({
          direction: "input",
          given: previousOutput,
          declared: stepExpected,
        });
      }
    }
    if (child.actualOutput) {
      accumulated[stepName] = child.actualOutput;
      previousOutput = child.actualOutput;
    }
  }
}

export interface FormatMlSchemaTypeLabelOptions {
  /** Resolver returning a display name for an object schema (e.g. entity name). */
  schemaNameResolver?: (schema: JzodElement) => string | undefined;
}

/**
 * Format a ML schema type label.
 * @param schema - The schema to format.
 * @param options - Optional display options (object schema name resolution).
 * @returns The formatted label.
 */
export function formatMlSchemaTypeLabel(
  schema: JzodElement | undefined,
  options?: FormatMlSchemaTypeLabelOptions,
): string {
  if (!schema || typeof schema !== "object" || !("type" in schema)) {
    return "unknown";
  }
  switch (schema.type) {
    case "array": {
      const inner = unwrapArrayElement(schema);
      return inner ? `array<${formatMlSchemaTypeLabel(inner, options)}>` : "array";
    }
    case "record":
      return `record<${formatMlSchemaTypeLabel((schema as { definition?: JzodElement }).definition, options)}>`;
    case "object": {
      const name = options?.schemaNameResolver?.(schema) ?? "object";
      const keys = Object.keys(schema.definition ?? {});
      return keys.length === 0 ? name : `${name}{${keys.join(", ")}}`;
    }
    case "union":
      return (schema.definition ?? [])
        .map((branch) => formatMlSchemaTypeLabel(branch, options))
        .join("|");
    case "literal":
      return `"${schema.definition}"`;
    default:
      return schema.type;
  }
}

export function nodePathKey(path: (string | number)[]): string {
  return path.map(String).join(".");
}

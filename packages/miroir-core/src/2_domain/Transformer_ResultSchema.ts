import {
  CoreTransformerForBuildPlusRuntime,
  CoreTransformerForBuildPlusRuntime_accessDynamicPath,
  CoreTransformerForBuildPlusRuntime_boolExpr,
  CoreTransformerForBuildPlusRuntime_case,
  CoreTransformerForBuildPlusRuntime_concatLists,
  CoreTransformerForBuildPlusRuntime_constantAsExtractor,
  CoreTransformerForBuildPlusRuntime_createObject,
  CoreTransformerForBuildPlusRuntime_createObjectFromPairs,
  CoreTransformerForBuildPlusRuntime_dataflowObject,
  CoreTransformerForBuildPlusRuntime_filterList,
  CoreTransformerForBuildPlusRuntime_find,
  CoreTransformerForBuildPlusRuntime_getObjectEntries,
  CoreTransformerForBuildPlusRuntime_getObjectValues,
  CoreTransformerForBuildPlusRuntime_getUniqueValues,
  CoreTransformerForBuildPlusRuntime_indexListBy,
  CoreTransformerForBuildPlusRuntime_listLength,
  CoreTransformerForBuildPlusRuntime_listReducerToSpreadObject,
  CoreTransformerForBuildPlusRuntime_mergeIntoObject,
  CoreTransformerForBuildPlusRuntime_object_fromEntries,
  CoreTransformerForBuildPlusRuntime_sortList,
  CoreTransformerForBuildPlusRuntime_getFromContext,
  CoreTransformerForBuildPlusRuntime_getFromParameters,
  CoreTransformerForBuildPlusRuntime_ifThenElse,
  CoreTransformerForBuildPlusRuntime_mapList,
  CoreTransformerForBuildPlusRuntime_numericOp,
  CoreTransformerForBuildPlusRuntime_returnValue,
  CoreTransformerForBuildPlusRuntime_stringOp,
  JzodElement,
  TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  FailedTransformerInterfaceFromDefinition,
  FailedTransformerInterfaceFromDefinitionFailureKind,
  ResolveTransformerResultSchemaReturnType,
  isFailedTransformerInterfaceFromDefinition,
} from "../0_interfaces/2_domain/TransformerResultSchemaInterface";
import {
  ResolveBuildTransformersTo,
  Step,
} from "./Transformers";
import { applicationTransformerDefinitions } from "./TransformersForRuntime";
import type { TransformerReturnType } from "../0_interfaces/2_domain/DomainElement";

export type TransformerResultSchemaContext = Record<string, JzodElement>;

export type {
  FailedTransformerInterfaceFromDefinition,
  FailedTransformerInterfaceFromDefinitionFailureKind,
  ResolveTransformerResultSchemaReturnType,
} from "../0_interfaces/2_domain/TransformerResultSchemaInterface";
export { isFailedTransformerInterfaceFromDefinition } from "../0_interfaces/2_domain/TransformerResultSchemaInterface";

type TypedTransformer = CoreTransformerForBuildPlusRuntime & {
  transformerType: string;
};

type ReferenceTransformer =
  | CoreTransformerForBuildPlusRuntime_getFromContext
  | CoreTransformerForBuildPlusRuntime_getFromParameters;

function isTypedTransformer(
  transformer: CoreTransformerForBuildPlusRuntime,
): transformer is TypedTransformer {
  return (
    typeof transformer === "object" &&
    transformer !== null &&
    "transformerType" in transformer &&
    typeof (transformer as { transformerType?: unknown }).transformerType === "string"
  );
}

function getSchemaType(schema: JzodElement): string | undefined {
  if (typeof schema === "object" && schema !== null && "type" in schema) {
    return String((schema as { type: unknown }).type);
  }
  return undefined;
}

function failTransformerResultSchema(
  failureKind: FailedTransformerInterfaceFromDefinitionFailureKind,
  error: string,
  details: Omit<
    FailedTransformerInterfaceFromDefinition,
    "status" | "failureKind" | "error" | "typePath"
  > & { typePath?: (string | number)[] } = {},
): FailedTransformerInterfaceFromDefinition {
  return {
    status: "error",
    failureKind,
    error,
    typePath: details.typePath ?? [],
    transformerType: details.transformerType,
    referenceName: details.referenceName,
    referencePath: details.referencePath,
    expectedSchema: details.expectedSchema,
    actualSchema: details.actualSchema,
    transformerPath: details.transformerPath,
    innerError: details.innerError,
  };
}

function isDerivationContextFailure(
  result: TransformerResultSchemaContext | FailedTransformerInterfaceFromDefinition,
): result is FailedTransformerInterfaceFromDefinition {
  return (
    typeof result === "object" &&
    result !== null &&
    "status" in result &&
    (result as FailedTransformerInterfaceFromDefinition).status === "error" &&
    "failureKind" in result
  );
}

function referenceBindingFromTransformer(
  transformer: ReferenceTransformer,
): Pick<FailedTransformerInterfaceFromDefinition, "referenceName" | "referencePath"> {
  return {
    referenceName: transformer.referenceName,
    referencePath: transformer.referencePath,
  };
}

function propagateFailure(
  result: ResolveTransformerResultSchemaReturnType,
): result is FailedTransformerInterfaceFromDefinition {
  return isFailedTransformerInterfaceFromDefinition(result);
}

function buildMlSchemaTransformerContext(
  transformer: TypedTransformer,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  attributeNames: Record<string, JzodElement>,
): TransformerResultSchemaContext | FailedTransformerInterfaceFromDefinition {
  const derivationContext = { ...context };

  for (const attributeName of Object.keys(attributeNames)) {
    if (!(attributeName in transformer) || transformer[attributeName as keyof typeof transformer] === undefined) {
      continue;
    }

    const operand = transformer[attributeName as keyof typeof transformer] as CoreTransformerForBuildPlusRuntime;
    if (!isTypedTransformer(operand)) {
      continue;
    }

    const operandSchema = resolveTransformerResultSchema(
      operand,
      context,
      transformerDefinitions,
    );
    if (propagateFailure(operandSchema)) {
      return operandSchema;
    }
    derivationContext[attributeName] = operandSchema;
  }

  return derivationContext;
}

/**
 * 
 * @param transformer - The reference transformer
 * @param context - The jzod schema corresponding to refrences potentially used by the transformer
 * @param fallback - The fallback jzod schema
 * @param transformerType - The type of the transformer
 * @returns The expected jzod schema of the result of the transformer execution
 */
function resolveReferenceSchema(
  transformer: ReferenceTransformer,
  context: TransformerResultSchemaContext,
  fallback: JzodElement,
  transformerType: "getFromContext" | "getFromParameters",
): ResolveTransformerResultSchemaReturnType {
  const binding = referenceBindingFromTransformer(transformer);

  if (transformer.referenceName) {
    const schema = context[transformer.referenceName];
    if (!schema) {
      return failTransformerResultSchema(
        "contextMissingReference",
        `resolveTransformerResultSchema: context missing reference "${transformer.referenceName}"`,
        {
          transformerType,
          ...binding,
          typePath: [transformerType, "referenceName"],
        },
      );
    }
    return schema;
  }

  if (transformer.referencePath?.length) {
    const rootKey = transformer.referencePath[0];
    let current: JzodElement | undefined = context[rootKey];
    if (!current) {
      return failTransformerResultSchema(
        "contextMissingReference",
        `resolveTransformerResultSchema: context missing reference "${rootKey}"`,
        {
          transformerType,
          referenceName: rootKey,
          referencePath: transformer.referencePath,
          typePath: [transformerType, "referencePath", 0],
        },
      );
    }

    for (const [index, segment] of transformer.referencePath.slice(1).entries()) {
      if (
        typeof current !== "object" ||
        current === null ||
        !("definition" in current) ||
        typeof (current as { definition?: unknown }).definition !== "object" ||
        (current as { definition?: unknown }).definition === null
      ) {
        return failTransformerResultSchema(
          "contextPathNotFound",
          `resolveTransformerResultSchema: context path "${transformer.referencePath.join(".")}" not found`,
          {
            transformerType,
            ...binding,
            actualSchema: current,
            typePath: [transformerType, "referencePath", index + 1],
          },
        );
      }
      current = (current as { definition: Record<string, JzodElement> }).definition[segment];
      if (!current) {
        return failTransformerResultSchema(
          "contextPathNotFound",
          `resolveTransformerResultSchema: context path "${transformer.referencePath.join(".")}" not found`,
          {
            transformerType,
            ...binding,
            typePath: [transformerType, "referencePath", index + 1],
          },
        );
      }
    }

    return current;
  }

  return fallback;
}

/**
 * 
 * @param transformer - The accessDynamicPath transformer
 * @param context - The jzod schema corresponding to refrences potentially used by the transformer
 * @param transformerDefinitions - The set of existing transformer definitions
 * @returns The expected jzod schema of the result of the transformer execution
 */
function resolveAccessDynamicPathSchema(
  transformer: CoreTransformerForBuildPlusRuntime_accessDynamicPath,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
): ResolveTransformerResultSchemaReturnType {
  let current: ResolveTransformerResultSchemaReturnType = undefined as unknown as JzodElement;

  for (const [index, segment] of transformer.objectAccessPath.entries()) {
    if (typeof segment === "string") {
      if (index === 0) {
        return failTransformerResultSchema(
          "accessDynamicPathFailure",
          "resolveTransformerResultSchema: accessDynamicPath path must start with a transformer segment",
          {
            transformerType: "accessDynamicPath",
            typePath: ["accessDynamicPath", "objectAccessPath", index],
          },
        );
      }
      if (propagateFailure(current)) {
        return current;
      }
      if (typeof current !== "object" || current === null) {
        return failTransformerResultSchema(
          "accessDynamicPathFailure",
          `resolveTransformerResultSchema: accessDynamicPath segment "${segment}" on non-object schema`,
          {
            transformerType: "accessDynamicPath",
            actualSchema: current,
            typePath: ["accessDynamicPath", "objectAccessPath", index],
          },
        );
      }
      const next = (current as Record<string, unknown>)[segment];
      if (next === undefined) {
        return failTransformerResultSchema(
          "accessDynamicPathFailure",
          `resolveTransformerResultSchema: accessDynamicPath segment "${segment}" not found`,
          {
            transformerType: "accessDynamicPath",
            actualSchema: current,
            typePath: ["accessDynamicPath", "objectAccessPath", index],
          },
        );
      }
      current = next as JzodElement;
    } else {
      const resolvedSegment = resolveTransformerResultSchema(segment, context, transformerDefinitions);
      if (propagateFailure(resolvedSegment)) {
        return resolvedSegment;
      }
      current = resolvedSegment;
    }
  }

  if (current === undefined) {
    return failTransformerResultSchema(
      "accessDynamicPathFailure",
      "resolveTransformerResultSchema: accessDynamicPath resolved undefined",
      {
        transformerType: "accessDynamicPath",
        typePath: ["accessDynamicPath"],
      },
    );
  }

  if (propagateFailure(current)) {
    return current;
  }

  return current;
}

/**
 * 
 * @param definition - The definition of the record transformer
 * @param context - The jzod schema corresponding to refrences potentially used by the transformer
 * @param transformerDefinitions - The set of existing transformer definitions
 * @param threadContext - Whether to thread the context
 * @param transformerType - The type of the transformer
 * @returns The expected jzod schema of the result of the transformer execution
 */
function resolveRecordTransformerDefinitionSchema(
  definition: Record<string, CoreTransformerForBuildPlusRuntime> | undefined,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  threadContext: boolean,
  transformerType: "dataflowObject" | "createObject",
): ResolveTransformerResultSchemaReturnType {
  if (!definition) {
    return { type: "object", definition: {} };
  }

  const objectDefinition: Record<string, JzodElement> = {};
  const stepContext = { ...context };

  for (const [key, nestedTransformer] of Object.entries(definition)) {
    const nestedSchema = resolveTransformerResultSchema(
      nestedTransformer,
      threadContext ? stepContext : context,
      transformerDefinitions,
    );
    if (propagateFailure(nestedSchema)) {
      return {
        ...nestedSchema,
        transformerPath: [transformerType, "definition", key],
        innerError: nestedSchema,
      };
    }
    objectDefinition[key] = nestedSchema;
    if (threadContext) {
      stepContext[key] = nestedSchema;
    }
  }

  return { type: "object", definition: objectDefinition };
}

/**
 * 
 * @param transformerType - The type of the transformer
 * @param applyToTransformer - The applyTo transformer
 * @param applyToSchema - The expected jzod schema of the result of the applyTo transformer execution
 * @param expectedRootType - The expected root type of the applyTo schema
 * @param expectedSchema - The expected jzod schema of the result of the applyTo transformer execution
 */
function validateApplyToSchemaShape(
  transformerType: string,
  applyToTransformer: TypedTransformer,
  applyToSchema: JzodElement,
  expectedRootType: string,
  expectedSchema: JzodElement,
): FailedTransformerInterfaceFromDefinition | undefined {
  return requireSchemaRootType(applyToSchema, expectedRootType, expectedSchema, {
    transformerType,
    typePath: [transformerType, "applyTo"],
    ...referenceBindingFromTransformerOrEmpty(applyToTransformer),
    errorMessage: `${transformerType} expected applyTo schema type "${expectedRootType}" but got "${getSchemaType(applyToSchema) ?? "unknown"}"`,
  });
}

/**
 * 
 * @param transformer - The transformer
 * @returns The reference binding from the transformer
 */
function referenceBindingFromTransformerOrEmpty(
  transformer: TypedTransformer,
): Pick<FailedTransformerInterfaceFromDefinition, "referenceName" | "referencePath"> {
  if (
    transformer.transformerType === "getFromContext" ||
    transformer.transformerType === "getFromParameters"
  ) {
    return referenceBindingFromTransformer(transformer as ReferenceTransformer);
  }
  return {};
}

/**
 * 
 * @param schema - The schema to validate
 * @param expectedRootType - The expected root type of the schema
 * @param expectedSchema - The expected jzod schema of the result of the schema execution
 * @param details - The details of the schema
 * @returns The failed transformer interface from definition
 */
function requireSchemaRootType(
  schema: JzodElement,
  expectedRootType: string,
  expectedSchema: JzodElement,
  details: {
    transformerType: string;
    typePath: (string | number)[];
    referenceName?: string;
    referencePath?: string[];
    errorMessage?: string;
  },
): FailedTransformerInterfaceFromDefinition | undefined {
  const actualRootType = getSchemaType(schema);
  if (actualRootType === expectedRootType) {
    return undefined;
  }

  return failTransformerResultSchema(
    "schemaShapeMismatch",
    `resolveTransformerResultSchema: ${details.errorMessage ?? `${details.transformerType} expected schema type "${expectedRootType}" but got "${actualRootType ?? "unknown"}"`}`,
    {
      transformerType: details.transformerType,
      referenceName: details.referenceName,
      referencePath: details.referencePath,
      expectedSchema,
      actualSchema: schema,
      typePath: details.typePath,
    },
  );
}

/**
 * 
 * @param operand - The operand
 * @param context - The jzod schema corresponding to refrences potentially used by the operand
 * @param transformerDefinitions - The set of existing transformer definitions
 * @param parentTransformerType - The type of the parent transformer
 * @param operandKey - The key of the operand
 * @returns The expected jzod schema of the result of the operand execution
 */
function resolveOperandSchema(
  operand: CoreTransformerForBuildPlusRuntime,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  parentTransformerType: string,
  operandKey: string | number,
): ResolveTransformerResultSchemaReturnType {
  const result = resolveTransformerResultSchema(operand, context, transformerDefinitions);
  if (propagateFailure(result)) {
    return {
      ...result,
      transformerPath: [parentTransformerType, operandKey],
      innerError: result,
    };
  }
  return result;
}

/**
 * 
 * @param operand - The operand
 * @param context - The jzod schema corresponding to refrences potentially used by the operand
 * @param transformerDefinitions - The set of existing transformer definitions
 * @param parentTransformerType - The type of the parent transformer
 * @param operandKey - The key of the operand
 * @returns The failed transformer interface from definition
 */
function validateBooleanOperand(
  operand: CoreTransformerForBuildPlusRuntime,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  parentTransformerType: string,
  operandKey: string | number,
): FailedTransformerInterfaceFromDefinition | undefined {
  const operandSchema = resolveOperandSchema(
    operand,
    context,
    transformerDefinitions,
    parentTransformerType,
    operandKey,
  );
  if (propagateFailure(operandSchema)) {
    return operandSchema;
  }

  const binding =
    isTypedTransformer(operand) ? referenceBindingFromTransformerOrEmpty(operand) : {};

  return requireSchemaRootType(
    operandSchema,
    "boolean",
    { type: "boolean" },
    {
      transformerType: parentTransformerType,
      typePath: [parentTransformerType, operandKey],
      ...binding,
      errorMessage: `${parentTransformerType} operand "${String(operandKey)}" must resolve to boolean schema but got "${getSchemaType(operandSchema) ?? "unknown"}"`,
    },
  );
}

function boolExprOperatorRequiresBooleanOperands(operator: CoreTransformerForBuildPlusRuntime_boolExpr["operator"]): boolean {
  return operator === "&&" || operator === "||" || operator === "!";
}

function isObjectLikeSchema(schema: JzodElement): boolean {
  const root = getSchemaType(schema);
  return root === "object" || root === "record";
}

function getObjectDefinitionMap(schema: JzodElement): Record<string, JzodElement> | undefined {
  if (typeof schema !== "object" || schema === null || !("definition" in schema)) {
    return undefined;
  }
  if (getSchemaType(schema) === "object") {
    const definition = (schema as { definition: unknown }).definition;
    if (typeof definition === "object" && definition !== null && !Array.isArray(definition)) {
      return definition as Record<string, JzodElement>;
    }
  }
  return undefined;
}

function unwrapArrayElementSchema(schema: JzodElement): JzodElement {
  if (
    getSchemaType(schema) === "array" &&
    typeof schema === "object" &&
    schema !== null &&
    "definition" in schema
  ) {
    return (schema as { definition: JzodElement }).definition;
  }
  return { type: "any" };
}

function buildUnionSchema(schemas: JzodElement[]): JzodElement {
  const nonFailed = schemas.filter(
    (schema) => !isFailedTransformerInterfaceFromDefinition(schema),
  ) as JzodElement[];
  if (nonFailed.length === 0) {
    return { type: "any" };
  }
  if (nonFailed.length === 1) {
    return nonFailed[0];
  }
  return { type: "union", definition: nonFailed };
}

function mergeObjectSchemas(base: JzodElement, overlay: JzodElement): JzodElement {
  const baseDefinition = getObjectDefinitionMap(base) ?? {};
  const overlayDefinition = getObjectDefinitionMap(overlay) ?? {};
  return {
    type: "object",
    definition: { ...baseDefinition, ...overlayDefinition },
  };
}

/**
 * 
 * @param applyTo - The applyTo transformer
 * @param context - The context
 * @param transformerDefinitions - The transformer definitions
 * @param parentTransformerType - The parent transformer type
 * @returns The resolved apply to array element schema
 */
function resolveApplyToArrayElementSchema(
  applyTo: CoreTransformerForBuildPlusRuntime | undefined,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  parentTransformerType: string,
): ResolveTransformerResultSchemaReturnType {
  if (!applyTo || !isTypedTransformer(applyTo)) {
    return failTransformerResultSchema(
      "schemaShapeMismatch",
      `resolveTransformerResultSchema: ${parentTransformerType} requires applyTo transformer`,
      {
        transformerType: parentTransformerType,
        typePath: [parentTransformerType, "applyTo"],
        expectedSchema: { type: "array", definition: { type: "any" } },
      },
    );
  }

  const applyToSchema = resolveOperandSchema(
    applyTo,
    context,
    transformerDefinitions,
    parentTransformerType,
    "applyTo",
  );
  if (propagateFailure(applyToSchema)) {
    return applyToSchema;
  }

  const shapeFailure = validateApplyToSchemaShape(
    parentTransformerType,
    applyTo,
    applyToSchema,
    "array",
    { type: "array", definition: { type: "any" } },
  );
  if (shapeFailure) {
    return shapeFailure;
  }

  return unwrapArrayElementSchema(applyToSchema);
}

/**
 * 
 * @param applyTo - The applyTo transformer
 * @param context - The jzod schema corresponding to refrences potentially used by the applyTo transformer
 * @param transformerDefinitions - The set of existing transformer definitions
 * @param parentTransformerType - The type of the parent transformer
 * @returns The expected jzod schema of the result of the applyTo transformer execution
 */
function resolveApplyToObjectSchema(
  applyTo: CoreTransformerForBuildPlusRuntime | undefined,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  parentTransformerType: string,
): ResolveTransformerResultSchemaReturnType {
  if (!applyTo || !isTypedTransformer(applyTo)) {
    return failTransformerResultSchema(
      "schemaShapeMismatch",
      `resolveTransformerResultSchema: ${parentTransformerType} requires applyTo transformer`,
      {
        transformerType: parentTransformerType,
        typePath: [parentTransformerType, "applyTo"],
        expectedSchema: { type: "object", definition: {} },
      },
    );
  }

  const applyToSchema = resolveOperandSchema(
    applyTo,
    context,
    transformerDefinitions,
    parentTransformerType,
    "applyTo",
  );
  if (propagateFailure(applyToSchema)) {
    return applyToSchema;
  }

  if (!isObjectLikeSchema(applyToSchema)) {
    return failTransformerResultSchema(
      "schemaShapeMismatch",
      `resolveTransformerResultSchema: ${parentTransformerType} expected applyTo schema type "object" or "record" but got "${getSchemaType(applyToSchema) ?? "unknown"}"`,
      {
        transformerType: parentTransformerType,
        typePath: [parentTransformerType, "applyTo"],
        ...referenceBindingFromTransformerOrEmpty(applyTo),
        expectedSchema: { type: "object", definition: {} },
        actualSchema: applyToSchema,
      },
    );
  }

  return applyToSchema;
}

/**
 * 
 * @param predicate - The predicate
 * @param context - The jzod schema corresponding to refrences potentially used by the predicate
 * @param transformerDefinitions - The set of existing transformer definitions
 * @param parentTransformerType - The type of the parent transformer
 * @returns The failed transformer interface from definition
 */
function resolveListPredicateBoolean(
  predicate: CoreTransformerForBuildPlusRuntime,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
  parentTransformerType: string,
): FailedTransformerInterfaceFromDefinition | undefined {
  return validateBooleanOperand(
    predicate,
    context,
    transformerDefinitions,
    parentTransformerType,
    "predicate",
  );
}

/**
 * 
 * @param caseTransformer - The case transformer
 * @param context - The jzod schema corresponding to refrences potentially used by the case transformer
 * @param transformerDefinitions - The set of existing transformer definitions
 * @returns The expected jzod schema of the result of the case transformer execution
 */
function resolveCaseBranchSchemas(
  caseTransformer: CoreTransformerForBuildPlusRuntime_case,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition>,
): ResolveTransformerResultSchemaReturnType {
  const branchSchemas: JzodElement[] = [];

  for (const [index, whenClause] of caseTransformer.whens.entries()) {
    const thenSchema = resolveOperandSchema(
      whenClause.then,
      context,
      transformerDefinitions,
      "case",
      `whens.${index}.then`,
    );
    if (propagateFailure(thenSchema)) {
      return thenSchema;
    }
    branchSchemas.push(thenSchema);
  }

  if (caseTransformer.else) {
    const elseSchema = resolveOperandSchema(
      caseTransformer.else,
      context,
      transformerDefinitions,
      "case",
      "else",
    );
    if (propagateFailure(elseSchema)) {
      return elseSchema;
    }
    branchSchemas.push(elseSchema);
  }

  if (branchSchemas.length === 0) {
    return { type: "any" };
  }

  return buildUnionSchema(branchSchemas);
}

/**
 * @description
 * This function, given a transformer, a context for used references and the set of existing transformer definitions,
 * returns the expected jzod schema for the transformer result.
 * @param transformer - The transformer
 * @param context - The jzod schema corresponding to refrences potentially used by the transformer
 * @param transformerDefinitions - The set of existing transformer definitions
 * @returns The expected jzod schema of the result of the transformer execution
 */
export function resolveTransformerResultSchema(
  transformer: CoreTransformerForBuildPlusRuntime,
  context: TransformerResultSchemaContext,
  transformerDefinitions: Record<string, TransformerDefinition> = applicationTransformerDefinitions,
): ResolveTransformerResultSchemaReturnType {
  if (!isTypedTransformer(transformer)) {
    return failTransformerResultSchema(
      "missingTransformerType",
      "resolveTransformerResultSchema: transformer missing transformerType",
      { typePath: [] },
    );
  }

  const transformerType = transformer.transformerType;
  const definition = transformerDefinitions[transformerType];
  if (!definition) {
    return failTransformerResultSchema(
      "unknownTransformerType",
      `resolveTransformerResultSchema: unknown transformerType "${transformerType}"`,
      { transformerType, typePath: ["transformerType"] },
    );
  }

  const resultSchema = definition.transformerInterface.transformerResultSchema;
  if (!resultSchema) {
    return failTransformerResultSchema(
      "missingTransformerResultSchema",
      `resolveTransformerResultSchema: transformer "${transformerType}" has no transformerResultSchema`,
      { transformerType, typePath: ["transformerResultSchema"] },
    );
  }

  if (resultSchema.returns === "mlSchemaTransformer") {
    const derivationContext = buildMlSchemaTransformerContext(
      transformer,
      context,
      transformerDefinitions,
      resultSchema.addAttributesToContextBeingSubtypeOf ?? {},
    );
    if (isDerivationContextFailure(derivationContext)) {
      return derivationContext;
    }
    const resolvedDerivationContext = derivationContext as TransformerResultSchemaContext;

    for (const attributeProps in (resultSchema.addAttributesToContextBeingSubtypeOf ?? {})) {
      const applyToSchema = resolvedDerivationContext[attributeProps];
      const applyToTransformer =
        attributeProps in transformer ? (transformer[attributeProps as keyof typeof transformer] as CoreTransformerForBuildPlusRuntime) : undefined;
      if (applyToSchema && applyToTransformer && isTypedTransformer(applyToTransformer)) {
        const shapeFailure = validateApplyToSchemaShape(
          transformerType,
          applyToTransformer,
          applyToSchema,
          getSchemaType(resultSchema?.addAttributesToContextBeingSubtypeOf?.[attributeProps] ?? { type: "never"}) ?? "unknown",
          resultSchema?.addAttributesToContextBeingSubtypeOf?.[attributeProps] ?? { type: "never"},
        );
        if (shapeFailure) {
          return shapeFailure;
        }
      }
    }

    return resolveTransformerResultSchema(
      resultSchema.definition,
      resolvedDerivationContext,
      transformerDefinitions,
    );
  }

  switch (transformerType) {
    case "returnValue": {
      const returnValueTransformer = transformer as CoreTransformerForBuildPlusRuntime_returnValue;
      if (returnValueTransformer.mlSchema) {
        return returnValueTransformer.mlSchema as JzodElement;
      }
      break;
    }
    case "getFromContext":
      return resolveReferenceSchema(
        transformer as CoreTransformerForBuildPlusRuntime_getFromContext,
        context,
        resultSchema.definition,
        "getFromContext",
      );
    case "getFromParameters":
      return resolveReferenceSchema(
        transformer as CoreTransformerForBuildPlusRuntime_getFromParameters,
        context,
        resultSchema.definition,
        "getFromParameters",
      );
    case "accessDynamicPath":
      return resolveAccessDynamicPathSchema(
        transformer as CoreTransformerForBuildPlusRuntime_accessDynamicPath,
        context,
        transformerDefinitions,
      );
    case "boolExpr": {
      const boolExprTransformer = transformer as CoreTransformerForBuildPlusRuntime_boolExpr;
      if (boolExprOperatorRequiresBooleanOperands(boolExprTransformer.operator)) {
        const leftFailure = validateBooleanOperand(
          boolExprTransformer.left,
          context,
          transformerDefinitions,
          "boolExpr",
          "left",
        );
        if (leftFailure) {
          return leftFailure;
        }

        if (boolExprTransformer.right && boolExprTransformer.operator !== "!") {
          const rightFailure = validateBooleanOperand(
            boolExprTransformer.right,
            context,
            transformerDefinitions,
            "boolExpr",
            "right",
          );
          if (rightFailure) {
            return rightFailure;
          }
        }
      }
      break;
    }
    case "numericOp": {
      const numericOpTransformer = transformer as CoreTransformerForBuildPlusRuntime_numericOp;
      for (const [index, arg] of numericOpTransformer.args.entries()) {
        const argSchema = resolveOperandSchema(
          arg,
          context,
          transformerDefinitions,
          "numericOp",
          index,
        );
        if (propagateFailure(argSchema)) {
          return argSchema;
        }
        const argFailure = requireSchemaRootType(
          argSchema,
          "number",
          { type: "number" },
          {
            transformerType: "numericOp",
            typePath: ["numericOp", "args", index],
            errorMessage: `numericOp arg ${index} must resolve to number schema but got "${getSchemaType(argSchema) ?? "unknown"}"`,
          },
        );
        if (argFailure) {
          return argFailure;
        }
      }
      break;
    }
    case "mapList": {
      const mapListTransformer = transformer as CoreTransformerForBuildPlusRuntime_mapList;
      if (
        mapListTransformer.applyTo &&
        isTypedTransformer(mapListTransformer.applyTo as CoreTransformerForBuildPlusRuntime)
      ) {
        const applyToTransformer = mapListTransformer.applyTo as TypedTransformer;
        const applyToSchema = resolveTransformerResultSchema(
          applyToTransformer,
          context,
          transformerDefinitions,
        );
        if (propagateFailure(applyToSchema)) {
          return applyToSchema;
        }
        const shapeFailure = validateApplyToSchemaShape(
          transformerType,
          applyToTransformer,
          applyToSchema,
          "array",
          { type: "array", definition: { type: "any" } },
        );
        if (shapeFailure) {
          return shapeFailure;
        }
      }

      const elementSchema = resolveOperandSchema(
        mapListTransformer.elementTransformer,
        context,
        transformerDefinitions,
        "mapList",
        "elementTransformer",
      );
      if (propagateFailure(elementSchema)) {
        return elementSchema;
      }
      return { type: "array", definition: elementSchema };
    }
    case "stringOp": {
      const stringOpTransformer = transformer as CoreTransformerForBuildPlusRuntime_stringOp;
      if (
        stringOpTransformer.op === "length" &&
        stringOpTransformer.applyTo &&
        isTypedTransformer(stringOpTransformer.applyTo as CoreTransformerForBuildPlusRuntime)
      ) {
        const applyToTransformer = stringOpTransformer.applyTo as TypedTransformer;
        const applyToSchema = resolveTransformerResultSchema(
          applyToTransformer,
          context,
          transformerDefinitions,
        );
        if (propagateFailure(applyToSchema)) {
          return applyToSchema;
        }
        const shapeFailure = validateApplyToSchemaShape(
          transformerType,
          applyToTransformer,
          applyToSchema,
          "string",
          { type: "string" },
        );
        if (shapeFailure) {
          return shapeFailure;
        }
      }
      break;
    }
    case "dataflowObject":
      return resolveRecordTransformerDefinitionSchema(
        (transformer as CoreTransformerForBuildPlusRuntime_dataflowObject).definition,
        context,
        transformerDefinitions,
        true,
        "dataflowObject",
      );
    case "ifThenElse": {
      const ifThenElseTransformer = transformer as CoreTransformerForBuildPlusRuntime_ifThenElse;

      const ifFailure = validateBooleanOperand(
        ifThenElseTransformer.if,
        context,
        transformerDefinitions,
        "ifThenElse",
        "if",
      );
      if (ifFailure) {
        return ifFailure;
      }

      if (ifThenElseTransformer.then && ifThenElseTransformer.else) {
        const thenSchema = resolveTransformerResultSchema(
          ifThenElseTransformer.then,
          context,
          transformerDefinitions,
        );
        if (propagateFailure(thenSchema)) {
          return thenSchema;
        }
        const elseSchema = resolveTransformerResultSchema(
          ifThenElseTransformer.else,
          context,
          transformerDefinitions,
        );
        if (propagateFailure(elseSchema)) {
          return elseSchema;
        }
        return {
          type: "union",
          definition: [thenSchema, elseSchema],
        };
      }

      if (ifThenElseTransformer.then) {
        return resolveTransformerResultSchema(
          ifThenElseTransformer.then,
          context,
          transformerDefinitions,
        );
      }

      if (ifThenElseTransformer.else) {
        return resolveTransformerResultSchema(
          ifThenElseTransformer.else,
          context,
          transformerDefinitions,
        );
      }

      return { type: "boolean" };
    }
    case "createObject":
      return resolveRecordTransformerDefinitionSchema(
        (transformer as CoreTransformerForBuildPlusRuntime_createObject).definition,
        context,
        transformerDefinitions,
        false,
        "createObject",
      );
    case "filterList": {
      const filterListTransformer = transformer as CoreTransformerForBuildPlusRuntime_filterList;
      const elementSchema = resolveApplyToArrayElementSchema(
        filterListTransformer.applyTo,
        context,
        transformerDefinitions,
        "filterList",
      );
      if (propagateFailure(elementSchema)) {
        return elementSchema;
      }
      const predicateFailure = resolveListPredicateBoolean(
        filterListTransformer.predicate,
        context,
        transformerDefinitions,
        "filterList",
      );
      if (predicateFailure) {
        return predicateFailure;
      }
      return { type: "array", definition: elementSchema };
    }
    case "sortList": {
      const elementSchema = resolveApplyToArrayElementSchema(
        (transformer as CoreTransformerForBuildPlusRuntime_sortList).applyTo,
        context,
        transformerDefinitions,
        "sortList",
      );
      if (propagateFailure(elementSchema)) {
        return elementSchema;
      }
      return { type: "array", definition: elementSchema };
    }
    case "listLength": {
      const listLengthFailure = resolveApplyToArrayElementSchema(
        (transformer as CoreTransformerForBuildPlusRuntime_listLength).applyTo,
        context,
        transformerDefinitions,
        "listLength",
      );
      if (propagateFailure(listLengthFailure)) {
        return listLengthFailure;
      }
      return { type: "number" };
    }
    case "find": {
      const findTransformer = transformer as CoreTransformerForBuildPlusRuntime_find;
      const elementSchema = resolveApplyToArrayElementSchema(
        findTransformer.applyTo,
        context,
        transformerDefinitions,
        "find",
      );
      if (propagateFailure(elementSchema)) {
        return elementSchema;
      }
      const predicateFailure = resolveListPredicateBoolean(
        findTransformer.predicate,
        context,
        transformerDefinitions,
        "find",
      );
      if (predicateFailure) {
        return predicateFailure;
      }
      return elementSchema;
    }
    case "concatLists": {
      const concatListsTransformer = transformer as CoreTransformerForBuildPlusRuntime_concatLists;
      const elementSchemas: JzodElement[] = [];

      for (const [index, listTransformer] of concatListsTransformer.lists.entries()) {
        if (!isTypedTransformer(listTransformer as CoreTransformerForBuildPlusRuntime)) {
          continue;
        }
        const listOperand = listTransformer as TypedTransformer;
        const listSchema = resolveOperandSchema(
          listOperand,
          context,
          transformerDefinitions,
          "concatLists",
          index,
        );
        if (propagateFailure(listSchema)) {
          return listSchema;
        }
        const shapeFailure = validateApplyToSchemaShape(
          "concatLists",
          listOperand,
          listSchema,
          "array",
          { type: "array", definition: { type: "any" } },
        );
        if (shapeFailure) {
          return {
            ...shapeFailure,
            typePath: ["concatLists", "lists", index],
          };
        }
        elementSchemas.push(unwrapArrayElementSchema(listSchema));
      }

      if (elementSchemas.length === 0) {
        return { type: "array", definition: { type: "any" } };
      }

      const allSameType =
        elementSchemas.length > 1 &&
        elementSchemas.every(
          (schema) => JSON.stringify(schema) === JSON.stringify(elementSchemas[0]),
        );

      return {
        type: "array",
        definition: allSameType ? elementSchemas[0] : buildUnionSchema(elementSchemas),
      };
    }
    case "getObjectValues": {
      const applyToSchema = resolveApplyToObjectSchema(
        (transformer as CoreTransformerForBuildPlusRuntime_getObjectValues).applyTo,
        context,
        transformerDefinitions,
        "getObjectValues",
      );
      if (propagateFailure(applyToSchema)) {
        return applyToSchema;
      }
      const objectDefinition = getObjectDefinitionMap(applyToSchema);
      if (!objectDefinition) {
        return { type: "array", definition: { type: "any" } };
      }
      return {
        type: "array",
        definition: buildUnionSchema(Object.values(objectDefinition)),
      };
    }
    case "getObjectEntries": {
      const applyToSchema = resolveApplyToObjectSchema(
        (transformer as CoreTransformerForBuildPlusRuntime_getObjectEntries).applyTo,
        context,
        transformerDefinitions,
        "getObjectEntries",
      );
      if (propagateFailure(applyToSchema)) {
        return applyToSchema;
      }
      return { type: "array", definition: { type: "any" } };
    }
    case "getUniqueValues": {
      const getUniqueValuesTransformer =
        transformer as CoreTransformerForBuildPlusRuntime_getUniqueValues;
      const elementSchema = resolveApplyToArrayElementSchema(
        getUniqueValuesTransformer.applyTo,
        context,
        transformerDefinitions,
        "getUniqueValues",
      );
      if (propagateFailure(elementSchema)) {
        return elementSchema;
      }
      const attribute = getUniqueValuesTransformer.attribute;
      const objectDefinition = getObjectDefinitionMap(elementSchema);
      if (objectDefinition && attribute in objectDefinition) {
        return { type: "array", definition: objectDefinition[attribute] };
      }
      return { type: "array", definition: { type: "any" } };
    }
    case "indexListBy":
    case "listReducerToSpreadObject": {
      const applyToTransformer =
        transformerType === "indexListBy"
          ? (transformer as CoreTransformerForBuildPlusRuntime_indexListBy).applyTo
          : (transformer as CoreTransformerForBuildPlusRuntime_listReducerToSpreadObject).applyTo;
      const elementSchema = resolveApplyToArrayElementSchema(
        applyToTransformer,
        context,
        transformerDefinitions,
        transformerType,
      );
      if (propagateFailure(elementSchema)) {
        return elementSchema;
      }
      return { type: "record", definition: elementSchema };
    }
    case "object_fromEntries": {
      const entriesFailure = resolveApplyToArrayElementSchema(
        (transformer as CoreTransformerForBuildPlusRuntime_object_fromEntries).applyTo,
        context,
        transformerDefinitions,
        "object_fromEntries",
      );
      if (propagateFailure(entriesFailure)) {
        return entriesFailure;
      }
      return { type: "record", definition: { type: "any" } };
    }
    case "mergeIntoObject": {
      const mergeTransformer = transformer as CoreTransformerForBuildPlusRuntime_mergeIntoObject;
      let baseSchema: JzodElement = { type: "object", definition: {} };

      if (mergeTransformer.applyTo && isTypedTransformer(mergeTransformer.applyTo)) {
        const applyToSchema = resolveApplyToObjectSchema(
          mergeTransformer.applyTo,
          context,
          transformerDefinitions,
          "mergeIntoObject",
        );
        if (propagateFailure(applyToSchema)) {
          return applyToSchema;
        }
        baseSchema = applyToSchema;
      }

      const overlaySchema = resolveOperandSchema(
        mergeTransformer.definition,
        context,
        transformerDefinitions,
        "mergeIntoObject",
        "definition",
      );
      if (propagateFailure(overlaySchema)) {
        return overlaySchema;
      }

      if (isObjectLikeSchema(overlaySchema)) {
        return mergeObjectSchemas(baseSchema, overlaySchema);
      }

      const overlayObjectDefinition = getObjectDefinitionMap(overlaySchema);
      if (overlayObjectDefinition) {
        return mergeObjectSchemas(baseSchema, overlaySchema);
      }

      return baseSchema;
    }
    case "createObjectFromPairs": {
      const pairsTransformer =
        transformer as CoreTransformerForBuildPlusRuntime_createObjectFromPairs;
      const objectDefinition: Record<string, JzodElement> = {};

      for (const [index, pair] of pairsTransformer.definition.entries()) {
        const key =
          typeof pair.attributeKey === "string" ? pair.attributeKey : `key${index}`;
        const valueSchema = resolveOperandSchema(
          pair.attributeValue,
          context,
          transformerDefinitions,
          "createObjectFromPairs",
          `definition.${index}.attributeValue`,
        );
        if (propagateFailure(valueSchema)) {
          return valueSchema;
        }
        objectDefinition[key] = valueSchema;
      }

      return { type: "object", definition: objectDefinition };
    }
    case "case":
      return resolveCaseBranchSchemas(
        transformer as CoreTransformerForBuildPlusRuntime_case,
        context,
        transformerDefinitions,
      );
    case "constantAsExtractor": {
      const constantTransformer =
        transformer as CoreTransformerForBuildPlusRuntime_constantAsExtractor;
      if (constantTransformer.valueJzodSchema) {
        return constantTransformer.valueJzodSchema as JzodElement;
      }
      break;
    }
    case "aggregate": {
      const aggregateFailure = resolveApplyToArrayElementSchema(
        (transformer as { applyTo?: CoreTransformerForBuildPlusRuntime }).applyTo,
        context,
        transformerDefinitions,
        "aggregate",
      );
      if (propagateFailure(aggregateFailure)) {
        return aggregateFailure;
      }
      break;
    }
    case "resolveTransformerResultSchema": {
      const resolveSchemaTransformer = transformer as {
        transformer?: CoreTransformerForBuildPlusRuntime;
        context?: TransformerResultSchemaContext;
      };
      if (!resolveSchemaTransformer.transformer) {
        return failTransformerResultSchema(
          "schemaShapeMismatch",
          "resolveTransformerResultSchema: resolveTransformerResultSchema requires transformer parameter",
          { transformerType, typePath: ["transformer"] },
        );
      }
      return resolveTransformerResultSchema(
        resolveSchemaTransformer.transformer,
        resolveSchemaTransformer.context ?? {},
        transformerDefinitions,
      );
    }
  }

  return resultSchema.definition;
}

export function transformer_resolveTransformerResultSchema(
  _step: Step,
  _transformerPath: string[],
  _label: string | undefined,
  transformer: {
    transformer: CoreTransformerForBuildPlusRuntime;
    context?: TransformerResultSchemaContext;
  },
  _resolveBuildTransformersTo: ResolveBuildTransformersTo,
  _modelEnvironment: unknown,
  _transformerParams: Record<string, unknown>,
  _contextResults?: Record<string, unknown>,
): TransformerReturnType<ResolveTransformerResultSchemaReturnType> {
  if (!transformer.transformer) {
    return failTransformerResultSchema(
      "schemaShapeMismatch",
      "resolveTransformerResultSchema: resolveTransformerResultSchema requires transformer parameter",
      { transformerType: "resolveTransformerResultSchema", typePath: ["transformer"] },
    );
  }

  return resolveTransformerResultSchema(
    transformer.transformer,
    transformer.context ?? {},
  );
}

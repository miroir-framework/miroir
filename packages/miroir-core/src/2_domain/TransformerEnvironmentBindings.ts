import type { CoreTransformerForBuildPlusRuntime } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultTransformerInput } from "../0_interfaces/1_core/Transformer";

type TypedTransformer = CoreTransformerForBuildPlusRuntime & { transformerType: string };

const SKIP_WALK_KEYS = new Set(["transformerType", "interpolation", "mlSchema"]);
const LIST_ELEMENT_SLOTS = new Set(["elementTransformer", "predicate"]);
const LIST_COMBINATORS = new Set(["mapList", "filterList", "find"]);

export interface TransformerEnvironment {
  contextNames: string[];
  parameterNames: string[];
}

export interface TransformerEnvironmentBinding extends TransformerEnvironment {
  path: (string | number)[];
  transformerType?: string;
}

function isTypedTransformer(value: unknown): value is TypedTransformer {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "transformerType" in value &&
    typeof (value as { transformerType?: unknown }).transformerType === "string"
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDefinitionRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && !isTypedTransformer(value);
}

function uniqueSorted(names: string[]): string[] {
  return [...new Set(names.filter((name) => name.length > 0))].sort();
}

function withContextName(env: TransformerEnvironment, name: string): TransformerEnvironment {
  return {
    contextNames: uniqueSorted([...env.contextNames, name]),
    parameterNames: [...env.parameterNames],
  };
}

function outerObjectName(record: Record<string, unknown>): string {
  return typeof record.referenceToOuterObject === "string" && record.referenceToOuterObject.length > 0
    ? record.referenceToOuterObject
    : defaultTransformerInput;
}

function childEnvironment(
  parentType: string,
  record: Record<string, unknown>,
  slotKey: string,
  env: TransformerEnvironment,
): TransformerEnvironment {
  if (LIST_COMBINATORS.has(parentType) && LIST_ELEMENT_SLOTS.has(slotKey)) {
    return withContextName(env, outerObjectName(record));
  }
  if (
    parentType === "createObjectFromPairs" &&
    (slotKey === "definition" || slotKey === "attributeValue" || slotKey === "attributeKey")
  ) {
    return withContextName(env, outerObjectName(record));
  }
  return env;
}

function pushBinding(
  bindings: TransformerEnvironmentBinding[],
  path: (string | number)[],
  env: TransformerEnvironment,
  transformerType?: string,
): void {
  bindings.push({
    path,
    transformerType,
    contextNames: uniqueSorted(env.contextNames),
    parameterNames: uniqueSorted(env.parameterNames),
  });
}

/**
 * Walk a transformer tree and record the getFromContext / getFromParameters
 * names visible at each typed node (and at referenceName / referencePath).
 */
export function collectTransformerEnvironmentBindings(
  transformer: CoreTransformerForBuildPlusRuntime,
  root: TransformerEnvironment,
): TransformerEnvironmentBinding[] {
  const bindings: TransformerEnvironmentBinding[] = [];
  if (isTypedTransformer(transformer)) {
    walkEnvironment(transformer, [], root, bindings);
  }
  return bindings;
}

export function formatTransformerEnvironmentLabel(
  binding: TransformerEnvironmentBinding,
): string {
  const last = binding.path[binding.path.length - 1];
  const isReferenceField = last === "referenceName" || last === "referencePath";
  const context = binding.contextNames.length > 0 ? binding.contextNames.join(", ") : "(none)";
  const params = binding.parameterNames.length > 0 ? binding.parameterNames.join(", ") : "(none)";
  if (isReferenceField && binding.parameterNames.length === 0) {
    return `getFromContext: ${context}`;
  }
  if (isReferenceField && binding.contextNames.length === 0) {
    return `getFromParameters: ${params}`;
  }
  return `getFromContext: ${context} · getFromParameters: ${params}`;
}

function walkEnvironment(
  transformer: TypedTransformer,
  path: (string | number)[],
  env: TransformerEnvironment,
  bindings: TransformerEnvironmentBinding[],
): void {
  pushBinding(bindings, path, env, transformer.transformerType);

  if (transformer.transformerType === "getFromContext") {
    pushBinding(bindings, [...path, "referenceName"], { ...env, parameterNames: [] });
    pushBinding(bindings, [...path, "referencePath"], { ...env, parameterNames: [] });
  }
  if (transformer.transformerType === "getFromParameters") {
    pushBinding(bindings, [...path, "referenceName"], { ...env, contextNames: [] });
    pushBinding(bindings, [...path, "referencePath"], { ...env, contextNames: [] });
  }

  const record = transformer as unknown as Record<string, unknown>;
  const handledKeys = new Set<string>(SKIP_WALK_KEYS);

  if (isDefinitionRecord(record.definition)) {
    if (transformer.transformerType === "dataflowObject") {
      let stepEnv = env;
      for (const [stepName, step] of Object.entries(record.definition)) {
        if (!isTypedTransformer(step)) {
          continue;
        }
        walkEnvironment(step, [...path, "definition", stepName], stepEnv, bindings);
        stepEnv = withContextName(stepEnv, stepName);
      }
    } else {
      for (const [stepName, step] of Object.entries(record.definition)) {
        if (!isTypedTransformer(step)) {
          continue;
        }
        walkEnvironment(step, [...path, "definition", stepName], env, bindings);
      }
    }
    handledKeys.add("definition");
  } else if (isTypedTransformer(record.definition)) {
    const overlayEnv =
      transformer.transformerType === "mergeIntoObject"
        ? withContextName(env, outerObjectName(record))
        : env;
    walkEnvironment(record.definition, [...path, "definition"], overlayEnv, bindings);
    handledKeys.add("definition");
  }

  const walkSlot = (value: unknown, childPath: (string | number)[], slotKey: string): void => {
    if (isTypedTransformer(value)) {
      walkEnvironment(
        value,
        childPath,
        childEnvironment(transformer.transformerType, record, slotKey, env),
        bindings,
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

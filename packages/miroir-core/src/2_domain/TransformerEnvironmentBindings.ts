import type { CoreTransformerForBuildPlusRuntime } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { namesBoundBy, transformerScopeBinding } from "./TransformerScope";

type TypedTransformer = CoreTransformerForBuildPlusRuntime & { transformerType: string };

const SKIP_WALK_KEYS = new Set(["transformerType", "interpolation", "mlSchema"]);

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

function uniqueSorted(names: string[]): string[] {
  return [...new Set(names.filter((name) => name.length > 0))].sort();
}

function withContextNames(env: TransformerEnvironment, names: string[]): TransformerEnvironment {
  return {
    contextNames: uniqueSorted([...env.contextNames, ...names]),
    parameterNames: [...env.parameterNames],
  };
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

  // Below a slot, transformers sit directly, in lists or in plain records, all in the slot's scope.
  const walkSlot = (value: unknown, childPath: (string | number)[], slotEnv: TransformerEnvironment): void => {
    if (isTypedTransformer(value)) {
      walkEnvironment(value, childPath, slotEnv, bindings);
      return;
    }
    if (Array.isArray(value)) {
      for (const [index, item] of value.entries()) {
        walkSlot(item, [...childPath, index], slotEnv);
      }
      return;
    }
    if (isPlainObject(value)) {
      for (const [nestedKey, nested] of Object.entries(value)) {
        walkSlot(nested, [...childPath, nestedKey], slotEnv);
      }
    }
  };

  for (const [key, value] of Object.entries(record)) {
    if (SKIP_WALK_KEYS.has(key)) {
      continue;
    }
    const binding = transformerScopeBinding(transformer, key);
    if (binding === "earlierSteps" && isPlainObject(value) && !isTypedTransformer(value)) {
      for (const [stepName, step] of Object.entries(value)) {
        walkSlot(step, [...path, key, stepName], withContextNames(env, namesBoundBy(transformer, binding, stepName)));
      }
      continue;
    }
    walkSlot(value, [...path, key], binding ? withContextNames(env, namesBoundBy(transformer, binding, undefined)) : env);
  }
}

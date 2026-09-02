import type {
  CoreTransformerForBuildPlusRuntime,
  Entity,
  EntityInstance,
  JzodElement,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { TransformerFailure } from "../0_interfaces/2_domain/DomainElement";
import { transformer_extended_apply_wrapper } from "./TransformersForRuntime";

/** Identity fields from `entityDefinitionRoot`; never treated as virtual. */
const ENTITY_IDENTITY_ATTRIBUTE_NAMES = new Set([
  "uuid",
  "parentName",
  "parentUuid",
  "parentDefinitionVersionUuid",
  "conceptLevel",
]);

export type VirtualAttributeNeed = {
  filterAttributeName?: string;
  orderByAttributeName?: string;
  projectedAttributes?: string[]; // extractor.attributes; undefined = "all stored, no virtual"
  referencedAttributeNames?: string[]; // names collected from the rest of the query / report display
};

function virtualAttributeTransformer(
  schema: JzodElement,
): CoreTransformerForBuildPlusRuntime | undefined {
  const virtual = (
    schema as { tag?: { value?: { virtualAttribute?: unknown } } }
  ).tag?.value?.virtualAttribute;
  if (virtual == null) {
    return undefined;
  }
  return virtual as CoreTransformerForBuildPlusRuntime;
}

/** True when the attribute schema is marked virtual (tag.value.virtualAttribute present). */
export function isVirtualAttribute(schema: JzodElement): boolean {
  return virtualAttributeTransformer(schema) != null;
}

/** Virtual attribute names on the Entity present-model mlSchema (not entityDefinitionRoot identity fields). */
export function listVirtualAttributeNames(entity: Entity): string[] {
  const definition = entity.mlSchema?.definition ?? {};
  return Object.entries(definition)
    .filter(
      ([name, schema]) =>
        !ENTITY_IDENTITY_ATTRIBUTE_NAMES.has(name) && isVirtualAttribute(schema),
    )
    .map(([name]) => name);
}

/** Subset of virtual names that this need requires. */
export function requiredVirtualAttributeNames(
  entity: Entity,
  need: VirtualAttributeNeed,
): string[] {
  const virtual = new Set(listVirtualAttributeNames(entity));
  const needed: string[] = [];
  const add = (name: string | undefined) => {
    if (name && virtual.has(name) && !needed.includes(name)) {
      needed.push(name);
    }
  };
  add(need.filterAttributeName);
  add(need.orderByAttributeName);
  for (const name of need.projectedAttributes ?? []) {
    add(name);
  }
  for (const name of need.referencedAttributeNames ?? []) {
    add(name);
  }
  return needed;
}

function storedFieldsContext(
  instance: EntityInstance,
  virtualNames: Set<string>,
): Record<string, unknown> {
  const context: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(instance as Record<string, unknown>)) {
    if (!virtualNames.has(key)) {
      context[key] = value;
    }
  }
  return context;
}

/**
 * Return a shallow copy of `instance` with required virtual names overlaid.
 * Unrequested virtual names are absent. Does not mutate `instance`.
 * Transformer context = stored fields of `instance` only.
 */
export function evaluateVirtualAttributesOnInstance(
  entity: Entity,
  instance: EntityInstance,
  neededNames: string[],
  modelEnvironment: MiroirModelEnvironment,
  transformerParams?: Record<string, any>,
): EntityInstance {
  const virtualNames = new Set(listVirtualAttributeNames(entity));
  const result: Record<string, unknown> = { ...(instance as Record<string, unknown>) };
  for (const name of virtualNames) {
    delete result[name];
  }
  const contextResults = storedFieldsContext(instance, virtualNames);
  const params = transformerParams ?? {};
  const definition = entity.mlSchema?.definition ?? {};

  for (const name of neededNames) {
    if (!virtualNames.has(name)) {
      continue;
    }
    const schema = definition[name];
    if (!schema) {
      continue;
    }
    const transformer = virtualAttributeTransformer(schema);
    if (!transformer) {
      continue;
    }
    const evaluated = transformer_extended_apply_wrapper(
      undefined,
      "runtime",
      [name],
      name,
      transformer,
      "constantTransformer",
      modelEnvironment,
      params,
      contextResults,
    );
    if (evaluated instanceof TransformerFailure) {
      throw evaluated;
    }
    result[name] = evaluated;
  }

  return result as EntityInstance;
}

/** Drop virtual keys before persist (idempotent). */
export function stripVirtualAttributesFromInstance(
  entity: Entity,
  instance: EntityInstance,
): EntityInstance {
  const virtualNames = listVirtualAttributeNames(entity);
  if (virtualNames.length === 0) {
    return instance;
  }
  const result: Record<string, unknown> = { ...(instance as Record<string, unknown>) };
  let changed = false;
  for (const name of virtualNames) {
    if (Object.prototype.hasOwnProperty.call(result, name)) {
      delete result[name];
      changed = true;
    }
  }
  return (changed ? result : instance) as EntityInstance;
}

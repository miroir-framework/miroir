import type {
  MetaModel,
  MlElement,
  TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { coreBuildPlusRuntimeReferenceMap } from "./Transformers";
import { transformerInterfaceFromDefinition } from "./Transformer_tools";
import { applicationTransformerDefinitions } from "./TransformersForRuntime";

// ################################################################################################
// Issue #502 (analysis #497, D9) — the TransformerDefinitions a transformer may use: Miroir's stock
// definitions, plus the composite TransformerDefinitions of the current application. Every reader
// of the stock map (runtime, checks, #88 inference, block model, tree edits, palette, SQL) reads
// the registry of its model environment instead.
// - Only composites (`transformerImplementationType: "transformer"`) of the application are added:
//   a library implementation needs code the application cannot bring.
// - A stock name wins: an application definition named like a stock transformer is left out, and
//   reported by `transformerDefinitionRegistryConflicts`.
// ################################################################################################

export type TransformerDefinitionRegistry = Record<string, TransformerDefinition>;

const registries = new WeakMap<MetaModel, TransformerDefinitionRegistry>();

/** The application definitions the registry adds to the stock ones: composites with a free name. */
export function applicationCompositeTransformerDefinitions(
  definitions: TransformerDefinition[] | undefined,
): TransformerDefinition[] {
  return (definitions ?? []).filter(
    (definition) =>
      definition.transformerImplementation?.transformerImplementationType === "transformer" &&
      !Object.hasOwn(applicationTransformerDefinitions, definition.name),
  );
}

/** The registry of the application definitions `definitions`, next to the stock ones. */
export function transformerDefinitionRegistryOf(
  definitions: TransformerDefinition[] | undefined,
): TransformerDefinitionRegistry {
  const added = applicationCompositeTransformerDefinitions(definitions);
  return added.length === 0
    ? applicationTransformerDefinitions
    : { ...applicationTransformerDefinitions, ...Object.fromEntries(added.map((definition) => [definition.name, definition])) };
}

/**
 * The registry of `modelEnvironment`: the stock definitions and the composites of its current
 * model. Models are immutable state, so the registry is kept per model object.
 */
export function transformerDefinitionRegistry(
  modelEnvironment: Pick<MiroirModelEnvironment, "currentModel"> | undefined,
): TransformerDefinitionRegistry {
  const model = modelEnvironment?.currentModel;
  if (!model || typeof model !== "object") {
    return applicationTransformerDefinitions;
  }
  const known = registries.get(model);
  if (known) {
    return known;
  }
  const registry = transformerDefinitionRegistryOf(model.transformerDefinitions);
  registries.set(model, registry);
  return registry;
}

/**
 * The application definitions left out of the registry because a stock transformer has their
 * name; Miroir's own stored definitions are the stock ones, not conflicts.
 */
export function transformerDefinitionRegistryConflicts(definitions: TransformerDefinition[] | undefined): string[] {
  return (definitions ?? [])
    .filter(
      (definition) =>
        Object.hasOwn(applicationTransformerDefinitions, definition.name) &&
        applicationTransformerDefinitions[definition.name].uuid !== definition.uuid,
    )
    .map((definition) => definition.name);
}

/** The schema name of the transformer union branch of the application composite `name`. */
export function applicationTransformerBranchName(name: string): string {
  return `applicationTransformerForBuildPlusRuntime_${name}`;
}

/**
 * The branches the application composites add to the transformer union of a deployment schema,
 * by schema name: built like the stock branches (`miroirCoreTransformersForBuildPlusRuntime`),
 * with the optional `interpolation` and `label` of every transformer and the composite's parameters.
 */
export function applicationTransformerBranches(
  definitions: TransformerDefinition[] | undefined,
): Record<string, MlElement> {
  return Object.fromEntries(
    applicationCompositeTransformerDefinitions(definitions).map((definition) => [
      applicationTransformerBranchName(definition.name),
      transformerInterfaceFromDefinition(definition, "coreBuildPlusRuntime", coreBuildPlusRuntimeReferenceMap, true),
    ]),
  );
}

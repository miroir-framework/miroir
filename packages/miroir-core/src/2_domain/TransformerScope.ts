import { defaultTransformerInput } from "../0_interfaces/1_core/Transformer";

// ################################################################################################
// Issue #501 — the scope rules of transformers, in one table: which slots of which transformer
// types see more names than their parent, and which names. The runtime handlers of
// TransformersForRuntime bind them; the subtree run of the block view (#500) and the names in
// scope (#501) read this table. The #249 interface walk keeps its own code, as it binds schemas.
// ################################################################################################

/**
 * How a slot of a transformer type extends the context of what sits in it:
 * - `eachElement`: the evaluated `applyTo`, a list, is run through once per element, bound to
 *   `referenceToOuterObject` (default `defaultInput`);
 * - `eachElementOrValue`: the same, an object being run through once per value;
 * - `applyTo`: the evaluated `applyTo`, bound once to `referenceToOuterObject`;
 * - `earlierSteps`: each entry of the record sees the results of the entries before it, by name;
 * - `eachAggregateGroup`: once per group of an aggregate, its aggregated value bound to
 *   `aggregateValue`.
 */
export type TransformerScopeBinding =
  | "eachElement"
  | "eachElementOrValue"
  | "applyTo"
  | "earlierSteps"
  | "eachAggregateGroup";

/** Transformer type → slot attribute → binding (the runtime handler of each type). */
export const TRANSFORMER_SCOPE_RULES: Readonly<Record<string, Readonly<Record<string, TransformerScopeBinding>>>> = {
  mapList: { elementTransformer: "eachElementOrValue" },
  filterList: { predicate: "eachElement" },
  find: { predicate: "eachElement" },
  createObjectFromPairs: { definition: "applyTo" },
  mergeIntoObject: { definition: "applyTo" },
  dataflowObject: { definition: "earlierSteps" },
  aggregate: { having: "eachAggregateGroup" },
};

/** The name `aggregate` binds the aggregated value of a group to, in its `having`. */
export const AGGREGATE_VALUE_NAME = "aggregateValue";

/** A transformer node, as the scope rules read it. */
type ScopedNode = { transformerType: string };

/** The binding of `slot` of `node`, if the slot sees more names than `node`. */
export function transformerScopeBinding(node: ScopedNode, slot: string | number): TransformerScopeBinding | undefined {
  return TRANSFORMER_SCOPE_RULES[node.transformerType]?.[String(slot)];
}

/** The name a list or applyTo binding binds its value to. */
export function outerObjectName(node: ScopedNode): string {
  const name = (node as { referenceToOuterObject?: unknown }).referenceToOuterObject;
  return typeof name === "string" && name.length > 0 ? name : defaultTransformerInput;
}

/**
 * The names `binding`, at a slot of `node`, adds to the context of what sits at `step`, the path
 * segment after the slot (the entry of an `earlierSteps` record).
 */
export function namesBoundBy(
  node: ScopedNode,
  binding: TransformerScopeBinding,
  step: string | number | undefined,
): string[] {
  switch (binding) {
    case "eachElement":
    case "eachElementOrValue":
    case "applyTo":
      return [outerObjectName(node)];
    case "eachAggregateGroup":
      return [AGGREGATE_VALUE_NAME];
    case "earlierSteps": {
      const definition = (node as { definition?: unknown }).definition;
      if (typeof definition !== "object" || definition === null || Array.isArray(definition)) {
        return [];
      }
      const names = Object.keys(definition);
      const index = step === undefined ? -1 : names.indexOf(String(step));
      return index < 0 ? names : names.slice(0, index);
    }
  }
}

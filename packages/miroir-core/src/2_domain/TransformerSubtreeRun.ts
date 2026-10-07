import type { CoreTransformerForBuildPlusRuntime } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultTransformerInput, type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type { TransformerSubtreeRun } from "../0_interfaces/2_domain/TransformerSubtreeRunInterface";
import { defaultMiroirModelEnvironment } from "../1_core/Model";
import { resolveApplyTo_legacy, transformer_extended_apply_wrapper } from "./TransformersForRuntime";

// ################################################################################################
// Issue #500 — run one node of a transformer tree, as the block view's result bubble does. The
// context of a node is rebuilt along its path, as the runtime builds it: the binding table below
// says which slots of which transformer types see more than their parent's context. #501 extends
// the table (variables and scope).
// ################################################################################################

type TransformerNode = { transformerType: string } & Record<string, unknown>;

/**
 * How a slot of a transformer type extends the context of what sits in it:
 * - `eachElement`: the evaluated `applyTo`, a list, is run through once per element, bound to
 *   `referenceToOuterObject` (default `defaultInput`);
 * - `eachElementOrValue`: the same, an object being run through once per value;
 * - `applyTo`: the evaluated `applyTo`, bound once to `referenceToOuterObject`;
 * - `earlierSteps`: each entry of the record sees the results of the entries before it, by name.
 */
type ContextBinding = "eachElement" | "eachElementOrValue" | "applyTo" | "earlierSteps";

/** Transformer type → slot attribute → binding (TransformersForRuntime handlers of each type). */
const CONTEXT_BINDINGS: Record<string, Record<string, ContextBinding>> = {
  mapList: { elementTransformer: "eachElementOrValue" },
  filterList: { predicate: "eachElement" },
  find: { predicate: "eachElement" },
  createObjectFromPairs: { definition: "applyTo" },
  mergeIntoObject: { definition: "applyTo" },
  dataflowObject: { definition: "earlierSteps" },
};

interface RunContext {
  labels: string[];
  context: Record<string, unknown>;
  /** The result of an ancestor that cannot run its slot on its `applyTo`: the run holds it. */
  ancestorFailure?: unknown;
}

function isTransformerNode(value: unknown): value is TransformerNode {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { transformerType?: unknown }).transformerType === "string"
  );
}

function valueAt(value: unknown, path: (string | number)[]): unknown {
  return path.reduce<unknown>(
    (current, segment) =>
      typeof current === "object" && current !== null ? (current as Record<string, unknown>)[segment] : undefined,
    value,
  );
}

function outerObjectName(node: TransformerNode): string {
  return typeof node.referenceToOuterObject === "string" && node.referenceToOuterObject.length > 0
    ? node.referenceToOuterObject
    : defaultTransformerInput;
}

/**
 * The elements an `eachElement` / `eachElementOrValue` ancestor runs its slot on, labelled with the
 * name it binds and the element's index or key; `undefined` when the runtime rejects `list`.
 */
function elementsOf(
  list: unknown,
  binding: "eachElement" | "eachElementOrValue",
  name: string,
): [string, unknown][] | undefined {
  if (Array.isArray(list)) {
    return list.map((element, index) => [`${name}[${index}]`, element]);
  }
  if (binding === "eachElementOrValue" && typeof list === "object" && list !== null) {
    return Object.entries(list).map(([key, element]) => [`${name}.${key}`, element]);
  }
  return undefined;
}

/**
 * The runs of the node at `path` of `root` (#500): once in the root's context, or once per
 * context its ancestors give it, `transformerParams` and `contextResults` being those of the root.
 * An ancestor that runs its slot once per element gives one run per element, labelled with the
 * name it binds and the element's index or key. A run whose evaluation fails holds the failure;
 * when an ancestor cannot run its slot on its `applyTo` (`filterList` on an object, `mapList` on a
 * string), the one run holds that ancestor's own failure.
 */
export function transformerSubtreeRuns(
  root: unknown,
  path: (string | number)[],
  transformerParams: Record<string, unknown>,
  contextResults: Record<string, unknown>,
  modelEnvironment: MiroirModelEnvironment = defaultMiroirModelEnvironment,
): TransformerSubtreeRun[] {
  const target = valueAt(root, path);
  if (!isTransformerNode(target)) {
    throw new Error(`transformerSubtreeRuns: ${path.join(".") || "the root"} is not a transformer`);
  }
  const apply = (node: unknown, nodePath: (string | number)[], context: Record<string, unknown>) =>
    transformer_extended_apply_wrapper(
      undefined,
      "runtime",
      nodePath.map(String),
      undefined,
      node as CoreTransformerForBuildPlusRuntime,
      "value",
      modelEnvironment,
      transformerParams,
      context,
    );
  const applyTo = (node: TransformerNode, nodePath: (string | number)[], context: Record<string, unknown>) =>
    node.transformerType === "createObjectFromPairs" && !node.applyTo
      ? {}
      : resolveApplyTo_legacy(
          node as any,
          "runtime",
          nodePath.map(String),
          "value",
          modelEnvironment,
          transformerParams,
          context,
          undefined,
        );

  let runs: RunContext[] = [{ labels: [], context: contextResults }];
  for (let depth = 0; depth < path.length; depth++) {
    const nodePath = path.slice(0, depth);
    const node = valueAt(root, nodePath);
    const binding = isTransformerNode(node) ? CONTEXT_BINDINGS[node.transformerType]?.[String(path[depth])] : undefined;
    if (!binding || !isTransformerNode(node)) {
      continue;
    }
    const name = outerObjectName(node);
    runs = runs.flatMap((run): RunContext[] => {
      if (run.ancestorFailure !== undefined) {
        return [run];
      }
      switch (binding) {
        case "applyTo":
          return [{ labels: run.labels, context: { ...run.context, [name]: applyTo(node, nodePath, run.context) } }];
        case "eachElement":
        case "eachElementOrValue": {
          const elements = elementsOf(applyTo(node, nodePath, run.context), binding, name);
          if (elements === undefined) {
            return [{ ...run, ancestorFailure: apply(node, nodePath, run.context) }];
          }
          return elements.map(([label, element]) => ({
            labels: [...run.labels, label],
            context: { ...run.context, [name]: element },
          }));
        }
        case "earlierSteps": {
          const stepName = String(path[depth + 1]);
          const context = { ...run.context };
          for (const [earlierName, step] of Object.entries((node.definition ?? {}) as Record<string, unknown>)) {
            if (earlierName === stepName) {
              break;
            }
            context[earlierName] = apply(step, [...nodePath, "definition", earlierName], context);
          }
          return [{ labels: run.labels, context }];
        }
      }
    });
  }
  return runs.map((run) => ({
    ...(run.labels.length > 0 ? { label: run.labels.join(", ") } : {}),
    value: run.ancestorFailure !== undefined ? run.ancestorFailure : apply(target, path, run.context),
  }));
}

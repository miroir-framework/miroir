import type {
  CoreTransformerForBuildPlusRuntime,
  MlElement,
  TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { isFailedTransformerInterfaceFromDefinition } from "../0_interfaces/2_domain/TransformerResultSchemaInterface";
import { transformerEnvironmentAt } from "./TransformerEnvironmentBindings";
import { resolveTransformerResultSchema, type TransformerResultSchemaContext } from "./Transformer_ResultSchema";
import { applicationTransformerDefinitions } from "./TransformersForRuntime";

// ################################################################################################
// Issue #502 (analysis #497) — editing a composite TransformerDefinition as a Scratch "define"
// block: its parameters, bound in the context of its body (`transformer_extended_apply`), are
// read by `getFromContext` blocks. A parameter is renamed with the reads that see it; a name
// bound inside the body (a `mapList` element, a dataflow step, ...) shadows it and keeps its
// reads. A transformer is saved as a composite whose parameters are the names it reads free.
// ################################################################################################

type Path = (string | number)[];

const ENTITY_TRANSFORMER_DEFINITION = "a557419d-a288-4fb8-8a1e-971c86c113b8";
/** The uuid of the fundamental ML schema, where the transformer union lives. */
const MIROIR_FUNDAMENTAL_ML_SCHEMA = "fe9b7d99-f216-44de-bb6e-60e1a1ebb739";

/**
 * The schema of a parameter of a saved composite: a slot, where a caller puts a value or a
 * transformer (the block view shows it as a slot), evaluated before the body runs.
 */
export const compositeParameterSchema: MlElement = {
  type: "union",
  definition: [
    {
      type: "schemaReference",
      definition: { absolutePath: MIROIR_FUNDAMENTAL_ML_SCHEMA, relativePath: "coreTransformerForBuildPlusRuntime" },
    },
    { type: "any" },
  ],
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTransformerNode(value: unknown): value is { transformerType: string } & Record<string, unknown> {
  return isPlainRecord(value) && typeof value.transformerType === "string";
}

/** The name a `getFromContext` node reads first: its non-empty `referenceName`, else its `referencePath` head. */
function readName(node: Record<string, unknown>): string | undefined {
  if (typeof node.referenceName === "string" && node.referenceName.length > 0) {
    return node.referenceName;
  }
  return Array.isArray(node.referencePath) && node.referencePath.length > 0 ? String(node.referencePath[0]) : undefined;
}

/** The paths of the `getFromContext` nodes of `body`, the value of a `returnValue` excepted. */
function contextReads(body: unknown): { path: Path; name: string }[] {
  const reads: { path: Path; name: string }[] = [];
  const visit = (value: unknown, path: Path) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, [...path, index]));
      return;
    }
    if (!isPlainRecord(value)) {
      return;
    }
    if (isTransformerNode(value) && value.transformerType === "getFromContext") {
      const name = readName(value);
      if (name !== undefined) {
        reads.push({ path, name });
      }
    }
    for (const [key, child] of Object.entries(value)) {
      if (isTransformerNode(value) && value.transformerType === "returnValue" && key === "value") {
        continue;
      }
      visit(child, [...path, key]);
    }
  };
  visit(body, []);
  return reads;
}

/** Whether a name bound inside `body`, above `path`, hides the context name `name` there. */
function isShadowed(body: unknown, path: Path, name: string): boolean {
  return transformerEnvironmentAt(body, path, { contextNames: [], parameterNames: [] }).contextNames.includes(name);
}

/** The paths of the reads of the context name `name` in `body` that see the body's own context. */
export function contextNameReadPaths(body: unknown, name: string): Path[] {
  return contextReads(body)
    .filter((read) => read.name === name && !isShadowed(body, read.path, name))
    .map((read) => read.path);
}

/** The context names `body` reads that are not bound inside it, sorted: the parameters it needs. */
export function freeContextNames(body: unknown): string[] {
  return [
    ...new Set(contextReads(body).filter((read) => !isShadowed(body, read.path, read.name)).map((read) => read.name)),
  ].sort();
}

function withValueAt(root: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) {
    return value;
  }
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = [...root];
    copy[Number(head)] = withValueAt(root[Number(head)], rest, value);
    return copy;
  }
  const base = isPlainRecord(root) ? root : {};
  return { ...base, [head]: withValueAt(base[head], rest, value) };
}

function valueAt(root: unknown, path: Path): unknown {
  return path.reduce<unknown>((current, key) => (isPlainRecord(current) || Array.isArray(current) ? (current as any)[key] : undefined), root);
}

/** `body` with the reads of the context name `from` that see the body's own context reading `to`. */
export function renameContextName(body: unknown, from: string, to: string): unknown {
  return contextNameReadPaths(body, from).reduce((result, path) => {
    const node = valueAt(result, path) as Record<string, unknown>;
    const renamed =
      typeof node.referenceName === "string" && node.referenceName.length > 0
        ? { ...node, referenceName: to }
        : { ...node, referencePath: [to, ...(node.referencePath as unknown[]).slice(1)] };
    return withValueAt(result, path, renamed);
  }, body);
}

/** The parameters of a TransformerDefinition, by name, from its `transformerParameterSchema`. */
export function transformerDefinitionParameters(definition: TransformerDefinition): Record<string, MlElement> {
  return (definition.transformerInterface.transformerParameterSchema.transformerDefinition.definition ?? {}) as Record<
    string,
    MlElement
  >;
}

/**
 * The header of the define block of a composite: its parameters in order, each with whether its
 * body reads it (a parameter it reads cannot be removed).
 */
export function transformerDefinitionParameterUses(definition: TransformerDefinition): { name: string; read: boolean }[] {
  const body = bodyOf(definition);
  return Object.keys(transformerDefinitionParameters(definition)).map((name) => ({
    name,
    read: contextNameReadPaths(body, name).length > 0,
  }));
}

function withParameters(definition: TransformerDefinition, parameters: Record<string, MlElement>): TransformerDefinition {
  const parameterSchema = definition.transformerInterface.transformerParameterSchema;
  return {
    ...definition,
    transformerInterface: {
      ...definition.transformerInterface,
      transformerParameterSchema: {
        ...parameterSchema,
        transformerDefinition: { ...parameterSchema.transformerDefinition, definition: parameters },
      },
    },
  };
}

function bodyOf(definition: TransformerDefinition): unknown {
  return definition.transformerImplementation.transformerImplementationType === "transformer"
    ? definition.transformerImplementation.definition
    : undefined;
}

function withBody(definition: TransformerDefinition, body: unknown): TransformerDefinition {
  return {
    ...definition,
    transformerImplementation: {
      transformerImplementationType: "transformer",
      definition: body as CoreTransformerForBuildPlusRuntime,
    },
  };
}

function checkComposite(definition: TransformerDefinition, operation: string): void {
  if (definition.transformerImplementation.transformerImplementationType !== "transformer") {
    throw new Error(`${operation}: ${definition.name} is not a composite TransformerDefinition`);
  }
}

/** `definition` with a new parameter `name` (by default a slot taking any value), last. */
export function addTransformerParameter(
  definition: TransformerDefinition,
  name: string,
  schema: MlElement = compositeParameterSchema,
): TransformerDefinition {
  checkComposite(definition, "addTransformerParameter");
  const parameters = transformerDefinitionParameters(definition);
  if (name.length === 0 || Object.hasOwn(parameters, name)) {
    throw new Error(`addTransformerParameter: ${definition.name} already has a parameter named "${name}"`);
  }
  return withParameters(definition, { ...parameters, [name]: schema });
}

/**
 * `definition` with its parameter `from` named `to`, in place, and the reads of `from` in the body
 * that see the parameter reading `to`. A read under a binding of the same name is left as is.
 */
export function renameTransformerParameter(definition: TransformerDefinition, from: string, to: string): TransformerDefinition {
  checkComposite(definition, "renameTransformerParameter");
  const parameters = transformerDefinitionParameters(definition);
  if (!Object.hasOwn(parameters, from)) {
    throw new Error(`renameTransformerParameter: ${definition.name} has no parameter named "${from}"`);
  }
  if (from === to) {
    return definition;
  }
  if (to.length === 0 || Object.hasOwn(parameters, to)) {
    throw new Error(`renameTransformerParameter: ${definition.name} already has a parameter named "${to}"`);
  }
  const renamed = Object.fromEntries(Object.entries(parameters).map(([name, schema]) => [name === from ? to : name, schema]));
  return withBody(withParameters(definition, renamed), renameContextName(bodyOf(definition), from, to));
}

/** `definition` without its parameter `name`; refused while the body reads it. */
export function removeTransformerParameter(definition: TransformerDefinition, name: string): TransformerDefinition {
  checkComposite(definition, "removeTransformerParameter");
  const parameters = transformerDefinitionParameters(definition);
  if (!Object.hasOwn(parameters, name)) {
    throw new Error(`removeTransformerParameter: ${definition.name} has no parameter named "${name}"`);
  }
  const reads = contextNameReadPaths(bodyOf(definition), name);
  if (reads.length > 0) {
    throw new Error(
      `removeTransformerParameter: the body of ${definition.name} reads "${name}" at ${reads.map((path) => path.join(".") || "root").join(", ")}`,
    );
  }
  const { [name]: _removed, ...rest } = parameters;
  return withParameters(definition, rest);
}

/**
 * A composite TransformerDefinition named `name` running `body`. Its parameters are `parameters`,
 * or else the names `body` reads free, each a slot taking any value; its result schema is the one
 * #88 infers from `body` with the parameters' schemas, `any` when it cannot.
 */
export function compositeTransformerDefinition(params: {
  uuid: string;
  name: string;
  body: unknown;
  parameters?: Record<string, MlElement>;
  description?: string;
  transformerDefinitions?: Record<string, TransformerDefinition>;
}): TransformerDefinition {
  const parameters =
    params.parameters ?? Object.fromEntries(freeContextNames(params.body).map((name) => [name, compositeParameterSchema]));
  const inferred = resolveTransformerResultSchema(
    params.body as CoreTransformerForBuildPlusRuntime,
    Object.fromEntries(Object.keys(parameters).map((name) => [name, { type: "any" }])) as TransformerResultSchemaContext,
    params.transformerDefinitions ?? applicationTransformerDefinitions,
  );
  const resultSchema: MlElement = isFailedTransformerInterfaceFromDefinition(inferred) ? { type: "any" } : inferred;
  return {
    uuid: params.uuid,
    parentName: "TransformerDefinition",
    parentUuid: ENTITY_TRANSFORMER_DEFINITION,
    name: params.name,
    defaultLabel: params.name,
    ...(params.description ? { description: params.description } : {}),
    transformerInterface: {
      transformerParameterSchema: {
        transformerType: { type: "literal", definition: params.name },
        transformerDefinition: { type: "object", definition: parameters },
      },
      transformerResultSchema: { returns: "mlSchema", definition: resultSchema },
    },
    transformerImplementation: {
      transformerImplementationType: "transformer",
      definition: params.body as CoreTransformerForBuildPlusRuntime,
    },
  };
}

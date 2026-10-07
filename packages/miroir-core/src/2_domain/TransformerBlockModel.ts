import type {
  MlElement,
  MlObject,
  MlReference,
  TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type {
  BlockNode,
  BlockPath,
  BlockTree,
  BlockTreeStats,
  TransformerBlock,
  TransformerBlockParameter,
  TransformerBlockRow,
} from "../0_interfaces/2_domain/TransformerBlockModelInterface";
import { defaultMiroirModelEnvironment } from "../1_core/Model";
import { declaredAttributeSchemas, transformerSlots } from "./TransformerTreeEdit";
import { applicationTransformerDefinitions } from "./TransformersForRuntime";

// ################################################################################################
// Issue #498 (analysis #497) — a transformer value as a tree of Scratch-style blocks: one block
// per transformer, with its primitive parameters in the header and one row per slot or
// structured attribute. Slots come from the TransformerDefinition (`transformerSlots`); any other
// object with a string `transformerType` is a block too (analysis D5), except inside the `value`
// of a `returnValue`, which the runtime returns without evaluating it.
// ################################################################################################

type TransformerNode = { transformerType: string } & Record<string, unknown>;

export interface TransformerBlockModelOptions {
  transformerDefinitions?: Record<string, TransformerDefinition>;
  modelEnvironment?: MiroirModelEnvironment;
}

/** Attributes every transformer has: shown in the header or as the build marking, never as rows. */
const COMMON_ATTRIBUTES = new Set(["transformerType", "interpolation", "label"]);
const APPLY_TO = "applyTo";
/** Schema references whose target is an ML schema: shown as a chip. */
const ML_SCHEMA_REFERENCE = /^ml[A-Z]/;
/**
 * Parameters named as ML schemas (`mlSchema`, `valueMlSchema`, see docs/reference/ml-nomenclature.md)
 * whose schema is not a reference: `returnValue.mlSchema` is an inline union, for instance.
 */
const ML_SCHEMA_NAME = /^(ml|.+Ml)Schema$/;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTransformerNode(value: unknown): value is TransformerNode {
  return isPlainRecord(value) && typeof value.transformerType === "string";
}

function isPrimitive(value: unknown): boolean {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

/** Every schema reference of `schema`, or `undefined` when some part of it is not a reference. */
function referencedNames(schema: MlElement): string[] | undefined {
  switch (schema.type) {
    case "schemaReference": {
      const relativePath = (schema as MlReference).definition?.relativePath;
      return relativePath ? [relativePath] : undefined;
    }
    case "array":
    case "record":
      return referencedNames(schema.definition as MlElement);
    case "union": {
      const names = (schema.definition as MlElement[]).map(referencedNames);
      return names.every((name) => name !== undefined) ? names.flat() as string[] : undefined;
    }
    default:
      return undefined;
  }
}

function containsTransformer(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsTransformer);
  }
  return isPlainRecord(value) && (isTransformerNode(value) || Object.values(value).some(containsTransformer));
}

/** An ML schema parameter given as a value, not computed by a transformer. */
function isMlSchemaValue(name: string, schema: MlElement | undefined, value: unknown): boolean {
  const names = schema ? referencedNames(schema) : undefined;
  const declaredMlSchema =
    (!!names && names.length > 0 && names.every((reference) => ML_SCHEMA_REFERENCE.test(reference))) ||
    ML_SCHEMA_NAME.test(name);
  return declaredMlSchema && !containsTransformer(value);
}

interface TransformerTypeInfo {
  category: string;
  /** Declared attributes, the definition's own first, in declaration order, then its extensions. */
  attributes: [string, MlElement][];
  slotAttributes: Set<string>;
}

const typeInfoCache = new WeakMap<
  Record<string, TransformerDefinition>,
  WeakMap<MiroirModelEnvironment, Map<string, TransformerTypeInfo>>
>();

function transformerTypeInfo(
  transformerType: string,
  transformerDefinitions: Record<string, TransformerDefinition>,
  modelEnvironment: MiroirModelEnvironment,
): TransformerTypeInfo | undefined {
  const definition = transformerDefinitions[transformerType];
  if (!definition) {
    return undefined;
  }
  const byEnvironment = typeInfoCache.get(transformerDefinitions) ?? new WeakMap();
  typeInfoCache.set(transformerDefinitions, byEnvironment);
  const byType = byEnvironment.get(modelEnvironment) ?? new Map<string, TransformerTypeInfo>();
  byEnvironment.set(modelEnvironment, byType);
  const cached = byType.get(transformerType);
  if (cached) {
    return cached;
  }
  const ownSchema = definition.transformerInterface?.transformerParameterSchema?.transformerDefinition as
    | MlObject
    | undefined;
  const own = Object.keys(ownSchema?.definition ?? {});
  const declared = declaredAttributeSchemas(transformerType, modelEnvironment, transformerDefinitions);
  const order = [...own, ...Object.keys(declared).filter((name) => !own.includes(name))];
  const info: TransformerTypeInfo = {
    category: definition.classification ?? "unknown",
    attributes: order.filter((name) => !COMMON_ATTRIBUTES.has(name)).map((name) => [name, declared[name]]),
    slotAttributes: new Set(
      transformerSlots(transformerType, transformerDefinitions).map((slot) => slot.template[0]),
    ),
  };
  byType.set(transformerType, info);
  return info;
}

interface BuildContext {
  transformerDefinitions: Record<string, TransformerDefinition>;
  modelEnvironment: MiroirModelEnvironment;
  stats: { transformerBlocks: number; jsonBlocks: number; categories: Set<string> };
}

/** The block of any evaluated value: a transformer, a plain object or array, or a primitive. */
function blockOf(value: unknown, path: BlockPath, context: BuildContext): BlockNode {
  if (isTransformerNode(value)) {
    return transformerBlock(value, path, context);
  }
  if (Array.isArray(value)) {
    return { kind: "list", path, items: value.map((item, index) => blockOf(item, [...path, index], context)) };
  }
  if (isPlainRecord(value)) {
    return {
      kind: "object",
      path,
      entries: Object.entries(value).map(([key, entry]) => ({ key, node: blockOf(entry, [...path, key], context) })),
    };
  }
  return { kind: "literal", path, value };
}

function transformerBlock(value: TransformerNode, path: BlockPath, context: BuildContext): BlockNode {
  const info = transformerTypeInfo(value.transformerType, context.transformerDefinitions, context.modelEnvironment);
  if (!info) {
    context.stats.jsonBlocks++;
    return { kind: "json", path, value, reason: "unknownTransformerType" };
  }
  context.stats.transformerBlocks++;
  context.stats.categories.add(info.category);
  const parameters: TransformerBlockParameter[] = [];
  const rows: TransformerBlockRow[] = [];
  const declared = new Set(info.attributes.map(([name]) => name));
  const ordered = [
    ...info.attributes.filter(([name]) => name !== APPLY_TO),
    ...info.attributes.filter(([name]) => name === APPLY_TO),
  ];
  for (const [name, schema] of ordered) {
    const present = Object.prototype.hasOwnProperty.call(value, name);
    const attributeValue = value[name];
    const attributePath = [...path, name];
    const optional = !!schema?.optional;
    if (info.slotAttributes.has(name)) {
      if (present || !optional) {
        rows.push({
          name,
          path: attributePath,
          kind: "slot",
          optional,
          node: present ? blockOf(attributeValue, attributePath, context) : undefined,
        });
      }
      continue;
    }
    if (!present) {
      continue;
    }
    if (isPrimitive(attributeValue) || (Array.isArray(attributeValue) && attributeValue.every(isPrimitive))) {
      parameters.push({ name, value: attributeValue });
      continue;
    }
    const node: BlockNode =
      value.transformerType === "returnValue" && name === "value"
        ? { kind: "literal", path: attributePath, value: attributeValue, quoted: true }
        : isMlSchemaValue(name, schema, attributeValue)
          ? { kind: "mlSchema", path: attributePath, value: attributeValue }
          : blockOf(attributeValue, attributePath, context);
    rows.push({ name, path: attributePath, kind: "value", optional, node });
  }
  for (const [name, attributeValue] of Object.entries(value)) {
    if (COMMON_ATTRIBUTES.has(name) || declared.has(name)) {
      continue;
    }
    const attributePath = [...path, name];
    rows.push({
      name,
      path: attributePath,
      kind: "undeclared",
      optional: true,
      node: blockOf(attributeValue, attributePath, context),
    });
  }
  return {
    kind: "transformer",
    path,
    transformerType: value.transformerType,
    ...(typeof value.label === "string" ? { label: value.label } : {}),
    category: info.category,
    ...(value.interpolation === "build" || value.interpolation === "runtime"
      ? { interpolation: value.interpolation }
      : {}),
    parameters,
    rows,
  };
}

/**
 * The block tree of a transformer value. Transformers whose type has no TransformerDefinition
 * become JSON blocks, counted in `stats.jsonBlocks`.
 */
export function transformerBlockTree(value: unknown, options: TransformerBlockModelOptions = {}): BlockTree {
  const context: BuildContext = {
    transformerDefinitions: options.transformerDefinitions ?? applicationTransformerDefinitions,
    modelEnvironment: options.modelEnvironment ?? defaultMiroirModelEnvironment,
    stats: { transformerBlocks: 0, jsonBlocks: 0, categories: new Set() },
  };
  const root = blockOf(value, [], context);
  const stats: BlockTreeStats = {
    transformerBlocks: context.stats.transformerBlocks,
    jsonBlocks: context.stats.jsonBlocks,
    categories: [...context.stats.categories].sort(),
  };
  return { root, stats };
}

function headerOf(node: BlockNode): string {
  switch (node.kind) {
    case "transformer":
      return [
        `${node.transformerType} [${node.category}]`,
        ...(node.label === undefined ? [] : [JSON.stringify(node.label)]),
        ...(node.interpolation === undefined ? [] : [`{${node.interpolation}}`]),
        ...node.parameters.map((parameter) => `${parameter.name}=${JSON.stringify(parameter.value)}`),
      ].join(" ");
    case "object":
      return "{object}";
    case "list":
      return "[list]";
    case "literal":
      return node.quoted ? `quoted ${JSON.stringify(node.value)}` : JSON.stringify(node.value);
    case "mlSchema":
      return `<mlSchema>`;
    case "json":
      return `<json ${node.reason}>`;
  }
}

function outlineLines(node: BlockNode, prefix: string, indent: string): string[] {
  const head = `${indent}${prefix}${headerOf(node)}`;
  const inner = `${indent}  `;
  switch (node.kind) {
    case "transformer":
      return [
        head,
        ...node.rows.flatMap((row) => {
          const name = `${row.kind === "undeclared" ? "!" : ""}${row.name}: `;
          return row.node ? outlineLines(row.node, name, inner) : [`${inner}${name}_`];
        }),
      ];
    case "object":
      return [head, ...node.entries.flatMap((entry) => outlineLines(entry.node, `${entry.key}: `, inner))];
    case "list":
      return [head, ...node.items.flatMap((item) => outlineLines(item, "- ", inner))];
    default:
      return [head];
  }
}

/**
 * The block tree of a transformer value as text, one line per block or row, indented by depth:
 * `mapList [list]`, then `  elementTransformer: getFromContext [variable] {runtime} referenceName="x"`.
 * An empty slot reads `_`, an undeclared attribute starts with `!`.
 */
export function transformerBlockOutline(value: unknown, options: TransformerBlockModelOptions = {}): string[] {
  return outlineLines(transformerBlockTree(value, options).root, "", "");
}

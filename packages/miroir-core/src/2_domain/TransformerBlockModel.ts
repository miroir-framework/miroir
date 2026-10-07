import type {
  MlElement,
  MlObject,
  MlReference,
  TransformerDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import type {
  ActionBlock,
  BlockNode,
  BlockPath,
  BlockPresentation,
  BlockTitleSegment,
  BlockTree,
  BlockTreeStats,
  SequenceBlock,
  TransformerBlock,
  TransformerBlockParameter,
  TransformerBlockRow,
} from "../0_interfaces/2_domain/TransformerBlockModelInterface";
import { defaultMiroirModelEnvironment } from "../1_core/Model";
import { endpointActionRegistry, type EndpointActionRegistry, type EndpointActionRegistryEntry } from "./EndpointActionRegistry";
import { declaredAttributeSchemas, transformerSlots, transformerUnionTypes } from "./TransformerTreeEdit";
import { transformerDefinitionRegistry } from "./TransformerDefinitionRegistry";

// ################################################################################################
// Issue #498 (analysis #497) — a transformer value as a tree of Scratch-style blocks: one block
// per transformer, with its primitive parameters in the header and one row per slot or
// structured attribute. Slots come from the TransformerDefinition (`transformerSlots`); any other
// object with a string `transformerType` is a block too (analysis D5), except inside the `value`
// of a `returnValue`, which the runtime returns without evaluating it.
//
// #504: an action sequence is a stack of command blocks (`blockTree`). A step is looked up by its
// `actionType` in the Endpoint actions of the model environment (EndpointActionRegistry.ts): its
// rows are its attributes and those of its `payload`, the declared ones first. The payload of a
// query step is one collapsed block. A transformer block tells the step at which it is evaluated
// (`evaluatedAt`, analysis D1): runtime when it is a runtime transformer, under one, or under the
// `templates` of a sequence, which are resolved at step runtime.
// ################################################################################################

type TransformerNode = { transformerType: string } & Record<string, unknown>;

export interface TransformerBlockModelOptions {
  transformerDefinitions?: Record<string, TransformerDefinition>;
  modelEnvironment?: MiroirModelEnvironment;
  /** Absent optional slots get an empty row too: where an editor can put a block (#500). */
  emptyOptionalSlots?: boolean;
}

/** Attributes every transformer has: shown in the header or as the build marking, never as rows. */
const COMMON_ATTRIBUTES = new Set(["transformerType", "interpolation", "label"]);
/** Attributes every action has: shown as the block's type, category and label, never as rows. */
const ACTION_HEADER_ATTRIBUTES = new Set(["actionType", "endpoint", "actionLabel"]);
const COMPOSITE_ACTION_SEQUENCE = "compositeActionSequence";
/** The steps whose payload is a query, shown as one block. */
const QUERY_ACTION_TYPES = new Set(["compositeRunBoxedQueryAction", "compositeRunBoxedQueryTemplateAction"]);
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

/** An attribute in a label template: `[name]`. */
const TEMPLATE_ATTRIBUTE = /\[([A-Za-z_][A-Za-z0-9_]*)\]/g;

/**
 * #507: the title of a block from a label template: its words, and a chip for each `[name]`
 * naming one of `attributes`. Any other `[name]` stays text, so a typo shows.
 */
export function blockTitleSegments(template: string, attributes: Iterable<string>): BlockTitleSegment[] {
  const known = new Set(attributes);
  const segments: BlockTitleSegment[] = [];
  const pushText = (text: string) => {
    if (text.length === 0) {
      return;
    }
    const last = segments[segments.length - 1];
    if (last && "text" in last) {
      segments[segments.length - 1] = { text: last.text + text };
      return;
    }
    segments.push({ text });
  };
  let position = 0;
  for (const match of template.matchAll(TEMPLATE_ATTRIBUTE)) {
    pushText(template.slice(position, match.index));
    if (known.has(match[1])) {
      segments.push({ attribute: match[1] });
    } else {
      pushText(match[0]);
    }
    position = (match.index ?? 0) + match[0].length;
  }
  pushText(template.slice(position));
  return segments;
}

/** #507: the presentation of a block from the hints stored with its definition; `undefined` without hints. */
function blockPresentation(hints: unknown, attributes: Iterable<string>): BlockPresentation | undefined {
  if (!isPlainRecord(hints)) {
    return undefined;
  }
  const presentation: BlockPresentation = {
    ...(typeof hints.labelTemplate === "string" && hints.labelTemplate.trim().length > 0
      ? { title: blockTitleSegments(hints.labelTemplate, attributes) }
      : {}),
    ...(typeof hints.icon === "string" && hints.icon.length > 0 ? { icon: hints.icon } : {}),
    ...(typeof hints.category === "string" && hints.category.length > 0 ? { colorCategory: hints.category } : {}),
    ...(isPlainRecord(hints.colorByTheme)
      ? {
          colorByTheme: Object.fromEntries(
            Object.entries(hints.colorByTheme).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
          ),
        }
      : {}),
  };
  return Object.keys(presentation).length > 0 ? presentation : undefined;
}

interface TransformerTypeInfo {
  category: string;
  presentation?: BlockPresentation;
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
  const attributes = order.filter((name) => !COMMON_ATTRIBUTES.has(name));
  const presentation = blockPresentation(definition.presentation, attributes);
  const info: TransformerTypeInfo = {
    category: definition.classification ?? "unknown",
    ...(presentation ? { presentation } : {}),
    attributes: attributes.map((name) => [name, declared[name]]),
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
  emptyOptionalSlots: boolean;
  /** #504: the Endpoint actions, in a tree built from an action: nested sequences are blocks. */
  actions?: EndpointActionRegistry;
  stats: { transformerBlocks: number; actionBlocks: number; jsonBlocks: number; categories: Set<string> };
}

function isSequenceValue(value: unknown): value is Record<string, unknown> {
  return isPlainRecord(value) && value.actionType === COMPOSITE_ACTION_SEQUENCE;
}

/**
 * The block of any evaluated value: a transformer, a plain object or array, or a primitive.
 * `runtime`: the value is evaluated at step runtime, whatever the `interpolation` of its transformers.
 */
function blockOf(value: unknown, path: BlockPath, context: BuildContext, runtime = false): BlockNode {
  if (context.actions && isSequenceValue(value)) {
    return actionBlock(value, path, context);
  }
  if (isTransformerNode(value)) {
    return transformerBlock(value, path, context, runtime);
  }
  if (Array.isArray(value)) {
    return { kind: "list", path, items: value.map((item, index) => blockOf(item, [...path, index], context, runtime)) };
  }
  if (isPlainRecord(value)) {
    return {
      kind: "object",
      path,
      entries: Object.entries(value).map(([key, entry]) => ({
        key,
        node: blockOf(entry, [...path, key], context, runtime),
      })),
    };
  }
  return { kind: "literal", path, value };
}

function transformerBlock(value: TransformerNode, path: BlockPath, context: BuildContext, runtime: boolean): BlockNode {
  const info = transformerTypeInfo(value.transformerType, context.transformerDefinitions, context.modelEnvironment);
  if (!info) {
    context.stats.jsonBlocks++;
    return { kind: "json", path, value, reason: "unknownTransformerType" };
  }
  context.stats.transformerBlocks++;
  context.stats.categories.add(info.category);
  // a node below a runtime node is returned unevaluated at step build (TransformersForRuntime)
  const evaluatedAt = runtime || value.interpolation === "runtime" ? "runtime" : "build";
  const below = evaluatedAt === "runtime";
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
      if (present || !optional || context.emptyOptionalSlots) {
        rows.push({
          name,
          path: attributePath,
          kind: "slot",
          optional,
          node: present ? blockOf(attributeValue, attributePath, context, below) : undefined,
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
          : blockOf(attributeValue, attributePath, context, below);
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
      node: blockOf(attributeValue, attributePath, context, below),
    });
  }
  return {
    kind: "transformer",
    path,
    transformerType: value.transformerType,
    ...(typeof value.label === "string" ? { label: value.label } : {}),
    category: info.category,
    ...(info.presentation ? { presentation: info.presentation } : {}),
    ...(value.interpolation === "build" || value.interpolation === "runtime"
      ? { interpolation: value.interpolation }
      : {}),
    evaluatedAt,
    parameters,
    rows,
  };
}

/** The attribute names an ML schema declares when it is an inline object, `undefined` otherwise. */
function declaredObjectAttributes(schema: unknown): string[] | undefined {
  return isPlainRecord(schema) && schema.type === "object" && isPlainRecord(schema.definition)
    ? Object.keys(schema.definition)
    : undefined;
}

/**
 * The rows of the attributes of `record` but `skipped`, those of `declared` first in their order,
 * then the others, flagged undeclared. With no `declared` list, every attribute is declared.
 */
function attributeRows(
  record: Record<string, unknown>,
  recordPath: BlockPath,
  declared: string[] | undefined,
  skipped: Set<string>,
  context: BuildContext,
  parameters?: TransformerBlockParameter[],
): TransformerBlockRow[] {
  const names = Object.keys(record).filter((name) => !skipped.has(name));
  const ordered = declared
    ? [...declared.filter((name) => names.includes(name)), ...names.filter((name) => !declared.includes(name))]
    : names;
  const rows: TransformerBlockRow[] = [];
  for (const name of ordered) {
    const attributeValue = record[name];
    if (parameters && isPrimitive(attributeValue)) {
      parameters.push({ name, value: attributeValue });
      continue;
    }
    const attributePath = [...recordPath, name];
    rows.push({
      name,
      path: attributePath,
      kind: !declared || declared.includes(name) ? "value" : "undeclared",
      optional: true,
      node: blockOf(attributeValue, attributePath, context),
    });
  }
  return rows;
}

/** The block of a step: an action or a nested sequence; a JSON block when no Endpoint declares its type. */
function stepBlock(value: unknown, path: BlockPath, context: BuildContext): BlockNode {
  if (!isPlainRecord(value) || typeof value.actionType !== "string") {
    return blockOf(value, path, context);
  }
  return actionBlock(value, path, context);
}

function actionBlock(value: Record<string, unknown>, path: BlockPath, context: BuildContext): BlockNode {
  const actionType = value.actionType as string;
  const entry: EndpointActionRegistryEntry | undefined = context.actions?.[actionType];
  if (!entry) {
    context.stats.jsonBlocks++;
    return { kind: "json", path, value, reason: "unknownActionType" };
  }
  context.stats.actionBlocks++;
  const actionParameters = ((entry.action as any).actionParameters ?? {}) as Record<string, unknown>;
  const parameters: TransformerBlockParameter[] = [];
  const rows = attributeRows(
    value,
    path,
    Object.keys(actionParameters),
    new Set([...ACTION_HEADER_ATTRIBUTES, "payload"]),
    context,
    parameters,
  );
  const presentation = blockPresentation((entry.action as { presentation?: unknown }).presentation, [
    ...Object.keys(actionParameters),
    ...(declaredObjectAttributes(actionParameters.payload) ?? []),
  ]);
  const header = {
    path,
    actionType,
    ...(typeof value.actionLabel === "string" ? { label: value.actionLabel } : {}),
    category: entry.endpointName,
    ...(presentation ? { presentation } : {}),
    parameters,
  };
  const payloadPath = [...path, "payload"];
  const payload = value.payload;
  const hasPayload = Object.prototype.hasOwnProperty.call(value, "payload");
  // a payload computed by a transformer (`getFromParameters`, `mergeIntoObject`) is one block
  if (actionType === COMPOSITE_ACTION_SEQUENCE && isPlainRecord(payload) && !isTransformerNode(payload)) {
    const templates = isPlainRecord(payload.templates) ? payload.templates : {};
    const steps = Array.isArray(payload.actionSequence) ? payload.actionSequence : [];
    const block: SequenceBlock = {
      kind: "sequence",
      ...header,
      rows: [
        ...rows,
        ...attributeRows(
          payload,
          payloadPath,
          declaredObjectAttributes(actionParameters.payload),
          new Set([
            ...(isPlainRecord(payload.templates) ? ["templates"] : []),
            ...(Array.isArray(payload.actionSequence) ? ["actionSequence"] : []),
          ]),
          context,
        ),
      ],
      // templates are resolved at step runtime (ResolveCompositeActionTemplate)
      templates: Object.entries(templates).map(([key, template]) => {
        const templatePath = [...payloadPath, "templates", key];
        return { key, path: templatePath, node: blockOf(template, templatePath, context, true) };
      }),
      steps: steps.map((step, index) => stepBlock(step, [...payloadPath, "actionSequence", index], context)),
    };
    return block;
  }
  const payloadRows: TransformerBlockRow[] = !hasPayload
    ? []
    : QUERY_ACTION_TYPES.has(actionType)
      ? [
          {
            name: "payload",
            path: payloadPath,
            kind: "value",
            optional: false,
            node: { kind: "query", path: payloadPath, ...queryTypeOf(payload), value: payload },
          },
        ]
      : isPlainRecord(payload) && !isTransformerNode(payload)
        ? [
            ...attributeRows(payload, payloadPath, declaredObjectAttributes(actionParameters.payload), new Set(), context),
            ...absentPayloadRows(payload, payloadPath, actionParameters.payload, context),
          ]
        : [{ name: "payload", path: payloadPath, kind: "value", optional: false, node: blockOf(payload, payloadPath, context) }];
  const block: ActionBlock = { kind: "action", ...header, rows: [...rows, ...payloadRows] };
  return block;
}

/**
 * #505: with `emptyOptionalSlots`, the declared payload attributes `payload` lacks, as empty slots:
 * where an editor puts a transformer or a value.
 */
function absentPayloadRows(
  payload: Record<string, unknown>,
  payloadPath: BlockPath,
  payloadSchema: unknown,
  context: BuildContext,
): TransformerBlockRow[] {
  if (!context.emptyOptionalSlots || !isPlainRecord(payloadSchema) || payloadSchema.type !== "object") {
    return [];
  }
  const declared = isPlainRecord(payloadSchema.definition) ? payloadSchema.definition : {};
  return Object.entries(declared)
    .filter(([name]) => !Object.prototype.hasOwnProperty.call(payload, name))
    .map(([name, schema]) => ({
      name,
      path: [...payloadPath, name],
      kind: "slot",
      optional: isPlainRecord(schema) && !!schema.optional,
      node: undefined,
    }));
}

/** The `queryType` of a query step's payload: a run query action, whose own payload holds the query. */
function queryTypeOf(payload: unknown): { queryType?: string } {
  const runAction = isPlainRecord(payload) && isPlainRecord(payload.payload) ? payload.payload : undefined;
  const query = isPlainRecord(runAction?.query) ? runAction.query : undefined;
  return typeof query?.queryType === "string" ? { queryType: query.queryType } : {};
}

/**
 * The block tree of a transformer value. Transformers whose type has no TransformerDefinition
 * become JSON blocks, counted in `stats.jsonBlocks`.
 */
export function transformerBlockTree(value: unknown, options: TransformerBlockModelOptions = {}): BlockTree {
  return buildBlockTree(value, options, false);
}

function buildBlockTree(value: unknown, options: TransformerBlockModelOptions, action: boolean): BlockTree {
  const modelEnvironment = options.modelEnvironment ?? defaultMiroirModelEnvironment;
  const context: BuildContext = {
    // #502: the registry of the model environment, stock definitions and application composites
    transformerDefinitions: options.transformerDefinitions ?? transformerDefinitionRegistry(modelEnvironment),
    modelEnvironment,
    emptyOptionalSlots: options.emptyOptionalSlots ?? false,
    ...(action ? { actions: endpointActionRegistry(modelEnvironment) } : {}),
    stats: { transformerBlocks: 0, actionBlocks: 0, jsonBlocks: 0, categories: new Set() },
  };
  const root = action ? stepBlock(value, [], context) : blockOf(value, [], context);
  const stats: BlockTreeStats = {
    transformerBlocks: context.stats.transformerBlocks,
    actionBlocks: context.stats.actionBlocks,
    jsonBlocks: context.stats.jsonBlocks,
    categories: [...context.stats.categories].sort(),
  };
  return { root, stats };
}

/**
 * Whether `value` is an action, mapped with the action rules by `blockTree`: a sequence, or a value
 * whose `actionType` an Endpoint of the model environment declares.
 */
export function isBlockAction(value: unknown, modelEnvironment: MiroirModelEnvironment = defaultMiroirModelEnvironment): boolean {
  return (
    isPlainRecord(value) &&
    !isTransformerNode(value) &&
    typeof value.actionType === "string" &&
    (value.actionType === COMPOSITE_ACTION_SEQUENCE ||
      Object.hasOwn(endpointActionRegistry(modelEnvironment), value.actionType))
  );
}

/**
 * #504: the block tree of a value: an action sequence, or a step, maps to command blocks (an action
 * whose type no Endpoint declares is a JSON block); any other value maps as a transformer.
 */
export function blockTree(value: unknown, options: TransformerBlockModelOptions = {}): BlockTree {
  return buildBlockTree(value, options, isBlockAction(value, options.modelEnvironment));
}

function headerOf(node: BlockNode): string {
  switch (node.kind) {
    case "transformer":
      return [
        `${node.transformerType} [${node.category}]`,
        ...(node.label === undefined ? [] : [JSON.stringify(node.label)]),
        ...(node.interpolation === undefined ? [] : [`{${node.interpolation}}`]),
        // evaluated at runtime by its position, not by its own attribute
        ...(node.evaluatedAt === "runtime" && node.interpolation !== "runtime" ? ["@runtime"] : []),
        ...node.parameters.map((parameter) => `${parameter.name}=${JSON.stringify(parameter.value)}`),
      ].join(" ");
    case "action":
    case "sequence":
      return [
        `${node.actionType} [${node.category}]`,
        ...(node.label === undefined ? [] : [JSON.stringify(node.label)]),
        ...node.parameters.map((parameter) => `${parameter.name}=${JSON.stringify(parameter.value)}`),
      ].join(" ");
    case "query":
      return node.queryType === undefined ? "<query>" : `<query ${node.queryType}>`;
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

function rowLines(rows: TransformerBlockRow[], indent: string): string[] {
  return rows.flatMap((row) => {
    const name = `${row.kind === "undeclared" ? "!" : ""}${row.name}: `;
    return row.node ? outlineLines(row.node, name, indent) : [`${indent}${name}_`];
  });
}

function outlineLines(node: BlockNode, prefix: string, indent: string): string[] {
  const head = `${indent}${prefix}${headerOf(node)}`;
  const inner = `${indent}  `;
  switch (node.kind) {
    case "transformer":
    case "action":
      return [head, ...rowLines(node.rows, inner)];
    case "sequence":
      return [
        head,
        ...rowLines(node.rows, inner),
        ...(node.templates.length === 0
          ? []
          : [
              `${inner}templates:`,
              ...node.templates.flatMap((template) => outlineLines(template.node, `${template.key}: `, `${inner}  `)),
            ]),
        `${inner}steps:`,
        ...node.steps.flatMap((step) => outlineLines(step, "- ", `${inner}  `)),
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
 * An empty slot reads `_`, an undeclared attribute starts with `!`; `@runtime` marks a transformer
 * evaluated at runtime by its position (#504).
 */
export function transformerBlockOutline(value: unknown, options: TransformerBlockModelOptions = {}): string[] {
  return outlineLines(transformerBlockTree(value, options).root, "", "");
}

/**
 * #504: the outline of `blockTree`. A sequence lists its `templates:` and its `steps:`, each step
 * as `- createEntity [ModelEndpoint] "label"`, with the rows of its attributes and payload.
 */
export function blockOutline(value: unknown, options: TransformerBlockModelOptions = {}): string[] {
  return outlineLines(blockTree(value, options).root, "", "");
}

/** A palette group: the transformer types of one classification (#500). */
export interface TransformerPaletteGroup {
  category: string;
  transformerTypes: string[];
}

/**
 * The block palette (#500): the transformer types a transformer position accepts, grouped by the
 * classification of their TransformerDefinition, both sorted by name. A type with no definition
 * is left out: it would be a JSON block.
 */
export function transformerPaletteGroups(
  modelEnvironment: MiroirModelEnvironment = defaultMiroirModelEnvironment,
  transformerDefinitions: Record<string, TransformerDefinition> = transformerDefinitionRegistry(modelEnvironment),
): TransformerPaletteGroup[] {
  const byCategory = new Map<string, string[]>();
  for (const transformerType of transformerUnionTypes(modelEnvironment)) {
    const definition = transformerDefinitions[transformerType];
    if (!definition) {
      continue;
    }
    const category = definition.classification ?? "unknown";
    byCategory.set(category, [...(byCategory.get(category) ?? []), transformerType]);
  }
  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, transformerTypes]) => ({ category, transformerTypes: [...transformerTypes].sort() }));
}

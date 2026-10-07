/**
 * Issue #498 — a transformer value seen as Scratch-style blocks (analysis #497).
 *
 * A path is the position of a value inside the transformer the tree was built from: attribute
 * names and array indexes, as in the form editor.
 */
export type BlockPath = (string | number)[];

/** A primitive parameter shown inline in the header of a transformer block. */
export interface TransformerBlockParameter {
  name: string;
  value: unknown;
}

/**
 * A row of a transformer block, below its header.
 * - `slot`: an attribute holding transformers (`elementTransformer`, `applyTo`, `whens`);
 * - `value`: a declared attribute holding a non-primitive value (an ML schema, a list, an object);
 * - `undeclared`: an attribute the TransformerDefinition does not declare, shown flagged.
 */
export interface TransformerBlockRow {
  name: string;
  path: BlockPath;
  kind: "slot" | "value" | "undeclared";
  optional: boolean;
  /** `undefined`: an empty slot. */
  node: BlockNode | undefined;
}

export interface TransformerBlock {
  kind: "transformer";
  path: BlockPath;
  transformerType: string;
  label?: string;
  /** The TransformerDefinition's `classification`, `unknown` when it has none. */
  category: string;
  /** As stored: an absent `interpolation` is evaluated as `build`. */
  interpolation?: "build" | "runtime";
  /**
   * The step at which the transformer is actually evaluated (#504, analysis D1): `runtime` when it
   * is a runtime transformer, under a runtime transformer, or under the `templates` of a sequence.
   */
  evaluatedAt: "build" | "runtime";
  parameters: TransformerBlockParameter[];
  rows: TransformerBlockRow[];
}

/** A plain object whose values are evaluated: they may hold transformers. */
export interface ObjectBlock {
  kind: "object";
  path: BlockPath;
  entries: { key: string; node: BlockNode }[];
}

/** A plain array whose items are evaluated: they may hold transformers. */
export interface ListBlock {
  kind: "list";
  path: BlockPath;
  items: BlockNode[];
}

/**
 * A value shown as is: a primitive, or any JSON value that is not evaluated (`quoted`), such as
 * the `value` of a `returnValue`.
 */
export interface LiteralBlock {
  kind: "literal";
  path: BlockPath;
  value: unknown;
  quoted?: boolean;
}

/** An ML schema, shown as a collapsed chip. */
export interface MlSchemaBlock {
  kind: "mlSchema";
  path: BlockPath;
  value: unknown;
}

/**
 * A value the block model cannot shape: a transformer whose type has no TransformerDefinition, or
 * an action whose type has no Endpoint action.
 */
export interface JsonBlock {
  kind: "json";
  path: BlockPath;
  value: unknown;
  reason: "unknownTransformerType" | "unknownActionType";
}

/**
 * #504: a step of an action sequence, a command block: its primitive attributes but `actionType`,
 * `endpoint` and `actionLabel` in the header, one row per other attribute and per attribute of its
 * `payload`, those its Endpoint action declares first.
 */
export interface ActionBlock {
  kind: "action";
  path: BlockPath;
  actionType: string;
  /** The `actionLabel` of the step. */
  label?: string;
  /** The name of the Endpoint declaring the action. */
  category: string;
  parameters: TransformerBlockParameter[];
  rows: TransformerBlockRow[];
}

/** #504: a `compositeActionSequence`: an action block holding its templates and its stacked steps. */
export interface SequenceBlock extends Omit<ActionBlock, "kind"> {
  kind: "sequence";
  /** The `templates` of the payload, resolved at step runtime, before the steps. */
  templates: { key: string; path: BlockPath; node: BlockNode }[];
  /** The `actionSequence` of the payload. */
  steps: BlockNode[];
}

/** #504: the payload of a query step, shown as one collapsed block. */
export interface QueryBlock {
  kind: "query";
  path: BlockPath;
  queryType?: string;
  value: unknown;
}

export type BlockNode =
  | TransformerBlock
  | ObjectBlock
  | ListBlock
  | LiteralBlock
  | MlSchemaBlock
  | JsonBlock
  | ActionBlock
  | SequenceBlock
  | QueryBlock;

export interface BlockTreeStats {
  transformerBlocks: number;
  /** Action blocks, sequences included. */
  actionBlocks: number;
  jsonBlocks: number;
  /** Categories of the transformer blocks, sorted, each once. */
  categories: string[];
}

export interface BlockTree {
  root: BlockNode;
  stats: BlockTreeStats;
}

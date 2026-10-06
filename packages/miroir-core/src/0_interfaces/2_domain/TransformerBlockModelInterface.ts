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

/** A value the block model cannot shape: a transformer whose type has no TransformerDefinition. */
export interface JsonBlock {
  kind: "json";
  path: BlockPath;
  value: unknown;
  reason: "unknownTransformerType";
}

export type BlockNode = TransformerBlock | ObjectBlock | ListBlock | LiteralBlock | MlSchemaBlock | JsonBlock;

export interface BlockTreeStats {
  transformerBlocks: number;
  jsonBlocks: number;
  /** Categories of the transformer blocks, sorted, each once. */
  categories: string[];
}

export interface BlockTree {
  root: BlockNode;
  stats: BlockTreeStats;
}

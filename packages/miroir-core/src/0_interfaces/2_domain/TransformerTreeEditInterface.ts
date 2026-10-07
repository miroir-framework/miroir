/**
 * Issue #415 — a position of a transformer type where another transformer can sit.
 */
export interface TransformerSlot {
  /** Display name: `elementTransformer`, `args[]`, `definition{}`, `whens[].when`. */
  name: string;
  /** Path from the transformer: attribute names, `[]` for an array item, `{}` for a record value. */
  template: string[];
  /** The innermost attribute, array item or record value may be absent. */
  optional: boolean;
  /** `applyTo`: the transformer's own input (Pipe into), not an enclosed transformer (Wrap). */
  isApplyTo: boolean;
}

/** A typed transformer found in a slot of a node (#415, Unwrap). */
export interface TransformerChild {
  path: (string | number)[];
  slot: string;
  transformerType: string;
}

/** A type change: the new node, and the attributes of the old node it could not keep (#415 D4). */
export interface TransformerTypeChange {
  node: Record<string, unknown>;
  dropped: string[];
}

/**
 * A position of a tree where `insertTransformerNode` puts a new node (#500): an empty slot, the
 * end of a list slot or a new entry of a record slot.
 */
export interface TransformerInsertPosition {
  /** The path to give `insertTransformerNode`. */
  path: (string | number)[];
  /** Where the editor shows the position: the empty slot, or the list or record it adds to. */
  container: (string | number)[];
  kind: "slot" | "listEnd" | "recordEntry";
}

/**
 * #505: a position of a transformer or of an action sequence, with what it holds: a step of an
 * `actionSequence` holds an action, any other position a transformer or a value.
 */
export interface BlockInsertPosition extends TransformerInsertPosition {
  holds: "action" | "transformer";
}

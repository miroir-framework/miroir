import type {
  InputOutputObject,
  InputOutputType,
} from "../1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Types provided / expected by the calling context of a transformer (issue #249).
 * In the list transformer panel: `input` is the row entity uuid, `output` the expected output type.
 */
export interface TransformerInterfaceGivenTypes {
  input: InputOutputType;
  output: InputOutputType;
}

export interface TransformerInterfaceMismatch {
  /** "value" (#453): a `returnValue` whose `value` (given) does not fit its `mlSchema` (declared). */
  direction: "input" | "output" | "value";
  given: InputOutputType;
  declared: InputOutputType;
  /** When set to "inferred", `declared` holds the schema-inferred actual output type. */
  source?: "declared" | "inferred";
}

export type TransformerInterfaceCompatibility =
  | { status: "ok" }
  | { status: "incompatible"; failures: TransformerInterfaceMismatch[] };

/**
 * Issue #383 — #249 check at one typed node of a transformer tree.
 * `givenInput`: the input the node's slot provides. `consumedInput`: what the node actually
 * reads, its own `applyTo` output when it has one, else `givenInput`.
 */
export interface TransformerInterfaceNodeReport {
  path: (string | number)[];
  transformerType: string;
  givenInput: InputOutputType;
  consumedInput: InputOutputType;
  declared: InputOutputObject | undefined;
  output: InputOutputType;
  failures: TransformerInterfaceMismatch[];
}

/** #453: a literal `applyTo` value of a typed node, at its own path, with the type of its value. */
export interface TransformerInterfaceLiteralReport {
  path: (string | number)[];
  type: InputOutputType;
}

export interface TransformerInterfaceTreeCompatibility {
  status: "ok" | "incompatible" | "unchecked";
  nodes: TransformerInterfaceNodeReport[];
  literals: TransformerInterfaceLiteralReport[];
}

/**
 * #453: how a node's consumed input compares with its declared input. "mismatch": the node has a
 * failure; "unknown": nothing to compare (no declared input, or `any` on a side); "match" otherwise.
 */
export type TransformerNodeTypeStatus = "match" | "mismatch" | "unknown";

/** Transformer types offered at a position, and the ones hidden there (#383). */
export interface TransformerTypesAcceptingInput {
  offered: string[];
  hidden: string[];
}

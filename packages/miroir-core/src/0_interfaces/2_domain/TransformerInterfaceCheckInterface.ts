import type { InputOutputType } from "../1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Types provided / expected by the calling context of a transformer (issue #249).
 * In the list transformer panel: `input` is the row entity uuid, `output` the expected output type.
 */
export interface TransformerInterfaceGivenTypes {
  input: InputOutputType;
  output: InputOutputType;
}

export interface TransformerInterfaceMismatch {
  direction: "input" | "output";
  given: InputOutputType;
  declared: InputOutputType;
  /** When set to "inferred", `declared` holds the schema-inferred actual output type. */
  source?: "declared" | "inferred";
}

export type TransformerInterfaceCompatibility =
  | { status: "ok" }
  | { status: "incompatible"; failures: TransformerInterfaceMismatch[] };

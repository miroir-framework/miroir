import type { JzodElement } from "../1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Issue #251 — per-node mlSchema compatibility report (Proposal B derivation + #250 LSP).
 */
export interface TransformerMlSchemaMismatch {
  direction: "input" | "output";
  given: JzodElement;
  declared: JzodElement;
}

export interface TransformerMlSchemaNodeReport {
  path: (string | number)[];
  transformerType: string;
  givenInput?: JzodElement;
  acceptedInput?: JzodElement;
  actualOutput?: JzodElement;
  expectedOutput?: JzodElement;
  failures: TransformerMlSchemaMismatch[];
}

export type TransformerMlSchemaCompatibility = {
  status: "ok" | "incompatible" | "unchecked";
  nodes: TransformerMlSchemaNodeReport[];
};

export interface TransformerMlSchemaGivenTypes {
  input: JzodElement;
  output?: JzodElement;
}

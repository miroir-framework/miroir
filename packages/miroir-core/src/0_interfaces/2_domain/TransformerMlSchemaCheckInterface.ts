import type { MlElement } from "../1_core/preprocessor-generated/miroirFundamentalType";

/**
 * Issue #251 — per-node mlSchema compatibility report (Proposal B derivation + #250 LSP).
 */
export interface TransformerMlSchemaMismatch {
  direction: "input" | "output";
  given: MlElement;
  declared: MlElement;
}

export interface TransformerMlSchemaNodeReport {
  path: (string | number)[];
  transformerType: string;
  givenInput?: MlElement;
  acceptedInput?: MlElement;
  actualOutput?: MlElement;
  expectedOutput?: MlElement;
  failures: TransformerMlSchemaMismatch[];
}

export type TransformerMlSchemaCompatibility = {
  status: "ok" | "incompatible" | "unchecked";
  nodes: TransformerMlSchemaNodeReport[];
};

export interface TransformerMlSchemaGivenTypes {
  input: MlElement;
  output?: MlElement;
}

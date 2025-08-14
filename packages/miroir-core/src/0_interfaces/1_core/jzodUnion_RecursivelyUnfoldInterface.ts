import {
  JzodElement
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


export interface JzodUnion_RecursivelyUnfold_ReturnTypeOK {
  status: "ok",
  result: JzodElement[],
  expandedReferences: Set<string>,
  discriminator?: (string | string[]) | undefined
}
export interface JzodUnion_RecursivelyUnfold_ReturnTypeError {
  status: "error",
  error: string,
  innerError?: JzodUnion_RecursivelyUnfold_ReturnTypeError,
}
export type JzodUnion_RecursivelyUnfold_ReturnType = JzodUnion_RecursivelyUnfold_ReturnTypeError | JzodUnion_RecursivelyUnfold_ReturnTypeOK;

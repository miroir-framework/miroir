import {
  JzodElement
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


export interface JzodUnion_RecursivelyUnfold_ReturnTypeOK {
  status: "ok",
  result: JzodElement[],
  expandedReferences: Set<string>,
  discriminator?: (string | string[]) | undefined
}
export const jzodUnion_RecursivelyUnfold_ReturnTypeOK: JzodElement = {
  type: "object",
  definition: {
    status: { type: "literal", definition: "ok" },
    result: {
      type: "array",
      definition: {
        type: "schemaReference",
        definition: {
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath: "jzodElement",
        },
      },
    },
    expandedReferences: {
      type: "set",
      definition: {
        type: "string",
      },
    }, // the references that were expanded
    discriminator: {
      type: "union",
      optional: true,
      definition: [
        { type: "string" },
        { type: "array", definition: { type: "string" } },
      ],
    }, // the discriminator that was used, if any
  },
};
export interface JzodUnion_RecursivelyUnfold_ReturnTypeError {
  status: "error",
  error: string,
  innerError?: JzodUnion_RecursivelyUnfold_ReturnTypeError,
}
export const jzodUnion_RecursivelyUnfold_ReturnTypeError: JzodElement = {
  type: "object",
  definition: {
    status: { type: "literal", definition: "error" },
    error: { type: "string" },
    innerError: {
      type: "schemaReference",
      optional: true,
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodUnion_RecursivelyUnfold_ReturnTypeError",
      },
    }, // for unions, this is the error of the sub-schema that failed
  },
};
export type JzodUnion_RecursivelyUnfold_ReturnType = JzodUnion_RecursivelyUnfold_ReturnTypeError | JzodUnion_RecursivelyUnfold_ReturnTypeOK;
export const jzodUnion_RecursivelyUnfold_ReturnType: JzodElement = {
  type: "union",
  definition: [
    {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodUnion_RecursivelyUnfold_ReturnTypeOK",
      },
    },
    {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodUnion_RecursivelyUnfold_ReturnTypeError",
      },
    },
  ],
};
import {
  MlElement
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";


export interface MlUnion_RecursivelyUnfold_ReturnTypeOK {
  status: "ok",
  result: MlElement[],
  expandedReferences: Set<string>,
  discriminator?: (string | string[]) | undefined
}
export const mlUnion_RecursivelyUnfold_ReturnTypeOK: MlElement = {
  type: "object",
  definition: {
    status: { type: "literal", definition: "ok" },
    result: {
      type: "array",
      definition: {
        type: "schemaReference",
        definition: {
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath: "mlElement",
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
        {
          type: "array",
          definition: {
            type: "union",
            definition: [{ type: "string" }, { type: "array", definition: { type: "string" } }],
          },
        },
      ],
    }, // the discriminator that was used, if any
  },
};
export interface MlUnion_RecursivelyUnfold_ReturnTypeError {
  status: "error",
  error: string,
  innerError?: MlUnion_RecursivelyUnfold_ReturnTypeError,
}
export const mlUnion_RecursivelyUnfold_ReturnTypeError: MlElement = {
  type: "object",
  definition: {
    status: { type: "literal", definition: "error" },
    error: { type: "string" },
    innerError: {
      type: "schemaReference",
      optional: true,
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlUnion_RecursivelyUnfold_ReturnTypeError",
      },
    }, // for unions, this is the error of the sub-schema that failed
  },
};
export type MlUnion_RecursivelyUnfold_ReturnType = MlUnion_RecursivelyUnfold_ReturnTypeError | MlUnion_RecursivelyUnfold_ReturnTypeOK;
export const mlUnion_RecursivelyUnfold_ReturnType: MlElement = {
  type: "union",
  definition: [
    {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlUnion_RecursivelyUnfold_ReturnTypeOK",
      },
    },
    {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlUnion_RecursivelyUnfold_ReturnTypeError",
      },
    },
  ],
};
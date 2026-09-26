
import {
  MlArray,
  MlElement,
  MlObject,
  MlTuple,
  type MlRecord,
  type MlUnion
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  JzodUnion_RecursivelyUnfold_ReturnTypeError,
  JzodUnion_RecursivelyUnfold_ReturnTypeOK,
} from "./jzodUnion_RecursivelyUnfoldInterface";

// ################################################################################################
export interface SelectUnionBranchFromDiscriminatorReturnTypeOK {
  status: "ok";
  currentDiscriminatedObjectJzodSchema: MlObject;
  flattenedUnionChoices: MlObject[];
  chosenDiscriminator: {discriminator: string, value: any}[];
}

export interface SelectUnionBranchFromDiscriminatorReturnTypeError {
  status: "error";
  error: string;
  effectiveRawSchema?: MlUnion,
  discriminator?: string | (string | string[])[] | undefined;
  discriminatorValues?: any;
  possibleDiscriminators?: (string | undefined)[][];
  valuePath: (string | number)[];
  typePath: (string | number)[];
  value?: any;
  type?: MlElement;
  objectUnionChoices?: MlObject[];
  flattenedUnionChoices?: MlObject[];
}

export type SelectUnionBranchFromDiscriminatorReturnType = 
  SelectUnionBranchFromDiscriminatorReturnTypeOK | SelectUnionBranchFromDiscriminatorReturnTypeError;

// ################################################################################################
export interface JzodUnionResolvedTypeForObjectReturnTypeOK {
  status: "ok";
  resolvedJzodObjectSchema: MlObject | MlRecord;
  objectUnionChoices: MlObject[];
  chosenDiscriminator?: {discriminator: string, value: any}[];
}

export interface JzodUnionResolvedTypeForArrayReturnTypeOK {
  status: "ok";
  resolvedJzodObjectSchema: MlArray | MlTuple;
  arrayUnionChoices: (MlArray | MlTuple)[];
  chosenDiscriminator?: {discriminator: string, value: any}[];
}

export interface JzodUnionResolvedTypeReturnTypeError {
  status: "error";
  error: string;
  discriminator?: string | (string | string[])[] | undefined;
  valuePath: (string | number)[];
  typePath: (string | number)[];
  value?: any;
  rawSchema?: MlElement;
  concreteUnrolledJzodSchemas?: MlElement[];
  unionChoices?: MlObject[] | (MlArray | MlTuple)[];
  innerError?: SelectUnionBranchFromDiscriminatorReturnTypeError;
}

export type JzodUnionResolvedTypeReturnType =
  | JzodUnionResolvedTypeForObjectReturnTypeOK
  | JzodUnionResolvedTypeForArrayReturnTypeOK
  | JzodUnionResolvedTypeReturnTypeError;


// #################################################################################################
export interface KeyMapEntry {
  rawSchema: MlElement;
  jzodObjectFlattenedSchema?: MlObject;
  recursivelyUnfoldedUnionSchema?: JzodUnion_RecursivelyUnfold_ReturnTypeOK;
  resolvedSchema: MlElement;
  chosenUnionBranchRawSchema?: MlElement; // for unions, this is the raw schema of the chosen branch
  discriminatorValues?: string[][]; // for unions, this is the list of possible discriminator values
  discriminator?: string | (string | string[])[]; // for unions, this is the discriminator used to select the branch
}
export const keyMapEntry: MlElement = {
  type: "object",
  definition: {
    rawSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlElement",
      },
    }, // the raw schema that was checked
    jzodObjectFlattenedSchema: {
      type: "schemaReference",
      optional: true,
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlObject",
      },
    }, // the flattened schema of the object
    recursivelyUnfoldedUnionSchema: {
      type: "schemaReference",
      optional: true,
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodUnion_RecursivelyUnfold_ReturnTypeOK",
      },
    }, // the recursively unfolded union schema
    resolvedReferenceSchemaInContext: {
      type: "schemaReference",
      optional: true,
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlElement",
      },
    }, // when schemaReference, this is the schema with only the context being resolved
    resolvedSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlElement",
      },
    }, // the resolved schema that was checked
    chosenUnionBranchRawSchema: {
      type: "schemaReference",
      optional: true,
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlElement",
      },
    }, // for unions, this is the raw schema of the chosen branch
    discriminatorValues: {
      type: "array",
      optional: true,
      definition: { type: "array", definition: { type: "string" } },
    }, // for unions, this is the list of possible discriminator values
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
    }, // for unions, this is the discriminator used to select the branch
    valuePath: {
      type: "array",
      definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
    },
    typePath: {
      type: "array",
      definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
    },
  },
};

export interface ResolvedJzodSchemaReturnTypeOK {
  status: "ok";
  schemaReferenceName?: string;
  valuePath: (string | number)[];
  typePath: (string | number)[];
  rawSchema: MlElement;
  resolvedSchema: MlElement;
  keyMap?: Record<string, KeyMapEntry>;
  subSchemas?:
    | ResolvedJzodSchemaReturnType
    | ResolvedJzodSchemaReturnType[]
    | Record<string, ResolvedJzodSchemaReturnType>
    | undefined; // for unions, this is the list of sub-schemas that were resolved
}
export const resolvedJzodSchemaReturnTypeOK: MlElement = {
  type: "object",
  definition: {
    status: { type: "literal", definition: "ok" },
    schemaReferenceName: { type: "string", optional: true },
    valuePath: {
      type: "array",
      definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
    },
    typePath: {
      type: "array",
      definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
    },
    rawSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlElement",
      },
    }, // the raw schema that was checked
    // resolvedReferenceSchemaInContext: {
    //   type: "schemaReference",
    //   optional: true,
    //   definition: {
    //     absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
    //     relativePath: "mlElement",
    //   },
    // }, // the resolved schema that was checked
    resolvedSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlElement",
      },
    }, // the resolved schema that was checked
    keyMap: {
      type: "record",
      optional: true,
      definition: {
        type: "schemaReference",
        // optional: true,
        definition: {
          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
          relativePath: "keyMapEntry",
        },
      }, // the resolved schema that was checked
    },
    subSchemas: {
      type: "union",
      optional: true,
      definition: [
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "resolvedJzodSchemaReturnType",
          },
        },
        {
          type: "array",
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "resolvedJzodSchemaReturnType",
            },
          },
        },
        {
          type: "record",
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "resolvedJzodSchemaReturnType",
            },
          },
        },
        {
          type: "undefined",
        },
      ],
    }, // for unions, this is the list of sub-schemas that were resolved
  },
};
export interface ResolvedJzodSchemaReturnTypeError {
  status: "error";
  error: string;
  rawJzodSchemaType?: string;
  valuePath: (string | number)[];
  typePath: (string | number)[];
  value?: any; // the value that was checked
  rawSchema?: MlElement; // the raw schema that was checked
  errorOnValueAttributes?: string[]; // the attributes that failed to check, if relevant
  errorOnSchemaAttributes?: string[]; // the attributes that failed to check, if relevant
  innerError?:
    | JzodUnion_RecursivelyUnfold_ReturnTypeError
    | ResolvedJzodSchemaReturnTypeError
    | Record<string, ResolvedJzodSchemaReturnTypeError>
    | undefined; // for unions, this is the error of the sub-schema that failed
}
export const resolvedJzodSchemaReturnTypeError: MlElement = {
  type: "object",
  definition: {
    status: { type: "literal", definition: "error" },
    error: { type: "string" },
    schemaReferenceName: { type: "string", optional: true },
    rawJzodSchemaType: { type: "string", optional: true }, // the raw schema type that was checked
    valuePath: { type: "array", definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] } },
    typePath: { type: "array", definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] } },
    // typePath: { type: "array", definition: { type: "string" } },
    value: { type: "any" }, // the value that was checked
    rawSchema: {
      type: "schemaReference",
      optional: true,
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "mlElement",
      },
    }, // the raw schema that was checked
    errorOnValueAttributes: {
      type: "array",
      optional: true,
      definition: { type: "string" },
    }, // the attributes that failed to check, if relevant
    errorOnSchemaAttributes: {
      type: "array",
      optional: true,
      definition: { type: "string" },
    }, // the attributes that failed to check, if relevant
    innerError: {
      type: "union",
      optional: true,
      definition: [
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "jzodUnion_RecursivelyUnfold_ReturnTypeError",
          },
        },
        {
          type: "schemaReference",
          definition: {
            absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
            relativePath: "resolvedJzodSchemaReturnTypeError",
          },
        },
        {
          type: "record",
          definition: {
            type: "schemaReference",
            definition: {
              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
              relativePath: "resolvedJzodSchemaReturnTypeError",
            },
          },
        },
        { type: "undefined" }
      ],
    }, // for unions, this is the error of the sub-schema that failed
  },
};
export type ResolvedJzodSchemaReturnType = ResolvedJzodSchemaReturnTypeError | ResolvedJzodSchemaReturnTypeOK;
export const resolvedJzodSchemaReturnType: MlElement = {
  type: "union",
  definition: [
    resolvedJzodSchemaReturnTypeOK,
    resolvedJzodSchemaReturnTypeError,
  ],
};

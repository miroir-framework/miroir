
import {
  JzodArray,
  JzodElement,
  JzodObject,
  JzodTuple
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  JzodUnion_RecursivelyUnfold_ReturnTypeError,
  JzodUnion_RecursivelyUnfold_ReturnTypeOK,
} from "./jzodUnion_RecursivelyUnfoldInterface";

// ################################################################################################
export interface SelectUnionBranchFromDiscriminatorReturnTypeOK {
  status: "ok";
  currentDiscriminatedObjectJzodSchema: JzodObject;
  flattenedUnionChoices: JzodObject[];
  chosenDiscriminator: {discriminator: string, value: any}[];
}

export interface SelectUnionBranchFromDiscriminatorReturnTypeError {
  status: "error";
  error: string;
  discriminator?: string | string[] | undefined;
  discriminatorValues?: any;
  possibleDiscriminators?: (string | undefined)[][];
  valuePath: (string | number)[];
  typePath: (string | number)[];
  value?: any;
  objectUnionChoices?: JzodObject[];
  flattenedUnionChoices?: JzodObject[];
}

export type SelectUnionBranchFromDiscriminatorReturnType = 
  SelectUnionBranchFromDiscriminatorReturnTypeOK | SelectUnionBranchFromDiscriminatorReturnTypeError;

// ################################################################################################
export interface JzodUnionResolvedTypeForObjectReturnTypeOK {
  status: "ok";
  resolvedJzodObjectSchema: JzodObject;
  objectUnionChoices: JzodObject[];
  chosenDiscriminator?: {discriminator: string, value: any}[];
}

export interface JzodUnionResolvedTypeForArrayReturnTypeOK {
  status: "ok";
  resolvedJzodObjectSchema: JzodArray | JzodTuple;
  arrayUnionChoices: (JzodArray | JzodTuple)[];
  chosenDiscriminator?: {discriminator: string, value: any}[];
}

export interface JzodUnionResolvedTypeReturnTypeError {
  status: "error";
  error: string;
  discriminator?: string | string[] | undefined;
  valuePath: (string | number)[];
  typePath: (string | number)[];
  value?: any;
  concreteUnrolledJzodSchemas?: JzodElement[];
  unionChoices?: JzodObject[] | (JzodArray | JzodTuple)[];
  innerError?: SelectUnionBranchFromDiscriminatorReturnTypeError;
}

export type JzodUnionResolvedTypeReturnType =
  | JzodUnionResolvedTypeForObjectReturnTypeOK
  | JzodUnionResolvedTypeForArrayReturnTypeOK
  | JzodUnionResolvedTypeReturnTypeError;


// #################################################################################################
export interface KeyMapEntry {
  rawSchema: JzodElement;
  jzodObjectFlattenedSchema?: JzodObject;
  recursivelyUnfoldedUnionSchema?: JzodUnion_RecursivelyUnfold_ReturnTypeOK;
  resolvedSchema: JzodElement;
  chosenUnionBranchRawSchema?: JzodElement; // for unions, this is the raw schema of the chosen branch
  discriminatorValues?: string[][]; // for unions, this is the list of possible discriminator values
  discriminator?: string | string[]; // for unions, this is the discriminator used to select the branch
}
export const keyMapEntry: JzodElement = {
  type: "object",
  definition: {
    rawSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodElement",
      },
    }, // the raw schema that was checked
    jzodObjectFlattenedSchema: {
      type: "schemaReference",
      optional: true,
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodObject",
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
    resolvedSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodElement",
      },
    }, // the resolved schema that was checked
    chosenUnionBranchRawSchema: {
      type: "schemaReference",
      optional: true,
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodElement",
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
      definition: [{ type: "string" }, { type: "array", definition: { type: "string" } }],
    }, // for unions, this is the discriminator used to select the branch
        valuePath: {
      type: "array",
      definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
    },
    typePath: {
      type: "array",
      definition: { type: "union", definition: [{ type: "string" }, { type: "number" }] },
    }
  },
};

export interface ResolvedJzodSchemaReturnTypeOK {
  status: "ok";
  valuePath: (string | number)[];
  typePath: (string | number)[];
  rawSchema: JzodElement;
  resolvedSchema: JzodElement;
  keyMap?: Record<string, KeyMapEntry>;
  subSchemas?:
    | ResolvedJzodSchemaReturnType
    | ResolvedJzodSchemaReturnType[]
    | Record<string, ResolvedJzodSchemaReturnType>
    | undefined; // for unions, this is the list of sub-schemas that were resolved
}
export const resolvedJzodSchemaReturnTypeOK: JzodElement = {
  type: "object",
  definition: {
    status: { type: "literal", definition: "ok" },
    // valuePath: { type: "array", definition: { type: "string" } },
    // typePath: { type: "array", definition: { type: "string" } },
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
        relativePath: "jzodElement",
      },
    }, // the raw schema that was checked
    resolvedSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodElement",
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
  rawSchema?: JzodElement; // the raw schema that was checked
  errorOnValueAttributes?: string[]; // the attributes that failed to check, if relevant
  errorOnSchemaAttributes?: string[]; // the attributes that failed to check, if relevant
  innerError?:
    | JzodUnion_RecursivelyUnfold_ReturnTypeError
    | ResolvedJzodSchemaReturnTypeError
    | Record<string, ResolvedJzodSchemaReturnTypeError>
    | undefined; // for unions, this is the error of the sub-schema that failed
}
export const resolvedJzodSchemaReturnTypeError: JzodElement = {
  type: "object",
  definition: {
    status: { type: "literal", definition: "error" },
    error: { type: "string" },
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
        relativePath: "jzodElement",
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
export const resolvedJzodSchemaReturnType: JzodElement = {
  type: "union",
  definition: [
    resolvedJzodSchemaReturnTypeOK,
    resolvedJzodSchemaReturnTypeError,
  ],
};

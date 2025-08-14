import { valueToJzod } from "@miroir-framework/jzod";

import {
  EntityInstancesUuidIndex,
  JzodArray,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  JzodObject,
  JzodReference,
  JzodSchema,
  JzodTuple,
  JzodUnion,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
// import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
// import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
// import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";
import {
  JzodUnion_RecursivelyUnfold_ReturnTypeError,
  JzodUnion_RecursivelyUnfold_ReturnTypeOK,
} from "./jzodUnion_RecursivelyUnfoldInterface";

// import { packageName } from "../../constants";
// import { cleanLevel } from "../constants";
// import { jzodObjectFlatten } from "./jzodObjectFlatten";
// import { getObjectUniondiscriminatorValuesFromResolvedSchema } from "./getObjectUniondiscriminatorValuesFromResolvedSchema";
// import { resolveConditionalSchema, type ResolveConditionalSchemaError } from "./resolveConditionalSchema";
// import { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
// import { ReduxDeploymentsState } from "../../0_interfaces/2_domain/ReduxDeploymentsStateInterface";


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
  // possibleDiscriminators?: string[][];
  possibleDiscriminators?: (string | undefined)[][];
  valuePath: (string | number)[];
  typePath: (string | number)[];
  value?: any;
  objectUnionChoices?: JzodObject[];
  flattenedUnionChoices?: JzodObject[];
}

export type SelectUnionBranchFromDiscriminatorReturnType = 
  SelectUnionBranchFromDiscriminatorReturnTypeOK | SelectUnionBranchFromDiscriminatorReturnTypeError;

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
  // recursivelyUnfoldedRawSchema?: JzodElement[];
  recursivelyUnfoldedUnionSchema?: JzodUnion_RecursivelyUnfold_ReturnTypeOK;
  resolvedSchema: JzodElement;
  chosenUnionBranchRawSchema?: JzodElement; // for unions, this is the raw schema of the chosen branch
  discriminatorValues?: string[]; // for unions, this is the list of possible discriminator values
  discriminator?: string | string[]; // for unions, this is the discriminator used to select the branch
}


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
    valuePath: { type: "array", definition: { type: "string" } },
    typePath: { type: "array", definition: { type: "string" } },
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
    subschemas: {
      type: "union",
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
        }
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
const resolvedJzodSchemaReturnTypeError: JzodElement = {
  type: "object",
  definition: {
    status: { type: "literal", definition: "error" },
    error: { type: "string" },
    rawJzodSchemaType: { type: "string" }, // the raw schema type that was checked
    valuePath: { type: "array", definition: { type: "string" } },
    typePath: { type: "array", definition: { type: "string" } },
    value: { type: "any" }, // the value that was checked
    rawSchema: {
      type: "schemaReference",
      definition: {
        absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
        relativePath: "jzodElement",
      },
    }, // the raw schema that was checked
    errorOnValueAttributes: {
      type: "array",
      definition: { type: "string" },
    }, // the attributes that failed to check, if relevant
    errorOnSchemaAttributes: {
      type: "array",
      definition: { type: "string" },
    }, // the attributes that failed to check, if relevant
    innerError: {
      type: "union",
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

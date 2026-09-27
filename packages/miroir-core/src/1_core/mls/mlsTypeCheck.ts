import { valueToJzod } from "@miroir-framework/jzod";

import {
  MlArray,
  MlElement,
  MlEnum,
  MlLiteral,
  MlObject,
  MlReference,
  MlTuple,
  MlUnion,
  KeyMapEntry,
  type MlRecord,
  type ResolvedMlSchemaReturnType,
  type ResolvedMlSchemaReturnTypeError,
  type ResolvedMlSchemaReturnTypeOK,
  type TransformerForBuildPlusRuntime_mlsTypeCheck
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { recursiveResolveMlSchemaReferenceInContext, resolveMlSchemaReferenceInContext } from "./mlsResolveSchemaReferenceInContext";
import {
  mlUnion_recursivelyUnfold,
} from "./mlUnion_RecursivelyUnfold";

import type {
  MlUnionResolvedTypeForArrayReturnTypeOK,
  MlUnionResolvedTypeForObjectReturnTypeOK,
  MlUnionResolvedTypeReturnTypeError,
  SelectUnionBranchFromDiscriminatorReturnType,
  SelectUnionBranchFromDiscriminatorReturnTypeError,
} from "../../0_interfaces/1_core/mlsTypeCheckInterface";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";
import { ReduxDeploymentsState } from "../../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { Step } from "../../2_domain/Transformers";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import { defaultMiroirModelEnvironment } from "../Model";
import { getObjectUnionDiscriminatorValuesFromResolvedSchema } from "./getObjectUnionDiscriminatorValues";
import { mlObjectFlatten } from "./mlObjectFlatten";
import { resolveConditionalSchema, type ResolveConditionalSchemaError } from "./resolveConditionalSchema";
import { TransformerFailure } from "../../0_interfaces/2_domain/DomainElement";

// export const miroirFundamentalMlSchema2 = miroirFundamentalMlSchema;
// import { miroirFundamentalMlSchema } from "../tmp/src/0_interfaces/1_core/bootstrapMlSchemas/miroirFundamentalMlSchema";


const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MlsTypeCheck");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName,
).then((logger: LoggerInterface) => {log = logger});


// Implicit union branches used when rawSchema.type === "any"
// These represent the full set of types that an "any" field can hold.
export const ANY_IMPLICIT_UNION_BRANCHES: MlElement[] = [
  { type: "string" },
  { type: "number" },
  { type: "bigint" },
  { type: "boolean" },
  { type: "uuid" },
  { type: "date" },
  { type: "record", tag: {
    value: {
      defaultLabel: "Record<string, any>",
      initializeTo: {
        initializeToType: "value",
        value: { "a": "enter attributes here..." }
      }
    }
  }, definition: { type: "any" } } as MlElement,
  { type: "array", tag: {
    value: {
      defaultLabel: "Array<any>",
      initializeTo: {
        initializeToType: "value",
        value: ["enter elements here..."]
      }
    }
  }, definition: { type: "any" } } as MlElement,
];

export const ANY_IMPLICIT_UNION_TYPE: MlUnion = {
  type: "union",
  definition: ANY_IMPLICIT_UNION_BRANCHES,
};
export const ANY_SCHEMA: MlElement = { type: "any" };

/** Schema used for record values when the record definition is an opt-in union fallback. */
function mlRecordElementSchema(definition: MlElement): MlElement {
  if (definition?.type === "union") {
    return ANY_SCHEMA;
  }
  return definition;
}

// ################################################################################################
/**
 * Builds a keymap entry for an object value in an "any" descendant context:
 * rawSchema is ANY_IMPLICIT_UNION_TYPE, and child entries are embedded as named properties
 * so that paths like "keyMap.outer.inner.rawSchema" can be navigated via getValueByDottedPath.
 */
export function buildAnyObjectEntry(
  v: Record<string, any>,
  childPath: (string | number)[],
  childTypePath: (string | number)[],
): any {
  const entry: any = {
    // rawSchema: ANY_IMPLICIT_UNION_TYPE as MlElement,
    rawSchema: ANY_SCHEMA,
    resolvedSchema: valueToJzod(v) as MlElement,
    valuePath: childPath,
    typePath: childTypePath,
  };
  for (const [k2, v2] of Object.entries(v)) {
    const subPath = [...childPath, k2];
    const subTypePath = [...childTypePath, k2];
    if (typeof v2 === "object" && v2 !== null && !Array.isArray(v2)) {
      entry[k2] = buildAnyObjectEntry(v2, subPath, subTypePath);
    } else {
      entry[k2] = {
        // rawSchema: ANY_IMPLICIT_UNION_TYPE as MlElement,
        rawSchema: ANY_SCHEMA,
        resolvedSchema: valueToJzod(v2) as MlElement,
        valuePath: subPath,
        typePath: subTypePath,
      };
    }
  }
  return entry;
}

// ################################################################################################
/**
 * Builds keymap entries for direct children of an object value typed as {type: "any"}.
 * All sub-nodes use ANY_IMPLICIT_UNION_TYPE as rawSchema.
 * Keys use the full dotted path so application lookups like keyMap["any.a"] work correctly.
 * Object entries embed child entries as named properties so navigation paths like
 * "keyMap.outer.inner.rawSchema" resolve via getValueByDottedPath.
 */
export function buildAnySubnodeKeyMap(
  obj: Record<string, any>,
  basePath: (string | number)[],
  baseTypePath: (string | number)[],
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const childPath = [...basePath, k];
    const childTypePath = [...baseTypePath, k];
    const flatKey = childPath.join(".");
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      result[flatKey] = buildAnyObjectEntry(v, childPath, childTypePath);
    } else {
      result[flatKey] = {
        // rawSchema: ANY_IMPLICIT_UNION_TYPE as MlElement,
        rawSchema: ANY_SCHEMA,
        resolvedSchema: valueToJzod(v) as MlElement,
        valuePath: childPath,
        typePath: childTypePath,
      };
    }
  }
  return result;
}

// ################################################################################################
// to be replaced by mlObjectFlatten?
export function resolveObjectExtendClauseAndDefinition<T extends MiroirModelEnvironment>(
  mlObject: MlObject,
  modelEnvironment: T,
  relativeReferenceMlContext?: { [k: string]: MlElement }
): MlObject {
  if (mlObject.extend) {
    const extension: MlElement = resolveMlSchemaReferenceInContext(
      mlObject.extend,
      relativeReferenceMlContext,
      modelEnvironment
    );
    const resolvedDefinition = Object.fromEntries(
      Object.entries(mlObject.definition)
        .filter((e: [string, MlElement]) => e[1].type == "schemaReference")
        .map((e) => [
          e[0],
          resolveMlSchemaReferenceInContext(
            e[1] as MlReference,
            { ...relativeReferenceMlContext, ...((e[1] as MlReference).context ?? {}) },
            modelEnvironment,
          ),
        ]),
    );
    if (extension.type == "object") {
      return {
        type: "object",
        definition: {
          ...extension.definition,
          ...mlObject.definition,
          ...resolvedDefinition,
        },
      };
    } else {
      throw new Error(
        "resolveObjectExtendClauseAndDefinition object extend clause schema " +
          JSON.stringify(mlObject) +
          " is not an object " +
          JSON.stringify(extension)
      );
      // return ({
      //   status: "error",
      //   error: "mlsTypeCheck object extend clause schema " +
      //       JSON.stringify(mlSchema) +
      //       " is not an object " +
      //       JSON.stringify(extension)
      // })
    }
  } else {
    return mlObject;
  }
}

// ################################################################################################
function isValidUUID(uuid: string): boolean {
  // Regular expression to validate UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ################################################################################################
/**
 * returns an array of MlObject schemas by recursively unrolling the unions and references in @param concreteUnrolledMlSchemas.
 * TODO: WHAT ABOUT RECORD SCHEMAS?
 * @param concreteUnrolledMlSchemas 
 * @param miroirFundamentalMlSchema 
 * @param currentModel 
 * @param miroirMetaModel 
 * @param relativeReferenceMlContext 
 * @returns 
 */
export function unionObjectChoices<T extends MiroirModelEnvironment> (
  concreteUnrolledMlSchemas: MlElement[],
  modelEnvironment: T,
  relativeReferenceMlContext: { [k: string]: MlElement }
): (MlObject | MlRecord)[] {
  return (
    concreteUnrolledMlSchemas.filter((j) => j.type == "record") as (MlObject | MlRecord)[]
  ).concat(
    (concreteUnrolledMlSchemas.filter((j) => j.type == "object") as MlObject[]).map(
      (k: MlObject): MlObject =>
        mlObjectFlatten(k, modelEnvironment, relativeReferenceMlContext)
    ) as MlObject[],
    (
      concreteUnrolledMlSchemas.filter(
        (j: MlElement): boolean => j.type == "union"
      ) as MlUnion[]
    ).flatMap(
      // for sub-unions, return the sub-objects clauses, with their extend clauses resolved
      (j: MlUnion): MlObject[] =>
        (j.definition.filter((k: MlElement) => k.type == "object") as MlObject[]).map(
          (k: MlObject): MlObject =>
            mlObjectFlatten(k, modelEnvironment, relativeReferenceMlContext)
        ) as MlObject[]
    ),
    (
      concreteUnrolledMlSchemas.filter((j: MlElement) => j.type == "union") as MlUnion[]
    ).flatMap(
      // if schemaReferences are found, we resolve them, squashing the extend clause for objects
      (j: MlUnion) =>
        (
          (j.definition.filter((k: MlElement) => k.type == "schemaReference") as MlReference[])
            .map((k: MlReference) =>
              resolveMlSchemaReferenceInContext(
                k,
                { ...relativeReferenceMlContext, ...k.context },
                modelEnvironment
              )
            )
            .filter((j) => j.type == "object") as MlObject[]
        ).map(
          (k: MlObject): MlObject =>
            mlObjectFlatten(k, modelEnvironment, relativeReferenceMlContext)
        ) as MlObject[]
    )
  );
}
;

// ################################################################################################
/**
 * returns an array of MlArray and MlTuple schemas by recursively unrolling the unions and references in @param concreteUnrolledMlSchemas.
 * @param concreteUnrolledMlSchemas 
 * @param miroirFundamentalMlSchema 
 * @param currentModel 
 * @param miroirMetaModel 
 * @param relativeReferenceMlContext 
 * @returns 
 */
export function unionArrayChoices<T extends MiroirModelEnvironment> (
  concreteUnrolledMlSchemas: MlElement[],
  modelEnvironment: T,
  relativeReferenceMlContext: { [k: string]: MlElement }
): (MlArray | MlTuple)[] {
  return (
    concreteUnrolledMlSchemas.filter(
      (j: MlElement) => j.type == "array" || j.type == "tuple"
    ) as (MlArray | MlTuple)[]
  ).concat(
    (
      concreteUnrolledMlSchemas.filter(
        (j: MlElement): boolean => j.type == "union"
      ) as MlUnion[]
    ).flatMap(
      // for sub-unions, return the sub-objects clauses, with their extend clauses resolved
      (j: MlUnion): (MlArray | MlTuple)[] =>
        j.definition.filter((k: MlElement) => k.type == "array" || k.type == "tuple") as (
          | MlArray
          | MlTuple
        )[]
    ),
    (
      concreteUnrolledMlSchemas.filter((j: MlElement) => j.type == "union") as MlUnion[]
    ).flatMap(
      // if schemaReferences are found, we resolve them, squashing the extend clause for objects
      (j: MlUnion) =>
        (j.definition.filter((k: MlElement) => k.type == "schemaReference") as MlReference[])
          .map((k: MlReference) => {
            const result = recursiveResolveMlSchemaReferenceInContext(
              k,
              { ...relativeReferenceMlContext, ...k.context },
              modelEnvironment,
            );
            return result;
          }
          )
          .filter((j) => j.type == "array" || j.type == "tuple") as (MlArray | MlTuple)[]
    ) as (MlArray | MlTuple)[]
  );
}
;

// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
export function selectUnionBranchFromDiscriminator<T extends MiroirModelEnvironment>(
  objectUnionChoices: MlObject[],
  effectiveRawSchema: MlUnion,
  discriminator: string | (string | string[])[] | undefined,
  valueObject: Record<string,any>,
  valueObjectPath: (string | number)[],
  typePath: (string | number)[], // for logging purposes only
  modelEnvironment: T,
  relativeReferenceMlContext: {[k:string]: MlElement},
): SelectUnionBranchFromDiscriminatorReturnType {
  // Untagged object unions (no discriminator): match by key inclusion — every
  // value key must exist on the branch (issue #267 D1 key-union / XOR).
  const discriminators: (string | string[])[] = !discriminator
    ? []
    : Array.isArray(discriminator)
      ? discriminator
      : [discriminator];

  // TODO: remove, object union choices should already be flattened in unionObjectChoices
  // WHY CAN objectUnionChoices NOT be flattened already?
  // "flatten" object hierarchy, if there is an extend clause, we resolve it
  const flatteningResults = objectUnionChoices.map(
    (mlObjectSchema) => {
      let extendedMlSchema: MlObject
      if (mlObjectSchema.extend) {
        const extension = resolveMlSchemaReferenceInContext(
          mlObjectSchema.extend,
          relativeReferenceMlContext,
          modelEnvironment,
        )
        if (extension.type == "object") {
          extendedMlSchema = {
            type: "object",
            definition: {
              ...extension.definition,
              ...mlObjectSchema.definition
            }
          }
        } else {
          return {
            status: "error" as const,
            error: "selectUnionBranchFromDiscriminator object extend clause schema is not an object",
            discriminator,
            valuePath: valueObjectPath,
            typePath,
            value: valueObject,
            objectUnionChoices,
          };
        }
      } else {
        extendedMlSchema = mlObjectSchema
      }
      return { status: "ok" as const, result: extendedMlSchema };
    }
  );

  // Check if any errors occurred during flattening
  const flatteningErrors = flatteningResults.filter(r => r.status === "error");
  if (flatteningErrors.length > 0) {
    return flatteningErrors[0] as SelectUnionBranchFromDiscriminatorReturnTypeError;
  }

  const discriminatorValues: any[] = [];
  discriminators.forEach((d) => {
    if (Array.isArray(d)) {
      const valuesForThisDiscriminatorArray = d.map((subD) => valueObject[subD]);
      const nonNullValues = valuesForThisDiscriminatorArray.filter(v => v !== null && v !== undefined);
      // log.info(
      //   "selectUnionBranchFromDiscriminator called for union-type value object with multi-part discriminator",
      //   "valueObjectPath",
      //   valueObjectPath.join("."),
      //   "discriminator(s)=",
      //   d,
      //   "valuesForThisDiscriminatorArray",
      //   valuesForThisDiscriminatorArray,
      //   "nonNullValues",
      //   nonNullValues,
      //   "valueObject=",
      //   valueObject,
      // );
      if (nonNullValues.length > 1) {
        return {
          status: "error",
          error: "selectUnionBranchFromDiscriminator called for union-type value object with multi-part discriminator but multiple values found",
          discriminator,
          valuePath: valueObjectPath,
          typePath,
          value: valueObject,
        }
      }
      discriminatorValues.push(nonNullValues[0]);
    } else {
      discriminatorValues.push(valueObject[d]);
    }
    // return valueObject[d];
  });

  // Extract successful results
  const flattenedUnionChoices:MlObject[] = flatteningResults.map(r => (r as any).result) as MlObject[];
  // if (discriminatorValues.includes("getFromParameters")) {
  //   log.info(
  //     "selectUnionBranchFromDiscriminator called",
  //     "valueObjectPath",
  //     valueObjectPath.join("."),
  //     "discriminator(s)=",
  //     discriminators,
  //     "discriminatorValues",
  //     discriminatorValues,
  //     "valueObject=",
  //     valueObject,
  //     "valueObject[discriminator]=",
  //     discriminators??[].map(d => valueObject[d]),
  //     "relativeReferenceMlContext=",
  //     // JSON.stringify(relativeReferenceMlContext, null, 2),
  //     relativeReferenceMlContext,
  //     // "flattenedUnionChoices=",
  //     // JSON.stringify(flattenedUnionChoices, null, 2),
  //     // flattenedUnionChoices
  //     "objectUnionChoices=",
  //     // JSON.stringify(objectUnionChoices.map((e:any) => [e?.definition['transformerType'], e?.definition ]), null, 2),
  //     JSON.stringify(objectUnionChoices.map((e:any) => e?.definition['transformerType']), null, 2),
  //     // "flatteningResults",
  //     // JSON.stringify(flatteningResults.map((e:any) => e?.result?.definition['transformerType']), null, 2),
  //   );
  // }
  const flatDiscriminators: string [] = discriminators.flatMap(d => d);
  let i = 0;
  const chosenDiscriminator = [];
  let filteredFlattenedUnionChoices: MlObject[] = flattenedUnionChoices;
  let possibleDiscriminators: (string | undefined)[][] = [];
  if (!discriminators || discriminators.length == 0) {
    // no discriminator, proceed by eliminating all choices that do not match the valueObject
    filteredFlattenedUnionChoices = flattenedUnionChoices.filter((objectChoice: MlObject) => {
      const objectChoiceKeys = Object.keys(objectChoice.definition);
      return Object.keys(valueObject).every(
        (valueObjectKey) =>
          objectChoiceKeys.includes(valueObjectKey) && // TODO: is there a problem? objectChoice as any smells bad! are all the cases covered?
          ((objectChoice as any).definition[valueObjectKey]?.type != "literal" ||
            (objectChoice as any).definition[valueObjectKey]?.definition == valueObject[valueObjectKey])
      );
    });
  } else {
    const hasDiscriminatorValues = flatDiscriminators.some((d) =>
      valueObject[d] !== undefined
    );
    if (!hasDiscriminatorValues) {
      const choiceWithNoDiscriminator: MlObject[] = flattenedUnionChoices.filter(
        (objectChoice: any) => // TODO: typing!
          Object.keys(objectChoice.definition).every(
            (key) => !flatDiscriminators.includes(key) // TODO: invert loop, will be faster!
            // (key) => objectChoice.definition[key]?.type != "literal" ||
            //   objectChoice.definition[key]?.definition == valueObject[key]
          )
      );
      if (choiceWithNoDiscriminator.length === 1) {
        return {
          status: "ok",
          currentDiscriminatedObjectMlSchema: filteredFlattenedUnionChoices[0],
          flattenedUnionChoices: filteredFlattenedUnionChoices,
          chosenDiscriminator: [],
        };
      } else {
        return {
          status: "error",
          error: "selectUnionBranchFromDiscriminator: no discriminator values found in valueObject and multiple choices exist",
          discriminator,
          effectiveRawSchema,
          valuePath: valueObjectPath,
          typePath,
          value: valueObject,
          objectUnionChoices,
          flattenedUnionChoices: choiceWithNoDiscriminator,
        };
      }
    }

    // filtering possible union branches by discriminator values
    while (i < discriminators.length && filteredFlattenedUnionChoices.length > 1) {
      const localDiscriminator = discriminators[i];
      const localChosenDiscriminator = Array.isArray(localDiscriminator)
        ? localDiscriminator.find((d) => valueObject[d] !== undefined)
        : localDiscriminator;
        if (!localChosenDiscriminator) { // defensive code, impossible to be here since hasDiscriminatorValues is true
          return {
            status: "error",
            error: "selectUnionBranchFromDiscriminator: no discriminator value found in valueObject for multi-part discriminator " +
              JSON.stringify(localDiscriminator),
            discriminator,
            valuePath: valueObjectPath,
            typePath,
            value: valueObject,
            objectUnionChoices,
            flattenedUnionChoices: filteredFlattenedUnionChoices,
          };
        }
      const newfilteredFlattenedUnionChoices = filteredFlattenedUnionChoices.filter(
        (a) =>{
          return (
            a.type == "object" &&
            a.definition[localChosenDiscriminator]?.type == "literal" &&
            (a.definition[localChosenDiscriminator] as MlLiteral).definition == valueObject[localChosenDiscriminator]
          ) ||
          (
            a.type == "object" &&
            a.definition[localChosenDiscriminator]?.type == "enum" &&
            (a.definition[localChosenDiscriminator] as MlEnum).definition.includes(valueObject[localChosenDiscriminator])
          )
        }
      );
      chosenDiscriminator.push({discriminator: localChosenDiscriminator, value: valueObject[localChosenDiscriminator]});
      filteredFlattenedUnionChoices = newfilteredFlattenedUnionChoices;
      i++;
    }
    // log.info(
    //   "selectUnionBranchFromDiscriminator called for union-type value object",
    //   "valueObjectPath",
    //   valueObjectPath.join("."),
    //   "discriminator(s)=",
    //   "with discriminator(s)=",
    //   discriminators,
    //   "filteredFlattenedUnionChoices=",
    //   filteredFlattenedUnionChoices
    //   // JSON.stringify(objectUnionChoices.map((e:any) => [e?.definition['transformerType'], e?.definition ]), null, 2),
    // );
  } // end: !discriminators || discriminators.length == 0



  if (filteredFlattenedUnionChoices.length == 0) {
    possibleDiscriminators = flattenedUnionChoices.map((objectChoice) => {
      const objectChoiceKeys = Object.keys(objectChoice.definition);
      return discriminators.flatMap(
        (discriminator) =>
          Array.isArray(discriminator)
            ? undefined
            : objectChoiceKeys.includes(discriminator) &&
              (objectChoice as any).definition[discriminator]?.type == "literal"
            ? (objectChoice as any).definition[discriminator]?.definition
            : (objectChoice as any).definition[discriminator]?.type == "enum"
            ? (objectChoice as any).definition[discriminator]?.definition
            : undefined
        // : "NO VALUE FOR DISCRIMINATOR " + discriminator
      );
    });

    return {
      status: "error",
      error: "selectUnionBranchFromDiscriminator called for union-type value object found no match with discriminator(s)=" +
        JSON.stringify(discriminators),
      discriminator: discriminators,
      discriminatorValues,
      possibleDiscriminators,
      valuePath: valueObjectPath,
      typePath,
      value: valueObject,
      objectUnionChoices,
      // flattenedUnionChoices: filteredFlattenedUnionChoices,
      flattenedUnionChoices: flattenedUnionChoices,
    };
  }
  if (filteredFlattenedUnionChoices.length > 1) {
    // log.info(
    //   "selectUnionBranchFromDiscriminator found many matches with discriminator(s)=",
    //   discriminators,
    //   "filteredFlattenedUnionChoices=",
    //   filteredFlattenedUnionChoices
    // )
    return {
      status: "error",
      error: "selectUnionBranchFromDiscriminator called for union-type value object found many matches with discriminator(s)=" +
        JSON.stringify(discriminators) + " found " + filteredFlattenedUnionChoices.length + " matches.",
      discriminator: discriminators,
      // discriminatorValues: discriminators??[].map(d => valueObject[d]),
      discriminatorValues,
      valuePath: valueObjectPath,
      typePath,
      value: valueObject,
      objectUnionChoices,
      flattenedUnionChoices: filteredFlattenedUnionChoices,
    };
  }
  // log.info("selectUnionBranchFromDiscriminator found exactly 1 match for union-type at valuepath=valueObject." +
  //   valueObjectPath.join("."),
  //   "typePath=",
  //   typePath.join("."),
  //   "chosen discriminator=",
  //   JSON.stringify(chosenDiscriminator, null, 2),
  // );
  const currentDiscriminatedObjectMlSchema: MlObject =
    filteredFlattenedUnionChoices[0] as MlObject;
  return {
    status: "ok",
    currentDiscriminatedObjectMlSchema,
    flattenedUnionChoices: filteredFlattenedUnionChoices,
    chosenDiscriminator,
  };
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function mlUnionResolvedTypeForArray<T extends MiroirModelEnvironment>(
  concreteUnrolledMlSchemas: MlElement[],
  effectiveRawSchema: MlUnion,
  discriminator: string | (string | string[])[] | undefined,
  valueArray: any[],
  currentValuePath: (string | number)[],
  currentTypePath: (string | number)[],
  modelEnvironment: T,
  relativeReferenceMlContext: { [k: string]: MlElement }
): MlUnionResolvedTypeForArrayReturnTypeOK
  | MlUnionResolvedTypeReturnTypeError
 {
  /**
   * ALLOWING ONLY ONE MATCHING UNION BRANCH FOR THE ARRAY
   */
  // log.info("mlUnionResolvedTypeForArray called for valueArray=", valueArray, "discriminator=", discriminator);
  const arrayUnionChoices = unionArrayChoices(
    concreteUnrolledMlSchemas,
    modelEnvironment,
    relativeReferenceMlContext
  );
  if (arrayUnionChoices.length == 1) {
    return {
      status: "ok",
      resolvedMlObjectSchema: arrayUnionChoices[0],
      arrayUnionChoices: arrayUnionChoices,
    };
  }
  if (!arrayUnionChoices || arrayUnionChoices.length == 0) {
    return {
      status: "error",
      error: "mlUnionResolvedTypeForArray could not find object type for given array value in resolved union",
      rawSchema: effectiveRawSchema,
      discriminator,
      valuePath: currentValuePath,
      typePath: currentTypePath,
      value: valueArray,
      concreteUnrolledMlSchemas,
      unionChoices: arrayUnionChoices,
    };
  }
  return {
    status: "error",
    error: "mlUnionResolvedTypeForArray called for union-type value array with discriminator(s)=" +
      JSON.stringify(discriminator) + " found " + arrayUnionChoices.length + " matches.",
    discriminator,
    valuePath: currentValuePath,
    typePath: currentTypePath,
    value: valueArray,
    concreteUnrolledMlSchemas,
    unionChoices: arrayUnionChoices,
  };
} // end of mlUnionResolvedTypeForArray

// ################################################################################################
export function mlUnionResolvedTypeForObject<T extends MiroirModelEnvironment>(
  concreteUnrolledMlSchemas: MlElement[],
  effectiveRawSchema: MlUnion,
  discriminator: string | (string | string[])[] | undefined,
  valueObject: Record<string, any>,
  currentValuePath: (string | number)[],
  currentTypePath: (string | number)[],
  modelEnvironment: T,
  relativeReferenceMlContext: { [k: string]: MlElement }
): MlUnionResolvedTypeForObjectReturnTypeOK
  | MlUnionResolvedTypeReturnTypeError
 {
  const objectUnionChoices: MlObject[] = unionObjectChoices(
    concreteUnrolledMlSchemas,
    modelEnvironment,
    relativeReferenceMlContext
  ) as any;

  // if (valueObject.transformerType == "getFromParameters") {
  //   log.info(
  //     "mlUnionResolvedTypeForObject called for",
  //     "valuePath=" + currentValuePath.join("."),
  //     "valueObject=",
  //     valueObject,
  //     "discriminator=",
  //     discriminator,
  //     "concreteUnrolledMlSchemas",
  //     JSON.stringify(concreteUnrolledMlSchemas.map((e: any) => e?.definition?.transformerType ? e?.definition?.transformerType : e), null, 2),
  //     "objectUnionChoices",
  //     JSON.stringify(objectUnionChoices.map(e => e.definition.transformerType), null, 2),
  //   );
  // }

  
  if (objectUnionChoices.length == 1) {
    return {
      status: "ok",
      resolvedMlObjectSchema: objectUnionChoices[0],
      objectUnionChoices: objectUnionChoices,
    };
  }
  if (!objectUnionChoices || (objectUnionChoices.length == 0 && !effectiveRawSchema.optInDiscriminator)) {
    return {
      status: "error",
      error: "mlUnionResolvedTypeForObject could not find object type for given object value in resolved union",
      discriminator,
      valuePath: currentValuePath,
      typePath: currentTypePath,
      value: valueObject,
      concreteUnrolledMlSchemas,
      unionChoices: objectUnionChoices,
    };
  }

  const selectUnionResult = selectUnionBranchFromDiscriminator(
    objectUnionChoices,
    effectiveRawSchema,
    discriminator,
    valueObject,
    currentValuePath,
    currentTypePath, // typePath
    modelEnvironment,
    relativeReferenceMlContext
  );
  
  if (selectUnionResult.status === "error") {
    // TODO: valid only if 0 choices are available!
    if (effectiveRawSchema.optInDiscriminator) {
      // log.warn(
      //   "selectUnionBranchFromDiscriminator failed to select union branch for object value at path valueObject." +
      //     currentValuePath.join(".") +
      //     " with discriminator(s)=" +
      //     JSON.stringify(discriminator) +
      //     " but optInDiscriminator is true, proceeding with the union branches as possible matches. Error was: " +
      //     selectUnionResult.error,
      //   "valueObject=",
      //   valueObject,
      //   "discriminator(s)=",
      //   discriminator,
      //   "selectUnionResult=",
      //   JSON.stringify(selectUnionResult, null, 2)
      // );

      return {
        status: "ok",
        resolvedMlObjectSchema: {
          type: "record",
          definition: ANY_SCHEMA,
        },
        objectUnionChoices: objectUnionChoices,
        chosenDiscriminator: [{ discriminator: "optInDiscriminator", value: "optInDiscriminator" }],
      };
    }

    return {
      status: "error",
      error: "mlUnionResolvedTypeForObject failed to select union branch",
      discriminator,
      valuePath: currentValuePath,
      typePath: currentTypePath,
      innerError: selectUnionResult,
      value: valueObject,
      concreteUnrolledMlSchemas,
      unionChoices: objectUnionChoices,
    };
  }

  const {
    currentDiscriminatedObjectMlSchema,
    flattenedUnionChoices,
    chosenDiscriminator,
    // discriminatorValues,
  } = selectUnionResult;
  return {
    status: "ok",
    resolvedMlObjectSchema: currentDiscriminatedObjectMlSchema,
    objectUnionChoices: objectUnionChoices,
    chosenDiscriminator,
  };
} // end of mlUnionResolvedTypeForObject

// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
/**
 * mlsTypeCheck is the main function to check if a valueObject matches a MlElement schema.
 * It recursively checks the schema and returns a ResolvedMlSchemaReturnType.
 * 
 * Basically, it removes the unions and references from the MlElement schema,
 * getting a node-for-node representation of the schema,
 * and checks if the valueObject matches the schema.
 * 
 * @param effectiveSchema - The MlElement schema to check against.
 * @param valueObject - The value object to check.
 * @param currentValuePath - The current path in the value object.
 * @param currentTypePath - The current path in the type schema.
 * @param miroirFundamentalMlSchema - The fundamental ML schema for reference resolution.
 * @param currentModel - The current model being processed.
 * @param miroirMetaModel - The meta model for the Miroir framework.
 * @param relativeReferenceMlContext - Context for resolving relative references in ML schemas.
 */
export function mlsTypeCheck(
  mlSchema: MlElement,
  valueObject: any,
  currentValuePath: (string | number)[],
  currentTypePath: (string | number)[],
  modelEnvironment: MiroirModelEnvironment,
  relativeReferenceMlContext: {[k:string]: MlElement},
  // 
  currentDefaultValue?: any,
  reduxDeploymentsState: ReduxDeploymentsState | undefined = undefined,
  deploymentUuid?: string,
  rootObject?: any, // Optional parameter for backward compatibility, NOT USED ANYMORE? TO BE REMOVED?
  schemaReferenceName?: string, // only for logging purposes, to track the name of the schema reference being resolved, if applicable
): ResolvedMlSchemaReturnType {
  // log.info(
  //   "mlsTypeCheck called for valuePath=." + 
  //   currentValuePath.join("."),
  //   "value",
  //   // // JSON.stringify(valueObject, null, 2),
  //   valueObject,
  //   "mlSchema",
  //   mlSchema,
  //   // "schema",
  //   // JSON.stringify(mlSchema, null, 2)
  // );

  // Check for null and undefined values first
  if (valueObject === null || valueObject === undefined) {
    // Check if the schema is optional or nullable
    const isOptional = mlSchema.optional === true;
    const isNullable = mlSchema.nullable === true;
    
    if (!isOptional && !isNullable && mlSchema.type !== "any" && mlSchema.type !== "undefined") {
      return {
        status: "error",
        error: `mlsTypeCheck expected a value but got ${valueObject === null ? 'null' : 'undefined'} for non-optional schema`,
        rawMlSchemaType: mlSchema.type,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        value: valueObject,
        rawSchema: mlSchema,
      };
    }

    const resolvedSchema =
      mlSchema.type === "any"
        ? (valueToJzod(valueObject) as MlElement)
        : mlSchema;

    // If schema is optional, nullable, any, or undefined — accept null/undefined
    return {
      status: "ok",
      schemaReferenceName,
      valuePath: currentValuePath,
      typePath: currentTypePath,
      rawSchema: mlSchema,
      resolvedSchema,
      keyMap: {
        [currentValuePath.join(".")]: {
          rawSchema: mlSchema,
          resolvedSchema,
          valuePath: currentValuePath,
          typePath: currentTypePath,
        }, // map the current value path to the resolved schema
      },
    };
  }


  const effectiveSchemaOrError: MlElement | ResolveConditionalSchemaError =
    currentDefaultValue &&
    currentValuePath &&
    reduxDeploymentsState?
      resolveConditionalSchema(
        "build", // TODO: can typeCheck be used in "runtime"? What does it mean in this context?
        [], // transformerPath
        mlSchema,
        rootObject || currentDefaultValue, // Use rootObject if provided, fallback to currentDefaultValue
        currentValuePath as string[],
        modelEnvironment,
        {}, // queryParams
        {}, // contextResults
        reduxDeploymentsState,
        'typeCheck' // Specify this is for type checking
      ) : mlSchema;

  if ('error' in effectiveSchemaOrError) {
    return {
      status: "error",
      schemaReferenceName,
      error: `mlsTypeCheck: resolveConditionalSchema returned error: ${effectiveSchemaOrError.error}`,
      rawMlSchemaType: mlSchema.type,
      valuePath: currentValuePath,
      typePath: currentTypePath,
      value: valueObject,
      rawSchema: mlSchema,
      innerError: {
        status: "error",
        error:
          `resolveConditionalSchema error: ${effectiveSchemaOrError.error}` +
          ("details" in effectiveSchemaOrError ? `: ${effectiveSchemaOrError.details}` : ""),
        valuePath: currentValuePath,
        typePath: currentTypePath,
        value: effectiveSchemaOrError, // embed the original error object for debugging
        rawSchema: mlSchema,
      },
    };
  }
  const effectiveRawSchema: MlElement = effectiveSchemaOrError;
  
  switch (effectiveRawSchema?.type) {
    case "schemaReference": {
      const newContext = { ...relativeReferenceMlContext, ...effectiveRawSchema.context };
      const resolvedMlSchema = recursiveResolveMlSchemaReferenceInContext(
        effectiveRawSchema,
        newContext,
        modelEnvironment
      );
      const typeCheck = mlsTypeCheck(
        resolvedMlSchema,
        valueObject,
        currentValuePath,
        [...currentTypePath, "ref:" + (effectiveRawSchema.definition.relativePath ?? "NO_RELATIVE_PATH")],
        modelEnvironment,
        newContext,
        currentDefaultValue,
        reduxDeploymentsState,
        deploymentUuid,
        rootObject,
        effectiveRawSchema.definition.relativePath,
      );
      if (typeCheck.status == "error") {
        return {
          status: "error",
          error: "mlsTypeCheck failed to resolve schemaReference",
          schemaReferenceName: effectiveRawSchema.definition.relativePath,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: typeCheck,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      // #296: the keyMap is flat, so a consumer re-resolving this entry's rawSchema (e.g. the
      // instance editor's MlObjectEditor) only has `rawSchema.context`. A purely relative
      // reference whose context comes from an ancestor (e.g. `{relativePath:
      // "miroirTestForReactComponent"}` below the MiroirTest mlSchema's context) must carry that
      // context in its keyMap entry to be resolvable there.
      const keyMapRawSchema: MlReference =
        !effectiveRawSchema.definition?.absolutePath && Object.keys(newContext).length > 0
          ? { ...effectiveRawSchema, context: newContext }
          : effectiveRawSchema;
      return {
        status: "ok",
        schemaReferenceName: effectiveRawSchema.definition.relativePath,
        valuePath: typeCheck.valuePath,
        typePath: typeCheck.typePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: typeCheck.resolvedSchema,
        subSchemas: typeCheck.subSchemas, // for unions, this is the list of sub-schemas that were resolved
        keyMap: {
          ...(typeCheck.keyMap ?? {}), // for unions, this is the map of keys to sub-schemas
          [currentValuePath.join(".")]: (typeCheck.keyMap??{})[currentValuePath.join(".")]?{
            ...(typeCheck.keyMap??{})[currentValuePath.join(".")], // useful for unions, where the keyMap is a map of value paths to sub-schemas
            rawSchema: keyMapRawSchema,
            resolvedReferenceSchemaInContext: resolvedMlSchema,
            resolvedSchema: typeCheck.resolvedSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }:{
            rawSchema: keyMapRawSchema,
            resolvedReferenceSchemaInContext: resolvedMlSchema,
            resolvedSchema: typeCheck.resolvedSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
      break;
    }
    case "object": {
      if (typeof valueObject != "object") {
        return {
          status: "error",
          error: "mlsTypeCheck failed for object schema to match non-object value",
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }

      const mlObjectFlattenedSchema: MlObject = mlObjectFlatten(
        effectiveRawSchema,
        modelEnvironment,
        relativeReferenceMlContext
      );
      // log.info("mlsTypeCheck object extendedMlSchema",JSON.stringify(extendedMlSchema, null, 2));

      // checks that all attributes of the valueObject are present in the schema definition
      const resolvedObjectEntries: [string, ResolvedMlSchemaReturnType][] = Object.entries(
        valueObject
      ).map((e: [string, any]) => {
        if (mlObjectFlattenedSchema.definition[e[0]]) {
          const resultSchemaTmp = mlsTypeCheck(
            mlObjectFlattenedSchema.definition[e[0]],
            e[1],
            [...currentValuePath, e[0]],
            [...currentTypePath, e[0]],
            modelEnvironment,
            relativeReferenceMlContext,
            currentDefaultValue,
            reduxDeploymentsState,
            deploymentUuid,
            rootObject,
            undefined, // schemaReferenceName
          );
          return [e[0], resultSchemaTmp];
        } else {
          if (effectiveRawSchema.nonStrict === true) {
            return [
              e[0],
              {
                status: "ok",
                valuePath: [...currentValuePath, e[0]],
                typePath: currentTypePath,
                rawSchema: effectiveRawSchema,
                resolvedSchema: {
                  type: "any",
                } as MlElement,
                // resolvedSchema: valueToJzod(e[1]) as MlElement,
              },
            ];
          }
          return [
            e[0],
            {
              status: "error",
              error: "mlsTypeCheck value attribute '" + e[0] + "' not found in schema definition",
              rawMlSchemaType: effectiveRawSchema.type,
              valuePath: [...currentValuePath, e[0]],
              typePath: currentTypePath,
              value: valueObject,
              rawSchema: effectiveRawSchema,
              errorOnSchemaAttributes: mlObjectFlattenedSchema as any
            },
          ];
        }
      });

      const foundErrors = resolvedObjectEntries.filter(
        (e: [string, ResolvedMlSchemaReturnType]) => e[1].status == "error"
      );
      if (foundErrors.length > 0) {
        return {
          status: "error",
          error:
            "mlsTypeCheck failed to match some object value attribute(s) with the schema of that attribute(s)",
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          errorOnValueAttributes: foundErrors.map((e) => e[0]),
          innerError: Object.fromEntries(
            foundErrors.map((e: [string, ResolvedMlSchemaReturnType]) => [
              e[0],
              e[1] as ResolvedMlSchemaReturnTypeError,
            ])
          ),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      // checks that all mandatory attributes of the schema definition are present in the valueObject
      const missingMandatoryAttributes = Object.entries(
        mlObjectFlattenedSchema.definition
      ).filter(
        (e: [string, MlElement]) =>
          e[1].optional !== true &&
          e[1].nullable !== true &&
          !Object.keys(valueObject).includes(e[0])
      );
      if (missingMandatoryAttributes.length > 0) {
        return {
          status: "error",
          error:
            "mlsTypeCheck failed to match some mandatory object value attribute(s) with the schema of that attribute(s)",
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          errorOnSchemaAttributes: missingMandatoryAttributes.map((e) => e[0]),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resultResolvedMlSchema: MlObject = {
        ...mlObjectFlattenedSchema,
        definition: Object.fromEntries(
          resolvedObjectEntries.map((e) => [
            e[0],
            (e[1] as ResolvedMlSchemaReturnTypeOK).resolvedSchema,
          ])
        ),
      } as MlObject;
      const objecAttributeskeyMap: { [k: string]: KeyMapEntry } = (resolvedObjectEntries
      .filter((e) => e[1].status === "ok")  as [string, ResolvedMlSchemaReturnTypeOK][])
      .filter((e) => e[1].keyMap !== undefined)
      .reduce(
        (acc, [key, value]) => {
          // if (value.status === "ok") {
          if (value.keyMap) {
            return { ...acc, ...value.keyMap } as any;
            // return { ...acc, [key]:value.keyMap };
          }
          // return acc;
          // throw new Error(
          //   `mlsTypeCheck object schema keyMap should only contain "ok" entries, but found error for key "${key}": ${value.error}`
          // );
        },
        // {} as { [k: string]: { rawSchema: MlElement; resolvedSchema: MlElement } }
        {} as { [k: string]: KeyMapEntry }
      );

      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: resultResolvedMlSchema,
        subSchemas: Object.fromEntries(resolvedObjectEntries),
        keyMap: {
          ...objecAttributeskeyMap,
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema: resultResolvedMlSchema,
            mlObjectFlattenedSchema: mlObjectFlattenedSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
      break;
    }
    case "union": {
      const recursivelyUnfoldedUnionSchema = mlUnion_recursivelyUnfold(
        effectiveRawSchema as MlUnion,
        new Set(),
        modelEnvironment,
        relativeReferenceMlContext
      );

      if (recursivelyUnfoldedUnionSchema.status == "error") {
        // log.error(
        //   "mlsTypeCheck union schema",
        //   JSON.stringify(effectiveSchema, null, 2),
        //   "could not be unfolded, error:",
        //   unfoldedMlSchema.error
        // );
        return {
          status: "error",
          schemaReferenceName,
          error: "mlsTypeCheck failed to recursively unfold schema",
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: recursivelyUnfoldedUnionSchema,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      // const concreteUnfoldedMlSchemas: MlElement[] = recursivelyUnfoldedUnionSchema.result;

      // log.info(
      //   "mlsTypeCheck called for union",
      //   effectiveSchema,
      //   "concreteUnrolledMlSchemas resolved type:",
      //   // JSON.stringify(concreteUnfoldedMlSchemas, null, 2)
      //   concreteUnfoldedMlSchemas
      // );
      switch (typeof valueObject) {
        case "number":
        case "bigint":
        case "boolean": {
          // why is selectUnionBranchFromDiscriminator not used here? This is really similar to it.
          const resultMlSchema = recursivelyUnfoldedUnionSchema.result.find(
            (a) => a.type == typeof valueObject
          );
          if (resultMlSchema) {
            // log.info(
            //   "mlsTypeCheck object at",
            //   currentValuePath.join("."),
            //   "type:",
            //   JSON.stringify(resultMlSchema, null, 2),
            //   "validates",
            //   JSON.stringify(
            //     valueObject,
            //     (key, value) =>typeof value === "bigint" ? value.toString() : value,
            //     2
            //   )
            // );
            return {
              status: "ok",
              schemaReferenceName,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              rawSchema: effectiveRawSchema,
              resolvedSchema: resultMlSchema,
              keyMap: {
                [currentValuePath.join(".")]: {
                  rawSchema: effectiveRawSchema,
                  recursivelyUnfoldedUnionSchema: recursivelyUnfoldedUnionSchema,
                  resolvedSchema: resultMlSchema,
                  chosenUnionBranchRawSchema: resultMlSchema,
                  valuePath: currentValuePath,
                  typePath: currentTypePath,
                }, // map the current value path to the resolved schema
              },
            };
          } else {
            return {
              status: "error",
              schemaReferenceName,
              error: "mlsTypeCheck could not find type for value in resolved union",
              rawMlSchemaType: effectiveRawSchema.type,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              value: valueObject,
              rawSchema: effectiveRawSchema,
            };
          }
          break;
        }
        case "string": {
          // TODO: the following line may introduce some non-determinism, in the case many records actually match the "find" predicate! BAD!
          const resultMlSchema = recursivelyUnfoldedUnionSchema.result.find(
            (a) =>
              a.type == "any" ||
              a.type == "string" ||
              a.type == "uuid" ||
              (a.type == "literal" && a.definition == valueObject) ||
              (a.type == "enum" && (a.definition as string[]).includes(valueObject))
          );
          if (resultMlSchema) {
            // log.info(
            //   "mlsTypeCheck union for string at",
            //   currentValuePath.join("."),
            //   "type:",
            //   JSON.stringify(resultMlSchema, null, 2),
            //   "validates",
            //   JSON.stringify(valueObject, null, 2)
            // );
            return {
              status: "ok",
              schemaReferenceName,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              rawSchema: effectiveRawSchema,
              resolvedSchema: resultMlSchema,
              keyMap: {
                [currentValuePath.join(".")]: {
                  rawSchema: effectiveRawSchema,
                  recursivelyUnfoldedUnionSchema: recursivelyUnfoldedUnionSchema,
                  resolvedSchema: resultMlSchema,
                  chosenUnionBranchRawSchema: resultMlSchema,
                  valuePath: currentValuePath,
                  typePath: currentTypePath,
                }, // map the current value path to the resolved schema
              },
            };
          } else {
            return {
              status: "error",
              schemaReferenceName,
              error: "mlsTypeCheck could not find type for string value in resolved union",
              rawMlSchemaType: effectiveRawSchema.type,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              value: valueObject,
              rawSchema: effectiveRawSchema,
            };
          }
          break;
        }
        case "object": {
          if (Array.isArray(valueObject)) {
            // log.info(
            //   "mlsTypeCheck union for array at",
            //   currentValuePath.join("."),
            //   "type:",
            //   JSON.stringify(effectiveSchema, null, 2),
            //   "validates",
            //   JSON.stringify(valueObject, null, 2)
            // );
            const resolveUnionResult = mlUnionResolvedTypeForArray(
              recursivelyUnfoldedUnionSchema.result,
              effectiveRawSchema,
              effectiveRawSchema.discriminator,
              valueObject,
              currentValuePath,
              currentTypePath,
              modelEnvironment,
              relativeReferenceMlContext
            );
            if (resolveUnionResult.status === "error") {
              return {
                status: "error",
                schemaReferenceName,
                error: "mlsTypeCheck failed to resolve union for array",
                rawMlSchemaType: effectiveRawSchema.type,
                valuePath: currentValuePath,
                typePath: currentTypePath,
                innerError: resolveUnionResult,
                value: valueObject,
                rawSchema: effectiveRawSchema,
              };
            }
            if (resolveUnionResult.resolvedMlObjectSchema.type != "array") {
              return {
                status: "error",
                schemaReferenceName,
                error: "mlsTypeCheck resolved union for array did not yield an array schema",
                rawMlSchemaType: effectiveRawSchema.type,
                valuePath: currentValuePath,
                typePath: currentTypePath,
                value: valueObject,
                rawSchema: effectiveRawSchema,
              };
            }
            // TODO: schema of different items may vary!
            // const arrayItemSchema = mlsTypeCheck(
            //   resolveUnionResult.resolvedMlObjectSchema.definition,
            //   valueObject[0], // we take the first element of the array to determine the type
            //   currentValuePath,
            //   [...currentTypePath, "0"],
            //   modelEnvironment,
            //   relativeReferenceMlContext,
            //   currentDefaultValue,
            //   reduxDeploymentsState,
            //   deploymentUuid,
            //   rootObject
            // );
            const concreteArraySchema = mlsTypeCheck(
              resolveUnionResult.resolvedMlObjectSchema,
              valueObject, // resolving the valueObject a second time as an array, not as a union
              currentValuePath,
              currentTypePath,
              modelEnvironment,
              relativeReferenceMlContext,
              currentDefaultValue,
              reduxDeploymentsState,
              deploymentUuid,
              rootObject,
              undefined, // schemaReferenceName
            );
            if (concreteArraySchema.status === "error") {
              return {
                status: "error",
                schemaReferenceName,
                error: "mlsTypeCheck failed to match array (resolved from union) with schema",
                rawMlSchemaType: effectiveRawSchema.type,
                valuePath: currentValuePath,
                typePath: currentTypePath,
                innerError: concreteArraySchema,
                value: valueObject,
                rawSchema: effectiveRawSchema,
              };
            }
            // if (arrayItemSchema.status === "error") {
            //   return {
            //     status: "error",
            //     error: "mlsTypeCheck failed to match array item with schema",
            //     rawMlSchemaType: effectiveRawSchema.type,
            //     valuePath: currentValuePath,
            //     typePath: currentTypePath,
            //     innerError: arrayItemSchema,
            //     value: valueObject,
            //     rawSchema: effectiveRawSchema,
            //   };
            // }
            const resolvedSchema: MlElement = {
              ...effectiveRawSchema,
              // type: "array",
              ...(concreteArraySchema.resolvedSchema as MlTuple),
            };

            return {
              status: "ok",
              schemaReferenceName,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              rawSchema: effectiveRawSchema,
              resolvedSchema,
              keyMap: {
                // ...(arrayItemSchema.keyMap ?? {}),
                ...(concreteArraySchema.keyMap ?? {}),
                [currentValuePath.join(".")]: {
                  rawSchema: effectiveRawSchema,
                  recursivelyUnfoldedUnionSchema: recursivelyUnfoldedUnionSchema,
                  chosenUnionBranchRawSchema: resolveUnionResult.resolvedMlObjectSchema,
                  resolvedSchema,
                  valuePath: currentValuePath,
                  typePath: currentTypePath,
                }, // map the current value path to the resolved schema
              },
            };
          } // end of if (Array.isArray(valueObject))

          const resolveUnionResult = mlUnionResolvedTypeForObject(
            recursivelyUnfoldedUnionSchema.result,
            effectiveRawSchema,
            effectiveRawSchema.discriminator,
            valueObject,
            currentValuePath,
            currentTypePath,
            modelEnvironment,
            relativeReferenceMlContext
          );

          if (resolveUnionResult.status === "error") {
            return {
              status: "error",
              schemaReferenceName,
              error: "mlsTypeCheck failed to resolve union for object",
              rawMlSchemaType: effectiveRawSchema.type,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              innerError: resolveUnionResult,
              value: valueObject,
              rawSchema: effectiveRawSchema,
            };
          }

          const discriminatedSchemaForObject = resolveUnionResult.resolvedMlObjectSchema;
          // log.info(
          //   "mlsTypeCheck union for object at",
          //   currentValuePath.join("."),
          //   "discriminator:",
          //   effectiveRawSchema.discriminator,
          //   "resolveUnionResult:",
          //   resolveUnionResult,
          // );
          const subResolvedSchemas = mlsTypeCheck(
            discriminatedSchemaForObject,
            valueObject,
            currentValuePath,
            [...currentTypePath, "union choice(" + JSON.stringify(resolveUnionResult.chosenDiscriminator) + ")"],
            modelEnvironment,
            relativeReferenceMlContext,
            currentDefaultValue,
            reduxDeploymentsState,
            deploymentUuid,
            rootObject,
            undefined, // schemaReferenceName
          );
          if (subResolvedSchemas.status !== "ok") {
            return {
              status: "error",
              schemaReferenceName,
              error:
                "mlsTypeCheck union failed to match object attribute value with schema attribute",
              rawMlSchemaType: effectiveRawSchema.type,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              innerError: subResolvedSchemas,
              value: valueObject,
              rawSchema: effectiveRawSchema,
            };
          }
          const objectUniondiscriminatorValues =
            subResolvedSchemas.resolvedSchema.type == "object" && effectiveRawSchema.discriminator
              ? getObjectUnionDiscriminatorValuesFromResolvedSchema(
                  currentValuePath.join("."),
                  effectiveRawSchema,
                  recursivelyUnfoldedUnionSchema?.result ?? [],
                  resolveUnionResult.objectUnionChoices,
                  resolveUnionResult
                )
              : [];
          if (objectUniondiscriminatorValues instanceof TransformerFailure) {
            return {
              status: "error",
              schemaReferenceName,
              error:
                "mlsTypeCheck failed to get object union discriminator values: " +
                objectUniondiscriminatorValues.failureMessage,
              rawMlSchemaType: effectiveRawSchema.type,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              value: valueObject,
              rawSchema: effectiveRawSchema,
              innerError: objectUniondiscriminatorValues as any,
            };
          }
          // log.info(
          //   "mlsTypeCheck object at",
          //   currentValuePath.join("."),
          //   "type:",
          //   subResolvedSchemas.resolvedSchema,
          //   // JSON.stringify(subResolvedSchemas.resolvedSchema, null, 2),
          //   "effectiveRawSchema:",
          //   effectiveRawSchema,
          //   "recursivelyUnfoldedUnionSchema:",
          //   recursivelyUnfoldedUnionSchema,
          //   "validates",
          //   valueObject,
          //   "resolveUnionResult:",
          //   resolveUnionResult,
          //   "objectUniondiscriminatorValues:",
          //   objectUniondiscriminatorValues,
          //   // JSON.stringify(valueObject, null, 2)
          // );

          return {
            status: "ok",
            schemaReferenceName,
            valuePath: subResolvedSchemas.valuePath,
            typePath: subResolvedSchemas.typePath,
            rawSchema: effectiveRawSchema,
            resolvedSchema: subResolvedSchemas.resolvedSchema,
            subSchemas: subResolvedSchemas.subSchemas,
            keyMap: {
              ...(subResolvedSchemas.keyMap ?? {}),
              [currentValuePath.join(".")]: {
                ...((subResolvedSchemas.keyMap ?? {})[currentValuePath.join(".")] ?? {}), // useful for unions, where the keyMap is a map of value paths to sub-schemas
                rawSchema: effectiveRawSchema,
                recursivelyUnfoldedUnionSchema: recursivelyUnfoldedUnionSchema,
                chosenUnionBranchRawSchema: discriminatedSchemaForObject,
                resolvedSchema: subResolvedSchemas.resolvedSchema,
                discriminatorValues: objectUniondiscriminatorValues,
                discriminator: recursivelyUnfoldedUnionSchema?.discriminator,
              },
            },
          };
          break;
        }
        case "function":
        case "symbol": // TODO: what does this correspond to?
        case "undefined":
        default: {
          // throw new Error("mlsTypeCheck could not resolve type for union with valueObject " + valueObject);
          return {
            status: "error",
            schemaReferenceName,
            error: "mlsTypeCheck value type not supported for union schema: " + typeof valueObject,
            rawMlSchemaType: effectiveRawSchema.type,
            valuePath: currentValuePath,
            typePath: currentTypePath,
            value: valueObject,
            rawSchema: effectiveRawSchema,
          };
          break;
        }
      }
      break;
    }
    case "record": {
      if (typeof valueObject != "object") {
        // throw new Error(
        //   "mlsTypeCheck record schema " +
        //     JSON.stringify(effectiveSchema) +
        //     " for value " +
        //     JSON.stringify(valueObject)
        // );
        return {
          status: "error",
          error: "mlsTypeCheck record schema for value is not an object",
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resolvedRecordEntries: { [k: string]: ResolvedMlSchemaReturnType } =
        Object.fromEntries(
          Object.entries(valueObject).map((e: [string, any]) => {
            const resultSchemaTmp: ResolvedMlSchemaReturnType = mlsTypeCheck(
              mlRecordElementSchema(effectiveRawSchema.definition),
              e[1],
              [...currentValuePath, e[0]],
              [...currentTypePath, e[0]],
              modelEnvironment,
              relativeReferenceMlContext,
              currentDefaultValue,
              reduxDeploymentsState,
              deploymentUuid,
              rootObject,
              undefined, // schemaReferenceName
            );
            return [e[0], resultSchemaTmp];
          }) as [string, ResolvedMlSchemaReturnType][]
        );
      const foundErrors = Object.entries(resolvedRecordEntries).filter(
        (e: [string, ResolvedMlSchemaReturnType]) => e[1].status == "error"
      );
      if (foundErrors.length > 0) {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: Object.fromEntries(
            foundErrors.map((e: [string, ResolvedMlSchemaReturnType]) => [
              e[0],
              e[1] as ResolvedMlSchemaReturnTypeError,
            ])
          ),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resolvedSchema: MlElement = {
        ...effectiveRawSchema,
        type: "object",
        definition: Object.fromEntries(
          Object.entries(resolvedRecordEntries).map((e) => [
            e[0],
            (e[1] as ResolvedMlSchemaReturnTypeOK).resolvedSchema,
          ])
        ),
      };
      // log.info(
      //   "mlsTypeCheck resolvedRecordEntries",
      //   JSON.stringify(resolvedRecordEntries, null, 2),
      //   Object.entries(resolvedRecordEntries).length,
      // );
      const recordEntrieskeyMap: { [k: string]: KeyMapEntry } = Object.entries(
        resolvedRecordEntries
      ).reduce((acc, [key, value]): {[k: string]: KeyMapEntry} => {
        if (value.status === "ok" && value.keyMap) {
          // all entries have status "ok", per foundErrors.length == 0, this is just a type-safety check
          return value.keyMap !== undefined?{
            ...acc,
            ...value.keyMap,
          }: acc;
        }
        throw new Error(
          `mlsTypeCheck record schema keyMap should only contain "ok" entries,
            but found error for key "${key}": ${value}`
        );
      // }, {} as { [k: string]: { rawSchema: MlElement; resolvedSchema: MlElement } });
      }, {} as { [k: string]: KeyMapEntry });
      // log.info(
      //   "mlsTypeCheck recordEntrieskeyMap",
      //   "done"  );
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema,
        subSchemas: resolvedRecordEntries,
        keyMap: {
          ...recordEntrieskeyMap,
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
    }
    case "literal": {
      if (valueObject == effectiveRawSchema.definition) {
        // log.info(
        //   "mlsTypeCheck literal at path=valueObject." +
        //   currentValuePath.join("."),
        //   ", type:",
        //   JSON.stringify(effectiveSchema, null, 2),
        //   "validates",
        //   JSON.stringify(valueObject, null, 2)
        // );

        return {
          status: "ok",
          schemaReferenceName,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          rawSchema: effectiveRawSchema,
          resolvedSchema: effectiveRawSchema,
          keyMap: {
            [currentValuePath.join(".")]: {
              rawSchema: effectiveRawSchema,
              resolvedSchema: effectiveRawSchema,
              valuePath: currentValuePath,
              typePath: currentTypePath,
            }, // map the current value path to the resolved schema
          },
        };
      } else {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      break;
    }
    case "enum": {
      // log.info(
      //   "mlsTypeCheck enum at path=valueObject." +
      //   currentValuePath.join("."),
      //   ", type:",
      //   JSON.stringify(effectiveSchema, null, 2),
      //   "validates",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: effectiveRawSchema,
        keyMap: {
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema: effectiveRawSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
    }
    case "tuple": {
      if (!Array.isArray(valueObject)) {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      // return {
      //   status: "error",
      //   valuePath: currentValuePath,
      //   typePath: currentTypePath,
      //   error: "mlsTypeCheck can not handle tuple schema " +
      //   JSON.stringify(effectiveSchema) +
      //   " for value " +
      //   JSON.stringify(valueObject)
      // }
      const resolvedInnerSchemas: ResolvedMlSchemaReturnType[] = effectiveRawSchema.definition.map(
        (e: MlElement, index: number) => {
          const resultSchemaTmp = mlsTypeCheck(
            e,
            valueObject[index],
            [...currentValuePath, index],
            [...currentTypePath, index],
            modelEnvironment,
            relativeReferenceMlContext,
            currentDefaultValue,
            reduxDeploymentsState,
            deploymentUuid,
            rootObject,
            undefined, // schemaReferenceName
          );
          return resultSchemaTmp;
        }
      );
      const foundErrors = resolvedInnerSchemas.filter(
        (e: ResolvedMlSchemaReturnType) => e.status == "error"
      );
      if (foundErrors.length > 0) {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: Object.fromEntries(
            // foundErrors.map((e: ResolvedMlSchemaReturnTypeError) => [
            foundErrors.map((e: any) => [
              e.valuePath && e.valuePath.length > 0 ? e.valuePath.join(".") : "" ,
              e as any,
            ] as any) as any // TODO: CHECK TYPES
          ),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resolvedSchema: MlElement = {
        ...effectiveRawSchema,
        type: "tuple",
        definition: resolvedInnerSchemas.map(
          (e) => (e as ResolvedMlSchemaReturnTypeOK).resolvedSchema
        ),
      };
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema,
        subSchemas: resolvedInnerSchemas,
        keyMap: {
          ...resolvedInnerSchemas.reduce((acc, e, index) => {
            if (e.status === "ok") {
              return {
                ...acc,
                ...e.keyMap, // merge the keyMap of the resolved schema
              };
            }
            throw new Error(
              `mlsTypeCheck tuple schema keyMap should only contain "ok" entries, but found error for index ${index}: ${e.error}`
            );
          // }, {} as { [k: string]: { rawSchema: MlElement; resolvedSchema: MlElement } }),
          }, {} as { [k: string]: KeyMapEntry }),
          [currentValuePath.join(".")]: {
            // ...((resolvedInnerSchemas.length > 0 && resolvedInnerSchemas[0].status == "ok"
            //   ? resolvedInnerSchemas[0].keyMap ?? {}
            //   : {})[currentValuePath.join(".")] ?? {}), // useful for unions, where the keyMap is a map of value paths to sub-schemas
            rawSchema: effectiveRawSchema,
            resolvedSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
      break;
    }
    case "array": {
      if (!Array.isArray(valueObject)) {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }

      // log.info(
      //   "mlsTypeCheck called resolveMlSchemaReferenceInContext for array found innerSchema",
      //   JSON.stringify(innerSchema, null, 2)
      // );

      const subSchemas: ResolvedMlSchemaReturnType[] = valueObject.map(
        (e: any, index: number) => {
          const subSchema = mlsTypeCheck(
            effectiveRawSchema.definition,
            e,
            [...currentValuePath, index],
            [...currentTypePath, index],
            modelEnvironment,
            relativeReferenceMlContext,
            currentDefaultValue,
            reduxDeploymentsState,
            deploymentUuid,
            rootObject,
            undefined, // schemaReferenceName
          );
          return subSchema;
        }
      );
      const foundErrors: ResolvedMlSchemaReturnTypeError[] = subSchemas.filter(
        (e: ResolvedMlSchemaReturnType) => e.status == "error"
      ) as any;

      if (foundErrors.length > 0) {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: Object.fromEntries(
            foundErrors.map((e: ResolvedMlSchemaReturnTypeError) => [
              e.valuePath && e.valuePath.length > 0 ? e.valuePath.join(".") : "",
              e,
            ])
          ),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resolvedSchema: MlElement = {
        ...effectiveRawSchema,
        type: "tuple",
        definition: subSchemas.map((s) => (s as ResolvedMlSchemaReturnTypeOK).resolvedSchema), // TODO: this is a shortcut assuming that all items in the array are of the same type, which is not always true
      };
      // log.info(
      //   "mlsTypeCheck resolvedSchema for array",
      //   JSON.stringify(subSchemas, null, 2),
      // );
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema,
        subSchemas,
        keyMap: {
          ...subSchemas.reduce((acc, e, index) => {
            if (e.status === "ok") {
              return {
                ...acc,
                ...e.keyMap, // merge the keyMap of the resolved schema
              };
            }
            return acc;
          // }, {} as { [k: string]: { rawSchema: MlElement; resolvedSchema: MlElement } }),
          }, {} as { [k: string]: KeyMapEntry }),
          [currentValuePath.join(".")]: {
            ...((subSchemas.length > 0 && subSchemas[0].status == "ok"
              ? subSchemas[0].keyMap ?? {}
              : {})[currentValuePath.join(".")] ?? {}), // useful for unions, where the keyMap is a map of value paths to sub-schemas
            rawSchema: effectiveRawSchema,
            resolvedSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          },
        },
      };
      break;
    }
    // plain Attributes
    case "any": {
      const resolvedSchema = valueToJzod(valueObject) as MlElement;
      const anySubnodeKeyMap: Record<string, KeyMapEntry> =
        typeof valueObject === "object" && valueObject !== null && !Array.isArray(valueObject)
          ? buildAnySubnodeKeyMap(valueObject, currentValuePath, currentTypePath)
          : {};
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema,
        keyMap: {
          ...anySubnodeKeyMap,
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
    }
    case "uuid": {
      // log.info("mlsTypeCheck uuid at path=valueObject." + currentValue
      if (typeof valueObject != "string" || !isValidUUID(valueObject)) {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: effectiveRawSchema,
        keyMap: {
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema: effectiveRawSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
        // resolvedSchema: { ...effectiveSchema, type: "string" }, // TODO: this is a shortcut assuming that all items in the array are of the same type, which is not always true
      };
      break;
    }
    case "string": {
      if (typeof valueObject != "string") {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: effectiveRawSchema,
        keyMap: {
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema: effectiveRawSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
    }
    case "number": {
      if (typeof valueObject != "number") {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: effectiveRawSchema,
        keyMap: {
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema: effectiveRawSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
    }
    case "bigint": {
      if (typeof valueObject != "bigint") {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: effectiveRawSchema,
        keyMap: {
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema: effectiveRawSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
    }
    case "boolean": {
      if (typeof valueObject != "boolean") {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: effectiveRawSchema,
        keyMap: {
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema: effectiveRawSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
    }
    case "date": {
      try {
        // Handle Date instances, strings, numbers (timestamps), and objects (serialized Dates)
        let isValidDate = false;
        
        if (valueObject instanceof Date) {
          isValidDate = !isNaN(valueObject.getTime());
        } else if (typeof valueObject === 'string' || typeof valueObject === 'number') {
          const dateTest = new Date(valueObject);
          isValidDate = dateTest.toString() !== "Invalid Date" && !isNaN(dateTest.getTime());
        } else if (typeof valueObject === 'object' && valueObject !== null) {
          // Handle serialized Date objects (plain objects from JSON or formik)
          // Try to convert to Date and check if valid
          const dateTest = new Date(valueObject);
          isValidDate = dateTest.toString() !== "Invalid Date" && !isNaN(dateTest.getTime());
        }
        
        if (isValidDate) {
          return {
            status: "ok",
            schemaReferenceName,
            valuePath: currentValuePath,
            typePath: currentTypePath,
            rawSchema: effectiveRawSchema,
            resolvedSchema: effectiveRawSchema,
            keyMap: {
              [currentValuePath.join(".")]: {
                rawSchema: effectiveRawSchema,
                resolvedSchema: effectiveRawSchema,
                valuePath: currentValuePath,
                typePath: currentTypePath,
              }, // map the current value path to the resolved schema
            },
          };
        } else {
          return {
            status: "error",
            error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema. ${typeof valueObject} could not be converted to Date. Value: ${JSON.stringify(valueObject)}`,
            schemaReferenceName,
            rawMlSchemaType: effectiveRawSchema.type,
            valuePath: currentValuePath,
            typePath: currentTypePath,
            value: JSON.stringify(valueObject),
            rawSchema: effectiveRawSchema,
          };
        }
      } catch (e) {
        return {
          status: "error",
          error: `mlsTypeCheck failed to match value with ${effectiveRawSchema.type} schema: ` + e,
          schemaReferenceName,
          rawMlSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
    }
    case "undefined":
    case "never":
    case "unknown":
    case "void":
    // other schema types
    case "intersection":
    case "promise":
    case "set":
    case "function":
   
    case "map":
    // case "simpleType":
    case "lazy": {
      return {
        status: "ok",
        schemaReferenceName,
        valuePath: currentValuePath,
        typePath: [],
        rawSchema: effectiveRawSchema,
        resolvedSchema: effectiveRawSchema,
        keyMap: {
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema: effectiveRawSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
            // resolvedSchema: valueToJzod(valueObject) as MlElement
          }, // map the current value path to the resolved schema
        },
      };
    }
    default: {
      // throw new Error(
      //   "mlsTypeCheck could not resolve schemaReferences for valueObject " +
      //     JSON.stringify(valueObject, undefined, 2) +
      //     " and schema " +
      //     JSON.stringify(effectiveSchema)
      // );
      return {
        status: "error",
        error: `mlsTypeCheck failed to match value with undefined schema type`,
        schemaReferenceName,
        rawMlSchemaType: "not supported",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        value: valueObject,
        rawSchema: effectiveRawSchema,
      };
      break;
    }
  }

}

// ################################################################################################
// Transformer function for mlsTypeCheck
export function mlsTypeCheckTransformer<T extends MiroirModelEnvironment>(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  // transformer: any,
  transformer: TransformerForBuildPlusRuntime_mlsTypeCheck,
  resolveBuildTransformersTo: any,
  // queryParams: Record<string, any>,
  queryParams: T,
  contextResults?: Record<string, any>,
): ResolvedMlSchemaReturnType {
  const {
    mlSchema,
    valueObject,
    currentValuePath = [],
    currentTypePath = [],
    // miroirFundamentalMlSchema,
    // currentModel,
    // miroirMetaModel,
    relativeReferenceMlContext = {},
    currentDefaultValue,
    reduxDeploymentsState,
    deploymentUuid,
    rootObject
  } = transformer;

  return mlsTypeCheck(
    mlSchema,
    valueObject,
    currentValuePath,
    currentTypePath,
    defaultMiroirModelEnvironment, // TODO: use proper model environment
    relativeReferenceMlContext,
    currentDefaultValue,
    reduxDeploymentsState,
    deploymentUuid,
    rootObject,
    undefined, // schemaReferenceName
  );
}

// ################################################################################################


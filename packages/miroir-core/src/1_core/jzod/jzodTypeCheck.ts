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
  MetaModel,
  type ResolvedJzodSchemaReturnTypeOK,
  type ResolvedJzodSchemaReturnType,
  type ResolvedJzodSchemaReturnTypeError,
  KeyMapEntry,
  type JzodRecord,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";
import {
  jzodUnion_recursivelyUnfold,
} from "./jzodUnion_RecursivelyUnfold";

import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import { jzodObjectFlatten } from "./jzodObjectFlatten";
import { getObjectUniondiscriminatorValuesFromResolvedSchema } from "./getObjectUniondiscriminatorValuesFromResolvedSchema";
import { resolveConditionalSchema, type ResolveConditionalSchemaError } from "./resolveConditionalSchema";
import { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
import { ReduxDeploymentsState } from "../../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { Step } from "../../2_domain/Transformers";
import type {
  SelectUnionBranchFromDiscriminatorReturnType,
  SelectUnionBranchFromDiscriminatorReturnTypeError,
  JzodUnionResolvedTypeForArrayReturnTypeOK,
  JzodUnionResolvedTypeReturnTypeError,
  JzodUnionResolvedTypeForObjectReturnTypeOK,
} from "../../0_interfaces/1_core/jzodTypeCheckInterface";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";

// export const miroirFundamentalJzodSchema2 = miroirFundamentalJzodSchema;
// import { miroirFundamentalJzodSchema } from "../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodTypeCheck"),
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
// to be replaced by jzodObjectFlatten?
export function resolveObjectExtendClauseAndDefinition<T extends MiroirModelEnvironment>(
  jzodObject: JzodObject,
  modelEnvironment: T,
  // miroirFundamentalJzodSchema: JzodSchema,
  // currentModel?: MetaModel,
  // miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): JzodObject {
  // if (j.type == "object") {
    if (jzodObject.extend) {
      // const extension = resolveJzodSchemaReferenceInContext(
      const extension:JzodElement = resolveJzodSchemaReferenceInContext(
        jzodObject.extend,
        relativeReferenceJzodContext,
        modelEnvironment,
        // miroirFundamentalJzodSchema,
        // currentModel,
        // miroirMetaModel,
      )
      const resolvedDefinition = Object.fromEntries(
        Object.entries(jzodObject.definition).filter(
          (e:[string, JzodElement]) => e[1].type == "schemaReference"
        ).map(
          (e) => [e[0], resolveJzodSchemaReferenceInContext(
            e[1] as JzodReference,
            relativeReferenceJzodContext,
            modelEnvironment,
            // miroirFundamentalJzodSchema,
            // currentModel,
            // miroirMetaModel,
          )]
        )
      );
      if (extension.type == "object") {
        return {
          type: "object",
          definition: {
            ...extension.definition,
            ...jzodObject.definition,
            ...resolvedDefinition
          }
        }
      } else {
        throw new Error(
          "resolveObjectExtendClauseAndDefinition object extend clause schema " +
            JSON.stringify(jzodObject) +
            " is not an object " +
            JSON.stringify(extension)
        );
        // return ({
        //   status: "error",
        //   error: "jzodTypeCheck object extend clause schema " +
        //       JSON.stringify(jzodSchema) +
        //       " is not an object " +
        //       JSON.stringify(extension)
        // })
      }
    } else {
      return jzodObject
    }
  // } else {
  //   return j;
  // }
}

// ################################################################################################
function isValidUUID(uuid: string): boolean {
  // Regular expression to validate UUID v4 format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ################################################################################################
/**
 * returns an array of JzodObject schemas by recursively unrolling the unions and references in @param concreteUnrolledJzodSchemas.
 * TODO: WHAT ABOUT RECORD SCHEMAS?
 * @param concreteUnrolledJzodSchemas 
 * @param miroirFundamentalJzodSchema 
 * @param currentModel 
 * @param miroirMetaModel 
 * @param relativeReferenceJzodContext 
 * @returns 
 */
export function unionObjectChoices<T extends MiroirModelEnvironment> (
  concreteUnrolledJzodSchemas: JzodElement[],
  modelEnvironment: T,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
): (JzodObject | JzodRecord)[] {
  return (
    concreteUnrolledJzodSchemas.filter((j) => j.type == "record") as (JzodObject | JzodRecord)[]
  ).concat(
    (concreteUnrolledJzodSchemas.filter((j) => j.type == "object") as JzodObject[]).map(
      (k: JzodObject): JzodObject =>
        jzodObjectFlatten(k, modelEnvironment, relativeReferenceJzodContext)
    ) as JzodObject[],
    (
      concreteUnrolledJzodSchemas.filter(
        (j: JzodElement): boolean => j.type == "union"
      ) as JzodUnion[]
    ).flatMap(
      // for sub-unions, return the sub-objects clauses, with their extend clauses resolved
      (j: JzodUnion): JzodObject[] =>
        (j.definition.filter((k: JzodElement) => k.type == "object") as JzodObject[]).map(
          (k: JzodObject): JzodObject =>
            jzodObjectFlatten(k, modelEnvironment, relativeReferenceJzodContext)
        ) as JzodObject[]
    ),
    (
      concreteUnrolledJzodSchemas.filter((j: JzodElement) => j.type == "union") as JzodUnion[]
    ).flatMap(
      // if schemaReferences are found, we resolve them, squashing the extend clause for objects
      (j: JzodUnion) =>
        (
          (j.definition.filter((k: JzodElement) => k.type == "schemaReference") as JzodReference[])
            .map((k: JzodReference) =>
              resolveJzodSchemaReferenceInContext(
                k,
                { ...relativeReferenceJzodContext, ...k.context },
                modelEnvironment
              )
            )
            .filter((j) => j.type == "object") as JzodObject[]
        ).map(
          (k: JzodObject): JzodObject =>
            jzodObjectFlatten(k, modelEnvironment, relativeReferenceJzodContext)
        ) as JzodObject[]
    )
  );
}
;

// ################################################################################################
/**
 * returns an array of JzodArray and JzodTuple schemas by recursively unrolling the unions and references in @param concreteUnrolledJzodSchemas.
 * @param concreteUnrolledJzodSchemas 
 * @param miroirFundamentalJzodSchema 
 * @param currentModel 
 * @param miroirMetaModel 
 * @param relativeReferenceJzodContext 
 * @returns 
 */
export function unionArrayChoices<T extends MiroirModelEnvironment> (
  concreteUnrolledJzodSchemas: JzodElement[],
  modelEnvironment: T,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
): (JzodArray | JzodTuple)[] {
  return (
    concreteUnrolledJzodSchemas.filter(
      (j: JzodElement) => j.type == "array" || j.type == "tuple"
    ) as (JzodArray | JzodTuple)[]
  ).concat(
    (
      concreteUnrolledJzodSchemas.filter(
        (j: JzodElement): boolean => j.type == "union"
      ) as JzodUnion[]
    ).flatMap(
      // for sub-unions, return the sub-objects clauses, with their extend clauses resolved
      (j: JzodUnion): (JzodArray | JzodTuple)[] =>
        j.definition.filter((k: JzodElement) => k.type == "array" || k.type == "tuple") as (
          | JzodArray
          | JzodTuple
        )[]
    ),
    (
      concreteUnrolledJzodSchemas.filter((j: JzodElement) => j.type == "union") as JzodUnion[]
    ).flatMap(
      // if schemaReferences are found, we resolve them, squashing the extend clause for objects
      (j: JzodUnion) =>
        (j.definition.filter((k: JzodElement) => k.type == "schemaReference") as JzodReference[])
          .map((k: JzodReference) =>
            resolveJzodSchemaReferenceInContext(
              k,
              { ...relativeReferenceJzodContext, ...k.context },
              modelEnvironment,
            )
          )
          .filter((j) => j.type == "array" || j.type == "tuple") as (JzodArray | JzodTuple)[]
    ) as (JzodArray | JzodTuple)[]
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
  objectUnionChoices: JzodObject[],
  discriminator: string | string[] | undefined,
  valueObject: Record<string,any>,
  valueObjectPath: (string | number)[],
  typePath: (string | number)[], // for logging purposes only
  modelEnvironment: T,
  relativeReferenceJzodContext: {[k:string]: JzodElement},
): SelectUnionBranchFromDiscriminatorReturnType {
  // const discriminators: string | string[] | undefined = !discriminator
  if (!discriminator) {
    return {
      status: "error",
      error: "selectUnionBranchFromDiscriminator called for union-type value object without discriminator",
      discriminator,
      valuePath: valueObjectPath,
      typePath,
      value: valueObject,
      objectUnionChoices,
    };
  }
  const discriminators: string[]  = Array.isArray(discriminator)
    ? discriminator
    : [discriminator];

  // TODO: remove, object union choices should already be flattened in unionObjectChoices
  // WHY CAN objectUnionChoices NOT be flattened already?
  // "flatten" object hierarchy, if there is an extend clause, we resolve it
  const flatteningResults = objectUnionChoices.map(
    (jzodObjectSchema) => {
      let extendedJzodSchema: JzodObject
      if (jzodObjectSchema.extend) {
        const extension = resolveJzodSchemaReferenceInContext(
          jzodObjectSchema.extend,
          relativeReferenceJzodContext,
          modelEnvironment,
        )
        if (extension.type == "object") {
          extendedJzodSchema = {
            type: "object",
            definition: {
              ...extension.definition,
              ...jzodObjectSchema.definition
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
        extendedJzodSchema = jzodObjectSchema
      }
      return { status: "ok" as const, result: extendedJzodSchema };
    }
  );

  // Check if any errors occurred during flattening
  const flatteningErrors = flatteningResults.filter(r => r.status === "error");
  if (flatteningErrors.length > 0) {
    return flatteningErrors[0] as SelectUnionBranchFromDiscriminatorReturnTypeError;
  }

  const discriminatorValues = discriminators.map((d) => valueObject[d]);

  // Extract successful results
  const flattenedUnionChoices:JzodObject[] = flatteningResults.map(r => (r as any).result) as JzodObject[];
  // log.info(
  //   "selectUnionBranchFromDiscriminator called",
  //   "valueObjectPath",
  //   valueObjectPath.join("."),
  //   "discriminator(s)=",
  //   discriminators,
  //   "discriminatorValues",
  //   discriminatorValues,
  //   "valueObject=",
  //   valueObject,
  //   "valueObject[discriminator]=",
  //   discriminators??[].map(d => valueObject[d]),
  //   "relativeReferenceJzodContext=",
  //   // JSON.stringify(relativeReferenceJzodContext, null, 2),
  //   relativeReferenceJzodContext,
  //   "flattenedUnionChoices=",
  //   // JSON.stringify(flattenedUnionChoices, null, 2),
  //   flattenedUnionChoices
  //   // JSON.stringify(objectUnionChoices.map((e:any) => [e?.definition['transformerType'], e?.definition ]), null, 2),
  // );

  let i = 0;
  let chosenDiscriminator = [];
  let filteredFlattenedUnionChoices: JzodObject[] = flattenedUnionChoices;
  let possibleDiscriminators: (string | undefined)[][] = [];
  if (!discriminators || discriminators.length == 0) {
    // no discriminator, proceed by eliminating all choices that do not match the valueObject
    filteredFlattenedUnionChoices = flattenedUnionChoices.filter((objectChoice: JzodObject) => {
      const objectChoiceKeys = Object.keys(objectChoice.definition);
      return Object.keys(valueObject).every(
        (valueObjectKey) =>
          objectChoiceKeys.includes(valueObjectKey) && // TODO: is there a problem? objectChoice as any smells bad! are all the cases covered?
          ((objectChoice as any).definition[valueObjectKey]?.type != "literal" ||
            (objectChoice as any).definition[valueObjectKey]?.definition == valueObject[valueObjectKey])
      );
    });
  } else {
    const hasDiscriminatorValues = discriminators.some(d => valueObject[d] !== undefined);
    if (!hasDiscriminatorValues) {
      const choiceWithNoDiscriminator: JzodObject[] = flattenedUnionChoices.filter(
        (objectChoice: any) => // TODO: typing!
          Object.keys(objectChoice.definition).every(
            (key) => objectChoice.definition[key]?.type != "literal" ||
              objectChoice.definition[key]?.definition == valueObject[key]
          )
      );
      if (choiceWithNoDiscriminator.length === 1) {
        return {
          status: "ok",
          currentDiscriminatedObjectJzodSchema: filteredFlattenedUnionChoices[0],
          flattenedUnionChoices: filteredFlattenedUnionChoices,
          chosenDiscriminator: [],
        };
      } else {
        return {
          status: "error",
          error: "selectUnionBranchFromDiscriminator: no discriminator values found in valueObject and multiple choices exist",
          discriminator,
          valuePath: valueObjectPath,
          typePath,
          value: valueObject,
          objectUnionChoices,
          flattenedUnionChoices: choiceWithNoDiscriminator,
        };
      }
    }
    possibleDiscriminators = flattenedUnionChoices.map((objectChoice) => {
      const objectChoiceKeys = Object.keys(objectChoice.definition);
      return discriminators.map(
        (discriminator) =>
          objectChoiceKeys.includes(discriminator) &&
          (objectChoice as any).definition[discriminator]?.type == "literal"
            ? (objectChoice as any).definition[discriminator]?.definition
            :(objectChoice as any).definition[discriminator]?.type == "enum"
            ? (objectChoice as any).definition[discriminator]?.definition
            : undefined
        // : "NO VALUE FOR DISCRIMINATOR " + discriminator
      );
    });
    // const valueObjectPathString = valueObjectPath.join(".")
    while (i < discriminators.length && filteredFlattenedUnionChoices.length > 1) {
      const disc = discriminators[i];
      const newfilteredFlattenedUnionChoices = filteredFlattenedUnionChoices.filter(
        (a) =>{
          return (
            a.type == "object" &&
            a.definition[disc]?.type == "literal" &&
            (a.definition[disc] as JzodLiteral).definition == valueObject[disc]
          ) ||
          (
            a.type == "object" &&
            a.definition[disc]?.type == "enum" &&
            (a.definition[disc] as JzodEnum).definition.includes(valueObject[disc])
          )
        }
      );
      chosenDiscriminator.push({discriminator: disc, value: valueObject[disc]});
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
  const currentDiscriminatedObjectJzodSchema: JzodObject =
    filteredFlattenedUnionChoices[0] as JzodObject;
  return {
    status: "ok",
    currentDiscriminatedObjectJzodSchema,
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
export function jzodUnionResolvedTypeForArray<T extends MiroirModelEnvironment>(
  concreteUnrolledJzodSchemas: JzodElement[],
  discriminator: string | string[] | undefined,
  valueArray: any[],
  currentValuePath: (string | number)[],
  currentTypePath: (string | number)[],
  modelEnvironment: T,
  // miroirFundamentalJzodSchema: JzodSchema,
  // currentModel: MetaModel,
  // miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
): JzodUnionResolvedTypeForArrayReturnTypeOK
  | JzodUnionResolvedTypeReturnTypeError
 {
  /**
   * ALLOWING ONLY ONE MATCHING UNION BRANCH FOR THE ARRAY
   */
  // log.info("jzodUnionResolvedTypeForArray called for valueArray=", valueArray, "discriminator=", discriminator);
  const arrayUnionChoices = unionArrayChoices(
    concreteUnrolledJzodSchemas,
    modelEnvironment,
    // miroirFundamentalJzodSchema,
    // currentModel,
    // miroirMetaModel,
    relativeReferenceJzodContext
  );
  if (arrayUnionChoices.length == 1) {
    return {
      status: "ok",
      resolvedJzodObjectSchema: arrayUnionChoices[0],
      arrayUnionChoices: arrayUnionChoices,
    };
  }
  if (!arrayUnionChoices || arrayUnionChoices.length == 0) {
    return {
      status: "error",
      error: "jzodUnionResolvedTypeForArray could not find object type for given array value in resolved union",
      discriminator,
      valuePath: currentValuePath,
      typePath: currentTypePath,
      value: valueArray,
      concreteUnrolledJzodSchemas,
      unionChoices: arrayUnionChoices,
    };
  }
  return {
    status: "error",
    error: "jzodUnionResolvedTypeForArray called for union-type value array with discriminator(s)=" +
      JSON.stringify(discriminator) + " found " + arrayUnionChoices.length + " matches.",
    discriminator,
    valuePath: currentValuePath,
    typePath: currentTypePath,
    value: valueArray,
    concreteUnrolledJzodSchemas,
    unionChoices: arrayUnionChoices,
  };
} // end of jzodUnionResolvedTypeForArray

// ################################################################################################
export function jzodUnionResolvedTypeForObject<T extends MiroirModelEnvironment>(
  concreteUnrolledJzodSchemas: JzodElement[],
  discriminator: string | string[] | undefined,
  valueObject: Record<string, any>,
  currentValuePath: (string | number)[],
  currentTypePath: (string | number)[],
  modelEnvironment: T,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
): JzodUnionResolvedTypeForObjectReturnTypeOK
  | JzodUnionResolvedTypeReturnTypeError
 {
  const objectUnionChoices: JzodObject[] = unionObjectChoices(
    concreteUnrolledJzodSchemas,
    modelEnvironment,
    relativeReferenceJzodContext
  ) as any;
  // log.info(
  //   "jzodUnionResolvedTypeForObject called for",
  //   "valuePath=" + currentValuePath.join("."),
  //   "valueObject=",
  //   valueObject,
  //   "discriminator=",
  //   discriminator,
  //   "concreteUnrolledJzodSchemas",
  //   concreteUnrolledJzodSchemas,
  //   "objectUnionChoices",
  //   objectUnionChoices,
  // );
  
  if (objectUnionChoices.length == 1) {
    return {
      status: "ok",
      resolvedJzodObjectSchema: objectUnionChoices[0],
      objectUnionChoices: objectUnionChoices,
    };
  }
  if (!objectUnionChoices || objectUnionChoices.length == 0) {
    return {
      status: "error",
      error: "jzodUnionResolvedTypeForObject could not find object type for given object value in resolved union",
      discriminator,
      valuePath: currentValuePath,
      typePath: currentTypePath,
      value: valueObject,
      concreteUnrolledJzodSchemas,
      unionChoices: objectUnionChoices,
    };
  }
  const selectUnionResult = selectUnionBranchFromDiscriminator(
    objectUnionChoices,
    discriminator,
    valueObject,
    currentValuePath,
    currentTypePath, // typePath
    modelEnvironment,
    relativeReferenceJzodContext
  );
  
  if (selectUnionResult.status === "error") {
    return {
      status: "error",
      error: "jzodUnionResolvedTypeForObject failed to select union branch",
      discriminator,
      valuePath: currentValuePath,
      typePath: currentTypePath,
      innerError: selectUnionResult,
      value: valueObject,
      concreteUnrolledJzodSchemas,
      unionChoices: objectUnionChoices,
    };
  }

  const {
    currentDiscriminatedObjectJzodSchema,
    flattenedUnionChoices,
    chosenDiscriminator,
    // discriminatorValues,
  } = selectUnionResult;
  return {
    status: "ok",
    resolvedJzodObjectSchema: currentDiscriminatedObjectJzodSchema,
    objectUnionChoices: objectUnionChoices,
    chosenDiscriminator,
  };
} // end of jzodUnionResolvedTypeForObject

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
 * jzodTypeCheck is the main function to check if a valueObject matches a JzodElement schema.
 * It recursively checks the schema and returns a ResolvedJzodSchemaReturnType.
 * 
 * Basically, it removes the unions and references from the JzodElement schema,
 * getting a node-for-node representation of the schema,
 * and checks if the valueObject matches the schema.
 * 
 * @param effectiveSchema - The JzodElement schema to check against.
 * @param valueObject - The value object to check.
 * @param currentValuePath - The current path in the value object.
 * @param currentTypePath - The current path in the type schema.
 * @param miroirFundamentalJzodSchema - The fundamental Jzod schema for reference resolution.
 * @param currentModel - The current model being processed.
 * @param miroirMetaModel - The meta model for the Miroir framework.
 * @param relativeReferenceJzodContext - Context for resolving relative references in Jzod schemas.
 */
export function jzodTypeCheck(
  jzodSchema: JzodElement,
  valueObject: any,
  currentValuePath: (string | number)[],
  currentTypePath: (string | number)[],
  modelEnvironment: MiroirModelEnvironment,
  relativeReferenceJzodContext: {[k:string]: JzodElement},
  // 
  currentDefaultValue?: any,
  reduxDeploymentsState: ReduxDeploymentsState | undefined = undefined,
  deploymentUuid?: string,
  rootObject?: any // Optional parameter for backward compatibility
): ResolvedJzodSchemaReturnType {
  // log.info(
  //   "jzodTypeCheck called for valuePath=." + 
  //   currentValuePath.join("."),
  //   "value",
  //   // // JSON.stringify(valueObject, null, 2),
  //   valueObject,
  //   "jzodSchema",
  //   jzodSchema,
  //   // "schema",
  //   // JSON.stringify(jzodSchema, null, 2)
  // );

  // Check for null and undefined values first
  if (valueObject === null || valueObject === undefined) {
    // Check if the schema is optional or nullable
    const isOptional = jzodSchema.optional === true;
    const isNullable = jzodSchema.nullable === true;
    
    if (!isOptional && !isNullable && jzodSchema.type !== "any" && jzodSchema.type !== "undefined" && jzodSchema.type !== "null") {
      return {
        status: "error",
        error: `jzodTypeCheck expected a value but got ${valueObject === null ? 'null' : 'undefined'} for non-optional schema`,
        rawJzodSchemaType: jzodSchema.type,
        valuePath: currentValuePath,
        typePath: currentTypePath,
        value: valueObject,
        rawSchema: jzodSchema,
      };
    }
    
    // If schema is optional or nullable, we're good
    return {
      status: "ok",
      valuePath: currentValuePath,
      typePath: currentTypePath,
      rawSchema: jzodSchema,
      resolvedSchema: jzodSchema,
    };
  }


  let effectiveSchemaOrError: JzodElement | ResolveConditionalSchemaError =
    currentDefaultValue &&
    currentValuePath &&
    reduxDeploymentsState &&
    deploymentUuid ?
      resolveConditionalSchema(
        "build", // TODO: can typeCheck be used in "runtime"? What does it mean in this context?
        [], // transformerPath
        jzodSchema,
        rootObject || currentDefaultValue, // Use rootObject if provided, fallback to currentDefaultValue
        currentValuePath as string[],
        modelEnvironment,
        {}, // contextResults
        reduxDeploymentsState,
        deploymentUuid,
        'typeCheck' // Specify this is for type checking
      ) : jzodSchema;

  // log.info(
  //   "jzodTypeCheck",
  //   currentValuePath.join("."),
  //   "effectiveSchemaOrError",
  //   effectiveSchemaOrError,
  // );
  if ('error' in effectiveSchemaOrError) {
    return {
      status: "error",
      error: `jzodTypeCheck: resolveConditionalSchema returned error: ${effectiveSchemaOrError.error}`,
      rawJzodSchemaType: jzodSchema.type,
      valuePath: currentValuePath,
      typePath: currentTypePath,
      value: valueObject,
      rawSchema: jzodSchema,
      innerError: {
        status: "error",
        error: `resolveConditionalSchema error: ${effectiveSchemaOrError.error}` + ("details" in effectiveSchemaOrError ? `: ${effectiveSchemaOrError.details}` : ""),
        valuePath: currentValuePath,
        typePath: currentTypePath,
        value: effectiveSchemaOrError, // embed the original error object for debugging
        rawSchema: jzodSchema,
      },
    };
  }
  const effectiveRawSchema: JzodElement = effectiveSchemaOrError;
  
  switch (effectiveRawSchema?.type) {
    case "schemaReference": {
      const newContext = { ...relativeReferenceJzodContext, ...effectiveRawSchema.context };
      const resolvedJzodSchema = resolveJzodSchemaReferenceInContext(
        effectiveRawSchema,
        newContext,
        modelEnvironment
        // miroirFundamentalJzodSchema,
        // currentModel,
        // miroirMetaModel,
      );
      // log.info(
      //   "jzodTypeCheck schemaReference",
      //   "effectiveSchema",
      //   effectiveRawSchema,
      //   "resultJzodSchema",
      //   resolvedJzodSchema,
      //   // JSON.stringify(resolvedJzodSchema, null, 2),
      //   "valueObject",
      //   valueObject,
      //   "newContext",
      //   newContext,
      //   // JSON.stringify(valueObject, null, 2)
      // );
      const typeCheck = jzodTypeCheck(
        resolvedJzodSchema,
        valueObject,
        currentValuePath,
        [...currentTypePath, "ref:" + (effectiveRawSchema.definition.relativePath ?? "NO_RELATIVE_PATH")],
        modelEnvironment,
        newContext,
        currentDefaultValue,
        reduxDeploymentsState,
        deploymentUuid,
        rootObject
      );
      if (typeCheck.status == "error") {
        return {
          status: "error",
          error: "jzodTypeCheck failed to resolve schemaReference",
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: typeCheck,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
        valuePath: typeCheck.valuePath,
        typePath: typeCheck.typePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: typeCheck.resolvedSchema,
        subSchemas: typeCheck.subSchemas, // for unions, this is the list of sub-schemas that were resolved
        keyMap: {
          ...(typeCheck.keyMap ?? {}), // for unions, this is the map of keys to sub-schemas
          [currentValuePath.join(".")]: (typeCheck.keyMap??{})[currentValuePath.join(".")]?{
            ...(typeCheck.keyMap??{})[currentValuePath.join(".")], // useful for unions, where the keyMap is a map of value paths to sub-schemas
            rawSchema: effectiveRawSchema,
            resolvedSchema: typeCheck.resolvedSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }:{
            rawSchema: effectiveRawSchema,
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
          error: "jzodTypeCheck failed for object schema to match non-object value",
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }

      const jzodObjectFlattenedSchema: JzodObject = jzodObjectFlatten(
        effectiveRawSchema,
        modelEnvironment,
        relativeReferenceJzodContext
      );
      // log.info("jzodTypeCheck object extendedJzodSchema",JSON.stringify(extendedJzodSchema, null, 2));

      // checks that all attributes of the valueObject are present in the schema definition
      const resolvedObjectEntries: [string, ResolvedJzodSchemaReturnType][] = Object.entries(
        valueObject
      ).map((e: [string, any]) => {
        if (jzodObjectFlattenedSchema.definition[e[0]]) {
          const resultSchemaTmp = jzodTypeCheck(
            jzodObjectFlattenedSchema.definition[e[0]],
            e[1],
            [...currentValuePath, e[0]],
            [...currentTypePath, e[0]],
            modelEnvironment,
            relativeReferenceJzodContext,
            currentDefaultValue,
            reduxDeploymentsState,
            deploymentUuid,
            rootObject
          );
          return [e[0], resultSchemaTmp];
        } else {
          return [
            e[0],
            {
              status: "error",
              error: "jzodTypeCheck value attribute '" + e[0] + "' not found in schema definition",
              rawJzodSchemaType: effectiveRawSchema.type,
              valuePath: [...currentValuePath, e[0]],
              typePath: currentTypePath,
              value: valueObject,
              rawSchema: effectiveRawSchema,
            },
          ];
        }
      });

      const foundErrors = resolvedObjectEntries.filter(
        (e: [string, ResolvedJzodSchemaReturnType]) => e[1].status == "error"
      );
      if (foundErrors.length > 0) {
        return {
          status: "error",
          error:
            "jzodTypeCheck failed to match some object value attribute(s) with the schema of that attribute(s)",
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          errorOnValueAttributes: foundErrors.map((e) => e[0]),
          innerError: Object.fromEntries(
            foundErrors.map((e: [string, ResolvedJzodSchemaReturnType]) => [
              e[0],
              e[1] as ResolvedJzodSchemaReturnTypeError,
            ])
          ),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      // checks that all mandatory attributes of the schema definition are present in the valueObject
      const missingMandatoryAttributes = Object.entries(
        jzodObjectFlattenedSchema.definition
      ).filter(
        (e: [string, JzodElement]) =>
          e[1].optional !== true &&
          e[1].nullable !== true &&
          !Object.keys(valueObject).includes(e[0])
      );
      if (missingMandatoryAttributes.length > 0) {
        return {
          status: "error",
          error:
            "jzodTypeCheck failed to match some mandatory object value attribute(s) with the schema of that attribute(s)",
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          errorOnSchemaAttributes: missingMandatoryAttributes.map((e) => e[0]),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resultResolvedJzodSchema: JzodObject = {
        ...jzodObjectFlattenedSchema,
        definition: Object.fromEntries(
          resolvedObjectEntries.map((e) => [
            e[0],
            (e[1] as ResolvedJzodSchemaReturnTypeOK).resolvedSchema,
          ])
        ),
      } as JzodObject;
      const objecAttributeskeyMap: { [k: string]: KeyMapEntry } = (resolvedObjectEntries
      .filter((e) => e[1].status === "ok")  as [string, ResolvedJzodSchemaReturnTypeOK][])
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
          //   `jzodTypeCheck object schema keyMap should only contain "ok" entries, but found error for key "${key}": ${value.error}`
          // );
        },
        // {} as { [k: string]: { rawSchema: JzodElement; resolvedSchema: JzodElement } }
        {} as { [k: string]: KeyMapEntry }
      );

      return {
        status: "ok",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: resultResolvedJzodSchema,
        subSchemas: Object.fromEntries(resolvedObjectEntries),
        keyMap: {
          ...objecAttributeskeyMap,
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            resolvedSchema: resultResolvedJzodSchema,
            jzodObjectFlattenedSchema: jzodObjectFlattenedSchema,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
      break;
    }
    case "union": {
      const recursivelyUnfoldedUnionSchema = jzodUnion_recursivelyUnfold(
        effectiveRawSchema as JzodUnion,
        new Set(),
        modelEnvironment,
        relativeReferenceJzodContext
      );

      if (recursivelyUnfoldedUnionSchema.status == "error") {
        // log.error(
        //   "jzodTypeCheck union schema",
        //   JSON.stringify(effectiveSchema, null, 2),
        //   "could not be unfolded, error:",
        //   unfoldedJzodSchema.error
        // );
        return {
          status: "error",
          error: "jzodTypeCheck failed to recursively unfold schema",
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: recursivelyUnfoldedUnionSchema,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      // const concreteUnfoldedJzodSchemas: JzodElement[] = recursivelyUnfoldedUnionSchema.result;

      // log.info(
      //   "jzodTypeCheck called for union",
      //   effectiveSchema,
      //   "concreteUnrolledJzodSchemas resolved type:",
      //   // JSON.stringify(concreteUnfoldedJzodSchemas, null, 2)
      //   concreteUnfoldedJzodSchemas
      // );
      switch (typeof valueObject) {
        case "number":
        case "bigint":
        case "boolean": {
          // why is selectUnionBranchFromDiscriminator not used here? This is really similar to it.
          const resultJzodSchema = recursivelyUnfoldedUnionSchema.result.find(
            (a) => a.type == typeof valueObject
          );
          if (resultJzodSchema) {
            // log.info(
            //   "jzodTypeCheck object at",
            //   currentValuePath.join("."),
            //   "type:",
            //   JSON.stringify(resultJzodSchema, null, 2),
            //   "validates",
            //   JSON.stringify(
            //     valueObject,
            //     (key, value) =>typeof value === "bigint" ? value.toString() : value,
            //     2
            //   )
            // );
            return {
              status: "ok",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              rawSchema: effectiveRawSchema,
              resolvedSchema: resultJzodSchema,
              keyMap: {
                [currentValuePath.join(".")]: {
                  rawSchema: effectiveRawSchema,
                  recursivelyUnfoldedUnionSchema: recursivelyUnfoldedUnionSchema,
                  resolvedSchema: resultJzodSchema,
                  chosenUnionBranchRawSchema: resultJzodSchema,
                  valuePath: currentValuePath,
                  typePath: currentTypePath,
                }, // map the current value path to the resolved schema
              },
            };
          } else {
            return {
              status: "error",
              error: "jzodTypeCheck could not find type for value in resolved union",
              rawJzodSchemaType: effectiveRawSchema.type,
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
          const resultJzodSchema = recursivelyUnfoldedUnionSchema.result.find(
            (a) => a.type == "string" || (a.type == "literal" && a.definition == valueObject)
          );
          if (resultJzodSchema) {
            // log.info(
            //   "jzodTypeCheck union for string at",
            //   currentValuePath.join("."),
            //   "type:",
            //   JSON.stringify(resultJzodSchema, null, 2),
            //   "validates",
            //   JSON.stringify(valueObject, null, 2)
            // );
            return {
              status: "ok",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              rawSchema: effectiveRawSchema,
              resolvedSchema: resultJzodSchema,
              keyMap: {
                [currentValuePath.join(".")]: {
                  rawSchema: effectiveRawSchema,
                  recursivelyUnfoldedUnionSchema: recursivelyUnfoldedUnionSchema,
                  resolvedSchema: resultJzodSchema,
                  chosenUnionBranchRawSchema: resultJzodSchema,
                  valuePath: currentValuePath,
                  typePath: currentTypePath,
                }, // map the current value path to the resolved schema
              },
            };
          } else {
            return {
              status: "error",
              error: "jzodTypeCheck could not find type for value in resolved union",
              rawJzodSchemaType: effectiveRawSchema.type,
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
            //   "jzodTypeCheck union for array at",
            //   currentValuePath.join("."),
            //   "type:",
            //   JSON.stringify(effectiveSchema, null, 2),
            //   "validates",
            //   JSON.stringify(valueObject, null, 2)
            // );
            const resolveUnionResult = jzodUnionResolvedTypeForArray(
              recursivelyUnfoldedUnionSchema.result,
              effectiveRawSchema.discriminator,
              valueObject,
              currentValuePath,
              currentTypePath,
              modelEnvironment,
              relativeReferenceJzodContext
            );
            if (resolveUnionResult.status === "error") {
              return {
                status: "error",
                error: "jzodTypeCheck failed to resolve union for array",
                rawJzodSchemaType: effectiveRawSchema.type,
                valuePath: currentValuePath,
                typePath: currentTypePath,
                innerError: resolveUnionResult,
                value: valueObject,
                rawSchema: effectiveRawSchema,
              };
            }
            if (resolveUnionResult.resolvedJzodObjectSchema.type != "array") {
              return {
                status: "error",
                error: "jzodTypeCheck resolved union for array did not yield an array schema",
                rawJzodSchemaType: effectiveRawSchema.type,
                valuePath: currentValuePath,
                typePath: currentTypePath,
                value: valueObject,
                rawSchema: effectiveRawSchema,
              };
            }
            // TODO: schema of different items may vary!
            const arrayItemSchema = jzodTypeCheck(
              resolveUnionResult.resolvedJzodObjectSchema.definition,
              valueObject[0], // we take the first element of the array to determine the type
              currentValuePath,
              [...currentTypePath, "0"],
              modelEnvironment,
              relativeReferenceJzodContext,
              currentDefaultValue,
              reduxDeploymentsState,
              deploymentUuid,
              rootObject
            );
            if (arrayItemSchema.status === "error") {
              return {
                status: "error",
                error: "jzodTypeCheck failed to match array item with schema",
                rawJzodSchemaType: effectiveRawSchema.type,
                valuePath: currentValuePath,
                typePath: currentTypePath,
                innerError: arrayItemSchema,
                value: valueObject,
                rawSchema: effectiveRawSchema,
              };
            }
            const resolvedSchema: JzodElement = {
              ...effectiveRawSchema,
              type: "array",
              definition: arrayItemSchema.resolvedSchema,
            };

            return {
              status: "ok",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              rawSchema: effectiveRawSchema,
              resolvedSchema,
              keyMap: {
                ...(arrayItemSchema.keyMap ?? {}),
                [currentValuePath.join(".")]: {
                  rawSchema: effectiveRawSchema,
                  recursivelyUnfoldedUnionSchema: recursivelyUnfoldedUnionSchema,
                  chosenUnionBranchRawSchema: resolveUnionResult.resolvedJzodObjectSchema,
                  resolvedSchema,
                  valuePath: currentValuePath,
                  typePath: currentTypePath,
                }, // map the current value path to the resolved schema
              },
            };
          } // end of if (Array.isArray(valueObject))

          const resolveUnionResult = jzodUnionResolvedTypeForObject(
            recursivelyUnfoldedUnionSchema.result,
            effectiveRawSchema.discriminator,
            valueObject,
            currentValuePath,
            currentTypePath,
            modelEnvironment,
            relativeReferenceJzodContext
          );

          if (resolveUnionResult.status === "error") {
            return {
              status: "error",
              error: "jzodTypeCheck failed to resolve union for object",
              rawJzodSchemaType: effectiveRawSchema.type,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              innerError: resolveUnionResult,
              value: valueObject,
              rawSchema: effectiveRawSchema,
            };
          }

          const discriminatedSchemaForObject = resolveUnionResult.resolvedJzodObjectSchema;
          // log.info(
          //   "jzodTypeCheck union for object at",
          //   currentValuePath.join("."),
          //   "discriminator:",
          //   effectiveRawSchema.discriminator,
          //   "resolveUnionResult:",
          //   resolveUnionResult,
          // );
          const subResolvedSchemas = jzodTypeCheck(
            discriminatedSchemaForObject,
            valueObject,
            currentValuePath,
            [...currentTypePath, "union choice(" + JSON.stringify(resolveUnionResult.chosenDiscriminator) + ")"],
            modelEnvironment,
            relativeReferenceJzodContext,
            currentDefaultValue,
            reduxDeploymentsState,
            deploymentUuid,
            rootObject
          );
          if (subResolvedSchemas.status !== "ok") {
            return {
              status: "error",
              error:
                "jzodTypeCheck union failed to match object attribute value with schema attribute",
              rawJzodSchemaType: effectiveRawSchema.type,
              valuePath: currentValuePath,
              typePath: currentTypePath,
              innerError: subResolvedSchemas,
              value: valueObject,
              rawSchema: effectiveRawSchema,
            };
          }
          // log.info(
          //   "jzodTypeCheck object at",
          //   currentValuePath.join("."),
          //   "type:",
          //   JSON.stringify(subResolvedSchemas.resolvedSchema, null, 2),
          //   "validates",
          //   JSON.stringify(valueObject, null, 2)
          // );
          const objectUniondiscriminatorValues =
            subResolvedSchemas.resolvedSchema.type == "object" && effectiveRawSchema.discriminator
              ? getObjectUniondiscriminatorValuesFromResolvedSchema(
                  // subResolvedSchemas.resolvedSchema,
                  effectiveRawSchema,
                  recursivelyUnfoldedUnionSchema?.result ?? [],
                  resolveUnionResult.objectUnionChoices
                )
              : [];

          return {
            status: "ok",
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
          // throw new Error("jzodTypeCheck could not resolve type for union with valueObject " + valueObject);
          return {
            status: "error",
            error: "jzodTypeCheck value type not supported for union schema: " + typeof valueObject,
            rawJzodSchemaType: effectiveRawSchema.type,
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
        //   "jzodTypeCheck record schema " +
        //     JSON.stringify(effectiveSchema) +
        //     " for value " +
        //     JSON.stringify(valueObject)
        // );
        return {
          status: "error",
          error: "jzodTypeCheck record schema for value is not an object",
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resolvedRecordEntries: { [k: string]: ResolvedJzodSchemaReturnType } =
        Object.fromEntries(
          Object.entries(valueObject).map((e: [string, any]) => {
            const resultSchemaTmp: ResolvedJzodSchemaReturnType = jzodTypeCheck(
              effectiveRawSchema.definition,
              e[1],
              [...currentValuePath, e[0]],
              [...currentTypePath, e[0]],
              modelEnvironment,
              relativeReferenceJzodContext,
              currentDefaultValue,
              reduxDeploymentsState,
              deploymentUuid,
              rootObject
            );
            return [e[0], resultSchemaTmp];
          }) as [string, ResolvedJzodSchemaReturnType][]
        );
      const foundErrors = Object.entries(resolvedRecordEntries).filter(
        (e: [string, ResolvedJzodSchemaReturnType]) => e[1].status == "error"
      );
      if (foundErrors.length > 0) {
        return {
          status: "error",
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: Object.fromEntries(
            foundErrors.map((e: [string, ResolvedJzodSchemaReturnType]) => [
              e[0],
              e[1] as ResolvedJzodSchemaReturnTypeError,
            ])
          ),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resolvedSchema: JzodElement = {
        ...effectiveRawSchema,
        type: "object",
        definition: Object.fromEntries(
          Object.entries(resolvedRecordEntries).map((e) => [
            e[0],
            (e[1] as ResolvedJzodSchemaReturnTypeOK).resolvedSchema,
          ])
        ),
      };
      // log.info(
      //   "jzodTypeCheck resolvedRecordEntries",
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
          `jzodTypeCheck record schema keyMap should only contain "ok" entries,
            but found error for key "${key}": ${value}`
        );
      // }, {} as { [k: string]: { rawSchema: JzodElement; resolvedSchema: JzodElement } });
      }, {} as { [k: string]: KeyMapEntry });
      // log.info(
      //   "jzodTypeCheck recordEntrieskeyMap",
      //   "done"  );
      return {
        status: "ok",
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
        //   "jzodTypeCheck literal at path=valueObject." +
        //   currentValuePath.join("."),
        //   ", type:",
        //   JSON.stringify(effectiveSchema, null, 2),
        //   "validates",
        //   JSON.stringify(valueObject, null, 2)
        // );

        return {
          status: "ok",
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
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
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
      //   "jzodTypeCheck enum at path=valueObject." +
      //   currentValuePath.join("."),
      //   ", type:",
      //   JSON.stringify(effectiveSchema, null, 2),
      //   "validates",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return {
        status: "ok",
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
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
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
      //   error: "jzodTypeCheck can not handle tuple schema " +
      //   JSON.stringify(effectiveSchema) +
      //   " for value " +
      //   JSON.stringify(valueObject)
      // }
      const resolvedInnerSchemas: ResolvedJzodSchemaReturnType[] = effectiveRawSchema.definition.map(
        (e: JzodElement, index: number) => {
          const resultSchemaTmp = jzodTypeCheck(
            e,
            valueObject[index],
            [...currentValuePath, index],
            [...currentTypePath, index],
            modelEnvironment,
            relativeReferenceJzodContext,
            currentDefaultValue,
            reduxDeploymentsState,
            deploymentUuid,
            rootObject
          );
          return resultSchemaTmp;
        }
      );
      const foundErrors = resolvedInnerSchemas.filter(
        (e: ResolvedJzodSchemaReturnType) => e.status == "error"
      );
      if (foundErrors.length > 0) {
        return {
          status: "error",
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: Object.fromEntries(
            // foundErrors.map((e: ResolvedJzodSchemaReturnTypeError) => [
            foundErrors.map((e: any) => [
              e.valuePath && e.valuePath.length > 0 ? e.valuePath.join(".") : "" ,
              e as any,
            ] as any) as any // TODO: CHECK TYPES
          ),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resolvedSchema: JzodElement = {
        ...effectiveRawSchema,
        type: "tuple",
        definition: resolvedInnerSchemas.map(
          (e) => (e as ResolvedJzodSchemaReturnTypeOK).resolvedSchema
        ),
      };
      return {
        status: "ok",
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
              `jzodTypeCheck tuple schema keyMap should only contain "ok" entries, but found error for index ${index}: ${e.error}`
            );
          // }, {} as { [k: string]: { rawSchema: JzodElement; resolvedSchema: JzodElement } }),
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
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }

      // log.info(
      //   "jzodTypeCheck called resolveJzodSchemaReferenceInContext for array found innerSchema",
      //   JSON.stringify(innerSchema, null, 2)
      // );

      const subSchemas: ResolvedJzodSchemaReturnType[] = valueObject.map(
        (e: any, index: number) => {
          const subSchema = jzodTypeCheck(
            effectiveRawSchema.definition,
            e,
            [...currentValuePath, index],
            [...currentTypePath, index],
            modelEnvironment,
            // miroirFundamentalJzodSchema,
            // currentModel,
            // miroirMetaModel,
            relativeReferenceJzodContext,
            currentDefaultValue,
            reduxDeploymentsState,
            // getEntityInstancesUuidIndex,
            deploymentUuid,
            rootObject
          );
          return subSchema;
        }
      );
      const foundErrors: ResolvedJzodSchemaReturnTypeError[] = subSchemas.filter(
        (e: ResolvedJzodSchemaReturnType) => e.status == "error"
      ) as any;

      if (foundErrors.length > 0) {
        return {
          status: "error",
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          innerError: Object.fromEntries(
            foundErrors.map((e: ResolvedJzodSchemaReturnTypeError) => [
              e.valuePath && e.valuePath.length > 0 ? e.valuePath.join(".") : "",
              e,
            ])
          ),
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      const resolvedSchema: JzodElement = {
        ...effectiveRawSchema,
        type: "tuple",
        definition: subSchemas.map((s) => (s as ResolvedJzodSchemaReturnTypeOK).resolvedSchema), // TODO: this is a shortcut assuming that all items in the array are of the same type, which is not always true
      };
      // log.info(
      //   "jzodTypeCheck resolvedSchema for array",
      //   JSON.stringify(subSchemas, null, 2),
      // );
      return {
        status: "ok",
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
          // }, {} as { [k: string]: { rawSchema: JzodElement; resolvedSchema: JzodElement } }),
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
      return {
        status: "ok",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: effectiveRawSchema,
        resolvedSchema: valueToJzod(valueObject) as JzodElement,
        keyMap: {
          [currentValuePath.join(".")]: {
            rawSchema: effectiveRawSchema,
            // resolvedSchema: effectiveSchema
            resolvedSchema: valueToJzod(valueObject) as JzodElement,
            valuePath: currentValuePath,
            typePath: currentTypePath,
          }, // map the current value path to the resolved schema
        },
      };
    }
    case "uuid": {
      // log.info("jzodTypeCheck uuid at path=valueObject." + currentValue
      if (typeof valueObject != "string" || !isValidUUID(valueObject)) {
        return {
          status: "error",
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
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
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
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
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
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
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
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
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
      return {
        status: "ok",
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
        if (valueObject instanceof Date || new Date(valueObject).toString() !== "Invalid Date") {
          return {
            status: "ok",
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
            error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema`,
            rawJzodSchemaType: effectiveRawSchema.type,
            valuePath: currentValuePath,
            typePath: currentTypePath,
            value: valueObject,
            rawSchema: effectiveRawSchema,
          };
        }
      } catch (e) {
        return {
          status: "error",
          error: `jzodTypeCheck failed to match value with ${effectiveRawSchema.type} schema: ` + e,
          rawJzodSchemaType: effectiveRawSchema.type,
          valuePath: currentValuePath,
          typePath: currentTypePath,
          value: valueObject,
          rawSchema: effectiveRawSchema,
        };
      }
    }
    case "undefined":
    case "never":
    case "null":
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
            // resolvedSchema: valueToJzod(valueObject) as JzodElement
          }, // map the current value path to the resolved schema
        },
      };
    }
    default: {
      // throw new Error(
      //   "jzodTypeCheck could not resolve schemaReferences for valueObject " +
      //     JSON.stringify(valueObject, undefined, 2) +
      //     " and schema " +
      //     JSON.stringify(effectiveSchema)
      // );
      return {
        status: "error",
        error: `jzodTypeCheck failed to match value with undefined schema type`,
        rawJzodSchemaType: "not supported",
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
// Transformer function for jzodTypeCheck
export function jzodTypeCheckTransformer<T extends MiroirModelEnvironment>(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: any,
  resolveBuildTransformersTo: any,
  // queryParams: Record<string, any>,
  queryParams: T,
  contextResults?: Record<string, any>,
): ResolvedJzodSchemaReturnType {
  const {
    jzodSchema,
    valueObject,
    currentValuePath = [],
    currentTypePath = [],
    // miroirFundamentalJzodSchema,
    // currentModel,
    // miroirMetaModel,
    relativeReferenceJzodContext = {},
    currentDefaultValue,
    reduxDeploymentsState,
    deploymentUuid,
    rootObject
  } = transformer;

  return jzodTypeCheck(
    jzodSchema,
    valueObject,
    currentValuePath,
    currentTypePath,
    // miroirFundamentalJzodSchema,
    // currentModel,
    // miroirMetaModel,
    relativeReferenceJzodContext,
    currentDefaultValue,
    reduxDeploymentsState,
    deploymentUuid,
    rootObject
  );
}

// ################################################################################################


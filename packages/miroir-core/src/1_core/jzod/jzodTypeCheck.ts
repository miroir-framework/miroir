import { valueToJzod } from "@miroir-framework/jzod";

import {
  JzodElement,
  JzodEnum,
  JzodLiteral,
  JzodObject,
  JzodReference,
  JzodSchema,
  JzodUnion,
  MetaModel
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";
import { jzodUnion_recursivelyUnfold } from "./jzodUnion_RecursivelyUnfold";

import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

// export const miroirFundamentalJzodSchema2 = miroirFundamentalJzodSchema;
// import { miroirFundamentalJzodSchema } from "../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodTypeCheck"),
).then((logger: LoggerInterface) => {log = logger});



export interface ResolvedJzodSchemaReturnTypeOK {
  status: "ok";
  valuePath: (string | number)[];
  typePath: (string | number)[];
  rawSchema: JzodElement;
  resolvedSchema: JzodElement;
  subSchemas?:
    | ResolvedJzodSchemaReturnType
    | ResolvedJzodSchemaReturnType[]
    | Record<string, ResolvedJzodSchemaReturnType>
    | undefined; // for unions, this is the list of sub-schemas that were resolved
}
export interface ResolvedJzodSchemaReturnTypeError {
  status: "error",
  valuePath: (string | number)[],
  typePath: (string | number)[],
  error: string
  innerError?: ResolvedJzodSchemaReturnTypeError
}
export type ResolvedJzodSchemaReturnType = ResolvedJzodSchemaReturnTypeError | ResolvedJzodSchemaReturnTypeOK;

// ################################################################################################
export function resolveObjectExtendClauseAndDefinition(
  jzodObject: JzodObject,
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): JzodObject {
  // if (j.type == "object") {
    if (jzodObject.extend) {
      // const extension = resolveJzodSchemaReferenceInContext(
      const extension:JzodElement = resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        jzodObject.extend,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      )
      const resolvedDefinition = Object.fromEntries(
        Object.entries(jzodObject.definition).filter(
          (e:[string, JzodElement]) => e[1].type == "schemaReference"
        ).map(
          (e) => [e[0], resolveJzodSchemaReferenceInContext(
            miroirFundamentalJzodSchema,
            e[1] as JzodReference,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
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
/**
 * returns a list of JzodObject schemas by recursively unrolling the union and references in @param concreteUnrolledJzodSchemas.
 * @param concreteUnrolledJzodSchemas 
 * @param miroirFundamentalJzodSchema 
 * @param currentModel 
 * @param miroirMetaModel 
 * @param relativeReferenceJzodContext 
 * @returns 
 */
export function unionObjectChoices (
  concreteUnrolledJzodSchemas: JzodElement[],
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
) {
  return concreteUnrolledJzodSchemas
    .filter((j) => j.type == "object")
    .concat(
      (
        concreteUnrolledJzodSchemas.filter(
          (j: JzodElement): boolean => j.type == "union"
        ) as JzodUnion[]
      ).flatMap( // for sub-unions, return the sub-objects clauses, with their extend clauses resolved
        (j: JzodUnion): JzodObject[] =>
          (j.definition.filter((k: JzodElement) => k.type == "object") as JzodObject[]).map(
            (k: JzodObject): JzodObject =>
              resolveObjectExtendClauseAndDefinition(
                k,
                miroirFundamentalJzodSchema,
                currentModel,
                miroirMetaModel,
                relativeReferenceJzodContext
              )
          ) as JzodObject[]
      ),
      (
        concreteUnrolledJzodSchemas.filter((j: JzodElement) => j.type == "union") as JzodUnion[]
      ).flatMap( // if schemaReferences are found, we resolve them, squashing the extend clause for objects
        (j: JzodUnion) =>
          (
            (
              j.definition.filter(
                (k: JzodElement) => k.type == "schemaReference"
              ) as JzodReference[]
            )
            .map((k: JzodReference) =>
              resolveJzodSchemaReferenceInContext(
                miroirFundamentalJzodSchema,
                k,
                currentModel,
                miroirMetaModel,
                { ...relativeReferenceJzodContext, ...k.context }
              )
            )
            .filter((j) => j.type == "object") as JzodObject[]
          ).map(
            (k: JzodObject): JzodObject =>
              resolveObjectExtendClauseAndDefinition(
                k,
                miroirFundamentalJzodSchema,
                currentModel,
                miroirMetaModel,
                relativeReferenceJzodContext
              )
          ) as JzodObject[]
      )
    )
  ;
}
;

// #####################################################################################################
// #####################################################################################################
export function selectUnionBranchFromDiscriminator(
  objectUnionChoices: JzodObject[],
  discriminator: string | string[] | undefined,
  valueObject: any,
  valueObjectPath: (string | number)[],
  typePath: (string | number)[], // for logging purposes only
  // from above:
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: {[k:string]: JzodElement},
): {
  currentDiscriminatedObjectJzodSchema: JzodObject;
  flattenedUnionChoices: JzodObject[];
  chosenDiscriminator: {discriminator: string, value: any}[];
} {
  const discriminators: string | string[] | undefined = !discriminator
    ? discriminator
    : Array.isArray(discriminator)
    ? discriminator
    : [discriminator];


  // "flatten" object hierarchy, if there is an extend clause, we resolve it
  let flattenedUnionChoices = objectUnionChoices.map(
    (jzodObjectSchema) => {
      let extendedJzodSchema: JzodObject
      if (jzodObjectSchema.extend) {
        const extension = resolveJzodSchemaReferenceInContext(
          miroirFundamentalJzodSchema,
          jzodObjectSchema.extend,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
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
          throw new Error(
            "selectUnionBranchFromDiscriminator object extend clause schema " +
              JSON.stringify(jzodObjectSchema) +
              " is not an object " +
              JSON.stringify(extension)
          );
        }
      } else {
        extendedJzodSchema = jzodObjectSchema
      }
      return extendedJzodSchema;
    }
  );
  // log.info(
  //   "selectUnionBranchFromDiscriminator called for union-type value object with discriminator(s)=",
  //   discriminators,
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
  if (!discriminators || discriminators.length == 0) {
    // no discriminator, proceed by eliminating all choices that do not match the valueObject
    // flattenedUnionChoices = flattenedUnionChoices.filter((objectChoice) => {
    filteredFlattenedUnionChoices = flattenedUnionChoices.filter((objectChoice) => {
      const objectChoiceKeys = Object.keys(objectChoice.definition);
      return Object.keys(valueObject).every(
        (valueObjectKey) =>
          objectChoiceKeys.includes(valueObjectKey) &&
          (objectChoice.definition[valueObjectKey]?.type != "literal" ||
            objectChoice.definition[valueObjectKey]?.definition == valueObject[valueObjectKey])
      );
    });
    // log.info(
    //   "selectUnionBranchFromDiscriminator called for union-type value object with no discriminator, flattenedUnionChoices=",
    //   // JSON.stringify(flattenedUnionChoices, null, 2),
    //   filteredFlattenedUnionChoices,
    //   "valueObject=",
    //   JSON.stringify(valueObject, null, 2),
    //   // "valueObjectPath=",
    //   // valueObjectPath,
    //   // "typePath=",
    //   // typePath
    // );
  } else {
    while (i < discriminators.length && filteredFlattenedUnionChoices.length > 1) {
      const disc = discriminators[i];
      const newfilteredFlattenedUnionChoices = filteredFlattenedUnionChoices.filter(
        (a) =>
          (
            a.type == "object" &&
            a.definition[disc]?.type == "literal" &&
            (a.definition[disc] as JzodLiteral).definition == valueObject[disc]
          ) ||
          (
            a.type == "object" &&
            a.definition[disc]?.type == "enum" &&
            (a.definition[disc] as JzodEnum).definition.includes(valueObject[disc])
          )
      );
      chosenDiscriminator.push({discriminator: disc, value: valueObject[disc]});
      // log.info("selectUnionBranchFromDiscriminator filtering union choices with discriminator=",
      //   disc,
      //   "iteration=",
      //   i,
      //   "valueObject",
      //   valueObject,
      //   "valueObject[discriminator]=",
      //   valueObject[disc],
      //   "newfilteredFlattenedUnionChoices=",
      //   newfilteredFlattenedUnionChoices
      // );
      filteredFlattenedUnionChoices = newfilteredFlattenedUnionChoices;
      i++;
    }
    // log.info(
    //   "selectUnionBranchFromDiscriminator called for union-type value object with discriminator(s)=",
    //   discriminators,
    //   "filteredFlattenedUnionChoices=",
    //   filteredFlattenedUnionChoices
    //   // JSON.stringify(objectUnionChoices.map((e:any) => [e?.definition['transformerType'], e?.definition ]), null, 2),
    // );
  }


  if (filteredFlattenedUnionChoices.length == 0) {
    throw new Error(
      "selectUnionBranchFromDiscriminator called for union-type value object found no match with discriminator(s)=" +
        JSON.stringify(discriminators) +
        " valueObject[discriminator]=" +
        JSON.stringify(discriminators??[].map(d => valueObject[d])) +
        " #################### valueObject=" + JSON.stringify(valueObject, null, 2) +
        " #################### objectUnionChoices=" + JSON.stringify(objectUnionChoices)
    );
  }
  if (filteredFlattenedUnionChoices.length > 1) {
    // log.info(
    //   "selectUnionBranchFromDiscriminator found many matches with discriminator(s)=",
    //   discriminators,
    //   "filteredFlattenedUnionChoices=",
    //   filteredFlattenedUnionChoices
    // )
    throw new Error(
      "selectUnionBranchFromDiscriminator called for union-type value object found many matches with discriminator(s)=" +
        JSON.stringify(discriminators) +
        " valueObject[discriminator]=" +
        JSON.stringify(discriminators??[].map(d => valueObject[d])) +
        " ############# objectUnionChoices=" +
        JSON.stringify(
          objectUnionChoices,
          // null,
          // 2
        ) +
        " found: " +
        filteredFlattenedUnionChoices.length +
        " matches, ############### valueObject=" +
        JSON.stringify(valueObject) +
        " ################## filteredFlattenedUnionChoices=" +
        JSON.stringify(
          // filteredFlattenedUnionChoices.map((e) => discriminators??[].map(d => (e.definition[d] as any)?.definition)),
          filteredFlattenedUnionChoices,
          // null,
          // 2
        )
        // " matches, objectUnionChoices=" +
        // JSON.stringify(
        //   objectUnionChoices.map((e) => discriminators??[].map(d => (e.definition[d] as any)?.definition)),
        //   null,
        //   2
        // )
    );
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
    currentDiscriminatedObjectJzodSchema,
    flattenedUnionChoices: filteredFlattenedUnionChoices,
    chosenDiscriminator,
  };
}

// ################################################################################################
export function jzodUnionResolvedTypeForObject(
  concreteUnrolledJzodSchemas: JzodElement[],
  discriminator: string | string[] | undefined,
  valueObject: any,
  currentValuePath: (string | number)[],
  currentTypePath: (string | number)[],
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: { [k: string]: JzodElement }
): JzodObject {
  const objectUnionChoices = unionObjectChoices(
    concreteUnrolledJzodSchemas,
    miroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    relativeReferenceJzodContext
  );
  if (objectUnionChoices.length == 1) {
    return objectUnionChoices[0];
  }
  if (!objectUnionChoices || objectUnionChoices.length == 0) {
    // TODO: return error value, do not throw
    throw new Error(
      "jzodTypeCheck could not find object type for given object value in resolved union " +
        JSON.stringify(concreteUnrolledJzodSchemas, null, 2)
    );
  }
  const {
    currentDiscriminatedObjectJzodSchema,
    flattenedUnionChoices,
    chosenDiscriminator,
  }: {
    currentDiscriminatedObjectJzodSchema: JzodObject;
    flattenedUnionChoices: JzodObject[];
    chosenDiscriminator: { discriminator: string; value: any }[];
  } = selectUnionBranchFromDiscriminator(
    objectUnionChoices,
    discriminator,
    valueObject,
    currentValuePath,
    currentTypePath, // typePath
    // to resolve the extend clause of the object schema:
    miroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    relativeReferenceJzodContext
  );
  return currentDiscriminatedObjectJzodSchema;
} // end of jzodUnionResolvedTypeForObject

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
 * @param jzodSchema - The JzodElement schema to check against.
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
  miroirFundamentalJzodSchema: JzodSchema,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  relativeReferenceJzodContext: {[k:string]: JzodElement},
): ResolvedJzodSchemaReturnType {
  // log.info(
  //   "jzodTypeCheck called for valuePath=." + 
  //   currentValuePath.join("."),
  //   // "value",
  //   // // JSON.stringify(valueObject, null, 2),
  //   // valueObject,
  //   // "schema",
  //   // JSON.stringify(jzodSchema, null, 2)
  // );
  switch (jzodSchema?.type) {
    case "schemaReference": {
      const newContext = {...relativeReferenceJzodContext, ...jzodSchema.context}
      const resolvedJzodSchema = resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        jzodSchema,
        currentModel,
        miroirMetaModel,
        newContext
      );
      // log.info(
      //   "jzodTypeCheck schemaReference resultJzodSchema",
      //   JSON.stringify(resolvedJzodSchema, null, 2),
      //   "valueObject",
      //   JSON.stringify(valueObject, null, 2)
      // );
      const typeCheck = jzodTypeCheck(
        resolvedJzodSchema,
        valueObject,
        currentValuePath,
        [...currentTypePath, "ref:" + (jzodSchema.definition.relativePath??"NO_RELATIVE_PATH")],
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        newContext
      );
      return typeCheck.status == "ok" ? {
        status: "ok",
        valuePath: typeCheck.valuePath,
        typePath: typeCheck.typePath,
        rawSchema: jzodSchema,
        resolvedSchema: typeCheck.resolvedSchema,
        subSchemas: typeCheck.subSchemas // for unions, this is the list of sub-schemas that were resolved
      }: {
        status: "error",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        error: typeCheck.error
      };
      break;
    }
    case "object": {
      if ( typeof valueObject != "object") {
        return ({
          status: "error",
          valuePath: currentValuePath,
          typePath: [],
          error: "jzodTypeCheck failed to match object value with schema " +
              JSON.stringify(jzodSchema) +
              " for value " +
              JSON.stringify(valueObject)
        })
      }

      let extendedJzodSchema: JzodObject
      if (jzodSchema.extend) {
        const extension = resolveJzodSchemaReferenceInContext(
          miroirFundamentalJzodSchema,
          jzodSchema.extend,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        )
        if (extension.type == "object") {
          extendedJzodSchema = {
            // type: "object",
            ...jzodSchema,
            definition: {
              ...extension.definition,
              ...jzodSchema.definition
            }
          }
          delete extendedJzodSchema.extend; // remove the extend clause, since it is already resolved
        } else {
          throw new Error(
            "jzodTypeCheck object extend clause schema " +
              JSON.stringify(jzodSchema) +
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
        extendedJzodSchema = jzodSchema
      }
      // log.info("jzodTypeCheck object extendedJzodSchema",JSON.stringify(extendedJzodSchema, null, 2));

      const resolvedObjectEntries:[string, ResolvedJzodSchemaReturnType][] = Object.entries(valueObject).map(
        (e: [string, any]) => {
          if (extendedJzodSchema.definition[e[0]]) {
            const resultSchemaTmp = jzodTypeCheck(
              extendedJzodSchema.definition[e[0]],
              e[1],
              [...currentValuePath, e[0]],
              [...currentTypePath, e[0]],
              miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )
            return [e[0], resultSchemaTmp];
          } else {
            // TODO: RETURN AN ERROR ResolvedJzodSchemaReturnTypeError
            log.warn(JSON.stringify({
              path: currentValuePath.join(".") + "." + e[0],
              valueObject,
              extendedJzodSchema,
              error: "jzodTypeCheck error on matching valueObject with extendedJzodSchema, path not found in extendedJzodSchema"
              // error: "jzodTypeCheck error on resolving object, valueObject attribute " +
              //   currentValuePath.join(".") + e[0] +
              //   " not present in definition of type " +
              //   JSON.stringify(extendedJzodSchema) +
              //   " valueObject " + 
              //   JSON.stringify(valueObject)
            }, null, 2));
            return [
              e[0],
              {
                status: "error",
                valuePath: [...currentValuePath, e[0]],
                typePath: [...currentTypePath, e[0]],
                error:
                  "jzodTypeCheck error on resolving object, valueObject attribute " +
                  currentValuePath.join(".") +
                  e[0] +
                  " not present in definition of type " +
                  JSON.stringify(extendedJzodSchema) +
                  " valueObject " +
                  JSON.stringify(valueObject),
              },
            ];
          }
        } 
      );

      const foundErrors = resolvedObjectEntries.filter(
        (e: [string, ResolvedJzodSchemaReturnType]) => e[1].status == "error"
      );
      // TODO: inheritance!!!
      if (foundErrors.length > 0) {
        return {
          status: "error",
          valuePath: foundErrors[0][1].valuePath,
          typePath: foundErrors[0][1].typePath,
          error: "jzodTypeCheck failed when matching object value with schema " +
            JSON.stringify(jzodSchema) +
            " for value " +
            JSON.stringify(valueObject) +
            " has mismatch on attribute: " +
            foundErrors.map((e) => e[1].valuePath).join(", ")
        };
      }
      const resultResolvedJzodSchema: JzodObject = {
        ...extendedJzodSchema,
        definition: Object.fromEntries(
          resolvedObjectEntries.map((e) => [
            e[0],
            (e[1] as ResolvedJzodSchemaReturnTypeOK).resolvedSchema,
          ])
        ),
      } as JzodObject;
      // log.info(
      //   "jzodTypeCheck object at",
      //   currentValuePath.join("."),
      //   "type:",
      //   JSON.stringify(resultElement, null, 2),
      //   "validates",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return {
        status: "ok",
        valuePath: currentValuePath,
        typePath: [],
        rawSchema: jzodSchema,
        resolvedSchema: resultResolvedJzodSchema,
        subSchemas: Object.fromEntries(resolvedObjectEntries)
      };
      break;
    }
    case "union":{
      const unfoldedJzodSchema = jzodUnion_recursivelyUnfold(
        jzodSchema as JzodUnion,
        new Set(),
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );

      if (unfoldedJzodSchema.status == "error") {
        log.error(
          "jzodTypeCheck union schema",
          JSON.stringify(jzodSchema, null, 2),
          "could not be unfolded, error:",
          unfoldedJzodSchema.error
        );
        return {
          status: "error",
          valuePath: currentValuePath,
          typePath: currentTypePath,
          error: "jzodTypeCheck union schema " +
            JSON.stringify(jzodSchema) +
            " could not be unfolded, error: " + unfoldedJzodSchema.error
        }
      }
      const concreteUnfoldedJzodSchemas: JzodElement[] = unfoldedJzodSchema.result;

      // log.info(
      //   "jzodTypeCheck called for union",
      //   jzodSchema,
      //   "concreteUnrolledJzodSchemas resolved type:",
      //   // JSON.stringify(concreteUnfoldedJzodSchemas, null, 2)
      //   concreteUnfoldedJzodSchemas
      // );
      switch (typeof valueObject) {
        case "number":
        case "bigint":
        case "boolean": {
          // why is selectUnionBranchFromDiscriminator not used here? This is really similar to it.
          const resultJzodSchema = concreteUnfoldedJzodSchemas.find(
            (a) =>
              (a.type == typeof valueObject)
          );
          if (resultJzodSchema) {
            log.info(
              "jzodTypeCheck object at",
              currentValuePath.join("."),
              "type:",
              JSON.stringify(resultJzodSchema, null, 2),
              "validates",
              JSON.stringify(
                valueObject,
                (key, value) =>typeof value === "bigint" ? value.toString() : value,
                2
              )
            );
            return {
              status: "ok",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              rawSchema: jzodSchema,
              resolvedSchema: resultJzodSchema,
            };
          } else {
            return {
              status: "error",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              error:
                "jzodTypeCheck could not find " + typeof valueObject + " type for value" +
                valueObject +
                " in resolved union " +
                JSON.stringify(concreteUnfoldedJzodSchemas, null, 2),
            };
          }
          break;
        }
        case "string": {
          // TODO: the following line may introduce some non-determinism, in the case many records actually match the "find" predicate! BAD!
          const resultJzodSchema = concreteUnfoldedJzodSchemas.find(
            (a) =>
              (a.type == "string") ||
              (a.type == "literal" && a.definition == valueObject)
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
              rawSchema: jzodSchema,
              resolvedSchema: resultJzodSchema,
            };
          } else {
            return {
              status: "error",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              error:
                "jzodTypeCheck could not find string or literal type for value" +
                valueObject +
                " in resolved union " +
                JSON.stringify(concreteUnfoldedJzodSchemas, null, 2),
            };
          }
          break;
        }
        case "object": {
          const discriminatedSchemaForObject: JzodObject = jzodUnionResolvedTypeForObject(
            concreteUnfoldedJzodSchemas,
            jzodSchema.discriminator,
            valueObject,
            currentValuePath,
            currentTypePath,
            miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          );

          const subResolvedSchemas = jzodTypeCheck(
            discriminatedSchemaForObject,
            valueObject,
            currentValuePath,
            [...currentTypePath, "union choice"],
            miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          );
          if (subResolvedSchemas.status == "ok") {
            // log.info(
            //   "jzodTypeCheck object at",
            //   currentValuePath.join("."),
            //   "type:",
            //   JSON.stringify(subResolvedSchemas.resolvedSchema, null, 2),
            //   "validates",
            //   JSON.stringify(valueObject, null, 2)
            // );
            return {
              status: "ok",
              valuePath: subResolvedSchemas.valuePath,
              typePath: subResolvedSchemas.typePath,
              rawSchema: jzodSchema,
              resolvedSchema: subResolvedSchemas.resolvedSchema,
              subSchemas: subResolvedSchemas.subSchemas
            };
          } else {
            return {
              status: "error",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              error:
                "jzodTypeCheck could not find object type for value" +
                valueObject +
                " in resolved union " +
                JSON.stringify(concreteUnfoldedJzodSchemas, null, 2) +
                " error: " + subResolvedSchemas.error
            };
          }
        }
        case "function":
        case "symbol": // TODO: what does this correspond to?
        case "undefined":
        default: {
          throw new Error("jzodTypeCheck could not resolve type for union with valueObject " + valueObject);
          break;
        }
      }     
      break;
    }
    case "record": {
      if ( typeof valueObject != "object") {
        throw new Error(
          "jzodTypeCheck record schema " +
            JSON.stringify(jzodSchema) +
            " for value " +
            JSON.stringify(valueObject)
        );
      }
      const definition: {[k:string]: ResolvedJzodSchemaReturnType} = Object.fromEntries(
        Object.entries(valueObject).map(
          (e: [string, any]) => {
            const resultSchemaTmp: ResolvedJzodSchemaReturnType = jzodTypeCheck(
              jzodSchema.definition,
              e[1],
              [...currentValuePath, e[0]],
              [...currentTypePath, e[0]],
              miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            );
            return [e[0], resultSchemaTmp];
          }
        ) as [string, ResolvedJzodSchemaReturnType][]
      );
      const foundErrors = Object.entries(definition).filter(
        (e: [string, ResolvedJzodSchemaReturnType]) => e[1].status == "error"
      );
      return foundErrors.length > 0
        ? {
            status: "error",
            valuePath: currentValuePath,
            typePath: currentTypePath,
            error:
              "jzodTypeCheck record could not find schema for attributes " +
              foundErrors.map((e) => e[0]).join(", ") +
              " at path=" +
              currentValuePath.join(".") +
              " in valueObject=" +
              JSON.stringify(valueObject, null, 2) +
              " definition=" +
              JSON.stringify(definition, null, 2),
          }
        : {
            status: "ok",
            valuePath: currentValuePath,
            typePath: currentTypePath,
            rawSchema: jzodSchema,
            resolvedSchema: {
              ...jzodSchema,
              type: "object",
              definition: Object.fromEntries(
                Object.entries(definition).map((e) => [
                  e[0],
                  (e[1] as ResolvedJzodSchemaReturnTypeOK).resolvedSchema,
                ])
              ),
            },
            subSchemas: definition,
          };
    }
    case "literal": {
      if (valueObject == jzodSchema.definition)  {
        // log.info(
        //   "jzodTypeCheck literal at path=valueObject." + 
        //   currentValuePath.join("."),
        //   ", type:",
        //   JSON.stringify(jzodSchema, null, 2),
        //   "validates",
        //   JSON.stringify(valueObject, null, 2)
        // );

        return {
          status: "ok",
          valuePath: currentValuePath,
          typePath: currentTypePath,
          rawSchema: jzodSchema,
          resolvedSchema: jzodSchema,
        };
      } else {
        return {
          status: "error",
          valuePath: currentValuePath,
          typePath: currentTypePath,
          error:
            "jzodTypeCheck could not find literal type in resolved union " +
            JSON.stringify(valueObject, null, 2) +
            " jzodSchema=" +
            JSON.stringify(jzodSchema, null, 2),
        };
      }
      break;
    }
    case "enum": {
      // log.info(
      //   "jzodTypeCheck enum at path=valueObject." + 
      //   currentValuePath.join("."),
      //   ", type:",
      //   JSON.stringify(jzodSchema, null, 2),
      //   "validates",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return {
        status: "ok",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: jzodSchema,
        resolvedSchema: jzodSchema,
      };
    }
    case "tuple": {
      if ( !Array.isArray(valueObject)) {
        return {
          status: "error",
          valuePath: currentValuePath,
          typePath: currentTypePath,
          error: "jzodTypeCheck can not handle tuple schema " +
          JSON.stringify(jzodSchema) +
          " for value " +
          JSON.stringify(valueObject)
        }
      }
      // return {
      //   status: "error",
      //   valuePath: currentValuePath,
      //   typePath: currentTypePath,
      //   error: "jzodTypeCheck can not handle tuple schema " +
      //   JSON.stringify(jzodSchema) +
      //   " for value " +
      //   JSON.stringify(valueObject)
      // }
      const resolvedInnerSchemas: ResolvedJzodSchemaReturnType[] = jzodSchema.definition.map(
        (e: JzodElement, index: number) => {
          const resultSchemaTmp = jzodTypeCheck(
            e,
            valueObject[index],
            [...currentValuePath, index],
            [...currentTypePath, index],
            miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          );
          return resultSchemaTmp;
        });
      const foundErrors = resolvedInnerSchemas.filter(
        (e: ResolvedJzodSchemaReturnType) => e.status == "error"
      );
      return foundErrors.length > 0
        ? {
            status: "error",
            valuePath: currentValuePath,
            typePath: currentTypePath,
            error:
              "jzodTypeCheck tuple could not find schema for elements at indices " +
              foundErrors.map((e, index) => index).join(", ") +
              " at path=" +
              currentValuePath.join(".") +
              " in valueObject=" +
              JSON.stringify(valueObject, null, 2),
          }
        : {
            status: "ok",
            valuePath: currentValuePath,
            typePath: currentTypePath,
            rawSchema: jzodSchema,
            resolvedSchema: {
              ...jzodSchema,
              type: "tuple",
              definition: resolvedInnerSchemas.map(
                (e) => (e as ResolvedJzodSchemaReturnTypeOK).resolvedSchema
              ),
            },
            subSchemas: resolvedInnerSchemas,
          };
      break;
    }
    case "array": {
      if ( !Array.isArray(valueObject)) {
        return {
          status: "error",
          valuePath: currentValuePath,
          typePath: currentTypePath,
          error: "jzodTypeCheck array schema " +
          JSON.stringify(jzodSchema) +
          " for value " +
          JSON.stringify(valueObject)
        }
      }
      // const innerSchema = jzodSchema.definition.type == "schemaReference"?
      //   resolveJzodSchemaReferenceInContext(
      //     miroirFundamentalJzodSchema,
      //     jzodSchema.definition,
      //     currentModel,
      //     miroirMetaModel,
      //     {...relativeReferenceJzodContext, ...jzodSchema.definition.context}
      //   )
      // : jzodSchema.definition
      // ;

      // log.info(
      //   "jzodTypeCheck called resolveJzodSchemaReferenceInContext for array found innerSchema",
      //   JSON.stringify(innerSchema, null, 2)
      // );

      // if (innerSchema.type != "union") { // TODO: this a shortcut assuming that all items in the array are of the same type, which is not always true
        // log.info(
        //   "jzodTypeCheck array innerSchema not union at path=valueObject." + 
        //   currentValuePath.join("."),
        //   ", type:",
        //   JSON.stringify({ type: "array", definition: innerSchema}, null, 2),
        //   "validates",
        //   JSON.stringify(valueObject, null, 2)
        // );
        const subSchemas: ResolvedJzodSchemaReturnType[] = valueObject.map(
          (e: any, index: number) => {
            const subSchema = jzodTypeCheck(
              jzodSchema.definition,
              e,
              [...currentValuePath, index],
              [...currentTypePath, index],
              miroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            );
            return subSchema.status == "error"
              ? {
                  status: "error",
                  valuePath: [...currentValuePath, index],
                  typePath: [...currentTypePath, index],
                  error:
                    "jzodTypeCheck could not find schema for array element at index " +
                    index +
                    " in valueObject=" +
                    JSON.stringify(valueObject, null, 2) +
                    " error: " +
                    subSchema.error,
                }
              : {
                  status: "ok",
                  valuePath: [...currentValuePath, index],
                  typePath: [...currentTypePath, index],
                  rawSchema: jzodSchema,
                  resolvedSchema: subSchema.resolvedSchema,
                };
          }
        );
        const foundErrors = subSchemas.filter(
          (e: ResolvedJzodSchemaReturnType) => e.status == "error"
        );

        return foundErrors.length > 0
          ? {
              status: "error",
              valuePath: currentValuePath,
              typePath: currentTypePath,
              error:
                "jzodTypeCheck array could not find schema for elements at indices " +
                foundErrors.map((e, index) => index).join(", ") +
                " at path=" +
                currentValuePath.join(".") +
                " in valueObject=" +
                JSON.stringify(valueObject, null, 2),
          }:
          {
          status: "ok",
          valuePath: currentValuePath,
          typePath: currentTypePath,
          rawSchema: jzodSchema,
          resolvedSchema: {
            ...jzodSchema,
            type: "tuple",
            definition: subSchemas.map(s => (s as ResolvedJzodSchemaReturnTypeOK).resolvedSchema), // TODO: this is a shortcut assuming that all items in the array are of the same type, which is not always true
          }, // TODO: this is a shortcut assuming that all items in the array are of the same type, which is not always true
          // resolvedSchema: { ...jzodSchema, type: "array", definition: innerSchema },
          subSchemas,
        };
      break;
    }
    // plain Attributes
    case "any": {
      return {
        status: "ok",
        valuePath: currentValuePath,
        typePath: currentTypePath,
        rawSchema: jzodSchema,
        resolvedSchema: valueToJzod(valueObject) as JzodElement,
      };
    }
    case "uuid":
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "undefined":
    case "date":
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
      // log.info(
      //   "jzodTypeCheck", jzodSchema?.type, "at path=valueObject." + 
      //   currentValuePath.join("."),
      //   ", type:",
      //   JSON.stringify(jzodSchema, null, 2),
      //   "validates",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return {
        status: "ok",
        valuePath: currentValuePath,
        typePath: [],
        rawSchema: jzodSchema,
        resolvedSchema: jzodSchema,
      };
    }
    default: {
      throw new Error(
        "jzodTypeCheck could not resolve schemaReferences for valueObject " +
          JSON.stringify(valueObject, undefined, 2) +
          " and schema " +
          JSON.stringify(jzodSchema)
      );
      break;
    }
  }

}


// import { JzodElement, JzodObject, JzodReference } from "@miroir-framework/jzod-ts";
import {
  JzodElement,
  JzodObject,
  JzodReference,
  JzodSchema,
  MetaModel
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
// import {miroirFundamentalJzodSchema} from "../0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema";
// import miroirFundamentalJzodSchema from "../../dist/index.js";
// import { miroirFundamentalJzodSchema } from "miroir-core";
// import { miroirFundamentalJzodSchema } from "../../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema.js";
// import miroirFundamentalJzodSchema from "../../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema.js";
// import * as f from "../../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema.js";
// import {miroirFundamentalJzodSchema} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";

// export const miroirFundamentalJzodSchema2 = miroirFundamentalJzodSchema;
// import { miroirFundamentalJzodSchema } from "../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema.js";


const loggerName: string = getLoggerName(packageName, cleanLevel,"Jzod");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


export interface ResolvedJzodSchemaReturnTypeOK {
  status: "ok",
  element: JzodElement
}
export interface ResolvedJzodSchemaReturnTypeError {
  status: "error",
  error: string
}
export type ResolvedJzodSchemaReturnType = ResolvedJzodSchemaReturnTypeError | ResolvedJzodSchemaReturnTypeOK;


export function resolveObjectExtendClaus(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodObject: JzodObject,
  // valueObject: any,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): JzodObject {
  // if (j.type == "object") {
    if (jzodObject.extend) {
      // const extension = resolveJzodSchemaReference2(
      const extension:JzodElement = resolveJzodSchemaReference2(
        miroirFundamentalJzodSchema,
        jzodObject.extend,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      )
      if (extension.type == "object") {
        return {
          type: "object",
          definition: {
            ...extension.definition,
            ...jzodObject.definition
          }
        }
      } else {
        throw new Error(
          "resolveReferencesForJzodSchemaAndValueObject object extend clause schema " +
            JSON.stringify(jzodObject) +
            " is not an object " +
            JSON.stringify(extension)
        );
        // return ({
        //   status: "error",
        //   error: "resolveReferencesForJzodSchemaAndValueObject object extend clause schema " +
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
// #####################################################################################################
export function resolveReferencesForJzodSchemaAndValueObject(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodSchema: JzodElement,
  valueObject: any,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): ResolvedJzodSchemaReturnType {
  log.info(
    "resolveReferencesForJzodSchemaAndValueObject called for valueObject",
    JSON.stringify(valueObject, null, 2),
    "schema",
    JSON.stringify(jzodSchema, null, 2)
  );
  switch (jzodSchema?.type) {
    case "schemaReference": {
      const newContext = {...relativeReferenceJzodContext, ...jzodSchema.context}
      const resultJzodSchema = resolveJzodSchemaReference2(
        miroirFundamentalJzodSchema,
        jzodSchema,
        currentModel,
        miroirMetaModel,
        newContext
      );
      // log.info(
      //   "resolveReferencesForJzodSchemaAndValueObject schemaReference resultJzodSchema",
      //   JSON.stringify(resultJzodSchema, null, 2),
      //   "valueObject",
      //   JSON.stringify(valueObject, null, 2)
      // );
      return resolveReferencesForJzodSchemaAndValueObject(
        miroirFundamentalJzodSchema,
        resultJzodSchema,
        valueObject,
        currentModel,
        miroirMetaModel,
        newContext
      );
      break;
    }
    case "object": {
      if ( typeof valueObject != "object") {
        return ({
          status: "error",
          error: "resolveReferencesForJzodSchemaAndValueObject object schema " +
              JSON.stringify(jzodSchema) +
              " for value " +
              JSON.stringify(valueObject)
        })
      }

      let extendedJzodSchema: JzodObject
      if (jzodSchema.extend) {
        // const extension = resolveJzodSchemaReference2(
        const extension = resolveJzodSchemaReference2(
          miroirFundamentalJzodSchema,
          jzodSchema.extend,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        )
        if (extension.type == "object") {
          extendedJzodSchema = {
            type: "object",
            definition: {
              ...extension.definition,
              ...jzodSchema.definition
            }
          }
        } else {
          throw new Error(
            "resolveReferencesForJzodSchemaAndValueObject object extend clause schema " +
              JSON.stringify(jzodSchema) +
              " is not an object " +
              JSON.stringify(extension)
          );
          // return ({
          //   status: "error",
          //   error: "resolveReferencesForJzodSchemaAndValueObject object extend clause schema " +
          //       JSON.stringify(jzodSchema) +
          //       " is not an object " +
          //       JSON.stringify(extension)
          // })
        }
      } else {
        extendedJzodSchema = jzodSchema
      }
      log.info("resolveReferencesForJzodSchemaAndValueObject object extendedJzodSchema",extendedJzodSchema)

      const resolvedObjectEntries:[string, JzodElement][] = Object.entries(valueObject).map(
        (e: [string, any]) => {
          if (extendedJzodSchema.definition[e[0]]) {
            const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
              miroirFundamentalJzodSchema,
              extendedJzodSchema.definition[e[0]],
              e[1],
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )
            log.info("resolveReferencesForJzodSchemaAndValueObject object attribute",e,"result",resultSchemaTmp)
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element,
              ]
            } else {
              // return resultSchemaTmp;
              log.warn(
                "resolveReferencesForJzodSchemaAndValueObject error on resolving object attribute " +
                  e[0] +
                  " not present in definition of (extend resolved) type " +
                  JSON.stringify(extendedJzodSchema) +
                  " valueObject " +
                  JSON.stringify(valueObject) +
                  " found error: " + resultSchemaTmp.error
              );
              return [e[0],{ type: "simpleType", definition: "never" }]
            }
          } else {
            log.warn({
              error: "resolveReferencesForJzodSchemaAndValueObject error on resolving object, valueObject attribute " +
                e[0] +
                " not present in definition of type " +
                JSON.stringify(extendedJzodSchema) +
                " valueObject " + 
                JSON.stringify(valueObject)
            })
            return [e[0],{ type: "simpleType", definition: "never" }]
          }
        } 
      );
      // log.info("resolveReferencesForJzodSchemaAndValueObject object resolved entries result",resolvedObjectEntries)

      // TODO: inheritance!!!
      const resultElement = {
        ...extendedJzodSchema,
        definition: Object.fromEntries(resolvedObjectEntries),
      } as JzodElement;
      // log.info("resolveReferencesForJzodSchemaAndValueObject object result", JSON.stringify(result, null, 2))
      return {status: "ok", element: resultElement};
      break;
    }
    case "union":{
      const concreteJzodSchemas: JzodElement[] = jzodSchema.definition.map((a: JzodElement) =>
        a.type == "schemaReference"
          ? resolveJzodSchemaReference2(
              miroirFundamentalJzodSchema,
              a,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )
          : a
      );
      const concreteUnrolledJzodSchemas: JzodElement[] = concreteJzodSchemas.map((j: JzodElement) => {
        if (j.type == "object") {
          return resolveObjectExtendClaus(
            miroirFundamentalJzodSchema,
            j,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          );
        } else {
          return j;
        }
      });

      log.info(
        "resolveReferencesForJzodSchemaAndValueObject called for union",
        "concreteUnrolledJzodSchemas resolved type:",
        JSON.stringify(concreteUnrolledJzodSchemas, null, 2)
      );
      switch (typeof valueObject) {
        case "string": {
          // TODO: the following line may introduce some non-determinism, in the case many records actually match the "find" predicate! BAD!
          const resultJzodSchema = concreteJzodSchemas.find(
            (a) =>
              (a.type == "simpleType" && a.definition == "string") ||
              (a.type == "literal" && a.definition == valueObject)
          );
          if (resultJzodSchema) {
            // log.info("resolveReferencesForJzodSchemaAndValueObject found for union string returning type: " + JSON.stringify(resultJzodSchema, null, 2));
            return { status: "ok", element: resultJzodSchema}
          } else {
            return {
              status: "error",
              error:
                "resolveReferencesForJzodSchemaAndValueObject could not find string type in resolved union " +
                JSON.stringify(concreteJzodSchemas, null, 2),
            };
          }
          break;
        }
        case "object": {
          const discriminator = jzodSchema.discriminator??"_undefined_"
          const subDiscriminator = jzodSchema.subDiscriminator??"_undefined_"

          log.info(
            "resolveReferencesForJzodSchemaAndValueObject called for union-type value object with discriminator=",
            discriminator,
            " subdiscriminator=",
            subDiscriminator,
            ", valueObject[discriminator]=",
            valueObject[discriminator],
            ", valueObject[subDiscriminator]=",
            valueObject[subDiscriminator]
          );

          const objectUnionChoices = concreteUnrolledJzodSchemas.filter(j => j.type == "object")
          if (objectUnionChoices.length == 1) {
            // only possible object choice, no need for a discriminator
            const subElementSchema = resolveReferencesForJzodSchemaAndValueObject(
              miroirFundamentalJzodSchema,
              objectUnionChoices[0],
              valueObject,
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            );
            return subElementSchema;
            // if (subElementSchema.status != "ok") {
            //   return subElementSchema
            //   // throw new Error(
            //   //   "resolveReferencesForJzodSchemaAndValueObject called for union-type value object with discriminator=" +
            //   //     jzodSchema.discriminator +
            //   //     " valueObject[discriminator]=" +
            //   //     valueObject[discriminator]
            //   // );
                
            // }
            // return {status: "ok", element: subElementSchema};
          }

          if (!valueObject[discriminator]) {
            throw new Error(
              "resolveReferencesForJzodSchemaAndValueObject called for union-type value object with discriminator=" +
                jzodSchema.discriminator +
                " valueObject[discriminator]=" +
                valueObject[discriminator]
            );
          }

          const currentDiscriminatedObjectJzodSchemas = concreteUnrolledJzodSchemas.filter(
                (a) =>
                  a.type == "object" &&
                  a.definition[discriminator].type == "literal" &&
                  a.definition[discriminator].definition == valueObject[discriminator]
              ) // TDOD: use discriminator attribute for object, not "type"!
          ; // TODO: this works only if there is exactly one object type in the union!

          log.info(
            "resolveReferencesForJzodSchemaAndValueObject found for union object resolved type: " +
              JSON.stringify(currentDiscriminatedObjectJzodSchemas, null, 2)
          );

          if (currentDiscriminatedObjectJzodSchemas.length == 0) {
            throw new Error("resolveReferencesForJzodSchemaAndValueObject called for union-type value object with discriminator=" +
            jzodSchema.discriminator + " valueObject[discriminator]=" + valueObject[discriminator] + " found no match!");
            
          }

          if (currentDiscriminatedObjectJzodSchemas.length > 1 && !jzodSchema.subDiscriminator) {
            throw new Error(
              "resolveReferencesForJzodSchemaAndValueObject called for union-type value object with discriminator=" +
                jzodSchema.discriminator +
                " valueObject[discriminator]=" +
                valueObject[discriminator] +
                " found many matches=" +
                currentDiscriminatedObjectJzodSchemas +
                " and no subDiscriminator"
            );
          }

          const currentSubDiscriminatedObjectJzodSchemas = currentDiscriminatedObjectJzodSchemas.length == 1? currentDiscriminatedObjectJzodSchemas :
          currentDiscriminatedObjectJzodSchemas.filter(
           (a) => a.type == "object" &&
            a.definition[subDiscriminator].type == "literal" &&
            a.definition[subDiscriminator].definition == valueObject[subDiscriminator]
          )

          if (currentSubDiscriminatedObjectJzodSchemas.length != 1) {
            throw new Error(
              "resolveReferencesForJzodSchemaAndValueObject called for union-type value object with discriminator=" +
                discriminator +
                " subDiscriminator=" +
                subDiscriminator + 
                ", valueObject[discriminator]=" +
                valueObject[discriminator] +
                ", valueObject[subDiscriminator]=" +
                valueObject[subDiscriminator] +
                " found no match or too many matches " +
                JSON.stringify(currentSubDiscriminatedObjectJzodSchemas)
            );
          }

          if (currentSubDiscriminatedObjectJzodSchemas[0].type != "object") {
            throw new Error(
              "resolveReferencesForJzodSchemaAndValueObject called for union-type value object with discriminator=" +
                discriminator +
                + " subDiscriminator=" +
                subDiscriminator + 
                " valueObject[discriminator]=" +
                valueObject[discriminator] +
                " valueObject[subDiscriminator]=" +
                valueObject[subDiscriminator] +
                " found non-object schema " +
                JSON.stringify(currentSubDiscriminatedObjectJzodSchemas[0])
            );
          }

          const currentSubDiscriminatedObjectJzodSchema: JzodObject = currentSubDiscriminatedObjectJzodSchemas[0];
          const objectJzodSchemaDefintion = Object.fromEntries(
            Object.entries(valueObject).map((a: [string, any]) => {
              const foundAttributeJzodSchema = (currentSubDiscriminatedObjectJzodSchema?.definition ?? ({} as any))[a[0]];
              log.info(
                "resolveReferencesForJzodSchemaAndValueObject for union called on object attribute '"+
                a[0] +
                "' found schema:" + JSON.stringify(foundAttributeJzodSchema, null, 2)
              );
              if (foundAttributeJzodSchema) {
                const subSchema = resolveReferencesForJzodSchemaAndValueObject(
                  miroirFundamentalJzodSchema,
                  foundAttributeJzodSchema,
                  a[1],
                  currentModel,
                  miroirMetaModel,
                  relativeReferenceJzodContext
                );
                if (subSchema.status == "ok") {
                  log.info(
                    "resolveReferencesForJzodSchemaAndValueObject returning for union object attribute '" +
                    a[0] +
                    "' schema:", JSON.stringify(subSchema, null, 2)
                  );
                  return [a[0], subSchema.element];
                } else {
                  log.warn(
                    "resolveReferencesForJzodSchemaAndValueObject union object could not resovle type for attribute '" +
                    a[0] +
                    "' error:", JSON.stringify(subSchema, null, 2)
                  );
                  return [a[0], { type: "simpleType", definition: "never" }];
                }
              } else {
                log.warn(
                  "resolveReferencesForJzodSchemaAndValueObject union object could not find schema for attribute '" +
                  a[0] +
                  "' object Schema:", JSON.stringify(currentSubDiscriminatedObjectJzodSchema, null, 2)
                );
              return [a[0], { type: "simpleType", definition: "never" }];
              }
            })
          );

          if (currentSubDiscriminatedObjectJzodSchema) {
            return { status: "ok", element: { type: "object", definition: objectJzodSchemaDefintion } };
          } else {
            return {
              status: "error",
              error:
                "resolveReferencesForJzodSchemaAndValueObject could not find string type in resolved union " +
                JSON.stringify(concreteJzodSchemas, null, 2),
            };
          }
        }
        case "function":
        case "number":
        case "bigint":
        case "boolean":
        case "symbol":
        case "undefined": {

          // break;
        }
        default: {
          throw new Error("resolveReferencesForJzodSchemaAndValueObject could not resolve type for union with valueObject " + valueObject);
          break;
        }
      }     
      // break;
    }
    case "record": {
      if ( typeof valueObject != "object") {
        throw new Error(
          "resolveReferencesForJzodSchemaAndValueObject object schema " +
            JSON.stringify(jzodSchema) +
            " for value " +
            JSON.stringify(valueObject)
        );
      }
      const definition: {[k:string]: JzodElement} = Object.fromEntries(
        Object.entries(valueObject).map(
          (e: [string, any]) => {
            const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
              miroirFundamentalJzodSchema,
              jzodSchema.definition,
              e[1],
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element,
              ]
            } else {
              log.warn(
                "resolveReferencesForJzodSchemaAndValueObject record could not find schema for attribute '" +
                e[0] +
                "' error:", JSON.stringify(resultSchemaTmp, null, 2)
              );
            return [e[0],{ type: "simpleType", definition: "never" }]
            }
          }
        ) as [string, JzodElement][]
      );
      // log.info("resolveReferencesForJzodSchemaAndValueObject record, converting to object definition", JSON.stringify(definition, null, 2))
      return {status: "ok", element: { type: "object", definition } };
    }
    case "literal": {
      if (valueObject == jzodSchema.definition)  {
        return { status: "ok", element: jzodSchema };
      } else {
        return {
          status: "error",
          error:
            "resolveReferencesForJzodSchemaAndValueObject could not find literal type in resolved union " +
            JSON.stringify(valueObject, null, 2) +
            " jzodSchema=" +
            JSON.stringify(jzodSchema, null, 2),
        };
      }
      break;
    }
    case "enum": {
      if (jzodSchema.definition.includes(valueObject)) {
        // return { status: "ok", element: { type: "literal", definition: valueObject} };
        return { status: "ok", element: jzodSchema };
      } else {
        return {
          status: "error",
          error:
            "resolveReferencesForJzodSchemaAndValueObject enum could not find string type in resolved union " +
            JSON.stringify(jzodSchema.definition, null, 2) +
            " valueObject " +
            valueObject,
        };
      }
    }
    case "tuple": {
      return {
        status: "error",
        error: "resolveReferencesForJzodSchemaAndValueObject can not handle tuple schema " +
        JSON.stringify(jzodSchema) +
        " for value " +
        JSON.stringify(valueObject)
      }
      break;
    }
    case "array": {
      if ( !Array.isArray(valueObject)) {
        return {
          status: "error",
          error: "resolveReferencesForJzodSchemaAndValueObject array schema " +
          JSON.stringify(jzodSchema) +
          " for value " +
          JSON.stringify(valueObject)
        }
      }
      if (jzodSchema.definition.type == "schemaReference") {
        // TODO: for now, we take the type of the first array element, for union types this should be a tuple of effective types!
        const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
          miroirFundamentalJzodSchema,
          jzodSchema.definition,
          valueObject[0],
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        )
        // return resultSchemaTmp;
        if (resultSchemaTmp.status == "ok") {
          return { status: "ok", element: { type: "array", definition: resultSchemaTmp.element } }
        } else {
          // return resultSchemaTmp;
          return resultSchemaTmp;
        }
        
      } else {
        return {status: "ok", element: jzodSchema};
      }

      break;
    }
    case "intersection":
    case "promise":
    case "set":
    case "function":
    case "map":
    case "simpleType":
    case "lazy": {
      return {status: "ok", element: jzodSchema}
    }
    default: {
      throw new Error(
        "resolveReferencesForJzodSchemaAndValueObject could not resolve schemaReferences for valueObject " +
          JSON.stringify(valueObject, undefined, 2) +
          " and schema " +
          JSON.stringify(jzodSchema)
      );
      break;
    }
  }
}

// ################################################################################################
export function resolveJzodSchemaReference2(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodReference: JzodReference,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): JzodElement {
  // const fundamentalJzodSchemas = miroirFundamentalJzodSchema.definition.context
  // const absoluteReferences: {[k:string]: JzodElement} = (currentModel
  //   // ? (currentModel as any).jzodSchemas
  //   // : []
  //   ? {...(miroirFundamentalJzodSchema.definition.context), ...(currentModel as any).jzodSchemas} // very inefficient!
  //   : {...miroirFundamentalJzodSchema.definition.context}
  // )
  const absoluteReferences = (currentModel
    // ? (currentModel as any).jzodSchemas
    // : []
    ? [miroirFundamentalJzodSchema, ...(currentModel as any).jzodSchemas, ...(miroirMetaModel as any).jzodSchemas] // very inefficient!
    : [miroirFundamentalJzodSchema]
  )
  const absoluteReferenceTargetJzodSchema: { [k: string]: JzodElement } = jzodReference?.definition.absolutePath
    ? absoluteReferences.find((s: JzodSchema) => s.uuid == jzodReference?.definition.absolutePath)?.definition
        .context ?? {}
    : relativeReferenceJzodContext ?? jzodReference;

  const targetJzodSchema: JzodElement | undefined = jzodReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema[jzodReference?.definition.relativePath]
    : { type: "object", definition: absoluteReferenceTargetJzodSchema };


    // console.log(
    //   "resolveJzodSchemaReference2 for reference",
    //   jzodReference.definition.absolutePath,
    //   jzodReference.definition.relativePath,
    //   "result",
    //   targetJzodSchema,
    //   // "currentModel",
    //   // currentModel,
    //   // "miroirFundamentalJzodSchema", 
    //   // miroirFundamentalJzodSchema,
    //   // "absoluteReferenceTargetJzodSchema",
    //   // absoluteReferenceTargetJzodSchema,
    //   // "relativeReferenceJzodContext",
    //   // relativeReferenceJzodContext
    // );

  if (!targetJzodSchema) {
    console.error(
      "resolveJzodSchemaReference2 failed for jzodSchema",
      jzodReference,
      "result",
      targetJzodSchema,
      "currentModel",
      currentModel,
      "miroirFundamentalJzodSchema", 
      miroirFundamentalJzodSchema,
      "absoluteReferenceTargetJzodSchema",
      absoluteReferenceTargetJzodSchema,
      "relativeReferenceJzodContext",
      relativeReferenceJzodContext
    );
    throw new Error(
      "resolveJzodSchemaReference2 could not resolve reference " +
        JSON.stringify(jzodReference) +
        " absoluteReferences" +
        absoluteReferences
    );
  }

  return targetJzodSchema;
}
// ################################################################################################
export function resolveJzodSchemaReference(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodReference?: JzodReference,
  currentModel?: MetaModel,
  relativeReferenceJzodContext?: JzodObject | JzodReference,
): JzodElement {
  // const fundamentalJzodSchemas = miroirFundamentalJzodSchema.definition.context
  const absoluteReferences = (currentModel
    // ? (currentModel as any).jzodSchemas
    // : []
    ? [miroirFundamentalJzodSchema, ...(currentModel as any).jzodSchemas] // very inefficient!
    : [miroirFundamentalJzodSchema]
  )
  const absoluteReferenceTargetJzodSchema: JzodObject | JzodReference | undefined = jzodReference?.definition
    .absolutePath
    ? {
        type: "object",
        definition:
          absoluteReferences.find((s: JzodSchema) => s.uuid == jzodReference?.definition.absolutePath)?.definition.context ?? {},
      }
    : relativeReferenceJzodContext ?? jzodReference;
  const targetJzodSchema = jzodReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema?.type == "object" && absoluteReferenceTargetJzodSchema?.definition
      ? absoluteReferenceTargetJzodSchema?.definition[jzodReference?.definition.relativePath]
      : absoluteReferenceTargetJzodSchema?.type == "schemaReference" && absoluteReferenceTargetJzodSchema?.context
      ? absoluteReferenceTargetJzodSchema?.context[jzodReference?.definition.relativePath]
      : undefined
    : absoluteReferenceTargetJzodSchema;


  if (!targetJzodSchema) {
    console.error(
      "resolveJzodSchemaReference failed for jzodSchema",
      jzodReference,
      "result",
      targetJzodSchema,
      " absoluteReferences", 
      absoluteReferences,
      "absoluteReferenceTargetJzodSchema",
      absoluteReferenceTargetJzodSchema,
      "currentModel",
      currentModel,
      "rootJzodSchema",
      relativeReferenceJzodContext
    );
    throw new Error("resolveJzodSchemaReference could not resolve reference " + JSON.stringify(jzodReference) + " absoluteReferences" + absoluteReferences);
  }

  return targetJzodSchema;
}

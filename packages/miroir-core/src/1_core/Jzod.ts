// import { JzodElement, JzodObject, JzodReference } from "@miroir-framework/jzod-ts";
import { getMiroirFundamentalJzodSchema } from "../0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema";
import {
  EntityDefinition,
  JzodElement,
  JzodObject,
  JzodReference,
  JzodSchema,
  MetaModel,
  jzodElement,
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

// #####################################################################################################
export function resolveReferencesForJzodSchemaAndValueObject(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodSchema: JzodElement,
  valueObject: any,
  currentModel?: MetaModel,
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
      const resultJzodSchema = resolveJzodSchemaReference2(miroirFundamentalJzodSchema, jzodSchema, currentModel, newContext)
      log.info(
        "resolveReferencesForJzodSchemaAndValueObject schemaReference resultJzodSchema",
        JSON.stringify(resultJzodSchema, null, 2),
        "valueObject",
        JSON.stringify(valueObject, null, 2)
      );
      return resolveReferencesForJzodSchemaAndValueObject(miroirFundamentalJzodSchema, resultJzodSchema, valueObject, currentModel, newContext);
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
        // throw new Error(
        //   "resolveReferencesForJzodSchemaAndValueObject object schema " +
        //     JSON.stringify(jzodSchema) +
        //     " for value " +
        //     JSON.stringify(valueObject)
        // );
      }

      const resolvedObjectEntries:[string, JzodElement][] = Object.entries(valueObject).map(
        (e: [string, any]) => {
          let resultSchema
          if (jzodSchema.definition[e[0]]) {
            const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
              miroirFundamentalJzodSchema,
              jzodSchema.definition[e[0]],
              e[1],
              currentModel,
              relativeReferenceJzodContext
            )
            log.info("resolveReferencesForJzodSchemaAndValueObject object attribute",e,"result",resultSchemaTmp)
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element,
              ]
            } else {
              return [e[0],{ type: "simpleType", definition: "never" }]
            }
          } else {
            throw new Error(
              "resolveReferencesForJzodSchemaAndValueObject error on resolving object, valueObject attribute " +
                e[0] +
                " not present in definition of type " +
                JSON.stringify(jzodSchema)
            );
          }
        } 
      );
      log.info("resolveReferencesForJzodSchemaAndValueObject object resolved entries result",resolvedObjectEntries)

      // TODO: inheritance!!!
      const result = {
        ...jzodSchema,
        definition: Object.fromEntries(resolvedObjectEntries),
      } as JzodElement;
      log.info("resolveReferencesForJzodSchemaAndValueObject object result", JSON.stringify(result, null, 2))
      return {status: "ok", element: result};
      break;
    }
    case "union":{
      const concreteJzodSchemas = jzodSchema.definition.map((a: JzodElement) =>
        a.type == "schemaReference" ? resolveJzodSchemaReference2(miroirFundamentalJzodSchema, a, currentModel, relativeReferenceJzodContext) : a
      );
      log.info(
        "resolveReferencesForJzodSchemaAndValueObject called for union",
        // " unresolved types",
        // JSON.stringify(jzodSchema, null, 2),
        "resolved type:",
        JSON.stringify(concreteJzodSchemas, null, 2)
      );
      switch (typeof valueObject) {
        case "string": {
          const resultJzodSchema = concreteJzodSchemas.find(a => a.type == "simpleType" && a.definition == "string")
          if (resultJzodSchema) {
            log.info("resolveReferencesForJzodSchemaAndValueObject found for union string returning type: " + JSON.stringify(resultJzodSchema, null, 2));
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
          log.info(
            "resolveReferencesForJzodSchemaAndValueObject called for union-type value object:",
            JSON.stringify(valueObject, null, 2)
          );
          const currentObjectJzodSchema = valueObject.type
            ? concreteJzodSchemas.find(
                (a) =>
                  a.type == "object" &&
                  a.definition.type.type == "literal" &&
                  a.definition.type.definition == valueObject.type
              ) // TDOD: use discriminator attribute for object, not "type"!
            : concreteJzodSchemas.find((a) => a.type == "object")
          ; // TODO: this works only if there is exactly one object type in the union!

          log.info(
            "resolveReferencesForJzodSchemaAndValueObject found for union object resolved type: " +
              JSON.stringify(currentObjectJzodSchema, null, 2)
          );

          const objectJzodSchemaDefintion = Object.fromEntries(
            Object.entries(valueObject).map((a: [string, any]) => {
              const foundAttributeJzodSchema = (currentObjectJzodSchema?.definition ?? ({} as any))[a[0]];
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
                  return [a[0], { type: "simpleType", definition: "never" }];
                }
              } else {
                return [a[0], { type: "simpleType", definition: "never" }];
              }
            })
          );

          if (currentObjectJzodSchema) {
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
              relativeReferenceJzodContext
            )
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element,
              ]
            } else {
              return [e[0],{ type: "simpleType", definition: "never" }]
            }
          }
        ) as [string, JzodElement][]
      );
      log.info("resolveReferencesForJzodSchemaAndValueObject record, converting to object definition", JSON.stringify(definition, null, 2))
      return {status: "ok", element: { type: "object", definition } };
    }
    case "literal": {
      if (valueObject ==jzodSchema.definition)  {
        return { status: "ok", element: jzodSchema };
        // switch (typeof valueObject) {
        //   case "string":{
        //     return { status: "ok", element: { type: "simpleType", definition: "string"} }
        //   }
        //   case "number":{
        //     return { status: "ok", element: { type: "simpleType", definition: "number"} }
        //   }
        //   case "bigint": {
        //     return { status: "ok", element: { type: "simpleType", definition: "bigint"} }
        //   }
        //   case "boolean": {
        //     return { status: "ok", element: { type: "simpleType", definition: "boolean"} }
        //   }
        //   case "symbol":
        //   case "undefined":
        //   case "object":
        //   case "function": {
        //     return {
        //       status: "error",
        //       error:
        //         "resolveReferencesForJzodSchemaAndValueObject wrong literal type for valueObject " +
        //         JSON.stringify(valueObject, null, 2) +
        //         " jzodSchema=" +
        //         JSON.stringify(jzodSchema, null, 2),
        //     };
        //     break;
        //   }
        //   default: {
        //     throw new Error("resolveReferencesForJzodSchemaAndValueObject default type for literal with valueObject " + valueObject);
        //     break;
        //   }
        // }
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
    case "array": {
      if ( !Array.isArray(valueObject)) {
        throw new Error(
          "resolveReferencesForJzodSchemaAndValueObject array schema " +
            JSON.stringify(jzodSchema) +
            " for value " +
            JSON.stringify(valueObject)
        );
      }
      if (jzodSchema.definition.type == "schemaReference") {
        const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
          miroirFundamentalJzodSchema,
          jzodSchema.definition,
          valueObject,
          currentModel,
          relativeReferenceJzodContext
        )
        return resultSchemaTmp;
        // if (resultSchemaTmp.status == "ok") {
        //   return resultSchemaTmp;
        // } else {
        //   return { type: "simpleType", definition: "never" }
        // }
        
      } else {
        return {status: "ok", element: jzodSchema};
      }

      // break;
    }
    case "intersection":
    case "promise":
    case "set":
    case "tuple":
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
    ? [miroirFundamentalJzodSchema, ...(currentModel as any).jzodSchemas] // very inefficient!
    : [miroirFundamentalJzodSchema]
  )
  const absoluteReferenceTargetJzodSchema: {[k:string]: JzodElement} = jzodReference?.definition
    .absolutePath
    ? absoluteReferences.find((s: JzodSchema) => s.uuid == jzodReference?.definition.absolutePath)?.definition.context ?? {}
    : relativeReferenceJzodContext ?? jzodReference;
  const targetJzodSchema: JzodElement | undefined = jzodReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema[jzodReference?.definition.relativePath]:{ type: "object", definition: absoluteReferenceTargetJzodSchema};


  if (!targetJzodSchema) {
    console.error(
      "JzodElementEditor resolveJzodSchemaReference2 failed for jzodSchema",
      jzodReference,
      "result",
      targetJzodSchema,
      " absoluteReferences", 
      absoluteReferences,
      "absoluteReferenceTargetJzodSchema",
      absoluteReferenceTargetJzodSchema,
      "currentModel",
      currentModel,
      "relativeReferenceJzodContext",
      relativeReferenceJzodContext
    );
    throw new Error("resolveJzodSchemaReference could not resolve reference " + JSON.stringify(jzodReference) + " absoluteReferences" + absoluteReferences);
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
      "JzodElementEditor resolveJzodSchemaReference failed for jzodSchema",
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

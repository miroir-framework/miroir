import { JzodElement, JzodObject, JzodReference } from "@miroir-framework/jzod-ts";
import { JzodSchema, MetaModel, jzodElement } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
// import {miroirFundamentalJzodSchema} from "../0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema";
// import miroirFundamentalJzodSchema from "../../dist/index.js";
// import { miroirFundamentalJzodSchema } from "miroir-core";
// import { miroirFundamentalJzodSchema } from "../../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema.js";
// import miroirFundamentalJzodSchema from "../../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema.js";
// import * as f from "../../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema.js";
import {miroirFundamentalJzodSchema} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
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
      const resultJzodSchema = resolveJzodSchemaReference2(jzodSchema, currentModel, newContext)
      log.info(
        "resolveReferencesForJzodSchemaAndValueObject schemaReference resultJzodSchema",
        JSON.stringify(resultJzodSchema, null, 2),
        "valueObject",
        JSON.stringify(valueObject, null, 2)
      );
      return resolveReferencesForJzodSchemaAndValueObject(resultJzodSchema, valueObject, currentModel, newContext);
      break;
    }
    case "object": {
      if ( typeof valueObject != "object") {
        throw new Error(
          "resolveReferencesForJzodSchemaAndValueObject object schema " +
            JSON.stringify(jzodSchema) +
            " for value " +
            JSON.stringify(valueObject)
        );
      }
      // TODO: inheritance!!!
      const result = {
        ...jzodSchema,
        definition: Object.fromEntries(
          Object.entries(valueObject).map(
            (e: [string, any]) => {
              let resultSchema
              if (jzodSchema.definition[e[0]]) {
                const resultSchemaTmp = resolveReferencesForJzodSchemaAndValueObject(
                  jzodSchema.definition[e[0]],
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
            }
          ) as [string, JzodElement][]
        ),
      } as JzodElement;
      log.info("resolveReferencesForJzodSchemaAndValueObject object result", JSON.stringify(result, null, 2))
      return {status: "ok", element: result};
      break;
    }
    case "union":{
      log.info("resolveReferencesForJzodSchemaAndValueObject called for union unresolved types: " + JSON.stringify(jzodSchema, null, 2))
      const concreteJzodSchemas = jzodSchema.definition.map((a: JzodElement) =>
        a.type == "schemaReference" ? resolveJzodSchemaReference2(a, currentModel, relativeReferenceJzodContext) : a
      );
      switch (typeof valueObject) {
        case "string": {
          const resultJzodSchema = concreteJzodSchemas.find(a => a.type == "simpleType" && a.definition == "string")
          if (resultJzodSchema) {
            return { status: "ok", element: resultJzodSchema}
          } else {
            return { status: "error", error: "resolveReferencesForJzodSchemaAndValueObject could not find string type in resolved union " + JSON.stringify(concreteJzodSchemas, null, 2)}
          }
          break;
        }
        case "object": {
          log.info("resolveReferencesForJzodSchemaAndValueObject called for union object unresolved types: " + JSON.stringify(jzodSchema, null, 2))
          const currentObjectJzodSchema = concreteJzodSchemas.find(a => a.type == "object") // TDOD: this works only if there is exactly one object type in the union!
          log.info("resolveReferencesForJzodSchemaAndValueObject found for union object resolved type: " + JSON.stringify(currentObjectJzodSchema, null, 2));

          const objectJzodSchemaDefintion = Object.fromEntries(
            Object.entries(valueObject).map(
              (a: [string, any]) => {
                const foundAttributeJzodSchema = (currentObjectJzodSchema?.definition??{} as any)[a[0]];
                if (foundAttributeJzodSchema) {
                  const subSchema = resolveReferencesForJzodSchemaAndValueObject(
                    foundAttributeJzodSchema,
                    a[1],
                    currentModel,
                    relativeReferenceJzodContext
                  );
                  if (subSchema.status == "ok") {
                    log.info("resolveReferencesForJzodSchemaAndValueObject returning for union object schema: " + JSON.stringify(subSchema, null, 2));
                    return [a[0], subSchema.element]  
                  } else {
                    return [a[0], { type: "simpleType", definition: "never"}]  
                  }
                } else {
                  return [a[0], { type: "simpleType", definition: "never"}]  
                }
              }
            )
          )
           
          if (currentObjectJzodSchema) {
            return { status: "ok", element: { type: "object", definition: objectJzodSchemaDefintion} }
          } else {
            return { status: "error", error: "resolveReferencesForJzodSchemaAndValueObject could not find string type in resolved union " + JSON.stringify(concreteJzodSchemas, null, 2)}
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
    case "intersection":
    case "promise":
    case "set":
    case "tuple":
    case "function":
    case "array":
    case "map":
    case "simpleType":
    case "enum":
    case "lazy":
    case "literal": {
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
  jzodReference?: JzodReference,
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

// import { JzodElement, JzodObject, JzodReference } from "@miroir-framework/jzod-ts";
import {
  JzodElement,
  JzodObject,
  JzodSchema,
  MetaModel
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { resolveJzodSchemaReferenceInContext, resolveObjectExtendClause } from "./JzodUnfoldSchemaForValue";
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


// export function resolveObjectExtendClause(
//   miroirFundamentalJzodSchema: JzodSchema,
//   jzodObject: JzodObject,
//   currentModel?: MetaModel,
//   miroirMetaModel?: MetaModel,
//   relativeReferenceJzodContext?: {[k:string]: JzodElement},
// ): JzodObject {
//   // if (j.type == "object") {
//     if (jzodObject.extend) {
//       // const extension = resolveJzodSchemaReferenceInContext(
//       const extension:JzodElement = resolveJzodSchemaReferenceInContext(
//         miroirFundamentalJzodSchema,
//         jzodObject.extend,
//         currentModel,
//         miroirMetaModel,
//         relativeReferenceJzodContext
//       )
//       if (extension.type == "object") {
//         return {
//           type: "object",
//           definition: {
//             ...extension.definition,
//             ...jzodObject.definition
//           }
//         }
//       } else {
//         throw new Error(
//           "unfoldJzodSchemaOnce object extend clause schema " +
//             JSON.stringify(jzodObject) +
//             " is not an object " +
//             JSON.stringify(extension)
//         );
//         // return ({
//         //   status: "error",
//         //   error: "unfoldJzodSchemaOnce object extend clause schema " +
//         //       JSON.stringify(jzodSchema) +
//         //       " is not an object " +
//         //       JSON.stringify(extension)
//         // })
//       }
//     } else {
//       return jzodObject
//     }
//   // } else {
//   //   return j;
//   // }
// }

// ################################################################################################
export function localizeJzodSchemaReferenceContext<T extends JzodElement>(
  miroirFundamentalJzodSchema: JzodSchema,
  // jzodReference: JzodReference,
  jzodElement: T,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): T {
// ): JzodElement {
  const absoluteReferences = (currentModel
    ? [miroirFundamentalJzodSchema, ...(currentModel as any).jzodSchemas, ...(miroirMetaModel as any).jzodSchemas] // very inefficient!
    : [miroirFundamentalJzodSchema]
  )
  // const absoluteReferenceTargetJzodSchema: { [k: string]: JzodElement } = jzodReference?.definition.absolutePath
  //   ? absoluteReferences.find((s: JzodSchema) => s.uuid == jzodReference?.definition.absolutePath)?.definition
  //       .context ?? {}
  //   : relativeReferenceJzodContext ?? jzodReference;

  // const targetJzodSchema: JzodElement | undefined = jzodReference?.definition.absolutePath?
  // jzodReference: jzodReference?.definition.relativePath
  //   ? {
  //     type: "schemaReference"
  //   }jzodReference?.definition.relativePath]
  //   : { type: "object", definition: {} }; //error case, no absolute path nor relativePath. IS IT POSSIBLE??

  switch (jzodElement.type) {
    case "object": {
      // TODO: resolve extend clause
      return {
        ...jzodElement,
        definition: Object.fromEntries(
          Object.entries(jzodElement.definition).map(
            e => [e[0], localizeJzodSchemaReferenceContext(
              miroirFundamentalJzodSchema,
              e[1],
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )]
          )
        )
      }
    }
    case "schemaReference": {
      // in case of absolute reference: unfold?
      // in case of relative reference without added context: add context to reference found within context, for later unfolding
      const localizedContext = jzodElement.context?Object.fromEntries(
        Object.entries(jzodElement.context).map(
          e => [e[0], localizeJzodSchemaReferenceContext(
            miroirFundamentalJzodSchema,
            e[1],
            currentModel,
            miroirMetaModel,
            {...relativeReferenceJzodContext, ...jzodElement.context} // taking into account both the global context and the local context for resolution
          )]
        )
      ): relativeReferenceJzodContext // no local context found, resolution will be based only on passed global context
      ;

      log.info("localizeJzodSchemaReferenceContext for schemaReference defn", jzodElement.definition.relativePath,", found localizedContext", JSON.stringify(localizedContext, null, 2))
      const result = {
        ...jzodElement,
        context: localizedContext
        // context: {...relativeReferenceJzodContext, ...localizedContext}
      }
      log.info("localizeJzodSchemaReferenceContext for schemaReference defn", jzodElement.definition.relativePath,", found result", JSON.stringify(result, null, 2))
      return result
      break;
    }
    case "union": {
      return {
        ...jzodElement,
        definition: jzodElement.definition.map(
          e => localizeJzodSchemaReferenceContext(
            miroirFundamentalJzodSchema,
            e,
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          )
        )
      }
      break;
    }
    case "array": {
      return {
        ...jzodElement,
        definition: localizeJzodSchemaReferenceContext(
          miroirFundamentalJzodSchema,
          jzodElement.definition,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        )
      }
      break;
    }
    case "function":
    case "map":
    case "simpleType":
    case "enum":
    case "lazy":
    case "literal":
    case "intersection":
    case "promise":
    case "record":
    case "set":
    case "tuple": {
      return jzodElement
      break;
    }
    default: {
      return jzodElement
      break;
    }
  }
  

    // console.log(
    //   "resolveJzodSchemaReferenceInContext for reference",
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

  // if (!targetJzodSchema) {
  //   console.error(
  //     "resolveJzodSchemaReferenceInContext failed for jzodSchema",
  //     jzodReference,
  //     "result",
  //     targetJzodSchema,
  //     "absoluteReferences",
  //     absoluteReferences,
  //     "currentModel",
  //     currentModel,
  //     "miroirFundamentalJzodSchema", 
  //     miroirFundamentalJzodSchema,
  //     "absoluteReferenceTargetJzodSchema",
  //     absoluteReferenceTargetJzodSchema,
  //     "relativeReferenceJzodContext",
  //     relativeReferenceJzodContext
  //   );
  //   throw new Error(
  //     "resolveJzodSchemaReferenceInContext could not resolve reference " +
  //       JSON.stringify(jzodReference) +
  //       // " absoluteReferences" +
  //       // JSON.stringify(absoluteReferences)
  //       "relativeReferenceJzodContext" +
  //       JSON.stringify(relativeReferenceJzodContext)
  
  //   );
  // }

  // return targetJzodSchema;
}


let dummy: any;
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
export function unfoldJzodSchemaOnce(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodSchema: JzodElement,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): ResolvedJzodSchemaReturnType {
  log.info(
    "unfoldJzodSchemaOnce called for schema",
    JSON.stringify(jzodSchema, null, 2)
  );

  switch (jzodSchema?.type) {
    case "schemaReference": {
      // const newContext = {...relativeReferenceJzodContext, ...jzodSchema.context}
      const unfoldedReferenceJzodSchema = localizeJzodSchemaReferenceContext(
        miroirFundamentalJzodSchema,
        jzodSchema,
        currentModel,
        miroirMetaModel,
        {...relativeReferenceJzodContext, ...jzodSchema.context}
      );

      log.info("unfoldJzodSchemaOnce unfoldedReferenceJzodSchema", JSON.stringify(unfoldedReferenceJzodSchema, null, 2));
      const resultJzodSchema = resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        {type: "schemaReference", context: unfoldedReferenceJzodSchema.context, definition:jzodSchema.definition},
        currentModel,
        miroirMetaModel,
        // relativeReferenceJzodContext
        {...relativeReferenceJzodContext, ...unfoldedReferenceJzodSchema.context} // local context (unfoldedReferenceJzodSchema.context) is not taken into account by resolveJzodSchemaReferenceInContext
      )
      // log.info(
      //   "unfoldJzodSchemaOnce schemaReference resultJzodSchema",
      //   JSON.stringify(resultJzodSchema, null, 2),
      //   "valueObject",
      //   JSON.stringify(valueObject, null, 2)
      // );

      return { status: "ok", element: resultJzodSchema};
      // return unfoldJzodSchemaOnce(
      //   miroirFundamentalJzodSchema,
      //   resultJzodSchema,
      //   // valueObject,
      //   currentModel,
      //   miroirMetaModel,
      //   newContext
      // );
      break;
    }
    case "object": {
      // if ( typeof valueObject != "object") {
      //   return ({
      //     status: "error",
      //     error: "unfoldJzodSchemaOnce object schema " +
      //         JSON.stringify(jzodSchema) +
      //         " for value " +
      //         JSON.stringify(valueObject)
      //   })
      // }

      let extendedJzodSchema: JzodObject
      if (jzodSchema.extend) {
        // const extension = resolveJzodSchemaReferenceInContext(
        const extension = resolveJzodSchemaReferenceInContext(
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
            "unfoldJzodSchemaOnce object extend clause schema " +
              JSON.stringify(jzodSchema) +
              " is not an object " +
              JSON.stringify(extension)
          );
          // return ({
          //   status: "error",
          //   error: "unfoldJzodSchemaOnce object extend clause schema " +
          //       JSON.stringify(jzodSchema) +
          //       " is not an object " +
          //       JSON.stringify(extension)
          // })
        }
      } else {
        extendedJzodSchema = jzodSchema
      }
      // log.info("unfoldJzodSchemaOnce object extendedJzodSchema",extendedJzodSchema)

      // const resolvedObjectEntries:[string, JzodElement][] = [];
      const resolvedObjectEntries:[string, JzodElement][] = Object.entries(extendedJzodSchema.definition).map(
        (e: [string, any]) => {
          if (extendedJzodSchema.definition[e[0]]) {
            const resultSchemaTmp = unfoldJzodSchemaOnce(
              miroirFundamentalJzodSchema,
              // extendedJzodSchema.definition[e[0]],
              e[1],
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )
            // log.info("unfoldJzodSchemaOnce object attribute",e,"result",resultSchemaTmp)
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element,
              ]
            } else {
              // return resultSchemaTmp;
              log.warn(
                "unfoldJzodSchemaOnce error on resolving object attribute " +
                  e[0] +
                  " not present in definition of (extend resolved) type " +
                  JSON.stringify(extendedJzodSchema) +
                  // " valueObject " +
                  // JSON.stringify(valueObject) +
                  " found error: " + resultSchemaTmp.error
              );
              return [e[0],{ type: "simpleType", definition: "never" }]
            }
          } else {
            // TODO: RETURN AN ERROR ResolvedJzodSchemaReturnTypeError
            log.warn(
              {
                error: "unfoldJzodSchemaOnce error on resolving object, valueObject attribute " +
                e[0] +
                " not present in definition of type " +
                JSON.stringify(extendedJzodSchema)
                // " valueObject " + 
                // JSON.stringify(valueObject)
              })
            return [e[0],{ type: "simpleType", definition: "never" }]
          }
        } 
      );
      log.info("unfoldJzodSchemaOnce object resolved entries result",resolvedObjectEntries)

      // TODO: inheritance!!!
      const resultElement = {
        ...extendedJzodSchema,
        definition: Object.fromEntries(resolvedObjectEntries),
      } as JzodElement;
      // log.info("unfoldJzodSchemaOnce object result", JSON.stringify(result, null, 2))
      return {status: "ok", element: resultElement};
      break;
    }
    // ############################################################################################
    case "union":{
      // const unfoldedJzodSchemas: JzodElement[] = jzodSchema.definition.map((a: JzodElement) =>
      const unfoldedJzodSchemaReturnType: ResolvedJzodSchemaReturnType[] = jzodSchema.definition.map((a: JzodElement) =>
        unfoldJzodSchemaOnce(
          miroirFundamentalJzodSchema,
          a,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        )
      );
      const failedIndex = unfoldedJzodSchemaReturnType.find(a => a.status!="ok")
      if (failedIndex) {
        return {
          status: "error",
          error:
            "unfoldJzodSchemaOnce failed for union " +
            JSON.stringify(failedIndex, null, 2),
        };
      }
      const unfoldedJzodSchemas: JzodElement[] = (unfoldedJzodSchemaReturnType as ResolvedJzodSchemaReturnTypeOK[]).map((a: ResolvedJzodSchemaReturnTypeOK) =>a.element)
      return { status: "ok", element: { ...jzodSchema, definition: unfoldedJzodSchemas}}
      // const concreteJzodSchemas: JzodElement[] = jzodSchema.definition.map((a: JzodElement) =>
      //   a.type == "schemaReference"
      //     ? resolveJzodSchemaReferenceInContext(
      //         miroirFundamentalJzodSchema,
      //         a,
      //         currentModel,
      //         miroirMetaModel,
      //         relativeReferenceJzodContext
      //       )
      //     : a
      // );
      // const concreteUnrolledJzodSchemas: JzodElement[] = concreteJzodSchemas.map((j: JzodElement) => {
      //   if (j.type == "object") {
      //     return resolveObjectExtendClause(
      //       miroirFundamentalJzodSchema,
      //       j,
      //       currentModel,
      //       miroirMetaModel,
      //       relativeReferenceJzodContext
      //     );
      //   } else {
      //     return j;
      //   }
      // });

      // return {
      //   status: "error",
      //   error:
      //     "unfoldJzodSchemaOnce not implemented case for union " +
      //     JSON.stringify(concreteJzodSchemas, null, 2),
      // };

      // log.info(
      //   "unfoldJzodSchemaOnce called for union",
      //   "concreteUnrolledJzodSchemas resolved type:",
      //   JSON.stringify(concreteUnrolledJzodSchemas, null, 2)
      // );
      // switch (typeof valueObject) {
      //   case "string": {
      //     // TODO: the following line may introduce some non-determinism, in the case many records actually match the "find" predicate! BAD!
      //     const resultJzodSchema = concreteJzodSchemas.find(
      //       (a) =>
      //         (a.type == "simpleType" && a.definition == "string") ||
      //         (a.type == "literal" && a.definition == valueObject)
      //     );
      //     if (resultJzodSchema) {
      //       // log.info("unfoldJzodSchemaOnce found for union string returning type: " + JSON.stringify(resultJzodSchema, null, 2));
      //       return { status: "ok", element: resultJzodSchema}
      //     } else {
      //       return {
      //         status: "error",
      //         error:
      //           "unfoldJzodSchemaOnce could not find string type in resolved union " +
      //           JSON.stringify(concreteJzodSchemas, null, 2),
      //       };
      //     }
      //     break;
      //   }
      //   case "object": {
      //     const discriminator = jzodSchema.discriminator??"_undefined_"
      //     const subDiscriminator = jzodSchema.subDiscriminator??"_undefined_"

      //     // log.info(
      //     //   "unfoldJzodSchemaOnce called for union-type value object with discriminator=",
      //     //   discriminator,
      //     //   " subdiscriminator=",
      //     //   subDiscriminator,
      //     //   ", valueObject[discriminator]=",
      //     //   valueObject[discriminator],
      //     //   ", valueObject[subDiscriminator]=",
      //     //   valueObject[subDiscriminator]
      //     // );

      //     const objectUnionChoices = concreteUnrolledJzodSchemas.filter(j => j.type == "object")
      //     if (objectUnionChoices.length == 1) {
      //       // only possible object choice, no need for a discriminator
      //       const subElementSchema = unfoldJzodSchemaOnce(
      //         miroirFundamentalJzodSchema,
      //         objectUnionChoices[0],
      //         valueObject,
      //         currentModel,
      //         miroirMetaModel,
      //         relativeReferenceJzodContext
      //       );
      //       return subElementSchema;
      //     }

      //     if (!valueObject[discriminator]) {
      //       throw new Error(
      //         "unfoldJzodSchemaOnce called for union-type value object with discriminator=" +
      //           jzodSchema.discriminator +
      //           " valueObject[discriminator] is undefined! valueObject=" +
      //           JSON.stringify(valueObject, null, 2)
      //       );
      //     }

      //     const currentDiscriminatedObjectJzodSchemas = concreteUnrolledJzodSchemas.filter(
      //           (a) =>
      //             a.type == "object" &&
      //             a.definition[discriminator].type == "literal" &&
      //             a.definition[discriminator].definition == valueObject[discriminator]
      //         ) // TDOD: use discriminator attribute for object, not "type"!
      //     ; // TODO: this works only if there is exactly one object type in the union!

      //     // log.info(
      //     //   "unfoldJzodSchemaOnce found for union object resolved type: " +
      //     //     JSON.stringify(currentDiscriminatedObjectJzodSchemas, null, 2)
      //     // );

      //     if (currentDiscriminatedObjectJzodSchemas.length == 0) {
      //       throw new Error("unfoldJzodSchemaOnce called for union-type value object with discriminator=" +
      //       jzodSchema.discriminator + " valueObject[discriminator]=" + valueObject[discriminator] + " found no match!");
            
      //     }

      //     if (currentDiscriminatedObjectJzodSchemas.length > 1 && !jzodSchema.subDiscriminator) {
      //       throw new Error(
      //         "unfoldJzodSchemaOnce called for union-type value object with discriminator=" +
      //           jzodSchema.discriminator +
      //           " valueObject[discriminator]=" +
      //           valueObject[discriminator] +
      //           " found many matches=" +
      //           currentDiscriminatedObjectJzodSchemas +
      //           " and no subDiscriminator"
      //       );
      //     }

      //     const currentSubDiscriminatedObjectJzodSchemas = currentDiscriminatedObjectJzodSchemas.length == 1? currentDiscriminatedObjectJzodSchemas :
      //     currentDiscriminatedObjectJzodSchemas.filter(
      //      (a) => a.type == "object" &&
      //       a.definition[subDiscriminator].type == "literal" &&
      //       a.definition[subDiscriminator].definition == valueObject[subDiscriminator]
      //     )

      //     if (currentSubDiscriminatedObjectJzodSchemas.length != 1) {
      //       throw new Error(
      //         "unfoldJzodSchemaOnce called for union-type value object with discriminator=" +
      //           discriminator +
      //           " subDiscriminator=" +
      //           subDiscriminator + 
      //           ", valueObject[discriminator]=" +
      //           valueObject[discriminator] +
      //           ", valueObject[subDiscriminator]=" +
      //           valueObject[subDiscriminator] +
      //           " found no match or too many matches " +
      //           JSON.stringify(currentSubDiscriminatedObjectJzodSchemas)
      //       );
      //     }

      //     if (currentSubDiscriminatedObjectJzodSchemas[0].type != "object") {
      //       throw new Error(
      //         "unfoldJzodSchemaOnce called for union-type value object with discriminator=" +
      //           discriminator +
      //           + " subDiscriminator=" +
      //           subDiscriminator + 
      //           " valueObject[discriminator]=" +
      //           valueObject[discriminator] +
      //           " valueObject[subDiscriminator]=" +
      //           valueObject[subDiscriminator] +
      //           " found non-object schema " +
      //           JSON.stringify(currentSubDiscriminatedObjectJzodSchemas[0])
      //       );
      //     }

      //     const currentSubDiscriminatedObjectJzodSchema: JzodObject = currentSubDiscriminatedObjectJzodSchemas[0];
      //     const objectJzodSchemaDefintion = Object.fromEntries(
      //       Object.entries(valueObject).map((a: [string, any]) => {
      //         const foundAttributeJzodSchema = (currentSubDiscriminatedObjectJzodSchema?.definition ?? ({} as any))[a[0]];
      //         // log.info(
      //         //   "unfoldJzodSchemaOnce for union called on object attribute '"+
      //         //   a[0] +
      //         //   "' found schema:" + JSON.stringify(foundAttributeJzodSchema, null, 2)
      //         // );
      //         if (foundAttributeJzodSchema) {
      //           const subSchema = unfoldJzodSchemaOnce(
      //             miroirFundamentalJzodSchema,
      //             foundAttributeJzodSchema,
      //             a[1],
      //             currentModel,
      //             miroirMetaModel,
      //             relativeReferenceJzodContext
      //           );
      //           if (subSchema.status == "ok") {
      //             // log.info(
      //             //   "unfoldJzodSchemaOnce returning for union object attribute '" +
      //             //   a[0] +
      //             //   "' schema:", JSON.stringify(subSchema, null, 2)
      //             // );
      //             return [a[0], subSchema.element];
      //           } else {
      //             log.warn(
      //               "unfoldJzodSchemaOnce union object could not resovle type for attribute '" +
      //               a[0] +
      //               "' error:", JSON.stringify(subSchema, null, 2)
      //             );
      //             return [a[0], { type: "simpleType", definition: "never" }];
      //           }
      //         } else {
      //           log.warn(
      //             "unfoldJzodSchemaOnce union object could not find schema for attribute '" +
      //             a[0] +
      //             "' object Schema:", JSON.stringify(currentSubDiscriminatedObjectJzodSchema, null, 2)
      //           );
      //         return [a[0], { type: "simpleType", definition: "never" }];
      //         }
      //       })
      //     );

      //     if (currentSubDiscriminatedObjectJzodSchema) {
      //       return { status: "ok", element: { type: "object", definition: objectJzodSchemaDefintion } };
      //     } else {
      //       return {
      //         status: "error",
      //         error:
      //           "unfoldJzodSchemaOnce could not find string type in resolved union " +
      //           JSON.stringify(concreteJzodSchemas, null, 2),
      //       };
      //     }
      //   }
      //   case "function":
      //   case "number":
      //   case "bigint":
      //   case "boolean":
      //   case "symbol":
      //   case "undefined": {

      //     // break;
      //   }
      //   default: {
      //     throw new Error("unfoldJzodSchemaOnce could not resolve type for union with valueObject " + valueObject);
      //     break;
      //   }
      // }     
      break;
    }
    case "record": {
      const resultSchemaTmp: ResolvedJzodSchemaReturnType = unfoldJzodSchemaOnce(
        miroirFundamentalJzodSchema,
        jzodSchema.definition,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      )
      if (resultSchemaTmp.status == "ok") {
        const result: ResolvedJzodSchemaReturnType = { status: "ok", element: {type: "record", definition: resultSchemaTmp.element}}
        log.info("unfoldJzodSchemaOnce record, result", JSON.stringify(result, null, 2))
        return result
        // return { status: "ok", element: resultSchemaTmp.element}
      } else {
        log.warn(
          "unfoldJzodSchemaOnce record could not find schema for definition '" +
          jzodSchema.definition +
          "' error:", JSON.stringify(resultSchemaTmp, null, 2)
        );
        return { status: "ok", element: { type: "simpleType", definition: "never" } }
      }
      break;
    }
    case "literal": {
      return { status: "ok", element: jzodSchema };
      break;
    }
    case "enum": {
      return {
        status: "error",
        error:
          "unfoldJzodSchemaOnce not implemented case for enum " +
          JSON.stringify(jzodSchema, null, 2),
      };

      // if (jzodSchema.definition.includes(valueObject)) {
      //   // return { status: "ok", element: { type: "literal", definition: valueObject} };
      //   return { status: "ok", element: jzodSchema };
      // } else {
      //   return {
      //     status: "error",
      //     error:
      //       "unfoldJzodSchemaOnce enum could not find string type in resolved union " +
      //       JSON.stringify(jzodSchema.definition, null, 2) +
      //       " valueObject " +
      //       valueObject,
      //   };
      // }
    }
    case "tuple": {
      return {
        status: "error",
        error: "unfoldJzodSchemaOnce can not handle tuple schema " +
        JSON.stringify(jzodSchema)
      }
      break;
    }
    case "array": {
      return {
        status: "error",
        error:
          "unfoldJzodSchemaOnce not implemented case for array " +
          JSON.stringify(jzodSchema, null, 2),
      };
      // if ( !Array.isArray(valueObject)) {
      //   return {
      //     status: "error",
      //     error: "unfoldJzodSchemaOnce array schema " +
      //     JSON.stringify(jzodSchema) +
      //     " for value " +
      //     JSON.stringify(valueObject)
      //   }
      // }
      // const innerSchema = jzodSchema.definition.type == "schemaReference"?
      //   resolveJzodSchemaReferenceInContext(
      //     miroirFundamentalJzodSchema,
      //     jzodSchema.definition,
      //     currentModel,
      //     miroirMetaModel,
      //     relativeReferenceJzodContext
      //   )
      // : jzodSchema.definition
      // ;

      // if (innerSchema.type != "union") {
      //   return { status: "ok", element: { type: "array", definition: innerSchema } }
      // }

      // // innerSchema is a union type, we have to unfold each element to its own type and return a tuple type
      // const result: JzodElement[] = valueObject.map(
      //   (e:any) => {
      //     const resultSchemaTmp = unfoldJzodSchemaOnce(
      //       miroirFundamentalJzodSchema,
      //       innerSchema,
      //       e,
      //       currentModel,
      //       miroirMetaModel,
      //       relativeReferenceJzodContext
      //     )
      //     if (resultSchemaTmp.status == "ok") {
      //         return resultSchemaTmp.element
      //     } else {
      //       log.warn(
      //         "unfoldJzodSchemaOnce record could not find schema for array element '" +
      //         e +
      //         "' error:", JSON.stringify(resultSchemaTmp, null, 2)
      //       );
      //       return { type: "simpleType", definition: "never" }
      //     }
      //   }
      // );

      // return { status: "ok", element: { type: "tuple", definition: result } }


      // #############################???????!############################################
      // if (jzodSchema.definition.type == "schemaReference") {
      //   // TODO: for now, we take the type of the first array element, for union types this should be a tuple of effective types!
      //   const resultSchemaTmp = unfoldJzodSchemaOnce(
      //     miroirFundamentalJzodSchema,
      //     jzodSchema.definition,
      //     valueObject[0],
      //     currentModel,
      //     miroirMetaModel,
      //     relativeReferenceJzodContext
      //   )
      //   // return resultSchemaTmp;
      //   if (resultSchemaTmp.status == "ok") {
      //     if (resultSchemaTmp.element.type == "union") {
      //       // union type, we have to unfold each element to its own type and return a tuple type
          
      //     }
      //     return { status: "ok", element: { type: "array", definition: resultSchemaTmp.element } }
      //   } else {
      //     // return resultSchemaTmp;
      //     return resultSchemaTmp;
      //   }

        
      // } else {
      //   return {status: "ok", element: jzodSchema};
      // }
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
        "unfoldJzodSchemaOnce could not resolve schemaReferences once for " +
        JSON.stringify(jzodSchema)
      );
      break;
    }
  }
}


// // ################################################################################################
// export function resolveJzodSchemaReference(
//   miroirFundamentalJzodSchema: JzodSchema,
//   jzodReference?: JzodReference,
//   currentModel?: MetaModel,
//   relativeReferenceJzodContext?: JzodObject | JzodReference,
// ): JzodElement {
//   // const fundamentalJzodSchemas = miroirFundamentalJzodSchema.definition.context
//   const absoluteReferences = (currentModel
//     // ? (currentModel as any).jzodSchemas
//     // : []
//     ? [miroirFundamentalJzodSchema, ...(currentModel as any).jzodSchemas] // very inefficient!
//     : [miroirFundamentalJzodSchema]
//   )
//   const absoluteReferenceTargetJzodSchema: JzodObject | JzodReference | undefined = jzodReference?.definition
//     .absolutePath
//     ? {
//         type: "object",
//         definition:
//           absoluteReferences.find((s: JzodSchema) => s.uuid == jzodReference?.definition.absolutePath)?.definition.context ?? {},
//       }
//     : relativeReferenceJzodContext ?? jzodReference;
//   const targetJzodSchema = jzodReference?.definition.relativePath
//     ? absoluteReferenceTargetJzodSchema?.type == "object" && absoluteReferenceTargetJzodSchema?.definition
//       ? absoluteReferenceTargetJzodSchema?.definition[jzodReference?.definition.relativePath]
//       : absoluteReferenceTargetJzodSchema?.type == "schemaReference" && absoluteReferenceTargetJzodSchema?.context
//       ? absoluteReferenceTargetJzodSchema?.context[jzodReference?.definition.relativePath]
//       : undefined
//     : absoluteReferenceTargetJzodSchema;


//   if (!targetJzodSchema) {
//     console.error(
//       "resolveJzodSchemaReference failed for jzodSchema",
//       jzodReference,
//       "result",
//       targetJzodSchema,
//       " absoluteReferences", 
//       absoluteReferences,
//       "absoluteReferenceTargetJzodSchema",
//       absoluteReferenceTargetJzodSchema,
//       "currentModel",
//       currentModel,
//       "rootJzodSchema",
//       relativeReferenceJzodContext
//     );
//     throw new Error("resolveJzodSchemaReference could not resolve reference " + JSON.stringify(jzodReference) + " absoluteReferences" + absoluteReferences);
//   }

//   return targetJzodSchema;
// }

import {
  JzodElement,
  JzodObject,
  JzodSchema,
  MetaModel,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { mStringify } from "../../tools";
import { cleanLevel } from "../constants";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";
import { ResolvedJzodSchemaReturnType, ResolvedJzodSchemaReturnTypeOK } from "./jzodTypeCheck";

// export const miroirFundamentalJzodSchema2 = miroirFundamentalJzodSchema;
// import { miroirFundamentalJzodSchema } from "../tmp/src/0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Jzod")
).then((logger: LoggerInterface) => {log = logger});



export interface UnfoldJzodSchemaOnceReturnTypeOK {
  status: "ok",
  element: JzodElement
}
export interface UnfoldJzodSchemaOnceReturnTypeError {
  status: "error",
  error: string
}
export type UnfoldJzodSchemaOnceReturnType = UnfoldJzodSchemaOnceReturnTypeError | UnfoldJzodSchemaOnceReturnTypeOK;


// ################################################################################################
export function localizeJzodSchemaReferenceContext<T extends JzodElement>(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodElement: T,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): T {
  // const absoluteReferences = (currentModel
  //   ? [miroirFundamentalJzodSchema, ...(currentModel as any).jzodSchemas, ...(miroirMetaModel as any).jzodSchemas] // very inefficient!
  //   : [miroirFundamentalJzodSchema]
  // )

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

      // log.info("localizeJzodSchemaReferenceContext for schemaReference defn", jzodElement.definition.relativePath,", found localizedContext", JSON.stringify(localizedContext, null, 2))
      const result = {
        ...jzodElement,
        context: localizedContext
        // context: {...relativeReferenceJzodContext, ...localizedContext}
      }
      // log.info("localizeJzodSchemaReferenceContext for schemaReference defn", jzodElement.definition.relativePath,", found result", JSON.stringify(result, null, 2))
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
    // case "simpleType":
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
}


let dummy: any;
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// NOT CONSISTENT AT ALL, SHOULD RETURN ONLY ERROR CODES, NOT THROW EXCEPTIONS!
export function unfoldJzodSchemaOnce(
  miroirFundamentalJzodSchema: JzodSchema,
  jzodSchema: JzodElement | undefined,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): UnfoldJzodSchemaOnceReturnType {
  // log.info(
  //   "unfoldJzodSchemaOnce called for schema",
  //   jzodSchema
  //   // JSON.stringify(jzodSchema, null, 2)
  // );

  if (!jzodSchema) {
    return { status: "ok", element: { type: "never" } }
  }

  switch (jzodSchema?.type) {
    case "schemaReference": {
      const unfoldedReferenceJzodSchema = localizeJzodSchemaReferenceContext(
        miroirFundamentalJzodSchema,
        jzodSchema,
        currentModel,
        miroirMetaModel,
        {...relativeReferenceJzodContext, ...jzodSchema.context}
      );

      // log.info("unfoldJzodSchemaOnce unfoldedReferenceJzodSchema", JSON.stringify(unfoldedReferenceJzodSchema, null, 2));
      const resolvedJzodSchema = resolveJzodSchemaReferenceInContext(
        miroirFundamentalJzodSchema,
        {type: "schemaReference", context: unfoldedReferenceJzodSchema.context, definition:jzodSchema.definition},
        currentModel,
        miroirMetaModel,
        {...relativeReferenceJzodContext, ...unfoldedReferenceJzodSchema.context} // local context (unfoldedReferenceJzodSchema.context) is not taken into account by resolveJzodSchemaReferenceInContext
      )

      // log.info("unfoldJzodSchemaOnce resolvedJzodSchema", mStringify(resolvedJzodSchema, null, 2));
      log.info("unfoldJzodSchemaOnce resolvedJzodSchema", resolvedJzodSchema);
      const resultJzodSchema = {...resolvedJzodSchema}
      // {
        // ...jzodSchema, // could be an issue if resolvedJzodSchema forces a value for an attribute already in jzodSchema (example: jzodSchema.optional = true, resolvedJzodSchema.optional=false)
        // optional: jzodSchema.optional, // TODO: what is the semantics of optional for a schema reference? COMPARE WITH JZOD TO ZOD!!!!!!!!!!
        // nullable: jzodSchema.nullable,
        // tag: jzodSchema.tag,
      //   ...resolvedJzodSchema
      // }
      if (jzodSchema.optional) {
        resultJzodSchema.optional = true;
      }
      if (jzodSchema.nullable) {
        resultJzodSchema.optional = true;
      }
      if (jzodSchema.tag) {
        resultJzodSchema.tag = jzodSchema.tag;
      }

      if (resultJzodSchema.optional != jzodSchema.optional) {
        throw new Error("unfoldJzodSchemaOnce mismatch on optional " + JSON.stringify(jzodSchema));
      }
      // log.info(
      //   "unfoldJzodSchemaOnce schemaReference resultJzodSchema",
      //   JSON.stringify(resultJzodSchema, null, 2),
      //   "valueObject",
      //   JSON.stringify(valueObject, null, 2)
      // );

      return { status: "ok", element: resultJzodSchema};
      break;
    }
    case "object": {
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
        }
      } else {
        extendedJzodSchema = jzodSchema
      }
      // log.info("unfoldJzodSchemaOnce object extendedJzodSchema",extendedJzodSchema)

      const resolvedObjectEntries:[string, JzodElement][] = Object.entries(extendedJzodSchema.definition).map(
        (e: [string, any]) => {
          if (extendedJzodSchema.definition[e[0]]) {
            const resultSchemaTmp = unfoldJzodSchemaOnce(
              miroirFundamentalJzodSchema,
              e[1],
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext
            )
            // log.info("unfoldJzodSchemaOnce object attribute",e,"result",resultSchemaTmp)
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                // {
                //   ...e[1], // all properties of JzodSchema tag, optional, nullable...
                  // ...resultSchemaTmp.element,
                // }
                resultSchemaTmp.element
              ]
            } else {
              log.warn(
                "unfoldJzodSchemaOnce error on resolving object attribute '" +
                  e[0] +
                  "', not present in definition of (extend resolved) type " +
                  JSON.stringify(extendedJzodSchema) +
                  " found error: " + resultSchemaTmp.error
              );
              return [e[0],{ type: "never" }]
            }
          } else {
            // TODO: RETURN AN ERROR ResolvedJzodSchemaReturnTypeError
            log.warn(
              {
                error: "unfoldJzodSchemaOnce error on resolving object, valueObject attribute " +
                e[0] +
                " not present in definition of type " +
                JSON.stringify(extendedJzodSchema)
              })
            return [e[0],{ type: "never" }]
          }
        } 
      );
      // log.info("unfoldJzodSchemaOnce object resolved entries result",resolvedObjectEntries)

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
      const unfoldedJzodSchemaReturnType: UnfoldJzodSchemaOnceReturnType[] = jzodSchema.definition.map((a: JzodElement) =>
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
      // log.info("unfoldJzodSchemaOnce for union ",jzodSchema, "unfoldedJzodSchemaReturnType", unfoldedJzodSchemaReturnType);
      const unfoldedJzodSchemas: JzodElement[] = (
        unfoldedJzodSchemaReturnType as ResolvedJzodSchemaReturnTypeOK[]
      ).map((a: ResolvedJzodSchemaReturnTypeOK) => a.element);
      // log.info("unfoldJzodSchemaOnce union unfoldedJzodSchemas", unfoldedJzodSchemas);
      const resultElement = { ...jzodSchema, definition: unfoldedJzodSchemas}
      // log.info("unfoldJzodSchemaOnce union resultElement", resultElement);
      return { status: "ok", element: resultElement}
      break;
    }
    case "record": {
      const resultSchemaTmp: UnfoldJzodSchemaOnceReturnType = unfoldJzodSchemaOnce(
        miroirFundamentalJzodSchema,
        jzodSchema.definition,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      )
      if (resultSchemaTmp.status == "ok") {
        const result: UnfoldJzodSchemaOnceReturnType = { status: "ok", element: {type: "record", definition: resultSchemaTmp.element}}
        // log.info("unfoldJzodSchemaOnce record, result", JSON.stringify(result, null, 2))
        return result
      } else {
        log.warn(
          "unfoldJzodSchemaOnce record could not find schema for definition '" +
          jzodSchema.definition +
          "' error:", JSON.stringify(resultSchemaTmp, null, 2)
        );
        return { status: "ok", element: { type: "never" } }
      }
      break;
    }
    case "literal": {
      return { status: "ok", element: jzodSchema };
      break;
    }
    case "enum": {
      return { status: "ok", element: jzodSchema };
    }
    case "tuple": {
      const subTypes = jzodSchema.definition.map(
        (e) => unfoldJzodSchemaOnce(
          miroirFundamentalJzodSchema,
          e,
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        )
      )
      const foundError = subTypes.find(e=>e.status == "error");
      if (foundError) {
        return {
          status: "error",
          error: "unfoldJzodSchemaOnce can not handle tuple schema " +
          JSON.stringify(jzodSchema) + " error " + JSON.stringify(foundError)
        }
      }
      return {
        status: "ok",
        element: {
          ...jzodSchema,
          definition: subTypes.map((e:any) => e.element)
        }
      }
      break;
    }
    case "array": {
      const subType = unfoldJzodSchemaOnce(
        miroirFundamentalJzodSchema,
        jzodSchema.definition,
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );

      if (subType.status == "ok") {
        return {
          status: "ok",
          element: {
            ...jzodSchema,
            definition: subType.element
          }
        }
      } else {
        // return resultSchemaTmp;
        log.warn(
          "unfoldJzodSchemaOnce error on resolving array type for " +
            JSON.stringify(jzodSchema) +
            // " valueObject " +
            // JSON.stringify(valueObject) +
            " found error: " + subType.error
        );
        return { status: "ok", element: { type: "never" }}
      }
      break;
    }
    // JzodPlainAttribute types
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "undefined":
    case "uuid":
    case "any":
    case "date":
    case "never":
    case "null":
    case "unknown":
    case "void":
    // other types
    case "intersection":
    case "promise":
    case "set":
    case "function":
    case "map":
    // case "simpleType":
    case "lazy": {
      return {status: "ok", element: jzodSchema}
    }
    default: {
      log.trace("unfoldJzodSchemaOnce could not resolve schemaReferences once for ", jzodSchema
      )
      throw new Error(
        "unfoldJzodSchemaOnce could not resolve schemaReferences once for " +
        JSON.stringify(jzodSchema)
      );
      break;
    }
  }
}
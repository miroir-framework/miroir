import {
  JzodElement,
  JzodObject,
  MlSchema,
  MetaModel,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Uuid } from "../../0_interfaces/1_core/EntityDefinition";
import type { ReduxDeploymentsState } from "../../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { packageName } from "../../constants";
import { mStringify } from "../../tools";
import { cleanLevel } from "../constants";
import { resolveJzodSchemaReferenceInContext } from "./jzodResolveSchemaReferenceInContext";
import type { ResolveBuildTransformersTo, Step } from "../../2_domain/Transformers";

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
  miroirFundamentalJzodSchema: MlSchema,
  jzodElement: T,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
): T {

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

// Track recursion level for performance monitoring
let recursionLevel = 0;

// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// NOT CONSISTENT AT ALL, SHOULD RETURN ONLY ERROR CODES, NOT THROW EXCEPTIONS!
export function unfoldJzodSchemaOnce(
  miroirFundamentalJzodSchema: MlSchema,
  currentModelEnvironment: MiroirModelEnvironment,
  mlSchema: JzodElement | undefined,
  path: string[],
  unfoldingReference: string[],
  rootSchema:JzodElement | undefined,
  depth: number, // used to limit the unfolding depth
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceJzodContext?: {[k:string]: JzodElement},
  // isUnfoldingSubUnion: boolean = false, // used to avoid infinite recursion in case of union unfolding
): UnfoldJzodSchemaOnceReturnType {
  const startTime = performance.now();
  recursionLevel++;
  // const currentRecursionLevel = recursionLevel;
  
  // log.info(
  //   // `unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] called for type`,
  //   `unfoldJzodSchemaOnce called for type`,
  //   mlSchema?.type,
  //   "path",
  //   "'" + path.join(".") + "'",
  //   "depth",
  //   depth,
  //   "schema",
  //   JSON.stringify(mlSchema, null, 2),
  //   "object keys:",
  //   mlSchema?.type == "object"
  //     ? JSON.stringify(Object.keys((mlSchema as any).definition ?? {}), null, 2)
  //     : "not an object",
  // );

  if (!mlSchema) {
    recursionLevel--;
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - returning never type`);
    return { status: "ok", element: { type: "never" } }
  }

  if (
    (mlSchema.type != "union" && depth > 1) ||
    // (mlSchema.type == "union" && depth > 2) 
    (mlSchema.type == "union" && depth > 1) 
    
  ) {
    // we let unions within unions be unfolded
    recursionLevel--;
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    // log.info(
    //   `unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(
    //     2
    //   )}ms - returning never type for sub-union`
    // );
    return {
      status: "ok",
      element: mlSchema,
    };
  }
  switch (mlSchema?.type) {
    case "schemaReference": {
      const unfoldedReferenceJzodSchema = localizeJzodSchemaReferenceContext(
        currentModelEnvironment.miroirFundamentalJzodSchema,
        mlSchema,
        currentModelEnvironment.currentModel,
        currentModelEnvironment.miroirMetaModel,
        {...relativeReferenceJzodContext, ...mlSchema.context}
      );

      const resolvedJzodSchema = resolveJzodSchemaReferenceInContext(
        {
          type: "schemaReference",
          context: unfoldedReferenceJzodSchema.context,
          definition: mlSchema.definition,
        },
        { ...relativeReferenceJzodContext, ...unfoldedReferenceJzodSchema.context }, // local context (unfoldedReferenceJzodSchema.context) is not taken into account by resolveJzodSchemaReferenceInContext
        currentModelEnvironment,//{ miroirFundamentalJzodSchema, currentModel, miroirMetaModel }
      );

      // log.info("unfoldJzodSchemaOnce resolvedJzodSchema", resolvedJzodSchema);
      const resultJzodSchema = {...resolvedJzodSchema}
      // {
        // ...mlSchema, // could be an issue if resolvedJzodSchema forces a value for an attribute already in mlSchema (example: mlSchema.optional = true, resolvedJzodSchema.optional=false)
        // optional: mlSchema.optional, // TODO: what is the semantics of optional for a schema reference? COMPARE WITH JZOD TO ZOD!!!!!!!!!!
        // nullable: mlSchema.nullable,
        // tag: mlSchema.tag,
      //   ...resolvedJzodSchema
      // }
      if (Object.hasOwn(mlSchema, "optional")) {
        resultJzodSchema.optional = mlSchema.optional;
      }
      if (Object.hasOwn(mlSchema, "nullable")) {
        resultJzodSchema.optional = mlSchema.nullable;
      }
      if (mlSchema.tag) {
        resultJzodSchema.tag = mlSchema.tag;
      }

      if (resultJzodSchema.optional != mlSchema.optional) {
        throw new Error(
          "unfoldJzodSchemaOnce mismatch on optional jzoSchema=" +
            JSON.stringify(mlSchema) +
            " resolvedJzodSchema=" +
            JSON.stringify(resultJzodSchema) +
            " for schemaReference " +
            mlSchema.definition.relativePath
        );
      }
      // log.info(
      //   "unfoldJzodSchemaOnce schemaReference resultJzodSchema",
      //   JSON.stringify(resultJzodSchema, null, 2),
      //   "valueObject",
      //   JSON.stringify(valueObject, null, 2)
      // );

      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - schemaReference resolved`);
      return { status: "ok", element: resultJzodSchema};
      break;
    }
    case "object": {
      let extendedJzodSchema: JzodObject
      if (mlSchema.extend) {
        const extension = resolveJzodSchemaReferenceInContext(
          mlSchema.extend,
          relativeReferenceJzodContext,
          currentModelEnvironment,// { miroirFundamentalJzodSchema, currentModel, miroirMetaModel }
        );
        if (extension.type == "object") {
          extendedJzodSchema = {
            // type: "object",
            ...mlSchema,
            definition: {
              ...extension.definition,
              ...mlSchema.definition
            }
          }
        } else {
          throw new Error(
            "unfoldJzodSchemaOnce object extend clause schema " +
              JSON.stringify(mlSchema) +
              " is not an object " +
              JSON.stringify(extension)
          );
        }
      } else {
        extendedJzodSchema = mlSchema
      }
      // log.info("unfoldJzodSchemaOnce object extendedJzodSchema",extendedJzodSchema)

      const resolvedObjectEntries:[string, JzodElement][] = Object.entries(extendedJzodSchema.definition).map(
        (e: [string, any]) => {
          if (extendedJzodSchema.definition[e[0]]) {
            const resultSchemaTmp = unfoldJzodSchemaOnce(
              miroirFundamentalJzodSchema,
              currentModelEnvironment,
              e[1],
              path.concat(e[0]), // path
              unfoldingReference,
              rootSchema, // rootSchema
              depth + 1, // depth
              currentModel,
              miroirMetaModel,
              relativeReferenceJzodContext,
            )
            // log.info("unfoldJzodSchemaOnce object attribute",e,"result",resultSchemaTmp)
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
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
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - object resolved`);
      return {status: "ok", element: resultElement};
      break;
    }
    // ############################################################################################
    case "union":{
      // const unfoldedJzodSchemas: JzodElement[] = mlSchema.definition.map((a: JzodElement) =>
      const unfoldedJzodSchemaReturnType: {referenceRelativeName?: string, unfolded: UnfoldJzodSchemaOnceReturnType}[] =
        mlSchema.definition.map((a: JzodElement) =>
          (
            {
              referenceRelativeName: a.type == "schemaReference" ? a.definition.relativePath : undefined,
              unfolded: unfoldJzodSchemaOnce(
                miroirFundamentalJzodSchema,
                currentModelEnvironment,
                a,
                path,
                unfoldingReference,
                // a.type == "schemaReference"
                //   ? unfoldingReference.concat(a.definition.relativePath ?? "")
                //   : unfoldingReference,
                rootSchema, // rootSchema
                depth + 1, // depth
                currentModel,
                miroirMetaModel,
                relativeReferenceJzodContext
              )
            }
            // unfoldJzodSchemaOnce(
            //   miroirFundamentalJzodSchema,
            //   a,
            //   path,
            //   unfoldingReference,
            //   // a.type == "schemaReference"
            //   //   ? unfoldingReference.concat(a.definition.relativePath ?? "")
            //   //   : unfoldingReference,
            //   rootSchema, // rootSchema
            //   depth + 1, // depth
            //   currentModel,
            //   miroirMetaModel,
            //   relativeReferenceJzodContext
            // )
          )
        );
      const failedIndex = unfoldedJzodSchemaReturnType.find(a => a.unfolded.status!="ok")
      if (failedIndex) {
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - union failed`);
        return {
          status: "error",
          error:
            "unfoldJzodSchemaOnce failed for union " +
            JSON.stringify(failedIndex, null, 2)
        };
      }
      // log.info("unfoldJzodSchemaOnce for union ",mlSchema, "unfoldedJzodSchemaReturnType", unfoldedJzodSchemaReturnType);
      const firstLevelUnfoldedJzodSchemas: {referenceRelativeName?: string, unfolded: JzodElement}[] = (
        // unfoldedJzodSchemaReturnType as UnfoldJzodSchemaOnceReturnTypeOK[]
        unfoldedJzodSchemaReturnType as {referenceRelativeName?: string, unfolded: UnfoldJzodSchemaOnceReturnTypeOK}[]
      ).map(a => ({referenceRelativeName: a.referenceRelativeName, unfolded: a.unfolded.element}));

      // log.info("unfoldJzodSchemaOnce union unfoldedJzodSchemas", unfoldedJzodSchemas);
      // const secondLevelUnfoldedTmpResults: (JzodElement | UnfoldJzodSchemaOnceReturnType)[] = firstLevelUnfoldedJzodSchemas.map(
      const secondLevelUnfoldedTmpResults: UnfoldJzodSchemaOnceReturnType[] = firstLevelUnfoldedJzodSchemas.map(
        (s:{referenceRelativeName?: string, unfolded: JzodElement})=> {
          // if (s.type != "union" || isUnfoldingSubUnion) {
          //   return s
          // }
          return unfoldJzodSchemaOnce(
            miroirFundamentalJzodSchema,
            currentModelEnvironment,
            s.unfolded,
            path,
            s.referenceRelativeName?[...unfoldingReference, s.referenceRelativeName]: unfoldingReference, // path
            // a.type == "schemaReference"
            //   ? unfoldingReference.concat(a.definition.relativePath ?? "")
            //   : unfoldingReference,
            rootSchema, // rootSchema
            // depth + 1, // depth
            s.referenceRelativeName && unfoldingReference.includes(s.referenceRelativeName)?1:0, // depth
            // 0,
            // 1, // depth
            currentModel,
            miroirMetaModel,
            relativeReferenceJzodContext
          );
        }
      )
      const secondLineFailedIndex = secondLevelUnfoldedTmpResults.find((a:any) => Object.hasOwn(a,"status") && a.status!="ok")
      if (secondLineFailedIndex) {
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - sub-union failed`);
        return {
          status: "error",
          error:
            "unfoldJzodSchemaOnce failed for sub-union " +
            JSON.stringify(secondLineFailedIndex, null, 2),
        };
      }
      const secondLevelUnfoldedResults: JzodElement[] = (
        secondLevelUnfoldedTmpResults as (JzodElement | UnfoldJzodSchemaOnceReturnTypeOK)[]
      ).map((s: JzodElement | UnfoldJzodSchemaOnceReturnTypeOK) => {
        if (!Object.hasOwn(s, "status")) {
          return s;
        }
        return (s as any).element;
      });
      // const resultElement = { ...mlSchema, definition: firstLevelUnfoldedJzodSchemas}
      const resultElement = { ...mlSchema, definition: secondLevelUnfoldedResults}
      // log.info("unfoldJzodSchemaOnce union resultElement", resultElement);
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - union resolved`);
      return { status: "ok", element: resultElement}
      break;
    }
    case "record": {
      const resultSchemaTmp: UnfoldJzodSchemaOnceReturnType = unfoldJzodSchemaOnce(
        miroirFundamentalJzodSchema,
        currentModelEnvironment,
        mlSchema.definition,
        path.concat("recordEntry"), // path
        unfoldingReference,
        rootSchema, // rootSchema
        depth + 1, // depth
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );
      if (resultSchemaTmp.status == "ok") {
        const result: UnfoldJzodSchemaOnceReturnType = {
          status: "ok",
          element: { ...mlSchema, definition: resultSchemaTmp.element },
        };
        // log.info("unfoldJzodSchemaOnce record, result", JSON.stringify(result, null, 2))
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - record resolved`);
        return result
      } else {
        log.warn(
          "unfoldJzodSchemaOnce record could not find schema for definition '" +
          mlSchema.definition +
          "' error:", JSON.stringify(resultSchemaTmp, null, 2)
        );
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - record failed`);
        return { status: "ok", element: { type: "never" } }
      }
      break;
    }
    case "literal": {
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - literal resolved`);
      return { status: "ok", element: mlSchema };
      break;
    }
    case "enum": {
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - enum resolved`);
      return { status: "ok", element: mlSchema };
    }
    case "tuple": {
      const subTypes = mlSchema.definition.map((e) =>
        unfoldJzodSchemaOnce(
          miroirFundamentalJzodSchema,
          currentModelEnvironment,
          e,
          path.concat("tupleItem"), // path
          unfoldingReference,
          rootSchema, // rootSchema
          depth + 1, // depth
          currentModel,
          miroirMetaModel,
          relativeReferenceJzodContext
        )
      );
      const foundError = subTypes.find(e=>e.status == "error");
      if (foundError) {
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - tuple failed`);
        return {
          status: "error",
          error: "unfoldJzodSchemaOnce can not handle tuple schema " +
          JSON.stringify(mlSchema) + " error " + JSON.stringify(foundError)
        }
      }
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - tuple resolved`);
      return {
        status: "ok",
        element: {
          ...mlSchema,
          definition: subTypes.map((e:any) => e.element)
        }
      }
      break;
    }
    case "array": {
      const subType = unfoldJzodSchemaOnce(
        miroirFundamentalJzodSchema,
        currentModelEnvironment,
        mlSchema.definition,
        path.concat("arrayItem"), // path
        unfoldingReference,
        rootSchema, // rootSchema
        depth + 1, // depth
        currentModel,
        miroirMetaModel,
        relativeReferenceJzodContext
      );

      if (subType.status == "ok") {
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - array resolved`);
        return {
          status: "ok",
          element: {
            ...mlSchema,
            definition: subType.element
          }
        }
      } else {
        // return resultSchemaTmp;
        log.warn(
          "unfoldJzodSchemaOnce error on resolving array type for " +
            JSON.stringify(mlSchema) +
            // " valueObject " +
            // JSON.stringify(valueObject) +
            " found error: " + subType.error
        );
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - array failed`);
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
    // case "null":
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
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldJzodSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - ${mlSchema.type} resolved`);
      return {status: "ok", element: mlSchema}
    }
    default: {
      // log.trace("unfoldJzodSchemaOnce could not resolve schemaReferences once for ", mlSchema)
      throw new Error(
        "unfoldJzodSchemaOnce could not resolve schemaReferences once for " +
        JSON.stringify(mlSchema)
      );
      break;
    }
  }
}

// ################################################################################################
export function unfoldSchemaOnceTransformer(
  step: Step,
  transformerPath: string[],
  label: string | undefined,
  transformer: any, // TransformerForBuild_unfoldSchemaOnce | TransformerForRuntime_unfoldSchemaOnce | TransformerForBuildPlusRuntime_unfoldSchemaOnce,
  resolveBuildTransformersTo: ResolveBuildTransformersTo,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults?: Record<string, any>,
  reduxDeploymentsState?: ReduxDeploymentsState | undefined,
  deploymentUuid?: Uuid,
): UnfoldJzodSchemaOnceReturnType {
  return unfoldJzodSchemaOnce(
    transformer.miroirFundamentalJzodSchema,
    modelEnvironment,
    transformer.mlSchema,
    transformer.path || [],
    transformer.unfoldingReference || [],
    transformer.rootSchema,
    transformer.depth || 0,
    transformer.currentModel,
    transformer.miroirMetaModel,
    transformer.relativeReferenceJzodContext
  );
}
import {
  MlElement,
  MlObject,
  MlSchema,
  MetaModel,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { Uuid } from "../../0_interfaces/1_core/EntityVersion";
import type { ReduxDeploymentsState } from "../../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import type { MiroirModelEnvironment } from "../../0_interfaces/1_core/Transformer";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { packageName } from "../../constants";
import { mStringify } from "../../tools";
import { cleanLevel } from "../constants";
import { resolveMlSchemaReferenceInContext } from "./mlsResolveSchemaReferenceInContext";
import type { ResolveBuildTransformersTo, Step } from "../../2_domain/Transformers";

// export const miroirFundamentalMlSchema2 = miroirFundamentalMlSchema;
// import { miroirFundamentalMlSchema } from "../tmp/src/0_interfaces/1_core/bootstrapMlSchemas/miroirFundamentalMlSchema";


const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MlsUnfoldSchemaOnce");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});



export interface UnfoldMlSchemaOnceReturnTypeOK {
  status: "ok",
  element: MlElement
}
export interface UnfoldMlSchemaOnceReturnTypeError {
  status: "error",
  error: string
}
export type UnfoldMlSchemaOnceReturnType = UnfoldMlSchemaOnceReturnTypeError | UnfoldMlSchemaOnceReturnTypeOK;


// ################################################################################################
export function localizeMlSchemaReferenceContext<T extends MlElement>(
  miroirFundamentalMlSchema: MlSchema,
  mlElement: T,
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceMlContext?: {[k:string]: MlElement},
): T {

  switch (mlElement.type) {
    case "object": {
      // TODO: resolve extend clause
      return {
        ...mlElement,
        definition: Object.fromEntries(
          Object.entries(mlElement.definition).map(
            e => [e[0], localizeMlSchemaReferenceContext(
              miroirFundamentalMlSchema,
              e[1],
              currentModel,
              miroirMetaModel,
              relativeReferenceMlContext
            )]
          )
        )
      }
    }
    case "schemaReference": {
      // in case of absolute reference: unfold?
      // in case of relative reference without added context: add context to reference found within context, for later unfolding
      const localizedContext = mlElement.context?Object.fromEntries(
        Object.entries(mlElement.context).map(
          e => [e[0], localizeMlSchemaReferenceContext(
            miroirFundamentalMlSchema,
            e[1],
            currentModel,
            miroirMetaModel,
            {...relativeReferenceMlContext, ...mlElement.context} // taking into account both the global context and the local context for resolution
          )]
        )
      ): relativeReferenceMlContext // no local context found, resolution will be based only on passed global context
      ;

      // log.info("localizeMlSchemaReferenceContext for schemaReference defn", mlElement.definition.relativePath,", found localizedContext", JSON.stringify(localizedContext, null, 2))
      const result = {
        ...mlElement,
        context: localizedContext
        // context: {...relativeReferenceMlContext, ...localizedContext}
      }
      // log.info("localizeMlSchemaReferenceContext for schemaReference defn", mlElement.definition.relativePath,", found result", JSON.stringify(result, null, 2))
      return result
      break;
    }
    case "union": {
      return {
        ...mlElement,
        definition: mlElement.definition.map(
          e => localizeMlSchemaReferenceContext(
            miroirFundamentalMlSchema,
            e,
            currentModel,
            miroirMetaModel,
            relativeReferenceMlContext
          )
        )
      }
      break;
    }
    case "array": {
      return {
        ...mlElement,
        definition: localizeMlSchemaReferenceContext(
          miroirFundamentalMlSchema,
          mlElement.definition,
          currentModel,
          miroirMetaModel,
          relativeReferenceMlContext
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
      return mlElement
      break;
    }
    default: {
      return mlElement
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
export function unfoldMlSchemaOnce(
  miroirFundamentalMlSchema: MlSchema,
  currentModelEnvironment: MiroirModelEnvironment,
  mlSchema: MlElement | undefined,
  path: string[],
  unfoldingReference: string[],
  rootSchema:MlElement | undefined,
  depth: number, // used to limit the unfolding depth
  currentModel?: MetaModel,
  miroirMetaModel?: MetaModel,
  relativeReferenceMlContext?: {[k:string]: MlElement},
  // isUnfoldingSubUnion: boolean = false, // used to avoid infinite recursion in case of union unfolding
): UnfoldMlSchemaOnceReturnType {
  const startTime = performance.now();
  recursionLevel++;
  // const currentRecursionLevel = recursionLevel;
  
  // log.info(
  //   // `unfoldMlSchemaOnce [Level ${currentRecursionLevel}] called for type`,
  //   `unfoldMlSchemaOnce called for type`,
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
    // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - returning never type`);
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
    //   `unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(
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
      const unfoldedReferenceMlSchema = localizeMlSchemaReferenceContext(
        currentModelEnvironment.miroirFundamentalMlSchema,
        mlSchema,
        currentModelEnvironment.currentModel,
        currentModelEnvironment.miroirMetaModel,
        {...relativeReferenceMlContext, ...mlSchema.context}
      );

      const resolvedMlSchema = resolveMlSchemaReferenceInContext(
        {
          type: "schemaReference",
          context: unfoldedReferenceMlSchema.context,
          definition: mlSchema.definition,
        },
        { ...relativeReferenceMlContext, ...unfoldedReferenceMlSchema.context }, // local context (unfoldedReferenceMlSchema.context) is not taken into account by resolveMlSchemaReferenceInContext
        currentModelEnvironment,//{ miroirFundamentalMlSchema, currentModel, miroirMetaModel }
      );

      // log.info("unfoldMlSchemaOnce resolvedMlSchema", resolvedMlSchema);
      const resultMlSchema = {...resolvedMlSchema}
      // {
        // ...mlSchema, // could be an issue if resolvedMlSchema forces a value for an attribute already in mlSchema (example: mlSchema.optional = true, resolvedMlSchema.optional=false)
        // optional: mlSchema.optional, // TODO: what is the semantics of optional for a schema reference? COMPARE WITH THE ZOD CONVERSION OF @miroir-framework/jzod!!!!!!!!!!
        // nullable: mlSchema.nullable,
        // tag: mlSchema.tag,
      //   ...resolvedMlSchema
      // }
      if (Object.hasOwn(mlSchema, "optional")) {
        resultMlSchema.optional = mlSchema.optional;
      }
      if (Object.hasOwn(mlSchema, "nullable")) {
        resultMlSchema.optional = mlSchema.nullable;
      }
      if (mlSchema.tag) {
        resultMlSchema.tag = mlSchema.tag;
      }

      if (resultMlSchema.optional != mlSchema.optional) {
        throw new Error(
          "unfoldMlSchemaOnce mismatch on optional jzoSchema=" +
            JSON.stringify(mlSchema) +
            " resolvedMlSchema=" +
            JSON.stringify(resultMlSchema) +
            " for schemaReference " +
            mlSchema.definition.relativePath
        );
      }
      // log.info(
      //   "unfoldMlSchemaOnce schemaReference resultMlSchema",
      //   JSON.stringify(resultMlSchema, null, 2),
      //   "valueObject",
      //   JSON.stringify(valueObject, null, 2)
      // );

      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - schemaReference resolved`);
      return { status: "ok", element: resultMlSchema};
      break;
    }
    case "object": {
      let extendedMlSchema: MlObject
      if (mlSchema.extend) {
        const extension = resolveMlSchemaReferenceInContext(
          mlSchema.extend,
          relativeReferenceMlContext,
          currentModelEnvironment,// { miroirFundamentalMlSchema, currentModel, miroirMetaModel }
        );
        if (extension.type == "object") {
          extendedMlSchema = {
            // type: "object",
            ...mlSchema,
            definition: {
              ...extension.definition,
              ...mlSchema.definition
            }
          }
        } else {
          throw new Error(
            "unfoldMlSchemaOnce object extend clause schema " +
              JSON.stringify(mlSchema) +
              " is not an object " +
              JSON.stringify(extension)
          );
        }
      } else {
        extendedMlSchema = mlSchema
      }
      // log.info("unfoldMlSchemaOnce object extendedMlSchema",extendedMlSchema)

      const resolvedObjectEntries:[string, MlElement][] = Object.entries(extendedMlSchema.definition).map(
        (e: [string, any]) => {
          if (extendedMlSchema.definition[e[0]]) {
            const resultSchemaTmp = unfoldMlSchemaOnce(
              miroirFundamentalMlSchema,
              currentModelEnvironment,
              e[1],
              path.concat(e[0]), // path
              unfoldingReference,
              rootSchema, // rootSchema
              depth + 1, // depth
              currentModel,
              miroirMetaModel,
              relativeReferenceMlContext,
            )
            // log.info("unfoldMlSchemaOnce object attribute",e,"result",resultSchemaTmp)
            if (resultSchemaTmp.status == "ok") {
              return [
                e[0],
                resultSchemaTmp.element
              ]
            } else {
              log.warn(
                "unfoldMlSchemaOnce error on resolving object attribute '" +
                  e[0] +
                  "', not present in definition of (extend resolved) type " +
                  JSON.stringify(extendedMlSchema) +
                  " found error: " + resultSchemaTmp.error
              );
              return [e[0],{ type: "never" }]
            }
          } else {
            // TODO: RETURN AN ERROR ResolvedMlSchemaReturnTypeError
            log.warn(
              {
                error: "unfoldMlSchemaOnce error on resolving object, valueObject attribute " +
                e[0] +
                " not present in definition of type " +
                JSON.stringify(extendedMlSchema)
              })
            return [e[0],{ type: "never" }]
          }
        } 
      );
      // log.info("unfoldMlSchemaOnce object resolved entries result",resolvedObjectEntries)

      // TODO: inheritance!!!
      const resultElement = {
        ...extendedMlSchema,
        definition: Object.fromEntries(resolvedObjectEntries),
      } as MlElement;
      // log.info("unfoldMlSchemaOnce object result", JSON.stringify(result, null, 2))
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - object resolved`);
      return {status: "ok", element: resultElement};
      break;
    }
    // ############################################################################################
    case "union":{
      // const unfoldedMlSchemas: MlElement[] = mlSchema.definition.map((a: MlElement) =>
      const unfoldedMlSchemaReturnType: {referenceRelativeName?: string, unfolded: UnfoldMlSchemaOnceReturnType}[] =
        mlSchema.definition.map((a: MlElement) =>
          (
            {
              referenceRelativeName: a.type == "schemaReference" ? a.definition.relativePath : undefined,
              unfolded: unfoldMlSchemaOnce(
                miroirFundamentalMlSchema,
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
                relativeReferenceMlContext
              )
            }
            // unfoldMlSchemaOnce(
            //   miroirFundamentalMlSchema,
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
            //   relativeReferenceMlContext
            // )
          )
        );
      const failedIndex = unfoldedMlSchemaReturnType.find(a => a.unfolded.status!="ok")
      if (failedIndex) {
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - union failed`);
        return {
          status: "error",
          error:
            "unfoldMlSchemaOnce failed for union " +
            JSON.stringify(failedIndex, null, 2)
        };
      }
      // log.info("unfoldMlSchemaOnce for union ",mlSchema, "unfoldedMlSchemaReturnType", unfoldedMlSchemaReturnType);
      const firstLevelUnfoldedMlSchemas: {referenceRelativeName?: string, unfolded: MlElement}[] = (
        // unfoldedMlSchemaReturnType as UnfoldMlSchemaOnceReturnTypeOK[]
        unfoldedMlSchemaReturnType as {referenceRelativeName?: string, unfolded: UnfoldMlSchemaOnceReturnTypeOK}[]
      ).map(a => ({referenceRelativeName: a.referenceRelativeName, unfolded: a.unfolded.element}));

      // log.info("unfoldMlSchemaOnce union unfoldedMlSchemas", unfoldedMlSchemas);
      // const secondLevelUnfoldedTmpResults: (MlElement | UnfoldMlSchemaOnceReturnType)[] = firstLevelUnfoldedMlSchemas.map(
      const secondLevelUnfoldedTmpResults: UnfoldMlSchemaOnceReturnType[] = firstLevelUnfoldedMlSchemas.map(
        (s:{referenceRelativeName?: string, unfolded: MlElement})=> {
          // if (s.type != "union" || isUnfoldingSubUnion) {
          //   return s
          // }
          return unfoldMlSchemaOnce(
            miroirFundamentalMlSchema,
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
            relativeReferenceMlContext
          );
        }
      )
      const secondLineFailedIndex = secondLevelUnfoldedTmpResults.find((a:any) => Object.hasOwn(a,"status") && a.status!="ok")
      if (secondLineFailedIndex) {
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - sub-union failed`);
        return {
          status: "error",
          error:
            "unfoldMlSchemaOnce failed for sub-union " +
            JSON.stringify(secondLineFailedIndex, null, 2),
        };
      }
      const secondLevelUnfoldedResults: MlElement[] = (
        secondLevelUnfoldedTmpResults as (MlElement | UnfoldMlSchemaOnceReturnTypeOK)[]
      ).map((s: MlElement | UnfoldMlSchemaOnceReturnTypeOK) => {
        if (!Object.hasOwn(s, "status")) {
          return s;
        }
        return (s as any).element;
      });
      // const resultElement = { ...mlSchema, definition: firstLevelUnfoldedMlSchemas}
      const resultElement = { ...mlSchema, definition: secondLevelUnfoldedResults}
      // log.info("unfoldMlSchemaOnce union resultElement", resultElement);
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - union resolved`);
      return { status: "ok", element: resultElement}
      break;
    }
    case "record": {
      const resultSchemaTmp: UnfoldMlSchemaOnceReturnType = unfoldMlSchemaOnce(
        miroirFundamentalMlSchema,
        currentModelEnvironment,
        mlSchema.definition,
        path.concat("recordEntry"), // path
        unfoldingReference,
        rootSchema, // rootSchema
        depth + 1, // depth
        currentModel,
        miroirMetaModel,
        relativeReferenceMlContext
      );
      if (resultSchemaTmp.status == "ok") {
        const result: UnfoldMlSchemaOnceReturnType = {
          status: "ok",
          element: { ...mlSchema, definition: resultSchemaTmp.element },
        };
        // log.info("unfoldMlSchemaOnce record, result", JSON.stringify(result, null, 2))
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - record resolved`);
        return result
      } else {
        log.warn(
          "unfoldMlSchemaOnce record could not find schema for definition '" +
          mlSchema.definition +
          "' error:", JSON.stringify(resultSchemaTmp, null, 2)
        );
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - record failed`);
        return { status: "ok", element: { type: "never" } }
      }
      break;
    }
    case "literal": {
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - literal resolved`);
      return { status: "ok", element: mlSchema };
      break;
    }
    case "enum": {
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - enum resolved`);
      return { status: "ok", element: mlSchema };
    }
    case "tuple": {
      const subTypes = mlSchema.definition.map((e) =>
        unfoldMlSchemaOnce(
          miroirFundamentalMlSchema,
          currentModelEnvironment,
          e,
          path.concat("tupleItem"), // path
          unfoldingReference,
          rootSchema, // rootSchema
          depth + 1, // depth
          currentModel,
          miroirMetaModel,
          relativeReferenceMlContext
        )
      );
      const foundError = subTypes.find(e=>e.status == "error");
      if (foundError) {
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - tuple failed`);
        return {
          status: "error",
          error: "unfoldMlSchemaOnce can not handle tuple schema " +
          JSON.stringify(mlSchema) + " error " + JSON.stringify(foundError)
        }
      }
      recursionLevel--;
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - tuple resolved`);
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
      const subType = unfoldMlSchemaOnce(
        miroirFundamentalMlSchema,
        currentModelEnvironment,
        mlSchema.definition,
        path.concat("arrayItem"), // path
        unfoldingReference,
        rootSchema, // rootSchema
        depth + 1, // depth
        currentModel,
        miroirMetaModel,
        relativeReferenceMlContext
      );

      if (subType.status == "ok") {
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - array resolved`);
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
          "unfoldMlSchemaOnce error on resolving array type for " +
            JSON.stringify(mlSchema) +
            // " valueObject " +
            // JSON.stringify(valueObject) +
            " found error: " + subType.error
        );
        recursionLevel--;
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - array failed`);
        return { status: "ok", element: { type: "never" }}
      }
      break;
    }
    // MlPlainAttribute types
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
      // log.info(`unfoldMlSchemaOnce [Level ${currentRecursionLevel}] execution time: ${executionTime.toFixed(2)}ms - ${mlSchema.type} resolved`);
      return {status: "ok", element: mlSchema}
    }
    default: {
      // log.trace("unfoldMlSchemaOnce could not resolve schemaReferences once for ", mlSchema)
      throw new Error(
        "unfoldMlSchemaOnce could not resolve schemaReferences once for " +
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
): UnfoldMlSchemaOnceReturnType {
  return unfoldMlSchemaOnce(
    transformer.miroirFundamentalMlSchema,
    modelEnvironment,
    transformer.mlSchema,
    transformer.path || [],
    transformer.unfoldingReference || [],
    transformer.rootSchema,
    transformer.depth || 0,
    transformer.currentModel,
    transformer.miroirMetaModel,
    transformer.relativeReferenceMlContext
  );
}
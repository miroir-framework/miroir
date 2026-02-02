import { miroirFundamentalJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import {
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedExtractorTemplateReturningObjectOrObjectList,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  Extractor,
  ExtractorOrCombiner,
  ExtractorOrCombinerRecord,
  ExtractorOrCombinerReturningObjectOrObjectList,
  ExtractorOrCombinerTemplate,
  ExtractorTemplateByExtractorWrapper,
  ExtractorTemplateReturningObjectOrObjectList,
  ExtractorWrapper,
  QueryFailed,
  Transformer_contextOrParameterReferenceTO_REMOVE,
  type MlSchema
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { transformer_extended_apply, transformer_extended_apply_wrapper } from "./TransformersForRuntime";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Templates")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export function resolveExtractorTemplate(
  extractorOrCombinerTemplate: ExtractorOrCombinerTemplate,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>
): ExtractorOrCombiner | QueryFailed {
  const cleanQueryTemplate: any = { ...extractorOrCombinerTemplate }
  delete cleanQueryTemplate.extractorOrCombinerType;

  
  switch (extractorOrCombinerTemplate.extractorOrCombinerType) {
    case "literal": {
      return {
        extractorOrCombinerType: "literal",
        definition: extractorOrCombinerTemplate.definition,
      };
    }
    case "extractorForObjectListByEntity": {
      if (extractorOrCombinerTemplate.filter) {
        // const filterValue = transformer_extended_apply_wrapper(
        const filterValue = transformer_extended_apply(
          "build", // TODO: resolve for runtime transformer. Does it make sense?
          [], // transformerPath
          undefined,
          extractorOrCombinerTemplate.filter.value,
          "value",
          modelEnvironment,
          queryParams,
          contextResults ?? {},
        )
        // TODO: check for failure!
        return {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          ...cleanQueryTemplate,
          parentUuid:
            typeof extractorOrCombinerTemplate.parentUuid == "string"
              ? extractorOrCombinerTemplate.parentUuid
              // : transformer_InnerReference_resolve(
              : transformer_extended_apply(
                  "build", // TODO: should this be "build" or "runtime"? "value" is not consistent with "build"
                  [], // transformerPath
                  extractorOrCombinerTemplate.label??extractorOrCombinerTemplate.extractorOrCombinerType,
                  extractorOrCombinerTemplate.parentUuid,
                  "value",
                  modelEnvironment,
                  queryParams,
                  contextResults
                ), // TODO: check for failure!
          filter: {
            ...extractorOrCombinerTemplate.filter,
            // attributeName: extractorOrCombinerTemplate.filter.attributeName,
            value: filterValue, // TODO: check for failure!
          },
        };
      } else {
        return {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          ...cleanQueryTemplate,
          parentUuid:
            typeof extractorOrCombinerTemplate.parentUuid == "string"
              ? extractorOrCombinerTemplate.parentUuid
              // : transformer_InnerReference_resolve(
              : transformer_extended_apply(
                  "build",
                  [], // transformerPath
                  extractorOrCombinerTemplate.label??extractorOrCombinerTemplate.extractorOrCombinerType,
                  extractorOrCombinerTemplate.parentUuid,
                  "value",
                  modelEnvironment,
                  queryParams,
                  contextResults
                ), // TODO: check for failure!
        };
      }
      break;
    }
    case "extractorForObjectByDirectReference": {
      return {
        extractorOrCombinerType: "extractorForObjectByDirectReference",
        ...cleanQueryTemplate,
        parentUuid:
          typeof extractorOrCombinerTemplate.parentUuid == "string"
            ? extractorOrCombinerTemplate.parentUuid
            // : transformer_InnerReference_resolve(
            : transformer_extended_apply(
                "build",
                [], // transformerPath
                extractorOrCombinerTemplate.label??extractorOrCombinerTemplate.extractorOrCombinerType,
                extractorOrCombinerTemplate.parentUuid,
                "value",
                modelEnvironment,
                queryParams,
                contextResults
              ), // TODO: check for failure!
        // instanceUuid: transformer_InnerReference_resolve(
        instanceUuid: transformer_extended_apply(
          "build",
          [], // transformerPath
          extractorOrCombinerTemplate.label??extractorOrCombinerTemplate.extractorOrCombinerType,
          extractorOrCombinerTemplate.instanceUuid,
          "value",
          modelEnvironment,
          queryParams,
          contextResults
        ), // TODO: check for failure!
      };
      break;
    }
    case "extractorByExtractorWrapperReturningObject": {
      return {
        extractorOrCombinerType: "extractorWrapperReturningObject",
        ...cleanQueryTemplate,
        definition: Object.fromEntries(
          Object.entries(extractorOrCombinerTemplate.definition).map(
            (e: [string, Transformer_contextOrParameterReferenceTO_REMOVE]) => [
              e[0],
              {
                extractorOrCombinerType: "extractorOrCombinerContextReference",
                extractorOrCombinerContextReference: e[1].referenceName,
              } as ExtractorOrCombiner,
            ]
          )
        ),
      };
      break;
    }
    case "extractorByExtractorWrapperReturningList": {
      return {
        extractorOrCombinerType: "extractorWrapperReturningList",
        ...cleanQueryTemplate,
        definition: extractorOrCombinerTemplate.definition.map(
          (e: Transformer_contextOrParameterReferenceTO_REMOVE) =>
            ({
              extractorOrCombinerType: "extractorOrCombinerContextReference",
              extractorOrCombinerContextReference: e.referenceName,
            } as ExtractorOrCombiner)
        ),
      };
      break;
    }
    case "combinerByRelationReturningObjectList": {
      return {
        extractorOrCombinerType: extractorOrCombinerTemplate.extractorOrCombinerType,
        ...cleanQueryTemplate,
        parentUuid:
          typeof extractorOrCombinerTemplate.parentUuid == "string"
            ? extractorOrCombinerTemplate.parentUuid
            : transformer_extended_apply(
                "build",
                [], // transformerPath
                extractorOrCombinerTemplate.label ??
                  extractorOrCombinerTemplate.extractorOrCombinerType,
                extractorOrCombinerTemplate.parentUuid,
                "value",
                modelEnvironment,
                queryParams,
                contextResults
              ), // TODO: check for failure!
        objectReference:
          typeof extractorOrCombinerTemplate.objectReference === "object" &&
          (extractorOrCombinerTemplate.objectReference as any)["transformerType"] ===
            "getFromContext"
            ? (extractorOrCombinerTemplate.objectReference as any)?.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList extractor template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList extractor template: objectReference is not a getFromContext",
      };
      break;
    }
    case "combinerByManyToManyRelationReturningObjectList": {
      return {
        extractorOrCombinerType: extractorOrCombinerTemplate.extractorOrCombinerType,
        ...cleanQueryTemplate,
        parentUuid:
          typeof extractorOrCombinerTemplate.parentUuid == "string"
            ? extractorOrCombinerTemplate.parentUuid
            // : transformer_InnerReference_resolve(
            : transformer_extended_apply(
                "build",
                [], // transformerPath
                extractorOrCombinerTemplate.label??extractorOrCombinerTemplate.extractorOrCombinerType,
                extractorOrCombinerTemplate.parentUuid,
                "value",
                modelEnvironment,
                queryParams,
                contextResults
              ), // TODO: check for failure!
        objectListReference:
          extractorOrCombinerTemplate.objectListReference.transformerType == "getFromContext"
            ? extractorOrCombinerTemplate.objectListReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerByManyToManyRelationReturningObjectList extractor template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerByManyToManyRelationReturningObjectList extractor template: objectReference is not a getFromContext",
      };
      break;
    }
    case "combinerForObjectByRelation": {
      return {
        extractorOrCombinerType: extractorOrCombinerTemplate.extractorOrCombinerType,
        ...cleanQueryTemplate,
        parentUuid:
          typeof extractorOrCombinerTemplate.parentUuid == "string"
            ? extractorOrCombinerTemplate.parentUuid
            // : transformer_InnerReference_resolve(
            : transformer_extended_apply(
                "build",
                [], // transformerPath
                extractorOrCombinerTemplate.label??extractorOrCombinerTemplate.extractorOrCombinerType,
                extractorOrCombinerTemplate.parentUuid,
                "value",
                modelEnvironment,
                queryParams,
                contextResults
              ), // TODO: check for failure!
        objectReference:
          extractorOrCombinerTemplate.objectReference.transformerType == "getFromContext"
            ? extractorOrCombinerTemplate.objectReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectByRelation extractor template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectByRelation extractor template: objectReference is not a getFromContext",
      };
      break;
    }
    case "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList": {
      return {
        extractorOrCombinerType: extractorOrCombinerTemplate.extractorOrCombinerType,
        ...cleanQueryTemplate,
        rootExtractorOrReference:
          typeof extractorOrCombinerTemplate.rootExtractorOrReference == "string"
            ? extractorOrCombinerTemplate.rootExtractorOrReference
            : (resolveExtractorTemplate(
                extractorOrCombinerTemplate.rootExtractorOrReference,
                modelEnvironment,
                queryParams,
                contextResults
              ) as Extractor), // TODO: check for failure!
      };
      break;
    }
    default: {
      return {
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["AsyncQuerySelectors", "resolveExtractorTemplate"],
        query: JSON.stringify(extractorOrCombinerTemplate),
      };
      break;
    }
  }
}

// ################################################################################################
export function resolveQueryTemplateSelectExtractorWrapper(
  queryTemplate: ExtractorTemplateByExtractorWrapper,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>
): ExtractorWrapper {
  const result = resolveExtractorTemplate(
    queryTemplate,
    modelEnvironment,
    queryParams,
    contextResults
  );
  if ((result as any).queryFailure) {
    throw new Error("QueryNotExecutable");
  }
  return result as ExtractorWrapper;
}

// ################################################################################################
export function resolveQueryTemplateWithExtractorCombinerTransformer(
  queryTemplate: BoxedQueryTemplateWithExtractorCombinerTransformer,
  modelEnvironment: MiroirModelEnvironment,
): BoxedQueryWithExtractorCombinerTransformer {

  const params: Record<string, any> = {
    // miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
    ...queryTemplate.pageParams,
    ...queryTemplate.queryParams,
  };

  log.info(
    "resolveQueryTemplateWithExtractorCombinerTransformer converting queryTemplate:",
    JSON.stringify(queryTemplate.extractorTemplates, null, 2),
    "params:",
    params
    // JSON.stringify(params, null, 2)
  );
  
  const queries = Object.fromEntries(
    Object.entries(queryTemplate.extractorTemplates ?? {}).map(
      (e: [string, ExtractorOrCombinerTemplate]) => [
        e[0],
        resolveExtractorTemplate(e[1], modelEnvironment, params, queryTemplate.contextResults), // TODO: generalize to ExtractorOrCombiner & check for failure!
      ]
    )
  );
  // log.info("resolveQueryTemplateWithExtractorCombinerTransformer converted extractorTemplates, result:", queries);
  
  const failedQueries = Object.values(queries).filter((e) => (e as any).queryFailure);
  if (failedQueries.length > 0) {
    throw new Error(
      "resolveQueryTemplateWithExtractorCombinerTransformer QueryNotExecutable failedQueries: " +
        JSON.stringify(failedQueries)
    );
  }

  // log.info(
  //   "resolveQueryTemplateWithExtractorCombinerTransformer converting combinerTemplates:",
  //   queryTemplate.combinerTemplates
  // );
  const combiners = Object.fromEntries(
    Object.entries(queryTemplate.combinerTemplates ?? {}).map(
      (e: [string, ExtractorOrCombinerTemplate]) => [
        e[0],
        resolveExtractorTemplate(e[1], modelEnvironment, params, queryTemplate.contextResults), // TODO: generalize to ExtractorOrCombiner & check for failure!
      ]
    )
  );

  // log.info("resolveQueryTemplateWithExtractorCombinerTransformer converted combinerTemplates, result:", combiners);
  const failures = Object.values(combiners??{}).find((e) => (e as any).queryFailure);
  if (failures && Array.isArray(failures) && failures?.length > 0) {
    throw new Error(
      "resolveQueryTemplateWithExtractorCombinerTransformer QueryNotExecutable for combiners: " +
        JSON.stringify(failures)
    );
  } else {
    log.info(
      "resolveQueryTemplateWithExtractorCombinerTransformer no failure for combiners: " +
        JSON.stringify(failures)
    );
  }
  const result: BoxedQueryWithExtractorCombinerTransformer = {
    queryType: "boxedQueryWithExtractorCombinerTransformer",
    pageParams: queryTemplate.pageParams,
    queryParams: queryTemplate.queryParams,
    contextResults: queryTemplate.contextResults,
    application: queryTemplate.application,
    extractors: queries as ExtractorOrCombinerRecord,
    combiners: combiners as Record<string, ExtractorOrCombiner>,
    runtimeTransformers: queryTemplate.runtimeTransformers,
  };
  log.info("resolveQueryTemplateWithExtractorCombinerTransformer converted query, result:", combiners);

  return result;
}

// ################################################################################################
export function resolveExtractorTemplateForExtractorOrCombinerReturningObjectOrObjectList(
  extractorTemplateReturningObjectOrObjectList: ExtractorTemplateReturningObjectOrObjectList,
  pageParams: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>,
  deploymentUuid: string //?
): ExtractorOrCombinerReturningObjectOrObjectList {

  const params = { ...pageParams, ...queryParams };

  // log.info("resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList converting extractorTemplates:", boxedExtractorTemplateReturningObject);
  
  const select = resolveExtractorTemplate(
    extractorTemplateReturningObjectOrObjectList,
    modelEnvironment,
    params,
    contextResults
  ) as any;
  // log.info("resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList converted extractorTemplates, result:", select);
  return select as ExtractorOrCombinerReturningObjectOrObjectList;
}

// ################################################################################################
export function resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList(
  boxedExtractorTemplateReturningObjectOrObjectList: BoxedExtractorTemplateReturningObjectOrObjectList,
  modelEnvironment: MiroirModelEnvironment,
): BoxedExtractorOrCombinerReturningObjectOrObjectList {

  const params: Record<string, any> = {
    // miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
    ...boxedExtractorTemplateReturningObjectOrObjectList.pageParams,
    ...boxedExtractorTemplateReturningObjectOrObjectList.queryParams,
  };

  // log.info("resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList converting extractorTemplates:", boxedExtractorTemplateReturningObject);
  
  const select = resolveExtractorTemplate(
    boxedExtractorTemplateReturningObjectOrObjectList.select,
    modelEnvironment,
    params,
    boxedExtractorTemplateReturningObjectOrObjectList.contextResults
  ) as any;
  // log.info("resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList converted extractorTemplates, result:", select);
  return {
    pageParams: boxedExtractorTemplateReturningObjectOrObjectList.pageParams,
    queryParams: boxedExtractorTemplateReturningObjectOrObjectList.queryParams,
    contextResults: boxedExtractorTemplateReturningObjectOrObjectList.contextResults,
    // applicationDeploymentMap: boxedExtractorTemplateReturningObjectOrObjectList.applicationDeploymentMap,
    application: boxedExtractorTemplateReturningObjectOrObjectList.application,
    // deploymentUuid: boxedExtractorTemplateReturningObjectOrObjectList.deploymentUuid,
    queryType:
      boxedExtractorTemplateReturningObjectOrObjectList.queryType == "boxedExtractorTemplateReturningObjectList"
        ? "boxedExtractorOrCombinerReturningObjectList"
        : "boxedExtractorOrCombinerReturningObject",
    select: select,
  };
}

// ################################################################################################
export function resolveExtractorOrQueryTemplate(
  extractorOrCombinerTemplate: ExtractorTemplateReturningObjectOrObjectList | BoxedQueryTemplateWithExtractorCombinerTransformer,
  pageParams: Record<string, any>,
  modelEnvironment: MiroirModelEnvironment,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>,
  deploymentUuid: string //?
): ExtractorOrCombinerReturningObjectOrObjectList | BoxedQueryWithExtractorCombinerTransformer {
  if ("queryType" in extractorOrCombinerTemplate) { // TODO: implementation-specific, to be improved!
    return resolveQueryTemplateWithExtractorCombinerTransformer(
      extractorOrCombinerTemplate as BoxedQueryTemplateWithExtractorCombinerTransformer,
      modelEnvironment,
    );
  } else {
    return resolveExtractorTemplateForExtractorOrCombinerReturningObjectOrObjectList(
      extractorOrCombinerTemplate,
      pageParams,
      modelEnvironment,
      queryParams,
      contextResults,
      deploymentUuid
    );
  }
}
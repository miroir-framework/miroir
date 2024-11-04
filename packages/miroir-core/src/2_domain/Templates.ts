import {
  ExtractorForDomainModelObjects,
  ExtractorForRecordOfExtractors,
  ExtractorTemplateForDomainModelObjects,
  ExtractorTemplateForRecordOfExtractors,
  MiroirQuery,
  ExtractorForObjectByDirectReference,
  QueryFailed,
  QuerySelectExtractorWrapper,
  QuerySelectExtractorWrapperReturningList,
  QueryTemplate,
  QueryTemplateSelectExtractorWrapper,
  QueryContextReference,
  Extractor,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { transformer_InnerReference_resolve } from "./Transformers";

const loggerName: string = getLoggerName(packageName, cleanLevel,"Templates");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// ################################################################################################
export function resolveQueryTemplate(
  queryTemplate: QueryTemplate,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>
): MiroirQuery | QueryFailed {
  switch (queryTemplate.queryType) {
    case "literal": {
      return queryTemplate;
    }
    case "extractorTemplateForObjectListByEntity": {
      if (queryTemplate.filter) {
        return {
          ...queryTemplate,
          queryType: "extractorForObjectListByEntity",
          parentUuid: transformer_InnerReference_resolve(
            "build",
            queryTemplate.parentUuid,
            queryParams,
            contextResults
          ).elementValue, // TODO: check for failure!
          filter: {
            attributeName: queryTemplate.filter.attributeName,
            value: transformer_InnerReference_resolve(
              "build",
              queryTemplate.filter.value,
              queryParams,
              contextResults
            ).elementValue, // TODO: check for failure!
          },
        };
      } else {
        return {
          ...queryTemplate,
          queryType: "extractorForObjectListByEntity",
          parentUuid: transformer_InnerReference_resolve(
            "build",
            queryTemplate.parentUuid,
            queryParams,
            contextResults
          ).elementValue, // TODO: check for failure!
        };
      }
      break;
    }
    case "extractorForObjectByDirectReference": {
      return {
        ...queryTemplate,
        queryType: "extractorForObjectByDirectReference",
        parentUuid: transformer_InnerReference_resolve(
          "build",
          queryTemplate.parentUuid,
          queryParams,
          contextResults
        ).elementValue, // TODO: check for failure!
        instanceUuid: transformer_InnerReference_resolve(
          "build",
          queryTemplate.instanceUuid,
          queryParams,
          contextResults
        ).elementValue, // TODO: check for failure!
      };
      break;
    }
    case "extractorWrapperReturningObject": {
      return {
        ...queryTemplate,
        queryType: "extractorWrapperReturningObject",
        definition: Object.fromEntries(
          Object.entries(queryTemplate.definition).map((e: [string, QueryTemplate]) => [
            e[0],
            resolveQueryTemplate(e[1], queryParams, contextResults) as ExtractorForObjectByDirectReference, // TODO: generalize to MiroirQuery & check for failure!
          ])
        ),
      };
      break;
    }
    case "extractorWrapperReturningList": {
      return {
        ...queryTemplate,
        queryType: "extractorWrapperReturningList",
        definition: queryTemplate.definition.map(
          (e: QueryTemplate) =>
            resolveQueryTemplate(e, queryParams, contextResults) as QuerySelectExtractorWrapperReturningList
        ),
      };
      break;
    }
    case "wrapperReturningObject": {
      return {
        ...queryTemplate,
        // queryType: "wrapperReturningObject",
        definition: Object.fromEntries(
          Object.entries(queryTemplate.definition).map((e: [string, QueryTemplate]) => [
            e[0],
            resolveQueryTemplate(e[1], queryParams, contextResults) as MiroirQuery, // TODO: generalize to MiroirQuery & check for failure!
          ])
        ),
      };
      break;
    }
    case "wrapperReturningList": {
      return {
        ...queryTemplate,
        // queryType: "extractorWrapperReturningList",
        definition: queryTemplate.definition.map(
          (e: QueryTemplate) => resolveQueryTemplate(e, queryParams, contextResults) as MiroirQuery
        ),
      };
      break;
    }
    case "combinerForObjectListByRelation": {
      return {
        ...queryTemplate,
        parentUuid: transformer_InnerReference_resolve(
          "build",
          queryTemplate.parentUuid,
          queryParams,
          contextResults
        ).elementValue, // TODO: check for failure!
        objectReference:
          queryTemplate.objectReference.transformerType == "contextReference"
            ? queryTemplate.objectReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectListByRelation query template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectListByRelation query template: objectReference is not a contextReference",
      };
      break;
    }
    case "combinerForObjectListByManyToManyRelation": {
      return {
        ...queryTemplate,
        parentUuid: transformer_InnerReference_resolve(
          "build",
          queryTemplate.parentUuid,
          queryParams,
          contextResults
        ).elementValue, // TODO: check for failure!
        objectListReference:
          queryTemplate.objectListReference.transformerType == "contextReference"
            ? queryTemplate.objectListReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectListByRelation query template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectListByRelation query template: objectReference is not a contextReference",
      };
      break;
    }
    case "combinerForObjectByRelation": {
      return {
        ...queryTemplate,
        parentUuid: transformer_InnerReference_resolve("build", queryTemplate.parentUuid, queryParams, contextResults)
          .elementValue, // TODO: check for failure!
        objectReference:
          queryTemplate.objectReference.transformerType == "contextReference"
            ? queryTemplate.objectReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectByRelation query template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectByRelation query template: objectReference is not a contextReference",
      };
      break;
    }
    case "queryCombiner": {
      return {
        ...queryTemplate,
        rootExtractorOrReference: resolveQueryTemplate(queryTemplate.rootExtractorOrReference, queryParams, contextResults) as Extractor | QueryContextReference, // TODO: check for failure!
      };
      break;
    }
    case "queryContextReference": {
      return queryTemplate;
      break;
    }
    default: {
      return {
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["AsyncQuerySelectors", "resolveQueryTemplate"],
        query: JSON.stringify(queryTemplate),
      };
      break;
    }
  }
}

// ################################################################################################
export function resolveQueryTemplateSelectExtractorWrapper(
  queryTemplate: QueryTemplateSelectExtractorWrapper,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>
): QuerySelectExtractorWrapper {
  const result = resolveQueryTemplate(queryTemplate, queryParams, contextResults);
  if ((result as any).queryFailure) {
    throw new Error("QueryNotExecutable");
  }
  return result as QuerySelectExtractorWrapper;
}

// ################################################################################################
export function resolveExtractorTemplateForRecordOfExtractors(
  recordOfExtractorTemplate: ExtractorTemplateForRecordOfExtractors,
): ExtractorForRecordOfExtractors {

  const params = { ...recordOfExtractorTemplate.pageParams, ...recordOfExtractorTemplate.queryParams };

  log.info("resolveExtractorTemplateForRecordOfExtractors converting extractorTemplates:", recordOfExtractorTemplate.extractorTemplates);
  
  const queries = Object.fromEntries(
    Object.entries(recordOfExtractorTemplate.extractorTemplates ?? {}).map(
      (e: [string, QueryTemplateSelectExtractorWrapper]) => [
        e[0],
        resolveQueryTemplateSelectExtractorWrapper(e[1], params, recordOfExtractorTemplate.contextResults), // TODO: generalize to MiroirQuery & check for failure!
      ]
    )
  );
  log.info("resolveExtractorTemplateForRecordOfExtractors converted extractorTemplates, result:", queries);
  
  log.info("resolveExtractorTemplateForRecordOfExtractors converting combinerTemplates:", recordOfExtractorTemplate.combinerTemplates);
  const combiners = Object.fromEntries(
    Object.entries(recordOfExtractorTemplate.combinerTemplates ?? {}).map((e: [string, QueryTemplate]) => [
      e[0],
      resolveQueryTemplate(e[1], params, recordOfExtractorTemplate.contextResults), // TODO: generalize to MiroirQuery & check for failure!
    ])
  );

  log.info("resolveExtractorTemplateForRecordOfExtractors converted combinerTemplates, result:", combiners);
  
  if (Object.values(combiners).find((e) => (e as any).queryFailure)) {
    throw new Error("QueryNotExecutable");
  }

  return {
    pageParams: recordOfExtractorTemplate.pageParams,
    queryParams: recordOfExtractorTemplate.queryParams,
    contextResults: recordOfExtractorTemplate.contextResults,
    deploymentUuid: recordOfExtractorTemplate.deploymentUuid,
    queryType: "extractorForRecordOfExtractors",
    extractors: queries,
    combiners: combiners as Record<string, MiroirQuery>,
    runtimeTransformers: recordOfExtractorTemplate.runtimeTransformers,
  };
}

// ################################################################################################
export function resolveExtractorTemplateForDomainModelObjects(
  extractorTemplateForDomainModelObjects: ExtractorTemplateForDomainModelObjects,
): ExtractorForDomainModelObjects {

  const params = { ...extractorTemplateForDomainModelObjects.pageParams, ...extractorTemplateForDomainModelObjects.queryParams };

  log.info("resolveExtractorTemplateForDomainModelObjects converting extractorTemplates:", extractorTemplateForDomainModelObjects);
  
  const select = resolveQueryTemplate(
    extractorTemplateForDomainModelObjects.select,
    params,
    extractorTemplateForDomainModelObjects.contextResults
  ) as any;
  log.info("resolveExtractorTemplateForDomainModelObjects converted extractorTemplates, result:", select);
  return {
    pageParams: extractorTemplateForDomainModelObjects.pageParams,
    queryParams: extractorTemplateForDomainModelObjects.queryParams,
    contextResults: extractorTemplateForDomainModelObjects.contextResults,
    deploymentUuid: extractorTemplateForDomainModelObjects.deploymentUuid,
    queryType: "extractorForDomainModelObjects",
    select: select,
    // runtimeTransformers: extractorTemplateForDomainModelObjects.runtimeTransformers,
  }
}

// ################################################################################################
export function resolveExtractorTemplate(
  extractorTemplate: ExtractorTemplateForDomainModelObjects | ExtractorTemplateForRecordOfExtractors
): ExtractorForDomainModelObjects | ExtractorForRecordOfExtractors {
  if ('select' in extractorTemplate) { // TODO: implementation-specific, to be improved!
    return resolveExtractorTemplateForDomainModelObjects(extractorTemplate);
  } else {
    return resolveExtractorTemplateForRecordOfExtractors(extractorTemplate);
  }
}
import {
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  QueryWithExtractorCombinerTransformer,
  ExtractorTemplateForDomainModelObjects,
  QueryTemplateWithExtractorCombinerTransformer,
  ExtractorOrCombiner,
  ExtractorForObjectByDirectReference,
  QueryFailed,
  ExtractorWrapper,
  ExtractorWrapperReturningList,
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
): ExtractorOrCombiner | QueryFailed {
  const cleanQueryTemplate: any = { ...queryTemplate }
  delete cleanQueryTemplate.queryType;

  switch (queryTemplate.queryType) {
    case "literal": {
      return {
        extractorOrCombinerType: "literal",
        definition: queryTemplate.definition,
      };
    }
    case "extractorTemplateForObjectListByEntity": {
      if (queryTemplate.filter) {
        return {
          ...cleanQueryTemplate,
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          // applicationSection: queryTemplate.applicationSection,
          // parentName: queryTemplate.parentName,
          parentUuid:
            typeof queryTemplate.parentUuid == "string"
              ? queryTemplate.parentUuid
              : transformer_InnerReference_resolve("build", queryTemplate.parentUuid, queryParams, contextResults)
                  .elementValue, // TODO: check for failure!
          filter: {
            attributeName: queryTemplate.filter.attributeName,
            value: transformer_InnerReference_resolve("build", queryTemplate.filter.value, queryParams, contextResults)
              .elementValue, // TODO: check for failure!
          },
        };
      } else {
        return {
          ...queryTemplate,
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          // applicationSection: queryTemplate.applicationSection,
          // parentName: queryTemplate.parentName,
          parentUuid: typeof queryTemplate.parentUuid == "string"
          ? queryTemplate.parentUuid
          : transformer_InnerReference_resolve("build", queryTemplate.parentUuid, queryParams, contextResults)
            .elementValue, // TODO: check for failure!
        };
      }
      break;
    }
    case "extractorForObjectByDirectReference": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: "extractorForObjectByDirectReference",
        // applicationSection: queryTemplate.applicationSection,
        // parentName: queryTemplate.parentName,
        parentUuid:
          typeof queryTemplate.parentUuid == "string"
            ? queryTemplate.parentUuid
            : transformer_InnerReference_resolve("build", queryTemplate.parentUuid, queryParams, contextResults)
                .elementValue, // TODO: check for failure!
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
        ...cleanQueryTemplate,
        extractorOrCombinerType: "extractorWrapperReturningObject",
        definition: Object.fromEntries(
          Object.entries(queryTemplate.definition).map((e: [string, QueryTemplate]) => [
            e[0],
            resolveQueryTemplate(e[1], queryParams, contextResults) as ExtractorForObjectByDirectReference, // TODO: generalize to ExtractorOrCombiner & check for failure!
          ])
        ),
      };
      break;
    }
    case "extractorWrapperReturningList": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: "extractorWrapperReturningList",
        definition: queryTemplate.definition.map(
          (e: QueryTemplate) =>
            resolveQueryTemplate(e, queryParams, contextResults) as ExtractorWrapperReturningList
        ),
      };
      break;
    }
    case "combiner_wrapperReturningObject": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: queryTemplate.queryType,
        definition: Object.fromEntries(
          Object.entries(queryTemplate.definition).map((e: [string, QueryTemplate]) => [
            e[0],
            resolveQueryTemplate(e[1], queryParams, contextResults) as ExtractorOrCombiner, // TODO: generalize to ExtractorOrCombiner & check for failure!
          ])
        ),
      };
      break;
    }
    case "combiner_wrapperReturningList": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: queryTemplate.queryType,
        definition: queryTemplate.definition.map(
          (e: QueryTemplate) => resolveQueryTemplate(e, queryParams, contextResults) as ExtractorOrCombiner
        ),
      };
      break;
    }
    case "combinerByRelationReturningObjectList": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: queryTemplate.queryType,
        // applicationSection: queryTemplate.applicationSection,
        // AttributeOfListObjectToCompareToReferenceUuid: queryTemplate.AttributeOfListObjectToCompareToReferenceUuid,
        // parentName: queryTemplate.parentName,
        parentUuid:
          typeof queryTemplate.parentUuid == "string"
            ? queryTemplate.parentUuid
            : transformer_InnerReference_resolve("build", queryTemplate.parentUuid, queryParams, contextResults)
                .elementValue, // TODO: check for failure!
        objectReference:
          queryTemplate.objectReference.transformerType == "contextReference"
            ? queryTemplate.objectReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList query template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList query template: objectReference is not a contextReference",
      };
      break;
    }
    case "combinerByManyToManyRelationReturningObjectList": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: queryTemplate.queryType,
        // applicationSection: queryTemplate.applicationSection,
        // parentName: queryTemplate.parentName,
        // objectListReferenceAttribute: queryTemplate.objectListReferenceAttribute,
        parentUuid:
          typeof queryTemplate.parentUuid == "string"
            ? queryTemplate.parentUuid
            : transformer_InnerReference_resolve("build", queryTemplate.parentUuid, queryParams, contextResults)
                .elementValue, // TODO: check for failure!
        objectListReference:
          queryTemplate.objectListReference.transformerType == "contextReference"
            ? queryTemplate.objectListReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList query template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList query template: objectReference is not a contextReference",
      };
      break;
    }
    case "combinerForObjectByRelation": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: queryTemplate.queryType,
        // applicationSection: queryTemplate.applicationSection,
        // AttributeOfObjectToCompareToReferenceUuid: queryTemplate.AttributeOfObjectToCompareToReferenceUuid,
        // parentName: queryTemplate.parentName,
        parentUuid:
          typeof queryTemplate.parentUuid == "string"
            ? queryTemplate.parentUuid
            : transformer_InnerReference_resolve("build", queryTemplate.parentUuid, queryParams, contextResults)
                .elementValue, // TODO: check for failure!
        objectReference:
          queryTemplate.objectReference.transformerType == "contextReference"
            ? queryTemplate.objectReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectByRelation query template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectByRelation query template: objectReference is not a contextReference",
      };
      break;
    }
    case "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: queryTemplate.queryType,
        // subQueryTemplate: queryTemplate.subQueryTemplate,
        rootExtractorOrReference:
          typeof queryTemplate.rootExtractorOrReference == "string"
            ? queryTemplate.rootExtractorOrReference
            : (resolveQueryTemplate(queryTemplate.rootExtractorOrReference, queryParams, contextResults) as Extractor), // TODO: check for failure!
      };
      break;
    }
    case "queryContextReference": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: "extractorOrCombinerContextReference",
        extractorOrCombinerContextReference: queryTemplate.queryReference,
      };
      // throw new Error("resolveQueryTemplate cannot resolve queryContextReference to extractorOrCombiner");
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
): ExtractorWrapper {
  const result = resolveQueryTemplate(queryTemplate, queryParams, contextResults);
  if ((result as any).queryFailure) {
    throw new Error("QueryNotExecutable");
  }
  return result as ExtractorWrapper;
}

// ################################################################################################
export function resolveExtractorTemplateForRecordOfExtractors(
  recordOfExtractorTemplate: QueryTemplateWithExtractorCombinerTransformer,
): QueryWithExtractorCombinerTransformer {

  const params = { ...recordOfExtractorTemplate.pageParams, ...recordOfExtractorTemplate.queryParams };

  log.info(
    "resolveExtractorTemplateForRecordOfExtractors converting extractorTemplates:",
    recordOfExtractorTemplate.extractorTemplates
  );
  
  const queries = Object.fromEntries(
    Object.entries(recordOfExtractorTemplate.extractorTemplates ?? {}).map(
      (e: [string, QueryTemplateSelectExtractorWrapper]) => [
        e[0],
        resolveQueryTemplateSelectExtractorWrapper(e[1], params, recordOfExtractorTemplate.contextResults), // TODO: generalize to ExtractorOrCombiner & check for failure!
      ]
    )
  );
  log.info("resolveExtractorTemplateForRecordOfExtractors converted extractorTemplates, result:", queries);
  
  log.info(
    "resolveExtractorTemplateForRecordOfExtractors converting combinerTemplates:",
    recordOfExtractorTemplate.combinerTemplates
  );
  const combiners = Object.fromEntries(
    Object.entries(recordOfExtractorTemplate.combinerTemplates ?? {}).map((e: [string, QueryTemplate]) => [
      e[0],
      resolveQueryTemplate(e[1], params, recordOfExtractorTemplate.contextResults), // TODO: generalize to ExtractorOrCombiner & check for failure!
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
    queryType: "queryWithExtractorCombinerTransformer",
    extractors: queries,
    combiners: combiners as Record<string, ExtractorOrCombiner>,
    runtimeTransformers: recordOfExtractorTemplate.runtimeTransformers,
  };
}

// ################################################################################################
export function resolveExtractorTemplateForDomainModelObjects(
  extractorTemplateForDomainModelObjects: ExtractorTemplateForDomainModelObjects,
): QueryForExtractorOrCombinerReturningObjectOrObjectList {

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
    queryType: "queryForExtractorOrCombinerReturningObjectList",
    select: select,
    // runtimeTransformers: extractorTemplateForDomainModelObjects.runtimeTransformers,
  }
}

// ################################################################################################
export function resolveExtractorTemplate(
  extractorTemplate: ExtractorTemplateForDomainModelObjects | QueryTemplateWithExtractorCombinerTransformer
): QueryForExtractorOrCombinerReturningObjectOrObjectList | QueryWithExtractorCombinerTransformer {
  if ('select' in extractorTemplate) { // TODO: implementation-specific, to be improved!
    return resolveExtractorTemplateForDomainModelObjects(extractorTemplate);
  } else {
    return resolveExtractorTemplateForRecordOfExtractors(extractorTemplate);
  }
}
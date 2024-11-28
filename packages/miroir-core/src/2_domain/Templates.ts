import {
  Extractor,
  ExtractorOrCombiner,
  ExtractorOrCombinerRecord,
  ExtractorTemplateForDomainModelObjects,
  ExtractorWrapper,
  QueryContextReference,
  QueryFailed,
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  ExtractorOrCombinerTemplate,
  ExtractorTemplateByExtractorWrapper,
  QueryTemplateWithExtractorCombinerTransformer,
  QueryWithExtractorCombinerTransformer
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
export function resolveExtractorTemplate(
  extractorOrCombinerTemplate: ExtractorOrCombinerTemplate,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>
): ExtractorOrCombiner | QueryFailed {
  const cleanQueryTemplate: any = { ...extractorOrCombinerTemplate }
  delete cleanQueryTemplate.queryType;

  switch (extractorOrCombinerTemplate.queryType) {
    case "literal": {
      return {
        extractorOrCombinerType: "literal",
        definition: extractorOrCombinerTemplate.definition,
      };
    }
    case "extractorTemplateForObjectListByEntity": {
      if (extractorOrCombinerTemplate.filter) {
        return {
          ...cleanQueryTemplate,
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          // applicationSection: queryTemplate.applicationSection,
          // parentName: queryTemplate.parentName,
          parentUuid:
            typeof extractorOrCombinerTemplate.parentUuid == "string"
              ? extractorOrCombinerTemplate.parentUuid
              : transformer_InnerReference_resolve("build", extractorOrCombinerTemplate.parentUuid, queryParams, contextResults)
                  .elementValue, // TODO: check for failure!
          filter: {
            attributeName: extractorOrCombinerTemplate.filter.attributeName,
            value: transformer_InnerReference_resolve("build", extractorOrCombinerTemplate.filter.value, queryParams, contextResults)
              .elementValue, // TODO: check for failure!
          },
        };
      } else {
        return {
          ...extractorOrCombinerTemplate,
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          // applicationSection: queryTemplate.applicationSection,
          // parentName: queryTemplate.parentName,
          parentUuid:
            typeof extractorOrCombinerTemplate.parentUuid == "string"
              ? extractorOrCombinerTemplate.parentUuid
              : transformer_InnerReference_resolve("build", extractorOrCombinerTemplate.parentUuid, queryParams, contextResults)
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
          typeof extractorOrCombinerTemplate.parentUuid == "string"
            ? extractorOrCombinerTemplate.parentUuid
            : transformer_InnerReference_resolve("build", extractorOrCombinerTemplate.parentUuid, queryParams, contextResults)
                .elementValue, // TODO: check for failure!
        instanceUuid: transformer_InnerReference_resolve(
          "build",
          extractorOrCombinerTemplate.instanceUuid,
          queryParams,
          contextResults
        ).elementValue, // TODO: check for failure!
      };
      break;
    }
    case "extractorTemplateByExtractorWrapperReturningObject": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: "extractorWrapperReturningObject",
        definition: Object.fromEntries(
          Object.entries(extractorOrCombinerTemplate.definition).map((e: [string, QueryContextReference]) => [
            e[0],
            {
              extractorOrCombinerType: "extractorOrCombinerContextReference",
              extractorOrCombinerContextReference: e[1].queryReference
            } as ExtractorOrCombiner,
          ])
        ),
      };
      break;
    }
    case "extractorTemplateByExtractorWrapperReturningList": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: "extractorWrapperReturningList",
        definition: extractorOrCombinerTemplate.definition.map(
          (e: QueryContextReference) => ({
              extractorOrCombinerType: "extractorOrCombinerContextReference",
              extractorOrCombinerContextReference: e.queryReference
            }) as ExtractorOrCombiner,
        ),
      };
      break;
    }
    case "combinerByRelationReturningObjectList": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: extractorOrCombinerTemplate.queryType,
        // applicationSection: queryTemplate.applicationSection,
        // AttributeOfListObjectToCompareToReferenceUuid: queryTemplate.AttributeOfListObjectToCompareToReferenceUuid,
        // parentName: queryTemplate.parentName,
        parentUuid:
          typeof extractorOrCombinerTemplate.parentUuid == "string"
            ? extractorOrCombinerTemplate.parentUuid
            : transformer_InnerReference_resolve("build", extractorOrCombinerTemplate.parentUuid, queryParams, contextResults)
                .elementValue, // TODO: check for failure!
        objectReference:
          extractorOrCombinerTemplate.objectReference.transformerType == "contextReference"
            ? extractorOrCombinerTemplate.objectReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList extractor template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList extractor template: objectReference is not a contextReference",
      };
      break;
    }
    case "combinerByManyToManyRelationReturningObjectList": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: extractorOrCombinerTemplate.queryType,
        // applicationSection: queryTemplate.applicationSection,
        // parentName: queryTemplate.parentName,
        // objectListReferenceAttribute: queryTemplate.objectListReferenceAttribute,
        parentUuid:
          typeof extractorOrCombinerTemplate.parentUuid == "string"
            ? extractorOrCombinerTemplate.parentUuid
            : transformer_InnerReference_resolve("build", extractorOrCombinerTemplate.parentUuid, queryParams, contextResults)
                .elementValue, // TODO: check for failure!
        objectListReference:
          extractorOrCombinerTemplate.objectListReference.transformerType == "contextReference"
            ? extractorOrCombinerTemplate.objectListReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList extractor template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerByRelationReturningObjectList extractor template: objectReference is not a contextReference",
      };
      break;
    }
    case "combinerForObjectByRelation": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: extractorOrCombinerTemplate.queryType,
        // applicationSection: queryTemplate.applicationSection,
        // AttributeOfObjectToCompareToReferenceUuid: queryTemplate.AttributeOfObjectToCompareToReferenceUuid,
        // parentName: queryTemplate.parentName,
        parentUuid:
          typeof extractorOrCombinerTemplate.parentUuid == "string"
            ? extractorOrCombinerTemplate.parentUuid
            : transformer_InnerReference_resolve("build", extractorOrCombinerTemplate.parentUuid, queryParams, contextResults)
                .elementValue, // TODO: check for failure!
        objectReference:
          extractorOrCombinerTemplate.objectReference.transformerType == "contextReference"
            ? extractorOrCombinerTemplate.objectReference.referenceName ??
              "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectByRelation extractor template: no referenceName"
            : "ERROR CONVERTING OBJECT REFERENCE FOR combinerForObjectByRelation extractor template: objectReference is not a contextReference",
      };
      break;
    }
    case "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList": {
      return {
        ...cleanQueryTemplate,
        extractorOrCombinerType: extractorOrCombinerTemplate.queryType,
        rootExtractorOrReference:
          typeof extractorOrCombinerTemplate.rootExtractorOrReference == "string"
            ? extractorOrCombinerTemplate.rootExtractorOrReference
            : (resolveExtractorTemplate(
                extractorOrCombinerTemplate.rootExtractorOrReference,
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
  queryParams: Record<string, any>,
  contextResults: Record<string, any>
): ExtractorWrapper {
  const result = resolveExtractorTemplate(queryTemplate, queryParams, contextResults);
  if ((result as any).queryFailure) {
    throw new Error("QueryNotExecutable");
  }
  return result as ExtractorWrapper;
}

// ################################################################################################
export function resolveQueryTemplate(
  queryTemplate: QueryTemplateWithExtractorCombinerTransformer,
): QueryWithExtractorCombinerTransformer {

  const params = { ...queryTemplate.pageParams, ...queryTemplate.queryParams };

  log.info(
    "resolveQueryTemplate converting queryTemplate:",
    JSON.stringify(queryTemplate.extractorTemplates, null, 2)
  );
  
  const queries = Object.fromEntries(
    Object.entries(queryTemplate.extractorTemplates ?? {}).map(
      (e: [string, ExtractorOrCombinerTemplate]) => [
        e[0],
        resolveExtractorTemplate(e[1], params, queryTemplate.contextResults), // TODO: generalize to ExtractorOrCombiner & check for failure!
      ]
    )
  );
  // log.info("resolveQueryTemplate converted extractorTemplates, result:", queries);
  
  const failedQueries = Object.values(queries).filter((e) => (e as any).queryFailure);
  if (failedQueries.length > 0) {
    throw new Error("resolveQueryTemplate QueryNotExecutable failedQueries: " + JSON.stringify(failedQueries));
  }

  // log.info(
  //   "resolveQueryTemplate converting combinerTemplates:",
  //   queryTemplate.combinerTemplates
  // );
  const combiners = Object.fromEntries(
    Object.entries(queryTemplate.combinerTemplates ?? {}).map((e: [string, ExtractorOrCombinerTemplate]) => [
      e[0],
      resolveExtractorTemplate(e[1], params, queryTemplate.contextResults), // TODO: generalize to ExtractorOrCombiner & check for failure!
    ])
  );

  // log.info("resolveQueryTemplate converted combinerTemplates, result:", combiners);
  const failures = Object.values(combiners??{}).find((e) => (e as any).queryFailure);
  if (failures && Array.isArray(failures) && failures?.length > 0) {
    throw new Error("resolveQueryTemplate QueryNotExecutable for combiners: " + JSON.stringify(failures));
  } else {
    log.info("resolveQueryTemplate no failure for combiners: " + JSON.stringify(failures));
  }
  const result: QueryWithExtractorCombinerTransformer = {
    pageParams: queryTemplate.pageParams,
    queryParams: queryTemplate.queryParams,
    contextResults: queryTemplate.contextResults,
    deploymentUuid: queryTemplate.deploymentUuid,
    queryType: "queryWithExtractorCombinerTransformer",
    extractors: queries as ExtractorOrCombinerRecord,
    combiners: combiners as Record<string, ExtractorOrCombiner>,
    runtimeTransformers: queryTemplate.runtimeTransformers,
  };
  log.info("resolveQueryTemplate converted query, result:", combiners);

  return result;
}

// ################################################################################################
export function resolveExtractorTemplateForDomainModelObjects(
  extractorTemplateForDomainModelObjects: ExtractorTemplateForDomainModelObjects,
): QueryForExtractorOrCombinerReturningObjectOrObjectList {

  const params = { ...extractorTemplateForDomainModelObjects.pageParams, ...extractorTemplateForDomainModelObjects.queryParams };

  // log.info("resolveExtractorTemplateForDomainModelObjects converting extractorTemplates:", extractorTemplateForDomainModelObjects);
  
  const select = resolveExtractorTemplate(
    extractorTemplateForDomainModelObjects.select,
    params,
    extractorTemplateForDomainModelObjects.contextResults
  ) as any;
  // log.info("resolveExtractorTemplateForDomainModelObjects converted extractorTemplates, result:", select);
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
export function resolveExtractorOrQueryTemplate(
  extractorOrCombinerTemplate: ExtractorTemplateForDomainModelObjects | QueryTemplateWithExtractorCombinerTransformer
): QueryForExtractorOrCombinerReturningObjectOrObjectList | QueryWithExtractorCombinerTransformer {
  if ('select' in extractorOrCombinerTemplate) { // TODO: implementation-specific, to be improved!
    return resolveExtractorTemplateForDomainModelObjects(extractorOrCombinerTemplate);
  } else {
    return resolveQueryTemplate(extractorOrCombinerTemplate);
  }
}
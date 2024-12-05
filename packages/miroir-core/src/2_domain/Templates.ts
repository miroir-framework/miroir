import {
  Extractor,
  ExtractorOrCombiner,
  ExtractorOrCombinerRecord,
  BoxedExtractorTemplateReturningObject,
  ExtractorWrapper,
  QueryFailed,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  ExtractorOrCombinerTemplate,
  ExtractorTemplateByExtractorWrapper,
  QueryTemplateWithExtractorCombinerTransformer,
  QueryWithExtractorCombinerTransformer,
  Transformer_InnerReference,
  Transformer_contextOrParameterReference,
  BoxedExtractorTemplateReturningObjectOrObjectList,
  ExtractorTemplateReturningObjectOrObjectList,
  ExtractorOrCombinerReturningObjectOrObjectList
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
  // delete cleanQueryTemplate.queryType;
  delete cleanQueryTemplate.extractorTemplateType;

  switch (extractorOrCombinerTemplate.extractorTemplateType) {
    case "literal": {
      return {
        extractorOrCombinerType: "literal",
        definition: extractorOrCombinerTemplate.definition,
      };
    }
    case "extractorTemplateForObjectListByEntity": {
      if (extractorOrCombinerTemplate.filter) {
        return {
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          ...cleanQueryTemplate,
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
          extractorOrCombinerType: "extractorByEntityReturningObjectList",
          ...cleanQueryTemplate,
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
        extractorOrCombinerType: "extractorForObjectByDirectReference",
        ...cleanQueryTemplate,
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
        extractorOrCombinerType: "extractorWrapperReturningObject",
        ...cleanQueryTemplate,
        definition: Object.fromEntries(
          Object.entries(extractorOrCombinerTemplate.definition).map((e: [string, Transformer_contextOrParameterReference]) => [
            e[0],
            {
              extractorOrCombinerType: "extractorOrCombinerContextReference",
              extractorOrCombinerContextReference: e[1].referenceName
            } as ExtractorOrCombiner,
          ])
        ),
      };
      break;
    }
    case "extractorTemplateByExtractorWrapperReturningList": {
      return {
        extractorOrCombinerType: "extractorWrapperReturningList",
        ...cleanQueryTemplate,
        definition: extractorOrCombinerTemplate.definition.map(
          (e: Transformer_contextOrParameterReference) => ({
              extractorOrCombinerType: "extractorOrCombinerContextReference",
              extractorOrCombinerContextReference: e.referenceName
            }) as ExtractorOrCombiner,
        ),
      };
      break;
    }
    case "combinerByRelationReturningObjectList": {
      return {
        extractorOrCombinerType: extractorOrCombinerTemplate.extractorTemplateType,
        ...cleanQueryTemplate,
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
        extractorOrCombinerType: extractorOrCombinerTemplate.extractorTemplateType,
        ...cleanQueryTemplate,
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
        extractorOrCombinerType: extractorOrCombinerTemplate.extractorTemplateType,
        ...cleanQueryTemplate,
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
        extractorOrCombinerType: extractorOrCombinerTemplate.extractorTemplateType,
        ...cleanQueryTemplate,
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
export function resolveQueryTemplateWithExtractorCombinerTransformer(
  queryTemplate: QueryTemplateWithExtractorCombinerTransformer,
): QueryWithExtractorCombinerTransformer {

  const params = { ...queryTemplate.pageParams, ...queryTemplate.queryParams };

  log.info(
    "resolveQueryTemplateWithExtractorCombinerTransformer converting queryTemplate:",
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
  // log.info("resolveQueryTemplateWithExtractorCombinerTransformer converted extractorTemplates, result:", queries);
  
  const failedQueries = Object.values(queries).filter((e) => (e as any).queryFailure);
  if (failedQueries.length > 0) {
    throw new Error("resolveQueryTemplateWithExtractorCombinerTransformer QueryNotExecutable failedQueries: " + JSON.stringify(failedQueries));
  }

  // log.info(
  //   "resolveQueryTemplateWithExtractorCombinerTransformer converting combinerTemplates:",
  //   queryTemplate.combinerTemplates
  // );
  const combiners = Object.fromEntries(
    Object.entries(queryTemplate.combinerTemplates ?? {}).map((e: [string, ExtractorOrCombinerTemplate]) => [
      e[0],
      resolveExtractorTemplate(e[1], params, queryTemplate.contextResults), // TODO: generalize to ExtractorOrCombiner & check for failure!
    ])
  );

  // log.info("resolveQueryTemplateWithExtractorCombinerTransformer converted combinerTemplates, result:", combiners);
  const failures = Object.values(combiners??{}).find((e) => (e as any).queryFailure);
  if (failures && Array.isArray(failures) && failures?.length > 0) {
    throw new Error("resolveQueryTemplateWithExtractorCombinerTransformer QueryNotExecutable for combiners: " + JSON.stringify(failures));
  } else {
    log.info("resolveQueryTemplateWithExtractorCombinerTransformer no failure for combiners: " + JSON.stringify(failures));
  }
  const result: QueryWithExtractorCombinerTransformer = {
    queryType: "queryWithExtractorCombinerTransformer",
    pageParams: queryTemplate.pageParams,
    queryParams: queryTemplate.queryParams,
    contextResults: queryTemplate.contextResults,
    deploymentUuid: queryTemplate.deploymentUuid,
    
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
  queryParams: Record<string, any>,
  contextResults: Record<string, any>,
  deploymentUuid: string //?
): ExtractorOrCombinerReturningObjectOrObjectList {

  // const params = { ...extractorTemplateReturningObjectOrObjectList.pageParams, ...extractorTemplateReturningObjectOrObjectList.queryParams };
  const params = { ...pageParams, ...queryParams };

  // log.info("resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList converting extractorTemplates:", boxedExtractorTemplateReturningObject);
  
  const select = resolveExtractorTemplate(
    extractorTemplateReturningObjectOrObjectList,
    params,
    contextResults
  ) as any;
  // log.info("resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList converted extractorTemplates, result:", select);
  return select as ExtractorOrCombinerReturningObjectOrObjectList;
  // return {
  //   // pageParams: pageParams,
  //   // queryParams: queryParams,
  //   // contextResults: contextResults,
  //   // deploymentUuid: deploymentUuid,
  //   : extractorTemplateReturningObjectOrObjectList.extractorTemplateType,
  //     // extractorTemplateReturningObjectOrObjectList.extractorTemplateType == "extractorTemplateReturningObjectList"
  //     //   ? "boxedExtractorOrCombinerReturningObjectList"
  //     //   : "boxedExtractorOrCombinerReturningObject",
  //   select: select,
  //   // runtimeTransformers: boxedExtractorTemplateReturningObject.runtimeTransformers,
  // };
}

// ################################################################################################
export function resolveBoxedExtractorOrCombinerTemplateReturningObjectOrObjectList(
  boxedExtractorTemplateReturningObjectOrObjectList: BoxedExtractorTemplateReturningObjectOrObjectList,
): BoxedExtractorOrCombinerReturningObjectOrObjectList {

  const params = { ...boxedExtractorTemplateReturningObjectOrObjectList.pageParams, ...boxedExtractorTemplateReturningObjectOrObjectList.queryParams };

  // log.info("resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList converting extractorTemplates:", boxedExtractorTemplateReturningObject);
  
  const select = resolveExtractorTemplate(
    boxedExtractorTemplateReturningObjectOrObjectList.select,
    params,
    boxedExtractorTemplateReturningObjectOrObjectList.contextResults
  ) as any;
  // log.info("resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList converted extractorTemplates, result:", select);
  return {
    pageParams: boxedExtractorTemplateReturningObjectOrObjectList.pageParams,
    queryParams: boxedExtractorTemplateReturningObjectOrObjectList.queryParams,
    contextResults: boxedExtractorTemplateReturningObjectOrObjectList.contextResults,
    deploymentUuid: boxedExtractorTemplateReturningObjectOrObjectList.deploymentUuid,
    queryType:
      boxedExtractorTemplateReturningObjectOrObjectList.queryType == "boxedExtractorTemplateReturningObjectList"
        ? "boxedExtractorOrCombinerReturningObjectList"
        : "boxedExtractorOrCombinerReturningObject",
    select: select,
    // runtimeTransformers: boxedExtractorTemplateReturningObject.runtimeTransformers,
  };
}

// ################################################################################################
export function resolveExtractorOrQueryTemplate(
  // extractorOrCombinerTemplate: BoxedExtractorTemplateReturningObjectOrObjectList | QueryTemplateWithExtractorCombinerTransformer
  extractorOrCombinerTemplate: ExtractorTemplateReturningObjectOrObjectList | QueryTemplateWithExtractorCombinerTransformer,
  pageParams: Record<string, any>,
  queryParams: Record<string, any>,
  contextResults: Record<string, any>,
  deploymentUuid: string //?
// ): BoxedExtractorOrCombinerReturningObjectOrObjectList | QueryWithExtractorCombinerTransformer {
): ExtractorOrCombinerReturningObjectOrObjectList | QueryWithExtractorCombinerTransformer {
  if ("queryType" in extractorOrCombinerTemplate) { // TODO: implementation-specific, to be improved!
    return resolveQueryTemplateWithExtractorCombinerTransformer(extractorOrCombinerTemplate as QueryTemplateWithExtractorCombinerTransformer);
  } else {
    // return resolveQueryTemplateForBoxedExtractorOrCombinerReturningObjectOrObjectList(extractorOrCombinerTemplate);
    return resolveExtractorTemplateForExtractorOrCombinerReturningObjectOrObjectList(
      extractorOrCombinerTemplate,
      pageParams,
      queryParams,
      contextResults,
      deploymentUuid
    );
  }
}
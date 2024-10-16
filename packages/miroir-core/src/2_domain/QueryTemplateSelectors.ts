// ################################################################################################

import { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  ApplicationSection,
  DomainElement,
  DomainElementInstanceUuidIndex,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaForExtractorTemplate,
  DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate,
  DomainModelQueryTemplateJzodSchemaParams,
  EntityInstance,
  ExtendedTransformerForRuntime,
  ExtractorForDomainModelObjects,
  ExtractorForRecordOfExtractors,
  ExtractorTemplateForDomainModelObjects,
  ExtractorTemplateForRecordOfExtractors,
  ExtractorTemplateForSingleObjectList,
  JzodElement,
  JzodObject,
  QueryTemplate,
  QueryTemplateExtractObjectListByEntity,
  QueryTemplateSelectObjectListByManyToManyRelation,
  QueryTemplateSelectObjectListByRelation,
  TransformerForRuntime
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  AsyncExtractorTemplateRunnerMap,
  ExtractorTemplateRunnerParamsForJzodSchema,
  RecordOfJzodElement,
  RecordOfJzodObject,
  SyncExtractorTemplateRunnerMap,
  SyncExtractorTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { extractWithExtractor, extractWithManyExtractors, innerSelectElementFromQuery } from "./QuerySelectors.js";
import { resolveExtractorTemplateForDomainModelObjects, resolveExtractorTemplateForRecordOfExtractors } from "./Templates.js";
import { applyTransformer, transformer_apply, transformer_extended_apply, transformer_InnerReference_resolve } from "./Transformers.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SyncExtractorTemplateRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const emptySelectorMap:SyncExtractorTemplateRunnerMap<any> = {
  extractorType: "sync",
  extractEntityInstanceUuidIndex: undefined as any,
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: undefined as any,
  extractWithManyExtractors: undefined as any,
  extractWithExtractor: undefined as any,
  // 
  extractWithManyExtractorTemplates: undefined as any, 
  extractEntityInstanceUuidIndexForTemplate: undefined as any,
}

const emptyAsyncSelectorMap:AsyncExtractorTemplateRunnerMap = {
  extractorType: "async",
  extractEntityInstanceUuidIndex: undefined as any,
  extractEntityInstance: undefined as any,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: undefined as any,
  extractWithManyExtractors: undefined as any,
  extractWithExtractor: undefined as any,
  applyExtractorTransformer: undefined as any,
  // 
  // extractWithExtractorTemplate: undefined as any, 
  // extractWithManyExtractorTemplates: undefined as any, 
  // extractEntityInstanceForTemplate: undefined as any,
  // extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: undefined as any,
  // extractEntityInstanceUuidIndexForTemplate: undefined as any,
  // applyExtractorTemplateTransformer: undefined as any,
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT = (
  selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed,
  extractor: ExtractorTemplateForSingleObjectList,
) => {
  // log.info(
  //   "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectedInstancesUuidIndex",
  //   selectedInstancesUuidIndex,
  //   JSON.stringify(extractor, undefined, 2)
  // );
  switch (extractor.select.queryType) {
    case "queryTemplateExtractObjectListByEntity": {
      const localQuery: QueryTemplateExtractObjectListByEntity = extractor.select;
      const filterTest = localQuery.filter
        ? new RegExp((localQuery.filter.value as any).constantStringValue, "i") // TODO: check for correct type
        : undefined;
      // log.info(
      //   "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT queryTemplateExtractObjectListByEntity filter",
      //   JSON.stringify(localQuery.filter)
      // );
      const result:DomainElementInstanceUuidIndexOrFailed = localQuery.filter
        ? {
            elementType: "instanceUuidIndex",
            elementValue: Object.fromEntries(
              Object.entries(selectedInstancesUuidIndex.elementValue).filter((i: [string, EntityInstance]) => {
                const matchResult = filterTest?.test(
                  (i as any)[1][localQuery.filter?.attributeName??""]
                )
                // log.info(
                //   "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT queryTemplateExtractObjectListByEntity filter",
                //   JSON.stringify(i[1]),
                //   "matchResult",
                //   matchResult
                // );
                return matchResult
              }
              )
            )
          }
        : selectedInstancesUuidIndex;
      ;
      // log.info(
      //   "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT queryTemplateExtractObjectListByEntity result",
      //   JSON.stringify(result, undefined, 2)
      // );
      return result;
      break;
    }
    case "selectObjectListByRelation": {
      const relationQuery: QueryTemplateSelectObjectListByRelation = extractor.select;

      // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByRelation", JSON.stringify(selectedInstances))
      // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByRelation", selectedInstances)
      const result = { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
        Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
        // Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
          (i: [string, EntityInstance]) => {
            const localIndex = relationQuery.AttributeOfListObjectToCompareToReferenceUuid ?? "dummy";

            let otherIndex = undefined
            if (
              relationQuery.objectReference?.transformerType == "contextReference" &&
              (relationQuery.objectReference.referenceName??"") in extractor.contextResults
            ) {
              otherIndex = ((extractor.contextResults[
                relationQuery.objectReference.referenceName??""
              ] as any) ?? {})[relationQuery.objectReferenceAttribute ?? "uuid"];
            } else {
              throw new Error(
                "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByRelation must be a reference to an Object:" +
                  JSON.stringify(relationQuery.objectReference, undefined, 2) +
                  " but reference name not found in contextResults=" +
                  JSON.stringify(Object.keys(extractor.contextResults), undefined, 2)
              );
            }
            // log.info(
            //   "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByRelation",
            //   (i[1] as any).name,
            //   (i[1] as any)[localIndex] === otherIndex,
            //   "localIndex",
            //   (i[1] as any)[localIndex],
            //   "otherIndex",
            //   otherIndex
            // );
            return (i[1] as any)[localIndex] === otherIndex
          }
        )
      )} as DomainElementInstanceUuidIndex;
      // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByRelation query", relationQuery)
      // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByRelation result", result)
      return result;
    }
    case "selectObjectListByManyToManyRelation": {
      const relationQuery: QueryTemplateSelectObjectListByManyToManyRelation = extractor.select;

      // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByManyToManyRelation", selectedInstances)
      let otherList: Record<string,any> | undefined = undefined
      if (
        relationQuery.objectListReference?.transformerType == "contextReference" &&
        extractor.contextResults[relationQuery.objectListReference.referenceName ?? ""]
      ) {
        otherList = (extractor.contextResults[
          relationQuery.objectListReference.referenceName??""
        ]) ?? {};
        // log.info("applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByManyToManyRelation found otherList", otherList);
        
      } else {
        throw new Error(
          "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByManyToManyRelation must be a reference to a List of Objects: " +
            JSON.stringify(relationQuery.objectListReference, undefined, 2)
        );
      }

      if (!!otherList) {
        return { "elementType": "instanceUuidIndex", "elementValue": Object.fromEntries(
          Object.entries(selectedInstancesUuidIndex.elementValue ?? {}).filter(
            (selectedInstancesEntry: [string, EntityInstance]) => {
              // const localOtherList: DomainElement = otherList as DomainElement;
              const otherListAttribute = relationQuery.objectListReferenceAttribute ?? "uuid";
              const rootListAttribute = relationQuery.AttributeOfRootListObjectToCompareToListReferenceUuid ?? "uuid";
  
              const result =
                Object.values(otherList??{}).findIndex(
                  (v: any) => v[otherListAttribute] == (selectedInstancesEntry[1] as any)[rootListAttribute]
                ) >= 0;
              // log.info(
              //   "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByManyToManyRelation search otherList for attribute",
              //   otherListAttribute,
              //   "on object",
              //   selectedInstancesEntry[1],
              //   "uuidToFind",
              //   (selectedInstancesEntry[1] as any)[otherListAttribute],
              //   "otherList",
              //   localOtherList,
              //   "result",
              //   result
              // );

              return result 
            }
          )
        )} as DomainElementInstanceUuidIndex;
      } else {
        throw new Error(
          "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT selectObjectListByManyToManyRelation could not find list for objectListReference, selectedInstances elementType=" +
            selectedInstancesUuidIndex.elementType
        );
      }
    }
    default: {
      throw new Error(
        "applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT could not handle query, selectorParams=" +
          JSON.stringify(extractor.select, undefined, 2)
      );
      break;
    }
  }
};


// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param selectorParams 
 * @returns 
 */
export const extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory
= <StateType>(
  deploymentEntityState: StateType,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList, StateType>
): DomainElementInstanceUuidIndexOrFailed => {
  const selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed =
    (selectorParams?.extractorRunnerMap ?? emptySelectorMap).extractEntityInstanceUuidIndexForTemplate(deploymentEntityState, selectorParams);

  // log.info(
  //   "extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory found selectedInstances", selectedInstancesUuidIndex
  // );

  return applyExtractorTemplateForSingleObjectListToSelectedInstancesUuidIndexInMemoryDEFUNCT(
    selectedInstancesUuidIndex,
    selectorParams.extractorTemplate,
  );

};

// ################################################################################################
export const applyExtractorTemplateTransformerInMemory = (
  actionRuntimeTransformer: ExtendedTransformerForRuntime,
  queryParams: Record<string, any>,
  newFetchedData: Record<string, any>
): DomainElement => {
  log.info("applyExtractorTemplateTransformerInMemory ###### query", JSON.stringify(actionRuntimeTransformer, null, 2));
  return transformer_extended_apply("runtime", "ROOT"/**WHAT?? */, actionRuntimeTransformer, queryParams, newFetchedData);
};

// ################################################################################################
export const extractWithExtractorTemplate /**: SyncExtractorTemplateRunner */= <StateType>(
  state: StateType,
  selectorParams: SyncExtractorTemplateRunnerParams<
  ExtractorTemplateForDomainModelObjects | ExtractorTemplateForRecordOfExtractors,
    StateType
  >
): DomainElement => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  if (!selectorParams.extractorRunnerMap) {
    throw new Error("extractWithExtractorTemplate requires extractorRunnerMap");
  }

  switch (selectorParams.extractorTemplate.queryType) {
    case "extractorTemplateForRecordOfExtractors": {
      const resolvedExtractor: ExtractorForRecordOfExtractors = resolveExtractorTemplateForRecordOfExtractors(selectorParams.extractorTemplate); 

      return extractWithManyExtractors(
        state,
        {
          extractorRunnerMap: selectorParams.extractorRunnerMap,
          extractor: resolvedExtractor,
        }
      )
      break;
    }
    case "extractorTemplateForDomainModelObjects": {

      const resolvedExtractor: ExtractorForDomainModelObjects = resolveExtractorTemplateForDomainModelObjects(selectorParams.extractorTemplate); 

      return extractWithExtractor(
        state,
        {
          // extractorRunnerMap: {} as any,
          extractorRunnerMap: selectorParams.extractorRunnerMap,
          extractor: resolvedExtractor,
        }
      )

      break;
    }
    default: {
      return { elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } };
      break;
    }
  }

  // log.info(
  //   "extractExtractor",
  //   "query",
  //   selectorParams,
  //   "domainState",
  //   deploymentEntityState,
  //   "newFetchedData",
  //   context
  // );
  // return result;
};

// ################################################################################################
/**
 * StateType is the type of the deploymentEntityState, which may be a DeploymentEntityState or a DeploymentEntityStateWithUuidIndex
 * 
 * 
 * @param selectorParams the array of basic extractor functions
 * @returns 
 */
export const extractWithManyExtractorTemplates = <StateType>(
  state: StateType,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForRecordOfExtractors, StateType>,
): DomainElementObject => { 

  const resolvedExtractor: ExtractorForRecordOfExtractors = resolveExtractorTemplateForRecordOfExtractors(selectorParams.extractorTemplate); 

  return extractWithManyExtractors(
    state,
    {
      extractorRunnerMap: selectorParams.extractorRunnerMap,
      extractor: resolvedExtractor,
    }
  )
};

// ################################################################################################
// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const extractzodSchemaForSingleSelectQueryTemplate = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate, StateType>
): JzodObject | undefined => {
  if (
    selectorParams.query.select.queryType=="literal" ||
    selectorParams.query.select.queryType=="queryContextReference" ||
    selectorParams.query.select.queryType=="extractorWrapperReturningObject" ||
    selectorParams.query.select.queryType=="wrapperReturningObject" ||
    selectorParams.query.select.queryType=="extractorWrapperReturningList" ||
    selectorParams.query.select.queryType=="wrapperReturningList" ||
    selectorParams.query.select.queryType=="queryCombiner" 
  ) {
    throw new Error(
      "extractzodSchemaForSingleSelectQuery can not deal with context reference: query=" +
        JSON.stringify(selectorParams.query, undefined, 2)
    );
  }

  const entityUuidDomainElement = transformer_InnerReference_resolve(
    "build",
    selectorParams.query.select.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
  );

  log.info(
    "extractzodSchemaForSingleSelectQuery called",
    selectorParams.query,
    "found",
    entityUuidDomainElement
  );

  if (typeof entityUuidDomainElement != "object" || entityUuidDomainElement.elementType != "instanceUuid") {
    return undefined
  }

  const result = selectorParams.extractorRunnerMap.extractEntityJzodSchema(deploymentEntityState, {
    extractorRunnerMap: selectorParams.extractorRunnerMap,
    query: {
      queryType: "getEntityDefinition",
      contextResults: { elementType: "object", elementValue: {} },
      pageParams: selectorParams.query.pageParams,
      queryParams: selectorParams.query.queryParams,
      deploymentUuid: selectorParams.query.deploymentUuid ?? "",
      entityUuid: entityUuidDomainElement.elementValue,
    },
  } as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor,StateType>) as JzodObject | undefined

  return result;
}

// // ################################################################################################
// export const extractJzodSchemaForDomainModelQuery = <StateType>(
//   deploymentEntityState: StateType,
//   selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelQueryTemplateJzodSchemaParams, StateType>
// ): RecordOfJzodElement | JzodElement | undefined => {
//   switch (selectorParams.query.queryType) {
//     case "getEntityDefinition":{ 
//       return selectorParams.extractorRunnerMap.extractEntityJzodSchema(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, StateType>
//       );
//       break;
//     }
//     case "getFetchParamsJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaForExtractorTemplate, StateType>
//       );
//       break;
//     }
//     case "getSingleSelectQueryJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate, StateType>
//       );
//       break;
//     }
//     default:
//       return undefined;
//       break;
//   }
// };

// ################################################################################################
export const extractJzodSchemaForDomainModelQueryTemplate = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelQueryTemplateJzodSchemaParams, StateType>
): RecordOfJzodElement | JzodElement | undefined => {
  switch (selectorParams.query.queryType) {
    case "getEntityDefinition":{ 
      return selectorParams.extractorRunnerMap.extractEntityJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, StateType>
      );
      break;
    }
    case "getFetchParamsJzodSchema": {
      return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaForExtractorTemplate, StateType>
      );
      break;
    }
    case "getSingleSelectQueryJzodSchema": {
      return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate, StateType>
      );
      break;
    }
    default:
      return undefined;
      break;
  }
};

// // ################################################################################################
// /**
//  * the runtimeTransformers and FetchQueryJzodSchema should depend only on the instance of Report at hand
//  * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
//  * @param deploymentEntityState 
//  * @param query 
//  * @returns 
//  */
export const extractFetchQueryTemplateJzodSchema = <StateType>(
  deploymentEntityState: StateType,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetFetchParamJzodSchemaForExtractorTemplate, StateType>
):  RecordOfJzodObject | undefined => {
  const localFetchParams: ExtractorTemplateForRecordOfExtractors = selectorParams.query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.combinerTemplates??{})
    .map((entry: [string, QueryTemplate]) => [
      entry[0],
      selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(deploymentEntityState, {
        extractorRunnerMap:selectorParams.extractorRunnerMap,
        query: {
          queryType: "getSingleSelectQueryJzodSchema",
          deploymentUuid: localFetchParams.deploymentUuid,
          contextResults: { },
          pageParams: selectorParams.query.pageParams,
          queryParams: selectorParams.query.queryParams,
          select: entry[1],
        },
      } as ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetSingleSelectQueryJzodSchemaForExtractorTemplate, StateType>),
    ])
  ) as RecordOfJzodObject;

  // if (localFetchParams.runtimeTransformers?.crossJoin) {
  //   fetchQueryJzodSchema["crossJoin"] = {
  //     type: "object",
  //     definition: Object.fromEntries(
  //     Object.entries(fetchQueryJzodSchema[localFetchParams.runtimeTransformers?.crossJoin?.a ?? ""]?.definition ?? {}).map((a) => [
  //       "a-" + a[0],
  //       a[1]
  //     ]
  //     ).concat(
  //       Object.entries(fetchQueryJzodSchema[localFetchParams.runtimeTransformers?.crossJoin?.b ?? ""]?.definition ?? {}).map((b) => [
  //         "b-" + b[0], b[1]
  //       ])
  //     )
  //   )};
  // }

  // log.info("selectFetchQueryJzodSchemaFromDomainState query", JSON.stringify(selectorParams.query, undefined, 2), "fetchQueryJzodSchema", fetchQueryJzodSchema)
  return fetchQueryJzodSchema;
};

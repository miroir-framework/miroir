// ################################################################################################

import {
  ActionReturnType,
  DomainElement,
  DomainElementObject,
  ExtractorByEntityUuidGetEntityDefinition,
  ExtractorByTemplateGetParamJzodSchema,
  ExtractorByQueryTemplateGetParamJzodSchema,
  DomainModelQueryTemplateJzodSchemaParams,
  ExtractorForDomainModelObjects,
  QueryWithExtractorCombinerTransformer,
  ExtractorTemplateForDomainModelObjects,
  ExtractorTemplateForRecordOfExtractors,
  JzodElement,
  JzodObject,
  QueryTemplate,
  QueryTemplateAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  AsyncExtractorRunnerMap,
  ExtractorTemplateRunnerParamsForJzodSchema,
  RecordOfJzodElement,
  RecordOfJzodObject,
  SyncExtractorTemplateRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { handleQueryAction, extractWithExtractor, extractWithManyExtractors } from "./QuerySelectors";
import {
  resolveExtractorTemplate,
  resolveExtractorTemplateForDomainModelObjects,
  resolveExtractorTemplateForRecordOfExtractors,
} from "./Templates";
import { transformer_InnerReference_resolve } from "./Transformers";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SyncExtractorTemplateRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
export async function handleQueryTemplateAction(
  origin: string,
  queryTemplateAction: QueryTemplateAction, 
  selectorMap: AsyncExtractorRunnerMap
): Promise<ActionReturnType> {
  log.info("handleQueryTemplateAction for ", origin, "queryTemplateAction", JSON.stringify(queryTemplateAction, null, 2));
  const resolvedQuery = resolveExtractorTemplate(
    queryTemplateAction.query
  );

  return handleQueryAction(
    origin,
    {
      actionType: "queryAction",
      actionName: queryTemplateAction.actionName,
      deploymentUuid: queryTemplateAction.deploymentUuid,
      endpoint: queryTemplateAction.endpoint,
      applicationSection: queryTemplateAction.applicationSection,
      query: resolvedQuery,
    },
    selectorMap
  );
}

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
      const resolvedExtractor: QueryWithExtractorCombinerTransformer = resolveExtractorTemplateForRecordOfExtractors(
        selectorParams.extractorTemplate
      ); 

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
      const resolvedExtractor: ExtractorForDomainModelObjects = resolveExtractorTemplateForDomainModelObjects(
        selectorParams.extractorTemplate
      ); 

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
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "QueryNotExecutable",
          failureMessage:
            "extractWithExtractorTemplate could not handle queryType of template: " + selectorParams.extractorTemplate,
        },
      }; 
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

  const resolvedExtractor: QueryWithExtractorCombinerTransformer = resolveExtractorTemplateForRecordOfExtractors(
    selectorParams.extractorTemplate
  ); 

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
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByQueryTemplateGetParamJzodSchema, StateType>
): JzodObject | undefined => {
  if (
    selectorParams.query.select.queryType=="literal" ||
    selectorParams.query.select.queryType=="queryContextReference" ||
    selectorParams.query.select.queryType=="extractorWrapperReturningObject" ||
    selectorParams.query.select.queryType=="wrapperReturningObject" ||
    selectorParams.query.select.queryType=="extractorWrapperReturningList" ||
    selectorParams.query.select.queryType=="wrapperReturningList" ||
    selectorParams.query.select.queryType=="extractorCombinerByHeteronomousManyToManyReturningListOfObjectList" 
  ) {
    throw new Error(
      "extractzodSchemaForSingleSelectQuery can not deal with context reference: query=" +
        JSON.stringify(selectorParams.query, undefined, 2)
    );
  }

  const entityUuidDomainElement = typeof selectorParams.query.select.parentUuid == "string"?selectorParams.query.select.parentUuid:transformer_InnerReference_resolve(
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
  } as ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByEntityUuidGetEntityDefinition,StateType>) as JzodObject | undefined

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
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByEntityUuidGetEntityDefinition, StateType>
//       );
//       break;
//     }
//     case "extractorByTemplateGetParamJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByTemplateGetParamJzodSchema, StateType>
//       );
//       break;
//     }
//     case "getQueryJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByQueryTemplateGetParamJzodSchema, StateType>
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
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByEntityUuidGetEntityDefinition, StateType>
      );
      break;
    }
    case "extractorByTemplateGetParamJzodSchema": {
      return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByTemplateGetParamJzodSchema, StateType>
      );
      break;
    }
    case "getQueryJzodSchema": {
      return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByQueryTemplateGetParamJzodSchema, StateType>
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
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByTemplateGetParamJzodSchema, StateType>
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
          queryType: "getQueryJzodSchema",
          deploymentUuid: localFetchParams.deploymentUuid,
          contextResults: { },
          pageParams: selectorParams.query.pageParams,
          queryParams: selectorParams.query.queryParams,
          select: entry[1],
        },
      } as ExtractorTemplateRunnerParamsForJzodSchema<ExtractorByQueryTemplateGetParamJzodSchema, StateType>),
    ])
  ) as RecordOfJzodObject;

  // log.info("selectFetchQueryJzodSchemaFromDomainState query", JSON.stringify(selectorParams.query, undefined, 2), "fetchQueryJzodSchema", fetchQueryJzodSchema)
  return fetchQueryJzodSchema;
};

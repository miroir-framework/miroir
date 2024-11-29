// ################################################################################################

import {
  ActionReturnType,
  DomainElement,
  DomainElementObject,
  QueryByEntityUuidGetEntityDefinition,
  QueryByTemplateGetParamJzodSchema,
  QueryByQueryTemplateGetParamJzodSchema,
  DomainModelQueryTemplateJzodSchemaParams,
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  QueryWithExtractorCombinerTransformer,
  QueryTemplateReturningObject,
  QueryTemplateWithExtractorCombinerTransformer,
  JzodElement,
  JzodObject,
  ExtractorOrCombinerTemplate,
  RunQueryTemplateOrExtractorTemplateAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  AsyncQueryRunnerMap,
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
import { handleQueryAction, extractWithExtractor, runQuery } from "./QuerySelectors";
import {
  resolveExtractorOrQueryTemplate,
  resolveExtractorTemplateForDomainModelObjects,
  resolveQueryTemplate,
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
  runQueryTemplateOrExtractorTemplateAction: RunQueryTemplateOrExtractorTemplateAction, 
  selectorMap: AsyncQueryRunnerMap
): Promise<ActionReturnType> {
  log.info("handleQueryTemplateAction for ", origin, "runQueryTemplateOrExtractorTemplateAction", JSON.stringify(runQueryTemplateOrExtractorTemplateAction, null, 2));
  const resolvedQuery = resolveExtractorOrQueryTemplate(
    runQueryTemplateOrExtractorTemplateAction.query
  );

  return handleQueryAction(
    origin,
    {
      actionType: "runQueryOrExtractorAction",
      actionName: runQueryTemplateOrExtractorTemplateAction.actionName,
      deploymentUuid: runQueryTemplateOrExtractorTemplateAction.deploymentUuid,
      endpoint: runQueryTemplateOrExtractorTemplateAction.endpoint,
      applicationSection: runQueryTemplateOrExtractorTemplateAction.applicationSection,
      query: resolvedQuery,
    },
    selectorMap
  );
}

// ################################################################################################
export const extractWithExtractorTemplate /**: SyncExtractorTemplateRunner */= <StateType>(
  state: StateType,
  selectorParams: SyncExtractorTemplateRunnerParams<
  QueryTemplateReturningObject | QueryTemplateWithExtractorCombinerTransformer,
    StateType
  >
): DomainElement => {
  // log.info("########## extractExtractor begin, query", selectorParams);
  if (!selectorParams.extractorRunnerMap) {
    throw new Error("extractWithExtractorTemplate requires extractorRunnerMap");
  }

  switch (selectorParams.extractorOrCombinerTemplate.queryType) {
    case "queryTemplateWithExtractorCombinerTransformer": {
      const resolvedExtractor: QueryWithExtractorCombinerTransformer = resolveQueryTemplate(
        selectorParams.extractorOrCombinerTemplate
      ); 

      log.info("extractWithExtractorTemplate found", "resolvedExtractor", JSON.stringify(resolvedExtractor, null, 2));
      return runQuery(
        state,
        {
          extractorRunnerMap: selectorParams.extractorRunnerMap,
          extractor: resolvedExtractor,
        }
      )
      break;
    }
    case "queryTemplateReturningObject": {
      const resolvedExtractor: QueryForExtractorOrCombinerReturningObjectOrObjectList = resolveExtractorTemplateForDomainModelObjects(
        selectorParams.extractorOrCombinerTemplate
      ); 

      log.info("extractWithExtractorTemplate found", "resolvedExtractor", JSON.stringify(resolvedExtractor, null, 2));

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
            "extractWithExtractorTemplate could not handle queryType of template: " + selectorParams.extractorOrCombinerTemplate,
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
  selectorParams: SyncExtractorTemplateRunnerParams<QueryTemplateWithExtractorCombinerTransformer, StateType>,
): DomainElementObject => { 

  const resolvedExtractor: QueryWithExtractorCombinerTransformer = resolveQueryTemplate(
    selectorParams.extractorOrCombinerTemplate
  ); 

  return runQuery(
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
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByQueryTemplateGetParamJzodSchema, StateType>
): JzodObject | undefined => {
  if (
    selectorParams.query.select.queryType=="literal" ||
    selectorParams.query.select.queryType=="extractorTemplateByExtractorWrapperReturningObject" ||
    selectorParams.query.select.queryType=="extractorTemplateByExtractorWrapperReturningList" ||
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
  } as ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition,StateType>) as JzodObject | undefined

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
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, StateType>
//       );
//       break;
//     }
//     case "queryByTemplateGetParamJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByTemplateGetParamJzodSchema, StateType>
//       );
//       break;
//     }
//     case "getQueryJzodSchema": {
//       return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
//         deploymentEntityState,
//         selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByQueryTemplateGetParamJzodSchema, StateType>
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
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, StateType>
      );
      break;
    }
    case "queryByTemplateGetParamJzodSchema": {
      return selectorParams.extractorRunnerMap.extractFetchQueryJzodSchema(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByTemplateGetParamJzodSchema, StateType>
      );
      break;
    }
    case "getQueryJzodSchema": {
      return selectorParams.extractorRunnerMap.extractzodSchemaForSingleSelectQuery(
        deploymentEntityState,
        selectorParams as ExtractorTemplateRunnerParamsForJzodSchema<QueryByQueryTemplateGetParamJzodSchema, StateType>
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
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<QueryByTemplateGetParamJzodSchema, StateType>
):  RecordOfJzodObject | undefined => {
  const localFetchParams: QueryTemplateWithExtractorCombinerTransformer = selectorParams.query.fetchParams
  // log.info("selectFetchQueryJzodSchemaFromDomainState called", selectorParams.query);
  
  const fetchQueryJzodSchema = Object.fromEntries(
    Object.entries(localFetchParams?.combinerTemplates??{})
    .map((entry: [string, ExtractorOrCombinerTemplate]) => [
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
      } as ExtractorTemplateRunnerParamsForJzodSchema<QueryByQueryTemplateGetParamJzodSchema, StateType>),
    ])
  ) as RecordOfJzodObject;

  // log.info("selectFetchQueryJzodSchemaFromDomainState query", JSON.stringify(selectorParams.query, undefined, 2), "fetchQueryJzodSchema", fetchQueryJzodSchema)
  return fetchQueryJzodSchema;
};

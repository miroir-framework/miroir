import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";

import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  ApplicationSection,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  QueryByEntityUuidGetEntityDefinition,
  QueryByTemplateGetParamJzodSchema,
  EntityDefinition,
  QueryDEFUNCT,
  QueryForExtractorOrCombinerReturningObjectOrObjectList,
  QueryWithExtractorCombinerTransformer,
  QueryForExtractorOrCombinerReturningObject,
  QueryForExtractorOrCombinerReturningObjectList,
  QueryTemplateWithExtractorCombinerTransformer,
  JzodObject,
  ExtractorOrCombinerReturningObject
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  QueryRunnerMapForJzodSchema,
  ExtractorRunnerParamsForJzodSchema,
  SyncExtractorOrQueryRunner,
  SyncExtractorOrQueryRunnerMap,
  SyncExtractorOrQueryRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { extractWithManyExtractorsFromDomainStateForTemplateREDUNDANT } from "./DomainStateQueryTemplateSelector";
import {
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithExtractor,
  runQuery,
  extractzodSchemaForSingleSelectQuery,
  innerSelectDomainElementFromExtractorOrCombiner,
} from "./QuerySelectors";
import { transformer_InnerReference_resolve } from "./Transformers";

const loggerName: string = getLoggerName(packageName, cleanLevel, "DomainStateQuerySelector");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

const emptyDomainObject: DomainElementObject = { elementType: "object", elementValue: {} };

export const dummyDomainManyQueryWithDeploymentUuid: QueryWithExtractorCombinerTransformer = {
  queryType: "queryWithExtractorCombinerTransformer",
  deploymentUuid: "",
  pageParams: {},
  queryParams: {},
  contextResults: emptyDomainObject,
  runtimeTransformers: {},
};

export const dummyDomainManyQueryTemplateWithDeploymentUuid: QueryTemplateWithExtractorCombinerTransformer = {
  queryType: "queryTemplateWithExtractorCombinerTransformer",
  deploymentUuid: "",
  pageParams: {},
  queryParams: {},
  contextResults: emptyDomainObject,
  runtimeTransformers: {},
};

export const dummyDomainModelGetFetchParamJzodSchemaQueryParams: QueryByTemplateGetParamJzodSchema = {
  queryType: "queryByTemplateGetParamJzodSchema",
  deploymentUuid: "",
  pageParams: {
    elementType: "object",
    elementValue: {
      applicationSection: { elementType: "string", elementValue: "data" },
      deploymentUuid: { elementType: "string", elementValue: "" },
      instanceUuid: { elementType: "string", elementValue: "" },
    },
  },
  queryParams: {},
  contextResults: {},
  fetchParams: {
    queryType: "queryTemplateWithExtractorCombinerTransformer",
    deploymentUuid: "",
    pageParams: {},
    queryParams: {},
    contextResults: {},
    runtimeTransformers: {},
  },
};

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityInstanceUuidIndexFromDomainState: SyncExtractorOrQueryRunner<
  QueryForExtractorOrCombinerReturningObjectList,
  DomainState,
  DomainElementInstanceUuidIndexOrFailed
> = (
  domainState: DomainState,
  selectorParams: SyncExtractorOrQueryRunnerParams<QueryForExtractorOrCombinerReturningObjectList, DomainState>
): DomainElementInstanceUuidIndexOrFailed => {
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection = selectorParams.extractor.select.applicationSection ?? "data";

  const entityUuid: Uuid = selectorParams.extractor.select.parentUuid;

  // log.info("selectEntityInstanceUuidIndexFromDomainState params", selectorParams, deploymentUuid, applicationSection, entityUuid);
  // log.info("selectEntityInstanceUuidIndexFromDomainState domainState", domainState);

  if (!deploymentUuid || !applicationSection || !entityUuid) {
    return {
      // new object
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryContext:
          "deploymentUuid=" +
          deploymentUuid +
          ", applicationSection=" +
          applicationSection +
          ", entityUuid=" +
          JSON.stringify(entityUuid),
        queryParameters: JSON.stringify(selectorParams),
      },
    };
    // resolving by fetchDataReference, fetchDataReferenceAttribute
  }
  if (!domainState) {
    return { elementType: "failure", elementValue: { queryFailure: "DomainStateNotLoaded" } };
  }
  if (!domainState[deploymentUuid]) {
    return { elementType: "failure", elementValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
  }
  if (!domainState[deploymentUuid][applicationSection]) {
    return {
      elementType: "failure",
      elementValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
    };
  }
  if (!domainState[deploymentUuid][applicationSection][entityUuid]) {
    log.error(
      "selectEntityInstanceUuidIndexFromDomainState entityUuid not found EntityNotFound for",
      "deploymentUuid",
      deploymentUuid,
      "applicationSection",
      applicationSection,
      "entityUuid",
      entityUuid
    );
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "EntityNotFound",
        deploymentUuid,
        applicationSection,
        entityUuid: entityUuid,
      },
    };
  }

  return {
    elementType: "instanceUuidIndex",
    elementValue: domainState[deploymentUuid][applicationSection][entityUuid],
  };
};

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityInstanceListFromDomainState: SyncExtractorOrQueryRunner<
  QueryForExtractorOrCombinerReturningObjectList,
  DomainState,
  DomainElementInstanceArrayOrFailed
> = (
  domainState: DomainState,
  selectorParams: SyncExtractorOrQueryRunnerParams<QueryForExtractorOrCombinerReturningObjectList, DomainState>
): DomainElementInstanceArrayOrFailed => {
  const result = selectEntityInstanceUuidIndexFromDomainState(domainState, selectorParams);

  if (result.elementType == "failure") {
    return result;
  }
  return {
    elementType: "instanceArray",
    elementValue: Object.values(result.elementValue),
  };
};

// ################################################################################################
// ACCESSES DOMAIN STATE
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param domainState
 * @param selectorParams
 * @returns
 */
export const selectEntityInstanceFromObjectQueryAndDomainState: SyncExtractorOrQueryRunner<
  QueryForExtractorOrCombinerReturningObject,
  DomainState,
  DomainElementEntityInstanceOrFailed
> = (
  domainState: DomainState,
  selectorParams: SyncExtractorOrQueryRunnerParams<QueryForExtractorOrCombinerReturningObject, DomainState>
): DomainElementEntityInstanceOrFailed => {
  const querySelectorParams: ExtractorOrCombinerReturningObject = selectorParams.extractor.select as ExtractorOrCombinerReturningObject;
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.extractor.select.applicationSection ??
    ((selectorParams.extractor.pageParams?.applicationSection ?? "data") as ApplicationSection);

  log.info(
    "selectEntityInstanceFromObjectQueryAndDomainState params",
    querySelectorParams,
    "deploymentUuid",
    deploymentUuid,
    "applicationSection",
    applicationSection
  );
  const entityUuidReference: Uuid = querySelectorParams.parentUuid;
  log.info("selectEntityInstanceFromObjectQueryAndDomainState entityUuidReference", entityUuidReference);

  // if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
  //   return {
  //     elementType: "failure",
  //     elementValue: {
  //       queryFailure: "IncorrectParameters",
  //       queryContext:
  //         "selectEntityInstanceFromObjectQueryAndDomainState wrong entityUuidReference=" +
  //         JSON.stringify(entityUuidReference),
  //       queryReference: JSON.stringify(querySelectorParams.parentUuid),
  //     },
  //   };
  // }

  switch (querySelectorParams?.extractorOrCombinerType) {
    case "combinerForObjectByRelation": {
      const referenceObject = transformer_InnerReference_resolve(
        "build",
        { transformerType: "contextReference", referenceName: querySelectorParams.objectReference },
        selectorParams.extractor.queryParams,
        selectorParams.extractor.contextResults
      );

      if (
        !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
        // ||
        // referenceObject.elementType != "instance"
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
            queryContext:
              "DomainStateQuerySelectors combinerForObjectByRelation did not find AttributeOfObjectToCompareToReferenceUuid in " +
              JSON.stringify(querySelectorParams),
          },
        };
      }

      if (!domainState) {
        return { elementType: "failure", elementValue: { queryFailure: "DomainStateNotLoaded" } };
      }
      if (!domainState[deploymentUuid]) {
        return { elementType: "failure", elementValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
      }
      if (!domainState[deploymentUuid][applicationSection]) {
        return {
          elementType: "failure",
          elementValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
        };
      }
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference]) {
        log.error(
          "selectEntityInstanceFromObjectQueryAndDomainState entityUuid not found EntityNotFound for",
          "deploymentUuid",
          deploymentUuid,
          "applicationSection",
          applicationSection,
          "entityUuid",
          entityUuidReference
        );
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
          },
        };
      }

      // log.info(
      //   "selectEntityInstanceFromObjectQueryAndDomainState combinerForObjectByRelation, ############# reference",
      //   querySelectorParams,
      //   "######### context entityUuid",
      //   entityUuidReference,
      //   "######### referenceObject",
      //   referenceObject,
      //   "######### queryParams",
      //   JSON.stringify(selectorParams.query.queryParams, undefined, 2),
      //   "######### contextResults",
      //   JSON.stringify(selectorParams.query.contextResults, undefined, 2)
      // );
      return {
        elementType: "instance",
        elementValue:
          domainState[deploymentUuid][applicationSection][entityUuidReference][
            (referenceObject.elementValue as any)[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
          ],
      };
      break;
    }
    case "extractorForObjectByDirectReference": {
      const instanceUuidDomainElement = querySelectorParams.instanceUuid;

      log.info(
        "selectEntityInstanceFromObjectQueryAndDomainState found instanceUuid",
        JSON.stringify(instanceUuidDomainElement)
      );

      // if (instanceUuidDomainElement == "instance") {
      //   return instanceUuidDomainElement; /* QueryResults, elementType == "failure" */
      // }
      // if (
      //   instanceUuidDomainElement != "string" &&
      //   instanceUuidDomainElement != "instanceUuid"
      // ) {
      //   return {
      //     elementType: "failure",
      //     elementValue: {
      //       queryFailure: "EntityNotFound",
      //       deploymentUuid,
      //       applicationSection,
      //       entityUuid: entityUuidReference.elementValue,
      //       instanceUuid: instanceUuidDomainElement.elementValue,
      //     },
      //   };
      // }
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState resolved instanceUuid =", instanceUuid);
      if (!domainState) {
        return { elementType: "failure", elementValue: { queryFailure: "DomainStateNotLoaded" } };
      }
      if (!domainState[deploymentUuid]) {
        return { elementType: "failure", elementValue: { queryFailure: "DeploymentNotFound", deploymentUuid } };
      }
      if (!domainState[deploymentUuid][applicationSection]) {
        return {
          elementType: "failure",
          elementValue: { queryFailure: "ApplicationSectionNotFound", deploymentUuid, applicationSection },
        };
      }
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference]) {
        log.error(
          "selectEntityInstanceFromObjectQueryAndDomainState entityUuid not found EntityNotFound for",
          "deploymentUuid",
          deploymentUuid,
          "applicationSection",
          applicationSection,
          "entityUuid",
          entityUuidReference
        );
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
          },
        };
      }
      if (
        !domainState[deploymentUuid][applicationSection][entityUuidReference][
          instanceUuidDomainElement
        ]
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
            instanceUuid: instanceUuidDomainElement,
          },
        };
      }

      // log.info("selectEntityInstanceFromObjectQueryAndDomainState extractorForObjectByDirectReference, ############# reference",
      //   querySelectorParams,
      //   "entityUuidReference",
      //   entityUuidReference,
      //   "######### context entityUuid",
      //   entityUuidReference,
      //   "######### queryParams",
      //   JSON.stringify(selectorParams.query.queryParams, undefined, 2),
      //   "######### contextResults",
      //   JSON.stringify(selectorParams.query.contextResults, undefined, 2),
      //   "domainState",
      //   domainState
      // );
      return {
        elementType: "instance",
        elementValue:
          domainState[deploymentUuid][applicationSection][entityUuidReference][
            instanceUuidDomainElement
          ],
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromObjectQueryAndDomainState can not handle ExtractorTemplateReturningObject query with extractorOrCombinerType=" +
          selectorParams.extractor.select.extractorOrCombinerType
      );
      break;
    }
  }
};

// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param domainState
 * @param selectorParams
 * @returns
 */
export const extractEntityInstanceUuidIndexFromListQueryAndDomainState: SyncExtractorOrQueryRunner<
  QueryForExtractorOrCombinerReturningObjectList,
  DomainState,
  DomainElementInstanceUuidIndexOrFailed
> = extractEntityInstanceUuidIndexWithObjectListExtractorInMemory<DomainState>;

// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param domainState
 * @param selectorParams
 * @returns
 */
export const extractEntityInstanceListFromListQueryAndDomainState: SyncExtractorOrQueryRunner<
  QueryForExtractorOrCombinerReturningObjectList,
  DomainState,
  DomainElementInstanceArrayOrFailed
> = extractEntityInstanceListWithObjectListExtractorInMemory<DomainState>;

// ################################################################################################
export const innerSelectElementFromQueryAndDomainState = innerSelectDomainElementFromExtractorOrCombiner<DomainState>;

// ################################################################################################
export const runQueryFromDomainState: SyncExtractorOrQueryRunner<
  QueryWithExtractorCombinerTransformer,
  DomainState,
  DomainElementObject
> = runQuery<DomainState>;

// ################################################################################################
export const extractWithExtractorFromDomainState: SyncExtractorOrQueryRunner<
  QueryForExtractorOrCombinerReturningObjectOrObjectList | QueryWithExtractorCombinerTransformer,
  DomainState,
  DomainElement
> = extractWithExtractor<DomainState>;

// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const selectJzodSchemaBySingleSelectQueryFromDomainStateNew = extractzodSchemaForSingleSelectQuery<DomainState>;

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityJzodSchemaFromDomainStateNew = (
  domainState: DomainState,
  selectorParams: ExtractorRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, DomainState>
): JzodObject | undefined => {
  const localQuery: QueryByEntityUuidGetEntityDefinition = selectorParams.query;
  if (
    domainState &&
    domainState[localQuery.deploymentUuid] &&
    domainState[localQuery.deploymentUuid]["model"] &&
    domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid]
  ) {
    const values: EntityDefinition[] = Object.values(
      domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid] ?? {}
    ) as EntityDefinition[];
    const index = values.findIndex((e: EntityDefinition) => e.entityUuid == localQuery.entityUuid);

    const result: JzodObject | undefined = index > -1 ? values[index].jzodSchema : undefined;

    // log.info("DomainSelector selectEntityJzodSchemaFromDomainState result", result);

    return result;
  } else {
    return undefined;
  }
};

// ################################################################################################
/**
 * the runtimeTransformers and FetchQueryJzodSchema should depend only on the instance of Report at hand
 * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
 * @param domainState
 * @param query
 * @returns
 */
export const selectFetchQueryJzodSchemaFromDomainStateNew = extractFetchQueryJzodSchema<DomainState>;

// ################################################################################################
export const selectJzodSchemaByDomainModelQueryFromDomainStateNew = extractJzodSchemaForDomainModelQuery<DomainState>;

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// DEPENDENT ON RESELECT / REDUX. TO MOVE TO miroir-localCache-redux!
// ################################################################################################

export function getDomainStateExtractorRunnerMap(): SyncExtractorOrQueryRunnerMap<DomainState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDomainState,
    extractEntityInstanceList: selectEntityInstanceListFromDomainState,
    extractEntityInstance: selectEntityInstanceFromObjectQueryAndDomainState,
    extractEntityInstanceUuidIndexWithObjectListExtractor: extractEntityInstanceUuidIndexFromListQueryAndDomainState,
    extractEntityInstanceListWithObjectListExtractor: extractEntityInstanceListFromListQueryAndDomainState,
    runQuery: runQueryFromDomainState,
    extractWithExtractor: extractWithExtractor,
    // 
    extractWithManyExtractorTemplates: extractWithManyExtractorsFromDomainStateForTemplateREDUNDANT,
  };
}

export function getDomainStateJzodSchemaExtractorRunnerMap(): QueryRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}

// ################################################################################################
export type GetExtractorRunnerParamsForDomainState = <ExtractorType extends QueryDEFUNCT>(
  query: ExtractorType,
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<DomainState>
) => SyncExtractorOrQueryRunnerParams<ExtractorType, DomainState>;

export const getExtractorRunnerParamsForDomainState: GetExtractorRunnerParamsForDomainState = <
  ExtractorType extends QueryDEFUNCT
>(
  query: ExtractorType,
  extractorRunnerMap?: SyncExtractorOrQueryRunnerMap<DomainState>
): SyncExtractorOrQueryRunnerParams<ExtractorType, DomainState> => {
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getDomainStateExtractorRunnerMap(),
  };
};

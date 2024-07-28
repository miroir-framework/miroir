import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface.js";

import {
  ApplicationSection,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainModelManyExtractors,
  DomainModelGetEntityDefinitionExtractor,
  DomainModelGetFetchParamJzodSchemaExtractor,
  DomainModelSingleObjectListExtractor,
  DomainModelSingleObjectExtractor,
  EntityDefinition,
  JzodObject,
  DomainModelExtractor,
  QuerySelectObject
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  JzodSchemaQuerySelectorMap,
  JzodSchemaQuerySelectorParams,
  ExtractorSelector,
  ExtractorSelectorMap,
  QuerySelectorParams,
} from "../0_interfaces/2_domain/DeploymentEntityStateQuerySelectorInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import {
  innerSelectElementFromQuery,
  resolveContextReference,
  selectByDomainManyExtractors,
  selectEntityInstanceUuidIndexFromObjectListExtractor,
  selectFetchQueryJzodSchema,
  selectJzodSchemaByDomainModelQuery,
  selectJzodSchemaBySingleSelectQuery,
} from "./QuerySelectors.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const emptyDomainObject:DomainElementObject = { elementType: "object", elementValue: {} }

export const dummyDomainManyQueriesWithDeploymentUuid: DomainModelManyExtractors = {
  queryType: "domainModelManyExtractors",
  deploymentUuid: "",
  pageParams: emptyDomainObject,
  queryParams: emptyDomainObject,
  contextResults: emptyDomainObject,
  fetchQuery: { select: {} },
};

export const dummyDomainModelGetFetchParamJzodSchemaQueryParams: DomainModelGetFetchParamJzodSchemaExtractor = {
  queryType: "getFetchParamsJzodSchema",
  deploymentUuid: "",
  pageParams: {
    elementType: "object",
    elementValue: {
      applicationSection: { elementType: "string", elementValue: "data" },
      deploymentUuid: { elementType: "string", elementValue: "" },
      instanceUuid: { elementType: "string", elementValue: "" },
    },
  },
  queryParams: { elementType: "object", elementValue: {} },
  contextResults: { elementType: "object", elementValue: {} },
  fetchParams: {
    queryType: "domainModelManyExtractors",
    deploymentUuid: "",
    pageParams: emptyDomainObject,
    queryParams: emptyDomainObject,
    contextResults: emptyDomainObject,
    fetchQuery: { select: {} },
  },
};


// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityInstanceUuidIndexFromDomainState: ExtractorSelector<
  DomainModelSingleObjectListExtractor, DomainState, DomainElementInstanceUuidIndexOrFailed
> = (
  domainState: DomainState,
  selectorParams: QuerySelectorParams<DomainModelSingleObjectListExtractor, DomainState>
): DomainElementInstanceUuidIndexOrFailed => {
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection = selectorParams.extractor.select.applicationSection??"data";

  const entityUuid: DomainElement = resolveContextReference(
    selectorParams.extractor.select.parentUuid,
    selectorParams.extractor.queryParams,
    selectorParams.extractor.contextResults
  );

  // log.info("selectEntityInstanceUuidIndexFromDomainState params", selectorParams, deploymentUuid, applicationSection, entityUuid);
  // log.info("selectEntityInstanceUuidIndexFromDomainState domainState", domainState);

  if (!deploymentUuid || !applicationSection || !entityUuid) {
    return { // new object
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
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
  switch (entityUuid.elementType) {
    case "string":
    case "instanceUuid": {
      if (!domainState[deploymentUuid][applicationSection][entityUuid.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuid.elementValue,
          },
        };
      }
    
      return { elementType: "instanceUuidIndex", elementValue: domainState[deploymentUuid][applicationSection][entityUuid.elementValue] };
      break;
    }
    case "object":
    case "instance":
    case "instanceUuidIndex":
    case "instanceUuidIndexUuidIndex":
    case "array": {
      return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", queryReference: JSON.stringify(selectorParams.extractor.select.parentUuid)} }
    }
    case "failure": {
      return entityUuid;
      break;
    }
    default: {
      throw new Error("selectEntityInstanceUuidIndexFromDomainState could not handle reference entityUuid=" + entityUuid);
      break;
    }
  }
};

// ################################################################################################
// ACCESSES DOMAIN STATE
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param domainState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstanceFromObjectQueryAndDomainState:ExtractorSelector<
  DomainModelSingleObjectExtractor, DomainState, DomainElementEntityInstanceOrFailed
> = (
  domainState: DomainState,
  selectorParams: QuerySelectorParams<DomainModelSingleObjectExtractor, DomainState>
): DomainElementEntityInstanceOrFailed => {
  const querySelectorParams: QuerySelectObject = selectorParams.extractor.select as QuerySelectObject;
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.extractor.select.applicationSection ??
    ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ?? "data") as ApplicationSection);

  const entityUuidReference: DomainElement = resolveContextReference(
    querySelectorParams.parentUuid,
    selectorParams.extractor.queryParams,
    selectorParams.extractor.contextResults
  );

  // log.info(
  //   "selectEntityInstanceFromObjectQueryAndDomainState params",
  //   querySelectorParams,
  //   deploymentUuid,
  //   applicationSection,
  //   entityUuidReference
  // );
  if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", queryReference: JSON.stringify(querySelectorParams.parentUuid) } }
  }

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      const referenceObject = resolveContextReference(
        querySelectorParams.objectReference,
        selectorParams.extractor.queryParams,
        selectorParams.extractor.contextResults
      );

      if (
        !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid ||
        referenceObject.elementType != "instance"
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
            queryContext: JSON.stringify(selectorParams.extractor.contextResults),
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
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
          },
        };
      }
      
      // log.info(
      //   "selectEntityInstanceFromObjectQueryAndDomainState selectObjectByRelation, ############# reference",
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
          domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][
            (referenceObject.elementValue as any)[
              querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
            ]
          ],
      };
      break;
    }
    case "selectObjectByDirectReference": {
      const instanceDomainElement = resolveContextReference(querySelectorParams.instanceUuid, selectorParams.extractor.queryParams, selectorParams.extractor.contextResults);

      // log.info("selectEntityInstanceFromObjectQueryAndDomainState found instanceUuid", JSON.stringify(instanceUuid))

      if (instanceDomainElement.elementType == "instance") {
        return instanceDomainElement /* QueryResults, elementType == "failure" */
      }
      if (instanceDomainElement.elementType != "string" && instanceDomainElement.elementType != "instanceUuid") {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
          },
        };
      }
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
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
          },
        };
      }
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][instanceDomainElement.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
            instanceUuid: instanceDomainElement.elementValue,
          },
        };
      }
      
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState selectObjectByDirectReference, ############# reference",
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
          domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][instanceDomainElement.elementValue],
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromObjectQueryAndDomainState can not handle QuerySelectObject query with queryType=" +
          selectorParams.extractor.select.queryType
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
export const selectEntityInstanceListFromListQueryAndDomainState: ExtractorSelector<
  DomainModelSingleObjectListExtractor, DomainState, DomainElementInstanceUuidIndexOrFailed
> = selectEntityInstanceUuidIndexFromObjectListExtractor<DomainState>

// ################################################################################################
export const innerSelectElementFromQueryAndDomainState = innerSelectElementFromQuery<DomainState>

// ################################################################################################
export const selectByDomainManyQueriesFromDomainState:ExtractorSelector<
  DomainModelManyExtractors, DomainState, DomainElementObject
> = selectByDomainManyExtractors<DomainState>

// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const selectJzodSchemaBySingleSelectQueryFromDomainStateNew = selectJzodSchemaBySingleSelectQuery<DomainState>

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityJzodSchemaFromDomainStateNew = (
  domainState: DomainState,
  selectorParams: JzodSchemaQuerySelectorParams<DomainModelGetEntityDefinitionExtractor, DomainState>
): JzodObject | undefined => {
  const localQuery: DomainModelGetEntityDefinitionExtractor = selectorParams.query;
  if (
    domainState 
    && domainState[localQuery.deploymentUuid]
    && domainState[localQuery.deploymentUuid]["model"]
    && domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid]
  ) {
    const values: EntityDefinition[] = Object.values(
      domainState[localQuery.deploymentUuid]["model"][entityEntityDefinition.uuid] ?? {}
    ) as EntityDefinition[];
    const index = values.findIndex(
      (e: EntityDefinition) => e.entityUuid == localQuery.entityUuid
    );

    const result: JzodObject | undefined = index > -1?values[index].jzodSchema: undefined;
  
    // log.info("DomainSelector selectEntityJzodSchemaFromDomainState result", result);
  
    return result
  } else {
    return undefined;
  }
}

// ################################################################################################
/**
 * the fetchQuery and FetchQueryJzodSchema should depend only on the instance of Report at hand
 * then on the instance of the required entities (which can change over time, on refresh!! Problem: their number can vary!!)
 * @param domainState 
 * @param query 
 * @returns 
 */
export const selectFetchQueryJzodSchemaFromDomainStateNew = selectFetchQueryJzodSchema<DomainState>

// ################################################################################################
export const selectJzodSchemaByDomainModelQueryFromDomainStateNew = selectJzodSchemaByDomainModelQuery<DomainState>

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

export function getSelectorMap(): ExtractorSelectorMap<DomainState> {
  return {
    selectEntityInstanceUuidIndexFromState: selectEntityInstanceUuidIndexFromDomainState,
    selectEntityInstanceFromState: selectEntityInstanceFromObjectQueryAndDomainState,
    selectEntityInstanceUuidIndexFromObjectListExtractor: selectEntityInstanceListFromListQueryAndDomainState,
    selectByDomainManyExtractors: selectByDomainManyQueriesFromDomainState,
  };
}



export function getJzodSchemaSelectorMap(): JzodSchemaQuerySelectorMap<DomainState> {
  return {
    selectJzodSchemaByDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    selectEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    selectFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    selectJzodSchemaBySingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}

// ################################################################################################
export function getSelectorParams<QueryType extends DomainModelExtractor>(
  query: QueryType,
  selectorMap?: ExtractorSelectorMap<DomainState>
): QuerySelectorParams<QueryType, DomainState> {
  return {
    extractor: query,
    selectorMap: selectorMap ?? getSelectorMap(),
  };
}

import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";

import {
  ApplicationSection,
  DomainElement,
  DomainElementObject,
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelGetSingleSelectObjectListQueryQueryParams,
  DomainModelGetSingleSelectObjectQueryQueryParams,
  EntityDefinition,
  JzodObject,
  MiroirSelectorQueryParams,
  SelectObjectQuery
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  JzodSchemaQuerySelectorMap,
  JzodSchemaQuerySelectorParams,
  QuerySelector,
  QuerySelectorMap,
  QuerySelectorParams,
} from "../0_interfaces/2_domain/DeploymentEntityStateQuerySelectorInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import {
  innerSelectElementFromQuery,
  resolveContextReference,
  selectByDomainManyQueries,
  selectEntityInstanceListFromListQuery,
  selectFetchQueryJzodSchema,
  selectJzodSchemaByDomainModelQuery,
  selectJzodSchemaBySingleSelectQuery,
} from "./QuerySelectors";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainSelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

const emptyDomainObject:DomainElementObject = { elementType: "object", elementValue: {} }

export const dummyDomainManyQueriesWithDeploymentUuid: DomainManyQueriesWithDeploymentUuid = {
  queryType: "DomainManyQueries",
  deploymentUuid: "",
  pageParams: emptyDomainObject,
  queryParams: emptyDomainObject,
  contextResults: emptyDomainObject,
  fetchQuery: { select: {} },
};

export const dummyDomainModelGetFetchParamJzodSchemaQueryParams: DomainModelGetFetchParamJzodSchemaQueryParams = {
  queryType: "getFetchParamsJzodSchema",
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
    queryType: "DomainManyQueries",
    deploymentUuid: "",
    pageParams: emptyDomainObject,
    queryParams: emptyDomainObject,
    contextResults: emptyDomainObject,
    fetchQuery: { select: {} },
  },
};


// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityInstanceUuidIndexFromDomainState: QuerySelector<
  DomainModelGetSingleSelectObjectListQueryQueryParams, DomainState, DomainElement
> = (
  domainState: DomainState,
  selectorParams: QuerySelectorParams<DomainModelGetSingleSelectObjectListQueryQueryParams, DomainState>
): DomainElement => {
  const deploymentUuid = selectorParams.query.singleSelectQuery.deploymentUuid;
  const applicationSection = selectorParams.query.singleSelectQuery.select.applicationSection??"data";

  const entityUuid: DomainElement = resolveContextReference(
    selectorParams.query.singleSelectQuery.select.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
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
      return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", queryReference: JSON.stringify(selectorParams.query.singleSelectQuery.select.parentUuid)} }
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
export const selectEntityInstanceFromObjectQueryAndDomainState:QuerySelector<
  DomainModelGetSingleSelectObjectQueryQueryParams, DomainState, DomainElement
> = (
  domainState: DomainState,
  selectorParams: QuerySelectorParams<DomainModelGetSingleSelectObjectQueryQueryParams, DomainState>
): DomainElement => {
  const querySelectorParams: SelectObjectQuery = selectorParams.query.singleSelectQuery.select as SelectObjectQuery;
  const deploymentUuid = selectorParams.query.singleSelectQuery.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.query.singleSelectQuery.select.applicationSection ??
    ((selectorParams.query.pageParams?.elementValue?.applicationSection?.elementValue ?? "data") as ApplicationSection);

  const entityUuidReference: DomainElement = resolveContextReference(
    querySelectorParams.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
  );

  log.info("selectEntityInstanceFromObjectQueryAndDomainState params", querySelectorParams, deploymentUuid, applicationSection, entityUuidReference);

  // log.info("selectEntityInstanceFromObjectQueryAndDomainState found entityUuidReference", JSON.stringify(entityUuidReference))
  if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    return { elementType: "failure", elementValue: { queryFailure: "IncorrectParameters", queryReference: JSON.stringify(querySelectorParams.parentUuid) } }
  }

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      const referenceObject = resolveContextReference(
        querySelectorParams.objectReference,
        selectorParams.query.queryParams,
        selectorParams.query.contextResults
      );

      if (
        !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid ||
        referenceObject.elementType != "instance"
      ) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: JSON.stringify(selectorParams.query.pageParams),
            queryContext: JSON.stringify(selectorParams.query.contextResults),
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
      const instanceUuid = resolveContextReference(querySelectorParams.instanceUuid, selectorParams.query.queryParams, selectorParams.query.contextResults);
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState selectObjectByDirectReference found domainState", JSON.stringify(domainState))

      log.info("selectEntityInstanceFromObjectQueryAndDomainState found instanceUuid", JSON.stringify(instanceUuid))

      if (instanceUuid.elementType != "string" && instanceUuid.elementType != "instanceUuid") {
        return instanceUuid /* QueryResults, elementType == "failure" */
      }
      log.info("selectEntityInstanceFromObjectQueryAndDomainState resolved instanceUuid =", instanceUuid);
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
      if (!domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][instanceUuid.elementValue]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference.elementValue,
            instanceUuid: instanceUuid.elementValue,
          },
        };
      }
      
        log.info("selectEntityInstanceFromObjectQueryAndDomainState selectObjectByDirectReference, ############# reference",
        querySelectorParams,
        "entityUuidReference",
        entityUuidReference,
        "######### context entityUuid",
        entityUuidReference,
        "######### queryParams",
        JSON.stringify(selectorParams.query.queryParams, undefined, 2),
        "######### contextResults",
        JSON.stringify(selectorParams.query.contextResults, undefined, 2),
        "domainState",
        domainState
      );
      return {
        elementType: "instance",
        elementValue:
          domainState[deploymentUuid][applicationSection][entityUuidReference.elementValue][instanceUuid.elementValue],
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromObjectQueryAndDomainState can not handle SelectObjectQuery query with queryType=" +
          selectorParams.query.singleSelectQuery.select.queryType
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
export const selectEntityInstanceListFromListQueryAndDomainState: QuerySelector<
  DomainModelGetSingleSelectObjectListQueryQueryParams, DomainState, DomainElement
> = selectEntityInstanceListFromListQuery<DomainState>

// ################################################################################################
export const innerSelectElementFromQueryAndDomainState = innerSelectElementFromQuery<DomainState>

// ################################################################################################
export const selectByDomainManyQueriesFromDomainState:QuerySelector<
  DomainManyQueriesWithDeploymentUuid, DomainState, DomainElementObject
> = selectByDomainManyQueries<DomainState>

// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const selectJzodSchemaBySingleSelectQueryFromDomainStateNew = selectJzodSchemaBySingleSelectQuery<DomainState>

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityJzodSchemaFromDomainStateNew = (
  domainState: DomainState,
  selectorParams: JzodSchemaQuerySelectorParams<DomainModelGetEntityDefinitionQueryParams, DomainState>
): JzodObject | undefined => {
  const localQuery: DomainModelGetEntityDefinitionQueryParams = selectorParams.query;
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

export function getSelectorMap(): QuerySelectorMap<DomainState> {
  return {
    selectEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDomainState,
    selectEntityInstanceFromObjectQuery: selectEntityInstanceFromObjectQueryAndDomainState,
    selectEntityInstanceListFromListQuery: selectEntityInstanceListFromListQueryAndDomainState,
    selectByDomainManyQueries: selectByDomainManyQueriesFromDomainState,
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
export function getSelectorParams<QueryType extends MiroirSelectorQueryParams>(
  query: QueryType,
  selectorMap?: QuerySelectorMap<DomainState>
): QuerySelectorParams<QueryType, DomainState> {
  return {
    query,
    selectorMap: selectorMap ?? getSelectorMap(),
  };
}

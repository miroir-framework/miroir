
import {
  ApplicationSection,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetSingleSelectObjectListExtractor,
  DomainModelGetSingleSelectExtractor,
  EntityDefinition,
  JzodObject,
  MiroirSelectorQueryParams,
  SelectObjectQuery
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  JzodSchemaQuerySelectorMap,
  JzodSchemaQuerySelectorParams,
  QuerySelector,
  QuerySelectorMap,
  QuerySelectorParams
} from "../0_interfaces/2_domain/DeploymentEntityStateQuerySelectorInterface.js";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { getDeploymentEntityStateIndex } from "./DeploymentEntityState.js";
import {
  resolveContextReference,
  selectByDomainManyQueries,
  selectEntityInstanceUuidIndexFromListQuery,
  selectFetchQueryJzodSchema,
  selectJzodSchemaByDomainModelQuery,
  selectJzodSchemaBySingleSelectQuery,
} from "./QuerySelectors.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"DeploymentEntityStateQuerySelector");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// ################################################################################################
// ACCESSES deploymentEntityState
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param deploymentEntityState 
 * @param selectorParams 
 * @returns 
 */
export const selectEntityInstanceFromObjectQueryAndDeploymentEntityState:QuerySelector<
  DomainModelGetSingleSelectExtractor, DeploymentEntityState, DomainElementEntityInstanceOrFailed
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: QuerySelectorParams<DomainModelGetSingleSelectExtractor, DeploymentEntityState>
): DomainElementEntityInstanceOrFailed => {
  const querySelectorParams: SelectObjectQuery = selectorParams.query.singleSelectExtractor.select as SelectObjectQuery;
  const deploymentUuid = selectorParams.query.singleSelectExtractor.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.query.singleSelectExtractor.select.applicationSection ??
    ((selectorParams.query.pageParams?.elementValue?.applicationSection?.elementValue ?? "data") as ApplicationSection);

  const entityUuidReference: DomainElement = resolveContextReference(
    querySelectorParams.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
  );

  log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState params", querySelectorParams, deploymentUuid, applicationSection, entityUuidReference);

  // log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState found entityUuidReference", JSON.stringify(entityUuidReference))
  if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryReference: JSON.stringify(querySelectorParams.parentUuid),
      },
    };
  }

  const index = getDeploymentEntityStateIndex(
    deploymentUuid,
    applicationSection,
    entityUuidReference.elementValue
  )

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

      if (!deploymentEntityState[index]) {
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
      //   "selectEntityInstanceFromObjectQueryAndDeploymentEntityState selectObjectByRelation, ############# reference",
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
          deploymentEntityState[index].entities[
            (referenceObject.elementValue as any)[
              querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
            ]
          ],
      };
      break;
    }
    case "selectObjectByDirectReference": {
      const instanceDomainElement = resolveContextReference(
        querySelectorParams.instanceUuid,
        selectorParams.query.queryParams,
        selectorParams.query.contextResults
      );
      // log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState selectObjectByDirectReference found domainState", JSON.stringify(domainState))

      log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState found instanceUuid", JSON.stringify(instanceDomainElement))

      // if (instanceUuid.elementType != "string" && instanceUuid.elementType != "instanceUuid") {
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
      log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState resolved instanceUuid =", instanceDomainElement);
      if (!deploymentEntityState[index]) {
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
      if (!deploymentEntityState[index].entities[instanceDomainElement.elementValue]) {
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
      
      log.info("selectEntityInstanceFromObjectQueryAndDeploymentEntityState selectObjectByDirectReference, ############# reference",
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
        deploymentEntityState
      );
      return {
        elementType: "instance",
        elementValue:
          deploymentEntityState[index].entities[instanceDomainElement.elementValue],
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromObjectQueryAndDeploymentEntityState can not handle SelectObjectQuery query with queryType=" +
          selectorParams.query.singleSelectExtractor.select.queryType
      );
      break;
    }
  }
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceUuidIndexFromDeploymentEntityState: QuerySelector<
  DomainModelGetSingleSelectObjectListExtractor, DeploymentEntityState, DomainElementInstanceUuidIndexOrFailed
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: QuerySelectorParams<DomainModelGetSingleSelectObjectListExtractor, DeploymentEntityState>
): DomainElementInstanceUuidIndexOrFailed => {
  const deploymentUuid = selectorParams.query.singleSelectExtractor.deploymentUuid;
  const applicationSection = selectorParams.query.singleSelectExtractor.select.applicationSection??"data";

  const entityUuid: DomainElement = resolveContextReference(
    selectorParams.query.singleSelectExtractor.select.parentUuid,
    selectorParams.query.queryParams,
    selectorParams.query.contextResults
  );

  log.info("selectEntityInstanceUuidIndexFromDeploymentEntityState params", selectorParams, deploymentUuid, applicationSection, entityUuid);
  log.info("selectEntityInstanceUuidIndexFromDeploymentEntityState deploymentEntityState", deploymentEntityState);

  if (
    !deploymentUuid ||
    !applicationSection ||
    !entityUuid ||
    (entityUuid.elementType != "string" && entityUuid.elementType != "instanceUuid")
  ) {
    return {
      // new object
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryParameters: JSON.stringify(selectorParams),
      },
    };
    // resolving by fetchDataReference, fetchDataReferenceAttribute
  }
  const deploymentEntityStateIndex = getDeploymentEntityStateIndex(
    deploymentUuid,
    applicationSection,
    entityUuid.elementValue
  )
  switch (entityUuid.elementType) {
    case "string":
    case "instanceUuid": {
      if (!deploymentEntityState[deploymentEntityStateIndex]) {
        log.warn(
          "selectEntityInstanceUuidIndexFromDeploymentEntityState could not find index",
          deploymentEntityStateIndex,
          "in deploymentEntityState",
          deploymentEntityState
        );
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
    
      // return { elementType: "instanceUuidIndex", elementValue: Object.fromEntries(deploymentEntityState[index].map(e=>[e.uuid,e])) };
      log.info(
        "selectEntityInstanceUuidIndexFromDeploymentEntityState for",
        deploymentEntityStateIndex,
        "result",
        deploymentEntityState[deploymentEntityStateIndex].entities
      );
      return { elementType: "instanceUuidIndex", elementValue: deploymentEntityState[deploymentEntityStateIndex].entities };
      break;
    }
    default: {
      throw new Error("selectEntityInstanceUuidIndexFromDeploymentEntityState could not handle reference entityUuid=" + entityUuid);
      break;
    }
  }
};





// ################################################################################################
// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityJzodSchemaFromDeploymentEntityState = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: JzodSchemaQuerySelectorParams<DomainModelGetEntityDefinitionQueryParams, DeploymentEntityState>
): JzodObject | undefined => {
  const localQuery: DomainModelGetEntityDefinitionQueryParams = selectorParams.query;

  const deploymentEntityStateIndex = getDeploymentEntityStateIndex(
    localQuery.deploymentUuid,
    "model",
    entityEntityDefinition.uuid
  )

  log.info("selectEntityJzodSchemaFromDeploymentEntityState called with selectorParams", selectorParams)

  if (
    deploymentEntityState &&
    deploymentEntityState[deploymentEntityStateIndex] &&
    deploymentEntityState[deploymentEntityStateIndex].entities
    // deploymentEntityState[deploymentEntityStateIndex].entities[entityEntityDefinition.uuid]
    // deploymentEntityState[deploymentEntityStateIndex].entities[selectorParams.query.entityUuid]
  ) {
    const entityDefinition: EntityDefinition | undefined = Object.values(
      deploymentEntityState[deploymentEntityStateIndex].entities as Record<string, EntityDefinition>
    ).find((e: EntityDefinition) => e.entityUuid == selectorParams.query.entityUuid);
    if (!entityDefinition) {
      log.warn(
        "selectEntityJzodSchemaFromDeploymentEntityState selectorParams",
        selectorParams,
        "could not find entity definition for index",
        deploymentEntityStateIndex,
        "in state",
        deploymentEntityState,
        "for entity",
        selectorParams.query.entityUuid,
        "in deployment",
        localQuery.deploymentUuid,
      );
      return undefined;
    }
    const result: JzodObject = entityDefinition.jzodSchema
    // const result: JzodObject = (
    //   deploymentEntityState[deploymentEntityStateIndex].entities[selectorParams.query.entityUuid] as EntityDefinition
    // ).jzodSchema;
  
    log.info("selectEntityJzodSchemaFromDeploymentEntityState selectorParams",selectorParams,"result", result);
  
    return result
  } else {
    log.warn(
      "selectEntityJzodSchemaFromDeploymentEntityState selectorParams",
      selectorParams,
      "could not find index",
      deploymentEntityStateIndex,
      "in state",
      deploymentEntityState,
      "for entity",
      selectorParams.query.entityUuid,
      "in deployment",
      localQuery.deploymentUuid,
    );
    // throw new Error(
    //   "DomainSelector selectEntityJzodSchemaFromDeploymentEntityState could not find entity " +
    //     entityEntityDefinition.uuid +
    //     " in deployment " +
    //     localQuery.deploymentUuid +
    //     ""
    // );
    return undefined;
  }
}



// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function getDeploymentEntityStateSelectorMap(): QuerySelectorMap<
  DeploymentEntityState
> {
  return {
    selectEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDeploymentEntityState,
    selectEntityInstanceFromObjectQuery: selectEntityInstanceFromObjectQueryAndDeploymentEntityState,
    selectEntityInstanceUuidIndexFromListQuery: selectEntityInstanceUuidIndexFromListQuery,
    selectByDomainManyQueries: selectByDomainManyQueries,
  };
}


// ################################################################################################
export function getDeploymentEntityStateJzodSchemaSelectorMap(): JzodSchemaQuerySelectorMap<DeploymentEntityState> {
  return {
    selectJzodSchemaByDomainModelQuery: selectJzodSchemaByDomainModelQuery,
    selectEntityJzodSchema: selectEntityJzodSchemaFromDeploymentEntityState,
    selectFetchQueryJzodSchema: selectFetchQueryJzodSchema,
    selectJzodSchemaBySingleSelectQuery: selectJzodSchemaBySingleSelectQuery,
  };
}

// ################################################################################################
export function getDeploymentEntityStateSelectorParams<QueryType extends MiroirSelectorQueryParams>(
  query: QueryType,
  selectorMap?: QuerySelectorMap<DeploymentEntityState>
): QuerySelectorParams<QueryType, DeploymentEntityState> {
  return {
    query,
    selectorMap: selectorMap ?? getDeploymentEntityStateSelectorMap(),
  };
}

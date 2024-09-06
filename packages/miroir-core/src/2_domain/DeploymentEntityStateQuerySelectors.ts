import {
  ApplicationSection,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainModelGetEntityDefinitionExtractor,
  ExtractorTemplateForSingleObjectList,
  ExtractorTemplateForSingleObject,
  EntityDefinition,
  JzodObject,
  ExtractorTemplateForDomainModel,
  QueryTemplateSelectObject,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  ExtractorRunnerMapForJzodSchema,
  ExtractorRunnerParamsForJzodSchema,
  SyncExtractorRunner,
  SyncExtractorRunnerMap,
  SyncExtractorRunnerParams,
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { getDeploymentEntityStateIndex } from "./DeploymentEntityState.js";
import {
  resolveContextReferenceDEFUNCT,
  extractWithManyExtractors,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractzodSchemaForSingleSelectQuery,
  extractWithExtractor,
  resolveContextReference,
} from "./QuerySelectors.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "DeploymentEntityStateQuerySelector");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// ################################################################################################
// ACCESSES deploymentEntityState
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param deploymentEntityState
 * @param selectorParams
 * @returns
 */
export const selectEntityInstanceFromDeploymentEntityState: SyncExtractorRunner<
  ExtractorTemplateForSingleObject,
  DeploymentEntityState,
  DomainElementEntityInstanceOrFailed
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncExtractorRunnerParams<ExtractorTemplateForSingleObject, DeploymentEntityState>
): DomainElementEntityInstanceOrFailed => {
  const querySelectorParams: QueryTemplateSelectObject = selectorParams.extractor.select as QueryTemplateSelectObject;
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.extractor.select.applicationSection ??
    ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
      "data") as ApplicationSection);

  const entityUuidReference: DomainElement = resolveContextReference(
    querySelectorParams.parentUuid,
    selectorParams.extractor.queryParams,
    selectorParams.extractor.contextResults
  );

  log.info(
    "selectEntityInstanceFromDeploymentEntityState params",
    querySelectorParams,
    deploymentUuid,
    applicationSection,
    entityUuidReference
  );

  // log.info("selectEntityInstanceFromDeploymentEntityState found entityUuidReference", JSON.stringify(entityUuidReference))
  if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryContext:
          "selectEntityInstanceFromDeploymentEntityState could not resolve entityUuidReference " +
          JSON.stringify(entityUuidReference),
        queryReference: JSON.stringify(querySelectorParams.parentUuid),
      },
    };
  }

  const index = getDeploymentEntityStateIndex(deploymentUuid, applicationSection, entityUuidReference.elementValue);

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      const referenceObject = resolveContextReference(
        querySelectorParams.objectReference,
        selectorParams.extractor.queryParams,
        selectorParams.extractor.contextResults
      );

      if (
        !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
        // ||
        // referenceObject.elementType != "instance"
      ) {
        log.error(
          "selectEntityInstanceFromDeploymentEntityState selectObjectByRelation, querySelectorParams",
          querySelectorParams,
          "entityUuid",
          entityUuidReference,
          "referenceObject",
          referenceObject,
          "queryParams",
          JSON.stringify(selectorParams.extractor.queryParams, undefined, 2),
          "######### contextResults",
          JSON.stringify(selectorParams.extractor.contextResults, undefined, 2)
        );
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
            queryContext:
              "selectEntityInstanceFromDeploymentEntityState querySelectorParams is missing querySelectorParams.AttributeOfObjectToCompareToReferenceUuid, querySlectorParams=" +
              JSON.stringify(querySelectorParams),
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
      //   "selectEntityInstanceFromDeploymentEntityState selectObjectByRelation, ############# reference",
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
            (referenceObject.elementValue as any)[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
          ],
      };
      break;
    }
    case "selectObjectByDirectReference": {
      const instanceDomainElement = resolveContextReference(
        querySelectorParams.instanceUuid,
        selectorParams.extractor.queryParams,
        selectorParams.extractor.contextResults
      );
      // log.info("selectEntityInstanceFromDeploymentEntityState selectObjectByDirectReference found domainState", JSON.stringify(domainState))

      log.info(
        "selectEntityInstanceFromDeploymentEntityState found instanceUuid",
        JSON.stringify(instanceDomainElement)
      );

      // if (instanceUuid.elementType != "string" && instanceUuid.elementType != "instanceUuid") {
      if (instanceDomainElement.elementType == "instance") {
        return instanceDomainElement; /* QueryResults, elementType == "failure" */
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
      log.info("selectEntityInstanceFromDeploymentEntityState resolved instanceUuid =", instanceDomainElement);
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

      log.info(
        "selectEntityInstanceFromDeploymentEntityState selectObjectByDirectReference, ############# reference",
        querySelectorParams,
        "entityUuidReference",
        entityUuidReference,
        "######### context entityUuid",
        entityUuidReference,
        "######### queryParams",
        JSON.stringify(selectorParams.extractor.queryParams, undefined, 2),
        "######### contextResults",
        JSON.stringify(selectorParams.extractor.contextResults, undefined, 2),
        "domainState",
        deploymentEntityState
      );
      return {
        elementType: "instance",
        elementValue: deploymentEntityState[index].entities[instanceDomainElement.elementValue],
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromDeploymentEntityState can not handle QueryTemplateSelectObject query with queryType=" +
          selectorParams.extractor.select.queryType
      );
      break;
    }
  }
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceUuidIndexFromDeploymentEntityState: SyncExtractorRunner<
  ExtractorTemplateForSingleObjectList,
  DeploymentEntityState,
  DomainElementInstanceUuidIndexOrFailed
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncExtractorRunnerParams<ExtractorTemplateForSingleObjectList, DeploymentEntityState>
): DomainElementInstanceUuidIndexOrFailed => {
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection = selectorParams.extractor.select.applicationSection ?? "data";

  const entityUuid: DomainElement = resolveContextReference(
    selectorParams.extractor.select.parentUuid,
    selectorParams.extractor.queryParams,
    selectorParams.extractor.contextResults
  );

  log.info(
    "selectEntityInstanceUuidIndexFromDeploymentEntityState params",
    selectorParams,
    deploymentUuid,
    applicationSection,
    entityUuid
  );
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
        queryContext:
          "selectEntityInstanceUuidIndexFromDeploymentEntityState wrong parameters " +
          "deploymentUuid=" +
          deploymentUuid +
          " applicationSection=" +
          applicationSection +
          " " +
          JSON.stringify(entityUuid),
        queryParameters: JSON.stringify(selectorParams),
      },
    };
    // resolving by fetchDataReference, fetchDataReferenceAttribute
  }
  const deploymentEntityStateIndex = getDeploymentEntityStateIndex(
    deploymentUuid,
    applicationSection,
    entityUuid.elementValue
  );
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
      return {
        elementType: "instanceUuidIndex",
        elementValue: deploymentEntityState[deploymentEntityStateIndex].entities,
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceUuidIndexFromDeploymentEntityState could not handle reference entityUuid=" + entityUuid
      );
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
export const extractEntityJzodSchemaFromDeploymentEntityState = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: ExtractorRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, DeploymentEntityState>
): JzodObject | undefined => {
  const localQuery: DomainModelGetEntityDefinitionExtractor = selectorParams.query;

  const deploymentEntityStateIndex = getDeploymentEntityStateIndex(
    localQuery.deploymentUuid,
    "model",
    entityEntityDefinition.uuid
  );

  log.info("extractEntityJzodSchemaFromDeploymentEntityState called with selectorParams", selectorParams);

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
        "extractEntityJzodSchemaFromDeploymentEntityState selectorParams",
        selectorParams,
        "could not find entity definition for index",
        deploymentEntityStateIndex,
        "in state",
        deploymentEntityState,
        "for entity",
        selectorParams.query.entityUuid,
        "in deployment",
        localQuery.deploymentUuid
      );
      return undefined;
    }
    const result: JzodObject = entityDefinition.jzodSchema;
    // const result: JzodObject = (
    //   deploymentEntityState[deploymentEntityStateIndex].entities[selectorParams.query.entityUuid] as EntityDefinition
    // ).jzodSchema;

    log.info("extractEntityJzodSchemaFromDeploymentEntityState selectorParams", selectorParams, "result", result);

    return result;
  } else {
    log.warn(
      "extractEntityJzodSchemaFromDeploymentEntityState selectorParams",
      selectorParams,
      "could not find index",
      deploymentEntityStateIndex,
      "in state",
      deploymentEntityState,
      "for entity",
      selectorParams.query.entityUuid,
      "in deployment",
      localQuery.deploymentUuid
    );
    // throw new Error(
    //   "DomainSelector extractEntityJzodSchemaFromDeploymentEntityState could not find entity " +
    //     entityEntityDefinition.uuid +
    //     " in deployment " +
    //     localQuery.deploymentUuid +
    //     ""
    // );
    return undefined;
  }
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function getDeploymentEntityStateSelectorMap(): SyncExtractorRunnerMap<DeploymentEntityState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDeploymentEntityState,
    extractEntityInstance: selectEntityInstanceFromDeploymentEntityState,
    extractEntityInstanceUuidIndexWithObjectListExtractorInMemory:
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
    extractWithManyExtractors: extractWithManyExtractors,
    extractWithExtractor: extractWithExtractor,
  };
}

// ################################################################################################
export function getDeploymentEntityStateJzodSchemaSelectorMap(): ExtractorRunnerMapForJzodSchema<DeploymentEntityState> {
  return {
    extractJzodSchemaForDomainModelQuery: extractJzodSchemaForDomainModelQuery,
    extractEntityJzodSchema: extractEntityJzodSchemaFromDeploymentEntityState,
    extractFetchQueryJzodSchema: extractFetchQueryJzodSchema,
    extractzodSchemaForSingleSelectQuery: extractzodSchemaForSingleSelectQuery,
  };
}

// ################################################################################################
export function getDeploymentEntityStateSelectorParams<QueryType extends ExtractorTemplateForDomainModel>(
  query: QueryType,
  extractorRunnerMap?: SyncExtractorRunnerMap<DeploymentEntityState>
): SyncExtractorRunnerParams<QueryType, DeploymentEntityState> {
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getDeploymentEntityStateSelectorMap(),
  };
}

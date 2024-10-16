import {
  ApplicationSection,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainModelGetEntityDefinitionExtractor,
  EntityDefinition,
  ExtractorTemplateForDomainModel,
  ExtractorTemplateForSingleObject,
  ExtractorTemplateForSingleObjectList,
  JzodObject,
  QueryTemplateSelectObject
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface.js";
import {
  ExtractorTemplateRunnerMapForJzodSchema,
  ExtractorTemplateRunnerParamsForJzodSchema,
  SyncExtractorTemplateRunner,
  SyncExtractorTemplateRunnerMap,
  SyncExtractorTemplateRunnerParams,
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/Logger.js";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { packageName } from "../constants.js";
import { getLoggerName } from "../tools.js";
import { cleanLevel } from "./constants.js";
import { getDeploymentEntityStateIndex } from "./DeploymentEntityState.js";
import { selectEntityInstanceUuidIndexFromDeploymentEntityState, selectEntityInstanceFromDeploymentEntityState } from "./DeploymentEntityStateQuerySelectors.js";
import { extractEntityInstanceUuidIndexWithObjectListExtractorInMemory, extractWithManyExtractors, extractWithExtractor } from "./QuerySelectors.js";
import {
  extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory,
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
  extractWithExtractorTemplate,
  extractWithManyExtractorTemplates,
  extractzodSchemaForSingleSelectQueryTemplate
} from "./QueryTemplateSelectors.js";
import { transformer_InnerReference_resolve } from "./Transformers.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "DeploymentEntityStateQueryTemplateSelector");
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
export const selectEntityInstanceFromDeploymentEntityStateForTemplate: SyncExtractorTemplateRunner<
  ExtractorTemplateForSingleObject,
  DeploymentEntityState,
  DomainElementEntityInstanceOrFailed
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObject, DeploymentEntityState>
): DomainElementEntityInstanceOrFailed => {
  // TODO: implement using DeploymentEntityStateQuerySelectors.selectEntityInstanceFromDeploymentEntityState
  const querySelectorParams: QueryTemplateSelectObject = selectorParams.extractorTemplate.select as QueryTemplateSelectObject;
  const deploymentUuid = selectorParams.extractorTemplate.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.extractorTemplate.select.applicationSection ??"data";

  const parentUuidDomainElement = transformer_InnerReference_resolve(
    "runtime",
    querySelectorParams.parentUuid,
    selectorParams.extractorTemplate.queryParams,
    selectorParams.extractorTemplate.contextResults
  );
  
  log.info(
    "selectEntityInstanceFromDeploymentEntityStateForTemplate params",
    querySelectorParams,
    "deploymentUuid",
    deploymentUuid,
    "applicationSection",
    applicationSection,
    "parentUuidDomainElement",
    parentUuidDomainElement
  );

  // log.info("selectEntityInstanceFromDeploymentEntityStateForTemplate found entityUuidReference", JSON.stringify(entityUuidReference))
  if (parentUuidDomainElement.elementType != "string" && parentUuidDomainElement.elementType != "instanceUuid") {
    return {
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryContext:
          "selectEntityInstanceFromDeploymentEntityStateForTemplate could not resolve entityUuidReference " +
          JSON.stringify(parentUuidDomainElement),
        queryReference: JSON.stringify(querySelectorParams.parentUuid),
      },
    };
  }

  const index = getDeploymentEntityStateIndex(deploymentUuid, applicationSection, parentUuidDomainElement.elementValue);

  switch (querySelectorParams?.queryType) {
    case "selectObjectByRelation": {
      const referenceObject = transformer_InnerReference_resolve(
        "build",
        querySelectorParams.objectReference,
        selectorParams.extractorTemplate.queryParams,
        selectorParams.extractorTemplate.contextResults
      );
      if (
        !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
      ) {
        log.error(
          "selectEntityInstanceFromDeploymentEntityStateForTemplate selectObjectByRelation, querySelectorParams",
          querySelectorParams,
          "entityUuid",
          parentUuidDomainElement,
          "referenceObject",
          referenceObject,
          "queryParams",
          JSON.stringify(selectorParams.extractorTemplate.queryParams, undefined, 2),
          "######### contextResults",
          JSON.stringify(selectorParams.extractorTemplate.contextResults, undefined, 2)
        );
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryParameters: JSON.stringify(selectorParams.extractorTemplate.pageParams),
            queryContext:
              "selectEntityInstanceFromDeploymentEntityStateForTemplate querySelectorParams is missing querySelectorParams.AttributeOfObjectToCompareToReferenceUuid, querySlectorParams=" +
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
            entityUuid: parentUuidDomainElement.elementValue,
          },
        };
      }

      // log.info(
      //   "selectEntityInstanceFromDeploymentEntityStateForTemplate selectObjectByRelation, ############# reference",
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
      const instanceDomainElement = transformer_InnerReference_resolve(
        "build",
        querySelectorParams.instanceUuid,
        selectorParams.extractorTemplate.queryParams,
        selectorParams.extractorTemplate.contextResults
      );
      // log.info("selectEntityInstanceFromDeploymentEntityStateForTemplate selectObjectByDirectReference found domainState", JSON.stringify(domainState))

      log.info(
        "selectEntityInstanceFromDeploymentEntityStateForTemplate found instanceDomainElement",
        JSON.stringify(instanceDomainElement)
      );

      // if (instanceUuid.elementType != "string" && instanceUuid.elementType != "instanceUuid") {
      if (instanceDomainElement.elementType == "instance") {
        return instanceDomainElement; /* QueryResults, elementType == "failure" */
      }
      if (instanceDomainElement.elementType != "string" && instanceDomainElement.elementType != "instanceUuid") {
        log.info("selectEntityInstanceFromDeploymentEntityStateForTemplate could not resolve instanceUuid", instanceDomainElement);
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            deploymentUuid,
            applicationSection,
            entityUuid: parentUuidDomainElement.elementValue,
          },
        };
      }
      log.info("selectEntityInstanceFromDeploymentEntityStateForTemplate looking up index", index, "in deploymentEntityState", deploymentEntityState);
      if (!deploymentEntityState[index]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "EntityNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: parentUuidDomainElement.elementValue,
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
            entityUuid: parentUuidDomainElement.elementValue,
            instanceUuid: instanceDomainElement.elementValue,
          },
        };
      }

      const result = deploymentEntityState[index].entities[instanceDomainElement.elementValue];
      log.info(
        "selectEntityInstanceFromDeploymentEntityStateForTemplate selectObjectByDirectReference, ############# reference",
        querySelectorParams,
        "entityUuidReference",
        parentUuidDomainElement,
        "######### context entityUuid",
        parentUuidDomainElement,
        "######### queryParams",
        JSON.stringify(selectorParams.extractorTemplate.queryParams, undefined, 2),
        "######### contextResults",
        JSON.stringify(selectorParams.extractorTemplate.contextResults, undefined, 2),
        "index",
        index,
        "result",
        result,
        "deploymentEntityState",
        deploymentEntityState
      );
      return {
        elementType: "instance",
        // elementValue: deploymentEntityState[index].entities[instanceDomainElement.elementValue],
        elementValue: result,
      };
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromDeploymentEntityStateForTemplate can not handle QueryTemplateSelectObject query with queryType=" +
          selectorParams.extractorTemplate.select.queryType
      );
      break;
    }
  }
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate: SyncExtractorTemplateRunner<
  ExtractorTemplateForSingleObjectList,
  DeploymentEntityState,
  DomainElementInstanceUuidIndexOrFailed
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList, DeploymentEntityState>
): DomainElementInstanceUuidIndexOrFailed => {
  // TODO: implement using DeploymentEntityStateQuerySelectors.selectEntityInstanceUuidIndexFromDeploymentEntityState
  const deploymentUuid = selectorParams.extractorTemplate.deploymentUuid;
  const applicationSection = selectorParams.extractorTemplate.select.applicationSection ?? "data";

  const entityUuidDomainElement = transformer_InnerReference_resolve(
    "build",
    selectorParams.extractorTemplate.select.parentUuid,
    selectorParams.extractorTemplate.queryParams,
    selectorParams.extractorTemplate.contextResults
  );

  log.info(
    "selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate params",
    selectorParams,
    deploymentUuid,
    applicationSection,
    entityUuidDomainElement
  );
  log.info("selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate deploymentEntityState", deploymentEntityState);

  if (
    !deploymentUuid ||
    !applicationSection ||
    !entityUuidDomainElement ||
    (entityUuidDomainElement.elementType != "string" && entityUuidDomainElement.elementType != "instanceUuid")
  ) {
    return {
      // new object
      elementType: "failure",
      elementValue: {
        queryFailure: "IncorrectParameters",
        queryContext:
          "selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate wrong parameters " +
          "deploymentUuid=" +
          deploymentUuid +
          " applicationSection=" +
          applicationSection +
          " " +
          JSON.stringify(entityUuidDomainElement),
        queryParameters: JSON.stringify(selectorParams),
      },
    };
    // resolving by fetchDataReference, fetchDataReferenceAttribute
  }
  const deploymentEntityStateIndex = getDeploymentEntityStateIndex(
    deploymentUuid,
    applicationSection,
    entityUuidDomainElement.elementValue
  );
  switch (entityUuidDomainElement.elementType) {
    case "string":
    case "instanceUuid": {
      if (!deploymentEntityState[deploymentEntityStateIndex]) {
        log.warn(
          "selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate could not find index",
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
            entityUuid: entityUuidDomainElement.elementValue,
          },
        };
      }

      // return { elementType: "instanceUuidIndex", elementValue: Object.fromEntries(deploymentEntityState[index].map(e=>[e.uuid,e])) };
      log.info(
        "selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate for",
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
        "selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate could not handle reference entityUuid=" + entityUuidDomainElement
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
export const extractEntityJzodSchemaFromDeploymentEntityStateForTemplate = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: ExtractorTemplateRunnerParamsForJzodSchema<DomainModelGetEntityDefinitionExtractor, DeploymentEntityState>
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
export function getDeploymentEntityStateSelectorTemplateMap(): SyncExtractorTemplateRunnerMap<DeploymentEntityState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDeploymentEntityState,
    extractEntityInstance: selectEntityInstanceFromDeploymentEntityState,
    extractEntityInstanceUuidIndexWithObjectListExtractorInMemory:
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
    extractWithManyExtractors: extractWithManyExtractors,
    extractWithExtractor: extractWithExtractor,
    // 
    extractEntityInstanceUuidIndexForTemplate: selectEntityInstanceUuidIndexFromDeploymentEntityStateForTemplate,
    extractEntityInstanceForTemplate: selectEntityInstanceFromDeploymentEntityStateForTemplate,
    extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory:
      extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory,
    extractWithManyExtractorTemplates: extractWithManyExtractorTemplates,
    extractWithExtractorTemplate: extractWithExtractorTemplate,
  };
}

// ################################################################################################
export function getDeploymentEntityStateJzodSchemaSelectorTemplateMap(): ExtractorTemplateRunnerMapForJzodSchema<DeploymentEntityState> {
  return {
    extractJzodSchemaForDomainModelQuery: extractJzodSchemaForDomainModelQueryTemplate,
    extractEntityJzodSchema: extractEntityJzodSchemaFromDeploymentEntityStateForTemplate,
    extractFetchQueryJzodSchema: extractFetchQueryTemplateJzodSchema,
    extractzodSchemaForSingleSelectQuery: extractzodSchemaForSingleSelectQueryTemplate,
  };
}

// ################################################################################################
export function getDeploymentEntityStateSelectorTemplateParams<QueryType extends ExtractorTemplateForDomainModel>(
  query: QueryType,
  extractorRunnerMap?: SyncExtractorTemplateRunnerMap<DeploymentEntityState>
): SyncExtractorTemplateRunnerParams<QueryType, DeploymentEntityState> {
  return {
    extractorTemplate: query,
    extractorRunnerMap: extractorRunnerMap ?? getDeploymentEntityStateSelectorTemplateMap(),
  };
}

import {
  ApplicationSection,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  // ExtractorByEntityUuidGetEntityDefinition,
  EntityDefinition,
  ExtractorForDomainModelDEFUNCT,
  QueryForExtractorOrCombinerReturningObject,
  QueryForExtractorOrCombinerReturningObjectList,
  JzodObject,
  ExtractorOrCombinerReturningObject,
  ExtractorByEntityUuidGetEntityDefinition
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface";
import {
  ExtractorRunnerMapForJzodSchema,
  ExtractorRunnerParamsForJzodSchema,
  SyncQueryRunner,
  SyncQueryRunnerMap,
  SyncExtractorRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/Logger";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json";
import { packageName } from "../constants";
import { getLoggerName } from "../tools";
import { cleanLevel } from "./constants";
import { getDeploymentEntityStateIndex } from "./DeploymentEntityState";
import {
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithExtractor,
  runQuery,
  extractzodSchemaForSingleSelectQuery
} from "./QuerySelectors";
import {
  extractWithManyExtractorTemplates
} from "./QueryTemplateSelectors";
import { transformer_InnerReference_resolve } from "./Transformers";

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
export const selectEntityInstanceFromDeploymentEntityState: SyncQueryRunner<
  QueryForExtractorOrCombinerReturningObject,
  DeploymentEntityState,
  DomainElementEntityInstanceOrFailed
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncExtractorRunnerParams<QueryForExtractorOrCombinerReturningObject, DeploymentEntityState>
): DomainElementEntityInstanceOrFailed => {
  const querySelectorParams = selectorParams.extractor.select as ExtractorOrCombinerReturningObject;
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.extractor.select.applicationSection ??
    ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
      "data") as ApplicationSection);

  const entityUuidReference = querySelectorParams.parentUuid

  log.info(
    "selectEntityInstanceFromDeploymentEntityState params",
    querySelectorParams,
    deploymentUuid,
    applicationSection,
    entityUuidReference
  );

  // if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
  //   return {
  //     elementType: "failure",
  //     elementValue: {
  //       queryFailure: "IncorrectParameters",
  //       queryContext:
  //         "selectEntityInstanceFromDeploymentEntityState could not resolve entityUuidReference " +
  //         JSON.stringify(entityUuidReference),
  //       queryReference: JSON.stringify(querySelectorParams.parentUuid),
  //     },
  //   };
  // }

  const index = getDeploymentEntityStateIndex(deploymentUuid, applicationSection, entityUuidReference);

  switch (querySelectorParams?.extractorOrCombinerType) {
    case "combinerForObjectByRelation": {
      // TODO: reference object is implicitly a contextReference here, should be made explicit?!
      const referenceObject = transformer_InnerReference_resolve(
        "runtime",
        { transformerType: "contextReference", referenceName: querySelectorParams.objectReference },
        selectorParams.extractor.queryParams,
        selectorParams.extractor.contextResults
      );

      if (referenceObject.elementType == "failure") {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "ReferenceNotFound",
            queryContext: "selectEntityInstanceFromDeploymentEntityState combinerForObjectByRelation " + JSON.stringify(referenceObject),
          },
        };
        
      }
      if (!querySelectorParams.AttributeOfObjectToCompareToReferenceUuid) {
        log.error(
          "selectEntityInstanceFromDeploymentEntityState combinerForObjectByRelation, querySelectorParams",
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
        log.error("selectEntityInstanceFromDeploymentEntityState combinerForObjectByRelation, could not find index", index, "in deploymentEntityState", deploymentEntityState);
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
      //   "selectEntityInstanceFromDeploymentEntityState combinerForObjectByRelation, ############# reference",
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
    case "extractorForObjectByDirectReference": {
      // TODO: instanceUuid is implicitly a constant here, should be made explicit?!
      const instanceDomainElement = querySelectorParams.instanceUuid;
      // log.info("selectEntityInstanceFromDeploymentEntityState extractorForObjectByDirectReference found domainState", JSON.stringify(domainState))

      log.info(
        "selectEntityInstanceFromDeploymentEntityState found instanceUuid",
        JSON.stringify(instanceDomainElement)
      );

      log.info("selectEntityInstanceFromDeploymentEntityState resolved instanceUuid =", instanceDomainElement);
      if (!deploymentEntityState[index]) {
        log.error("selectEntityInstanceFromDeploymentEntityState extractorForObjectByDirectReference, could not find index", index, "in deploymentEntityState", deploymentEntityState);
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
      if (!deploymentEntityState[index].entities[instanceDomainElement]) {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
            instanceUuid: instanceDomainElement,
          },
        };
      }

      log.info(
        "selectEntityInstanceFromDeploymentEntityState extractorForObjectByDirectReference, ############# reference",
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
        elementValue: deploymentEntityState[index].entities[instanceDomainElement],
      };
      break;
    }
    default: {
      // log.error("selectEntityInstanceFromDeploymentEntityState can not handle QueryTemplateSelectObject query with extractorOrCombinerType=" + selectorParams.extractor.select.extractorOrCombinerType);
      throw new Error(
        "selectEntityInstanceFromDeploymentEntityState can not handle QueryTemplateSelectObject query with extractorOrCombinerType=" +
          selectorParams.extractor.select.extractorOrCombinerType
      );
      break;
    }
  }
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceUuidIndexFromDeploymentEntityState: SyncQueryRunner<
  QueryForExtractorOrCombinerReturningObjectList,
  DeploymentEntityState,
  DomainElementInstanceUuidIndexOrFailed
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncExtractorRunnerParams<QueryForExtractorOrCombinerReturningObjectList, DeploymentEntityState>
): DomainElementInstanceUuidIndexOrFailed => {
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection = selectorParams.extractor.select.applicationSection ?? "data";

  const entityUuid = selectorParams.extractor.select.parentUuid;

  log.info(
    "selectEntityInstanceUuidIndexFromDeploymentEntityState params",
    selectorParams,
    deploymentUuid,
    applicationSection,
    entityUuid
  );
  log.info("selectEntityInstanceUuidIndexFromDeploymentEntityState deploymentEntityState", deploymentEntityState);

  const deploymentEntityStateIndex = getDeploymentEntityStateIndex(
    deploymentUuid,
    applicationSection,
    entityUuid
  );
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
        entityUuid: entityUuid,
      },
    };
  }

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
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceListFromDeploymentEntityState: SyncQueryRunner<
  QueryForExtractorOrCombinerReturningObjectList,
  DeploymentEntityState,
  DomainElementInstanceArrayOrFailed
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncExtractorRunnerParams<QueryForExtractorOrCombinerReturningObjectList, DeploymentEntityState>
): DomainElementInstanceArrayOrFailed => {
  const result = selectEntityInstanceUuidIndexFromDeploymentEntityState(deploymentEntityState, selectorParams);

  if (result.elementType == "failure") {
    return result;
  }
  return {
    elementType: "instanceArray",
    elementValue: Object.values(result.elementValue),
  };
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
  selectorParams: ExtractorRunnerParamsForJzodSchema<ExtractorByEntityUuidGetEntityDefinition, DeploymentEntityState>
): JzodObject | undefined => {
  const localQuery: ExtractorByEntityUuidGetEntityDefinition = selectorParams.query;

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
export function getDeploymentEntityStateSelectorMap(): SyncQueryRunnerMap<DeploymentEntityState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDeploymentEntityState,
    extractEntityInstanceList: selectEntityInstanceListFromDeploymentEntityState,
    extractEntityInstance: selectEntityInstanceFromDeploymentEntityState,
    extractEntityInstanceUuidIndexWithObjectListExtractor:
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
    extractEntityInstanceListWithObjectListExtractor:
      extractEntityInstanceListWithObjectListExtractorInMemory,
    runQuery: runQuery,
    extractWithExtractor: extractWithExtractor,
    // ############################################################################################
    extractWithManyExtractorTemplates: extractWithManyExtractorTemplates,
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
export type GetExtractorRunnerParamsForDeploymentEntityState = <QueryType extends ExtractorForDomainModelDEFUNCT>(
  query: QueryType,
  extractorRunnerMap?: SyncQueryRunnerMap<DeploymentEntityState>
) => SyncExtractorRunnerParams<QueryType, DeploymentEntityState>;

export const getExtractorRunnerParamsForDeploymentEntityState = <QueryType extends ExtractorForDomainModelDEFUNCT>(
  query: QueryType,
  extractorRunnerMap?: SyncQueryRunnerMap<DeploymentEntityState>
): SyncExtractorRunnerParams<QueryType, DeploymentEntityState> =>{
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getDeploymentEntityStateSelectorMap(),
  };
}

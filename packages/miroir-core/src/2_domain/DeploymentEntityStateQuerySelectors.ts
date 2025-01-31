import {
  ApplicationSection,
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryWithExtractorCombinerTransformer,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorOrCombinerReturningObject,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { DeploymentEntityState } from "../0_interfaces/2_domain/DeploymentStateInterface.js";
import { Domain2ElementFailed, Domain2QueryReturnType } from "../0_interfaces/2_domain/DomainElement.js";
import {
  ExtractorRunnerParamsForJzodSchema,
  QueryRunnerMapForJzodSchema,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorRunner,
  SyncBoxedExtractorRunnerParams,
  SyncQueryRunner,
  SyncQueryRunnerParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory.js";
import entityEntityDefinition from "../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json" assert { type: "json" };
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { getDeploymentEntityStateIndex } from "./DeploymentEntityState.js";
import {
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  extractzodSchemaForSingleSelectQuery,
  runQuery
} from "./QuerySelectors.js";
import {
  runQueryTemplateWithExtractorCombinerTransformer
} from "./QueryTemplateSelectors.js";
import { transformer_InnerReference_resolve } from "./Transformers.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DeploymentEntityStateQuerySelector")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export const runQueryFromDeploymentEntityState: SyncQueryRunner<
  DeploymentEntityState,
  Domain2QueryReturnType<Record<string, any>>
> = runQuery<DeploymentEntityState>;

// ################################################################################################
// ACCESSES deploymentEntityState
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param deploymentEntityState
 * @param selectorParams
 * @returns
 */
export const selectEntityInstanceFromDeploymentEntityState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObject,
  DeploymentEntityState,
  Domain2QueryReturnType<EntityInstance>
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject, DeploymentEntityState>
): Domain2QueryReturnType<EntityInstance> => {
  const querySelectorParams = selectorParams.extractor.select as ExtractorOrCombinerReturningObject;
  const deploymentUuid = selectorParams.extractor.deploymentUuid;
  const applicationSection: ApplicationSection =
    selectorParams.extractor.select.applicationSection ??
    ((selectorParams.extractor.pageParams?.applicationSection ??
      "data") as ApplicationSection);

  const entityUuidReference = querySelectorParams.parentUuid

  log.info(
    "selectEntityInstanceFromDeploymentEntityState params",
    querySelectorParams,
    deploymentUuid,
    applicationSection,
    entityUuidReference
  );

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
        return new Domain2ElementFailed({
          queryFailure: "ReferenceNotFound",
          queryContext: "selectEntityInstanceFromDeploymentEntityState combinerForObjectByRelation " + JSON.stringify(referenceObject),
        });
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
        return new Domain2ElementFailed({
          queryFailure: "IncorrectParameters",
          queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
          queryContext:
            "selectEntityInstanceFromDeploymentEntityState querySelectorParams is missing querySelectorParams.AttributeOfObjectToCompareToReferenceUuid, querySlectorParams=" +
            JSON.stringify(querySelectorParams),
        });
      }

      if (!deploymentEntityState[index]) {
        log.error("selectEntityInstanceFromDeploymentEntityState combinerForObjectByRelation, could not find index", index, "in deploymentEntityState", deploymentEntityState);
        return new Domain2ElementFailed({
          queryFailure: "EntityNotFound",
          deploymentUuid,
          applicationSection,
          entityUuid: entityUuidReference,
        });
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
      return deploymentEntityState[index].entities[
        referenceObject[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
      ];
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
        // log.error("selectEntityInstanceFromDeploymentEntityState extractorForObjectByDirectReference, could not find index", index, "in deploymentEntityState", deploymentEntityState);
        return new Domain2ElementFailed({
          queryFailure: "EntityNotFound",
          deploymentUuid,
          applicationSection,
          entityUuid: entityUuidReference,
        });
      }
      if (!deploymentEntityState[index].entities[instanceDomainElement]) {
        return new Domain2ElementFailed({
          queryFailure: "InstanceNotFound",
          deploymentUuid,
          applicationSection,
          entityUuid: entityUuidReference,
          instanceUuid: instanceDomainElement,
        });
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
      return deploymentEntityState[index].entities[instanceDomainElement];
      break;
    }
    default: {
      // log.error("selectEntityInstanceFromDeploymentEntityState can not handle ExtractorTemplateReturningObject query with extractorOrCombinerType=" + selectorParams.extractor.select.extractorOrCombinerType);
      throw new Error(
        "selectEntityInstanceFromDeploymentEntityState can not handle ExtractorTemplateReturningObject query with extractorOrCombinerType=" +
          selectorParams.extractor.select.extractorOrCombinerType
      );
      break;
    }
  }
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceUuidIndexFromDeploymentEntityState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectList,
  DeploymentEntityState,
  Domain2QueryReturnType<EntityInstancesUuidIndex>
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, DeploymentEntityState>
): Domain2QueryReturnType<EntityInstancesUuidIndex> => {
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
    return new Domain2ElementFailed({
      queryFailure: "EntityNotFound",
      deploymentUuid,
      applicationSection,
      entityUuid: entityUuid,
    });
  }

  log.info(
    "selectEntityInstanceUuidIndexFromDeploymentEntityState for",
    deploymentEntityStateIndex,
    "result",
    deploymentEntityState[deploymentEntityStateIndex].entities
  );
  return deploymentEntityState[deploymentEntityStateIndex].entities;
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceListFromDeploymentEntityState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectList,
  DeploymentEntityState,
  Domain2QueryReturnType<EntityInstance[]>
> = (
  deploymentEntityState: DeploymentEntityState,
  selectorParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, DeploymentEntityState>
): Domain2QueryReturnType<EntityInstance[]> => {
  const result = selectEntityInstanceUuidIndexFromDeploymentEntityState(deploymentEntityState, selectorParams);

  if (result instanceof Domain2ElementFailed) {
    return result;
  }
  return Object.values(result);
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
  selectorParams: ExtractorRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, DeploymentEntityState>
): JzodObject | undefined => {
  const localQuery: QueryByEntityUuidGetEntityDefinition = selectorParams.query;

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
export function getDeploymentEntityStateSelectorMap(): SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> {
  return {
    extractorType: "sync",
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDeploymentEntityState,
    extractEntityInstanceList: selectEntityInstanceListFromDeploymentEntityState,
    extractEntityInstance: selectEntityInstanceFromDeploymentEntityState,
    extractEntityInstanceUuidIndexWithObjectListExtractor:
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
    extractEntityInstanceListWithObjectListExtractor:
      extractEntityInstanceListWithObjectListExtractorInMemory,
    runQuery: runQueryFromDeploymentEntityState,
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
    // ############################################################################################
    runQueryTemplateWithExtractorCombinerTransformer: runQueryTemplateWithExtractorCombinerTransformer,
  };
}

// ################################################################################################
export function getDeploymentEntityStateJzodSchemaSelectorMap(): QueryRunnerMapForJzodSchema<DeploymentEntityState> {
  return {
    extractJzodSchemaForDomainModelQuery: extractJzodSchemaForDomainModelQuery,
    extractEntityJzodSchema: extractEntityJzodSchemaFromDeploymentEntityState,
    extractFetchQueryJzodSchema: extractFetchQueryJzodSchema,
    extractzodSchemaForSingleSelectQuery: extractzodSchemaForSingleSelectQuery,
  };
}

// ################################################################################################
export type GetExtractorRunnerParamsForDeploymentEntityState = <QueryType extends BoxedExtractorOrCombinerReturningObjectOrObjectList>(
  query: QueryType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>
) => SyncBoxedExtractorRunnerParams<QueryType, DeploymentEntityState>;

export const getExtractorRunnerParamsForDeploymentEntityState = <QueryType extends BoxedExtractorOrCombinerReturningObjectOrObjectList>(
  query: QueryType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>
): SyncBoxedExtractorRunnerParams<QueryType, DeploymentEntityState> =>{
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getDeploymentEntityStateSelectorMap(),
  };
}

// ################################################################################################
export type GetQueryRunnerParamsForDeploymentEntityState = (
  query: BoxedQueryWithExtractorCombinerTransformer,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>
) => SyncQueryRunnerParams<DeploymentEntityState>;

export const getQueryRunnerParamsForDeploymentEntityState = (
  query: BoxedQueryWithExtractorCombinerTransformer,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>
): SyncQueryRunnerParams<DeploymentEntityState> =>{
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getDeploymentEntityStateSelectorMap(),
  };
}

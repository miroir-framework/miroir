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
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { ReduxDeploymentsState } from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { Domain2ElementFailed, Domain2QueryReturnType, TransformerFailure } from "../0_interfaces/2_domain/DomainElement";
import {
  ExtractorRunnerParamsForJzodSchema,
  QueryRunnerMapForJzodSchema,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorRunner,
  SyncBoxedExtractorRunnerParams,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
const entityEntityDefinition = require("../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json");
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { getReduxDeploymentsStateIndex } from "./ReduxDeploymentsState";
import {
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  extractzodSchemaForSingleSelectQuery,
  runQuery
} from "./QuerySelectors";
import {
  runQueryTemplateWithExtractorCombinerTransformer
} from "./QueryTemplateSelectors";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { transformer_extended_apply } from "./TransformersForRuntime";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
// import { transformer_InnerReference_resolve } from "./TransformersForRuntime";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReduxDeploymentsStateQuerySelector")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
export const runQueryFromReduxDeploymentsState: SyncQueryRunner<
  ReduxDeploymentsState,
  Domain2QueryReturnType<Record<string, any>>
> = runQuery<ReduxDeploymentsState>;

// ################################################################################################
// ACCESSES deploymentEntityState
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param deploymentEntityState
 * @param foreignKeyParams
 * @returns
 */
export const selectEntityInstanceFromReduxDeploymentsState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObject,
  ReduxDeploymentsState,
  Domain2QueryReturnType<EntityInstance>
> = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject, ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment,
): Domain2QueryReturnType<EntityInstance> => {
  const querySelectorParams = foreignKeyParams.extractor.select as ExtractorOrCombinerReturningObject;
  const deploymentUuid = applicationDeploymentMap[foreignKeyParams.extractor.application];
  const applicationSection: ApplicationSection =
    foreignKeyParams.extractor.select.applicationSection ??
    ((foreignKeyParams.extractor.pageParams?.applicationSection ??
      "data") as ApplicationSection);

  const entityUuidReference = querySelectorParams.parentUuid

  // log.info(
  //   "selectEntityInstanceFromReduxDeploymentsState params",
  //   querySelectorParams,
  //   deploymentUuid,
  //   applicationSection,
  //   entityUuidReference
  // );

  const index = getReduxDeploymentsStateIndex(deploymentUuid, applicationSection, entityUuidReference);

  switch (querySelectorParams?.extractorOrCombinerType) {
    case "combinerForObjectByRelation": {
      // TODO: reference object is implicitly a getFromContext here, should be made explicit?!
      // TODO: gives a condition for "build" resolution to yield value not constantTransformer, this is actually not relevant, the interface must be corrected.
      // const referenceObject = transformer_InnerReference_resolve(
      const referenceObject = transformer_extended_apply(
        "runtime",
        [], // transformerPath
        querySelectorParams.label??querySelectorParams.extractorOrCombinerType,
        {
          transformerType: "getFromContext",
          interpolation: "runtime",
          referenceName: querySelectorParams.objectReference,
        },
        "value",
        // {...modelEnvironment, ...foreignKeyParams.extractor.queryParams},
        modelEnvironment,
        foreignKeyParams.extractor.queryParams,
        foreignKeyParams.extractor.contextResults
      );

      if (referenceObject.elementType == "failure") {
        return new Domain2ElementFailed({
          queryFailure: "ReferenceNotFound",
          queryContext: "selectEntityInstanceFromReduxDeploymentsState combinerForObjectByRelation " + JSON.stringify(referenceObject),
        });
      }
      if (!querySelectorParams.AttributeOfObjectToCompareToReferenceUuid) {
        log.error(
          "selectEntityInstanceFromReduxDeploymentsState combinerForObjectByRelation, querySelectorParams",
          querySelectorParams,
          "entityUuid",
          entityUuidReference,
          "referenceObject",
          referenceObject,
          "queryParams",
          JSON.stringify(Object.keys(foreignKeyParams.extractor.queryParams), undefined, 2),
          "######### contextResults",
          JSON.stringify(Object.keys(foreignKeyParams.extractor.contextResults), undefined, 2)
        );
        return new Domain2ElementFailed({
          queryFailure: "IncorrectParameters",
          queryParameters: JSON.stringify(foreignKeyParams.extractor.pageParams),
          queryContext:
            "selectEntityInstanceFromReduxDeploymentsState querySelectorParams is missing querySelectorParams.AttributeOfObjectToCompareToReferenceUuid, querySlectorParams=" +
            JSON.stringify(querySelectorParams),
        });
      }

      if (!deploymentEntityState[index]) {
        log.error("selectEntityInstanceFromReduxDeploymentsState combinerForObjectByRelation, could not find index", index, "in deploymentEntityState", deploymentEntityState);
        return new Domain2ElementFailed({
          queryFailure: "EntityNotFound",
          deploymentUuid,
          applicationSection,
          entityUuid: entityUuidReference,
        });
      }

      // log.info(
      //   "selectEntityInstanceFromReduxDeploymentsState combinerForObjectByRelation, ############# reference",
      //   querySelectorParams,
      //   "######### context entityUuid",
      //   entityUuidReference,
      //   "######### referenceObject",
      //   referenceObject,
      //   "######### queryParams",
      //   JSON.stringify(foreignKeyParams.query.queryParams, undefined, 2),
      //   "######### contextResults",
      //   JSON.stringify(foreignKeyParams.query.contextResults, undefined, 2)
      // );
      log.info("selectEntityInstanceFromReduxDeploymentsState combinerForObjectByRelation referenceObject:", referenceObject);
      
      // In ReduxDeploymentsStateQuerySelectors, referenceObject is the actual object, not a Domain2Element wrapper
      const actualReferenceObject = referenceObject.elementValue || referenceObject;
      if (!actualReferenceObject) {
        log.error("selectEntityInstanceFromReduxDeploymentsState combinerForObjectByRelation actualReferenceObject is undefined");
        return new Domain2ElementFailed({
          queryFailure: "ReferenceNotFound",
          queryContext: "selectEntityInstanceFromReduxDeploymentsState combinerForObjectByRelation actualReferenceObject is undefined, referenceObject=" + JSON.stringify(referenceObject),
        });
      }
      
      const foreignKeyObject = deploymentEntityState[index].entities[
        actualReferenceObject[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
      ];
      
      if (querySelectorParams.applyTransformer) {
        // log.info(
        //   "selectEntityInstanceFromReduxDeploymentsState combinerForObjectByRelation, applying transformer",
        //   querySelectorParams.applyTransformer,
        //   "referenceObject",
        //   actualReferenceObject,
        //   "foreignKeyObject",
        //   foreignKeyObject
        // );
        
        const transformedResult = transformer_extended_apply(
          "runtime",
          [], // transformerPath
          "combinerForObjectByRelation",
          querySelectorParams.applyTransformer,
          "value",
          // {...modelEnvironment, ...foreignKeyParams.extractor.queryParams},
          modelEnvironment,
          foreignKeyParams.extractor.queryParams,
          {
            ...foreignKeyParams.extractor.contextResults,
            referenceObject: actualReferenceObject,
            foreignKeyObject: foreignKeyObject
          }
        );
        
        // log.info(
        //   "selectEntityInstanceFromReduxDeploymentsState combinerForObjectByRelation, after applyTransformer",
        //   querySelectorParams.applyTransformer,
        //   "transformedResult",
        //   JSON.stringify(transformedResult)
        // );
        
        // Handle both Domain2Element wrapper and direct result cases
        // TODO
        // if (transformedResult instanceof TransformerFailure) {
        if (transformedResult && typeof transformedResult === 'object' && transformedResult.elementType == "failure") {
          return transformedResult;
        }
        
        // Return the actual result (either direct value or elementValue if wrapped)
        // return (transformedResult && typeof transformedResult === 'object' && transformedResult.elementValue !== undefined) 
        return (transformedResult && typeof transformedResult === 'object' && transformedResult.elementValue !== undefined) 
          ? transformedResult.elementValue 
          : transformedResult;
      }
      
      return foreignKeyObject;
      break;
    }
    case "extractorForObjectByDirectReference": {
      // TODO: instanceUuid is implicitly a constant here, should be made explicit?!
      const instanceDomainElement = querySelectorParams.instanceUuid;
      // log.info("selectEntityInstanceFromReduxDeploymentsState extractorForObjectByDirectReference found domainState", JSON.stringify(domainState))

      // log.info(
      //   "selectEntityInstanceFromReduxDeploymentsState found instanceUuid",
      //   JSON.stringify(instanceDomainElement)
      // );

      // log.info("selectEntityInstanceFromReduxDeploymentsState resolved instanceUuid =", instanceDomainElement);
      if (!deploymentEntityState[index]) {
        // log.error("selectEntityInstanceFromReduxDeploymentsState extractorForObjectByDirectReference, could not find index", index, "in deploymentEntityState", deploymentEntityState);
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

      // log.info(
      //   "selectEntityInstanceFromReduxDeploymentsState extractorForObjectByDirectReference, ############# reference",
      //   querySelectorParams,
      //   "entityUuidReference",
      //   entityUuidReference,
      //   "######### context entityUuid",
      //   entityUuidReference,
      //   "######### queryParams",
      //   JSON.stringify(foreignKeyParams.extractor.queryParams, undefined, 2),
      //   "######### contextResults",
      //   JSON.stringify(foreignKeyParams.extractor.contextResults, undefined, 2),
      //   "domainState",
      //   deploymentEntityState
      // );
      return deploymentEntityState[index].entities[instanceDomainElement];
      break;
    }
    default: {
      // log.error("selectEntityInstanceFromReduxDeploymentsState can not handle ExtractorTemplateReturningObject query with extractorOrCombinerType=" + foreignKeyParams.extractor.select.extractorOrCombinerType);
      throw new Error(
        "selectEntityInstanceFromReduxDeploymentsState can not handle ExtractorTemplateReturningObject query with extractorOrCombinerType=" +
          foreignKeyParams.extractor.select.extractorOrCombinerType
      );
      break;
    }
  }
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceUuidIndexFromReduxDeploymentsState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectList,
  ReduxDeploymentsState,
  Domain2QueryReturnType<EntityInstancesUuidIndex>
> = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, ReduxDeploymentsState>
): Domain2QueryReturnType<EntityInstancesUuidIndex> => {
  const deploymentUuid = applicationDeploymentMap[foreignKeyParams.extractor.application];
  const applicationSection = foreignKeyParams.extractor.select.applicationSection ?? "data";

  const entityUuid = foreignKeyParams.extractor.select.parentUuid;

  log.info(
    "selectEntityInstanceUuidIndexFromReduxDeploymentsState called with params",
    "application:", foreignKeyParams.extractor.application,
    "applicationDeploymentMap:", applicationDeploymentMap,
    "deploymentUuid:", deploymentUuid,
    "applicationSection:", applicationSection,
    "entityUuid:", entityUuid,
    foreignKeyParams,
  );

  // log.info("selectEntityInstanceUuidIndexFromReduxDeploymentsState deploymentEntityState", deploymentEntityState);
  // log.info(
  //   "selectEntityInstanceUuidIndexFromReduxDeploymentsState deploymentEntityState",
  //   deploymentEntityState
  //   // JSON.stringify(deploymentEntityState, undefined, 2)
  // );

  const deploymentEntityStateIndex = getReduxDeploymentsStateIndex(
    deploymentUuid,
    applicationSection,
    entityUuid
  );
  if (!deploymentEntityState[deploymentEntityStateIndex]) {
    log.warn(
      "selectEntityInstanceUuidIndexFromReduxDeploymentsState could not find index",
      deploymentEntityStateIndex,
      "in deploymentEntityState",
      deploymentEntityState
      // JSON.stringify(deploymentEntityState, undefined, 2)
    );
    return new Domain2ElementFailed({
      queryFailure: "EntityNotFound",
      deploymentUuid,
      applicationSection,
      entityUuid: entityUuid,
    });
  }

  // log.info(
  //   "selectEntityInstanceUuidIndexFromReduxDeploymentsState for",
  //   deploymentEntityStateIndex,
  //   "result",
  //   deploymentEntityState[deploymentEntityStateIndex].entities
  // );
  return deploymentEntityState[deploymentEntityStateIndex].entities;
};

// ################################################################################################
// ACCESSES deploymentEntityState
export const selectEntityInstanceListFromReduxDeploymentsState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectList,
  ReduxDeploymentsState,
  Domain2QueryReturnType<EntityInstance[]>
> = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, ReduxDeploymentsState>,
  modelEnvironment: MiroirModelEnvironment,
): Domain2QueryReturnType<EntityInstance[]> => {
  const result = selectEntityInstanceUuidIndexFromReduxDeploymentsState(
    deploymentEntityState,
    applicationDeploymentMap,
    foreignKeyParams,
    modelEnvironment
  );

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
export const extractEntityJzodSchemaFromReduxDeploymentsState = (
  deploymentEntityState: ReduxDeploymentsState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: ExtractorRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, ReduxDeploymentsState>
): JzodObject | undefined => {
  const localQuery: QueryByEntityUuidGetEntityDefinition = foreignKeyParams.query;
  const deploymentUuid = applicationDeploymentMap[localQuery.application]??"DEPLOYMENT_UUID_NOT_FOUND";

  const deploymentEntityStateIndex = getReduxDeploymentsStateIndex(
    deploymentUuid,
    "model",
    entityEntityDefinition.uuid
  );

  // log.info("extractEntityJzodSchemaFromReduxDeploymentsState called with foreignKeyParams", foreignKeyParams);

  if (
    deploymentEntityState &&
    deploymentEntityState[deploymentEntityStateIndex] &&
    deploymentEntityState[deploymentEntityStateIndex].entities
    // deploymentEntityState[deploymentEntityStateIndex].entities[entityEntityDefinition.uuid]
    // deploymentEntityState[deploymentEntityStateIndex].entities[foreignKeyParams.query.entityUuid]
  ) {
    const entityDefinition: EntityDefinition | undefined = Object.values(
      deploymentEntityState[deploymentEntityStateIndex].entities as Record<string, EntityDefinition>
    ).find((e: EntityDefinition) => e.entityUuid == foreignKeyParams.query.entityUuid);
    if (!entityDefinition) {
      log.warn(
        "extractEntityJzodSchemaFromReduxDeploymentsState foreignKeyParams",
        foreignKeyParams,
        "could not find entity definition for index",
        deploymentEntityStateIndex,
        "in state",
        deploymentEntityState,
        "for entity",
        foreignKeyParams.query.entityUuid,
        "in deployment",
        deploymentUuid
      );
      return undefined;
    }
    const result: JzodObject = entityDefinition.mlSchema;

    // log.info("extractEntityJzodSchemaFromReduxDeploymentsState foreignKeyParams", foreignKeyParams, "result", result);

    return result;
  } else {
    log.warn(
      "extractEntityJzodSchemaFromReduxDeploymentsState foreignKeyParams",
      foreignKeyParams,
      "could not find index",
      deploymentEntityStateIndex,
      "in state",
      deploymentEntityState,
      "for entity",
      foreignKeyParams.query.entityUuid,
      "in deployment",
      deploymentUuid
    );
    // throw new Error(
    //   "DomainSelector extractEntityJzodSchemaFromReduxDeploymentsState could not find entity " +
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
export function getReduxDeploymentsStateSelectorMap(): SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> {
  return {
    extractorType: "sync",
    extractState: (deploymentEntityState: ReduxDeploymentsState, params: any) => deploymentEntityState,
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromReduxDeploymentsState,
    extractEntityInstanceList: selectEntityInstanceListFromReduxDeploymentsState,
    extractEntityInstance: selectEntityInstanceFromReduxDeploymentsState,
    extractEntityInstanceUuidIndexWithObjectListExtractor:
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
    extractEntityInstanceListWithObjectListExtractor:
      extractEntityInstanceListWithObjectListExtractorInMemory,
    runQuery: runQueryFromReduxDeploymentsState,
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
    // ############################################################################################
    runQueryTemplateWithExtractorCombinerTransformer: runQueryTemplateWithExtractorCombinerTransformer,
  };
}

// ################################################################################################
export function getReduxDeploymentsStateJzodSchemaSelectorMap(): QueryRunnerMapForJzodSchema<ReduxDeploymentsState> {
  return {
    extractJzodSchemaForDomainModelQuery: extractJzodSchemaForDomainModelQuery,
    extractEntityJzodSchema: extractEntityJzodSchemaFromReduxDeploymentsState,
    extractFetchQueryJzodSchema: extractFetchQueryJzodSchema,
    extractzodSchemaForSingleSelectQuery: extractzodSchemaForSingleSelectQuery,
  };
}

// ################################################################################################
export type GetExtractorRunnerParamsForReduxDeploymentsState = <QueryType extends BoxedExtractorOrCombinerReturningObjectOrObjectList>(
  query: QueryType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
) => SyncBoxedExtractorRunnerParams<QueryType, ReduxDeploymentsState>;

export const getExtractorRunnerParamsForReduxDeploymentsState = <QueryType extends BoxedExtractorOrCombinerReturningObjectOrObjectList>(
  query: QueryType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
): SyncBoxedExtractorRunnerParams<QueryType, ReduxDeploymentsState> =>{
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getReduxDeploymentsStateSelectorMap(),
  };
}

// ################################################################################################
export type GetQueryRunnerParamsForReduxDeploymentsState = (
  query: BoxedQueryWithExtractorCombinerTransformer,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
) => SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState>;

export const getQueryRunnerParamsForReduxDeploymentsState = (
  query: BoxedQueryWithExtractorCombinerTransformer,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>
): SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> =>{
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getReduxDeploymentsStateSelectorMap(),
  };
}

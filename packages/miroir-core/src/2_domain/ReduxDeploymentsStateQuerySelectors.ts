import {
  ApplicationSection,
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryWithExtractorCombinerTransformer,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorOrCombinerReturningObject,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { applyExtractorFilterAndOrderBy } from "./ExtractorByEntityReturningObjectListTools";
import { ReduxDeploymentsState } from "../0_interfaces/2_domain/ReduxDeploymentsStateInterface";
import { Domain2ElementFailed, Domain2QueryReturnType, TransformerFailure } from "../0_interfaces/2_domain/DomainElement";
import {
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorRunner,
  SyncBoxedExtractorRunnerParams,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { entityEntityDefinition } from "miroir-test-app_deployment-miroir";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { getReduxDeploymentsStateIndex } from "./ReduxDeploymentsState";
import {
  applyExtractorTransformerInMemory,
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  runQuery
} from "./QuerySelectors";
import {
  runQueryTemplateWithExtractorCombinerTransformer
} from "./QueryTemplateSelectors";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { transformer_extended_apply } from "./TransformersForRuntime";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { getForeignKeyValue } from "../1_core/EntityPrimaryKey";
import { defaultApplicationSection } from "../0_interfaces/1_core/Model";
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
      defaultApplicationSection) as ApplicationSection);

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
    case "combinerOneToOne": {
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
        foreignKeyParams.extractor.queryParams ?? {},
        foreignKeyParams.extractor.contextResults ?? {}
      );

      if (referenceObject.elementType == "failure") {
        return new Domain2ElementFailed({
          queryFailure: "ReferenceNotFound",
          queryContext: "selectEntityInstanceFromReduxDeploymentsState combinerOneToOne " + JSON.stringify(referenceObject),
        });
      }
      if (!querySelectorParams.AttributeOfObjectToCompareToReferenceUuid) {
        log.error(
          "selectEntityInstanceFromReduxDeploymentsState combinerOneToOne, querySelectorParams",
          querySelectorParams,
          "entityUuid",
          entityUuidReference,
          "referenceObject",
          referenceObject,
          "queryParams",
          JSON.stringify(Object.keys(foreignKeyParams.extractor.queryParams ?? {}), undefined, 2),
          "######### contextResults",
          JSON.stringify(Object.keys(foreignKeyParams.extractor.contextResults ?? {}), undefined, 2)
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
        log.error(
          "selectEntityInstanceFromReduxDeploymentsState combinerOneToOne, could not find index",
          index,
          "in deploymentEntityState",
          Object.keys(deploymentEntityState),
        );
        return new Domain2ElementFailed({
          queryFailure: "EntityNotFound",
          deploymentUuid,
          applicationSection,
          entityUuid: entityUuidReference,
        });
      }

      // log.info(
      //   "selectEntityInstanceFromReduxDeploymentsState combinerOneToOne, ############# reference",
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
      // log.info("selectEntityInstanceFromReduxDeploymentsState combinerOneToOne referenceObject:", referenceObject);
      
      // In ReduxDeploymentsStateQuerySelectors, referenceObject is the actual object, not a Domain2Element wrapper
      const actualReferenceObject = referenceObject.elementValue || referenceObject;
      if (!actualReferenceObject) {
        log.error("selectEntityInstanceFromReduxDeploymentsState combinerOneToOne actualReferenceObject is undefined");
        return new Domain2ElementFailed({
          queryFailure: "ReferenceNotFound",
          queryContext: "selectEntityInstanceFromReduxDeploymentsState combinerOneToOne actualReferenceObject is undefined, referenceObject=" + JSON.stringify(referenceObject),
        });
      }
      
      const fkValue = getForeignKeyValue(
        querySelectorParams.AttributeOfObjectToCompareToReferenceUuid,
        actualReferenceObject
      );
      if (fkValue == null) {
        return new Domain2ElementFailed({
          queryFailure: "IncorrectParameters",
          queryContext: "selectEntityInstanceFromReduxDeploymentsState combinerOneToOne could not resolve FK value",
        });
      }
      
      const foreignKeyObject = deploymentEntityState[index].entities[fkValue];
      
      if (querySelectorParams.applyTransformer) {
        // log.info(
        //   "selectEntityInstanceFromReduxDeploymentsState combinerOneToOne, applying transformer",
        //   querySelectorParams.applyTransformer,
        //   "referenceObject",
        //   actualReferenceObject,
        //   "foreignKeyObject",
        //   foreignKeyObject
        // );
        
        const transformedResult = transformer_extended_apply(
          "runtime",
          [], // transformerPath
          "combinerOneToOne",
          querySelectorParams.applyTransformer,
          "value",
          // {...modelEnvironment, ...foreignKeyParams.extractor.queryParams},
          modelEnvironment,
          foreignKeyParams.extractor.queryParams ?? {},
          {
            ...foreignKeyParams.extractor.contextResults,
            referenceObject: actualReferenceObject,
            foreignKeyObject: foreignKeyObject
          }
        );
        
        // log.info(
        //   "selectEntityInstanceFromReduxDeploymentsState combinerOneToOne, after applyTransformer",
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
    case "extractorByPrimaryKey": {
      // TODO: instanceUuid is implicitly a constant here, should be made explicit?!
      const instanceDomainElement = querySelectorParams.instanceUuid;
      // log.info("selectEntityInstanceFromReduxDeploymentsState extractorByPrimaryKey found domainState", JSON.stringify(domainState))

      // log.info(
      //   "selectEntityInstanceFromReduxDeploymentsState found instanceUuid",
      //   JSON.stringify(instanceDomainElement)
      // );

      // log.info("selectEntityInstanceFromReduxDeploymentsState resolved instanceUuid =", instanceDomainElement);
      if (!deploymentEntityState[index]) {
        // log.error("selectEntityInstanceFromReduxDeploymentsState extractorByPrimaryKey, could not find index", index, "in deploymentEntityState", deploymentEntityState);
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
      //   "selectEntityInstanceFromReduxDeploymentsState extractorByPrimaryKey, ############# reference",
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
  const applicationSection = foreignKeyParams.extractor.select.applicationSection ?? defaultApplicationSection;

  const entityUuid = foreignKeyParams.extractor.select.parentUuid;

  // log.info(
  //   "selectEntityInstanceUuidIndexFromReduxDeploymentsState called with params",
  //   "application:", foreignKeyParams.extractor.application,
  //   "applicationDeploymentMap:", applicationDeploymentMap,
  //   "deploymentUuid:", deploymentUuid,
  //   "applicationSection:", applicationSection,
  //   "entityUuid:", entityUuid,
  //   foreignKeyParams,
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
      Object.keys(deploymentEntityState)
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
  const entityInstances = deploymentEntityState[deploymentEntityStateIndex].entities;
  const localSelect = foreignKeyParams.extractor.select;
  if (
    localSelect.extractorOrCombinerType !== "extractorInstancesByEntity" ||
    (!localSelect.filter && !localSelect.orderBy)
  ) {
    return entityInstances;
  }
  // Apply filter and orderBy
  // Build reverse map to preserve original PK keys from the EntityAdapter
  const instanceToKey = new Map<EntityInstance, string>();
  for (const [key, instance] of Object.entries(entityInstances)) {
    instanceToKey.set(instance, key);
  }
  const filteredInstancesArray = applyExtractorFilterAndOrderBy(
    Object.values(entityInstances),
    localSelect
  );
  // log.info("selectEntityInstanceUuidIndexFromReduxDeploymentsState filteredInstancesArray", filteredInstancesArray);

  const result = filteredInstancesArray.reduce((acc: EntityInstancesUuidIndex, instance: EntityInstance) => {
    acc[instanceToKey.get(instance) ?? instance.uuid!] = instance;
    return acc;
  }, {});
  // log.info("selectEntityInstanceUuidIndexFromReduxDeploymentsState filtered result", result);
  return result;
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
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function getReduxDeploymentsStateSelectorMap(): SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> {
  return {
    extractorOrCombinerType: "sync",
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
    applyExtractorTransformer: applyExtractorTransformerInMemory,
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

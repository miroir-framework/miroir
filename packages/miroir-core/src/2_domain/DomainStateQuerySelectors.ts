import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";

import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import {
  ApplicationSection,
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorOrCombinerReturningObject,
  JzodObject,
  QueryByEntityUuidGetEntityDefinition,
  QueryByTemplateGetParamJzodSchema
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import {
  Domain2Element,
  Domain2ElementFailed,
  Domain2QueryReturnType,
} from "../0_interfaces/2_domain/DomainElement";
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
const entityEntityDefinition = require("../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json") //assert { type: "json" };
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { runQueryTemplateFromDomainState } from "./DomainStateQueryTemplateSelector";
import {
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  extractzodSchemaForSingleSelectQuery,
  innerSelectDomainElementFromExtractorOrCombiner,
  runQuery,
} from "./QuerySelectors";
import {  type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { transformer_extended_apply } from "./TransformersForRuntime";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
// import { transformer_InnerReference_resolve } from "./TransformersForRuntime";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DomainStateQuerySelector")
).then((logger: LoggerInterface) => {log = logger});

// const emptyDomainObject: Domain2QueryReturnType<Record<string, any>> = { };
const emptyDomainObject: Record<string, any> = { };

export const dummyDomainManyQueryWithDeploymentUuid: BoxedQueryWithExtractorCombinerTransformer = {
  queryType: "boxedQueryWithExtractorCombinerTransformer",
  application: "",
  deploymentUuid: "",
  pageParams: {},
  queryParams: {},
  contextResults: emptyDomainObject,
  extractors: {},
  runtimeTransformers: {},
};

export const dummyDomainManyQueryTemplateWithDeploymentUuid: BoxedQueryTemplateWithExtractorCombinerTransformer = {
  queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  application: "",
  // applicationDeploymentMap: {},
  deploymentUuid: "",
  pageParams: {},
  queryParams: {},
  contextResults: emptyDomainObject,
  extractorTemplates: {},
  runtimeTransformers: {},
};

export const dummyDomainModelGetFetchParamJzodSchemaQueryParams: QueryByTemplateGetParamJzodSchema = {
  queryType: "queryByTemplateGetParamJzodSchema",
  application: "",
  // applicationDeploymentMap: {},
  deploymentUuid: "",
  pageParams: {
    applicationSection: "data" ,
    deploymentUuid: "" ,
    instanceUuid: "" ,
  },
  queryParams: {},
  contextResults: {},
  fetchParams: {
    queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
    application: "",
    // applicationDeploymentMap: {},
    deploymentUuid: "",
    pageParams: {},
    queryParams: {},
    contextResults: {},
    extractorTemplates: {},
    runtimeTransformers: {},
  },
};

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityInstanceUuidIndexFromDomainState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectList,
  DomainState,
  Domain2QueryReturnType<EntityInstancesUuidIndex>
> = (
  domainState: DomainState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, DomainState>
): Domain2QueryReturnType<EntityInstancesUuidIndex> => {
  const deploymentUuid = foreignKeyParams.extractor.deploymentUuid ?? applicationDeploymentMap[foreignKeyParams.extractor.application];
  const applicationSection = foreignKeyParams.extractor.select.applicationSection ?? "data";

  const entityUuid: Uuid = foreignKeyParams.extractor.select.parentUuid;

  // log.info("selectEntityInstanceUuidIndexFromDomainState params", foreignKeyParams, deploymentUuid, applicationSection, entityUuid);
  // log.info("selectEntityInstanceUuidIndexFromDomainState domainState", domainState);

  if (!deploymentUuid || !applicationSection || !entityUuid) {
    return new Domain2ElementFailed({
      queryFailure: "IncorrectParameters",
      queryContext: "deploymentUuid=" + deploymentUuid + ", applicationSection=" + applicationSection + ", entityUuid=" + entityUuid,
      queryParameters: JSON.stringify(foreignKeyParams),
    });
    // resolving by fetchDataReference, fetchDataReferenceAttribute
  }
  if (!domainState) {
    return new Domain2ElementFailed({
      queryFailure: "DomainStateNotLoaded",
    });
  }
  if (!domainState[deploymentUuid]) {
    return new Domain2ElementFailed({
      queryFailure: "DeploymentNotFound",
      failureOrigin: ["selectEntityInstanceUuidIndexFromDomainState"],
      failureMessage:
        "Deployment not found in domainState, deploymentUuid=" +
        deploymentUuid +
        " known deployments=" +
        JSON.stringify(Object.keys(domainState), null, 2),
      deploymentUuid,
      // innerError
    });
  }
  if (!domainState[deploymentUuid][applicationSection]) {
    return new Domain2ElementFailed({
      queryFailure: "ApplicationSectionNotFound",
      deploymentUuid,
      applicationSection,
    });
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
    return new Domain2ElementFailed({
      queryFailure: "EntityNotFound",
      deploymentUuid,
      applicationSection,
      entityUuid: entityUuid,
    });
  }

  return domainState[deploymentUuid][applicationSection][entityUuid];
};

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityInstanceListFromDomainState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectList,
  DomainState,
  Domain2QueryReturnType<EntityInstance[]>
> = (
  domainState: DomainState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, DomainState>,
  modelEnvironment: MiroirModelEnvironment
): Domain2QueryReturnType<EntityInstance[]> => {
  const result = selectEntityInstanceUuidIndexFromDomainState(
    domainState,
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
// ACCESSES DOMAIN STATE
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param domainState
//  * @param foreignKeyParams
 * @returns
 */
function selectEntityInstanceDomainState (
  domainState: DomainState,
  // foreignKeyParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject, DomainState>,
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  entityUuidReference: Uuid,
  instanceUuidDomainElement: Uuid,
  modelEnvironment: MiroirModelEnvironment
): Domain2QueryReturnType<EntityInstance> {
  // const querySelectorParams: ExtractorOrCombinerReturningObject = foreignKeyParams.extractor.select as ExtractorOrCombinerReturningObject;
  // const deploymentUuid = foreignKeyParams.extractor.deploymentUuid;
  // const applicationSection: ApplicationSection =
  //   foreignKeyParams.extractor.select.applicationSection ??
  //   ((foreignKeyParams.extractor.pageParams?.applicationSection ?? "data") as ApplicationSection);

  log.info(
    "selectEntityInstanceDomainState params",
    "deploymentUuid",
    deploymentUuid,
    "applicationSection",
    applicationSection
  );
  // const entityUuidReference: Uuid = querySelectorParams.parentUuid;
  log.info("selectEntityInstanceDomainState entityUuidReference", entityUuidReference);

  // const instanceUuidDomainElement = querySelectorParams.instanceUuid;

  log.info(
    "selectEntityInstanceDomainState found instanceUuid",
    JSON.stringify(instanceUuidDomainElement)
  );

  // log.info("selectEntityInstanceFromObjectQueryAndDomainState resolved instanceUuid =", instanceUuid);
  if (!domainState) {
    return new Domain2ElementFailed({
      queryFailure: "DomainStateNotLoaded",
    });
  }
  if (!domainState[deploymentUuid]) {
    return new Domain2ElementFailed({
      queryFailure: "DeploymentNotFound",
      deploymentUuid,
    });
  }
  if (!domainState[deploymentUuid][applicationSection]) {
    return new Domain2ElementFailed({
      queryFailure: "ApplicationSectionNotFound",
      deploymentUuid,
      applicationSection,
    });
  }
  if (!domainState[deploymentUuid][applicationSection][entityUuidReference]) {
    log.error(
      "selectEntityInstanceDomainState entityUuid not found EntityNotFound for",
      "deploymentUuid",
      deploymentUuid,
      "applicationSection",
      applicationSection,
      "entityUuid",
      entityUuidReference
    );
    return new Domain2ElementFailed({
      queryFailure: "EntityNotFound",
      deploymentUuid,
      applicationSection,
      entityUuid: entityUuidReference,
    });
  }
  if (!domainState[deploymentUuid][applicationSection][entityUuidReference][instanceUuidDomainElement]) {
    return new Domain2ElementFailed({
      queryFailure: "InstanceNotFound",
      deploymentUuid,
      applicationSection,
      entityUuid: entityUuidReference,
      instanceUuid: instanceUuidDomainElement,
    });
  }

  return domainState[deploymentUuid][applicationSection][entityUuidReference][instanceUuidDomainElement];
};

// ################################################################################################
// ACCESSES DOMAIN STATE
/**
 * returns an Entity Instance (Object) from and selectObjectByParameterValue
 * @param domainState
 * @param foreignKeyParams
 * @returns
 */
export const selectEntityInstanceFromObjectQueryAndDomainState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObject,
  DomainState,
  Domain2QueryReturnType<EntityInstance>
> = (
  domainState: DomainState,
  applicationDeploymentMap: ApplicationDeploymentMap,
  foreignKeyParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject, DomainState>,
  modelEnvironment: MiroirModelEnvironment
): Domain2QueryReturnType<EntityInstance> => {
  const querySelectorParams: ExtractorOrCombinerReturningObject = foreignKeyParams.extractor.select as ExtractorOrCombinerReturningObject;
  const deploymentUuid = foreignKeyParams.extractor.deploymentUuid??applicationDeploymentMap[foreignKeyParams.extractor.application];
  const applicationSection: ApplicationSection =
    foreignKeyParams.extractor.select.applicationSection ??
    ((foreignKeyParams.extractor.pageParams?.applicationSection ?? "data") as ApplicationSection);

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

  switch (querySelectorParams?.extractorOrCombinerType) {
    case "combinerForObjectByRelation": {
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
        "value", // TODO: not consistent with "runtime" evaluation, this has no influence on the result of "runtime" evaluations.
        // {...modelEnvironment,...foreignKeyParams.extractor.queryParams},
        modelEnvironment,
        foreignKeyParams.extractor.queryParams,
        foreignKeyParams.extractor.contextResults
      );

      if (!querySelectorParams.AttributeOfObjectToCompareToReferenceUuid) {
        return new Domain2ElementFailed({
          queryFailure: "IncorrectParameters",
          queryParameters: JSON.stringify(foreignKeyParams.extractor.pageParams),
          queryContext:
            "DomainStateQuerySelectors combinerForObjectByRelation did not find AttributeOfObjectToCompareToReferenceUuid in " +
            JSON.stringify(querySelectorParams),
        });
      }

      if (!domainState) {
        return new Domain2ElementFailed({
          queryFailure: "DomainStateNotLoaded",
        });
      }
      if (!domainState[deploymentUuid]) {
        return new Domain2ElementFailed({
          queryFailure: "DeploymentNotFound",
          deploymentUuid,
        });
      }
      if (!domainState[deploymentUuid][applicationSection]) {
        return new Domain2ElementFailed({
          queryFailure: "ApplicationSectionNotFound",
          deploymentUuid,
          applicationSection,
        });
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
        return new Domain2ElementFailed({
          queryFailure: "EntityNotFound",
          deploymentUuid,
          applicationSection,
          entityUuid: entityUuidReference,
        });
      }

      // log.info(
      //   "selectEntityInstanceFromObjectQueryAndDomainState combinerForObjectByRelation, ############# reference",
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
      const targetObject = domainState[deploymentUuid][applicationSection][entityUuidReference];
      const result = targetObject[
        referenceObject[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
      ];
      log.info("selectEntityInstanceFromObjectQueryAndDomainState combinerForObjectByRelation referenceObject", referenceObject);
      log.info("selectEntityInstanceFromObjectQueryAndDomainState combinerForObjectByRelation attribute of reference", querySelectorParams.AttributeOfObjectToCompareToReferenceUuid);
      log.info("selectEntityInstanceFromObjectQueryAndDomainState combinerForObjectByRelation targetObject", targetObject);
      log.info("selectEntityInstanceFromObjectQueryAndDomainState combinerForObjectByRelation result", result);
      
      if (querySelectorParams.applyTransformer) {
        const transformedResult = transformer_extended_apply(
          "runtime",
          [], // transformerPath
          querySelectorParams.label ?? querySelectorParams.extractorOrCombinerType,
          querySelectorParams.applyTransformer,
          "value",
          // {...modelEnvironment,...foreignKeyParams.extractor.queryParams},
          modelEnvironment,
          foreignKeyParams.extractor.queryParams,
          { ...foreignKeyParams.extractor.contextResults, referenceObject, foreignKeyObject: result }
        );
        log.info(
          "selectEntityInstanceFromObjectQueryAndDomainState combinerForObjectByRelation, after applyTransformer",
          querySelectorParams.applyTransformer,
          "transformedResult",
          JSON.stringify(transformedResult, null, 2)
        );
        return transformedResult;
      }
      
      return result;
      break;
    }
    case "extractorForObjectByDirectReference": {
      const instanceUuidDomainElement = querySelectorParams.instanceUuid;

      const currentObject = selectEntityInstanceDomainState(
        domainState,
        deploymentUuid,
        applicationSection,
        entityUuidReference,
        instanceUuidDomainElement,
        modelEnvironment
      )

      if (!querySelectorParams.applyTransformer || currentObject instanceof Domain2ElementFailed) {
        return currentObject;
      }

      const currentObjectEntityDefinition = Object.values(
        domainState[deploymentUuid]["model"]?.[entityEntityDefinition.uuid]
      ).find((e: EntityInstance) => (e as EntityDefinition).entityUuid == entityUuidReference) as EntityDefinition | undefined;

      // const entityDefinition = Object.keys(domainState[deploymentUuid]["model"]);
      log.info("selectEntityInstanceFromObjectQueryAndDomainState entityDefinition", JSON.stringify(currentObjectEntityDefinition, null, 2));
      if (!currentObjectEntityDefinition) {
        return new Domain2ElementFailed({
          queryFailure: "EntityNotFound",
          deploymentUuid,
          entityUuid: entityUuidReference,
        });
      }

      let foreignKeyObjects: Record<string, any> = {};
      for (const attribute of Object.entries(currentObjectEntityDefinition.mlSchema.definition) ?? []) {
        log.debug("selectEntityInstanceFromObjectQueryAndDomainState checking attribute", attribute);
        if (attribute[1].type != "uuid" || !querySelectorParams.foreignKeysForTransformer?.includes(attribute[0])) continue;
        if (!attribute[1].tag?.value?.foreignKeyParams?.targetEntity) {
          return new Domain2ElementFailed({
            queryFailure: "IncorrectParameters",
            queryContext:
              "DomainStateQuerySelectors extractorForObjectByDirectReference did not find targetEntity in attribute " +
              attribute[0] +
              " of entity " +
              currentObjectEntityDefinition.name,
          });
        }
        const attributeName = attribute[0];
        const attributeValue = (currentObject as any)[attributeName];
        const foreignKeyObject = selectEntityInstanceDomainState(
          domainState,
          deploymentUuid,
          applicationSection,
          attribute[1].tag?.value?.foreignKeyParams?.targetEntity,
          attributeValue,
          modelEnvironment
        );
        if (foreignKeyObject instanceof Domain2ElementFailed) {
          return foreignKeyObject;
        }
        foreignKeyObjects[attributeName] = foreignKeyObject;
      }
      log.info("selectEntityInstanceFromObjectQueryAndDomainState foreignKeyObjects", foreignKeyObjects);

      const transformedObject = transformer_extended_apply(
        "runtime",
        [], // transformerPath
        querySelectorParams.label ?? querySelectorParams.extractorOrCombinerType,
        querySelectorParams.applyTransformer,
        "value",
        // {...modelEnvironment,...foreignKeyParams.extractor.queryParams},
        modelEnvironment,
        foreignKeyParams.extractor.queryParams,
        {
          ...foreignKeyParams.extractor.contextResults,
          foreignKeyObjects,
          referenceObject: currentObject,
        }
      );
      log.info(
        "selectEntityInstanceFromObjectQueryAndDomainState after applyTransformer",
        querySelectorParams.applyTransformer,
        "transformedObject",
        JSON.stringify(transformedObject, null, 2)
      );
      return transformedObject;
      break;
    }
    default: {
      throw new Error(
        "selectEntityInstanceFromObjectQueryAndDomainState can not handle ExtractorTemplateReturningObject query with extractorOrCombinerType=" +
          foreignKeyParams.extractor.select.extractorOrCombinerType
      );
      break;
    }
  }
};

// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param domainState
 * @param foreignKeyParams
 * @returns
 */
export const extractEntityInstanceUuidIndexFromListQueryAndDomainState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectList,
  DomainState,
  Domain2QueryReturnType<EntityInstancesUuidIndex>
> = extractEntityInstanceUuidIndexWithObjectListExtractorInMemory<DomainState>;

// ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param domainState
 * @param foreignKeyParams
 * @returns
 */
export const extractEntityInstanceListFromListQueryAndDomainState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectList,
  DomainState,
  Domain2QueryReturnType<EntityInstance[]>
> = extractEntityInstanceListWithObjectListExtractorInMemory<DomainState>;

// ################################################################################################
export const innerSelectElementFromQueryAndDomainState = innerSelectDomainElementFromExtractorOrCombiner<DomainState>;

// ################################################################################################
export const runQueryFromDomainState: SyncQueryRunner<
  DomainState,
  Domain2QueryReturnType<Record<string, any>>
> = runQuery<DomainState>;

// ################################################################################################
export const extractWithExtractorOrCombinerReturningObjectOrObjectListFromDomainState: SyncBoxedExtractorRunner<
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  DomainState,
  Domain2Element
> = extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList<DomainState>;

// ################################################################################################
// JZOD SCHEMAs selectors
// ################################################################################################
// ################################################################################################
export const selectJzodSchemaBySingleSelectQueryFromDomainStateNew = extractzodSchemaForSingleSelectQuery<DomainState>;

// ################################################################################################
// ACCESSES DOMAIN STATE
export const selectEntityJzodSchemaFromDomainStateNew = (
  domainState: DomainState,
  foreignKeyParams: ExtractorRunnerParamsForJzodSchema<QueryByEntityUuidGetEntityDefinition, DomainState>
): JzodObject | undefined => {
  const localQuery: QueryByEntityUuidGetEntityDefinition = foreignKeyParams.query;
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

    const result: JzodObject | undefined = index > -1 ? values[index].mlSchema : undefined;

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

export function getDomainStateExtractorRunnerMap(): SyncBoxedExtractorOrQueryRunnerMap<DomainState> {
  return {
    extractorType: "sync",
    extractState: (domainState: DomainState, params: any) => domainState,
    extractEntityInstanceUuidIndex: selectEntityInstanceUuidIndexFromDomainState,
    extractEntityInstanceList: selectEntityInstanceListFromDomainState,
    extractEntityInstance: selectEntityInstanceFromObjectQueryAndDomainState,
    extractEntityInstanceUuidIndexWithObjectListExtractor: extractEntityInstanceUuidIndexFromListQueryAndDomainState,
    extractEntityInstanceListWithObjectListExtractor: extractEntityInstanceListFromListQueryAndDomainState,
    runQuery: runQueryFromDomainState,
    extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
    // 
    runQueryTemplateWithExtractorCombinerTransformer: runQueryTemplateFromDomainState,
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
// export type GetExtractorRunnerParamsForDomainState = <ExtractorType extends MiroirQuery>(
export type GetExtractorRunnerParamsForDomainState = <ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList>(
  query: ExtractorType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DomainState>
) => SyncBoxedExtractorRunnerParams<ExtractorType, DomainState>;

export const getExtractorRunnerParamsForDomainState: GetExtractorRunnerParamsForDomainState = <
  ExtractorType extends BoxedExtractorOrCombinerReturningObjectOrObjectList
>(
  query: ExtractorType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DomainState>,
): SyncBoxedExtractorRunnerParams<ExtractorType, DomainState> => {
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getDomainStateExtractorRunnerMap(),
  };
};
// ################################################################################################
// export type GetExtractorRunnerParamsForDomainState = <ExtractorType extends MiroirQuery>(
export type GetQueryRunnerParamsForDomainState = <ExtractorType extends BoxedQueryWithExtractorCombinerTransformer>(
  query: ExtractorType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DomainState>
) => SyncQueryRunnerExtractorAndParams<DomainState>;

export const getQueryRunnerParamsForDomainState: GetQueryRunnerParamsForDomainState = <
  ExtractorType extends BoxedQueryWithExtractorCombinerTransformer
>(
  query: ExtractorType,
  extractorRunnerMap?: SyncBoxedExtractorOrQueryRunnerMap<DomainState>
): SyncQueryRunnerExtractorAndParams<DomainState> => {
  return {
    extractor: query,
    extractorRunnerMap: extractorRunnerMap ?? getDomainStateExtractorRunnerMap(),
  };
};

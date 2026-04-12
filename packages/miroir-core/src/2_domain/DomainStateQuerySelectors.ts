import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";

import { entityEntityDefinition } from "miroir-test-app_deployment-miroir";
import { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { defaultApplicationSection } from "../0_interfaces/1_core/Model";
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
  ExtractorOrCombinerReturningObject
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import {
  Domain2Element,
  Domain2ElementFailed,
  Domain2QueryReturnType,
} from "../0_interfaces/2_domain/DomainElement";
import {
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncBoxedExtractorRunner,
  SyncBoxedExtractorRunnerParams,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
import { getForeignKeyValue } from "../1_core/EntityPrimaryKey";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { runQueryTemplateFromDomainState } from "./DomainStateQueryTemplateSelector";
import { applyExtractorFilterAndOrderBy } from "./ExtractorByEntityReturningObjectListTools";
import {
  applyExtractorTransformerInMemory,
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  innerSelectDomainElementFromExtractorOrCombiner,
  runQuery,
} from "./QuerySelectors";
import { transformer_extended_apply } from "./TransformersForRuntime";
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
  // pageParams: {},
  // queryParams: {},
  // contextResults: emptyDomainObject,
  extractors: {},
  runtimeTransformers: {},
};

export const dummyDomainManyQueryTemplateWithDeploymentUuid: BoxedQueryTemplateWithExtractorCombinerTransformer = {
  queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  application: "",
  // pageParams: {},
  // queryParams: {},
  // contextResults: emptyDomainObject,
  extractorTemplates: {},
  runtimeTransformers: {},
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
  extractorParams: SyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList, DomainState>
): Domain2QueryReturnType<EntityInstancesUuidIndex> => {
  const deploymentUuid =
    applicationDeploymentMap[extractorParams.extractor.application] ?? "DEPLOYMENT_UUID_NOT_FOUND";
  const applicationSection = extractorParams.extractor.select.applicationSection ?? defaultApplicationSection;

  const entityUuid: Uuid = extractorParams.extractor.select.parentUuid;

  log.info(
    "selectEntityInstanceUuidIndexFromDomainState params",
    extractorParams,
    deploymentUuid,
    applicationSection,
    entityUuid,
  );
  // log.info("selectEntityInstanceUuidIndexFromDomainState domainState", domainState);

  if (!deploymentUuid || !applicationSection || !entityUuid) {
    return new Domain2ElementFailed({
      queryFailure: "IncorrectParameters",
      queryContext: "deploymentUuid=" + deploymentUuid + ", applicationSection=" + applicationSection + ", entityUuid=" + entityUuid,
      queryParameters: JSON.stringify(extractorParams),
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

  const entityInstances = domainState[deploymentUuid][applicationSection][entityUuid];

  if (extractorParams.extractor.select.extractorOrCombinerType !== "extractorInstancesByEntity"
    || (!extractorParams.extractor.select.filter && !extractorParams.extractor.select.orderBy)
  ) {
    return entityInstances;
  }

  // log.info("selectEntityInstanceUuidIndexFromDomainState applying filter", extractorParams.extractor.select.filter);
  const localSelect = extractorParams.extractor.select;
  const filteredInstancesArray = applyExtractorFilterAndOrderBy(
    Object.values(entityInstances),
    localSelect
  );
  // log.info("selectEntityInstanceUuidIndexFromDomainState filteredInstancesArray", filteredInstancesArray);
  const result = filteredInstancesArray.reduce((acc: EntityInstancesUuidIndex, instance: EntityInstance) => {
    acc[instance.uuid!] = instance;
    return acc;
  }, {});
  // log.info("selectEntityInstanceUuidIndexFromDomainState filtered result", result);
  return result;  
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
  deploymentUuid: Uuid,
  applicationSection: ApplicationSection,
  entityUuidReference: Uuid,
  instanceUuidDomainElement: Uuid,
  modelEnvironment: MiroirModelEnvironment
): Domain2QueryReturnType<EntityInstance> {
  // log.info(
  //   "selectEntityInstanceDomainState params",
  //   "deploymentUuid",
  //   deploymentUuid,
  //   "applicationSection",
  //   applicationSection
  // );
  // const entityUuidReference: Uuid = querySelectorParams.parentUuid;
  // log.info("selectEntityInstanceDomainState entityUuidReference", entityUuidReference);

  // const instanceUuidDomainElement = querySelectorParams.instanceUuid;

  // log.info(
  //   "selectEntityInstanceDomainState found instanceUuid",
  //   JSON.stringify(instanceUuidDomainElement)
  // );

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
  const deploymentUuid = applicationDeploymentMap[foreignKeyParams.extractor.application] ?? "DEPLOYMENT_UUID_NOT_FOUND";
  const applicationSection: ApplicationSection =
    foreignKeyParams.extractor.select.applicationSection ??
    ((foreignKeyParams.extractor.pageParams?.applicationSection ?? "data") as ApplicationSection);

  // log.info(
  //   "selectEntityInstanceFromObjectQueryAndDomainState params",
  //   querySelectorParams,
  //   "deploymentUuid",
  //   deploymentUuid,
  //   "applicationSection",
  //   applicationSection
  // );
  const entityUuidReference: Uuid = querySelectorParams.parentUuid;
  // log.info("selectEntityInstanceFromObjectQueryAndDomainState entityUuidReference", entityUuidReference);

  switch (querySelectorParams?.extractorOrCombinerType) {
    case "combinerOneToOne": {
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
        modelEnvironment,
        foreignKeyParams.extractor.queryParams ?? {},
        foreignKeyParams.extractor.contextResults ?? {}
      );

      if (!querySelectorParams.AttributeOfObjectToCompareToReferenceUuid) {
        return new Domain2ElementFailed({
          queryFailure: "IncorrectParameters",
          queryParameters: JSON.stringify(foreignKeyParams.extractor.pageParams),
          queryContext:
            "DomainStateQuerySelectors combinerOneToOne did not find AttributeOfObjectToCompareToReferenceUuid in " +
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
      //   "selectEntityInstanceFromObjectQueryAndDomainState combinerOneToOne, ############# reference",
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
      const fkValue = getForeignKeyValue(
        querySelectorParams.AttributeOfObjectToCompareToReferenceUuid,
        referenceObject
      );
      if (fkValue == null) {
        return new Domain2ElementFailed({
          queryFailure: "IncorrectParameters",
          queryContext: "combinerOneToOne could not resolve FK value from reference object",
        });
      }
      const result = targetObject[fkValue];
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState combinerOneToOne referenceObject", referenceObject);
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState combinerOneToOne attribute of reference", querySelectorParams.AttributeOfObjectToCompareToReferenceUuid);
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState combinerOneToOne targetObject", targetObject);
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState combinerOneToOne result", result);
      
      if (querySelectorParams.applyTransformer) {
        const transformedResult = transformer_extended_apply(
          "runtime",
          [], // transformerPath
          querySelectorParams.label ?? querySelectorParams.extractorOrCombinerType,
          querySelectorParams.applyTransformer,
          "value",
          modelEnvironment,
          foreignKeyParams.extractor.queryParams ?? {},
          { ...(foreignKeyParams.extractor.contextResults ?? {}), referenceObject, foreignKeyObject: result }
        );
        // log.info(
        //   "selectEntityInstanceFromObjectQueryAndDomainState combinerOneToOne, after applyTransformer",
        //   querySelectorParams.applyTransformer,
        //   "transformedResult",
        //   JSON.stringify(transformedResult, null, 2)
        // );
        return transformedResult;
      }
      
      return result;
      break;
    }
    case "extractorByPrimaryKey": {
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
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState entityDefinition", JSON.stringify(currentObjectEntityDefinition, null, 2));
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
              "DomainStateQuerySelectors extractorByPrimaryKey did not find targetEntity in attribute " +
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
      // log.info("selectEntityInstanceFromObjectQueryAndDomainState foreignKeyObjects", foreignKeyObjects);

      const transformedObject = transformer_extended_apply(
        "runtime",
        [], // transformerPath
        querySelectorParams.label ?? querySelectorParams.extractorOrCombinerType,
        querySelectorParams.applyTransformer,
        "value",
        modelEnvironment,
        foreignKeyParams.extractor.queryParams ?? {},
        {
          ...foreignKeyParams.extractor.contextResults,
          foreignKeyObjects,
          referenceObject: currentObject,
        }
      );
      // log.info(
      //   "selectEntityInstanceFromObjectQueryAndDomainState after applyTransformer",
      //   querySelectorParams.applyTransformer,
      //   "transformedObject",
      //   JSON.stringify(transformedObject, null, 2)
      // );
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
    extractorOrCombinerType: "sync",
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
    applyExtractorTransformer: applyExtractorTransformerInMemory,
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

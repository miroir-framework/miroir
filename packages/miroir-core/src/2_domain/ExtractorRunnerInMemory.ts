import {
  ApplicationSection,
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorOrCombinerReturningObject,
  RunBoxedExtractorAction,
  RunBoxedQueryAction,
  type CombinerForObjectByRelation,
  type ExtractorForObjectByDirectReference
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  Action2EntityInstanceCollection,
  Action2EntityInstanceCollectionOrFailure,
  Action2Error,
  Action2ReturnType,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  TransformerFailure,
} from "../0_interfaces/2_domain/DomainElement";
import {
  AsyncBoxedExtractorOrQueryRunnerMap,
  AsyncBoxedExtractorRunner,
  AsyncBoxedExtractorRunnerParams,
  ExtractorOrQueryPersistenceStoreRunner,
  QueryRunnerMapForJzodSchema
} from "../0_interfaces/2_domain/ExtractorRunnerInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { PersistenceStoreInstanceSectionAbstractInterface } from "../0_interfaces/4-services/PersistenceStoreControllerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import {
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithExtractor,
  asyncRunQuery,
} from "./AsyncQuerySelectors";
import { cleanLevel } from "./constants";
import {
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
} from "./DomainStateQuerySelectors";
import { handleBoxedExtractorAction, handleBoxedQueryAction } from "./QuerySelectors";
import {  type MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { transformer_extended_apply } from "./TransformersForRuntime";
import type { ApplicationDeploymentMap } from "../1_core/Deployment";
// import { transformer_InnerReference_resolve } from "./TransformersForRuntime";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ExtractorRunnerInMemory")
).then((logger: LoggerInterface) => {log = logger});

export class ExtractorRunnerInMemory implements ExtractorOrQueryPersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncBoxedExtractorOrQueryRunnerMap;

  // ################################################################################################
  constructor(
    private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface
  ) {
    this.logHeader =
      "ExtractorRunnerInMemory for store=" + persistenceStoreController.getStoreName();
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex,
      extractEntityInstanceList: this.extractEntityInstanceList,
      extractEntityInstance: this.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractor:
        asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractEntityInstanceListWithObjectListExtractor:
        asyncExtractEntityInstanceListWithObjectListExtractor,
      runQuery: asyncRunQuery,
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // ##########################################################################################
      runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
    };
  }

  // ################################################################################################
  async handleBoxedQueryAction(
    runBoxedQueryAction: RunBoxedQueryAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Action2ReturnType> {
    return handleBoxedQueryAction(
      "ExtractorRunnerInMemory",
      runBoxedQueryAction,
      applicationDeploymentMap,
      this.selectorMap,
      modelEnvironment
    );
  }
  // ################################################################################################
  async handleBoxedExtractorAction(
    runBoxedExtractorAction: RunBoxedExtractorAction,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Action2ReturnType> {
    return handleBoxedExtractorAction(
      "ExtractorRunnerInMemory",
      runBoxedExtractorAction,
      applicationDeploymentMap,
      this.selectorMap,
      modelEnvironment
    );
  }

  // ################################################################################################
  private async extractEntityInstanceByCombinerForObjectByRelation(
    foreignKeyParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject>,
    modelEnvironment: MiroirModelEnvironment,
    querySelectorParams: CombinerForObjectByRelation,
    deploymentUuid: string,
    applicationSection: ApplicationSection,
    entityUuidReference: string
  ): Promise<Domain2QueryReturnType<EntityInstance>> {
    // TODO: we assume this ia a constant, get rid of resolution altogether (push it up)
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
      "value", // TODO: this is inconsistent with "build" evaluation, "build" evaluation should always yield a runtime transformer.
      // {...modelEnvironment, ...foreignKeyParams.extractor.queryParams},
      modelEnvironment,
      foreignKeyParams.extractor.queryParams,
      foreignKeyParams.extractor.contextResults
    );
    log.info(
      "extractEntityInstance combinerForObjectByRelation found referenceObject",
      JSON.stringify(referenceObject, null, 2)
    );
    if (!querySelectorParams.AttributeOfObjectToCompareToReferenceUuid) {
      return new Domain2ElementFailed({
        queryFailure: "IncorrectParameters",
        queryParameters: JSON.stringify(foreignKeyParams.extractor.pageParams),
        queryContext:
          "extractRunnerInMemory extractEntityInstance query has no AttributeOfObjectToCompareToReferenceUuid, query=" +
          JSON.stringify(querySelectorParams),
      });
    }

    const result = await this.persistenceStoreController.getInstance(
      entityUuidReference,
      referenceObject[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
    );

    if (result instanceof Action2Error) {
      const failureMessage = `could not find instance of Entity ${entityUuidReference} with uuid=${
        referenceObject[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
      }`;
      return new Domain2ElementFailed({
        queryFailure: "InstanceNotFound",
        deploymentUuid,
        applicationSection,
        entityUuid: entityUuidReference,
        failureMessage: `could not find instance of Entity ${entityUuidReference} with uuid=${
          referenceObject[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
        }`,
        errorStack:
          typeof result.errorStack == "string"
            ? [failureMessage, result.errorStack]
            : [failureMessage, ...((result.errorStack as any) ?? [])],
      });
    }

    const failureMessage = `could not find instance of Entity ${entityUuidReference} with uuid=${
      referenceObject[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
    }`;
    if (result.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Domain2ElementFailed({
        queryFailure: "InstanceNotFound",
        deploymentUuid,
        applicationSection,
        entityUuid: entityUuidReference,
        failureMessage: failureMessage,
        errorStack: [failureMessage, ...(result.returnedDomainElement.errorStack ?? [])],
      });
    }
    log.info(
      "extractEntityInstance combinerForObjectByRelation, ############# reference",
      querySelectorParams,
      "######### context entityUuid",
      entityUuidReference,
      "######### referenceObject",
      referenceObject,
      "######### queryParams",
      JSON.stringify(Object.keys(foreignKeyParams.extractor.queryParams), undefined, 2),
      "######### contextResults",
      JSON.stringify(Object.keys(foreignKeyParams.extractor.contextResults), undefined, 2)
    );
    if (querySelectorParams.applyTransformer) {
      const transformedResult = transformer_extended_apply(
        "runtime",
        [], // transformerPath
        querySelectorParams.label??querySelectorParams.extractorOrCombinerType,
        querySelectorParams.applyTransformer,
        "value",
        // {...modelEnvironment, ...foreignKeyParams.extractor.queryParams},
        modelEnvironment,
        foreignKeyParams.extractor.queryParams,
        {...foreignKeyParams.extractor.contextResults, referenceObject, foreignKeyObject: result.returnedDomainElement}
      );
      log.info(
        "extractEntityInstance combinerForObjectByRelation, after applyTransformer",
        querySelectorParams.applyTransformer,
        "transformedResult",
        JSON.stringify(transformedResult, null, 2)
      );
      return transformedResult;
    }
    return result.returnedDomainElement;
  }

  // ################################################################################################
  private async extractEntityInstanceByDirectReference(
    foreignKeyParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject>,
    modelEnvironment: MiroirModelEnvironment,
    querySelectorParams: ExtractorForObjectByDirectReference,
    deploymentUuid: string,
    applicationSection: ApplicationSection,
    entityUuidReference: string
  ): Promise<Domain2QueryReturnType<EntityInstance>> {
    const instanceUuid = querySelectorParams.instanceUuid;
    // log.info("extractEntityInstance extractorForObjectByDirectReference found domainState", JSON.stringify(domainState))

    log.info(
      "extractRunnerInMemory extractEntityInstance found instanceUuid",
      JSON.stringify(instanceUuid)
    );

    const getInstanceResult = await this.persistenceStoreController.getInstance(
      entityUuidReference,
      instanceUuid
    );

    if (getInstanceResult instanceof Action2Error) {
      const failureMessage = `extractRunnerInMemory could not find instance of Entity ${entityUuidReference} with uuid=${instanceUuid}`;
      return new Domain2ElementFailed({
        queryFailure: "InstanceNotFound",
        deploymentUuid,
        applicationSection,
        entityUuid: entityUuidReference,
        failureMessage: `extractRunnerInMemory could not find instance of Entity ${entityUuidReference} with uuid=${instanceUuid}`,
        errorStack:
          typeof getInstanceResult.errorStack == "string"
            ? [failureMessage, getInstanceResult.errorStack]
            : [failureMessage, ...((getInstanceResult.errorStack as any) ?? [])],
        innerError: getInstanceResult as any, // TODO: fix type
      });
    }
    const failureMessage = `could not find instance of Entity ${entityUuidReference} with uuid=${instanceUuid}`;
    if (getInstanceResult.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Domain2ElementFailed({
        queryFailure: "InstanceNotFound",
        deploymentUuid,
        applicationSection,
        entityUuid: entityUuidReference,
        failureMessage: failureMessage,
        errorStack: [failureMessage, ...(getInstanceResult.returnedDomainElement.errorStack ?? [])],
        innerError: getInstanceResult.returnedDomainElement as any, // todo: fix type
      });
    }
    log.info(
      "extractRunnerInMemory extractEntityInstance extractorForObjectByDirectReference, ############# reference",
      querySelectorParams,
      "entityUuidReference",
      entityUuidReference,
      "######### context entityUuid",
      entityUuidReference,
      "######### queryParams",
      JSON.stringify(Object.keys(foreignKeyParams.extractor.queryParams), undefined, 2),
      "######### contextResults",
      JSON.stringify(Object.keys(foreignKeyParams.extractor.contextResults), undefined, 2)
    );
    const referenceObject = getInstanceResult.returnedDomainElement;
    if (!querySelectorParams.applyTransformer) {
      return referenceObject;
    }
    const currentEntityDefnition = modelEnvironment.currentModel?.entityDefinitions.find(
      (e) => e.entityUuid == entityUuidReference
    )

    const foreignKeyObjects: Record<string, EntityInstance> = {};
    if (querySelectorParams.foreignKeysForTransformer) {
      for (const attribute of Object.entries(currentEntityDefnition?.mlSchema.definition??{})) {
        if (attribute[0] === "uuid") continue;
        if (attribute[1]?.type !== "uuid" || !querySelectorParams.foreignKeysForTransformer?.includes(attribute[0])) continue;
        if (!attribute[1].tag?.value?.foreignKeyParams?.targetEntity) {
          return new Domain2ElementFailed({
            queryFailure: "IncorrectParameters",
            queryContext: `extractRunnerInMemory extractEntityInstance transformer foreignKeysForTransformer attribute ${attribute[0]} does not have targetEntity tag defined in the model for entity ${entityUuidReference}`,
            queryParameters: JSON.stringify(foreignKeyParams.extractor),
          });
        }
        const attributeName = attribute[0];
        const attributeValue = (referenceObject as any)[attributeName];
        const foreignKeyObjectResult = await this.persistenceStoreController.getInstance(
          attribute[1].tag?.value?.foreignKeyParams?.targetEntity,
          attributeValue
        );
        if (foreignKeyObjectResult instanceof Action2Error) {
          const failureMessage = `extractRunnerInMemory could not find foreignKeyObject of Entity ${attribute[1].tag?.value?.foreignKeyParams?.targetEntity} with uuid=${attributeValue} for attribute ${attributeName} of entity ${entityUuidReference}`;
          return new Domain2ElementFailed({
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
            failureMessage: failureMessage,
            errorStack:
              typeof foreignKeyObjectResult.errorStack == "string"
                ? [failureMessage, foreignKeyObjectResult.errorStack]
                : [failureMessage, ...(foreignKeyObjectResult.errorStack as any) ?? []],
            innerError: foreignKeyObjectResult as any, // TODO: fix type
          });
        }
        foreignKeyObjects[attributeName] = foreignKeyObjectResult.returnedDomainElement as EntityInstance;
      }
    }
    const transformedResult = transformer_extended_apply(
      "runtime",
      [], // transformerPath
      querySelectorParams.label??querySelectorParams.extractorOrCombinerType,
      querySelectorParams.applyTransformer,
      "value",
      // {...modelEnvironment, ...foreignKeyParams.extractor.queryParams},
      modelEnvironment,
      foreignKeyParams.extractor.queryParams,
      {...foreignKeyParams.extractor.contextResults, referenceObject, foreignKeyObjects}
    );
    if (transformedResult instanceof TransformerFailure) {
     return new Domain2ElementFailed({
       queryFailure: transformedResult.queryFailure,
       failureMessage: transformedResult.failureMessage,
       errorStack: transformedResult.errorStack,
       innerError: transformedResult as any,
       queryContext: `extractRunnerInMemory extractEntityInstance transformer failure for entity ${entityUuidReference} with instance uuid=${instanceUuid}`,
       queryParameters: JSON.stringify(foreignKeyParams.extractor),
       deploymentUuid,
       applicationSection,
       entityUuid: entityUuidReference,
       instanceUuid,
     });
    }
    return transformedResult;
  }

  // ################################################################################################
  public extractEntityInstance: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObject,
    Domain2QueryReturnType<EntityInstance>
  > = async (
    foreignKeyParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject>,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Domain2QueryReturnType<EntityInstance>> => {
    const querySelectorParams: ExtractorOrCombinerReturningObject = foreignKeyParams.extractor.select;
    const deploymentUuid = applicationDeploymentMap[foreignKeyParams.extractor.application];
    const applicationSection: ApplicationSection =
      foreignKeyParams.extractor.select.applicationSection ??
      ((foreignKeyParams.extractor.pageParams?.applicationSection ?? "data") as ApplicationSection);

    const entityUuidReference = querySelectorParams.parentUuid; // TODO: we assume this ia a constant here

    log.info(
      "extractRunnerInMemory extractEntityInstance params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReference
    );

    switch (querySelectorParams?.extractorOrCombinerType) {
      case "combinerForObjectByRelation": {
        return this.extractEntityInstanceByCombinerForObjectByRelation(
          foreignKeyParams,
          modelEnvironment,
          querySelectorParams as ExtractorOrCombinerReturningObject & { extractorOrCombinerType: "combinerForObjectByRelation" },
          deploymentUuid,
          applicationSection,
          entityUuidReference
        );
      }
      case "extractorForObjectByDirectReference": {
        return this.extractEntityInstanceByDirectReference(
          foreignKeyParams,
          modelEnvironment,
          querySelectorParams as ExtractorOrCombinerReturningObject & { extractorOrCombinerType: "extractorForObjectByDirectReference" },
          deploymentUuid,
          applicationSection,
          entityUuidReference
        );
      }
      default: {
        throw new Error(
          "extractRunnerInMemory extractEntityInstance can not handle ExtractorTemplateReturningObject query with extractorOrCombinerType=" +
            foreignKeyParams.extractor.select.extractorOrCombinerType
        );
      }
    }
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndex: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstancesUuidIndex>
  > = async (
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>> => {
    return this.extractEntityInstanceList(extractorRunnerParams, applicationDeploymentMap, modelEnvironment).then(
      (result) => {
        // if (result.elementType == "failure") {
        if (result instanceof Domain2ElementFailed) {
          return result;
        }
        const entityInstanceUuidIndex = Object.fromEntries(result.map((i: any) => [i.uuid, i]));
        return entityInstanceUuidIndex;
      }
    );
  };

  // ##############################################################################################
  public extractEntityInstanceList: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstance[]>
  > = async (
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>,
    applicationDeploymentMap: ApplicationDeploymentMap,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Domain2QueryReturnType<EntityInstance[]>> => {
    const deploymentUuid = applicationDeploymentMap[extractorRunnerParams.extractor.application];
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid = extractorRunnerParams.extractor.select.parentUuid;

    // log.info("extractEntityInstanceUuidIndex params", foreignKeyParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("extractEntityInstanceUuidIndex domainState", domainState);

    if (!deploymentUuid || !applicationSection || !entityUuid) {
      return new Domain2ElementFailed({
        // new object
        queryFailure: "IncorrectParameters",
        queryContext:
          "extractRunnerInMemory extractEntityInstanceList wrong context as deploymentUuid, applicationSection, or entityUuid not found, application=" +
          extractorRunnerParams.extractor.application +
          "deploymentUuid=" +
          deploymentUuid +
          ", applicationSection=" +
          applicationSection +
          ", entityUuid=" +
          entityUuid,
        queryParameters: JSON.stringify(extractorRunnerParams),
      });
    }

    const entityInstanceCollection: Action2EntityInstanceCollectionOrFailure =
      await this.persistenceStoreController.getInstances(/*applicationSection, */ entityUuid);

    if (entityInstanceCollection instanceof Action2Error) {
      return new Domain2ElementFailed({
        queryFailure: "EntityNotFound", // TODO: find corresponding queryFailure from data
        deploymentUuid,
        applicationSection,
        entityUuid: entityUuid,
      });
    }
    if (entityInstanceCollection.returnedDomainElement instanceof Domain2ElementFailed) {
      return new Domain2ElementFailed({
        queryFailure: "EntityNotFound", // TODO: find corresponding queryFailure from data
        deploymentUuid,
        applicationSection,
        entityUuid: entityUuid,
      });
    }
    if (entityInstanceCollection.returnedDomainElement instanceof Domain2ElementFailed) {
      return entityInstanceCollection.returnedDomainElement;
    }

    return entityInstanceCollection.returnedDomainElement.instances;
  };

  // ##############################################################################################
  public getDomainStateExtractorRunnerMap(): AsyncBoxedExtractorOrQueryRunnerMap {
    return this.selectorMap;
  }
} // end of class ExtractorRunnerInMemory

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
export function getDomainStateJzodSchemaExtractorRunnerMap(): QueryRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}

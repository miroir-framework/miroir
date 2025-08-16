import {
  ApplicationSection,
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorOrCombinerReturningObject,
  RunBoxedExtractorAction,
  RunBoxedQueryAction
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "../0_interfaces/2_domain/DomainControllerInterface";
import {
  Action2EntityInstanceCollection,
  Action2EntityInstanceCollectionOrFailure,
  Action2Error,
  Action2ReturnType,
  Domain2ElementFailed,
  Domain2QueryReturnType,
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
import { MiroirLoggerFactory } from "../4_services/LoggerFactory";
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
import { transformer_InnerReference_resolve } from "./TransformersForRuntime";

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
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Action2ReturnType> {
    return handleBoxedQueryAction(
      "ExtractorRunnerInMemory",
      runBoxedQueryAction,
      this.selectorMap,
      modelEnvironment
    );
  }
  // ################################################################################################
  async handleBoxedExtractorAction(
    runBoxedExtractorAction: RunBoxedExtractorAction,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Action2ReturnType> {
    return handleBoxedExtractorAction(
      "ExtractorRunnerInMemory",
      runBoxedExtractorAction,
      this.selectorMap,
      modelEnvironment
    );
  }

  // ################################################################################################
  public extractEntityInstance: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObject,
    Domain2QueryReturnType<EntityInstance>
  > = async (
    selectorParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject>,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Domain2QueryReturnType<EntityInstance>> => {
    const querySelectorParams: ExtractorOrCombinerReturningObject = selectorParams.extractor.select;
    const deploymentUuid = selectorParams.extractor.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractor.select.applicationSection ??
      ((selectorParams.extractor.pageParams?.applicationSection ?? "data") as ApplicationSection);

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
        // TODO: we assume this ia a constant, get rid of resolution altogether (push it up)
        const referenceObject = transformer_InnerReference_resolve(
          "runtime",
          {
            transformerType: "contextReference",
            interpolation: "runtime",
            referenceName: querySelectorParams.objectReference,
          },
          "value", // TODO: this is inconsistent with "build" evaluation, "build" evaluation should always yield a runtime transformer.
          {...modelEnvironment, ...selectorParams.extractor.queryParams},
          selectorParams.extractor.contextResults
        );
        log.info(
          "extractEntityInstance combinerForObjectByRelation found referenceObject",
          JSON.stringify(referenceObject, null, 2)
        );
        if (!querySelectorParams.AttributeOfObjectToCompareToReferenceUuid) {
          return new Domain2ElementFailed({
            queryFailure: "IncorrectParameters",
            queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
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
        // log.info(
        //   "extractEntityInstance combinerForObjectByRelation, ############# reference",
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
        return result.returnedDomainElement;
        break;
      }
      case "extractorForObjectByDirectReference": {
        const instanceUuid = querySelectorParams.instanceUuid;
        // log.info("extractEntityInstance extractorForObjectByDirectReference found domainState", JSON.stringify(domainState))

        log.info(
          "extractRunnerInMemory extractEntityInstance found instanceUuid",
          JSON.stringify(instanceUuid)
        );

        const result = await this.persistenceStoreController.getInstance(
          entityUuidReference,
          instanceUuid
        );

        if (result instanceof Action2Error) {
          const failureMessage = `extractRunnerInMemory could not find instance of Entity ${entityUuidReference} with uuid=${instanceUuid}`;
          return new Domain2ElementFailed({
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
            failureMessage: `extractRunnerInMemory could not find instance of Entity ${entityUuidReference} with uuid=${instanceUuid}`,
            errorStack:
              typeof result.errorStack == "string"
                ? [failureMessage, result.errorStack]
                : [failureMessage, ...((result.errorStack as any) ?? [])],
            innerError: result as any, // TODO: fix type
          });
        }
        const failureMessage = `could not find instance of Entity ${entityUuidReference} with uuid=${instanceUuid}`;
        if (result.returnedDomainElement instanceof Domain2ElementFailed) {
          return new Domain2ElementFailed({
            queryFailure: "InstanceNotFound",
            deploymentUuid,
            applicationSection,
            entityUuid: entityUuidReference,
            failureMessage: failureMessage,
            errorStack: [failureMessage, ...(result.returnedDomainElement.errorStack ?? [])],
            innerError: result.returnedDomainElement as any, // todo: fix type
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
          JSON.stringify(selectorParams.extractor.queryParams, undefined, 2),
          "######### contextResults",
          JSON.stringify(selectorParams.extractor.contextResults, undefined, 2)
        );
        return result.returnedDomainElement;
        break;
      }
      default: {
        throw new Error(
          "extractRunnerInMemory extractEntityInstance can not handle ExtractorTemplateReturningObject query with extractorOrCombinerType=" +
            selectorParams.extractor.select.extractorOrCombinerType
        );
        break;
      }
    }
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndex: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstancesUuidIndex>
  > = async (
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>,
    modelEnvironment: MiroirModelEnvironment
  ): Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>> => {
    return this.extractEntityInstanceList(extractorRunnerParams, modelEnvironment).then(
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
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<Domain2QueryReturnType<EntityInstance[]>> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid = extractorRunnerParams.extractor.select.parentUuid;

    // log.info("extractEntityInstanceUuidIndex params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("extractEntityInstanceUuidIndex domainState", domainState);

    if (!deploymentUuid || !applicationSection || !entityUuid) {
      return new Domain2ElementFailed({
        // new object
        queryFailure: "IncorrectParameters",
        queryContext:
          "extractRunnerInMemory extractEntityInstanceList wrong context as deploymentUuid, applicationSection, entityUuid not found, deploymentUuid=" +
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

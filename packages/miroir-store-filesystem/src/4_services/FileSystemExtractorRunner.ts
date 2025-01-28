import {
  Action2EntityInstanceCollectionOrFailure,
  Action2Error,
  Action2ReturnType,
  ApplicationSection,
  asyncApplyExtractorTransformerInMemory,
  AsyncBoxedExtractorOrQueryRunnerMap,
  AsyncBoxedExtractorRunner,
  AsyncBoxedExtractorRunnerParams,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithExtractor,
  asyncRunQuery,
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  DomainElementSuccess,
  DomainState,
  EntityInstance,
  EntityInstancesUuidIndex,
  ExtractorOrCombinerReturningObject,
  ExtractorOrQueryPersistenceStoreRunner,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  QueryRunnerMapForJzodSchema,
  RunBoxedExtractorAction,
  RunBoxedQueryAction,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  transformer_InnerReference_resolve
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FilesystemExtractorRunner")
).then((logger: LoggerInterface) => {log = logger});

export class FileSystemExtractorRunner implements ExtractorOrQueryPersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncBoxedExtractorOrQueryRunnerMap;

  // ################################################################################################
  constructor(private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface) {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex,
      extractEntityInstanceList: this.extractEntityInstanceList,
      extractEntityInstance: this.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractEntityInstanceListWithObjectListExtractor: asyncExtractEntityInstanceListWithObjectListExtractor,
      runQuery: asyncRunQuery,
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // ############################################################################
      runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
    };
  }

  // ################################################################################################
  async handleBoxedExtractorAction(runBoxedExtractorAction: RunBoxedExtractorAction): Promise<Action2ReturnType> {
    log.info(this.logHeader, "handleBoxedExtractorAction", "runBoxedExtractorAction", JSON.stringify(runBoxedExtractorAction, null, 2));
    let queryResult: Domain2QueryReturnType<DomainElementSuccess>;
    queryResult = await this.selectorMap.extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList(
      {
        extractor: runBoxedExtractorAction.query,
        extractorRunnerMap: this.selectorMap,
      }
    );
    if (queryResult instanceof Domain2ElementFailed) {
      return {
        status: "error",
        errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult),
      } as Action2ReturnType;
    } else {
      const result: Action2ReturnType = { status: "ok", returnedDomainElement: queryResult };
      log.info(this.logHeader, "handleBoxedExtractorAction", "runBoxedExtractorAction", runBoxedExtractorAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
  }

  // ################################################################################################
  async handleBoxedQueryAction(runBoxedQueryAction: RunBoxedQueryAction): Promise<Action2ReturnType> {
    log.info(this.logHeader, "handleBoxedQueryAction", "runBoxedQueryAction", JSON.stringify(runBoxedQueryAction, null, 2));
    let queryResult: Domain2QueryReturnType<DomainElementSuccess>;
    queryResult = await this.selectorMap.runQuery(
      {
        extractor: runBoxedQueryAction.query,
        extractorRunnerMap: this.selectorMap,
      }
    );
    if (queryResult instanceof Domain2ElementFailed) {
      return {
        status: "error",
        errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult),
      } as Action2ReturnType;
    } else {
      const result: Action2ReturnType = { status: "ok", returnedDomainElement: queryResult };
      log.info(this.logHeader, "handleBoxedQueryAction", "runBoxedQueryAction", runBoxedQueryAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
  }

  // ################################################################################################
  public extractEntityInstance: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObject,
    Domain2QueryReturnType<EntityInstance>
  > = async (
    selectorParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject>
  ): Promise<Domain2QueryReturnType<EntityInstance>> => {
    const querySelectorParams: ExtractorOrCombinerReturningObject = selectorParams.extractor.select as ExtractorOrCombinerReturningObject;
    const deploymentUuid = selectorParams.extractor.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractor.select.applicationSection ??
      // ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
      ((selectorParams.extractor.pageParams?.applicationSection ??
        "data") as ApplicationSection);

    const entityUuidReference: string = querySelectorParams.parentUuid;

    log.info(
      "extractEntityInstance params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReference
    );
    switch (querySelectorParams?.extractorOrCombinerType) {
      case "combinerForObjectByRelation": {
        // const referenceObject = querySelectorParams.objectReference;
        const referenceObject = transformer_InnerReference_resolve(
          "build",
          { transformerType: "contextReference", referenceName: querySelectorParams.objectReference },
          selectorParams.extractor.queryParams,
          selectorParams.extractor.contextResults
        );
  
        if (
          !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
          ||
          referenceObject instanceof Domain2ElementFailed
        ) {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "IncorrectParameters",
              failureOrigin: ["FileSystemExtractorRunner", "combinerForObjectByRelation"],
              queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
              queryContext: JSON.stringify(selectorParams.extractor.contextResults),
            },
          };
        }

        const result = await this.persistenceStoreController.getInstance(
          // applicationSection,
          entityUuidReference,
          (referenceObject.elementValue as any)[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
        );

        if (result instanceof Action2Error || result.returnedDomainElement instanceof Domain2ElementFailed) {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "InstanceNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReference,
            },
          };
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
        const instanceDomainElement = querySelectorParams.instanceUuid;
        // log.info("extractEntityInstance extractorForObjectByDirectReference found domainState", JSON.stringify(domainState))

        log.info(
          "extractEntityInstance found instanceUuid",
          JSON.stringify(instanceDomainElement)
        );

        log.info("extractEntityInstance resolved instanceUuid =", instanceDomainElement);
        const result = await this.persistenceStoreController.getInstance(
          entityUuidReference,
          instanceDomainElement
        );

        if (result instanceof Action2Error || result.returnedDomainElement instanceof Domain2ElementFailed) {
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
          "extractEntityInstance extractorForObjectByDirectReference, ############# reference",
          querySelectorParams,
          "entityUuidReference",
          entityUuidReference,
          "######### context entityUuid",
          entityUuidReference,
          "######### queryParams",
          JSON.stringify(selectorParams.extractor.queryParams, undefined, 2),
          "######### contextResults",
          JSON.stringify(selectorParams.extractor.contextResults, undefined, 2),
        );
        return result.returnedDomainElement;
        break;
      }
      default: {
        throw new Error(
          "extractEntityInstance can not handle ExtractorTemplateReturningObject query with extractorOrCombinerType=" +
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
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>> => {
    return this.extractEntityInstanceList(extractorRunnerParams).then((result) => {
      if (result instanceof Domain2ElementFailed) {
        return result;
      }
      const entityInstanceUuidIndex = Object.fromEntries(
        result.map((i: any) => [i.uuid, i])
      );
      return entityInstanceUuidIndex;
    });
  }

  // ##############################################################################################
  public extractEntityInstanceList: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstance[]>
  > = async (
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<Domain2QueryReturnType<EntityInstance[]>> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";
    const entityUuid = extractorRunnerParams.extractor.select.parentUuid
  
    // log.info("extractEntityInstanceUuidIndex params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("extractEntityInstanceUuidIndex domainState", domainState);
  
    if (!deploymentUuid || !applicationSection || !entityUuid) {
      return {
        // new object
        elementType: "failure",
        elementValue: {
          queryFailure: "IncorrectParameters",
          queryParameters: JSON.stringify(extractorRunnerParams),
        },
      };
      // resolving by fetchDataReference, fetchDataReferenceAttribute
    }
  
    const entityInstanceCollection: Action2EntityInstanceCollectionOrFailure =
      await this.persistenceStoreController.getInstances(/*applicationSection, */ entityUuid);
  
    if (entityInstanceCollection instanceof Action2Error || entityInstanceCollection.returnedDomainElement instanceof Domain2ElementFailed) {
      // return data;
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "EntityNotFound", // TODO: find corresponding queryFailure from data.status
          deploymentUuid,
          applicationSection,
          entityUuid: entityUuid,
        },
      };
    }
    // const entityInstanceUuidIndex = Object.fromEntries(
    //   entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i:any) => [i.uuid, i])
    // );
    return entityInstanceCollection.returnedDomainElement.instances;
  };

  // ##############################################################################################
  public getDomainStateExtractorRunnerMap(): AsyncBoxedExtractorOrQueryRunnerMap {
    return this.selectorMap;
  }
}



export function getDomainStateJzodSchemaExtractorRunnerMap(): QueryRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}

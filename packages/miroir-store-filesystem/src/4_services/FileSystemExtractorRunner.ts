import {
  ActionEntityInstanceCollectionReturnType,
  ActionReturnType,
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
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainState,
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
  async handleBoxedExtractorAction(runBoxedExtractorAction: RunBoxedExtractorAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleBoxedExtractorAction", "runBoxedExtractorAction", JSON.stringify(runBoxedExtractorAction, null, 2));
    let queryResult: DomainElement;
    queryResult = await this.selectorMap.extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList(
      {
        extractor: runBoxedExtractorAction.query,
        extractorRunnerMap: this.selectorMap,
      }
    );
    if (queryResult.elementType == "failure") {
      return {
        status: "error",
        error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult) },
      } as ActionReturnType;
    } else {
      const result: ActionReturnType = { status: "ok", returnedDomainElement: queryResult };
      log.info(this.logHeader, "handleBoxedExtractorAction", "runBoxedExtractorAction", runBoxedExtractorAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
  }

  // ################################################################################################
  async handleBoxedQueryAction(runBoxedQueryAction: RunBoxedQueryAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleBoxedQueryAction", "runBoxedQueryAction", JSON.stringify(runBoxedQueryAction, null, 2));
    let queryResult: DomainElement;
    queryResult = await this.selectorMap.runQuery(
      {
        extractor: runBoxedQueryAction.query,
        extractorRunnerMap: this.selectorMap,
      }
    );
    if (queryResult.elementType == "failure") {
      return {
        status: "error",
        error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult) },
      } as ActionReturnType;
    } else {
      const result: ActionReturnType = { status: "ok", returnedDomainElement: queryResult };
      log.info(this.logHeader, "handleBoxedQueryAction", "runBoxedQueryAction", runBoxedQueryAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
  }

  // ################################################################################################
  public extractEntityInstance: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObject,
    DomainElementEntityInstanceOrFailed
  > = async (
    selectorParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject>
  ): Promise<DomainElementEntityInstanceOrFailed> => {
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
          referenceObject.elementType == "failure"
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

        if (result.status == "error") {
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
        return {
          elementType: "instance",
          elementValue: result.returnedDomainElement.elementValue,
        };
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

        if (result.status == "error") {
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
        return {
          elementType: "instance",
          elementValue: result.returnedDomainElement.elementValue,
          // deploymentEntityState[index].entities[instanceDomainElement.elementValue],
        };
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
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    return this.extractEntityInstanceList(extractorRunnerParams).then((result) => {
      if (result.elementType == "failure") {
        return result;
      }
      const entityInstanceUuidIndex = Object.fromEntries(
        result.elementValue.map((i: any) => [i.uuid, i])
      );
      return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
    });
  }

  // ##############################################################################################
  public extractEntityInstanceList: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    DomainElementInstanceArrayOrFailed
  > = async (
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<DomainElementInstanceArrayOrFailed> => {
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
  
    const entityInstanceCollection: ActionEntityInstanceCollectionReturnType =
      await this.persistenceStoreController.getInstances(/*applicationSection, */ entityUuid);
  
    if (entityInstanceCollection.status == "error") {
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
    return { elementType: "instanceArray", elementValue: entityInstanceCollection.returnedDomainElement.elementValue.instances };
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

import {
  ActionEntityInstanceCollectionReturnType,
  ActionReturnType,
  ApplicationSection,
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  AsyncExtractorOrQueryRunner,
  AsyncExtractorOrQueryRunnerMap,
  AsyncExtractorOrQueryRunnerParams,
  asyncExtractWithExtractor,
  asyncRunQuery,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainState,
  QueryForExtractorOrCombinerReturningObject,
  QueryForExtractorOrCombinerReturningObjectList,
  ExtractorOrQueryPersistenceStoreRunner,
  QueryRunnerMapForJzodSchema,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  RunExtractorOrQueryAction,
  ExtractorOrCombinerReturningObject,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  transformer_InnerReference_resolve
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "FilesystemExtractorRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class FileSystemExtractorRunner implements ExtractorOrQueryPersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncExtractorOrQueryRunnerMap;

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
      extractWithExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // ############################################################################
      runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
    };
  }

  // ################################################################################################
  async handleQueryAction(runExtractorOrQueryAction: RunExtractorOrQueryAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryAction", "runQueryTemplateOrExtractorTemplateAction", JSON.stringify(runExtractorOrQueryAction, null, 2));
    let queryResult: DomainElement;
    switch (runExtractorOrQueryAction.query.queryType) {
      case "queryForExtractorOrCombinerReturningObject":
      case "queryForExtractorOrCombinerReturningObjectList": {
        queryResult = await this.selectorMap.extractWithExtractorOrCombinerReturningObjectOrObjectList(
          {
            extractor: runExtractorOrQueryAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      case "queryWithExtractorCombinerTransformer": {
        queryResult = await this.selectorMap.runQuery(
          {
            extractor: runExtractorOrQueryAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      default: {
        return {
          status: "error",
          error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(runExtractorOrQueryAction) },
        } as ActionReturnType;
        break;
      }
    }
    if (queryResult.elementType == "failure") {
      return {
        status: "error",
        error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult) },
      } as ActionReturnType;
    } else {
      const result: ActionReturnType = { status: "ok", returnedDomainElement: queryResult };
      log.info(this.logHeader, "handleQueryAction", "runQueryTemplateOrExtractorTemplateAction", runExtractorOrQueryAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
    // const result = { status: "ok", returnedDomainElement: { elementType: "object", elementValue: {}}} as ActionReturnType;

    // return result;
  }

  // ################################################################################################
  public extractEntityInstance: AsyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObject,
    DomainElementEntityInstanceOrFailed
  > = async (
    selectorParams: AsyncExtractorOrQueryRunnerParams<QueryForExtractorOrCombinerReturningObject>
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
  public extractEntityInstanceUuidIndex: AsyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorOrQueryRunnerParams<QueryForExtractorOrCombinerReturningObjectList>
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
  public extractEntityInstanceList: AsyncExtractorOrQueryRunner<
    QueryForExtractorOrCombinerReturningObjectList,
    DomainElementInstanceArrayOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorOrQueryRunnerParams<QueryForExtractorOrCombinerReturningObjectList>
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
  public getDomainStateExtractorRunnerMap(): AsyncExtractorOrQueryRunnerMap {
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

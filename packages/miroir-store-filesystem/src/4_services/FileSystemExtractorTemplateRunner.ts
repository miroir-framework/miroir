import {
  ActionEntityInstanceCollectionReturnType,
  ActionReturnType,
  ApplicationSection,
  asyncApplyExtractorTemplateTransformerInMemory,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractorTemplate,
  AsyncExtractorTemplateRunner,
  AsyncExtractorTemplateRunnerMap,
  AsyncExtractorTemplateRunnerParams,
  asyncExtractWithExtractorTemplate,
  asyncExtractWithManyExtractorTemplates,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainState,
  ExtractorTemplateForSingleObject,
  ExtractorTemplateForSingleObjectList,
  ExtractorTemplatePersistenceStoreRunner,
  ExtractorTemplateRunnerMapForJzodSchema,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreInstanceSectionAbstractInterface,
  QueryTemplateAction,
  QueryTemplateSelectObject,
  resolveContextReference,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  transformer_InnerReference_resolve
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "FilesystemExtractorRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class FileSystemExtractorTemplateRunner implements ExtractorTemplatePersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncExtractorTemplateRunnerMap;

  // ################################################################################################
  // constructor(private persistenceStoreController: PersistenceStoreControllerInterface) {
  // constructor(private persistenceStoreController: PersistenceStoreDataOrModelSectionInterface) {
  constructor(private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface) {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex,
      extractEntityInstance: this.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: asyncExtractEntityInstanceUuidIndexWithObjectListExtractorTemplate,
      extractWithManyExtractorTemplates: asyncExtractWithManyExtractorTemplates,
      extractWithExtractorTemplate: asyncExtractWithExtractorTemplate,
      applyExtractorTransformer: asyncApplyExtractorTemplateTransformerInMemory
    };
  }

  // ################################################################################################
  async handleQueryTemplateForServerONLY(queryTemplateAction: QueryTemplateAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader, "handleQueryTemplateForServerONLY", "queryTemplateAction", JSON.stringify(queryTemplateAction, null, 2));
    let queryResult: DomainElement;
    switch (queryTemplateAction.query.queryType) {
      case "extractorTemplateForDomainModelObjects": {
        queryResult = await this.selectorMap.extractWithExtractorTemplate(
          {
            extractorTemplate: queryTemplateAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      case "extractorTemplateForRecordOfExtractors": {
        queryResult = await this.selectorMap.extractWithManyExtractorTemplates(
          {
            extractorTemplate: queryTemplateAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      default: {
        return {
          status: "error",
          error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryTemplateAction) },
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
      log.info(this.logHeader, "handleQueryTemplateForServerONLY", "queryTemplateAction", queryTemplateAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
    // const result = { status: "ok", returnedDomainElement: { elementType: "object", elementValue: {}}} as ActionReturnType;

    // return result;
  }

  // ################################################################################################
  public extractEntityInstance: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObject,
    DomainElementEntityInstanceOrFailed
  > = async (
    selectorParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObject>
  ): Promise<DomainElementEntityInstanceOrFailed> => {
    const querySelectorParams: QueryTemplateSelectObject = selectorParams.extractorTemplate.select as QueryTemplateSelectObject;
    const deploymentUuid = selectorParams.extractorTemplate.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractorTemplate.select.applicationSection ??
      // ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
      ((selectorParams.extractorTemplate.pageParams?.applicationSection ??
        "data") as ApplicationSection);

    const entityUuidReferenceDomainElement = transformer_InnerReference_resolve(
      "build",
      querySelectorParams.parentUuid,
      selectorParams.extractorTemplate.queryParams,
      selectorParams.extractorTemplate.contextResults
    );
    // const entityUuidReference: DomainElement = resolveContextReference(
    //   querySelectorParams.parentUuid,
    //   selectorParams.extractorTemplate.queryParams,
    //   selectorParams.extractorTemplate.contextResults
    // );

    log.info(
      "extractEntityInstance params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReferenceDomainElement
    );

    // log.info("extractEntityInstance found entityUuidReference", JSON.stringify(entityUuidReference))
    // if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    if (entityUuidReferenceDomainElement.elementType == "failure") {
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "IncorrectParameters",
          failureMessage: "FileSystementityUuidReference is not a string or instanceUuid:" + JSON.stringify(entityUuidReferenceDomainElement),
          queryContext: JSON.stringify(selectorParams.extractorTemplate.contextResults),
          queryReference: JSON.stringify(querySelectorParams.parentUuid),
        },
      };
    }

    // const index = getDeploymentEntityStateIndex(
    //   deploymentUuid,
    //   applicationSection,
    //   entityUuidReference.elementValue
    // )

    switch (querySelectorParams?.queryType) {
      case "selectObjectByRelation": {
        const referenceObject = transformer_InnerReference_resolve(
          "build",
          querySelectorParams.objectReference,
          selectorParams.extractorTemplate.queryParams,
          selectorParams.extractorTemplate.contextResults
        );
        // const referenceObject = resolveContextReference(
        //   querySelectorParams.objectReference,
        //   selectorParams.extractorTemplate.queryParams,
        //   selectorParams.extractorTemplate.contextResults
        // );

        if (
          !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid ||
          referenceObject.elementType != "instance"
        ) {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "IncorrectParameters",
              queryParameters: JSON.stringify(selectorParams.extractorTemplate.pageParams),
              queryContext: JSON.stringify(selectorParams.extractorTemplate.contextResults),
            },
          };
        }

        const result = await this.persistenceStoreController.getInstance(
          // applicationSection,
          entityUuidReferenceDomainElement.elementValue,
          (referenceObject.elementValue as any)[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
        );

        if (result.status == "error") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "InstanceNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReferenceDomainElement.elementValue,
            },
          };
        }
        // log.info(
        //   "extractEntityInstance selectObjectByRelation, ############# reference",
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
          // deploymentEntityState[index].entities[
          //   (referenceObject.elementValue as any)[
          //     querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
          //   ]
          // ],
        };
        break;
      }
      case "selectObjectByDirectReference": {
        const instanceDomainElement = transformer_InnerReference_resolve(
          "build",
          querySelectorParams.instanceUuid,
          selectorParams.extractorTemplate.queryParams,
          selectorParams.extractorTemplate.contextResults
        );
        // const instanceDomainElement = resolveContextReference(
        //   querySelectorParams.instanceUuid,
        //   selectorParams.extractorTemplate.queryParams,
        //   selectorParams.extractorTemplate.contextResults
        // );
        // log.info("extractEntityInstance selectObjectByDirectReference found domainState", JSON.stringify(domainState))

        log.info(
          "extractEntityInstance found instanceUuid",
          JSON.stringify(instanceDomainElement)
        );

        // if (instanceUuid.elementType != "string" && instanceUuid.elementType != "instanceUuid") {
        if (instanceDomainElement.elementType == "instance") {
          return instanceDomainElement; /* QueryResults, elementType == "failure" */
        }
        if (instanceDomainElement.elementType != "string" && instanceDomainElement.elementType != "instanceUuid") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "EntityNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReferenceDomainElement.elementValue,
            },
          };
        }
        log.info("extractEntityInstance resolved instanceUuid =", instanceDomainElement);
        // if (!deploymentEntityState[index]) {
        //   return {
        //     elementType: "failure",
        //     elementValue: {
        //       queryFailure: "EntityNotFound",
        //       deploymentUuid,
        //       applicationSection,
        //       entityUuid: entityUuidReference.elementValue,
        //     },
        //   };
        // }
        // if (!deploymentEntityState[index].entities[instanceDomainElement.elementValue]) {
        //   return {
        //     elementType: "failure",
        //     elementValue: {
        //       queryFailure: "InstanceNotFound",
        //       deploymentUuid,
        //       applicationSection,
        //       entityUuid: entityUuidReference.elementValue,
        //       instanceUuid: instanceDomainElement.elementValue,
        //     },
        //   };
        // }
        const result = await this.persistenceStoreController.getInstance(
          // applicationSection,
          entityUuidReferenceDomainElement.elementValue,
          instanceDomainElement.elementValue
        );

        if (result.status == "error") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "InstanceNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReferenceDomainElement.elementValue,
              instanceUuid: instanceDomainElement.elementValue,
            },
          };
        }
        log.info(
          "extractEntityInstance selectObjectByDirectReference, ############# reference",
          querySelectorParams,
          "entityUuidReference",
          entityUuidReferenceDomainElement,
          "######### context entityUuid",
          entityUuidReferenceDomainElement,
          "######### queryParams",
          JSON.stringify(selectorParams.extractorTemplate.queryParams, undefined, 2),
          "######### contextResults",
          JSON.stringify(selectorParams.extractorTemplate.contextResults, undefined, 2),
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
          "extractEntityInstance can not handle QueryTemplateSelectObject query with queryType=" +
            selectorParams.extractorTemplate.select.queryType
        );
        break;
      }
    }
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndex: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    const deploymentUuid = extractorRunnerParams.extractorTemplate.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractorTemplate.select.applicationSection ?? "data";

    const entityUuidDomainElement = transformer_InnerReference_resolve(
      "build",
      extractorRunnerParams.extractorTemplate.select.parentUuid,
      extractorRunnerParams.extractorTemplate.queryParams,
      extractorRunnerParams.extractorTemplate.contextResults
    );
    // const entityUuid: DomainElement = resolveContextReference(
    //   extractorRunnerParams.extractorTemplate.select.parentUuid,
    //   extractorRunnerParams.extractorTemplate.queryParams,
    //   extractorRunnerParams.extractorTemplate.contextResults
    // );

    // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate domainState", domainState);

    if (!deploymentUuid || !applicationSection || !entityUuidDomainElement) {
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

    switch (entityUuidDomainElement.elementType) {
      case "string":
      case "instanceUuid": {
        const entityInstanceCollection: ActionEntityInstanceCollectionReturnType =
          await this.persistenceStoreController.getInstances(/*applicationSection, */ entityUuidDomainElement.elementValue);

        if (entityInstanceCollection.status == "error") {
          // return data;
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "EntityNotFound", // TODO: find corresponding queryFailure from data.status
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidDomainElement.elementValue,
            },
          };
        }
        const entityInstanceUuidIndex = Object.fromEntries(
          entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i:any) => [i.uuid, i])
        );
        return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
        break;
      }
      case "object":
      case "instance":
      case "instanceUuidIndex":
      case "instanceUuidIndexUuidIndex":
      case "array": {
        return {
          elementType: "failure",
          elementValue: {
            queryFailure: "IncorrectParameters",
            queryReference: JSON.stringify(extractorRunnerParams.extractorTemplate.select.parentUuid),
          },
        };
      }
      case "failure": {
        return entityUuidDomainElement;
        break;
      }
      default: {
        throw new Error(
          "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference entityUuid=" + entityUuidDomainElement
        );
        break;
      }
    }
  };

  public getSelectorMap(): AsyncExtractorTemplateRunnerMap {
    return this.selectorMap;
  }
}

export function getJzodSchemaSelectorMap(): ExtractorTemplateRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNewForTemplate,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  };
}

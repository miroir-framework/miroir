import {
  ActionEntityInstanceCollectionReturnType,
  ActionReturnType,
  ApplicationSection,
  asyncApplyExtractorTemplateTransformerInMemory,
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
  ExtractorRunnerMapForJzodSchema,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  ExtractorTemplatePersistenceStoreRunner,
  PersistenceStoreInstanceSectionAbstractInterface,
  QueryTemplateAction,
  QueryTemplateSelectObject,
  resolveContextReference,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  ExtractorPersistenceStoreRunner,
  AsyncExtractorRunnerMap,
  AsyncExtractorRunner,
  ExtractorForSingleObjectList,
  AsyncExtractorRunnerParams,
  ExtractorForSingleObject,
  QuerySelectObject,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithManyExtractors,
  asyncExtractWithExtractor,
  asyncApplyExtractorTransformerInMemory,
  QueryAction
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "FilesystemExtractorRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class FileSystemExtractorRunner implements ExtractorPersistenceStoreRunner {
  private logHeader: string;
  private selectorMap: AsyncExtractorRunnerMap;

  // ################################################################################################
  // constructor(private persistenceStoreController: PersistenceStoreControllerInterface) {
  // constructor(private persistenceStoreController: PersistenceStoreDataOrModelSectionInterface) {
  constructor(private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface) {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex,
      extractEntityInstance: this.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractorInMemory: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory
    };
  }

  // ################################################################################################
  async handleQuery(queryAction: QueryAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader, "handleQueryTemplate", "queryTemplateAction", JSON.stringify(queryAction, null, 2));
    let queryResult: DomainElement;
    switch (queryAction.query.queryType) {
      case "extractorForDomainModelObjects": {
        queryResult = await this.selectorMap.extractWithExtractor(
          {
            extractor: queryAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      case "extractorForRecordOfExtractors": {
        queryResult = await this.selectorMap.extractWithManyExtractors(
          {
            extractor: queryAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      default: {
        return {
          status: "error",
          error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryAction) },
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
      log.info(this.logHeader, "handleQueryTemplate", "queryTemplateAction", queryAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
    // const result = { status: "ok", returnedDomainElement: { elementType: "object", elementValue: {}}} as ActionReturnType;

    // return result;
  }

  // /**
  //  * Needed because filesystem does not support joins, DomainState is extracted then selectors are applied
  //  *
  //  * @param extractor
  //  * @returns
  //  */
  // private async extractDomainStateForExtractor(
  //   extractor: ExtractorTemplateForDomainModel,
  // ): Promise<DomainState> {
  //   switch (extractor.queryType) {
  //     case "extractorTemplateForDomainModelObjects": {
  //       switch (extractor.select.queryType) {
  //         case "queryTemplateExtractObjectListByEntity": {
  //           const entityUuid = extractor.select.parentUuid;
  //           const entityInstanceUuidIndex = await this.dataStoreSection.getInstances(entityUuid);
  //           return {
  //             [extractor.deploymentUuid]: {
  //               data: {
  //                 [entityUuid]: entityInstanceUuidIndex,
  //               },
  //               model: {},
  //             },
  //           };
  //           break;
  //         }
  //         case "selectObjectByRelation":
  //         case "selectObjectByDirectReference":
  //         case "selectObjectListByRelation":
  //         case "selectObjectListByManyToManyRelation":
  //         case "queryCombiner":
  //         case "literal":
  //         case "queryContextReference":
  //         case "wrapperReturningObject":
  //         case "wrapperReturningList":

  //           break;

  //         default:
  //           break;
  //       }
  //       return {
  //         [""]: {
  //           data: {},
  //           model: {},
  //         },
  //       };
  //       break;
  //     }
  //     case "extractorTemplateForRecordOfExtractors":
  //     case "getEntityDefinition":
  //     case "getFetchParamsJzodSchema":
  //     case "getSingleSelectQueryJzodSchema": {
  //       return {
  //         [""]: {
  //           data: {},
  //           model: {},
  //         },
  //       };
  //       break;
  //     }
  //     case "localCacheEntityInstancesExtractor":
  //     default: {
  //       return {
  //         [""]: {
  //           data: {},
  //           model: {},
  //         },
  //       };
  //       break;
  //     }
  //   }
  // }

  // ################################################################################################
  public extractEntityInstance: AsyncExtractorRunner<
    ExtractorForSingleObject,
    DomainElementEntityInstanceOrFailed
  > = async (
    selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObject>
  ): Promise<DomainElementEntityInstanceOrFailed> => {
    const querySelectorParams: QuerySelectObject = selectorParams.extractor.select as QuerySelectObject;
    const deploymentUuid = selectorParams.extractor.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractor.select.applicationSection ??
      // ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
      ((selectorParams.extractor.pageParams?.applicationSection ??
        "data") as ApplicationSection);

    const entityUuidReference: string = querySelectorParams.parentUuid;
    // const entityUuidReference: DomainElement = resolveContextReference(
    //   querySelectorParams.parentUuid,
    //   selectorParams.extractor.queryParams,
    //   selectorParams.extractor.contextResults
    // );

    log.info(
      "extractEntityInstance params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReference
    );

    // log.info("extractEntityInstance found entityUuidReference", JSON.stringify(entityUuidReference))
    // if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
    // if (entityUuidReference.elementType == "failure") {
    //   return {
    //     elementType: "failure",
    //     elementValue: {
    //       queryFailure: "IncorrectParameters",
    //       failureMessage: "FileSystementityUuidReference is not a string or instanceUuid:" + JSON.stringify(entityUuidReference),
    //       queryContext: JSON.stringify(selectorParams.extractor.contextResults),
    //       queryReference: JSON.stringify(querySelectorParams.parentUuid),
    //     },
    //   };
    // }

    // const index = getDeploymentEntityStateIndex(
    //   deploymentUuid,
    //   applicationSection,
    //   entityUuidReference.elementValue
    // )

    switch (querySelectorParams?.queryType) {
      case "selectObjectByRelation": {
        // const referenceObject = querySelectorParams.objectReference;
        const referenceObject = resolveContextReference(
          { queryTemplateType: "queryContextReference", referenceName: querySelectorParams.objectReference},
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
              failureOrigin: ["FileSystemExtractorRunner", "selectObjectByRelation"],
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
        const instanceDomainElement = querySelectorParams.instanceUuid;
        // const instanceDomainElement = resolveContextReference(
        //   {querySelectorParams.instanceUuid},
        //   selectorParams.extractor.queryParams,
        //   selectorParams.extractor.contextResults
        // );
        // log.info("extractEntityInstance selectObjectByDirectReference found domainState", JSON.stringify(domainState))

        log.info(
          "extractEntityInstance found instanceUuid",
          JSON.stringify(instanceDomainElement)
        );

        // if (instanceDomainElement.elementType == "instance") {
        //   return instanceDomainElement; /* QueryResults, elementType == "failure" */
        // }
        // if (instanceDomainElement.elementType != "string" && instanceDomainElement.elementType != "instanceUuid") {
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
          "extractEntityInstance selectObjectByDirectReference, ############# reference",
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
          "extractEntityInstance can not handle QueryTemplateSelectObject query with queryType=" +
            selectorParams.extractor.select.queryType
        );
        break;
      }
    }
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";
    const entityUuid = extractorRunnerParams.extractor.select.parentUuid
    // const entityUuid: DomainElement = resolveContextReference(
    //   extractorRunnerParams.extractor.select.parentUuid,
    //   extractorRunnerParams.extractor.queryParams,
    //   extractorRunnerParams.extractor.contextResults
    // );

    // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate domainState", domainState);

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

    // switch (entityUuid.elementType) {
    //   case "string":
    //   case "instanceUuid": {
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
        const entityInstanceUuidIndex = Object.fromEntries(
          entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i:any) => [i.uuid, i])
        );
        return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
    //     break;
    //   }
    //   case "object":
    //   case "instance":
    //   case "instanceUuidIndex":
    //   case "instanceUuidIndexUuidIndex":
    //   case "array": {
    //     return {
    //       elementType: "failure",
    //       elementValue: {
    //         queryFailure: "IncorrectParameters",
    //         queryReference: JSON.stringify(extractorRunnerParams.extractor.select.parentUuid),
    //       },
    //     };
    //   }
    //   case "failure": {
    //     return entityUuid;
    //     break;
    //   }
    //   default: {
    //     throw new Error(
    //       "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference entityUuid=" + entityUuid
    //     );
    //     break;
    //   }
    // }
  };

  public getSelectorMap(): AsyncExtractorRunnerMap {
    return this.selectorMap;
  }
}

export function getJzodSchemaSelectorMap(): ExtractorRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}

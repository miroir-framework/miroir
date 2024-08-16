import {
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreModelSectionInterface,
  PersistenceStoreDataSectionInterface,
  ActionReturnType,
  ApplicationSection,
  QueryAction,
  SyncExtractorRunner,
  SyncExtractorRunnerParams,
  DomainElement,
  DomainElementInstanceUuidIndexOrFailed,
  DomainState,
  ExtractorForSingleObjectList,
  SyncExtractorRunnerMap,
  ExtractorRunnerMapForJzodSchema,
  extractWithManyExtractorsFromDomainState,
  selectEntityInstanceFromObjectQueryAndDomainState,
  exractEntityInstanceListFromListQueryAndDomainState,
  selectEntityInstanceUuidIndexFromDomainState,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  DomainModelExtractor,
  AsyncExtractorRunner,
  resolveContextReference,
  ActionEntityInstanceCollectionReturnType,
  PersistenceStoreControllerInterface,
  DomainElementEntityInstanceOrFailed,
  ExtractorForSingleObject,
  QuerySelectObject,
  AsyncExtractorRunnerMap,
  extractWithExtractor,
  PersistenceStoreExtractorRunner,
  getSelectorParams,
  AsyncExtractorRunnerParams,
  ExtractorForRecordOfExtractors,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithManyExtractors,
  asyncExtractWithExtractor,
  PersistenceStoreInstanceSectionAbstractInterface,
  PersistenceStoreAbstractInterface,
  PersistenceStoreDataOrModelSectionInterface,
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "FilesystemExtractorRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export class FileSystemExtractorRunner implements PersistenceStoreExtractorRunner {
  private logHeader: string;
  private selectorMap: AsyncExtractorRunnerMap<any>;

  // ################################################################################################
  // constructor(private persistenceStoreController: PersistenceStoreControllerInterface) {
  // constructor(private persistenceStoreController: PersistenceStoreDataOrModelSectionInterface) {
  constructor(private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface) {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    this.selectorMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex,
      extractEntityInstance: this.extractEntityInstance,
      extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
    };
  }

  // ################################################################################################
  async handleQuery(queryAction: QueryAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader, "handleQuery", "queryAction", JSON.stringify(queryAction, null, 2));
    let queryResult: DomainElement;
    switch (queryAction.query.queryType) {
      case "domainModelSingleExtractor": {
        queryResult = await this.selectorMap.extractWithExtractor(
          undefined /* domainState*/,
          // getSelectorParams(queryAction.query)
          {
            extractor: queryAction.query,
            extractorRunnerMap: this.selectorMap,
          }
        );
        break;
      }
      case "extractorForRecordOfExtractors": {
        queryResult = await this.selectorMap.extractWithManyExtractors(
          undefined /* domainState*/,
          // getSelectorParams(queryAction.query)
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
      log.info(this.logHeader, "handleQuery", "queryAction", queryAction, "result", JSON.stringify(result, null, 2));
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
  //   extractor: DomainModelExtractor,
  // ): Promise<DomainState> {
  //   switch (extractor.queryType) {
  //     case "domainModelSingleExtractor": {
  //       switch (extractor.select.queryType) {
  //         case "extractObjectListByEntity": {
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
  //     case "extractorForRecordOfExtractors":
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
    any,
    DomainElementEntityInstanceOrFailed
  > = async (
    deploymentEntityState: any,
    selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObject, any>
  ): Promise<DomainElementEntityInstanceOrFailed> => {
    const querySelectorParams: QuerySelectObject = selectorParams.extractor.select as QuerySelectObject;
    const deploymentUuid = selectorParams.extractor.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractor.select.applicationSection ??
      ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
        "data") as ApplicationSection);

    const entityUuidReference: DomainElement = resolveContextReference(
      querySelectorParams.parentUuid,
      selectorParams.extractor.queryParams,
      selectorParams.extractor.contextResults
    );

    log.info(
      "selectEntityInstanceFromDeploymentEntityState params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReference
    );

    // log.info("selectEntityInstanceFromDeploymentEntityState found entityUuidReference", JSON.stringify(entityUuidReference))
    if (entityUuidReference.elementType != "string" && entityUuidReference.elementType != "instanceUuid") {
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "IncorrectParameters",
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
        const referenceObject = resolveContextReference(
          querySelectorParams.objectReference,
          selectorParams.extractor.queryParams,
          selectorParams.extractor.contextResults
        );

        if (
          !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid ||
          referenceObject.elementType != "instance"
        ) {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "IncorrectParameters",
              queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
              queryContext: JSON.stringify(selectorParams.extractor.contextResults),
            },
          };
        }

        const result = await this.persistenceStoreController.getInstance(
          // applicationSection,
          entityUuidReference.elementValue,
          (referenceObject.elementValue as any)[querySelectorParams.AttributeOfObjectToCompareToReferenceUuid]
        );

        if (result.status == "error") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "InstanceNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReference.elementValue,
            },
          };
        }
        // log.info(
        //   "selectEntityInstanceFromDeploymentEntityState selectObjectByRelation, ############# reference",
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
        const instanceDomainElement = resolveContextReference(
          querySelectorParams.instanceUuid,
          selectorParams.extractor.queryParams,
          selectorParams.extractor.contextResults
        );
        // log.info("selectEntityInstanceFromDeploymentEntityState selectObjectByDirectReference found domainState", JSON.stringify(domainState))

        log.info(
          "selectEntityInstanceFromDeploymentEntityState found instanceUuid",
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
              entityUuid: entityUuidReference.elementValue,
            },
          };
        }
        log.info("selectEntityInstanceFromDeploymentEntityState resolved instanceUuid =", instanceDomainElement);
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
          entityUuidReference.elementValue,
          instanceDomainElement.elementValue
        );

        if (result.status == "error") {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "InstanceNotFound",
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuidReference.elementValue,
              instanceUuid: instanceDomainElement.elementValue,
            },
          };
        }
        log.info(
          "selectEntityInstanceFromDeploymentEntityState selectObjectByDirectReference, ############# reference",
          querySelectorParams,
          "entityUuidReference",
          entityUuidReference,
          "######### context entityUuid",
          entityUuidReference,
          "######### queryParams",
          JSON.stringify(selectorParams.extractor.queryParams, undefined, 2),
          "######### contextResults",
          JSON.stringify(selectorParams.extractor.contextResults, undefined, 2),
          "domainState",
          deploymentEntityState
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
          "selectEntityInstanceFromDeploymentEntityState can not handle QuerySelectObject query with queryType=" +
            selectorParams.extractor.select.queryType
        );
        break;
      }
    }
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndex: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    any,
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    domainState: any,
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList, any>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid: DomainElement = resolveContextReference(
      extractorRunnerParams.extractor.select.parentUuid,
      extractorRunnerParams.extractor.queryParams,
      extractorRunnerParams.extractor.contextResults
    );

    // log.info("selectEntityInstanceUuidIndexFromDomainState params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("selectEntityInstanceUuidIndexFromDomainState domainState", domainState);

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

    switch (entityUuid.elementType) {
      case "string":
      case "instanceUuid": {
        const entityInstanceCollection: ActionEntityInstanceCollectionReturnType =
          await this.persistenceStoreController.getInstances(/*applicationSection, */ entityUuid.elementValue);

        if (entityInstanceCollection.status == "error") {
          // return data;
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "EntityNotFound", // TODO: find corresponding queryFailure from data.status
              deploymentUuid,
              applicationSection,
              entityUuid: entityUuid.elementValue,
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
            queryReference: JSON.stringify(extractorRunnerParams.extractor.select.parentUuid),
          },
        };
      }
      case "failure": {
        return entityUuid;
        break;
      }
      default: {
        throw new Error(
          "selectEntityInstanceUuidIndexFromDomainState could not handle reference entityUuid=" + entityUuid
        );
        break;
      }
    }
  };

  public getSelectorMap(): AsyncExtractorRunnerMap<any> {
    return this.selectorMap;
    // return {
    //   extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex,
    //   extractEntityInstance: this.extractEntityInstance,
    //   extractEntityInstanceUuidIndexWithObjectListExtractor: async (...args) => exractEntityInstanceListFromListQueryAndDomainState(...args),
    //   extractWithManyExtractors: async (...args) => extractWithManyExtractorsFromDomainState(...args),
    //   extractWithExtractor: async (...args) => extractWithExtractor(...args),
    // };
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

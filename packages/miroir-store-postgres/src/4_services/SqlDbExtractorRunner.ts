import { getLoggerName, LoggerInterface, MiroirLoggerFactory, PersistenceStoreAdminSectionInterface, PersistenceStoreModelSectionInterface, PersistenceStoreDataSectionInterface, ActionReturnType, ApplicationSection, QueryAction, SyncExtractorRunner, SyncExtractorRunnerParams, DomainElement, DomainElementInstanceUuidIndexOrFailed, DomainState, ExtractorForSingleObjectList, SyncExtractorRunnerMap, ExtractorRunnerMapForJzodSchema, extractWithManyExtractorsFromDomainState, selectEntityInstanceFromObjectQueryAndDomainState, exractEntityInstanceListFromListQueryAndDomainState, selectEntityInstanceUuidIndexFromDomainState, selectEntityJzodSchemaFromDomainStateNew, selectFetchQueryJzodSchemaFromDomainStateNew, selectJzodSchemaByDomainModelQueryFromDomainStateNew, selectJzodSchemaBySingleSelectQueryFromDomainStateNew, DomainModelExtractor, AsyncExtractorRunner, resolveContextReference, ActionEntityInstanceCollectionReturnType, PersistenceStoreControllerInterface, DomainElementEntityInstanceOrFailed, ExtractorForSingleObject, QuerySelectObject, AsyncExtractorRunnerMap, extractWithExtractor, AsyncExtractorRunnerParams, asyncExtractEntityInstanceUuidIndexWithObjectListExtractor, asyncExtractWithManyExtractors, asyncExtractWithExtractor, PersistenceStoreInstanceSectionAbstractInterface } from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { SqlDbDataStoreSection } from "./SqlDbDataStoreSection.js";
import { SqlDbModelStoreSection } from "./SqlDbModelStoreSection.js";
import { MixedSqlDbInstanceStoreSection } from "./sqlDbInstanceStoreSectionMixin.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"PostgresExtractorRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export class SqlDbExtractRunner {
  private logHeader: string;
  private extractorRunnerMap: AsyncExtractorRunnerMap<any>;

  constructor(
    // private persistenceStoreController: PersistenceStoreControllerInterface
    // private persistenceStoreController: PersistenceStoreInstanceSectionAbstractInterface
    private persistenceStoreController: SqlDbDataStoreSection | SqlDbModelStoreSection /* concrete types for MixedSqlDbInstanceStoreSection */
    // private persistenceStoreController: typeof MixedSqlDbInstanceStoreSection
  ){
    this.logHeader = 'PersistenceStoreController '+ persistenceStoreController.getStoreName();
    this.extractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex,
      extractEntityInstance: this.extractEntityInstance,
      // extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractEntityInstanceUuidIndexWithObjectListExtractor: this.asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
    };

  }

  // ################################################################################################
/**
 * returns an Entity Instance List, from a ListQuery
 * @param deploymentEntityState 
 * @param selectorParams 
 * @returns 
 */
  private asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor
= <StateType>(
  state: StateType,
  selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList, StateType>
): Promise<DomainElementInstanceUuidIndexOrFailed> => {
  // (
  //   state: any,
  //   selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList, any>
  // ): Promise<DomainElementInstanceUuidIndexOrFailed> {
  let result: Promise<DomainElementInstanceUuidIndexOrFailed>;
  switch (selectorParams.extractor.select.queryType) {
    case "extractObjectListByEntity": {
      return this.extractEntityInstanceUuidIndexWithFilter(state, selectorParams)
    }
    case "selectObjectListByRelation":
    case "selectObjectListByManyToManyRelation": {
      return this.extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractor(state, {
        extractorRunnerMap: this.extractorRunnerMap,
        extractor: {
          queryType: "domainModelSingleExtractor",
          deploymentUuid: selectorParams.extractor.deploymentUuid,
          contextResults: selectorParams.extractor.contextResults,
          pageParams: selectorParams.extractor.pageParams,
          queryParams: selectorParams.extractor.queryParams,
          select: selectorParams.extractor.select.applicationSection
          ? selectorParams.extractor.select
          : {
              ...selectorParams.extractor.select,
              applicationSection: selectorParams.extractor.pageParams.elementValue.applicationSection.elementValue as ApplicationSection,
            },
        },
      });
      break;
    }
    default: {
      return Promise.resolve({
        elementType: "failure",
        elementValue: {
          queryFailure: "IncorrectParameters",
          queryParameters: JSON.stringify(selectorParams),
        },
      });
      break;
    }
  }
  // const result: Promise<DomainElementInstanceUuidIndexOrFailed> =
  //   (selectorParams?.extractorRunnerMap ?? emptyAsyncSelectorMap).extractEntityInstanceUuidIndex(deploymentEntityState, selectorParams)
  //   .then((selectedInstancesUuidIndex: DomainElementInstanceUuidIndexOrFailed) => {
  //     log.info(
  //       "extractEntityInstanceUuidIndexWithObjectListExtractor found selectedInstances", selectedInstancesUuidIndex
  //     );

  //     return applyExtractorForSingleObjectListToSelectedInstancesUuidIndex(
  //       selectedInstancesUuidIndex,
  //       selectorParams.extractor,
  //     );
  //   });
  // ;

  // return result;
};

  // ##############################################################################################
  async handleQuery(queryAction: QueryAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQuery", "queryAction", JSON.stringify(queryAction, null, 2));
    let queryResult: DomainElement;
    switch (queryAction.query.queryType) {
      case "domainModelSingleExtractor": {
        queryResult = await this.extractorRunnerMap.extractWithExtractor(
          undefined /* domainState*/,
          {
            extractor: queryAction.query,
            extractorRunnerMap: this.extractorRunnerMap,
          }
        );
        break;
      }
      case "extractorForRecordOfExtractors": {
        queryResult = await this.extractorRunnerMap.extractWithManyExtractors(
          undefined /* domainState*/,
          {
            extractor: queryAction.query,
            extractorRunnerMap: this.extractorRunnerMap,
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
  }

  // ##############################################################################################
  public extractEntityInstance:AsyncExtractorRunner<
    ExtractorForSingleObject, any, DomainElementEntityInstanceOrFailed
  > = async (
    deploymentEntityState: any,
    selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObject, any>
  ): Promise<DomainElementEntityInstanceOrFailed> => {
    const querySelectorParams: QuerySelectObject = selectorParams.extractor.select as QuerySelectObject;
    const deploymentUuid = selectorParams.extractor.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractor.select.applicationSection ??
      ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ?? "data") as ApplicationSection);

    const entityUuidReference: DomainElement = resolveContextReference(
      querySelectorParams.parentUuid,
      selectorParams.extractor.queryParams,
      selectorParams.extractor.contextResults
    );

    log.info("selectEntityInstanceFromDeploymentEntityState params", querySelectorParams, deploymentUuid, applicationSection, entityUuidReference);

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
          (referenceObject.elementValue as any)[
            querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
          ]
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

        log.info("selectEntityInstanceFromDeploymentEntityState found instanceUuid", JSON.stringify(instanceDomainElement))

        // if (instanceUuid.elementType != "string" && instanceUuid.elementType != "instanceUuid") {
        if (instanceDomainElement.elementType == "instance") {
          return instanceDomainElement /* QueryResults, elementType == "failure" */
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
        log.info("selectEntityInstanceFromDeploymentEntityState selectObjectByDirectReference, ############# reference",
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
    ExtractorForSingleObjectList, any, DomainElementInstanceUuidIndexOrFailed
  > = async (
    domainState: any,
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList, any>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection??"data";

    const entityUuid: DomainElement = resolveContextReference(
      extractorRunnerParams.extractor.select.parentUuid,
      extractorRunnerParams.extractor.queryParams,
      extractorRunnerParams.extractor.contextResults
    );

    // log.info("selectEntityInstanceUuidIndexFromDomainState params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("selectEntityInstanceUuidIndexFromDomainState domainState", domainState);

    if (!deploymentUuid || !applicationSection || !entityUuid) {
      return { // new object
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
        const entityInstanceCollection: ActionEntityInstanceCollectionReturnType = await this.persistenceStoreController.getInstances(
          // applicationSection,
          entityUuid.elementValue
        );

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
        const entityInstanceUuidIndex = Object.fromEntries(entityInstanceCollection.returnedDomainElement.elementValue.instances.map(i => [i.uuid, i]));
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
        throw new Error("selectEntityInstanceUuidIndexFromDomainState could not handle reference entityUuid=" + entityUuid);
        break;
      }
    }
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndexWithFilter: AsyncExtractorRunner<
    ExtractorForSingleObjectList, any, DomainElementInstanceUuidIndexOrFailed
  > = async (
    domainState: any,
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList, any>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection??"data";

    const entityUuid: DomainElement = resolveContextReference(
      extractorRunnerParams.extractor.select.parentUuid,
      extractorRunnerParams.extractor.queryParams,
      extractorRunnerParams.extractor.contextResults
    );

    // log.info("selectEntityInstanceUuidIndexFromDomainState params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("selectEntityInstanceUuidIndexFromDomainState domainState", domainState);

    if (!deploymentUuid || !applicationSection || !entityUuid) {
      return { // new object
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
        let entityInstanceCollection: ActionEntityInstanceCollectionReturnType;
        if (extractorRunnerParams.extractor.select.queryType == "extractObjectListByEntity" && extractorRunnerParams.extractor.select.filter) {
          // TODO: resolve filter value
          // const resolvedFilterValue: DomainElement = resolveContextReference(
          //   extractorRunnerParams.extractor.select.parentUuid,
          //   extractorRunnerParams.extractor.queryParams,
          //   extractorRunnerParams.extractor.contextResults
          // );
          // log.info("selectEntityInstanceUuidIndexFromDomainState resolvedFilterValue", resolvedFilterValue);
          // if (resolvedFilterValue.elementType != "string") {
          //   return {
          //     elementType: "failure",
          //     elementValue: {
          //       queryFailure: "IncorrectParameters",
          //       queryParameters: JSON.stringify(extractorRunnerParams),
          //     },
          //   };
          // }
          if (extractorRunnerParams.extractor.select.filter.value.queryTemplateType != "constantString") {
            return {
              elementType: "failure",
              elementValue: {
                queryFailure: "IncorrectParameters",
                queryParameters: JSON.stringify(extractorRunnerParams),
              },
            };
          }
          entityInstanceCollection = await this.persistenceStoreController.getInstancesWithFilter(
            // applicationSection,
            entityUuid.elementValue,
            {
              attribute: extractorRunnerParams.extractor.select.filter.attributeName,
              value: extractorRunnerParams.extractor.select.filter.value.definition,
            }
          );
          // if (entityInstanceCollection.status == "error") {
          //   return {
          //     elementType: "failure",
          //     elementValue: {
          //       queryFailure: "EntityNotFound",
          //       deploymentUuid,
          //       applicationSection,
          //       entityUuid: entityUuid.elementValue,
          //     },
          //   };
          // }
          // const entityInstanceUuidIndex = Object.fromEntries(entityInstanceCollection.returnedDomainElement.elementValue.instances.map(i => [i.uuid, i]));
          // return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
        } else {
          entityInstanceCollection = await this.persistenceStoreController.getInstances(
            // applicationSection,
            entityUuid.elementValue
          );
        }

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
        const entityInstanceUuidIndex = Object.fromEntries(entityInstanceCollection.returnedDomainElement.elementValue.instances.map(i => [i.uuid, i]));
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
        throw new Error("selectEntityInstanceUuidIndexFromDomainState could not handle reference entityUuid=" + entityUuid);
        break;
      }
    }
  };

  // ##############################################################################################
  public getSelectorMap(): AsyncExtractorRunnerMap<any> {
    return this.extractorRunnerMap;
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

import { getLoggerName, LoggerInterface, MiroirLoggerFactory, AdminStoreInterface, StoreModelSectionInterface, StoreDataSectionInterface, ActionReturnType, ApplicationSection, QueryAction, ExtractorRunner, ExtractorRunnerParams, DomainElement, DomainElementInstanceUuidIndexOrFailed, DomainState, ExtractorForSingleObjectList, ExtractorRunnerMap, ExtractorRunnerMapForJzodSchema, extractWithManyExtractorsFromDomainState, selectEntityInstanceFromObjectQueryAndDomainState, selectEntityInstanceListFromListQueryAndDomainState, selectEntityInstanceUuidIndexFromDomainState, selectEntityJzodSchemaFromDomainStateNew, selectFetchQueryJzodSchemaFromDomainStateNew, selectJzodSchemaByDomainModelQueryFromDomainStateNew, selectJzodSchemaBySingleSelectQueryFromDomainStateNew, DomainModelExtractor, AsyncExtractorRunner, resolveContextReference, ActionEntityInstanceCollectionReturnType, PersistenceStoreControllerInterface, DomainElementEntityInstanceOrFailed, ExtractorForSingleObject, QuerySelectObject, AsyncExtractorRunnerMap, extractWithExtractor } from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"IndexedDbExtractorRunner");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export class IndexedDbExtractorRunner {
  private logHeader: string;

  constructor(
    private persistenceStoreController: PersistenceStoreControllerInterface
  ){
    this.logHeader = 'PersistenceStoreController '+ persistenceStoreController.getStoreName();
  }

  async handleQuery(section: ApplicationSection, query: QueryAction): Promise<ActionReturnType> {
    // TODO: fix applicationSection!!!
    log.info(this.logHeader,'handleQuery','section',section,'query',query);
    // log.info(this.logHeader,'this.dataStoreSection',this.dataStoreSection);
    // log.info(this.logHeader,'this.modelStoreSection',this.modelStoreSection);
    
    // const currentStore: StoreDataSectionInterface | StoreModelSectionInterface =
    //   section == "data" ? this.dataStoreSection : this.modelStoreSection;
    const result = { status: "ok", returnedDomainElement: { elementType: "object", elementValue: {}}} as ActionReturnType;
    // const result: ActionReturnType = await currentStore.handleQuery(query);
    const queryResult: DomainElement = extractWithManyExtractorsFromI(
      domainState,
      getSelectorParams(queryAction.query)
    );

    log.info(this.logHeader,'handleQuery','section',section,'query',query, "result", result);
    return result;
  }

  // /**
  //  * Needed because IndexedDb does not support joins, DomainState is extracted then selectors are applied
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

  public selectEntityInstanceFromIndexedDb:AsyncExtractorRunner<
    ExtractorForSingleObject, any, DomainElementEntityInstanceOrFailed
  > = async (
    deploymentEntityState: any,
    selectorParams: ExtractorRunnerParams<ExtractorForSingleObject, any>
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
          applicationSection,
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
          applicationSection,
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
  public selectEntityInstanceUuidIndexFromIndexedDb: AsyncExtractorRunner<
    ExtractorForSingleObjectList, any, DomainElementInstanceUuidIndexOrFailed
  > = async (
    domainState: any,
    extractorRunnerParams: ExtractorRunnerParams<ExtractorForSingleObjectList, any>
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
          applicationSection,
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

  public getSelectorMap(): AsyncExtractorRunnerMap<any> {
    return {
      extractEntityInstanceUuidIndex: this.selectEntityInstanceUuidIndexFromIndexedDb,
      extractEntityInstance: this.selectEntityInstanceFromIndexedDb,
      extractEntityInstanceUuidIndexWithObjectListExtractor: async (...args) => selectEntityInstanceListFromListQueryAndDomainState(...args),
      extractWithManyExtractors: async (...args) => extractWithManyExtractorsFromDomainState(...args),
      extractWithExtractor: async (...args) => extractWithExtractor(...args),
    };
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

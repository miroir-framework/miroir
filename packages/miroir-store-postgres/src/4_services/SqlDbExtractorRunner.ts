import {
  ActionEntityInstanceCollectionReturnType,
  ActionReturnType,
  ApplicationSection,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  AsyncExtractorRunner,
  AsyncExtractorRunnerMap,
  AsyncExtractorRunnerParams,
  asyncExtractWithExtractor,
  asyncExtractWithManyExtractors,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainState,
  ExtractorForRecordOfExtractors,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  ExtractorRunnerMapForJzodSchema,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  QueryAction,
  QueryExtractorRuntimeTransformer,
  QuerySelectObject,
  resolveContextReference,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
} from "miroir-core";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";
import { SqlDbDataStoreSection } from "./SqlDbDataStoreSection.js";
import { SqlDbModelStoreSection } from "./SqlDbModelStoreSection.js";

const loggerName: string = getLoggerName(packageName, cleanLevel, "PostgresExtractorRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export type RecursiveStringRecords = string | { [x: string]: RecursiveStringRecords };

export class SqlDbExtractRunner {
  private logHeader: string;
  private extractorRunnerMap: AsyncExtractorRunnerMap<any>;

  constructor(
    private persistenceStoreController:
      | SqlDbDataStoreSection
      | SqlDbModelStoreSection /* concrete types for MixedSqlDbInstanceStoreSection */
  ) // private persistenceStoreController: typeof MixedSqlDbInstanceStoreSection // does not work
  {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    const InMemoryImplementationExtractorRunnerMap: AsyncExtractorRunnerMap<any> = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstance: this.extractEntityInstance.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: this.applyExtractorTransformerSql.bind(this),
    };
    const dbImplementationExtractorRunnerMap: AsyncExtractorRunnerMap<any> = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstance: this.extractEntityInstance.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractor:
        this.asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor.bind(this),
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: this.applyExtractorTransformerSql.bind(this),
    };

    // this.extractorRunnerMap = InMemoryImplementationExtractorRunnerMap;
    this.extractorRunnerMap = dbImplementationExtractorRunnerMap;
  }

  // ################################################################################################
  async applyExtractorTransformerSql(
    query: QueryExtractorRuntimeTransformer,
    queryParams: DomainElementObject,
    newFetchedData: DomainElementObject,
    extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>
  ): Promise<DomainElement> {
    // log.info("SqlDbExtractRunner applyExtractorTransformerSql extractors", extractors);
    log.info("SqlDbExtractRunner applyExtractorTransformerSql query", JSON.stringify(query, null, 2));

    // const referenceName = typeof query.referencedExtractor == "string"?query.referencedExtractor:(query.referencedExtractor as any).referenceName;
    const referenceName = query.referencedExtractor;

    const resolvedReference = resolveContextReference(
      { queryTemplateType: "queryContextReference", referenceName: query.referencedExtractor },
      queryParams,
      newFetchedData
    );

    log.info("SqlDbExtractRunner applyExtractorTransformerSql resolvedReference", resolvedReference);

    // for (const ex of Object.entries(extractors)) {
    //   log.info("applyExtractorTransformerSql getting sqlForExtractor", ex[0], ex[1]);
    //   const sqlQuery = this.persistenceStoreController.sqlForExtractor(ex[1])
    //   log.info("applyExtractorTransformerSql sqlForExtractor", ex[0], sqlQuery);
    //   // const rawResult = await this.persistenceStoreController.executeRawQuery(sqlQuery as any);
    //   // log.info("applyExtractorTransformerSql rawResult", rawResult);
    // }

    const extractorRawQueries = Object.entries(extractors).map(([key, value]) => {
      return [key, this.persistenceStoreController.sqlForExtractor(value)];
    });

    log.info("applyExtractorTransformerSql extractorRawQueries", extractorRawQueries);

    if (resolvedReference.elementType != "instanceUuidIndex") {
      return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
    }

    switch (query.queryName) {
      case "actionRuntimeTransformer": {
        const orderBy = query.actionRuntimeTransformer.orderBy
          ? `ORDER BY ${query.actionRuntimeTransformer.orderBy}`
          : "";
        switch (query.actionRuntimeTransformer.templateType) {
          case "unique": {
            log.info("applyExtractorTransformerSql query.attribute", query.actionRuntimeTransformer.attribute);
            // TODO: resolve query.referencedExtractor.referenceName properly
            const aggregateRawQuery = `
              WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
              SELECT DISTINCT ON ("${query.actionRuntimeTransformer.attribute}") "${
              query.actionRuntimeTransformer.attribute
            }" FROM "${referenceName}"
              ${orderBy}
            `;
            log.info("applyExtractorTransformerSql unique aggregateRawQuery", aggregateRawQuery);

            const rawResult = await this.persistenceStoreController.executeRawQuery(aggregateRawQuery);
            log.info("applyExtractorTransformerSql unique rawResult", JSON.stringify(rawResult));

            if (rawResult.status == "error") {
              return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
            }

            const sqlResult = rawResult.returnedDomainElement.elementValue;
            log.info("applyExtractorTransformerSql unique sqlResult", JSON.stringify(sqlResult));
            return Promise.resolve({ elementType: "any", elementValue: sqlResult });
            break;
          }
          case "count": {
            log.info("applyExtractorTransformerSql count query.groupBy", query.actionRuntimeTransformer.groupBy);
            // TODO: resolve query.referencedExtractor.referenceName properly
            const aggregateRawQuery = query.actionRuntimeTransformer.groupBy
              ? `WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
              SELECT "${query.actionRuntimeTransformer.groupBy}", COUNT("uuid") FROM ${referenceName}
              GROUP BY "${query.actionRuntimeTransformer.groupBy}"
              ${orderBy}
            `
              : `WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
              SELECT COUNT("uuid") FROM "${referenceName}"
              ${orderBy}
            `;
            log.info("applyExtractorTransformerSql count aggregateRawQuery", aggregateRawQuery);

            const rawResult = await this.persistenceStoreController.executeRawQuery(aggregateRawQuery);
            log.info("applyExtractorTransformerSql count rawResult", JSON.stringify(rawResult));

            if (rawResult.status == "error") {
              return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
            }

            const sqlResult = rawResult.returnedDomainElement.elementValue.map((e: Record<string, any>) => ({
              ...e,
              count: Number(e.count),
            }));
            // log.info("applyExtractorTransformerSql count sqlResult", JSON.stringify(sqlResult));
            log.info("applyExtractorTransformerSql count sqlResult", sqlResult);
            return Promise.resolve({ elementType: "any", elementValue: sqlResult });
            break;
          }
          default:
            break;
        }
        break;
      }
      default: {
        throw new Error("applyExtractorTransformerSql could not handle query" + query);
        break;
      }
    }

    return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
  }

  // ################################################################################################
  /**
   * returns an Entity Instance List, from a ListQuery
   * @param deploymentEntityState
   * @param selectorParams
   * @returns
   */
  private asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor = <StateType>(
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
        return this.extractEntityInstanceUuidIndexWithFilter(state, selectorParams);
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
                  applicationSection: selectorParams.extractor.pageParams.elementValue.applicationSection
                    .elementValue as ApplicationSection,
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
  };

  // ##############################################################################################
  async handleQuery(queryAction: QueryAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQuery", "queryAction", JSON.stringify(queryAction, null, 2));
    let queryResult: DomainElement;
    switch (queryAction.query.queryType) {
      case "domainModelSingleExtractor": {
        queryResult = await this.extractorRunnerMap.extractWithExtractor(undefined /* domainState*/, {
          extractor: queryAction.query,
          extractorRunnerMap: this.extractorRunnerMap,
        });
        break;
      }
      case "extractorForRecordOfExtractors": {
        queryResult = await this.extractorRunnerMap.extractWithManyExtractors(undefined /* domainState*/, {
          extractor: queryAction.query,
          extractorRunnerMap: this.extractorRunnerMap,
        });
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
          await this.persistenceStoreController.getInstances(
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
        const entityInstanceUuidIndex = Object.fromEntries(
          entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i) => [i.uuid, i])
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

  // ##############################################################################################
  public extractEntityInstanceUuidIndexWithFilter: AsyncExtractorRunner<
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
        let entityInstanceCollection: ActionEntityInstanceCollectionReturnType;
        if (
          extractorRunnerParams.extractor.select.queryType == "extractObjectListByEntity" &&
          extractorRunnerParams.extractor.select.filter
        ) {
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
        const entityInstanceUuidIndex = Object.fromEntries(
          entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i) => [i.uuid, i])
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

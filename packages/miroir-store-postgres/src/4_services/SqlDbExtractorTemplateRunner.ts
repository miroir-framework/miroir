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
  DomainElementObject,
  DomainState,
  ExtractorTemplateForRecordOfExtractors,
  ExtractorTemplateForSingleObject,
  ExtractorTemplateForSingleObjectList,
  ExtractorRunnerMapForJzodSchema,
  getLoggerName,
  LoggerInterface,
  MiroirLoggerFactory,
  QueryTemplateAction,
  QueryTemplateSelectObject,
  resolveContextReferenceDEFUNCT,
  TransformerForRuntime,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  resolveContextReference
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

export class SqlDbExtractTemplateRunner {
  private logHeader: string;
  private extractorRunnerMap: AsyncExtractorTemplateRunnerMap;

  constructor(
    private persistenceStoreController:
      | SqlDbDataStoreSection
      | SqlDbModelStoreSection /* concrete types for MixedSqlDbInstanceStoreSection */
  ) // private persistenceStoreController: typeof MixedSqlDbInstanceStoreSection // does not work
  {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    const InMemoryImplementationExtractorRunnerMap: AsyncExtractorTemplateRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstance: this.extractEntityInstanceForTemplate.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory: asyncExtractEntityInstanceUuidIndexWithObjectListExtractorTemplate,
      extractWithManyExtractorTemplates: asyncExtractWithManyExtractorTemplates,
      extractWithExtractorTemplate: asyncExtractWithExtractorTemplate,
      applyExtractorTransformer: asyncApplyExtractorTemplateTransformerInMemory,
    };
    const dbImplementationExtractorRunnerMap: AsyncExtractorTemplateRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstance: this.extractEntityInstanceForTemplate.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory:
        this.asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractorForTemplate.bind(this),
      extractWithManyExtractorTemplates: asyncExtractWithManyExtractorTemplates,
      extractWithExtractorTemplate: asyncExtractWithExtractorTemplate,
      applyExtractorTransformer: this.applyExtractorTemplateTransformerSql.bind(this),
    };

    this.extractorRunnerMap = InMemoryImplementationExtractorRunnerMap;
    // this.extractorRunnerMap = dbImplementationExtractorRunnerMap;
  }

  // ################################################################################################
  async applyExtractorTemplateTransformerSql(
    actionRuntimeTransformer: TransformerForRuntime,
    queryParams: DomainElementObject,
    newFetchedData: DomainElementObject,
    extractors: Record<string, ExtractorTemplateForSingleObjectList | ExtractorTemplateForSingleObject | ExtractorTemplateForRecordOfExtractors>
  ): Promise<DomainElement> {
    // log.info("SqlDbExtractRunner applyExtractorTransformerSql extractors", extractors);
    log.info("SqlDbExtractRunner applyExtractorTransformerSql query", JSON.stringify(actionRuntimeTransformer, null, 2));

    if (!(actionRuntimeTransformer as any).referencedExtractor) {
      throw new Error("applyExtractorTransformerSql missing referencedExtractor");
    }
    
    const referenceName = (actionRuntimeTransformer as any).referencedExtractor;

    const resolvedReference = resolveContextReferenceDEFUNCT(
      { queryTemplateType: "queryContextReference", referenceName: (actionRuntimeTransformer as any).referencedExtractor },
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
      return [key, this.persistenceStoreController.sqlForExtractorTemplate(value)];
    });

    log.info("applyExtractorTransformerSql extractorRawQueries", extractorRawQueries);

    if (resolvedReference.elementType != "instanceUuidIndex") {
      return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
    }

    const orderBy = (actionRuntimeTransformer as any).orderBy
      ? `ORDER BY ${(actionRuntimeTransformer as any).orderBy}`
      : "";
    switch (actionRuntimeTransformer.templateType) {
      case "unique": {
        log.info("applyExtractorTransformerSql actionRuntimeTransformer.attribute", actionRuntimeTransformer.attribute);
        // TODO: resolve query.referencedExtractor.referenceName properly
        const aggregateRawQuery = `
          WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
          SELECT DISTINCT ON ("${actionRuntimeTransformer.attribute}") "${
          actionRuntimeTransformer.attribute
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
        log.info("applyExtractorTransformerSql count actionRuntimeTransformer.groupBy", actionRuntimeTransformer.groupBy);
        // TODO: resolve query.referencedExtractor.referenceName properly
        const aggregateRawQuery = actionRuntimeTransformer.groupBy
          ? `WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
          SELECT "${actionRuntimeTransformer.groupBy}", COUNT("uuid") FROM ${referenceName}
          GROUP BY "${actionRuntimeTransformer.groupBy}"
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

    return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
  }

  // ################################################################################################
  /**
   * returns an Entity Instance List, from a ListQuery
   * @param deploymentEntityState
   * @param selectorParams
   * @returns
   */
  private asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractorForTemplate = (
    selectorParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    // (
    //   state: any,
    //   selectorParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList, any>
    // ): Promise<DomainElementInstanceUuidIndexOrFailed> {
    let result: Promise<DomainElementInstanceUuidIndexOrFailed>;
    switch (selectorParams.extractor.select.queryType) {
      case "queryTemplateExtractObjectListByEntity": {
        return this.extractEntityInstanceUuidIndexWithFilter(selectorParams);
      }
      case "selectObjectListByRelation":
      case "selectObjectListByManyToManyRelation": {
        return this.extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractorTemplateInMemory({
          extractorRunnerMap: this.extractorRunnerMap,
          extractor: {
            queryType: "extractorTemplateForDomainModelObjects",
            deploymentUuid: selectorParams.extractor.deploymentUuid,
            contextResults: selectorParams.extractor.contextResults,
            pageParams: selectorParams.extractor.pageParams,
            queryParams: selectorParams.extractor.queryParams,
            select: selectorParams.extractor.select.applicationSection
              ? selectorParams.extractor.select
              : {
                  ...selectorParams.extractor.select,
                  applicationSection: selectorParams.extractor.pageParams.applicationSection
                  // applicationSection: selectorParams.extractor.pageParams.elementValue.applicationSection
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
  async handleQueryTemplate(queryTemplateAction: QueryTemplateAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryTemplate", "queryTemplateAction", JSON.stringify(queryTemplateAction, null, 2));
    let queryResult: DomainElement;
    switch (queryTemplateAction.query.queryType) {
      case "extractorTemplateForDomainModelObjects": {
        queryResult = await this.extractorRunnerMap.extractWithExtractorTemplate({
          extractor: queryTemplateAction.query,
          extractorRunnerMap: this.extractorRunnerMap,
        });
        break;
      }
      case "extractorTemplateForRecordOfExtractors": {
        queryResult = await this.extractorRunnerMap.extractWithManyExtractorTemplates({
          extractor: queryTemplateAction.query,
          extractorRunnerMap: this.extractorRunnerMap,
        });
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
      log.info(this.logHeader, "handleQueryTemplate", "queryTemplateAction", queryTemplateAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
  }

  // ##############################################################################################
  public extractEntityInstanceForTemplate: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObject,
    DomainElementEntityInstanceOrFailed
  > = async (
    selectorParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObject>
  ): Promise<DomainElementEntityInstanceOrFailed> => {
    const querySelectorParams: QueryTemplateSelectObject = selectorParams.extractor.select as QueryTemplateSelectObject;
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
      "extractEntityInstanceForTemplate params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReference
    );

    // log.info("extractEntityInstanceForTemplate found entityUuidReference", JSON.stringify(entityUuidReference))
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
          !querySelectorParams.AttributeOfObjectToCompareToReferenceUuid
          // ||
          // referenceObject.elementType != "instance"
        ) {
          return {
            elementType: "failure",
            elementValue: {
              queryFailure: "IncorrectParameters",
              failureMessage: "AttributeOfObjectToCompareToReferenceUuid attribute not found on query: " + JSON.stringify(querySelectorParams, null, 2),
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
        //   "extractEntityInstanceForTemplate selectObjectByRelation, ############# reference",
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
        // log.info("extractEntityInstanceForTemplate selectObjectByDirectReference found domainState", JSON.stringify(domainState))

        log.info(
          "extractEntityInstanceForTemplate found instanceUuid",
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
        log.info("extractEntityInstanceForTemplate resolved instanceUuid =", instanceDomainElement);
        const result = await this.persistenceStoreController.getInstance(
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
          "extractEntityInstanceForTemplate selectObjectByDirectReference, ############# reference",
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
        };
        break;
      }
      default: {
        throw new Error(
          "extractEntityInstanceForTemplate can not handle QueryTemplateSelectObject query with queryType=" +
            selectorParams.extractor.select.queryType
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
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid: DomainElement = resolveContextReference(
      extractorRunnerParams.extractor.select.parentUuid,
      extractorRunnerParams.extractor.queryParams,
      extractorRunnerParams.extractor.contextResults
    );

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

    switch (entityUuid.elementType) {
      case "string":
      case "instanceUuid": {
        const entityInstanceCollection: ActionEntityInstanceCollectionReturnType =
          await this.persistenceStoreController.getInstances(
            entityUuid.elementValue
          );

        if (entityInstanceCollection.status == "error") {
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
          "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference entityUuid=" + entityUuid
        );
        break;
      }
    }
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndexWithFilter: AsyncExtractorTemplateRunner<
    ExtractorTemplateForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid: DomainElement = resolveContextReference(
      extractorRunnerParams.extractor.select.parentUuid,
      extractorRunnerParams.extractor.queryParams,
      extractorRunnerParams.extractor.contextResults
    );

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

    switch (entityUuid.elementType) {
      case "string":
      case "instanceUuid": {
        let entityInstanceCollection: ActionEntityInstanceCollectionReturnType;
        if (
          extractorRunnerParams.extractor.select.queryType == "queryTemplateExtractObjectListByEntity" &&
          extractorRunnerParams.extractor.select.filter
        ) {
          // TODO: resolve filter value
          // const resolvedFilterValue: DomainElement = resolveContextReferenceDEFUNCT(
          //   extractorRunnerParams.extractor.select.parentUuid,
          //   extractorRunnerParams.extractor.queryParams,
          //   extractorRunnerParams.extractor.contextResults
          // );
          // log.info("selectEntityInstanceUuidIndexFromDomainStateForTemplate resolvedFilterValue", resolvedFilterValue);
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
          "selectEntityInstanceUuidIndexFromDomainStateForTemplate could not handle reference entityUuid=" + entityUuid
        );
        break;
      }
    }
  };

  // ##############################################################################################
  public getSelectorMap(): AsyncExtractorTemplateRunnerMap {
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

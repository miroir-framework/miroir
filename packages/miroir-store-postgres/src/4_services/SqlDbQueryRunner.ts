import {
  Action2EntityInstanceCollectionOrFailure,
  Action2ReturnType,
  ApplicationSection,
  asyncApplyExtractorTransformerInMemory,
  AsyncBoxedExtractorOrQueryRunnerMap,
  AsyncBoxedExtractorRunner,
  AsyncBoxedExtractorRunnerParams,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractWithExtractor,
  AsyncQueryRunnerParams,
  asyncRunQuery,
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  DomainElementInstanceUuidIndex,
  DomainElementObject,
  DomainElementSuccess,
  Domain2QueryReturnType,
  DomainState,
  EntityInstance,
  ExtractorOrCombinerReturningObject,
  LoggerInterface,
  MiroirLoggerFactory,
  QueryRunnerMapForJzodSchema,
  resolvePathOnObject,
  RunBoxedExtractorAction,
  RunBoxedQueryAction,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  transformer_InnerReference_resolve,
  EntityInstancesUuidIndex,
  Domain2ElementFailed,
  Action2Error
} from "miroir-core";
import {
  sqlStringForQuery
} from "../1_core/SqlGenerator";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { SqlDbDataStoreSection } from "./SqlDbDataStoreSection";
import { SqlDbModelStoreSection } from "./SqlDbModelStoreSection";
import { SqlDbExtractTemplateRunner } from "./SqlDbQueryTemplateRunner";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SqlDbQueryRunner")
).then((logger: LoggerInterface) => {log = logger});



export type RecursiveStringRecords = string | { [x: string]: RecursiveStringRecords };

// ################################################################################################
export function getDomainStateJzodSchemaExtractorRunnerMap(): QueryRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export class SqlDbQueryRunner {
  private logHeader: string;
  private dbImplementationExtractorRunnerMap: AsyncBoxedExtractorOrQueryRunnerMap;
  private inMemoryImplementationExtractorRunnerMap: AsyncBoxedExtractorOrQueryRunnerMap;
  private sqlDbExtractTemplateRunner: SqlDbExtractTemplateRunner;

  constructor(
    private schema: string,
    private persistenceStoreController:
      | SqlDbDataStoreSection
      | SqlDbModelStoreSection /* concrete types for MixedSqlDbInstanceStoreSection */
  ) // private persistenceStoreController: typeof MixedSqlDbInstanceStoreSection // does not work
  {
    this.logHeader = "SqlDbQueryRunner " + persistenceStoreController.getStoreName();
    this.sqlDbExtractTemplateRunner = new SqlDbExtractTemplateRunner(persistenceStoreController, this);
    this.inMemoryImplementationExtractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstanceList: this.extractEntityInstanceList.bind(this),
      extractEntityInstance: this.extractEntityInstance.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractEntityInstanceListWithObjectListExtractor: asyncExtractEntityInstanceListWithObjectListExtractor,
      runQuery: asyncRunQuery,
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // 
      runQueryTemplateWithExtractorCombinerTransformer: undefined as any,

    };
    // const dbImplementationExtractorRunnerMap: AsyncBoxedExtractorOrQueryRunnerMap = {
    this.dbImplementationExtractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstanceList: this.extractEntityInstanceList.bind(this),
      extractEntityInstance: this.extractEntityInstance.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractor:
        this.asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor.bind(this),
      extractEntityInstanceListWithObjectListExtractor:
        this.asyncSqlDbExtractEntityInstanceListWithObjectListExtractor.bind(this),
      runQuery: this.asyncExtractWithQuery.bind(this),
      extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList: asyncExtractWithExtractor,
      applyExtractorTransformer: undefined as any,
      // 
      runQueryTemplateWithExtractorCombinerTransformer: undefined as any,
    };

    // TODO: design error: this has to be kept consistent with SqlDbExtractTemplateRunner
    // this.extractorRunnerMap = dbImplementationExtractorRunnerMap;
    // this.extractorRunnerMap = InMemoryImplementationExtractorRunnerMap;
  } // end constructor

  
  // ################################################################################################
  /**
   * Apply extractor, combiners and transformers to the database using a single SQL query
   * alternative to asyncRunQuery from AsyncQuerySelector.ts
   * @param selectorParams 
   * @returns 
   */
  asyncExtractWithQuery = async (
    selectorParams: AsyncQueryRunnerParams,
  ): Promise<Domain2QueryReturnType<Record<string, any>>> => {
    // log.info("########## asyncRunQuery begin, query", selectorParams);
  
    const { query, transformerRawQueriesObject, endResultName, combinerRawQueriesObject } = sqlStringForQuery(
      selectorParams,
      this.schema
    );

    const rawResult = await this.persistenceStoreController.executeRawQuery(query);
    log.info("applyExtractorTransformerSql innerFullObjectTemplate #####RAWRESULT", JSON.stringify(rawResult));

    if (rawResult instanceof Action2Error || rawResult.returnedDomainElement instanceof Domain2ElementFailed) {
      log.error("applyExtractorTransformerSql rawResult", JSON.stringify(rawResult));
      return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
    }

    const endResultPath =
      selectorParams.extractor.runtimeTransformers && transformerRawQueriesObject[endResultName].resultAccessPath
        ? transformerRawQueriesObject[endResultName].resultAccessPath
        : selectorParams.extractor.combiners && combinerRawQueriesObject[endResultName].resultAccessPath
        ? combinerRawQueriesObject[endResultName].resultAccessPath
        : undefined;
    const encloseEndResultInArray =
      selectorParams.extractor.runtimeTransformers && transformerRawQueriesObject[endResultName].encloseEndResultInArray
        ? transformerRawQueriesObject[endResultName].encloseEndResultInArray
        : selectorParams.extractor.combiners && combinerRawQueriesObject[endResultName].encloseEndResultInArray
        ? combinerRawQueriesObject[endResultName].encloseEndResultInArray
        : undefined;
    log.info(
      "applyExtractorTransformerSql runtimeTransformers",
      selectorParams.extractor.runtimeTransformers &&
        Array.isArray(transformerRawQueriesObject[endResultName].resultAccessPath),
        "endResultName", endResultName,
        "transformerRawQueriesObject", JSON.stringify(transformerRawQueriesObject, null, 2),
        "endResultPath", endResultPath, endResultPath!==undefined, !!selectorParams.extractor.runtimeTransformers
    );
    const sqlResult =
      endResultPath !== undefined
        ? encloseEndResultInArray
          ? [resolvePathOnObject(rawResult.returnedDomainElement, endResultPath)] // TODO: HACK! HACK!
          : resolvePathOnObject(rawResult.returnedDomainElement, endResultPath)
        : rawResult.returnedDomainElement;
    log.info("applyExtractorTransformerSql sqlResult", JSON.stringify(sqlResult));
    // const result: Domain2QueryReturnType<DomainElementSuccess> = { elementType: "object", elementValue: {[endResultName]:sqlResult} }
    const result: Domain2QueryReturnType<any> = {[endResultName]:sqlResult}
    log.info("applyExtractorTransformerSql returning result", JSON.stringify(result));
    return Promise.resolve(result);
  };
  
  // ################################################################################################
  /**
   * returns an Entity Instance List, from a ListQuery
   * @param deploymentEntityState
   * @param selectorParams
   * @returns
   */
  public asyncSqlDbExtractEntityInstanceListWithObjectListExtractor = (
    selectorParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<Domain2QueryReturnType<EntityInstance[]>> => {
    // (
    //   state: any,
    //   selectorParams: AsyncExtractorOrQueryTemplateRunnerParams<BoxedExtractorTemplateReturningObjectList, any>
    // ): Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>> {
    let result: Promise<Domain2QueryReturnType<EntityInstance[]>>;
    switch (selectorParams.extractor.select.extractorOrCombinerType) {
      case "extractorByEntityReturningObjectList": {
        return this.extractEntityInstanceListWithFilter(selectorParams);
      }
      case "combinerByRelationReturningObjectList":
      case "combinerByManyToManyRelationReturningObjectList": {
        // return this.extractorRunnerMap.extractEntityInstanceListWithObjectListExtractor({ // this is actually a recursive call
        //   extractorRunnerMap: this.extractorRunnerMap,
        if (!selectorParams.extractorRunnerMap) {
          throw new Error("extractEntityInstanceListWithObjectListExtractor missing extractorRunnerMap");
        }
        return selectorParams.extractorRunnerMap.extractEntityInstanceListWithObjectListExtractor({ // this is actually a recursive call
          extractorRunnerMap: selectorParams.extractorRunnerMap,
          extractor: {
            queryType: "boxedExtractorOrCombinerReturningObjectList",
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

  // ################################################################################################
  /**
   * returns an Entity Instance List, from a ListQuery
   * @param deploymentEntityState
   * @param selectorParams
   * @returns
   */
  public asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor = (
    selectorParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>> => {
    // (
    //   state: any,
    //   selectorParams: AsyncExtractorOrQueryTemplateRunnerParams<BoxedExtractorTemplateReturningObjectList, any>
    // ): Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>> {
    let result: Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>>;
    switch (selectorParams.extractor.select.extractorOrCombinerType) {
      case "extractorByEntityReturningObjectList": {
        return this.extractEntityInstanceUuidIndexWithFilter(selectorParams);
      }
      case "combinerByRelationReturningObjectList":
      case "combinerByManyToManyRelationReturningObjectList": {
        // return this.extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractor({ // this is actually a recursive call
        //   extractorRunnerMap: this.extractorRunnerMap,
        if (!selectorParams.extractorRunnerMap) {
          throw new Error("extractEntityInstanceListWithObjectListExtractor missing extractorRunnerMap");
        }
        return selectorParams.extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractor({ // this is actually a recursive call
          extractorRunnerMap: selectorParams.extractorRunnerMap,
          extractor: {
            queryType: "boxedExtractorOrCombinerReturningObjectList",
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
  async handleBoxedExtractorAction(runBoxedExtractorAction: RunBoxedExtractorAction): Promise<Action2ReturnType> {
    log.info(this.logHeader, "handleBoxedExtractorAction", "runBoxedExtractorAction", JSON.stringify(runBoxedExtractorAction, null, 2));
    let queryResult: Domain2QueryReturnType<DomainElementSuccess>;
    queryResult = await this.inMemoryImplementationExtractorRunnerMap.extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList({
      extractor: runBoxedExtractorAction.query,
      extractorRunnerMap: this.inMemoryImplementationExtractorRunnerMap,
    });
    if (queryResult instanceof Domain2ElementFailed) {
      return {
        status: "error",
        // error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult) },
        errorType: "FailedToGetInstances", 
        errorMessage: JSON.stringify(queryResult),
      } as Action2ReturnType;
    } else {
      const result: Action2ReturnType = { status: "ok", returnedDomainElement: queryResult };
      log.info(
        this.logHeader,
        "handleBoxedExtractorAction",
        "runBoxedExtractorAction",
        runBoxedExtractorAction,
        "result",
        JSON.stringify(result, null, 2)
      );
      return result;
    }
  }

  // ##############################################################################################
  async handleBoxedQueryAction(runBoxedQueryAction: RunBoxedQueryAction): Promise<Action2ReturnType> {
    log.info(
      this.logHeader,
      "handleBoxedQueryAction called with runBoxedQueryAction",
      JSON.stringify(runBoxedQueryAction, null, 2)
    );
    let queryResult: Domain2QueryReturnType<DomainElementSuccess>;
    if (runBoxedQueryAction.query.runAsSql) {
      queryResult = await this.dbImplementationExtractorRunnerMap.runQuery({
        extractor: runBoxedQueryAction.query,
        extractorRunnerMap: this.dbImplementationExtractorRunnerMap,
      });
    } else {
      queryResult = await this.inMemoryImplementationExtractorRunnerMap.runQuery({
        extractor: runBoxedQueryAction.query,
        extractorRunnerMap: this.inMemoryImplementationExtractorRunnerMap,
      });
    }
    if (queryResult instanceof Domain2ElementFailed) {
      return {
        status: "error",
        // error: { errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult) },
        errorType: "FailedToGetInstances", errorMessage: JSON.stringify(queryResult),
      } as Action2ReturnType;
    } else {
      const result: Action2ReturnType = { status: "ok", returnedDomainElement: queryResult };
      log.info(
        this.logHeader,
        "handleBoxedQueryAction",
        "runBoxedQueryAction",
        runBoxedQueryAction,
        "result",
        JSON.stringify(result, null, 2)
      );
      return result;
    }
  }

  // ##############################################################################################
  public extractEntityInstance: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObject,
    Domain2QueryReturnType<EntityInstance>
  > = async (
    selectorParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObject>
  // ): Promise<Domain2QueryReturnType<EntityInstance>> => {
  ): Promise<Domain2QueryReturnType<Domain2QueryReturnType<EntityInstance>>> => {
    const querySelectorParams: ExtractorOrCombinerReturningObject = selectorParams.extractor.select as ExtractorOrCombinerReturningObject;
    const deploymentUuid = selectorParams.extractor.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractor.select.applicationSection ??
      // ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
      ((selectorParams.extractor.pageParams?.applicationSection ??
        "data") as ApplicationSection);

    const entityUuidReference = querySelectorParams.parentUuid

    log.info(
      "extractEntityInstance params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReference
    );

    switch (querySelectorParams?.extractorOrCombinerType) {
      case "combinerForObjectByRelation": {
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
              failureMessage:
                "sqlDbExtractorRunner combinerForObjectByRelation objectReference not found:" +
                JSON.stringify(querySelectorParams.objectReference),
              query: JSON.stringify(querySelectorParams),
              queryParameters: JSON.stringify(selectorParams.extractor.pageParams),
              queryContext: JSON.stringify(selectorParams.extractor.contextResults),
            },
          };
        }

        const result = await this.persistenceStoreController.getInstance(
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
        //   JSON.stringify(selectorParams.extractor.queryParams, undefined, 2),
        //   "######### contextResults",
        //   JSON.stringify(selectorParams.extractor.contextResults, undefined, 2)
        // );
        return result.returnedDomainElement;
        break;
      }
      case "extractorForObjectByDirectReference": {
        const instanceDomainElement = querySelectorParams.instanceUuid
        // log.info("selectEntityInstanceFromDeploymentEntityStateForTemplate extractorForObjectByDirectReference found domainState", JSON.stringify(domainState))

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
          "extractEntityInstance can not handle ExtractorTemplateReturningObject query with queryType=" +
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
        result.map((i) => [i.uuid, i])
      );
      return entityInstanceUuidIndex;
    });
  };

  // ##############################################################################################
  public extractEntityInstanceList: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstance[]>
  > = async (
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<Domain2QueryReturnType<EntityInstance[]>> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid = extractorRunnerParams.extractor.select.parentUuid;

    // log.info("extractEntityInstanceUuidIndex params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("extractEntityInstanceUuidIndex domainState", domainState);

    const entityInstanceCollection: Action2EntityInstanceCollectionOrFailure =
      await this.persistenceStoreController.getInstances(
        entityUuid
      );

    if (entityInstanceCollection instanceof Action2Error) {
      log.error("sqlDbQueryRunner extractEntityInstanceList failed with EntityNotFound for extractor", JSON.stringify(extractorRunnerParams.extractor, null, 2));

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
    if (entityInstanceCollection.returnedDomainElement instanceof Domain2ElementFailed) {
      log.error("sqlDbQueryRunner extractEntityInstanceList failed for extractor", JSON.stringify(extractorRunnerParams.extractor, null, 2));
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
    //   entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i) => [i.uuid, i])
    // );
    return entityInstanceCollection.returnedDomainElement.instances;
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndexWithFilter: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstancesUuidIndex>
  > = async (
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<Domain2QueryReturnType<EntityInstancesUuidIndex>> => {
    return this.extractEntityInstanceListWithFilter(extractorRunnerParams).then((result) => {
      if (result instanceof Domain2ElementFailed) {
        return result;
      }
      const entityInstanceUuidIndex = Object.fromEntries(
        result.map((i) => [i.uuid, i])
      );
      return entityInstanceUuidIndex;
    });
  };

  // ##############################################################################################
  public extractEntityInstanceListWithFilter: AsyncBoxedExtractorRunner<
    BoxedExtractorOrCombinerReturningObjectList,
    Domain2QueryReturnType<EntityInstance[]>
  > = async (
    extractorRunnerParams: AsyncBoxedExtractorRunnerParams<BoxedExtractorOrCombinerReturningObjectList>
  ): Promise<Domain2QueryReturnType<EntityInstance[]>> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid = extractorRunnerParams.extractor.select.parentUuid;

    // log.info("extractEntityInstanceUuidIndexWithFilter params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("extractEntityInstanceUuidIndexWithFilter domainState", domainState);

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

    let entityInstanceCollection: Action2EntityInstanceCollectionOrFailure;
    if (
      extractorRunnerParams.extractor.select.extractorOrCombinerType == "extractorByEntityReturningObjectList" &&
      extractorRunnerParams.extractor.select.filter
    ) {
      entityInstanceCollection = await this.persistenceStoreController.getInstancesWithFilter(
        entityUuid,
        {
          attribute: extractorRunnerParams.extractor.select.filter.attributeName,
          value: extractorRunnerParams.extractor.select.filter.value,
        }
      );
    } else {
      entityInstanceCollection = await this.persistenceStoreController.getInstances(
        entityUuid
      );
    }

    if (
      entityInstanceCollection instanceof Action2Error ||
      entityInstanceCollection.returnedDomainElement instanceof Domain2ElementFailed
    ) {
      log.error(
        "sqlDbQueryRunner extractEntityInstanceListWithFilter failed with EntityNotFound for extractor",
        JSON.stringify(extractorRunnerParams.extractor, null, 2)
      );
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
    //   entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i) => [i.uuid, i])
    // );
    return entityInstanceCollection.returnedDomainElement.instances;
  };

  // ##############################################################################################
  public getDomainStateExtractorRunnerMap(): AsyncBoxedExtractorOrQueryRunnerMap {
    // return this.extractorRunnerMap;
    return undefined as any;
  }
} // end class SqlDbQueryRunner


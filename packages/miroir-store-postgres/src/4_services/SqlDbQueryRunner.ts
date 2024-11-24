import {
  ActionEntityInstanceCollectionReturnType,
  ActionReturnType,
  ApplicationSection,
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  AsyncExtractorRunner,
  AsyncExtractorRunnerMap,
  AsyncExtractorRunnerParams,
  asyncExtractWithExtractor,
  asyncExtractWithManyExtractors,
  asyncInnerSelectElementFromQuery,
  DomainElement,
  DomainElementEntityInstanceOrFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementInstanceUuidIndexOrFailed,
  DomainElementObject,
  DomainElementObjectOrFailed,
  DomainState,
  QueryWithExtractorCombinerTransformer,
  ExtractorForSingleObject,
  ExtractorForSingleObjectList,
  ExtractorRunnerMapForJzodSchema,
  getLoggerName,
  resolvePathOnObject,
  LoggerInterface,
  MiroirLoggerFactory,
  MiroirQuery,
  QueryAction,
  ExtractorOrCombinerReturningObject,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  transformer_InnerReference_resolve,
  TransformerForRuntime,
  TransformerForRuntime_innerFullObjectTemplate,
  Uuid
} from "miroir-core";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { SqlDbDataStoreSection } from "./SqlDbDataStoreSection";
import { SqlDbExtractTemplateRunner } from "./SqlDbQueryTemplateRunner";
import { SqlDbModelStoreSection } from "./SqlDbModelStoreSection";

const loggerName: string = getLoggerName(packageName, cleanLevel, "PostgresExtractorRunner");
let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


const stringQuote = "'";
const tokenQuote = '"';
const tokenComma = ",";
const tokenSeparatorForSelect = tokenComma + " ";
const tokenSeparatorForWith = tokenComma + " ";

export type RecursiveStringRecords = string | { [x: string]: RecursiveStringRecords };

// ################################################################################################
export function getDomainStateJzodSchemaExtractorRunnerMap(): ExtractorRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}

// ################################################################################################
export function sqlStringForTransformer(
  actionRuntimeTransformer: TransformerForRuntime | TransformerForRuntime_innerFullObjectTemplate,
): DomainElement { // TODO: DomainElement should be dependent type, the real type is hidden here
  // log.info("SqlDbQueryRunner applyExtractorTransformerSql extractors", extractors);
  log.info("extractorTransformerSql called with actionRuntimeTransformer", JSON.stringify(actionRuntimeTransformer, null, 2));


  // const resolvedReference = transformer_InnerReference_resolve( // TODO: REMOVE resolveContextReferenceDEFUNCT!!
  //   "build",
  //   { transformerType: "contextReference", referenceName },
  //   queryParams,
  //   newFetchedData
  // );

  // log.info("extractorTransformerSql applyExtractorTransformerSql resolvedReference", resolvedReference);


  // const extractorRawQueries = Object.entries(extractors).map(([key, value]) => {
  //   return [key, this.persistenceStoreController.sqlForExtractor(value)];
  // });

  // log.info("extractorTransformerSql extractorRawQueries", extractorRawQueries);

  // TODO: use referenceName and dotted notation for the attribute
  const orderBy = (actionRuntimeTransformer as any).orderBy
    ? `ORDER BY "${(actionRuntimeTransformer as any).orderBy}"`
    : "";

  log.info("extractorTransformerSql actionRuntimeTransformer", actionRuntimeTransformer);
  switch (actionRuntimeTransformer.transformerType) {
    case "constantUuid": {
      return {
        elementType: "any",
        elementValue: {
          sqlStringOrObject: `${actionRuntimeTransformer.constantUuidValue}`,
          // resultAccessPath: undefined,
        },
      };
      break;
    }
    case "constantString": {
      return {
        elementType: "any",
        elementValue: {
          sqlStringOrObject: `${actionRuntimeTransformer.constantStringValue}`,
          // resultAccessPath: undefined
        },
      }
      break;
    }
    case "newUuid": {
      return {
        elementType: "any",
        elementValue: {
          sqlStringOrObject: "gen_random_uuid()",
          // resultAccessPath: undefined
        }
      }
    }
    case "mustacheStringTemplate": {
      const result = actionRuntimeTransformer.definition.replace(/{{/g, "\"").replace(/}}/g, "\"").replace(/\./g, '"."');
      return {
        elementType: "any",
        elementValue: {
          sqlStringOrObject: result,
          // resultAccessPath: undefined
        },
      }
    }
    case "innerFullObjectTemplate": 
    case "fullObjectTemplate": {
      const referenceName:string = (actionRuntimeTransformer as any).referenceToOuterObject??(actionRuntimeTransformer as any).referencedExtractor;
      const selectFields =
        actionRuntimeTransformer.definition
          .map(
            (f) =>
              sqlStringForTransformer(f.attributeValue).elementValue.sqlStringOrObject + // TODO: check for actual type of sqlStringOrObject
              " AS " +
              tokenQuote + sqlStringForTransformer(f.attributeKey).elementValue.sqlStringOrObject + tokenQuote
          )
          .join(tokenSeparatorForSelect)
        ;
      // log.info("extractorTransformerSql innerFullObjectTemplate selectFields", selectFields);

      const sqlResult = `SELECT row_to_json(t) AS "innerFullObjectTemplate" FROM ( SELECT ${selectFields} FROM "${referenceName}" ) t
      ${orderBy}`;
      log.info("applyExtractorTransformerSql innerFullObjectTemplate sqlResult", JSON.stringify(sqlResult));
      return {
        elementType: "any",
        elementValue: {
          sqlStringOrObject: sqlResult,
          resultAccessPath: [0, "innerFullObjectTemplate"],
          encloseEndResultInArray: true,
        },
      };
      break;
    }
    case "mapperListToList": {
      /**
       * must take the rerferencedExtractor result and make it avaialable to elementTransformer, apply the elementTransformer to
       * each element of the list and return the sorted list of transformed elements
       */
      const referenceName:string = (actionRuntimeTransformer as any).referencedExtractor;
      const sqlStringForElementTransformer = sqlStringForTransformer(actionRuntimeTransformer.elementTransformer);
      // const sqlResult = `SELECT array_agg(${sqlStringForElementTransformer.elementValue.sqlString}) AS "mapperListToList" FROM "${referenceName}" ${orderBy}`;
      // log.info("extractorTransformerSql mapperListToList actionRuntimeTransformer.elementTransformer", actionRuntimeTransformer.elementTransformer);
      log.info("extractorTransformerSql mapperListToList sqlStringForElementTransformer", JSON.stringify(sqlStringForElementTransformer, null, 2));
      // const sqlResult = sqlStringForElementTransformer.elementValue.sqlStringOrObject;

      // we suppose we have an innerFullObjectTemplate inside the elementTransformer
      if (actionRuntimeTransformer.elementTransformer.transformerType != "innerFullObjectTemplate") {
        throw new Error("extractorTransformerSql mapperListToList elementTransformer not innerFullObjectTemplate");
      } 

      const innerQueryName = "inner_" + actionRuntimeTransformer.elementTransformer.referenceToOuterObject;
      // const sqlResult = `SELECT "${innerQueryName}".* FROM "${innerQueryName}"`
      // const sqlResult = `SELECT "${innerQueryName}"."${
      const subQueryColumnName = sqlStringForElementTransformer.elementValue.resultAccessPath
      ? sqlStringForElementTransformer.elementValue.resultAccessPath.slice(1).join(".") : "*";
      const resultColumns = actionRuntimeTransformer.elementTransformer.definition.map(
        (f:any) =>
          tokenQuote +  subQueryColumnName + tokenQuote + // TODO: check for actual type of sqlStringOrObject
          " -> " +
          stringQuote + sqlStringForTransformer(f.attributeKey).elementValue.sqlStringOrObject + stringQuote +
          " AS " +
          tokenQuote + sqlStringForTransformer(f.attributeKey).elementValue.sqlStringOrObject + tokenQuote
      ).join(tokenSeparatorForSelect);

      const sqlResult = `SELECT ${resultColumns} FROM "${innerQueryName}"`
      return {
        elementType: "any",
        elementValue: {
          // sqlStringOrObject: sqlStringForElementTransformer.elementValue.sqlStringOrObject,
          sqlStringOrObject: sqlResult,
          extraWith: [
            {
              name: actionRuntimeTransformer.elementTransformer.referenceToOuterObject,
              sql: `SELECT "${referenceName}".* FROM "${referenceName}"`,
            },
            {
              name: innerQueryName,
              sql: sqlStringForElementTransformer.elementValue.sqlStringOrObject,
            }
            // {
            //   name: actionRuntimeTransformer.elementTransformer.referenceToOuterObject,
            //   sql: `SELECT "${referenceName}"."${
            //     sqlStringForElementTransformer.elementValue.resultAccessPath
            //       ? sqlStringForElementTransformer.elementValue.resultAccessPath.slice(1).join(".") // TODO: HACK! HACK!
            //       : "*"
            //   }" FROM "${referenceName}"`,
            // },
          ],
          // {
          //   [actionRuntimeTransformer.] :sqlStringForElementTransformer
          //   sqlResult
          // },
          // resultAccessPath: undefined,
        },
      };
    }
    case "listPickElement": {
      const referenceName:string = (actionRuntimeTransformer as any).referencedExtractor;

      const limit = actionRuntimeTransformer.index + 1;
      // const sqlResult = `SELECT * FROM "${referenceName}" ${orderBy} LIMIT ${limit}`; 
      const sqlResult = `SELECT * FROM "${referenceName}" ${orderBy} LIMIT ${limit}`; // TODO: this selects 1 element only when actionRuntimeTransformer.index == 0 
      return {
        elementType: "any",
        elementValue: {
          sqlStringOrObject: sqlResult,
          resultAccessPath: [0],
        },
      };
      break;
    }
    case "constantObject": {
      const result = "SELECT '" +
        JSON.stringify(actionRuntimeTransformer.constantObjectValue).replace(/\\"/g,'"') +
        "'::jsonb FROM generate_series(1,1)";
      ;
      log.info("applyExtractorTransformerSql constantObject", actionRuntimeTransformer.constantObjectValue, "result", result);
      return {
        elementType: "any",
        elementValue: { sqlStringOrObject: result, resultAccessPath: [0] },
      };
      break;
    }
    case "contextReference":
    case "parameterReference":
    case "objectDynamicAccess":
    case "freeObjectTemplate":
    case "objectAlter":
    case "mapperListToObject":
    case "objectValues": {
      return {
        elementType: "failure",
        elementValue: {
          queryFailure: "QueryNotExecutable",
          query: JSON.stringify(actionRuntimeTransformer),
          failureMessage:
            "applyExtractorTransformerSql transformerType not implemented: " +
            actionRuntimeTransformer.transformerType,
        },
      };
      break;
    }
    case "unique": {
      const referenceName:string = (actionRuntimeTransformer as any).referencedExtractor;
      if (!(actionRuntimeTransformer as any).referencedExtractor) {
        throw new Error("extractorTransformerSql unique missing referencedExtractor");
      }
      log.info("extractorTransformerSql actionRuntimeTransformer.attribute", actionRuntimeTransformer.attribute);
      // TODO: resolve query.referencedExtractor.referenceName properly
      // WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
      const transformerSqlQuery = `SELECT DISTINCT ON ("${actionRuntimeTransformer.attribute}") "${
        actionRuntimeTransformer.attribute
      }" FROM "${referenceName}"
        ${orderBy}
      `;
      // log.info("applyExtractorTransformerSql unique aggregateRawQuery", transformerSqlQuery);
      log.info("extractorTransformerSql unique transformerRawQuery", JSON.stringify(transformerSqlQuery));
      return { elementType: "any", elementValue: { sqlStringOrObject: transformerSqlQuery, 
        resultAccessPath: undefined
      } };
      break;
    }
    case "count": {
      const referenceName:string = (actionRuntimeTransformer as any).referencedExtractor;
      if (!(actionRuntimeTransformer as any).referencedExtractor) {
        throw new Error("extractorTransformerSql count missing referencedExtractor");
      }
      log.info("extractorTransformerSql count actionRuntimeTransformer.groupBy", actionRuntimeTransformer.groupBy);
      const transformerSqlQuery = actionRuntimeTransformer.groupBy
        ? 
          `SELECT "${actionRuntimeTransformer.groupBy}", COUNT("uuid")::int FROM ${referenceName}
          GROUP BY "${actionRuntimeTransformer.groupBy}"
          ${orderBy}`
        : 
          `SELECT COUNT("uuid")::int FROM "${referenceName}"
          ${orderBy}`
      ;
      log.info("extractorTransformerSql count transformerSqlQuery", transformerSqlQuery);
      return { elementType: "any", elementValue: { sqlStringOrObject: transformerSqlQuery, resultAccessPath: undefined } };
      break;
    }
    default:
      break;
  }

  return {
    elementType: "failure",
    elementValue: {
      queryFailure: "QueryNotExecutable",
      failureOrigin: ["extractorTransformerSql"],
      query: actionRuntimeTransformer,
      failureMessage: "could not handle transformer",
    },
  };
}

// ################################################################################################
export class SqlDbQueryRunner {
  private logHeader: string;
  // private extractorRunnerMap: AsyncExtractorRunnerMap;
  private dbImplementationExtractorRunnerMap: AsyncExtractorRunnerMap;
  private inMemoryImplementationExtractorRunnerMap: AsyncExtractorRunnerMap;
  private sqlDbExtractTemplateRunner: SqlDbExtractTemplateRunner;

  constructor(
    private schema: string,
    private persistenceStoreController:
      | SqlDbDataStoreSection
      | SqlDbModelStoreSection /* concrete types for MixedSqlDbInstanceStoreSection */
  ) // private persistenceStoreController: typeof MixedSqlDbInstanceStoreSection // does not work
  {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    this.sqlDbExtractTemplateRunner = new SqlDbExtractTemplateRunner(persistenceStoreController, this);
    this.inMemoryImplementationExtractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstanceList: this.extractEntityInstanceList.bind(this),
      extractEntityInstance: this.extractEntityInstance.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractEntityInstanceListWithObjectListExtractor: asyncExtractEntityInstanceListWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // 
      extractWithManyExtractorTemplates: undefined as any,

    };
    // const dbImplementationExtractorRunnerMap: AsyncExtractorRunnerMap = {
    this.dbImplementationExtractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstanceList: this.extractEntityInstanceList.bind(this),
      extractEntityInstance: this.extractEntityInstance.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractor:
        this.asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor.bind(this),
      extractEntityInstanceListWithObjectListExtractor:
        this.asyncSqlDbExtractEntityInstanceListWithObjectListExtractor.bind(this),
      extractWithManyExtractors: this.asyncExtractWithQuery.bind(this),
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: undefined as any,
      // 
      extractWithManyExtractorTemplates: undefined as any,
    };

    // TODO: design error: this has to be kept consistent with SqlDbExtractTemplateRunner
    // this.extractorRunnerMap = dbImplementationExtractorRunnerMap;
    // this.extractorRunnerMap = InMemoryImplementationExtractorRunnerMap;
  } // end constructor

  // ################################################################################################
  sqlStringForCombiner/*ExtractorTemplateRunner*/(
    query: MiroirQuery
  ): DomainElement {
    // TODO: fetch parentName from parentUuid in query!
    switch (query.queryType) {
      case "extractorByEntityReturningObjectList":
      case "extractorForObjectByDirectReference": {
        throw new Error("asyncInnerSelectElementFromQuery queryType not implemented: " + JSON.stringify(query));
        // const result = this.persistenceStoreController.sqlForExtractor(query)
        // return {
        //   elementType: "any",
        //   elementValue: result,
        // }
        break;
      }
      case "extractorWrapperReturningObject":
      case "extractorWrapperReturningList":
      case "wrapperReturningObject":
      case "wrapperReturningList": {
        throw new Error("asyncInnerSelectElementFromQuery queryType not implemented: " + JSON.stringify(query));
      }
      case "extractorCombinerForObjectByRelation": {
        // TODO: deal with name clashes
        const result = `
          SELECT "${query.parentName}".* FROM "${this.schema}"."${query.parentName}", "${query.objectReference}"
          WHERE "${query.parentName}"."uuid" = "${query.objectReference}"."${query.AttributeOfObjectToCompareToReferenceUuid}"`;
        return {
          elementType: "any",
          elementValue: {
            sqlString: result,
            resultAccessPath: [0],
          },
        }
      }
      case "combinerByRelationReturningObjectList": {
        const result = `
        SELECT "${query.parentName}".* FROM "${this.schema}"."${query.parentName}", "${query.objectReference}"
        WHERE "${query.parentName}"."${query.AttributeOfListObjectToCompareToReferenceUuid}" = "${query.objectReference}"."uuid"`;
        return {
          elementType: "any",
          elementValue: {
            sqlString: result,
            resultAccessPath: undefined,
          },
        }
      }
      case "combinerByManyToManyRelationReturningObjectList":
      case "extractorCombinerByHeteronomousManyToManyReturningListOfObjectList":
      case "literal":
      case "queryContextReference": {
        throw new Error("asyncInnerSelectElementFromQuery queryType not implemented: " + JSON.stringify(query));
      }
      default: {
        throw new Error("asyncInnerSelectElementFromQuery queryType not implemented: " + JSON.stringify(query));
        break;
      }
    }
    // return {
    //   elementType: "string",
    //   elementValue: "asyncInnerSelectElementFromQuery",
    // }
  }
  
  // ################################################################################################
  /**
   * Apply extractor, combiners and transformers to the database using a single SQL query
   * alternative to asyncExtractWithManyExtractors from AsyncQuerySelector.ts
   * @param selectorParams 
   * @returns 
   */
  asyncExtractWithQuery = async (
    selectorParams: AsyncExtractorRunnerParams<QueryWithExtractorCombinerTransformer>,
  ): Promise<DomainElementObjectOrFailed> => {
    // log.info("########## asyncExtractWithManyExtractors begin, query", selectorParams);
  
    const extractorRawQueries = Object.entries(selectorParams.extractor.extractors ?? {}).map(([key, value]) => {
      return [key, this.persistenceStoreController.sqlForExtractor(value)];
    });

    log.info("applyExtractorTransformerSql extractorRawQueries", extractorRawQueries);

  
    const combinerRawQueries = Object.entries(selectorParams.extractor.combiners ?? {}).map(([key, value]) => { 
      return [key, this.sqlStringForCombiner(value).elementValue];
    });
    log.info("applyExtractorTransformerSql combinerRawQueries", combinerRawQueries);

    const transformerRawQueries = Object.entries(selectorParams.extractor.runtimeTransformers ?? {}).map(([key, value]) => { 
      return [key, sqlStringForTransformer(value as TransformerForRuntime).elementValue]; // TODO: handle ExtendedExtractorForRuntime?
    });
    log.info("applyExtractorTransformerSql transformerRawQueries", JSON.stringify(transformerRawQueries, null, 2));
    
    const combinerRawQueriesObject = Object.fromEntries(combinerRawQueries);
    const transformerRawQueriesObject = Object.fromEntries(transformerRawQueries);
    const lastEntryIndex = selectorParams.extractor.runtimeTransformers ? transformerRawQueries.length - 1 : 
    selectorParams.extractor.combiners? combinerRawQueries.length - 1 : extractorRawQueries.length - 1;
    const endResultName =
      Object.keys(
        selectorParams.extractor.runtimeTransformers ??
          selectorParams.extractor.combiners ??
          selectorParams.extractor.extractors ??
          {}
      )[lastEntryIndex] ?? "endResultNotFound";

    const query =
      `WITH
    ` +
      extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(tokenSeparatorForWith) +
      (combinerRawQueries.length > 0
        ? tokenSeparatorForWith +
          combinerRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1].sqlString + " )").join(tokenSeparatorForWith)
        : "") +
      (transformerRawQueries.length > 0
        ? tokenSeparatorForWith +
          transformerRawQueries
            .flatMap((q) => (typeof q[1] == "string")?
                '"' + q[0] + '" AS (' + q[1] + " )"
              :
                (q[1].extraWith?q[1].extraWith.map((s:any) => '"' +  s.name + '" AS (' +  s.sql + " )").join(tokenSeparatorForWith) + tokenSeparatorForWith : "")  +
                '"' + q[0] + '" AS (' + q[1].sqlStringOrObject + " )"
              )
            .join(tokenSeparatorForWith)
        : "") +
      `
      SELECT * FROM "${endResultName}"`;
    log.info("applyExtractorTransformerSql innerFullObjectTemplate aggregateRawQuery", query);

    const rawResult = await this.persistenceStoreController.executeRawQuery(query);
    log.info("applyExtractorTransformerSql innerFullObjectTemplate #####RAWRESULT", JSON.stringify(rawResult));

    if (rawResult.status == "error") {
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
          ? [resolvePathOnObject(rawResult.returnedDomainElement.elementValue, endResultPath)] // TODO: HACK! HACK!
          : resolvePathOnObject(rawResult.returnedDomainElement.elementValue, endResultPath)
        : rawResult.returnedDomainElement.elementValue;
    // const sqlResult =
    //   endResultPath !== undefined
    //     ? selectorParams.extractor.runtimeTransformers
    //       ? [resolvePathOnObject(rawResult.returnedDomainElement.elementValue, endResultPath)] // TODO: HACK! HACK!
    //       : resolvePathOnObject(rawResult.returnedDomainElement.elementValue, endResultPath)
    //     : rawResult.returnedDomainElement.elementValue;
    log.info("applyExtractorTransformerSql sqlResult", JSON.stringify(sqlResult));
    return Promise.resolve({ elementType: "object", elementValue: {[endResultName]:sqlResult} });
  };
  
  // ################################################################################################
  /**
   * returns an Entity Instance List, from a ListQuery
   * @param deploymentEntityState
   * @param selectorParams
   * @returns
   */
  public asyncSqlDbExtractEntityInstanceListWithObjectListExtractor = (
    selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
  ): Promise<DomainElementInstanceArrayOrFailed> => {
    // (
    //   state: any,
    //   selectorParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList, any>
    // ): Promise<DomainElementInstanceUuidIndexOrFailed> {
    let result: Promise<DomainElementInstanceArrayOrFailed>;
    switch (selectorParams.extractor.select.queryType) {
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
            queryType: "extractorForDomainModelObjects",
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
    selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    // (
    //   state: any,
    //   selectorParams: AsyncExtractorTemplateRunnerParams<ExtractorTemplateForSingleObjectList, any>
    // ): Promise<DomainElementInstanceUuidIndexOrFailed> {
    let result: Promise<DomainElementInstanceUuidIndexOrFailed>;
    switch (selectorParams.extractor.select.queryType) {
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
            queryType: "extractorForDomainModelObjects",
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
  async handleQueryAction(queryAction: QueryAction): Promise<ActionReturnType> {
    log.info(this.logHeader, "handleQueryAction", "queryAction", JSON.stringify(queryAction, null, 2));
    let queryResult: DomainElement;
    switch (queryAction.query.queryType) {
      case "extractorForDomainModelObjects": {
        queryResult = await this.inMemoryImplementationExtractorRunnerMap.extractWithExtractor({
          extractor: queryAction.query,
          extractorRunnerMap: this.inMemoryImplementationExtractorRunnerMap,
        });
        break;
      }
      case "queryWithExtractorCombinerTransformer": {
        if (queryAction.query.runAsSql) {
          queryResult = await this.dbImplementationExtractorRunnerMap.extractWithManyExtractors({
            extractor: queryAction.query,
            extractorRunnerMap: this.dbImplementationExtractorRunnerMap,
          });
        } else {
          queryResult = await this.inMemoryImplementationExtractorRunnerMap.extractWithManyExtractors({
            extractor: queryAction.query,
            extractorRunnerMap: this.inMemoryImplementationExtractorRunnerMap,
          });
        }
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
      log.info(this.logHeader, "handleQueryAction", "queryAction", queryAction, "result", JSON.stringify(result, null, 2));
      return result;
    }
  }

  // ##############################################################################################
  public extractEntityInstance: AsyncExtractorRunner<
    ExtractorForSingleObject,
    DomainElementEntityInstanceOrFailed
  > = async (
    selectorParams: AsyncExtractorRunnerParams<ExtractorForSingleObject>
  ): Promise<DomainElementEntityInstanceOrFailed> => {
    const querySelectorParams: ExtractorOrCombinerReturningObject = selectorParams.extractor.select as ExtractorOrCombinerReturningObject;
    const deploymentUuid = selectorParams.extractor.deploymentUuid;
    const applicationSection: ApplicationSection =
      selectorParams.extractor.select.applicationSection ??
      ((selectorParams.extractor.pageParams?.elementValue?.applicationSection?.elementValue ??
        "data") as ApplicationSection);

    const entityUuidReference = querySelectorParams.parentUuid

    log.info(
      "extractEntityInstance params",
      querySelectorParams,
      deploymentUuid,
      applicationSection,
      entityUuidReference
    );

    switch (querySelectorParams?.queryType) {
      case "extractorCombinerForObjectByRelation": {
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
                "sqlDbExtractorRunner extractorCombinerForObjectByRelation objectReference not found:" +
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
        //   "extractEntityInstance extractorCombinerForObjectByRelation, ############# reference",
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
        return {
          elementType: "instance",
          elementValue: result.returnedDomainElement.elementValue,
        };
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
    return this.extractEntityInstanceList(extractorRunnerParams).then((result) => {
      if (result.elementType == "failure") {
        return result;
      }
      const entityInstanceUuidIndex = Object.fromEntries(
        result.elementValue.map((i) => [i.uuid, i])
      );
      return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
    });
  };

  // ##############################################################################################
  public extractEntityInstanceList: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceArrayOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
  ): Promise<DomainElementInstanceArrayOrFailed> => {
    const deploymentUuid = extractorRunnerParams.extractor.deploymentUuid;
    const applicationSection = extractorRunnerParams.extractor.select.applicationSection ?? "data";

    const entityUuid = extractorRunnerParams.extractor.select.parentUuid;

    // log.info("extractEntityInstanceUuidIndex params", selectorParams, deploymentUuid, applicationSection, entityUuid);
    // log.info("extractEntityInstanceUuidIndex domainState", domainState);

    const entityInstanceCollection: ActionEntityInstanceCollectionReturnType =
      await this.persistenceStoreController.getInstances(
        entityUuid
      );

    if (entityInstanceCollection.status == "error") {
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
    return { elementType: "instanceArray", elementValue: entityInstanceCollection.returnedDomainElement.elementValue.instances };
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndexWithFilter: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
    return this.extractEntityInstanceListWithFilter(extractorRunnerParams).then((result) => {
      if (result.elementType == "failure") {
        return result;
      }
      const entityInstanceUuidIndex = Object.fromEntries(
        result.elementValue.map((i) => [i.uuid, i])
      );
      return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
    });
  };

  // ##############################################################################################
  public extractEntityInstanceListWithFilter: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceArrayOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
  ): Promise<DomainElementInstanceArrayOrFailed> => {
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

    let entityInstanceCollection: ActionEntityInstanceCollectionReturnType;
    if (
      extractorRunnerParams.extractor.select.queryType == "extractorByEntityReturningObjectList" &&
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

    if (entityInstanceCollection.status == "error") {
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
    return { elementType: "instanceArray", elementValue: entityInstanceCollection.returnedDomainElement.elementValue.instances };
  };

  // ##############################################################################################
  public getDomainStateExtractorRunnerMap(): AsyncExtractorRunnerMap {
    // return this.extractorRunnerMap;
    return undefined as any;
  }
} // end class SqlDbQueryRunner


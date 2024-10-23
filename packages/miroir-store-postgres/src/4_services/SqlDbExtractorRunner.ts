import {
  ActionEntityInstanceCollectionReturnType,
  ActionReturnType,
  ApplicationSection,
  asyncApplyExtractorTransformerInMemory,
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
  QuerySelectObject,
  selectEntityJzodSchemaFromDomainStateNew,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  transformer_InnerReference_resolve,
  TransformerForRuntime
} from "miroir-core";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { SqlDbDataStoreSection } from "./SqlDbDataStoreSection";
import { SqlDbExtractTemplateRunner } from "./SqlDbExtractorTemplateRunner";
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
export function getJzodSchemaSelectorMap(): ExtractorRunnerMapForJzodSchema<DomainState> {
  return {
    extractJzodSchemaForDomainModelQuery: selectJzodSchemaByDomainModelQueryFromDomainStateNew,
    extractEntityJzodSchema: selectEntityJzodSchemaFromDomainStateNew,
    extractFetchQueryJzodSchema: selectFetchQueryJzodSchemaFromDomainStateNew,
    extractzodSchemaForSingleSelectQuery: selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  };
}

// ################################################################################################
export function extractorTransformerSql(
  actionRuntimeTransformer: TransformerForRuntime,
  queryParams: Record<string, any>,
  newFetchedData: Record<string, any>,
  extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>
): DomainElement {
  // log.info("SqlDbExtractRunner applyExtractorTransformerSql extractors", extractors);
  log.info("extractorTransformerSql called with actionRuntimeTransformer", JSON.stringify(actionRuntimeTransformer, null, 2));

  const referenceName:string = (actionRuntimeTransformer as any).referencedExtractor;

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

  const orderBy = (actionRuntimeTransformer as any).orderBy
    ? `ORDER BY ${(actionRuntimeTransformer as any).orderBy}`
    : "";

  log.info("extractorTransformerSql actionRuntimeTransformer", actionRuntimeTransformer);
  switch (actionRuntimeTransformer.transformerType) {
    case "constantUuid": {
      return {
        elementType: "string",
        elementValue: `${actionRuntimeTransformer.constantUuidValue}`,
      }
      break;
    }
    case "constantString": {
      return {
        elementType: "string",
        elementValue: `${actionRuntimeTransformer.constantStringValue}`,
      }
      break;
    }
    case "newUuid": {
      return {
        elementType: "string",
        elementValue: "gen_random_uuid()",
      }
    }
    case "mustacheStringTemplate": {
      const result = actionRuntimeTransformer.definition.replace(/{{/g, "\"").replace(/}}/g, "\"").replace(/\./g, '"."');
      return {
        elementType: "string",
        elementValue: result,
      }
    }
    case "fullObjectTemplate": {
      const selectFields =
        actionRuntimeTransformer.definition
          .map(
            (f) =>
              extractorTransformerSql(f.attributeValue, queryParams, newFetchedData, extractors).elementValue +
              " AS " +
              tokenQuote + extractorTransformerSql(f.attributeKey, queryParams, newFetchedData, extractors).elementValue + tokenQuote
          )
          .join(tokenSeparatorForSelect)
        ;
      log.info("extractorTransformerSql fullObjectTemplate selectFields", selectFields);

      const sqlResult = `SELECT row_to_json(t) AS "fullObjectTemplate" FROM ( SELECT ${selectFields} FROM "${referenceName}" ) t
      ${orderBy}`;
      // log.info("applyExtractorTransformerSql fullObjectTemplate sqlResult", JSON.stringify(sqlResult));
      return { elementType: "string", elementValue: sqlResult };
      break;
    }
    case "constantObject":
    case "contextReference":
    case "parameterReference":
    case "objectDynamicAccess":
    case "freeObjectTemplate":
    case "objectAlter":
    case "listPickElement":
    case "mapperListToList":
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
      return { elementType: "any", elementValue: transformerSqlQuery };
      break;
    }
    case "count": {
      if (!(actionRuntimeTransformer as any).referencedExtractor) {
        throw new Error("extractorTransformerSql count missing referencedExtractor");
      }
      log.info("extractorTransformerSql count actionRuntimeTransformer.groupBy", actionRuntimeTransformer.groupBy);
      const transformerSqlQuery = actionRuntimeTransformer.groupBy
        ? 
          `SELECT "${actionRuntimeTransformer.groupBy}", COUNT("uuid") FROM ${referenceName}
          GROUP BY "${actionRuntimeTransformer.groupBy}"
          ${orderBy}`
        : 
          `SELECT COUNT("uuid") FROM "${referenceName}"
          ${orderBy}`
      ;
      log.info("extractorTransformerSql count transformerSqlQuery", transformerSqlQuery);
      return { elementType: "any", elementValue: transformerSqlQuery };
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
export class SqlDbExtractRunner {
  private logHeader: string;
  private extractorRunnerMap: AsyncExtractorRunnerMap;
  private sqlDbExtractTemplateRunner: SqlDbExtractTemplateRunner;

  constructor(
    private persistenceStoreController:
      | SqlDbDataStoreSection
      | SqlDbModelStoreSection /* concrete types for MixedSqlDbInstanceStoreSection */
  ) // private persistenceStoreController: typeof MixedSqlDbInstanceStoreSection // does not work
  {
    this.logHeader = "PersistenceStoreController " + persistenceStoreController.getStoreName();
    this.sqlDbExtractTemplateRunner = new SqlDbExtractTemplateRunner(persistenceStoreController, this);
    const InMemoryImplementationExtractorRunnerMap: AsyncExtractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstance: this.extractEntityInstance.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractor: asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: asyncApplyExtractorTransformerInMemory,
      // 
      extractWithManyExtractorTemplates: undefined as any,

    };
    const dbImplementationExtractorRunnerMap: AsyncExtractorRunnerMap = {
      extractorType: "async",
      extractEntityInstanceUuidIndex: this.extractEntityInstanceUuidIndex.bind(this),
      extractEntityInstance: this.extractEntityInstance.bind(this),
      extractEntityInstanceUuidIndexWithObjectListExtractor:
        this.asyncSqlDbExtractEntityInstanceUuidIndexWithObjectListExtractor.bind(this),
      extractWithManyExtractors: asyncExtractWithManyExtractors,
      extractWithExtractor: asyncExtractWithExtractor,
      applyExtractorTransformer: this.applyExtractorTransformerSql.bind(this),
      // 
      extractWithManyExtractorTemplates: undefined as any,
    };

    // TODO: design error: this has to be kept consistent with SqlDbExtractTemplateRunner
    // this.extractorRunnerMap = InMemoryImplementationExtractorRunnerMap;
    this.extractorRunnerMap = dbImplementationExtractorRunnerMap;
  }


  // ################################################################################################
  async applyExtractorTransformerSqlBACKUP(
    actionRuntimeTransformer: TransformerForRuntime,
    queryParams: DomainElementObject,
    newFetchedData: DomainElementObject,
    extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>
  ): Promise<DomainElement> {
    // log.info("SqlDbExtractRunner applyExtractorTransformerSql extractors", extractors);
    log.info("SqlDbExtractRunner applyExtractorTransformerSql actionRuntimeTransformer", JSON.stringify(actionRuntimeTransformer, null, 2));

    if (!(actionRuntimeTransformer as any).referencedExtractor) {
      throw new Error("applyExtractorTransformerSql missing referencedExtractor");
    }
    
    const referenceName:string = (actionRuntimeTransformer as any).referencedExtractor;

    // const resolvedReference = resolveContextReferenceDEFUNCT( // TODO: REMOVE resolveContextReferenceDEFUNCT!!
    const resolvedReference = transformer_InnerReference_resolve( // TODO: REMOVE resolveContextReferenceDEFUNCT!!
      "build",
      { transformerType: "contextReference", referenceName },
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

    if (resolvedReference.elementType != "instanceUuidIndex" && resolvedReference.elementType != "object") {
      return Promise.resolve({
        elementType: "failure",
        elementValue: {
          queryFailure: "QueryNotExecutable",
          failureMessage: "could not handle extractor result, result type is not an object: " + resolvedReference.elementType,
        },
      });
    }

    const orderBy = (actionRuntimeTransformer as any).orderBy
      ? `ORDER BY ${(actionRuntimeTransformer as any).orderBy}`
      : "";

    log.info("applyExtractorTransformerSql treating actionRuntimeTransformer to be converted to queries", actionRuntimeTransformer);
    switch (actionRuntimeTransformer.transformerType) {
      case "fullObjectTemplate": {
        throw new Error("applyExtractorTransformerSql fullObjectTemplate not implemented");
        log.info("applyExtractorTransformerSql actionRuntimeTransformer", actionRuntimeTransformer.transformerType);
        // const transformerQueries = actionRuntimeTransformer.definition.map((f) => {
        //   return [
        //     f.attributeKey,
        //     this.extractorTransformerSql(f.attributeValue, queryParams, newFetchedData, extractors).elementValue,
        //   ];
        // });

        // log.info("applyExtractorTransformerSql fullObjectTemplate transformerQueries", transformerQueries);
        // const aggregateQueries = extractorRawQueries.concat(transformerQueries);
        // // const aggregateRawQuery = `WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
        // const aggregateRawQuery = `WITH ${aggregateQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
        //   SELECT * FROM "${referenceName}"
        //   ${orderBy}
        // `;
        // log.info("applyExtractorTransformerSql fullObjectTemplate aggregateRawQuery", aggregateRawQuery);

        // const rawResult = await this.persistenceStoreController.executeRawQuery(aggregateRawQuery);
        // log.info("applyExtractorTransformerSql fullObjectTemplate rawResult", JSON.stringify(rawResult));

        // if (rawResult.status == "error") {
        //   return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
        // }

        // const sqlResult = rawResult.returnedDomainElement.elementValue;
        // log.info("applyExtractorTransformerSql fullObjectTemplate sqlResult", JSON.stringify(sqlResult));
        // return Promise.resolve({ elementType: "any", elementValue: sqlResult });
        break;
      }
      case "mustacheStringTemplate":
      case "constantUuid":
      case "constantObject":
      case "constantString":
      case "newUuid":
      case "contextReference":
      case "parameterReference":
      case "objectDynamicAccess":
      case "freeObjectTemplate":
      case "objectAlter":
      case "listPickElement":
      case "mapperListToList":
      case "mapperListToObject":
      case "objectValues": {
        return Promise.resolve({
          elementType: "failure",
          elementValue: {
            queryFailure: "QueryNotExecutable",
            query: JSON.stringify(actionRuntimeTransformer),
            failureMessage:
              "applyExtractorTransformerSql transformerType not implemented: " +
              actionRuntimeTransformer.transformerType,
          },
        });
        break;
      }
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

    return Promise.resolve({
      elementType: "failure",
      elementValue: {
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["applyExtractorTransformerSql"],
        query: actionRuntimeTransformer,
        failureMessage: "could not handle transformer",
      },
    });
  }

  // ################################################################################################
  async applyExtractorTransformerSql(
    actionRuntimeTransformer: TransformerForRuntime,
    queryParams: Record<string, any>,
    newFetchedData: Record<string, any>,
    extractors: Record<string, ExtractorForSingleObjectList | ExtractorForSingleObject | ExtractorForRecordOfExtractors>
  ): Promise<DomainElement> {
    // log.info("SqlDbExtractRunner applyExtractorTransformerSql extractors", extractors);
    log.info("SqlDbExtractRunner applyExtractorTransformerSql actionRuntimeTransformer", JSON.stringify(actionRuntimeTransformer, null, 2));

    if (!(actionRuntimeTransformer as any).referencedExtractor) {
      throw new Error("applyExtractorTransformerSql missing referencedExtractor");
    }
    
    const referenceName:string = (actionRuntimeTransformer as any).referencedExtractor;

    // const resolvedReference = resolveContextReferenceDEFUNCT( // TODO: REMOVE resolveContextReferenceDEFUNCT!!
    const resolvedReference = transformer_InnerReference_resolve( // TODO: REMOVE resolveContextReferenceDEFUNCT!!
      "build",
      { transformerType: "contextReference", referenceName },
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

    if (resolvedReference.elementType != "instanceUuidIndex" && resolvedReference.elementType != "object") {
      return Promise.resolve({
        elementType: "failure",
        elementValue: {
          queryFailure: "QueryNotExecutable",
          failureMessage: "could not handle extractor result, result type is not an object: " + resolvedReference.elementType,
        },
      });
    }

    const orderBy = (actionRuntimeTransformer as any).orderBy
      ? `ORDER BY ${(actionRuntimeTransformer as any).orderBy}`
      : "";

    log.info("applyExtractorTransformerSql actionRuntimeTransformer", actionRuntimeTransformer);
    switch (actionRuntimeTransformer.transformerType) {
      case "fullObjectTemplate": {
        log.info("applyExtractorTransformerSql actionRuntimeTransformer", actionRuntimeTransformer.transformerType);
        const transformerQueries = extractorTransformerSql(actionRuntimeTransformer, queryParams, newFetchedData, extractors).elementValue
        // const transformerQueries = actionRuntimeTransformer.definition.map((f) => {
        //   return [ // TODO: resolve f.attributeKey properly
        //     f.attributeKey.transformerType == "constantString" ? f.attributeKey.constantStringValue : JSON.stringify(f.attributeKey),
        //     this.extractorTransformerSql(f.attributeValue, queryParams, newFetchedData, extractors).elementValue,
        //   ];
        // });

        log.info("applyExtractorTransformerSql fullObjectTemplate transformerQueries", transformerQueries);
        // const aggregateQueries = extractorRawQueries.concat(transformerQueries);
        const aggregateQueries = extractorRawQueries;
        const transformerName = "newBook";
        const aggregateRawQuery = `WITH ${aggregateQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
          ${tokenSeparatorForWith}
          "${transformerName}" AS (${transformerQueries})
          SELECT * FROM "${transformerName}"
          ${orderBy}
        `;
        log.info("applyExtractorTransformerSql fullObjectTemplate aggregateRawQuery", aggregateRawQuery);

        const rawResult = await this.persistenceStoreController.executeRawQuery(aggregateRawQuery);
        log.info("applyExtractorTransformerSql fullObjectTemplate rawResult", JSON.stringify(rawResult));

        if (rawResult.status == "error") {
          log.error("applyExtractorTransformerSql fullObjectTemplate rawResult", JSON.stringify(rawResult));
          return Promise.resolve({ elementType: "failure", elementValue: { queryFailure: "QueryNotExecutable" } });
        }

        const sqlResult = rawResult.returnedDomainElement.elementValue;
        log.info("applyExtractorTransformerSql fullObjectTemplate sqlResult", JSON.stringify(sqlResult));
        return Promise.resolve({ elementType: "any", elementValue: sqlResult["0"]["fullObjectTemplate"] });
        break;
      }
      case "mustacheStringTemplate":
      case "constantUuid":
      case "constantString": {
      }
      case "constantObject":
      case "newUuid":
      case "contextReference":
      case "parameterReference":
      case "objectDynamicAccess":
      case "freeObjectTemplate":
      case "objectAlter":
      case "listPickElement":
      case "mapperListToList":
      case "mapperListToObject":
      case "objectValues": {
        return Promise.resolve({
          elementType: "failure",
          elementValue: {
            queryFailure: "QueryNotExecutable",
            query: JSON.stringify(actionRuntimeTransformer),
            failureMessage:
              "applyExtractorTransformerSql transformerType not implemented: " +
              actionRuntimeTransformer.transformerType,
          },
        });
        break;
      }
      case "unique": {
        log.info("applyExtractorTransformerSql actionRuntimeTransformer.attribute", actionRuntimeTransformer.attribute);
        // TODO: resolve query.referencedExtractor.referenceName properly
        const sqlSubQuery = extractorTransformerSql(actionRuntimeTransformer, queryParams, newFetchedData, extractors);
        log.info("applyExtractorTransformerSql unique sqlSubQuery", sqlSubQuery);

      //   SELECT DISTINCT ON ("${actionRuntimeTransformer.attribute}") "${
      //   actionRuntimeTransformer.attribute
      // }" FROM "${referenceName}"
      //   ${orderBy}
        const aggregateRawQuery = `
          WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
          ${sqlSubQuery.elementValue}
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
        const sqlSubQuery = extractorTransformerSql(actionRuntimeTransformer, queryParams, newFetchedData, extractors);
        log.info("applyExtractorTransformerSql count sqlSubQuery", sqlSubQuery);

        const aggregateRawQuery = actionRuntimeTransformer.groupBy
          ? `WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
          ${sqlSubQuery.elementValue}`
          : `WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
          ${sqlSubQuery.elementValue}`
        ;
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

    return Promise.resolve({
      elementType: "failure",
      elementValue: {
        queryFailure: "QueryNotExecutable",
        failureOrigin: ["applyExtractorTransformerSql"],
        query: actionRuntimeTransformer,
        failureMessage: "could not handle transformer",
      },
    });
  }

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
      case "queryExtractObjectListByEntity": {
        return this.extractEntityInstanceUuidIndexWithFilter(selectorParams);
      }
      case "selectObjectListByRelation":
      case "selectObjectListByManyToManyRelation": {
        // return this.extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractorInMemory({ // this is actually a recursive call
        return this.extractorRunnerMap.extractEntityInstanceUuidIndexWithObjectListExtractor({ // this is actually a recursive call
          extractorRunnerMap: this.extractorRunnerMap,
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
        queryResult = await this.extractorRunnerMap.extractWithExtractor({
          extractor: queryAction.query,
          extractorRunnerMap: this.extractorRunnerMap,
        });
        break;
      }
      case "extractorForRecordOfExtractors": {
        queryResult = await this.extractorRunnerMap.extractWithManyExtractors({
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
    const querySelectorParams: QuerySelectObject = selectorParams.extractor.select as QuerySelectObject;
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
      case "selectObjectByRelation": {
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
                "sqlDbExtractorRunner selectObjectByRelation objectReference not found:" +
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
        //   "extractEntityInstance selectObjectByRelation, ############# reference",
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
      case "selectObjectByDirectReference": {
        const instanceDomainElement = querySelectorParams.instanceUuid
        // log.info("selectEntityInstanceFromDeploymentEntityStateForTemplate selectObjectByDirectReference found domainState", JSON.stringify(domainState))

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
    const entityInstanceUuidIndex = Object.fromEntries(
      entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i) => [i.uuid, i])
    );
    return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
  };

  // ##############################################################################################
  public extractEntityInstanceUuidIndexWithFilter: AsyncExtractorRunner<
    ExtractorForSingleObjectList,
    DomainElementInstanceUuidIndexOrFailed
  > = async (
    extractorRunnerParams: AsyncExtractorRunnerParams<ExtractorForSingleObjectList>
  ): Promise<DomainElementInstanceUuidIndexOrFailed> => {
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
      extractorRunnerParams.extractor.select.queryType == "queryExtractObjectListByEntity" &&
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
    const entityInstanceUuidIndex = Object.fromEntries(
      entityInstanceCollection.returnedDomainElement.elementValue.instances.map((i) => [i.uuid, i])
    );
    return { elementType: "instanceUuidIndex", elementValue: entityInstanceUuidIndex };
  };

  // ##############################################################################################
  public getSelectorMap(): AsyncExtractorRunnerMap {
    return this.extractorRunnerMap;
  }
} // end class SqlDbExtractRunner


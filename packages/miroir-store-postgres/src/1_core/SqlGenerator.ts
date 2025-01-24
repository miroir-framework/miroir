import { AsyncQueryRunnerParams, DomainElement, ExtractorOrCombiner, LoggerInterface, MiroirLoggerFactory, TransformerForRuntime, TransformerForRuntime_innerFullObjectTemplate } from "miroir-core";
import { RecursiveStringRecords } from "../4_services/SqlDbQueryTemplateRunner";
import { cleanLevel } from "../4_services/constants";
import { packageName } from "../constants";

export const stringQuote = "'";
export const tokenQuote = '"';
export const tokenComma = ",";
export const tokenSeparatorForSelect = tokenComma + " ";
export const tokenSeparatorForWith = tokenComma + " ";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "sqlGenerator")
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export function sqlStringForCombiner/*BoxedExtractorTemplateRunner*/(
  query: ExtractorOrCombiner,
  schema: string
): DomainElement {
  // TODO: fetch parentName from parentUuid in query!
  switch (query.extractorOrCombinerType) {
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
    case "extractorWrapperReturningList": {
      throw new Error("asyncInnerSelectElementFromQuery queryType not implemented: " + JSON.stringify(query));
    }
    case "combinerForObjectByRelation": {
      // TODO: deal with name clashes
      const result = `
        SELECT "${query.parentName}".* FROM "${schema}"."${query.parentName}", "${query.objectReference}"
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
      SELECT "${query.parentName}".* FROM "${schema}"."${query.parentName}", "${query.objectReference}"
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
    case "extractorOrCombinerContextReference": {
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

// ##############################################################################################
export function sqlStringForExtractor(extractor: ExtractorOrCombiner, schema: string): RecursiveStringRecords {
  switch (extractor.extractorOrCombinerType) {
    case "extractorForObjectByDirectReference": {
      return `SELECT * FROM "${schema}"."${extractor.parentName}" WHERE "uuid" = '${extractor.instanceUuid}'`;
      break;
    }
    case "combinerForObjectByRelation": {
      throw new Error("sqlForExtractor combinerForObjectByRelation not implemented");
      break;
    }
    case "extractorByEntityReturningObjectList": {
      return `SELECT * FROM "${schema}"."${extractor.parentName}"`;
      break;
    }
    case "extractorWrapperReturningObject":
    case "extractorWrapperReturningList":
    case "combinerByRelationReturningObjectList":
    case "combinerByManyToManyRelationReturningObjectList": {
      throw new Error(
        "sqlForExtractor not implemented for extractorOrCombinerType: " + extractor.extractorOrCombinerType
      );
      break;
    }
    default: {
      throw new Error("sqlForExtractor not implemented for extractorOrCombinerType of extractor: " + extractor);
      break;
    }
  }
}

export type sqlStringForTransformerElementValue = {
  sqlStringOrObject: string | Record<string, string>,
  resultAccessPath?: string[],
  encloseEndResultInArray: boolean,
}
// ################################################################################################
export function sqlStringForTransformer(
  actionRuntimeTransformer: TransformerForRuntime | TransformerForRuntime_innerFullObjectTemplate,
  topLevelTransformer: boolean = true,
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
        // elementType: "object",
        elementValue: {
          sqlStringOrObject: topLevelTransformer
            ? `select '${actionRuntimeTransformer.constantUuidValue}' as constantuuid`
            : `'${actionRuntimeTransformer.constantUuidValue}'`,
          // resultAccessPath: topLevelTransformer?[0]:undefined,
          resultAccessPath: topLevelTransformer ? [0, "constantuuid"] : undefined,
        },
      };
      break;
    }
    case "constantString": {
      return {
        elementType: "any",
        elementValue: {
          sqlStringOrObject: (topLevelTransformer?"select ":"") + `"${actionRuntimeTransformer.constantStringValue}"`,
          // resultAccessPath: undefined
        },
      }
      break;
    }
    case "newUuid": {
      return {
        elementType: "any",
        elementValue: {
          sqlStringOrObject: (topLevelTransformer?"select ":"") + "gen_random_uuid()",
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
    case "object_fullTemplate": {
      const referenceName:string = (actionRuntimeTransformer as any).referenceToOuterObject??(actionRuntimeTransformer as any).referencedExtractor;
      const selectFields =
        actionRuntimeTransformer.definition
          .map(
            (f) =>
              sqlStringForTransformer(f.attributeValue, false).elementValue.sqlStringOrObject + // TODO: check for actual type of sqlStringOrObject
              " AS " +
              tokenQuote + sqlStringForTransformer(f.attributeKey, false).elementValue.sqlStringOrObject + tokenQuote
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
      throw new Error("extractorTransformerSql mapperListToList not implemented");
      // const referenceName:string = (actionRuntimeTransformer as any).referencedExtractor;
      // const sqlStringForElementTransformer = sqlStringForTransformer(actionRuntimeTransformer.elementTransformer, false);
      // // const sqlResult = `SELECT array_agg(${sqlStringForElementTransformer.elementValue.sqlString}) AS "mapperListToList" FROM "${referenceName}" ${orderBy}`;
      // // log.info("extractorTransformerSql mapperListToList actionRuntimeTransformer.elementTransformer", actionRuntimeTransformer.elementTransformer);
      // log.info("extractorTransformerSql mapperListToList sqlStringForElementTransformer", JSON.stringify(sqlStringForElementTransformer, null, 2));
      // // const sqlResult = sqlStringForElementTransformer.elementValue.sqlStringOrObject;

      // // we suppose we have an innerFullObjectTemplate inside the elementTransformer
      // if (actionRuntimeTransformer.elementTransformer.transformerType != "innerFullObjectTemplate") {
      //   throw new Error("extractorTransformerSql mapperListToList elementTransformer not innerFullObjectTemplate");
      // } 

      // const innerQueryName = "inner_" + actionRuntimeTransformer.referenceToOuterObject;
      // // const sqlResult = `SELECT "${innerQueryName}".* FROM "${innerQueryName}"`
      // // const sqlResult = `SELECT "${innerQueryName}"."${
      // const subQueryColumnName = sqlStringForElementTransformer.elementValue.resultAccessPath
      // ? sqlStringForElementTransformer.elementValue.resultAccessPath.slice(1).join(".") : "*";
      // const resultColumns = actionRuntimeTransformer.elementTransformer.definition.map(
      //   (f:any) =>
      //     tokenQuote +  subQueryColumnName + tokenQuote + // TODO: check for actual type of sqlStringOrObject
      //     " -> " +
      //     stringQuote + sqlStringForTransformer(f.attributeKey, false).elementValue.sqlStringOrObject + stringQuote +
      //     " AS " +
      //     tokenQuote + sqlStringForTransformer(f.attributeKey, false).elementValue.sqlStringOrObject + tokenQuote
      // ).join(tokenSeparatorForSelect);

      // const sqlResult = `SELECT ${resultColumns} FROM "${innerQueryName}"`
      // return {
      //   elementType: "any",
      //   elementValue: {
      //     // sqlStringOrObject: sqlStringForElementTransformer.elementValue.sqlStringOrObject,
      //     sqlStringOrObject: sqlResult,
      //     extraWith: [
      //       {
      //         name: actionRuntimeTransformer.referenceToOuterObject,
      //         sql: `SELECT "${referenceName}".* FROM "${referenceName}"`,
      //       },
      //       {
      //         name: innerQueryName,
      //         sql: sqlStringForElementTransformer.elementValue.sqlStringOrObject,
      //       }
      //       // {
      //       //   name: actionRuntimeTransformer.elementTransformer.referenceToOuterObject,
      //       //   sql: `SELECT "${referenceName}"."${
      //       //     sqlStringForElementTransformer.elementValue.resultAccessPath
      //       //       ? sqlStringForElementTransformer.elementValue.resultAccessPath.slice(1).join(".") // TODO: HACK! HACK!
      //       //       : "*"
      //       //   }" FROM "${referenceName}"`,
      //       // },
      //     ],
      //     // {
      //     //   [actionRuntimeTransformer.] :sqlStringForElementTransformer
      //     //   sqlResult
      //     // },
      //     // resultAccessPath: undefined,
      //   },
      // };
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
    case "listReducerToIndexObject":
    case "objectEntries":
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
  // export function sqlStringForQuery(selectorParams: AsyncQueryRunnerParams, schema: string): RecursiveStringRecords {
  export function sqlStringForQuery(
    selectorParams: AsyncQueryRunnerParams,
    schema: string
  ): {
    query: string;
    // transformerRawQueriesObject: Record<string, { resultAccessPath: string[]}>;
    transformerRawQueriesObject: Record<string, sqlStringForTransformerElementValue >;
    endResultName: string;
    // combinerRawQueriesObject: Record<string, string>;
    combinerRawQueriesObject: Record<string, sqlStringForTransformerElementValue >;
  } {
    const extractorRawQueries = Object.entries(selectorParams.extractor.extractors ?? {}).map(([key, value]) => {
      // return [key, sqlStringForExtractor(value,this.persistenceStoreController.schema)];
      return [key, sqlStringForExtractor(value, schema)];
    });

    log.info("applyExtractorTransformerSql extractorRawQueries", extractorRawQueries);

    const combinerRawQueries = Object.entries(selectorParams.extractor.combiners ?? {}).map(([key, value]) => {
      // return [key, sqlStringForCombiner(value, this.schema).elementValue];
      return [key, sqlStringForCombiner(value, schema).elementValue];
    });
    log.info("applyExtractorTransformerSql combinerRawQueries", combinerRawQueries);

    const transformerRawQueries = Object.entries(selectorParams.extractor.runtimeTransformers ?? {}).map(
      ([key, value]) => {
        return [key, sqlStringForTransformer(value as TransformerForRuntime).elementValue]; // TODO: handle ExtendedExtractorForRuntime?
      }
    );
    log.info("applyExtractorTransformerSql transformerRawQueries", JSON.stringify(transformerRawQueries, null, 2));

    const combinerRawQueriesObject = Object.fromEntries(combinerRawQueries);
    const transformerRawQueriesObject = Object.fromEntries(transformerRawQueries);
    const lastEntryIndex = selectorParams.extractor.runtimeTransformers
      ? transformerRawQueries.length - 1
      : selectorParams.extractor.combiners
      ? combinerRawQueries.length - 1
      : extractorRawQueries.length - 1;
    const endResultName =
      Object.keys(
        selectorParams.extractor.runtimeTransformers ??
          selectorParams.extractor.combiners ??
          selectorParams.extractor.extractors ??
          {}
      )[lastEntryIndex] ?? "endResultNotFound";

    const queryParts: string[] = [];
    if (extractorRawQueries.length > 0) {
      queryParts.push(
        extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(tokenSeparatorForWith)
      );
    }
    if (combinerRawQueries.length > 0) {
      queryParts.push(
        combinerRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(tokenSeparatorForWith)
      );
    }
    if (transformerRawQueries.length > 0) {
      queryParts.push(
        transformerRawQueries
          .flatMap((q) =>
            typeof q[1] == "string"
              ? '"' + q[0] + '" AS (' + q[1] + " )"
              : (q[1].extraWith
                  ? q[1].extraWith.map((s: any) => '"' + s.name + '" AS (' + s.sql + " )").join(tokenSeparatorForWith) +
                    tokenSeparatorForWith
                  : "") +
                '"' +
                q[0] +
                '" AS (' +
                q[1].sqlStringOrObject +
                " )"
          )
          .join(tokenSeparatorForWith)
      );
    }
    const query =
      `WITH
    ` +
      queryParts.join(tokenSeparatorForWith) +
      // [
      //   (extractorRawQueries.length > 0
      //     ? extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(tokenSeparatorForWith)
      //     : ""),
      //   (combinerRawQueries.length > 0
      //     ? combinerRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1].sqlString + " )").join(tokenSeparatorForWith)
      //     : ""),
      //   (transformerRawQueries.length > 0
      //     ? transformerRawQueries
      //         .flatMap((q) =>
      //           typeof q[1] == "string"
      //             ? '"' + q[0] + '" AS (' + q[1] + " )"
      //             : (q[1].extraWith
      //                 ? q[1].extraWith
      //                     .map((s: any) => '"' + s.name + '" AS (' + s.sql + " )")
      //                     .join(tokenSeparatorForWith) + tokenSeparatorForWith
      //                 : "") +
      //               '"' +
      //               q[0] +
      //               '" AS (' +
      //               q[1].sqlStringOrObject +
      //               " )"
      //         )
      //         .join(tokenSeparatorForWith)
      //     : "")
      // ].join(tokenSeparatorForWith) +
      `
      SELECT * FROM "${endResultName}"`;
    log.info("applyExtractorTransformerSql innerFullObjectTemplate aggregateRawQuery", query);
    return { query, transformerRawQueriesObject, endResultName, combinerRawQueriesObject };
  }

import {
  AsyncQueryRunnerParams,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  ExtractorOrCombiner,
  LoggerInterface,
  MiroirLoggerFactory,
  resolveInnerTransformer,
  transformer_mustacheStringTemplate_apply,
  transformer_resolveReference,
  TransformerForRuntime,
  TransformerForRuntime_count,
  TransformerForRuntime_innerFullObjectTemplate,
  TransformerForRuntime_list_listPickElement,
  TransformerForRuntime_objectEntries,
  TransformerForRuntime_objectValues,
  TransformerForRuntime_unique
} from "miroir-core";
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
).then((logger: LoggerInterface) => {
  log = logger;
});

export interface SqlStringForCombinerReturnType {
  sqlString: string;
  resultAccessPath?: (string | number)[];
}
// ################################################################################################
export function sqlStringForCombiner /*BoxedExtractorTemplateRunner*/(
  query: ExtractorOrCombiner,
  schema: string
): Domain2QueryReturnType<SqlStringForCombinerReturnType> {
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
        sqlString: result,
        resultAccessPath: [0],
      };
    }
    case "combinerByRelationReturningObjectList": {
      const result = `
      SELECT "${query.parentName}".* FROM "${schema}"."${query.parentName}", "${query.objectReference}"
      WHERE "${query.parentName}"."${query.AttributeOfListObjectToCompareToReferenceUuid}" = "${query.objectReference}"."uuid"`;
      return {
        sqlString: result,
        resultAccessPath: undefined,
      };
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

export type SqlStringForTransformerElementValue = {
  // sqlStringOrObject: string | Record<string, string>;
  sqlStringOrObject: string;
  resultAccessPath?: (string | number)[];
  encloseEndResultInArray?: boolean;
  extraWith?: { name: string; sql: string }[];
  type: "json" | "table" | "scalar";
  // queryParameters?: Record<string, { index: number; value: any }>;
  preparedStatementParameters?: any[];
};

// ################################################################################################
function resolveApplyTo(
  actionRuntimeTransformer: 
  // | TransformerForRuntime_constants
  // | TransformerForRuntime_InnerReference
  // | TransformerForRuntime_object_fullTemplate
  // | TransformerForRuntime_freeObjectTemplate
  // | TransformerForRuntime_object_alter
  | TransformerForRuntime_count
  | TransformerForRuntime_list_listPickElement
  // | TransformerForRuntime_list_listMapperToList
  // | TransformerForRuntime_mapper_listToObject
  // | TransformerForRuntime_mustacheStringTemplate
  | TransformerForRuntime_objectValues
  | TransformerForRuntime_objectEntries
  | TransformerForRuntime_unique
  //  | TransformerForRuntime_innerFullObjectTemplate,
  ,
  preparedStatementParametersIndex: number,
  queryParams: Record<string, any> = {},
  newFetchedData: Record<string, any> = {},
  topLevelTransformer: boolean = true
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  if (actionRuntimeTransformer.applyTo.referenceType =="referencedExtractor") {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForTransformer listPickElement not implemented for referencedExtractor",
    });
    
  }
  const referenceQuery = typeof actionRuntimeTransformer.applyTo.reference == "string"?sqlStringForTransformer(
    {
      transformerType: "constant",
      interpolation: "runtime",
      constantValue: actionRuntimeTransformer.applyTo.reference as any,
    },
    preparedStatementParametersIndex,
    queryParams,
    newFetchedData,
    true
  ):sqlStringForTransformer(
    actionRuntimeTransformer.applyTo.reference,
    preparedStatementParametersIndex,
    queryParams,
    newFetchedData,
    true
  );
  return referenceQuery;

}
// ################################################################################################
export function sqlStringForTransformer(
  actionRuntimeTransformer: TransformerForRuntime  | TransformerForRuntime_innerFullObjectTemplate,
  preparedStatementParametersIndex: number,
  queryParams: Record<string, any> = {},
  newFetchedData: Record<string, any> = {},
  topLevelTransformer: boolean = true
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  // TODO: DomainElement should be dependent type, the real type is hidden here
  log.info(
    "extractorTransformerSql called with actionRuntimeTransformer",
    JSON.stringify(actionRuntimeTransformer, null, 2)
  );

  // const resolvedReference = transformer_InnerReference_resolve( // TODO: REMOVE resolveContextReferenceDEFUNCT!!
  //   "build",
  //   { transformerType: "contextReference", referenceName },
  //   queryParams,
  //   newFetchedData
  // );


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
    case "newUuid": {
      return {
        type: "scalar",
        sqlStringOrObject: (topLevelTransformer ? "select " : "") + "gen_random_uuid()",
      };
    }
    case "mustacheStringTemplate": {
      // const renderSqlTemplate = (template: string): string =>{
      //   return template.replace(/{{\s*([^}]+?)\s*}}/g, (match, ...splits: any):string => {
      //     // Split the placeholder content by dot.
      //     log.info("sqlStringForTransformer mustacheStringTemplate match", JSON.stringify(match, null, 2));
      //     log.info("sqlStringForTransformer mustacheStringTemplate splits", JSON.stringify(splits, null, 2));
      //     const parts = splits[0].split('.').map((p:string) => p.trim());
      //     const result = parts.reduce((acc: string, part: string) => {
      //       if (acc === "") {
      //         return `"${part}"`;
      //       } else {
      //         return `${acc}->>"${part}"`; // using json object access. TODO: enable table.column access
      //       }
      //     }, "");
      //     return result;
      //   });
      // }
      const resolvedReference = transformer_mustacheStringTemplate_apply(
        "build",
        actionRuntimeTransformer,
        queryParams,
        newFetchedData
      )
      if (resolvedReference instanceof Domain2ElementFailed) {
        return resolvedReference;
      }
      // log.info("sqlStringForTransformer mustacheStringTemplate sqlQuery", sqlQuery);
      return {
        type: "scalar",
        sqlStringOrObject: `SELECT '${resolvedReference}' as "mustacheStringTemplate"`,
        resultAccessPath: topLevelTransformer ? [0, "mustacheStringTemplate"] : undefined,
      };
    }
    case "innerFullObjectTemplate":
    case "object_fullTemplate": {
      const referenceName: string =
        (actionRuntimeTransformer as any).referenceToOuterObject ??
        (actionRuntimeTransformer as any).referencedTransformer;

      const selectFields = actionRuntimeTransformer.definition
        .map(
          (f) => {
            const attributeValue = sqlStringForTransformer(f.attributeValue, preparedStatementParametersIndex, queryParams, newFetchedData, false);
            if (attributeValue instanceof Domain2ElementFailed) {
              return attributeValue;
            }
            
            const attributeKey = sqlStringForTransformer(f.attributeKey, preparedStatementParametersIndex, queryParams, newFetchedData, false);
            if (attributeKey instanceof Domain2ElementFailed) {
              return attributeKey;
            }

            return  attributeValue.sqlStringOrObject + // TODO: check for actual type of sqlStringOrObject
            " AS " +
            tokenQuote +
            attributeKey.sqlStringOrObject +
            tokenQuote
          }
        )
        .join(tokenSeparatorForSelect);

      const sqlResult = `SELECT row_to_json(t) AS "innerFullObjectTemplate" FROM ( SELECT ${selectFields} FROM "${referenceName}" ) t
      ${orderBy}`;
      log.info("sqlStringForTransformer innerFullObjectTemplate sqlResult", JSON.stringify(sqlResult));
      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters: [],
        resultAccessPath: [0, "innerFullObjectTemplate"],
        encloseEndResultInArray: true,
      };
      break;
    }
    case "mapperListToList": {
      /**
       * must take the rerferencedExtractor result and make it avaialable to elementTransformer, apply the elementTransformer to
       * each element of the list and return the sorted list of transformed elements
       */
      throw new Error("sqlStringForTransformer mapperListToList not implemented");
      // const referenceName:string = (actionRuntimeTransformer as any).referencedTransformer;
      // const sqlStringForElementTransformer = sqlStringForTransformer(actionRuntimeTransformer.elementTransformer, false);
      // // const sqlResult = `SELECT array_agg(${sqlStringForElementTransformer.sqlString}) AS "mapperListToList" FROM "${referenceName}" ${orderBy}`;
      // // log.info("extractorTransformerSql mapperListToList actionRuntimeTransformer.elementTransformer", actionRuntimeTransformer.elementTransformer);
      // log.info("extractorTransformerSql mapperListToList sqlStringForElementTransformer", JSON.stringify(sqlStringForElementTransformer, null, 2));
      // // const sqlResult = sqlStringForElementTransformer.sqlStringOrObject;

      // // we suppose we have an innerFullObjectTemplate inside the elementTransformer
      // if (actionRuntimeTransformer.elementTransformer.transformerType != "innerFullObjectTemplate") {
      //   throw new Error("extractorTransformerSql mapperListToList elementTransformer not innerFullObjectTemplate");
      // }

      // const innerQueryName = "inner_" + actionRuntimeTransformer.referenceToOuterObject;
      // // const sqlResult = `SELECT "${innerQueryName}".* FROM "${innerQueryName}"`
      // // const sqlResult = `SELECT "${innerQueryName}"."${
      // const subQueryColumnName = sqlStringForElementTransformer.resultAccessPath
      // ? sqlStringForElementTransformer.resultAccessPath.slice(1).join(".") : "*";
      // const resultColumns = actionRuntimeTransformer.elementTransformer.definition.map(
      //   (f:any) =>
      //     tokenQuote +  subQueryColumnName + tokenQuote + // TODO: check for actual type of sqlStringOrObject
      //     " -> " +
      //     stringQuote + sqlStringForTransformer(f.attributeKey, false).sqlStringOrObject + stringQuote +
      //     " AS " +
      //     tokenQuote + sqlStringForTransformer(f.attributeKey, false).sqlStringOrObject + tokenQuote
      // ).join(tokenSeparatorForSelect);

      // const sqlResult = `SELECT ${resultColumns} FROM "${innerQueryName}"`
      // return {
      //   elementType: "any",
      //   elementValue: {
      //     // sqlStringOrObject: sqlStringForElementTransformer.sqlStringOrObject,
      //     sqlStringOrObject: sqlResult,
      //     extraWith: [
      //       {
      //         name: actionRuntimeTransformer.referenceToOuterObject,
      //         sql: `SELECT "${referenceName}".* FROM "${referenceName}"`,
      //       },
      //       {
      //         name: innerQueryName,
      //         sql: sqlStringForElementTransformer.sqlStringOrObject,
      //       }
      //       // {
      //       //   name: actionRuntimeTransformer.elementTransformer.referenceToOuterObject,
      //       //   sql: `SELECT "${referenceName}"."${
      //       //     sqlStringForElementTransformer.resultAccessPath
      //       //       ? sqlStringForElementTransformer.resultAccessPath.slice(1).join(".") // TODO: HACK! HACK!
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
      const referenceQuery = resolveApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersIndex,
        queryParams,
        newFetchedData,
        topLevelTransformer
      );

      log.info("sqlStringForTransformer listPickElement found applyTo", JSON.stringify(referenceQuery, null, 2));
      if (referenceQuery instanceof Domain2ElementFailed) {
        return referenceQuery;
      }

      if (referenceQuery.type != "json") {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForTransformer listPickElement referenceQuery not json",
        });
      }
      const limit = actionRuntimeTransformer.index;
      if (actionRuntimeTransformer.orderBy) {
        const sqlResult = 
`
SELECT (
  jsonb_agg(
    "listPickElement_applyTo_array" ORDER BY (
      "listPickElement_applyTo_array" ->> '${actionRuntimeTransformer.orderBy}'
    )::"any"
  ) ->> ${limit}
)::jsonb AS "listPickElement" 
FROM
  (${referenceQuery.sqlStringOrObject}) AS "listPickElement_applyTo", 
  LATERAL jsonb_array_elements("listPickElement_applyTo"."${(referenceQuery as any).resultAccessPath[1]}") AS "listPickElement_applyTo_array"
`;
        return {
          type: "json",
          sqlStringOrObject: sqlResult,
          preparedStatementParameters: [],
          resultAccessPath: [0, "listPickElement"],
        };
      } else {
      const sqlResult = 
`SELECT "listPickElement_applyTo"."${(referenceQuery as any).resultAccessPath[1]}" ->> ${limit} AS "listPickElement" 
FROM (${referenceQuery.sqlStringOrObject}) AS "listPickElement_applyTo"
`;
      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters: [],
        resultAccessPath: [0, "listPickElement"],
      };
    }
      break;
    }
    case "constantUuid": {
      return {
        type: "scalar",
        sqlStringOrObject: topLevelTransformer
          ? `select '${actionRuntimeTransformer.constantUuidValue}' as constantuuid`
          : `'${actionRuntimeTransformer.constantUuidValue}'`,
        preparedStatementParameters: [],
        resultAccessPath: topLevelTransformer ? [0, "constantuuid"] : undefined,
      };
      break;
    }
    case "constantString": {
      // Calculate the next parameter index
      const paramIndex = preparedStatementParametersIndex + 1;
      // Append the constant string value
      // const newPreparedStatementParameters = [...preparedStatementParameters, actionRuntimeTransformer.constantStringValue];
      // preparedStatementParametersIndex.push(actionRuntimeTransformer.constantStringValue)
      return {
        type: "scalar",
        sqlStringOrObject: topLevelTransformer
          ? `select $${paramIndex}::varchar as constantstring`
          : `$${paramIndex}::varchar`,
        preparedStatementParameters: [actionRuntimeTransformer.constantStringValue],
        resultAccessPath: topLevelTransformer ? [0, "constantstring"] : undefined,
      };
      break;
    }
    case "constantObject": {
      const result =
        "SELECT '" +
        JSON.stringify(actionRuntimeTransformer.constantObjectValue).replace(/\\"/g, '"') +
        "'::jsonb as constantobject";
      log.info(
        "sqlStringForTransformer constantObject",
        actionRuntimeTransformer.constantObjectValue,
        "result",
        result
      );
      return {
        type: "json",
        sqlStringOrObject: result, resultAccessPath: [0, "constantobject"],
        preparedStatementParameters: [],
      };
      break;
    }
    case "constant": {
      switch (typeof actionRuntimeTransformer.constantValue) {
        case "string": {
          return {
            type: "json",
            sqlStringOrObject: topLevelTransformer
              ? `select '${actionRuntimeTransformer.constantValue}' as constantstring`
              : `'${actionRuntimeTransformer.constantValue}'`,
            preparedStatementParameters: [],
            resultAccessPath: topLevelTransformer ? [0, "constantstring"] : undefined,
          };
        }
        case "number":
        case "bigint": {
          return {
            type: "scalar",
            sqlStringOrObject: topLevelTransformer
              ? `select '${actionRuntimeTransformer.constantValue}' as constantnumber`
              : `'${actionRuntimeTransformer.constantValue}'`,
            preparedStatementParameters: [],
            resultAccessPath: topLevelTransformer ? [0, "constantnumber"] : undefined,
          };
        }
        case "object": {
          const resultString =
            "SELECT '" +
            JSON.stringify(actionRuntimeTransformer.constantValue).replace(/\\"/g, '"') +
            "'::jsonb as constantobject";
          log.info("sqlStringForTransformer constantObject", actionRuntimeTransformer.constantValue, "result=", resultString);
        return {
          type: "json",
          preparedStatementParameters: [],
          sqlStringOrObject: resultString, resultAccessPath: [0, "constantobject"],
        };
        }
        case "boolean":
        case "symbol":
        case "undefined":
        case "function": {
          throw new Error("sqlStringForTransformer constantValue not implemented: " + typeof actionRuntimeTransformer.constantValue);
          break;
        }
        default: {
          throw new Error("sqlStringForTransformer constantValue not implemented: " + typeof actionRuntimeTransformer.constantValue);
          break;
        }
      }
    }
    case "parameterReference":
    case "contextReference": {
      // TODO: only resolves references to static values, not to values obtained during the execution of the query
      const resolvedReference = transformer_resolveReference(
        "runtime",
        actionRuntimeTransformer,
        actionRuntimeTransformer.transformerType == "contextReference" ? "context" : "param",
        queryParams,
        newFetchedData
      )
      if (resolvedReference instanceof Domain2ElementFailed) {
        return resolvedReference;
      }
      const referenceQuery = sqlStringForTransformer(
        {
          transformerType: "constant",
          interpolation: "runtime",
          constantValue: resolvedReference as any,
        },
        preparedStatementParametersIndex,
        queryParams,
        newFetchedData,
        true
      );

      return referenceQuery;
      break;
    }
    case "objectEntries": {
      const referenceQuery = resolveApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersIndex,
        queryParams,
        newFetchedData,
        topLevelTransformer
      );
      if (referenceQuery instanceof Domain2ElementFailed) {
        return referenceQuery;
      }

      const extraWith:{ name: string; sql: string }[] = [{
        name: "innerQuery",
        sql: referenceQuery.sqlStringOrObject,
      }]
      const sqlResult = `SELECT json_agg(json_build_array(key, value)) AS "objectEntries" FROM "innerQuery", jsonb_each("innerQuery"."${(referenceQuery as any).resultAccessPath[1]}")`

      return {
        type: "json",
        sqlStringOrObject: sqlResult, resultAccessPath: [0, "objectEntries"], extraWith,
      };
      break;
    }
    case "objectValues": {
      const referenceQuery = resolveApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersIndex,
        queryParams,
        newFetchedData,
        topLevelTransformer
      );
      if (referenceQuery instanceof Domain2ElementFailed) {
        return referenceQuery;
      }

      const extraWith:{ name: string; sql: string }[] = [{
        name: "innerQuery",
        sql: referenceQuery.sqlStringOrObject,
      }]
      const sqlResult = `SELECT json_agg(value) AS "objectValues" FROM "innerQuery", jsonb_each("innerQuery"."${(referenceQuery as any).resultAccessPath[1]}")`

      return {
        type: "json",
        sqlStringOrObject: sqlResult, resultAccessPath: [0, "objectValues"], extraWith,
      };
      break;
    }
    case "objectDynamicAccess":
    case "freeObjectTemplate":
    case "objectAlter":
    case "listReducerToIndexObject": {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: JSON.stringify(actionRuntimeTransformer),
        failureMessage: "sqlStringForTransformer transformerType not implemented: " + actionRuntimeTransformer.transformerType,
      });
      // return {
      //   elementType: "failure",
      //   elementValue: {
      //     queryFailure: "QueryNotExecutable",
      //     query: JSON.stringify(actionRuntimeTransformer),
      //     failureMessage:
      //       "sqlStringForTransformer transformerType not implemented: " + actionRuntimeTransformer.transformerType,
      //   },
      // };
      break;
    }
    case "unique": {
      const referenceQuery = resolveApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersIndex,
        queryParams,
        newFetchedData,
        topLevelTransformer
      );
      if (referenceQuery instanceof Domain2ElementFailed) {
        return referenceQuery;
        
      }
      // const referenceName: string = (actionRuntimeTransformer as any).referencedTransformer;
      // if (!(actionRuntimeTransformer as any).referencedTransformer) {
      //   throw new Error("extractorTransformerSql unique missing referencedTransformer");
      // }
      log.info("extractorTransformerSql actionRuntimeTransformer.attribute", actionRuntimeTransformer.attribute);
      // TODO: resolve query.referencedTransformer.referenceName properly
      // WITH ${extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(", ")}
      const transformerSqlQuery = `SELECT DISTINCT ON ("${actionRuntimeTransformer.attribute}") "${actionRuntimeTransformer.attribute}" FROM "${referenceQuery.sqlStringOrObject}"
        ${orderBy}
      `;
      log.info("sqlStringForTransformer unique transformerRawQuery", JSON.stringify(transformerSqlQuery));
      return {
        type: "table",
        sqlStringOrObject: transformerSqlQuery,
        preparedStatementParameters: referenceQuery.preparedStatementParameters,
        resultAccessPath: undefined,
      };
      break;
    }
    case "count": {
      const referenceQuery = resolveApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersIndex,
        queryParams,
        newFetchedData,
        topLevelTransformer
      );
      if (referenceQuery instanceof Domain2ElementFailed) {
        return referenceQuery;
      }
      // const referenceName: string = (actionRuntimeTransformer as any).referencedTransformer;
      // if (!(actionRuntimeTransformer as any).referencedTransformer) {
      //   throw new Error("sqlStringForTransformer count missing referencedTransformer");
      // }
      log.info("sqlStringForTransformer count actionRuntimeTransformer.groupBy", actionRuntimeTransformer.groupBy);
      const transformerSqlQuery = actionRuntimeTransformer.groupBy
        ? `SELECT "${actionRuntimeTransformer.groupBy}", COUNT("uuid")::int FROM ${referenceQuery.sqlStringOrObject}
          GROUP BY "${actionRuntimeTransformer.groupBy}"
          ${orderBy}`
        : `SELECT COUNT("uuid")::int FROM "${referenceQuery.sqlStringOrObject}"
          ${orderBy}`;
      log.info("sqlStringForTransformer count transformerSqlQuery", transformerSqlQuery);
      return {
        type: "table",
        sqlStringOrObject: transformerSqlQuery, resultAccessPath: undefined,
        preparedStatementParameters: referenceQuery.preparedStatementParameters,
      };
      break;
    }
    default:
      break;
  }

  return new Domain2ElementFailed({
    queryFailure: "QueryNotExecutable",
    failureOrigin: ["sqlStringForTransformer"],
    query: actionRuntimeTransformer,
    failureMessage: "could not handle transformer",
  });
  // return {
  //   elementType: "failure",
  //   elementValue: {
  //     queryFailure: "QueryNotExecutable",
  //     failureOrigin: ["sqlStringForTransformer"],
  //     query: actionRuntimeTransformer,
  //     failureMessage: "could not handle transformer",
  //   },
  // };
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
export interface SqlStringForExtractorReturnType {
  query: string;
  preparedStatementParameters: any[];
  queryParameters?: any[];
  transformerRawQueriesObject: Record<string, SqlStringForTransformerElementValue>;
  endResultName: string;
  combinerRawQueriesObject: Record<string, SqlStringForTransformerElementValue>;
}
// ################################################################################################
export function sqlStringForQuery(
  selectorParams: AsyncQueryRunnerParams,
  schema: string,
  preparedStatementParameters: any[], 
): Domain2QueryReturnType<SqlStringForExtractorReturnType>  {
  const extractorRawQueries = Object.entries(selectorParams.extractor.extractors ?? {}).map(([key, value]) => {
    return [key, sqlStringForExtractor(value, schema)];
  });

  log.info("sqlStringForQuery extractorRawQueries", extractorRawQueries);

  const combinerRawQueries = Object.entries(selectorParams.extractor.combiners ?? {}).map(([key, value]) => {
    return [key, sqlStringForCombiner(value, schema)];
  });
  log.info("sqlStringForQuery combinerRawQueries", combinerRawQueries);

  const newPreparedStatementParameters = [...preparedStatementParameters];
  const transformerRawQueries: [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>][] =
    Object.entries(selectorParams.extractor.runtimeTransformers ?? {}).map(([key, value]) => {
      const transformerRawQuery = sqlStringForTransformer(
        value as TransformerForRuntime,
        newPreparedStatementParameters.length,
        selectorParams.extractor.queryParams,
        selectorParams.extractor.contextResults
      )
      if (!(transformerRawQuery instanceof Domain2ElementFailed) && transformerRawQuery.preparedStatementParameters) {
        newPreparedStatementParameters.push(...transformerRawQuery.preparedStatementParameters);
      }
      return [
        key,transformerRawQuery
      ]; // TODO: handle ExtendedExtractorForRuntime?
    });
  const foundError = transformerRawQueries.find((q) => q[1] instanceof Domain2ElementFailed);
  log.info("sqlStringForQuery transformerRawQueries", JSON.stringify(transformerRawQueries, null, 2));
  log.info("sqlStringForQuery found error in transformerRawQueries", JSON.stringify(foundError, null, 2));
  if (foundError) {
    return foundError[1] as Domain2ElementFailed;
  }

  // no errors were found in transformerRawQueries
  const cleanTransformerRawQueries = transformerRawQueries as any as [string, SqlStringForTransformerElementValue][];

  const combinerRawQueriesObject = Object.fromEntries(combinerRawQueries);
  const transformerRawQueriesObject: Record<string, SqlStringForTransformerElementValue> = Object.fromEntries(cleanTransformerRawQueries);
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
  const queryParameters: any[] = [];
  if (extractorRawQueries.length > 0) {
    queryParts.push(extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(tokenSeparatorForWith));
  }
  if (combinerRawQueries.length > 0) {
    queryParts.push(combinerRawQueries.map((q) => '"' + q[0] + '" AS (' + q[1] + " )").join(tokenSeparatorForWith));
  }
  if (transformerRawQueries.length > 0) {
    queryParts.push(
      cleanTransformerRawQueries
        .flatMap((transformerRawQuery) =>
          typeof transformerRawQuery[1] == "string"
            ? '"' + transformerRawQuery[0] + '" AS (' + transformerRawQuery[1] + " )"
            : (transformerRawQuery[1].extraWith
                ? transformerRawQuery[1].extraWith.map((extra: any) => '"' + extra.name + '" AS (' + extra.sql + " )").join(tokenSeparatorForWith) +
                  tokenSeparatorForWith
                : "") +
              '"' +
              transformerRawQuery[0] +
              '" AS (' +
              transformerRawQuery[1].sqlStringOrObject +
              " )"
        )
        .join(tokenSeparatorForWith)
    );
    // (transformerRawQueries as any as [string, SqlStringForTransformerElementValue][]).forEach(([index, value]) => {
    //   if (value.preparedStatementParameters) {
    //     preparedStatementParameters.push(...value.preparedStatementParameters);
    //   }
    // });
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
  log.info("sqlStringForQuery innerFullObjectTemplate aggregateRawQuery", query);
  return { query, preparedStatementParameters:newPreparedStatementParameters, transformerRawQueriesObject, endResultName, combinerRawQueriesObject };
}

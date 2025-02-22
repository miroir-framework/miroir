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
  TransformerForRuntime_object_fullTemplate,
  TransformerForRuntime_objectEntries,
  TransformerForRuntime_objectValues,
  TransformerForRuntime_unique,
} from "miroir-core";
import { RecursiveStringRecords } from "../4_services/SqlDbQueryTemplateRunner";
import { cleanLevel } from "../4_services/constants";
import { packageName } from "../constants";
import { getConstantSqlTypeMap, PostgresDataTypes } from "./Postgres";
import { getAttributeTypesFromJzodSchema, jzodToPostgresTypeMap } from "./jzodSchema";

export const stringQuote = "'";
export const tokenQuote = '"';
export const tokenComma = ",";
export const tokenSeparatorForSelect = tokenComma + " ";
export const tokenSeparatorForWith = tokenComma + " ";
export const tokenSeparatorForWithRtn = tokenSeparatorForWith + "\n";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "sqlGenerator")
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface SqlContextEntry {
  type: "json" | "scalar" | "table"; resultAccessPath?: (string | number)[]
}

// ################################################################################################
export interface SqlStringForCombinerReturnType {
  sqlString: string;
  resultAccessPath?: (string | number)[];
}

function getSqlTypeForValue(
  value?: any,
  // actionRuntimeTransformer: { transformerType: "constant"; value?: any; interpolation: "runtime"; }, 
  // sqlTargetType: string, label: string
) {
  let sqlTargetType: PostgresDataTypes;
  let label: string;
  switch (typeof value) {
    case "string": {
      sqlTargetType = "text";
      label = "constantString";
      break;
    }
    case "number": {
      sqlTargetType = "double precision";
      label = "constantNumber";
      break;
    }
    case "bigint": {
      sqlTargetType = "double precision";
      label = "constantBigint";
      break;
    }
    case "boolean": {
      sqlTargetType = "boolean";
      label = "constantBoolean";
      break;
    }
    case "object": {
      sqlTargetType = "jsonb";
      label = "constantObject";
      break;
    }
    case "undefined": {
      sqlTargetType = "jsonb";
      label = "constantObject";
      break;
    }
    case "symbol":
    case "function":
    default: {
      throw new Error(
        "Unsupported constant type in 'constant' transformer: " + typeof value
      );
      break;
    }
  }
  return { sqlTargetType, label };
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
  sqlStringOrObject: string;
  resultAccessPath?: (string | number)[];
  encloseEndResultInArray?: boolean;
  extraWith?: { name: string; sql: string }[];
  type: "json" | "table" | "scalar";
  preparedStatementParameters?: any[];
};

// ################################################################################################
function resolveApplyTo(
  actionRuntimeTransformer:
    | TransformerForRuntime_object_fullTemplate
    | TransformerForRuntime_count
    | TransformerForRuntime_list_listPickElement
    | TransformerForRuntime_objectValues
    | TransformerForRuntime_objectEntries
    | TransformerForRuntime_unique
    | TransformerForRuntime_innerFullObjectTemplate,
  preparedStatementParametersIndex: number,
  queryParams: Record<string, any> = {},
  newFetchedData: Record<string, any> = {},
  topLevelTransformer: boolean = true
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  if (actionRuntimeTransformer.applyTo.referenceType == "referencedExtractor") {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForTransformer listPickElement not implemented for referencedExtractor",
    });
  }
  const referenceQuery =
    typeof actionRuntimeTransformer.applyTo.reference == "string"
      ? sqlStringForTransformer(
          {
            transformerType: "constant",
            interpolation: "runtime",
            value: actionRuntimeTransformer.applyTo.reference as any,
          },
          preparedStatementParametersIndex,
          queryParams,
          newFetchedData,
          true
        )
      : sqlStringForTransformer(
          actionRuntimeTransformer.applyTo.reference,
          preparedStatementParametersIndex,
          queryParams,
          newFetchedData,
          true
        );
  return referenceQuery;
}

// ################################################################################################
const getConstantSql = (
  transformer: any,
  preparedStatementParametersCount: number,
  topLevelTransformer: boolean,
  targetType: "json" | "scalar",
  sqlTargetType: PostgresDataTypes,
  label: string
): Domain2QueryReturnType<SqlStringForTransformerElementValue> => {
  const paramIndex = preparedStatementParametersCount + 1;
  return {
    type: targetType,
    sqlStringOrObject: topLevelTransformer
      ? `select $${paramIndex}::${sqlTargetType} AS "${label}"`
      : `$${paramIndex}::${sqlTargetType}`,
    preparedStatementParameters: [targetType == "json" ? JSON.stringify(transformer.value) : transformer.value],
    resultAccessPath: topLevelTransformer ? [0, label] : undefined,
  };
};


// ################################################################################################
export function sqlStringForTransformer(
  actionRuntimeTransformer: TransformerForRuntime | TransformerForRuntime_innerFullObjectTemplate,
  preparedStatementParametersCount: number,
  queryParams: Record<string, any> = {},
  definedContextEntries: Record<string, SqlContextEntry> = {},
  topLevelTransformer: boolean = true,
  withClauseColumnName?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  log.info(
    "extractorTransformerSql called with actionRuntimeTransformer",
    JSON.stringify(actionRuntimeTransformer, null, 2)
  );

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
      const resolvedReference = transformer_mustacheStringTemplate_apply(
        "build",
        actionRuntimeTransformer,
        queryParams,
        definedContextEntries
      );
      if (resolvedReference instanceof Domain2ElementFailed) {
        return resolvedReference;
      }
      // log.info("sqlStringForTransformer mustacheStringTemplate sqlQuery", sqlQuery);
      return {
        type: "scalar",
        // sqlStringOrObject: `SELECT '${resolvedReference}'::text as "mustacheStringTemplate"`, // TODO: determine type
        sqlStringOrObject: `SELECT '${resolvedReference}' as "mustacheStringTemplate"`, // TODO: determine type
        resultAccessPath: topLevelTransformer ? [0, "mustacheStringTemplate"] : undefined,
      };
    }
    case "innerFullObjectTemplate":
    case "object_fullTemplate": {
      let newPreparedStatementParametersCount = preparedStatementParametersCount;
      const resolvedApplyTo = resolveApplyTo(
        actionRuntimeTransformer,
        newPreparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        topLevelTransformer
      );
      if (resolvedApplyTo instanceof Domain2ElementFailed) {
        return resolvedApplyTo;
      }

      let preparedStatementParameters: any[] = resolvedApplyTo.preparedStatementParameters ?? [];
      const extraWith: { name: string; sql: string }[] = [
        {
          name: "applyTo",
          sql: resolvedApplyTo.sqlStringOrObject,
        },
        ...(resolvedApplyTo.extraWith ?? []),
      ];
      newPreparedStatementParametersCount += preparedStatementParameters.length;
      actionRuntimeTransformer.definition.forEach((f, index) => {
        const attributeValue = sqlStringForTransformer(
          f.attributeValue,
          newPreparedStatementParametersCount,
          queryParams,
          definedContextEntries,
          true,
          `attributeValue${index}`, 
        );
        if (attributeValue instanceof Domain2ElementFailed) {
          return attributeValue;
        }
        if (attributeValue.preparedStatementParameters) {
          preparedStatementParameters = [...preparedStatementParameters, ...attributeValue.preparedStatementParameters];
          newPreparedStatementParametersCount += attributeValue.preparedStatementParameters.length;
        }

        const attributeKey = sqlStringForTransformer(
          f.attributeKey,
          newPreparedStatementParametersCount,
          queryParams,
          definedContextEntries,
          true,
          `attributeKey${index}`, 

        );
        if (attributeKey instanceof Domain2ElementFailed) {
          return attributeKey;
        }
        if (attributeKey.preparedStatementParameters) {
          preparedStatementParameters = [...preparedStatementParameters, ...attributeKey.preparedStatementParameters];
          newPreparedStatementParametersCount += attributeKey.preparedStatementParameters.length;
        }

        extraWith.push({
          name: "attributeKey" + index,
          sql: attributeKey.sqlStringOrObject,
        });
        extraWith.push({
          name: "attributeValue" + index,
          sql: attributeValue.sqlStringOrObject,
        });
      });

      // const { sqlTargetType, label } = getSqlTypeForValue(actionRuntimeTransformer.value);

      // Build a new object with keys and corresponding values from the definition.
      const objectAttributes = actionRuntimeTransformer.definition
        .map(
          (e, index) =>
            `"attributeKey${index}"."attributeKey${index
              // ["constantUuid"].includes(e.attributeKey.transformerType)
              //   ? "constantParam"
              //   // : (e.attributeKey as any).referenceName
              //   : 
                // e.attributeKey.transformerType
            }", "attributeValue${index}".attributeValue"${index
              // ["constantUuid"].includes(e.attributeValue.transformerType)
              //   ? "constantParam"
              //   // : (e.attributeValue as any).referenceName
              //   : 
                // e.attributeValue.transformerType
            }"`
        )
        .join(", ");
      const objectAttributes_With_references = actionRuntimeTransformer.definition
        .map((e, index) => {
          return `"attributeKey${index}", "attributeValue${index}"`;
        })
        .join(", ");
      const sqlResult = `
SELECT jsonb_build_object(${objectAttributes}) AS "innerFullObjectTemplate"
FROM ${objectAttributes_With_references}
${orderBy}
`;
      // const sqlResult = `SELECT jsonb_build_object(${objectAttributes}) AS "innerFullObjectTemplate" FROM ${objectAttributes_With_references} GROUP BY ${objectAttributes} ${orderBy}`;
      log.info("sqlStringForTransformer innerFullObjectTemplate sqlResult", JSON.stringify(sqlResult));
      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters,
        resultAccessPath: [0, "innerFullObjectTemplate"],
        extraWith,
      };
      break;
    }
    case "mapperListToList": {
      /**
       * must take the rerferencedExtractor result and make it avaialable to elementTransformer, apply the elementTransformer to
       * each element of the list and return the sorted list of transformed elements
       */
      // throw new Error("sqlStringForTransformer mapperListToList not implemented");
      const referenceName: string = (actionRuntimeTransformer as any).referencedTransformer;
      const sqlStringForElementTransformer = sqlStringForTransformer(
        actionRuntimeTransformer.elementTransformer,
        preparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        false
      );

      log.info(
        "sqlStringForTransformer mapperListToList found applyTo",
        JSON.stringify(sqlStringForElementTransformer, null, 2)
      );
      if (sqlStringForElementTransformer instanceof Domain2ElementFailed) {
        return sqlStringForElementTransformer;
      }

      switch (sqlStringForElementTransformer.type) {
        case "json": {
          //   const subQueryColumnName = sqlStringForElementTransformer.resultAccessPath
          //     ? sqlStringForElementTransformer.resultAccessPath.slice(1).join(".")
          //     : "*";
          //   const resultColumns = actionRuntimeTransformer.elementTransformer.definition.map(
          //     (f:any) =>
          //       tokenQuote +  subQueryColumnName + tokenQuote + // TODO: check for actual type of sqlStringOrObject
          //       " -> " +
          //       stringQuote + sqlStringForTransformer(f.attributeKey, false).sqlStringOrObject + stringQuote +
          //       " AS " +
          //       tokenQuote + sqlStringForTransformer(f.attributeKey, false).sqlStringOrObject + tokenQuote
          //   ).join(tokenSeparatorForSelect);
          // const sqlResult = `SELECT jsonb_agg(json_build_object(${resultColumns})) AS "mapperListToList" FROM "${referenceName}" ${orderBy}`;
          const sqlResult = `SELECT * AS "mapperListToList" FROM sqlStringForElementTransformer.sqlStringOrObject`;
          return {
            type: "json",
            sqlStringOrObject: sqlResult,
            extraWith: [
              {
                name: referenceName,
                sql: `SELECT "${referenceName}".* FROM "${referenceName}"`,
              },
            ],
            resultAccessPath: [0, "mapperListToList"],
          };
          break;
        }
        case "table": {
          // throw new Error("sqlStringForTransformer mapperListToList not implemented for table");
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer mapperListToList not implemented for table",
          });

          // const column = sqlStringForElementTransformer.resultAccessPath?"." + sqlStringForElementTransformer.resultAccessPath.join("."): "";
          // const sqlResult = `SELECT * FROM (${sqlStringForElementTransformer.sqlStringOrObject}) AS "mapperListToList" ORDER BY ${column}`;
          // return {
          //   elementType: "any",
          //   elementValue: {
          //     sqlStringOrObject: sqlResult,
          //     resultAccessPath: undefined,
          //   },
          // };
          break;
        }
        case "scalar": {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer mapperListToList referenceQuery result is scalar, not json",
          });
          break;
        }
        default: {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer mapperListToList referenceQuery not json",
          });
          break;
        }
      }
      // const sqlResult = `SELECT array_agg(${sqlStringForElementTransformer.sqlString}) AS "mapperListToList" FROM "${referenceName}" ${orderBy}`;
      // log.info("extractorTransformerSql mapperListToList actionRuntimeTransformer.elementTransformer", actionRuntimeTransformer.elementTransformer);
      log.info(
        "extractorTransformerSql mapperListToList sqlStringForElementTransformer",
        JSON.stringify(sqlStringForElementTransformer, null, 2)
      );
      // const sqlResult = sqlStringForElementTransformer.sqlStringOrObject;

      // we suppose we have an innerFullObjectTemplate inside the elementTransformer
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
        preparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        topLevelTransformer
      );

      log.info("sqlStringForTransformer listPickElement found applyTo", JSON.stringify(referenceQuery, null, 2));
      if (referenceQuery instanceof Domain2ElementFailed) {
        return referenceQuery;
      }

      const limit = actionRuntimeTransformer.index;
      let sqlResult;
      switch (referenceQuery.type) {
        case "json": {
          if (actionRuntimeTransformer.orderBy) {
            sqlResult = `
SELECT (
  jsonb_agg(
    "listPickElement_applyTo_array" ORDER BY (
      "listPickElement_applyTo_array" ->> '${actionRuntimeTransformer.orderBy}'
    )::"any"
  ) ->> ${limit}
)::jsonb AS "listPickElement" 
FROM
  (${referenceQuery.sqlStringOrObject}) AS "listPickElement_applyTo", 
  LATERAL jsonb_array_elements("listPickElement_applyTo"."${
    (referenceQuery as any).resultAccessPath[1]
  }") AS "listPickElement_applyTo_array"
`;
          } else {
            sqlResult = `SELECT "listPickElement_applyTo"."${
              (referenceQuery as any).resultAccessPath[1]
            }" ->> ${limit} AS "listPickElement" 
FROM (${referenceQuery.sqlStringOrObject}) AS "listPickElement_applyTo"
`;
          }
          break;
        }
        case "table": {
          // const column = referenceQuery.resultAccessPath?"." + referenceQuery.resultAccessPath.join("."): "";
          if (actionRuntimeTransformer.orderBy) {
            sqlResult = `SELECT * FROM (${referenceQuery.sqlStringOrObject}) AS "listPickElement" ORDER BY ${actionRuntimeTransformer.orderBy} LIMIT 1 OFFSET ${limit}`;
          } else {
            sqlResult = `SELECT * FROM (${referenceQuery.sqlStringOrObject}) AS "listPickElement" LIMIT 1 OFFSET ${limit}`;
          }
          return {
            type: "json",
            sqlStringOrObject: sqlResult,
            preparedStatementParameters: referenceQuery.preparedStatementParameters,
            resultAccessPath: [0, ...(referenceQuery.resultAccessPath ?? [])],
          };
          break;
        }
        case "scalar": {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer listPickElement referenceQuery result is scalar, not json",
          });
          break;
        }
        default: {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer listPickElement referenceQuery not json",
          });
          break;
        }
      }
      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters: referenceQuery.preparedStatementParameters,
        resultAccessPath: [0, "listPickElement"],
      };
      break;
    }
    case "constantArray":
    case "constantUuid":
    case "constantBoolean":
    case "constantBigint":
    case "constantNumber":
    case "constantString":
    case "constantObject": {
      const getSqlParams = getConstantSqlTypeMap[actionRuntimeTransformer.transformerType];
      return getConstantSql(
        actionRuntimeTransformer,
        preparedStatementParametersCount,
        topLevelTransformer,
        getSqlParams.targetType,
        getSqlParams.sqlTargetType,
        withClauseColumnName??getSqlParams.label
      );
      break;
    }
    case "constantAsExtractor": {
      // TODO: deal with whole set of transformers, not just constant values.
      const jsTypeToConstantType: Record<string, string> = {
        string: "constantString",
        number: "constantNumber",
        bigint: "constantBigint",
        boolean: "constantBoolean",
        object: "constantObject",
      };
      switch (typeof actionRuntimeTransformer.value) {
        case "string":
        case "number":
        case "bigint":
        case "boolean": {
          const getSqlParams = getConstantSqlTypeMap[jsTypeToConstantType[actionRuntimeTransformer.transformerType]];
          return getConstantSql(
            actionRuntimeTransformer,
            preparedStatementParametersCount,
            topLevelTransformer,
            getSqlParams.targetType,
            getSqlParams.sqlTargetType,
            getSqlParams.label
          );
          break;
        }
        case "object": {
          const paramIndex = preparedStatementParametersCount + 1;
          // if (Array.isArray(actionRuntimeTransformer.value)) {
          // array of objects or array of scalars
          if (!actionRuntimeTransformer.valueJzodSchema) {
            return new Domain2ElementFailed({
              queryFailure: "QueryNotExecutable",
              query: actionRuntimeTransformer as any,
              failureMessage: "sqlStringForTransformer constantAsExtractor no schema for array",
            });
          }
          if (actionRuntimeTransformer.valueJzodSchema.type == "object") {
            // object which attributes are returned as columns on a single row, or array of objects which attributes are returned as columns on many rows (one row per object)
            const recordFunction = Array.isArray(actionRuntimeTransformer.value)
              ? "jsonb_to_recordset"
              : "jsonb_to_record";
            const attributeTypes = getAttributeTypesFromJzodSchema(actionRuntimeTransformer.valueJzodSchema);
            const selectFields = Object.entries(attributeTypes)
              .map(([key, value]) => {
                return `"${key}" ${value}`;
              })
              .join(tokenSeparatorForSelect);
            return {
              type: "table",
              sqlStringOrObject: `SELECT * FROM ${recordFunction}($${paramIndex}::jsonb) AS x(${selectFields})`,
              preparedStatementParameters: [JSON.stringify(actionRuntimeTransformer.value)],
            };
          } else {
            // scalar or array of scalars
            if (!Object.hasOwn(jzodToPostgresTypeMap, actionRuntimeTransformer.valueJzodSchema.type)) {
              return new Domain2ElementFailed({
                queryFailure: "QueryNotExecutable",
                query: actionRuntimeTransformer as any,
                failureMessage:
                  "sqlStringForTransformer constantAsExtractor no sql type corresponding go elements of array with scalar type:" +
                  actionRuntimeTransformer.valueJzodSchema.type,
              });
            }
            // const sqlTargetType = (jzodToPostgresTypeMap as any)[actionRuntimeTransformer.valueJzodSchema.type].sqlTargetType;
            if (Array.isArray(actionRuntimeTransformer.value)) {
              return {
                type: "table",
                sqlStringOrObject: `SELECT * FROM jsonb_array_elements($${paramIndex}::jsonb) AS ${actionRuntimeTransformer.transformerType}`,
                preparedStatementParameters: [JSON.stringify(actionRuntimeTransformer.value)],
                resultAccessPath: ["value"],
              };
            } else {
              return {
                type: "table",
                sqlStringOrObject: `SELECT $${paramIndex} AS ${actionRuntimeTransformer.transformerType}`,
                preparedStatementParameters: [JSON.stringify(actionRuntimeTransformer.value)],
              };
            }
          }
          // } else {
          //   return {
          //     type: "table",
          //     sqlStringOrObject: `SELECT * FROM jsonb_to_record($${paramIndex}::jsonb) AS x(${selectFields})`,
          //     preparedStatementParameters: [JSON.stringify(actionRuntimeTransformer.value)],
          //   };
          // }
        }
        case "symbol":
        case "undefined":
        case "function":
        default: {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer constantAsExtractor not implemented",
          });
          break;
        }
      }
      // return new Domain2ElementFailed({
      //   queryFailure: "QueryNotExecutable",
      //   query: actionRuntimeTransformer as any,
      //   failureMessage: "sqlStringForTransformer constantAsExtractor not implemented",
      // });
      break;
    }
    case "constant": {
      const targetSqlType = typeof actionRuntimeTransformer.value === "object" ? "json" : "scalar";
      // let sqlTargetType: PostgresDataTypes;
      // let label: string;
      const { sqlTargetType, label } = getSqlTypeForValue(actionRuntimeTransformer.value);
      return getConstantSql(
        actionRuntimeTransformer,
        preparedStatementParametersCount,
        topLevelTransformer,
        targetSqlType,
        sqlTargetType,
        // "constantParam"
        withClauseColumnName??label,
      );
    }
    case "parameterReference": {
      // this resolves references to static values, passed as parameters upon executing of the query
      // TODO: resolve each parameter as WITH clause, then only call the name of the clause in each reference?
      const resolvedReference = transformer_resolveReference(
        "runtime",
        actionRuntimeTransformer,
        "param",
        queryParams,
        definedContextEntries
      );
      if (resolvedReference instanceof Domain2ElementFailed) {
        return resolvedReference;
      }
      const referenceQuery = sqlStringForTransformer(
        {
          transformerType: "constant",
          interpolation: "runtime",
          value: resolvedReference as any,
        },
        preparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        true
      );

      return referenceQuery;
      break;
    }
    case "contextReference": {
      const referenceName = actionRuntimeTransformer.referenceName??((actionRuntimeTransformer.referencePath??[])[0]);
      const definedContextEntry = definedContextEntries[referenceName];
      if (!definedContextEntry) {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForTransformer contextReference not found in definedContextEntries",
        });
      }
      const resultAccessPath = [
        ...(definedContextEntry.resultAccessPath ?? []),
        ...(actionRuntimeTransformer?.referencePath?.slice(1) ?? []),
      ];
      // const resultAccessPathString = resultAccessPath.map((e) => `"${e}"`).join(".");
      const resultAccessPathString = resultAccessPath.map((e,index) => `${index==0?'"'+ e + '"': "'" + e + "'"}`).join(" -> ");
      if (topLevelTransformer) {
        return {
          type: definedContextEntry.type,
          sqlStringOrObject: `
SELECT ${resultAccessPathString.length>0?resultAccessPathString:"*"} AS "${referenceName}"
FROM "${referenceName}"`,
          resultAccessPath:[0, referenceName],
        };
      } else {
        return {
          type: definedContextEntry.type,
          sqlStringOrObject: `"${referenceName}"${
            resultAccessPathString.length > 0 ? "." + resultAccessPathString : ""
          }`,
        };
      }
      // TODO: only resolves references to static values, not to values obtained during the execution of the query
      // const resolvedReference = transformer_resolveReference(
      //   "runtime",
      //   actionRuntimeTransformer,
      //   actionRuntimeTransformer.transformerType == "contextReference" ? "context" : "param",
      //   queryParams,
      //   newFetchedData
      // );
      // if (resolvedReference instanceof Domain2ElementFailed) {
      //   return resolvedReference;
      // }
      // const referenceQuery = sqlStringForTransformer(
      //   {
      //     transformerType: "constant",
      //     interpolation: "runtime",
      //     value: resolvedReference as any,
      //   },
      //   preparedStatementParametersIndex,
      //   queryParams,
      //   newFetchedData,
      //   true
      // );

      // return referenceQuery;
      break;
    }
    case "objectEntries": {
      const applyTo = resolveApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        topLevelTransformer
      );
      if (applyTo instanceof Domain2ElementFailed) {
        return applyTo;
      }

      const extraWith: { name: string; sql: string }[] = [
        {
          name: "innerQuery",
          sql: applyTo.sqlStringOrObject,
        },
      ];
      const sqlResult = `SELECT json_agg(json_build_array(key, value)) AS "objectEntries" FROM "innerQuery", jsonb_each("innerQuery"."${
        (applyTo as any).resultAccessPath[1]
      }")`;

      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters: applyTo.preparedStatementParameters,
        resultAccessPath: [0, "objectEntries"],
        extraWith,
      };
      break;
    }
    case "objectValues": {
      const applyTo = resolveApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        topLevelTransformer
      );
      if (applyTo instanceof Domain2ElementFailed) {
        return applyTo;
      }

      const extraWith: { name: string; sql: string }[] = [
        {
          name: "innerQuery",
          sql: applyTo.sqlStringOrObject,
        },
      ];
      const sqlResult = `SELECT json_agg(value) AS "objectValues" FROM "innerQuery", jsonb_each("innerQuery"."${
        (applyTo as any).resultAccessPath[1]
      }")`;

      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters: applyTo.preparedStatementParameters,
        resultAccessPath: [0, "objectValues"],
        extraWith,
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
        failureMessage:
          "sqlStringForTransformer transformerType not implemented: " + actionRuntimeTransformer.transformerType,
      });
      break;
    }
    case "unique": {
      const referenceQuery = resolveApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        topLevelTransformer
      );
      if (referenceQuery instanceof Domain2ElementFailed) {
        return referenceQuery;
      }
      switch (referenceQuery.type) {
        case "json": {
          return {
            type: "json",
            sqlStringOrObject: `
SELECT jsonb_agg(t."unique_applyTo_array") AS "unique_objects"
FROM (
  SELECT DISTINCT ON ("unique_applyTo_array"->>'${actionRuntimeTransformer.attribute}') "unique_applyTo_array"
  FROM (${referenceQuery.sqlStringOrObject}) AS "unique_applyTo", 
  LATERAL jsonb_array_elements("unique_applyTo"."${
    (referenceQuery as any).resultAccessPath[1]
  }") AS "unique_applyTo_array"
  ORDER BY "unique_applyTo_array"->>'${actionRuntimeTransformer.attribute}'
) t
`,
            preparedStatementParameters: referenceQuery.preparedStatementParameters,
            resultAccessPath: [0, "unique_objects"],
          };
          break;
        }
        case "table": {
          const transformerSqlQuery = `
SELECT DISTINCT ON ("unique_applyTo"."${actionRuntimeTransformer.attribute}") "${actionRuntimeTransformer.attribute}" 
FROM (${referenceQuery.sqlStringOrObject}) AS "unique_applyTo"
${orderBy}
`;
          return {
            type: "table",
            sqlStringOrObject: transformerSqlQuery,
            preparedStatementParameters: referenceQuery.preparedStatementParameters,
            resultAccessPath: undefined,
          };
          break;
        }
        case "scalar": {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer unique referenceQuery result is scalar, not json",
          });
          break;
        }
        default:
          break;
      }
      // if(referenceQuery.type == "table") {
      // }
      // log.info("extractorTransformerSql actionRuntimeTransformer.attribute", actionRuntimeTransformer.attribute);
      // log.info("sqlStringForTransformer unique transformerRawQuery", JSON.stringify(transformerSqlQuery));

      // return {
      //   type: "table",
      //   sqlStringOrObject: transformerSqlQuery,
      //   preparedStatementParameters: referenceQuery.preparedStatementParameters,
      //   resultAccessPath: undefined,
      // };
      break;
    }
    case "count": {
      const referenceQuery = resolveApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        topLevelTransformer
      );
      if (referenceQuery instanceof Domain2ElementFailed) {
        return referenceQuery;
      }
      switch (referenceQuery.type) {
        case "json": {
          return {
            type: "json",
            sqlStringOrObject: actionRuntimeTransformer.groupBy
              ? `
SELECT json_object_agg(key, cnt) AS "count_object"
FROM (
  SELECT value ->> '${actionRuntimeTransformer.groupBy}' AS key, COUNT(value ->> '${
                  actionRuntimeTransformer.groupBy
                }')::int AS cnt
  FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo",
      LATERAL jsonb_array_elements("count_applyTo"."${
        (referenceQuery as any).resultAccessPath[1]
      }") AS "count_applyTo_array"
  GROUP BY value ->> '${actionRuntimeTransformer.groupBy}'
) t
`
              : `
SELECT json_build_object('count', COUNT(*)::int) AS "count_object"
FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo",
    LATERAL jsonb_array_elements("count_applyTo"."${
      (referenceQuery as any).resultAccessPath[1]
    }") AS "count_applyTo_array"
`,
            preparedStatementParameters: referenceQuery.preparedStatementParameters,
            resultAccessPath: [0, "count_object"],
            encloseEndResultInArray: true,
          };
          break;
        }
        case "table": {
          const transformerSqlQuery = actionRuntimeTransformer.groupBy
            ? `SELECT "${actionRuntimeTransformer.groupBy}", COUNT(*)::int FROM ${referenceQuery.sqlStringOrObject}
            GROUP BY "${actionRuntimeTransformer.groupBy}"
`
            : `SELECT COUNT(*)::int FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo"
`;
          log.info("sqlStringForTransformer count transformerSqlQuery", transformerSqlQuery);
          return {
            type: "table",
            sqlStringOrObject: transformerSqlQuery,
            resultAccessPath: undefined,
            preparedStatementParameters: referenceQuery.preparedStatementParameters,
          };
          break;
        }
        case "scalar": {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer count referenceQuery result is scalar",
          });
          break;
        }
        default: {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer count referenceQuery result is not determined",
          });
          break;
        }
      }
      // log.info("sqlStringForTransformer count actionRuntimeTransformer.groupBy", actionRuntimeTransformer.groupBy);
      break;
    }
    default:
      break;
  }

  return new Domain2ElementFailed({
    queryFailure: "QueryNotExecutable",
    failureOrigin: ["sqlStringForTransformer"],
    query: actionRuntimeTransformer as any,
    failureMessage: "could not handle transformer",
  });
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

// export interface PreparedStatementParameter {
export interface QueryParameterSqlWithClause {
  name: string;
  sql: string;
  convertedParam: SqlStringForTransformerElementValue;
}

// ################################################################################################
export function sqlStringForQuery(
  selectorParams: AsyncQueryRunnerParams,
  schema: string,
  preparedStatementParameters: any[]
): Domain2QueryReturnType<SqlStringForExtractorReturnType> {
  const extractorRawQueries = Object.entries(selectorParams.extractor.extractors ?? {}).map(([key, value]) => {
    return [key, sqlStringForExtractor(value, schema)];
  });

  log.info("sqlStringForQuery extractorRawQueries", extractorRawQueries);

  const combinerRawQueries = Object.entries(selectorParams.extractor.combiners ?? {}).map(([key, value]) => {
    return [key, sqlStringForCombiner(value, schema)];
  });
  log.info("sqlStringForQuery combinerRawQueries", combinerRawQueries);

  let newPreparedStatementParameters: any[]= [...preparedStatementParameters];
  const queryParamsWithClauses: QueryParameterSqlWithClause[] = Object.entries(
    selectorParams.extractor.queryParams ?? {}
  ).map(([key, value]) => {
    const convertedParam = sqlStringForTransformer(
      {
        transformerType: "constant",
        interpolation: "runtime",
        value: value,
      },
      newPreparedStatementParameters.length,
      selectorParams.extractor.queryParams,
      {}
    );
    if (convertedParam instanceof Domain2ElementFailed) {
      throw new Error("sqlStringForQuery queryParamsWithClauses convertedParam failed for key: " + key);
      // return convertedParam;
    }
    // newPreparedStatementParameters.push(convertedParam.preparedStatementParameters);
    newPreparedStatementParameters = [
      ...newPreparedStatementParameters,
      ...(convertedParam.preparedStatementParameters ?? []),
    ];
    return {
      name: key,
      sql: convertedParam.sqlStringOrObject,
      convertedParam,
    };
  });

  const convertedParams: Record<string, SqlContextEntry> = Object.fromEntries(
    queryParamsWithClauses.map((q) => [
      q.name,
      { 
        type: q.convertedParam.type, 
        resultAccessPath: q.convertedParam.resultAccessPath?.slice(1) // because resultAccessPath returns the path viewed from the end user, for which the result is always an array
      },
    ])
  );

  log.info("sqlStringForQuery found queryParamsWithClauses", JSON.stringify(queryParamsWithClauses, null, 2));
  log.info(
    "sqlStringForQuery found newPreparedStatementParameters for query parameters",
    JSON.stringify(newPreparedStatementParameters, null, 2)
  );
  const transformerRawQueries: [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>][] = Object.entries(
    selectorParams.extractor.runtimeTransformers ?? {}
  ).map(([key, value]) => {
    const transformerRawQuery = sqlStringForTransformer(
      value as TransformerForRuntime,
      newPreparedStatementParameters.length,
      selectorParams.extractor.queryParams,
      // selectorParams.extractor.contextResults
      convertedParams
    );
    if (!(transformerRawQuery instanceof Domain2ElementFailed) && transformerRawQuery.preparedStatementParameters) {
      // newPreparedStatementParameters.push(...transformerRawQuery.preparedStatementParameters);
      newPreparedStatementParameters = [...newPreparedStatementParameters, ...transformerRawQuery.preparedStatementParameters];
    }
    return [key, transformerRawQuery]; // TODO: handle ExtendedExtractorForRuntime?
  });
  const foundError = transformerRawQueries.find((q) => q[1] instanceof Domain2ElementFailed);
  log.info("sqlStringForQuery found transformerRawQueries", JSON.stringify(transformerRawQueries, null, 2));
  log.info(
    "sqlStringForQuery found newPreparedStatementParameters for runtime transformers",
    JSON.stringify(newPreparedStatementParameters, null, 2)
  );

  if (foundError) {
    // log.info("sqlStringForQuery found error in transformerRawQueries", JSON.stringify(foundError, null, 2));
    return foundError[1] as Domain2ElementFailed;
  }

  // no errors were found in transformerRawQueries
  const cleanTransformerRawQueries = transformerRawQueries as any as [string, SqlStringForTransformerElementValue][];

  const combinerRawQueriesObject = Object.fromEntries(combinerRawQueries);
  const transformerRawQueriesObject: Record<string, SqlStringForTransformerElementValue> =
    Object.fromEntries(cleanTransformerRawQueries);
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
  if (queryParamsWithClauses.length > 0) {
    queryParts.push(
      queryParamsWithClauses.map((q) => '"' + q.name + '" AS (' + q.sql + " )").join(tokenSeparatorForWithRtn)
    );
  }
  if (transformerRawQueries.length > 0) {
    queryParts.push(
      cleanTransformerRawQueries
        .flatMap((transformerRawQuery) =>
          typeof transformerRawQuery[1] == "string"
            ? '"' + transformerRawQuery[0] + '" AS (' + transformerRawQuery[1] + " )"
            : (transformerRawQuery[1].extraWith
                ? transformerRawQuery[1].extraWith
                    .map((extra: any) => '"' + extra.name + '" AS (' + extra.sql + " )")
                    .join(tokenSeparatorForWithRtn) +
                  tokenSeparatorForWithRtn
                : "") +
              '"' +
              transformerRawQuery[0] +
              '" AS (' +
              transformerRawQuery[1].sqlStringOrObject +
              " )"
        )
        .join(tokenSeparatorForWith + "\n")
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
    queryParts.join(tokenSeparatorForWith + "\n") +
    `
SELECT * FROM "${endResultName}"`;
  log.info("sqlStringForQuery innerFullObjectTemplate aggregateRawQuery", query);
  return {
    query,
    preparedStatementParameters: newPreparedStatementParameters,
    transformerRawQueriesObject,
    endResultName,
    combinerRawQueriesObject,
  };
}

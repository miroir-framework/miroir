import {
  applicationTransformerDefinitions,
  AsyncQueryRunnerParams,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  ExtractorOrCombiner,
  LoggerInterface,
  MiroirLoggerFactory,
  ResultAccessPath,
  transformer_extended_apply_wrapper,
  transformer_resolveReference,
  TransformerForBuild_createObject,
  TransformerForBuild_createObjectFromPairs,
  TransformerForBuildPlusRuntime,
  TransformerForBuildPlusRuntime_returnValue,
  TransformerForBuildPlusRuntime_constantAsExtractor,
  TransformerForBuildPlusRuntime_getFromContext,
  TransformerForBuildPlusRuntime_aggregate,
  TransformerForBuildPlusRuntime_dataflowObject,
  TransformerForBuildPlusRuntime_createObject,
  TransformerForBuildPlusRuntime_pickFromList,
  TransformerForBuildPlusRuntime_indexListBy,
  TransformerForBuildPlusRuntime_listReducerToSpreadObject,
  TransformerForBuildPlusRuntime_mapList,
  TransformerForBuildPlusRuntime_mustacheStringTemplate,
  TransformerForBuildPlusRuntime_generateUuid,
  TransformerForBuildPlusRuntime_createObjectFromPairs,
  TransformerForBuildPlusRuntime_mergeIntoObject,
  TransformerForBuildPlusRuntime_getObjectEntries,
  TransformerForBuildPlusRuntime_getObjectValues,
  TransformerForBuildPlusRuntime_getUniqueValues,
  defaultMetaModelEnvironment,
  defaultTransformerInput,
  type TransformerForBuildPlusRuntime_ifThenElse,
  type MiroirModelEnvironment,
  type TransformerForBuildPlusRuntime_accessDynamicPath,
} from "miroir-core";
import { RecursiveStringRecords } from "../4_services/SqlDbQueryTemplateRunner";
import { cleanLevel } from "../4_services/constants";
import { packageName } from "../constants";
import { getConstantSqlTypeMap, PostgresDataTypes } from "./Postgres";
import {
  protectedSqlAccessForPath,
  tokenNameQuote,
  tokenSeparatorForSelect,
  tokenSeparatorForTableColumn,
  tokenSeparatorForWithRtn,
  tokenStringQuote
} from "./SqlGeneratorUtils";
import {
  flushAndIndent,
  indent,
  sql_jsonb_array_elements,
  sql_jsonb_each,
  sql_jsonb_object_agg,
  sqlColumnAccessOld,
  sqlDefineColumn,
  sqlFromOld,
  sqlNameQuote,
  sqlQuery,
  sqlQueryHereTableDefinition,
  sqlSelectColumns,
} from "./SqlQueryBuilder";
import { getAttributeTypesFromJzodSchema, jzodToPostgresTypeMap } from "./mlSchema";
import { SqlQuerySelectExpressionSchema } from "../generated";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "sqlGenerator")
).then((logger: LoggerInterface) => {
  log = logger;
});

export type ITransformerHandler<T> = (
  actionRuntimeTransformer: T,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
) => Domain2QueryReturnType<SqlStringForTransformerElementValue>;

const sqlTransformerImplementations: Record<string, ITransformerHandler<any>> = {
  sqlStringForCaseTransformer,
  sqlStringForConditionalTransformer,
  sqlStringForConstantAnyTransformer,
  sqlStringForConstantTransformer,
  sqlStringForConstantAsExtractorTransformer,
  sqlStringForContextReferenceTransformer,
  sqlStringForCountTransformer,
  sqlStringForDataflowObjectTransformer,
  sqlStringForFreeObjectTransformer,
  sqlStringForListPickElementTransformer,
  sqlStringForListReducerToIndexObjectTransformer,
  sqlStringForListReducerToSpreadObjectTransformer,
  sqlStringForMapperListToListTransformer,
  sqlStringForMustacheStringTemplateTransformer,
  sqlStringForNewUuidTransformer,
  sqlStringForObjectFullTemplateTransformer,
  sqlStringForObjectAlterTransformer,
  sqlStringForObjectDynamicAccessTransformer,
  sqlStringForObjectEntriesTransformer,
  sqlStringForObjectValuesTransformer,
  sqlStringForParameterReferenceTransformer,
  sqlStringForPlusTransformer,
  sqlStringForUniqueTransformer,
}

// ##############################################################################################
// It represents the type of the SQL string or object being generated. 
// The type can be one of the following: 
// - "json": A JSON object.
// - "scalar": A single scalar value.
// - "table": A table structure.
// - "json_array": An array of JSON objects.
// - "tableOf1JsonColumn": A table with one column containing JSON values.
/**
 * * This type represents the possible types of SQL strings or objects that can be generated for a transformer element.
 * @typedef {("json" | "scalar" | "table" | "json_array" | "tableOf1JsonColumn")} SqlStringForTransformerElementValueType
 */
export type SqlStringForTransformerElementValueType = "json" | "scalar" | "table" | "json_array" | "tableOf1JsonColumn";
/**
 * * This type represents the structure of the SQL string or object that is generated for a transformer element.
 * @property {string} sqlStringOrObject - The SQL string or object generated for the transformer element.
 * @property {ResultAccessPath} [resultAccessPath] - The path to access the result of the SQL string or object.
 * @property {string} [columnNameContainingJsonValue] - The name of the column containing JSON values, if applicable.
 * @property {boolean} [encloseEndResultInArray] - Indicates whether to enclose the end result in an array.
 * @property {{ name: string; sql: string; sqlResultAccessPath?: ResultAccessPath }[]} [extraWith] - Additional SQL strings or objects to include in the result.
 * @property {string[]} [usedContextEntries] - The context entries used in the SQL string or object.
 * @property {number} [index] - The index of the transformer element, if applicable.
 * @property {SqlStringForTransformerElementValueType} type - The type of the SQL string or object generated.
 * @property {any[]} [preparedStatementParameters] - The parameters for the prepared statement, if applicable.
 */
export type SqlStringForTransformerElementValue = {
  sqlStringOrObject: string;
  resultAccessPath?: ResultAccessPath;
  columnNameContainingJsonValue?: string;
  encloseEndResultInArray?: boolean;
  extraWith?: { name: string; sql: string; sqlResultAccessPath?: ResultAccessPath }[];
  usedContextEntries?: string[]; // 
  index?: number;
  type: SqlStringForTransformerElementValueType;
  preparedStatementParameters?: any[];
};

function isJson(t:SqlStringForTransformerElementValueType) {
  return t == "json" || t == "json_array" || t == "tableOf1JsonColumn";
}
// ################################################################################################
const queryFailureObjectSqlString = `'{"queryFailure": "FailedTransformer_getFromContext"}'::jsonb`;

// const sqlNameQuote = (name: string) => '"' + name + '"';
// const sqlTableColumnAccess = (table:string, key: string)=> sqlNameQuote(table) + '.' + sqlNameQuote(key);
// const sqlSelect = (elements: string[]) => elements.join(", ");

// ################################################################################################
export interface SqlContextEntry {
  // type: "json" | "scalar" | "table"; resultAccessPath?: (string | number)[]
  // type: "json" | "scalar" | "table";
  type: "json" | "json_array" | "scalar" | "table";
  renameTo?: string;
  attributeResultAccessPath?: (string | number)[];
  // tableResultAccessPath?: ResultAccessPath;
}

// ################################################################################################
export interface SqlStringForCombinerReturnType {
  sqlString: string;
  // resultAccessPath?: (string | number)[];
  resultAccessPath?: ResultAccessPath;
}

// ################################################################################################
function getSqlTypeForValue(
  value?: any,
  mlSchema?: { type?: string },
  // actionRuntimeTransformer: { transformerType: "returnValue"; value?: any; interpolation: "runtime"; }, 
  // sqlTargetType: string, label: string
) {
  let sqlTargetType: PostgresDataTypes;
  let label: string;
  
  // Check mlSchema first for type information (needed for bigints which are strings in JSON)
  if (mlSchema?.type === "bigint") {
    sqlTargetType = "bigint";
    label = "constantBigint";
    return { sqlTargetType, label };
  }
  
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
      // sqlTargetType = "double precision";
      sqlTargetType = "bigint";
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
        "Unsupported returnValue type in 'returnValue' transformer: " + typeof value
      );
      break;
    }
  }
  return { sqlTargetType, label };
}

// ################################################################################################
const getConstantSql = (
  transformer: any,
  preparedStatementParametersCount: number,
  topLevelTransformer: boolean,
  // targetType: "json" | "scalar",
  targetType: SqlStringForTransformerElementValueType,
  sqlTargetType: PostgresDataTypes,
  label: string
): Domain2QueryReturnType<SqlStringForTransformerElementValue> => {
  const paramIndex = preparedStatementParametersCount + 1;
  if (targetType == "table") {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: transformer as any,
      failureMessage: "getConstantSql targetType is table: " + JSON.stringify(transformer, null, 2),
    });
  }
  const result: SqlStringForTransformerElementValue = {
    type: targetType,
    sqlStringOrObject: topLevelTransformer
      ? `select $${paramIndex}::${sqlTargetType} AS "${label}"`
      : `$${paramIndex}::${sqlTargetType}`,
    preparedStatementParameters: [isJson(targetType) ? JSON.stringify(transformer.value) : transformer.value],
    resultAccessPath: topLevelTransformer ? [0, label] : undefined,
    columnNameContainingJsonValue: isJson(targetType) && topLevelTransformer ? label : undefined,
  };
  log.info(
    "getConstantSql called with",
    "targetType",
    targetType,
    "sqlTargetType",
    sqlTargetType,
    "label",
    label,
    "topLevelTransformer",
    topLevelTransformer,
    "preparedStatementParametersCount",
    preparedStatementParametersCount,
    "result",
    JSON.stringify(result, null, 2)
  );
  return result;
};

// ################################################################################################
// used only by legacy "typed" constants
function sqlStringForConstantAnyTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_returnValue,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const getSqlParams = getConstantSqlTypeMap[actionRuntimeTransformer.transformerType];
  return getConstantSql(
    actionRuntimeTransformer,
    preparedStatementParametersCount,
    topLevelTransformer,
    getSqlParams.targetType,
    getSqlParams.sqlTargetType,
    withClauseColumnName??getSqlParams.label
  );
}

// ################################################################################################
function sqlStringForConstantTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_returnValue,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const targetSqlType =
    typeof actionRuntimeTransformer.value === "object"
      ? Array.isArray(actionRuntimeTransformer.value)
        ? "json_array"
        : "json"
      : "scalar";
  // let sqlTargetType: PostgresDataTypes;
  // let label: string;
  const { sqlTargetType, label } = getSqlTypeForValue(actionRuntimeTransformer.value, (actionRuntimeTransformer as any).mlSchema);
  return getConstantSql(
    actionRuntimeTransformer,
    preparedStatementParametersCount,
    topLevelTransformer,
    targetSqlType,
    sqlTargetType,
    withClauseColumnName??label,
  );
}


// ################################################################################################
export function sqlStringForCombiner /*BoxedExtractorTemplateRunner*/(
  query: ExtractorOrCombiner,
  schema: string
// ): Domain2QueryReturnType<SqlStringForCombinerReturnType> {
): SqlStringForCombinerReturnType { // TODO: do not throw exceptions
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
export function sqlStringForExtractor(
  extractor: ExtractorOrCombiner,
  schema: string,
  modelEnvironment: MiroirModelEnvironment,
): RecursiveStringRecords {
  switch (extractor.extractorOrCombinerType) {
    case "extractorForObjectByDirectReference": {
      if (!extractor.applyTransformer) {
        return `SELECT * FROM "${schema}"."${extractor.parentName}" WHERE "uuid" = '${extractor.instanceUuid}'`;
      }
      if (!modelEnvironment) {
        throw new Error("sqlForExtractor extractorForObjectByDirectReference needs modelEnvironment if applyTransformer is set");
      }
      log.info(
        "sqlForExtractor extractorForObjectByDirectReference with applyTransformer",
        JSON.stringify(extractor.applyTransformer, null, 2),
        Object.keys(modelEnvironment)
      );
      return `SELECT * FROM "${schema}"."${extractor.parentName}" WHERE "uuid" = '${extractor.instanceUuid}'`;
      break;
    }
    case "combinerForObjectByRelation": {
      throw new Error("sqlForExtractor combinerForObjectByRelation not implemented");
      break;
    }
    case "extractorByEntityReturningObjectList": {
      let whereClause = "";
      if (extractor.filter) {
        const { attributeName, value, values, not, undefined: isUndefined } = extractor.filter;
        
        // Handle undefined check
        if (isUndefined) {
          whereClause = not 
            ? ` WHERE "${attributeName}" IS NOT NULL`
            : ` WHERE "${attributeName}" IS NULL`;
        }
        // Handle values array (multiple values)
        else if (values !== undefined && values.length > 0) {
          const valueList = values.map(v => `'${v}'`).join(', ');
          whereClause = not
            ? ` WHERE "${attributeName}" NOT IN (${valueList})`
            : ` WHERE "${attributeName}" IN (${valueList})`;
        }
        // Handle single value
        else if (value !== undefined) {
          whereClause = not
            ? ` WHERE "${attributeName}" NOT ILIKE '%${value}%'`
            : ` WHERE "${attributeName}" ILIKE '%${value}%'`;
        }
      }
      return `SELECT * FROM "${schema}"."${extractor.parentName}"${whereClause}`;
      break;
    }
    case "extractorWrapperReturningObject":
    case "extractorWrapperReturningList":
    case "combinerByRelationReturningObjectList":
    case "combinerByManyToManyRelationReturningObjectList": {
      throw new Error(
        "sqlForExtractor not implemented for extractorOrCombinerType: " +
          extractor.extractorOrCombinerType
      );
      break;
    }
    default: {
      throw new Error(
        "sqlForExtractor not implemented for extractorOrCombinerType of extractor: " + extractor
      );
      break;
    }
  }
}


// ################################################################################################
function sqlStringForApplyTo(
  actionRuntimeTransformer:
    | TransformerForBuild_createObjectFromPairs
    | TransformerForBuildPlusRuntime_createObjectFromPairs
    | TransformerForBuildPlusRuntime_aggregate
    | TransformerForBuildPlusRuntime_pickFromList
    | TransformerForBuildPlusRuntime_mapList
    | TransformerForBuildPlusRuntime_mergeIntoObject
    | TransformerForBuildPlusRuntime_getObjectValues
    | TransformerForBuildPlusRuntime_getObjectEntries
    | TransformerForBuildPlusRuntime_listReducerToSpreadObject
    | TransformerForBuildPlusRuntime_indexListBy
    | TransformerForBuildPlusRuntime_getUniqueValues
    // | TransformerForBuildPlusRuntime_innerFullObjectTemplate
  ,
  preparedStatementParametersIndex: number,
  indentLevel: number,
  queryParams: Record<string, any> = {},
  definedContextEntries: Record<string, any> = {},
  useAccessPathForContextReference: boolean = true,
  topLevelTransformer: boolean = true
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  log.info(
    "sqlStringForApplyTo called with",
    "actionRuntimeTransformer",
    JSON.stringify(actionRuntimeTransformer, null, 2),
  );
  if (!actionRuntimeTransformer.applyTo) {
      return sqlStringForRuntimeTransformer(
        {
          transformerType: "getFromContext",
          interpolation: "runtime",
          referenceName: defaultTransformerInput,
        },
        preparedStatementParametersIndex,
        indentLevel,
        queryParams,
        definedContextEntries,
        useAccessPathForContextReference,
        topLevelTransformer
      )
  }
  switch (typeof actionRuntimeTransformer.applyTo) {
    case "string":
    case "number":
    case "bigint":
    case "undefined":
    case "boolean": {
      return sqlStringForRuntimeTransformer(
        {
          transformerType: "returnValue",
          interpolation: "runtime",
          value: actionRuntimeTransformer.applyTo,
        },
        preparedStatementParametersIndex,
        indentLevel,
        queryParams,
        definedContextEntries,
        useAccessPathForContextReference,
        topLevelTransformer
      )
      break;
    }
    case "object": {
      if (Array.isArray(actionRuntimeTransformer.applyTo) || !Object.hasOwn(actionRuntimeTransformer.applyTo, "transformerType")) {
        // simple returnValue: object or array
        return sqlStringForRuntimeTransformer(
          {
            transformerType: "returnValue",
            interpolation: "runtime",
            value: actionRuntimeTransformer.applyTo,
          },
          preparedStatementParametersIndex,
          indentLevel,
          queryParams,
          definedContextEntries,
          useAccessPathForContextReference,
          topLevelTransformer
        );
      }
      if (
        ["constantAsExtractor", "returnValue", "getFromContext", "getFromParameters"].includes(
          actionRuntimeTransformer.applyTo.transformerType || ""
        )
      ) {
        return sqlStringForRuntimeTransformer(
          actionRuntimeTransformer.applyTo as any, // TODO: fix types of sqlStringForApplyTo and sqlStringForRuntimeTransformer
          preparedStatementParametersIndex,
          indentLevel,
          queryParams,
          definedContextEntries,
          useAccessPathForContextReference,
          topLevelTransformer
        );
      }
      // if (actionRuntimeTransformer.applyTo.transformerType != "getFromContext") {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage:
          "sqlStringForRuntimeTransformer sqlStringForApplyTo not implemented for " +
          actionRuntimeTransformer.applyTo.transformerType +
          " type: " +
          JSON.stringify(actionRuntimeTransformer.applyTo),
      });
      // }
      // const referenceQuery = sqlStringForRuntimeTransformer(
      //   actionRuntimeTransformer.applyTo,
      //   preparedStatementParametersIndex,
      //   indentLevel,
      //   queryParams,
      //   definedContextEntries,
      //   useAccessPathForContextReference,
      //   topLevelTransformer
      // );
      // return referenceQuery;
    
    }
    case "symbol":
    case "function":
    default: {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage:
          "sqlStringForRuntimeTransformer applyTo not implemented for type: " +
          typeof actionRuntimeTransformer.applyTo,
      });
      break;
    }
  }
}

// ################################################################################################
function sqlStringForCountTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_aggregate,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const referenceQuery = sqlStringForApplyTo(
    actionRuntimeTransformer,
    preparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
    topLevelTransformer,
  );
  log.info("sqlStringForRuntimeTransformer count referenceQuery", JSON.stringify(referenceQuery, null, 2));
  if (referenceQuery instanceof Domain2ElementFailed) {
    return referenceQuery;
  }
  switch (referenceQuery.type) {
    case "json_array":
    case "json": {
      const groupBy = actionRuntimeTransformer.groupBy;
      if (groupBy && (typeof actionRuntimeTransformer.groupBy === 'string' || groupBy.length > 0)) {
        const groupByArray = (typeof groupBy === "string" ? [groupBy] : groupBy)
        // const groupByArrayQuoted = groupByArray?.map(e=>`${tokenNameQuote}${e}${tokenNameQuote}`);
        const groupBySelectors = groupByArray?.map(
          (e) =>
            "value" +
            " ->> " +
            tokenStringQuote +
            e +
            tokenStringQuote +
            " AS " +
            `${tokenNameQuote}${e}${tokenNameQuote}`
        );
        const groupByAccessors = groupByArray?.map(e=> `value ->> ${tokenStringQuote}${e}${tokenStringQuote}`);
// (slow) example of extracting and auto-casting values from a JSONB array in PostgreSQL if no type is known for the input values
// WITH j AS (
//   SELECT jsonb_array_elements(
//     '[{"test1":"testA","test2":1}, {"test1":"testB","test2":"1"},
//       {"test1":"testA","test2":2.0}, {"test1":"testC","test2":"2020-01-01T00:00:00Z"}]'::jsonb
//   ) AS v
// )
// SELECT
//   v ->> 'test1' AS test1,
//   CASE
//     WHEN jsonb_typeof(v->'test2') = 'number'
//          AND (v->>'test2') ~ '^\-?\d+$' THEN (v->>'test2')::int
//     WHEN jsonb_typeof(v->'test2') = 'string'
//          AND (v->>'test2') ~ '^\-?\d+$' THEN (v->>'test2')::int
//     ELSE NULL
//   END AS test2_int
// FROM j;

// proper example of counting grouped by values when the type of the input values is known
// WITH
// "testList" AS (
//   select '[{"test1":"testA","test2":1},{"test1":"testB","test2":1},{"test1":"testA","test2":2},{"test1":"testC","test2":2},{"test1":"testB","test2":1},{"test1":"testC","test2":2}]'::jsonb AS "constantObject"
// ),
// "transformer" AS (
// SELECT "X"."test1", "X"."test2", COUNT(*)::int AS "aggregate"
// FROM jsonb_to_recordset((SELECT "constantObject" FROM "testList")) AS "X"("test1" text, "test2" int)
// GROUP BY "X"."test1", "X"."test2"
// ORDER BY "X"."test1", "X"."test2"
// )
// SELECT * FROM "transformer"

        return {
          type: "json",
          sqlStringOrObject: `
SELECT ${groupBySelectors?.join(',')}, COUNT(*)::int AS "aggregate"
FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo",
    LATERAL jsonb_array_elements("count_applyTo"."${
      (referenceQuery as any).resultAccessPath[1]
    }") AS "count_applyTo_array"
GROUP BY ${groupByAccessors?.join(", ")}
ORDER BY ${groupByAccessors?.join(", ")}
`,
          preparedStatementParameters: referenceQuery.preparedStatementParameters,
          resultAccessPath: [], // TODO: inconsistency between simple 'count' and groupBy count
          extraWith: referenceQuery.extraWith,
          encloseEndResultInArray: false,
        };
      } else {
        return {
          type: "json",
          sqlStringOrObject: `
SELECT json_build_object('aggregate', COUNT(*)::int) AS "count_object"
FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo",
    LATERAL jsonb_array_elements("count_applyTo"."${
      (referenceQuery as any).resultAccessPath[1]
    }") AS "count_applyTo_array"
`,
          preparedStatementParameters: referenceQuery.preparedStatementParameters,
          resultAccessPath: [0, "count_object"],
          extraWith: referenceQuery.extraWith,
          columnNameContainingJsonValue: "count_object",
          encloseEndResultInArray: true,
        };

      }
    }
    case "tableOf1JsonColumn":
//       {
//       const transformerSqlQuery = actionRuntimeTransformer.groupBy
//         ? `SELECT "${actionRuntimeTransformer.groupBy}", COUNT(*)::int AS "aggregate" FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo"
//             GROUP BY "${actionRuntimeTransformer.groupBy}"
// `
//         : `SELECT COUNT(*)::int AS "aggregate" FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo"
// `;
//       log.info("sqlStringForRuntimeTransformer count transformerSqlQuery", transformerSqlQuery);
//       return {
//         type: "table",
//         sqlStringOrObject: transformerSqlQuery,
//         resultAccessPath: undefined,
//         preparedStatementParameters: referenceQuery.preparedStatementParameters,
//       };
//     }
    case "table": {
      const transformerSqlQuery = actionRuntimeTransformer.groupBy
        ? `SELECT "${actionRuntimeTransformer.groupBy}", COUNT(*)::int AS "aggregate" FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo"
            GROUP BY "${actionRuntimeTransformer.groupBy}"
`
        : `SELECT COUNT(*)::int AS "aggregate" FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo"
`;
      log.info("sqlStringForRuntimeTransformer count transformerSqlQuery", transformerSqlQuery);
      return {
        type: "table",
        sqlStringOrObject: transformerSqlQuery,
        resultAccessPath: undefined,
        preparedStatementParameters: referenceQuery.preparedStatementParameters,
      };
    }
    case "scalar": {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForRuntimeTransformer count referenceQuery result is scalar",
      });
    }
    default: {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForRuntimeTransformer count referenceQuery result type is not known: " + referenceQuery.type,
      });
    }
  }
}

const jsOperatorToSqlOperatorMap: Record<string, string> = {
  "==": "=",
  "===": "=",
  "!=": "<>",
  "!==": "<>",
  "<": "<",
  "<=": "<=",
  ">": ">",
  ">=": ">=",
}

// ################################################################################################
// Helper: SQL expression for JS-style falsy check.
// JS falsy values: null, undefined, 0, false, "".
// For JSON/JSONB types: also checks for JSON null ('null'::jsonb), JSON false, JSON 0, JSON empty string.
// For scalar types: uses IS NULL plus a text cast to check for '0', 'false', or '' values.
function sqlIsFalsy(expr: string, type: SqlStringForTransformerElementValueType): string {
  if (isJson(type)) {
    return `(${expr} IS NULL OR ${expr} = 'null'::jsonb OR ${expr} = 'false'::jsonb OR ${expr} = '0'::jsonb OR ${expr} = '""'::jsonb)`;
  } else {
    // scalar: cast to text and check known falsy string representations
    return `(${expr} IS NULL OR ${expr}::text IN ('0', 'false', ''))`;
  }
}

// ################################################################################################
// Helper: SQL expression for JS-style null check.
// Covers both SQL NULL and JSON null ('null'::jsonb) for JSON/JSONB types.
function sqlIsNull(expr: string, type: SqlStringForTransformerElementValueType): string {
  if (isJson(type)) {
    return `(${expr} IS NULL OR ${expr} = 'null'::jsonb)`;
  } else {
    return `${expr} IS NULL`;
  }
}

// ################################################################################################
// Helper: SQL expression for JS-style isNotNull check.
// Value must be neither SQL NULL nor JSON null.
function sqlIsNotNull(expr: string, type: SqlStringForTransformerElementValueType): string {
  if (isJson(type)) {
    return `(${expr} IS NOT NULL AND ${expr} <> 'null'::jsonb)`;
  } else {
    return `${expr} IS NOT NULL`;
  }
}

// ################################################################################################
function sqlStringForConditionalTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_ifThenElse,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  let newPreparedStatementParametersCount = preparedStatementParametersCount;
  let preparedStatementParameters: any[] = [];

  // Unary operators (isNull, isNotNull, !) do not use the right operand.
  const isUnaryOperator =
    actionRuntimeTransformer.transformerType === "isNull" ||
    actionRuntimeTransformer.transformerType === "isNotNull" ||
    actionRuntimeTransformer.transformerType === "!";

  const left = sqlStringForRuntimeTransformer(
    actionRuntimeTransformer.left as TransformerForBuildPlusRuntime,
    newPreparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
    false, // topLevelTransformer
  );
  if (left instanceof Domain2ElementFailed) {
    return left;
  }
  if (left.preparedStatementParameters) {
    preparedStatementParameters = [...preparedStatementParameters, ...left.preparedStatementParameters];
    newPreparedStatementParametersCount += left.preparedStatementParameters.length;
  }

  // right is optional and not used for unary operators
  let right: SqlStringForTransformerElementValue | undefined;
  if (!isUnaryOperator && actionRuntimeTransformer.right !== undefined) {
    const rightResult = sqlStringForRuntimeTransformer(
      actionRuntimeTransformer.right as TransformerForBuildPlusRuntime,
      newPreparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      false, // topLevelTransformer
    );
    if (rightResult instanceof Domain2ElementFailed) {
      return rightResult;
    }
    if (rightResult.preparedStatementParameters) {
      preparedStatementParameters = [...preparedStatementParameters, ...rightResult.preparedStatementParameters];
      newPreparedStatementParametersCount += rightResult.preparedStatementParameters.length;
    }
    right = rightResult;
  }

  // then is optional: when absent, a truthy condition returns true::boolean
  let thenSql: SqlStringForTransformerElementValue;
  if (actionRuntimeTransformer.then !== undefined) {
    const thenResult = sqlStringForRuntimeTransformer(
      actionRuntimeTransformer.then as TransformerForBuildPlusRuntime,
      newPreparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      false, // topLevelTransformer
    );
    if (thenResult instanceof Domain2ElementFailed) {
      return thenResult;
    }
    if (thenResult.preparedStatementParameters) {
      preparedStatementParameters = [...preparedStatementParameters, ...thenResult.preparedStatementParameters];
      newPreparedStatementParametersCount += thenResult.preparedStatementParameters.length;
    }
    thenSql = thenResult;
  } else {
    thenSql = { type: "scalar", sqlStringOrObject: "true::boolean" };
  }

  // else is optional: when absent, a falsy condition returns false::boolean
  let elseSql: SqlStringForTransformerElementValue;
  if (actionRuntimeTransformer.else !== undefined) {
    const elseResult = sqlStringForRuntimeTransformer(
      actionRuntimeTransformer.else as TransformerForBuildPlusRuntime,
      newPreparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      false, // topLevelTransformer
    );
    if (elseResult instanceof Domain2ElementFailed) {
      return elseResult;
    }
    if (elseResult.preparedStatementParameters) {
      preparedStatementParameters = [...preparedStatementParameters, ...elseResult.preparedStatementParameters];
      newPreparedStatementParametersCount += elseResult.preparedStatementParameters.length;
    }
    elseSql = elseResult;
  } else {
    elseSql = { type: "scalar", sqlStringOrObject: "false::boolean" };
  }

  // For standard binary comparison operators, both sides must be scalar
  const isBinaryComparisonOperator = jsOperatorToSqlOperatorMap[actionRuntimeTransformer.transformerType] !== undefined;
  if (isBinaryComparisonOperator && right && (left.type !== "scalar" || right.type !== "scalar")) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForRuntimeTransformer ifThenElse left or right is not scalar for operator " + actionRuntimeTransformer.transformerType,
    });
  }

  // Build the SQL condition expression based on operator type
  const leftExpr = left.sqlStringOrObject;
  const rightExpr = right?.sqlStringOrObject ?? "";
  const t = actionRuntimeTransformer.transformerType;
  let conditionSql: string;

  switch (t) {
    case "isNull":
      conditionSql = sqlIsNull(leftExpr, left.type);
      break;
    case "isNotNull":
      conditionSql = sqlIsNotNull(leftExpr, left.type);
      break;
    case "!":
      // JS boolean NOT: true when left is a JS-falsy value (null/undefined/0/false/"")
      conditionSql = sqlIsFalsy(leftExpr, left.type);
      break;
    case "&&":
      // JS logical AND: true when both operands are JS-truthy
      conditionSql =
        `NOT ${sqlIsFalsy(leftExpr, left.type)} AND NOT ${sqlIsFalsy(rightExpr, right?.type ?? "scalar")}`;
      break;
    case "||":
      // JS logical OR: true when at least one operand is JS-truthy
      conditionSql =
        `NOT ${sqlIsFalsy(leftExpr, left.type)} OR NOT ${sqlIsFalsy(rightExpr, right?.type ?? "scalar")}`;
      break;
    default:
      // Standard binary comparison operators (==, !=, <, <=, >, >=)
      conditionSql = `${leftExpr} ${jsOperatorToSqlOperatorMap[t]} ${rightExpr}`;
      break;
  }

  const columnName = withClauseColumnName ?? "ifThenElse";
  return {
    type: "scalar",
    sqlStringOrObject:
      (topLevelTransformer ? "select " : "") +
      "case when " + conditionSql +
      " then " + thenSql.sqlStringOrObject +
      " else " + elseSql.sqlStringOrObject +
      " end" +
      (topLevelTransformer ? ` AS "${columnName}"` : ""),
    preparedStatementParameters: [
      ...(left.preparedStatementParameters ?? []),
      ...(right?.preparedStatementParameters ?? []),
      ...(thenSql.preparedStatementParameters ?? []),
      ...(elseSql.preparedStatementParameters ?? []),
    ],
    resultAccessPath: topLevelTransformer ? [0, columnName] : undefined,
    columnNameContainingJsonValue: topLevelTransformer ? columnName : undefined,
    usedContextEntries: [
      ...(left.usedContextEntries ?? []),
      ...(right?.usedContextEntries ?? []),
      ...(thenSql.usedContextEntries ?? []),
      ...(elseSql.usedContextEntries ?? []),
    ],
  };
}

// ################################################################################################
// SQL implementation of the plus transformer
// Performs addition on numbers/bigints or concatenation on strings (similar to JS +)
// Evaluates arguments left-to-right (from index 0 to length-1)
function sqlStringForPlusTransformer(
  actionRuntimeTransformer: {
    transformerType: "+";
    interpolation?: "build" | "runtime";
    args: TransformerForBuildPlusRuntime[];
  },
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  // Check for empty array
  if (!actionRuntimeTransformer.args || actionRuntimeTransformer.args.length === 0) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForPlusTransformer requires at least one argument",
    });
  }

  let preparedStatementParameters: any[] = [];

  // Evaluate all arguments
  const evaluatedArgs: SqlStringForTransformerElementValue[] = [];
  for (const arg of actionRuntimeTransformer.args) {
    const evaluatedArg = sqlStringForRuntimeTransformer(
      arg,
      preparedStatementParameters.length + preparedStatementParametersCount,
      indentLevel + 1,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      false // child transformers are not top-level
    );
    if (evaluatedArg instanceof Domain2ElementFailed) {
      return evaluatedArg;
    } else {
      if (evaluatedArg.type !== "scalar") {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: `sqlStringForPlusTransformer argument is not scalar`,
        });
      }
      evaluatedArgs.push(evaluatedArg);
      if (evaluatedArg.preparedStatementParameters) {
        preparedStatementParameters.push(...evaluatedArg.preparedStatementParameters);
      }
    }
  }

  // Determine operation based on first argument's mlSchema type
  const firstTransformer = actionRuntimeTransformer.args[0] as any;
  const firstType = firstTransformer?.mlSchema?.type;
  
  // Validate all arguments have the same type and determine operator
  let sqlOperator: string;
  
  if (!firstType) {
    // No mlSchema - can't determine type at SQL generation time
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForPlusTransformer cannot determine operand types (no mlSchema)",
    });
  }
  
  // Validate all args have the same type
  for (let i = 1; i < actionRuntimeTransformer.args.length; i++) {
    const argTransformer = actionRuntimeTransformer.args[i] as any;
    const argType = argTransformer?.mlSchema?.type;
    
    if (!argType) {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: `sqlStringForPlusTransformer cannot determine type for argument at index ${i} (no mlSchema)`,
      });
    }
    
    if (argType !== firstType) {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: `sqlStringForPlusTransformer type mismatch: argument 0 is ${firstType}, argument ${i} is ${argType}`,
      });
    }
  }
  
  // Collect all usedContextEntries
  const allUsedContextEntries: string[] = [];
  for (const arg of evaluatedArgs) {
    if (arg.usedContextEntries) {
      allUsedContextEntries.push(...arg.usedContextEntries);
    }
  }

// Single element - for top-level transformers, wrap in SELECT
    // For non-top-level, return expression as-is
    if (evaluatedArgs.length === 1) {
      const singleElement = evaluatedArgs[0];
      if (topLevelTransformer) {
        // Top-level needs a SELECT statement
        return {
          type: singleElement.type,
          sqlStringOrObject: 
            `select ` +
            flushAndIndent(indentLevel + 1) +
            singleElement.sqlStringOrObject +
            ` AS "${withClauseColumnName ?? "plus"}"`
          ,
          preparedStatementParameters,
          resultAccessPath: [0, withClauseColumnName ?? "plus"],
          columnNameContainingJsonValue: withClauseColumnName ?? "plus",
          usedContextEntries: allUsedContextEntries,
        };
      } else {
        // Non-top-level returns expression
        return {
          type: singleElement.type,
          sqlStringOrObject: singleElement.sqlStringOrObject,
          preparedStatementParameters,
          resultAccessPath: singleElement.resultAccessPath,
          columnNameContainingJsonValue: singleElement.columnNameContainingJsonValue,
          usedContextEntries: allUsedContextEntries,
        };
      }
  }

  // Determine operator based on type
  if (firstType === "string") {
    sqlOperator = "||";
  } else if (firstType === "number" || firstType === "bigint") {
    sqlOperator = "+";
  } else {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: `sqlStringForPlusTransformer operand type not supported: ${firstType}`,
    });
  }

  // Build SQL expression left-to-right
  let sqlExpression = evaluatedArgs[0].sqlStringOrObject;
  for (let i = 1; i < evaluatedArgs.length; i++) {
    sqlExpression = sqlExpression + " " + sqlOperator + " " + evaluatedArgs[i].sqlStringOrObject;
  }

  return {
    type: "scalar",
    sqlStringOrObject: (topLevelTransformer ? "select " : "") + sqlExpression +
      (topLevelTransformer ? ` AS "${withClauseColumnName??"plus"}"` : ""),
    preparedStatementParameters,
    resultAccessPath: topLevelTransformer ? [0, withClauseColumnName??"plus"] : undefined,
    columnNameContainingJsonValue: topLevelTransformer ? withClauseColumnName??"plus" : undefined,
    usedContextEntries: allUsedContextEntries,
  };
}

// ################################################################################################
// SQL implementation of the "case" transformer (similar to SQL CASE WHEN expression)
// Evaluates discriminator and matches against whens, returning corresponding then result
function sqlStringForCaseTransformer(
  actionRuntimeTransformer: {
    transformerType: "case";
    interpolation?: "build" | "runtime";
    discriminator: TransformerForBuildPlusRuntime;
    whens: Array<{ when: TransformerForBuildPlusRuntime; then: TransformerForBuildPlusRuntime }>;
    else?: TransformerForBuildPlusRuntime;
  },
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  let newPreparedStatementParametersCount = preparedStatementParametersCount;
  let preparedStatementParameters: any[] = [];
  let usedContextEntries: string[] = [];
  let extraWith: { name: string; sql: string; sqlResultAccessPath?: ResultAccessPath }[] = [];

  // Evaluate the discriminator
  const discriminator = sqlStringForRuntimeTransformer(
    actionRuntimeTransformer.discriminator as TransformerForBuildPlusRuntime,
    newPreparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
    false, // topLevelTransformer
    undefined, // withClauseColumnName
  );
  if (discriminator instanceof Domain2ElementFailed) {
    return discriminator;
  }
  if (discriminator.preparedStatementParameters) {
    preparedStatementParameters = [
      ...preparedStatementParameters,
      ...discriminator.preparedStatementParameters,
    ];
    newPreparedStatementParametersCount += discriminator.preparedStatementParameters.length;
  }
  usedContextEntries = [...usedContextEntries, ...(discriminator.usedContextEntries ?? [])];
  if (discriminator.extraWith) {
    extraWith = [...extraWith, ...discriminator.extraWith];
  }

  // Build WHEN clauses
  const whenClauses: string[] = [];
  for (const whenClause of actionRuntimeTransformer.whens) {
    // Evaluate the "when" value
    const whenValue = sqlStringForRuntimeTransformer(
      whenClause.when as TransformerForBuildPlusRuntime,
      newPreparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      false,
      undefined,
    );
    if (whenValue instanceof Domain2ElementFailed) {
      return whenValue;
    }
    if (whenValue.preparedStatementParameters) {
      preparedStatementParameters = [
        ...preparedStatementParameters,
        ...whenValue.preparedStatementParameters,
      ];
      newPreparedStatementParametersCount += whenValue.preparedStatementParameters.length;
    }
    usedContextEntries = [...usedContextEntries, ...(whenValue.usedContextEntries ?? [])];
    if (whenValue.extraWith) {
      extraWith = [...extraWith, ...whenValue.extraWith];
    }

    // Evaluate the "then" result
    const thenValue = sqlStringForRuntimeTransformer(
      whenClause.then as TransformerForBuildPlusRuntime,
      newPreparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      false,
      undefined,
    );
    if (thenValue instanceof Domain2ElementFailed) {
      return thenValue;
    }
    if (thenValue.preparedStatementParameters) {
      preparedStatementParameters = [
        ...preparedStatementParameters,
        ...thenValue.preparedStatementParameters,
      ];
      newPreparedStatementParametersCount += thenValue.preparedStatementParameters.length;
    }
    usedContextEntries = [...usedContextEntries, ...(thenValue.usedContextEntries ?? [])];
    if (thenValue.extraWith) {
      extraWith = [...extraWith, ...thenValue.extraWith];
    }

    whenClauses.push(`when ${discriminator.sqlStringOrObject} = ${whenValue.sqlStringOrObject} then ${thenValue.sqlStringOrObject}`);
  }

  // Evaluate the "else" clause if present
  let elseClause = "";
  if (actionRuntimeTransformer.else) {
    const elseValue = sqlStringForRuntimeTransformer(
      actionRuntimeTransformer.else as TransformerForBuildPlusRuntime,
      newPreparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      false,
      undefined,
    );
    if (elseValue instanceof Domain2ElementFailed) {
      return elseValue;
    }
    if (elseValue.preparedStatementParameters) {
      preparedStatementParameters = [
        ...preparedStatementParameters,
        ...elseValue.preparedStatementParameters,
      ];
      newPreparedStatementParametersCount += elseValue.preparedStatementParameters.length;
    }
    usedContextEntries = [...usedContextEntries, ...(elseValue.usedContextEntries ?? [])];
    if (elseValue.extraWith) {
      extraWith = [...extraWith, ...elseValue.extraWith];
    }
    elseClause = ` else ${elseValue.sqlStringOrObject}`;
  } else {
    // When no else clause, SQL CASE returns NULL by default, which maps to undefined/null
    elseClause = " else null";
  }

  // Build the complete CASE expression
  const caseExpression = `case ${whenClauses.join(" ")}${elseClause} end`;

  // Build FROM clause if context entries are used
  const uniqueUsedContextEntries = [...new Set(usedContextEntries)];
  const fromClause = topLevelTransformer && uniqueUsedContextEntries.length > 0
    ? ` FROM ${uniqueUsedContextEntries.map(e => `"${e}"`).join(", ")}`
    : "";

  return {
    type: "scalar",
    sqlStringOrObject: (topLevelTransformer ? "select " : "") + caseExpression +
      (topLevelTransformer ? ` AS "${withClauseColumnName ?? "case"}"${fromClause}` : ""),
    preparedStatementParameters,
    resultAccessPath: topLevelTransformer ? [0, withClauseColumnName ?? "case"] : undefined,
    columnNameContainingJsonValue: topLevelTransformer ? withClauseColumnName ?? "case" : undefined,
    usedContextEntries,
    extraWith: extraWith.length > 0 ? extraWith : undefined,
  };
}

// ################################################################################################
function getFreeObjectAttributesSql(
  subTableName: string,
  objectAttributes: [string, SqlStringForTransformerElementValue][],
  failureObjectSqlString: string = queryFailureObjectSqlString
): SqlQuerySelectExpressionSchema {
  const testForAttributeError = objectAttributes
    .filter(
      (e) => e[1].type == "json" || e[1].type == "json_array" || e[1].type == "tableOf1JsonColumn"
    )
    .map((e) => {
      if (e[1].index == undefined) {
        throw new Error(
          subTableName +
            ": index is not defined for attribute " +
            e[0] +
            " " +
            JSON.stringify(e[1], null, 2)
        );
      }
      return `NOT ("object_createObject_sub"."A${2 * e[1].index + 1}" ? 'queryFailure')`;
    }) // we take the expression not the index (thus +1)
    .join(" AND ");
  const attributeElementsJsonBuild = objectAttributes.flatMap((e, index) => {
    return [`"${subTableName}"."A${2 * index}"`, `"${subTableName}"."A${2 * index + 1}"`];
  });
  const testAndReturnValue: SqlQuerySelectExpressionSchema =
    testForAttributeError.length > 0
      ? {
          queryPart: "case",
          when: testForAttributeError,
          then: {
            queryPart: "call",
            fct: "jsonb_build_object",
            params: attributeElementsJsonBuild,
          },
          else: {
            queryPart: "bypass",
            value: failureObjectSqlString,
          },
        }
      : {
          queryPart: "call",
          fct: "jsonb_build_object",
          params: attributeElementsJsonBuild,
        };
  return testAndReturnValue;
}

// ################################################################################################
function sqlStringForFreeObjectTransformer(
  actionRuntimeTransformer:
    | TransformerForBuild_createObject
    | TransformerForBuildPlusRuntime_createObject,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  let newPreparedStatementParametersCount = preparedStatementParametersCount;
  let preparedStatementParameters: any[] = [];
  const objectAttributes: [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>][] =
    Object.entries(actionRuntimeTransformer.definition).map((f, index) => {
      switch (typeof f[1]) {
        case "string": {
          return [
            f[0],
            {
              type: "scalar",
              sqlStringOrObject: `'${f[1]}'`,
              index,
            },
          ];
        }
        case "number": {
          return [
            f[0],
            {
              type: "scalar",
              sqlStringOrObject: `${f[1]}::double precision`,
              index,
            },
          ];
        }
        case "bigint": {
          return [
            f[0],
            {
              type: "scalar",
              sqlStringOrObject: `${f[1]}::bigint`,
              index,
            },
          ];
        }
        case "boolean": {
          return [
            f[0],
            {
              type: "scalar",
              sqlStringOrObject: `${f[1]}::boolean`,
              index,
            },
          ];
        }
        case "object": {
          if (Array.isArray(f[1])) {
            throw new Error(
              "sqlStringForRuntimeTransformer createObject array not implemented"
            );
          }
          if (f[1] == null) {
            throw new Error(
              "sqlStringForRuntimeTransformer createObject null not implemented"
            );
          }

          if (f[1].transformerType) {
            const attributeSqlString = sqlStringForRuntimeTransformer(
              f[1] as TransformerForBuildPlusRuntime,
              newPreparedStatementParametersCount,
              indentLevel,
              queryParams,
              definedContextEntries,
              useAccessPathForContextReference,
              false // topLevelTransformer
              // undefined, // withClauseColumnName
              // iterateOn, // iterateOn
            );
            if (attributeSqlString instanceof Domain2ElementFailed) {
              // return [f[0], { attributeValue: attributeSqlString, index,}];
              return [f[0], attributeSqlString];
            }
            if (attributeSqlString.preparedStatementParameters) {
              preparedStatementParameters = [
                ...preparedStatementParameters,
                ...attributeSqlString.preparedStatementParameters,
              ];
              newPreparedStatementParametersCount +=
                attributeSqlString.preparedStatementParameters.length;
            }
            // return `"${f[0]}", ${attributeValue.sqlStringOrObject}`;
            return [f[0], {...attributeSqlString, index}];
          } else {
            const getSqlParams = getConstantSqlTypeMap["constantObject"];
            return [
              f[0],
              {...getConstantSql(
                {
                  transformerType: "constantObject",
                  value: f[1],
                },
                preparedStatementParametersCount,
                topLevelTransformer,
                getSqlParams.targetType,
                getSqlParams.sqlTargetType,
                withClauseColumnName ?? getSqlParams.label
              ), index},
            ];
          }
          throw new Error(
            "sqlStringForRuntimeTransformer createObject object for " +
              f[0] +
              " returning no value for type:" +
              typeof f[1]
          );
          break;
        }
        case "symbol":
        case "undefined":
        case "function": {
          throw new Error(
            "sqlStringForRuntimeTransformer createObject for " +
              f[0] +
              " not implemented for type:" +
              typeof f[1]
          );
          break;
        }
        default:
          break;
      }
    }) as any;
  const attributeError = objectAttributes.find(
    (e: [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>]) =>
      e[1] instanceof Domain2ElementFailed
  );

  if (attributeError) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage:
        "sqlStringForRuntimeTransformer createObject attributeValue failed: " +
        JSON.stringify(attributeError, null, 2),
    });
  }

  const castObjectAttributes = objectAttributes as [string, SqlStringForTransformerElementValue][];
  const usedContextEntries = castObjectAttributes.reduce(
    (acc: string[], e: [string, SqlStringForTransformerElementValue]) => {
      if (e[1].usedContextEntries) {
        return [...acc, ...e[1].usedContextEntries];
      }
      return acc;
    },
    []
  );
  const subQueryExtraWith: { name: string; sql: string; sqlResultAccessPath?: ResultAccessPath }[] =
    castObjectAttributes.flatMap((e: [string, SqlStringForTransformerElementValue], index) =>
      e[1].extraWith ? e[1].extraWith : []
    );
  const selectFromList: string[] = Array.from(
    new Set<string>(
      (iterateOn ? [iterateOn] : []).concat([
        ...subQueryExtraWith.map((e) => e.name),
        ...usedContextEntries.map((e) => e),
      ])
    ).values()
  );

  log.info(
    "sqlStringForRuntimeTransformer createObject",
    "topLevelTransformer",
    topLevelTransformer,
    "objectAttributes",
    JSON.stringify(objectAttributes, null, 2)
    // JSON.stringify(objectAttributesSql, null, 2)
  );


  const sqlNewQuery: string = sqlQuery(0, {
    queryPart: "query",
    select: [
      {
        queryPart: "defineColumn",
        value: getFreeObjectAttributesSql(
          "object_createObject_sub",
          castObjectAttributes,
          queryFailureObjectSqlString
        ),
        as: "object_createObject",
      },
    ],
    from: [
      {
        queryPart: "hereTable",
        definition: {
          queryPart: "query",
          select: castObjectAttributes.flatMap((e, index) => {
            return [
              {
                queryPart: "defineColumn",
                value: `'${e[0]}'`, // single quotes for the name of the attribute, which is always a string
                as: `A${2 * index}`,
              },
              {
                queryPart: "defineColumn",
                value:
                  e[1].sqlStringOrObject +
                  (e[1].extraWith && e[1].extraWith.length > 0 // TODO: does this work? is it useful? (this is apparently for the case when sqlStringOrObject is a reference to a table)
                    ? '."' + e[1].extraWith[0].sqlResultAccessPath?.slice(1) + '"'
                    : ""),
                as: `A${2 * index + 1}`,
              },
            ];
          }),
          from:
            selectFromList.length > 0
              ? selectFromList.map((e) => ({
                  queryPart: "hereTable",
                  definition: {
                    queryPart: "query",
                    select: [
                      "ROW_NUMBER() OVER () AS row_num",
                      {
                        queryPart: "defineColumn",
                        value: {
                          queryPart: "tableColumnAccess",
                          table: e,
                        },
                      },
                    ],
                    from: [
                      {
                        queryPart: "tableLiteral",
                        name: e,
                      },
                    ],
                  },
                  as: e,
                }))
              : undefined,
        },
        as: "object_createObject_sub",
      },
    ],
  });
  if (topLevelTransformer) {
    return {
      type: "json",
      sqlStringOrObject: sqlNewQuery,
      preparedStatementParameters,
      extraWith: subQueryExtraWith,
      resultAccessPath: [0, "object_createObject"],
      columnNameContainingJsonValue: "object_createObject",
    };
  } else {
    log.info(
      "sqlStringForRuntimeTransformer createObject for !topLevelTransformer");
    return {
      type: "tableOf1JsonColumn",
      sqlStringOrObject: `"object_subcreateObject"`, // TODO: REMOVE DOUBLE QUOTES
      extraWith: [
        ...subQueryExtraWith,
        {
          name: "object_subcreateObject",
          sql: sqlNewQuery,
          sqlResultAccessPath: [0, "object_createObject"],
        },
      ],
      preparedStatementParameters,
      resultAccessPath: [0, "object_createObject"],
      columnNameContainingJsonValue: "object_createObject",
    };
  }
  // break;
}
// ################################################################################################
function sqlStringForUniqueTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_getUniqueValues,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const orderBy = (actionRuntimeTransformer as any).orderBy
    ? `ORDER BY "${(actionRuntimeTransformer as any).orderBy}"`
    : "";
  const referenceQuery = sqlStringForApplyTo(
    actionRuntimeTransformer,
    preparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
    topLevelTransformer,
  );
  if (referenceQuery instanceof Domain2ElementFailed) {
    return referenceQuery;
  }
  switch (referenceQuery.type) {
    case "json_array":
    case "json": {
      return {
        type: "json",
        sqlStringOrObject: `
SELECT jsonb_agg(t."getUniqueValues_applyTo_array") AS "getUniqueValues_objects"
FROM (
SELECT DISTINCT ON ("getUniqueValues_applyTo_array"->>'${actionRuntimeTransformer.attribute}') "getUniqueValues_applyTo_array"
FROM (${referenceQuery.sqlStringOrObject}) AS "getUniqueValues_applyTo", 
LATERAL jsonb_array_elements("getUniqueValues_applyTo"."${
(referenceQuery as any).resultAccessPath[1]
}") AS "getUniqueValues_applyTo_array"
ORDER BY "getUniqueValues_applyTo_array"->>'${actionRuntimeTransformer.attribute}'
) t
`,
        preparedStatementParameters: referenceQuery.preparedStatementParameters,
        resultAccessPath: [0, "getUniqueValues_objects"],
        columnNameContainingJsonValue: "getUniqueValues_objects",
      };
      break;
    }
    case "table": {
      const transformerSqlQuery = `
SELECT DISTINCT ON ("getUniqueValues_applyTo"."${actionRuntimeTransformer.attribute}") "${actionRuntimeTransformer.attribute}" 
FROM (${referenceQuery.sqlStringOrObject}) AS "getUniqueValues_applyTo"
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
        failureMessage: "sqlStringForRuntimeTransformer getUniqueValues referenceQuery result is scalar, not json",
      });
      break;
    }
    default: {
      throw new Error(
        "sqlStringForRuntimeTransformer getUniqueValues referenceQuery result type is not known: " +
          referenceQuery.type
      );
      break;
    }
  }
}

// ################################################################################################
function sqlStringForMapperListToListTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_mapList,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  /**
   * must take the rerferencedExtractor result and make it avaialable to elementTransformer, apply the elementTransformer to
   * each element of the list and return the sorted list of transformed elements
   */
  // throw new Error("sqlStringForRuntimeTransformer mapList not implemented");
  let newPreparedStatementParametersCount = preparedStatementParametersCount;

  const transformerLabel: string = (actionRuntimeTransformer as any).label ?? actionRuntimeTransformer.transformerType;
  const referenceToOuterObjectRenamed: string =
    transformerLabel + "_" + actionRuntimeTransformer.referenceToOuterObject;
  
  
  const sqlStringForElementTransformer =
    typeof actionRuntimeTransformer.elementTransformer == "object" &&
    Object.hasOwn(actionRuntimeTransformer.elementTransformer, "transformerType") &&
    ((actionRuntimeTransformer.elementTransformer as any)["interpolation"]??"build") == "runtime"
      ? sqlStringForRuntimeTransformer(
          actionRuntimeTransformer.elementTransformer as TransformerForBuildPlusRuntime,
          newPreparedStatementParametersCount,
          indentLevel,
          queryParams,
          {
            ...definedContextEntries,
            [actionRuntimeTransformer.referenceToOuterObject??defaultTransformerInput]: {
              type: "json",
              renameTo: referenceToOuterObjectRenamed,
              attributeResultAccessPath: ["element"],
            },
          }, // contextEntries
          useAccessPathForContextReference,
          topLevelTransformer,
          undefined, // withClauseColumnName
          referenceToOuterObjectRenamed // iterateOn
        )
      : sqlStringForRuntimeTransformer(
          {
            transformerType: "returnValue",
            interpolation: "runtime",
            value: transformer_extended_apply_wrapper(
              undefined, // activityTracker
              "build", // TODO: resolve for runtime transformer. Does it make sense?
              [], // tranformerPath
              undefined,
              actionRuntimeTransformer.elementTransformer,
              // {...defaultMetaModelEnvironment, ...queryParams},
              defaultMetaModelEnvironment, // TODO: use actual model environment for current deployment
              queryParams,
              {}, // contextResults, we are evaluating a build transformer here, not a runtime transformer
              "value"
            ),
          },
          newPreparedStatementParametersCount,
          indentLevel,
          queryParams,
          {
            ...definedContextEntries,
            [actionRuntimeTransformer.referenceToOuterObject??defaultTransformerInput]: {
              type: "json",
              renameTo: referenceToOuterObjectRenamed,
              attributeResultAccessPath: ["element"],
            },
          }, // contextEntries
          useAccessPathForContextReference,
          topLevelTransformer,
          undefined, // withClauseColumnName
          referenceToOuterObjectRenamed // iterateOn
        );

  log.info(
    "sqlStringForMapperListToListTransformer mapList found elementTransformer",
    JSON.stringify(sqlStringForElementTransformer, null, 2)
  );
  if (sqlStringForElementTransformer instanceof Domain2ElementFailed) {
    return sqlStringForElementTransformer;
  }
  if (sqlStringForElementTransformer.type != "json") {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForMapperListToListTransformer mapList elementTransformer not json",
    });
  }

  let preparedStatementParameters: any[] = sqlStringForElementTransformer.preparedStatementParameters ?? [];
  newPreparedStatementParametersCount += preparedStatementParameters.length;

  const applyTo = sqlStringForApplyTo(
    actionRuntimeTransformer,
    newPreparedStatementParametersCount,
    indentLevel + 2,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,// false, // useAccessPathForContextReference,
    topLevelTransformer,
);
  // log.info("sqlStringForRuntimeTransformer mapList found applyTo", JSON.stringify(applyTo, null, 2));
  if (applyTo instanceof Domain2ElementFailed) {
    return applyTo;
  }
  if (!["json", "json_array"].includes(applyTo.type)) { // TODO: why is cast needed?
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForMapperListToListTransformer mapList referenceQuery result is not json:" + applyTo.type,
    });
  }

  if (applyTo.preparedStatementParameters) {
    preparedStatementParameters = [...preparedStatementParameters, ...applyTo.preparedStatementParameters];
    newPreparedStatementParametersCount += applyTo.preparedStatementParameters.length;
  }
  log.info(
    "sqlStringForMapperListToListTransformer mapList applyTo",
    JSON.stringify(applyTo, null, 2),
  )
  switch (applyTo.type) {
    case "json_array": 
    case "json": {
      const extraWith: { name: string; sql: string }[] = [
        ...applyTo.extraWith??[],
        {
          name: referenceToOuterObjectRenamed,
          sql:
            // flushAndIndent(indentLevel) +
            'SELECT "' + transformerLabel + '_oneElementPerRow"."element" FROM (' +
            flushAndIndent(indentLevel + 1) +
            'SELECT jsonb_array_elements("' + transformerLabel + '_applyTo"."' +
            (applyTo as any).resultAccessPath[1] +
            '") AS "element" FROM (' +
            flushAndIndent(indentLevel + 2) +
            applyTo.sqlStringOrObject +
            flushAndIndent(indentLevel + 1) +
            ') AS "' + transformerLabel + '_applyTo"' +
            flushAndIndent(indentLevel) +
            ') AS "' + transformerLabel + '_oneElementPerRow"',
        },
        ...sqlStringForElementTransformer.extraWith??[],
        {
          name: transformerLabel + "_elementTransformer",
          sql: sqlStringForElementTransformer.sqlStringOrObject,
        },
      ];
      const sqlResult = `SELECT "${sqlStringForElementTransformer.columnNameContainingJsonValue}" FROM "${transformerLabel}_elementTransformer"`;

      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters,
        extraWith,
        resultAccessPath: [
          {
            type: "map",
            key:
              sqlStringForElementTransformer.columnNameContainingJsonValue ??
              "mapperListToList_NO_COLUMN_NAME_FOUND",
          },
        ],
        columnNameContainingJsonValue:
          sqlStringForElementTransformer.columnNameContainingJsonValue,
      };
      break;
    }
    // case "table": {
    //   // const column = applyTo.resultAccessPath ? "." + applyTo.resultAccessPath.join(".") : "";
    //   // const sqlResult = `SELECT * FROM (${applyTo.sqlStringOrObject}) AS "mapList" ORDER BY ${column}`;
    //   const sqlResult = `SELECT * FROM (${applyTo.sqlStringOrObject}) AS "mapList"`;
    //   return {
    //     // type: "json",
    //     type: "table",
    //     sqlStringOrObject: sqlResult,
    //     preparedStatementParameters: applyTo.preparedStatementParameters,
    //     resultAccessPath: [0, "mapList"],
    //   };
    //   break;
    // }
    // case "scalar": {
    //   return new Domain2ElementFailed({
    //     queryFailure: "QueryNotExecutable",
    //     query: actionRuntimeTransformer as any,
    //     failureMessage: "sqlStringForRuntimeTransformer mapList referenceQuery result is scalar, not json",
    //   });
    //   break;
    // }
    default: {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForMapperListToListTransformer mapList referenceQuery not json",
      });
      break;
    }
  }
}

// ################################################################################################
function sqlStringForListPickElementTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_pickFromList,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  log.info(
    "sqlStringForListPickElementTransformer pickFromList called for",
    JSON.stringify(actionRuntimeTransformer, null, 2),
    "topLevelTransformer",
    topLevelTransformer,
    "useAccessPathForContextReference",
    useAccessPathForContextReference,
    "definedContextEntries",
    JSON.stringify(definedContextEntries, null, 2)
  );
  if (topLevelTransformer) {
    const sqlForApplyTo = sqlStringForApplyTo(
      actionRuntimeTransformer,
      preparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      topLevelTransformer
    );

    log.info("sqlStringForListPickElementTransformer pickFromList found applyTo", JSON.stringify(sqlForApplyTo, null, 2));
    if (sqlForApplyTo instanceof Domain2ElementFailed) {
      return sqlForApplyTo;
    }

    const limit = actionRuntimeTransformer.index;
    let sqlResult;
    switch (sqlForApplyTo.type) {
      case "tableOf1JsonColumn": {
        // return new Domain2ElementFailed({
        //   queryFailure: "QueryNotExecutable",
        //   query: actionRuntimeTransformer as any,
        //   failureMessage: "sqlStringForListPickElementTransformer pickFromList referenceQuery result is tableOf1JsonColumn",
        // });
        if (actionRuntimeTransformer.orderBy) {
          sqlResult = `SELECT * FROM (${sqlForApplyTo.sqlStringOrObject}) AS "pickFromList" ORDER BY ${actionRuntimeTransformer.orderBy} LIMIT 1 OFFSET ${limit}`;
        } else {
          sqlResult = `SELECT * FROM (${sqlForApplyTo.sqlStringOrObject}) AS "pickFromList" LIMIT 1 OFFSET ${limit}`;
        }
        return {
          type: "json",
          sqlStringOrObject: sqlResult,
          preparedStatementParameters: sqlForApplyTo.preparedStatementParameters,
          // resultAccessPath: [0, ...(sqlForApplyTo.resultAccessPath ?? [])],
          // resultAccessPath: [ 0 ],
          resultAccessPath: sqlForApplyTo.columnNameContainingJsonValue
            ? [0, sqlForApplyTo.columnNameContainingJsonValue]
            : [0],
          columnNameContainingJsonValue: "pickFromList",
        };

      }
      case "json_array":
      case "json": {
        if (actionRuntimeTransformer.orderBy) {
          sqlResult = `
SELECT (
jsonb_agg(
  "listPickElement_applyTo_array" ORDER BY (
    "listPickElement_applyTo_array" ->> '${actionRuntimeTransformer.orderBy}'
  )::"any"
) ->> ${limit}
)::jsonb AS "pickFromList" 
FROM
(${sqlForApplyTo.sqlStringOrObject}) AS "listPickElement_applyTo", 
LATERAL jsonb_array_elements("listPickElement_applyTo"."${
  (sqlForApplyTo as any).resultAccessPath[1]
}") AS "listPickElement_applyTo_array"
`;
        } else { // no orderBy
          sqlResult = `
SELECT "listPickElement_applyTo_array"."value" AS "pickFromList"
FROM
(${sqlForApplyTo.sqlStringOrObject}) AS "listPickElement_applyTo", 
LATERAL jsonb_array_elements("listPickElement_applyTo"."${
(sqlForApplyTo as any).resultAccessPath[1]
}") AS "listPickElement_applyTo_array" LIMIT 1 OFFSET ${limit}
`;
        }
        return {
          type: "json",
          sqlStringOrObject: sqlResult,
          preparedStatementParameters: sqlForApplyTo.preparedStatementParameters,
          resultAccessPath: [0, "pickFromList"],
          columnNameContainingJsonValue: "pickFromList",
        };
        break;
      }
      case "table": {
        // const column = referenceQuery.resultAccessPath?"." + referenceQuery.resultAccessPath.join("."): "";
        if (actionRuntimeTransformer.orderBy) {
          sqlResult = `SELECT * FROM (${sqlForApplyTo.sqlStringOrObject}) AS "pickFromList" ORDER BY ${actionRuntimeTransformer.orderBy} LIMIT 1 OFFSET ${limit}`;
        } else {
          sqlResult = `SELECT * FROM (${sqlForApplyTo.sqlStringOrObject}) AS "pickFromList" LIMIT 1 OFFSET ${limit}`;
        }
        return {
          type: "json",
          sqlStringOrObject: sqlResult,
          preparedStatementParameters: sqlForApplyTo.preparedStatementParameters,
          // resultAccessPath: [0, ...(sqlForApplyTo.resultAccessPath ?? [])],
          // resultAccessPath: [ 0, "value" ],
          resultAccessPath: [ 0 ],
          columnNameContainingJsonValue: "pickFromList",
        };
        break;
      }
      case "scalar": {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForListPickElementTransformer pickFromList referenceQuery result is scalar, not json",
        });
        break;
      }
      default: {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForListPickElementTransformer pickFromList referenceQuery not json",
        });
        break;
      }
    }
  } else {
    throw new Error("sqlStringForListPickElementTransformer pickFromList not implemented for (non-topLevel) inner transformer");
  }
  // break;
}

// ################################################################################################
// TODO: used for build, too, type is incorrect
function sqlStringForObjectFullTemplateTransformer(
  // actionRuntimeTransformer: TransformerForBuild_createObjectFromPairs | TransformerForBuildPlusRuntime_createObjectFromPairs,
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_createObjectFromPairs,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  // withClauseColumnName?: string,
  // iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const orderBy = (actionRuntimeTransformer as any).orderBy
    ? `ORDER BY "${(actionRuntimeTransformer as any).orderBy}"`
    : "";
  if (topLevelTransformer) {
    let newPreparedStatementParametersCount = preparedStatementParametersCount;
    const newDefinedContextEntries = {
      ...definedContextEntries,
    };
    const resolvedApplyTo = sqlStringForApplyTo(
      actionRuntimeTransformer,
      newPreparedStatementParametersCount,
      indentLevel,
      queryParams,
      newDefinedContextEntries,
      useAccessPathForContextReference,
      topLevelTransformer,
    );
    if (resolvedApplyTo instanceof Domain2ElementFailed) {
      return resolvedApplyTo;
    }
    const accessPathHasMap = resolvedApplyTo.resultAccessPath?.find(
      (e: any) => typeof e == "object" && e.type == "map"
    );
    if (accessPathHasMap) {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForObjectFullTemplateTransformer createObjectFromPairs resultAccessPath has map: " + JSON.stringify(resolvedApplyTo.resultAccessPath, null, 2),
      });
    }

    let preparedStatementParameters: any[] = resolvedApplyTo.preparedStatementParameters ?? [];
    const baseName: string = (actionRuntimeTransformer as any).label
      ? (actionRuntimeTransformer as any).label + "_"
      : "";
    const applyToName: string =
      ((actionRuntimeTransformer as any).label
        ? (actionRuntimeTransformer as any).label
        : actionRuntimeTransformer.transformerType) +
      "_" +
      actionRuntimeTransformer.referenceToOuterObject;

    const contextEntryType = resolvedApplyTo.type == "tableOf1JsonColumn" ? "table" : (resolvedApplyTo.type ?? "json");
    newDefinedContextEntries[actionRuntimeTransformer.referenceToOuterObject??defaultTransformerInput] = {
      type: contextEntryType,  // Use the type from resolvedApplyTo, treating tableOf1JsonColumn as table
      renameTo: applyToName,
      // For table types, don't use attributeResultAccessPath since we access columns directly
      // For JSON types, use columnNameContainingJsonValue or resultAccessPath
      attributeResultAccessPath: contextEntryType == "table" 
        ? undefined 
        : (resolvedApplyTo.columnNameContainingJsonValue
            ? [resolvedApplyTo.columnNameContainingJsonValue]
            : (resolvedApplyTo.resultAccessPath?.slice(1) as any)), // correct since resolvedApplyTo has no "map" (object) item
    };
    newPreparedStatementParametersCount += preparedStatementParameters.length;
    const extraWith: (
      { name: string; sql: string; sqlResultAccessPath?: ResultAccessPath }
      | Domain2ElementFailed
    )[] = actionRuntimeTransformer.definition.flatMap(
      (f, index): ({ name: string; sql: string; sqlResultAccessPath?: ResultAccessPath } | Domain2ElementFailed)[] => {
        const attributeValueName = baseName + "attributeValue" + index;
        const attributeValue = sqlStringForRuntimeTransformer(
          f.attributeValue,
          newPreparedStatementParametersCount,
          indentLevel,
          queryParams,
          newDefinedContextEntries,
          useAccessPathForContextReference,
          true, // topLevelTransformer,
          attributeValueName, // withClauseColumnName
          // iterateOn, // iterateOn
        );
        log.info(
          "sqlStringForObjectFullTemplateTransformer createObjectFromPairs attributeValue for",
          attributeValueName,
          "=",
          JSON.stringify(attributeValue, null, 2),
          "is error:",
          attributeValue instanceof Domain2ElementFailed
        );
        if (attributeValue instanceof Domain2ElementFailed) {
          return [attributeValue];
        }
        if (attributeValue.preparedStatementParameters) {
          preparedStatementParameters = [
            ...preparedStatementParameters,
            ...attributeValue.preparedStatementParameters,
          ];
          newPreparedStatementParametersCount += attributeValue.preparedStatementParameters.length;
        }

        const attributeKey = typeof f.attributeKey == "object" && (f.attributeKey as any).transformerType? sqlStringForRuntimeTransformer(
          f.attributeKey,
          newPreparedStatementParametersCount,
          indentLevel,
          queryParams,
          newDefinedContextEntries,
          useAccessPathForContextReference,
          true, // topLevelTransformer,
          `${baseName}attributeKey${index}` // withClauseColumnName
          // iterateOn, // iterateOn
        ):
        sqlStringForRuntimeTransformer(
          {
            transformerType: "returnValue",
            interpolation: "runtime",
            value: f.attributeKey
          },
          newPreparedStatementParametersCount,
          indentLevel,
          queryParams,
          newDefinedContextEntries,
          useAccessPathForContextReference,
          true, // topLevelTransformer,
          `${baseName}attributeKey${index}` // withClauseColumnName
          // iterateOn, // iterateOn
        );
        if (attributeKey instanceof Domain2ElementFailed) {
          return [attributeKey];
        }
        if (attributeKey.type == "table") {
          return [new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForObjectFullTemplateTransformer createObjectFromPairs attributeKey is table",
          })];
        }
        if (!attributeKey.resultAccessPath) {
          return [new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForObjectFullTemplateTransformer createObjectFromPairs attributeKey has no resultAccessPath",
          })];
        }
        if (attributeKey.preparedStatementParameters) {
          preparedStatementParameters = [
            ...preparedStatementParameters,
            ...attributeKey.preparedStatementParameters,
          ];
          newPreparedStatementParametersCount += attributeKey.preparedStatementParameters.length;
        }

        const attributeKeyName = baseName + "attributeKey" + index;
        let attributeKeySql: string;
        if (attributeKey.type == "json") {
          // attributeKeySql = `"${attributeKeyName}"."${(attributeKey.resultAccessPath as any)[1]}"`;
          attributeKeySql =
            `SELECT trim(both '"' from "${attributeKey.resultAccessPath[1]}"::text) as "${attributeKey.resultAccessPath[1]}"` +
            flushAndIndent(indentLevel) +
            `FROM (` + 
            flushAndIndent(indentLevel + 1) +
            `${attributeKey.sqlStringOrObject}) AS "${attributeKey.resultAccessPath[1]}"`;
        } else {
          attributeKeySql = attributeKey.sqlStringOrObject;
        }
        return [
          {
            name: attributeKeyName,
            sql: attributeKeySql,
            sqlResultAccessPath: attributeKey.resultAccessPath,
          },
          {
            name: baseName + "attributeValue" + index,
            sql: attributeValue.sqlStringOrObject,
            sqlResultAccessPath: attributeValue.resultAccessPath,
          },
        ];
      }
    );

    const hasError = extraWith.find((e) => e instanceof Domain2ElementFailed);
    if (hasError) {
      return hasError as any;
    }
    const castExtraWith = extraWith as { name: string; sql: string; sqlResultAccessPath?: ResultAccessPath }[];
    const resultExtraWith: { name: string; sql: string; sqlResultAccessPath?: (string | number)[]}[] = [
      {
        name: applyToName,
        sql: resolvedApplyTo.sqlStringOrObject,
        sqlResultAccessPath: resolvedApplyTo.resultAccessPath?.slice(1), // checked for map above
      },
      ...(resolvedApplyTo.extraWith ?? []) as any,
      ...extraWith
    ];

    // Build a new object with keys and corresponding values from the definition.
    const objectKeyValues = castExtraWith
      .map((e, index) => `"${e.name}"."${(e.sqlResultAccessPath as any)[1]}"`)
      .join(", ");
    const objectKeyValues_With_references = castExtraWith
      .map((e, index) => {
        return `"${e.name}"`;
      })
      .join(", ");
    log.info("sqlStringForObjectFullTemplateTransformer createObjectFromPairs extraWidth", JSON.stringify(extraWith,null,2));
    const sqlResult =
      // flushAndIndent(indentLevel) +
      "SELECT jsonb_build_object(" +
      objectKeyValues +
      ') AS "createObjectFromPairs" ' +
      flushAndIndent(indentLevel) +
      "FROM " +
      objectKeyValues_With_references +
      flushAndIndent(indentLevel) +
      orderBy;
    // const sqlResult = `SELECT jsonb_build_object(${objectAttributes}) AS "innerFullObjectTemplate" FROM ${objectAttributes_With_references} GROUP BY ${objectAttributes} ${orderBy}`;
    log.info("sqlStringForObjectFullTemplateTransformer createObjectFromPairs sqlResult", JSON.stringify(sqlResult));
    return {
      type: "json",
      sqlStringOrObject: sqlResult,
      preparedStatementParameters,
      resultAccessPath: [0, "createObjectFromPairs"],
      columnNameContainingJsonValue: "createObjectFromPairs",
      extraWith: resultExtraWith,
    };
  } else { // topLevelTransformer == false
    let newPreparedStatementParametersCount = preparedStatementParametersCount;
    const resolvedApplyTo = sqlStringForApplyTo(
      actionRuntimeTransformer,
      newPreparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries, // undefined, // undefined, since the result will always be taken from this "WITH" clause.
      useAccessPathForContextReference, // useAccessPathForContextReference,
      topLevelTransformer,
    );
    if (resolvedApplyTo instanceof Domain2ElementFailed) {
      return resolvedApplyTo;
    }
    log.info("sqlStringForObjectFullTemplateTransformer createObjectFromPairs resolvedApplyTo", JSON.stringify(resolvedApplyTo, null, 2));

    let preparedStatementParameters: any[] = resolvedApplyTo.preparedStatementParameters ?? [];
    newPreparedStatementParametersCount += preparedStatementParameters.length;

    const objectAttributes = actionRuntimeTransformer.definition
      .map((f, index) => {
        const attributeValue = sqlStringForRuntimeTransformer(
          f.attributeValue,
          newPreparedStatementParametersCount,
          indentLevel,
          queryParams,
          definedContextEntries,
          useAccessPathForContextReference,
          false, // topLevelTransformer
          // undefined, // withClauseColumnName
          // iterateOn, // iterateOn
        );
        if (attributeValue instanceof Domain2ElementFailed) {
          return {attributeValue};
        }
        if (attributeValue.preparedStatementParameters) {
          preparedStatementParameters = [...preparedStatementParameters, ...attributeValue.preparedStatementParameters];
          newPreparedStatementParametersCount += attributeValue.preparedStatementParameters.length;
        }
        const attributeKey =
          typeof f.attributeKey == "object" && (f.attributeKey as any).transformerType
            ? sqlStringForRuntimeTransformer(
                f.attributeKey,
                newPreparedStatementParametersCount,
                indentLevel,
                queryParams,
                definedContextEntries,
                useAccessPathForContextReference,
                false // topLevelTransformer
                // undefined, // withClauseColumnName
                // iterateOn, // iterateOn
              )
            : sqlStringForRuntimeTransformer(
                {
                  transformerType: "returnValue",
                  interpolation: "runtime",
                  value: f.attributeKey,
                },
                newPreparedStatementParametersCount,
                indentLevel,
                queryParams,
                definedContextEntries,
                useAccessPathForContextReference,
                false // topLevelTransformer
                // undefined, // withClauseColumnName
                // iterateOn, // iterateOn
              );        ;
        if (attributeKey instanceof Domain2ElementFailed) {
          return {attributeValue, attributeKey};
        }
        if (attributeKey.preparedStatementParameters) {
          preparedStatementParameters = [...preparedStatementParameters, ...attributeKey.preparedStatementParameters];
          newPreparedStatementParametersCount += attributeKey.preparedStatementParameters.length;
        }
        return {
          attributeKey,
          attributeValue
        }
      })
    ;

    const foundError = objectAttributes.find((e: any) => e.attributeKey instanceof Domain2ElementFailed || e.attributeValue instanceof Domain2ElementFailed);
    if (foundError) {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForObjectFullTemplateTransformer createObjectFromPairs attributeKey or attributeValue failed: " + JSON.stringify(foundError, null, 2),
      });
    }
    log.info(
      "sqlStringForObjectFullTemplateTransformer createObjectFromPairs objectAttributes",
      JSON.stringify(objectAttributes, null, 2)
    );
    log.info(
      "sqlStringForObjectFullTemplateTransformer createObjectFromPairs preparedStatementParameters",
      JSON.stringify(preparedStatementParameters, null, 2)
    );
    const create_object =
      "jsonb_build_object(" +
      flushAndIndent(indentLevel + 1) +
      objectAttributes
        .map((e: any, index) => `${e.attributeKey.sqlStringOrObject}, ${e.attributeValue.sqlStringOrObject}`)
        .join(tokenSeparatorForSelect) 
      + flushAndIndent(indentLevel)
      + ")";
    const sqlResult = ""
      + "SELECT " + create_object + " AS \"createObjectFromPairs\""
      + flushAndIndent(indentLevel)
      + "FROM " + resolvedApplyTo.sqlStringOrObject;
    log.info("sqlStringForObjectFullTemplateTransformer createObjectFromPairs sqlResult", sqlResult);
    return {
      type: "json",
      sqlStringOrObject: sqlResult,
      resultAccessPath: undefined,
      columnNameContainingJsonValue: "createObjectFromPairs",
      preparedStatementParameters,
    };
  }
}

// ################################################################################################
function sqlStringForObjectAlterTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_mergeIntoObject,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  let newPreparedStatementParametersCount = preparedStatementParametersCount;
  let preparedStatementParameters: any[] = [];
  const applyToName: string =
    ((actionRuntimeTransformer as any).label
      ? (actionRuntimeTransformer as any).label
      : actionRuntimeTransformer.transformerType) +
    "_" +
    actionRuntimeTransformer.referenceToOuterObject;

  // #############################################
  const applyToSql = sqlStringForApplyTo(
    actionRuntimeTransformer,
    newPreparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
    topLevelTransformer
  );
  if (applyToSql instanceof Domain2ElementFailed) {
    return applyToSql;
  }
  if (applyToSql.type != "json") {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForObjectAlterTransformer mergeIntoObject referenceQuery not json",
    });
  }
  const accessPathHasMap = applyToSql.resultAccessPath?.find((e: any) => typeof e == "object" && e.type == "map");
  if (accessPathHasMap) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForObjectAlterTransformer createObjectFromPairs resultAccessPath has map: " + JSON.stringify(applyToSql.resultAccessPath, null, 2),
    });
  }
  // #############################################
  newPreparedStatementParametersCount += (applyToSql.preparedStatementParameters ?? []).length;
  preparedStatementParameters = [...preparedStatementParameters, ...(applyToSql.preparedStatementParameters ?? [])];

  let newDefinedContextEntries = { ...definedContextEntries };
  newDefinedContextEntries[actionRuntimeTransformer.referenceToOuterObject??defaultTransformerInput] = {
    type: "json",
    renameTo: applyToName,
    attributeResultAccessPath: applyToSql.resultAccessPath?.slice(1) as any, // correct since resolvedApplyTo has no "map" (object) item
  };
  // #############################################

  const subQuery: Domain2QueryReturnType<SqlStringForTransformerElementValue> = sqlStringForRuntimeTransformer(
    actionRuntimeTransformer.definition as TransformerForBuildPlusRuntime,
    newPreparedStatementParametersCount,
    indentLevel,
    queryParams,
    newDefinedContextEntries,
    useAccessPathForContextReference,
    false, // topLevelTransformer
    // undefined, // withClauseColumnName
    // iterateOn, // iterateOn
  );

  if (subQuery instanceof Domain2ElementFailed) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForObjectAlterTransformer mergeIntoObject attributeValue failed: " + JSON.stringify(subQuery, null, 2),
      innerError: subQuery,
    });
  }

  if (subQuery.preparedStatementParameters) {
    preparedStatementParameters = [
      ...preparedStatementParameters,
      ...subQuery.preparedStatementParameters,
    ];
    newPreparedStatementParametersCount += subQuery.preparedStatementParameters.length;
  }

  const extraWith: { name: string; sql: string; sqlResultAccessPath?: ResultAccessPath }[] = [
    ...(applyToSql.extraWith ?? []),
    {
      name: applyToName,
      sql: applyToSql.sqlStringOrObject,
      sqlResultAccessPath: applyToSql.resultAccessPath?.slice(1), // checked for map above
    },
    // ...castObjectAttributes.flatMap((e: [string, SqlStringForTransformerElementValue], index) =>
    //   e[1].extraWith ? e[1].extraWith : []
    // ),
    ...(subQuery.extraWith ?? []),
  ];

  log.info("sqlStringForObjectAlterTransformer found applyTo:", applyToName, JSON.stringify(applyToSql, null, 2));
  log.info("sqlStringForObjectAlterTransformer found subquery:", JSON.stringify(subQuery, null, 2));

  if (!["json", "tableOf1JsonColumn"].includes(subQuery.type)) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForObjectAlterTransformer subquery not json or tableOf1JsonColumn",
    });
  }

  const subQueryWithRowNumber =
    subQuery.type == "tableOf1JsonColumn"
      ? `(SELECT ROW_NUMBER() OVER () AS row_num, ${subQuery.sqlStringOrObject}.* FROM ${subQuery.sqlStringOrObject}) AS "mergeIntoObject_subQuery"`
      : `(SELECT ROW_NUMBER() OVER () AS row_num, ${subQuery.sqlStringOrObject} AS "mergeIntoObject_subQueryColumn") AS "mergeIntoObject_subQuery"` // subQuery.type == json
  ;
  const subQueryColumnName = subQuery.type == "tableOf1JsonColumn"? subQuery.columnNameContainingJsonValue : "mergeIntoObject_subQueryColumn";

  const sqlResult = `SELECT (
${indent(indentLevel + 1)}"${applyToName}".${applyToSql.resultAccessPath?.slice(1).map(e=>tokenNameQuote+e+tokenNameQuote).join('->')}
${indent(indentLevel + 1)}||
${indent(indentLevel + 1)}"mergeIntoObject_subQuery"."${subQueryColumnName}"
${indent(indentLevel)}) AS "mergeIntoObject"
${indent(indentLevel)}FROM (SELECT ROW_NUMBER() OVER () AS row_num, "${applyToName}".* FROM "${applyToName}") AS "${applyToName}",
${indent(indentLevel + 1)}${subQueryWithRowNumber}
${indent(indentLevel)}WHERE "${applyToName}".row_num = "mergeIntoObject_subQuery".row_num
`;

    const result: SqlStringForTransformerElementValue = {
      type: "json",
      sqlStringOrObject: sqlResult,
      preparedStatementParameters,
      resultAccessPath: [0, "mergeIntoObject"],
      columnNameContainingJsonValue: "mergeIntoObject",
      extraWith,
    }
    // log.info("sqlStringForRuntimeTransformer createObject objectAttributes", JSON.stringify(objectAttributes, null, 2));
    log.info("sqlStringForObjectAlterTransformer createObject subquery", JSON.stringify(subQuery, null, 2));
    log.info("sqlStringForObjectAlterTransformer returning result=", JSON.stringify(result, null, 2));
    // throw new Error("sqlStringForObjectAlterTransformer not implemented ");
    return result;
}

// ################################################################################################
function sqlStringForObjectEntriesTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_getObjectEntries,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const applyTo = sqlStringForApplyTo(
    actionRuntimeTransformer,
    preparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
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
  const sqlResult = `SELECT jsonb_agg(json_build_array(key, value)) AS "getObjectEntries" FROM "innerQuery", jsonb_each("innerQuery"."${
    (applyTo as any).resultAccessPath[1]
  }")`;

  return {
    type: "json",
    sqlStringOrObject: sqlResult,
    preparedStatementParameters: applyTo.preparedStatementParameters,
    resultAccessPath: [0, "getObjectEntries"],
    columnNameContainingJsonValue: "getObjectEntries",
    extraWith,
  };
}

// ################################################################################################
function sqlStringForObjectValuesTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_getObjectValues,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const applyTo = sqlStringForApplyTo(
    actionRuntimeTransformer,
    preparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
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
  const sqlResult = `SELECT jsonb_agg(value) AS "getObjectValues" FROM "innerQuery", jsonb_each("innerQuery"."${
    (applyTo as any).resultAccessPath[1]
  }")`;

  return {
    type: "json",
    sqlStringOrObject: sqlResult,
    preparedStatementParameters: applyTo.preparedStatementParameters,
    resultAccessPath: [0, "getObjectValues"],
    columnNameContainingJsonValue: "getObjectValues",
    extraWith,
  };
}

// ################################################################################################
function sqlStringForListReducerToIndexObjectTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_indexListBy,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const transformerLabel: string =
    (actionRuntimeTransformer as any).label ?? actionRuntimeTransformer.transformerType;

  const applyTo = sqlStringForApplyTo(
    actionRuntimeTransformer,
    preparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
    topLevelTransformer
  );
  if (applyTo instanceof Domain2ElementFailed) {
    return applyTo;
  }
  log.info(
    "sqlStringForRuntimeTransformer indexListBy found definedContextEntries",
    JSON.stringify(definedContextEntries, null, 2)
  );
  log.info("sqlStringForRuntimeTransformer indexListBy found applyTo", JSON.stringify(applyTo, null, 2));
  const applyToLabel = transformerLabel + "_applyTo";
  const applyToLabelElements = applyToLabel + "_elements";
  const applyToLabelPairs = applyToLabel + "_pairs";
  const extraWith: { name: string; sql: string }[] = [
    {
      name: applyToLabel,
      sql: applyTo.sqlStringOrObject,
    },
  ];
  switch (applyTo.type) {
    case "json_array": {
      const sqlResultNew = sqlQuery(0, {
        queryPart: "query",
        select: [
          {
            queryPart: "defineColumn",
            value: {
              queryPart: "call",
              fct: "jsonb_object_agg",
              params: [
                '"' + applyToLabelElements +"\"" + " ->> " +
                "'" + actionRuntimeTransformer.indexAttribute + "'",// json_array_index_access
                {
                  queryPart: "tableLiteral",
                  name: applyToLabelElements,
                }
              ],
            },
            as: transformerLabel,
          },
        ],
        from: [
          {
            queryPart: "tableLiteral",
            name: applyToLabel,
          },
          {
            queryPart: "hereTable",
            definition: {
              queryPart: "call",
              fct: "jsonb_array_elements",
              params: [
                {
                  queryPart: "tableColumnAccess",
                  table: applyToLabel,
                  col: (applyTo as any).columnNameContainingJsonValue
                },
              ],
            },
            as: applyToLabelElements,
          }
        ]
      });
      return {
        type: "json",
        // sqlStringOrObject: sqlResult,
        sqlStringOrObject: sqlResultNew,
        preparedStatementParameters: applyTo.preparedStatementParameters,
        resultAccessPath: [0, transformerLabel],
        columnNameContainingJsonValue: transformerLabel,
        extraWith,
      };
    }
    case "json": {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        queryParameters: JSON.stringify(applyTo) as any,
        failureMessage: "sqlStringForRuntimeTransformer indexListBy can not be applied to a json object, it can only be applied to a json array or an array of json objects",
      });
    }
    case "tableOf1JsonColumn": {
      throw new Error(
        "sqlStringForRuntimeTransformer indexListBy not implemented for applyTo type:" + applyTo.type
      );
      // const sqlResult =
      //   "SELECT " +
      //   'jsonb_object_agg("' +
      //   applyToLabelPairs +
      //   '"."key", ' +
      //   '"' +
      //   applyToLabelPairs +
      //   '"."value")' +
      //   ' AS "' +
      //   transformerLabel +
      //   '"' +
      //   flushAndIndent(indentLevel) +
      //   'FROM "' +
      //   applyToLabel +
      //   '"'
      //   // +
      //   // ', jsonb_each("' +
      //   // applyToLabel +
      //   // '"."' +
      //   // (applyTo as any).columnNameContainingJsonValue +
      //   // '") AS "' +
      //   // applyToLabelPairs +
      //   // '"'
      //   ;
      // return {
      //   type: "json",
      //   sqlStringOrObject: sqlResult,
      //   preparedStatementParameters: applyTo.preparedStatementParameters,
      //   resultAccessPath: [0, transformerLabel],
      //   columnNameContainingJsonValue: transformerLabel,
      //   extraWith,
      // };
      break;
    }
    case "table": {
      // TODO: table of JSON objects, 1 per line, or table of split objects into columns?
      // WITH json_objects AS (
      //   SELECT '{"a": 1, "b": 2}'::jsonb AS obj
      //   UNION ALL
      //   SELECT '{"b": 3, "c": 4}'::jsonb AS obj
      //   UNION ALL
      //   SELECT '{"d": 5}'::jsonb AS obj
      // )
      // SELECT jsonb_object_agg(key, value) AS merged_object
      // FROM (
      //   SELECT key, value
      //   FROM json_objects, jsonb_each(obj)
      // ) AS key_value_pairs;
      throw new Error(
        "sqlStringForRuntimeTransformer indexListBy not implemented for applyTo type:" + applyTo.type
      );
    }
    case "scalar": {
      throw new Error(
        "sqlStringForRuntimeTransformer indexListBy not implemented for applyTo type:" + applyTo.type
      );
      break;
    }
    default:
      throw new Error(
        "sqlStringForRuntimeTransformer indexListBy not implemented for applyTo type:" + applyTo.type
      );
      break;
  }
}

// ################################################################################################
function sqlStringForListReducerToSpreadObjectTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_listReducerToSpreadObject,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  // throw new Error("sqlStringForRuntimeTransformer listReducerToSpreadObject not implemented");
  const transformerLabel: string =
    (actionRuntimeTransformer as any).label ?? actionRuntimeTransformer.transformerType;

  const applyTo = sqlStringForApplyTo(
    actionRuntimeTransformer,
    preparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
    topLevelTransformer
  );
  if (applyTo instanceof Domain2ElementFailed) {
    return applyTo;
  }
  log.info(
    "sqlStringForListReducerToSpreadObjectTransformer found definedContextEntries",
    JSON.stringify(definedContextEntries, null, 2)
  );
  log.info("sqlStringForListReducerToSpreadObjectTransformer found applyTo", JSON.stringify(applyTo, null, 2));
  const applyToLabel = transformerLabel + "_applyTo";
  const applyToLabelElements = applyToLabel + "_elements";
  const applyToLabelPairs = applyToLabel + "_pairs";
  const extraWith: { name: string; sql: string }[] = [
    {
      name: applyToLabel,
      sql: applyTo.sqlStringOrObject,
    },
  ];
  switch (applyTo.type) {
    case "json_array": {
      const sqlNewQuery = sqlQuery(0, {
        queryPart: "query",
        select: [
          {
            queryPart: "defineColumn",
            value: {
              queryPart: "bypass",
              value: sql_jsonb_object_agg(
                sqlSelectColumns([
                  sqlColumnAccessOld(applyToLabelPairs, "key"),
                  sqlColumnAccessOld(applyToLabelPairs, "value"),
                ])
              ),
            },
            as: transformerLabel,
          },
        ],
        from: [
          {
            queryPart: "tableLiteral",
            name: applyToLabel,
          },
          {
            queryPart: "hereTable",
            definition: {
              queryPart: "call",
              fct: "jsonb_array_elements",
              params: [
                {
                  queryPart: "tableColumnAccess",
                  table: { queryPart: "tableLiteral", name: applyToLabel},
                  col: (applyTo as any).columnNameContainingJsonValue,
                },
              ],
            },
            as: applyToLabelElements,
          },
          {
            queryPart: "hereTable",
            definition: {
              queryPart: "call",
              fct: "jsonb_each",
              params: [
                {
                  queryPart: "tableLiteral",
                  name: applyToLabelElements,
                },
              ],
            },
            as: applyToLabelPairs,
          },
        ],
      });
      log.info("@@@@@@@@@@@@@@@ sqlStringForListReducerToSpreadObjectTransformer json_array sqlNewQuery", sqlNewQuery);
      return {
        type: "json",
        sqlStringOrObject: sqlNewQuery,
        preparedStatementParameters: applyTo.preparedStatementParameters,
        resultAccessPath: [0, transformerLabel],
        columnNameContainingJsonValue: transformerLabel,
        extraWith,
      };
    }
    case "json":
    case "tableOf1JsonColumn": {
      // TODO: does this makle sense at all? should'nt this return a type error?
      log.info("sqlStringForListReducerToSpreadObjectTransformer json or tableOf1JsonColumn");
      const returnValue = 'jsonb_object_agg(' +
        sqlColumnAccessOld(applyToLabelPairs, "key") +
        ', ' +
        sqlColumnAccessOld(applyToLabelPairs, "value") +
        ')'
      ;
      const checkForArrayAndReturnValue =	'case when jsonb_typeof(' + 
        sqlNameQuote(applyToLabel) +
        '.' +
        sqlNameQuote((applyTo as any).columnNameContainingJsonValue) +
        ") = 'array' then " +
        returnValue +
      	`else ${queryFailureObjectSqlString} end`;
      const sqlResult =
        "SELECT " +
        // returnValue +
        checkForArrayAndReturnValue +
        ' AS ' +
        '"' + transformerLabel + '"' +
        flushAndIndent(indentLevel) +
        'FROM ' +
        '"' + applyToLabel + '"' + 
        ', jsonb_each(' +
        '"' + applyToLabel + '"' + 
        '.' +
        '"' + (applyTo as any).columnNameContainingJsonValue + '"' + 
        ') AS ' +
        '"' + applyToLabelPairs + '"' +
        flushAndIndent(indentLevel) +
        "GROUP BY " +
        '"' + applyToLabel + '"' + 
        '.' +
        '"' + (applyTo as any).columnNameContainingJsonValue + '"'
        ;
      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters: applyTo.preparedStatementParameters,
        resultAccessPath: [0, transformerLabel],
        columnNameContainingJsonValue: transformerLabel,
        extraWith,
      };
      break;
    }
    case "table": {
      // TODO: table of JSON objects, 1 per line, or table of split objects into columns?
      // WITH json_objects AS (
      //   SELECT '{"a": 1, "b": 2}'::jsonb AS obj
      //   UNION ALL
      //   SELECT '{"b": 3, "c": 4}'::jsonb AS obj
      //   UNION ALL
      //   SELECT '{"d": 5}'::jsonb AS obj
      // )
      // SELECT jsonb_object_agg(key, value) AS merged_object
      // FROM (
      //   SELECT key, value
      //   FROM json_objects, jsonb_each(obj)
      // ) AS key_value_pairs;
      throw new Error(
        "sqlStringForListReducerToSpreadObjectTransformer not implemented for applyTo type:" + applyTo.type
      );
    }
    case "scalar": {
      throw new Error(
        "sqlStringForListReducerToSpreadObjectTransformer not implemented for applyTo type:" + applyTo.type
      );
      break;
    }
    default:
      throw new Error(
        "sqlStringForListReducerToSpreadObjectTransformer not implemented for applyTo type:" + applyTo.type
      );
      break;
  }
}

// ################################################################################################
function sqlStringForDataflowObjectTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_dataflowObject,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  // throw new Error("sqlStringForRuntimeTransformer dataflowObject not implemented");
  let newPreparedStatementParametersCount = preparedStatementParametersCount;
  let preparedStatementParameters: any[] = [];
  // newPreparedStatementParametersCount += preparedStatementParameters.length;
  const newDefinedContextEntries = {
    ...definedContextEntries
  }

  const definitionSql: [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>][] =
    Object.entries(actionRuntimeTransformer.definition).map(
      (f, index): [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>] => {
        const itemSql = sqlStringForRuntimeTransformer(
          f[1],
          newPreparedStatementParametersCount,
          indentLevel,
          queryParams,
          newDefinedContextEntries,
          useAccessPathForContextReference,
          topLevelTransformer
          // undefined, // withClauseColumnName
          // iterateOn, // iterateOn
        );
        // log.info("sqlStringForRuntimeTransformer dataflowObject for item", f[0], "itemSql", JSON.stringify(itemSql, null, 2));
        if (itemSql instanceof Domain2ElementFailed) {
          log.error(
            "sqlStringForDataflowObjectTransformer failed for transformer:",
            JSON.stringify(f[1], null, 2),
            "itemSql=",
            JSON.stringify(itemSql, null, 2)
          );
          return [f[0], itemSql];
        }
        if (itemSql.type != "json") {
          return [
            f[0],
            new Domain2ElementFailed({
              queryFailure: "QueryNotExecutable",
              query: actionRuntimeTransformer as any,
              failureMessage: "sqlStringForDataflowObjectTransformer itemSql not json",
            }),
          ];
        }
        // const resultPathMapIndex = itemSql.resultAccessPath?.findIndex((e: any) => typeof e == "object" && e.type == "map")
        // ;
        // if (resultPathMapIndex) {
        //   return [
        //     f[0],
        //     new Domain2ElementFailed({
        //     queryFailure: "QueryNotExecutable",
        //     query: actionRuntimeTransformer as any,
        //     failureMessage: "sqlStringForRuntimeTransformer dataflowObject resultAccessPath has map: " + JSON.stringify(itemSql.resultAccessPath, null, 2),
        //   })];
        // }
        if (itemSql.preparedStatementParameters) {
          preparedStatementParameters = [
            ...preparedStatementParameters,
            ...itemSql.preparedStatementParameters,
          ];
          newPreparedStatementParametersCount += itemSql.preparedStatementParameters.length;
        }
        newDefinedContextEntries[f[0]] = {
          type: "json",
          // renameTo: f[0],
          // attributeResultAccessPath: itemSql.resultAccessPath?.slice(1,resultPathMapIndex == -1?itemSql.resultAccessPath.length: resultPathMapIndex) as any,
          attributeResultAccessPath: itemSql.columnNameContainingJsonValue
            ? [itemSql.columnNameContainingJsonValue]
            : (itemSql.resultAccessPath?.slice(1) as any),
        };
        return [f[0], itemSql];
      }
    );

  const foundError = definitionSql.find(
    (e: any) => e[1] instanceof Domain2ElementFailed
  );
  if (foundError) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage:
        "sqlStringForDataflowObjectTransformer attributeKey or attributeValue failed: " +
        JSON.stringify(foundError, null, 2),
    });
  }
  const definitionSqlObject: Record<string,SqlStringForTransformerElementValue>  = Object.fromEntries(definitionSql) as any;
  log.info("sqlStringForDataflowObjectTransformer definitionSql", JSON.stringify(definitionSql, null, 2));
  // if(!definitionSqlObject[actionRuntimeTransformer.target]) {
  //   return new Domain2ElementFailed({
  //     queryFailure: "QueryNotExecutable",
  //     query: actionRuntimeTransformer as any,
  //     failureMessage: "sqlStringForDataflowObjectTransformer target not found in definitionSql",
  //   });
  // }
  if (actionRuntimeTransformer.target) {
    if (definitionSqlObject[actionRuntimeTransformer.target].type != "json") {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForDataflowObjectTransformer target not json",
      });
    }
    if (!definitionSqlObject[actionRuntimeTransformer.target].resultAccessPath) {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForDataflowObjectTransformer target has no resultAccessPath",
      });
    }
    if (!definitionSqlObject[actionRuntimeTransformer.target].columnNameContainingJsonValue) {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForDataflowObjectTransformer target has no columnNameContainingJsonValue",
      });
    }
  }
  const extraWith = [
    ...definitionSql
      .flatMap((e, index) =>
        (e[1] as any).extraWith
          ? [
              ...((e[1] as any).extraWith ?? []).filter((e: any) => e),
              {
                name: e[0],
                sql: (e[1] as any).sqlStringOrObject,
              },
            ]
          : [
              {
                name: e[0],
                sql: (e[1] as any).sqlStringOrObject,
              },
            ]
      )
      .filter((e: any) => e),
  ];
  log.info("sqlStringForDataflowObjectTransformer extraWith", JSON.stringify(extraWith, null, 2));
  return {
    type: "json",
    sqlStringOrObject: actionRuntimeTransformer.target
      ? `SELECT "${
          definitionSqlObject[actionRuntimeTransformer.target].columnNameContainingJsonValue
        }" FROM "${actionRuntimeTransformer.target}"`
      : `SELECT jsonb_build_object(${(definitionSql as [string, SqlStringForTransformerElementValue][])
          .flatMap((e) => [
            "'" + e[0] + "'",
            '"' + e[0] + '"' + '."' + e[1].columnNameContainingJsonValue + '"',
          ])
          .join(", ")}) AS "dataFlowObjectResult" FROM ${definitionSql
          .map((e) => '"' + e[0] + '"')
          .join(", ")}`,
    // : `SELECT ${definitionSql.map((e) => '"' + e[0] + '"').join(", ")} FROM ${definitionSql
    //     .map((e) => '"' + e[0] + '"')
    //     .join(", ")}`,
    preparedStatementParameters,
    extraWith,
    resultAccessPath: actionRuntimeTransformer.target
      ? (definitionSqlObject[actionRuntimeTransformer.target] as any).resultAccessPath
      : [0, "dataFlowObjectResult"],
    columnNameContainingJsonValue: actionRuntimeTransformer.target
      ? definitionSqlObject[actionRuntimeTransformer.target].columnNameContainingJsonValue
      : "dataFlowObjectResult",
  };
}

// ################################################################################################
function sqlStringForContextReferenceTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_getFromContext,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const referenceName = actionRuntimeTransformer.referenceName??((actionRuntimeTransformer.referencePath??[])[0]);
  const definedContextEntry = definedContextEntries[referenceName];
  if (!definedContextEntry) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage:
        "sqlStringForContextReferenceTransformer not found in definedContextEntries: " +
        JSON.stringify(Object.keys(definedContextEntries)),
    });
  }
  const resultAccessPath = [
    ...(useAccessPathForContextReference?(definedContextEntry.attributeResultAccessPath ?? []):[]),
    ...(actionRuntimeTransformer?.referencePath?.slice(1) ?? []), // not consistent, works only because used referencePath has only 1 element
  ];
  // const resultAccessPathString = resultAccessPath.map((e) => `"${e}"`).join(".");
  log.info(
    "sqlStringForContextReferenceTransformer called with",
    JSON.stringify(actionRuntimeTransformer, null, 2),
    "topLevelTransformer",
    topLevelTransformer,
    "useAccessPathForContextReference",
    useAccessPathForContextReference,
    "referenceName",
    referenceName,
    "definedContextEntry",
    JSON.stringify(definedContextEntry, null, 2),
    "resultAccessPath",
    JSON.stringify(resultAccessPath, null, 2),
    "definedContextEntries",
    JSON.stringify(definedContextEntries, null, 2),
  );
  // log.info("sqlStringForRuntimeTransformer getFromContext",actionRuntimeTransformer.referencePath,"resultAccessPath", resultAccessPath);


  const usedReferenceName = definedContextEntry.renameTo??referenceName;
  if (topLevelTransformer) {
    const protectedResultAccessPathStringForJson = protectedSqlAccessForPath(resultAccessPath);

    log.info(
      "sqlStringForContextReferenceTransformer protectedResultAccessPathStringForJson",
      JSON.stringify(protectedResultAccessPathStringForJson, null, 2),
    );
    const result: SqlStringForTransformerElementValue = {
      type: definedContextEntry.type,
      sqlStringOrObject:
        "SELECT " +
        (resultAccessPath.length > 0 // TODO: base test on protectedResultAccessPathStringForJson, not on resultAccessPath
          // ? resultAccessPathStringForJson + ' AS "' + usedReferenceName + '"'
          ? protectedResultAccessPathStringForJson + ' AS "' + usedReferenceName + '"'
          : "*") +
        flushAndIndent(indentLevel) +
        'FROM "' +
        usedReferenceName +
        '"',
      usedContextEntries: [usedReferenceName],
      resultAccessPath: [0, usedReferenceName],
      columnNameContainingJsonValue:
        definedContextEntry.type == "json" || definedContextEntry.type == "json_array"
          ? usedReferenceName
          : undefined,
    };
    log.info("sqlStringForContextReferenceTransformer topLevelTransformer=true result=", JSON.stringify(result, null, 2));
    return result;
  } else { // topLevelTransformer == false
    const resultAccessPathStringForTable = resultAccessPath
      .map((e, index) => `${index == 0 ? tokenNameQuote + e + tokenNameQuote : tokenStringQuote + e + tokenStringQuote}`)
      .join(tokenSeparatorForTableColumn);
    const resultAccessPathStringForJson = resultAccessPath.map(
      (e, index) =>
        `${
          index == 0
            ? tokenNameQuote + usedReferenceName + tokenNameQuote + '.' + tokenNameQuote + e + tokenNameQuote
            : tokenStringQuote + e + tokenStringQuote
        }`
    );
      // .join(tokenSeparatorForJsonAttributeAccess)
    ;
    const protectedResultAccessPathStringForJson = protectedSqlAccessForPath(resultAccessPathStringForJson, true);

    const result: SqlStringForTransformerElementValue = {
      type: definedContextEntry.type,
      sqlStringOrObject:
        definedContextEntry.type == "table"
          ? `"${usedReferenceName}"${
              resultAccessPathStringForTable.length > 0 ? "." + resultAccessPathStringForTable : ""
            }`
          : `${protectedResultAccessPathStringForJson.length > 0
                ? protectedResultAccessPathStringForJson
                : ""
            }`,
      resultAccessPath: [0, usedReferenceName],
      usedContextEntries: [usedReferenceName],
      columnNameContainingJsonValue:
        definedContextEntry.type == "json" || definedContextEntry.type == "json_array"
          ? usedReferenceName
          : undefined,
    };
    log.info("sqlStringForContextReferenceTransformer topLevelTransformer=false result=", JSON.stringify(result, null, 2));
    return result;
  }
}

// ################################################################################################
function sqlStringForParameterReferenceTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_getFromContext,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  // this resolves references to static values, passed as parameters upon executing of the query
  // TODO: resolve each parameter as WITH clause, then only call the name of the clause in each reference?
  const resolvedReference = transformer_resolveReference(
    "runtime",
    [], // transformerPath
    actionRuntimeTransformer,
    "param",
    queryParams,
    definedContextEntries
  );
  if (resolvedReference instanceof Domain2ElementFailed) {
    return resolvedReference;
  }
  const referenceQuery = sqlStringForRuntimeTransformer(
    {
      transformerType: "returnValue",
      interpolation: "runtime",
      value: resolvedReference as any,
    },
    preparedStatementParametersCount,
    indentLevel,
    queryParams,
    definedContextEntries,
    useAccessPathForContextReference,
    topLevelTransformer,
    // undefined, // withClauseColumnName
    // iterateOn, // iterateOn
  );

  return referenceQuery;
}

// ################################################################################################
function sqlStringForObjectDynamicAccessTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_accessDynamicPath,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  return new Domain2ElementFailed({
    queryFailure: "QueryNotExecutable",
    query: JSON.stringify(actionRuntimeTransformer),
    failureMessage:
      "sqlStringForObjectDynamicAccessTransformer not implemented: " + actionRuntimeTransformer.transformerType,
  });
}

// ################################################################################################
function sqlStringForConstantAsExtractorTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_constantAsExtractor,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  // TODO: deal with whole set of transformers, not just returnValue values.
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
      // array of objects or array of scalars
      if (!actionRuntimeTransformer.valueJzodSchema) {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForRuntimeTransformer constantAsExtractor no schema for array",
        });
      }
      if (
        Array.isArray(actionRuntimeTransformer.value) &&
          actionRuntimeTransformer.valueJzodSchema.type != "array"
      ) {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForRuntimeTransformer constantAsExtractor not constistent for array of objects, valueJzodSchema.type:" + actionRuntimeTransformer.valueJzodSchema.type,
        });
      }

      if (
        actionRuntimeTransformer.valueJzodSchema.type == "object" ||
        (
          Array.isArray(actionRuntimeTransformer.value) &&
          actionRuntimeTransformer.valueJzodSchema.type == "array" &&
          actionRuntimeTransformer.valueJzodSchema.definition.type == "object"
        )
      ) {
        // object which attributes are returned as columns on a single row, or array of objects which attributes are returned as columns on many rows (one row per object)
        const recordFunction = Array.isArray(actionRuntimeTransformer.value)
          ? "jsonb_to_recordset"
          : "jsonb_to_record";
        const attributeTypes = getAttributeTypesFromJzodSchema(
          Array.isArray(actionRuntimeTransformer.value)
            ? actionRuntimeTransformer.valueJzodSchema.definition as any
            : actionRuntimeTransformer.valueJzodSchema
        );
        const selectFields = Object.entries(attributeTypes)
          .map(([key, value]) => {
            return `"${key}" ${value}`;
          })
          .join(tokenSeparatorForSelect);
        return {
          type: "table",
          sqlStringOrObject: `SELECT * FROM ${recordFunction}($${paramIndex}::jsonb) AS x(${selectFields})`,
          preparedStatementParameters: [JSON.stringify(actionRuntimeTransformer.value)],
          resultAccessPath: Array.isArray(actionRuntimeTransformer.value)?[]:[0],
        };
      } else {
        // scalar or array of scalars
        // if (!Object.hasOwn(jzodToPostgresTypeMap, (actionRuntimeTransformer.valueJzodSchema as any).definition.type)) {
        if (!(jzodToPostgresTypeMap as any)[(actionRuntimeTransformer.valueJzodSchema as any).definition.type]) {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage:
              "sqlStringForRuntimeTransformer constantAsExtractor no sql type corresponding to elements of array with scalar type:" +
              actionRuntimeTransformer.valueJzodSchema.type,
          });
        }
        // const sqlTargetType = (jzodToPostgresTypeMap as any)[actionRuntimeTransformer.valueJzodSchema.type].sqlTargetType;
        if (Array.isArray(actionRuntimeTransformer.value)) {
          return {
            // type: "table",
            type: "tableOf1JsonColumn",
            sqlStringOrObject: `SELECT * FROM jsonb_array_elements($${paramIndex}::jsonb) AS ${actionRuntimeTransformer.transformerType}`,
            preparedStatementParameters: [JSON.stringify(actionRuntimeTransformer.value)],
            // resultAccessPath: ["value"],
            resultAccessPath: [],
            columnNameContainingJsonValue: "value",
          };
        } else {
          return {
            type: "table",
            sqlStringOrObject: `SELECT $${paramIndex} AS ${actionRuntimeTransformer.transformerType}`,
            preparedStatementParameters: [JSON.stringify(actionRuntimeTransformer.value)],
          };
        }
      }
    }
    case "symbol":
    case "undefined":
    case "function":
    default: {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForRuntimeTransformer constantAsExtractor not implemented",
      });
      break;
    }
  }
  // return new Domain2ElementFailed({
  //   queryFailure: "QueryNotExecutable",
  //   query: actionRuntimeTransformer as any,
  //   failureMessage: "sqlStringForRuntimeTransformer constantAsExtractor not implemented",
  // });
  // break;
}

// ################################################################################################
function sqlStringForNewUuidTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_generateUuid,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  const columnName = withClauseColumnName ?? 'generateUuid';
  return {
    type: "scalar",
    sqlStringOrObject: topLevelTransformer 
      ? `select gen_random_uuid() AS "${columnName}"` 
      : "gen_random_uuid()",
    preparedStatementParameters: [],
    resultAccessPath: topLevelTransformer ? [0, columnName] : undefined,
  };
}

// ################################################################################################
/**
 * TODO: WILL NOT WORK IN THE GENERAL CAS, NEEDS TO BE DONE AS EXPRESSION, NOT AS FULL SUBQUERY
 * 
 * Generates SQL string for a Mustache string template transformer.
 * @param actionRuntimeTransformer 
 * @param preparedStatementParametersCount 
 * @param indentLevel 
 * @param queryParams 
 * @param definedContextEntries 
 * @param useAccessPathForContextReference 
 * @param topLevelTransformer 
 * @param withClauseColumnName 
 * @param iterateOn 
 * @returns 
 */
function sqlStringForMustacheStringTemplateTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime_mustacheStringTemplate,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  log.info(
    "sqlStringForMustacheStringTemplateTransformer called with",
    JSON.stringify(actionRuntimeTransformer, null, 2),
    "topLevelTransformer",
    topLevelTransformer,
    "definedContextEntries",
    JSON.stringify(definedContextEntries, null, 2),
    "queryParams",
    JSON.stringify(queryParams, null, 2)
  );
  // Parse the Mustache template to extract placeholders
  // Mustache syntax: {{variableName}} or {{{variableName}}} (unescaped)
  const template = actionRuntimeTransformer.definition;
  
  // Find all mustache placeholders in the template
  const mustacheRegex = /\{\{(\{?)([^}]+)\}?\}\}/g;
  const placeholders: Array<{ name: string; position: number; length: number }> = [];
  let match;
  
  while ((match = mustacheRegex.exec(template)) !== null) {
    const name = match[2].trim();
    placeholders.push({
      name,
      position: match.index,
      length: match[0].length,
    });
  }
  
  log.info(
    "sqlStringForMustacheStringTemplateTransformer found placeholders",
    JSON.stringify(placeholders, null, 2),
    "in template",
    template
  );
  
  // If no placeholders, return the template as a returnValue string
  if (placeholders.length === 0) {
    const paramIndex = preparedStatementParametersCount + 1;
    return {
      type: "scalar",
      sqlStringOrObject: topLevelTransformer
        ? `SELECT $${paramIndex}::text AS "mustacheStringTemplate"`
        : `$${paramIndex}::text`,
      preparedStatementParameters: [template],
    };
  }
  
  // Build SQL string concatenation expression
  let newPreparedStatementParametersCount = preparedStatementParametersCount;
  const preparedStatementParameters: any[] = [];
  const sqlParts: string[] = [];
  const usedContextEntries: string[] = [];
  const dataSource = (actionRuntimeTransformer as any)["interpolation"] === "runtime" 
    ? definedContextEntries 
    : queryParams;
  
  let lastPosition = 0;
  
  for (const placeholder of placeholders) {
    // Add literal text before the placeholder
    if (placeholder.position > lastPosition) {
      const literalText = template.substring(lastPosition, placeholder.position);
      const paramIndex = newPreparedStatementParametersCount + 1;
      sqlParts.push(`$${paramIndex}::text`);
      preparedStatementParameters.push(literalText);
      newPreparedStatementParametersCount++;
    }
    
    // Resolve the placeholder value using sqlStringForRuntimeTransformer
    // Handle dot notation in placeholder names (e.g., "book.name" -> ["book", "name"])
    const placeholderPath = placeholder.name.split(".");
    const isRuntimeInterpolation = (actionRuntimeTransformer as any)["interpolation"] === "runtime";
    const placeholderTransformer: TransformerForBuildPlusRuntime_getFromContext = isRuntimeInterpolation
      ? {
          transformerType: "getFromContext",
          interpolation: "runtime",
          referenceName: placeholderPath[0],
          referencePath: placeholderPath.length > 1 ? placeholderPath : undefined,  // Use full path including reference name (will be sliced in getFromContextTransformer)
        }
      : {
          transformerType: "getFromParameters" as any, // Type cast needed for union type
          interpolation: "runtime",
          referenceName: placeholderPath[0],
          referencePath: placeholderPath.length > 1 ? placeholderPath : undefined,  // Use full path including reference name (will be sliced in getFromContextTransformer)
        };
    
    const resolvedPlaceholder = sqlStringForRuntimeTransformer(
      placeholderTransformer,
      newPreparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      false // topLevelTransformer
    );
    
    if (resolvedPlaceholder instanceof Domain2ElementFailed) {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: `sqlStringForMustacheStringTemplateTransformer failed to resolve placeholder '${placeholder.name}': ${resolvedPlaceholder.failureMessage}`,
        innerError: resolvedPlaceholder,
      });
    }
    
    // Convert the resolved value to text and add to SQL parts
    const castToText = resolvedPlaceholder.type === "json" || resolvedPlaceholder.type === "json_array"
      ? `(${resolvedPlaceholder.sqlStringOrObject})::text`
      : `(${resolvedPlaceholder.sqlStringOrObject})::text`;
    
    sqlParts.push(castToText);
    
    if (resolvedPlaceholder.preparedStatementParameters) {
      preparedStatementParameters.push(...resolvedPlaceholder.preparedStatementParameters);
      newPreparedStatementParametersCount += resolvedPlaceholder.preparedStatementParameters.length;
    }
    
    // Collect used context entries for FROM clause
    if (resolvedPlaceholder.usedContextEntries) {
      usedContextEntries.push(...resolvedPlaceholder.usedContextEntries);
    }
    
    lastPosition = placeholder.position + placeholder.length;
  }
  
  // Add any remaining literal text after the last placeholder
  if (lastPosition < template.length) {
    const literalText = template.substring(lastPosition);
    const paramIndex = newPreparedStatementParametersCount + 1;
    sqlParts.push(`$${paramIndex}::text`);
    preparedStatementParameters.push(literalText);
    newPreparedStatementParametersCount++;
  }
  
  // Concatenate all parts using PostgreSQL's || operator
  const concatenatedSql = sqlParts.join(" || ");
  
  // Build FROM clause if we have used context entries
  const fromClause = usedContextEntries.length > 0
    ? flushAndIndent(indentLevel) + "FROM " + [...new Set(usedContextEntries)].map(e => `"${e}"`).join(", ")
    : "";
  
  const columnName = withClauseColumnName ?? 'mustacheStringTemplate';
  const result: SqlStringForTransformerElementValue = {
    type: "scalar",
    sqlStringOrObject: topLevelTransformer
      ? `SELECT ${concatenatedSql} AS "${columnName}"${fromClause}`
      : concatenatedSql,
    preparedStatementParameters,
    resultAccessPath: topLevelTransformer ? [0, columnName] : undefined,
    usedContextEntries: usedContextEntries.length > 0 ? [...new Set(usedContextEntries)] : undefined,
  };
  
  log.info(
    "sqlStringForMustacheStringTemplateTransformer result",
    JSON.stringify(result, null, 2)
  );
  
  return result;
}

// ################################################################################################
export function sqlStringForRuntimeTransformer(
  actionRuntimeTransformer: TransformerForBuildPlusRuntime,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any> = {},
  definedContextEntries: Record<string, SqlContextEntry> = {},
  useAccessPathForContextReference: boolean = true,
  topLevelTransformer: boolean = true,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  // log.info(
  //   "sqlStringForRuntimeTransformer called with actionRuntimeTransformer",
  //   JSON.stringify(actionRuntimeTransformer, null, 2)
  // );

  const orderBy = (actionRuntimeTransformer as any).orderBy
    ? `ORDER BY "${(actionRuntimeTransformer as any).orderBy}"`
    : "";

  log.info("sqlStringForRuntimeTransformer actionRuntimeTransformer", actionRuntimeTransformer);
  if (typeof actionRuntimeTransformer != "object" || Array.isArray(actionRuntimeTransformer)) {
    return sqlStringForRuntimeTransformer(
      {
        transformerType: "returnValue",
        interpolation: "runtime",
        value: actionRuntimeTransformer,
      },
      preparedStatementParametersCount,
      indentLevel,
      queryParams,
      definedContextEntries,
      useAccessPathForContextReference,
      topLevelTransformer
    )
  }
  const castTransformer = actionRuntimeTransformer as any;
  const foundApplicationTransformer =
    applicationTransformerDefinitions[castTransformer.transformerType];

  if (!foundApplicationTransformer) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage:
        "sqlStringForRuntimeTransformer transformerType not found in applicationTransformerDefinitions: " +
        castTransformer.transformerType,
    });
  }
  switch (foundApplicationTransformer.transformerImplementation.transformerImplementationType) {
    case "libraryImplementation": {
      if (
        !foundApplicationTransformer.transformerImplementation.sqlImplementationFunctionName ||
        !sqlTransformerImplementations[
          foundApplicationTransformer.transformerImplementation.sqlImplementationFunctionName
        ]
      ) {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage:
            "sqlStringForRuntimeTransformer transformerType not found in sqlTransformerImplementations: " +
            foundApplicationTransformer.transformerImplementation.sqlImplementationFunctionName,
        });
      }
      const transformerSql = sqlTransformerImplementations[
        foundApplicationTransformer.transformerImplementation.sqlImplementationFunctionName
      ](
        castTransformer,
        preparedStatementParametersCount,
        indentLevel,
        queryParams,
        definedContextEntries,
        useAccessPathForContextReference,
        topLevelTransformer,
        withClauseColumnName,
        iterateOn,
      );
      return transformerSql;
      break;
    }
    case "transformer":{
      const applicationTransformerSql = sqlStringForRuntimeTransformer(
        foundApplicationTransformer.transformerImplementation.definition as TransformerForBuildPlusRuntime,
        preparedStatementParametersCount,
        indentLevel,
        {
          ...queryParams,
          ...castTransformer,
        },
        definedContextEntries,
        useAccessPathForContextReference,
        topLevelTransformer,
        withClauseColumnName,
        iterateOn,
      );
      return applicationTransformerSql;
      break;
  }
    default:{
      throw new Error(
        "sqlStringForRuntimeTransformer transformerType not implemented: " +
          JSON.stringify(foundApplicationTransformer.transformerImplementation)
      );
      break;
    }
  }
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
  foreignKeyParams: AsyncQueryRunnerParams,
  schema: string,
  preparedStatementParameters: any[],
  modelEnvironment: MiroirModelEnvironment,
): Domain2QueryReturnType<SqlStringForExtractorReturnType> {
  const extractorRawQueries = Object.entries(foreignKeyParams.extractor.extractors ?? {}).map(
    ([key, value]) => {
      return [key, sqlStringForExtractor(value, schema, modelEnvironment)];
    }
  );

  log.info(
    "sqlStringForQuery extractorRawQueries",
    JSON.stringify(extractorRawQueries, null, 2),
    "for",
    foreignKeyParams.extractor.extractors
  );

  // const combinerRawQueries: [string, Domain2QueryReturnType<SqlStringForCombinerReturnType>][] = Object.entries(foreignKeyParams.extractor.combiners ?? {}).map(
  const combinerRawQueries: [string, SqlStringForCombinerReturnType][] = Object.entries(
    foreignKeyParams.extractor.combiners ?? {}
  ).map(([key, value]) => {
    return [key, sqlStringForCombiner(value, schema)];
  });
  log.info("sqlStringForQuery combinerRawQueries", JSON.stringify(combinerRawQueries, null, 2));

  let newPreparedStatementParameters: any[]= [...preparedStatementParameters];
  const queryParamsWithClauses: QueryParameterSqlWithClause[] = Object.entries(
    foreignKeyParams.extractor.queryParams ?? {}
  ).map(([key, value]) => {
    const convertedParam = sqlStringForRuntimeTransformer(
      {
        transformerType: "returnValue",
        interpolation: "runtime",
        value: value,
      },
      newPreparedStatementParameters.length,
      0, //indentLevel,
      foreignKeyParams.extractor.queryParams,
      {}
    );
    if (convertedParam instanceof Domain2ElementFailed) {
      throw new Error("sqlStringForQuery queryParamsWithClauses convertedParam failed for key: " + key);
    }
    newPreparedStatementParameters = [ // TODO: avoid side effects!
      ...newPreparedStatementParameters,
      ...(convertedParam.preparedStatementParameters ?? []),
    ];
    return {
      name: key,
      sql: convertedParam.sqlStringOrObject,
      convertedParam,
    };
  });
  log.info("sqlStringForQuery queryParamsWithClauses", queryParamsWithClauses);
  // log.info("sqlStringForQuery queryParamsWithClauses", JSON.stringify(queryParamsWithClauses, null, 2));

  const paramsContextEntries: Record<string, SqlContextEntry> = Object.fromEntries(
    queryParamsWithClauses.map((q) => {
      const notMapResultAccessPath = q.convertedParam.resultAccessPath?.find(
        (e) => typeof e == "object"
      );
      if (notMapResultAccessPath) {
        throw new Error(
          "sqlStringForQuery queryParamsWithClauses convertedParam not string or number: " +
            JSON.stringify(notMapResultAccessPath, null, 2)
        );
      }
      return [
        q.name,
        {
          // type: isJson(q.convertedParam.type) ? "json" : (q.convertedParam.type as any),
          type: q.convertedParam.type as any,
          attributeResultAccessPath: (q.convertedParam.resultAccessPath as any)?.slice(1), // because resultAccessPath returns the path viewed from the end user, for which the result is always an array
        },
      ];
    })
  );

  const paramsAndextractorAndCombinerContextEntries: Record<string, SqlContextEntry> = {
    ...paramsContextEntries,
    ...Object.fromEntries(
      extractorRawQueries.map(([key, value]) => [
        key,
        {
          type: "table",
          // attributeResultAccessPath: (value.resultAccessPath as any)?.slice(1), // because resultAccessPath returns the path viewed from the end user, for which the result is always an array
          renameTo: key,
        },
      ])
    ),
  }
  // log.info("sqlStringForQuery found queryParamsWithClauses", JSON.stringify(queryParamsWithClauses, null, 2));
  log.info("sqlStringForQuery found paramsAndextractorAndCombinerContextEntries", JSON.stringify(paramsAndextractorAndCombinerContextEntries, null, 2));
  // log.info("sqlStringForQuery found convertedParams for query parameters", JSON.stringify(paramsContextEntries, null, 2));
  log.info(
    "sqlStringForQuery found newPreparedStatementParameters for query parameters",
    JSON.stringify(Object.keys(newPreparedStatementParameters), null, 2)
    // JSON.stringify(newPreparedStatementParameters, null, 2)
  );
  const transformerRawQueries: [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>][] = Object.entries(
    foreignKeyParams.extractor.runtimeTransformers ?? {}
  ).map(([key, value]) => {
    const transformerRawQuery = sqlStringForRuntimeTransformer(
      value as TransformerForBuildPlusRuntime,
      newPreparedStatementParameters.length,
      1, // indentLevel,
      foreignKeyParams.extractor.queryParams,
      paramsAndextractorAndCombinerContextEntries, // definedContextEntries
      true, // useAccessPathForContextReference
      true, // topLevelTransformer - these are top-level transformers in WITH clauses
      key // withClauseColumnName
    );
    if (!(transformerRawQuery instanceof Domain2ElementFailed) && transformerRawQuery.preparedStatementParameters) {
      newPreparedStatementParameters = [...newPreparedStatementParameters, ...transformerRawQuery.preparedStatementParameters];
    }
    return [key, transformerRawQuery]; // TODO: handle ExtendedExtractorForRuntime?
  });
  const foundError = transformerRawQueries.find((q) => q[1] instanceof Domain2ElementFailed);
  log.info("sqlStringForQuery found transformerRawQueries", JSON.stringify(transformerRawQueries, null, 2));
  log.info(
    "sqlStringForQuery found newPreparedStatementParameters for runtime transformers",
    JSON.stringify(newPreparedStatementParameters, null, 2)
    // JSON.stringify(newPreparedStatementParameters, null, 2)
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

  const lastEntryIndex = foreignKeyParams.extractor.runtimeTransformers
    ? transformerRawQueries.length - 1
    : foreignKeyParams.extractor.combiners
    ? combinerRawQueries.length - 1
    : extractorRawQueries.length - 1;

  const endResultName =
    Object.keys(
      foreignKeyParams.extractor.runtimeTransformers ??
        foreignKeyParams.extractor.combiners ??
        foreignKeyParams.extractor.extractors ??
        {}
    )[lastEntryIndex] ?? "endResultNotFound";

  const queryParts: string[] = [];
  const queryParameters: any[] = [];
  if (extractorRawQueries.length > 0) {
    queryParts.push(
      extractorRawQueries
        .map((q) => '"' + q[0] + '" AS (' + flushAndIndent(1) + q[1] + flushAndIndent(0) + ")")
        .join(tokenSeparatorForWithRtn)
    );
  }
  if (combinerRawQueries.length > 0) {
    // queryParts.push(combinerRawQueries.map((q) => '"' + q[0] + '" AS (' + flushAndIndent(1) + q[1] + flushAndIndent(0) + ")").join(tokenSeparatorForWithRtn));
    queryParts.push(
      combinerRawQueries
        .map(
          (q: [string, SqlStringForCombinerReturnType]) =>
            '"' + q[0] + '" AS (' + flushAndIndent(1) + q[1].sqlString + flushAndIndent(0) + ")"
        )
        .join(tokenSeparatorForWithRtn)
    );
  }
  if (queryParamsWithClauses.length > 0) {
    queryParts.push(
      queryParamsWithClauses.map((q) => '"' + q.name + '" AS (' + flushAndIndent(1) + q.sql + flushAndIndent(0) + ")").join(tokenSeparatorForWithRtn)
    );
  }
  if (cleanTransformerRawQueries.length > 0) {
    queryParts.push(
      cleanTransformerRawQueries
        .flatMap((transformerRawQuery) =>
          typeof transformerRawQuery[1] == "string"
            ? '"' + transformerRawQuery[0] + '" AS (' + transformerRawQuery[1] + " )"
            : (transformerRawQuery[1].extraWith && transformerRawQuery[1].extraWith.length > 0
                ? transformerRawQuery[1].extraWith
                    .map((extra: any) => '"' + extra.name + '" AS (' + flushAndIndent(1) + extra.sql + flushAndIndent(0) + ")")
                    .join(tokenSeparatorForWithRtn) +
                  tokenSeparatorForWithRtn
                : "") +
              '"' +
              transformerRawQuery[0] +
              '" AS (' 
              +
              flushAndIndent(1) +
              transformerRawQuery[1].sqlStringOrObject + flushAndIndent(0)
              + ")"
        )
        .join(tokenSeparatorForWithRtn)
    );
    // (transformerRawQueries as any as [string, SqlStringForTransformerElementValue][]).forEach(([index, value]) => {
    //   if (value.preparedStatementParameters) {
    //     preparedStatementParameters.push(...value.preparedStatementParameters);
    //   }
    // });
  }
  const query =
    `WITH` +
    flushAndIndent(0) +
    queryParts.join(tokenSeparatorForWithRtn) +
    flushAndIndent(0) +
    `SELECT * FROM "${endResultName}"`;
  // log.info("sqlStringForQuery innerFullObjectTemplate aggregateRawQuery", query);
  return {
    query,
    preparedStatementParameters: newPreparedStatementParameters,
    transformerRawQueriesObject,
    endResultName,
    combinerRawQueriesObject: combinerRawQueriesObject as any, // TODO: fix type
  };
}

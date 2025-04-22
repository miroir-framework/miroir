import {
  applicationTransformerDefinitions,
  AsyncQueryRunnerParams,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  ExtractorOrCombiner,
  LoggerInterface,
  MiroirLoggerFactory,
  ResultAccessPath,
  transformer_mustacheStringTemplate_apply,
  transformer_resolveReference,
  TransformerForRuntime,
  TransformerForRuntime_count,
  TransformerForRuntime_innerFullObjectTemplate,
  TransformerForRuntime_list_listMapperToList,
  TransformerForRuntime_list_listPickElement,
  TransformerForRuntime_object_alter,
  TransformerForRuntime_freeObjectTemplate,
  TransformerForRuntime_object_listReducerToSpreadObject,
  TransformerForRuntime_objectEntries,
  TransformerForRuntime_objectValues,
  TransformerForRuntime_unique,
  TransformerForBuild_freeObjectTemplate,
  TransformerForBuild_object_fullTemplate,
  TransformerForRuntime_object_fullTemplate,
  TransformerForRuntime_object_listReducerToIndexObject,
  TransformerForRuntime_dataflowObject,
  TransformerForRuntime_constantArray,
  TransformerForRuntime_constant,
  TransformerForRuntime_contextReference,
  TransformerForRuntime_objectDynamicAccess,
  TransformerForRuntime_constantAsExtractor,
  TransformerForRuntime_newUuid
} from "miroir-core";
import { RecursiveStringRecords } from "../4_services/SqlDbQueryTemplateRunner";
import { cleanLevel } from "../4_services/constants";
import { packageName } from "../constants";
import { getConstantSqlTypeMap, PostgresDataTypes } from "./Postgres";
import { getAttributeTypesFromJzodSchema, jzodToPostgresTypeMap } from "./jzodSchema";

export const tokenStringQuote = "'";
export const tokenNameQuote = '"';
export const tokenComma = ",";
export const tokenSeparatorForTableColumn = ".";
export const tokenSeparatorForJsonAttributeAccess = " -> ";
export const tokenSeparatorForSelect = tokenComma + " ";
export const tokenSeparatorForWith = tokenComma + " ";
export const tokenSeparatorForWithRtn = tokenSeparatorForWith + "\n";

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
  sqlStringForNewUuidTransformer,
  sqlStringForObjectFullTemplateTransformer,
  sqlStringForObjectAlterTransformer,
  sqlStringForObjectDynamicAccessTransformer,
  sqlStringForObjectEntriesTransformer,
  sqlStringForObjectValuesTransformer,
  sqlStringForParameterReferenceTransformer,
  sqlStringForUniqueTransformer,
}

// ################################################################################################
export interface SqlContextEntry {
  // type: "json" | "scalar" | "table"; resultAccessPath?: (string | number)[]
  type: "json" | "scalar" | "table";
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

// ##############################################################################################
export type SqlStringForTransformerElementValueType = "json" | "scalar" | "table" | "json_array" | "tableOf1JsonColumn";
/**
 * * This type represents the structure of the SQL string or object that is generated for a transformer element.
 * @param sqlStringOrObject - The SQL string or object generated for the transformer element.
 * @param resultAccessPath - The path to access the result of the SQL string or object.
 * @param columnNameContainingJsonValue - The name of the column containing JSON values, if applicable.
 * @param encloseEndResultInArray - Indicates whether to enclose the end result in an array.
 * @param extraWith - Additional SQL strings or objects to include in the result.
 * @param usedContextEntries - The context entries used in the SQL string or object.
 * @param type - The type of the SQL string or object generated.
 * @param preparedStatementParameters - The parameters for the prepared statement, if applicable.
 */
export type SqlStringForTransformerElementValue = {
  sqlStringOrObject: string;
  // resultAccessPath?: (string | number)[];
  resultAccessPath?: ResultAccessPath;
  columnNameContainingJsonValue?: string;
  encloseEndResultInArray?: boolean;
  extraWith?: { name: string; sql: string; sqlResultAccessPath?: ResultAccessPath }[];
  usedContextEntries?: string[]; // 
  // This attribute is part of the `SqlStringForTransformerElementValue` interface. 
  // It represents the type of the SQL string or object being generated. 
  // The type can be one of the following: 
  // - "json": A JSON object.
  // - "scalar": A single scalar value.
  // - "table": A table structure.
  // - "json_array": An array of JSON objects.
  // - "tableOf1JsonColumn": A table with one column containing JSON values.
  type: SqlStringForTransformerElementValueType;
  // type: "json" | "tableOf1JsonColumn"| "json_array" | "table" | "scalar";
  preparedStatementParameters?: any[];
};

function isJson(t:SqlStringForTransformerElementValueType) {
  return t == "json" || t == "json_array" || t == "tableOf1JsonColumn";
}

// ################################################################################################
function sqlStringForApplyTo(
  actionRuntimeTransformer:
    | TransformerForBuild_object_fullTemplate
    | TransformerForRuntime_object_fullTemplate
    | TransformerForRuntime_count
    | TransformerForRuntime_list_listPickElement
    | TransformerForRuntime_list_listMapperToList
    | TransformerForRuntime_object_alter
    | TransformerForRuntime_objectValues
    | TransformerForRuntime_objectEntries
    | TransformerForRuntime_object_listReducerToSpreadObject
    | TransformerForRuntime_object_listReducerToIndexObject
    | TransformerForRuntime_unique
    | TransformerForRuntime_innerFullObjectTemplate,
  preparedStatementParametersIndex: number,
  indentLevel: number,
  queryParams: Record<string, any> = {},
  definedContextEntries: Record<string, any> = {},
  useAccessPathForContextReference: boolean = true,
  topLevelTransformer: boolean = true
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  switch (typeof actionRuntimeTransformer.applyTo) {
    case "string":
    case "number":
    case "bigint":
    case "undefined":
    case "boolean": {
      return sqlStringForRuntimeTransformer(
        {
          transformerType: "constant",
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
      if (Array.isArray(actionRuntimeTransformer.applyTo) || !Object.hasOwn(actionRuntimeTransformer.applyTo, "referenceType")) {
        return sqlStringForRuntimeTransformer(
          {
            transformerType: "constant",
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
      if (actionRuntimeTransformer.applyTo.referenceType == "referencedExtractor") {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage:
            "sqlStringForRuntimeTransformer listPickElement not implemented for referencedExtractor",
        });
      }
      const referenceQuery =
        typeof actionRuntimeTransformer.applyTo.reference == "string"
          ? sqlStringForRuntimeTransformer(
              // shouldn't this be a contextReference instead?
              {
                transformerType: "constant",
                interpolation: "runtime",
                value: actionRuntimeTransformer.applyTo.reference as any,
              },
              preparedStatementParametersIndex,
              indentLevel,
              queryParams,
              definedContextEntries,
              useAccessPathForContextReference,
              topLevelTransformer
            )
          : sqlStringForRuntimeTransformer(
              actionRuntimeTransformer.applyTo.reference,
              preparedStatementParametersIndex,
              indentLevel,
              queryParams,
              definedContextEntries,
              useAccessPathForContextReference,
              topLevelTransformer
            );
      return referenceQuery;
    
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
  return {
    type: targetType,
    sqlStringOrObject: topLevelTransformer
      ? `select $${paramIndex}::${sqlTargetType} AS "${label}"`
      : `$${paramIndex}::${sqlTargetType}`,
    preparedStatementParameters: [isJson(targetType) ? JSON.stringify(transformer.value) : transformer.value],
    resultAccessPath: topLevelTransformer ? [0, label] : undefined,
    columnNameContainingJsonValue: isJson(targetType) && topLevelTransformer ? label : undefined,
  };
};

// ################################################################################################
function indent(indentLevel: number) {
  return "  ".repeat(indentLevel);
}
// ################################################################################################
function flushAndIndent(indentLevel: number) {
  return "\n" + indent(indentLevel);
}

// ################################################################################################
function sqlStringForCountTransformer(
  actionRuntimeTransformer: TransformerForRuntime_count,
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
  console.log("sqlStringForRuntimeTransformer count referenceQuery", JSON.stringify(referenceQuery, null, 2));
  if (referenceQuery instanceof Domain2ElementFailed) {
    return referenceQuery;
  }
  switch (referenceQuery.type) {
    case "json_array":
    case "json": {
      return {
        type: "json",
        sqlStringOrObject: actionRuntimeTransformer.groupBy
          ? `
SELECT jsonb_object_agg(key, cnt) AS "count_object"
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
        columnNameContainingJsonValue: "count_object",
        encloseEndResultInArray: true,
      };
    }
    case "table": {
      const transformerSqlQuery = actionRuntimeTransformer.groupBy
        ? `SELECT "${actionRuntimeTransformer.groupBy}", COUNT(*)::int FROM ${referenceQuery.sqlStringOrObject}
            GROUP BY "${actionRuntimeTransformer.groupBy}"
`
        : `SELECT COUNT(*)::int FROM (${referenceQuery.sqlStringOrObject}) AS "count_applyTo"
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

// ################################################################################################
function sqlStringForFreeObjectTransformer(
  actionRuntimeTransformer:
    | TransformerForBuild_freeObjectTemplate
    | TransformerForRuntime_freeObjectTemplate,
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
            },
          ];
        }
        case "number": {
          return [
            f[0],
            {
              type: "scalar",
              sqlStringOrObject: `${f[1]}::double precision`,
            },
          ];
        }
        case "bigint": {
          return [
            f[0],
            {
              type: "scalar",
              sqlStringOrObject: `${f[1]}::bigint`,
            },
          ];
        }
        case "boolean": {
          return [
            f[0],
            {
              type: "scalar",
              sqlStringOrObject: `${f[1]}::boolean`,
            },
          ];
        }
        case "object": {
          if (Array.isArray(f[1])) {
            throw new Error(
              "sqlStringForRuntimeTransformer freeObjectTemplate array not implemented"
            );
          }
          if (f[1] == null) {
            throw new Error(
              "sqlStringForRuntimeTransformer freeObjectTemplate null not implemented"
            );
          }

          if (f[1].transformerType) {
            const attributeSqlString = sqlStringForRuntimeTransformer(
              f[1] as TransformerForRuntime,
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
              return [f[0], { attributeValue: attributeSqlString }];
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
            return [f[0], attributeSqlString];
          } else {
            const getSqlParams = getConstantSqlTypeMap["constantObject"];
            return [
              f[0],
              getConstantSql(
                {
                  transformerType: "constantObject",
                  value: f[1],
                },
                preparedStatementParametersCount,
                topLevelTransformer,
                getSqlParams.targetType,
                getSqlParams.sqlTargetType,
                withClauseColumnName ?? getSqlParams.label
              ),
            ];
          }
          throw new Error(
            "sqlStringForRuntimeTransformer freeObjectTemplate object for " +
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
            "sqlStringForRuntimeTransformer freeObjectTemplate for " +
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
  log.info(
    "sqlStringForRuntimeTransformer freeObjectTemplate objectAttributes",
    JSON.stringify(objectAttributes, null, 2)
  );
  const attributeError = objectAttributes.find(
    (e: [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>]) =>
      e[1] instanceof Domain2ElementFailed
  );

  if (attributeError) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage:
        "sqlStringForRuntimeTransformer freeObjectTemplate attributeValue failed: " +
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

  const selectFromString =
    selectFromList.length > 0
      ? "FROM\n" +
        indent(indentLevel + 1) +
        selectFromList
          .map((e) => `(SELECT ROW_NUMBER() OVER () AS row_num, "${e}".* FROM "${e}") AS "${e}"`)
          .join(tokenSeparatorForSelect + "\n" + indent(indentLevel + 1))
      : "";
  // const whereClause =
  //   selectFromList.length > 1 ? `WHERE ${selectFromList.join(tokenSeparatorForSelect)}` : "";
  const attributesAsString: string = castObjectAttributes
    .map(
      (e: [string, SqlStringForTransformerElementValue]) =>
        tokenStringQuote +
        e[0] +
        tokenStringQuote +
        tokenSeparatorForSelect +
        " " +
        e[1].sqlStringOrObject +
        (e[1].extraWith && e[1].extraWith.length > 0
          ? '."' + e[1].extraWith[0].sqlResultAccessPath?.slice(1) + '"'
          : "")
    )
    .join(tokenSeparatorForSelect);

  if (topLevelTransformer) {
    return {
      type: "json",
      sqlStringOrObject:
        `SELECT jsonb_build_object(${attributesAsString}) AS "object_freeObjectTemplate"` +
        "\n" +
        indent(indentLevel + 1) +
        selectFromString,
      preparedStatementParameters,
      extraWith: subQueryExtraWith,
      resultAccessPath: [0, "object_freeObjectTemplate"],
      columnNameContainingJsonValue: "object_freeObjectTemplate",
    };
  } else {
    return {
      type: "tableOf1JsonColumn",
      sqlStringOrObject: `"object_subfreeObjectTemplate"`, // TODO: REMOVE DOUBLE QUOTES
      extraWith: [
        ...subQueryExtraWith,
        {
          name: "object_subfreeObjectTemplate",
          sql:
            `SELECT jsonb_build_object(${attributesAsString}) AS "object_freeObjectTemplate"` +
            "\n" +
            indent(indentLevel + 1) +
            selectFromString,
          sqlResultAccessPath: [0, "object_freeObjectTemplate"],
        },
      ],
      preparedStatementParameters,
      resultAccessPath: [0, "object_freeObjectTemplate"],
      columnNameContainingJsonValue: "object_freeObjectTemplate",
    };
  }
  // break;
}
// ################################################################################################
function sqlStringForUniqueTransformer(
  actionRuntimeTransformer: TransformerForRuntime_unique,
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
        columnNameContainingJsonValue: "unique_objects",
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
        failureMessage: "sqlStringForRuntimeTransformer unique referenceQuery result is scalar, not json",
      });
      break;
    }
    default: {
      throw new Error(
        "sqlStringForRuntimeTransformer unique referenceQuery result type is not known: " +
          referenceQuery.type
      );
      break;
    }
  }
}

// ################################################################################################
function sqlStringForMapperListToListTransformer(
  actionRuntimeTransformer: TransformerForRuntime_list_listMapperToList,
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
  // throw new Error("sqlStringForRuntimeTransformer mapperListToList not implemented");
  let newPreparedStatementParametersCount = preparedStatementParametersCount;

  // const referenceName: string = (actionRuntimeTransformer as any).referencedTransformer;
  const transformerLabel: string = (actionRuntimeTransformer as any).label ?? actionRuntimeTransformer.transformerType;
  const referenceToOuterObjectRenamed: string =
    transformerLabel + "_" + actionRuntimeTransformer.referenceToOuterObject;
  
  const sqlStringForElementTransformer = sqlStringForRuntimeTransformer(
    actionRuntimeTransformer.elementTransformer,
    newPreparedStatementParametersCount,
    indentLevel,
    queryParams,
    {
      ...definedContextEntries,
      [actionRuntimeTransformer.referenceToOuterObject]: {
        type: "json",
        renameTo: referenceToOuterObjectRenamed,
        attributeResultAccessPath: ["element"],
      },
    }, // contextEntries
    useAccessPathForContextReference,
    topLevelTransformer,
    undefined, // withClauseColumnName
    referenceToOuterObjectRenamed, // iterateOn
  );

  log.info(
    "sqlStringForMapperListToListTransformer mapperListToList found elementTransformer",
    JSON.stringify(sqlStringForElementTransformer, null, 2)
  );
  if (sqlStringForElementTransformer instanceof Domain2ElementFailed) {
    return sqlStringForElementTransformer;
  }
  if (sqlStringForElementTransformer.type != "json") {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForMapperListToListTransformer mapperListToList elementTransformer not json",
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
    // false,//useAccessPathForContextReference, // useAccessPathForContextReference,
    useAccessPathForContextReference,// false, // useAccessPathForContextReference,
    topLevelTransformer,
);
  // log.info("sqlStringForRuntimeTransformer mapperListToList found applyTo", JSON.stringify(applyTo, null, 2));
  if (applyTo instanceof Domain2ElementFailed) {
    return applyTo;
  }
  if (!["json", "json_array"].includes(applyTo.type)) { // TODO: why is cast needed?
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForMapperListToListTransformer mapperListToList referenceQuery result is not json:" + applyTo.type,
    });
  }

  if (applyTo.preparedStatementParameters) {
    preparedStatementParameters = [...preparedStatementParameters, ...applyTo.preparedStatementParameters];
    newPreparedStatementParametersCount += applyTo.preparedStatementParameters.length;
  }
  log.info(
    "sqlStringForMapperListToListTransformer mapperListToList applyTo",
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
    //   // const sqlResult = `SELECT * FROM (${applyTo.sqlStringOrObject}) AS "mapperListToList" ORDER BY ${column}`;
    //   const sqlResult = `SELECT * FROM (${applyTo.sqlStringOrObject}) AS "mapperListToList"`;
    //   return {
    //     // type: "json",
    //     type: "table",
    //     sqlStringOrObject: sqlResult,
    //     preparedStatementParameters: applyTo.preparedStatementParameters,
    //     resultAccessPath: [0, "mapperListToList"],
    //   };
    //   break;
    // }
    // case "scalar": {
    //   return new Domain2ElementFailed({
    //     queryFailure: "QueryNotExecutable",
    //     query: actionRuntimeTransformer as any,
    //     failureMessage: "sqlStringForRuntimeTransformer mapperListToList referenceQuery result is scalar, not json",
    //   });
    //   break;
    // }
    default: {
      return new Domain2ElementFailed({
        queryFailure: "QueryNotExecutable",
        query: actionRuntimeTransformer as any,
        failureMessage: "sqlStringForMapperListToListTransformer mapperListToList referenceQuery not json",
      });
      break;
    }
  }
}

// ################################################################################################
function sqlStringForListPickElementTransformer(
  actionRuntimeTransformer: TransformerForRuntime_list_listPickElement,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  log.info(
    "sqlStringForListPickElementTransformer listPickElement called for",
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

    log.info("sqlStringForListPickElementTransformer listPickElement found applyTo", JSON.stringify(sqlForApplyTo, null, 2));
    if (sqlForApplyTo instanceof Domain2ElementFailed) {
      return sqlForApplyTo;
    }

    const limit = actionRuntimeTransformer.index;
    let sqlResult;
    switch (sqlForApplyTo.type) {
      case "tableOf1JsonColumn": {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForListPickElementTransformer listPickElement referenceQuery result is tableOf1JsonColumn",
        });
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
)::jsonb AS "listPickElement" 
FROM
(${sqlForApplyTo.sqlStringOrObject}) AS "listPickElement_applyTo", 
LATERAL jsonb_array_elements("listPickElement_applyTo"."${
  (sqlForApplyTo as any).resultAccessPath[1]
}") AS "listPickElement_applyTo_array"
`;
        } else { // no orderBy
          // SELECT ("listPickElement_applyTo_array" ->> ${limit})::"any" AS "listPickElement" 
          sqlResult = `
SELECT "listPickElement_applyTo_array"."value" AS "listPickElement"
FROM
(${sqlForApplyTo.sqlStringOrObject}) AS "listPickElement_applyTo", 
LATERAL jsonb_array_elements("listPickElement_applyTo"."${
(sqlForApplyTo as any).resultAccessPath[1]
}") AS "listPickElement_applyTo_array" LIMIT 1 OFFSET ${limit}
`;
//               sqlResult = `SELECT ("listPickElement_applyTo"."${
//                 (sqlForApplyTo as any).resultAccessPath[1]
//               }" ->> ${limit}) AS "listPickElement" 
// FROM (${sqlForApplyTo.sqlStringOrObject}) AS "listPickElement_applyTo"
// `;
        }
        return {
          type: "json",
          sqlStringOrObject: sqlResult,
          preparedStatementParameters: sqlForApplyTo.preparedStatementParameters,
          resultAccessPath: [0, "listPickElement"],
          columnNameContainingJsonValue: "listPickElement",
        };
        break;
      }
      case "table": {
        // const column = referenceQuery.resultAccessPath?"." + referenceQuery.resultAccessPath.join("."): "";
        if (actionRuntimeTransformer.orderBy) {
          sqlResult = `SELECT * FROM (${sqlForApplyTo.sqlStringOrObject}) AS "listPickElement" ORDER BY ${actionRuntimeTransformer.orderBy} LIMIT 1 OFFSET ${limit}`;
        } else {
          sqlResult = `SELECT * FROM (${sqlForApplyTo.sqlStringOrObject}) AS "listPickElement" LIMIT 1 OFFSET ${limit}`;
        }
        return {
          type: "json",
          sqlStringOrObject: sqlResult,
          preparedStatementParameters: sqlForApplyTo.preparedStatementParameters,
          resultAccessPath: [0, ...(sqlForApplyTo.resultAccessPath ?? [])],
          columnNameContainingJsonValue: "listPickElement",
        };
        break;
      }
      case "scalar": {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForListPickElementTransformer listPickElement referenceQuery result is scalar, not json",
        });
        break;
      }
      default: {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForListPickElementTransformer listPickElement referenceQuery not json",
        });
        break;
      }
    }
  } else {
    throw new Error("sqlStringForListPickElementTransformer listPickElement not implemented for (non-topLevel) inner transformer");
  }
  // break;
}

// ################################################################################################
// TODO: used for build, too, type is incorrect
function sqlStringForObjectFullTemplateTransformer(
  // actionRuntimeTransformer: TransformerForBuild_object_fullTemplate | TransformerForRuntime_object_fullTemplate,
  actionRuntimeTransformer: TransformerForRuntime_object_fullTemplate,
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
        failureMessage: "sqlStringForObjectFullTemplateTransformer object_fullTemplate resultAccessPath has map: " + JSON.stringify(resolvedApplyTo.resultAccessPath, null, 2),
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

    newDefinedContextEntries[actionRuntimeTransformer.referenceToOuterObject] = {
      type: "json",
      renameTo: applyToName,
      attributeResultAccessPath: resolvedApplyTo.columnNameContainingJsonValue
        ? [resolvedApplyTo.columnNameContainingJsonValue]
        : (resolvedApplyTo.resultAccessPath?.slice(1) as any), // correct since resolvedApplyTo has no "map" (object) item
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
          "sqlStringForObjectFullTemplateTransformer object_fullTemplate attributeValue for",
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

        const attributeKey = typeof f.attributeKey == "object" && f.attributeKey.transformerType? sqlStringForRuntimeTransformer(
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
            transformerType: "constant",
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
            failureMessage: "sqlStringForObjectFullTemplateTransformer object_fullTemplate attributeKey is table",
          })];
        }
        if (!attributeKey.resultAccessPath) {
          return [new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForObjectFullTemplateTransformer object_fullTemplate attributeKey has no resultAccessPath",
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
    log.info("sqlStringForObjectFullTemplateTransformer object_fullTemplate extraWidth", JSON.stringify(extraWith,null,2));
    const sqlResult =
      // flushAndIndent(indentLevel) +
      "SELECT jsonb_build_object(" +
      objectKeyValues +
      ') AS "object_fullTemplate" ' +
      flushAndIndent(indentLevel) +
      "FROM " +
      objectKeyValues_With_references +
      flushAndIndent(indentLevel) +
      orderBy;
    // const sqlResult = `SELECT jsonb_build_object(${objectAttributes}) AS "innerFullObjectTemplate" FROM ${objectAttributes_With_references} GROUP BY ${objectAttributes} ${orderBy}`;
    log.info("sqlStringForObjectFullTemplateTransformer object_fullTemplate sqlResult", JSON.stringify(sqlResult));
    return {
      type: "json",
      sqlStringOrObject: sqlResult,
      preparedStatementParameters,
      resultAccessPath: [0, "object_fullTemplate"],
      columnNameContainingJsonValue: "object_fullTemplate",
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
    log.info("sqlStringForObjectFullTemplateTransformer object_fullTemplate resolvedApplyTo", JSON.stringify(resolvedApplyTo, null, 2));

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
          typeof f.attributeKey == "object" && f.attributeKey.transformerType
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
                  transformerType: "constant",
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
        failureMessage: "sqlStringForObjectFullTemplateTransformer object_fullTemplate attributeKey or attributeValue failed: " + JSON.stringify(foundError, null, 2),
      });
    }
    console.log(
      "sqlStringForObjectFullTemplateTransformer object_fullTemplate objectAttributes",
      JSON.stringify(objectAttributes, null, 2)
    );
    console.log(
      "sqlStringForObjectFullTemplateTransformer object_fullTemplate preparedStatementParameters",
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
      + "SELECT " + create_object + " AS \"object_fullTemplate\""
      + flushAndIndent(indentLevel)
      + "FROM " + resolvedApplyTo.sqlStringOrObject;
    log.info("sqlStringForObjectFullTemplateTransformer object_fullTemplate sqlResult", sqlResult);
    return {
      type: "json",
      sqlStringOrObject: sqlResult,
      resultAccessPath: undefined,
      columnNameContainingJsonValue: "object_fullTemplate",
      preparedStatementParameters,
    };
  }
}

// ################################################################################################
function sqlStringForObjectAlterTransformer(
  actionRuntimeTransformer: TransformerForRuntime_object_alter,
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
      failureMessage: "sqlStringForObjectAlterTransformer objectAlter referenceQuery not json",
    });
  }
  const accessPathHasMap = applyToSql.resultAccessPath?.find((e: any) => typeof e == "object" && e.type == "map");
  if (accessPathHasMap) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForObjectAlterTransformer object_fullTemplate resultAccessPath has map: " + JSON.stringify(applyToSql.resultAccessPath, null, 2),
    });
  }
  // #############################################
  newPreparedStatementParametersCount += (applyToSql.preparedStatementParameters ?? []).length;
  preparedStatementParameters = [...preparedStatementParameters, ...(applyToSql.preparedStatementParameters ?? [])];

  let newDefinedContextEntries = { ...definedContextEntries };
  newDefinedContextEntries[actionRuntimeTransformer.referenceToOuterObject] = {
    type: "json",
    renameTo: applyToName,
    attributeResultAccessPath: applyToSql.resultAccessPath?.slice(1) as any, // correct since resolvedApplyTo has no "map" (object) item
  };
  // #############################################

  const subQuery: Domain2QueryReturnType<SqlStringForTransformerElementValue> = sqlStringForRuntimeTransformer(
    actionRuntimeTransformer.definition as TransformerForRuntime,
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
      failureMessage: "sqlStringForObjectAlterTransformer objectAlter attributeValue failed: " + JSON.stringify(subQuery, null, 2),
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
      ? `(SELECT ROW_NUMBER() OVER () AS row_num, ${subQuery.sqlStringOrObject}.* FROM ${subQuery.sqlStringOrObject}) AS "objectAlter_subQuery"`
      : `(SELECT ROW_NUMBER() OVER () AS row_num, ${subQuery.sqlStringOrObject} AS "objectAlter_subQueryColumn") AS "objectAlter_subQuery"` // subQuery.type == json
  ;
  const subQueryColumnName = subQuery.type == "tableOf1JsonColumn"? subQuery.columnNameContainingJsonValue : "objectAlter_subQueryColumn";

  const sqlResult = `SELECT (
${indent(indentLevel + 1)}"${applyToName}".${applyToSql.resultAccessPath?.slice(1).map(e=>tokenNameQuote+e+tokenNameQuote).join('->')}
${indent(indentLevel + 1)}||
${indent(indentLevel + 1)}"objectAlter_subQuery"."${subQueryColumnName}"
${indent(indentLevel)}) AS "objectAlter"
${indent(indentLevel)}FROM (SELECT ROW_NUMBER() OVER () AS row_num, "${applyToName}".* FROM "${applyToName}") AS "${applyToName}",
${indent(indentLevel + 1)}${subQueryWithRowNumber}
${indent(indentLevel)}WHERE "${applyToName}".row_num = "objectAlter_subQuery".row_num
`;

    const result: SqlStringForTransformerElementValue = {
      type: "json",
      sqlStringOrObject: sqlResult,
      preparedStatementParameters,
      resultAccessPath: [0, "objectAlter"],
      columnNameContainingJsonValue: "objectAlter",
      extraWith,
    }
    // log.info("sqlStringForRuntimeTransformer freeObjectTemplate objectAttributes", JSON.stringify(objectAttributes, null, 2));
    log.info("sqlStringForObjectAlterTransformer freeObjectTemplate subquery", JSON.stringify(subQuery, null, 2));
    log.info("sqlStringForObjectAlterTransformer returning result=", JSON.stringify(result, null, 2));
    // throw new Error("sqlStringForObjectAlterTransformer not implemented ");
    return result;
}

// ################################################################################################
function sqlStringForObjectEntriesTransformer(
  actionRuntimeTransformer: TransformerForRuntime_objectEntries,
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
  const sqlResult = `SELECT jsonb_agg(json_build_array(key, value)) AS "objectEntries" FROM "innerQuery", jsonb_each("innerQuery"."${
    (applyTo as any).resultAccessPath[1]
  }")`;

  return {
    type: "json",
    sqlStringOrObject: sqlResult,
    preparedStatementParameters: applyTo.preparedStatementParameters,
    resultAccessPath: [0, "objectEntries"],
    columnNameContainingJsonValue: "objectEntries",
    extraWith,
  };
}

// ################################################################################################
function sqlStringForObjectValuesTransformer(
  actionRuntimeTransformer: TransformerForRuntime_objectValues,
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
  const sqlResult = `SELECT jsonb_agg(value) AS "objectValues" FROM "innerQuery", jsonb_each("innerQuery"."${
    (applyTo as any).resultAccessPath[1]
  }")`;

  return {
    type: "json",
    sqlStringOrObject: sqlResult,
    preparedStatementParameters: applyTo.preparedStatementParameters,
    resultAccessPath: [0, "objectValues"],
    columnNameContainingJsonValue: "objectValues",
    extraWith,
  };
}

// ################################################################################################
function sqlStringForListReducerToIndexObjectTransformer(
  actionRuntimeTransformer: TransformerForRuntime_object_listReducerToIndexObject,
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
    "sqlStringForRuntimeTransformer listReducerToIndexObject found definedContextEntries",
    JSON.stringify(definedContextEntries, null, 2)
  );
  log.info("sqlStringForRuntimeTransformer listReducerToIndexObject found applyTo", JSON.stringify(applyTo, null, 2));
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
    // case "json":
    case "json_array": {
      const sqlResult =
        "SELECT " +
        'jsonb_object_agg("' +
        applyToLabelElements +
        '" ->> \'' + actionRuntimeTransformer.indexAttribute + '\', ' +
        '"' +
        applyToLabelElements +
        '")' +
        ' AS "' +
        transformerLabel +
        '"' +
        flushAndIndent(indentLevel) +
        'FROM "' +
        applyToLabel +
        '"' +
        ', jsonb_array_elements("' +
        applyToLabel +
        '"."' +
        (applyTo as any).columnNameContainingJsonValue +
        '") AS "' +
        applyToLabelElements +
        '"'
        // +
        // ', jsonb_each("' +
        // applyToLabelElements +
        // '") AS "' +
        // applyToLabelPairs +
        // '"'
        ;
      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters: applyTo.preparedStatementParameters,
        resultAccessPath: [0, transformerLabel],
        columnNameContainingJsonValue: transformerLabel,
        extraWith,
      };
    }
    case "json":
    case "tableOf1JsonColumn": {
      throw new Error(
        "sqlStringForRuntimeTransformer listReducerToIndexObject not implemented for applyTo type:" + applyTo.type
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
        "sqlStringForRuntimeTransformer listReducerToIndexObject not implemented for applyTo type:" + applyTo.type
      );
    }
    case "scalar": {
      throw new Error(
        "sqlStringForRuntimeTransformer listReducerToIndexObject not implemented for applyTo type:" + applyTo.type
      );
      break;
    }
    default:
      throw new Error(
        "sqlStringForRuntimeTransformer listReducerToIndexObject not implemented for applyTo type:" + applyTo.type
      );
      break;
  }
}

// ################################################################################################
function sqlStringForListReducerToSpreadObjectTransformer(
  actionRuntimeTransformer: TransformerForRuntime_object_listReducerToSpreadObject,
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
  let newPreparedStatementParametersCount = preparedStatementParametersCount;
  let preparedStatementParameters: any[] = [];
  // newPreparedStatementParametersCount += preparedStatementParameters.length;
  // const newDefinedContextEntries = {
  //   ...definedContextEntries
  // }

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
  log.info("sqlStringForListReducerToSpreadObjectTransformer found definedContextEntries", JSON.stringify(definedContextEntries, null, 2));
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
    // case "json":
    case "json_array": {
      const sqlResult =
        "SELECT " +
        'jsonb_object_agg("' +
        applyToLabelPairs +
        '"."key", ' +
        '"' +
        applyToLabelPairs +
        '"."value")' +
        ' AS "' +
        transformerLabel +
        '"' +
        flushAndIndent(indentLevel) +
        'FROM "' +
        applyToLabel +
        '"' +
        ', jsonb_array_elements("' +
        applyToLabel +
        '"."' +
        (applyTo as any).columnNameContainingJsonValue +
        '") AS "' +
        applyToLabelElements +
        '"' +
        ', jsonb_each("' +
        applyToLabelElements +
        '") AS "' +
        applyToLabelPairs +
        '"';
      return {
        type: "json",
        sqlStringOrObject: sqlResult,
        preparedStatementParameters: applyTo.preparedStatementParameters,
        resultAccessPath: [0, transformerLabel],
        columnNameContainingJsonValue: transformerLabel,
        extraWith,
      };
    }
    case "json":
    case "tableOf1JsonColumn": {
      // case "json": {
      const sqlResult =
        "SELECT " +
        'jsonb_object_agg("' +
        applyToLabelPairs +
        '"."key", ' +
        '"' +
        applyToLabelPairs +
        '"."value")' +
        ' AS "' +
        transformerLabel +
        '"' +
        flushAndIndent(indentLevel) +
        'FROM "' +
        applyToLabel +
        '"' +
        ', jsonb_each("' +
        applyToLabel +
        '"."' +
        (applyTo as any).columnNameContainingJsonValue +
        '") AS "' +
        applyToLabelPairs +
        '"';
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
  actionRuntimeTransformer: TransformerForRuntime_dataflowObject,
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

  const definitionSql: [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>][] = Object.entries(actionRuntimeTransformer.definition).map(
    (f, index): [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>] => {
      const itemSql = sqlStringForRuntimeTransformer(
        f[1],
        newPreparedStatementParametersCount,
        indentLevel,
        queryParams,
        newDefinedContextEntries,
        useAccessPathForContextReference,
        topLevelTransformer,
        // undefined, // withClauseColumnName
        // iterateOn, // iterateOn
      );
      // log.info("sqlStringForRuntimeTransformer dataflowObject for item", f[0], "itemSql", JSON.stringify(itemSql, null, 2));
      if (itemSql instanceof Domain2ElementFailed) {
        log.error("sqlStringForDataflowObjectTransformer failed for transformer:",JSON.stringify(f[1], null, 2), "itemSql=", JSON.stringify(itemSql, null, 2));
        return [f[0], itemSql];
      }
      if (itemSql.type != "json") {
        return [f[0], new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForDataflowObjectTransformer itemSql not json",
        })];
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
        preparedStatementParameters = [...preparedStatementParameters, ...itemSql.preparedStatementParameters];
        newPreparedStatementParametersCount += itemSql.preparedStatementParameters.length;
      }
      newDefinedContextEntries[f[0]] = {
        type: "json",
        // renameTo: f[0],
        // attributeResultAccessPath: itemSql.resultAccessPath?.slice(1,resultPathMapIndex == -1?itemSql.resultAccessPath.length: resultPathMapIndex) as any,
        attributeResultAccessPath: itemSql.columnNameContainingJsonValue?[itemSql.columnNameContainingJsonValue]:itemSql.resultAccessPath?.slice(1) as any,
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
  // if(!Object.hasOwn(definitionSqlObject,actionRuntimeTransformer.target)) {
  if(!definitionSqlObject[actionRuntimeTransformer.target]) {
    return new Domain2ElementFailed({
      queryFailure: "QueryNotExecutable",
      query: actionRuntimeTransformer as any,
      failureMessage: "sqlStringForDataflowObjectTransformer target not found in definitionSql",
    });
  }
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
    sqlStringOrObject: `SELECT "${definitionSqlObject[actionRuntimeTransformer.target].columnNameContainingJsonValue}" FROM "${actionRuntimeTransformer.target}"`,
    preparedStatementParameters,
    extraWith,
    resultAccessPath: (definitionSqlObject[actionRuntimeTransformer.target] as any).resultAccessPath,
    columnNameContainingJsonValue: definitionSqlObject[actionRuntimeTransformer.target].columnNameContainingJsonValue,
  };
}

// ################################################################################################
function sqlStringForConstantAnyTransformer(
  actionRuntimeTransformer: TransformerForRuntime_constantArray,
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
  actionRuntimeTransformer: TransformerForRuntime_constant,
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
  const { sqlTargetType, label } = getSqlTypeForValue(actionRuntimeTransformer.value);
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
function sqlStringForContextReferenceTransformer(
  actionRuntimeTransformer: TransformerForRuntime_contextReference,
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
    JSON.stringify(resultAccessPath, null, 2)
  );
  // log.info("sqlStringForRuntimeTransformer contextReference",actionRuntimeTransformer.referencePath,"resultAccessPath", resultAccessPath);
  const resultAccessPathStringForTable = resultAccessPath
    .map((e, index) => `${index == 0 ? tokenNameQuote + e + tokenNameQuote : tokenStringQuote + e + tokenStringQuote}`)
    .join(tokenSeparatorForTableColumn);

  const resultAccessPathStringForJson = resultAccessPath
    .map(
      (e, index) => `${index == 0 ? tokenNameQuote + e + tokenNameQuote : tokenStringQuote + e + tokenStringQuote}`
    )
    .join(tokenSeparatorForJsonAttributeAccess);
  const usedReferenceName = definedContextEntry.renameTo??referenceName;
  if (topLevelTransformer) {
    const result: SqlStringForTransformerElementValue = {
      type: definedContextEntry.type,
      sqlStringOrObject:
        "SELECT " +
        (resultAccessPath.length > 0
          ? (resultAccessPathStringForJson + ' AS "' + usedReferenceName + '"')
          : "*") +
        // (resultAccessPathStringForJson.length > 0
        //   ? (resultAccessPathStringForJson + ' AS "' + usedReferenceName + '"')
        //   : "*") +
        flushAndIndent(indentLevel) +
        'FROM "' +
        usedReferenceName +
        '"',
      usedContextEntries: [usedReferenceName],
      resultAccessPath: [0, usedReferenceName],
      columnNameContainingJsonValue: definedContextEntry.type ==  "json"?usedReferenceName: undefined,
    };
    log.info("sqlStringForContextReferenceTransformer topLevelTransformer=true", JSON.stringify(result, null, 2));
    return result;
  } else { // topLevelTransformer == false
    const result: SqlStringForTransformerElementValue = {
      type: definedContextEntry.type,
      sqlStringOrObject: definedContextEntry.type == "table" ?
      `"${usedReferenceName}"${resultAccessPathStringForTable.length > 0 ? "." + resultAccessPathStringForTable : ""}`:
      `"${usedReferenceName}"${resultAccessPathStringForJson.length > 0 ? tokenSeparatorForTableColumn + resultAccessPathStringForJson : ""}`,
      resultAccessPath: [0, usedReferenceName],
      usedContextEntries: [usedReferenceName],
      columnNameContainingJsonValue: definedContextEntry.type ==  "json"?usedReferenceName: undefined,
    };
    log.info("sqlStringForContextReferenceTransformer topLevelTransformer=false", JSON.stringify(result, null, 2));
    return result;
  }
}

// ################################################################################################
function sqlStringForParameterReferenceTransformer(
  actionRuntimeTransformer: TransformerForRuntime_contextReference,
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
      transformerType: "constant",
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
  actionRuntimeTransformer: TransformerForRuntime_objectDynamicAccess,
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
  actionRuntimeTransformer: TransformerForRuntime_constantAsExtractor,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
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
  actionRuntimeTransformer: TransformerForRuntime_newUuid,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any>,
  definedContextEntries: Record<string, SqlContextEntry>,
  useAccessPathForContextReference: boolean,
  topLevelTransformer: boolean,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  return {
    type: "scalar",
    sqlStringOrObject: (topLevelTransformer ? "select " : "") + "gen_random_uuid()",
  };
}

// ################################################################################################
export function sqlStringForRuntimeTransformer(
  actionRuntimeTransformer: TransformerForRuntime,
  preparedStatementParametersCount: number,
  indentLevel: number,
  queryParams: Record<string, any> = {},
  definedContextEntries: Record<string, SqlContextEntry> = {},
  useAccessPathForContextReference: boolean = true,
  topLevelTransformer: boolean = true,
  withClauseColumnName?: string,
  iterateOn?: string,
): Domain2QueryReturnType<SqlStringForTransformerElementValue> {
  log.info(
    "sqlStringForRuntimeTransformer called with actionRuntimeTransformer",
    JSON.stringify(actionRuntimeTransformer, null, 2)
  );

  const orderBy = (actionRuntimeTransformer as any).orderBy
    ? `ORDER BY "${(actionRuntimeTransformer as any).orderBy}"`
    : "";

  log.info("sqlStringForRuntimeTransformer actionRuntimeTransformer", actionRuntimeTransformer);
  if (typeof actionRuntimeTransformer != "object" || Array.isArray(actionRuntimeTransformer)) {
    return sqlStringForRuntimeTransformer(
      {
        transformerType: "constant",
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
  switch (actionRuntimeTransformer.transformerType) {
    case "dataflowSequence": {
      throw new Error("sqlStringForRuntimeTransformer dataflowSequence not implemented");
      break;
    }
    // case "constantUuid":
    case "constantBoolean":
    case "constantBigint":
    case "constantNumber":
    case "constantObject":
    case "constantString": {
      return sqlStringForConstantAnyTransformer(
        actionRuntimeTransformer as any,
        preparedStatementParametersCount,
        indentLevel,
        queryParams,
        definedContextEntries,
        useAccessPathForContextReference,
        topLevelTransformer,
        withClauseColumnName,
        iterateOn,
      );
      break;
    }
    default: {
      const castTransformer = actionRuntimeTransformer as any;
      const foundApplicationTransformer = applicationTransformerDefinitions[castTransformer.transformerType];

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
          if (!sqlTransformerImplementations[foundApplicationTransformer.transformerImplementation.sqlImplementationFunctionName]) {
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
            foundApplicationTransformer.transformerImplementation.definition as TransformerForRuntime,
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
    const convertedParam = sqlStringForRuntimeTransformer(
      {
        transformerType: "constant",
        interpolation: "runtime",
        value: value,
      },
      newPreparedStatementParameters.length,
      0, //indentLevel,
      selectorParams.extractor.queryParams,
      {}
    );
    if (convertedParam instanceof Domain2ElementFailed) {
      throw new Error("sqlStringForQuery queryParamsWithClauses convertedParam failed for key: " + key);
    }
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
          type: isJson(q.convertedParam.type) ? "json" : (q.convertedParam.type as any),
          attributeResultAccessPath: (q.convertedParam.resultAccessPath as any)?.slice(1), // because resultAccessPath returns the path viewed from the end user, for which the result is always an array
        },
      ];
    })
  );

  log.info("sqlStringForQuery found queryParamsWithClauses", JSON.stringify(queryParamsWithClauses, null, 2));
  log.info(
    "sqlStringForQuery found newPreparedStatementParameters for query parameters",
    JSON.stringify(newPreparedStatementParameters, null, 2)
  );
  const transformerRawQueries: [string, Domain2QueryReturnType<SqlStringForTransformerElementValue>][] = Object.entries(
    selectorParams.extractor.runtimeTransformers ?? {}
  ).map(([key, value]) => {
    const transformerRawQuery = sqlStringForRuntimeTransformer(
      value as TransformerForRuntime,
      newPreparedStatementParameters.length,
      1, // indentLevel,
      selectorParams.extractor.queryParams,
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
    queryParts.push(extractorRawQueries.map((q) => '"' + q[0] + '" AS (' + flushAndIndent(1) + q[1] + flushAndIndent(0) + ")").join(tokenSeparatorForWithRtn));
  }
  if (combinerRawQueries.length > 0) {
    queryParts.push(combinerRawQueries.map((q) => '"' + q[0] + '" AS (' + flushAndIndent(1) + q[1] + flushAndIndent(0) + ")").join(tokenSeparatorForWithRtn));
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
  log.info("sqlStringForQuery innerFullObjectTemplate aggregateRawQuery", query);
  return {
    query,
    preparedStatementParameters: newPreparedStatementParameters,
    transformerRawQueriesObject,
    endResultName,
    combinerRawQueriesObject,
  };
}

import {
  AsyncQueryRunnerParams,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  ExtractorOrCombiner,
  LoggerInterface,
  MiroirLoggerFactory,
  resolveInnerTransformer,
  ResultAccessPath,
  transformer_mustacheStringTemplate_apply,
  transformer_resolveReference,
  TransformerForRuntime,
  TransformerForRuntime_count,
  TransformerForRuntime_innerFullObjectTemplate,
  TransformerForRuntime_list_listMapperToList,
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

// ################################################################################################
export interface SqlContextEntry {
  // type: "json" | "scalar" | "table"; resultAccessPath?: (string | number)[]
  type: "json" | "scalar" | "table";
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

export type SqlStringForTransformerElementValue = {
  sqlStringOrObject: string;
  // resultAccessPath?: (string | number)[];
  resultAccessPath?: ResultAccessPath;
  encloseEndResultInArray?: boolean;
  extraWith?: { name: string; sql: string }[];
  type: "json" | "table" | "scalar";
  preparedStatementParameters?: any[];
};

// ################################################################################################
function sqlStringForApplyTo(
  actionRuntimeTransformer:
    | TransformerForRuntime_object_fullTemplate
    | TransformerForRuntime_count
    | TransformerForRuntime_list_listPickElement
    | TransformerForRuntime_list_listMapperToList
    | TransformerForRuntime_objectValues
    | TransformerForRuntime_objectEntries
    | TransformerForRuntime_unique
    | TransformerForRuntime_innerFullObjectTemplate,
  preparedStatementParametersIndex: number,
  queryParams: Record<string, any> = {},
  // newFetchedData: Record<string, any> = {},
  definedContextEntries: Record<string, any> = {},
  useAccessPathForContextReference: boolean = true,
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
      ? sqlStringForTransformer( // shouldn't this be a contextReference instead?
          {
            transformerType: "constant",
            interpolation: "runtime",
            value: actionRuntimeTransformer.applyTo.reference as any,
          },
          preparedStatementParametersIndex,
          queryParams,
          definedContextEntries,
          useAccessPathForContextReference,
          topLevelTransformer,
        )
      : sqlStringForTransformer(
          actionRuntimeTransformer.applyTo.reference,
          preparedStatementParametersIndex,
          queryParams,
          definedContextEntries,
          useAccessPathForContextReference,
          topLevelTransformer,
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
  useAccessPathForContextReference: boolean = true,
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
      if (actionRuntimeTransformer.interpolation == "runtime") {
        throw new Error("sqlStringForTransformer mustacheStringTemplate interpolation not implemented: runtime");
        // const resolvedReference = sqlStringForTransformer(
        //   f.attributeKey,
        //   newPreparedStatementParametersCount,
        //   queryParams,
        //   definedContextEntries,
        //   true,
        //   `attributeKey${index}`, 

        // )
        // // const resolvedReference = transformer_resolveReference(
        // //   "runtime",
        // //   actionRuntimeTransformer,
        // //   "param",
        // //   queryParams,
        // //   definedContextEntries
        // // );
        // if (resolvedReference instanceof Domain2ElementFailed) {
        //   return resolvedReference;
        // }
        // const referenceQuery = sqlStringForTransformer(
        //   {
        //     transformerType: "constant",
        //     interpolation: "runtime",
        //     value: resolvedReference as any,
        //   },
        //   preparedStatementParametersCount,
        //   queryParams,
        //   definedContextEntries,
        //   true
        // );
        // return referenceQuery;
      } else {
        const resolvedReference = transformer_mustacheStringTemplate_apply(
          actionRuntimeTransformer.interpolation??"build",
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
    }
    case "innerFullObjectTemplate":
    case "object_fullTemplate": {
      if (topLevelTransformer) {
        let newPreparedStatementParametersCount = preparedStatementParametersCount;
        const resolvedApplyTo = sqlStringForApplyTo(
          actionRuntimeTransformer,
          newPreparedStatementParametersCount,
          queryParams,
          definedContextEntries,
          useAccessPathForContextReference,
          topLevelTransformer,
        );
        if (resolvedApplyTo instanceof Domain2ElementFailed) {
          return resolvedApplyTo;
        }

        let preparedStatementParameters: any[] = resolvedApplyTo.preparedStatementParameters ?? [];
        // const extraWith: { name: string; sql: string; sqlResultAccessPath?: (string | number)[] }[] = [
        const extraWith: { name: string; sql: string; sqlResultAccessPath?: ResultAccessPath }[] = [
        ];
        newPreparedStatementParametersCount += preparedStatementParameters.length;
        actionRuntimeTransformer.definition.forEach((f, index) => {
          const attributeValue = sqlStringForTransformer(
            f.attributeValue,
            newPreparedStatementParametersCount,
            queryParams,
            definedContextEntries,
            useAccessPathForContextReference,
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
            useAccessPathForContextReference,
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
            sqlResultAccessPath: attributeKey.resultAccessPath,
          });
          extraWith.push({
            name: "attributeValue" + index,
            sql: attributeValue.sqlStringOrObject,
            sqlResultAccessPath: attributeValue.resultAccessPath,
          });
        });

        const resultExtraWith: { name: string; sql: string; sqlResultAccessPath?: (string | number)[] }[] = [
          {
            name: "applyTo",
            sql: resolvedApplyTo.sqlStringOrObject,
            sqlResultAccessPath: resolvedApplyTo.resultAccessPath,
          },
          ...(resolvedApplyTo.extraWith ?? []),
          ...extraWith
        ];

        // Build a new object with keys and corresponding values from the definition.
        const objectAttributes = extraWith
          .map((e, index) => `"${e.name}"."${(e.sqlResultAccessPath as any)[1]}"`)
          .join(", ");
        const objectAttributes_With_references = extraWith
          .map((e, index) => {
            return `"${e.name}"`;
          })
          .join(", ");
        log.info("sqlStringForTransformer object_fullTemplate extraWidth", JSON.stringify(extraWith,null,2));
        const sqlResult = `
  SELECT jsonb_build_object(${objectAttributes}) AS "object_fullTemplate"
  FROM ${objectAttributes_With_references}
  ${orderBy}
  `;
        // const sqlResult = `SELECT jsonb_build_object(${objectAttributes}) AS "innerFullObjectTemplate" FROM ${objectAttributes_With_references} GROUP BY ${objectAttributes} ${orderBy}`;
        log.info("sqlStringForTransformer object_fullTemplate sqlResult", JSON.stringify(sqlResult));
        return {
          type: "json",
          sqlStringOrObject: sqlResult,
          preparedStatementParameters,
          resultAccessPath: [0, "object_fullTemplate"],
          extraWith: resultExtraWith,
        };
      } else { // topLevelTransformer == false
        let newPreparedStatementParametersCount = preparedStatementParametersCount;
        const resolvedApplyTo = sqlStringForApplyTo(
          actionRuntimeTransformer,
          newPreparedStatementParametersCount,
          queryParams,
          definedContextEntries, // undefined, // undefined, since the result will always be taken from this "WITH" clause.
          false,//useAccessPathForContextReference, // useAccessPathForContextReference,
          topLevelTransformer,
        );
        if (resolvedApplyTo instanceof Domain2ElementFailed) {
          return resolvedApplyTo;
        }
        log.info("sqlStringForTransformer object_fullTemplate resolvedApplyTo", JSON.stringify(resolvedApplyTo, null, 2));

        let preparedStatementParameters: any[] = resolvedApplyTo.preparedStatementParameters ?? [];
        newPreparedStatementParametersCount += preparedStatementParameters.length;

        const objectAttributes = actionRuntimeTransformer.definition
          .map((f, index) => {
            const attributeValue = sqlStringForTransformer(
              f.attributeValue,
              newPreparedStatementParametersCount,
              queryParams,
              definedContextEntries,
              useAccessPathForContextReference,
              false,
            );
            if (attributeValue instanceof Domain2ElementFailed) {
              return {attributeValue};
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
              useAccessPathForContextReference,
              false,
            );
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

        const foundError = objectAttributes.find((e: any) => e.attributeKey instanceof Domain2ElementFailed || e.attributeKey instanceof Domain2ElementFailed);
        if (foundError) {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer object_fullTemplate attributeKey or attributeValue failed: " + JSON.stringify(foundError, null, 2),
          });
        }
        console.log(
          "sqlStringForTransformer object_fullTemplate objectAttributes",
          JSON.stringify(objectAttributes, null, 2)
        );
        console.log(
          "sqlStringForTransformer object_fullTemplate preparedStatementParameters",
          JSON.stringify(preparedStatementParameters, null, 2)
        );
        const create_object = `jsonb_build_object(
            ${objectAttributes
              .map((e: any, index) => `${e.attributeKey.sqlStringOrObject}, ${e.attributeValue.sqlStringOrObject}`)
              .join(tokenSeparatorForSelect)}
          )`;
        // const objectAttributesString = objectAttributes.map((e: any, index) => `${e.attributeValue.sqlStringOrObject} AS "uuid"`).join(tokenSeparatorForSelect);
        // const objectAttributesString = objectAttributes.map((e: any, index) => `${e.attributeValue.sqlStringOrObject} AS ${e.attributeKey.name}`).join(tokenSeparatorForSelect);
        const sqlResult = `SELECT ${create_object} AS "object_fullTemplate" FROM ${resolvedApplyTo.sqlStringOrObject}`;
        // const sqlResult = `SELECT ${objectAttributesString} FROM ${resolvedApplyTo.sqlStringOrObject}`;
        log.info("sqlStringForTransformer object_fullTemplate sqlResult", sqlResult);
        return {
          type: "json",
          sqlStringOrObject: sqlResult,
          resultAccessPath: undefined,
          preparedStatementParameters,
        };
      }
      break;
    }
    case "mapperListToList": {
      /**
       * must take the rerferencedExtractor result and make it avaialable to elementTransformer, apply the elementTransformer to
       * each element of the list and return the sorted list of transformed elements
       */
      // throw new Error("sqlStringForTransformer mapperListToList not implemented");
      let newPreparedStatementParametersCount = preparedStatementParametersCount;

      // const referenceName: string = (actionRuntimeTransformer as any).referencedTransformer;
      const sqlStringForElementTransformer = sqlStringForTransformer(
        actionRuntimeTransformer.elementTransformer,
        newPreparedStatementParametersCount,
        queryParams,
        {...definedContextEntries, [actionRuntimeTransformer.referenceToOuterObject]: { type: "json", attributeResultAccessPath: ["element"] } },
        useAccessPathForContextReference,
        false, // topLevelTransformer
      );

      log.info(
        "sqlStringForTransformer mapperListToList found elementTransformer",
        JSON.stringify(sqlStringForElementTransformer, null, 2)
      );
      if (sqlStringForElementTransformer instanceof Domain2ElementFailed) {
        return sqlStringForElementTransformer;
      }
      if (sqlStringForElementTransformer.type != "json") {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForTransformer mapperListToList elementTransformer not json",
        });
      }

      let preparedStatementParameters: any[] = sqlStringForElementTransformer.preparedStatementParameters ?? [];
      newPreparedStatementParametersCount += preparedStatementParameters.length;

      const applyTo = sqlStringForApplyTo(
        actionRuntimeTransformer,
        newPreparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        useAccessPathForContextReference,// false, // useAccessPathForContextReference,
        topLevelTransformer
      );
      log.info("sqlStringForTransformer mapperListToList found applyTo", JSON.stringify(applyTo, null, 2));
      if (applyTo instanceof Domain2ElementFailed) {
        return applyTo;
      }
      if (applyTo.preparedStatementParameters) {
        preparedStatementParameters = [...preparedStatementParameters, ...applyTo.preparedStatementParameters];
        newPreparedStatementParametersCount += applyTo.preparedStatementParameters.length;
      }

      if (applyTo.type != "json") {
        return new Domain2ElementFailed({
          queryFailure: "QueryNotExecutable",
          query: actionRuntimeTransformer as any,
          failureMessage: "sqlStringForTransformer mapperListToList referenceQuery result is not json:" + applyTo.type,
        });
      }
      switch (applyTo.type) {
        case "json": {

          const extraWith: { name: string; sql: string }[] = [
            {
              name: actionRuntimeTransformer.referenceToOuterObject,
              sql:`
SELECT "mapperListToList_oneElementPerRow"."element" FROM (
  SELECT
    jsonb_array_elements("applyTo"."${(applyTo as any).resultAccessPath[1]}") AS "element"
    FROM (${applyTo.sqlStringOrObject}) AS "applyTo"
) AS "mapperListToList_oneElementPerRow"
`           },
            {
              name: "mapperListToList_elementTransformer",
              sql: sqlStringForElementTransformer.sqlStringOrObject,
            }
          ]
          const sqlResult = `
SELECT * FROM "mapperListToList_elementTransformer"
`;

          return {
            type: "json",
            sqlStringOrObject: sqlResult,
            preparedStatementParameters,
            extraWith,
            resultAccessPath: [{
              type: "map",  key: "object_fullTemplate"
            }]
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
        //     failureMessage: "sqlStringForTransformer mapperListToList referenceQuery result is scalar, not json",
        //   });
        //   break;
        // }
        default: {
          return new Domain2ElementFailed({
            queryFailure: "QueryNotExecutable",
            query: actionRuntimeTransformer as any,
            failureMessage: "sqlStringForTransformer mapperListToList referenceQuery not json",
          });
          break;
        }
      }
    }
    case "listPickElement": {
      log.info(
        "sqlStringForTransformer listPickElement called for",
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
          queryParams,
          definedContextEntries,
          useAccessPathForContextReference,
          topLevelTransformer
        );
  
        log.info("sqlStringForTransformer listPickElement found applyTo", JSON.stringify(sqlForApplyTo, null, 2));
        if (sqlForApplyTo instanceof Domain2ElementFailed) {
          return sqlForApplyTo;
        }
  
        const limit = actionRuntimeTransformer.index;
        let sqlResult;
        switch (sqlForApplyTo.type) {
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
              sqlResult = `SELECT "listPickElement_applyTo"."${
                (sqlForApplyTo as any).resultAccessPath[1]
              }" ->> ${limit} AS "listPickElement" 
  FROM (${sqlForApplyTo.sqlStringOrObject}) AS "listPickElement_applyTo"
  `;
            }
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
          preparedStatementParameters: sqlForApplyTo.preparedStatementParameters,
          resultAccessPath: [0, "listPickElement"],
        };
      } else {
        throw new Error("sqlStringForTransformer listPickElement not implemented for (non-topLevel) inner transformer");
      }
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
          failureMessage:
            "sqlStringForTransformer contextReference not found in definedContextEntries: " +
            JSON.stringify(Object.keys(definedContextEntries)),
        });
      }
      const resultAccessPath = [
        ...(useAccessPathForContextReference?(definedContextEntry.attributeResultAccessPath ?? []):[]),
        ...(actionRuntimeTransformer?.referencePath?.slice(1) ?? []), // not consistent, works only because used referencePath has only 1 element
      ];
      // const resultAccessPathString = resultAccessPath.map((e) => `"${e}"`).join(".");
      log.info(
        "sqlStringForTransformer contextReference called with",
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
      // log.info("sqlStringForTransformer contextReference",actionRuntimeTransformer.referencePath,"resultAccessPath", resultAccessPath);
      const resultAccessPathStringForTable = resultAccessPath
        .map((e, index) => `${index == 0 ? tokenNameQuote + e + tokenNameQuote : tokenStringQuote + e + tokenStringQuote}`)
        .join(tokenSeparatorForTableColumn);

      const resultAccessPathStringForJson = resultAccessPath
        .map(
          (e, index) => `${index == 0 ? tokenNameQuote + e + tokenNameQuote : tokenStringQuote + e + tokenStringQuote}`
        )
        .join(tokenSeparatorForJsonAttributeAccess);
      
      if (topLevelTransformer) {
        const result = {
          type: definedContextEntry.type,
          // SELECT ${resultAccessPathStringForJson.length>0?resultAccessPathStringForJson:"*"} AS "${referenceName}"
          sqlStringOrObject: `
SELECT ${resultAccessPathStringForJson.length>0?resultAccessPathStringForJson:"*"} AS "${referenceName}"
FROM "${referenceName}"`,
          resultAccessPath:[0, referenceName],
        }
        log.info("sqlStringForTransformer contextReference topLevelTransformer=true", JSON.stringify(result, null, 2));
        return result;
      } else { // topLevelTransformer == false
        const result = {
          type: definedContextEntry.type,
          sqlStringOrObject: definedContextEntry.type == "table" ?
          `"${referenceName}"${resultAccessPathStringForTable.length > 0 ? "." + resultAccessPathStringForTable : ""}`:
          `"${referenceName}"${resultAccessPathStringForJson.length > 0 ? tokenSeparatorForTableColumn + resultAccessPathStringForJson : ""}`,
        };
        log.info("sqlStringForTransformer contextReference topLevelTransformer=false", JSON.stringify(result, null, 2));
        return result;
      }
      break;
    }
    case "objectEntries": {
      const applyTo = sqlStringForApplyTo(
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
      const applyTo = sqlStringForApplyTo(
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
      const referenceQuery = sqlStringForApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        useAccessPathForContextReference,
        topLevelTransformer,
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
      const referenceQuery = sqlStringForApplyTo(
        actionRuntimeTransformer,
        preparedStatementParametersCount,
        queryParams,
        definedContextEntries,
        useAccessPathForContextReference,
        topLevelTransformer,
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
    queryParamsWithClauses.map((q) => {
      const notMapResultAccessPath = q.convertedParam.resultAccessPath?.find((e) => typeof e == "object");
      if (notMapResultAccessPath) {
        throw new Error("sqlStringForQuery queryParamsWithClauses convertedParam not string or number: " + JSON.stringify(notMapResultAccessPath, null, 2));
      }
      return [
        q.name,
        {
          type: q.convertedParam.type,
          attributeResultAccessPath: (q.convertedParam.resultAccessPath as any)?.slice(1), // because resultAccessPath returns the path viewed from the end user, for which the result is always an array
        },
      ];})
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
  if (cleanTransformerRawQueries.length > 0) {
    queryParts.push(
      cleanTransformerRawQueries
        .flatMap((transformerRawQuery) =>
          typeof transformerRawQuery[1] == "string"
            ? '"' + transformerRawQuery[0] + '" AS (\n' + transformerRawQuery[1] + " )"
            : (transformerRawQuery[1].extraWith
                ? transformerRawQuery[1].extraWith
                    .map((extra: any) => '"' + extra.name + '" AS (\n' + extra.sql + " )")
                    .join(tokenSeparatorForWithRtn) +
                  tokenSeparatorForWithRtn
                : "") +
              '"' +
              transformerRawQuery[0] +
              '" AS (\n' +
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

import {
  JzodElement,
  JzodObject,
  JzodSchema,
  MetaModel,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/LoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";
import { jzodTypeCheck, ResolvedJzodSchemaReturnType } from "./jzodTypeCheck";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "rootLessListKeyMap")
).then((logger: LoggerInterface) => {
  log = logger;
});

/**
 * Maps the resolved Jzod schema to value keys based on the current value.
 * This function recursively traverses the Jzod schema and current value,
 * building a map of keys to their corresponding resolved Jzod schemas.
 * IMPERATIVE IMPLEMENTATION: This function is imperative and not functional, this is ugly!!
 *
 * @param resolvedElementJzodSchema - The resolved Jzod schema for the current element.
 * @param value - The current value to be mapped.
 * @param rootLessListKey - The key for the root-less list.
 * @param result - The result map to store the resolved schemas.
 */
function mapResolveJzodSchemaToValueKeys(
  resolvedElementJzodSchema: JzodElement,
  value: any,
  rootLessListKey: string,
  result: Record<string, { resolvedElementJzodSchema: JzodElement }> = {},
): void {
  // log.info("mapResolveJzodSchemaToValueKeys called with", "resolvedElementJzodSchema", JSON.stringify(resolvedElementJzodSchema, null, 2));
  result[rootLessListKey] = {
    resolvedElementJzodSchema: resolvedElementJzodSchema,
  };
 switch (typeof value) {
   case "string":
   case "number":
   case "bigint":
   case "boolean":
   case "undefined": {
    //  result[rootLessListKey] = {
    //    resolvedElementJzodSchema: resolvedElementJzodSchema,
    //  };
     break;
   }
   case "object": {
      if (Array.isArray(value)) {
        // If the value is an array, we need to handle it differently
        // result[rootLessListKey] = {
        //   resolvedElementJzodSchema: resolvedElementJzodSchema,
        // };
        // If the schema is an array, we can also add the array items
        switch (resolvedElementJzodSchema.type) {
          case "array": {
            value.forEach((item, index) => {
              mapResolveJzodSchemaToValueKeys(
                (resolvedElementJzodSchema as any).definition,
                item,
                `${rootLessListKey.length > 0 ? rootLessListKey + "." : ""}${index}`,
                result
              );
            });
            break;
          }
          case "tuple": {
            value.forEach((item, index) => {
              mapResolveJzodSchemaToValueKeys(
                (resolvedElementJzodSchema as any).definition[index],
                item,
                `${rootLessListKey.length > 0 ? rootLessListKey + "." : ""}${index}`,
                result
              );
            });
            break;
          }
          default: {
            throw new Error(
              "mapResolveJzodSchemaToValueKeys " +
                "path '" +
                rootLessListKey +
                "' could not map resolved jzod schema to key, value is array but schema is not, for" +
                " currentValue " +
                JSON.stringify(value, null, 2) +
                " resolvedJzodSchema " +
                JSON.stringify(resolvedElementJzodSchema, null, 2)
            );
          }
        }
      } else if (value === null) {
        // Handle null values
        // result[rootLessListKey] = {
        //   resolvedElementJzodSchema: resolvedElementJzodSchema,
        // };
      } else if (resolvedElementJzodSchema.type === "object") {
        // If the value is an object, we need to iterate over its keys
        Object.keys(value).forEach((key) => {
          mapResolveJzodSchemaToValueKeys(
            resolvedElementJzodSchema.definition[key],
            value[key],
            `${rootLessListKey.length > 0? rootLessListKey + '.' : ""}${key}`,
            result
          );
        });
      } else {
        throw new Error(
          "mapResolveJzodSchemaToValueKeys " +
            "path '" +
            rootLessListKey +
            "' could not resolve jzod schema for " +
            " currentValue " +
            JSON.stringify(value, null, 2) +
            " resolvedJzodSchema " +
            JSON.stringify(resolvedElementJzodSchema, null, 2)
        );
      }
      break;
   }
   case "symbol":
   case "function":
   default: {
     throw new Error(
       "mapResolveJzodSchemaToValueKeys " +
         "path '" +
         rootLessListKey +
         "' could not resolve jzod schema for " +
         " currentValue " +
         JSON.stringify(value, null, 2) +
         " resolvedJzodSchema " +
         JSON.stringify(resolvedElementJzodSchema, null, 2)
     );
     break;
   }
 }
}

/**
 * Generates a map for a root-less list key based on the provided Jzod schema and current value.
 * This function resolves the Jzod schema for the given root-less list key and current value.
 *
 * @param rootLessListKey - The key for the root-less list.
 * @param rawJzodSchema - The raw Jzod schema to be checked against the current value.
 * @param currentModel - The current model context.
 * @param miroirMetaModel - The Miroir meta model context.
 * @param miroirFundamentalJzodSchema - The fundamental Jzod schema used for type checking.
 * @param currentValue - The current value of the Jzod element.
 * @returns A map with the root-less list key and its resolved Jzod schema.
 */
export function rootLessListKeyMap(
  rootLessListKey: string,
  rawJzodSchema: JzodElement | undefined,
  currentModel: MetaModel,
  miroirMetaModel: MetaModel,
  miroirFundamentalJzodSchema: JzodSchema,
  currentValue: any // current value of the jzod element
): Record<string, { resolvedElementJzodSchema: JzodElement }> {
  const returnedLocalResolvedElementJzodSchemaBasedOnValue:
    | ResolvedJzodSchemaReturnType
    | undefined = rawJzodSchema
    ? jzodTypeCheck(
        rawJzodSchema,
        currentValue,
        [], // currentValuePath
        [], // currentTypePath
        miroirFundamentalJzodSchema,
        currentModel,
        miroirMetaModel,
        {}
      )
    : undefined;

  if (
    !returnedLocalResolvedElementJzodSchemaBasedOnValue ||
    returnedLocalResolvedElementJzodSchemaBasedOnValue.status == "error"
  ) {
    throw new Error(
      "rootLessListKeyMap " +
        "path '" +
        rootLessListKey +
        "' could not resolve jzod schema for " +
        " currentValue " +
        JSON.stringify(currentValue, null, 2) +
        " rawJzodSchema " +
        JSON.stringify(rawJzodSchema, null, 2) +
        " returnedLocalResolvedElementJzodSchemaBasedOnValue " +
        JSON.stringify(returnedLocalResolvedElementJzodSchemaBasedOnValue, null, 2)
    );
  }
  const localResolvedElementJzodSchemaBasedOnValue: JzodElement =
    returnedLocalResolvedElementJzodSchemaBasedOnValue.resolvedSchema;

  const result: Record<string, { resolvedElementJzodSchema: JzodElement }> = {};
  mapResolveJzodSchemaToValueKeys(
    localResolvedElementJzodSchemaBasedOnValue,
    currentValue,
    rootLessListKey,
    result
  );

  // log.info("rootLessListKeyMap result", JSON.stringify(result, null, 2))
  log.info("rootLessListKeyMap result", result, "for rootLessListKey", rootLessListKey, "currentValue", currentValue);
  return result;
}

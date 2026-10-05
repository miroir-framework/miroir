// import type { ResolvedMlSchemaReturnType } from "../../0_interfaces/1_core/mlsTypeCheckInterface";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "rootLessListKeyMap");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {
  log = logger;
});

// /**
//  * Maps the resolved ML schema to value keys based on the current value.
//  * This function recursively traverses the ML schema and current value,
//  * building a map of keys to their corresponding resolved ML schemas.
//  * IMPERATIVE IMPLEMENTATION: This function is imperative and not functional, this is ugly!!
//  *
//  * @param resolvedElementMlSchema - The resolved ML schema for the current element.
//  * @param value - The current value to be mapped.
//  * @param rootLessListKey - The key for the root-less list.
//  * @param result - The result map to store the resolved schemas.
//  */
// function mapResolveMlSchemaToValueKeys(
//   resolvedElementMlSchema: MlElement,
//   value: any,
//   rootLessListKey: string,
//   result: Record<string, { resolvedElementMlSchema: MlElement }> = {}
// ): void {
//   // log.info("mapResolveMlSchemaToValueKeys called with", "resolvedElementMlSchema", JSON.stringify(resolvedElementMlSchema, null, 2));
//   result[rootLessListKey] = {
//     resolvedElementMlSchema: resolvedElementMlSchema,
//   };
//   switch (typeof value) {
//     case "string":
//     case "number":
//     case "bigint":
//     case "boolean":
//     case "undefined": {
//       //  result[rootLessListKey] = {
//       //    resolvedElementMlSchema: resolvedElementMlSchema,
//       //  };
//       break;
//     }
//     case "object": {
//       if (Array.isArray(value)) {
//         // If the value is an array, we need to handle it differently
//         // result[rootLessListKey] = {
//         //   resolvedElementMlSchema: resolvedElementMlSchema,
//         // };
//         // If the schema is an array, we can also add the array items
//         switch (resolvedElementMlSchema.type) {
//           case "array": {
//             value.forEach((item, index) => {
//               mapResolveMlSchemaToValueKeys(
//                 (resolvedElementMlSchema as any).definition,
//                 item,
//                 `${rootLessListKey.length > 0 ? rootLessListKey + "." : ""}${index}`,
//                 result
//               );
//             });
//             break;
//           }
//           case "tuple": {
//             value.forEach((item, index) => {
//               mapResolveMlSchemaToValueKeys(
//                 (resolvedElementMlSchema as any).definition[index],
//                 item,
//                 `${rootLessListKey.length > 0 ? rootLessListKey + "." : ""}${index}`,
//                 result
//               );
//             });
//             break;
//           }
//           default: {
//             throw new Error(
//               "mapResolveMlSchemaToValueKeys " +
//                 "path '" +
//                 rootLessListKey +
//                 "' could not map resolved ML schema to key, value is array but schema is not, for" +
//                 " currentValue " +
//                 JSON.stringify(value, null, 2) +
//                 " resolvedMlSchema " +
//                 JSON.stringify(resolvedElementMlSchema, null, 2)
//             );
//           }
//         }
//       } else if (value === null) {
//         // Handle null values
//         // result[rootLessListKey] = {
//         //   resolvedElementMlSchema: resolvedElementMlSchema,
//         // };
//       } else if (resolvedElementMlSchema.type === "object") {
//         // If the value is an object, we need to iterate over its keys
//         Object.keys(value).forEach((key) => {
//           mapResolveMlSchemaToValueKeys(
//             resolvedElementMlSchema.definition[key],
//             value[key],
//             `${rootLessListKey.length > 0 ? rootLessListKey + "." : ""}${key}`,
//             result
//           );
//         });
//       } else {
//         throw new Error(
//           "mapResolveMlSchemaToValueKeys " +
//             "path '" +
//             rootLessListKey +
//             "' could not resolve ML schema for object " +
//             " currentValue " +
//             JSON.stringify(value, null, 2) +
//             " resolvedMlSchema " +
//             JSON.stringify(resolvedElementMlSchema, null, 2)
//         );
//       }
//       break;
//     }
//     case "symbol":
//     case "function":
//     default: {
//       throw new Error(
//         "mapResolveMlSchemaToValueKeys " +
//           "path '" +
//           rootLessListKey +
//           "' could not resolve ML schema for default " +
//           " currentValue " +
//           JSON.stringify(value, null, 2) +
//           " resolvedMlSchema " +
//           JSON.stringify(resolvedElementMlSchema, null, 2)
//       );
//       break;
//     }
//   }
// }

// /**
//  * Generates a map for a root-less list key based on the provided ML schema and current value.
//  * This function resolves the ML schema for the given root-less list key and current value.
//  *
//  * @param rootLessListKey - The key for the root-less list.
//  * @param rawMlSchema - The raw ML schema to be checked against the current value.
//  * @param currentModel - The current model context.
//  * @param miroirMetaModel - The Miroir meta model context.
//  * @param miroirFundamentalMlSchema - The fundamental ML schema used for type checking.
//  * @param currentValue - The current value of the ML element.
//  * @returns A map with the root-less list key and its resolved ML schema.
//  */
// export function rootLessListKeyMapDEFUNCT(
//   rootLessListKey: string,
//   rawMlSchema: MlElement | undefined,
//   resolvedElementMlSchemaBasedOnValue: MlElement | undefined,
//   currentModel: MetaModel,
//   miroirMetaModel: MetaModel,
//   miroirFundamentalMlSchema: MlSchema,
//   currentValue: any // current value of the ML element
// ): Record<string, { resolvedElementMlSchema: MlElement }> {
//   let localResolvedElementMlSchemaBasedOnValue: MlElement;

//   if (!resolvedElementMlSchemaBasedOnValue) {
//     const returnedLocalResolvedElementMlSchemaBasedOnValue:
//       | ResolvedMlSchemaReturnType
//       | undefined = rawMlSchema
//       ? mlsTypeCheck(
//           rawMlSchema,
//           currentValue,
//           [], // currentValuePath
//           [], // currentTypePath
//           {
//             miroirFundamentalMlSchema,
//             currentModel,
//             miroirMetaModel,
//           },
//           {}
//         )
//       : undefined;

//     if (
//       !returnedLocalResolvedElementMlSchemaBasedOnValue ||
//       returnedLocalResolvedElementMlSchemaBasedOnValue.status == "error"
//     ) {
//       throw new Error(
//         "rootLessListKeyMapDEFUNCT " +
//           "path '" +
//           rootLessListKey +
//           "' could not mlsTypeCheck for " +
//           " currentValue " +
//           // JSON.stringify(currentValue, null, 2) +
//           JSON.stringify(currentValue, null, 2) +
//           " rawMlSchema " +
//           JSON.stringify(rawMlSchema, null, 2) +
//           " returnedLocalResolvedElementMlSchemaBasedOnValue " +
//           JSON.stringify(returnedLocalResolvedElementMlSchemaBasedOnValue, null, 2)
//       );
//     }
//     localResolvedElementMlSchemaBasedOnValue =
//       returnedLocalResolvedElementMlSchemaBasedOnValue.resolvedSchema;
//   } else {
//     localResolvedElementMlSchemaBasedOnValue = resolvedElementMlSchemaBasedOnValue;
//   }

//   // log.info(
//   //   "rootLessListKeyMapDEFUNCT found localResolvedElementMlSchemaBasedOnValue",
//   //   localResolvedElementMlSchemaBasedOnValue,
//   //   "for rootLessListKey",
//   //   rootLessListKey,
//   //   // JSON.stringify(localResolvedElementMlSchemaBasedOnValue, null, 2)
//   // );
//   const result: Record<string, { resolvedElementMlSchema: MlElement }> = {};
//   mapResolveMlSchemaToValueKeys(
//     localResolvedElementMlSchemaBasedOnValue,
//     currentValue,
//     rootLessListKey,
//     result
//   );

//   // log.info(
//   //   "rootLessListKeyMapDEFUNCT result",
//   //   result,
//   //   "for rootLessListKey",
//   //   rootLessListKey,
//   //   "currentValue",
//   //   currentValue
//   // );
//   return result;
// }

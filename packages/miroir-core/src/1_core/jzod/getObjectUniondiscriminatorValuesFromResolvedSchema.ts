import type { JzodUnionResolvedTypeForObjectReturnTypeOK } from "../../0_interfaces/1_core/jzodTypeCheckInterface";
import { JzodElement, type JzodObject, type JzodRecord } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { TransformerFailure, type TransformerReturnType } from "../../0_interfaces/2_domain/DomainElement";
import { LoggerInterface } from "../../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../../4_services/MiroirLoggerFactory";
import { packageName } from "../../constants";
import { cleanLevel } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getObjectUniondiscriminatorValuesFromResolvedSchema")
).then((logger: LoggerInterface) => {
  log = logger;
});

// Safe stringify function that prevents "Invalid string length" errors
function safeStringify(obj: any, maxLength: number = 1000): string {
  try {
    const str = JSON.stringify(obj, null, 2);
    if (str && str.length > maxLength) {
      return str.substring(0, maxLength) + "... [truncated]";
    }
    return str || "[unable to stringify]";
  } catch (error) {
    return `[stringify error: ${error instanceof Error ? error.message : 'unknown'}]`;
  }
}

// #####################################################################################################
export function getObjectUnionDiscriminatorValuesFromResolvedSchema(
  // resolvedElementJzodSchema: JzodElement | undefined, // is it needed?
  currentValuePathString: string,
  unfoldedRawSchema: JzodElement | undefined, // is it needed?
  recursivelyUnfoldedRawSchemaList: JzodElement[],
  unionObjectChoices: (JzodObject | JzodRecord)[],
  resolveUnionResult: JzodUnionResolvedTypeForObjectReturnTypeOK
): TransformerReturnType<string[][]> {
  // log.info(
  //   "getObjectUniondiscriminatorValuesFromResolvedSchema for jzodTypeCheck called with",
  //   currentValuePathString,
  //   // "resolvedElementJzodSchema:",
  //   // resolvedElementJzodSchema,
  //   "unfoldedRawSchema:",
  //   unfoldedRawSchema,
  //   "recursivelyUnfoldedRawSchemaList:",
  //   recursivelyUnfoldedRawSchemaList,
  //   "unionObjectChoices",
  //   unionObjectChoices
  // );
  const discriminator: string | string[] = (unfoldedRawSchema as any).discriminator;
  if (!discriminator) {
    throw new Error(
      "getObjectUniondiscriminatorValuesFromResolvedSchema could not find discriminator in unfoldedRawSchema: " +
        safeStringify(unfoldedRawSchema, 500) +
        ", for union " +
        safeStringify(recursivelyUnfoldedRawSchemaList, 1000)
    );
  }
  if (typeof discriminator !== "string" && !Array.isArray(discriminator)) {
    throw new Error(
      "getObjectUniondiscriminatorValuesFromResolvedSchema could not handle non string or string[] discriminator: " +
        safeStringify(discriminator, 200) +
        ", for unfoldedRawSchema " +
        safeStringify(unfoldedRawSchema, 500) +
        ", for union " +
        safeStringify(recursivelyUnfoldedRawSchemaList, 1000)
    );
  }
  if (Array.isArray(discriminator) && discriminator.length == 0) {
    throw new Error(
      "getObjectUniondiscriminatorValuesFromResolvedSchema could not handle empty array discriminator: " +
        safeStringify(discriminator, 200) +
        ", for unfoldedRawSchema " +
        safeStringify(unfoldedRawSchema, 500) +
        ", for union " +
        safeStringify(recursivelyUnfoldedRawSchemaList, 1000)
    );
  }
  if (typeof discriminator == "string") {
    const result: string[][] = [
      [
        ...new Set(
          // recursivelyUnfoldedRawSchema.result.flatMap((branch: any /** JzodObject */) => {
          recursivelyUnfoldedRawSchemaList
            .filter((branch: any /** JzodObject */) => {
              // filter branches that have a discriminator
              // return branch && branch.definition && branch.definition[discriminator];
              return branch && branch.definition;
            })
            .filter(
              (branch: any /** JzodObject */) =>
                branch && (branch.type == "object" || branch.type == "union")
            ) // keep only union branches
            .flatMap((branch: any /** JzodObject */) => {
              // return (a.definition as any)[(unfoldedRawSchema as any).discriminator].definition}
              if (!branch || !branch.definition || !branch.definition[discriminator]) {
                // ATTENTION:
                // there can be one object branch without discriminator, the one that will be chosen
                //  when the value does not include any discriminator attribute

                // throw new Error(
                //   "getObjectUniondiscriminatorValuesFromResolvedSchema found object branch without discriminator '" +
                //     discriminator +
                //     "': " +
                //     safeStringify(branch, 500) +
                //     " in recursivelyUnfoldedRawSchemaList: " +
                //     safeStringify(recursivelyUnfoldedRawSchemaList, 1000)
                // );
                return [];
              }
              switch (
                // typeof branch.definition[discriminator] == "string"
                typeof branch.definition[discriminator] == "object"
                  ? "literal"
                  : branch.definition[discriminator]?.type
              ) {
                case "literal": {
                  return branch.definition[discriminator].definition;
                  break;
                }
                case "enum": {
                  return branch.definition[discriminator].definition;
                }
                case "object":
                case "string":
                case "number":
                case "bigint":
                case "boolean":
                case "undefined":
                case "function":
                case "array":
                // case "simpleType":
                case "any":
                case "date":
                case "never":
                case "null":
                case "uuid":
                case "unknown":
                case "void":
                case "lazy":
                case "intersection":
                case "map":
                case "promise":
                case "record":
                case "schemaReference":
                case "set":
                case "tuple":
                case "union":
                default: {
                  throw new Error(
                    "getObjectUniondiscriminatorValuesFromResolvedSchema could not handle union branch object:" +
                      " string discriminator '" +
                      discriminator +
                      // " discriminator type " +
                      //   branch.definition[discriminator]?.type +
                      "', found branch discriminator " +
                      safeStringify(branch.definition[discriminator], 200) +
                      "\n for branch " +
                      safeStringify(branch, 500) +
                      "\n for union " +
                      safeStringify(recursivelyUnfoldedRawSchemaList, 1000)
                  );
                  // return [];
                  break;
                }
              }
            })
        ),
      ],
    ];
    // log.info("getObjectUniondiscriminatorValuesFromResolvedSchema found ", result);
    return result;
  }
  if (Array.isArray(discriminator)) {
    // log.info(
    //   "getObjectUniondiscriminatorValuesFromResolvedSchema processing array discriminator",
    //   discriminator,
    //   "unionObjectChoices",
    //   unionObjectChoices.length
    // );
    const result: string[][] = discriminator.map((disc: string | string[]) => {
      let effectiveDiscriminator: string = "UNKNOWN_DISCRIMINATOR";
      if (Array.isArray(disc)) {
        log.info(
          "getObjectUniondiscriminatorValuesFromResolvedSchema processing array sub-discriminator",
          currentValuePathString,
          disc,
          resolveUnionResult
        );
        effectiveDiscriminator = resolveUnionResult?.chosenDiscriminator
          ? (resolveUnionResult?.chosenDiscriminator[0] as any)?.discriminator
          : undefined;
      } else {
        effectiveDiscriminator = disc;
      }
      return [
        ...new Set(
          // recursivelyUnfoldedRawSchema.result.flatMap((branch: any /** JzodObject */) => {
          // recursivelyUnfoldedRawSchemaList
          unionObjectChoices
            .filter((branch: any /** JzodObject */, index) => {
              // filter branches that have a discriminator
              // return branch && branch.definition && branch.definition[discriminator];
              // log.info(
              //   "getObjectUniondiscriminatorValuesFromResolvedSchema filter processing",
              //   index,
              //   "disc",
              //   disc,
              //   "on branch",
              //   branch
              // );

              return branch && branch.definition;
            })
            .flatMap((branch: any /** JzodObject */, index) => {
              // if (index == 1) log.info("getObjectUniondiscriminatorValuesFromResolvedSchema flatmap processing disc", disc, "on branch", branch);
              log.info(
                "getObjectUniondiscriminatorValuesFromResolvedSchema flatmap processing",
                currentValuePathString,
                "effectiveDiscriminator",
                effectiveDiscriminator,
                "on branch with matching key",
                branch.definition[effectiveDiscriminator],
                Object.keys(branch.definition),
              );
              if (!branch || !branch.definition || !branch.definition[effectiveDiscriminator]) {
                // ATTENTION:
                // there can be one object branch without discriminator, the one that will be chosen
                //  when the value does not include any discriminator attribute

                // throw new Error(
                //   "getObjectUniondiscriminatorValuesFromResolvedSchema found object branch without discriminator '" +
                //     discriminator +
                //     "': " +
                //     safeStringify(branch, 500) +
                //     " in recursivelyUnfoldedRawSchemaList: " +
                //     safeStringify(recursivelyUnfoldedRawSchemaList, 1000)
                // );
                return [];
              }
              switch (
                // typeof branch.definition[discriminator] == "string"
                // typeof branch.definition[disc] == "object"
                //   ? "literal"
                //   : 
                  branch.definition[effectiveDiscriminator]?.type
              ) {
                case "literal": {
                  return branch.definition[effectiveDiscriminator].definition;
                  break;
                }
                case "enum": {
                  return branch.definition[effectiveDiscriminator].definition;
                }
                case "object":
                case "string":
                case "number":
                case "bigint":
                case "boolean":
                case "undefined":
                case "function":
                case "array":
                // case "simpleType":
                case "any":
                case "date":
                case "never":
                case "null":
                case "uuid":
                case "unknown":
                case "void":
                case "lazy":
                case "intersection":
                case "map":
                case "promise":
                case "record":
                case "schemaReference":
                case "set":
                case "tuple":
                case "union":
                default: {
                  return new TransformerFailure({
                    queryFailure: "FailedTransformer",
                    queryContext: {
                      currentValuePathString,
                      effectiveDiscriminator,
                      branchDiscriminator: branch.definition[effectiveDiscriminator],
                      branch,
                      recursivelyUnfoldedRawSchemaList,
                    } as any
                    // transformerPath: currentValuePathString, //: [...transformerPath, transformer.transformerType],
                    // failureOrigin: ["transformerForBuild_list_listMapperToList_apply"],
                    // queryContext:
                    //   "transformerForBuild_list_listMapperToList_apply can not apply to failed resolvedReference",
                    // innerError: resolvedApplyTo,
                  });
                  throw new Error(
                    "getObjectUniondiscriminatorValuesFromResolvedSchema could not handle union branch object:" +
                      " array discriminator " +
                      effectiveDiscriminator +
                      ", found branch discriminator " +
                      safeStringify(branch.definition[effectiveDiscriminator], 200) +
                      ", for branch " +
                      safeStringify(branch, 500) +
                      ", for union " +
                      safeStringify(recursivelyUnfoldedRawSchemaList, 1000)
                  );
                  // return [];
                  break;
                }
              }
            })
        ),
      ];
    });
    // log.info("getObjectUniondiscriminatorValuesFromResolvedSchema found ", result);
    log.info(
      "getObjectUniondiscriminatorValuesFromResolvedSchema processing array discriminator DONE on path",
      currentValuePathString,
      "for discriminator",
      discriminator,
      "unionObjectChoices",
      unionObjectChoices.length,
      "unfoldedRawSchema:",
      unfoldedRawSchema,
      // "recursivelyUnfoldedRawSchemaList:",
      // recursivelyUnfoldedRawSchemaList,
      "unionObjectChoices",
      unionObjectChoices,
      "result:", result
    );

    return result;
  }
  throw new Error(
    "getObjectUniondiscriminatorValuesFromResolvedSchema could not handle non string or string[] discriminator: " +
      safeStringify(discriminator, 200) +
      ", for unfoldedRawSchema " +
      safeStringify(unfoldedRawSchema, 500) +
      ", for union " +
      safeStringify(recursivelyUnfoldedRawSchemaList, 1000)
  );
}

import { JzodElement, LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import { packageName, cleanLevel } from "./constants";

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
export function getObjectUniondiscriminatorValuesFromResolvedSchema(
  resolvedElementJzodSchema: JzodElement | undefined, // is it needed?
  unfoldedRawSchema: JzodElement | undefined, // is it needed?
  recursivelyUnfoldedRawSchemaList: JzodElement[],
  recursivelyUnfoldedRawSchemaDiscriminator?: (string | string[]) | undefined
) {
  if (
    resolvedElementJzodSchema?.type == "object" &&
    recursivelyUnfoldedRawSchemaDiscriminator
  ) {
    const discriminator = (unfoldedRawSchema as any).discriminator;
    const result = [
      ...new Set(
        // recursivelyUnfoldedRawSchema.result.flatMap((branch: any /** JzodObject */) => {
        recursivelyUnfoldedRawSchemaList
        .filter((branch: any /** JzodObject */) => {
          // filter branches that have a discriminator
          // return branch && branch.definition && branch.definition[discriminator];
          return branch && branch.definition;
        })
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
            (typeof branch.definition[discriminator]) == "object"
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
                " discriminator " +
                  discriminator +
                // " discriminator type " +
                //   branch.definition[discriminator]?.type +
                  ", found branch discriminator " +
                  safeStringify(branch.definition[discriminator], 200) +
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
    // log.info("getObjectUniondiscriminatorValuesFromResolvedSchema found ", result);
    return result;
  } else {
    return [];
  }
}

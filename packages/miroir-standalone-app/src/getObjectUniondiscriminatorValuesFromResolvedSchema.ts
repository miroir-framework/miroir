import { JzodElement, LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import { packageName, cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "getObjectUniondiscriminatorValuesFromResolvedSchema")
).then((logger: LoggerInterface) => {
  log = logger;
});

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
            throw new Error(
              "objectUniondiscriminatorValues found object branch without discriminator '" + discriminator + "': " + 
              JSON.stringify(branch, null, 2) +
              " in recursivelyUnfoldedRawSchemaList: " + 
              JSON.stringify(recursivelyUnfoldedRawSchemaList, null, 2)
            );
            // return [];
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
                "objectUniondiscriminatorValues could not handle union branch object:" +
                " discriminator " +
                  discriminator +
                // " discriminator type " +
                //   branch.definition[discriminator]?.type +
                  ", found branch discriminator " +
                  JSON.stringify(branch.definition[discriminator]) +
                  ", for branch " +
                  JSON.stringify(branch, null, 2) +
                  ", for union " +
                  JSON.stringify(recursivelyUnfoldedRawSchemaList, null, 2)
              );
              // return [];
              break;
            }
          }
        })
      ),
    ];
    log.info("objectUniondiscriminatorValues found ", result);
    return result;
  } else {
    return [];
  }
}

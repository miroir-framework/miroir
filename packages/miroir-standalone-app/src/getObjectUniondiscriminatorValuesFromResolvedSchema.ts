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
        recursivelyUnfoldedRawSchemaList.flatMap((branch: any /** JzodObject */) => {
          // return (a.definition as any)[(unfoldedRawSchema as any).discriminator].definition}
          switch (
            typeof branch.definition[discriminator] == "string"
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
                "objectUniondiscriminatorValues could not handle union branch object: discriminator type " +
                  branch.definition[discriminator]?.type +
                  " discriminator " +
                  JSON.stringify(branch.definition[discriminator]) +
                  " for union " +
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

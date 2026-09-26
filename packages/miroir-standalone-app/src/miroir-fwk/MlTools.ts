import {
  MlElement,
  MlObject,
  MlSchema,
  MetaModel,
  MiroirLoggerFactory,
  resolveMlSchemaReference,
  type LoggerInterface
} from "miroir-core";
import { packageName, cleanLevel } from "../constants";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MlTools");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});

// #####################################################################################################
export type MlObjectRecord = { [k: string]: MlObject };
export type MlElementRecord = { [k: string]: MlElement };
export type MlEnumSchemaToMlElementResolver = (type: string, definition?: any) => MlElement;

export function getCurrentEnumMlSchemaResolver(
  currentMiroirModel: MetaModel,
  miroirFundamentalMlSchema: MlSchema,
):MlEnumSchemaToMlElementResolver  {
  return (type: string, definition?: any) => {
    log.info("getCurrentEnumMlSchemaResolver called with", type, "definition", definition);
    return (
      currentMiroirModel.entities.length == 0
        ? ({} as MlElementRecord)
        : ({
            array: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlArray",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
            simpleType: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath:
                    definition == "string"
                      ? "mlAttributeStringWithValidations"
                      : definition == "number"
                      ? "mlAttributeNumberWithValidations"
                      : definition == "date"
                      ? "mlAttributeDateWithValidations"
                      : "mlAttribute",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
            enum: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlEnum",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
            union: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlUnion",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
            record: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlRecord",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
            object: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlObject",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
            function: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlFunction",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
            lazy: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlLazy",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
            literal: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlLiteral",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
            schemaReference: resolveMlSchemaReference(
              miroirFundamentalMlSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlReference",
                },
              },
              currentMiroirModel
              // relativeReferenceMlSchema,
            ),
          } as MlElementRecord)
    )[type];
  }
}

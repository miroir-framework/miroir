import {
  MlElement,
  MlObject,
  MlSchema,
  MetaModel,
  MiroirLoggerFactory,
  resolveJzodSchemaReference,
  type LoggerInterface
} from "miroir-core";
import { packageName, cleanLevel } from "../constants";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodTools");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName).then((logger: LoggerInterface) => {log = logger});

// #####################################################################################################
export type JzodObjectRecord = { [k: string]: MlObject };
export type JzodElementRecord = { [k: string]: MlElement };
export type JzodEnumSchemaToJzodElementResolver = (type: string, definition?: any) => MlElement;

export function getCurrentEnumJzodSchemaResolver(
  currentMiroirModel: MetaModel,
  miroirFundamentalJzodSchema: MlSchema,
):JzodEnumSchemaToJzodElementResolver  {
  return (type: string, definition?: any) => {
    log.info("getCurrentEnumJzodSchemaResolver called with", type, "definition", definition);
    return (
      currentMiroirModel.entities.length == 0
        ? ({} as JzodElementRecord)
        : ({
            array: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlArray",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
            simpleType: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath:
                    definition == "string"
                      ? "jzodAttributeStringWithValidations"
                      : definition == "number"
                      ? "jzodAttributeNumberWithValidations"
                      : definition == "date"
                      ? "jzodAttributeDateWithValidations"
                      : "jzodAttribute",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
            enum: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlEnum",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
            union: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlUnion",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
            record: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlRecord",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
            object: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlObject",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
            function: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlFunction",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
            lazy: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlLazy",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
            literal: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlLiteral",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
            schemaReference: resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              {
                type: "schemaReference",
                definition: {
                  absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9",
                  relativePath: "mlReference",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
          } as JzodElementRecord)
    )[type];
  }
}

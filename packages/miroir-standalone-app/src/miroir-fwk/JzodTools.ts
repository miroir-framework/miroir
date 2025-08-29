import {
  JzodElement,
  JzodObject,
  JzodSchema,
  MetaModel,
  MiroirLoggerFactory,
  resolveJzodSchemaReference,
  type LoggerInterface
} from "miroir-core";
import { packageName, cleanLevel } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodTools")
).then((logger: LoggerInterface) => {log = logger});

// #####################################################################################################
export type JzodObjectRecord = { [k: string]: JzodObject };
export type JzodElementRecord = { [k: string]: JzodElement };
export type JzodEnumSchemaToJzodElementResolver = (type: string, definition?: any) => JzodElement;

export function getCurrentEnumJzodSchemaResolver(
  currentMiroirModel: MetaModel,
  miroirFundamentalJzodSchema: JzodSchema,
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
                  relativePath: "jzodArray",
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
                  relativePath: "jzodEnum",
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
                  relativePath: "jzodUnion",
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
                  relativePath: "jzodRecord",
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
                  relativePath: "jzodObject",
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
                  relativePath: "jzodFunction",
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
                  relativePath: "jzodLazy",
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
                  relativePath: "jzodLiteral",
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
                  relativePath: "jzodReference",
                },
              },
              currentMiroirModel
              // relativeReferenceJzodSchema,
            ),
          } as JzodElementRecord)
    )[type];
  }
}

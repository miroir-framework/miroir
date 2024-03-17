import { JzodElement, JzodObject, JzodReference } from "@miroir-framework/jzod-ts";
import { MetaModel, miroirFundamentalJzodSchema, resolveJzodSchemaReference } from "miroir-core";
import { JzodSchema } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";



// #####################################################################################################
export type JzodObjectRecord = { [k: string]: JzodObject };
export type JzodElementRecord = { [k: string]: JzodElement };
export type JzodEnumSchemaToJzodElementResolver = (type: string, definition?: any) => JzodElement;

export function getCurrentEnumJzodSchemaResolver(
  currentMiroirModel: MetaModel,
  // relativeReferenceJzodSchema: JzodObject,
// ):JzodElementRecord  {
):JzodEnumSchemaToJzodElementResolver  {
  return (type: string, definition?: any) => {
    console.log("getCurrentEnumJzodSchemaResolver called with", type, "definition", definition)
    return (currentMiroirModel.entities.length == 0
      ? ({} as JzodElementRecord)
      : {
          array: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodArray" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          simpleType: resolveJzodSchemaReference(
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
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodEnum" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          union: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodUnion" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          record: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodRecord" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          object: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodObject" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          function: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodFunction" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          lazy: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodLazy" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          literal: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodLiteral" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          schemaReference: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodReference" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
        })[type];
  }
}

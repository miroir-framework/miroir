import { JzodReference, JzodObject, JzodElement } from "@miroir-framework/jzod-ts";
import { MiroirApplicationModel } from "miroir-core";

// ################################################################################################
export function resolveJzodSchemaReference(
  jzodReference?: JzodReference,
  currentModel?: MiroirApplicationModel,
  relativeReferenceJzodContext?: JzodObject | JzodReference,
): JzodElement {
  const absoluteReferenceTargetJzodSchema: JzodObject | JzodReference | undefined = jzodReference?.definition.absolutePath
    ? {
        type: "object",
        definition:
          currentModel?.jzodSchemas.find((s) => s.uuid == jzodReference?.definition.absolutePath)?.definition.context ??
          {},
      }
    : relativeReferenceJzodContext??jzodReference;
  const targetJzodSchema = jzodReference?.definition.relativePath
    ? absoluteReferenceTargetJzodSchema?.type == "object" && absoluteReferenceTargetJzodSchema?.definition
      ? absoluteReferenceTargetJzodSchema?.definition[jzodReference?.definition.relativePath]
      : absoluteReferenceTargetJzodSchema?.type == "schemaReference" && absoluteReferenceTargetJzodSchema?.context
      ? absoluteReferenceTargetJzodSchema?.context[jzodReference?.definition.relativePath]
      : undefined
    : absoluteReferenceTargetJzodSchema;


  if (!targetJzodSchema) {
    console.error(
      "JzodElementEditor resolveJzodSchemaReference failed for jzodSchema",
      jzodReference,
      "result",
      targetJzodSchema,
      "absoluteReferenceTargetJzodSchema",
      absoluteReferenceTargetJzodSchema,
      "currentModel",
      currentModel,
      "rootJzodSchema",
      relativeReferenceJzodContext
    );
    throw new Error("resolveJzodSchemaReference could not resolve reference " + JSON.stringify(jzodReference));
  }

  return targetJzodSchema;
}


// #####################################################################################################
export type JzodObjectRecord = { [k: string]: JzodObject };
export type JzodElementRecord = { [k: string]: JzodElement };
export type JzodEnumSchemaToJzodElementResolver = (type: string, definition?: any) => JzodElement;

export function getCurrentEnumJzodSchemaResolver(
  currentMiroirModel: MiroirApplicationModel,
  // relativeReferenceJzodSchema: JzodObject,
// ):JzodElementRecord  {
):JzodEnumSchemaToJzodElementResolver  {
  return (type: string, definition?: any) =>
    (currentMiroirModel.entities.length == 0
      ? ({} as JzodElementRecord)
      : {
          array: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodArraySchema" },
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
                    ? "jzodAttributeStringWithValidationsSchema"
                    : definition == "number"
                    ? "jzodAttributeNumberWithValidationsSchema"
                    : definition == "date"
                    ? "jzodAttributeDateWithValidationsSchema"
                    : "jzodAttributeSchema",
              },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          enum: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodEnumSchema" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          union: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodUnionSchema" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          record: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodRecordSchema" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          object: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodObjectSchema" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          function: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodFunctionSchema" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          lazy: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodLazySchema" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          literal: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodLiteralSchema" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
          schemaReference: resolveJzodSchemaReference(
            {
              type: "schemaReference",
              definition: { absolutePath: "1e8dab4b-65a3-4686-922e-ce89a2d62aa9", relativePath: "jzodReferenceSchema" },
            },
            currentMiroirModel
            // relativeReferenceJzodSchema,
          ),
        })[type];
}

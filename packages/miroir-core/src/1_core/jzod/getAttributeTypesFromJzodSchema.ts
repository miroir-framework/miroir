import type { JzodElement, JzodEnumAttributeTypes } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

/**
 * Map Jzod scalar attribute types to SQL column types.
 * Lives in miroir-core so functionCall tests / UI can use it without importing
 * miroir-store-postgres (which would create a circular dependency and break the browser).
 */
export const jzodToSqlAttributeTypeMap: Record<
  JzodEnumAttributeTypes,
  { targetType: "json" | "scalar"; sqlTargetType: string }
> = {
  boolean: { targetType: "scalar", sqlTargetType: "boolean" },
  bigint: { targetType: "scalar", sqlTargetType: "double precision" },
  date: { targetType: "scalar", sqlTargetType: "date" },
  number: { targetType: "scalar", sqlTargetType: "double precision" },
  string: { targetType: "scalar", sqlTargetType: "text" },
  uuid: { targetType: "scalar", sqlTargetType: "text" },
  enum: { targetType: "scalar", sqlTargetType: "text" },
} as any; // TODO: consider all cases!

export function getAttributeTypesFromJzodSchema(jzodElement: JzodElement): Record<string, string> {
  if (!jzodElement.type) {
    throw new Error("MlSchema has no type");
  }
  if (jzodElement.type !== "object") {
    throw new Error("MlSchema type is not object");
  }
  const attributeTypes: Record<string, string> = {};
  for (const [key, value] of Object.entries(jzodElement.definition)) {
    if (!(jzodToSqlAttributeTypeMap as any)[value.type]) {
      throw new Error(`Jzod type ${value.type} not supported`);
    }
    attributeTypes[key] = (jzodToSqlAttributeTypeMap as any)[value.type].sqlTargetType;
  }
  return attributeTypes;
}

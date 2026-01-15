import { JzodElement, JzodEnumAttributeTypes } from "miroir-core";
import { PostgresDataTypes } from "./Postgres";

// TODO: refactor with getConstantSqlTypeMap?
export const jzodToPostgresTypeMap: Record<
  JzodEnumAttributeTypes,
  { targetType: "json" | "scalar"; sqlTargetType: PostgresDataTypes }
> = {
  "boolean": {
    targetType: "scalar",
    sqlTargetType: "boolean",
  },
  "bigint": {
    targetType: "scalar",
    sqlTargetType: "double precision",
  },
  "date": {
    targetType: "scalar",
    sqlTargetType: "date",
  },
  "number": {
    targetType: "scalar",
    sqlTargetType: "double precision",
  },
  "string": {
    targetType: "scalar",
    sqlTargetType: "text",
  },
  "uuid": {
    targetType: "scalar",
    sqlTargetType: "text",
  },
  "enum": {
    targetType: "scalar",
    sqlTargetType: "text",
  },
  // ...
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
    // attributeTypes[key] = value._type;
    // if (!Object.hasOwn(jzodToPostgresTypeMap,value.type)) {
    if (!(jzodToPostgresTypeMap as any)[value.type]) {
      throw new Error(`Jzod type ${value.type} not supported`);
    }
    attributeTypes[key] = (jzodToPostgresTypeMap as any)[value.type].sqlTargetType; // TODO: accomodate types
  }
  return attributeTypes;
}
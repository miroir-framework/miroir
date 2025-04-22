
export type PostgresDataTypes = "boolean" | "bigint" | "date" | "double precision" | "varchar" | "text" | "jsonb";

export const getConstantSqlTypeMap: Record<string, {targetType: "json" | "scalar",
  sqlTargetType: PostgresDataTypes,
  label: string,}> = {
  "constantUuid": {
    targetType: "scalar",
    sqlTargetType: "varchar",
    label: "constantUuid",
  },
  "constantArray": {
    targetType: "json",
    sqlTargetType: "jsonb",
    label: "constantArray",
  },
  "constantString": {
    targetType: "scalar",
    sqlTargetType: "text",
    label: "constantString",
  },
  "constantNumber": {
    targetType: "scalar",
    sqlTargetType: "double precision",
    label: "constantNumber",
  },
  "constantBigint": {
    targetType: "scalar",
    // sqlTargetType: "double precision",
    sqlTargetType: "bigint",
    label: "constantBigint",
  },
  "constantBoolean": {
    targetType: "scalar",
    sqlTargetType: "boolean",
    label: "constantBoolean",
  },
  "constantObject": {
    targetType: "json",
    sqlTargetType: "jsonb",
    label: "constantObject",
  },
};

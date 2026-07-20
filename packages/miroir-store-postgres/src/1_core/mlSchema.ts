import type { JzodEnumAttributeTypes } from "miroir-core";
import {
  getAttributeTypesFromJzodSchema,
  jzodToSqlAttributeTypeMap,
} from "miroir-core";
import type { PostgresDataTypes } from "./Postgres";

// Re-export for callers / MiroirTest functionRefs that still use this module path.
export { getAttributeTypesFromJzodSchema };

// TODO: refactor with getConstantSqlTypeMap?
export const jzodToPostgresTypeMap: Record<
  JzodEnumAttributeTypes,
  { targetType: "json" | "scalar"; sqlTargetType: PostgresDataTypes }
> = jzodToSqlAttributeTypeMap as Record<
  JzodEnumAttributeTypes,
  { targetType: "json" | "scalar"; sqlTargetType: PostgresDataTypes }
>;

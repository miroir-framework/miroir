import type { MlEnumAttributeTypes } from "@miroir-framework/core";
import {
  getAttributeTypesFromMlSchema,
  mlsToSqlAttributeTypeMap,
} from "@miroir-framework/core";
import type { PostgresDataTypes } from "./Postgres";

// Re-export for callers / MiroirTest functionRefs that still use this module path.
export { getAttributeTypesFromMlSchema };

// TODO: refactor with getConstantSqlTypeMap?
export const mlToPostgresTypeMap: Record<
  MlEnumAttributeTypes,
  { targetType: "json" | "scalar"; sqlTargetType: PostgresDataTypes }
> = mlsToSqlAttributeTypeMap as Record<
  MlEnumAttributeTypes,
  { targetType: "json" | "scalar"; sqlTargetType: PostgresDataTypes }
>;

import { JzodElement } from "miroir-core";

/**
 * A row from information_schema.columns as returned by a postgres query or CSV export.
 * Only the fields consumed by the conversion function are typed strictly; the rest are captured by the index signature.
 */
export type InformationSchemaColumn = {
  table_catalog: string;
  table_schema: string;
  table_name: string;
  column_name: string;
  /** May arrive as a string when parsed from CSV. */
  ordinal_position: string | number;
  column_default: string | null;
  /** "YES" | "NO" */
  is_nullable: string;
  data_type: string;
  character_maximum_length: string | number | null;
  udt_name: string;
  [key: string]: unknown;
};

/**
 * Maps postgres information_schema `data_type` values to Jzod attribute type names.
 *
 * Note: Several postgres types map to the same Jzod type (lossy conversion). For example,
 * both `character varying` and `text` map to `"string"`, so the reverse mapping via
 * getAttributeTypesFromJzodSchema is not a perfect round-trip.
 */
export const postgresDataTypeToJzodTypeMap: Record<string, string> = {
  "bigint": "bigint",
  "boolean": "boolean",
  "character": "string",
  "character varying": "string",
  "date": "date",
  "double precision": "number",
  "integer": "number",
  "json": "object",
  "jsonb": "object",
  "numeric": "number",
  "real": "number",
  "smallint": "number",
  "text": "string",
  "timestamp with time zone": "date",
  "timestamp without time zone": "date",
  "uuid": "uuid",
};

/**
 * Converts a list of information_schema.columns rows (e.g. from a CSV export or SQL query)
 * into a Jzod object schema suitable for use as the `mlSchema` of a Miroir EntityDefinition.
 *
 * - Columns are sorted by `ordinal_position` before processing.
 * - Nullable columns (`is_nullable === "YES"`) get `optional: true`.
 * - JSONB/JSON columns produce `{ type: "object", definition: {} }` (unstructured).
 * - Throws if a `data_type` value is not present in `postgresDataTypeToJzodTypeMap`.
 */
export function ansiColumnsToJzodSchema(
  columns: InformationSchemaColumn[]
): { type: "object"; definition: Record<string, JzodElement> } {
  const sortedColumns = [...columns].sort(
    (a, b) => Number(a.ordinal_position) - Number(b.ordinal_position)
  );

  const definition: Record<string, any> = {};

  for (const col of sortedColumns) {
    const jzodType = postgresDataTypeToJzodTypeMap[col.data_type];
    if (jzodType === undefined) {
      throw new Error(`Postgres data_type ${col.data_type} not supported`);
    }

    const tag = {
      value: {
        id: Number(col.ordinal_position),
        defaultLabel: col.column_name,
        // display: { editable: false },
      },
    };

    const fieldDef: Record<string, any> = { type: jzodType, tag };

    if (jzodType === "object") {
      fieldDef.definition = {};
    }

    if (col.is_nullable === "YES") {
      fieldDef.optional = true;
    }

    definition[col.column_name] = fieldDef;
  }

  return { type: "object", definition };
}

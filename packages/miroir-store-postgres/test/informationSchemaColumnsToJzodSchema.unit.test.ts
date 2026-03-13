// import { readFileSync } from "fs";
import * as fs from "fs";
import { join } from "path";
import {
  InformationSchemaColumn,
  informationSchemaColumnsToJzodSchema,
} from "../src/1_core/informationSchemaColumnsToJzodSchema";
import { getAttributeTypesFromJzodSchema }  from "../src/1_core/mlSchema";

// ################################################################################################
// CSV parsing helpers — file I/O is intentionally confined to the test layer.
// ################################################################################################

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++; // skip opening quote
      let field = "";
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          // escaped double-quote inside quoted field
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++; // skip closing quote
          break;
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (i < line.length && line[i] === ",") i++;
    } else {
      // unquoted field (bare NULL, numbers, etc.)
      let field = "";
      while (i < line.length && line[i] !== ",") {
        field += line[i++];
      }
      if (i < line.length && line[i] === ",") i++;
      fields.push(field);
    }
  }
  return fields;
}

function parseCSV(content: string): InformationSchemaColumn[] {
  const lines = content.trim().split("\n").map((l) => l.trimEnd()); // trimEnd handles \r\n
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, unknown> = {};
    headers.forEach((header, i) => {
      const val = values[i];
      row[header] = val === undefined || val === "NULL" ? null : val;
    });
    return row as InformationSchemaColumn;
  });
}

// ################################################################################################
// Helper to build minimal InformationSchemaColumn rows for inline test data.
// ################################################################################################

function makeColumn(
  column_name: string,
  ordinal_position: string,
  is_nullable: "YES" | "NO",
  data_type: string
): InformationSchemaColumn {
  return {
    table_catalog: "postgres",
    table_schema: "public",
    table_name: "test_table",
    column_name,
    ordinal_position,
    column_default: null,
    is_nullable,
    data_type,
    character_maximum_length: null,
    udt_name: "",
  };
}

// ################################################################################################

describe("informationSchemaColumnsToJzodSchema.unit", () => {
  // ##############################################################################################
  it("should map all supported postgres scalar and structured types", () => {
    const columns: InformationSchemaColumn[] = [
      makeColumn("id",          "1",  "NO",  "uuid"),
      makeColumn("label",       "2",  "NO",  "text"),
      makeColumn("count",       "3",  "YES", "integer"),
      makeColumn("weight",      "4",  "YES", "double precision"),
      makeColumn("is_active",   "5",  "NO",  "boolean"),
      makeColumn("score",       "6",  "YES", "numeric"),
      makeColumn("created_at",  "7",  "NO",  "timestamp with time zone"),
      makeColumn("updated_at",  "8",  "YES", "timestamp without time zone"),
      makeColumn("born_on",     "9",  "YES", "date"),
      makeColumn("hits",        "10", "YES", "bigint"),
      makeColumn("tags",        "11", "YES", "jsonb"),
      makeColumn("details",     "12", "YES", "json"),
      makeColumn("code",        "13", "YES", "smallint"),
      makeColumn("price",       "14", "YES", "real"),
      makeColumn("description", "15", "YES", "character varying"),
      makeColumn("initial",     "16", "NO",  "character"),
    ];

    const result = informationSchemaColumnsToJzodSchema(columns);

    expect(result.type).toEqual("object");

    // uuid native type
    expect(result.definition.id).toEqual({
      type: "uuid",
      tag: { value: { id: 1, defaultLabel: "id" } },
    });
    // text → string
    expect(result.definition.label).toEqual({
      type: "string",
      tag: { value: { id: 2, defaultLabel: "label" } },
    });
    // integer → number
    expect(result.definition.count).toEqual({
      type: "number",
      optional: true,
      tag: { value: { id: 3, defaultLabel: "count" } },
    });
    // double precision → number
    expect(result.definition.weight).toEqual({
      type: "number",
      optional: true,
      tag: { value: { id: 4, defaultLabel: "weight" } },
    });
    // boolean stays boolean
    expect(result.definition.is_active).toEqual({
      type: "boolean",
      tag: { value: { id: 5, defaultLabel: "is_active" } },
    });
    // numeric → number
    expect(result.definition.score).toEqual({
      type: "number",
      optional: true,
      tag: { value: { id: 6, defaultLabel: "score" } },
    });
    // timestamp with time zone → date, NOT NULL
    expect(result.definition.created_at).toEqual({
      type: "date",
      tag: { value: { id: 7, defaultLabel: "created_at" } },
    });
    // timestamp without time zone → date, nullable
    expect(result.definition.updated_at).toEqual({
      type: "date",
      optional: true,
      tag: { value: { id: 8, defaultLabel: "updated_at" } },
    });
    // date → date
    expect(result.definition.born_on).toEqual({
      type: "date",
      optional: true,
      tag: { value: { id: 9, defaultLabel: "born_on" } },
    });
    // bigint stays bigint
    expect(result.definition.hits).toEqual({
      type: "bigint",
      optional: true,
      tag: { value: { id: 10, defaultLabel: "hits" } },
    });
    // jsonb → object with empty definition (unstructured)
    expect(result.definition.tags).toEqual({
      type: "object",
      definition: {},
      optional: true,
      tag: { value: { id: 11, defaultLabel: "tags" } },
    });
    // json → object with empty definition
    expect(result.definition.details).toEqual({
      type: "object",
      definition: {},
      optional: true,
      tag: { value: { id: 12, defaultLabel: "details" } },
    });
    // smallint → number
    expect(result.definition.code).toEqual({
      type: "number",
      optional: true,
      tag: { value: { id: 13, defaultLabel: "code" } },
    });
    // real → number
    expect(result.definition.price).toEqual({
      type: "number",
      optional: true,
      tag: { value: { id: 14, defaultLabel: "price" } },
    });
    // character varying → string
    expect(result.definition.description).toEqual({
      type: "string",
      optional: true,
      tag: { value: { id: 15, defaultLabel: "description" } },
    });
    // character → string
    expect(result.definition.initial).toEqual({
      type: "string",
      tag: { value: { id: 16, defaultLabel: "initial" } },
    });
  });

  // ##############################################################################################
  it("should return an empty definition for an empty columns array", () => {
    const result = informationSchemaColumnsToJzodSchema([]);
    expect(result).toEqual({ type: "object", definition: {} });
  });

  // ##############################################################################################
  it("should throw for an unsupported postgres data_type", () => {
    const columns = [makeColumn("raw", "1", "NO", "xml")];
    expect(() => informationSchemaColumnsToJzodSchema(columns)).toThrowError(
      "Postgres data_type xml not supported"
    );
  });

  // ##############################################################################################
  it("should sort definition keys by ordinal_position regardless of input order", () => {
    const columns: InformationSchemaColumn[] = [
      makeColumn("c_col", "3", "NO", "text"),
      makeColumn("a_col", "1", "NO", "text"),
      makeColumn("b_col", "2", "NO", "integer"),
    ];
    const result = informationSchemaColumnsToJzodSchema(columns);

    expect(Object.keys(result.definition)).toEqual(["a_col", "b_col", "c_col"]);
    expect((result.definition.a_col as any).tag.value.id).toBe(1);
    expect((result.definition.b_col as any).tag.value.id).toBe(2);
    expect((result.definition.c_col as any).tag.value.id).toBe(3);
  });

  // ##############################################################################################
  it("should not set optional on NOT NULL columns", () => {
    const columns = [makeColumn("name", "1", "NO", "text")];
    const result = informationSchemaColumnsToJzodSchema(columns);
    expect((result.definition.name as any).optional).toBeUndefined();
  });

  // ##############################################################################################
  it("should set optional: true on nullable columns", () => {
    const columns = [makeColumn("description", "1", "YES", "text")];
    const result = informationSchemaColumnsToJzodSchema(columns);
    expect((result.definition.description as any).optional).toBe(true);
  });

  // ##############################################################################################
  it("should resolve tag id from ordinal_position even when passed as a string", () => {
    const columns = [makeColumn("col", "42", "NO", "integer")];
    const result = informationSchemaColumnsToJzodSchema(columns);
    expect((result.definition.col as any).tag.value.id).toBe(42);
    expect(typeof (result.definition.col as any).tag.value.id).toBe("number");
  });

  // ##############################################################################################
  it("should produce a full object schema consistent with getAttributeTypesFromJzodSchema round-trip for scalar types", () => {
    // Verify that the schema produced by our function can serve as input to the inverse function
    // (getAttributeTypesFromJzodSchema) without throwing.

    const columns: InformationSchemaColumn[] = [
      makeColumn("title",      "1", "NO",  "text"),
      makeColumn("page_count", "2", "YES", "integer"),
      makeColumn("is_active",  "3", "NO",  "boolean"),
      makeColumn("born_on",    "4", "YES", "date"),
    ];
    const schema = informationSchemaColumnsToJzodSchema(columns);
    expect(() => getAttributeTypesFromJzodSchema(schema)).not.toThrow();

    const reversed = getAttributeTypesFromJzodSchema(schema);
    expect(reversed.title).toBe("text");
    expect(reversed.page_count).toBe("double precision");
    expect(reversed.is_active).toBe("boolean");
    expect(reversed.born_on).toBe("date");
  });

  // ##############################################################################################
  it("should convert Author CSV columns to a JzodObject mlSchema", () => {
    const csv = fs.readFileSync(
      join(__dirname, "assets/information_schema-columns-Author.csv"),
      "utf-8"
    );
    const columns = parseCSV(csv);
    const result = informationSchemaColumnsToJzodSchema(columns);

    expect(result).toEqual({
      type: "object",
      definition: {
        uuid: {
          type: "string",
          tag: { value: { id: 1, defaultLabel: "uuid" } },
        },
        parentName: {
          type: "string",
          optional: true,
          tag: { value: { id: 2, defaultLabel: "parentName" } },
        },
        parentUuid: {
          type: "string",
          tag: { value: { id: 3, defaultLabel: "parentUuid" } },
        },
        conceptLevel: {
          type: "string",
          optional: true,
          tag: { value: { id: 4, defaultLabel: "conceptLevel" } },
        },
        name: {
          type: "string",
          tag: { value: { id: 5, defaultLabel: "name" } },
        },
        language: {
          type: "string",
          optional: true,
          tag: { value: { id: 6, defaultLabel: "language" } },
        },
        birthDate: {
          type: "date",
          optional: true,
          tag: { value: { id: 7, defaultLabel: "birthDate" } },
        },
        deathDate: {
          type: "date",
          optional: true,
          tag: { value: { id: 8, defaultLabel: "deathDate" } },
        },
        country: {
          type: "string",
          optional: true,
          tag: { value: { id: 9, defaultLabel: "country" } },
        },
        icon: {
          type: "string",
          optional: true,
          tag: { value: { id: 10, defaultLabel: "icon" } },
        },
        icons: {
          type: "number",
          optional: true,
          tag: { value: { id: 11, defaultLabel: "icons" } },
        },
      },
    });
  });


});

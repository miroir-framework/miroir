import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** UUID v4 — suite entity id */
const SUITE_UUID = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

const MODULE = "miroir-core/1_core/ansiColumnsToJzodSchema";
const PG_MODULE = "miroir-store-postgres/1_core/mlSchema";

function parseCSVLine(line) {
  const fields = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++;
      let field = "";
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++;
          break;
        } else {
          field += line[i++];
        }
      }
      fields.push(field);
      if (i < line.length && line[i] === ",") i++;
    } else {
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

function parseCSV(content) {
  const lines = content.trim().split("\n").map((l) => l.trimEnd());
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, i) => {
      const val = values[i];
      row[header] = val === undefined || val === "NULL" ? null : val;
    });
    return row;
  });
}

function makeColumn(column_name, ordinal_position, is_nullable, data_type) {
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

function fn(unitTestLabel, args, extra = {}) {
  return {
    unitTestType: "functionCallTest",
    unitTestLabel,
    functionRef: { module: MODULE, export: "ansiColumnsToJzodSchema" },
    arguments: args,
    ...extra,
  };
}

function pgFn(unitTestLabel, args, extra = {}) {
  return {
    unitTestType: "functionCallTest",
    unitTestLabel,
    functionRef: { module: PG_MODULE, export: "getAttributeTypesFromJzodSchema" },
    arguments: args,
    ...extra,
  };
}

function fieldAssertion(label, field, expected) {
  return { label, resultAccessPath: ["definition", field], expectedValue: expected };
}

const scalarColumns = [
  makeColumn("id", "1", "NO", "uuid"),
  makeColumn("label", "2", "NO", "text"),
  makeColumn("count", "3", "YES", "integer"),
  makeColumn("weight", "4", "YES", "double precision"),
  makeColumn("is_active", "5", "NO", "boolean"),
  makeColumn("score", "6", "YES", "numeric"),
  makeColumn("created_at", "7", "NO", "timestamp with time zone"),
  makeColumn("updated_at", "8", "YES", "timestamp without time zone"),
  makeColumn("born_on", "9", "YES", "date"),
  makeColumn("hits", "10", "YES", "bigint"),
  makeColumn("tags", "11", "YES", "jsonb"),
  makeColumn("details", "12", "YES", "json"),
  makeColumn("code", "13", "YES", "smallint"),
  makeColumn("price", "14", "YES", "real"),
  makeColumn("description", "15", "YES", "character varying"),
  makeColumn("initial", "16", "NO", "character"),
];

const scalarAssertions = [
  { label: "root type", resultAccessPath: ["type"], expectedValue: "object" },
  fieldAssertion("id", "id", { type: "uuid", tag: { value: { id: 1, defaultLabel: "id" } } }),
  fieldAssertion("label", "label", { type: "string", tag: { value: { id: 2, defaultLabel: "label" } } }),
  fieldAssertion("count", "count", { type: "number", optional: true, tag: { value: { id: 3, defaultLabel: "count" } } }),
  fieldAssertion("weight", "weight", { type: "number", optional: true, tag: { value: { id: 4, defaultLabel: "weight" } } }),
  fieldAssertion("is_active", "is_active", { type: "boolean", tag: { value: { id: 5, defaultLabel: "is_active" } } }),
  fieldAssertion("score", "score", { type: "number", optional: true, tag: { value: { id: 6, defaultLabel: "score" } } }),
  fieldAssertion("created_at", "created_at", { type: "date", tag: { value: { id: 7, defaultLabel: "created_at" } } }),
  fieldAssertion("updated_at", "updated_at", { type: "date", optional: true, tag: { value: { id: 8, defaultLabel: "updated_at" } } }),
  fieldAssertion("born_on", "born_on", { type: "date", optional: true, tag: { value: { id: 9, defaultLabel: "born_on" } } }),
  fieldAssertion("hits", "hits", { type: "bigint", optional: true, tag: { value: { id: 10, defaultLabel: "hits" } } }),
  fieldAssertion("tags", "tags", { type: "object", definition: {}, optional: true, tag: { value: { id: 11, defaultLabel: "tags" } } }),
  fieldAssertion("details", "details", { type: "object", definition: {}, optional: true, tag: { value: { id: 12, defaultLabel: "details" } } }),
  fieldAssertion("code", "code", { type: "number", optional: true, tag: { value: { id: 13, defaultLabel: "code" } } }),
  fieldAssertion("price", "price", { type: "number", optional: true, tag: { value: { id: 14, defaultLabel: "price" } } }),
  fieldAssertion("description", "description", { type: "string", optional: true, tag: { value: { id: 15, defaultLabel: "description" } } }),
  fieldAssertion("initial", "initial", { type: "string", tag: { value: { id: 16, defaultLabel: "initial" } } }),
];

const roundTripColumns = [
  makeColumn("title", "1", "NO", "text"),
  makeColumn("page_count", "2", "YES", "integer"),
  makeColumn("is_active", "3", "NO", "boolean"),
  makeColumn("born_on", "4", "YES", "date"),
];

const roundTripSchema = {
  type: "object",
  definition: {
    title: { type: "string", tag: { value: { id: 1, defaultLabel: "title" } } },
    page_count: { type: "number", optional: true, tag: { value: { id: 2, defaultLabel: "page_count" } } },
    is_active: { type: "boolean", tag: { value: { id: 3, defaultLabel: "is_active" } } },
    born_on: { type: "date", optional: true, tag: { value: { id: 4, defaultLabel: "born_on" } } },
  },
};

const authorCsvPath = path.resolve(__dirname, "../1_core/assets/information_schema-columns-Author.csv");
const authorColumns = parseCSV(fs.readFileSync(authorCsvPath, "utf-8"));

const authorExpected = {
  type: "object",
  definition: {
    uuid: { type: "string", tag: { value: { id: 1, defaultLabel: "uuid" } } },
    parentName: { type: "string", optional: true, tag: { value: { id: 2, defaultLabel: "parentName" } } },
    parentUuid: { type: "string", tag: { value: { id: 3, defaultLabel: "parentUuid" } } },
    conceptLevel: { type: "string", optional: true, tag: { value: { id: 4, defaultLabel: "conceptLevel" } } },
    name: { type: "string", tag: { value: { id: 5, defaultLabel: "name" } } },
    language: { type: "string", optional: true, tag: { value: { id: 6, defaultLabel: "language" } } },
    birthDate: { type: "date", optional: true, tag: { value: { id: 7, defaultLabel: "birthDate" } } },
    deathDate: { type: "date", optional: true, tag: { value: { id: 8, defaultLabel: "deathDate" } } },
    country: { type: "string", optional: true, tag: { value: { id: 9, defaultLabel: "country" } } },
    icon: { type: "string", optional: true, tag: { value: { id: 10, defaultLabel: "icon" } } },
    icons: { type: "number", optional: true, tag: { value: { id: 11, defaultLabel: "icons" } } },
  },
};

const unitTests = [
  fn("should map all supported postgres scalar and structured types", [scalarColumns], {
    assertions: scalarAssertions,
  }),
  fn("should return an empty definition for an empty columns array", [[]], {
    expectedValue: { type: "object", definition: {} },
  }),
  fn("should throw for an unsupported postgres data_type", [[makeColumn("raw", "1", "NO", "xml")]], {
    expectedError: "Postgres data_type xml not supported",
  }),
  fn(
    "should sort definition keys by ordinal_position regardless of input order",
    [
      [
        makeColumn("c_col", "3", "NO", "text"),
        makeColumn("a_col", "1", "NO", "text"),
        makeColumn("b_col", "2", "NO", "integer"),
      ],
    ],
    {
      assertions: [
        fieldAssertion("a_col id", "a_col", { type: "string", tag: { value: { id: 1, defaultLabel: "a_col" } } }),
        fieldAssertion("b_col id", "b_col", { type: "number", tag: { value: { id: 2, defaultLabel: "b_col" } } }),
        fieldAssertion("c_col id", "c_col", { type: "string", tag: { value: { id: 3, defaultLabel: "c_col" } } }),
      ],
    },
  ),
  fn("should not set optional on NOT NULL columns", [[makeColumn("name", "1", "NO", "text")]], {
    assertions: [
      {
        label: "field without optional",
        resultAccessPath: ["definition", "name"],
        expectedValue: { type: "string", tag: { value: { id: 1, defaultLabel: "name" } } },
      },
    ],
  }),
  fn("should set optional: true on nullable columns", [[makeColumn("description", "1", "YES", "text")]], {
    assertions: [
      { label: "optional true", resultAccessPath: ["definition", "description", "optional"], expectedValue: true },
    ],
  }),
  fn("should resolve tag id from ordinal_position even when passed as a string", [[makeColumn("col", "42", "NO", "integer")]], {
    assertions: [
      { label: "tag id", resultAccessPath: ["definition", "col", "tag", "value", "id"], expectedValue: 42 },
    ],
  }),
  fn(
    "round-trip: ansiColumnsToJzodSchema produces schema for getAttributeTypesFromJzodSchema",
    [roundTripColumns],
    { expectedValue: roundTripSchema },
  ),
  pgFn(
    "round-trip: getAttributeTypesFromJzodSchema inverts scalar schema",
    [roundTripSchema],
    {
      expectedValue: {
        title: "text",
        page_count: "double precision",
        is_active: "boolean",
        born_on: "date",
      },
    },
  ),
  fn(
    "should convert Author CSV columns to a JzodObject mlSchema",
    [authorColumns],
    { expectedValue: authorExpected },
  ),
];

const entity = {
  uuid: SUITE_UUID,
  parentName: "UnitTest",
  parentUuid: "a1bc5288-c982-4ff3-8316-4a2400fe9323",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
  name: "ansiColumnsToJzodSchema",
  description: "Phase 5c — ansiColumnsToJzodSchema",
  definition: {
    unitTestType: "unitTestSuite",
    unitTestLabel: "ansiColumnsToJzodSchema",
    unitTests,
  },
};

const outPath = path.resolve(
  __dirname,
  `../../../miroir-test-app_deployment-miroir/assets/miroir_data/a1bc5288-c982-4ff3-8316-4a2400fe9323/${SUITE_UUID}.json`,
);
fs.writeFileSync(outPath, JSON.stringify(entity, null, 2));
console.log(`Wrote ${unitTests.length} cases to ${outPath}`);

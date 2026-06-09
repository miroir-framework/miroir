import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODULE = "miroir-core/1_core/EntityPrimaryKey";
const parentUuidValue = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const payloadParentUuidValue = "11111111-2222-3333-4444-555555555555";
const singlePkEntityDef = { idAttribute: "code" };
const compositePkEntityDef = {
  idAttribute: ["table_schema", "table_name", "column_name"],
};
const defaultPkEntityDef = {};
const UNDEF = { __miroirJsonUndefined: true };

function fn(exportName, unitTestLabel, args, expectedValue, extra = {}) {
  return {
    unitTestType: "functionCallTest",
    unitTestLabel,
    functionRef: { module: MODULE, export: exportName },
    arguments: args,
    ...(expectedValue !== undefined ? { expectedValue } : {}),
    ...extra,
  };
}

const unitTests = [
  fn(
    "resolveInstanceParentUuid",
    "returns instance.parentUuid when present",
    [
      {
        uuid: "00000000-0000-0000-0000-000000000001",
        parentUuid: parentUuidValue,
        parentName: "SomeEntity",
      },
      payloadParentUuidValue,
    ],
    parentUuidValue,
  ),
  fn(
    "resolveInstanceParentUuid",
    "falls back to payloadParentUuid when instance.parentUuid is absent",
    [{ uuid: "00000000-0000-0000-0000-000000000002" }, payloadParentUuidValue],
    payloadParentUuidValue,
  ),
  fn(
    "resolveInstanceParentUuid",
    "falls back to payloadParentUuid when instance.parentUuid is undefined",
    [
      { uuid: "00000000-0000-0000-0000-000000000003", parentUuid: UNDEF },
      payloadParentUuidValue,
    ],
    payloadParentUuidValue,
  ),
  fn(
    "resolveInstanceParentUuid",
    "returns Action2Error when both parentUuid sources are absent",
    [{ uuid: "00000000-0000-0000-0000-000000000004" }, UNDEF],
    undefined,
    { expectedAction2ErrorType: "FailedToResolveParentUuid" },
  ),
  fn(
    "resolveInstanceParentUuid",
    "returns Action2Error when both sources are empty string",
    [{ uuid: "00000000-0000-0000-0000-000000000005", parentUuid: "" }, ""],
    undefined,
    { expectedAction2ErrorType: "FailedToResolveParentUuid" },
  ),
  fn(
    "resolveInstanceParentUuid",
    "prefers instance.parentUuid over payloadParentUuid",
    [
      { uuid: "00000000-0000-0000-0000-000000000006", parentUuid: parentUuidValue },
      payloadParentUuidValue,
    ],
    parentUuidValue,
  ),
  fn(
    "resolveInstanceParentUuid",
    "works with instance cast from a plain object without parentUuid",
    [{ uuid: "00000000-0000-0000-0000-000000000007", name: "plain" }, payloadParentUuidValue],
    payloadParentUuidValue,
  ),
  fn("getEntityPrimaryKeyAttribute", "returns single string for single-attribute PK", [singlePkEntityDef], "code"),
  fn(
    "getEntityPrimaryKeyAttribute",
    "returns string[] for composite PK",
    [compositePkEntityDef],
    ["table_schema", "table_name", "column_name"],
  ),
  fn("getEntityPrimaryKeyAttribute", "returns 'uuid' when idAttribute is not set", [defaultPkEntityDef], "uuid"),
  fn("getEntityPrimaryKeyAttributes", "wraps single-attribute PK in an array", [singlePkEntityDef], ["code"]),
  fn(
    "getEntityPrimaryKeyAttributes",
    "returns array as-is for composite PK",
    [compositePkEntityDef],
    ["table_schema", "table_name", "column_name"],
  ),
  fn("entityHasCompositePrimaryKey", "detects composite PK", [compositePkEntityDef], true),
  fn("entityHasCompositePrimaryKey", "detects non-composite PK (single)", [singlePkEntityDef], false),
  fn("entityHasUuidPrimaryKey", "detects uuid PK", [defaultPkEntityDef], true),
  fn("entityHasUuidPrimaryKey", "detects non-uuid PK", [singlePkEntityDef], false),
  fn("serializeCompositeKeyValue", "single-attribute: returns plain string value", [["code"], { code: 42 }], "42"),
  fn("parseCompositeKeyValue", "single-attribute round-trip", [["code"], "42"], { code: "42" }),
  fn(
    "serializeCompositeKeyValue",
    "composite: joins with | separator",
    [
      ["table_schema", "table_name", "column_name"],
      { table_schema: "public", table_name: "users", column_name: "id" },
    ],
    "public|users|id",
  ),
  fn(
    "parseCompositeKeyValue",
    "composite round-trip",
    [["table_schema", "table_name", "column_name"], "public|users|id"],
    { table_schema: "public", table_name: "users", column_name: "id" },
  ),
  fn(
    "serializeCompositeKeyValue",
    "escapes | in values",
    [["a", "b"], { a: "val|ue", b: "normal" }],
    "val\\|ue|normal",
  ),
  fn(
    "parseCompositeKeyValue",
    "unescapes | in values",
    [["a", "b"], "val\\|ue|normal"],
    { a: "val|ue", b: "normal" },
  ),
  fn(
    "serializeCompositeKeyValue",
    "escapes backslash in values",
    [["a", "b"], { a: "val\\ue", b: "ok" }],
    "val\\\\ue|ok",
  ),
  fn(
    "parseCompositeKeyValue",
    "unescapes backslash in values",
    [["a", "b"], "val\\\\ue|ok"],
    { a: "val\\ue", b: "ok" },
  ),
  fn(
    "serializeCompositeKeyValue",
    "handles empty string values",
    [["a", "b"], { a: "", b: "x" }],
    "|x",
  ),
  fn(
    "parseCompositeKeyValue",
    "handles empty string values round-trip",
    [["a", "b"], "|x"],
    { a: "", b: "x" },
  ),
  fn("getInstancePrimaryKeyValue", "returns uuid for default PK", [defaultPkEntityDef, { uuid: "abc-123" }], "abc-123"),
  fn(
    "getInstancePrimaryKeyValue",
    "returns serialized composite key",
    [
      compositePkEntityDef,
      { table_schema: "public", table_name: "users", column_name: "id" },
    ],
    "public|users|id",
  ),
  fn(
    "getForeignKeyValue",
    "returns single attribute value for string FK",
    ["publisherUuid", { publisherUuid: "pub-123", name: "My Book" }],
    "pub-123",
  ),
  fn(
    "getForeignKeyValue",
    "returns serialized composite key for array FK",
    [
      ["fk_schema", "fk_table", "fk_col"],
      { fk_schema: "public", fk_table: "users", fk_col: "id" },
    ],
    "public|users|id",
  ),
  fn(
    "getForeignKeyValue",
    "returns undefined when any FK attribute is null/undefined (single)",
    ["missing", { other: "val" }],
    UNDEF,
  ),
  fn(
    "getForeignKeyValue",
    "returns undefined when any FK attribute is null/undefined (composite)",
    [["fk_schema", "fk_table", "fk_col"], { fk_schema: "public", fk_col: "id" }],
    UNDEF,
  ),
  fn(
    "instanceMatchesForeignKey",
    "matches single attribute FK (true)",
    ["publisherUuid", { publisherUuid: "pub-123", name: "Book" }, "pub-123"],
    true,
  ),
  fn(
    "instanceMatchesForeignKey",
    "matches single attribute FK (false)",
    ["publisherUuid", { publisherUuid: "pub-123", name: "Book" }, "pub-999"],
    false,
  ),
  fn(
    "instanceMatchesForeignKey",
    "matches composite FK (true)",
    [
      ["fk_schema", "fk_table", "fk_col"],
      { fk_schema: "public", fk_table: "users", fk_col: "id", name: "col" },
      "public|users|id",
    ],
    true,
  ),
  fn(
    "instanceMatchesForeignKey",
    "matches composite FK (false)",
    [
      ["fk_schema", "fk_table", "fk_col"],
      { fk_schema: "public", fk_table: "users", fk_col: "id", name: "col" },
      "public|users|name",
    ],
    false,
  ),
];

const entity = {
  uuid: "b5c6d7e8-f9a0-4b12-c345-d6e7f8a9b0c1",
  parentName: "UnitTest",
  parentUuid: "a1bc5288-c982-4ff3-8316-4a2400fe9323",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
  name: "EntityPrimaryKey",
  description: "Phase 5c — EntityPrimaryKey helpers",
  definition: {
    unitTestType: "unitTestSuite",
    unitTestLabel: "EntityPrimaryKey",
    unitTests,
  },
};

const outPath = path.resolve(
  __dirname,
  "../../../miroir-test-app_deployment-miroir/assets/miroir_data/a1bc5288-c982-4ff3-8316-4a2400fe9323/b5c6d7e8-f9a0-4b12-c345-d6e7f8a9b0c1.json",
);
fs.writeFileSync(outPath, JSON.stringify(entity, null, 2));
console.log(`Wrote ${unitTests.length} cases to ${outPath}`);

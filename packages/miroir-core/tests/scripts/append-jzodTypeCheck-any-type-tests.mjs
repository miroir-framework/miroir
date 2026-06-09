import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ENTITY_PATH = path.resolve(
  __dirname,
  "../../../miroir-test-app_deployment-miroir/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/f8e3c7a1-2b9d-4e6f-8c2a-5d7b9e4f1a8c.json",
);

function anyPassTest(label, description, valueObject, resolvedSchema) {
  return {
    transformerTestType: "transformerTest",
    transformerTestLabel: label,
    transformerTestDescription: description,
    transformerName: "jzodTypeCheck",
    runTestStep: "build",
    subExpectedValue: [
      ["status", "ok"],
      ["rawSchema", { type: "any" }],
      ["resolvedSchema", resolvedSchema],
    ],
    transformer: {
      transformerType: "jzodTypeCheck",
      interpolation: "build",
      mlSchema: { type: "any" },
      valueObject,
      currentValuePath: [],
      currentTypePath: [],
      relativeReferenceJzodContext: {},
    },
    expectedValue: {
      status: "ok",
      valuePath: [],
      typePath: [],
      rawSchema: { type: "any" },
      resolvedSchema,
      keyMap: {
        "": {
          rawSchema: { type: "any" },
          resolvedSchema,
          valuePath: [],
          typePath: [],
        },
      },
    },
  };
}

const newTests = [
  anyPassTest(
    "test180_any_null",
    "Checks that null against an any schema resolves to a null schema",
    null,
    { type: "null" },
  ),
  anyPassTest(
    "test181_any_boolean",
    "Checks that a boolean value against an any schema resolves to a boolean schema",
    false,
    { type: "boolean" },
  ),
  anyPassTest(
    "test182_any_empty_object",
    "Checks that an empty object against an any schema resolves to an empty object schema",
    {},
    { type: "object", definition: {} },
  ),
];

const entity = JSON.parse(fs.readFileSync(ENTITY_PATH, "utf-8"));
const existing = new Set(entity.definition.transformerTests.map((t) => t.transformerTestLabel));
const toAdd = newTests.filter((t) => !existing.has(t.transformerTestLabel));

const failIndex = entity.definition.transformerTests.findIndex((t) => t.transformerTestLabel === "test010");
const insertAt = failIndex >= 0 ? failIndex : entity.definition.transformerTests.length;
entity.definition.transformerTests.splice(insertAt, 0, ...toAdd);

fs.writeFileSync(ENTITY_PATH, JSON.stringify(entity, null, 2));
console.log(`Inserted ${toAdd.length} any-type tests at index ${insertAt} (${entity.definition.transformerTests.length} total)`);

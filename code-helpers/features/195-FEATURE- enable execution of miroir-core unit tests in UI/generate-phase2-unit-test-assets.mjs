#!/usr/bin/env node
/**
 * Generates Phase 2 UnitTest deployment JSON assets for mustache + jzodToJsonSchema pilots.
 * Run: node code-helpers/features/195-FEATURE- enable execution of miroir-core unit tests in UI/generate-phase2-unit-test-assets.mjs
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(
  __dirname,
  "../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/a1bc5288-c982-4ff3-8316-4a2400fe9323",
);

const ENTITY_UNIT_TEST = "a1bc5288-c982-4ff3-8316-4a2400fe9323";
const SELF_APP = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const BRANCH = "ad1ddc4e-556e-4598-9cff-706a2bde0be7";

function fnTest(label, args, expectedValue, expectedError) {
  const test = {
    unitTestType: "functionCallTest",
    unitTestLabel: label,
    functionRef: {
      module: "miroir-core/1_core/mustache",
      export: "extractDoubleBracePatterns",
    },
    arguments: args,
  };
  if (expectedValue !== undefined) test.expectedValue = expectedValue;
  if (expectedError !== undefined) test.expectedError = expectedError;
  return test;
}

const mustacheSuite = {
  uuid: "47b25668-b679-4ce7-9da3-1928bd3f723e",
  parentName: "UnitTest",
  parentUuid: ENTITY_UNIT_TEST,
  name: "mustache_extractDoubleBracePatterns",
  selfApplication: SELF_APP,
  branch: BRANCH,
  description: "Phase 2 pilot — extractDoubleBracePatterns functionCallTest suite",
  definition: {
    unitTestType: "unitTestSuite",
    unitTestLabel: "mustache.extractDoubleBracePatterns",
    unitTests: [
      fnTest("should extract patterns with double braces", ["Hello {{ name }}!"], [
        { content: "name", start: 6, end: 15 },
      ]),
      fnTest("should extract patterns with name sequences", ["Hello {{ user.name }}!"], [
        { content: "user.name", start: 6, end: 20 },
      ]),
      fnTest("should handle multiple patterns", ["Hello {{ name }}! Your age is {{ age }}."], [
        { content: "name", start: 6, end: 15 },
        { content: "age", start: 30, end: 38 },
      ]),
      fnTest("should handle patterns with extra spaces", ["Hello {{  name  }}!"], [
        { content: "name", start: 6, end: 17 },
      ]),
      fnTest("should return an empty array if no patterns are found", ["Hello world!"], []),
      fnTest("should throw an error for empty patterns", ["Hello {{  }}!"], undefined, "Empty pattern found"),
    ],
  },
};

function jzodTest(label, args, expectedValue) {
  return {
    unitTestType: "functionCallTest",
    unitTestLabel: label,
    functionRef: {
      module: "miroir-core/1_core/jzod/JzodToJsonSchema",
      export: "jzodToJsonSchema",
    },
    arguments: args,
    expectedValue,
  };
}

const jzodSuite = {
  uuid: "856426e9-85ce-4c40-a607-01029de24c1f",
  parentName: "UnitTest",
  parentUuid: ENTITY_UNIT_TEST,
  name: "jzodToJsonSchema",
  selfApplication: SELF_APP,
  branch: BRANCH,
  description: "Phase 2 pilot — jzodToJsonSchema functionCallTest suite",
  definition: {
    unitTestType: "unitTestSuite",
    unitTestLabel: "jzodToJsonSchema",
    unitTests: [
      jzodTest("converts string type", [{ type: "string" }], { type: "string" }),
      jzodTest("converts number type", [{ type: "number" }], { type: "number" }),
      jzodTest("converts boolean type", [{ type: "boolean" }], { type: "boolean" }),
      jzodTest("converts any type to empty schema", [{ type: "any" }], {}),
      jzodTest("converts uuid type to string", [{ type: "uuid" }], { type: "string" }),
      jzodTest("includes description when present", [{ type: "string", description: "A name" }], {
        type: "string",
        description: "A name",
      }),
      jzodTest("converts literal type to JSON Schema const", [{ type: "literal", definition: "active" }], {
        const: "active",
      }),
      jzodTest("converts enum type to JSON Schema enum array", [
        { type: "enum", definition: ["draft", "active", "archived"] },
      ], { enum: ["draft", "active", "archived"] }),
      jzodTest("converts array type to JSON Schema array with items", [
        { type: "array", definition: { type: "string" } },
      ], { type: "array", items: { type: "string" } }),
      jzodTest("converts nested array type", [
        { type: "array", definition: { type: "array", definition: { type: "number" } } },
      ], { type: "array", items: { type: "array", items: { type: "number" } } }),
      jzodTest("converts object type with all required fields", [
        {
          type: "object",
          definition: {
            name: { type: "string" },
            age: { type: "number" },
          },
        },
      ], {
        type: "object",
        properties: { name: { type: "string" }, age: { type: "number" } },
        required: ["name", "age"],
        additionalProperties: false,
      }),
      jzodTest("excludes optional fields from required array", [
        {
          type: "object",
          definition: {
            name: { type: "string" },
            description: { type: "string", optional: true },
          },
        },
      ], {
        type: "object",
        properties: { name: { type: "string" }, description: { type: "string" } },
        required: ["name"],
        additionalProperties: false,
      }),
      jzodTest("omits required when all fields are optional", [
        {
          type: "object",
          definition: { foo: { type: "string", optional: true } },
        },
      ], {
        type: "object",
        properties: { foo: { type: "string" } },
        additionalProperties: false,
      }),
      jzodTest("converts union type to anyOf", [
        { type: "union", definition: [{ type: "string" }, { type: "number" }] },
      ], { anyOf: [{ type: "string" }, { type: "number" }] }),
      jzodTest("resolves schemaReference from outer context", [
        { type: "schemaReference", definition: { relativePath: "myString" } },
        { myString: { type: "string" } },
      ], { type: "string" }),
      jzodTest("resolves schemaReference from inline context on the element", [
        {
          type: "schemaReference",
          context: {
            address: {
              type: "object",
              definition: { street: { type: "string" }, city: { type: "string" } },
            },
          },
          definition: { relativePath: "address" },
        },
      ], {
        type: "object",
        properties: { street: { type: "string" }, city: { type: "string" } },
        required: ["street", "city"],
        additionalProperties: false,
      }),
      jzodTest("falls back to $ref for unresolvable schemaReference", [
        { type: "schemaReference", definition: { relativePath: "unknown" } },
      ], { $ref: "#/$defs/unknown" }),
      jzodTest("converts record type to object with additionalProperties", [
        { type: "record", definition: { type: "number" } },
      ], { type: "object", additionalProperties: { type: "number" } }),
    ],
  },
};

for (const suite of [mustacheSuite, jzodSuite]) {
  const path = join(dataDir, `${suite.uuid}.json`);
  writeFileSync(path, JSON.stringify(suite, null, 2) + "\n");
  console.log("Wrote", path);
}

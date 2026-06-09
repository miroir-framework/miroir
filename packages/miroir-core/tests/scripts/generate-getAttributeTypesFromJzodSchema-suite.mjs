import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODULE = "miroir-store-postgres/1_core/mlSchema";

function fn(unitTestLabel, args, expectedValue, extra = {}) {
  return {
    unitTestType: "functionCallTest",
    unitTestLabel,
    functionRef: { module: MODULE, export: "getAttributeTypesFromJzodSchema" },
    arguments: args,
    ...(expectedValue !== undefined ? { expectedValue } : {}),
    ...extra,
  };
}

const unitTests = [
  fn(
    "should throw an error when jzodElement has no type",
    [{ definition: {} }],
    undefined,
    { expectedError: "MlSchema has no type" },
  ),
  fn(
    "should throw an error when jzodElement type is not object",
    [{ type: "string", definition: {} }],
    undefined,
    { expectedError: "MlSchema type is not object" },
  ),
  fn(
    "should throw an error for unsupported attribute type",
    [
      {
        type: "object",
        definition: {
          field: { type: "unsupported" },
        },
      },
    ],
    undefined,
    { expectedError: "Jzod type unsupported not supported" },
  ),
  fn(
    "should return attribute types for valid jzodElement",
    [
      {
        type: "object",
        definition: {
          age: { type: "number" },
          name: { type: "string" },
          isActive: { type: "boolean" },
        },
      },
    ],
    {
      age: "double precision",
      name: "text",
      isActive: "boolean",
    },
  ),
];

const entity = {
  uuid: "66f402a1-c69c-46b1-8633-b610673b9877",
  parentName: "UnitTest",
  parentUuid: "a1bc5288-c982-4ff3-8316-4a2400fe9323",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
  name: "getAttributeTypesFromJzodSchema",
  description: "Phase 5c — getAttributeTypesFromJzodSchema (miroir-store-postgres)",
  definition: {
    unitTestType: "unitTestSuite",
    unitTestLabel: "getAttributeTypesFromJzodSchema",
    unitTests,
  },
};

const outPath = path.resolve(
  __dirname,
  "../../../miroir-test-app_deployment-miroir/assets/miroir_data/a1bc5288-c982-4ff3-8316-4a2400fe9323/66f402a1-c69c-46b1-8633-b610673b9877.json",
);
fs.writeFileSync(outPath, JSON.stringify(entity, null, 2));
console.log(`Wrote ${unitTests.length} cases to ${outPath}`);

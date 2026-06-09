import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODULE = "miroir-core/1_core/jzod/jzodObjectFlatten";
const ENV = {
  environmentRef: "defaultMiroirModelEnvironment",
  environmentArgumentIndex: 1,
};

function fn(unitTestLabel, args, expectedValue, extra = {}) {
  return {
    unitTestType: "functionCallTest",
    unitTestLabel,
    functionRef: { module: MODULE, export: "jzodObjectFlatten" },
    arguments: args,
    ...ENV,
    ...(expectedValue !== undefined ? { expectedValue } : {}),
    ...extra,
  };
}

const unitTests = [
  fn(
    "returns the same object if there is no extend",
    [
      {
        type: "object",
        definition: { foo: { type: "string" } },
      },
    ],
    {
      type: "object",
      definition: { foo: { type: "string" } },
    },
  ),
  fn(
    "flattens a single-level extend",
    [
      {
        type: "object",
        extend: {
          type: "object",
          definition: {
            a: { type: "string" },
            b: { type: "number" },
          },
        },
        definition: {
          b: { type: "boolean" },
          c: { type: "bigint" },
        },
      },
    ],
    {
      type: "object",
      definition: {
        a: { type: "string" },
        b: { type: "boolean" },
        c: { type: "bigint" },
      },
    },
  ),
  fn(
    "flattens multi-level extends",
    [
      {
        type: "object",
        extend: {
          type: "object",
          extend: {
            type: "object",
            definition: { a: { type: "string" } },
          },
          definition: { b: { type: "number" } },
        },
        definition: { c: { type: "boolean" } },
      },
    ],
    {
      type: "object",
      definition: {
        a: { type: "string" },
        b: { type: "number" },
        c: { type: "boolean" },
      },
    },
  ),
  fn(
    "flattens with array of extends",
    [
      {
        type: "object",
        extend: [
          {
            type: "object",
            definition: { a: { type: "string" } },
          },
          {
            type: "object",
            definition: { b: { type: "number" } },
          },
        ],
        definition: { c: { type: "boolean" } },
      },
    ],
    {
      type: "object",
      definition: {
        a: { type: "string" },
        b: { type: "number" },
        c: { type: "boolean" },
      },
    },
  ),
  fn(
    "resolves schemaReferences and flatten recursively",
    [
      {
        type: "object",
        extend: [
          {
            type: "object",
            definition: { a: { type: "string" } },
          },
          {
            type: "schemaReference",
            definition: { relativePath: "SomeRef" },
          },
        ],
        definition: { b: { type: "string" } },
      },
      {
        SomeRef: {
          type: "object",
          definition: { a: { type: "number" } },
        },
      },
    ],
    {
      type: "object",
      definition: {
        a: { type: "number" },
        b: { type: "string" },
      },
    },
  ),
  fn(
    "copies optional, nullable, and tag properties",
    [
      {
        type: "object",
        extend: {
          type: "object",
          definition: { a: { type: "string" } },
        },
        definition: { b: { type: "number" } },
        optional: true,
        nullable: true,
        tag: {},
      },
    ],
    {
      type: "object",
      definition: {
        a: { type: "string" },
        b: { type: "number" },
      },
      optional: true,
      nullable: true,
      tag: {},
    },
  ),
  fn(
    "resolves reference chains (reference -> reference -> object)",
    [
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: { relativePath: "IntermediateRef" },
        },
        definition: { myProp: { type: "number" } },
      },
      {
        FinalObject: {
          type: "object",
          definition: { finalProp: { type: "string" } },
        },
        IntermediateRef: {
          type: "schemaReference",
          definition: { relativePath: "FinalObject" },
        },
      },
    ],
    {
      type: "object",
      definition: {
        finalProp: { type: "string" },
        myProp: { type: "number" },
      },
    },
  ),
  fn(
    "detects circular references and throws an error",
    [
      {
        type: "object",
        extend: {
          type: "schemaReference",
          definition: { relativePath: "Ref2" },
        },
        definition: { myProp: { type: "string" } },
      },
      {
        Ref1: {
          type: "schemaReference",
          definition: { relativePath: "Ref2" },
        },
        Ref2: {
          type: "schemaReference",
          definition: { relativePath: "Ref1" },
        },
      },
    ],
    undefined,
    { expectedError: "Circular reference detected" },
  ),
];

const entity = {
  uuid: "912863b2-08d6-4e57-9bdd-9c35b1948403",
  parentName: "UnitTest",
  parentUuid: "a1bc5288-c982-4ff3-8316-4a2400fe9323",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  branch: "ad1ddc4e-556e-4598-9cff-706a2bde0be7",
  name: "jzodObjectFlatten",
  description: "Phase 5c — jzodObjectFlatten",
  definition: {
    unitTestType: "unitTestSuite",
    unitTestLabel: "jzod.jzodObjectFlatten",
    unitTests,
  },
};

const outPath = path.resolve(
  __dirname,
  "../../../miroir-test-app_deployment-miroir/assets/miroir_data/a1bc5288-c982-4ff3-8316-4a2400fe9323/912863b2-08d6-4e57-9bdd-9c35b1948403.json",
);
fs.writeFileSync(outPath, JSON.stringify(entity, null, 2));
console.log(`Wrote ${unitTests.length} cases to ${outPath}`);

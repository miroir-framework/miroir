import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FAIL_SOURCE = path.resolve(__dirname, "jzodTypeCheck-fail-cases.source.ts");
const ENTITY_PATH = path.resolve(
  __dirname,
  "../../../miroir-test-app_deployment-miroir/assets/miroir_data/681be9ca-c593-45f5-b45a-5f1d4969e91e/f8e3c7a1-2b9d-4e6f-8c2a-5d7b9e4f1a8c.json",
);

function extractFailCasesObjectLiteral(source) {
  const marker = "const tests: { [k: string]: testFormat } = ";
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error("Could not find tests object in jzod.typeCheckToFail.unit.test.ts");
  }
  let i = start + marker.length;
  while (source[i] !== "{") i++;
  let depth = 0;
  const begin = i;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return source.slice(begin, i + 1).replace(/ as any/g, "");
      }
    }
  }
  throw new Error("Unbalanced braces in tests object");
}

function loadFailCases() {
  const source = fs.readFileSync(FAIL_SOURCE, "utf-8");
  const literal = extractFailCasesObjectLiteral(source);
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${literal});`)();
}

const JSON_NULL_SENTINEL = "__miroirJsonNull";

function serializeDeploymentJsonValue(value) {
  if (value === null) {
    return JSON_NULL_SENTINEL;
  }
  if (Array.isArray(value)) {
    return value.map(serializeDeploymentJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, serializeDeploymentJsonValue(entry)]),
    );
  }
  return value;
}

function failCaseToTransformerTest(testId, { testSchema, testValueObject, expectedResult }) {
  const subExpectedValue = [["status", "error"]];
  if (expectedResult?.error) {
    subExpectedValue.push(["error", expectedResult.error]);
  }

  return {
    transformerTestType: "transformerTest",
    transformerTestLabel: testId,
    transformerTestDescription: `jzodTypeCheck fail case ${testId}`,
    transformerName: "jzodTypeCheck",
    runTestStep: "build",
    subExpectedValue,
    transformer: {
      transformerType: "jzodTypeCheck",
      interpolation: "build",
      mlSchema: testSchema,
      valueObject: serializeDeploymentJsonValue(testValueObject),
      currentValuePath: [],
      currentTypePath: [],
      relativeReferenceJzodContext: {},
    },
    expectedValue: expectedResult,
  };
}

const failCases = loadFailCases();
const entity = JSON.parse(fs.readFileSync(ENTITY_PATH, "utf-8"));
const existingLabels = new Set(
  entity.definition.transformerTests.map((t) => t.transformerTestLabel),
);

const newTests = Object.entries(failCases)
  .map(([testId, params]) => failCaseToTransformerTest(testId, params))
  .filter((t) => !existingLabels.has(t.transformerTestLabel));

entity.definition.transformerTests.push(...newTests);
fs.writeFileSync(ENTITY_PATH, JSON.stringify(entity, null, 2));

console.log(
  `Merged ${newTests.length} fail cases into ${ENTITY_PATH} (${entity.definition.transformerTests.length} total tests)`,
);

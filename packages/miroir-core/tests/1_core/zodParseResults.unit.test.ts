/**
 * Parse results of the real deployment assets, and the deepest-issue report of a few invalid ones. Written before the
 * zod 4 migration (#375): paths are compared, not issue codes or messages, which change between zod versions.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { ZodTypeAny } from "zod";

import {
  endpointDefinition,
  entity,
  query,
  report,
  transformerDefinition,
  type ZodParseError,
} from "../../src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { zodErrorDeepestIssueLeaves } from "../../src/1_core/mls/zodParseErrorHandler";

const packagesDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** The JSON instances of an Entity, in every deployment package. */
function assetInstances(entityUuid: string): { file: string; value: any }[] {
  const result: { file: string; value: any }[] = [];
  for (const pkg of readdirSync(packagesDir)) {
    const assetsDir = join(packagesDir, pkg, "assets");
    if (!existsSync(assetsDir)) continue;
    for (const section of readdirSync(assetsDir)) {
      const instancesDir = join(assetsDir, section, entityUuid);
      if (!existsSync(instancesDir)) continue;
      for (const file of readdirSync(instancesDir).filter((f) => f.endsWith(".json")).sort()) {
        result.push({ file: `${pkg}/${section}/${file}`, value: JSON.parse(readFileSync(join(instancesDir, file), "utf8")) });
      }
    }
  }
  return result;
}

const concepts: { name: string; entityUuid: string; schema: ZodTypeAny }[] = [
  { name: "Entity", entityUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad", schema: entity },
  { name: "Query", entityUuid: "e4320b9e-ab45-4abe-85d8-359604b3c62f", schema: query },
  { name: "Report", entityUuid: "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916", schema: report },
  { name: "TransformerDefinition", entityUuid: "a557419d-a288-4fb8-8a1e-971c86c113b8", schema: transformerDefinition },
  { name: "Endpoint", entityUuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c", schema: endpointDefinition },
];

function failingFiles(schema: ZodTypeAny, instances: { file: string; value: any }[]): string[] {
  return instances.filter((instance) => !schema.safeParse(instance.value).success).map((instance) => instance.file);
}

function deepestPaths(schema: ZodTypeAny, value: unknown): string[] {
  const result = schema.safeParse(value);
  expect(result.success).toBe(false);
  const paths = zodErrorDeepestIssueLeaves(result.error as unknown as ZodParseError).issues.map((issue) =>
    issue.path.join(".")
  );
  return [...new Set(paths)].sort();
}

describe("zodParseResults", () => {
  describe("deployment assets parse with the generated schemas", () => {
    it.each(concepts)("$name instances", ({ name, entityUuid, schema }) => {
      const instances = assetInstances(entityUuid);
      expect(instances.length).toBeGreaterThan(0);
      expect(failingFiles(schema, instances)).toEqual(EXPECTED_FAILING_ASSETS[name] ?? []);
    });
  });

  describe("invalid elements report their deepest issues", () => {
    const aReport = () =>
      structuredClone(assetInstances("3f2baa83-3ef7-45ce-82ea-6a43f7a8c916").find((r) => r.value.definition?.section)!.value);
    const aTransformerDefinition = () =>
      structuredClone(assetInstances("a557419d-a288-4fb8-8a1e-971c86c113b8")[0].value);

    it("a Report with a wrong attribute type", () => {
      const value = { ...aReport(), defaultLabel: 42 };
      expect(deepestPaths(report, value)).toEqual(["defaultLabel"]);
    });

    it("a Report with an unknown section type", () => {
      const value = aReport();
      value.definition.section = { type: "unknownSection" };
      expect(deepestPaths(report, value)).toEqual(EXPECTED_REPORT_SECTION_PATHS);
    });

    it("a TransformerDefinition with an unknown implementation type", () => {
      const value = aTransformerDefinition();
      value.transformerImplementation = { transformerImplementationType: "unknownImplementation" };
      expect(deepestPaths(transformerDefinition, value)).toEqual(EXPECTED_TRANSFORMER_IMPLEMENTATION_PATHS);
    });
  });
});

// Recorded on zod 3.25.76 (Slice 0): assets that already fail their generated schema.
const EXPECTED_FAILING_ASSETS: Record<string, string[]> = {
  Entity: [
    "miroir-app-miroir/miroir_model/bdcf956a-771d-40a1-a878-06e0bf6efd3e.json",
    "miroir-example-postgres/postgres_model/39e5c7a1-3f82-4bda-b8c4-2d576f9f10ae.json",
  ],
  Query: [
    "miroir-app-miroir/miroir_data/b1a8b33b-ba28-4bf0-a173-5bdaaeac3d90.json",
    "miroir-app-miroir/miroir_data/e8c15587-af5d-4c08-b5b7-22f959447690.json",
    "miroir-app-miroir/miroir_data/ff7ceeef-361b-4e81-b168-23f8d3ec56e5.json",
    "miroir-example-github/github_model/ae2b3612-b960-43f1-9e7a-17ef61ef725b.json",
    "miroir-example-library/library_model/14d6a920-9d86-4038-8d15-3f96e3337e59.json",
    "miroir-example-library/library_model/6176dcdf-39a6-4805-8dc5-3c2366a31a11.json",
    "miroir-example-library/library_model/6eaaec37-e3bc-40e4-af1b-4088412c0e34.json",
    "miroir-example-library/library_model/6ff19a7b-fdfc-4bf8-8026-a34447a5a073.json",
    "miroir-example-postgres/postgres_model/fa6f0eb4-609f-4f47-8bfb-6f558a0c86ec.json",
    "miroir-example-spotify/spotify_model/371aed0c-05bb-4b77-8cf1-2c82407555c1.json",
  ],
  Report: [
    "miroir-example-postgres/postgres_model/7c80d9ec-35b2-4cb8-8164-c5fe4e20687f.json",
    "miroir-example-postgres/postgres_model/a72bb361-3126-4aa1-85cc-0be4d6838c84.json",
  ],
  TransformerDefinition: ["miroir-app-miroir/miroir_data/e44300e8-ed02-40fb-a9ee-d83d08cb1f25.json"],
};
const EXPECTED_REPORT_SECTION_PATHS = ["definition.section.definition", "definition.section.type"];
const EXPECTED_TRANSFORMER_IMPLEMENTATION_PATHS = [
  "transformerImplementation.definition",
  "transformerImplementation.inMemoryImplementationFunctionName",
  "transformerImplementation.transformerImplementationType",
];

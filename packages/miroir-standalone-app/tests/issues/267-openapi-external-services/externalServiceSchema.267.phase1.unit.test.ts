import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import {
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  getEndpointActions,
  getExternalService,
  type EndpointDefinition,
} from "miroir-core";
import { entityDefinitionEndpoint } from "miroir-test-app_deployment-miroir";

import { resolveRepoRoot } from "../../helpers/integrationTestProfiles.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "externalServiceSchema.267.phase1" ||
  RUN_TEST === "externalServiceSchema.267.phase1.unit.test";

const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
const MIROIR_SELF_APPLICATION_UUID = "360fcf1f-f0d4-4f8a-9262-07886e70fa15";
const REPO_ROOT = resolveRepoRoot();

const MIROIR_DATA_ENDPOINT_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-miroir/assets/miroir_data",
  ENDPOINT_ENTITY_UUID,
);
const LIBRARY_MODEL_ENDPOINT_DIR = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-library/assets/library_model",
  ENDPOINT_ENTITY_UUID,
);

function jsonFilesIn(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort();
}

function endpointAssetPaths(): string[] {
  return [
    ...jsonFilesIn(MIROIR_DATA_ENDPOINT_DIR).map((name) =>
      relative(REPO_ROOT, join(MIROIR_DATA_ENDPOINT_DIR, name)).replaceAll("\\", "/"),
    ),
    ...jsonFilesIn(LIBRARY_MODEL_ENDPOINT_DIR).map((name) =>
      relative(REPO_ROOT, join(LIBRARY_MODEL_ENDPOINT_DIR, name)).replaceAll("\\", "/"),
    ),
  ].sort();
}

function readEndpointAsset(relativePath: string): EndpointDefinition {
  return JSON.parse(readFileSync(join(REPO_ROOT, relativePath), "utf8")) as EndpointDefinition;
}

const EXTERNAL_SERVICE = {
  openApiDocument: '{"openapi":"3.0.0","info":{"title":"Fake","version":"1.0.0"},"paths":{}}',
  baseUrl: "https://example.test",
  securityScheme: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  },
  credentialKey: "fakeSpotify",
  enabledOperations: [],
  operations: [],
};

function externalServiceEndpointInstance(): EndpointDefinition {
  return {
    uuid: "0e5cb172-12ea-4467-8598-5889338ae454",
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: MIROIR_SELF_APPLICATION_UUID,
    name: "FakeExternalService",
    version: "1",
    description: "Slice 1 schema fixture — externalService branch",
    definition: {
      externalService: EXTERNAL_SERVICE,
    },
  } as EndpointDefinition;
}

function bothKeysEndpointInstance(): Record<string, unknown> {
  return {
    uuid: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
    parentName: "Endpoint",
    parentUuid: ENDPOINT_ENTITY_UUID,
    application: MIROIR_SELF_APPLICATION_UUID,
    name: "BothKeysEndpoint",
    version: "1",
    definition: {
      actions: [],
      externalService: EXTERNAL_SERVICE,
    },
  };
}

describe.skipIf(!shouldRun)("externalService #267 phase1 — Endpoint definition key-union", () => {
  it("validates an Endpoint whose definition is the externalService branch", () => {
    const check = checkModelValidationInstance(
      entityDefinitionEndpoint.mlSchema,
      externalServiceEndpointInstance(),
      "synthetic-externalService-endpoint",
      defaultMiroirModelEnvironment,
    );
    expect(check.status, `${check.label}: ${String(check.innermostError)}`).toBe("ok");
  });

  it("rejects an Endpoint whose definition has both actions and externalService (XOR)", () => {
    // Jzod objects compile to z.object(...).strict() unless nonStrict is set
    // (jzod JzodToZod.ts). An untagged z.union of two strict objects therefore
    // rejects both-keys without an extra refinement.
    const check = checkModelValidationInstance(
      entityDefinitionEndpoint.mlSchema,
      bothKeysEndpointInstance(),
      "synthetic-both-keys-endpoint",
      defaultMiroirModelEnvironment,
    );
    expect(check.status).toBe("error");
    expect(check.innermostError).toBeTruthy();
  });

  it("still validates all 13 existing endpoint source assets (actions branch, no migration)", () => {
    expect(existsSync(MIROIR_DATA_ENDPOINT_DIR)).toBe(true);
    expect(existsSync(LIBRARY_MODEL_ENDPOINT_DIR)).toBe(true);
    expect(endpointAssetPaths()).toHaveLength(13);

    const endpointSchema = entityDefinitionEndpoint.mlSchema;
    for (const relativePath of endpointAssetPaths()) {
      const instance = readEndpointAsset(relativePath);
      const check = checkModelValidationInstance(
        endpointSchema,
        instance,
        relativePath,
        defaultMiroirModelEnvironment,
      );
      expect(check.status, `${check.label}: ${String(check.innermostError)}`).toBe("ok");
    }
  });

  it("getEndpointActions / getExternalService narrow the union; listTools skips via the actions guard", () => {
    // Deviation: EndpointToolRegistry.listTools needs a live DomainController +
    // local cache. This unit test asserts the guard pair that listTools uses
    // (`getEndpointActions` undefined → skip, no throw).
    const external = externalServiceEndpointInstance();
    expect(getExternalService(external)).toEqual(EXTERNAL_SERVICE);
    expect(getEndpointActions(external)).toBeUndefined();

    const bothKeys = bothKeysEndpointInstance() as EndpointDefinition;
    expect(getEndpointActions(bothKeys)).toBeUndefined();
    expect(getExternalService(bothKeys)).toBeUndefined();

    for (const relativePath of endpointAssetPaths()) {
      const instance = readEndpointAsset(relativePath);
      const actions = getEndpointActions(instance);
      expect(actions, relativePath).toBeDefined();
      expect(Array.isArray(actions), relativePath).toBe(true);
      expect(getExternalService(instance), relativePath).toBeUndefined();
    }
  });
});

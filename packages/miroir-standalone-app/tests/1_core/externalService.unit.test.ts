import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import {
  Action2Error,
  checkModelValidationInstance,
  defaultMiroirModelEnvironment,
  DomainController,
  type EndpointDefinition,
} from "miroir-core";
import {
  defaultMiroirMetaModel,
  deploymentEndpointV1,
  entityDefinitionEndpoint,
  instanceEndpointV1,
  instanceEndpointVersionV1,
  storeManagementEndpoint,
} from "miroir-test-app_deployment-miroir";

import { reportPageParamsFromSearchParams } from "../../src/miroir-fwk/4_view/PageDispatcher.js";
import { resolveRepoRoot } from "../helpers/integrationTestProfiles.js";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "externalService" ||
  RUN_TEST === "externalService.unit.test";

const ENDPOINT_ENTITY_UUID = "3d8da4d4-8f76-4bb4-9212-14869d81c00c";
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

describe.skipIf(!shouldRun)("externalService — current contracts", () => {
  it("lists 13 endpoint source assets under miroir_data and library_model", () => {
    expect(existsSync(MIROIR_DATA_ENDPOINT_DIR)).toBe(true);
    expect(existsSync(LIBRARY_MODEL_ENDPOINT_DIR)).toBe(true);

    const paths = endpointAssetPaths();
    expect(paths).toHaveLength(13);
    expect(jsonFilesIn(MIROIR_DATA_ENDPOINT_DIR)).toHaveLength(11);
    expect(jsonFilesIn(LIBRARY_MODEL_ENDPOINT_DIR)).toHaveLength(2);
  });

  it("validates all 13 endpoint source assets against the current Endpoint Jzod schema", () => {
    const endpointSchema = entityDefinitionEndpoint.mlSchema;
    expect(endpointSchema).toBeTruthy();

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

  it("defaultMiroirMetaModel.endpoints has 12 registrations over 10 unique uuids with alias pairs", () => {
    const registrations = defaultMiroirMetaModel.endpoints;
    expect(registrations).toHaveLength(12);

    const uniqueUuids = new Set(registrations.map((endpoint) => endpoint.uuid));
    expect(uniqueUuids.size).toBe(10);

    expect(deploymentEndpointV1.uuid).toBe(storeManagementEndpoint.uuid);
    expect(deploymentEndpointV1.uuid).toBe("bbd08cbb-79ff-4539-b91f-7a14f15ac55f");

    expect(instanceEndpointV1.uuid).toBe(instanceEndpointVersionV1.uuid);
    expect(instanceEndpointV1.uuid).toBe("ed520de4-55a9-4550-ac50-b1b713b72a89");

    const bbd08cbbCount = registrations.filter(
      (endpoint) => endpoint.uuid === "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
    ).length;
    const ed520de4Count = registrations.filter(
      (endpoint) => endpoint.uuid === "ed520de4-55a9-4550-ac50-b1b713b72a89",
    ).length;
    expect(bbd08cbbCount).toBe(2);
    expect(ed520de4Count).toBe(2);
  });

  it("handleApplicationAction rejects libraryImplementation with not supported yet", async () => {
    const endpointUuid = "00000000-0000-4000-8000-000000000099";
    const actionType = "testLibraryAction";
    const modelEnv = {
      ...defaultMiroirModelEnvironment,
      endpointsByUuid: {
        [endpointUuid]: {
          uuid: endpointUuid,
          definition: {
            actions: [
              {
                actionParameters: {
                  actionType: { type: "literal", definition: actionType },
                },
                actionImplementation: {
                  actionImplementationType: "libraryImplementation",
                  definition: {},
                },
              },
            ],
          },
        } as EndpointDefinition,
      },
    };

    const controller = new DomainController("local", {} as any, {} as any, {} as any);
    const result = await (controller as any).handleApplicationAction(
      { endpoint: endpointUuid, actionType },
      {},
      modelEnv,
    );

    expect(result).toBeInstanceOf(Action2Error);
    expect((result as Action2Error).errorMessage).toContain("not supported yet");
    expect((result as Action2Error).errorMessage).toContain("libraryImplementation");
  });

  it("reportPageParamsFromSearchParams forwards unknown search params such as playlistId", () => {
    const searchParams = new URLSearchParams(
      "page=report&application=app&deploymentUuid=dep&applicationSection=data&reportUuid=rep&playlistId=abc",
    );
    const params = reportPageParamsFromSearchParams(searchParams);
    expect(params).toEqual({
      application: "app",
      deploymentUuid: "dep",
      applicationSection: "data",
      reportUuid: "rep",
      instanceUuid: undefined,
      playlistId: "abc",
    });
  });
});

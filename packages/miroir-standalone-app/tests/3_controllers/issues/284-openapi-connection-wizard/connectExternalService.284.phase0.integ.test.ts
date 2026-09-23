// @vitest-environment node
/**
 * Issue #284 Slice 0 — characterize current contracts (stable + pre-change inventory).
 *
 * Run:
 * ```bash
 * RUN_TEST=connectExternalService.284.phase0 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase0
 * ```
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  allowInsecureBaseUrlsForTests,
  clearAllowedInsecureBaseUrlsForTests,
  clearSecrets,
  defaultMiroirModelEnvironment,
  DomainController,
  executeExternalServiceOperation,
  registerSecrets,
  type EndpointDefinition,
} from "miroir-core";

import { allGatedStepsAllowFinish } from "../../../../src/miroir-fwk/4_view/components/Reports/MultistepReportHost.js";
import { resolveRepoRoot } from "../../../helpers/integrationTestProfiles.js";
import {
  startFakeExternalServiceServer,
  type FakeExternalServiceServer,
} from "../../../utils/fakeExternalServiceServer.js";

const RUN_TEST = process.env.RUN_TEST;

const shouldRunPhase0Stable =
  !RUN_TEST ||
  RUN_TEST === "connectExternalService.284.phase0" ||
  RUN_TEST === "phase0 stable";

const SPOTIFY_ENDPOINT_SHA256 =
  "b40a7a61f9a45587342caaf1a46cd07a8cf3d9319c94535f9426f1513a511d02";

const REPO_ROOT = resolveRepoRoot();

const SPOTIFY_ENDPOINT_PATH = join(
  REPO_ROOT,
  "packages/miroir-test-app_deployment-spotify/assets/spotify_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0e5cb172-12ea-4467-8598-5889338ae454.json",
);

const PHASE0_BEARER_CREDENTIAL_KEY = "phase0Bearer";
const PHASE0_BEARER_TOKEN = "phase0-bearer-token";
const PHASE0_GET_PATH = "/phase0-resource";

function phase0HttpBearerEndpoint(baseUrl: string): EndpointDefinition {
  return {
    uuid: "00000000-0000-4000-8000-000000002840",
    parentName: "Endpoint",
    parentUuid: "3d8da4d4-8f76-4bb4-9212-14869d81c00c",
    application: "00000000-0000-4000-8000-000000000001",
    name: "Phase0HttpBearer",
    version: "1",
    definition: {
      externalService: {
        openApiDocument:
          '{"openapi":"3.0.0","info":{"title":"Phase0Bearer","version":"1.0.0"},"paths":{}}',
        baseUrl,
        securityScheme: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        credentialKey: PHASE0_BEARER_CREDENTIAL_KEY,
        enabledOperations: ["phase0-get"],
        operations: [
          {
            operationId: "phase0-get",
            method: "GET",
            path: PHASE0_GET_PATH,
            parameterMappings: [],
            responseSchema: {
              type: "object",
              definition: {
                ok: { type: "boolean" },
              },
            },
          },
        ],
      },
    },
  } as EndpointDefinition;
}

describe.skipIf(!shouldRunPhase0Stable)("phase0 stable", () => {
  it("Spotify endpoint 0e5cb172 keeps oauth2AuthorizationCode and file bytes lock", () => {
    const raw = readFileSync(SPOTIFY_ENDPOINT_PATH);
    const parsed = JSON.parse(raw.toString("utf8")) as {
      definition: { externalService: { securityScheme: { type: string } } };
    };
    expect(parsed.definition.externalService.securityScheme.type).toBe("oauth2AuthorizationCode");
    expect(createHash("sha256").update(raw).digest("hex")).toBe(SPOTIFY_ENDPOINT_SHA256);
  });

  it("allGatedStepsAllowFinish rejects when only the first of two inputReportSection steps is filled", () => {
    const nameSchema = {
      type: "object" as const,
      definition: {
        name: { type: "string" as const },
      },
    };
    const stepOne = {
      type: "inputReportSection" as const,
      definition: {
        inputPrefix: "stepOne",
        inputMLSchema: nameSchema,
      },
    };
    const stepTwo = {
      type: "inputReportSection" as const,
      definition: {
        inputPrefix: "stepTwo",
        inputMLSchema: nameSchema,
      },
    };
    const steps = [stepOne, stepTwo];
    expect(
      allGatedStepsAllowFinish(
        steps,
        { stepOne: { name: "First" } },
        defaultMiroirModelEnvironment,
        true,
      ),
    ).toBe(false);
    expect(
      allGatedStepsAllowFinish(
        steps,
        { stepOne: { name: "First" }, stepTwo: { name: "Second" } },
        defaultMiroirModelEnvironment,
        true,
      ),
    ).toBe(true);
  });

  describe("executeExternalServiceOperation bearer characterization", () => {
    let fakeServer: FakeExternalServiceServer;

    beforeAll(async () => {
      fakeServer = await startFakeExternalServiceServer();
      fakeServer.setFixture("GET", PHASE0_GET_PATH, { body: { ok: true } });
      registerSecrets({ [PHASE0_BEARER_CREDENTIAL_KEY]: PHASE0_BEARER_TOKEN });
      allowInsecureBaseUrlsForTests([fakeServer.baseUrl]);
    });

    afterAll(async () => {
      clearSecrets();
      clearAllowedInsecureBaseUrlsForTests();
      await fakeServer.close();
    });

    it("sends Authorization Bearer from credentialKey with http scheme and no User-Agent", async () => {
      const endpoint = phase0HttpBearerEndpoint(fakeServer.baseUrl);
      const result = await executeExternalServiceOperation(endpoint, "phase0-get", {});
      expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);

      const apiRequests = fakeServer.receivedRequests.filter(
        (request) => request.method === "GET" && request.path === PHASE0_GET_PATH,
      );
      expect(apiRequests).toHaveLength(1);
      const recorded = apiRequests[0]!;
      expect(recorded.headers.authorization).toBe(`Bearer ${PHASE0_BEARER_TOKEN}`);
      // The client does not set User-Agent. Node's fetch still sends its own.
      expect(recorded.headers["user-agent"]).toBe("node");
    });
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
});

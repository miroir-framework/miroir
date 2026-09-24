// @vitest-environment node
/**
 * Issue #284 Slice 2 — failed probe restores process secrets; name clash writes nothing.
 *
 * Run:
 * ```bash
 * RUN_TEST=connectExternalService.284.phase2 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase2
 * ```
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  allowInsecureBaseUrlsForTests,
  clearAllowedInsecureBaseUrlsForTests,
  clearSecrets,
  ENTITY_MIROIR_SECRET_UUID,
  registerSecrets,
  resolveSecret,
  type EndpointDefinition,
  type EntityInstance,
} from "miroir-core";

import {
  ADMIN_APPLICATION_UUID,
  bootConnectExternalService284Harness,
  DOMAIN_ENDPOINT,
  ENDPOINT_ENTITY_UUID,
  FIXTURE_APPLICATION_UUID,
  type ConnectExternalService284Harness,
} from "./connectExternalService.284.harness.js";

const RUN_TEST = process.env.RUN_TEST;

const shouldRunPhase2 =
  !RUN_TEST ||
  RUN_TEST === "connectExternalService.284.phase2" ||
  RUN_TEST === "connectExternalService.284";

const ENDPOINT_NAME = "discogsPublic";
const CLASH_ENDPOINT_NAME = "discogsClashName";
const PROBE_OPERATION_ID = "getRelease";
const USER_AGENT = "MiroirTest/284";
const RELEASE_PATH = "/releases/{id}";
const INSTANCE_ENDPOINT = "ed520de4-55a9-4550-ac50-b1b713b72a89";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";

/** Client 401 text from ExternalServiceClient.messageForHttpStatus */
const HTTP_401_MESSAGE_SUBSTRING =
  "External service returned HTTP 401. Token may have expired; restart the server with a fresh token.";

const CLASH_FOREIGN_UUID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function openApiDocumentText(): string {
  return JSON.stringify({
    openapi: "3.0.0",
    info: { title: "DiscogsPublicFixture", version: "1.0.0" },
    paths: {
      [RELEASE_PATH]: {
        get: {
          operationId: PROBE_OPERATION_ID,
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "ok",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                    },
                    required: ["id", "name"],
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

function publicBag(overrides?: {
  endpointName?: string;
  processSecrets?: Record<string, string>;
  baseUrl?: string;
  openApiDocument?: string;
}): Record<string, unknown> {
  return {
    application: FIXTURE_APPLICATION_UUID,
    endpointName: overrides?.endpointName ?? ENDPOINT_NAME,
    openApiDocument: overrides?.openApiDocument ?? openApiDocumentText(),
    baseUrl: overrides?.baseUrl,
    userAgent: USER_AGENT,
    authenticated: false,
    checkedOperationIds: [PROBE_OPERATION_ID],
    probeOperationId: PROBE_OPERATION_ID,
    probeParameters: { id: "1" },
    ...(overrides?.processSecrets ? { processSecrets: overrides.processSecrets } : {}),
  };
}

describe.skipIf(!shouldRunPhase2).sequential(
  "connectExternalService.284.phase2 — failed probe and name clash",
  () => {
    let harness: ConnectExternalService284Harness;
    let openApiDocument: string;
    let secretCountBefore: number;

    beforeAll(async () => {
      openApiDocument = openApiDocumentText();
      harness = await bootConnectExternalService284Harness({
        fixtures: {
          [`GET /releases/1`]: { status: 401, body: { error: "unauthorized" } },
        },
      });
      allowInsecureBaseUrlsForTests([harness.fakeServer.baseUrl]);
      secretCountBefore = await countMiroirSecretRows();
    }, 120000);

    afterEach(() => {
      harness.fakeServer.onRequest = undefined;
      harness.fakeServer.receivedRequests.length = 0;
      clearSecrets();
    });

    afterAll(async () => {
      clearAllowedInsecureBaseUrlsForTests();
      clearSecrets();
      if (harness?.fakeServer) {
        await harness.fakeServer.close();
      }
    });

    async function countMiroirSecretRows(): Promise<number> {
      const queryResult = await harness.domainController.handleBoxedExtractorOrQueryAction(
        {
          actionType: "runBoxedQueryAction",
          endpoint: QUERY_ENDPOINT,
          payload: {
            application: ADMIN_APPLICATION_UUID,
            applicationSection: "data",
            queryExecutionStrategy: "storage",
            query: {
              application: ADMIN_APPLICATION_UUID,
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              extractors: {
                secrets: {
                  extractorOrCombinerType: "extractorInstancesByEntity",
                  parentUuid: ENTITY_MIROIR_SECRET_UUID,
                },
              },
            },
          },
        } as any,
        harness.applicationDeploymentMap,
        harness.libraryModelEnvironment,
      );
      expect(
        queryResult instanceof Action2Error,
        `secret query failed: ${JSON.stringify(queryResult)}`,
      ).toBe(false);
      const element = (queryResult as { returnedDomainElement?: { secrets?: unknown } })
        .returnedDomainElement?.secrets;
      if (Array.isArray(element)) {
        return element.length;
      }
      if (element && typeof element === "object") {
        return Object.keys(element as object).length;
      }
      return 0;
    }

    async function runConnect(bag: Record<string, unknown>) {
      return harness.domainController.handleAction(
        {
          actionType: "connectExternalService",
          endpoint: DOMAIN_ENDPOINT,
          payload: { ...bag, baseUrl: bag.baseUrl ?? harness.fakeServer.baseUrl, openApiDocument },
        } as any,
        harness.applicationDeploymentMap,
        harness.libraryModelEnvironment,
      );
    }

    it("401 probe returns client HTTP message and writes nothing", async () => {
      const result = await runConnect(publicBag());

      expect(result instanceof Action2Error).toBe(true);
      const err = result as Action2Error;
      expect(err.errorMessage ?? "").toContain(HTTP_401_MESSAGE_SUBSTRING);

      const model = harness.domainController.currentModel(
        FIXTURE_APPLICATION_UUID,
        harness.applicationDeploymentMap,
      );
      expect(model.endpoints.find((row) => row.name === ENDPOINT_NAME)).toBeUndefined();
      expect(model.reports.find((row) => row.name === `${ENDPOINT_NAME}_${PROBE_OPERATION_ID}`)).toBeUndefined();
      expect(await countMiroirSecretRows()).toBe(secretCountBefore);
    });

    it("restores existing process secret after 401 (in-flight was temporary new)", async () => {
      registerSecrets({ discogsToken: "old" });
      expect(resolveSecret("discogsToken").value).toBe("old");

      let inFlightValue: string | undefined;
      harness.fakeServer.onRequest = () => {
        inFlightValue = resolveSecret("discogsToken").value;
      };

      const result = await runConnect(
        publicBag({ processSecrets: { discogsToken: "new" } }),
      );

      expect(result instanceof Action2Error).toBe(true);
      expect((result as Action2Error).errorMessage ?? "").toContain(HTTP_401_MESSAGE_SUBSTRING);
      expect(inFlightValue, "probe must run with temporarily registered processSecrets").toBe(
        "new",
      );
      expect(resolveSecret("discogsToken").value).toBe("old");

      const model = harness.domainController.currentModel(
        FIXTURE_APPLICATION_UUID,
        harness.applicationDeploymentMap,
      );
      expect(model.endpoints.find((row) => row.name === ENDPOINT_NAME)).toBeUndefined();
      expect(model.reports.find((row) => row.name === `${ENDPOINT_NAME}_${PROBE_OPERATION_ID}`)).toBeUndefined();
      expect(await countMiroirSecretRows()).toBe(secretCountBefore);
    });

    it("unregisters fresh process secret after 401", async () => {
      expect(() => resolveSecret("discogsFresh")).toThrow();

      let inFlightValue: string | undefined;
      harness.fakeServer.onRequest = () => {
        try {
          inFlightValue = resolveSecret("discogsFresh").value;
        } catch {
          inFlightValue = undefined;
        }
      };

      const result = await runConnect(
        publicBag({ processSecrets: { discogsFresh: "new" } }),
      );

      expect(result instanceof Action2Error).toBe(true);
      expect((result as Action2Error).errorMessage ?? "").toContain(HTTP_401_MESSAGE_SUBSTRING);
      expect(inFlightValue).toBe("new");
      expect(() => resolveSecret("discogsFresh")).toThrow();

      const model = harness.domainController.currentModel(
        FIXTURE_APPLICATION_UUID,
        harness.applicationDeploymentMap,
      );
      expect(model.endpoints.find((row) => row.name === ENDPOINT_NAME)).toBeUndefined();
      expect(await countMiroirSecretRows()).toBe(secretCountBefore);
    });

    it("name clash refuses before register and writes nothing", async () => {
      const seedEndpoint: EndpointDefinition = {
        uuid: CLASH_FOREIGN_UUID,
        parentName: "Endpoint",
        parentUuid: ENDPOINT_ENTITY_UUID,
        application: FIXTURE_APPLICATION_UUID,
        name: CLASH_ENDPOINT_NAME,
        version: "1",
        definition: {
          externalService: {
            openApiDocument,
            baseUrl: harness.fakeServer.baseUrl,
            securityScheme: { type: "none" },
            enabledOperations: [PROBE_OPERATION_ID],
            operations: [
              {
                operationId: PROBE_OPERATION_ID,
                method: "GET",
                path: RELEASE_PATH,
                parameterMappings: [{ name: "id", in: "path", required: true }],
                responseSchema: {
                  type: "object",
                  definition: {
                    id: { type: "string" },
                    name: { type: "string" },
                  },
                },
              },
            ],
          },
        },
      } as EndpointDefinition;

      const seedResult = await harness.domainController.handleAction(
        {
          actionType: "createInstance",
          endpoint: INSTANCE_ENDPOINT,
          payload: {
            application: FIXTURE_APPLICATION_UUID,
            applicationSection: "model",
            objects: [seedEndpoint as EntityInstance],
          },
        } as any,
        harness.applicationDeploymentMap,
        harness.libraryModelEnvironment,
      );
      expect(seedResult instanceof Action2Error, JSON.stringify(seedResult)).toBe(false);

      registerSecrets({ clashProbeSecret: "old" });
      expect(resolveSecret("clashProbeSecret").value).toBe("old");

      let onRequestFired = false;
      harness.fakeServer.onRequest = () => {
        onRequestFired = true;
        expect(resolveSecret("clashProbeSecret").value).toBe("old");
      };

      const endpointsBefore = harness.domainController
        .currentModel(FIXTURE_APPLICATION_UUID, harness.applicationDeploymentMap)
        .endpoints.filter((row) => row.name === CLASH_ENDPOINT_NAME).length;

      const result = await runConnect(
        publicBag({
          endpointName: CLASH_ENDPOINT_NAME,
          processSecrets: { clashProbeSecret: "new" },
        }),
      );

      expect(result instanceof Action2Error).toBe(true);
      expect((result as Action2Error).errorMessage ?? "").toContain(CLASH_ENDPOINT_NAME);
      expect(onRequestFired).toBe(false);
      expect(resolveSecret("clashProbeSecret").value).toBe("old");

      const model = harness.domainController.currentModel(
        FIXTURE_APPLICATION_UUID,
        harness.applicationDeploymentMap,
      );
      const named = model.endpoints.filter((row) => row.name === CLASH_ENDPOINT_NAME);
      expect(named).toHaveLength(endpointsBefore);
      expect(named.every((row) => row.uuid === CLASH_FOREIGN_UUID)).toBe(true);
      expect(await countMiroirSecretRows()).toBe(secretCountBefore);
    });
  },
);

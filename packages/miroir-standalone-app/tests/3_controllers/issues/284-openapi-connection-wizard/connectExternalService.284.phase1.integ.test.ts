// @vitest-environment node
/**
 * Issue #284 Slice 1 — tracer: public Finish writes endpoint + model report (no Entity).
 *
 * Run:
 * ```bash
 * RUN_TEST=connectExternalService.284.phase1 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase1
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  Action2Error,
  allowInsecureBaseUrlsForTests,
  clearAllowedInsecureBaseUrlsForTests,
  getExternalService,
} from "miroir-core";

import {
  bootConnectExternalService284Harness,
  DOMAIN_ENDPOINT,
  FIXTURE_APPLICATION_UUID,
  type ConnectExternalService284Harness,
} from "./connectExternalService.284.harness.js";

const RUN_TEST = process.env.RUN_TEST;

const shouldRunPhase1 =
  !RUN_TEST ||
  RUN_TEST === "connectExternalService.284.phase1" ||
  RUN_TEST === "connectExternalService.284";

const ENDPOINT_NAME = "discogsPublic";
const PROBE_OPERATION_ID = "getRelease";
const USER_AGENT = "MiroirTest/284";
const RELEASE_PATH = "/releases/{id}";
const ONE_OF_PROPERTY = "formatDetails";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
                      [ONE_OF_PROPERTY]: {
                        oneOf: [
                          { type: "string" },
                          {
                            type: "object",
                            properties: { code: { type: "string" } },
                          },
                        ],
                      },
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

describe.skipIf(!shouldRunPhase1).sequential("connectExternalService.284.phase1 — public Finish", () => {
  let harness: ConnectExternalService284Harness;
  let openApiDocument: string;
  let entityCountBefore: number;

  beforeAll(async () => {
    openApiDocument = openApiDocumentText();
    harness = await bootConnectExternalService284Harness({
      fixtures: {
        [`GET /releases/1`]: { body: { id: "1", name: "x" } },
      },
    });
    allowInsecureBaseUrlsForTests([harness.fakeServer.baseUrl]);
    const modelBefore = harness.domainController.currentModel(
      FIXTURE_APPLICATION_UUID,
      harness.applicationDeploymentMap,
    );
    entityCountBefore = modelBefore.entities.length;
  }, 120000);

  afterAll(async () => {
    clearAllowedInsecureBaseUrlsForTests();
    if (harness?.fakeServer) {
      await harness.fakeServer.close();
    }
  });

  it("probes public GET then writes endpoint + Model report with no Entity", async () => {
    const bag = {
      application: FIXTURE_APPLICATION_UUID,
      endpointName: ENDPOINT_NAME,
      openApiDocument,
      baseUrl: harness.fakeServer.baseUrl,
      userAgent: USER_AGENT,
      authenticated: false,
      checkedOperationIds: [PROBE_OPERATION_ID],
      probeOperationId: PROBE_OPERATION_ID,
      probeParameters: { id: "1" },
    };

    const result = await harness.domainController.handleAction(
      {
        actionType: "connectExternalService",
        endpoint: DOMAIN_ENDPOINT,
        payload: bag,
      } as any,
      harness.applicationDeploymentMap,
      harness.libraryModelEnvironment,
    );

    // RED: handleAction default (~L3659) does not know connectExternalService ("unkown action").
    expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);

    const model = harness.domainController.currentModel(
      FIXTURE_APPLICATION_UUID,
      harness.applicationDeploymentMap,
    );

    const endpoint = model.endpoints.find((row) => row.name === ENDPOINT_NAME);
    expect(endpoint?.uuid).toMatch(UUID_V4);
    expect(
      endpoint,
      "DomainController handleAction action could not be taken into account, unkown action",
    ).toBeDefined();

    const external = getExternalService(endpoint);
    expect(external).toBeDefined();
    expect(external!.securityScheme.type).toBe("none");
    expect(external!.extraHeaders?.["User-Agent"]).toBe(USER_AGENT);
    expect(external!.enabledOperations).toEqual([PROBE_OPERATION_ID]);
    expect(external!.openApiDocument).toBe(openApiDocument);
    expect((external as { entity?: unknown }).entity).toBeUndefined();
    expect(external!.operationSync?.[PROBE_OPERATION_ID]?.entity).toBeUndefined();
    const boundPaths = external!.operationSync?.[PROBE_OPERATION_ID]?.boundPaths ?? [];
    expect(boundPaths.some((path) => path.includes(ONE_OF_PROPERTY))).toBe(false);
    expect(boundPaths.length).toBeGreaterThan(0);

    const report = model.reports.find((row) => row.name === `${ENDPOINT_NAME}_${PROBE_OPERATION_ID}`);
    expect(report?.uuid).toMatch(UUID_V4);
    expect(report).toBeDefined();
    expect(report!.conceptLevel).toBe("Model");
    const sections = (report!.definition as { section?: { definition?: Array<{ type: string; definition?: any }> } })
      ?.section?.definition;
    expect(sections?.some((section) => section.type === "apiCallReportSection")).toBe(true);
    const inputSection = sections?.find((section) => section.type === "inputReportSection");
    expect(inputSection?.definition?.urlParamFields).toEqual(["id"]);

    expect(model.entities.length).toBe(entityCountBefore);

    const apiRequests = harness.fakeServer.receivedRequests.filter(
      (request) => request.method === "GET" && request.path === "/releases/1",
    );
    expect(apiRequests).toHaveLength(1);
    const recorded = apiRequests[0]!;
    expect(recorded.headers["user-agent"]).toBe(USER_AGENT);
    expect(recorded.headers.authorization).toBeUndefined();
  });
});

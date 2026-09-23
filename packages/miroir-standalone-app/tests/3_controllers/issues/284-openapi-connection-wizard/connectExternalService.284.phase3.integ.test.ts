// @vitest-environment node
/**
 * Issue #284 Slice 3 — second Finish updates the same endpoint; unchecked ops removed;
 * different probe leaves prior report; same probe updates input defaults.
 *
 * Run:
 * ```bash
 * RUN_TEST=connectExternalService.284.phase3 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase3
 * ```
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { v5 as uuidv5 } from "uuid";

import {
  Action2Error,
  allowInsecureBaseUrlsForTests,
  clearAllowedInsecureBaseUrlsForTests,
  getExternalService,
} from "miroir-core";

import {
  bootConnectExternalService284Harness,
  DOMAIN_ENDPOINT,
  ENDPOINT_ENTITY_UUID,
  FIXTURE_APPLICATION_UUID,
  REPORT_ENTITY_UUID,
  type ConnectExternalService284Harness,
} from "./connectExternalService.284.harness.js";

const RUN_TEST = process.env.RUN_TEST;

const shouldRunPhase3 =
  !RUN_TEST ||
  RUN_TEST === "connectExternalService.284.phase3" ||
  RUN_TEST === "connectExternalService.284";

const ENDPOINT_NAME = "discogsPublic";
const OP_GET_RELEASE = "getRelease";
const OP_GET_ARTIST = "getArtist";
const USER_AGENT = "MiroirTest/284";
const RELEASE_PATH = "/releases/{id}";
const ARTIST_PATH = "/artists/{artist_id}";

const EXPECTED_ENDPOINT_UUID = uuidv5(
  `${FIXTURE_APPLICATION_UUID}\n${ENDPOINT_NAME}`,
  ENDPOINT_ENTITY_UUID,
);
const EXPECTED_REPORT_UUID_GET_RELEASE = uuidv5(
  `${FIXTURE_APPLICATION_UUID}\n${ENDPOINT_NAME}\n${OP_GET_RELEASE}`,
  REPORT_ENTITY_UUID,
);
const EXPECTED_REPORT_UUID_GET_ARTIST = uuidv5(
  `${FIXTURE_APPLICATION_UUID}\n${ENDPOINT_NAME}\n${OP_GET_ARTIST}`,
  REPORT_ENTITY_UUID,
);

function openApiDocumentText(): string {
  return JSON.stringify({
    openapi: "3.0.0",
    info: { title: "DiscogsPublicFixtureTwoGets", version: "1.0.0" },
    paths: {
      [RELEASE_PATH]: {
        get: {
          operationId: OP_GET_RELEASE,
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
                      title: { type: "string" },
                    },
                    required: ["id", "title"],
                  },
                },
              },
            },
          },
        },
      },
      [ARTIST_PATH]: {
        get: {
          operationId: OP_GET_ARTIST,
          parameters: [
            {
              name: "artist_id",
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

function publicBag(overrides: {
  checkedOperationIds: string[];
  probeOperationId: string;
  probeParameters: Record<string, unknown>;
  openApiDocument: string;
  baseUrl: string;
}) {
  return {
    application: FIXTURE_APPLICATION_UUID,
    endpointName: ENDPOINT_NAME,
    openApiDocument: overrides.openApiDocument,
    baseUrl: overrides.baseUrl,
    userAgent: USER_AGENT,
    authenticated: false,
    checkedOperationIds: overrides.checkedOperationIds,
    probeOperationId: overrides.probeOperationId,
    probeParameters: overrides.probeParameters,
  };
}

function reportInputDefault(report: { definition?: unknown }, paramName: string): unknown {
  const sections = (
    report.definition as {
      section?: { definition?: Array<{ type: string; definition?: any }> };
    }
  )?.section?.definition;
  const inputSection = sections?.find((section) => section.type === "inputReportSection");
  return inputSection?.definition?.inputMLSchema?.definition?.[paramName]?.tag?.value?.default;
}

describe.skipIf(!shouldRunPhase3).sequential(
  "connectExternalService.284.phase3 — second Finish upserts",
  () => {
    let harness: ConnectExternalService284Harness;
    let openApiDocument: string;

    beforeAll(async () => {
      openApiDocument = openApiDocumentText();
      harness = await bootConnectExternalService284Harness({
        fixtures: {
          [`GET /releases/1`]: { body: { id: "1", title: "release-one" } },
          [`GET /artists/9`]: { body: { id: "9", name: "artist-nine" } },
          [`GET /artists/42`]: { body: { id: "42", name: "artist-forty-two" } },
        },
      });
      allowInsecureBaseUrlsForTests([harness.fakeServer.baseUrl]);
    }, 120000);

    afterAll(async () => {
      clearAllowedInsecureBaseUrlsForTests();
      if (harness?.fakeServer) {
        await harness.fakeServer.close();
      }
    });

    it("replaces checked set; leaves other probe report; same probe updates defaults", async () => {
      // 1. First Finish: getRelease only
      const first = await harness.domainController.handleAction(
        {
          actionType: "connectExternalService",
          endpoint: DOMAIN_ENDPOINT,
          payload: publicBag({
            openApiDocument,
            baseUrl: harness.fakeServer.baseUrl,
            checkedOperationIds: [OP_GET_RELEASE],
            probeOperationId: OP_GET_RELEASE,
            probeParameters: { id: "1" },
          }),
        } as any,
        harness.applicationDeploymentMap,
        harness.libraryModelEnvironment,
      );
      expect(first instanceof Action2Error, JSON.stringify(first)).toBe(false);

      // 2. Second Finish: getArtist only (same endpoint name)
      const second = await harness.domainController.handleAction(
        {
          actionType: "connectExternalService",
          endpoint: DOMAIN_ENDPOINT,
          payload: publicBag({
            openApiDocument,
            baseUrl: harness.fakeServer.baseUrl,
            checkedOperationIds: [OP_GET_ARTIST],
            probeOperationId: OP_GET_ARTIST,
            probeParameters: { artist_id: "9" },
          }),
        } as any,
        harness.applicationDeploymentMap,
        harness.libraryModelEnvironment,
      );
      expect(second instanceof Action2Error, JSON.stringify(second)).toBe(false);

      const modelAfterSecond = harness.domainController.currentModel(
        FIXTURE_APPLICATION_UUID,
        harness.applicationDeploymentMap,
      );

      const endpoint = modelAfterSecond.endpoints.find((row) => row.uuid === EXPECTED_ENDPOINT_UUID);
      expect(endpoint).toBeDefined();
      expect(endpoint!.uuid).toBe(EXPECTED_ENDPOINT_UUID);

      const external = getExternalService(endpoint);
      expect(external).toBeDefined();
      expect(external!.enabledOperations).toEqual([OP_GET_ARTIST]);
      expect(external!.enabledOperations).not.toContain(OP_GET_RELEASE);
      const operationIds = (external!.operations ?? []).map((op) => op.operationId);
      expect(operationIds).toEqual([OP_GET_ARTIST]);
      expect(operationIds).not.toContain(OP_GET_RELEASE);
      expect(Object.keys(external!.operationSync ?? {})).toEqual([OP_GET_ARTIST]);
      expect(external!.operationSync?.[OP_GET_RELEASE]).toBeUndefined();

      const getArtistReport = modelAfterSecond.reports.find(
        (row) => row.uuid === EXPECTED_REPORT_UUID_GET_ARTIST,
      );
      expect(getArtistReport).toBeDefined();
      expect(getArtistReport!.uuid).toBe(EXPECTED_REPORT_UUID_GET_ARTIST);

      const getReleaseReport = modelAfterSecond.reports.find(
        (row) => row.uuid === EXPECTED_REPORT_UUID_GET_RELEASE,
      );
      expect(
        getReleaseReport,
        "different probe must leave the previous report (analysis D10)",
      ).toBeDefined();

      // 3. Third Finish: same probe getArtist, new artist_id default
      const third = await harness.domainController.handleAction(
        {
          actionType: "connectExternalService",
          endpoint: DOMAIN_ENDPOINT,
          payload: publicBag({
            openApiDocument,
            baseUrl: harness.fakeServer.baseUrl,
            checkedOperationIds: [OP_GET_ARTIST],
            probeOperationId: OP_GET_ARTIST,
            probeParameters: { artist_id: "42" },
          }),
        } as any,
        harness.applicationDeploymentMap,
        harness.libraryModelEnvironment,
      );
      expect(third instanceof Action2Error, JSON.stringify(third)).toBe(false);

      const modelAfterThird = harness.domainController.currentModel(
        FIXTURE_APPLICATION_UUID,
        harness.applicationDeploymentMap,
      );

      const reportsWithArtistUuid = modelAfterThird.reports.filter(
        (row) => row.uuid === EXPECTED_REPORT_UUID_GET_ARTIST,
      );
      expect(reportsWithArtistUuid).toHaveLength(1);

      const updatedArtistReport = reportsWithArtistUuid[0]!;
      expect(reportInputDefault(updatedArtistReport, "artist_id")).toBe("42");
    });
  },
);

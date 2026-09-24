// @vitest-environment node
/**
 * Issue #284 Slice 4 — authenticated probes (custom token, client credentials, auth code)
 * and log redaction. Calls go through handleCompositeActionTemplate.
 *
 * Run:
 * ```bash
 * RUN_TEST=connectExternalService.284.phase4 npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-filesystem connectExternalService.284.phase4
 * ```
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import {
  Action2Error,
  allowInsecureBaseUrlsForTests,
  clearAllowedInsecureBaseUrlsForTests,
  clearExternalServiceTokenCacheForTests,
  clearSecrets,
  clearSecretsMasterKey,
  ENTITY_MIROIR_SECRET_UUID,
  getExternalService,
  miroirSecretInstanceUuid,
  setSecretsMasterKey,
} from "miroir-core";

import {
  ADMIN_APPLICATION_UUID,
  bootConnectExternalService284Harness,
  DOMAIN_ENDPOINT,
  FIXTURE_APPLICATION_UUID,
  REPORT_ENTITY_UUID,
  type ConnectExternalService284Harness,
} from "./connectExternalService.284.harness.js";

const RUN_TEST = process.env.RUN_TEST;

const shouldRunPhase4 =
  !RUN_TEST || RUN_TEST === "connectExternalService.284.phase4";

const PUBLIC_ENDPOINT_NAME = "discogsPublic";
const TOKEN_ENDPOINT_NAME = "discogsToken";
const PROBE_OPERATION_ID = "getRelease";
const USER_AGENT = "MiroirTest/284";
const RELEASE_PATH = "/releases/{id}";
const QUERY_ENDPOINT = "9e404b3c-368c-40cb-be8b-e3c28550c25e";
const WRAPPING_KEY = "test-secrets-master-284-phase4";
const CUSTOM_TOKEN_SECRET_NAME = "discogsTokenToken";
const CUSTOM_TOKEN_VALUE = "sekret";
const CUSTOM_TOKEN_TEMPLATE = "Discogs token={secret}";
const EXPECTED_AUTH_HEADER = "Discogs token=sekret";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXPECTED_SECRET_UUID = miroirSecretInstanceUuid(CUSTOM_TOKEN_SECRET_NAME, "process");

function openApiDocumentText(): string {
  return JSON.stringify({
    openapi: "3.0.0",
    info: { title: "DiscogsFixture284Phase4", version: "1.0.0" },
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

function connectSequence(payload: Record<string, unknown>) {
  return {
    actionType: "compositeActionSequence" as const,
    actionLabel: "connectExternalService.284.phase4",
    endpoint: DOMAIN_ENDPOINT,
    payload: {
      actionSequence: [
        {
          actionType: "connectExternalService",
          actionLabel: "connect",
          endpoint: DOMAIN_ENDPOINT,
          payload,
        },
      ],
    },
  };
}

describe.skipIf(!shouldRunPhase4).sequential(
  "connectExternalService.284.phase4 — authenticated probes",
  () => {
    let harness: ConnectExternalService284Harness;
    let openApiDocument: string;

    beforeAll(async () => {
      openApiDocument = openApiDocumentText();
      harness = await bootConnectExternalService284Harness({
        fixtures: {
          [`GET /releases/1`]: { body: { id: "1", name: "x" } },
        },
      });
      allowInsecureBaseUrlsForTests([harness.fakeServer.baseUrl]);
      setSecretsMasterKey(WRAPPING_KEY);
    }, 120000);

    afterEach(() => {
      harness.fakeServer.onRequest = undefined;
      harness.fakeServer.receivedRequests.length = 0;
      clearSecrets();
      clearExternalServiceTokenCacheForTests();
    });

    afterAll(async () => {
      clearAllowedInsecureBaseUrlsForTests();
      clearSecrets();
      clearSecretsMasterKey();
      if (harness?.fakeServer) {
        await harness.fakeServer.close();
      }
    });

    async function runConnectViaComposite(bag: Record<string, unknown>) {
      return harness.domainController.handleCompositeActionTemplate(
        connectSequence(bag) as any,
        harness.applicationDeploymentMap,
        harness.libraryModelEnvironment,
        bag,
      );
    }

    async function querySecretRows(): Promise<Record<string, unknown>[]> {
      const queryResult = await harness.domainControllerForServer.handleBoxedExtractorOrQueryAction(
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
        return element as Record<string, unknown>[];
      }
      if (element && typeof element === "object") {
        return Object.values(element as Record<string, Record<string, unknown>>);
      }
      return [];
    }

    it("4.1 custom token: Discogs template header, secret row, both endpoint uuids", async () => {
      const publicBag = {
        application: FIXTURE_APPLICATION_UUID,
        endpointName: PUBLIC_ENDPOINT_NAME,
        openApiDocument,
        baseUrl: harness.fakeServer.baseUrl,
        userAgent: USER_AGENT,
        authenticated: false,
        checkedOperationIds: [PROBE_OPERATION_ID],
        probeOperationId: PROBE_OPERATION_ID,
        probeParameters: { id: "1" },
      };

      const publicResult = await runConnectViaComposite(publicBag);
      expect(publicResult instanceof Action2Error, JSON.stringify(publicResult)).toBe(false);

      harness.fakeServer.receivedRequests.length = 0;

      const tokenBag = {
        application: FIXTURE_APPLICATION_UUID,
        endpointName: TOKEN_ENDPOINT_NAME,
        openApiDocument,
        baseUrl: harness.fakeServer.baseUrl,
        userAgent: USER_AGENT,
        authenticated: true,
        scheme: "customToken",
        authorizationTemplate: CUSTOM_TOKEN_TEMPLATE,
        credentialKey: CUSTOM_TOKEN_SECRET_NAME,
        processSecrets: { [CUSTOM_TOKEN_SECRET_NAME]: CUSTOM_TOKEN_VALUE },
        checkedOperationIds: [PROBE_OPERATION_ID],
        probeOperationId: PROBE_OPERATION_ID,
        probeParameters: { id: "1" },
      };

      const tokenResult = await runConnectViaComposite(tokenBag);
      expect(tokenResult instanceof Action2Error, JSON.stringify(tokenResult)).toBe(false);

      const model = harness.domainController.currentModel(
        FIXTURE_APPLICATION_UUID,
        harness.applicationDeploymentMap,
      );

      const publicEndpoint = model.endpoints.find((row) => row.name === PUBLIC_ENDPOINT_NAME);
      const tokenEndpoint = model.endpoints.find((row) => row.name === TOKEN_ENDPOINT_NAME);
      expect(publicEndpoint?.uuid).toMatch(UUID_V4);
      expect(tokenEndpoint?.uuid).toMatch(UUID_V4);
      expect(publicEndpoint, "discogsPublic endpoint uuid missing").toBeDefined();
      expect(tokenEndpoint, "discogsToken endpoint uuid missing").toBeDefined();

      const external = getExternalService(tokenEndpoint);
      expect(external).toBeDefined();
      expect(external!.securityScheme.type).toBe("http");
      expect((external!.securityScheme as { scheme?: string }).scheme).toBe("bearer");
      expect((external!.securityScheme as { authorizationTemplate?: string }).authorizationTemplate).toBe(
        CUSTOM_TOKEN_TEMPLATE,
      );
      expect(external!.credentialKey).toBe(CUSTOM_TOKEN_SECRET_NAME);

      const apiRequests = harness.fakeServer.receivedRequests.filter(
        (request) => request.method === "GET" && request.path === "/releases/1",
      );
      expect(apiRequests).toHaveLength(1);
      expect(apiRequests[0]!.headers.authorization).toBe(EXPECTED_AUTH_HEADER);

      const secrets = await querySecretRows();
      const secretRow = secrets.find((row) => row.uuid === EXPECTED_SECRET_UUID);
      expect(secretRow, "MiroirSecret row for credential name missing").toBeDefined();
      expect(secretRow!.name).toBe(CUSTOM_TOKEN_SECRET_NAME);
      expect(typeof secretRow!.ciphertext).toBe("string");
      expect(secretRow!.ciphertext).not.toBe(CUSTOM_TOKEN_VALUE);
    });

    it("4.2 client credentials: token grant then Bearer on API, oauth2ClientCredentials endpoint", async () => {
      const accessToken = "cc-access-token-284";
      const clientIdKey = "discogsCcClientId";
      const clientSecretKey = "discogsCcClientSecret";
      const endpointName = "discogsClientCredentials";
      const tokenUrl = `${harness.fakeServer.baseUrl}/oauth/token`;

      harness.fakeServer.setFixture("POST", "/oauth/token", {
        body: { access_token: accessToken, expires_in: 3600, token_type: "Bearer" },
      });
      harness.fakeServer.setFixture("GET", "/releases/1", {
        body: { id: "1", name: "cc" },
      });

      const bag = {
        application: FIXTURE_APPLICATION_UUID,
        endpointName,
        openApiDocument,
        baseUrl: harness.fakeServer.baseUrl,
        userAgent: USER_AGENT,
        authenticated: true,
        scheme: "clientCredentials",
        tokenUrl,
        clientIdKey,
        clientSecretKey,
        processSecrets: {
          [clientIdKey]: "cc-client-id",
          [clientSecretKey]: "cc-client-secret",
        },
        checkedOperationIds: [PROBE_OPERATION_ID],
        probeOperationId: PROBE_OPERATION_ID,
        probeParameters: { id: "1" },
      };

      const result = await runConnectViaComposite(bag);
      expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);

      const model = harness.domainController.currentModel(
        FIXTURE_APPLICATION_UUID,
        harness.applicationDeploymentMap,
      );
      const endpoint = model.endpoints.find((row) => row.name === endpointName);
      expect(endpoint?.uuid).toMatch(UUID_V4);
      expect(endpoint).toBeDefined();
      const external = getExternalService(endpoint);
      expect(external!.securityScheme.type).toBe("oauth2ClientCredentials");
      expect((external!.securityScheme as { tokenUrl?: string }).tokenUrl).toBe(tokenUrl);
      expect((external!.securityScheme as { clientIdKey?: string }).clientIdKey).toBe(clientIdKey);
      expect((external!.securityScheme as { clientSecretKey?: string }).clientSecretKey).toBe(
        clientSecretKey,
      );

      const tokenRequests = harness.fakeServer.receivedRequests.filter(
        (request) => request.method === "POST" && request.path === "/oauth/token",
      );
      expect(tokenRequests.length).toBeGreaterThanOrEqual(1);
      expect(tokenRequests[0]!.body ?? "").toContain("grant_type=client_credentials");

      const apiRequests = harness.fakeServer.receivedRequests.filter(
        (request) => request.method === "GET" && request.path === "/releases/1",
      );
      expect(apiRequests).toHaveLength(1);
      expect(apiRequests[0]!.headers.authorization).toBe(`Bearer ${accessToken}`);
    });

    it("4.3 authorization code Spotify-shaped: refresh grant, omit oneOf boundPaths", async () => {
      const accessToken = "ac-access-token-284";
      const refreshTokenValue = "ac-refresh-token-284";
      const clientIdKey = "spotifyClientId";
      const clientSecretKey = "spotifyClientSecret";
      const refreshTokenKey = "spotifyRefreshToken";
      const endpointName = "spotifyAuthCode";
      const probeOperationId = "get-playlist";
      const tokenUrl = `${harness.fakeServer.baseUrl}/api/token`;
      const playlistPath = "/playlists/{playlist_id}";
      const openApiSpotify = JSON.stringify({
        openapi: "3.0.0",
        info: { title: "SpotifyShaped284", version: "1.0.0" },
        paths: {
          [playlistPath]: {
            get: {
              operationId: probeOperationId,
              parameters: [
                {
                  name: "playlist_id",
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
                          tracks: {
                            type: "object",
                            properties: {
                              items: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    track: {
                                      oneOf: [
                                        { type: "string" },
                                        {
                                          type: "object",
                                          properties: { name: { type: "string" } },
                                        },
                                      ],
                                    },
                                  },
                                },
                              },
                            },
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

      harness.fakeServer.setFixture("POST", "/api/token", {
        body: { access_token: accessToken, expires_in: 3600, token_type: "Bearer" },
      });
      harness.fakeServer.setFixture("GET", "/playlists/p1", {
        body: { id: "p1", name: "Playlist One" },
      });

      const bag = {
        application: FIXTURE_APPLICATION_UUID,
        endpointName,
        openApiDocument: openApiSpotify,
        baseUrl: harness.fakeServer.baseUrl,
        userAgent: USER_AGENT,
        authenticated: true,
        scheme: "authorizationCode",
        tokenUrl,
        clientIdKey,
        clientSecretKey,
        refreshTokenKey,
        processSecrets: {
          [clientIdKey]: "ac-client-id",
          [clientSecretKey]: "ac-client-secret",
          [refreshTokenKey]: refreshTokenValue,
        },
        checkedOperationIds: [probeOperationId],
        probeOperationId,
        probeParameters: { playlist_id: "p1" },
      };

      const result = await runConnectViaComposite(bag);
      expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);

      const model = harness.domainController.currentModel(
        FIXTURE_APPLICATION_UUID,
        harness.applicationDeploymentMap,
      );
      const endpoint = model.endpoints.find((row) => row.name === endpointName);
      expect(endpoint?.uuid).toMatch(UUID_V4);
      expect(endpoint).toBeDefined();
      const external = getExternalService(endpoint);
      expect(external!.securityScheme.type).toBe("oauth2AuthorizationCode");
      expect((external!.securityScheme as { refreshTokenKey?: string }).refreshTokenKey).toBe(
        refreshTokenKey,
      );
      const boundPaths = external!.operationSync?.[probeOperationId]?.boundPaths ?? [];
      expect(boundPaths.some((path) => path.includes("tracks.items.track"))).toBe(false);
      expect(boundPaths.length).toBeGreaterThan(0);

      const tokenRequests = harness.fakeServer.receivedRequests.filter(
        (request) => request.method === "POST" && request.path === "/api/token",
      );
      expect(tokenRequests.length).toBeGreaterThanOrEqual(1);
      expect(tokenRequests[0]!.body ?? "").toContain("grant_type=refresh_token");

      const apiRequests = harness.fakeServer.receivedRequests.filter(
        (request) => request.method === "GET" && request.path === "/playlists/p1",
      );
      expect(apiRequests).toHaveLength(1);
      expect(apiRequests[0]!.headers.authorization).toBe(`Bearer ${accessToken}`);
    });

    it("4.4 log redaction: custom-token call does not log sekret", async () => {
      const captured: string[] = [];
      const captureArgs = (...args: unknown[]) => {
        for (const arg of args) {
          if (typeof arg === "string") {
            captured.push(arg);
          } else {
            try {
              captured.push(JSON.stringify(arg));
            } catch {
              captured.push(String(arg));
            }
          }
        }
      };
      // loglevelnext binds console at factory start; intercept MiroirLogger instead.
      const { MiroirLogger } = await import("miroir-core");
      const proto = MiroirLogger.prototype as {
        info: (...args: unknown[]) => void;
        log: (...args: unknown[]) => void;
        debug: (...args: unknown[]) => void;
        warn: (...args: unknown[]) => void;
        error: (...args: unknown[]) => void;
      };
      const wrap =
        (method: "info" | "log" | "debug" | "warn" | "error") =>
        function (this: unknown, ...args: unknown[]) {
          captureArgs(...args);
          return (proto as any)[`__orig_${method}`].apply(this, args);
        };
      (proto as any).__orig_info = proto.info;
      (proto as any).__orig_log = proto.log;
      (proto as any).__orig_debug = proto.debug;
      (proto as any).__orig_warn = proto.warn;
      (proto as any).__orig_error = proto.error;
      const infoSpy = vi.spyOn(proto, "info").mockImplementation(wrap("info"));
      const logSpy = vi.spyOn(proto, "log").mockImplementation(wrap("log"));
      const debugSpy = vi.spyOn(proto, "debug").mockImplementation(wrap("debug"));
      const warnSpy = vi.spyOn(proto, "warn").mockImplementation(wrap("warn"));
      const errorSpy = vi.spyOn(proto, "error").mockImplementation(wrap("error"));

      try {
        const tokenBag = {
          application: FIXTURE_APPLICATION_UUID,
          endpointName: "discogsTokenLogCheck",
          openApiDocument,
          baseUrl: harness.fakeServer.baseUrl,
          userAgent: USER_AGENT,
          authenticated: true,
          scheme: "customToken",
          authorizationTemplate: CUSTOM_TOKEN_TEMPLATE,
          credentialKey: CUSTOM_TOKEN_SECRET_NAME,
          processSecrets: { [CUSTOM_TOKEN_SECRET_NAME]: CUSTOM_TOKEN_VALUE },
          checkedOperationIds: [PROBE_OPERATION_ID],
          probeOperationId: PROBE_OPERATION_ID,
          probeParameters: { id: "1" },
        };

        const result = await runConnectViaComposite(tokenBag);
        expect(result instanceof Action2Error, JSON.stringify(result)).toBe(false);

        const joined = captured.join("\n");
        expect(joined.includes(CUSTOM_TOKEN_VALUE)).toBe(false);
      } finally {
        infoSpy.mockRestore();
        logSpy.mockRestore();
        debugSpy.mockRestore();
        warnSpy.mockRestore();
        errorSpy.mockRestore();
      }
    });
  },
);

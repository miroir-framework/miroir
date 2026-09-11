/**
 * #270 PR review — OAuth refresh cache must follow the resolved secret row.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Action2Error,
  allowInsecureBaseUrlsForTests,
  clearAllowedInsecureBaseUrlsForTests,
  clearExternalServiceTokenCacheForTests,
  clearPersistRotatedSecret,
  clearSecrets,
  clearSecretsMasterKey,
  encryptSecret,
  executeExternalServiceOperation,
  hydrateSecrets,
  setPersistRotatedSecret,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "secrets.270" ||
  RUN_TEST.startsWith("secrets.270") ||
  RUN_TEST === "secretsOauthCache.270" ||
  RUN_TEST.startsWith("secretsOauthCache.270") ||
  RUN_TEST === "secretsOauthCache.270.phase5";

const WRAPPING_KEY = "test-secrets-master";
const ALICE = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const BASE_URL = "http://127.0.0.1:9";
const PROCESS_RT = "process-rt";
const ALICE_RT = "alice-rt";
const ROTATED_FROM_PROCESS = "rotated-from-process";
const ROTATED_FROM_ALICE = "rotated-from-alice";

function authorizationCodeEndpoint() {
  return {
    definition: {
      externalService: {
        openApiDocument: "{}",
        baseUrl: BASE_URL,
        securityScheme: {
          type: "oauth2AuthorizationCode" as const,
          tokenUrl: `${BASE_URL}/api/token`,
          clientIdKey: "fakeClientId",
          clientSecretKey: "fakeClientSecret",
          refreshTokenKey: "fakeRefreshToken",
        },
        enabledOperations: ["get-playlist"],
        operations: [
          {
            operationId: "get-playlist",
            method: "GET",
            path: "/playlists/{playlist_id}",
            parameterMappings: [{ name: "playlist_id", in: "path", required: true }],
            responseSchema: {},
          },
        ],
      },
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  clearPersistRotatedSecret();
  clearExternalServiceTokenCacheForTests();
  clearAllowedInsecureBaseUrlsForTests();
  clearSecrets();
  clearSecretsMasterKey();
});

if (runThis) {
  describe("secretsOauthCache.270.phase5 resolved-scope cache", () => {
    it("does not reuse a process-fallback rotated token after Alice creates a user row", async () => {
      allowInsecureBaseUrlsForTests([BASE_URL]);
      hydrateSecrets({
        wrappingKey: WRAPPING_KEY,
        rows: [
          {
            name: "fakeClientId",
            ciphertext: encryptSecret("aes-256-gcm", WRAPPING_KEY, "id-123"),
          },
          {
            name: "fakeClientSecret",
            ciphertext: encryptSecret("aes-256-gcm", WRAPPING_KEY, "secret-abc"),
          },
          {
            name: "fakeRefreshToken",
            ciphertext: encryptSecret("aes-256-gcm", WRAPPING_KEY, PROCESS_RT),
          },
        ],
      });

      const refreshTokensPosted: string[] = [];
      const persisted: Array<{
        name: string;
        value: string;
        scope: "process" | "user";
        miroirUserUuid?: string;
      }> = [];
      setPersistRotatedSecret(async (args) => {
        persisted.push(args);
      });

      vi.stubGlobal(
        "fetch",
        async (url: string | URL, init?: { body?: string }) => {
          const href = String(url);
          if (href.includes("/api/token")) {
            const body = String(init?.body ?? "");
            const refreshToken = new URLSearchParams(body).get("refresh_token") ?? "";
            refreshTokensPosted.push(refreshToken);
            const rotated =
              refreshToken === PROCESS_RT ? ROTATED_FROM_PROCESS : ROTATED_FROM_ALICE;
            return {
              status: 200,
              json: async () => ({
                access_token: `at-${refreshTokensPosted.length}`,
                expires_in: 3600,
                refresh_token: rotated,
              }),
            };
          }
          return {
            status: 200,
            json: async () => ({ ok: true }),
          };
        },
      );

      const first = await executeExternalServiceOperation(
        authorizationCodeEndpoint(),
        "get-playlist",
        { playlist_id: "p1" },
        { miroirUserUuid: ALICE },
      );
      expect(first instanceof Action2Error, JSON.stringify(first)).toBe(false);
      expect(refreshTokensPosted).toEqual([PROCESS_RT]);
      expect(persisted[0]).toMatchObject({
        name: "fakeRefreshToken",
        value: ROTATED_FROM_PROCESS,
        scope: "process",
      });
      expect(persisted[0]?.miroirUserUuid).toBeUndefined();

      hydrateSecrets({
        wrappingKey: WRAPPING_KEY,
        rows: [
          {
            name: "fakeRefreshToken",
            ciphertext: encryptSecret("aes-256-gcm", WRAPPING_KEY, ALICE_RT),
            miroirUser: ALICE,
          },
        ],
      });

      const second = await executeExternalServiceOperation(
        authorizationCodeEndpoint(),
        "get-playlist",
        { playlist_id: "p1" },
        { miroirUserUuid: ALICE },
      );
      expect(second instanceof Action2Error, JSON.stringify(second)).toBe(false);
      expect(refreshTokensPosted).toEqual([PROCESS_RT, ALICE_RT]);
      expect(persisted[1]).toMatchObject({
        name: "fakeRefreshToken",
        value: ROTATED_FROM_ALICE,
        scope: "user",
        miroirUserUuid: ALICE,
      });
    });
  });
}

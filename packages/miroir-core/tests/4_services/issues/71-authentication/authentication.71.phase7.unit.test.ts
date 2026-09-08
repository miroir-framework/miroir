/**
 * #71 review follow-up — secret redaction, write guard, live principal, expired token, uniqueness.
 */
import { describe, expect, it } from "vitest";

import { RestClient, setRestClientAuthorizationInvalidationHandler } from "../../../../src/4_services/RestClient.js";
import {
  AUTHENTICATION_FAILED,
  AUTH_CHANGE_PASSWORD_ACTION_LABEL,
  ENTITY_MIROIR_USER_CREDENTIAL_UUID,
  assertCredentialInstanceMutationAllowed,
  bindPrincipalToDirectory,
  isUsableBearerToken,
  issueBearerToken,
  loginWithPassword,
  redactCredentialSecretsFromValue,
  type IdentityDirectory,
} from "../../../../src/1_core/authentication/AuthenticationPolicy.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "authentication.71" ||
  RUN_TEST.startsWith("authentication.71");

const ALICE = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const TEST_SECRET = "test-secret-71";

function directory(overrides?: Partial<IdentityDirectory>): IdentityDirectory {
  return {
    users: [
      { uuid: ALICE, username: "alice", status: "active" },
      { uuid: "95fa298f-79f8-428c-8980-3443d486c1d8", username: "bob", status: "inactive" },
    ],
    credentials: [
      {
        uuid: "c179dcf9-f39b-4b16-b8d6-3e39895bfd35",
        miroirUser: ALICE,
        passwordHash: "scrypt$16384$8$1$xZbPQLNsecH4whiiNUxKuA$uJVJzgqQ9ONhHf6usBOCla4al6j25yrflwWrKb4bswQ",
      },
    ],
    ...overrides,
  };
}

if (runThis) {
  describe("authentication.71.phase7 credential secrecy", () => {
    it("strips passwordHash from credential instances and leaves other rows intact", () => {
      const redacted = redactCredentialSecretsFromValue({
        instances: [
          {
            uuid: "c179dcf9-f39b-4b16-b8d6-3e39895bfd35",
            parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID,
            miroirUser: ALICE,
            passwordHash: "secret",
          },
          { uuid: ALICE, parentUuid: "d20d09e5-0685-4fc7-b9bd-fcfa3845127a", name: "Alice" },
        ],
      }) as { instances: Record<string, unknown>[] };
      expect(redacted.instances[0]).toEqual({
        uuid: "c179dcf9-f39b-4b16-b8d6-3e39895bfd35",
        parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID,
        miroirUser: ALICE,
      });
      expect(redacted.instances[1].name).toBe("Alice");
    });

    it("rejects generic credential writes and allows labeled self-change", () => {
      expect(
        assertCredentialInstanceMutationAllowed({
          actionType: "updateInstance",
          payload: {
            parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID,
            objects: [{ parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID, passwordHash: "x" }],
          },
        }).allowed,
      ).toBe(false);
      expect(
        assertCredentialInstanceMutationAllowed({
          actionType: "updateInstance",
          actionLabel: AUTH_CHANGE_PASSWORD_ACTION_LABEL,
          payload: { parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID, objects: [] },
        }),
      ).toEqual({ allowed: true });
    });
  });

  describe("authentication.71.phase7 live principal and uniqueness", () => {
    it("rejects a still-signed token after the user is deactivated", async () => {
      const token = await issueBearerToken({ miroirUserUuid: ALICE, username: "alice" }, TEST_SECRET);
      const extracted = { miroirUserUuid: ALICE, username: "alice" };
      expect(bindPrincipalToDirectory(extracted, directory())).toEqual(extracted);
      const inactive = directory({
        users: [{ uuid: ALICE, username: "alice", status: "inactive" }],
      });
      expect(bindPrincipalToDirectory(extracted, inactive)).toBeUndefined();
      expect(typeof token).toBe("string");
    });

    it("fails login when the username is duplicated", async () => {
      const result = await loginWithPassword(
        { username: "alice", password: "alice-dev" },
        directory({
          users: [
            { uuid: ALICE, username: "alice", status: "active" },
            { uuid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", username: "alice", status: "active" },
          ],
        }),
        TEST_SECRET,
      );
      expect(result).toEqual({ ok: false, status: 401, body: AUTHENTICATION_FAILED });
    });
  });

  describe("authentication.71.phase7 expired session", () => {
    it("treats a missing, malformed, or expired payload as unusable", async () => {
      expect(isUsableBearerToken(undefined)).toBe(false);
      expect(isUsableBearerToken("not-a-token")).toBe(false);
      const expired = await issueBearerToken(
        { miroirUserUuid: ALICE, username: "alice" },
        TEST_SECRET,
        1_700_000_000_000,
        1,
      );
      expect(isUsableBearerToken(expired, 1_700_000_000_000 + 2_000)).toBe(false);
      const fresh = await issueBearerToken({ miroirUserUuid: ALICE, username: "alice" }, TEST_SECRET);
      expect(isUsableBearerToken(fresh)).toBe(true);
    });

    it("clears the stored token when RestClient sees AuthenticationRequired", async () => {
      let cleared = false;
      setRestClientAuthorizationInvalidationHandler(() => {
        cleared = true;
      });
      const client = new RestClient(async () => ({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () =>
          JSON.stringify({ status: "error", errorType: "AuthenticationRequired" }),
      }));
      await expect(client.get("/CRUD/x/data/entity/y/all", "/CRUD/x/data/entity/y/all")).rejects.toBeTruthy();
      expect(cleared).toBe(true);
      setRestClientAuthorizationInvalidationHandler(undefined);
    });
  });
}

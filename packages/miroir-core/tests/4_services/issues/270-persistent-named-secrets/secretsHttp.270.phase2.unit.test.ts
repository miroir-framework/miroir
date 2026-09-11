/**
 * #270 Slice 2 — /secrets route policy + MiroirSecret CRUD guard.
 * Persist proofs live in the standalone-app integ file.
 */
import { afterEach, describe, expect, it } from "vitest";

import type { DomainControllerInterface } from "miroir-core";
import {
  ENTITY_MIROIR_SECRET_UUID,
  SECRETS_DELETE_ACTION_LABEL,
  SECRETS_SET_ACTION_LABEL,
  assertSecretInstanceMutationAllowed,
  clearSecretsMasterKey,
  handleSecretsHttpRoute,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "secretsHttp.270" ||
  RUN_TEST.startsWith("secretsHttp.270") ||
  RUN_TEST === "secretsHttp.270.phase2";

const ALICE = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
const CAROL = "30634877-08ae-44f3-a230-d899e22333d5";
const SECRET_PARENT = { parentUuid: ENTITY_MIROIR_SECRET_UUID };

function unusedDomainController(): DomainControllerInterface {
  const fail = async () => {
    throw new Error("serverDomainController must not be called for route-policy rejection");
  };
  return {
    handleAction: fail,
    handleBoxedExtractorOrQueryAction: fail,
  } as unknown as DomainControllerInterface;
}

afterEach(() => {
  clearSecretsMasterKey();
});

if (runThis) {
  describe("secretsHttp.270.phase2 guard", () => {
    it("rejects create/update/delete/deleteInstanceWithCascade on MiroirSecret without labels", () => {
      for (const actionType of [
        "createInstance",
        "updateInstance",
        "deleteInstance",
        "deleteInstanceWithCascade",
      ] as const) {
        expect(
          assertSecretInstanceMutationAllowed({
            actionType,
            payload: { parentUuid: ENTITY_MIROIR_SECRET_UUID, objects: [SECRET_PARENT] },
          }).allowed,
        ).toBe(false);
      }
    });

    it("allows labeled set and delete actions that touch MiroirSecret", () => {
      expect(
        assertSecretInstanceMutationAllowed({
          actionType: "createInstance",
          actionLabel: SECRETS_SET_ACTION_LABEL,
          payload: { parentUuid: ENTITY_MIROIR_SECRET_UUID, objects: [SECRET_PARENT] },
        }),
      ).toEqual({ allowed: true });
      expect(
        assertSecretInstanceMutationAllowed({
          actionType: "updateInstance",
          actionLabel: SECRETS_SET_ACTION_LABEL,
          payload: { objects: [SECRET_PARENT] },
        }),
      ).toEqual({ allowed: true });
      expect(
        assertSecretInstanceMutationAllowed({
          actionType: "deleteInstance",
          actionLabel: SECRETS_DELETE_ACTION_LABEL,
          payload: { objects: [SECRET_PARENT] },
        }),
      ).toEqual({ allowed: true });
      expect(
        assertSecretInstanceMutationAllowed({
          actionType: "deleteInstanceWithCascade",
          actionLabel: SECRETS_DELETE_ACTION_LABEL,
          payload: { parentUuid: ENTITY_MIROIR_SECRET_UUID, objects: [] },
        }),
      ).toEqual({ allowed: true });
    });

    it("allows other actionTypes and actions that do not touch MiroirSecret", () => {
      expect(
        assertSecretInstanceMutationAllowed({
          actionType: "getInstances",
          payload: { parentUuid: ENTITY_MIROIR_SECRET_UUID },
        }),
      ).toEqual({ allowed: true });
      expect(
        assertSecretInstanceMutationAllowed({
          actionType: "createInstance",
          payload: { parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad", objects: [] },
        }),
      ).toEqual({ allowed: true });
    });
  });

  describe("secretsHttp.270.phase2 route policy", () => {
    it("unauthenticated POST /secrets returns 401", async () => {
      const result = await handleSecretsHttpRoute({
        url: "/secrets",
        method: "post",
        body: { name: "n", value: "v", scope: "process" },
        principal: undefined,
        serverDomainController: unusedDomainController(),
      });
      expect(result).toEqual(
        expect.objectContaining({
          status: 401,
          data: expect.objectContaining({ errorType: "AuthenticationRequired" }),
        }),
      );
    });

    it("user-scope POST as Alice targeting Carol returns 403", async () => {
      const result = await handleSecretsHttpRoute({
        url: "/secrets",
        method: "post",
        body: { name: "n", value: "v", scope: "user", miroirUser: CAROL },
        principal: { miroirUserUuid: ALICE, username: "alice" },
        serverDomainController: unusedDomainController(),
      });
      expect(result).toEqual(
        expect.objectContaining({
          status: 403,
          data: expect.objectContaining({ status: "error" }),
        }),
      );
    });
  });
}

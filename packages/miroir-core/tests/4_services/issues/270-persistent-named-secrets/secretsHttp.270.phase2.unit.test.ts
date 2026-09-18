/**
 * #270 Slice 2 — MiroirSecret CRUD guard (labeled secrets.set / secrets.delete).
 */
import { describe, expect, it } from "vitest";

import {
  ENTITY_MIROIR_SECRET_UUID,
  SECRETS_DELETE_ACTION_LABEL,
  SECRETS_SET_ACTION_LABEL,
  assertSecretInstanceMutationAllowed,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "secretsHttp.270" ||
  RUN_TEST.startsWith("secretsHttp.270") ||
  RUN_TEST === "secretsHttp.270.phase2";

const SECRET_PARENT = { parentUuid: ENTITY_MIROIR_SECRET_UUID };

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
}

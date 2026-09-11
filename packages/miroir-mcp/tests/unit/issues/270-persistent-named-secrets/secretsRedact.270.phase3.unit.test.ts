/**
 * #270 Slice 3 — MCP tool response redaction (passwordHash + ciphertext).
 */
import { describe, expect, it } from "vitest";
import { z } from "zod";

import type { DomainControllerInterface } from "miroir-core";
import { handleMcpAction } from "../../../../src/tools/mcpHandlersForEndpoint.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "secretsRedact.270" ||
  RUN_TEST.startsWith("secretsRedact.270") ||
  RUN_TEST === "secrets.270";

const ENTITY_MIROIR_USER_CREDENTIAL_UUID = "6c3ab489-1a36-4981-b5d0-bb3e02cfceed";
const ENTITY_MIROIR_SECRET_UUID = "a96856df-2b38-494a-8027-82617e2d64ad";

const PASSWORD_HASH = "super-secret-password-hash";
const CIPHERTEXT = "aes-256-gcm$iv$cipher$tag";

const dummyActionBuilder = () =>
  ({
    actionType: "getInstances",
    payload: {},
  }) as ReturnType<Parameters<typeof handleMcpAction>[3]>;

if (runThis) {
  describe("secretsRedact.270.phase3 MCP tool response redaction", () => {
    it("redacts passwordHash and ciphertext from success parsed and text", async () => {
      const domainController = {
        handleAction: async () => ({
          status: "ok" as const,
          returnedDomainElement: {
            instances: [
              {
                parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID,
                uuid: "cred-1",
                passwordHash: PASSWORD_HASH,
              },
              {
                parentUuid: ENTITY_MIROIR_SECRET_UUID,
                uuid: "secret-1",
                name: "mySecret",
                ciphertext: CIPHERTEXT,
              },
            ],
          },
        }),
      } as DomainControllerInterface;

      const result = await handleMcpAction(
        "Test_successRedact",
        {},
        z.object({}),
        dummyActionBuilder,
        domainController,
        {},
      );

      const parsed = result.content[0]?.parsed;
      const text = result.content[0]?.text ?? "";

      expect(parsed?.status).toBe("success");
      expect(JSON.stringify(parsed)).not.toContain(PASSWORD_HASH);
      expect(JSON.stringify(parsed)).not.toContain(CIPHERTEXT);
      expect(parsed?.result?.instances?.[0]).not.toHaveProperty("passwordHash");
      expect(parsed?.result?.instances?.[1]).not.toHaveProperty("ciphertext");

      expect(text).not.toContain(PASSWORD_HASH);
      expect(text).not.toContain(CIPHERTEXT);
      expect(text).not.toContain("passwordHash");
      expect(text).not.toContain("ciphertext");
    });

    it("redacts passwordHash and ciphertext from error context in parsed and text", async () => {
      const domainController = {
        handleAction: async () => ({
          status: "error" as const,
          errorType: "FailedToHandleAction",
          errorMessage: "x",
          errorContext: {
            instances: [
              {
                parentUuid: ENTITY_MIROIR_USER_CREDENTIAL_UUID,
                uuid: "cred-1",
                passwordHash: PASSWORD_HASH,
              },
              {
                parentUuid: ENTITY_MIROIR_SECRET_UUID,
                uuid: "secret-1",
                name: "mySecret",
                ciphertext: CIPHERTEXT,
              },
            ],
          },
        }),
      } as DomainControllerInterface;

      const result = await handleMcpAction(
        "Test_errorRedact",
        {},
        z.object({}),
        dummyActionBuilder,
        domainController,
        {},
      );

      const parsed = result.content[0]?.parsed;
      const text = result.content[0]?.text ?? "";

      expect(parsed?.status).toBe("error");
      expect(JSON.stringify(parsed)).not.toContain(PASSWORD_HASH);
      expect(JSON.stringify(parsed)).not.toContain(CIPHERTEXT);
      expect(parsed?.error?.context?.instances?.[0]).not.toHaveProperty("passwordHash");
      expect(parsed?.error?.context?.instances?.[1]).not.toHaveProperty("ciphertext");

      expect(text).not.toContain(PASSWORD_HASH);
      expect(text).not.toContain(CIPHERTEXT);
      expect(text).not.toContain("passwordHash");
      expect(text).not.toContain("ciphertext");
    });
  });
}

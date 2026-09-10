/**
 * #270 Slice 1 — SecretsService encrypt/decrypt/hydrate + CLI wrapping key + redaction.
 * Not reachable as MiroirTest: crypto / startup / SecretStore internals.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
  ENTITY_MIROIR_SECRET_UUID,
  clearSecrets,
  clearSecretsMasterKey,
  decryptSecret,
  encryptSecret,
  hydrateSecrets,
  parseServerArgs,
  redactCredentialSecretsFromValue,
  registerSecrets,
  resolveSecret,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "secrets.270" ||
  RUN_TEST.startsWith("secrets.270") ||
  RUN_TEST === "secretsService.270.phase1";

const WRAPPING_KEY = "test-secrets-master";
const PLAINTEXT = "plain-secret-value";

afterEach(() => {
  clearSecrets();
  clearSecretsMasterKey();
});

if (runThis) {
  describe("secretsService.270.phase1", () => {
    it("encryptSecret/decryptSecret round-trips AES-256-GCM ciphertext", () => {
      const ciphertext = encryptSecret("aes-256-gcm", WRAPPING_KEY, PLAINTEXT);
      expect(ciphertext.startsWith("aes-256-gcm$")).toBe(true);
      expect(ciphertext.split("$")).toHaveLength(4);
      expect(decryptSecret("aes-256-gcm", WRAPPING_KEY, ciphertext)).toBe(PLAINTEXT);
    });

    it("wrong wrapping key fails closed without leaking plaintext", () => {
      const ciphertext = encryptSecret("aes-256-gcm", WRAPPING_KEY, PLAINTEXT);
      expect(() => decryptSecret("aes-256-gcm", "wrong-wrapping-key", ciphertext)).toThrow();
      try {
        decryptSecret("aes-256-gcm", "wrong-wrapping-key", ciphertext);
        expect.fail("expected decrypt to fail closed");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).not.toContain(PLAINTEXT);
      }
    });

    it("hydrateSecrets registers process-scoped names with source row", () => {
      const ciphertext = encryptSecret("aes-256-gcm", WRAPPING_KEY, "spotify-id-value");
      hydrateSecrets({
        wrappingKey: WRAPPING_KEY,
        rows: [{ name: "spotifyClientId", ciphertext }],
      });
      expect(resolveSecret("spotifyClientId")).toEqual({
        value: "spotify-id-value",
        scope: "process",
        source: "row",
      });
    });

    it("registerSecrets hatch resolves with source hatch", () => {
      registerSecrets({ n: "v" });
      expect(resolveSecret("n")).toEqual({
        value: "v",
        scope: "process",
        source: "hatch",
      });
    });

    it("parseServerArgs --secrets-master-key and env fallback; CLI wins; secrets map unchanged", () => {
      const parsed = parseServerArgs(["--secrets-master-key", "W", "--secret", "a=b"]);
      expect(parsed.secretsMasterKey).toBe("W");
      expect(parsed.secrets).toEqual({ a: "b" });

      const fromEnv = parseServerArgs([], { MIROIR_SECRETS_MASTER_KEY: "env-key" });
      expect(fromEnv.secretsMasterKey).toBe("env-key");
      expect(fromEnv.secrets).toEqual({});

      const cliWins = parseServerArgs(["--secrets-master-key", "cli-key", "--secret", "a=b"], {
        MIROIR_SECRETS_MASTER_KEY: "env-key",
      });
      expect(cliWins.secretsMasterKey).toBe("cli-key");
      expect(cliWins.secrets).toEqual({ a: "b" });
    });

    it("redactCredentialSecretsFromValue omits ciphertext on a MiroirSecret instance", () => {
      const instance = {
        uuid: "11111111-1111-4111-8111-111111111111",
        parentUuid: ENTITY_MIROIR_SECRET_UUID,
        name: "spotifyClientId",
        ciphertext: "aes-256-gcm$iv$cipher$tag",
      };
      const redacted = redactCredentialSecretsFromValue(instance) as Record<string, unknown>;
      expect(redacted).not.toHaveProperty("ciphertext");
      expect(redacted.name).toBe("spotifyClientId");
      expect(redacted.parentUuid).toBe(ENTITY_MIROIR_SECRET_UUID);
    });

    it("hydrateSecrets with rows and missing wrapping key throws without listing values", () => {
      const ciphertext = encryptSecret("aes-256-gcm", WRAPPING_KEY, PLAINTEXT);
      const rows = [{ name: "spotifyClientId", ciphertext }];
      expect(() => hydrateSecrets({ rows })).toThrow();
      try {
        hydrateSecrets({ rows });
        expect.fail("expected hydrate to fail closed");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        expect(message).not.toContain(PLAINTEXT);
        expect(message).not.toContain(ciphertext);
        expect(message).not.toContain("spotify-id-value");
      }
    });
  });
}

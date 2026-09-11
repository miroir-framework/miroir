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
  importProcessSecrets,
  miroirSecretInstanceUuid,
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

    it("miroirSecretInstanceUuid is stable per name+scope+owner and differs across owners", () => {
      const processA = miroirSecretInstanceUuid("spotifyRefreshToken", "process");
      const processB = miroirSecretInstanceUuid("spotifyRefreshToken", "process");
      const alice = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";
      const carol = "30634877-08ae-44f3-a230-d899e22333d5";
      expect(processA).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(processB).toBe(processA);
      expect(miroirSecretInstanceUuid("spotifyRefreshToken", "user", alice)).not.toBe(processA);
      expect(miroirSecretInstanceUuid("spotifyRefreshToken", "user", alice)).not.toBe(
        miroirSecretInstanceUuid("spotifyRefreshToken", "user", carol),
      );
    });

    it("importProcessSecrets assigns the deterministic process uuid", () => {
      const instances = importProcessSecrets({
        wrappingKey: WRAPPING_KEY,
        secrets: { aiGithubToken: "gh-plain" },
      });
      expect(instances).toHaveLength(1);
      expect((instances[0] as { uuid: string }).uuid).toBe(
        miroirSecretInstanceUuid("aiGithubToken", "process"),
      );
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

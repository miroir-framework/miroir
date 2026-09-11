/**
 * #270 Slice 6 — import-set assembly, importProcessSecrets, R7 fail-closed.
 * Not reachable as MiroirTest: startup / CLI / SecretStore internals.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  assembleSecretImportSet,
  clearSecrets,
  clearSecretsMasterKey,
  encryptSecret,
  hydrateSecrets,
  importProcessSecrets,
  parseServerArgs,
  resolveSecret,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "secrets.270" ||
  RUN_TEST.startsWith("secrets.270") ||
  RUN_TEST === "secretsImport.270" ||
  RUN_TEST.startsWith("secretsImport.270");

const WRAPPING_KEY = "test-secrets-master";
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const SERVER_TS = join(REPO_ROOT, "packages/miroir-server/src/server.ts");

afterEach(() => {
  clearSecrets();
  clearSecretsMasterKey();
});

if (runThis) {
  describe("secretsImport.270.phase6", () => {
    it("assembles the import set from --secret, MIROIR_SECRET_*, and the four AI key env aliases", () => {
      const env = {
        MIROIR_SECRET_fromEnv: "env-secret",
        AI_OPENAI_KEY: "oa-key",
        AI_ANTHROPIC_KEY: "ant-key",
        AI_GOOGLE_KEY: "go-key",
        AI_GITHUB_TOKEN: "gh-token",
        AI_PROVIDER_TYPE: "openai",
        AI_MODEL: "gpt-4o",
        LIVE_SPOTIFY_CLIENT_ID: "live-id",
      };
      const parsed = parseServerArgs(["--secret", "fromCli=cli-secret"], env);
      expect(parsed.secrets).toEqual({ fromCli: "cli-secret", fromEnv: "env-secret" });

      const importSet = assembleSecretImportSet(parsed.secrets, env);
      expect(importSet).toEqual({
        fromCli: "cli-secret",
        fromEnv: "env-secret",
        aiOpenaiKey: "oa-key",
        aiAnthropicKey: "ant-key",
        aiGoogleKey: "go-key",
        aiGithubToken: "gh-token",
      });
      expect(importSet).not.toHaveProperty("AI_PROVIDER_TYPE");
      expect(importSet).not.toHaveProperty("AI_MODEL");
      expect(importSet).not.toHaveProperty("LIVE_SPOTIFY_CLIENT_ID");
    });

    it("parsed --secret / MIROIR_SECRET_* wins over an AI env alias for the same name", () => {
      const env = {
        MIROIR_SECRET_aiGithubToken: "from-miroir-secret",
        AI_GITHUB_TOKEN: "from-ai-env",
      };
      const parsed = parseServerArgs([], env);
      expect(assembleSecretImportSet(parsed.secrets, env)).toEqual({
        aiGithubToken: "from-miroir-secret",
      });
    });

    it("import + wrapping key yields process instances; after env is cleared, hydrate resolves aiGithubToken", () => {
      const env = { AI_GITHUB_TOKEN: "gh-plain" };
      const importSet = assembleSecretImportSet(parseServerArgs([], env).secrets, env);
      const instances = importProcessSecrets({ wrappingKey: WRAPPING_KEY, secrets: importSet });

      expect(instances).toHaveLength(1);
      const row = instances[0] as Record<string, unknown>;
      expect(row.name).toBe("aiGithubToken");
      expect(row.parentUuid).toBe("a96856df-2b38-494a-8027-82617e2d64ad");
      expect(typeof row.ciphertext).toBe("string");
      expect(String(row.ciphertext).startsWith("aes-256-gcm$")).toBe(true);
      expect(row.miroirUser).toBeUndefined();

      delete env.AI_GITHUB_TOKEN;
      clearSecrets();
      hydrateSecrets({ wrappingKey: WRAPPING_KEY, rows: instances });
      expect(resolveSecret("aiGithubToken")).toEqual({
        value: "gh-plain",
        scope: "process",
        source: "row",
      });
    });

    it("import set non-empty + no wrapping key throws mentioning wrapping key", () => {
      const secrets = { aiGithubToken: "gh-plain" };
      expect(() => importProcessSecrets({ secrets })).toThrow(/wrapping key/i);
      expect(() => importProcessSecrets({ wrappingKey: "", secrets })).toThrow(/wrapping key/i);
    });

    it("rows + no wrapping key → hydrate throws", () => {
      const ciphertext = encryptSecret("aes-256-gcm", WRAPPING_KEY, "plain-value");
      expect(() =>
        hydrateSecrets({ rows: [{ name: "alreadyStored", ciphertext }] }),
      ).toThrow(/wrapping key/i);
    });

    it("no rows + no wrapping key + empty import → empty store (resolve fails closed)", () => {
      const importSet = assembleSecretImportSet({}, {});
      expect(importSet).toEqual({});
      const instances = importProcessSecrets({ secrets: importSet });
      expect(instances).toEqual([]);
      hydrateSecrets({ rows: [] });
      expect(() => resolveSecret("aiGithubToken")).toThrow(/Unknown or empty secret/);
    });

    it("server.ts does not register parsed.secrets as the standing runtime source", () => {
      expect(existsSync(SERVER_TS)).toBe(true);
      const source = readFileSync(SERVER_TS, "utf8");
      expect(source).not.toMatch(/registerSecrets\(\s*parsed\.secrets\s*\)/);
    });
  });
}

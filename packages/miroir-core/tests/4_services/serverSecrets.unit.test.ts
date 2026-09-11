/**
 * Named server secrets — named secrets, CLI parse, redaction, no process.env dump.
 * Not MiroirTest-reachable: startup/config internals (miroir-server has no vitest).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import {
  clearSecrets,
  parseServerArgs,
  ParseServerArgsError,
  redactCredentialSecretsFromValue,
  registerSecrets,
  resolveSecret,
} from "miroir-core";

const RUN_TEST = process.env.RUN_TEST;
const shouldRun =
  !RUN_TEST ||
  RUN_TEST === "serverSecrets" ||
  RUN_TEST === "serverSecrets.unit.test";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const SERVER_TS = join(REPO_ROOT, "packages/miroir-server/src/server.ts");

afterEach(() => {
  clearSecrets();
});

describe.skipIf(!shouldRun)("serverSecrets — SecretStore + parseServerArgs + redaction", () => {
  it("parseServerArgs([--secret, a=b]) returns secret map {a:b}", () => {
    const parsed = parseServerArgs(["--secret", "a=b"]);
    expect(parsed.secrets).toEqual({ a: "b" });
  });

  it("parseServerArgs --secret is repeatable", () => {
    const parsed = parseServerArgs(["--secret", "a=b", "--secret", "c=d"]);
    expect(parsed.secrets).toEqual({ a: "b", c: "d" });
  });

  it("parseServerArgs rejects malformed --secret with a usage error", () => {
    expect(() => parseServerArgs(["--secret"])).toThrow(ParseServerArgsError);
    expect(() => parseServerArgs(["--secret", "nocolon"])).toThrow(ParseServerArgsError);
    expect(() => parseServerArgs(["--secret", "=novalue"])).toThrow(ParseServerArgsError);
    expect(() => parseServerArgs(["--secret", "empty="])).toThrow(ParseServerArgsError);
    try {
      parseServerArgs(["--secret", "nocolon"]);
      expect.fail("expected usage error");
    } catch (error) {
      expect(error).toBeInstanceOf(ParseServerArgsError);
      expect(String(error)).toMatch(/usage|Usage|--secret/i);
    }
  });

  it("parseServerArgs still rejects unknown options", () => {
    expect(() => parseServerArgs(["--not-a-real-flag"])).toThrow(ParseServerArgsError);
    try {
      parseServerArgs(["--not-a-real-flag"]);
      expect.fail("expected unknown-option error");
    } catch (error) {
      expect(error).toBeInstanceOf(ParseServerArgsError);
      expect(String(error)).toMatch(/Unknown option/i);
    }
  });

  it("MIROIR_SECRET_<NAME> env fallback; CLI wins over env", () => {
    const envOnly = parseServerArgs([], { MIROIR_SECRET_fromEnv: "env-value" });
    expect(envOnly.secrets).toEqual({ fromEnv: "env-value" });

    const cliWins = parseServerArgs(["--secret", "shared=cli-value"], {
      MIROIR_SECRET_shared: "env-value",
      MIROIR_SECRET_onlyEnv: "env-only",
    });
    expect(cliWins.secrets).toEqual({
      shared: "cli-value",
      onlyEnv: "env-only",
    });
  });

  it("parseServerArgs does not register secrets into the runtime store", () => {
    parseServerArgs(["--secret", "a=b"]);
    expect(() => resolveSecret("a")).toThrow(/Unknown or empty secret/);
  });

  it("resolveSecret unknown or empty fails closed without leaking the map", () => {
    registerSecrets({ fakeSpotify: "test-token", other: "keep-secret" });
    expect(() => resolveSecret("nope")).toThrow();
    expect(() => resolveSecret("")).toThrow();
    try {
      resolveSecret("nope");
      expect.fail("expected fail-closed error");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toMatch(/test-token/);
      expect(message).not.toMatch(/keep-secret/);
      expect(message).not.toMatch(/fakeSpotify/);
      expect(message).not.toMatch(/other/);
    }
    registerSecrets({ emptyOne: "" });
    expect(() => resolveSecret("emptyOne")).toThrow();
  });

  it("redactCredentialSecretsFromValue redacts registered values and sensitive keys", () => {
    registerSecrets({ fakeSpotify: "test-token" });
    const redacted = redactCredentialSecretsFromValue({
      authorization: "Bearer visible-if-not-redacted",
      Authorization: "Bearer also",
      token: "abc",
      TOKEN: "ABC",
      credential: "cred",
      secret: "sec",
      note: "prefix test-token suffix",
      nested: { token: "inner", safe: "ok" },
      passwordHash: "should-remain-unless-credential-row",
    }) as Record<string, unknown>;

    expect(redacted.authorization).toBe("[REDACTED]");
    expect(redacted.Authorization).toBe("[REDACTED]");
    expect(redacted.token).toBe("[REDACTED]");
    expect(redacted.TOKEN).toBe("[REDACTED]");
    expect(redacted.credential).toBe("[REDACTED]");
    expect(redacted.secret).toBe("[REDACTED]");
    expect(redacted.note).toBe("prefix [REDACTED] suffix");
    expect((redacted.nested as Record<string, unknown>).token).toBe("[REDACTED]");
    expect((redacted.nested as Record<string, unknown>).safe).toBe("ok");
  });

  it("server.ts source contains no live process.env dump", () => {
    expect(existsSync(SERVER_TS)).toBe(true);
    const source = readFileSync(SERVER_TS, "utf8");
    expect(source).not.toMatch(/JSON\.stringify\(\s*process\.env/);
    expect(source).not.toMatch(/myLogger\.\w+\(`process\.env`/);
    expect(source).not.toMatch(/myLogger\.\w+\(['"]process\.env['"]/);
  });
});

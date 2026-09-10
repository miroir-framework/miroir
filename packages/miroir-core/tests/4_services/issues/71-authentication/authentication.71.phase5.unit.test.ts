/**
 * #71 Slice 5 — login gate helper and Authorization header.
 */
import { describe, expect, it } from "vitest";

import { isUsableBearerToken, issueBearerToken } from "../../../../src/1_core/authentication/AuthenticationPolicy.js";
import {
  authorizationHeaders,
  nextPageWhenAuthGate,
} from "../../../../src/1_core/authentication/AuthenticationUi.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "authentication.71" ||
  RUN_TEST.startsWith("authentication.71");

if (runThis) {
  describe("authentication.71.phase5 login gate", () => {
    it("does not redirect when auth is off", () => {
      expect(
        nextPageWhenAuthGate({
          enabled: false,
          hasToken: false,
          intended: "/?page=home",
        }),
      ).toBe("/?page=home");
    });

    it("sends unauthenticated users to login and preserves the intended query", () => {
      expect(
        nextPageWhenAuthGate({
          enabled: true,
          hasToken: false,
          intended: "/?page=report&application=x",
        }),
      ).toBe("/?page=login&return=%2F%3Fpage%3Dreport%26application%3Dx");
    });

    it("keeps the intended page when a token is present", () => {
      expect(
        nextPageWhenAuthGate({
          enabled: true,
          hasToken: true,
          intended: "/?page=settings",
        }),
      ).toBe("/?page=settings");
    });

    it("authorizationHeaders is empty without a token and Bearer with one", () => {
      expect(authorizationHeaders(undefined)).toEqual({});
      expect(authorizationHeaders("tok")).toEqual({ Authorization: "Bearer tok" });
    });

    it("treats a server-issued token as usable even when Buffer has no base64url (browser polyfill)", async () => {
      const token = await issueBearerToken(
        { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" },
        "test-secret-71",
      );
      const originalFrom = Buffer.from;
      Buffer.from = ((value: unknown, encoding?: unknown) => {
        if (encoding === "base64url") {
          throw new Error("browser Buffer polyfill has no base64url");
        }
        return originalFrom.call(Buffer, value as string, encoding as BufferEncoding);
      }) as typeof Buffer.from;
      try {
        expect(isUsableBearerToken(token)).toBe(true);
        expect(
          nextPageWhenAuthGate({
            enabled: true,
            hasToken: isUsableBearerToken(token),
            intended: "/?page=home",
          }),
        ).toBe("/?page=home");
      } finally {
        Buffer.from = originalFrom;
      }
    });
  });
}

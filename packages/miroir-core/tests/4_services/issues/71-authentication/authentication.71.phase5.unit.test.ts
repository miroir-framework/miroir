/**
 * #71 Slice 5 — login gate helper and Authorization header.
 */
import { describe, expect, it } from "vitest";

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
  });
}

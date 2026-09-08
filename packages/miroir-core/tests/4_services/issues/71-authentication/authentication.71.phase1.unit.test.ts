/**
 * #71 Slice 1 — hatch, status body, reject unauthenticated when on.
 */
import { describe, expect, it } from "vitest";

import {
  assertRequestAllowed,
  buildAuthStatusBody,
  resolveAuthenticationEnabled,
  type AuthPrincipal,
} from "../../../../src/1_core/authentication/AuthenticationPolicy.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis =
  !RUN_TEST ||
  RUN_TEST === "authentication.71" ||
  RUN_TEST.startsWith("authentication.71");

const ALICE: AuthPrincipal = {
  miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267",
  username: "alice",
};

if (runThis) {
  describe("authentication.71.phase1 hatch resolver", () => {
    it("defaults to enabled when nothing is passed", () => {
      expect(resolveAuthenticationEnabled({})).toBe(true);
    });

    it("honors --disable-auth", () => {
      expect(resolveAuthenticationEnabled({ argv: ["--disable-auth"] })).toBe(false);
    });

    it("honors --enable-auth over env and config off", () => {
      expect(
        resolveAuthenticationEnabled({
          argv: ["--enable-auth"],
          env: { MIROIR_AUTH_ENABLED: "0" },
          config: { enabled: false },
        }),
      ).toBe(true);
    });

    it("honors MIROIR_AUTH_ENABLED=0", () => {
      expect(resolveAuthenticationEnabled({ env: { MIROIR_AUTH_ENABLED: "0" } })).toBe(false);
    });

    it("honors config enabled false", () => {
      expect(resolveAuthenticationEnabled({ config: { enabled: false } })).toBe(false);
    });

    it("CLI disable beats env 1 beats config true", () => {
      expect(
        resolveAuthenticationEnabled({
          argv: ["--disable-auth"],
          env: { MIROIR_AUTH_ENABLED: "1" },
          config: { enabled: true },
        }),
      ).toBe(false);
    });
  });

  describe("authentication.71.phase1 status and gate", () => {
    it("buildAuthStatusBody returns only enabled", () => {
      expect(buildAuthStatusBody(false)).toEqual({ enabled: false });
      expect(buildAuthStatusBody(true)).toEqual({ enabled: true });
    });

    it("allows missing principal when hatch is off", () => {
      expect(assertRequestAllowed({ enabled: false, principal: undefined })).toEqual({
        allowed: true,
      });
    });

    it("denies missing principal when hatch is on", () => {
      expect(assertRequestAllowed({ enabled: true, principal: undefined })).toEqual({
        allowed: false,
        status: 401,
        body: { status: "error", errorType: "AuthenticationRequired" },
      });
    });

    it("allows a principal when hatch is on", () => {
      expect(assertRequestAllowed({ enabled: true, principal: ALICE })).toEqual({
        allowed: true,
      });
    });
  });
}

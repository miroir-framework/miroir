import { afterEach, describe, expect, it } from "vitest";

import {
  getAuthenticationEnabled,
  setAuthenticationEnabled,
  setAuthToken,
} from "../../src/miroir-fwk/4_view/auth/authSession.js";
import { testbedAccessGrantFromAuthSession } from "../../src/miroir-fwk/4-tests/testbedAccessGrantFromAuthSession.js";

const ALICE_UUID = "1c39328c-7de4-44ae-bcf1-5bbc38d8e267";

function unsignedToken(miroirUserUuid: string): string {
  const payload = JSON.stringify({
    u: miroirUserUuid,
    n: "alice",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  return `${Buffer.from(payload).toString("base64url")}.sig`;
}

describe("testbedAccessGrantFromAuthSession", () => {
  afterEach(() => {
    setAuthenticationEnabled(false);
    setAuthToken(undefined);
  });

  it("returns the principal when auth is on and a usable token is present", () => {
    setAuthenticationEnabled(true);
    setAuthToken(unsignedToken(ALICE_UUID));
    expect(testbedAccessGrantFromAuthSession()).toEqual({ miroirUserUuid: ALICE_UUID });
  });

  it("returns undefined when auth is off even if a token is present", () => {
    expect(getAuthenticationEnabled()).toBe(false);
    setAuthToken(unsignedToken(ALICE_UUID));
    expect(testbedAccessGrantFromAuthSession()).toBeUndefined();
  });

  it("returns undefined when auth is on but no token is present", () => {
    setAuthenticationEnabled(true);
    expect(testbedAccessGrantFromAuthSession()).toBeUndefined();
  });
});

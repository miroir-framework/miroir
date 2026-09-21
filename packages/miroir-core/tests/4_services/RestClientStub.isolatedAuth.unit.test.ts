/**
 * Isolated emulated UI sessions construct a RestClientStub without an identity
 * directory. The browser `process.env` object often has no MIROIR_AUTH_ENABLED
 * (Vite does not define it for the app), so resolveAuthenticationEnabled
 * defaults ON. Without a directory or Bearer, every action 401s — including
 * CreateAdminApplication on Admin.
 *
 * Contract: auth is enforced only when an identity directory is installed
 * (the live host stub). Isolated test stubs skip the gate.
 */
import { afterEach, describe, expect, it } from "vitest";

import { issueBearerToken } from "../../src/1_core/authentication/AuthenticationPolicy.js";
import { RestClientStub } from "../../src/4_services/RestClientStub.js";
import {
  setRestClientAuthorizationTokenGetter,
} from "../../src/4_services/RestClient.js";

describe("RestClientStub isolated auth", () => {
  const previousAuth = process.env.MIROIR_AUTH_ENABLED;

  afterEach(() => {
    setRestClientAuthorizationTokenGetter(undefined);
    if (previousAuth === undefined) {
      delete process.env.MIROIR_AUTH_ENABLED;
    } else {
      process.env.MIROIR_AUTH_ENABLED = previousAuth;
    }
  });

  it("does not 401 when identity directory is unset, even if process auth defaults on", async () => {
    process.env.MIROIR_AUTH_ENABLED = "1";
    const stub = new RestClientStub("http://test");
    await expect(stub.call("/action", "post", "/action", { body: {} })).rejects.toThrow(
      "RestClientStub: persistenceStoreControllerManager is not set",
    );
  });

  it("does not verify a SPA Bearer when identity directory is unset (browser Buffer has no base64url)", async () => {
    process.env.MIROIR_AUTH_ENABLED = "1";
    const token = await issueBearerToken(
      { miroirUserUuid: "1c39328c-7de4-44ae-bcf1-5bbc38d8e267", username: "alice" },
      "test-secret-isolated",
    );
    setRestClientAuthorizationTokenGetter(() => token);
    const originalToString = Buffer.prototype.toString;
    Buffer.prototype.toString = function (encoding?: string) {
      if (encoding === "base64url") {
        throw new Error("Unknown encoding: base64url");
      }
      return originalToString.call(this, encoding);
    };
    try {
      const stub = new RestClientStub("http://test");
      await expect(stub.call("/action", "post", "/action", { body: {} })).rejects.toThrow(
        "RestClientStub: persistenceStoreControllerManager is not set",
      );
    } finally {
      Buffer.prototype.toString = originalToString;
    }
  });
});

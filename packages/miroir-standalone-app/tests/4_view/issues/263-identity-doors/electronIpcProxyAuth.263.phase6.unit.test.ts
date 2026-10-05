/**
 * #263 Slice 6: in Electron the renderer sends the session Bearer on every data IPC message,
 * clears the session when the main process answers AuthenticationRequired, and asks the main
 * process (not fetch) for /auth/status and /auth/login. `window.electronAPI` is a recording stub.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  setRestClientAuthorizationInvalidationHandler,
  setRestClientAuthorizationTokenGetter,
} from "miroir-core";

import { fetchAuthenticationEnabled, requestLoginToken } from "../../../../src/miroir-fwk/4_view/auth/authTransport.js";
import {
  ElectronRestClient,
  ElectronServerDomainControllerProxy,
} from "../../../../src/miroir-fwk/4_view/services/ElectronIpcProxy.js";

const RUN_TEST = process.env.RUN_TEST;
const runThis = !RUN_TEST || RUN_TEST.startsWith("electronIpcProxyAuth.263");

let sent: Array<Record<string, any>>;
let answer: (message: Record<string, any>) => any;
let invalidated: number;

if (runThis) {
  describe("electronIpcProxyAuth.263.phase6 renderer IPC identity", () => {
    beforeEach(() => {
      sent = [];
      invalidated = 0;
      answer = () => ({ status: 200, data: {}, headers: {} });
      (window as any).electronAPI = {
        callMiroirIpc: async (message: Record<string, any>) => {
          sent.push(message);
          return answer(message);
        },
      };
      setRestClientAuthorizationInvalidationHandler(() => {
        invalidated += 1;
      });
    });

    afterEach(() => {
      delete (window as any).electronAPI;
      setRestClientAuthorizationTokenGetter(undefined);
      setRestClientAuthorizationInvalidationHandler(undefined);
    });

    it("sends the session Bearer on rest-call, server-action and server-query", async () => {
      setRestClientAuthorizationTokenGetter(() => "token-263");
      const proxy = new ElectronServerDomainControllerProxy();
      await new ElectronRestClient().get("/x", "/x");
      await proxy.handleAction({ actionType: "a" }, {});
      await proxy.handleBoxedExtractorOrQueryAction({ actionType: "q" } as any, {});
      expect(sent.map((message) => [message.type, message.authorization])).toEqual([
        ["rest-call", "Bearer token-263"],
        ["server-action", "Bearer token-263"],
        ["server-query", "Bearer token-263"],
      ]);
    });

    it("sends no authorization without a session", async () => {
      await new ElectronRestClient().get("/x", "/x");
      expect(sent[0].authorization).toBeUndefined();
    });

    it("clears the session on AuthenticationRequired, from rest-call and from server-query", async () => {
      answer = (message) =>
        message.type === "rest-call"
          ? { status: 401, data: { status: "error", errorType: "AuthenticationRequired" } }
          : { status: "error", errorType: "AuthenticationRequired", errorMessage: "Authentication required" };
      await new ElectronRestClient().get("/x", "/x");
      const result = await new ElectronServerDomainControllerProxy().handleBoxedExtractorOrQueryAction({} as any, {});
      expect(invalidated).toBe(2);
      expect(result).toMatchObject({ status: "error", errorType: "AuthenticationRequired" });
    });

    it("keeps the session on AccessDenied", async () => {
      answer = () => ({ status: "error", errorType: "AccessDenied", errorMessage: "Access denied" });
      await new ElectronServerDomainControllerProxy().handleAction({}, {});
      expect(invalidated).toBe(0);
    });

    it("asks the main process for /auth/status and /auth/login", async () => {
      answer = (message) =>
        message.endpoint === "/auth/status"
          ? { status: 200, data: { enabled: true } }
          : message.args.body.password === "alice-dev"
            ? { status: 200, data: { token: "alice-token" } }
            : { status: 401, data: { status: "error", errorType: "AuthenticationFailed" } };
      expect(await fetchAuthenticationEnabled()).toBe(true);
      expect(await requestLoginToken("alice", "alice-dev")).toBe("alice-token");
      expect(await requestLoginToken("alice", "wrong")).toBeUndefined();
      expect(sent.map((message) => [message.type, message.endpoint])).toEqual([
        ["rest-call", "/auth/status"],
        ["rest-call", "/auth/login"],
        ["rest-call", "/auth/login"],
      ]);
    });
  });
}

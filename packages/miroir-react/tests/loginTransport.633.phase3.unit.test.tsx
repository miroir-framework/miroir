// @vitest-environment happy-dom
/**
 * #633 D5: the login page of miroir-react asks the shell host for a token; a host that gives no
 * transport logs in over HTTP (`/auth/login`), the Electron app gives its IPC transport.
 * Not reachable through MiroirTest: the browser login transport, not a model element.
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { requestLoginTokenOverHttp } from "../src/auth/httpLogin.js";
import {
  MiroirShellHostProvider,
  useMiroirShellHost,
  type MiroirShellHost,
  type RequestLoginToken,
} from "../src/contexts/MiroirShellHostContext.js";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
const realFetch = globalThis.fetch;
let requests: { url: string; init?: RequestInit }[];

function answer(status: number, body: unknown) {
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    requests.push({ url, init });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
}

beforeEach(() => {
  requests = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  globalThis.fetch = realFetch;
  act(() => root.unmount());
  container.remove();
});

function loginOf(host: MiroirShellHost | undefined): RequestLoginToken {
  let requestLoginToken: RequestLoginToken | undefined;
  const Probe = () => {
    requestLoginToken = useMiroirShellHost().requestLoginToken;
    return null;
  };
  act(() => root.render(host ? <MiroirShellHostProvider host={host}><Probe /></MiroirShellHostProvider> : <Probe />));
  return requestLoginToken!;
}

describe("login transport of the shell host (#633 D5)", () => {
  it("posts the credentials to /auth/login when the host gives no transport", async () => {
    answer(200, { token: "a-token" });
    const token = await loginOf(undefined)("alice", "secret");
    expect(token).toBe("a-token");
    expect(requests.map((r) => [r.url, r.init?.method, r.init?.body])).toEqual([
      ["/auth/login", "POST", JSON.stringify({ username: "alice", password: "secret" })],
    ]);
  });

  it("gives no token when the server refuses the credentials", async () => {
    answer(401, { error: "Authentication failed" });
    expect(await requestLoginTokenOverHttp("alice", "wrong")).toBeUndefined();
  });

  it("uses the host's transport, and no HTTP call, when the host gives one", async () => {
    answer(200, { token: "http-token" });
    const calls: string[][] = [];
    const login = loginOf({
      requestLoginToken: async (username, password) => {
        calls.push([username, password]);
        return "ipc-token";
      },
    });
    expect(await login("alice", "secret")).toBe("ipc-token");
    expect(calls).toEqual([["alice", "secret"]]);
    expect(requests).toEqual([]);
  });
});

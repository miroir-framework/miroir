/**
 * #636 Slice 2 — authentication status, process capabilities, login and password change from
 * createMiroirServerApp.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ConfigurationService, getClientEnvironment, getProcessCapabilities } from "miroir-core";

import { createMiroirServerApp, type MiroirServerApp } from "../../../src/index.js";
import {
  BOOK_ENTITY,
  LIBRARY_DEPLOYMENT,
  listen,
  startServerTestPlatform,
  type Listening,
  type ServerTestPlatform,
} from "../../support/serverTestPlatform.js";

let platform: ServerTestPlatform;

async function startApp(authenticationEnabled: boolean): Promise<{ miroir: MiroirServerApp; http: Listening }> {
  const miroir = await createMiroirServerApp({
    ...platform,
    authentication: { enabled: authenticationEnabled, mcpEnabled: false },
  });
  return { miroir, http: await listen(miroir.app) };
}

async function postJson(url: string, body: unknown, token?: string): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
}

async function login(baseUrl: string, username: string, password: string): Promise<Response> {
  return postJson(`${baseUrl}/auth/login`, { username, password });
}

beforeAll(async () => {
  platform = await startServerTestPlatform();
});

describe("serverApp.636.phase2 — without authentication", () => {
  let started: { miroir: MiroirServerApp; http: Listening };
  beforeAll(async () => {
    started = await startApp(false);
  });
  afterAll(async () => {
    await started.http.close();
    await started.miroir.close();
  });

  it("says authentication is off", async () => {
    const response = await fetch(`${started.http.baseUrl}/auth/status`);
    expect(await response.json()).toEqual({ enabled: false });
  });

  it("answers the process capabilities", async () => {
    const response = await fetch(`${started.http.baseUrl}/capabilities`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      capabilities: getProcessCapabilities({
        config: platform.miroirConfig,
        environment: getClientEnvironment(),
        storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
        adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
      }),
    });
  });
});

describe("serverApp.636.phase2 — with authentication", () => {
  let started: { miroir: MiroirServerApp; http: Listening };
  beforeAll(async () => {
    started = await startApp(true);
  });
  afterAll(async () => {
    await started.http.close();
    await started.miroir.close();
  });

  it("says authentication is on", async () => {
    const response = await fetch(`${started.http.baseUrl}/auth/status`);
    expect(await response.json()).toEqual({ enabled: true });
  });

  it("logs alice in, and her token opens REST", async () => {
    const loggedIn = await login(started.http.baseUrl, "alice", "alice-dev");
    expect(loggedIn.status).toBe(200);
    const { token } = await loggedIn.json();
    const response = await fetch(`${started.http.baseUrl}/CRUD/${LIBRARY_DEPLOYMENT}/data/entity/${BOOK_ENTITY}/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
  });

  it("refuses a wrong password", async () => {
    const response = await login(started.http.baseUrl, "alice", "not-alice-dev");
    expect(response.status).toBe(401);
  });

  it("changes alice's password", async () => {
    const { token } = await (await login(started.http.baseUrl, "alice", "alice-dev")).json();
    const changed = await postJson(
      `${started.http.baseUrl}/auth/change-password`,
      { currentPassword: "alice-dev", newPassword: "alice-dev-636" },
      token,
    );
    expect(await changed.json()).toEqual({ changed: true });
    expect((await login(started.http.baseUrl, "alice", "alice-dev-636")).status).toBe(200);
  });
});

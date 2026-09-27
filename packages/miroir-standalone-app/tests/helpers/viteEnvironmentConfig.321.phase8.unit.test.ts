// @vitest-environment node
// #321 Slice 8: the web client served or built by Vite gets the client configuration of the selected
// environment (MIROIR_ENV, environments/local.json, dev), injected as __MIROIR_CLIENT_CONFIG__, and
// Vite proxies the API to that environment's server. vitest, not MiroirTest: Vite configuration and
// process environment selection.
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import viteConfig from "../../vite.config.js";
import { MIROIR_CLIENT_CONFIG, webClientEnvironment } from "../../vite/environmentConfig.js";
import { resolveRepoRoot } from "./integrationTestProfiles.js";

const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const repositoryRoot = resolveRepoRoot();

const savedEnv = { ...process.env };
afterEach(() => {
  process.env = { ...savedEnv };
});

function injectedClientConfig(define: Record<string, string> | undefined): any {
  const injected = define?.[MIROIR_CLIENT_CONFIG];
  return injected === undefined ? undefined : JSON.parse(injected);
}

describe("the web client configuration comes from the selected environment", () => {
  it("vite.config.js, served with MIROIR_ENV=dev, injects the client configuration of dev and proxies to its server", async () => {
    process.env.MIROIR_ENV = "dev";
    const config = await (viteConfig as any)({ command: "serve", mode: "development" });

    const clientConfig = injectedClientConfig(config.define);
    expect(clientConfig.miroirConfigType).toBe("client");
    expect(clientConfig.client.emulateServer).toBe(false);
    expect(clientConfig.client.serverConfig.rootApiUrl).toMatch(/^https?:\/\/localhost:3080$/);
    expect(clientConfig.environment).toEqual({ name: "dev", appsDirectory: ".miroir/dev/apps" });
    // ConfigurationService opens nothing without the Admin deployment; its data is the state of dev
    expect(clientConfig.client.serverConfig.storeSectionConfiguration[ADMIN_DEPLOYMENT].data).toEqual({
      emulatedServerType: "filesystem",
      directory: ".miroir/dev/admin/data",
    });
    // the server owns the process capabilities (#273): the client configuration names no features
    expect(clientConfig.features).toBeUndefined();

    for (const route of ["/action", "/query", "/queryTemplate", "/CRUD", "/auth", "/capabilities", "/mcp"]) {
      expect(config.server.proxy[route].target).toBe(clientConfig.client.serverConfig.rootApiUrl);
    }
  });

  it("vitest runs of the same configuration inject nothing: tests select their own environment", async () => {
    process.env.MIROIR_ENV = "test-filesystem";
    const config = await (viteConfig as any)({ command: "serve", mode: "test" });
    expect(injectedClientConfig(config.define)).toBeUndefined();
  });

  it("served without certificates, the client calls the server over HTTP like the server listens; a build keeps the environment's URL", () => {
    const env = { MIROIR_ENV: "dev" };
    const url = (command: "serve" | "build", tls: boolean) =>
      webClientEnvironment({ cwd: repositoryRoot, env, command, tls }).clientConfig.client.serverConfig.rootApiUrl;
    expect(url("serve", true)).toBe("https://localhost:3080");
    expect(url("serve", false)).toBe("http://localhost:3080");
    expect(url("build", false)).toBe("https://localhost:3080");
  });

  it("names the environment and why it was selected, and never puts a database password in the browser", () => {
    const web = webClientEnvironment({
      cwd: repositoryRoot,
      env: { MIROIR_ENV: "test-sql", MIROIR_POSTGRES_PASSWORD: "not-for-the-browser" },
      command: "serve",
      tls: true,
    });
    expect(web.name).toBe("test-sql");
    expect(web.source).toBe("MIROIR_ENV");
    expect(JSON.stringify(web.define)).not.toContain("not-for-the-browser");
    expect(web.define[MIROIR_CLIENT_CONFIG]).toContain("postgres://postgres@localhost:5432");
    // test-sql runs its tests on an emulated server; the web client still calls a server
    expect(web.warnings).toEqual([
      'environment "test-sql" runs its client on an emulated server (tests): the web client calls its server at https://localhost:3080 instead',
    ]);
  });

  it("index.tsx reads the injected configuration, not configuration files of its own", () => {
    const source = readFileSync(path.join(repositoryRoot, "packages/miroir-standalone-app/src/index.tsx"), "utf-8");
    expect(source).toContain(MIROIR_CLIENT_CONFIG);
    expect(source).not.toMatch(/assets\/miroirConfig[^"']*\.json/);
    expect(source).not.toContain("webMiroirConfigName");
  });
});

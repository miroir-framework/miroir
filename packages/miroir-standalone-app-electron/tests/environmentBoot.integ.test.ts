// #345 Slices 6-7: the Electron main process runs an environment. Packaged, it prepares the
// `desktop` environment in <userData>/miroir from the resources electron-builder ships
// (build.extraResources of package.json), then boots it like miroir-server. vitest, not MiroirTest:
// main-process wiring on filesystem stores (environmentBoot.ts has no `electron` import).
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

import { ELECTRON_LOOPBACK_ROOT_API_URL, ENTITY_DEPLOYMENT_UUID, miroirCoreStartup } from "miroir-core";

import { bootElectronServer, DESKTOP_ENVIRONMENT, prepareDesktopRoot } from "../src/environmentBoot";

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";

type ExtraResource = { from: string; to: string; filter?: string[] };

/** resources/miroir-assets as electron-builder lays it out from build.extraResources. */
function packagedResources(): string {
  const resources = mkdtempSync(path.join(tmpdir(), "miroir-electron-resources-"));
  const packageJson = JSON.parse(readFileSync(path.join(packageDirectory, "package.json"), "utf-8"));
  const entries: ExtraResource[] = packageJson.build.extraResources;
  for (const entry of entries.filter((e) => e.to.startsWith("miroir-assets/"))) {
    const from = path.resolve(packageDirectory, entry.from);
    const to = path.join(resources, entry.to.slice("miroir-assets/".length));
    // the Library bundles (built files the quickstart installs, not needed to boot) are left out
    if (!entry.to.startsWith("miroir-assets/bundles")) {
      cpSync(from, to, { recursive: true });
    }
  }
  return path.join(resources);
}

const deploymentRows = (root: string) =>
  readdirSync(path.join(root, "miroir-app-admin/assets/admin_data", ENTITY_DEPLOYMENT_UUID));

describe("the packaged Electron application", () => {
  beforeAll(() => {
    miroirCoreStartup();
  });

  it("seeds <userData>/miroir from its resources on first start, without generated Admin rows", () => {
    const userData = mkdtempSync(path.join(tmpdir(), "miroir-electron-userdata-"));

    const root = prepareDesktopRoot({ resources: packagedResources(), userData });

    expect(root).toBe(path.join(userData, "miroir"));
    expect(existsSync(path.join(root, "environments/desktop.json"))).toBe(true);
    expect(existsSync(path.join(root, "miroir-app-admin/assets/admin_data"))).toBe(true);
    expect(deploymentRows(root)).toEqual([]);
  });

  it("keeps user data at later starts and only adds missing environment definitions", () => {
    const userData = mkdtempSync(path.join(tmpdir(), "miroir-electron-userdata-"));
    const resources = packagedResources();
    const root = prepareDesktopRoot({ resources, userData });
    const userFile = path.join(root, "miroir-app-admin/assets/admin_data/user-file.json");
    writeFileSync(userFile, "{}");
    mkdirSync(path.join(resources, "environments"), { recursive: true });
    writeFileSync(path.join(resources, "environments/other.json"), JSON.stringify({ name: "other" }));

    prepareDesktopRoot({ resources, userData });

    expect(existsSync(userFile)).toBe(true);
    expect(readdirSync(path.join(root, "environments")).sort()).toEqual(["desktop.json", "other.json"]);
  });

  it("boots the desktop environment: every deployment opened, loopback client configuration", async () => {
    const userData = mkdtempSync(path.join(tmpdir(), "miroir-electron-userdata-"));
    const root = prepareDesktopRoot({ resources: packagedResources(), userData });
    const lines: string[] = [];

    const server = await bootElectronServer(
      { cwd: root, env: { MIROIR_ROOT: root, MIROIR_ENV: DESKTOP_ENVIRONMENT } },
      (line) => lines.push(line),
    );

    expect(server.environment.name).toBe(DESKTOP_ENVIRONMENT);
    expect(Object.values(server.applicationDeploymentMap)).toEqual(
      expect.arrayContaining([ADMIN_DEPLOYMENT, MIROIR_DEPLOYMENT]),
    );
    expect(lines.filter((line) => line.startsWith("warning"))).toEqual([]);
    expect(deploymentRows(root).sort()).toEqual(
      [ADMIN_DEPLOYMENT, MIROIR_DEPLOYMENT].map((uuid) => `${uuid}.json`).sort(),
    );
    expect(server.serverConfig.server.rootApiUrl).toBe(ELECTRON_LOOPBACK_ROOT_API_URL);
    expect(server.serverConfig.features).toEqual({ designerTools: true, ai: true, mcp: true });
    expect(server.clientConfig.client.rootApiUrl).toBe(ELECTRON_LOOPBACK_ROOT_API_URL);
    expect(server.clientConfig.client.emulateServer).toBe(true);
  });
});

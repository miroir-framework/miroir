// #345 Slice 4: an environment runs outside a checkout. MIROIR_ROOT names the directory holding
// environments/ and the package assets (Docker's /data, packaged Electron's user data), and
// `packagesDirectory: "."` puts the package assets at <root>/<package>/assets, the layout of those
// directories. vitest, not MiroirTest: boot wiring on a real DomainController and filesystem stores.
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { ConfigurationService, ENTITY_DEPLOYMENT_UUID, miroirCoreStartup } from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import { hasEnvironmentDefinitions } from "../src/index";
import { boot, readRows } from "./bootTestSupport";
import { repositoryRoot } from "./cliTestSupport";

const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";

const application = (packageName: string, selfApplication: string, deployment: string) => ({
  package: packageName,
  selfApplication,
  deployment,
  store: "filesystem",
  mode: "live",
});

/** A directory laid out like a Docker /data volume: environments/ and <package>/assets, no package.json. */
function standaloneRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), "miroir-env-root-"));
  mkdirSync(path.join(root, "environments"));
  writeFileSync(
    path.join(root, "environments/standalone.json"),
    JSON.stringify({
      server: { rootApiUrl: "http://localhost:3080" },
      packagesDirectory: ".",
      applications: {
        miroir: application("miroir-app-miroir", "360fcf1f-f0d4-4f8a-9262-07886e70fa15", "10ff36f2-50a3-48d8-b80f-e48e5d13af8e"),
        admin: application("miroir-app-admin", "55af124e-8c05-4bae-a3ef-0933d41daa92", "18db21bf-f8d3-4f6a-8296-84b69f6dc48b"),
        library: application("miroir-example-library", "5af03c98-fe5e-490b-b08f-e1230971c57f", LIBRARY_DEPLOYMENT),
      },
    }),
  );
  for (const name of ["miroir-app-miroir", "miroir-app-admin", "miroir-example-library"]) {
    cpSync(path.join(repositoryRoot, "packages", name, "assets"), path.join(root, name, "assets"), { recursive: true });
  }
  return root;
}

describe("an environment outside a checkout", () => {
  let root: string;
  let booted: Awaited<ReturnType<typeof boot>>;
  const env = () => ({ MIROIR_ROOT: root, MIROIR_ENV: "standalone" });

  beforeAll(async () => {
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
    root = standaloneRoot();
    // the working directory is outside the root: MIROIR_ROOT alone locates it
    booted = await boot(tmpdir(), env());
  }, 120000);

  it("finds the environment definitions under MIROIR_ROOT", () => {
    expect(hasEnvironmentDefinitions(tmpdir(), env())).toBe(true);
    expect(booted.resolved.repositoryRoot).toBe(root);
    expect(booted.resolved.source).toBe("MIROIR_ENV");
  });

  it("places the package assets under packagesDirectory", () => {
    const admin = booted.resolved.deployments.find((d) => d.applicationKey === "admin")!;
    expect(admin.configuration.data).toEqual({ emulatedServerType: "filesystem", directory: "miroir-app-admin/assets/admin_data" });
  });

  it("opens every deployment and records them in the Admin data of the root", () => {
    expect(booted.reconciliation.opened).toContain(LIBRARY_DEPLOYMENT);
    const rows = readRows(path.join(root, "miroir-app-admin/assets/admin_data", ENTITY_DEPLOYMENT_UUID));
    expect(rows[LIBRARY_DEPLOYMENT].configuration.data).toEqual({
      emulatedServerType: "filesystem",
      directory: "miroir-example-library/assets/library_data",
    });
  });
});

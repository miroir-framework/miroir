// #345 Slice 5: the Docker images run the tracked `docker` environment with MIROIR_ROOT=/data. The
// volume is seeded from the image's /seed: environments/docker.json and the package assets laid out
// as <package>/assets, without the Deployment and AdminApplication rows the definition generates.
// A volume seeded by an image from before #345 keeps its data; its Admin and Miroir Deployment rows
// are rewritten from the definition. vitest, not MiroirTest: boot wiring on filesystem stores.
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import {
  ConfigurationService,
  ENTITY_ADMIN_APPLICATION_UUID,
  ENTITY_DEPLOYMENT_UUID,
  miroirCoreStartup,
} from "miroir-core";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";

import { boot, readRows } from "./bootTestSupport";
import { repositoryRoot } from "./cliTestSupport";

const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4";
const SEEDED_PACKAGES = ["miroir-app-miroir", "miroir-app-admin", "miroir-example-library"];

/** The image's /seed, as the Dockerfiles build it. */
function seed(target: string, options: { generatedRows: boolean }): void {
  cpSync(path.join(repositoryRoot, "environments/docker.json"), path.join(target, "environments/docker.json"));
  for (const name of SEEDED_PACKAGES) {
    cpSync(path.join(repositoryRoot, "packages", name, "assets"), path.join(target, name, "assets"), { recursive: true });
  }
  if (!options.generatedRows) {
    for (const entity of [ENTITY_DEPLOYMENT_UUID, ENTITY_ADMIN_APPLICATION_UUID]) {
      const directory = path.join(target, "miroir-app-admin/assets/admin_data", entity);
      rmSync(directory, { recursive: true, force: true });
      mkdirSync(directory);
    }
  }
}

const dockerEnv = (data: string) => ({ MIROIR_ROOT: data, MIROIR_ENV: "docker" });

describe("the docker environment", () => {
  beforeAll(() => {
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
  });

  it("boots a volume seeded from the image and opens Miroir, Admin and Library", async () => {
    const data = mkdtempSync(path.join(tmpdir(), "miroir-docker-data-"));
    seed(data, { generatedRows: false });

    const { resolved, reconciliation } = await boot("/", dockerEnv(data));

    expect(resolved.repositoryRoot).toBe(data);
    expect(reconciliation.opened.sort()).toEqual([ADMIN_DEPLOYMENT, MIROIR_DEPLOYMENT, LIBRARY_DEPLOYMENT].sort());
    expect(reconciliation.warnings).toEqual([]);
    const rows = readRows(path.join(data, "miroir-app-admin/assets/admin_data", ENTITY_DEPLOYMENT_UUID));
    expect(rows[LIBRARY_DEPLOYMENT].configuration.model).toEqual({
      emulatedServerType: "filesystem",
      directory: "miroir-example-library/assets/library_model",
    });
    expect(readdirSync(path.join(data, ".miroir/docker"))).toContain("env.lock.json");
  }, 120000);

  it("keeps a volume seeded before #345 and rewrites its Admin and Miroir Deployment rows", async () => {
    const data = mkdtempSync(path.join(tmpdir(), "miroir-docker-old-"));
    seed(data, { generatedRows: true });
    const before = readRows(path.join(data, "miroir-app-admin/assets/admin_data", ENTITY_DEPLOYMENT_UUID));
    expect(Object.keys(before)).toContain(MIROIR_DEPLOYMENT);

    const { reconciliation } = await boot("/", dockerEnv(data));

    expect(reconciliation.opened).toEqual(expect.arrayContaining([ADMIN_DEPLOYMENT, MIROIR_DEPLOYMENT, LIBRARY_DEPLOYMENT]));
    const rows = readRows(path.join(data, "miroir-app-admin/assets/admin_data", ENTITY_DEPLOYMENT_UUID));
    expect(rows[MIROIR_DEPLOYMENT].configuration.admin).toEqual({ emulatedServerType: "filesystem", directory: "miroir-app-miroir/assets" });
  }, 120000);
});

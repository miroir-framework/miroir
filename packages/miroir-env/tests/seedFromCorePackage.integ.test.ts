// #658 (D10, D11): a project outside the repository seeds Miroir and Admin from the installed core package. The
// project is laid out as `npm create @miroir-framework/app` writes it: the template's own environments/local.json,
// and node_modules/@miroir-framework/core (here a link to the built workspace package, whose dist/seed the core
// tarball ships). vitest, not MiroirTest: seeding and boot wiring on a real DomainController and filesystem stores.
import { cpSync, existsSync, mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

import { ConfigurationService, ENTITY_DEPLOYMENT_UUID, miroirCoreStartup } from "@miroir-framework/core";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";

import { boot, readRows } from "./bootTestSupport";
import { repositoryRoot } from "./cliTestSupport";

const MIROIR_DEPLOYMENT = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
const ADMIN_DEPLOYMENT = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";
const ENTITY_ENTITY = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";

/** A generated project: environments/ from the template, core installed under node_modules, no package assets. */
function generatedProject(): string {
  const root = mkdtempSync(path.join(tmpdir(), "miroir-env-project-"));
  cpSync(path.join(repositoryRoot, "packages/miroir-create-app/template/environments"), path.join(root, "environments"), {
    recursive: true,
  });
  mkdirSync(path.join(root, "node_modules/@miroir-framework"), { recursive: true });
  symlinkSync(path.join(repositoryRoot, "packages/miroir-core"), path.join(root, "node_modules/@miroir-framework/core"), "dir");
  return root;
}

describe("a project seeded from the installed core package", () => {
  let root: string;
  let booted: Awaited<ReturnType<typeof boot>>;

  beforeAll(async () => {
    if (!existsSync(path.join(repositoryRoot, "packages/miroir-core/dist/seed"))) {
      throw new Error("packages/miroir-core/dist/seed is missing: npm run build -w @miroir-framework/core");
    }
    miroirCoreStartup();
    miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
    root = generatedProject();
    // the working directory is outside the project: MIROIR_ROOT alone locates it, environments/local.json selects it
    booted = await boot(tmpdir(), { MIROIR_ROOT: root });
  }, 120000);

  it("seeds the model and data of Miroir and Admin into the project's state", () => {
    expect(booted.resolved.name).toBe("local");
    expect([...booted.seed.seeded].sort()).toEqual(["admin/data", "admin/model", "miroir/data", "miroir/model"]);
    expect(readRows(path.join(root, ".miroir/local/miroir/model", ENTITY_ENTITY))[ENTITY_ENTITY]?.name).toBe("Entity");
  });

  it("opens both deployments and records them in the project's Admin data", () => {
    expect(booted.reconciliation.opened).toEqual(expect.arrayContaining([MIROIR_DEPLOYMENT, ADMIN_DEPLOYMENT]));
    expect(Object.keys(readRows(path.join(root, ".miroir/local/admin/data", ENTITY_DEPLOYMENT_UUID))).sort()).toEqual(
      [MIROIR_DEPLOYMENT, ADMIN_DEPLOYMENT].sort(),
    );
  });
});

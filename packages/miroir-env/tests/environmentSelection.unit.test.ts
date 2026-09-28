// #321 Slice 2: which environment a run uses (--name, MIROIR_ENV, environments/local.json, dev)
// and how a personal local.json extends a tracked environment.
// vitest, not MiroirTest: selection reads files and environment variables. The merge rules
// themselves are the MiroirTest suite fn.environment.resolveEnvironment.
import { describe, expect, it } from "vitest";

import { run, temporaryRepository } from "./cliTestSupport";

const miroir = {
  package: "miroir-app-miroir",
  selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  deployment: "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
  store: "filesystem",
  mode: "live",
};
const admin = {
  package: "miroir-app-admin",
  selfApplication: "55af124e-8c05-4bae-a3ef-0933d41daa92",
  deployment: "18db21bf-f8d3-4f6a-8296-84b69f6dc48b",
  store: "filesystem",
  mode: "live",
};
const library = {
  package: "miroir-test-app_deployment-library",
  selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
  deployment: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  store: "filesystem",
  mode: "live",
};
const spotify = {
  package: "miroir-test-app_deployment-spotify",
  selfApplication: "00514586-bf72-4de3-beea-0a627c821404",
  deployment: "fd47d115-67e2-4870-8339-1c26665d1d15",
  store: "filesystem",
  mode: "live",
};

const dev = { description: "tracked dev", applications: { miroir, admin, library } };
const testFilesystem = {
  applications: {
    miroir: { ...miroir, mode: "copy" },
    admin: { ...admin, mode: "copy" },
  },
};
const local = { extends: "dev", applications: { library: null, spotify } };

describe("miroir-env environment selection", () => {
  it("uses dev when nothing selects another environment", async () => {
    const result = await run(["show", "--json"], temporaryRepository({ dev }));
    expect(result.stderr).toBe("");
    const shown = JSON.parse(result.stdout);
    expect(shown).toMatchObject({ name: "dev", source: "default", files: ["environments/dev.json"] });
  });

  it("uses environments/local.json when it exists, merged over the environment it extends", async () => {
    const result = await run(["show", "--json"], temporaryRepository({ dev, local }));
    expect(result.stderr).toBe("");
    const shown = JSON.parse(result.stdout);
    expect(shown).toMatchObject({
      name: "local",
      source: "environments/local.json",
      files: ["environments/local.json", "environments/dev.json"],
    });
    expect(shown.environment.description).toBe("tracked dev");
    expect(Object.keys(shown.environment.applications).sort()).toEqual(["admin", "miroir", "spotify"]);
    expect(shown.deployments.map((d: { applicationKey: string }) => d.applicationKey).sort()).toEqual([
      "admin",
      "miroir",
      "spotify",
    ]);
  });

  it("MIROIR_ENV wins over local.json", async () => {
    const root = temporaryRepository({ dev, local, "test-filesystem": testFilesystem });
    const result = await run(["show", "--json"], root, { MIROIR_ENV: "test-filesystem" });
    expect(result.stderr).toBe("");
    const shown = JSON.parse(result.stdout);
    expect(shown).toMatchObject({ name: "test-filesystem", source: "MIROIR_ENV" });
    expect(shown.deployments[0].configuration.model.directory).toBe(".miroir/test-filesystem/miroir/model");
  });

  it("--name wins over MIROIR_ENV", async () => {
    const root = temporaryRepository({ dev, local, "test-filesystem": testFilesystem });
    const result = await run(["show", "--json", "--name", "dev"], root, { MIROIR_ENV: "test-filesystem" });
    expect(JSON.parse(result.stdout)).toMatchObject({ name: "dev", source: "--name" });
  });

  it("says why the environment was selected and which files define it", async () => {
    const result = await run(["show"], temporaryRepository({ dev, local }));
    expect(result.stdout).toContain(
      "environment local, selected by environments/local.json, defined by environments/local.json <- environments/dev.json",
    );
  });

  it("an unknown MIROIR_ENV exits 2 listing the available environments", async () => {
    const result = await run(["show"], temporaryRepository({ dev, local }), { MIROIR_ENV: "prod" });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain('environment "prod" not found; known environments: dev, local');
  });

  it("a local application that is neither inherited nor complete exits 2 naming the missing field", async () => {
    const result = await run(
      ["show"],
      temporaryRepository({ dev, local: { extends: "dev", applications: { designer: { mode: "copy" } } } }),
    );
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("applications.designer.package");
  });

  it("an environment file that is not valid JSON exits 2 naming the file", async () => {
    const result = await run(["show"], temporaryRepository({ dev, local: "{ extends: dev" }));
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("environments/local.json: invalid JSON");
  });
});

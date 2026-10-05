// #321 Slice 4: a test environment gives the tests an emulated-server client configuration whose
// stores are all copies in .miroir/<environment>/, and a reseed brings them back to the package assets.
// vitest, not MiroirTest: seeding copies files on disk.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  environmentClientConfig,
  openTestEnvironment,
  resolveEnvironmentFromFiles,
  seedEnvironmentState,
  selectedTestEnvironment,
  withConnectionPasswords,
} from "../src/index";
import { repositoryRoot, temporaryRepository } from "./cliTestSupport";

// openTestEnvironment reads process.env: a nonreg job runs these tests with MIROIR_TEST_WORKER set (#477).
const noWorker = { MIROIR_TEST_WORKER: undefined };

const application = (name: string, selfApplication: string, deployment: string) => ({
  package: `miroir-app-${name}`,
  selfApplication,
  deployment,
  store: "filesystem",
  mode: "copy",
});
const testFilesystem = {
  server: { rootApiUrl: "https://localhost:3080" },
  applications: {
    miroir: application("miroir", "360fcf1f-f0d4-4f8a-9262-07886e70fa15", "10ff36f2-50a3-48d8-b80f-e48e5d13af8e"),
    admin: application("admin", "55af124e-8c05-4bae-a3ef-0933d41daa92", "18db21bf-f8d3-4f6a-8296-84b69f6dc48b"),
  },
};

describe("test environments", () => {
  it("the tracked test-filesystem environment gives a client configuration with every store in .miroir/test-filesystem", () => {
    const resolved = resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: { MIROIR_ENV: "test-filesystem" } });
    const config = environmentClientConfig(resolved);

    expect(config.miroirConfigType).toBe("client");
    expect(config.client).toMatchObject({
      emulateServer: true,
      rootApiUrl: "https://localhost:3080",
      filesystemDeploymentRootDirectory: repositoryRoot,
    });
    const storage = (config.client as { deploymentStorageConfig: Record<string, Record<string, { directory: string }>> })
      .deploymentStorageConfig;
    expect(Object.keys(storage).sort()).toEqual(resolved.deployments.map((d) => d.deployment).sort());
    for (const sections of Object.values(storage)) {
      for (const section of Object.values(sections)) {
        expect(section.directory.startsWith(".miroir/test-filesystem/")).toBe(true);
      }
    }
  });

  it("a reseed wipes what a run wrote and copies the package assets again", () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });
    const userRow = "packages/miroir-app-admin/assets/admin_data/d20d09e5-0685-4fc7-b9bd-fcfa3845127a/u.json";
    mkdirSync(path.dirname(path.join(root, userRow)), { recursive: true });
    writeFileSync(path.join(root, userRow), "{}");
    const resolved = resolveEnvironmentFromFiles({ cwd: root, env: { MIROIR_ENV: "test-filesystem" } });

    expect(seedEnvironmentState(resolved, { reseed: true }).seeded).toContain("admin/data");
    const written = path.join(root, ".miroir/test-filesystem/admin/data/runtime.json");
    writeFileSync(written, "{}");
    seedEnvironmentState(resolved, { reseed: true });

    expect(existsSync(written)).toBe(false);
    expect(existsSync(path.join(root, ".miroir/test-filesystem/admin/data/d20d09e5-0685-4fc7-b9bd-fcfa3845127a/u.json"))).toBe(
      true,
    );
  });

  // #345: the helper every package's tests share
  it("openTestEnvironment with reseed also wipes the stores of applications installed at runtime", () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });
    const installed = path.join(root, ".miroir/test-filesystem/apps/pingapp_data/x.json");
    mkdirSync(path.dirname(installed), { recursive: true });
    writeFileSync(installed, "{}");

    const environment = openTestEnvironment("test-filesystem", { cwd: root, env: noWorker, reseed: true });

    expect(existsSync(installed)).toBe(false);
    expect(environment.seed?.seeded).toContain("admin/data");
    expect(environment.miroirConfig.client).toMatchObject({ emulateServer: true, filesystemDeploymentRootDirectory: root });
  });

  it("openTestEnvironment resolves from MIROIR_ROOT when the run sets it", () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });

    const environment = openTestEnvironment("test-filesystem", { cwd: "/", env: { MIROIR_ROOT: root } });

    expect(environment.resolved.repositoryRoot).toBe(root);
  });

  it("withConnectionPasswords puts the password of passwordEnv in the sql stores only", () => {
    const resolved = resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: { MIROIR_ENV: "test-sql" } });
    const miroir = resolved.deployments.find((d) => d.applicationKey === "miroir")!;
    const admin = resolved.deployments.find((d) => d.applicationKey === "admin")!;

    const opened = withConnectionPasswords(resolved, miroir.configuration, { MIROIR_POSTGRES_PASSWORD: "s3cr:t" });

    expect((opened.model as { connectionString: string }).connectionString).toMatch(/^postgres(ql)?:\/\/postgres:s3cr%3At@localhost/);
    expect(withConnectionPasswords(resolved, admin.configuration, { MIROIR_POSTGRES_PASSWORD: "s3cr:t" })).toEqual(admin.configuration);
    expect(miroir.configuration.model).not.toHaveProperty("connectionString", expect.stringContaining("s3cr"));
  });

  it("openTestEnvironment refuses an environment that is not a test environment", () => {
    expect(() => openTestEnvironment("dev", { cwd: repositoryRoot })).toThrow(/not a test environment/);
  });

  it("selectedTestEnvironment ignores a MIROIR_ENV that is not test-*, with a warning", () => {
    const warnings: string[] = [];
    expect(selectedTestEnvironment({ MIROIR_ENV: "dev" }, (w) => warnings.push(w))).toBeUndefined();
    expect(warnings).toHaveLength(1);
    expect(selectedTestEnvironment({ MIROIR_ENV: "test-sql" })).toBe("test-sql");
  });

  it("an environment without server.rootApiUrl cannot emulate a server", () => {
    const root = temporaryRepository({ "test-filesystem": { ...testFilesystem, server: undefined } });
    const resolved = resolveEnvironmentFromFiles({ cwd: root, env: { MIROIR_ENV: "test-filesystem" } });

    expect(() => environmentClientConfig(resolved)).toThrow('environment "test-filesystem" has no server.rootApiUrl');
  });
});

// #477 Slice 0: every store of a test environment is named from the environment name alone, so two
// runs of one test environment at the same time share their stores.
describe("test environment state names (#477)", () => {
  type Section = { directory?: string; schema?: string; database?: string; indexedDbName?: string };
  const sections = (resolved: ReturnType<typeof resolveEnvironmentFromFiles>): Section[] =>
    resolved.deployments.flatMap((d) => Object.values(d.configuration as Record<string, Section>));

  it("two openings of test-filesystem use the same stores in .miroir/test-filesystem", () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });

    const first = openTestEnvironment("test-filesystem", { cwd: root, env: noWorker, reseed: true });
    const second = openTestEnvironment("test-filesystem", { cwd: root, env: noWorker, reseed: true });

    expect(sections(second.resolved)).toEqual(sections(first.resolved));
    for (const section of sections(first.resolved)) {
      expect(section.directory?.startsWith(".miroir/test-filesystem/")).toBe(true);
    }
    expect(first.miroirConfig.environment?.appsDirectory).toBe(".miroir/test-filesystem/apps");
  });

  it("test-sql names its schemas test_sql_<application>", () => {
    const resolved = resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: { MIROIR_ENV: "test-sql" } });

    const schemas = sections(resolved).flatMap((s) => (s.schema ? [s.schema] : []));
    expect(schemas.length).toBeGreaterThan(0);
    for (const schema of schemas) {
      expect(schema).toMatch(/^test_sql_[A-Za-z]+(_modelVersion|_admin)?$/);
    }
  });
});

// #477 Slice 1: MIROIR_TEST_WORKER gives a test environment its own state, so parallel nonreg jobs
// do not share stores. The definition name stays the same.
describe("worker state of a test environment (#477)", () => {
  type Section = { directory?: string; schema?: string; database?: string; indexedDbName?: string };
  const sections = (resolved: ReturnType<typeof resolveEnvironmentFromFiles>): Section[] =>
    resolved.deployments.flatMap((d) => Object.values(d.configuration as Record<string, Section>));

  it("test-filesystem with worker w2 keeps its name and puts every store in .miroir/test-filesystem@w2", () => {
    const resolved = resolveEnvironmentFromFiles({
      cwd: repositoryRoot,
      env: { MIROIR_ENV: "test-filesystem", MIROIR_TEST_WORKER: "w2" },
    });

    expect(resolved.name).toBe("test-filesystem");
    expect(resolved.stateName).toBe("test-filesystem@w2");
    for (const section of sections(resolved)) {
      expect(section.directory?.startsWith(".miroir/test-filesystem@w2/")).toBe(true);
    }
    expect(environmentClientConfig(resolved).environment?.appsDirectory).toBe(".miroir/test-filesystem@w2/apps");
  });

  it("without a worker the state name is the environment name", () => {
    const resolved = resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: { MIROIR_ENV: "test-filesystem" } });

    expect(resolved.stateName).toBe("test-filesystem");
  });

  it("test-sql, test-mongodb and test-indexedDb name their stores after the worker state", () => {
    const resolve = (name: string) =>
      resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: { MIROIR_ENV: name, MIROIR_TEST_WORKER: "w2" } });

    const schemas = sections(resolve("test-sql")).flatMap((s) => (s.schema ? [s.schema] : []));
    const databases = sections(resolve("test-mongodb")).flatMap((s) => (s.database ? [s.database] : []));
    const levels = sections(resolve("test-indexedDb")).flatMap((s) => (s.indexedDbName ? [s.indexedDbName] : []));

    expect(schemas.length).toBeGreaterThan(0);
    expect(schemas.every((schema) => schema.startsWith("test_sql_w2_"))).toBe(true);
    expect(databases.length).toBeGreaterThan(0);
    expect(databases.every((database) => database.startsWith("test_mongodb_w2_"))).toBe(true);
    expect(levels.length).toBeGreaterThan(0);
    expect(levels.every((name) => name.startsWith(".miroir/test-indexedDb@w2/"))).toBe(true);
  });

  it("a reseed with worker w2 leaves the state of the run without a worker in place", () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });
    const unworkered = path.join(root, ".miroir/test-filesystem/apps/kept/x.json");
    mkdirSync(path.dirname(unworkered), { recursive: true });
    writeFileSync(unworkered, "{}");
    const otherWorker = path.join(root, ".miroir/test-filesystem@w2/apps/wiped/x.json");
    mkdirSync(path.dirname(otherWorker), { recursive: true });
    writeFileSync(otherWorker, "{}");

    openTestEnvironment("test-filesystem", { cwd: root, env: { MIROIR_TEST_WORKER: "w2" }, reseed: true });

    expect(existsSync(unworkered)).toBe(true);
    expect(existsSync(otherWorker)).toBe(false);
  });

  it("a worker on an environment that is not a test environment is ignored, with a warning", () => {
    const warnings: string[] = [];
    const resolved = resolveEnvironmentFromFiles({
      cwd: repositoryRoot,
      env: { MIROIR_ENV: "dev", MIROIR_TEST_WORKER: "w2" },
      warn: (message) => warnings.push(message),
    });

    expect(resolved.stateName).toBe("dev");
    expect(warnings).toEqual([expect.stringContaining("MIROIR_TEST_WORKER")]);
  });

  it("a worker name other than w<number> is refused", () => {
    expect(() =>
      resolveEnvironmentFromFiles({ cwd: repositoryRoot, env: { MIROIR_ENV: "test-filesystem", MIROIR_TEST_WORKER: "../x" } }),
    ).toThrow(/MIROIR_TEST_WORKER/);
  });
});

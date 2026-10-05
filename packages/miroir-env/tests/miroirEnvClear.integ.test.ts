// #477 Slice 3: `miroir-env clear` removes the state of a test environment, or of one nonreg worker
// (MIROIR_TEST_WORKER): its .miroir directory, and its SQL schemas or MongoDB databases.
// vitest through the CLI: the command deletes files and database objects.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { repositoryRoot, run, temporaryRepository } from "./cliTestSupport";

const application = (name: string, selfApplication: string, deployment: string) => ({
  package: `miroir-app-${name}`,
  selfApplication,
  deployment,
  store: "filesystem",
  mode: "copy",
});
const testFilesystem = {
  applications: {
    miroir: application("miroir", "360fcf1f-f0d4-4f8a-9262-07886e70fa15", "10ff36f2-50a3-48d8-b80f-e48e5d13af8e"),
    admin: application("admin", "55af124e-8c05-4bae-a3ef-0933d41daa92", "18db21bf-f8d3-4f6a-8296-84b69f6dc48b"),
  },
};

function touch(root: string, file: string): string {
  const full = path.join(root, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, "{}");
  return full;
}

describe("miroir-env clear (#477)", () => {
  it("removes the state of the worker and keeps the others", async () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });
    const worker = touch(root, ".miroir/test-filesystem@w2/miroir/model/x.json");
    const otherWorker = touch(root, ".miroir/test-filesystem@w3/miroir/model/x.json");
    const unworkered = touch(root, ".miroir/test-filesystem/miroir/model/x.json");

    const result = await run(["clear", "--name", "test-filesystem"], root, { MIROIR_TEST_WORKER: "w2" });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("removed .miroir/test-filesystem@w2");
    expect(existsSync(worker)).toBe(false);
    expect(existsSync(otherWorker)).toBe(true);
    expect(existsSync(unworkered)).toBe(true);
  });

  it("without a worker removes the state of the environment and keeps the workers'", async () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });
    const worker = touch(root, ".miroir/test-filesystem@w2/miroir/model/x.json");
    const unworkered = touch(root, ".miroir/test-filesystem/miroir/model/x.json");

    const result = await run(["clear", "--name", "test-filesystem"], root);

    expect(result.exitCode).toBe(0);
    expect(existsSync(unworkered)).toBe(false);
    expect(existsSync(worker)).toBe(true);
  });

  it("refuses an environment that is not a test environment", async () => {
    const result = await run(["clear", "--name", "dev"], repositoryRoot);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toMatch(/test environment/);
  });

  it("says when there is nothing to clear", async () => {
    const root = temporaryRepository({ "test-filesystem": testFilesystem });

    const result = await run(["clear", "--name", "test-filesystem"], root, { MIROIR_TEST_WORKER: "w2" });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("nothing to clear");
  });
});

// PostgreSQL part: runs when a server answers on the test-sql address (cloud: sudo pg_ctlcluster 16 main start).
const postgresHost = process.env.MIROIR_TEST_POSTGRES_HOST ?? "localhost";
const postgresUp = await new Promise<boolean>((resolve) => {
  const socket = net.connect({ host: postgresHost, port: 5432 });
  socket.setTimeout(1000);
  socket.once("connect", () => (socket.destroy(), resolve(true)));
  socket.once("error", () => resolve(false));
  socket.once("timeout", () => (socket.destroy(), resolve(false)));
});

describe.skipIf(!postgresUp || !process.env.MIROIR_POSTGRES_PASSWORD)("miroir-env clear on PostgreSQL (#477)", () => {
  it("drops the schemas of the worker, its test applications' included, and keeps the others", async () => {
    const pg = (await import("pg")).default;
    const client = new pg.Client({
      host: postgresHost,
      user: "postgres",
      password: process.env.MIROIR_POSTGRES_PASSWORD,
      database: "postgres",
    });
    await client.connect();
    const schemas = ["test_sql_w7_library", "test_sql_w7_testApplication", "test_sql_w8_library", "test_sql_library_keep477"];
    try {
      for (const schema of schemas) {
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      }

      const result = await run(["clear", "--name", "test-sql"], repositoryRoot, {
        MIROIR_TEST_WORKER: "w7",
        MIROIR_POSTGRES_PASSWORD: process.env.MIROIR_POSTGRES_PASSWORD!,
        ...(process.env.MIROIR_TEST_POSTGRES_HOST ? { MIROIR_TEST_POSTGRES_HOST: postgresHost } : {}),
      });

      const left = (
        await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'test_sql_%'")
      ).rows.map((row: { schema_name: string }) => row.schema_name);
      expect(result.exitCode, result.stderr).toBe(0);
      expect(left).not.toContain("test_sql_w7_library");
      expect(left).not.toContain("test_sql_w7_testApplication");
      expect(left).toContain("test_sql_w8_library");
      expect(left).toContain("test_sql_library_keep477");
    } finally {
      for (const schema of schemas) {
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      }
      await client.end();
    }
  });
});

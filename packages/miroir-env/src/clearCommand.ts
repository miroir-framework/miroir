import { existsSync, rmSync } from "node:fs";
import path from "node:path";

import { ENVIRONMENT_STATE_ROOT, isTestEnvironment } from "miroir-core";

import { EnvironmentError, type ResolvedEnvironment } from "./environmentFiles.js";

// ################################################################################################
// miroir-env clear (#477): remove the state of a test environment, or of one nonreg worker
// (MIROIR_TEST_WORKER): its .miroir directory, its SQL schemas and its MongoDB databases. Schemas and
// databases are found by name prefix, so the test applications a run installed are dropped too.
// ################################################################################################

/** The SQL schema or MongoDB database name prefix of a state: `test-sql@w2` → `test_sql_w2_`. */
export function stateStorePrefix(stateName: string): string {
  return `${stateName.replace(/[^A-Za-z0-9_]/g, "_")}_`;
}

/**
 * Whether a schema or database belongs to the state. The state of the environment itself
 * (no worker) does not own its workers' stores: `test_sql_w2_library` is not `test_sql`'s.
 */
export function belongsToState(storeName: string, stateName: string): boolean {
  const prefix = stateStorePrefix(stateName);
  if (!storeName.startsWith(prefix)) {
    return false;
  }
  return stateName.includes("@") || !/^w[0-9]+_/.test(storeName.slice(prefix.length));
}

function usesStore(resolved: ResolvedEnvironment, store: string): boolean {
  return resolved.deployments.some((deployment) =>
    Object.values(deployment.configuration).some((section) => section?.emulatedServerType === store),
  );
}

async function dropPostgresSchemas(resolved: ResolvedEnvironment, env: Record<string, string | undefined>): Promise<string[]> {
  const postgres = resolved.environment.connections?.postgres;
  if (!postgres || !usesStore(resolved, "sql")) {
    return [];
  }
  const pg = (await import("pg")).default;
  const client = new pg.Client({
    host: env.MIROIR_TEST_POSTGRES_HOST ?? postgres.host,
    port: postgres.port ?? 5432,
    user: postgres.user ?? "postgres",
    password: postgres.passwordEnv ? env[postgres.passwordEnv] : undefined,
    database: postgres.database ?? "postgres",
  });
  try {
    await client.connect();
  } catch (error) {
    throw new EnvironmentError(`cannot reach PostgreSQL at ${postgres.host}: ${(error as Error).message}`);
  }
  try {
    const schemas = (await client.query("SELECT schema_name FROM information_schema.schemata")).rows
      .map((row: { schema_name: string }) => row.schema_name)
      .filter((schema: string) => belongsToState(schema, resolved.stateName))
      .sort();
    for (const schema of schemas) {
      await client.query(`DROP SCHEMA "${schema.replace(/"/g, '""')}" CASCADE`);
    }
    return schemas.map((schema: string) => `removed schema ${schema}`);
  } finally {
    await client.end();
  }
}

async function dropMongoDatabases(resolved: ResolvedEnvironment): Promise<string[]> {
  const mongodb = resolved.environment.connections?.mongodb;
  if (!mongodb || !usesStore(resolved, "mongodb")) {
    return [];
  }
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(mongodb.url, { serverSelectionTimeoutMS: 3000 });
  try {
    await client.connect();
  } catch (error) {
    throw new EnvironmentError(`cannot reach MongoDB at ${mongodb.url}: ${(error as Error).message}`);
  }
  try {
    const { databases } = await client.db().admin().listDatabases({ nameOnly: true });
    const names = databases
      .map((database) => database.name)
      .filter((name) => belongsToState(name, resolved.stateName))
      .sort();
    for (const name of names) {
      await client.db(name).dropDatabase();
    }
    return names.map((name) => `removed database ${name}`);
  } finally {
    await client.close();
  }
}

/** The lines to print: what was removed, or that there was nothing to clear. */
export async function clearEnvironmentState(
  resolved: ResolvedEnvironment,
  env: Record<string, string | undefined>,
): Promise<string[]> {
  if (!isTestEnvironment(resolved.name)) {
    throw new EnvironmentError(`clear only removes the state of a test environment (test-*), not "${resolved.name}"`);
  }
  const lines: string[] = [];
  const stateDirectory = `${ENVIRONMENT_STATE_ROOT}/${resolved.stateName}`;
  const absoluteStateDirectory = path.join(resolved.repositoryRoot, stateDirectory);
  if (existsSync(absoluteStateDirectory)) {
    rmSync(absoluteStateDirectory, { recursive: true, force: true });
    lines.push(`removed ${stateDirectory}`);
  }
  lines.push(...(await dropPostgresSchemas(resolved, env)), ...(await dropMongoDatabases(resolved)));
  return lines.length > 0 ? lines : [`${resolved.stateName}: nothing to clear`];
}

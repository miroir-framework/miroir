import { existsSync, rmSync } from "node:fs";
import path from "node:path";

import { ENVIRONMENT_STATE_ROOT, isTestEnvironment } from "miroir-core";

import { EnvironmentError, readEnvironmentDefinitions, type ResolvedEnvironment } from "./environmentFiles.js";

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
 * (no worker) does not own its workers' stores: `test_sql_w2_library` is not `test_sql`'s. Nor does
 * a state own the stores of another environment whose name extends its own: with environments
 * `test-sql` and `test-sql-w2`, `test_sql_w2_library` is ambiguous and kept.
 */
export function belongsToState(storeName: string, stateName: string, otherEnvironments: string[] = []): boolean {
  const prefix = stateStorePrefix(stateName);
  if (!storeName.startsWith(prefix)) {
    return false;
  }
  if (!stateName.includes("@") && /^w[0-9]+_/.test(storeName.slice(prefix.length))) {
    return false;
  }
  const environmentPrefix = stateStorePrefix(stateName.split("@")[0]);
  return !otherEnvironments.some((other) => {
    const otherPrefix = stateStorePrefix(other);
    return otherPrefix.length > environmentPrefix.length && storeName.startsWith(otherPrefix);
  });
}

function usesStore(resolved: ResolvedEnvironment, store: string): boolean {
  return resolved.deployments.some((deployment) =>
    Object.values(deployment.configuration).some((section) => section?.emulatedServerType === store),
  );
}

async function dropPostgresSchemas(
  resolved: ResolvedEnvironment,
  env: Record<string, string | undefined>,
  owns: (storeName: string) => boolean,
): Promise<string[]> {
  const postgres = resolved.environment.connections?.postgres;
  if (!postgres || !usesStore(resolved, "sql")) {
    return [];
  }
  const host = env.MIROIR_TEST_POSTGRES_HOST ?? postgres.host;
  const pg = (await import("pg")).default;
  const client = new pg.Client({
    host,
    port: postgres.port ?? 5432,
    user: postgres.user ?? "postgres",
    password: postgres.passwordEnv ? env[postgres.passwordEnv] : undefined,
    database: postgres.database ?? "postgres",
  });
  try {
    await client.connect();
  } catch (error) {
    return [`warning: PostgreSQL at ${host} not reachable, schemas not checked: ${(error as Error).message}`];
  }
  try {
    const schemas = (await client.query("SELECT schema_name FROM information_schema.schemata")).rows
      .map((row: { schema_name: string }) => row.schema_name)
      .filter((schema: string) => owns(schema))
      .sort();
    for (const schema of schemas) {
      await client.query(`DROP SCHEMA "${schema.replace(/"/g, '""')}" CASCADE`);
    }
    return schemas.map((schema: string) => `removed schema ${schema}`);
  } finally {
    await client.end();
  }
}

async function dropMongoDatabases(
  resolved: ResolvedEnvironment,
  env: Record<string, string | undefined>,
  owns: (storeName: string) => boolean,
): Promise<string[]> {
  const mongodb = resolved.environment.connections?.mongodb;
  if (!mongodb || !usesStore(resolved, "mongodb")) {
    return [];
  }
  // The server the integration tests use (IntegrationTestSession.ts).
  const url = env.MIROIR_TEST_MONGODB_CONNECTION_STRING ?? mongodb.url;
  const { MongoClient } = await import("mongodb");
  const client = new MongoClient(url, { serverSelectionTimeoutMS: 3000 });
  try {
    await client.connect();
  } catch (error) {
    return [`warning: MongoDB at ${url} not reachable, databases not checked: ${(error as Error).message}`];
  }
  try {
    const { databases } = await client.db().admin().listDatabases({ nameOnly: true });
    const names = databases
      .map((database) => database.name)
      .filter((name) => owns(name))
      .sort();
    for (const name of names) {
      await client.db(name).dropDatabase();
    }
    return names.map((name) => `removed database ${name}`);
  } finally {
    await client.close();
  }
}

/**
 * The lines to print: what was removed, or that there was nothing to clear. A database server that
 * does not answer gives a `warning:` line, not an error: the run that used the state may never have
 * reached it either.
 */
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
  const otherEnvironments = Object.keys(readEnvironmentDefinitions(resolved.repositoryRoot)).filter(
    (name) => name !== resolved.name,
  );
  const owns = (storeName: string) => belongsToState(storeName, resolved.stateName, otherEnvironments);
  lines.push(...(await dropPostgresSchemas(resolved, env, owns)), ...(await dropMongoDatabases(resolved, env, owns)));
  return lines.length > 0 ? lines : [`${resolved.stateName}: nothing to clear`];
}

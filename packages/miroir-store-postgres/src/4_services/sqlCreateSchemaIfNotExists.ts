/**
 * Idempotent schema DDL. SqlDbStore.open() already runs CREATE SCHEMA IF NOT
 * EXISTS; createStore used sequelize.createSchema() which fails when the
 * schema is already there (open-then-create, or model+data sharing a schema).
 */
export function sqlCreateSchemaIfNotExists(schema: string): string {
  if (!schema || /["\\\0]/.test(schema)) {
    throw new Error(`Invalid SQL schema identifier: ${schema}`);
  }
  return `CREATE SCHEMA IF NOT EXISTS "${schema}"`;
}

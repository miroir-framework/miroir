/**
 * External-data-source classification for Entity rows.
 * Absent `kind` is equivalent to `"sql"` (legacy postgres/catalog entities).
 * `kind: "http"` is served by an Endpoint and must not be bootstrapped as storage.
 */

export type ExternalDataSourceLike = {
  kind?: string;
  endpoint?: string;
  schema?: string;
  tableName?: string;
};

export type EntityExternalDataSourceCarrier = {
  conceptLevel?: string;
  externalDataSource?: ExternalDataSourceLike;
};

export function isHttpExternalEntity(
  entity: EntityExternalDataSourceCarrier | undefined,
): boolean {
  return entity?.externalDataSource?.kind === "http";
}

/** SQL-catalog external (Sequelize model, no CREATE TABLE). HTTP entities are never this. */
export function isSqlExternalEntity(
  entity: EntityExternalDataSourceCarrier | undefined,
): boolean {
  if (!entity || isHttpExternalEntity(entity)) {
    return false;
  }
  return entity.conceptLevel === "External" || !!entity.externalDataSource;
}

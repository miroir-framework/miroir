/**
 * Stands in for the Node store packages in the web build (#337): `IntegrationTestSession.ts` imports
 * them dynamically for vitest and the CLI, where they run against real stores, but a browser cannot
 * open a filesystem, PostgreSQL or MongoDB store. Aliased in `vite.config.js` for `vite build` only.
 */
function nodeOnly(name) {
  return () => {
    throw new Error(`${name} opens a Node store, which the browser build does not include`);
  };
}

export const miroirFileSystemStoreSectionStartup = nodeOnly("miroirFileSystemStoreSectionStartup");
export const miroirPostgresStoreSectionStartup = nodeOnly("miroirPostgresStoreSectionStartup");
export const miroirMongoDbStoreSectionStartup = nodeOnly("miroirMongoDbStoreSectionStartup");

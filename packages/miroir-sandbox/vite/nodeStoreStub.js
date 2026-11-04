/**
 * Stands in for the Node store packages in the sandbox (#672 D10): miroir-react-testing's integration
 * session imports them dynamically for vitest and the CLI, where they run against real stores, but
 * the sandbox runs integration tests on IndexedDB only.
 */
function nodeOnly(name) {
  return () => {
    throw new Error(`${name} opens a Node store, which the sandbox does not include`);
  };
}

export const miroirFileSystemStoreSectionStartup = nodeOnly("miroirFileSystemStoreSectionStartup");
export const miroirPostgresStoreSectionStartup = nodeOnly("miroirPostgresStoreSectionStartup");
export const miroirMongoDbStoreSectionStartup = nodeOnly("miroirMongoDbStoreSectionStartup");

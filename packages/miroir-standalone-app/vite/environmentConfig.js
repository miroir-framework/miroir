/**
 * #321: the web client configuration of the selected environment (MIROIR_ENV, then
 * environments/local.json, then dev), injected by vite.config.js as __MIROIR_CLIENT_CONFIG__
 * (read by src/index.tsx), and the configurations of the in-app realServer-* test runs, injected as
 * __MIROIR_TEST_CLIENT_CONFIGS__ (read by src/miroir-fwk/4-tests/integrationTestProfileAssets.ts).
 */
import { environmentRealServerClientConfig, resolveEnvironmentFromFiles, seedEnvironmentState } from "miroir-env";

/** The global src/index.tsx reads its configuration from. */
export const MIROIR_CLIENT_CONFIG = "__MIROIR_CLIENT_CONFIG__";

/** The global the in-app test runner reads the realServer-* profile configurations from. */
export const MIROIR_TEST_CLIENT_CONFIGS = "__MIROIR_TEST_CLIENT_CONFIGS__";

/** The realServer-* profiles of in-app test runs, and the test environment whose stores each one opens. */
export const REAL_SERVER_TEST_ENVIRONMENTS = {
  "realServer-sql": "test-sql",
  "realServer-indexedDb": "test-indexedDb",
  "realServer-filesystem": "test-filesystem",
  "realServer-mongodb": "test-mongodb",
};

/**
 * The client configuration of an environment for a browser: no env, so database passwords never
 * reach the browser. `httpOnly`: the server listens over HTTP whatever its URL says (served without
 * certificates), so the client calls it over HTTP too.
 */
function browserClientConfig(resolved, httpOnly) {
  const clientConfig = environmentRealServerClientConfig(resolved);
  if (httpOnly) {
    clientConfig.client.serverConfig.rootApiUrl = clientConfig.client.serverConfig.rootApiUrl.replace(/^https:/, "http:");
  }
  return clientConfig;
}

/**
 * @param {{ cwd: string, env: Record<string, string | undefined>, command: "serve" | "build", tls: boolean }} options
 *   `tls`: whether the certificates are set up. Without them the server listens over HTTP whatever its
 *   URL says, so a served client calls it over HTTP too; a build keeps the environment's URL.
 */
export function webClientEnvironment({ cwd, env, command, tls }) {
  const resolved = resolveEnvironmentFromFiles({ cwd, env });
  const clientConfig = browserClientConfig(resolved, command === "serve" && !tls);
  const rootApiUrl = clientConfig.client.serverConfig.rootApiUrl;
  const warnings =
    resolved.environment.client?.mode === "emulatedServer"
      ? [
          `environment "${resolved.name}" runs its client on an emulated server (tests): the web client calls its server at ${rootApiUrl} instead`,
        ]
      : [];
  return {
    name: resolved.name,
    source: resolved.source,
    rootApiUrl,
    clientConfig,
    define: { [MIROIR_CLIENT_CONFIG]: JSON.stringify(clientConfig) },
    warnings,
  };
}

/**
 * The client configurations of the realServer-* profiles, by profile: each calls the server with the
 * stores of its test environment, never the tracked Admin data.
 *
 * @param {{ cwd: string, httpOnly: boolean, seed: boolean }} options
 *   `seed`: seed the filesystem copies missing from each test environment's state (.miroir/test-*),
 *   which the server opens when an in-app run starts; existing copies are kept.
 */
export function webTestClientConfigs({ cwd, httpOnly, seed }) {
  const configs = {};
  for (const [profile, name] of Object.entries(REAL_SERVER_TEST_ENVIRONMENTS)) {
    const resolved = resolveEnvironmentFromFiles({ cwd, env: { MIROIR_ENV: name } });
    if (seed) {
      seedEnvironmentState(resolved);
    }
    configs[profile] = browserClientConfig(resolved, httpOnly);
  }
  return configs;
}

/**
 * #321: the web client configuration of the selected environment (MIROIR_ENV, then
 * environments/local.json, then dev), injected by vite.config.js as __MIROIR_CLIENT_CONFIG__
 * (read by src/index.tsx).
 */
import { environmentRealServerClientConfig, resolveEnvironmentFromFiles } from "miroir-env";

/** The global src/index.tsx reads its configuration from. */
export const MIROIR_CLIENT_CONFIG = "__MIROIR_CLIENT_CONFIG__";

/**
 * @param {{ cwd: string, env: Record<string, string | undefined>, command: "serve" | "build", tls: boolean }} options
 *   `tls`: whether the certificates are set up. Without them the server listens over HTTP whatever its
 *   URL says, so a served client calls it over HTTP too; a build keeps the environment's URL.
 */
export function webClientEnvironment({ cwd, env, command, tls }) {
  const resolved = resolveEnvironmentFromFiles({ cwd, env });
  // no env: database passwords never reach the browser
  const clientConfig = environmentRealServerClientConfig(resolved);
  const environmentUrl = clientConfig.client.serverConfig.rootApiUrl;
  const rootApiUrl = command === "serve" && !tls ? environmentUrl.replace(/^https:/, "http:") : environmentUrl;
  clientConfig.client.serverConfig.rootApiUrl = rootApiUrl;
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

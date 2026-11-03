import type { MiroirConfigClient } from "@miroir-framework/core";

/**
 * Browser → live miroir-server (B6-c). The store type (sql/filesystem/indexedDb/mongodb)
 * lives entirely on the server; the browser client is REST-only and never loads a local
 * store factory, so all four backends are equally launchable from the webApp picker.
 * #321: each realServer-* profile opens the stores of the test environment of its storage
 * (test-sql, …), injected by vite.config.js; absent from a bundle built without it (#672: the
 * sandbox, which then offers no realServer-* profile).
 */
declare const __MIROIR_TEST_CLIENT_CONFIGS__: Record<string, MiroirConfigClient>;

export const realServerTestClientConfigs: Record<string, MiroirConfigClient> =
  typeof __MIROIR_TEST_CLIENT_CONFIGS__ === "undefined" ? {} : __MIROIR_TEST_CLIENT_CONFIGS__;

/** The realServer-* profiles whose client config is in this bundle. */
export function listBundledRealServerProfileNames(): string[] {
  return Object.keys(realServerTestClientConfigs).sort();
}

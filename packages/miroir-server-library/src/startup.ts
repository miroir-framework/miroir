// #652 (analysis D4): the Node startup call of a Miroir process (CLI, MCP host, server). A second entry of the server
// library: importing it loads no Express code.
// #656: the process starts on the local cache its `localCache` option names (redux by default). Each local cache is
// bundled into its own entry (`./startup/redux`, `./startup/zustand`), imported only when chosen: a process holds one
// local cache, and needs no private package.

import {
  registerLazyActionImplementations,
  startMiroirNodeWith,
  VERSIONING_ACTION_IMPLEMENTATION_NAMES,
  VERSIONING_PACKAGE_NAME,
  startMiroirPlatformWith,
  type LocalCacheKind,
  type LocalCacheModule,
  type MiroirConfigClient,
  type MiroirConfigServer,
  type MiroirNodeOptions,
  type MiroirPlatform,
  type MiroirPlatformOptions,
} from "@miroir-framework/core";

export type {
  LocalCacheKind,
  MiroirEmulatedServer,
  MiroirNodeOptions,
  MiroirPlatform,
  MiroirPlatformOptions,
} from "@miroir-framework/core";

/** The local cache module of a kind, loaded from its own entry of this package. */
export async function loadLocalCacheModule(localCache: LocalCacheKind = "redux"): Promise<LocalCacheModule> {
  switch (localCache) {
    case "redux":
      return (await import("@miroir-framework/server/startup/redux")).localCacheModule;
    case "zustand":
      return (await import("@miroir-framework/server/startup/zustand")).localCacheModule;
    default:
      throw new Error(`unknown local cache: ${localCache satisfies never}`);
  }
}

/** The local cache a process starts on; `redux` when absent. */
export type MiroirLocalCacheOption = { localCache?: LocalCacheKind };

/**
 * Builds the Miroir platform of a process from its configuration, on the local cache `localCache` names:
 * see core's `startMiroirPlatformWith`.
 */
export async function startMiroirPlatform(
  miroirConfig: MiroirConfigClient | MiroirConfigServer,
  options: MiroirPlatformOptions & MiroirLocalCacheOption,
): Promise<MiroirPlatform> {
  const { localCache, ...platformOptions } = options;
  return startMiroirPlatformWith(await loadLocalCacheModule(localCache), miroirConfig, platformOptions);
}

/**
 * The startup call of a Node host (CLI, server, Electron main process, test platforms), on the local cache
 * `localCache` names: see core's `startMiroirNodeWith`.
 */
export async function startMiroirNode(
  miroirConfig: MiroirConfigClient | MiroirConfigServer,
  options: MiroirNodeOptions & MiroirLocalCacheOption,
): Promise<MiroirPlatform> {
  const { localCache, ...nodeOptions } = options;
  // #696: a Node host holds the stores (server, Electron's main process, the CLI), so it runs the
  // versioning actions; the package loads on the first one, when the versioning capability is on
  registerLazyActionImplementations({
    capability: "versioning",
    packageName: VERSIONING_PACKAGE_NAME,
    implementationNames: VERSIONING_ACTION_IMPLEMENTATION_NAMES,
    load: () => import("@miroir-framework/versioning"),
  });
  return startMiroirNodeWith(await loadLocalCacheModule(localCache), miroirConfig, nodeOptions);
}

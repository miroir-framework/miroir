import {
  ConfigurationService,
  fetchProcessCapabilities,
  getClientEnvironment,
  getProcessCapabilities,
  registerLazyActionImplementations,
  resolveProcessCapabilitiesUrl,
  startMiroirPlatformWith,
  VERSIONING_ACTION_IMPLEMENTATION_NAMES,
  VERSIONING_PACKAGE_NAME,
  type LocalCacheKind,
  type LocalCacheModule,
  type LocalCacheSliceState,
  type MiroirConfigClient,
  type MiroirPlatform,
  type MiroirPlatformOptions,
  type ProcessCapabilities,
} from "@miroir-framework/core";

import type { LocalCacheBinding, LocalCacheStateStore } from "./localCacheBinding.js";

/**
 * What a React client passes to `MiroirContextReactProvider` and `LocalCacheProvider` (#639): with the
 * binding of the local cache it started on (#656).
 */
export type MiroirClientPlatform = MiroirPlatform & {
  processCapabilities: ProcessCapabilities;
  localCacheBinding: LocalCacheBinding;
};

/** The startup options of a React client: the platform's, and the local cache to start on (#656). */
export type MiroirClientOptions = MiroirPlatformOptions & {
  /** `redux` when absent. */
  localCache?: LocalCacheKind;
};

/**
 * A local cache implementation, as the client takes it: the module to start on, the binding to render with, and
 * stores on a given state for tests and sandboxes.
 */
export type LoadedLocalCache = {
  localCacheModule: LocalCacheModule;
  localCacheBinding: LocalCacheBinding;
  createLocalCacheStateStore: (presentModelSnapshot: LocalCacheSliceState) => LocalCacheStateStore;
};

/**
 * #656: loads one local cache implementation, from its own entry; a bundler makes each a lazy chunk, so a
 * page holds the one it started on.
 */
export async function loadLocalCache(localCache: LocalCacheKind = "redux"): Promise<LoadedLocalCache> {
  switch (localCache) {
    case "redux":
      return import("./local-cache-redux.js");
    case "zustand":
      return import("./local-cache-zustand.js");
    default:
      throw new Error(`unknown local cache: ${localCache satisfies never}`);
  }
}

/**
 * The capabilities URL: relative for the stub, a passed client, or a browser on the server's origin
 * (or behind the Vite proxy); absolute for a real server outside a browser, where `fetch` refuses
 * relative URLs.
 */
function capabilitiesUrl(miroirConfig: MiroirConfigClient, options: MiroirClientOptions): string | undefined {
  if (options.restClient || miroirConfig.client.emulateServer || typeof globalThis.window !== "undefined") {
    return undefined;
  }
  return resolveProcessCapabilitiesUrl(miroirConfig.client.serverConfig.rootApiUrl);
}

/**
 * The startup call of a React client: the platform of core's `startMiroirPlatformWith` for a client
 * configuration, on the local cache `localCache` names, then the process capabilities, set on the
 * emulated server's stub when there is one, and read by both domain controllers.
 */
export async function startMiroirClient(
  miroirConfig: MiroirConfigClient,
  options: MiroirClientOptions,
): Promise<MiroirClientPlatform> {
  const { localCache, ...platformOptions } = options;
  const { localCacheModule, localCacheBinding } = await loadLocalCache(localCache);
  // fetch: the platform defaults to the bound global fetch, only when it builds a RestClient
  const platform = await startMiroirPlatformWith(localCacheModule, miroirConfig, platformOptions);
  // #696: an emulated server holds the stores, so it runs the versioning actions; a client talking to a
  // server forwards them and never loads the package
  if (platform.emulatedServer) {
    registerLazyActionImplementations({
      capability: "versioning",
      packageName: VERSIONING_PACKAGE_NAME,
      implementationNames: VERSIONING_ACTION_IMPLEMENTATION_NAMES,
      load: () => import("@miroir-framework/versioning"),
    });
  }
  platform.emulatedServer?.restClientStub.setProcessCapabilities(
    getProcessCapabilities({
      config: miroirConfig,
      environment: getClientEnvironment(),
      storeSectionFactoryRegister: ConfigurationService.configurationService.StoreSectionFactoryRegister,
      adminStoreFactoryRegister: ConfigurationService.configurationService.adminStoreFactoryRegister,
    }),
  );
  if (!platform.restClient) {
    throw new Error("startMiroirClient: a client configuration has a REST client");
  }
  const processCapabilities = await fetchProcessCapabilities(platform.restClient, capabilitiesUrl(miroirConfig, options));
  platform.domainController.setProcessCapabilities(processCapabilities);
  platform.emulatedServer?.domainController.setProcessCapabilities(processCapabilities);
  return { ...platform, processCapabilities, localCacheBinding };
}

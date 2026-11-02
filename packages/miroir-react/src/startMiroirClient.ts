import {
  ConfigurationService,
  fetchProcessCapabilities,
  getClientEnvironment,
  getProcessCapabilities,
  resolveProcessCapabilitiesUrl,
  type MiroirConfigClient,
  type ProcessCapabilities,
} from "@miroir-framework/core";

import {
  startMiroirPlatform,
  type MiroirPlatform,
  type MiroirPlatformOptions,
} from "./miroir-localcache-imports.js";

/** What a React client passes to `MiroirContextReactProvider` and `LocalCacheProvider` (#639). */
export type MiroirClientPlatform = MiroirPlatform & { processCapabilities: ProcessCapabilities };

/**
 * The capabilities URL: relative for the stub, a passed client, or a browser on the server's origin
 * (or behind the Vite proxy); absolute for a real server outside a browser, where `fetch` refuses
 * relative URLs.
 */
function capabilitiesUrl(miroirConfig: MiroirConfigClient, options: MiroirPlatformOptions): string | undefined {
  if (options.restClient || miroirConfig.client.emulateServer || typeof globalThis.window !== "undefined") {
    return undefined;
  }
  return resolveProcessCapabilitiesUrl(miroirConfig.client.serverConfig.rootApiUrl);
}

/**
 * The startup call of a React client: the platform of `startMiroirPlatform` for a client
 * configuration, then the process capabilities, set on the emulated server's stub when there is
 * one, and read by both domain controllers.
 */
export async function startMiroirClient(
  miroirConfig: MiroirConfigClient,
  options: MiroirPlatformOptions,
): Promise<MiroirClientPlatform> {
  // fetch: startMiroirPlatform defaults to the bound global fetch, only when it builds a RestClient
  const platform = await startMiroirPlatform(miroirConfig, options);
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
  return { ...platform, processCapabilities };
}

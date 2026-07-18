import type {
  DeploymentStorageConfig,
  LoggerOptions,
  MiroirConfigClient,
  StoreUnitConfiguration,
} from 'miroir-core';

import domainControllerDebugLogConfig from '../../../tests/specificLoggersConfig_DomainController_debug.json';
import {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  getIntegrationTestProfileCatalogEntry,
  listBrowserBundledIntegrationTestProfileNames,
  BROWSER_LAUNCHABLE_REAL_SERVER_PROFILES,
} from './integrationTestProfileCatalog.js';
/** Browser-only: bundled admin + IndexedDB Miroir/Library (no filesystem/sql — those factories are not registered in webApp). */
import browserEmulatedServerIndexedDbMiroirConfig from './miroirConfig.browser-emulatedServer-indexedDb.json';
/**
 * Browser → live miroir-server (B6-c). The store type (sql/filesystem/indexedDb/mongodb)
 * lives entirely on the server; the browser client is REST-only and never loads a local
 * store factory, so all four backends are equally launchable from the webApp picker.
 */
import browserRealServerSqlMiroirConfig from './miroirConfig.browser-realServer-sql.json';
import browserRealServerIndexedDbMiroirConfig from './miroirConfig.browser-realServer-indexedDb.json';
import browserRealServerFilesystemMiroirConfig from './miroirConfig.browser-realServer-filesystem.json';
import browserRealServerMongodbMiroirConfig from './miroirConfig.browser-realServer-mongodb.json';

export { DEFAULT_UI_INTEGRATION_PROFILE_NAME } from './integrationTestProfileCatalog.js';

export const DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE = 'ephemeral' as const;

type BrowserIntegrationTestProfileAssets = {
  miroirConfig: MiroirConfigClient;
  logConfig: LoggerOptions;
};

const BROWSER_INTEGRATION_TEST_PROFILE_ASSETS: Record<string, BrowserIntegrationTestProfileAssets> =
  {
    [DEFAULT_UI_INTEGRATION_PROFILE_NAME]: {
      miroirConfig: browserEmulatedServerIndexedDbMiroirConfig as unknown as MiroirConfigClient,
      logConfig: domainControllerDebugLogConfig as LoggerOptions,
    },
    'realServer-sql': {
      miroirConfig: browserRealServerSqlMiroirConfig as unknown as MiroirConfigClient,
      logConfig: domainControllerDebugLogConfig as LoggerOptions,
    },
    'realServer-indexedDb': {
      miroirConfig: browserRealServerIndexedDbMiroirConfig as unknown as MiroirConfigClient,
      logConfig: domainControllerDebugLogConfig as LoggerOptions,
    },
    'realServer-filesystem': {
      miroirConfig: browserRealServerFilesystemMiroirConfig as unknown as MiroirConfigClient,
      logConfig: domainControllerDebugLogConfig as LoggerOptions,
    },
    'realServer-mongodb': {
      miroirConfig: browserRealServerMongodbMiroirConfig as unknown as MiroirConfigClient,
      logConfig: domainControllerDebugLogConfig as LoggerOptions,
    },
  };

export function listBrowserIntegrationTestProfileNames(): string[] {
  return Object.keys(BROWSER_INTEGRATION_TEST_PROFILE_ASSETS).sort();
}

function getEmulatedDeploymentStorageConfig(
  config: MiroirConfigClient,
): DeploymentStorageConfig | undefined {
  const client = config.client;
  if (!client || client.emulateServer !== true) {
    return undefined;
  }
  return client.deploymentStorageConfig;
}

const BROWSER_SAFE_EMULATED_SERVER_TYPES = new Set(['indexedDb', 'bundled']);

/**
 * True when every deployment storage section is indexedDb or bundled
 * (safe for webApp PersistenceStoreController factories — no filesystem/sql/mongo).
 * Admin may be bundled (seeded entity tables); Miroir/Library stay indexedDb.
 */
export function isBrowserCompatibleEmulatedIndexedDbConfig(config: MiroirConfigClient): boolean {
  const deploymentStorageConfig = getEmulatedDeploymentStorageConfig(config);
  if (!deploymentStorageConfig) {
    return false;
  }
  for (const entry of Object.values(deploymentStorageConfig) as StoreUnitConfiguration[]) {
    for (const section of [entry.admin, entry.model, entry.data]) {
      if (
        !section ||
        !BROWSER_SAFE_EMULATED_SERVER_TYPES.has(section.emulatedServerType)
      ) {
        return false;
      }
    }
  }
  return true;
}

export function isBrowserCompatibleRealServerConfig(config: MiroirConfigClient): boolean {
  const client = config.client;
  if (!client || client.emulateServer !== false) {
    return false;
  }
  return typeof client.serverConfig?.rootApiUrl === 'string' && client.serverConfig.rootApiUrl.length > 0;
}

export async function loadBrowserIntegrationTestProfileConfig(
  profileName: string,
): Promise<BrowserIntegrationTestProfileAssets> {
  const assets = BROWSER_INTEGRATION_TEST_PROFILE_ASSETS[profileName];
  if (!assets) {
    throw new Error(
      `Unknown browser integration test profile: ${profileName}. ` +
        `Valid profiles: ${listBrowserIntegrationTestProfileNames().join(', ')}`,
    );
  }

  const catalogEntry = getIntegrationTestProfileCatalogEntry(profileName);
  if (catalogEntry?.uiTransport === 'realServer') {
    if (!isBrowserCompatibleRealServerConfig(assets.miroirConfig)) {
      throw new Error(
        `Browser integration profile "${profileName}" must set emulateServer: false with serverConfig.rootApiUrl`,
      );
    }
    return assets;
  }

  if (!isBrowserCompatibleEmulatedIndexedDbConfig(assets.miroirConfig)) {
    throw new Error(
      `Browser integration profile "${profileName}" must use indexedDb or bundled for all deployment sections ` +
        `(filesystem/sql/mongo factories are not registered in the webApp)`,
    );
  }
  return assets;
}

/** Profiles with bundled assets that the browser can load (emulated IndexedDB + all realServer-* profiles). */
export function listBrowserLaunchableIntegrationTestProfileNames(): string[] {
  return listBrowserIntegrationTestProfileNames().filter((name) => {
    const entry = getIntegrationTestProfileCatalogEntry(name);
    if (!entry) {
      return false;
    }
    if (entry.uiTransport === 'browserEmulatedIndexedDb') {
      return listBrowserBundledIntegrationTestProfileNames().includes(name);
    }
    if (entry.uiTransport === 'realServer') {
      return BROWSER_LAUNCHABLE_REAL_SERVER_PROFILES.includes(name);
    }
    return false;
  });
}

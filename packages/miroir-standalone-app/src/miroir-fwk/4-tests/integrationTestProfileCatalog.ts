/**
 * Browser-safe integration profile catalog (Gap D metadata for #197 B6 UI picker).
 * Config JSON is bundled separately in integrationTestProfileAssets.ts.
 */

export const DEFAULT_UI_INTEGRATION_PROFILE_NAME = "emulatedServer-sql";

export type IntegrationTestProfileCatalogEntry = {
  name: string;
  description: string;
  /** True when miroir/log config JSON is bundled for in-browser launcher runs. */
  browserAvailable: boolean;
};

/** Mirrors `INTEGRATION_TEST_PROFILES` in tests/helpers/integrationTestProfiles.ts. */
export const INTEGRATION_TEST_PROFILE_CATALOG: readonly IntegrationTestProfileCatalogEntry[] = [
  {
    name: "emulatedServer-sql",
    description: "Local default — admin filesystem, miroir + library Postgres",
    browserAvailable: true,
  },
  {
    name: "emulatedServer-filesystem",
    description: "All store sections on filesystem (no Postgres)",
    browserAvailable: false,
  },
  {
    name: "emulatedServer-indexedDb",
    description: "Miroir + library IndexedDB",
    browserAvailable: false,
  },
  {
    name: "emulatedServer-mongodb",
    description: "Miroir + library MongoDB",
    browserAvailable: false,
  },
  {
    name: "ci-emulatedServer-host-sql",
    description: "CI preset — host Postgres connection strings in JSON",
    browserAvailable: false,
  },
  {
    name: "ci-emulatedServer-dockerized-sql",
    description: "CI preset — dockerized Postgres connection strings in JSON",
    browserAvailable: false,
  },
] as const;

export function listIntegrationTestProfileCatalogEntries(): IntegrationTestProfileCatalogEntry[] {
  return [...INTEGRATION_TEST_PROFILE_CATALOG].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function getIntegrationTestProfileCatalogEntry(
  profileName: string,
): IntegrationTestProfileCatalogEntry | undefined {
  return INTEGRATION_TEST_PROFILE_CATALOG.find((entry) => entry.name === profileName);
}

export function listBrowserAvailableIntegrationTestProfileNames(): string[] {
  return INTEGRATION_TEST_PROFILE_CATALOG.filter((entry) => entry.browserAvailable)
    .map((entry) => entry.name)
    .sort();
}

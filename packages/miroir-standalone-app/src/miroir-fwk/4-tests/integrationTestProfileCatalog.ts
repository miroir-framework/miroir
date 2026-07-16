/**
 * UI integration profile catalog (#197 Phase B6).
 *
 * Profiles are filtered by **runtime surface** before appearing in the picker:
 * - **webApp:** in-browser emulated IndexedDB + launchable real-server profiles
 *   (`realServer-sql`, `realServer-indexedDb`, `realServer-filesystem`, `realServer-mongodb`).
 *   The realServer client is a pure REST client — it never loads a local store
 *   factory, so the store type used *on the server* (sql/filesystem/indexedDb/mongodb)
 *   is irrelevant to browser launchability. Only bundled config assets gate it
 *   (see `BROWSER_LAUNCHABLE_REAL_SERVER_PROFILES`).
 * - **electron:** all emulatedServer-* (Node store drivers in main process) + real-server
 * - **cliEmulatedOnly** (CI presets): never in UI picker — testMiroir / testByFile only
 */

export const DEFAULT_UI_INTEGRATION_PROFILE_NAME = "emulatedServer-indexedDb";

export type UiIntegrationRuntime = "webApp" | "electron";

/** How a profile is launched from the Miroir Tests UI. */
export type UiIntegrationProfileTransport =
  /** In-browser emulated stack — IndexedDB PSC (web + electron renderer). */
  | "browserEmulatedIndexedDb"
  /** Electron main process emulated stack — SQL / fs / mongo / indexedDb (B6-b2). */
  | "electronEmulated"
  /** Browser/Electron client → HTTPS `miroir-server` (`emulateServer: false`) — B6-c. */
  | "realServer"
  /** Node Vitest only — never shown in UI picker. */
  | "cliEmulatedOnly";

export type IntegrationTestProfileCatalogEntry = {
  name: string;
  description: string;
  uiTransport: UiIntegrationProfileTransport;
};

export const INTEGRATION_TEST_PROFILE_CATALOG: readonly IntegrationTestProfileCatalogEntry[] = [
  {
    name: "emulatedServer-indexedDb",
    description: "Emulated stack — IndexedDB (native in browser)",
    uiTransport: "browserEmulatedIndexedDb",
  },
  {
    name: "emulatedServer-sql",
    description: "Emulated stack — Postgres (Electron or CLI)",
    uiTransport: "electronEmulated",
  },
  {
    name: "emulatedServer-filesystem",
    description: "Emulated stack — all filesystem (Electron or CLI)",
    uiTransport: "electronEmulated",
  },
  {
    name: "emulatedServer-mongodb",
    description: "Emulated stack — MongoDB (Electron or CLI)",
    uiTransport: "electronEmulated",
  },
  {
    name: "ci-emulatedServer-host-sql",
    description: "CI — host Postgres (CLI only)",
    uiTransport: "cliEmulatedOnly",
  },
  {
    name: "ci-emulatedServer-dockerized-sql",
    description: "CI — dockerized Postgres (CLI only)",
    uiTransport: "cliEmulatedOnly",
  },
  {
    name: "realServer-sql",
    description: "Real server — Postgres via miroir-server (B6-c)",
    uiTransport: "realServer",
  },
  {
    name: "realServer-indexedDb",
    description: "Real server — IndexedDB via miroir-server (B6-c)",
    uiTransport: "realServer",
  },
  {
    name: "realServer-filesystem",
    description: "Real server — filesystem via miroir-server (B6-c)",
    uiTransport: "realServer",
  },
  {
    name: "realServer-mongodb",
    description: "Real server — MongoDB via miroir-server (B6-c)",
    uiTransport: "realServer",
  },
] as const;

/** Real-server profiles with browser-bundled config assets (B6-c C3). */
export const BROWSER_LAUNCHABLE_REAL_SERVER_PROFILES: readonly string[] = [
  "realServer-sql",
  "realServer-indexedDb",
  "realServer-filesystem",
  "realServer-mongodb",
];

export function detectUiIntegrationRuntime(): UiIntegrationRuntime {
  if (
    typeof window !== "undefined" &&
    typeof (window as { electronAPI?: { callMiroirIpc?: unknown } }).electronAPI
      ?.callMiroirIpc === "function"
  ) {
    return "electron";
  }
  return "webApp";
}

export function listIntegrationTestProfileCatalogEntries(): IntegrationTestProfileCatalogEntry[] {
  return [...INTEGRATION_TEST_PROFILE_CATALOG].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

/** Picker list — excludes CLI-only; filters emulated backends by runtime (B6-b2). */
export function listUiIntegrationProfileCatalogForPicker(
  runtime: UiIntegrationRuntime = detectUiIntegrationRuntime(),
): IntegrationTestProfileCatalogEntry[] {
  return listIntegrationTestProfileCatalogEntries().filter((entry) => {
    if (entry.uiTransport === "cliEmulatedOnly") {
      return false;
    }
    if (entry.uiTransport === "electronEmulated") {
      return runtime === "electron";
    }
    return true;
  });
}

export function getIntegrationTestProfileCatalogEntry(
  profileName: string,
): IntegrationTestProfileCatalogEntry | undefined {
  return INTEGRATION_TEST_PROFILE_CATALOG.find((entry) => entry.name === profileName);
}

export function listBrowserBundledIntegrationTestProfileNames(): string[] {
  return INTEGRATION_TEST_PROFILE_CATALOG.filter(
    (entry) => entry.uiTransport === "browserEmulatedIndexedDb",
  )
    .map((entry) => entry.name)
    .sort();
}

export function isUiIntegrationProfileLaunchableInBrowser(
  profileName: string,
  runtime: UiIntegrationRuntime = detectUiIntegrationRuntime(),
): boolean {
  const entry = getIntegrationTestProfileCatalogEntry(profileName);
  if (!entry) {
    return false;
  }
  switch (entry.uiTransport) {
    case "browserEmulatedIndexedDb":
      return listBrowserBundledIntegrationTestProfileNames().includes(profileName);
    case "electronEmulated":
      return false; // B6-b3: listed in Electron picker only; launch when bundled + wired
    case "realServer":
      // B6-c: launchable when profile assets are bundled (see BROWSER_LAUNCHABLE_REAL_SERVER_PROFILES).
      return BROWSER_LAUNCHABLE_REAL_SERVER_PROFILES.includes(profileName);
    case "cliEmulatedOnly":
      return false;
  }
}

/** @deprecated Use listBrowserBundledIntegrationTestProfileNames */
export function listBrowserAvailableIntegrationTestProfileNames(): string[] {
  return listBrowserBundledIntegrationTestProfileNames();
}

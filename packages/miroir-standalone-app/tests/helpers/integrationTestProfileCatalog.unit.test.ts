import { describe, expect, it } from "vitest";

import {
  DEFAULT_UI_INTEGRATION_PROFILE_NAME,
  getIntegrationTestProfileCatalogEntry,
  listBrowserAvailableIntegrationTestProfileNames,
  listIntegrationTestProfileCatalogEntries,
} from "../../src/miroir-fwk/4-tests/integrationTestProfileCatalog.js";

describe("integrationTestProfileCatalog (B6)", () => {
  it("lists six Gap D profiles sorted by name", () => {
    const names = listIntegrationTestProfileCatalogEntries().map((entry) => entry.name);
    expect(names).toHaveLength(6);
    expect(names).toEqual([...names].sort());
  });

  it("marks only emulatedServer-sql as browser available in the pilot", () => {
    expect(listBrowserAvailableIntegrationTestProfileNames()).toEqual([
      DEFAULT_UI_INTEGRATION_PROFILE_NAME,
    ]);
  });

  it("returns profile descriptions", () => {
    const entry = getIntegrationTestProfileCatalogEntry("emulatedServer-indexedDb");
    expect(entry?.description).toContain("IndexedDB");
    expect(entry?.browserAvailable).toBe(false);
  });
});

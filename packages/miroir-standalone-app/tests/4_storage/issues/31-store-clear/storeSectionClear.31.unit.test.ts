/**
 * #31 — store section clear() must empty the persisted store even when the section was just
 * opened and knows no Entity yet (no bootFromPersistedState, no createStorageSpaceForInstancesOfEntity).
 *
 * ```bash
 * npm run testByFile -w miroir-standalone-app -- storeSectionClear.31
 * ```
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type {
  Entity,
  PersistenceStoreDataSectionInterface,
  StorageType,
  StoreSectionConfiguration,
} from "@miroir-framework/core";
import { ConfigurationServiceInner } from "@miroir-framework/core";
import { miroirFileSystemStoreSectionStartup } from "@miroir-framework/store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "@miroir-framework/store-indexeddb";

const entity = {
  uuid: "8d3f7c1e-31a0-4c2b-9e5d-0a1b2c3d4e5f",
  parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
  name: "Issue31Entity",
} as unknown as Entity;

const instance = {
  uuid: "f1e2d3c4-b5a6-4978-8a9b-0c1d2e3f4a5b",
  parentUuid: entity.uuid,
  name: "an instance",
} as any;

const configurationService = new ConfigurationServiceInner();
miroirFileSystemStoreSectionStartup(configurationService);
miroirIndexedDbStoreSectionStartup(configurationService);

const cases: { storage: StorageType; config: StoreSectionConfiguration }[] = [
  { storage: "indexedDb", config: { emulatedServerType: "indexedDb", indexedDbName: "issue31" } as StoreSectionConfiguration },
  { storage: "filesystem", config: { emulatedServerType: "filesystem", directory: "issue31" } as StoreSectionConfiguration },
];

async function makeSection(
  storage: StorageType,
  section: "data" | "model",
  config: StoreSectionConfiguration,
  rootDirectory: string,
  dataStore?: PersistenceStoreDataSectionInterface,
): Promise<any> {
  const factory = configurationService.StoreSectionFactoryRegister.get(JSON.stringify({ storageType: storage, section }));
  if (!factory) throw new Error(`no ${section} store section factory for ${storage}`);
  const store: any = await factory(section, config, rootDirectory, dataStore);
  await store.open();
  return store;
}

describe.each(cases)("#31 store section clear() on $storage", ({ storage, config }) => {
  let rootDirectory: string;
  beforeEach(() => {
    rootDirectory = mkdtempSync(path.join(tmpdir(), `miroir-31-${storage}-`));
  });
  afterEach(() => {
    rmSync(rootDirectory, { recursive: true, force: true });
  });

  it.each(["data", "model"] as const)("%s section: clear() right after open() removes persisted instances", async (section) => {
    // write an instance, then close: the store now holds data on disk
    const writerData = await makeSection(storage, "data", config, rootDirectory);
    const writer = section == "data" ? writerData : await makeSection(storage, "model", config, rootDirectory, writerData);
    await writer.createStorageSpaceForInstancesOfEntity(entity);
    await writer.upsertInstance(entity.uuid, instance);
    expect((await writer.getInstances(entity.uuid)).returnedDomainElement.instances).toHaveLength(1);
    await writer.close();
    if (writer !== writerData) await writerData.close();

    // a fresh section, opened without bootFromPersistedState, as in a test's beforeEach resetModel
    const freshData = await makeSection(storage, "data", config, rootDirectory);
    const fresh = section == "data" ? freshData : await makeSection(storage, "model", config, rootDirectory, freshData);
    expect((await fresh.getInstances(entity.uuid)).returnedDomainElement.instances).toHaveLength(1);

    const clearResult = await fresh.clear();
    expect(clearResult.status).toBe("ok");

    const after = await fresh.getInstances(entity.uuid);
    expect(after.status).toBe("ok");
    expect(after.returnedDomainElement.instances).toHaveLength(0);
    await fresh.close();
    if (fresh !== freshData) await freshData.close();
  });
});

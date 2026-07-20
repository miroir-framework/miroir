/**
 * adminMigration.ts
 *
 * On first run of the sandbox app (or when `?reset` appears in the URL),
 * copies all bundled admin deployment data (model + data sections) from the
 * read-only bundled store into an IndexedDB store so that the admin deployment
 * becomes writable (e.g. to add or remove application deployments at runtime).
 *
 * Subsequent page loads detect the existing IndexedDB data and skip the copy.
 *
 * Reset: navigate to the app with `?reset` in the URL query string (e.g.
 * `http://localhost:5173/?reset`) to wipe and re-copy the admin data from the
 * bundled defaults.
 */

import {
  Action2Error,
  Domain2ElementFailed,
  PersistenceStoreControllerManager,
  type Entity,
  type EntityDefinition,
  type EntityInstanceCollection,
  type StoreUnitConfiguration,
} from "miroir-core";

import { entityEntity } from "miroir-test-app_deployment-miroir";
// ---------------------------------------------------------------------------
// IndexedDB config for the writable admin deployment
// ---------------------------------------------------------------------------
// The IndexedDB factory appends a suffix to indexedDbName:
//   admin section → <name>-model
//   model section → <name>-model
//   data  section → <name>-data
//
// Using DIFFERENT indexedDbName values for the admin vs. model sections
// prevents two Level.js instances from trying to open the same underlying
// IndexedDB database simultaneously (which Level would reject).
export const ADMIN_DEPLOYMENT_INDEXEDDB_CONFIG: StoreUnitConfiguration = {
  admin: { emulatedServerType: "indexedDb", indexedDbName: "sandbox-admin-admin" },
  model: { emulatedServerType: "indexedDb", indexedDbName: "sandbox-admin" },
  data:  { emulatedServerType: "indexedDb", indexedDbName: "sandbox-admin" },
};

// Temporary deployment UUIDs used only during the migration phase.
// Must not collide with any real deployment UUID.
const TEMP_BUNDLED_UUID = "00000000-0000-4000-a000-000000000001";
const TEMP_IDB_UUID     = "00000000-0000-4000-a000-000000000002";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when the IndexedDB admin store already contains Entity records
 * in its model section (i.e. it was previously initialised from bundled data).
 */
async function isAdminIndexedDbInitialized(
  storeManager: PersistenceStoreControllerManager,
  idbUuid: string,
): Promise<boolean> {
  const controller = storeManager.getPersistenceStoreController(idbUuid);
  if (!controller) return false;

  const result = await controller.getInstances("model", entityEntity.uuid);
  if (
    result instanceof Action2Error ||
    result.returnedDomainElement instanceof Domain2ElementFailed
  ) {
    return false;
  }
  return (result.returnedDomainElement as EntityInstanceCollection).instances.length > 0;
}

/**
 * Copies all model and data instances from the bundled admin store
 * into the IndexedDB admin store.
 *
 * IndexedDB requires storage sublevels to be registered (via
 * `createStorageSpaceForInstancesOfEntity`) before any write can succeed.
 * This function registers each sublevel before writing its instances.
 * Registering also clears any stale data in that sublevel, which is exactly
 * what we want for both first-run and reset scenarios.
 */
async function copyBundledToIndexedDb(
  storeManager: PersistenceStoreControllerManager,
  bundledUuid: string,
  idbUuid: string,
  modelParentUuids: string[],
): Promise<void> {
  const bundled = storeManager.getPersistenceStoreController(bundledUuid)!;
  const idb     = storeManager.getPersistenceStoreController(idbUuid)!;

  // ── model section ──────────────────────────────────────────────────────
  for (const parentUuid of modelParentUuids) {
    // Register the sublevel in the IndexedDB model section's internal Map
    // (and clear any stale data it may contain) before writing.
    // The entity/entityDefinition args only need to supply matching `uuid` /
    // `entityUuid` values; the rest of the object is unused here.
    await idb.createModelStorageSpaceForInstancesOfEntity(
      { uuid: parentUuid } as Entity,
      { uuid: parentUuid, entityUuid: parentUuid } as unknown as EntityDefinition,
    );

    const result = await bundled.getInstances("model", parentUuid);
    if (
      result instanceof Action2Error ||
      result.returnedDomainElement instanceof Domain2ElementFailed
    ) {
      continue; // nothing to copy for this parentUuid
    }
    for (const instance of (result.returnedDomainElement as EntityInstanceCollection).instances) {
      const writeResult = await idb.upsertInstance("model", instance);
      if (writeResult instanceof Action2Error) {
        console.error(
          "adminMigration copyBundledToIndexedDb: upsertInstance failed for model instance",
          instance,
          "error:",
          writeResult,
        );
      }
    }
  }

  // ── data section ───────────────────────────────────────────────────────
  // `getEntityUuids()` on the bundled controller returns the parentUuids
  // present in its data section.
  const dataParentUuids = bundled.getEntityUuids();

  for (const parentUuid of dataParentUuids) {
    // `createDataStorageSpaceForInstancesOfEntity` is not part of the public
    // PersistenceStoreControllerInterface so we access it via any-cast.
    await (idb as any).createDataStorageSpaceForInstancesOfEntity(
      { uuid: parentUuid } as Entity,
      { uuid: parentUuid, entityUuid: parentUuid } as unknown as EntityDefinition,
    );

    const result = await bundled.getInstances("data", parentUuid);
    if (
      result instanceof Action2Error ||
      result.returnedDomainElement instanceof Domain2ElementFailed
    ) {
      continue;
    }
    for (const instance of (result.returnedDomainElement as EntityInstanceCollection).instances) {
      const writeResult = await idb.upsertInstance("data", instance);
      if (writeResult instanceof Action2Error) {
        console.error(
          "adminMigration copyBundledToIndexedDb: upsertInstance failed for data instance",
          instance,
          "error:",
          writeResult,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Ensures the admin deployment data exists in IndexedDB, copying it from the
 * bundled (read-only) store on first run or when `?reset` is present in the
 * URL query string.
 *
 * Must be called **before** the normal store-opening flow in `startDemoApp`
 * so that the real admin store is not yet registered in the storeManager.
 *
 * @param storeManager        The server-side persistence store controller manager.
 * @param adminBundledConfig  StoreUnitConfiguration pointing to the read-only
 *                            bundled admin store.
 * @param adminModelParentUuids  All parentUuids present in the admin model
 *                               section (from ADMIN_MODEL_PARENT_UUIDS in
 *                               bundledData.ts).
 * @returns The StoreUnitConfiguration to use when opening the admin deployment.
 *          Always `ADMIN_DEPLOYMENT_INDEXEDDB_CONFIG`.
 */
export async function migrateAdminToIndexedDbIfNeeded(
  storeManager: PersistenceStoreControllerManager,
  adminBundledConfig: StoreUnitConfiguration,
  adminModelParentUuids: string[],
): Promise<StoreUnitConfiguration> {
  const shouldReset = new URLSearchParams(window.location.search).has("reset");

  // 1. Open the bundled admin store under a temporary UUID (read-only source).
  await storeManager.addPersistenceStoreController(TEMP_BUNDLED_UUID, adminBundledConfig);
  await storeManager.getPersistenceStoreController(TEMP_BUNDLED_UUID)?.open();

  // 2. Open the IndexedDB admin store under a temporary UUID (check / write target).
  await storeManager.addPersistenceStoreController(TEMP_IDB_UUID, ADMIN_DEPLOYMENT_INDEXEDDB_CONFIG);
  await storeManager.getPersistenceStoreController(TEMP_IDB_UUID)?.open();

  // 3. Decide whether to (re-)initialise.
  const alreadyInitialized =
    !shouldReset && (await isAdminIndexedDbInitialized(storeManager, TEMP_IDB_UUID));

  if (!alreadyInitialized) {
    console.info("adminMigration: copying bundled admin data to IndexedDB …");
    await copyBundledToIndexedDb(
      storeManager,
      TEMP_BUNDLED_UUID,
      TEMP_IDB_UUID,
      adminModelParentUuids,
    );
    console.info("adminMigration: copy complete.");
  } else {
    console.info("adminMigration: IndexedDB admin data already present, skipping copy.");
  }

  // 4. Close and remove the temporary controllers.  The underlying Level dbs
  //    remain on disk / in the browser and will be re-opened under the real
  //    deployment UUID by the caller.
  await storeManager.deletePersistenceStoreController(TEMP_BUNDLED_UUID);
  await storeManager.deletePersistenceStoreController(TEMP_IDB_UUID);

  // 5. Inform the caller to open the admin deployment with the IndexedDB config.
  return ADMIN_DEPLOYMENT_INDEXEDDB_CONFIG;
}

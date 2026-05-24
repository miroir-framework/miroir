/**
 * bundledData.ts
 *
 * Groups all statically-imported instances from the deployment packages
 * into the BundledDeploymentData structure expected by miroir-store-bundled.
 *
 * The classification of instances into model vs data sections is
 * deployment-specific:
 *   - Miroir deployment: only entity + entityDefinition instances go into model
 *     (all others live in miroir_data/ and go into data)
 *   - Admin deployment: reports, menus, selfApplication, selfApplicationVersion,
 *     selfApplicationModelBranch and storeBasedConfiguration also live in
 *     admin_model/ and must go into the model section.
 * Admin section = empty (no admin-level data needed for read-only demo)
 */

import type { EntityInstance, MiroirConfigClient, StoreUnitConfiguration } from "miroir-core";
import type { BundledDeploymentData, BundledSectionData } from "miroir-store-bundled";

import * as adminDeployment from "miroir-test-app_deployment-admin";
import {
  deployment_Admin as localDeploymentAdmin,
  deployment_Miroir as localDeploymentMiroir,
} from "miroir-test-app_deployment-admin";
import * as miroirDeployment from "miroir-test-app_deployment-miroir";

// ---------------------------------------------------------------------------
// Deployment UUIDs
// ---------------------------------------------------------------------------
export const MIROIR_DEPLOYMENT_UUID = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
export const ADMIN_DEPLOYMENT_UUID = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";

// ---------------------------------------------------------------------------
// Bundled config for each deployment (read-only, used as migration source)
// ---------------------------------------------------------------------------
export const ADMIN_BUNDLED_CONFIG: StoreUnitConfiguration = {
  admin: { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
  model: { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
  data:  { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
};

// TODO: duplicates from miroir-test-app_deployment-admin, and miroir-test-app_deployment-miroir
export const demoMiroirConfig: MiroirConfigClient = {
  miroirConfigType: "client",
  client: {
    emulateServer: true,
    rootApiUrl: "http://localhost:3080",
    filesystemDeploymentRootDirectory: "no-filesystem-in-demo",
    deploymentStorageConfig: {
      [MIROIR_DEPLOYMENT_UUID]: {
        admin: { emulatedServerType: "bundled", deploymentUuid: MIROIR_DEPLOYMENT_UUID },
        model: { emulatedServerType: "bundled", deploymentUuid: MIROIR_DEPLOYMENT_UUID },
        data:  { emulatedServerType: "bundled", deploymentUuid: MIROIR_DEPLOYMENT_UUID },
      },
      [ADMIN_DEPLOYMENT_UUID]: {
        admin: { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
        model: { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
        data:  { emulatedServerType: "bundled", deploymentUuid: ADMIN_DEPLOYMENT_UUID },
      },
    },
  },
};


// ---------------------------------------------------------------------------
// Entity & EntityDefinition parentUuids  →  go into the model section
// Each deployment has its own set because admin_model/ contains many more
// entity types than miroir_model/ (which only has entity + entityDefinition).
// ---------------------------------------------------------------------------

/**
 * For the Miroir deployment: only entity + entityDefinition live in miroir_model/.
 * Everything else (reports, menus, selfApplication, etc.) is in miroir_data/.
 */
const MIROIR_MODEL_PARENT_UUIDS = new Set([
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad", // entityEntity
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd", // entityEntityDefinition
]);

/**
 * For the Admin deployment: admin_model/ also contains reports, menus,
 * selfApplication, selfApplicationVersion, selfApplicationModelBranch, and
 * storeBasedConfiguration instances — all of which must go into the model
 * section so that loadConfigurationFromPersistenceStore can find them when it
 * queries metaModelEntities from the model section.
 *
 * Exported as an array so that adminMigration.ts can iterate over it when
 * copying the bundled admin model section into IndexedDB.
 */
export const ADMIN_MODEL_PARENT_UUIDS_ARRAY: string[] = [
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad", // entityEntity
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd", // entityEntityDefinition
  "3f2baa83-3ef7-45ce-82ea-6a43f7a8c916", // entityReport (8 admin reports)
  "dde4c883-ae6d-47c3-b6df-26bc6e3c1842", // entityMenu  (AdminMenu)
  "a659d350-dd97-4da9-91de-524fa01745dc", // entitySelfApplication
  "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24", // entitySelfApplicationVersion
  "cdb0aec6-b848-43ac-a058-fe2dbe5811f1", // entitySelfApplicationModelBranch
  "7990c0c9-86c3-40a1-a121-036c91b55ed7", // entityStoreBasedConfiguration (selfApp config)
  // empty placeholder dirs in admin_model/ — safe to include, produce [] in model
  "3d8da4d4-8f76-4bb4-9212-14869d81c00c", // entityEndpointVersion (no admin endpoints)
  "5e81e1b9-38be-487c-b3e5-53796c57fccf", // entityJzodSchema
  "bdcf956a-771d-40a1-a878-06e0bf6efd3e", // (placeholder)
  "e4320b9e-ab45-4abe-85d8-359604b3c62f", // entityQueryVersion
  "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd", // entityRunner
];

/** Set version of the array, used internally for O(1) lookups. */
const ADMIN_MODEL_PARENT_UUIDS = new Set(ADMIN_MODEL_PARENT_UUIDS_ARRAY);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function groupByParentUuid(
  starImport: Record<string, unknown>,
): Record<string, EntityInstance[]> {
  const result: Record<string, EntityInstance[]> = {};
  for (const item of Object.values(starImport)) {
    if (
      item &&
      typeof item === "object" &&
      "parentUuid" in item &&
      "uuid" in item
    ) {
      const typed = item as EntityInstance;
      const parentUuid = typed.parentUuid;
      if (!parentUuid) continue;
      if (!result[parentUuid]) result[parentUuid] = [];
      result[parentUuid].push(typed);
    }
  }
  return result;
}

function makeBundledDeploymentData(
  starImport: Record<string, unknown>,
  dataOverrides: BundledSectionData = {},
  modelParentUuids: Set<string> = MIROIR_MODEL_PARENT_UUIDS,
): BundledDeploymentData {
  const all = groupByParentUuid(starImport);

  const model: BundledSectionData = {};
  const data: BundledSectionData = {};

  for (const [parentUuid, instances] of Object.entries(all)) {
    if (modelParentUuids.has(parentUuid)) {
      model[parentUuid] = instances;
    } else {
      data[parentUuid] = instances;
    }
  }

  return { admin: {} as BundledSectionData, model, data: {...data, ...dataOverrides} };
}

// ---------------------------------------------------------------------------
// Exported bundled data objects, keyed by deploymentUuid
// ---------------------------------------------------------------------------
export const demoBundledData: Record<string, BundledDeploymentData> = {
  [MIROIR_DEPLOYMENT_UUID]: makeBundledDeploymentData(
    miroirDeployment as unknown as Record<string, unknown>,
  ),
  [ADMIN_DEPLOYMENT_UUID]: makeBundledDeploymentData(
    adminDeployment as unknown as Record<string, unknown>,
    {
      "7959d814-400c-4e80-988f-a00fe582ab98": [
        {
          ...localDeploymentAdmin,
          configuration: (demoMiroirConfig as any).client.deploymentStorageConfig[ADMIN_DEPLOYMENT_UUID] as StoreUnitConfiguration,
        } as unknown as EntityInstance,
        {
          ...localDeploymentMiroir,
          configuration: (demoMiroirConfig as any).client.deploymentStorageConfig[MIROIR_DEPLOYMENT_UUID] as StoreUnitConfiguration,
        } as unknown as EntityInstance,
      ],
    },
    ADMIN_MODEL_PARENT_UUIDS,
  )
};

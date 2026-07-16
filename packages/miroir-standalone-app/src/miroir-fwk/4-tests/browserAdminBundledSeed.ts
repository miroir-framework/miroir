/**
 * Browser UI integ — seed for admin deployment as a bundled (in-memory) store.
 * Empty IndexedDB admin has no AdminApplication / Deployment entity tables, so
 * `createDeploymentCompositeAction` fails. Bundled admin mirrors the sandbox demo
 * seed from `miroir-test-app_deployment-admin` (see packages/miroir-sandbox/src/bundledData.ts).
 */

import type { EntityInstance, StoreUnitConfiguration } from 'miroir-core';
import type { BundledDeploymentData, BundledSectionData } from 'miroir-store-bundled';
import * as adminDeployment from 'miroir-test-app_deployment-admin';
import {
  deployment_Admin as localDeploymentAdmin,
  deployment_Miroir as localDeploymentMiroir,
} from 'miroir-test-app_deployment-admin';

export const ADMIN_DEPLOYMENT_UUID = '18db21bf-f8d3-4f6a-8296-84b69f6dc48b';
export const MIROIR_DEPLOYMENT_UUID = '10ff36f2-50a3-48d8-b80f-e48e5d13af8e';

export const ADMIN_BUNDLED_STORE_UNIT_CONFIGURATION: StoreUnitConfiguration = {
  admin: { emulatedServerType: 'bundled', deploymentUuid: ADMIN_DEPLOYMENT_UUID },
  model: { emulatedServerType: 'bundled', deploymentUuid: ADMIN_DEPLOYMENT_UUID },
  data: { emulatedServerType: 'bundled', deploymentUuid: ADMIN_DEPLOYMENT_UUID },
};

/** Admin model section parent Uuids (see sandbox bundledData.ts). */
const ADMIN_MODEL_PARENT_UUIDS = new Set([
  '16dbfe28-e1d7-4f20-9ba4-c1a9873202ad',
  '54b9c72f-d4f3-4db9-9e0e-0dc840b530bd',
  '3f2baa83-3ef7-45ce-82ea-6a43f7a8c916',
  'dde4c883-ae6d-47c3-b6df-26bc6e3c1842',
  'a659d350-dd97-4da9-91de-524fa01745dc',
  'c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24',
  'cdb0aec6-b848-43ac-a058-fe2dbe5811f1',
  '7990c0c9-86c3-40a1-a121-036c91b55ed7',
  '3d8da4d4-8f76-4bb4-9212-14869d81c00c',
  '5e81e1b9-38be-487c-b3e5-53796c57fccf',
  'bdcf956a-771d-40a1-a878-06e0bf6efd3e',
  'e4320b9e-ab45-4abe-85d8-359604b3c62f',
  'e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd',
]);

function groupByParentUuid(
  starImport: Record<string, unknown>,
): Record<string, EntityInstance[]> {
  const result: Record<string, EntityInstance[]> = {};
  for (const item of Object.values(starImport)) {
    if (item && typeof item === 'object' && 'parentUuid' in item && 'uuid' in item) {
      const typed = item as EntityInstance;
      const parentUuid = typed.parentUuid;
      if (!parentUuid) continue;
      if (!result[parentUuid]) result[parentUuid] = [];
      result[parentUuid].push(typed);
    }
  }
  return result;
}

function makeAdminBundledDeploymentData(
  starImport: Record<string, unknown>,
  dataOverrides: BundledSectionData,
): BundledDeploymentData {
  const all = groupByParentUuid(starImport);
  const model: BundledSectionData = {};
  const data: BundledSectionData = {};
  for (const [parentUuid, instances] of Object.entries(all)) {
    if (ADMIN_MODEL_PARENT_UUIDS.has(parentUuid)) {
      model[parentUuid] = instances;
    } else {
      data[parentUuid] = instances;
    }
  }
  return { admin: {}, model, data: { ...data, ...dataOverrides } };
}

/** Bundled admin seed for browser UI integration launcher. */
export function buildBrowserAdminBundledDeploymentData(
  miroirDeploymentStoreConfig: StoreUnitConfiguration,
): Record<string, BundledDeploymentData> {
  return {
    [ADMIN_DEPLOYMENT_UUID]: makeAdminBundledDeploymentData(
      adminDeployment as unknown as Record<string, unknown>,
      {
        '7959d814-400c-4e80-988f-a00fe582ab98': [
          {
            ...localDeploymentAdmin,
            configuration: ADMIN_BUNDLED_STORE_UNIT_CONFIGURATION,
          } as unknown as EntityInstance,
          {
            ...localDeploymentMiroir,
            configuration: miroirDeploymentStoreConfig,
          } as unknown as EntityInstance,
        ],
      },
    ),
  };
}

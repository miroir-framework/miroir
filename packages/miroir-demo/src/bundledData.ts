/**
 * bundledData.ts
 *
 * Groups all statically-imported instances from the deployment packages
 * into the BundledDeploymentData structure expected by miroir-store-bundled.
 *
 * Model section  = Entity + EntityDefinition instances
 *   (parentUuid in MODEL_PARENT_UUIDS)
 * Data section   = all other instances (reports, queries, menus, …)
 * Admin section  = empty (no admin-level data needed for read-only demo)
 */

import type { EntityInstance } from "miroir-core";
import type { BundledDeploymentData, BundledSectionData } from "miroir-store-bundled";

import * as adminDeployment from "miroir-test-app_deployment-admin";
import * as miroirDeployment from "miroir-test-app_deployment-miroir";

// ---------------------------------------------------------------------------
// Deployment UUIDs
// ---------------------------------------------------------------------------
export const MIROIR_DEPLOYMENT_UUID = "10ff36f2-50a3-48d8-b80f-e48e5d13af8e";
export const ADMIN_DEPLOYMENT_UUID = "18db21bf-f8d3-4f6a-8296-84b69f6dc48b";

// ---------------------------------------------------------------------------
// Entity & EntityDefinition parentUuids  →  go into the model section
// ---------------------------------------------------------------------------
const MODEL_PARENT_UUIDS = new Set([
  "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad", // entityEntity
  "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd", // entityEntityDefinition
]);

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
): BundledDeploymentData {
  const all = groupByParentUuid(starImport);

  const model: BundledSectionData = {};
  const data: BundledSectionData = {};

  for (const [parentUuid, instances] of Object.entries(all)) {
    if (MODEL_PARENT_UUIDS.has(parentUuid)) {
      model[parentUuid] = instances;
    } else {
      data[parentUuid] = instances;
    }
  }

  return { admin: {} as BundledSectionData, model, data };
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
  ),
};

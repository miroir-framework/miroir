/**
 * Node-only model-validation helpers that read instance JSON from the filesystem.
 * Keep this out of the main miroir-core browser entry — Vite cannot bundle node:fs.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export {
  listCliRunnerIntegrationSuiteKeysFromFolders,
  listCliTransformerIntegrationSuiteKeysFromFolders,
  listCliUnitSuiteKeysFromFolders,
  loadApplicationMiroirTestCatalog,
  loadApplicationMiroirTestsFromFolders,
  loadMiroirCoreTestSuiteFromFolders,
  resolveCliSuiteKeysFromCatalog,
  resolveMonorepoRoot,
} from "./loadApplicationMiroirTestsFromFolders.js";

import type {
  Entity,
  JzodElement,
  MetaModel,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type {
  ModelValidationGroup,
  ModelValidationInstanceModule,
} from "./ModelValidationTools.js";

export type BuildModelValidationGroupsFromFilesystemParams = {
  /** Absolute path to the application model store root (e.g. .../library_model). */
  modelPath: string;
  /** Absolute path to the application data store root (e.g. .../library_data). */
  dataPath: string;
  /** Miroir meta-model: supplies schemas for meta-entity instance groups. */
  miroirMetaModel: MetaModel;
  /**
   * Meta-entity names to skip even when instance files exist
   * (e.g. MiroirTest often needs an extended schema / separate suite).
   */
  excludeEntityNames?: string[];
};

/** Load `*.json` files under `dir` into the same shape as `import.meta.glob(..., { eager: true })`. */
export function loadModelValidationInstancesFromDir(
  dir: string,
): Record<string, ModelValidationInstanceModule> {
  if (!existsSync(dir)) {
    return {};
  }
  const result: Record<string, ModelValidationInstanceModule> = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const fullPath = join(dir, entry.name);
    result[fullPath] = {
      default: JSON.parse(readFileSync(fullPath, "utf8")),
    };
  }
  return result;
}

/**
 * Build `modelTestsToRun` by scanning filesystem model/data folders.
 *
 * - One group per Miroir meta-entity that has instances under `modelPath/<entityUuid>/`
 *   (schema from the corresponding Entity).
 * - One group per application Entity declared under the Entity folder, with instances from
 *   `dataPath/<entityUuid>/` (fallback: `modelPath/<entityUuid>/`), schema from that Entity.
 */
export function buildModelValidationGroupsFromFilesystem(
  params: BuildModelValidationGroupsFromFilesystemParams,
): ModelValidationGroup[] {
  const {
    modelPath,
    dataPath,
    miroirMetaModel,
    excludeEntityNames = [],
  } = params;
  const excluded = new Set(excludeEntityNames);

  const groups: ModelValidationGroup[] = [];

  for (const entity of miroirMetaModel.entities) {
    if (excluded.has(entity.name)) {
      continue;
    }
    if (!entity.mlSchema) {
      continue;
    }
    const instances = loadModelValidationInstancesFromDir(join(modelPath, entity.uuid));
    if (Object.keys(instances).length === 0) {
      continue;
    }
    groups.push({
      groupName: entity.name,
      jzodSchema: entity.mlSchema as unknown as JzodElement,
      instances,
    });
  }

  const entityEntity = miroirMetaModel.entities.find((entity) => entity.name === "Entity");
  if (!entityEntity) {
    throw new Error(
      "buildModelValidationGroupsFromFilesystem: miroirMetaModel must include Entity",
    );
  }

  const appEntities = Object.values(
    loadModelValidationInstancesFromDir(join(modelPath, entityEntity.uuid)),
  ).map((module) => module.default as Entity);

  for (const appEntity of appEntities) {
    if (excluded.has(appEntity.name)) {
      continue;
    }
    if (!appEntity.mlSchema) {
      continue;
    }
    let instances = loadModelValidationInstancesFromDir(join(dataPath, appEntity.uuid));
    if (Object.keys(instances).length === 0) {
      instances = loadModelValidationInstancesFromDir(join(modelPath, appEntity.uuid));
    }
    if (Object.keys(instances).length === 0) {
      continue;
    }
    groups.push({
      groupName: appEntity.name,
      jzodSchema: appEntity.mlSchema as unknown as JzodElement,
      instances,
    });
  }

  return groups;
}

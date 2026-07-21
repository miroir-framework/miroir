/**
 * Node-only model-validation helpers that read instance JSON from the filesystem.
 * Keep this out of the main miroir-core browser entry — Vite cannot bundle node:fs.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  Entity,
  EntityDefinition,
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

function resolveEntityDefinitionForEntity(
  entity: Entity,
  entityDefinitions: readonly EntityDefinition[],
): EntityDefinition | undefined {
  const byUuid = entityDefinitions.filter((ed) => ed.entityUuid === entity.uuid);
  if (byUuid.length === 1) {
    return byUuid[0];
  }
  if (byUuid.length > 1) {
    return byUuid.find((ed) => ed.name === entity.name) ?? byUuid[0];
  }
  return entityDefinitions.find((ed) => ed.name === entity.name);
}

/**
 * Build `modelTestsToRun` by scanning filesystem model/data folders.
 *
 * - One group per Miroir meta-entity that has instances under `modelPath/<entityUuid>/`
 *   (schema from `miroirMetaModel.entityDefinitions`).
 * - One group per application Entity declared under the Entity folder, with instances from
 *   `dataPath/<entityUuid>/` (fallback: `modelPath/<entityUuid>/`), schema from the matching
 *   EntityDefinition file in the model store.
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
    const entityDefinition = resolveEntityDefinitionForEntity(
      entity,
      miroirMetaModel.entityDefinitions,
    );
    if (!entityDefinition?.mlSchema) {
      continue;
    }
    const instances = loadModelValidationInstancesFromDir(join(modelPath, entity.uuid));
    if (Object.keys(instances).length === 0) {
      continue;
    }
    groups.push({
      groupName: entity.name,
      jzodSchema: entityDefinition.mlSchema as unknown as JzodElement,
      instances,
    });
  }

  const entityEntity = miroirMetaModel.entities.find((entity) => entity.name === "Entity");
  const entityEntityDefinition = miroirMetaModel.entities.find(
    (entity) => entity.name === "EntityDefinition",
  );
  if (!entityEntity || !entityEntityDefinition) {
    throw new Error(
      "buildModelValidationGroupsFromFilesystem: miroirMetaModel must include Entity and EntityDefinition",
    );
  }

  const appEntities = Object.values(
    loadModelValidationInstancesFromDir(join(modelPath, entityEntity.uuid)),
  ).map((module) => module.default as Entity);

  const appEntityDefinitions = Object.values(
    loadModelValidationInstancesFromDir(join(modelPath, entityEntityDefinition.uuid)),
  ).map((module) => module.default as EntityDefinition);

  const appEntityDefinitionsByEntityUuid = Object.fromEntries(
    appEntityDefinitions.map((entityDefinition) => [
      entityDefinition.entityUuid,
      entityDefinition,
    ]),
  );

  for (const appEntity of appEntities) {
    if (excluded.has(appEntity.name)) {
      continue;
    }
    const entityDefinition = appEntityDefinitionsByEntityUuid[appEntity.uuid];
    if (!entityDefinition?.mlSchema) {
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
      jzodSchema: entityDefinition.mlSchema as unknown as JzodElement,
      instances,
    });
  }

  return groups;
}

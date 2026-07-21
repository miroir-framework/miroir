/**
 * Framework-agnostic model-instance validation helpers.
 * Used by deployment-package modelValidation tests (and any non-vitest runner).
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  Entity,
  EntityDefinition,
  JzodElement,
  MetaModel,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { getInnermostTypeCheckError } from "../1_core/jzod/mlsTypeCheckError.js";
import { jzodTypeCheck } from "../1_core/jzod/jzodTypeCheck.js";

// ================================================================================================
// Types
// ================================================================================================

export type ModelValidationInstanceModule = { default: any };

export type ModelValidationGroup = {
  groupName: string;
  jzodSchema: JzodElement;
  /** Path / uuid keyed modules, typically from import.meta.glob or MetaModel arrays. */
  instances: Record<string, ModelValidationInstanceModule>;
  filterByName?: string[];
  /** Optional per-group model environment; falls back to runModelValidationSuite modelEnv. */
  modelEnv?: MiroirModelEnvironment;
};

export type ModelValidationPlan = {
  groups: ModelValidationGroup[];
  entitiesWithZeroInstances: string[];
};

export type ModelValidationFailedCase = {
  groupName: string;
  label: string;
  /** Value suitable for vitest `-t` (name preferred, else uuid). */
  filter: string;
};

export type ModelValidationInstanceCheck = {
  label: string;
  filter: string;
  status: "ok" | "error";
  innermostError?: unknown;
};

// ================================================================================================
// Labels / filters
// ================================================================================================

export function buildModelValidationInstanceLabel(instance: any, fallbackPath: string): string {
  const uuid: string = instance?.uuid ?? fallbackPath;
  return instance?.name ? `${instance.name} (${uuid})` : uuid;
}

/** Prefer name (readable); fall back to uuid. Both are unique enough for vitest -t. */
export function buildModelValidationVitestNameFilter(
  instance: any,
  fallbackPath: string,
): string {
  if (typeof instance?.name === "string" && instance.name.length > 0) {
    return instance.name;
  }
  return instance?.uuid ?? fallbackPath;
}

export function escapeRegexForVitestFilter(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ================================================================================================
// Plan building
// ================================================================================================

export function modelValidationInstancesArrayToRecord(
  instances: readonly any[],
): Record<string, ModelValidationInstanceModule> {
  return Object.fromEntries(
    instances.map((instance, index) => {
      const key = instance?.uuid ?? instance?.name ?? String(index);
      return [key, { default: instance }];
    }),
  );
}

export function entityDefinitionsByEntityName(
  metaModel: MetaModel,
): Record<string, EntityDefinition> {
  return Object.fromEntries(
    metaModel.entityDefinitions.map((entityDefinition) => [entityDefinition.name, entityDefinition]),
  );
}

export function filterModelValidationGroupInstances(
  instances: Record<string, ModelValidationInstanceModule>,
  filterByName?: string[],
): Record<string, ModelValidationInstanceModule> {
  return Object.fromEntries(
    Object.entries(instances).filter(([, module]) => {
      const instance = module.default;
      if (!instance?.name) return true;
      if (!filterByName) return true;
      return filterByName.some((name) => instance.name.includes(name));
    }),
  );
}

/**
 * Build a validation plan from a MetaModel + entity-name → MetaModel attribute map.
 * Groups with zero instances are listed separately and omitted from `groups`.
 */
export function modelValidationSuite(
  metaModel: MetaModel,
  entityNameToAttributeName: Record<string, string>,
): ModelValidationPlan {
  const entityDefinitions = entityDefinitionsByEntityName(metaModel);
  const all: ModelValidationGroup[] = metaModel.entities.map((entity) => {
    const entityName = entity.name;
    const attributeName = entityNameToAttributeName[entityName] ?? entityName;
    return {
      groupName: entityName,
      jzodSchema: entityDefinitions[entityName]?.mlSchema as unknown as JzodElement,
      instances: modelValidationInstancesArrayToRecord(
        ((metaModel as any)[attributeName] as readonly any[] | undefined) ?? [],
      ),
    };
  });

  return {
    groups: all.filter((group) => Object.keys(group.instances).length > 0),
    entitiesWithZeroInstances: all
      .filter((group) => Object.keys(group.instances).length === 0)
      .map((group) => group.groupName),
  };
}

export function buildModelValidationPlanFromGroups(
  groups: ModelValidationGroup[],
): ModelValidationPlan {
  return {
    groups: groups.filter((group) => Object.keys(group.instances).length > 0),
    entitiesWithZeroInstances: groups
      .filter((group) => Object.keys(group.instances).length === 0)
      .map((group) => group.groupName),
  };
}

// ================================================================================================
// Filesystem plan building (Node / Vitest)
// ================================================================================================

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

// ================================================================================================
// Validation
// ================================================================================================

export function checkModelValidationInstance(
  jzodSchema: JzodElement,
  instance: any,
  fallbackPath: string,
  modelEnv: MiroirModelEnvironment,
): ModelValidationInstanceCheck {
  const label = buildModelValidationInstanceLabel(instance, fallbackPath);
  const filter = buildModelValidationVitestNameFilter(instance, fallbackPath);
  const result = jzodTypeCheck(
    jzodSchema,
    instance,
    [],
    [],
    modelEnv,
    {},
  );
  if (result.status === "error") {
    return {
      label,
      filter,
      status: "error",
      innermostError: getInnermostTypeCheckError(result),
    };
  }
  return { label, filter, status: "ok" };
}

// ================================================================================================
// Reports (plain strings — callers print them)
// ================================================================================================

export function formatEntitiesWithZeroInstancesReport(entityNames: string[]): string {
  if (entityNames.length === 0) {
    return "";
  }
  const lines = [
    "",
    "Entities with 0 instances (skipped):",
    ...entityNames.map((entityName) => `  - ${entityName}`),
    "",
  ];
  return lines.join("\n");
}

export function formatFailedModelValidationRerunCommands(params: {
  npmWorkspacePackage: string;
  failedCases: ModelValidationFailedCase[];
  testFileFilter?: string;
}): string {
  const { npmWorkspacePackage, failedCases, testFileFilter = "model" } = params;
  if (failedCases.length === 0) {
    return "";
  }
  const lines = [
    "",
    "Re-run failed modelValidation cases individually:",
    ...failedCases.flatMap(({ groupName, label, filter }) => [
      `  # ${groupName} > ${label}`,
      `  npm run testByFile -w ${npmWorkspacePackage} -- '${testFileFilter}' -t '${escapeRegexForVitestFilter(filter)}'`,
    ]),
    "",
  ];
  return lines.join("\n");
}

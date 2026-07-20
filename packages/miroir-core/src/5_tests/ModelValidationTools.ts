/**
 * Framework-agnostic model-instance validation helpers.
 * Used by deployment-package modelValidation tests (and any non-vitest runner).
 */

import type { EntityDefinition, JzodElement, MetaModel } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
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

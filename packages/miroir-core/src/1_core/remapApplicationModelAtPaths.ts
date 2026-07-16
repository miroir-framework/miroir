/**
 * T2 — Remap an application MetaModel at relative paths discovered by T1 so a
 * self-UUID-grounded clone is consistent under a new application (and optional
 * deployment) identity for ephemeral integration runs.
 */

import type { MetaModel } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";
import {
  formatRelativePath,
  listSelfApplicationUuidPaths,
  RELATIVE_PATH_JOKER,
  type ListSelfApplicationUuidPathsOptions,
  type RelativePath,
} from "./listSelfApplicationUuidPaths.js";

export type RemapApplicationModelParams = {
  oldApplicationUuid: Uuid;
  newApplicationUuid: Uuid;
  oldDeploymentUuid?: Uuid;
  newDeploymentUuid?: Uuid;
};

export type RemapApplicationModelAtPathsOptions = {
  /** When true, skip validation when a path value does not contain an old uuid. */
  force?: boolean;
};

export class RemapApplicationModelAtPathsError extends Error {
  readonly path: RelativePath;

  constructor(message: string, path: RelativePath) {
    super(message);
    this.name = "RemapApplicationModelAtPathsError";
    this.path = path;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepCloneMetaModel(model: MetaModel): MetaModel {
  return structuredClone(model);
}

function remapStringAtLeaf(
  value: string,
  pattern: RelativePath,
  remap: RemapApplicationModelParams,
  options: RemapApplicationModelAtPathsOptions,
): string {
  const { oldApplicationUuid, newApplicationUuid, oldDeploymentUuid, newDeploymentUuid } =
    remap;
  let result = value;
  let changed = false;

  if (result.includes(oldApplicationUuid)) {
    result = result.replaceAll(oldApplicationUuid, newApplicationUuid);
    changed = true;
  }
  if (
    oldDeploymentUuid &&
    newDeploymentUuid &&
    result.includes(oldDeploymentUuid)
  ) {
    result = result.replaceAll(oldDeploymentUuid, newDeploymentUuid);
    changed = true;
  }

  if (!changed && !options.force) {
    const expected = oldDeploymentUuid
      ? `${oldApplicationUuid} or ${oldDeploymentUuid}`
      : oldApplicationUuid;
    throw new RemapApplicationModelAtPathsError(
      `Expected value at ${formatRelativePath(pattern)} to contain ${expected}, got "${value}"`,
      pattern,
    );
  }

  return result;
}

function remapAtPattern(
  current: unknown,
  pattern: RelativePath,
  depth: number,
  remap: RemapApplicationModelParams,
  options: RemapApplicationModelAtPathsOptions,
): void {
  if (depth === pattern.length - 1) {
    const key = pattern[depth];
    if (typeof key !== "string" && typeof key !== "number") {
      throw new RemapApplicationModelAtPathsError(
        `Invalid leaf segment in ${formatRelativePath(pattern)}`,
        pattern,
      );
    }
    if (!isPlainObject(current)) {
      throw new RemapApplicationModelAtPathsError(
        `Path not found: ${formatRelativePath(pattern)}`,
        pattern,
      );
    }
    const property = String(key);
    if (!(property in current)) {
      // Joker-expanded paths (e.g. items.*.instanceUuid) may exist only on some siblings.
      return;
    }
    const oldValue = current[property];
    if (oldValue === undefined) {
      return;
    }
    if (typeof oldValue !== "string") {
      throw new RemapApplicationModelAtPathsError(
        `Expected string at ${formatRelativePath(pattern)}, got ${typeof oldValue}`,
        pattern,
      );
    }
    current[property] = remapStringAtLeaf(oldValue, pattern, remap, options);
    return;
  }

  const segment = pattern[depth];
  if (segment === RELATIVE_PATH_JOKER) {
    if (!Array.isArray(current)) {
      throw new RemapApplicationModelAtPathsError(
        `Expected array at ${formatRelativePath(pattern.slice(0, depth + 1))}`,
        pattern,
      );
    }
    for (const item of current) {
      remapAtPattern(item, pattern, depth + 1, remap, options);
    }
    return;
  }

  if (typeof segment === "number") {
    if (!Array.isArray(current)) {
      throw new RemapApplicationModelAtPathsError(
        `Expected array at ${formatRelativePath(pattern.slice(0, depth + 1))}`,
        pattern,
      );
    }
    if (segment < 0 || segment >= current.length) {
      throw new RemapApplicationModelAtPathsError(
        `Array index out of bounds at ${formatRelativePath(pattern)}`,
        pattern,
      );
    }
    remapAtPattern(current[segment], pattern, depth + 1, remap, options);
    return;
  }

  if (!isPlainObject(current)) {
    throw new RemapApplicationModelAtPathsError(
      `Path not found: ${formatRelativePath(pattern)}`,
      pattern,
    );
  }
  const next = current[segment];
  if (next === undefined) {
    throw new RemapApplicationModelAtPathsError(
      `Path not found: ${formatRelativePath(pattern)}`,
      pattern,
    );
  }
  remapAtPattern(next, pattern, depth + 1, remap, options);
}

/**
 * Deep-clones `model` and rewrites every `paths` leaf so occurrences of
 * `remap.oldApplicationUuid` (and optional deployment UUIDs) become the new ids.
 */
export function remapApplicationModelAtPaths(
  model: MetaModel,
  paths: RelativePath[],
  remap: RemapApplicationModelParams,
  options: RemapApplicationModelAtPathsOptions = {},
): MetaModel {
  const clone = deepCloneMetaModel(model);
  for (const path of paths) {
    remapAtPattern(clone, path, 0, remap, options);
  }
  return clone;
}

export type RemapSelfApplicationUuidModelOptions = RemapApplicationModelAtPathsOptions &
  Pick<ListSelfApplicationUuidPathsOptions, "useJokerForArrayIndices">;

/**
 * T1∘T2 — discover self-application uuid paths, then remap for ephemeral deploy.
 */
export function remapSelfApplicationUuidModel(
  model: MetaModel,
  remap: RemapApplicationModelParams,
  options: RemapSelfApplicationUuidModelOptions = {},
): MetaModel {
  const paths = listSelfApplicationUuidPaths(model, remap.oldApplicationUuid, {
    includeDeploymentUuid: remap.oldDeploymentUuid,
    useJokerForArrayIndices: options.useJokerForArrayIndices,
  });
  return remapApplicationModelAtPaths(model, paths, remap, options);
}

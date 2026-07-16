/**
 * T1 — Discover relative paths in an application MetaModel where the model's
 * own SelfApplication UUID appears (grounding / orientation and nested action
 * payload literals). Used as input to T2 remap for ephemeral deployment clones.
 *
 * Strategy (v1): deep-scan string equality (and substring embeds), skipping
 * transformer objects (`transformerType`). Array indices are returned as the
 * joker segment `"*"` for compact, remap-friendly patterns.
 */

import type { MetaModel } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import type { Uuid } from "../0_interfaces/1_core/EntityDefinition.js";

/** Joker segment — matches any array index at that position (for T2 remap). */
export const RELATIVE_PATH_JOKER = "*" as const;

/** JSON-path segments into a MetaModel (object keys, array joker, or concrete index during walk). */
export type RelativePath = (string | number | typeof RELATIVE_PATH_JOKER)[];

export type ListSelfApplicationUuidPathsOptions = {
  /**
   * When set, also collect paths whose string value equals (or embeds) this
   * deployment UUID. Paths are merged with application-uuid paths and sorted.
   */
  includeDeploymentUuid?: Uuid;
  /**
   * When false, return concrete array indices instead of joker `*`.
   * Default true — compact patterns for ephemeral model remap (T2).
   */
  useJokerForArrayIndices?: boolean;
};

const TRANSFORMER_TYPE_KEY = "transformerType";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTransformerObject(value: unknown): boolean {
  return isPlainObject(value) && TRANSFORMER_TYPE_KEY in value;
}

function stringMatchesTarget(value: string, targetUuid: Uuid): boolean {
  return value === targetUuid || value.includes(targetUuid);
}

function segmentSortKey(segment: RelativePath[number]): string {
  if (segment === RELATIVE_PATH_JOKER) {
    return "\x00*";
  }
  if (typeof segment === "number") {
    return `\x01${String(segment).padStart(10, "0")}`;
  }
  return `\x02${segment}`;
}

function compareRelativePaths(a: RelativePath, b: RelativePath): number {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    if (i >= a.length) {
      return -1;
    }
    if (i >= b.length) {
      return 1;
    }
    const left = segmentSortKey(a[i]);
    const right = segmentSortKey(b[i]);
    if (left !== right) {
      return left.localeCompare(right);
    }
  }
  return 0;
}

function walkForUuid(
  node: unknown,
  path: RelativePath,
  targetUuid: Uuid,
  out: RelativePath[],
): void {
  if (typeof node === "string") {
    if (stringMatchesTarget(node, targetUuid)) {
      out.push([...path]);
    }
    return;
  }
  if (typeof node !== "object" || node === null) {
    return;
  }
  if (isTransformerObject(node)) {
    return;
  }
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) {
      walkForUuid(node[i], [...path, i], targetUuid, out);
    }
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    walkForUuid(value, [...path, key], targetUuid, out);
  }
}

function toJokerPath(path: RelativePath): RelativePath {
  return path.map((segment) =>
    typeof segment === "number" ? RELATIVE_PATH_JOKER : segment,
  );
}

function compactPathsWithJoker(paths: RelativePath[]): RelativePath[] {
  const seen = new Set<string>();
  const compacted: RelativePath[] = [];
  for (const path of paths) {
    const jokerPath = toJokerPath(path);
    const key = formatRelativePath(jokerPath);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    compacted.push(jokerPath);
  }
  return compacted.sort(compareRelativePaths);
}

/**
 * Lists relative paths in `model` where `sourceApplicationUuid` appears as a
 * literal (exact string or substring embed). Transformer subtrees are skipped.
 * By default array indices are returned as joker `*` (deduplicated patterns).
 */
export function listSelfApplicationUuidPaths(
  model: MetaModel,
  sourceApplicationUuid: Uuid,
  options: ListSelfApplicationUuidPathsOptions = {},
): RelativePath[] {
  const useJoker = options.useJokerForArrayIndices !== false;
  const rawPaths: RelativePath[] = [];
  walkForUuid(model, [], sourceApplicationUuid, rawPaths);
  if (options.includeDeploymentUuid) {
    walkForUuid(model, [], options.includeDeploymentUuid, rawPaths);
  }
  if (!useJoker) {
    return [...rawPaths].sort(compareRelativePaths);
  }
  return compactPathsWithJoker(rawPaths);
}

/** Stable string form for snapshots / assertions (`entities.*.selfApplication`). */
export function formatRelativePath(path: RelativePath): string {
  return path
    .map((segment) => {
      if (segment === RELATIVE_PATH_JOKER) {
        return RELATIVE_PATH_JOKER;
      }
      if (typeof segment === "number") {
        return `[${segment}]`;
      }
      return segment;
    })
    .join(".");
}

export function formatRelativePaths(paths: RelativePath[]): string[] {
  return paths.map(formatRelativePath);
}

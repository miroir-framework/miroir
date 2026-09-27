/**
 * #312: MiroirTest tags, the classification used to select and sort tests.
 * Browser-safe: no Node imports (the Miroir Tests page uses it too).
 */
import type {
  Entity,
  MiroirTestDefinition,
  MiroirTestSuite,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { classifyApplicationMiroirTestCliLaunchKind } from "./applicationMiroirTestCatalog.js";
import { walkMiroirTestLeaves } from "./inferIntegrationSessionKind.js";

/** #316: the tags stating the modes a suite supports, in this order on every instance. */
export const MIROIR_TEST_MODE_TAGS = ["unit", "integ", "ui"] as const;
export type MiroirTestModeTag = (typeof MIROIR_TEST_MODE_TAGS)[number];

/**
 * #316: the mode tags a suite must carry, from what it can run.
 * `ui` for React component suites (run in jsdom), otherwise `unit` and / or `integ`
 * from its CLI launch kind.
 */
export function miroirTestSuiteModeTags(suite: MiroirTestSuite): MiroirTestModeTag[] {
  if (walkMiroirTestLeaves(suite).some((leaf) => leaf.miroirTestType === "reactComponentTest")) {
    return ["ui"];
  }
  switch (classifyApplicationMiroirTestCliLaunchKind(suite)) {
    case "unit":
      return ["unit"];
    case "mixed-unit-transformer":
      return ["unit", "integ"];
    case "runner-integration":
    case "transformer-integration":
      return ["integ"];
    default:
      return [];
  }
}

/** The tags of a MiroirTest instance, `[]` when it has none. */
export function getMiroirTestInstanceTags(instance: MiroirTestDefinition): string[] {
  return (instance.tags as string[] | undefined) ?? [];
}

/** True when the instance carries at least one of `tags`. */
export function miroirTestInstanceHasAnyTag(
  instance: MiroirTestDefinition,
  tags: readonly string[],
): boolean {
  const instanceTags = getMiroirTestInstanceTags(instance);
  return tags.some((tag) => instanceTags.includes(tag));
}

/**
 * The tags the MiroirTest Entity allows: the values of the `enum` inside its `tags` array schema.
 * `undefined` when that item type is not an enum, meaning any tag is accepted.
 */
export function getMiroirTestAllowedTags(
  miroirTestEntity: Pick<Entity, "mlSchema">,
): string[] | undefined {
  const tagItemSchema = (miroirTestEntity.mlSchema?.definition as Record<string, any> | undefined)
    ?.tags?.definition;
  return tagItemSchema?.type === "enum" ? [...(tagItemSchema.definition as string[])] : undefined;
}

/** Throws on the first of `tags` that `allowedTags` does not contain (no check when `undefined`). */
export function assertAllowedMiroirTestTags(
  tags: readonly string[],
  allowedTags: readonly string[] | undefined,
): void {
  if (!allowedTags) {
    return;
  }
  const unknownTag = tags.find((tag) => !allowedTags.includes(tag));
  if (unknownTag !== undefined) {
    throw new Error(
      `Unknown tag "${unknownTag}". Allowed tags (MiroirTest Entity): ${allowedTags.join(", ")}`,
    );
  }
}

/** The instances carrying any of `tags`; all of them when `tags` is empty. */
export function filterMiroirTestInstancesByTags(
  instances: readonly MiroirTestDefinition[],
  tags: readonly string[],
): MiroirTestDefinition[] {
  return tags.length === 0
    ? [...instances]
    : instances.filter((instance) => miroirTestInstanceHasAnyTag(instance, tags));
}

/** Each tag present on `instances` with the number of instances carrying it, sorted by tag. */
export function listMiroirTestTagCounts(
  instances: readonly MiroirTestDefinition[],
): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const instance of instances) {
    for (const tag of new Set(getMiroirTestInstanceTags(instance))) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

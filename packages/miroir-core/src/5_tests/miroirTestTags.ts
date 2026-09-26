/**
 * #312: MiroirTest tags, the classification used to select and sort tests.
 * Browser-safe: no Node imports (the Miroir Tests page uses it too).
 */
import type {
  Entity,
  MiroirTestDefinition,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

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

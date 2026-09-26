/**
 * #312: MiroirTest tags, the classification used to select and sort tests.
 * Browser-safe: no Node imports (the Miroir Tests page uses it too).
 */
import type { MiroirTestDefinition } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

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

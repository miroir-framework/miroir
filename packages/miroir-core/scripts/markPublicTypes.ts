/**
 * #649: marks the generated types of core's public API with `@public` TSDoc. Kept free of side effects (unlike
 * generate-ts-types.ts, which runs the generation when imported) so that it can be tested on its own.
 */

export const PUBLIC_TAG = "/** @public */";

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Inserts `/** @public *\/` on the line before `export type <name> =` for each name, unless it is already there.
 * Throws when a name has no such declaration, or more than one, so a renamed schema cannot silently drop a mark.
 */
export function markPublicTypes(text: string, names: readonly string[]): string {
  let result = text;
  for (const name of names) {
    const declaration = new RegExp(`^export type ${escapeRegExp(name)} =`, "gm");
    const matches = [...result.matchAll(declaration)];
    if (matches.length !== 1) {
      throw new Error(
        `markPublicTypes: expected one "export type ${name} =" in the generated text, found ${matches.length}`,
      );
    }
    const offset = matches[0].index ?? 0;
    if (result.slice(0, offset).endsWith(`${PUBLIC_TAG}\n`)) {
      continue;
    }
    result = `${result.slice(0, offset)}${PUBLIC_TAG}\n${result.slice(offset)}`;
  }
  return result;
}

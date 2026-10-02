/**
 * Restricts the languages shiki can highlight to a chosen list (#370). CopilotKit renders chat
 * markdown with streamdown, whose code blocks load shiki grammars on demand through
 * `bundledLanguages`; Vite emits every one of the 235 grammars as a chunk of the release. A code
 * block in another language renders as plain text.
 *
 * The plugin resolves the `./langs.mjs` that `shiki/dist/index.mjs` imports to a module listing the
 * chosen grammars, with the names and aliases shiki gives them.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export const SHIKI_LANGUAGES = [
  "json",
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "yaml",
  "shellscript",
  "python",
  "sql",
  "html",
  "css",
  "xml",
];

const MODULE_ID = "\0miroir-shiki-langs";

export function shikiLanguages(languages = SHIKI_LANGUAGES) {
  return {
    name: "miroir-shiki-languages",
    enforce: "pre",
    resolveId(source, importer) {
      if (source === "./langs.mjs" && importer?.replaceAll("\\", "/").includes("/shiki/dist/")) {
        return MODULE_ID;
      }
      return null;
    },
    async load(id) {
      if (id !== MODULE_ID) {
        return null;
      }
      const shikiDirectory = createRequire(import.meta.url).resolve("shiki/package.json").replace(/package\.json$/, "");
      const { bundledLanguagesInfo } = await import(pathToFileURL(`${shikiDirectory}dist/langs.mjs`).href);
      const chosen = bundledLanguagesInfo.filter((info) => languages.includes(info.id));
      const missing = languages.filter((language) => !chosen.some((info) => info.id === language));
      if (missing.length > 0) {
        this.error(`shiki has no grammar ${missing.join(", ")}`);
      }
      const entries = chosen
        .map(
          (info) =>
            `{ id: ${JSON.stringify(info.id)}, name: ${JSON.stringify(info.name)}, aliases: ${JSON.stringify(info.aliases ?? [])}, import: () => import("@shikijs/langs/${info.id}") }`,
        )
        .join(",\n  ");
      return `const bundledLanguagesInfo = [
  ${entries}
];
const bundledLanguagesBase = Object.fromEntries(bundledLanguagesInfo.map((i) => [i.id, i.import]));
const bundledLanguagesAlias = Object.fromEntries(bundledLanguagesInfo.flatMap((i) => i.aliases.map((a) => [a, i.import])));
const bundledLanguages = { ...bundledLanguagesBase, ...bundledLanguagesAlias };
export { bundledLanguages, bundledLanguagesAlias, bundledLanguagesBase, bundledLanguagesInfo };
`;
    },
  };
}

# ML nomenclature (migration reference)

Miroir's meta-language is named **ML** and its schemas **MLS** (#145). It derives from the external
[Jzod](https://github.com/miroir-framework/jzod) project but has its own extensions (the `tag` syntax of the bootstrap
schema `1e8dab4b-65a3-4686-922e-ce89a2d62aa9`), so names that designate Miroir constructs no longer say "Jzod".

The rename is a clean break: there are no deprecated aliases. A deployment stored outside this repository that still
uses the old names must be updated by hand with the table below.

## Naming rule

| Prefix | Used when the name designates | Example |
|---|---|---|
| `Ml` / `ml` | a construct of the language (element kinds, their types, their editors) | `MlElement`, `mlObject`, `MlObjectEditor` |
| `MlSchema` / `mlSchema` | a value of the language used as a schema | `miroirFundamentalMlSchema`, `valueMlSchema` |
| `Mls` / `mls` | an operation on schemas | `mlsTypeCheck`, `mlsToMls_Summary` |

"Jzod" remains only for the `@miroir-framework/jzod` and `@miroir-framework/jzod-ts` packages, the names they export
(`jzodToZodTextAndZodSchema`, `jzodToTsCode`, `valueToJzod`, …) and prose about the Jzod project.
`npm run check:ml` ([testing reference](testing.md)) enforces this on the whole repository.

## The Jzod adapter

Miroir reaches the Jzod packages only through one adapter in miroir-core, which holds the casts between Jzod's types
and the ML types:

| Function | Wraps | Import from |
|---|---|---|
| `valueToMl(value, arrayResolution?)` | `valueToJzod` | `miroir-core` |
| `mlToZod(mlSchema)` | `jzodToZod` | `miroir-core` |
| `mlToZodTextAndZodSchema(mlSchema, eager?, lazy?, { datesAsString })` | `jzodToZodTextAndZodSchema` | `miroir-core` |
| `mlToTs(typeName, mlSchema, context?, …)`, `mlToZodTextAndZodSchemaForTsGeneration` | `jzodToTsCode`, `jzodToZodTextAndZodSchemaForTsGeneration` | `miroir-core/ml-to-ts` (Node only: jzod-ts needs the TypeScript compiler) |

The sources are `packages/miroir-core/src/1_core/mls/mlJzodAdapter.ts` and `mlJzodTsAdapter.ts`. No other file imports
`@miroir-framework/jzod` or `@miroir-framework/jzod-ts` (`no-restricted-imports` in `eslint.config.mjs`, run by
`npm run lint`), and only miroir-core depends on them.

## Names a stored deployment can contain

| Old | New |
|---|---|
| the 25 definitions `jzod<Kind>` of the bootstrap schema (`jzodElement`, `jzodObject`, `jzodUnion`, …), used as `schemaReference` `relativePath` | `ml<Kind>` (`mlElement`, `mlObject`, `mlUnion`, …) |
| bootstrap schema `name` `jzodMiroirBootstrapSchema` | `mlMiroirBootstrapSchema` |
| transformer `jzodTypeCheck` | `mlsTypeCheck` |
| transformer `ansiColumnsToJzodSchema` | `ansiColumnsToMlSchema` |
| transformer parameters `relativeReferenceJzodContext`, `rawJzodSchema`, `rawJzodSchemaType`, `valueJzodSchema` | `relativeReferenceMlContext`, `rawMlSchema`, `rawMlSchemaType`, `valueMlSchema` |
| MiroirTest functionCallTest modules `miroir-core/1_core/jzod/*` | `miroir-core/1_core/mls/*` |
| MiroirTest labels `jzod.*` | `mls.*` |
| component tests `component: "JzodElementEditor"` (and the other `Jzod*Editor` names) | `"MlElementEditor"` (`Ml*Editor`) |
| MetaModel section `jzodSchemas` | `mlSchemas` |
| AI entity proposal field `entityVersion.jzodSchema` | `entityVersion.mlSchema` (the old field is no longer read) |

TypeScript names follow the same rule (`JzodElement` → `MlElement`, `jzodTypeCheck` → `mlsTypeCheck`,
`JzodElementEditor` → `MlElementEditor`, `getMiroirFundamentalJzodSchema` → `getMiroirFundamentalMlSchema`, …). The full
identifier maps applied to this repository are in `code-helpers/features/145-REFACTOR-ml-nomenclature/slice*-map.json`.

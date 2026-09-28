# #145 step 2: TDD plan

Analysis: `analysis.md`. One green commit per slice. Gate per slice: the pre-push gate of AGENTS.md plus typecheck of
the touched packages; `npm run nonreg:filesystem -- --runner shared` after slices 2 and 4.

## Slice 1: runtime adapter

- RED: `packages/miroir-core/tests/1_core/mlJzodAdapter.unit.test.ts`: `valueToMl` of a scalar, an object and an array
  (both array resolutions) returns the expected `MlElement`; `mlToZod` of an object schema parses a valid value and
  rejects an invalid one; `mlToZodTextAndZodSchema` returns a `zodText` and a working `zodSchema`, and honours
  `datesAsString`.
- GREEN: `src/1_core/mls/mlJzodAdapter.ts`, exported from `src/index.ts`. `mlsTypeCheck.ts` and
  `tests/1_core/zodParseError.test.ts` use it.

## Slice 2: standalone-app, mcp, cli, sandbox

- The 5 standalone-app view files use `valueToMl` (their `as MlElement` casts go); mcp and cli use
  `mlToZodTextAndZodSchema` (their `as any` casts go).
- Drop jzod / jzod-ts from standalone-app, mcp, cli and sandbox `package.json`; update `package-lock.json`.
- Check: typecheck of the 4 packages; `mcpHandlersForEndpoint` and `commandsFromEndpoint` tests.

## Slice 3: TS generation adapter

- GREEN: `src/1_core/mls/mlJzodTsAdapter.ts`, tsup entry and `exports["./ml-to-ts"]`; jzod-ts becomes a miroir-core
  dependency. `scripts/generate-ts-types.ts` goes through both adapters; `postgres-generate-ts-types.ts` imports
  `miroir-core/ml-to-ts`; store-postgres drops jzod-ts.
- Check: `npm run devBuild -w miroir-core` and the store-postgres `generate-ts-types` leave `git diff` empty on the
  generated files.

## Slice 4: lint rule and guard

- RED: `eslint-rules/jzod-imports.test.mjs` lints an import of each package from a file outside the adapter (error),
  from the adapter (no error) and from a `scripts/` file (error).
- GREEN: the `no-restricted-imports` block in `eslint.config.mjs`; `npm run lint` runs the new test.
- `check_ml_nomenclature.py`: allow the adapter files, shrink `JZOD_TS_API_FILES`; self-test updated.
- Docs: `docs/reference/ml-nomenclature.md` names the adapter as the only door to Jzod.

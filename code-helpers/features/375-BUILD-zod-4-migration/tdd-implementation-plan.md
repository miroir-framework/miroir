# Issue #375 — TDD Implementation Plan

> Upgrade-under-test: every slice keeps the existing parse behaviour green (miroir-core unit tests, `modelValidation`,
> MiroirTests) while one repository moves to the zod 4 API. No mocks: tests parse the real deployment assets through
> the real `mlToZod` / generated schemas. New tests only where zod 4 changes behaviour (parse errors, uuids, functions).

**Resume note:** all slices done (PR #414). D1 changed during Slice 1 (see its Realization): jzod / jzod-ts 1.0.0 require zod ^4.5, so the
`zod/v4` stage is dropped and Slice 3 bumps Miroir's zod package itself; Slice 6 keeps only the cleanup. A asked for the
implementation on 2026-10-03 (#413 and #375 share one goal).

## Scope

In: jzod and jzod-ts on the zod 4 API and released; Miroir on zod 4 (generated types, hand-written schemas, parse-error
reporting); Dependabot ignore while in flight.
Out: TS generation without zod (D3-b), `z.strictObject` / zod-mini output (D4), ML meta-language changes.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/375 (Dependabot PR #365)
- Analysis: [`analysis.md`](analysis.md)
- Sibling repos: miroir-framework/jzod, miroir-framework/jzod-ts (each slice there is a release)
- Working branch (Miroir): from `_integration`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize parse results and errors | ✅ DONE | `zodParseResults.unit.test.ts` (moved in Slice 6) |
| 1 | jzod builds runtime schemas with zod 4 | ✅ DONE | jzod 1.0.0 (jzod#28), 52/52 tests |
| 2 | jzod-ts generates TS through zod-to-ts 2 | ✅ DONE | jzod-ts 1.0.0 (jzod-ts#11), 10/10 tests |
| 3 | Miroir builds on zod 4 and jzod 1.0 (tracer) | ✅ DONE | miroir-core unit tests + `modelValidation` |
| 4 | Union parse errors keep their deepest-issue report | ✅ DONE | `zodParseError` tests on zod 4 issues |
| 5 | Hand-written app schemas on the v4 API | ✅ DONE | `gridPagination` tests, standalone-app typecheck |
| 6 | Cleanup and full non-regression | ✅ DONE | full PR gate + `nonreg:filesystem` |

## Locked implementation defaults (proposed, from the analysis)

| Decision | Default |
|---|---|
| D1 Route | ~~Staged through `zod/v4`~~ Changed in Slice 1: jzod / jzod-ts 1.0 on `zod ^4.5`; Miroir bumps its zod package in Slice 3 |
| D2 jzod introspection | Port `JzodToZod.ts` (what Miroir calls); `ZodToJzod` / `ZodToZodText` / `compare` decided in jzod |
| D3 TS generation | zod-to-ts 2.x |
| D4 Generated style | keep `.strict()` |
| D5 uuids | keep `.uuid()`; fix non-RFC test uuids that reach `.uuid()` fields (Slice 0 tells which) |
| D6 Dependabot | close #365, ignore zod `>=4` until Slice 6 |

## Allocated keys

No new model element. Vitest files: `packages/miroir-core/tests/1_core/issues/375-zod-4/zodParseResults.375.phase0.unit.test.ts`
(Slice 0, folded into `zodParseError.test.ts` in Slice 6). Vitest because parse-error formatting is framework machinery,
not reachable through a MiroirTest.

## Test execution conventions

| Purpose | Command |
|---|---|
| miroir-core unit | `npm run test -w miroir-core -- ''` |
| one file | `RUN_TEST=<name> npm run testByFile -w miroir-core -- <name>` |
| regenerate types | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` (jzod / jzod-ts linked locally until released) |
| model validation | `npm run nonreg:filesystem -- --runner shared --scope smoke,core` (includes `modelValidation`) |
| typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| jzod / jzod-ts | `npm test` in each repo |

---

## Slice 0 — Characterize parse results and errors

**Status:** ✅ DONE

**Goal:** a safety net for Goals 2 and 3 before any API change.

**RED → GREEN (characterization):** `zodParseErrors.375.phase0.unit.test.ts` parses a fixed set of invalid elements
(an Entity with a wrong attribute type, a Query with an unknown extractor, a Report section of an unknown type), taken
from real assets and altered in the test, through `mlToZod` of their ML schemas, and records
`zodErrorDeepestIssueLeaves` output. Passes on zod 3 as written.
Inventory script (Python, scratch): which of the 11 non-RFC uuids sit in fields typed `.uuid()` in `miroirFundamentalType.ts`.

**Refactor checkpoint:** none (no production change).

**Validation:** `npm run testByFile -w miroir-core -- zodParseResults.375`

### Realization
**Status:** ✅ DONE. `zodParseResults.375.phase0.unit.test.ts` (8 tests, zod 3.25.76) locks:
- for Entity, Query, Report, TransformerDefinition and Endpoint, every instance in `packages/*/assets/*/<entity uuid>/`
  parsed with its generated schema; the 14 that already fail on zod 3 are listed (an Entity whose mlSchema uses the
  `color` string format, stored Queries parsed with `query` = `queryWithExtractorCombinerTransformer`, two postgres
  Reports with `null` fields, one TransformerDefinition rejected by a `refine`);
- the deepest-issue paths (not codes or messages, which zod 4 renames) of three altered real elements.
Deviation: parsing every instance through its Entity's mlSchema with `mlToZodTextAndZodSchema` was dropped: 300 s, and
623 instances already fail on zod 3, so it locks nothing useful. The uuid inventory moves to Slice 3, where zod 4's
`.uuid()` can be run on the assets directly.

## Slice 1 — jzod builds runtime schemas with zod 4

**Status:** ✅ DONE

**Goal:** `jzodToZod` / `jzodToZodTextAndZodSchema` return zod 4 schemas (imported from `zod/v4`, zod 3.25.x installed).

**RED:** jzod's own tests switched to `zod/v4` fail (function schemas, `_def.typeName` check at `JzodToZod.ts:110`).
**GREEN:** `JzodToZod.ts` on `zod/v4`: `z.function({ input, output })` for `function`, `z.promise` kept or replaced per
zod 4 docs, object detection via `instanceof z.ZodObject` only; emitted text unchanged except for those constructs.
Release jzod 0.9.0.

**Refactor checkpoint:** remove the `zod-to-json-schema` commented import; decide `ZodToJzod` / `ZodToZodText` / `compare` (D2).

**Validation:** `npm test` and `npm run build` in jzod.

### Realization
jzod 1.0.0 (miroir-framework/jzod#28, published 2026-10-03), `zod ^4.5.0`, imports `zod` directly. The `zod/v4`
subpath of zod 3.25 (zod 4.0 core) and zod 4.0 to 4.4 read `z.tuple` items' `_zod.optin` at construction, which
resolves `z.lazy` references to schemas declared later and throws ("could not find eager reference jzodMap"); fixed in
zod 4.5.0 (bisected). So D1-a was dropped. `z.function({ input, output })`; `ZodToZodText` / `ZodToJzod` ported to
`_zod.def`; `compare.ts` removed (D2-b). 52/52 tests on zod 4.5.0 and 4.6.5.

## Slice 2 — jzod-ts generates TS through zod-to-ts 2

**Status:** ✅ DONE

**Goal:** `jzodToTsCode` produces the same TypeScript text for Miroir's schemas, on zod-to-ts 2.x.

**RED:** jzod-ts tests with jzod 0.9.0 and zod-to-ts 2.x (lazy references through `withGetType` replacement).
**GREEN:** adapt `typeScriptLazyReferenceConverter` (`JzodToTs.ts:13-30`), header `import … from "zod/v4"`, regenerate
`generated_jzodBootstrapElementSchema.ts` (`preBuild`). Release jzod-ts 0.9.0.

**Refactor checkpoint:** drop the jzod ↔ jzod-ts devDependency cycle if the new versions allow it.

**Validation:** `npm test` and `npm run build` in jzod-ts; diff of the generated bootstrap schema reviewed.

### Realization
jzod-ts 1.0.0 (miroir-framework/jzod-ts#11, published 2026-10-03) on zod-to-ts 2.1.0: `zodToTs` passes an override
function that prints lazy references as type references and keeps zod-to-ts 1 output for objects (no
`[x: string]: never` index signature, optional only when the schema is) and records. Bootstrap schema unchanged.
With both 1.0 builds in `_integration` (78fcd8ccb), `miroirFundamentalType.ts`, `miroirFundamentalMlSchema.ts` and
postgres `generated.ts` regenerate unchanged (timestamp and the hand-added `distinctOn` aside), and the 554 generated
schemas load and parse under zod 4.6.5.

## Slice 3 — Miroir builds on zod 4 and jzod 1.0 (tracer)

**Status:** ✅ DONE

**Goal:** Miroir builds against zod 4 and jzod / jzod-ts 1.0.0 and validates every deployment's model as before.

**RED:** bump `zod` to `^4.5.0` in the six manifests and jzod / jzod-ts to 1.0.0, relock; miroir-core typecheck fails
on `MlZodTextAndZodSchema` (zod 3 `ZodTypeAny`), Slice 0 test shows what zod 4 parses differently.
**GREEN:** `mlJzodAdapter.ts`, `mlJzodTsAdapter.ts` and the generators' headers on zod 4 types; `z.ZodType<>` annotations adjusted; regenerate `miroirFundamentalType.ts` and miroir-store-postgres
`generated.ts`. miroir-cli and miroir-mcp follow (`ZodTypeAny` imports). Apply D5 to the uuids Slice 0 found.

**Refactor checkpoint:** `DomainElement.ts:230` `z.record(z.any())` gets its key schema.

**Validation:**
```bash
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,runners
```

### Realization
Slices 3 to 5 landed in one commit: the bump breaks union error reporting at once, so no smaller step is green.
- zod `4.6.5` (exact pin, dependency policy) in the six manifests, declared in miroir-standalone-app and
  miroir-store-postgres, and pinned at the root as a devDependency so a single zod 4 is hoisted; third-party packages
  that need zod 3 (CopilotKit, @cursor/sdk, @ag-ui) get nested 3.25.76 copies.
- npm then moved openai 4.104 (optional peer `zod ^3`) under miroir-ai and gave CopilotKit openai 7.27 at the root;
  miroir-ai hands its client to CopilotKit, so miroir-ai moves to openai `7.27.0` (one shared copy;
  `apiKey ?? undefined` for openai 7's `string | null`). A root `overrides` on openai left CopilotKit without openai.
- miroir-core needed one change: `DomainElement.ts` `z.record(z.string(), z.any())`. Types regenerate unchanged
  (timestamp aside); the generator header uses `error` instead of the deprecated `message` in `.refine`.
- D5: zod 4's `.uuid()` checks RFC version bits. All deployment assets of Slice 0 still parse, but 7 miroir-core unit
  tests fail on hand-made fixture ids (`aaaaaaaa-aaaa-…`, `00000000-…-0001`); `Runner.ts`, two MiroirTest assets and
  33 test files use such ids. jzod 1.0.1 (miroir-framework/jzod#29) emits `z.guid()`, zod 3's loose check; the
  choice (lenient vs strict) is A's. With jzod 1.0.1: 2248/2248 miroir-core unit tests. A chose strict (2026-10-03):
  see Slice 6.

## Slice 4 — Union parse errors keep their deepest-issue report

**Status:** ✅ DONE

**Goal:** Goal 3: an invalid model element still reports its deepest issue under zod 4's issue shape.

**RED:** Slice 0 test now fails (`unionErrors` absent; zod 4 nests `issue.errors`).
**GREEN:** `zodParseErrorHandler.ts` walks `invalid_union` → `errors`; the ML schema in `zodParseError.ts` describes the
zod 4 issue shape; regenerate types; `zodParseError.test.ts` updated to the new shape. Same Slice 0 expectations.

**Refactor checkpoint:** one place reads the zod issue tree (handler), the rest consumes its output.

**Validation:** `RUN_TEST=zodParseError npm run testByFile -w miroir-core -- zodParseError`; scoped nonreg `smoke,core`.

### Realization
zod 4 reports union branches in `issue.errors` (one issue array per branch) with paths **relative** to the union
issue, and renames `invalid_literal` to `invalid_value` (`values`), drops `received`. `zodParseError.ts` describes
that shape (`errors`, optional `note` / `discriminator`, `zodParseErrorIssueInvalidValue`); `zodParseErrorHandler.ts`
prefixes branch paths so the leaves keep absolute paths. Slice 0's deepest-path expectations pass unchanged.
`zodParseError.test.ts` uses zod 4 issues; the 822 kB zod 3 `zodParseErrorExample.json` is replaced by a live parse
error of a real TransformerDefinition asset (it covers the four described codes).

## Slice 5 — Hand-written app schemas on the v4 API

**Status:** ✅ DONE

**Goal:** the grid, pagination and check views validate their props as before.

**RED:** `gridPagination.unit.test.tsx` on `zod/v4` (`.options`, `.shape`, `instanceof`), standalone-app typecheck.
**GREEN:** `ValueObjectGridInterface.ts`, `EntityInstanceGridInterface.ts` (function schemas, `.merge` → `.extend`,
two-argument `z.record`, `.default` semantics), `gridPagination.ts` (`error` param), `Check.tsx`, miroir-mcp
`mcpHandlersForEndpoint.ts` issue reading. miroir-standalone-app and miroir-store-postgres declare their `zod` dependency.

**Refactor checkpoint:** shared prop schemas between the two grid interfaces extracted if duplicated.

**Validation:** standalone-app and mcp typecheck; `RUN_TEST=gridPagination npm run testByFile -w miroir-standalone-app -- gridPagination`; scoped nonreg `smoke,ui,runners`.

### Realization
miroir-standalone-app: `z.function({ input, output })` in the two grid interfaces, `z.record(z.string(), …)`,
`z.never({ error })` in `gridPagination.ts`, `Check.tsx` record. Two zod 4 typing changes surfaced: a `z.any()`
property is no longer optional in inferred types (`children`, `defaultFormValuesObject` get `.optional()`), and a
generated `z.ZodType<T>` has an `unknown` input type, so a function schema over it loses its parameter type
(`z.custom<EntityInstancesUuidIndex>()`). No new standalone-app type error against `_integration` (32 vs 35 there).
miroir-mcp: the validation message now reads zod 4's `book: Invalid input: expected string, received undefined`
(was `book: Required`). `Check.tsx` reads only `code` / `message` / `path` of the first leaf, unchanged.
Pre-existing on `_integration`, not this change: miroir-ai `miroirTools.unit.test.ts` (14 failures), the npm audit
rule (4 high advisories).

## Slice 6 — Package bump to zod 4

**Status:** ✅ DONE

**Goal:** Goal 1: Miroir, jzod and jzod-ts install zod 4.

**Goal (revised):** the package bump happened in Slice 3; this slice removes the Dependabot zod ignore (D6) and runs the
full non-regression.

**Cleanup:** fold `issues/375-zod-4/` assertions into `zodParseError.test.ts`, delete the issue directory; docs
(`docs/reference/ml-nomenclature.md` if it names zod versions).

**Validation:** the AGENTS.md pre-push gate, `npm run nonreg:filesystem -- --runner shared`.

**AC checklist:**

| Acceptance criterion | Proof |
|---|---|
| Miroir builds on zod 4 | PR gate (typecheck, unit tests), `bundle report + guards` |
| Model validation unchanged | `nonreg:filesystem` `modelValidation` steps |
| Deepest-issue parse errors | `zodParseError.test.ts` |
| Dependabot no longer blocked | ignore removed, next zod bump green |

### Realization

- D5, strict: miroir-core keeps jzod 1.0.0 and `.uuid()`. A Python pass replaced the 28 distinct non-RFC ids of 37
  tracked files under `packages/` (tests, `Runner.ts`, `IntegrationTestSession.ts`, two MiroirTest assets) by setting
  the version nibble to 4 and the variant nibble to 8 (`aaaaaaaa-aaaa-aaaa-…` becomes `aaaaaaaa-aaaa-4aaa-8aaa-…`), the
  form other tests already used. No two ids of one file map to the same value. jzod#29 (`z.guid()`) is not needed.
- D6: the Dependabot ignore rule for zod majors is removed.
- The Slice 0 test moved to `tests/1_core/zodParseResults.unit.test.ts` (kept whole: it is the parse-result lock for
  future zod upgrades); `issues/375-zod-4/` is gone. No doc names a zod version.
- Bundle guards: the zod 4 package raises the eager baselines (page +3.1%, Electron start +9.0%); openai 7 drops four
  packages from the Electron allowlist.
- Validation: miroir-core unit tests 2248/2248, `./build-all.sh`, `nonreg:filesystem --runner shared` 91/91.

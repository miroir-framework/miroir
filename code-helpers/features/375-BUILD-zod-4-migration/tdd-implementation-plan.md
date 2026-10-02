# Issue #375 — TDD Implementation Plan

> Upgrade-under-test: every slice keeps the existing parse behaviour green (miroir-core unit tests, `modelValidation`,
> MiroirTests) while one repository moves to the zod 4 API. No mocks: tests parse the real deployment assets through
> the real `mlToZod` / generated schemas. New tests only where zod 4 changes behaviour (parse errors, uuids, functions).

**Resume note:** nothing started. Decisions D1-D6 in [`analysis.md`](analysis.md) are *proposed*; confirm them with A before Slice 1.

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
| 0 | Characterize parse results and errors | ⬜ pending | parse-error snapshot test, uuid inventory |
| 1 | jzod builds runtime schemas with the v4 API | ⬜ pending | jzod test suite on `zod/v4` |
| 2 | jzod-ts generates TS through zod-to-ts 2 | ⬜ pending | jzod-ts test suite, bootstrap schema regenerated |
| 3 | Miroir generates and validates on `zod/v4` (tracer) | ⬜ pending | miroir-core unit tests + `modelValidation` |
| 4 | Union parse errors keep their deepest-issue report | ⬜ pending | `zodParseError` tests on zod 4 issues |
| 5 | Hand-written app schemas on the v4 API | ⬜ pending | `gridPagination` tests, standalone-app typecheck |
| 6 | Package bump to zod 4 | ⬜ pending | full PR gate + `nonreg:filesystem` |

## Locked implementation defaults (proposed, from the analysis)

| Decision | Default |
|---|---|
| D1 Route | Staged: import `zod/v4` while on zod 3.25.x; bump the package last (Slice 6) |
| D2 jzod introspection | Port `JzodToZod.ts` (what Miroir calls); `ZodToJzod` / `ZodToZodText` / `compare` decided in jzod |
| D3 TS generation | zod-to-ts 2.x |
| D4 Generated style | keep `.strict()` |
| D5 uuids | keep `.uuid()`; fix non-RFC test uuids that reach `.uuid()` fields (Slice 0 tells which) |
| D6 Dependabot | close #365, ignore zod `>=4` until Slice 6 |

## Allocated keys

No new model element. Vitest files: `packages/miroir-core/tests/1_core/issues/375-zod-4/zodParseErrors.375.phase0.unit.test.ts`
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

**Status:** ⬜ pending

**Goal:** a safety net for Goals 2 and 3 before any API change.

**RED → GREEN (characterization):** `zodParseErrors.375.phase0.unit.test.ts` parses a fixed set of invalid elements
(an Entity with a wrong attribute type, a Query with an unknown extractor, a Report section of an unknown type), taken
from real assets and altered in the test, through `mlToZod` of their ML schemas, and records
`zodErrorDeepestIssueLeaves` output. Passes on zod 3 as written.
Inventory script (Python, scratch): which of the 11 non-RFC uuids sit in fields typed `.uuid()` in `miroirFundamentalType.ts`.

**Refactor checkpoint:** none (no production change).

**Validation:** `RUN_TEST=zodParseErrors.375 npm run testByFile -w miroir-core -- zodParseErrors.375`

### Realization
_pending_

## Slice 1 — jzod builds runtime schemas with the v4 API

**Status:** ⬜ pending

**Goal:** `jzodToZod` / `jzodToZodTextAndZodSchema` return zod 4 schemas (imported from `zod/v4`, zod 3.25.x installed).

**RED:** jzod's own tests switched to `zod/v4` fail (function schemas, `_def.typeName` check at `JzodToZod.ts:110`).
**GREEN:** `JzodToZod.ts` on `zod/v4`: `z.function({ input, output })` for `function`, `z.promise` kept or replaced per
zod 4 docs, object detection via `instanceof z.ZodObject` only; emitted text unchanged except for those constructs.
Release jzod 0.9.0.

**Refactor checkpoint:** remove the `zod-to-json-schema` commented import; decide `ZodToJzod` / `ZodToZodText` / `compare` (D2).

**Validation:** `npm test` and `npm run build` in jzod.

### Realization
_pending_

## Slice 2 — jzod-ts generates TS through zod-to-ts 2

**Status:** ⬜ pending

**Goal:** `jzodToTsCode` produces the same TypeScript text for Miroir's schemas, on zod-to-ts 2.x.

**RED:** jzod-ts tests with jzod 0.9.0 and zod-to-ts 2.x (lazy references through `withGetType` replacement).
**GREEN:** adapt `typeScriptLazyReferenceConverter` (`JzodToTs.ts:13-30`), header `import … from "zod/v4"`, regenerate
`generated_jzodBootstrapElementSchema.ts` (`preBuild`). Release jzod-ts 0.9.0.

**Refactor checkpoint:** drop the jzod ↔ jzod-ts devDependency cycle if the new versions allow it.

**Validation:** `npm test` and `npm run build` in jzod-ts; diff of the generated bootstrap schema reviewed.

### Realization
_pending_

## Slice 3 — Miroir generates and validates on `zod/v4` (tracer)

**Status:** ⬜ pending

**Goal:** Miroir builds against jzod / jzod-ts 0.9.0 and validates every deployment's model as before.

**RED:** bump jzod / jzod-ts; miroir-core typecheck fails on `MlZodTextAndZodSchema` (zod 3 `ZodTypeAny`).
**GREEN:** `mlJzodAdapter.ts`, `mlJzodTsAdapter.ts`, `generate-ts-types.ts` header and `postgres-generate-ts-types.ts`
import `zod/v4`; `z.ZodType<>` annotations adjusted; regenerate `miroirFundamentalType.ts` and miroir-store-postgres
`generated.ts`. miroir-cli and miroir-mcp follow (`ZodTypeAny` imports). Apply D5 to the uuids Slice 0 found.

**Refactor checkpoint:** `DomainElement.ts:230` `z.record(z.any())` gets its key schema.

**Validation:**
```bash
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared --scope smoke,core,actions,runners
```

### Realization
_pending_

## Slice 4 — Union parse errors keep their deepest-issue report

**Status:** ⬜ pending

**Goal:** Goal 3: an invalid model element still reports its deepest issue under zod 4's issue shape.

**RED:** Slice 0 test now fails (`unionErrors` absent; zod 4 nests `issue.errors`).
**GREEN:** `zodParseErrorHandler.ts` walks `invalid_union` → `errors`; the ML schema in `zodParseError.ts` describes the
zod 4 issue shape; regenerate types; `zodParseError.test.ts` updated to the new shape. Same Slice 0 expectations.

**Refactor checkpoint:** one place reads the zod issue tree (handler), the rest consumes its output.

**Validation:** `RUN_TEST=zodParseError npm run testByFile -w miroir-core -- zodParseError`; scoped nonreg `smoke,core`.

### Realization
_pending_

## Slice 5 — Hand-written app schemas on the v4 API

**Status:** ⬜ pending

**Goal:** the grid, pagination and check views validate their props as before.

**RED:** `gridPagination.unit.test.tsx` on `zod/v4` (`.options`, `.shape`, `instanceof`), standalone-app typecheck.
**GREEN:** `ValueObjectGridInterface.ts`, `EntityInstanceGridInterface.ts` (function schemas, `.merge` → `.extend`,
two-argument `z.record`, `.default` semantics), `gridPagination.ts` (`error` param), `Check.tsx`, miroir-mcp
`mcpHandlersForEndpoint.ts` issue reading. miroir-standalone-app and miroir-store-postgres declare their `zod` dependency.

**Refactor checkpoint:** shared prop schemas between the two grid interfaces extracted if duplicated.

**Validation:** standalone-app and mcp typecheck; `RUN_TEST=gridPagination npm run testByFile -w miroir-standalone-app -- gridPagination`; scoped nonreg `smoke,ui,runners`.

### Realization
_pending_

## Slice 6 — Package bump to zod 4

**Status:** ⬜ pending

**Goal:** Goal 1: Miroir, jzod and jzod-ts install zod 4.

**RED:** bump `zod` to 4.x in jzod, jzod-ts (release 0.9.1) and the six Miroir manifests; imports still `zod/v4`.
**GREEN:** rewrite `zod/v4` imports back to `zod`, regenerate, relock (`npx npm@11 install --package-lock-only`), remove the Dependabot ignore (D6).

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
_pending_

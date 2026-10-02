# 375 — zod 4 migration (jzod, jzod-ts, Miroir)

> Why Dependabot's zod 4 bump (#365) cannot land in Miroir alone, what zod 3 surface Miroir and its two sibling libraries
> depend on, and the proposed route to move all three to zod 4.

Related issue: https://github.com/miroir-framework/miroir/issues/375
Trigger: Dependabot PR #365 (`zod` 3.25.76 → 4.6.5 in miroir-core only), build red
Related analyses: [`../145-REFACTOR-jzod-adapter/analysis.md`](../145-REFACTOR-jzod-adapter/analysis.md) (the `mlJzodAdapter.ts` door, #145)
Sibling repos: [miroir-framework/jzod](https://github.com/miroir-framework/jzod), [miroir-framework/jzod-ts](https://github.com/miroir-framework/jzod-ts)
Key sources:
[`mlJzodAdapter.ts`](../../../packages/miroir-core/src/1_core/mls/mlJzodAdapter.ts),
[`mlJzodTsAdapter.ts`](../../../packages/miroir-core/src/1_core/mls/mlJzodTsAdapter.ts),
[`generate-ts-types.ts`](../../../packages/miroir-core/scripts/generate-ts-types.ts),
[`zodParseErrorHandler.ts`](../../../packages/miroir-core/src/1_core/mls/zodParseErrorHandler.ts)

**Status:** analysis, decisions **proposed** (not yet confirmed with A). TDD plan: [`tdd-implementation-plan.md`](tdd-implementation-plan.md), written against the proposed decisions.

---

## Decision record (proposed)

| Decision | Proposed choice |
|---|---|
| D1 Route | **Staged through the `zod/v4` subpath of zod 3.25**: jzod / jzod-ts and Miroir move their code to the v4 API while still installing zod 3.25.x, then the package bump to zod 4 is a one-line change |
| D2 jzod's zod introspection (`_def.typeName`) | **Port only what Miroir uses** (`jzodToZod`, `jzodToZodTextAndZodSchema`, `valueToJzod`); port or drop `ZodToJzod`, `ZodToZodText`, `compare` in jzod on their own merit |
| D3 TypeScript generation | **zod-to-ts 2.x** (peer `zod ^3.25 \|\| ^4`), keeping the jzod → zod → TS pipeline |
| D4 Generated object style | **Keep `.strict()`** in generated text (1781 occurrences); switching to `z.strictObject` is a later, cosmetic change |
| D5 `.uuid()` strictness | **Generate `.uuid()` and fix the 10 non-RFC test uuids**, or emit `z.guid()` if A prefers lenient ids (see 3.5) |
| D6 Dependabot meanwhile | **Close #365 and ignore zod `>=4` in `.github/dependabot.yml`** until the last slice lands |

**Rationale:** three repositories must move together, and one of them generates 11,091 lines of zod source. The `zod/v4`
subpath lets each repository switch API without a cross-repo version flag day: every intermediate state builds and passes
its tests on one installed zod.

### D1 — Route

**Status:** Proposed — D1-a.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Staged via `zod/v4`** ★ | zod 3.25.x ships both APIs (`zod/v3`, `zod/v4`; npm `exports` checked). jzod / jzod-ts import `zod/v4`, release; Miroir imports `zod/v4`, regenerates; then bump to zod 4 and rewrite imports back to `zod` | each step green on its own; jzod release independent of Miroir's bump; small diffs | two import rewrites in Miroir (to `zod/v4`, then back to `zod`) |
| D1-b. Lockstep big bang | jzod, jzod-ts and Miroir bump to zod 4 together, one release each | one rewrite | nothing builds between the first jzod change and the last Miroir change; a failure anywhere blocks all three |
| D1-c. Stay on zod 3 | ignore zod 4 | no work | zod 3 receives fixes only via `zod/v3`; ecosystem (MCP SDK, AI SDKs) moves to zod 4 types |

### D2 — jzod's zod introspection

`ZodToZodText.ts`, `ZodToJzod.ts`, `compare.ts` are built on `switch (zod._def.typeName)` over `"ZodString"`…`"ZodVoid"` and
read `_def.shape()`, `_def.innerType`, `_def.options`, `_def.unknownKeys`… zod 4 moves definitions to `schema._zod.def`
with lowercase `type` names (from the zod 4 changelog; to verify in the first slice). Miroir imports only `jzodToZod`,
`jzodToZodTextAndZodSchema`, `valueToJzod` (`mlJzodAdapter.ts:5-10`) and jzod-ts's `jzodToTsCode`,
`jzodToZodTextAndZodSchemaForTsGeneration` (`mlJzodTsAdapter.ts:4`).

| Option | Pros | Cons |
|---|---|---|
| **D2-a. Port what Miroir uses; decide the rest in jzod** ★ | smallest Miroir-blocking scope | introspection modules may lag |
| D2-b. Port everything | jzod fully on zod 4 | larger scope on code Miroir does not call |

### D3 — TypeScript generation

jzod-ts uses zod-to-ts 1.x (`zodToTs`, `withGetType`, `createTypeAlias`, `printNode`; `JzodToTs.ts:2-30`). zod-to-ts 2.1.0
declares `zod ^3.25.0 || ^4.0.0`. Its API for `withGetType` (used for lazy references) needs checking.

| Option | Pros | Cons |
|---|---|---|
| **D3-a. zod-to-ts 2.x** ★ | keeps the pipeline; supports both zods | API changes to adapt (lazy reference hook) |
| D3-b. Generate TS straight from Jzod | removes a dependency and the zod detour | rewrite of a generator that produces 553 types; regression risk on `miroirFundamentalType.ts` |

### D4 — Generated object style

Generated text uses `z.object({...}).strict()` 1781 times, never `.passthrough()`. `.strict()` remains in zod 4 (legacy,
`z.strictObject` preferred). **Proposed:** keep it; the regenerated file then differs only where semantics change.

### D5 — `.uuid()` strictness

zod 4's `.uuid()` checks RFC 9562 version and variant bits; `z.guid()` keeps zod 3's loose pattern (zod 4 changelog; to
verify). Of 594 distinct uuids in `packages/*/assets/**/*.json`, 11 are not RFC-shaped, all in `miroir-app-miroir`:
`00000000-0000-0000-0000-00000000000{0..7}`, `11111111-2222-3333-4444-555555555555`, `55555555-…`, `aaaaaaaa-bbbb-…`.
Generated types use `.uuid()` 552 times. Whether these 11 ids reach a `.uuid()` field is to be checked in the first slice.

| Option | Pros | Cons |
|---|---|---|
| **D5-a. Keep `.uuid()`, fix test ids** ★ | stricter validation; ids are v4 since #288 | asset edits; nil uuid behaviour to check |
| D5-b. Emit `z.guid()` | no asset change | weaker validation than today's intent |

### D6 — Dependabot meanwhile

#365 bumps miroir-core only, so it can never go green alone. **Proposed:** close it, add an `ignore` for `zod` versions
`>=4` in `.github/dependabot.yml`, remove the ignore in the last slice.

---

## 1. Goals

1. **Current schema library** — In order to keep receiving zod fixes and share schema types with the MCP and AI SDKs, as
   an application maintainer, I can build Miroir on zod 4.
2. **Unchanged validation** — In order to trust existing applications after the upgrade, as an application designer, I
   get the same parse results for my Entities, Queries, Reports and Endpoints as before, except where I chose stricter
   checks (D5).
3. **Readable parse errors** — In order to fix invalid model elements, as an application designer, I still get the
   deepest-issue error report (`zodErrorDeepestIssueLeaves`) when a union fails.

## 2. Non-goals

- Rewriting jzod's TypeScript generation without zod (D3-b, later, unscheduled).
- Moving generated code to `z.strictObject` / zod-mini (D4, later).
- Changing the ML meta-language itself.

## 3. Current state

### 3.1 Versions

| Package | zod | Other |
|---|---|---|
| `@miroir-framework/jzod` 0.8.5 | `^3.24.2` | devDeps `zod-to-ts ^1.2.0`, `zod-to-json-schema ^3.21.2`, `@miroir-framework/jzod-ts 0.8.4` |
| `@miroir-framework/jzod-ts` 0.8.5 | `^3.24.2` | deps `zod-to-ts ^1.2.0`, `@miroir-framework/jzod 0.8.5` |
| miroir-core, -localcache, -localcache-redux, -localcache-zustand, -mcp, -cli | `3.25.76` | miroir-core pins jzod / jzod-ts 0.8.5 |
| miroir-standalone-app, miroir-store-postgres | not declared, import `zod` (hoisted) | |

### 3.2 jzod → zod (runtime schemas)

`jzod/src/JzodToZod.ts` builds zod schemas from Jzod elements: `z.lazy`, `z.union`, `z.intersection`, `z.literal`,
`z.map`, `z.set`, `z.tuple`, `z.enum`, `z.promise`, `z.record(z.string(), x)`, `z.function().args().returns()`
(l.496-506), `.strict()` / `.passthrough()` (l.723), `.partial()`, and dynamic calls `(z as any)[type]()` and
`acc[curr.type](curr.parameter)` (l.362-367) for validations. It also reads `_def?.typeName === "ZodObject"` (l.110).
In zod 4, `z.function()` is no longer a schema and `z.promise` is deprecated (zod 4 changelog; to verify).

### 3.3 Generated zod source (`miroirFundamentalType.ts`)

`generate-ts-types.ts` calls `mlToTs` (→ jzod-ts `jzodToTsCode`) and emits a hand-written header (l.176-296) with
`z.record(z.string(), …).refine(fn, {message, path})`. The output: 11,091 lines, 553 exported schemas.

| Construct | Count | zod 4 impact |
|---|---|---|
| `z.object(` / `.strict()` | 1783 / 1781 | none expected (D4) |
| `z.lazy(` | 1445 | none expected |
| `z.union(` | 679 | error shape changes (3.6) |
| `z.record(` | 130, all two-argument | none |
| `.uuid()` | 552 | stricter (D5) |
| `z.ZodType<` annotations | 546 | generic parameters change (`ZodType<Output, Input>`); to check |
| `.refine(` | 1 | `message` param renamed `error` (deprecated alias kept) |

Zero `z.function`, `z.promise`, `z.intersection`, `.default`, `.merge`, `.describe` in the generated file.
`miroir-store-postgres/scripts/postgres-generate-ts-types.ts` produces a smaller file the same way.

### 3.4 Hand-written zod in Miroir (non-generated)

| File | zod 4 sensitive usage |
|---|---|
| `miroir-core/src/0_interfaces/2_domain/DomainElement.ts:230` | `z.record(z.any())` single argument (needs a key schema) |
| `miroir-standalone-app/.../Grids/ValueObjectGridInterface.ts` | `z.record(x)` single argument (l.20), `z.function().args().returns()` (l.79-81), `.optional().default(…)` (l.76, 84), `.merge` (l.90-92) |
| `miroir-standalone-app/.../Grids/EntityInstanceGridInterface.ts` | `z.function().args().returns()` (l.40, 72, 73, 84), `.merge` (l.51-53), `z.record(x)` single argument (l.106, 107) |
| `miroir-standalone-app/.../Grids/gridPagination.ts` | `z.never({ invalid_type_error })` (l.39, 48) |
| `miroir-standalone-app/tests/4_view/gridPagination.unit.test.tsx` | `.options`, `.shape`, `instanceof z.ZodNumber` |
| `miroir-standalone-app/.../routes/Check.tsx:68-88` | `error.issues[0].code/message/path` |
| `miroir-mcp/src/tools/mcpHandlersForEndpoint.ts:215-217` | `.error.issues` |
| `miroir-core/src/0_interfaces/1_core/StorageConfiguration.ts:58` | `z.discriminatedUnion` (kept in zod 4) |

### 3.5 uuids

See D5: 11 non-RFC uuids in `miroir-app-miroir` assets, generated `.uuid()` ×552.

### 3.6 Parse error reporting (misaligned with zod 4)

`zodParseErrorHandler.ts:14,31` walks `issue.code === "invalid_union"` and `issue.unionErrors`; the ML schema
`zodParseError.ts:15,102` describes that zod 3 shape and is generated into the `ZodParseError` type;
`tests/1_core/zodParseError.test.ts` asserts on `.issues[0].unionErrors`. zod 4 reports union branches as
`issue.errors` (arrays of issues) instead of `unionErrors` (ZodError objects) (zod 4 changelog; to verify). This is the
one Miroir feature whose behaviour, not only types, must be re-implemented (Goal 3).

### 3.7 Not affected

JSON Schema export goes straight from ML (`MlsToJsonSchema.ts`, `miroir-mcp/src/tools/mlElementToJsonSchema.ts`), not
through zod. No `zod-to-json-schema` in Miroir. No `_def` access in Miroir.

## 4. Key reuse / inventory

| Piece | Location |
|---|---|
| Single Miroir door to jzod | `packages/miroir-core/src/1_core/mls/mlJzodAdapter.ts` (lint-enforced) |
| Node-only door to jzod-ts | `packages/miroir-core/src/1_core/mls/mlJzodTsAdapter.ts` (`miroir-core/ml-to-ts`) |
| Type generation | `packages/miroir-core/scripts/generate-ts-types.ts`, `npm run devBuild -w miroir-core` |
| Bootstrap meta-schema (Jzod) | `jzod-ts/src/generated_jzodBootstrapElementSchema.ts` (`preBuild`) |
| Parse-error tests | `packages/miroir-core/tests/1_core/zodParseError.test.ts`, `zodParseActions.test.ts`, `zodParseCheckMiroirTransformerDefinitions.test.ts` |
| Local jzod linking for regeneration | AGENTS.md, "Sibling repos" |

## 5. Effort

| Repository | Work | Size |
|---|---|---|
| jzod | `JzodToZod.ts` to the v4 API (function, promise, introspection l.110); tests | medium |
| jzod-ts | zod-to-ts 2.x, lazy reference hook, regenerate bootstrap schema; tests | medium |
| Miroir | imports, 6 hand-written files (3.4), parse-error handler and its ML schema (3.6), regenerate 2 generated files, uuid decision (D5) | medium |

Implementation slices: [`tdd-implementation-plan.md`](tdd-implementation-plan.md).

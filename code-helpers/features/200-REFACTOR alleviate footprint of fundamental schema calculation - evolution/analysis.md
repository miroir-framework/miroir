# 200 — Alleviate footprint of fundamental schema calculation / evolution

> Analysis of the build-time cost of `getMiroirFundamentalJzodSchema` (and the identical
> carry-on machinery reused at runtime), with a measured baseline, root-cause findings, and
> improvement directions mapped to the issue's four "ways of action".

Related issue: https://github.com/miroir-framework/miroir/issues/200  
Follow-up to: [#199 analysis](../199-REFACTOR%20improve%20meta-model%20access%20performance/analysis.md) · [#199 TDD plan](../199-REFACTOR%20improve%20meta-model%20access%20performance/tdd-implementation-plan.md) (runtime resolution modes + revision cache — **done**, but explicitly left `generateSchemas` / the generator itself **unchanged**).  
Companion document: [investigation-guideline.md](./investigation-guideline.md) — concrete first-pass investigation steps for an agent, to run **before** any refactor.

## Report sign-off (2026-07-17) — investigation complete, ready for decision gate

Steps 0–2 of the investigation guideline are done (correctness baseline, static code review,
instrumented profiling of both the build-time and runtime cold paths — see
[investigation-guideline.md](./investigation-guideline.md) progress table). **Executive summary
for a next agent who only has time to read one paragraph:**

> The ~8.3s build-time cost (and the structurally identical ~4–7s runtime cold-start cost for
> app-owning-endpoints deployments) is **not** caused by evenly-distributed work across the
> `domainAction` type's 212 transitive dependencies. It is **~99% concentrated in processing
> exactly 2 of those 212 entries** — `domainAction` itself and `modelAction` — which are
> large, recursive/self-referential union types walked by `applyLimitedCarryOnSchemaOnLevel`
> with **no identity-based memoization** (only a rarely-effective named-reference memo, 23.4%
> hit rate). One sub-reference inside them is independently re-walked **71,089 times**. See
> [§5.2](#52-step-2-instrumentation-results-2026-07-17-investigation-guideline-2) for the full
> data and [§9](#9-improvement-directions-mapped-to-ways-of-action)'s updated candidate ranking
> (top candidate: identity-based memoization scoped to that recursive walk).

Remaining before "ways of action #3" (refactor) implementation can start: **user decisions** on
the open questions in [§11](#11-open-questions-to-settle-beforeduring-implementation-not-before-investigation)
— this is a deliberate stopping point, not a gap in the investigation.

## Update (2026-07-17, later same day) — narrow prototype fix implemented and merged into the working tree

Following the decision gate above, the user chose: narrow scope, no persisted cache, algorithmic
fix only (lazy schema field deferred to a follow-up issue), measure-then-set-ceiling, and
"prototype now, TDD plan after". A **~25-line, 2-call-site fix** (§9.1) was implemented, found by
going one level deeper than the original §9 candidate: not general identity memoization, but a
precise fix to the `"union"` case (and the `extend`-array case) of
`applyLimitedCarryOnSchemaOnLevel`, which were passing the *same, unmodified* accumulator to every
sibling instead of letting siblings share discoveries — the exact opposite of what `"object"`/`"tuple"`
already did correctly. **Measured: `generateSchemas` total time down ~43–48% (~8.7s → ~4.5–5.2s),
node visits down 4.27× (836,451 → 196,074), all existing tests green, generated schema output
byte-for-byte identical.** See §9.1 for full numbers and the remaining ~55% not yet addressed
(flagged as a possible next slice, out of scope for this narrow prototype).

---

## 1. Problem restatement (from issue #200)

> the fundamental schema `miroirFundamentalJzodSchema`, usually obtained as part of the results
> of the `useCurrentModelEnvironment` hook, is large and cumbersome to compute, its impact is
> noticeable on reactivity

Two related but distinct symptoms:

1. **Build-time**: `devBuild` of `miroir-core` recomputes the whole structure from scratch to
   guarantee freshness. Issue states this takes **~10 seconds**; measured baseline below shows
   **~8.7–8.8s**. Impact is accepted as a build-time cost, but it dominates local dev loop and CI.
2. **Runtime**: the *same* carry-on algorithm is invoked again for any deployment with
   app-owned endpoints (Library-like apps) on the cold path — already flagged by #198/#199 as a
   "~4–7s" cost, mitigated (not eliminated) by #199's revision cache (warm calls now
   `< 500ms`; **cold** calls still pay full price once per revision).

The issue's four **ways of action**:

| # | Action | Scope |
|---|--------|-------|
| 1 | Careful code review of `getMiroirFundamentalJzodSchema`, `getCarryOnSchemaBuilder`, `createLocalizedInnerResolutionStoreWithCarryOn`, `applyLimitedCarryOnSchemaOnLevel` for JS/TS perf anti-patterns | Static analysis |
| 2 | Harnessing of the relevant functions down `generateSchemas` to reach clear diagnostics | Instrumentation / profiling |
| 3 | Steady refactors using the harness to converge to better performance | Implementation (out of scope for this document — see investigation-guideline §4 "decision gate") |
| 4 | Analysis/improvement of progressivity of computation in UI/server via schema-evolution specifics and actual dependencies | Architecture (partially overlaps #199 Proposals 3/4, "not started") |

Issue's own hypothesis (§ "The latter should be the case, because…"), restated as two testable
claims:

- **Claim A**: `miroirFundamentalJzodSchema` is not actually used during Transformer/Action
  execution — any apparent dependency is likely spurious and could be removed without user impact.
- **Claim B**: Miroir/Admin depend on the schema only to provide type-checking service to
  *user* apps; Miroir/Admin never need *user app-level* schemas for their own purposes.

Both are addressed in [§6](#6-is-the-schema-actually-needed-at-runtime-testing-claim-a).

Target: **fast!**

---

## 2. Relationship to #199 — what's already solved, what remains

| Concern | #199 status | #200 scope |
|---|---|---|
| **When** to recompute at runtime (mode routing: static/extended/auto) | ✅ Done — `resolveFundamentalSchemaForDeployment` | Reuses this; does not change routing |
| **Caching** repeat runtime calls for unchanged model content | ✅ Done — revision-keyed `Map` in `schemaForDeployment.ts` | Reuses this; does not change caching |
| **UI invalidation** policy (data vs app-overlay vs meta-full-carry-on) | ✅ Done — `schemaChangeKind.ts`, `schemaReloadPolicy.ts` | Not touched |
| **Cost of the cold path itself** (first call / build) | ❌ Explicitly out of scope — 199 analysis.md §5: *"Dev build / `generateSchemas` — Full schema generation unchanged"* | **This is #200's core target** |
| Deploy-time overlay persistence (199 Proposal 4) | Not started | Alternative/complementary direction — see [§9](#9-improvement-directions-mapped-to-ways-of-action) |
| Central `ModelEnvironmentProvider` (199 Proposal 3) | Not started | Complementary — reduces *call count*, not *per-call cost* |

**Key implication**: any algorithmic fix to `applyLimitedCarryOnSchemaOnLevel` /
`getCarryOnSchemaBuilder` benefits **both** the `generateSchemas` build step **and** every
runtime cold-start for an app-owning-endpoints deployment (Library, future apps), because it is
the exact same code path (`buildExtendedSchema` → `applyDeploymentDomainActionCarryOn` →
`getCarryOnSchemaBuilder` — see call graph below).

---

## 3. Measured baseline (reproduced 2026-07-16)

Reproduced with:

```bash
cd packages/miroir-core
npm run generate-ts-types
```

### 3.1 Top-level timings

| Metric | Value | % of total |
|---|---|---|
| **Total `generateSchemas`** | ~8.7–8.8s | 100% |
| `getMiroirFundamentalJzodSchema` | ~8.2–8.3s | **94–96%** |
| `writeFundamentalJzodSchema` (file write) | ~25–31ms | ~0.3% |
| `generateTsTypeFileFromJzod` (Zod/TS codegen) | ~430ms | ~5% |

### 3.2 `getMiroirFundamentalJzodSchema` internal phase timings

```
getMiroirFundamentalJzodSchema phase timings (total 8297ms):
  miroirFundamentalJzodSchema construction: 9ms     (0%)
  absoluteMiroirFundamentalJzodSchema:       12ms    (0%)
  extendedSchemasResolutionStore:            69ms    (1%)
  queriesWithCarryOnContext:                 276ms   (3%)
  getCarryOnScemaBuilder:                    7926ms  (96%)   ← domainAction carry-on
  final context assembly:                    5ms     (0%)
```

**The `domainAction` carry-on pass alone is ~96% of the entire function's cost, and ~90%+ of
the entire `generateSchemas` run.** Everything else (schema construction, absolutization,
extended-schema conversion, queries conversion, final assembly, TS codegen, file I/O) is noise
by comparison.

### 3.3 Inside the `getCarryOnScemaBuilder` phase — the smoking gun

Two calls to `getCarryOnSchemaBuilder` happen in `getMiroirFundamentalJzodSchema`: one for
`extractorOrCombiner` (queries, small) and one for `domainAction` (huge). Their internal
`createLocalizedInnerResolutionStoreWithCarryOn` timings, from the same run:

| Pass | Context entries walked | Shared refs accumulated | Time |
|---|---|---|---|
| `miroirTemplate_` — extended schemas pass (`createLocalizedInnerResolutionStoreForExtendedSchemas`) | 34 schemas | — | 73ms |
| `miroirTemplate_` — queries pass (`createLocalizedInnerResolutionStoreWithCarryOn`) | 56 | 56 | 149ms |
| `miroirTemplate_` — **domainAction pass** (`createLocalizedInnerResolutionStoreWithCarryOn`) | **212** | 154 | **7430ms** |

**Entry count grows ~3.8×** (56 → 212) but **time grows ~50×** (149ms → 7430ms). This
non-linear blow-up is the primary empirical evidence of a super-linear (worse than O(n)) cost
in the algorithm, not merely "more work to do" — see root causes in §5.

### 3.4 Reproduction command reference

| Command | Package | Purpose |
|---|---|---|
| `npm run generate-ts-types` | `miroir-core` | Runs `generateSchemas()` directly; prints phase timings + SUMMARY |
| `npm run devBuild` | `miroir-core` | `generate-ts-types` + `build`; the full ~10s the issue refers to |
| `MIROIR_SCHEMA_MODE=frozen npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | `miroir-core` | Runtime cold-path equivalent (Library `'extended'` mode), documents ~500ms **warm**, several-seconds **cold** |

---

## 4. Call graph (build-time and runtime, same core algorithm)

```
Build time:
npm run generate-ts-types / devBuild
  └── generateSchemas()                                    [scripts/generate-ts-types.ts:307]
        └── getMiroirFundamentalJzodSchema(...)             [0_interfaces/.../getMiroirFundamentalJzodSchema.ts:177]
              ├── makeReferencesAbsolute (whole context)    — absoluteMiroirFundamentalJzodSchema phase
              ├── createLocalizedInnerResolutionStoreForExtendedSchemas   [Helpers.ts:484]
              │     └── applyLimitedCarryOnSchemaOnLevel (per extended schema, 34×)  [JzodToJzod_CarryOn.ts:130]
              ├── getCarryOnSchemaBuilder(extractorOrCombiner, queriesDependencySet, …)  [Helpers.ts:636]
              │     ├── createLocalizedInnerResolutionStoreWithCarryOn (56 entries)      [Helpers.ts:539]
              │     │     └── applyLimitedCarryOnSchemaOnLevel (per entry)
              │     └── applyLimitedCarryOnSchemaOnLevel (top element)
              └── getCarryOnSchemaBuilder(domainAction, domainActionDependencySet, …)   [Helpers.ts:636]
                    ├── createLocalizedInnerResolutionStoreWithCarryOn (212 entries) ← 7.4s  [Helpers.ts:539]
                    │     └── applyLimitedCarryOnSchemaOnLevel (per entry, recursive tree walk)
                    └── applyLimitedCarryOnSchemaOnLevel (top element)

Runtime (identical algorithm, #198/#199 wiring):
resolveFundamentalSchemaForDeployment(uuid, model, mode)        [schemaForDeployment.ts]
  └── buildExtendedSchema(model)          (only when app-owned endpoints exist, e.g. Library)
        └── applyDeploymentDomainActionCarryOn                  [Helpers.ts:805]
              └── getCarryOnSchemaBuilder(domainAction, …)  ← same 7-second-class cost, cached
                                                                 by revision after first call
```

**Conclusion**: there is exactly **one** expensive primitive
(`applyLimitedCarryOnSchemaOnLevel` walking the `domainAction` dependency closure via
`createLocalizedInnerResolutionStoreWithCarryOn`) that dominates both the build script and the
runtime cold path. Fixing it once fixes both symptoms in the issue.

---

## 5. Root-cause analysis — algorithmic anti-patterns

All citations from `packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts` (the recursive
core, ~960 lines) and `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers.ts`.

### A1 — No structural/identity memoization, only named-reference memoization

`applyLimitedCarryOnSchemaOnLevel`'s **only** cache check is for `schemaReference` nodes that
carry an `absolutePath`, keyed by a **forged name** (`forgeCarryOnReferenceName`):

```806:806:packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts
        if (!convertedReferences || !convertedReferences[localReferenceName]) {
```

Every other node kind — `object` attributes, `array`/`tuple`/`set`/`record` items, and even a
`schemaReference`'s **own local `context`** (its captured type parameters, walked
unconditionally at the top of the `"schemaReference"` case before the memo check is even
reached) — is walked and rebuilt **every single time it is encountered**, with no check for "have
I already produced the carry-on-applied version of this exact subtree". Structurally identical
sub-schemas reached via two different top-level `domainAction` branches are recomputed twice
(or N times), each time allocating fresh objects (`{...baseSchema, type: "union", …}`).

### A2 — Object-spread of a growing memo map at every recursion level

The "resolved references so far" accumulator is passed down as a **plain object**, and merged
via **spread**, not by mutating a shared `Map`/object in place, at multiple call sites:

```756:759:packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts
          {
            ...convertedReferences,
            ...convertedContextSubSchemasReferences,
          }, // resolved references
```

(same pattern for `tuple` items, `L451-454`; equivalent accumulation-then-spread patterns exist
for `object`/`union` cases in the same file). Each spread costs `O(size of convertedReferences)`;
since that map grows to **154 entries** during the `domainAction` pass, and this spread happens
at a large number of tree nodes across **212** top-level entries, the *aggregate* cost is
`O(nodes visited × current map size)` — worse than linear in both dimensions as the walk
progresses, matching the observed super-linear blow-up in §3.3. Repeated shape-changing object
literals of this kind are also known to defeat V8 inline-cache optimizations (megamorphic
object shapes), compounding the raw spread cost.

### A3 — `domainAction` inherently touches most of the type universe

`domainActionDependencySet` is the transitive dependency closure of the `domainAction`
discriminated union (`jzodTransitiveDependencySet(..., "domainAction", true)`,
`getMiroirFundamentalJzodSchema.ts:3436`) — this union covers essentially **every** Action kind
in the app (Model/Instance/Domain/Query/Transformer/Test/Endpoint actions), so it is expected
to be large relative to the ~548-key total context. This explains *why* the entry count is
large (212), but **not** why cost grows 50× for a 3.8× increase in entries — that gap is A1+A2.

### A4 — Top-level "already converted" skip never fires (namespace mismatch)

`createLocalizedInnerResolutionStoreWithCarryOn`'s own per-entry skip is keyed by the **plain**
context key name:

```564:571:packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers.ts
    if (entryName in (convertedReferences??{})) {
      log.info(`createLocalizedInnerResolutionStoreWithCarryOn(${prefix}): entry ${entryName} already converted, skipping carryOn application`);
```

but the accumulator it is checking against (`sharedConvertedReferences`, threaded in as
`convertedReferences`) is populated exclusively with **forged** `miroirTemplate_…` names
produced deep inside `applyLimitedCarryOnSchemaOnLevel` (`schemaWithCarryOn.resolvedReferences`,
`Helpers.ts:587-588`) — a different key namespace from plain entry names. In practice this
top-level skip is expected to **rarely or never** hit for the 212 `domainAction` entries (needs
confirmation — see investigation-guideline §2.3), meaning **every** entry pays for its own
top-level `applyLimitedCarryOnSchemaOnLevel` call; only *nested*, already-forged references
inside those calls benefit from the shared accumulator.

### A5 — Verbose synchronous logging of huge structures on/near the hot path

`console.log(..., JSON.stringify(bigObject, null, 2))` appears repeatedly in both
`getMiroirFundamentalJzodSchema.ts` (e.g. `:3274`, `:3317`, `:3351`, `:3386`, `:3444`) and
`generate-ts-types.ts` (e.g. `:443-448`, `:464-467`, `:491-494`). Not the dominant cost (the
non-`getCarryOnScemaBuilder` phases are collectively ~4% of total), but real, avoidable cost and
noise, and should be gated behind a debug flag rather than removed blindly (some are useful
diagnostics — see investigation-guideline).

### A6 — Same cost surfaces at runtime for any app-owning-endpoints deployment

Because `applyDeploymentDomainActionCarryOn` (`Helpers.ts:805`) calls the identical
`getCarryOnSchemaBuilder(domainAction, …)`, A1–A4 are exactly the mechanism behind the
"~4–7s cold Library carry-on" numbers already documented in #198/#199. #199's revision cache
means this cost is paid **once per distinct schema revision**, not per render — but the first
paint / first cold call for any newly-onboarded app deployment still pays the full cost. A
successful #200 algorithmic fix directly lowers that number too.

---

## 5.1 Step 1 static-review verdicts (2026-07-16, investigation-guideline §1)

Full line-by-line review of every `case` in `applyLimitedCarryOnSchemaOnLevel`
(`JzodToJzod_CarryOn.ts:181-957`: `any`/primitives, `literal`, `record`, `set`, `array`,
`tuple`, `union`, `object`, `schemaReference`) plus `getMiroirFundamentalJzodSchemaHelpers.ts`'s
skip/seed logic. Correctness baseline (`jzodToJzod.unit.test.ts`,
`jzodToJzod_Summary.unit.test.ts`) reconfirmed green before/after this read-only pass.

| Hypothesis | Verdict | Evidence |
|---|---|---|
| **A1** — no identity/structural memoization outside named `schemaReference` | **Confirmed** | Read all 9 `switch` cases: `record` (`:239`), `set` (`:317`), `array` (`:380`), `tuple` (`:440`), `union` (`:508`), `object` (`:580`) unconditionally recurse into every child with no cache check. The **only** memo check in the entire function is the `schemaReference` branch at `:806` (`convertedReferences[localReferenceName]`) |
| **A2** — spread of the growing accumulator at every recursion level | **Confirmed** | `object` case spreads **per attribute**, inside the loop: `{ ...convertedReferences, ...convertedSubSchemasReferences }` (`:591`); `tuple` case does the same **per item** (`:451-454`); `schemaReference`'s own local-context loop does the same **per context entry** (`:756-759`). All three grow the spread operand size as the walk progresses |
| **A3** — `domainAction`'s dependency closure is inherently large | **Confirmed, structural** (not a bug) | See §1.3 below — sizes reconfirmed unchanged today |
| **A4** — top-level `entryName in convertedReferences` skip (Helpers.ts`:564`) never matches | **Confirmed by static analysis** (exact hit *count* still needs §2 instrumentation) | `sharedConvertedReferences` is populated exclusively with **forged** keys (`forgeCarryOnReferenceName(absolutePath, relativePath, suffix, prefix)` → `"miroirTemplate_<uuid-with-$-for-dashes>_<relativePath>[_suffix]"`), produced only inside the `schemaReference` case (`:591`/`:597` in Helpers.ts, `:848`/`:783-788` in CarryOn.ts). The loop's `entryName` values are **plain dependency-set member names** (e.g. `"createInstance"`, `"CompositeAction"`) drawn directly from `Object.entries(localizedResolutionStore.context)`. A plain name colliding with the forged-name format is practically impossible — the skip is dead code for this loop |
| **A5** — verbose `JSON.stringify` logging on/near the hot path | **Confirmed**, unchanged from original list | No new evidence needed; already directly visible in the files |
| **A6** — same cost surfaces at runtime via `applyDeploymentDomainActionCarryOn` | **Confirmed structurally** (same function calls); **not re-measured** in this pass — re-measuring the runtime cold path is step 2 (§2.5 of the guideline), out of scope for steps 0-1 |

### A7 — NEW finding: `resolvedReferences` returned by every `schemaReference` node leaks the *entire* accumulated memo, not just its own new discoveries

This was not in the original A1–A6 list and sharpens A2 considerably. In the `schemaReference`
case's two return statements:

```916:921:packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts
          hasBeenApplied: true,
          resolvedReferences: {
            ...convertedReferences,
            ...convertedAbosulteReferences,
            ...convertedContextSubSchemasReferences,
          },
```

```937:942:packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts
          hasBeenApplied: true, // returning the correct answer would imply to know wether the reference has indeed been converted
          resolvedReferences: {
            ...convertedReferences,
            ...convertedAbosulteReferences,
            ...convertedContextSubSchemasReferences,
          },
```

Both branches — **including the memo-hit branch** (`:856-865`, where `localReferenceName` was
already in `convertedReferences` and no new conversion happens) — spread the **entire inbound
`convertedReferences`** (which can hold up to ~154 keys by late in the `domainAction` pass) into
the node's own `resolvedReferences` output. Contrast with every other case (`object` `:684-687`
/ `:710-713`, `tuple` `:494`, `union` `:551`/`:563`, `record` `:291`, `set` `:361`/`:372`,
`array` `:419`/`:430`), which only propagate **their children's own `resolvedReferences`** — a
much smaller, genuinely-new set — never the full inherited `convertedReferences`.

Because every ancestor (`object` attribute loop `:598-600`, `tuple` item loop `:460-462`,
`union` branch map `:524-529`, `schemaReference`'s own context loop `:767-769`,
`record`/`set`/`array`'s single-child merge) re-collects **all** of a child's
`resolvedReferences` via `Object.entries(...)` into its own accumulator, a single
`schemaReference` leaf anywhere in a subtree forces an `O(current memo size)` merge at **every
level** between that leaf and the top of that entry's tree. Since the memo (`sharedConvertedReferences`
in `Helpers.ts`, threaded in as `convertedReferences`) keeps growing across the 212-entry
`domainAction` loop, **later entries in the loop pay a progressively higher cost for exactly
the same shape of work** — independent of whether the memo *hit* (skipped re-conversion) or not.
This is a strong candidate explanation for the observed 50× time growth against a 3.8× entry-count
growth (§3.3): it's not just "more nodes to walk" (A3) or "spread cost per node" (A2) in
isolation — it's a compounding cost that gets worse as the pass proceeds, because the very act of
returning "what I know" from a cache-hit leaf became proportional to the *total* accumulated
knowledge, not to what that leaf actually contributed.

**This should be the primary fix candidate** ahead of the general A1 identity-memoization
proposal in §9 — a much smaller, more surgical change (stop spreading the full
`convertedReferences` into `resolvedReferences`; only return genuinely new entries, matching
every other case's existing convention) could plausibly remove most of the compounding cost
without needing a broader identity-cache redesign. Quantifying "most" still requires the §2
instrumentation (out of scope for steps 0-1).

### 1.3 Dependency-set sizes — reconfirmed unchanged

Re-ran `npm run generate-ts-types` during this session; phase timings and entry counts are
stable and match §3 exactly: extended-schemas pass 34 schemas/73ms, queries pass 56
entries/149ms, `domainAction` pass 212 entries/7430ms, 154 shared refs accumulated. No drift —
§3 and §8 of this document remain accurate as of 2026-07-16; no update needed there.

**Steps 0-1 (correctness baseline + static code review) are complete.** Step 2 (instrumentation
to quantify A1/A2/A4/A7's relative contribution, and to re-measure the runtime cold path for A6)
has not been started — see [investigation-guideline.md §2](./investigation-guideline.md#2-harnessing-for-diagnostics-ways-of-action-2).

---

## 5.2 Step 2 instrumentation results (2026-07-17, investigation-guideline §2)

Temporary instrumentation was added (visit counters + memo hit/miss counters in
`JzodToJzod_CarryOn.ts`; per-entry timing + top-level skip counters in
`getMiroirFundamentalJzodSchemaHelpers.ts`'s `createLocalizedInnerResolutionStoreWithCarryOn`),
gated behind `MIROIR_SCHEMA_PROFILE=1`, run against both the build-time generator and the
runtime cold path, then **fully reverted** (`git checkout --` on both files — confirmed zero
diff afterward). Correctness baseline (`jzodToJzod.unit.test.ts`,
`jzodToJzod_Summary.unit.test.ts`) stayed green throughout, and the full 17-test
`schemaForDeployment.unit.test.ts` suite passed during the runtime cross-check.

### 5.2.1 Headline discovery — cost is concentrated in 2 of the 212 entries, not spread across them

Per-entry timing (`§2.2`) for the `domainAction` pass (212 entries):

| Entry | Time | % of pass |
|---|---|---|
| `domainAction` | **5209ms** (build) / 4746ms (runtime) | **70%** / 72% |
| `modelAction` | **2561ms** (build) / 2676ms (runtime) | **34%** / 41% |
| `coreTransformerForBuildPlusRuntime` | 142ms / 120ms | ~2% |
| all **other 209 entries combined** | **≈ 0–29ms each**, sum well under 5% of the pass | negligible |

(`domainAction` + `modelAction` together sum to slightly more than the reported pass total
because `sharedConvertedReferences` mutation between them still lets `modelAction` benefit
partially from `domainAction`'s work — the two are not fully independent.)

The exact same pattern reproduces in the queries pass (56 entries), at smaller scale:
`extractorOrCombinerRecord` (31ms) + `extractorOrCombiner` (99ms) = 130ms of the pass's 149ms
total (**87%**), with all other 54 entries near-zero.

**This overturns the framing in §3.3/§5 A3.** The 50× time-for-3.8×-entries mismatch is **not**
explained by "more entries to process" in a distributed sense, nor primarily by a
uniformly-increasing per-entry cost as the pass progresses (which would have been consistent
with A2/A7's "growing accumulator" story). It is almost entirely explained by the fact that the
`domainAction`-pass dependency set happens to include `domainAction` and `modelAction`
themselves — two large, recursive/self-referential union types (an Action taxonomy covering
essentially the whole app) — while the queries-pass dependency set's equivalent root
(`extractorOrCombinerRecord`/`extractorOrCombiner`) is structurally smaller. **A3 is refined,
not refuted**: the *concept* that `domainAction`'s dependency closure is inherently large is
still true, but the *mechanism* by which that translates into wall-clock cost is not "212 small
entries add up" — it's "1–2 self-referential entries are individually catastrophic."

### 5.2.2 Node-visit volume and memo effectiveness — quantifies A1

| Pass | Node visits | Memo hits | Memo misses | Hit ratio | Time | Visits/ms |
|---|---|---|---|---|---|---|
| Queries (56 entries) | 16,743 | 1,413 | 4,590 | 23.5% | 149ms | 112.4 |
| domainAction (212 entries) | 836,451 | 62,546 | 205,273 | 23.4% | 7,430ms | 112.6 |

**Two findings of equal importance:**

1. **Memo hit ratio is identical (~23.4%) in both passes** — confirming **A1** quantitatively:
   roughly **3 out of 4 `schemaReference` node encounters are cache misses**, i.e. genuinely
   redundant re-resolution of a reference whose converted form may already exist elsewhere in
   the (structurally, not just by-name) walk. One single reference,
   `miroirTemplate_..._transformer_inner_label_extend`, is independently re-visited **71,089
   times** during the domainAction pass (**60,334** for `coreTransformerForBuildPlusRuntime`,
   **55,666** for `transformerForBuildPlusRuntime_optional_Abstract_extend`) — direct,
   unambiguous evidence that the same sub-schema is walked from scratch an enormous number of
   times because nothing but the (rarely-hit) named-reference memo prevents it.
2. **Cost-per-node-visit is essentially constant across the two passes** (~112.5 visits/ms in
   both) — meaning the *average* cost of visiting a node does **not** measurably increase as
   `sharedConvertedReferences` grows from 34/90 seed entries up to 154 final entries. This
   weakens (does not eliminate — see §5.2.3) the A7 "spread cost grows with accumulator size"
   story as the dominant explanation for the domainAction pass's overall cost: the dominant
   effect is **visit-count explosion** (49.96× more visits for 3.8× more entries — matching the
   49.9× time ratio almost exactly), not **increasing marginal cost per visit**.

### 5.2.3 A4 — partially refuted: the top-level skip *does* fire, just not for the reason expected

Contrary to the Step-1 static-analysis prediction ("practically impossible" for `entryName` to
match a forged key), the top-level skip in `createLocalizedInnerResolutionStoreWithCarryOn`
(Helpers.ts `:567`) **does fire — 56 times out of 212** (26.4%) in the `domainAction` pass
(`topLevelSkipHits: 56, topLevelSkipMisses: 156`; queries pass: `0`/`56`, seed too small to
overlap). Mechanism, confirmed by reading `getMiroirFundamentalJzodSchema.ts:3408-3418`: the
context passed into the `domainAction` dependency-set walk
(`absoluteMiroirFundamentalJzodSchemaWithQueriesTemplates.definition.context`) already contains
the **forged-name outputs of the queries pass** merged in via spread, and
`domainActionDependencySet`'s transitive walk (`domainAction` structurally depends on Transformer
types that were already carry-on-converted in the queries pass) picks up **56 of those
forged-name entries directly as dependency-set members** — so `entryName` legitimately *is* a
forged name for those 56, and it *does* match the seed (`convertedJzodSchemaWithQueriesTemplates`,
size 90 = 34+56). **Verdict: A4's underlying mechanism (plain-name vs. forged-name namespace) is
real and does cause most misses (156/212, 74%), but the claim that the skip "never fires" is
wrong** — it fires exactly for the subset of dependency-set members that are themselves
prior-pass carry-on outputs. This nuance doesn't change the bottom-line severity (74% of
top-level entries still miss, and — per §5.2.1 — the skip's hit/miss status for the **cheap**
210 entries is irrelevant to wall-clock time anyway, since the cost is concentrated in
`domainAction`/`modelAction`, which are both **misses** at the top level in both passes).

### 5.2.4 A6 — confirmed byte-for-byte identical between build and runtime

Re-running the same instrumentation against the runtime cold path
(`schemaForDeployment.unit.test.ts`, Library deployment, `'extended'` mode) produced **the same
node-visit count (836,505 vs. 836,451), the same memo hit/miss split (62,546/205,273), and the
same top-2 dominant entries** (`domainAction` 4,746ms / 72%, `modelAction` 2,676ms / 41% of a
~6.6–7.7s pass across 6 repeated cold calls in the test file). This is not merely "the same
function" (already known from the call graph, §4) — it is **empirically identical cost behavior**,
confirming that any fix targeting `domainAction`/`modelAction` processing benefits the runtime
cold-start cost by the same proportion as the build-time cost.

### 5.2.5 Bisection (§2.3) — not performed; superseded by higher-resolution data

The per-entry timing in §5.2.1 already answers, at finer granularity than a bisection would,
the question the bisection was designed to answer ("is cost concentrated or distributed?" —
answer: concentrated, in exactly 2 of 212 entries). Running a bisection would only reconfirm
this at coarser resolution, so it was skipped as low marginal value for the effort.

### 5.2.6 Revised ranked attribution (supersedes the "rough attribution" placeholder in the guideline §3.2)

| Cause | Contribution to the 7.4s `domainAction` pass | Confidence |
|---|---|---|
| **A1 (no structural memoization outside named references) manifesting specifically inside the `domainAction`/`modelAction` recursive subtrees** | **~99%** (5209+2561 = 7770ms of ~7430–8496ms observed across runs; all other 210 entries combined are noise) | High — directly measured |
| A2/A7 (spread cost scaling with accumulator size) | Present but **not** the dominant driver of the domainAction-pass-vs-queries-pass gap (cost/visit is ~constant across passes, §5.2.2) — may still be a **secondary** contributor to *why* `domainAction`/`modelAction`'s own internal visit count is so high (each of their ~800k internal visits still pays spread cost each time) | Medium — plausible but not isolated from A1 by this instrumentation |
| A3 (dependency-set size, 212 vs 56) | **Not itself the driver** — refined to "which specific large recursive members are included", not "how many total members" (§5.2.1) | High — directly measured |
| A4 (top-level skip ineffective) | **Irrelevant to the dominant cost** — whether or not `domainAction`/`modelAction` hit the *top-level* skip (they don't, in either pass), the cost lives in their *internal* recursive walk, governed by the (rarely-hit, 23.4%) inner memo, not the outer skip | High — directly measured |
| A5 (verbose logging) | Unchanged — still a minor, separate cost (§5 original estimate) | Not re-measured in §2 (out of scope — it's a constant-time cost, not part of the carry-on algorithm) |
| A6 (runtime shares the cost) | **Confirmed, byte-for-byte** (§5.2.4) | High — directly measured |

**Practical implication for future "way 3" refactor work**: the highest-leverage fix is very
likely **not** a broad rewrite of `applyLimitedCarryOnSchemaOnLevel`'s general memoization
strategy, but a **targeted fix for how `domainAction` and `modelAction` (and the
`coreTransformerForBuildPlusRuntime`/`transformer_inner_label` substructure nested deep inside
them) are walked** — e.g. identity-based memoization keyed by `baseSchema` object reference
(not just named absolute references) would very plausibly collapse the 71,089 redundant visits
to `transformer_inner_label_extend` (and the other top-revisited references) down close to a
single visit each, which — given the near-constant per-visit cost measured in §5.2.2 — should
translate close to proportionally into wall-clock savings. This should be validated with a
narrowly-scoped prototype (instrumented the same way) before committing to a full implementation
plan.

---

## 6. Is the schema actually needed at runtime? (testing Claim A / Claim B)

Investigated call sites for `miroirFundamentalJzodSchema` / `MiroirModelEnvironment.miroirFundamentalJzodSchema`
across `DomainController`, `TransformersForRuntime`, and the server.

**Findings:**

- The ordinary **instance-action CRUD path** (`handleAction → handleInstanceAction →
  callPersistenceAction`) never touches `MiroirModelEnvironment` or the schema at all.
- The **application/composite-action path** (`handleApplicationAction`) reads
  `currentModelEnvironment.endpointsByUuid` / `currentModel`, **not** the schema field, before
  threading the environment into `transformer_extended_apply`.
- The schema **is** a genuine, real dependency for a specific family of Transformers/paths:
  `jzodResolveSchemaReferenceInContext` (schema-reference resolution),
  `jzodObjectFlatten`, `getDefaultValueForJzodSchemaWithResolution` (default value for a
  `schemaReference`), the optional `transformer_jzodTypeCheck` handler, and UI editors
  (`TypedValueObjectEditor`, `JsonObjectDeleteFormDialog`). These are **not** on the
  per-action hot path — they run only when a Transformer of that specific kind is evaluated, or
  in UI forms.
- However, `currentModelEnvironment()` (both `miroir-localcache-redux` and
  `-zustand` `Model.ts`) **unconditionally** calls `getMiroirFundamentalSchemaForDeployment`
  while constructing the environment bag — so **every** consumer that needs *any* field of
  `MiroirModelEnvironment` (even just `endpointsByUuid`) pays for schema resolution/caching,
  whether or not it ever reads the schema field.

**Conclusion**: Claim A is **partially confirmed** — the schema is not read on the per-action
hot path, but it is not "spurious" in the sense of being unused; it is a real, narrower
dependency (typing/resolution service) that is currently **bundled unconditionally** into the
general-purpose environment object every caller receives. Claim B holds structurally today
(Miroir/Admin resolve schema **per requested deployment/application only** — #199 "current
application only" decision — they do not merge/consume other apps' schemas for their own
purposes). The actionable opportunity is **not** "delete the schema", but:

1. Decouple **environment construction** (endpoints, currentModel — cheap) from **schema
   resolution** (expensive) so that callers who only need the cheap parts don't force a schema
   build/cache-lookup.
2. Keep the algorithmic fix (§5) as the primary lever, since schema resolution is genuinely
   needed by real callers and cannot simply be skipped.

---

## 7. Existing performance instrumentation & tests inventory

| File | Covers | Timing assertions? |
|---|---|---|
| `packages/miroir-core/tests/1_core/jzod/jzodToJzod.unit.test.ts` | Correctness of `applyLimitedCarryOnSchema` (many structural cases) | **No** |
| `packages/miroir-core/tests/1_core/jzod/jzodToJzod_Summary.unit.test.ts` | Carry-on summary/aggregate behavior | **No** |
| `packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts` | Runtime resolution; **"completes within 500ms"** warm Library call (Phase 2.9); **"second call … hits cache (< 500ms)"** (Phase 199 revision cache); "data-only change does not trigger carry-on" | Yes — **warm/cached** path only |
| `packages/miroir-core/tests/1_core/schemaResolutionMode.unit.test.ts` | `'static'` mode; **"1000 calls in under 50ms"** | Yes — static (no carry-on) path only |
| `packages/miroir-core/tests/1_core/modelEnvironment.unit.test.ts` | Default env construction; **"under 10ms"** | Yes — static defaults only |

**Gap confirmed**: there is currently **no test anywhere that times the cold
`getMiroirFundamentalJzodSchema` build itself, or the cold `'extended'`/`'auto'` carry-on path**
— only the post-cache warm path is guarded. Any refactor under #200 should add a cold-path
timing guard (with a generous but meaningful ceiling) to prevent regressions and to measure
progress. See investigation-guideline.md for a concrete harness proposal.

---

## 8. Size / complexity facts

| Metric | Value |
|---|---|
| Generated schema file (`miroirFundamentalJzodSchema.ts`) | ~43,700 lines, ~1.5 MB |
| Generated types file (`miroirFundamentalType.ts`) | ~10,500 lines |
| Total context top-level keys | ~548 |
| Of which `miroirTemplate_*` (carry-on templates) | ~190 |
| `domainAction` transitive dependency set size | 212 |
| `extractorOrCombinerRecord` (queries) transitive dependency set size | 56 |
| Extended-schema set size (`transformerType`/`interpolation`-tagged) | 34 |
| Generator source (`getMiroirFundamentalJzodSchema.ts`) | ~3,716 lines |
| Carry-on core (`JzodToJzod_CarryOn.ts`) | ~960 lines |

---

## 9. Improvement directions mapped to "ways of action"

### Way 1 — code review (this document, §5 and §5.1)

Anti-patterns A1–A7 above are the direct output of this pass (A7 added during the §5.1 static
review — see investigation-guideline.md §1 for the checklist that produced it, and its own
Confirmed/Refuted verdicts table for each hypothesis).

### Way 2 — harnessing for diagnostics

No harness currently isolates node-visit counts, cache hit/miss ratios, or per-branch cost
within the `domainAction` pass. See investigation-guideline.md §2 for concrete instrumentation
to add (temporarily, behind a flag) before attempting any refactor.

### Way 3 — steady refactors (candidates to evaluate, **not** to implement yet)

**Updated after §5.2 instrumentation (2026-07-17)** — quantified data (§5.2.6) shows the cost is
~99% concentrated in `domainAction`/`modelAction`'s own recursive internal walk (836k node
visits, 23.4% memo hit rate, one reference re-visited 71,089 times), not evenly distributed and
not clearly driven by accumulator-size growth (cost/visit is ~constant across passes, §5.2.2).
The candidate ranking below is reordered accordingly; A7 is downgraded from "likely primary
lever" to "plausible secondary contributor" pending isolation.

| Candidate | Targets | Risk |
|---|---|---|
| **Identity-based memoization (`WeakMap<object, ApplyCarryOnSchemaOnLevelReturnType>` keyed by `baseSchema` reference, checked at the top of `applyLimitedCarryOnSchemaOnLevel` for *every* node type, not just named `schemaReference`) inside `applyLimitedCarryOnSchemaOnLevel`** | **A1 — primary lever per §5.2 data**: should collapse the 71,089/60,334/55,666-visit hot references down to ~1 visit each | Medium — must confirm schema sub-objects passed into `domainAction`'s subtree are stable references (not freshly cloned per call site) for identity comparison to be effective; validate with a narrow prototype instrumented the same way as §2 before committing |
| Stop spreading the full inherited `convertedReferences` into a `schemaReference` node's own `resolvedReferences` (`:916-920`, `:937-941`); return only genuinely new entries, matching every other case's existing convention | A7 — secondary; may reduce cost-per-visit further once A1 cuts visit count, but §5.2.2 shows it is not, on its own, the dominant driver | Low–Medium — must confirm no caller actually relies on receiving the full inherited map back |
| Replace spread-accumulation with a single mutable `Map`/object threaded and mutated in place (avoid `{...convertedReferences, ...x}` at every level) | A2 | Low–Medium — must preserve "each reference converted at most once" semantics (function's own doc comment, `JzodToJzod_CarryOn.ts:117`) |
| Fix or remove the ineffective top-level skip in `createLocalizedInnerResolutionStoreWithCarryOn` (A4) — either key it consistently with forged names, or drop it if redundant with inner memoization | A4 | Low — currently dead-or-rare code path; verify with instrumentation first |
| Reuse/seed the `domainAction` pass more aggressively from the `queries` pass's already-converted references (`convertedJzodSchemaWithQueriesTemplates`, already passed in — confirm actual hit rate) | A1/A3 overlap | Low — data plumbing already exists; may just need the memoization fix (A1) to pay off |
| Gate verbose `JSON.stringify` logging behind `MIROIR_SCHEMA_PROFILE`/similar env flag | A5 | Low |
| Persist/cache the build-time carry-on intermediate result across `devBuild` invocations when source entity/action definitions are unchanged (content hash of inputs) | Build-time only | Medium — cache invalidation correctness; overlaps #199 Proposal 4 spirit but for build, not runtime |

### §9.1 Prototype fix implemented and measured (2026-07-17)

Per the decision gate (§4 of investigation-guideline.md, resolved by the user 2026-07-17: narrow
scope, no persisted cache, algorithmic fix only, measure before setting a ceiling), a **narrow**
prototype was implemented and measured — not the general `WeakMap`-based identity memoization
originally sketched in §9's table above, but a more precise, lower-risk fix that root-causes the
*specific mechanism* behind the 71,089-revisit finding (§5.2.2):

**Root cause found (new — call it A8, more precise than A1):** in
`applyLimitedCarryOnSchemaOnLevel`'s `"union"` case, every branch is processed via
`baseSchema.definition.map(...)`, and **every branch receives the exact same, unmodified
`convertedReferences` accumulator** — unlike the `"object"` (attribute loop) and `"tuple"` (item
loop) cases, which already sequentially fold each child's discoveries into the accumulator before
processing the next child. So when the same sub-schema (e.g. a Transformer type) is referenced
from many sibling branches of a large union — exactly what `domainAction`/`modelAction` are — each
sibling independently rediscovers and reconverts it from scratch, because it never sees what an
earlier sibling already converted. This directly violates the function's own documented contract
("resolves/converts each found reference at most 1 time"). The exact same bug pattern existed a
second time, in the array form of `JzodObject.extend` (`baseSchema.extend.map(...)`, same
unshared-accumulator issue), fixed identically.

**Fix:** in both sites, accumulate each processed sibling's `resolvedReferences` into a local
`Record<string, JzodElement>` and fold it into the accumulator passed to the *next* sibling
(`{...convertedReferences, ...accumulatedSoFar}`, skipped entirely when there is nothing new to
fold in, to avoid paying spread cost on every branch when no new work was discovered). This is a
~25-line, 2-call-site change, fully covered by existing tests, with **zero semantic change** to
the resulting schema (verified below) — it only removes duplicate work.

**Measured results** (same instrumentation as §5.2, same machine, same command):

| Metric | Before (§5.2.2) | After | Improvement |
|---|---|---|---|
| Node visits (`domainAction` pass) | 836,451 | 196,074 | **4.27×** fewer |
| Memo hits / misses | 62,546 / 205,273 (23.4%) | 15,558 / 47,114 (24.8%) | hit *ratio* ~unchanged — fewer total lookups needed at all, not a higher-hit-rate cache |
| Top-revisited reference (`transformer_inner_label_extend`) | 71,089 visits | 16,206 visits | **4.38×** fewer |
| `domainAction` pass wall time | 7,430ms | ~3,850–4,100ms (3 runs) | **~1.85×** faster |
| `generateSchemas` total (`npm run generate-ts-types`) | ~8,660–8,780ms (§3.1) | ~4,540–5,160ms (5 runs) | **~1.75×** faster (≈43–48% reduction) |

**Correctness verification:**
- `jzodToJzod.unit.test.ts`, `jzodToJzod_Summary.unit.test.ts` (26 cases), `schemaForDeployment.unit.test.ts` (17),
  `schemaResolutionMode.unit.test.ts` (13), `modelEnvironment.unit.test.ts` (6) — **all green**, no changes needed.
- Generated `miroirFundamentalType.ts` re-diffed against the pre-fix version: **byte-for-byte
  identical** except the auto-generated timestamp comment — confirms this is a pure performance
  fix with no observable change to the produced schema.
- Runtime cold path re-checked via `schemaForDeployment.unit.test.ts`'s Library deployment run:
  `createLocalizedInnerResolutionStoreWithCarryOn(miroirTemplate_)` dropped from the ~4,746ms
  cited in §5.2.4 to ~3,110ms in this run — consistent, proportional improvement on the runtime
  path too, reconfirming **A6** (build and runtime share the same fix benefit).

**What this result means for the remaining ~55% of cost:** the fix eliminates the specific
"siblings don't share progress" duplication, but node visits (196,074) and the top-revisited
reference (16,206) are still far above 1 — meaning either (a) some of those repeats are
legitimately independent first-discoveries of structurally-identical-but-differently-named
references that a name-based memo can't help with, or (b) there is at least one more
non-accumulating recursion site not yet found (candidates not yet checked: whether `record`/`set`
container cases and multi-level union-of-union nesting fully benefit transitively, since a nested
union's own siblings now share progress *within* that nested union, but a grandparent union's
later siblings still start that nested union walk from the grandparent's own accumulator — this
composes correctly by construction, but was not independently re-verified node-by-node). This is
noted as a possible **next slice** rather than pursued further under the "narrow prototype" scope
agreed with the user.

### Way 4 — progressivity / avoid unnecessary recomputation in UI & server

- Decouple cheap environment fields (`endpointsByUuid`, `currentModel`) from schema resolution
  in `currentModelEnvironment()` (§6) so non-typing callers don't force a schema build.
- Revisit #199 Proposal 3 (central `ModelEnvironmentProvider`, "not started") and Proposal 4
  (deploy-time overlay persistence, "not started") — both reduce *how often* the (now hopefully
  cheaper) algorithm runs, complementary to the Way-3 algorithmic fix.

---

## 10. Related files (quick index)

| File | Relevance |
|---|---|
| `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts` | Top-level generator; phase timings; two `getCarryOnSchemaBuilder` calls (queries, domainAction) |
| `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers.ts` | `getCarryOnSchemaBuilder`, `createLocalizedInnerResolutionStoreWithCarryOn`, `createLocalizedInnerResolutionStoreForExtendedSchemas`, `applyDeploymentDomainActionCarryOn` (runtime reuse), `resolveReferencesWithCarryOn`, `getDependencySet` |
| `packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts` | `applyLimitedCarryOnSchemaOnLevel` — the recursive core; `forgeCarryOnReferenceName` |
| `packages/miroir-core/src/1_core/jzod/JzodSchemaReferences.ts` | `jzodTransitiveDependencySet` — builds the 212-entry `domainAction` dependency set |
| `packages/miroir-core/scripts/generate-ts-types.ts` | `generateSchemas()` — build entry point; SUMMARY timing printout |
| `packages/miroir-core/src/1_core/jzod/schemaForDeployment.ts` | Runtime reuse of the same algorithm (#199); revision cache sits **around**, not **inside**, the expensive call |
| `packages/miroir-core/src/1_core/jzod/jzodResolveSchemaReferenceInContext.ts` | Real runtime reader of `miroirFundamentalJzodSchema` (schema-reference resolution) |
| `packages/miroir-core/src/2_domain/TransformersForRuntime.ts` | Where `MiroirModelEnvironment` is threaded through Transformer execution; schema field read only for specific handlers |
| `packages/miroir-core/src/2_domain/DomainController.ts` | Action dispatch; confirmed **not** reading schema on the instance-action hot path |
| `packages/miroir-localcache-redux/src/4_services/localCache/Model.ts`, `packages/miroir-localcache-zustand/src/4_services/localCache/Model.ts` | `currentModelEnvironment()` — unconditionally resolves schema when building env (§6 finding) |
| `packages/miroir-core/tests/1_core/jzod/jzodToJzod.unit.test.ts` | Correctness gate — must stay green through any refactor |
| `packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts`, `schemaResolutionMode.unit.test.ts`, `modelEnvironment.unit.test.ts` | Existing perf guards (warm/static paths only — see §7 gap) |
| `code-helpers/features/198-FEATURE- composing tests using application-defined Actions/impact-analysis-and-solutions.md` | Prior art: chose targeted `getCarryOnSchemaBuilder` for `domainAction` only over full-schema runtime rebuild; documents cold ~6-7s |
| `code-helpers/features/199-REFACTOR improve meta-model access performance/analysis.md` | Runtime resolution modes + revision cache; explicitly excludes `generateSchemas` from scope |

---

## 11. Open questions (to settle before/during implementation, not before investigation)

**Question 2 below is answered** (2026-07-17, §5.2.6): the ~50× mismatch is ~99% attributable to
A1 (missing identity memoization), specifically inside `domainAction`/`modelAction`'s own
recursive walk — not meaningfully attributable to A2/A4. The rest remain genuine **decisions**,
not further investigation:

1. **[DECISION NEEDED]** Is a **persisted build-time cache** (content-hash keyed, on disk) for
   the carry-on intermediate result acceptable, or must `generateSchemas` always be a fully cold,
   from-source computation (simplicity / no stale-cache risk)? — Note: given §5.2's finding, an
   in-memory identity-memoization fix inside `applyLimitedCarryOnSchemaOnLevel` may make this
   largely moot for the build script (a single cold run should already collapse from ~8.3s to a
   small fraction of that); a persisted cache would mainly help if that in-process fix turns out
   insufficient, or for the "no `MetaModel` change at all between commits" case in CI.
2. ~~How much of the ~50× time/entry-count mismatch (§3.3) is A1 vs A2 vs A4~~ — **Answered**,
   see §5.2.6: ~99% A1, localized to `domainAction`/`modelAction`.
3. **[DECISION NEEDED]** Should `currentModelEnvironment()`'s schema field become **lazy** (a
   getter / promise resolved on first access) instead of eagerly resolved — bigger API change,
   more risk, larger payoff for callers that never touch typing (§6 finding: most callers of
   `currentModelEnvironment()` don't need the schema field, only `endpointsByUuid`/`currentModel`,
   yet resolution is unconditional today). This is **independent** of the §5.2 algorithmic fix —
   doing the lazy-field change without the algorithmic fix still leaves the underlying cost the
   same for the callers that *do* need typing; doing the algorithmic fix without the lazy field
   still leaves non-typing callers paying (a now-smaller, but nonzero) cost. Worth asking whether
   both are in scope for #200 or only the algorithmic fix.
4. **[DECISION NEEDED]** What is an acceptable **cold-path** target ceiling to encode as a
   regression test (the issue says "fast!" but does not give a number)? Now that §5.2 shows the
   cost is concentrated in a fixable hot spot rather than being irreducibly proportional to
   entry count, a more aggressive target than the original placeholder (cold build ≤ 2s, cold
   runtime Library carry-on ≤ 1s) may be realistic — but this should be confirmed against a
   working prototype fix, not set blindly ahead of one.
5. **[DECISION NEEDED — new, from §5.2 findings]** Should the first "ways of action #3" slice be
   scoped **narrowly** (identity-based memoization specifically for the `domainAction`/
   `modelAction` recursive walk — smaller, faster, lower-risk, directly targets the measured
   99%) or **broadly** (general-purpose identity memoization for every node type in
   `applyLimitedCarryOnSchemaOnLevel`, which would also help the queries pass's smaller 87%
   concentration and any future large recursive type, at the cost of a bigger, riskier change)?
   §9's candidate table currently recommends the general form (it naturally covers the narrow
   case), but a narrower, more surgical first slice may be preferable for a first TDD cycle.

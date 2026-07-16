# 200 — TDD Implementation Plan: alleviate footprint of fundamental schema calculation

> **Scope of this plan**: the single narrow fix decided at the decision gate — sibling
> union-branches (and `extend`-array elements) in `applyLimitedCarryOnSchemaOnLevel` must share
> converted-reference progress, instead of each independently rediscovering shared sub-schemas.
> No persisted build-time cache, no `currentModelEnvironment()` laziness (both explicitly
> deferred — see "Out of scope" below). Each cycle follows red → green; the RED step for Phase 1
> was verified retroactively (via `git stash` against the already-implemented fix) since the fix
> was built as an instrumented prototype before this plan was written — see analysis.md §9.1.

Related: [analysis.md](./analysis.md) · [investigation-guideline.md](./investigation-guideline.md) · [#200](https://github.com/miroir-framework/miroir/issues/200) · builds on [#199 TDD plan](../199-REFACTOR%20improve%20meta-model%20access%20performance/tdd-implementation-plan.md) (explicitly left `generateSchemas` unchanged — this plan is the follow-up that touches it)

---

## Implementation status (2026-07-17)

| Phase | Scope | Status |
|---|---|---|
| **1** | Sibling-sharing fix in `applyLimitedCarryOnSchemaOnLevel` (`union` + `extend`-array cases) | **Done** — gate 1.5 green |
| **2** | Regression-test ceiling (cold-path timing guard) | **Done** — gate 2.2 green |
| **3** | Wide acceptance / cleanup | **Done** — gate 3.1 green |

**Key deliverables**

| Area | Files |
|---|---|
| The fix | `packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts` (`"union"` case, `"object".extend` array case) |
| Regression-test ceiling | `packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts` (new describe `Phase 200 — cold-path performance ceiling`) |
| Diagnostic root-cause data (no code) | `analysis.md` §5.2, §9.1 |

**Measured impact** (see analysis.md §9.1 for full numbers and methodology):

| Metric | Before | After |
|---|---|---|
| Node visits (`domainAction` pass, 212-entry dependency set) | 836,451 | 196,074 (**4.27× fewer**) |
| Top-revisited reference visit count | 71,089 | 16,206 (**4.38× fewer**) |
| `domainAction` pass wall time | 7,430ms | ~3,850–4,100ms (**~1.85× faster**) |
| `generateSchemas` total build time | ~8.7–8.8s | ~4.5–5.2s (**~43–48% reduction**) |
| Generated `miroirFundamentalType.ts` output | — | **byte-for-byte identical** (except timestamp) — pure perf fix, zero semantic change |

**Known env limits (not 200 regressions)** — same as #199: prefer `npm run testByFile -- <path>`
over `npm test -- <pattern>` for single-file runs in `miroir-core`.

---

## Design decisions (settled at the decision gate, 2026-07-17)

| Decision | Choice |
|---|---|
| **Fix scope** | **Narrow**: fix the specific sibling-sharing bug (§9.1's A8) in `applyLimitedCarryOnSchemaOnLevel`'s `"union"`/`extend`-array cases only — **not** a general `WeakMap`-based identity-memoization rewrite of every node type (analysis.md §9's original, broader candidate) |
| **Persisted build-time cache** | **Out of scope** for #200 — the in-process algorithmic fix already gets most of the win; revisit only if a future measurement shows it's still insufficient |
| **`currentModelEnvironment()` laziness** | **Out of scope** for #200 — algorithmic fix only; file as a separate follow-up issue if pursued |
| **Cold-path regression ceiling** | Measured first, then set with headroom: **6000ms** for the Library `extended`-mode cold rebuild (`resolveFundamentalSchemaForDeployment`) — chosen ~1.5–2× above the fixed measurement (~3.1–4.1s) to avoid CI flakiness, while remaining well below the pre-fix cost (~6.6–7.7s cold runtime / ~7.4s equivalent build-time pass) so a regression is still caught |
| **RED verification method** | Since the fix was already implemented as an instrumented prototype before this plan was written (per user's explicit request — "prototype now, TDD plan after"), RED was verified **retroactively**: `git stash` the fix file only, run the new ceiling test, confirm failure (see Phase 2 below), then restore the fix |

---

## Test execution conventions

Same as #199 — see [#199 TDD plan §"Test execution conventions"](../199-REFACTOR%20improve%20meta-model%20access%20performance/tdd-implementation-plan.md#test-execution-conventions). All commands below run from `packages/miroir-core` unless noted.

**Legend**

| Label | Meaning |
|---|---|
| **Progress (RED)** | New test(s) must **fail** before implementation |
| **Progress (GREEN)** | Same test(s) **pass** after implementation |
| **Non-regression** | Must stay green after slice |

---

## High-level phase structure

```
Phase 1 — Sibling-sharing fix in applyLimitedCarryOnSchemaOnLevel     slice 1.1–1.5   [DONE]
  Goal : union branches / extend-array elements share converted-reference progress;
         zero semantic change to generated schema; ~45% build-time reduction.

Phase 2 — Regression-test ceiling (cold-path timing guard)            slice 2.1–2.2   [DONE]
  Goal : encode the measured improvement as a regression test that would have failed
         pre-fix and passes post-fix with headroom.

Phase 3 — Wide acceptance / cleanup                                   slice 3.1        [DONE]
  Goal : confirm no stray instrumentation left in source tree; generated output unchanged;
         full related-test sweep green.
```

---

## Phase 1 — Sibling-sharing fix in `applyLimitedCarryOnSchemaOnLevel` ✅

### 1.1  Root-cause: union branches don't share converted-reference progress

**Behavior (bug, pre-fix)**: in the `"union"` case, `baseSchema.definition.map(...)` passes the
**same, unmodified** `convertedReferences` accumulator to every sibling branch — unlike the
`"object"` (attribute loop) and `"tuple"` (item loop) cases, which already sequentially fold each
child's discoveries into the accumulator before processing the next child. A sub-schema referenced
from many union branches (e.g. a Transformer type embedded in most `domainAction`/`modelAction`
branches) is therefore independently rediscovered and reconverted **once per branch** instead of
once total — directly violating the function's own documented contract ("resolves/converts each
found reference at most 1 time"). The identical pattern existed a second time in the array form of
`JzodObject.extend` (`baseSchema.extend.map(...)`).

Found via: instrumented profiling (§5.2) surfaced a single reference re-visited 71,089 times inside
one `domainAction`-pass call; reading the `"union"` case's `.map()` alongside the `"object"`/`"tuple"`
cases' sequential accumulation immediately showed the asymmetry (analysis.md §9.1).

```
RED — packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts
  (Phase 200 — cold-path performance ceiling, added in Phase 2 below — see there for the
  actual RED/GREEN test, since this phase's "test" is fundamentally a timing regression,
  not a behavior-shape assertion; §1.5 below re-confirms behavior-shape non-regression.)
```

**GREEN**: in `packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts`:
- `"union"` case: accumulate each processed sibling's `resolvedReferences` into a local
  `unionAccumulatedReferences` map; fold it into the accumulator passed to the next sibling
  (`{...convertedReferences, ...unionAccumulatedReferences}`), skipped when there's nothing new
  to fold in (avoids paying spread cost on every branch when no new work was discovered).
- `JzodObject.extend` array case: identical fix, `extendAccumulatedReferences`.

| When | Command | Expect |
|---|---|---|
| **Non-regression** | `npm run testByFile -- tests/1_core/jzod/jzodToJzod.unit.test.ts` | PASS |
| **Non-regression** | `npm run testByFile -- tests/1_core/jzod/jzodToJzod_Summary.unit.test.ts` | PASS (26 cases) |

**Commit**: `perf(core): share converted-reference progress across sibling union/extend branches (#200)`

---

### 1.2  Zero semantic change — generated schema output unaffected

**Behavior**: the fix must be a **pure performance improvement** — the generated
`miroirFundamentalJzodSchema` (build-time artifact) must be identical before/after.

```
Verification (not a new automated test — a one-time manual diff, documented here for
reproducibility):

  git stash push -- packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts
  npm run generate-ts-types    # pre-fix generation
  git diff -- .../preprocessor-generated/miroirFundamentalType.ts   # baseline
  git stash pop
  npm run generate-ts-types    # post-fix generation
  git diff -- .../preprocessor-generated/miroirFundamentalType.ts   # only the timestamp comment differs
```

| When | Command | Expect |
|---|---|---|
| **Non-regression** | `git diff -- packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` after regenerating | Only the `// generated on <timestamp>` line differs |

**No commit** (verification only; generated file is reverted via `git checkout --` after each
regeneration, per repo convention of not committing regenerated build artifacts from local runs).

---

### 1.3  Non-regression: existing carry-on / schema-shape tests

| When | Command | Expect |
|---|---|---|
| **Non-regression** | `npm run testByFile -- tests/1_core/schemaResolutionMode.unit.test.ts` | PASS (13 cases) |
| **Non-regression** | `npm run testByFile -- tests/1_core/modelEnvironment.unit.test.ts` | PASS (6 cases) |

---

### 1.4  Non-regression: runtime cold path (proportional improvement, not just build-time)

**Behavior**: the fix benefits the **runtime** cold path (`resolveFundamentalSchemaForDeployment`,
Library `'extended'` mode) by the same proportion as build-time, confirming analysis.md's **A6**
(build and runtime share the identical algorithm and cost profile).

| When | Command | Expect |
|---|---|---|
| **Non-regression** | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | PASS (18 cases incl. new Phase 200 test, see Phase 2) |

---

### 1.5  Phase 1 regression gate

| # | Command | Guards |
|---|---|---|
| 1 | `npm run testByFile -- tests/1_core/jzod/jzodToJzod.unit.test.ts` | Core carry-on correctness |
| 2 | `npm run testByFile -- tests/1_core/jzod/jzodToJzod_Summary.unit.test.ts` | Summary/depth-limited views |
| 3 | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | 198/199/200 extended-schema behavior |
| 4 | `npm run testByFile -- tests/1_core/schemaResolutionMode.unit.test.ts` | Mode router unaffected |
| 5 | `npm run testByFile -- tests/1_core/modelEnvironment.unit.test.ts` | Static defaults unaffected |

**Gate**: run all 5 — **passed**.

---

## Phase 2 — Regression-test ceiling (cold-path timing guard) ✅

### 2.1  Cold rebuild completes within a measured-then-set ceiling

**Behavior**: `resolveFundamentalSchemaForDeployment(libraryUuid, mutatedModel, 'extended')` — a
cache-missing rebuild after an endpoint edit — completes in **under 6000ms**. Chosen with
headroom over the fixed measurement (~3.1–4.1s) but well below the pre-fix cost (~6.6–7.7s cold
runtime / ~7.4s equivalent build-time pass), so a regression back toward the old behavior is
still caught.

```
RED (verified retroactively against pre-fix code via `git stash`) —
packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts

  describe("resolveFundamentalSchemaForDeployment (Phase 200 — cold-path performance ceiling)")
    it("cold rebuild after endpoint edit (domainAction carry-on) completes within 6s (#200)")
      // warm build, mutate an endpoint (adds a new actionType), time the rebuild call
      expect(elapsed).toBeLessThan(6_000)
```

**Actual RED run** (fix stashed): `AssertionError: expected 6537 to be less than 6000` — confirms
the ceiling is meaningful (would have failed pre-fix).

**GREEN** (fix restored): passes, measured ~3.0s for the internal `domainAction` carry-on pass
inside a ~6.05s total test-body duration (includes the warm build call too).

| When | Command | Expect |
|---|---|---|
| **Progress (RED)** | `git stash push -- .../JzodToJzod_CarryOn.ts && npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts -t "cold rebuild"` | FAIL (`expected 6537 to be less than 6000`) |
| **Progress (GREEN)** | `git stash pop && npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts -t "cold rebuild"` | PASS |

**Commit**: `test(core): add #200 cold-path rebuild timing regression guard`

---

### 2.2  Phase 2 regression gate

| # | Command | Guards |
|---|---|---|
| 1 | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | Full file, 18 cases incl. new ceiling test |

**Gate**: **passed** (18/18).

---

## Phase 3 — Wide acceptance / cleanup ✅

### 3.1  Full regression sweep + clean working tree

| # | Command | Guards |
|---|---|---|
| 1 | `npm run testByFile -- tests/1_core/jzod/jzodToJzod.unit.test.ts` | Carry-on correctness |
| 2 | `npm run testByFile -- tests/1_core/jzod/jzodToJzod_Summary.unit.test.ts` | Summary views |
| 3 | `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | Extended schema + new ceiling |
| 4 | `npm run testByFile -- tests/1_core/schemaResolutionMode.unit.test.ts` | Mode router |
| 5 | `npm run testByFile -- tests/1_core/modelEnvironment.unit.test.ts` | Static defaults |
| 6 | `git status --porcelain -- packages/miroir-core/` | Only the fix + new test file modified; no stray instrumentation, no generated-file diff left uncommitted |

**Gate**: **passed** — working tree contains exactly:
- `packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts` (the fix)
- `packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts` (the new regression test)

---

## Summary: commit sequence

```
Phase 1 (sibling-sharing fix)                               [DONE]
  1.1  perf(core): share converted-reference progress across sibling union/extend branches (#200)
  (1.2) verification — no commit (generated-file diff check only)
  (1.5) gate

Phase 2 (regression-test ceiling)                           [DONE]
  2.1  test(core): add #200 cold-path rebuild timing regression guard
  (2.2) gate

Phase 3                                                     [DONE]
  (3.1) full regression sweep + clean-tree gate
```

---

## Key implementation hazards

### H1 — Ceiling tightness vs. CI flakiness
6000ms gives ~1.5–2× headroom over the measured ~3.1–4.1s post-fix cost. If CI hardware is
significantly slower than the dev machine used for measurement, this may need loosening — but
should stay well under the ~6.6–7.7s pre-fix cost to remain a meaningful regression guard.

### H2 — This fix does not close the full gap
Node visits dropped 4.27× but did not reach ~1 (the top reference still shows 16,206 visits
post-fix, analysis.md §9.1). There may be at least one more non-accumulating recursion site not
yet found (deep union-of-union nesting was not independently re-verified node-by-node). This is
**intentionally out of scope** for this narrow fix — flagged as a candidate follow-up slice, not
a defect in this plan.

### H3 — Do not conflate this fix with #199's revision cache
#199's revision cache sits **around** the expensive call (skips it entirely on a cache hit); this
fix makes the call itself faster when it **does** run (cache miss / cold path / build-time, where
#199's cache cannot help). Both are complementary, not overlapping.

---

## Out of scope (follow-up issues, per the decision gate)

- **Persisted build-time cache** (content-hash keyed, on disk) for the carry-on intermediate
  result — revisit only if a future measurement shows the algorithmic fix alone is insufficient.
- **`currentModelEnvironment()` laziness** (defer schema resolution for callers that only need
  `endpointsByUuid`/`currentModel`) — independent of this algorithmic fix; file separately if
  pursued.
- **Broader/general identity memoization** (analysis.md §9's original `WeakMap`-keyed candidate,
  covering every node type) — the narrow fix in this plan already captures the measured ~99%
  concentration in `domainAction`/`modelAction`; a general rewrite remains a candidate for a
  future slice if H2's residual gap turns out to matter.
- **Proposal 3 / 4 from #199** (central `ModelEnvironmentProvider`, deploy-time overlay
  persistence) — unaffected by this plan, still open per #199's own "out of scope" list.

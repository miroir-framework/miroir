# 200 — First investigation guideline (concrete steps for agents)

> Scope: issue #200's **ways of action 1 & 2** — code review and harnessing/diagnostics.
> This guideline does **not** ask you to implement a refactor. Its output is a **diagnostic
> report** (data + a short-list of confirmed root causes with numbers) that a follow-up
> "ways of action 3" TDD implementation plan can be built on. Do not skip straight to fixing
> code — every step below produces evidence first.

Related: [analysis.md](./analysis.md) · [#200](https://github.com/miroir-framework/miroir/issues/200) · builds on [#199 TDD plan](../199-REFACTOR%20improve%20meta-model%20access%20performance/tdd-implementation-plan.md)

## Progress status

| Step | Status | Notes |
|---|---|---|
| **0 — Before you start / ground rules** | ✅ **Done** (2026-07-16) | Correctness baseline (`jzodToJzod.unit.test.ts`, `jzodToJzod_Summary.unit.test.ts`) green |
| **1 — Static code review** | ✅ **Done** (2026-07-16) | Verdicts in [analysis.md §5.1](./analysis.md#51-step-1-static-review-verdicts-2026-07-16-investigation-guideline-1); new finding **A7** added |
| **2 — Harnessing for diagnostics** | ✅ **Done** (2026-07-17) | Quantified results in [analysis.md §5.2](./analysis.md#52-step-2-instrumentation-results-2026-07-17-investigation-guideline-2); instrumentation added, run, data captured, then fully reverted (no diff left in source). **Headline: cost is ~99% concentrated in 2 of 212 entries (`domainAction` + `modelAction`), not distributed** |
| **3 — Diagnostic report** | ✅ **Done** (2026-07-17) | Signed off — see [analysis.md "Report sign-off"](./analysis.md#report-sign-off-2026-07-17--investigation-complete-ready-for-decision-gate) at the top of the document |
| **4 — Decision gate** | ✅ **Done** (2026-07-17) | User decided: narrow scope, no persisted cache, algorithmic fix only, measure-then-set-ceiling, prototype-then-TDD-plan. See analysis.md §11 for the 5 questions and outcomes. |
| **5 — Narrow prototype fix (beyond this guideline's stated scope — "ways of action 3", done at explicit user request)** | ✅ **Done** (2026-07-17) | Implemented in `JzodToJzod_CarryOn.ts` (union + extend-array sibling-sharing fix). **~43–48% total build-time reduction, 4.27× fewer node visits, all tests green, generated output byte-for-byte identical.** Full write-up: [analysis.md §9.1](./analysis.md#91-prototype-fix-implemented-and-measured-2026-07-17). Formalized into [tdd-implementation-plan.md](./tdd-implementation-plan.md) with a regression-test ceiling (RED/GREEN-verified). Working tree currently holds the fix + new test, uncommitted. |

> Note: this document's stated scope (top of file) is "ways of action 1 & 2" only. Step 5 above
> was performed anyway, at the user's explicit request after the decision gate, as a fast
> measure-before-committing check before writing a full TDD plan — not a scope creep by the agent.

---

## 0. Before you start

Read `analysis.md` in full first — it already contains a measured baseline (§3), a call graph
(§4), and five named anti-pattern hypotheses **A1–A6** (§5). Your job in this guideline is to
**confirm or refute each hypothesis with fresh evidence**, and quantify which ones dominate.

**Ground rules:**

- Work in `packages/miroir-core`. All commands below assume that as the working directory
  unless stated otherwise.
- Any code you add for instrumentation must be **temporary and clearly marked**
  (`// #200 INVESTIGATION — remove before merge` or gated behind an env flag such as
  `MIROIR_SCHEMA_PROFILE=1`). Do not leave debug `console.log` additions in the final diff.
- Never modify `applyLimitedCarryOnSchemaOnLevel` / `getCarryOnSchemaBuilder` /
  `createLocalizedInnerResolutionStoreWithCarryOn`'s **behavior** in this phase — instrumentation
  must be observationally transparent (timers, counters, logging only). If you accidentally
  change output, `npm run testByFile -- tests/1_core/jzod/jzodToJzod.unit.test.ts` will tell you.
- Re-run the correctness baseline before AND after every instrumentation change:

```bash
cd packages/miroir-core
npm run testByFile -- tests/1_core/jzod/jzodToJzod.unit.test.ts
npm run testByFile -- tests/1_core/jzod/jzodToJzod_Summary.unit.test.ts
```

Both must stay green throughout. If either goes red after an instrumentation change, you changed
behavior — revert and redo it as pure observation.

---

## 1. Static code review pass (ways of action #1) — ✅ Done (2026-07-16)

Work through each file below and answer the listed questions **in writing**, in your diagnostic
report (§3). Cite file + line for every answer, the same way analysis.md does.

**Full verdicts written up in [analysis.md §5.1](./analysis.md#51-step-1-static-review-verdicts-2026-07-16-investigation-guideline-1).**

### 1.1 `packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts`

For **each** `case` in the `switch (baseSchema.type)` inside `applyLimitedCarryOnSchemaOnLevel`
(`any`/primitives, `literal`, `record`, `set`, `array`, `tuple`, `object`, `union`,
`schemaReference`):

- [x] Does this case perform any **identity-based** check (e.g. `WeakMap`/`Map` keyed by
      `baseSchema` object reference) before recursing, or does it unconditionally recurse and
      allocate new objects every time? (confirms/refutes **A1**) — **A1 confirmed**: only the
      `schemaReference` case has a memo check (`:806`); every other case unconditionally recurses.
- [x] Does this case build a new "resolved references" object via **spread**
      (`{...convertedReferences, ...x}`) or via **mutation** of a shared structure? If spread,
      note the two operand sizes at the call site (roughly: how large can `convertedReferences`
      get by the time this case is reached in the `domainAction` pass?). (confirms/refutes **A2**) —
      **A2 confirmed** (`object` `:591`, `tuple` `:451-454`, `schemaReference`'s own context loop
      `:756-759`); **plus new finding A7**: `schemaReference`'s own `resolvedReferences` return
      spreads the *entire* inherited `convertedReferences` (`:916-920`/`:937-941`), not just new
      entries — see analysis.md §5.1.
- [x] For the `"schemaReference"` case specifically (`JzodToJzod_CarryOn.ts:718-958`): confirm
      whether the loop over `baseSchema.context` (its own local/captured context, `:744-770`) runs
      **before** the `localReferenceName` memo check (`:806`), i.e. whether a reference that will
      turn out to be a memo hit still pays for walking its own local context first. Trace one
      concrete example schema from the codebase that has a non-empty local `context` to confirm. —
      **Confirmed**: the `:744-770` loop runs unconditionally before the `:806` memo check.

### 1.2 `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers.ts`

- [x] In `createLocalizedInnerResolutionStoreWithCarryOn` (`:539-605`), the skip check at `:564`
      (`entryName in (convertedReferences??{})`) uses **plain** entry names. The map it checks
      against (`sharedConvertedReferences`, passed in as `convertedReferences`) is populated at
      `:588` via `Object.assign(sharedConvertedReferences, schemaWithCarryOn.resolvedReferences)`.
      Instrument (see §2.1) to determine: **does this skip ever actually fire during the
      `domainAction` pass**, and if so, how often? (confirms/refutes **A4** — do not just read the
      code, get a real count) — **A4 confirmed by static analysis** (namespace mismatch: plain
      names vs. forged `miroirTemplate_…` names); **exact count confirmed by instrumentation in
      §2**, see analysis.md §5.2 for the measured hit/miss numbers.
- [x] In `getCarryOnSchemaBuilder` (`:636-727`), confirm what `convertedReferences` is seeded
      with for the `domainAction` call specifically (`getMiroirFundamentalJzodSchema.ts:3467`,
      `convertedJzodSchemaWithQueriesTemplates`) — how many keys does that seed have, and does
      instrumentation show entries from that seed being reused (memo hits) during the
      `domainAction` walk? — Seed size and inner (nested, non-top-level) memo hit rate measured
      in §2 — see analysis.md §5.2.

### 1.3 `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts`

- [x] Confirm the exact dependency-set sizes today (`extendedSchemas`, `queriesDependencySet`,
      `domainActionDependencySet`) by adding one-line logs (or re-running with existing
      `log.info`/`console.log` already present around `:3312-3444`) — do these match the analysis.md
      §3.3 numbers (34 / 56 / 212)? If the codebase has since changed, **update analysis.md §3
      and §8 with the fresh numbers** rather than silently using stale ones. — **Reconfirmed
      unchanged**: 34 / 56 / 212, no drift.

### 1.4 Write down your review findings — done, see analysis.md §5.1

For each of A1–A5 in analysis.md §5, write one of: **Confirmed** (with evidence), **Refuted**
(with evidence), or **Partially confirmed / needs data** (→ goes to §2 instrumentation). Do this
before writing any new code.

---

## 2. Harnessing for diagnostics (ways of action #2) — ✅ Done (2026-07-17)

Goal: get **quantified, per-node** data, not just per-phase timings (analysis.md §3 already has
phase-level timings — you need finer granularity to attribute the 50× blow-up to a specific
cause).

**Full results in [analysis.md §5.2](./analysis.md#52-step-2-instrumentation-results-2026-07-17-investigation-guideline-2).**
Headline: the 50× blow-up is **not** distributed across the 212 entries — it is **~99%
concentrated in exactly 2 entries** (`domainAction` itself and `modelAction`), which are
recursive/self-referential union types with an extremely low (23.4%) memo hit rate inside their
own subtree (one reference, `transformer_inner_label_extend`, is independently re-visited 71,089
times). This reframes §5 A3 (refined, not refuted) and downgrades A7 from "likely primary lever"
to "plausible secondary contributor" (§9 candidate table updated accordingly). All instrumentation
described below was added, run (build-time **and** runtime cold path), data captured, then
**fully reverted** (`git checkout --` on both touched files, confirmed zero diff) — no debug code
remains in the source tree.

### 2.1 Visit/allocation counters (confirms A1, A4) — done, see analysis.md §5.2.2/§5.2.3

Add a module-level counter object in `JzodToJzod_CarryOn.ts`, gated so it has zero cost when
unset:

```ts
// #200 INVESTIGATION — remove before merge
const carryOnDiagnostics = process.env.MIROIR_SCHEMA_PROFILE
  ? {
      nodeVisits: 0,
      memoHitsByType: {} as Record<string, number>,
      memoMissesByType: {} as Record<string, number>,
      visitedSchemaReferenceNames: new Map<string, number>(), // localReferenceName -> visit count
    }
  : undefined;
```

Increment `nodeVisits` once per call to `applyLimitedCarryOnSchemaOnLevel`. In the
`"schemaReference"` case, increment `visitedSchemaReferenceNames.get(localReferenceName)` on
every visit (before the memo check) and increment `memoHitsByType`/`memoMissesByType` at the
memo branch (`:806`). At the end of the `domainAction` pass, dump:

```ts
if (carryOnDiagnostics) {
  console.log("#200 diagnostics:", {
    nodeVisits: carryOnDiagnostics.nodeVisits,
    memoHits: Object.values(carryOnDiagnostics.memoHitsByType).reduce((a, b) => a + b, 0),
    memoMisses: Object.values(carryOnDiagnostics.memoMissesByType).reduce((a, b) => a + b, 0),
    topRevisitedReferences: [...carryOnDiagnostics.visitedSchemaReferenceNames.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20),
  });
}
```

Run with:

```bash
MIROIR_SCHEMA_PROFILE=1 npm run generate-ts-types
```

**Report**: total node visits for the `domainAction` pass; memo hit ratio; the top 20
most-revisited reference names and their visit counts. A reference visited N times with a low
memo-hit rate at that name is direct evidence for A1 (no identity memoization) and quantifies the
waste.

### 2.2 Per-entry timing (confirms/localizes A3) — done, see analysis.md §5.2.1 (headline finding)

In `createLocalizedInnerResolutionStoreWithCarryOn` (`Helpers.ts:557` loop), wrap the
`applyLimitedCarryOnSchemaOnLevel` call per entry with a timer (gated the same way) and log the
top 10 slowest entries by name:

```ts
// #200 INVESTIGATION — remove before merge
const _entryStart = process.env.MIROIR_SCHEMA_PROFILE ? Date.now() : 0;
const schemaWithCarryOn = applyLimitedCarryOnSchemaOnLevel(/* ...unchanged args... */);
if (process.env.MIROIR_SCHEMA_PROFILE) {
  entryTimings.push([entryName, Date.now() - _entryStart]);
}
```

Sort and print the slowest entries after the loop. **Report**: is the 7.4s dominated by a
handful of pathological entries (e.g. one deeply-nested Action type), or spread evenly across
all 212 — this determines whether a targeted fix (special-case the slow entries) or a general
fix (memoization) is the right lever.

### 2.3 Bisection sanity check (cheap cross-check for A3 vs A1/A2) — skipped, see analysis.md §5.2.5

Superseded by the higher-resolution per-entry timing in §2.2, which already answers the question
this check was designed for at finer granularity. Kept below for reference in case a future
agent wants an independent cross-check.

Temporarily (do not commit) reduce `domainActionDependencySet` to a small fixed subset (e.g. 20
entries picked from the "slowest" list from §2.2) directly in
`getMiroirFundamentalJzodSchema.ts` around `:3436`, and re-run `npm run generate-ts-types`.
Compare the resulting `createLocalizedInnerResolutionStoreWithCarryOn` time for 20 entries
against the proportional expectation (`7430ms × 20/212 ≈ 700ms`). If the actual time for the
20-entry subset is **much higher** than 700ms, that confirms those specific entries are
pathologically expensive on their own (independent of accumulator size) — a different signal
than if it's roughly proportional (which would point more squarely at accumulator-size effects,
A2). **Revert this temporary change immediately after recording the number** — do not leave the
generator in a broken state.

### 2.4 Memo-map size vs time correlation (confirms A2) — done; result: no rising trend found, see analysis.md §5.2.2

Using the per-entry timings from §2.2, plot (even just as a printed table) each entry's
processing time against the **size of `sharedConvertedReferences` at the time that entry was
processed** (i.e., its index in iteration order as a proxy, since the map only grows). A rising
trend (later entries taking longer, even for structurally simple entries) is evidence for A2
(the spread cost of an ever-growing accumulator dominates, independent of the entry's own
complexity). **Actual result**: the opposite of a rising trend — the single most expensive
entry (`domainAction`) is processed **first**, while entries processed later (with a larger
accumulator) are consistently near-zero. Cost/visit is ~constant across the whole pass
(§5.2.2). A2/A7 are not eliminated as real inefficiencies, but they are **not** the explanation
for the domainAction-vs-queries-pass gap.

### 2.5 Cross-check against the runtime cold path — done, see analysis.md §5.2.4

Repeat a lightweight version of §2.1/§2.2 for the runtime path, to confirm the same root causes
apply (not just re-timing — the goal is to confirm A6):

```bash
MIROIR_SCHEMA_PROFILE=1 npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts
```

(This exercises `applyDeploymentDomainActionCarryOn` for the Library deployment's **cold** call,
inside the "Phase 2.9 — performance" describe block, which explicitly warms the cache with a
first call before timing the second — your diagnostics should attach to that **first**,
untimed call.)

---

## 3. Produce the diagnostic report — mostly satisfied by §5.2; formal sign-off still open

Update `analysis.md` in place (recommended) or add a dated `profiling-notes.md` in this same
folder, containing:

1. **Confirmed/Refuted table** for A1–A6, each with the specific number(s) that settled it
   (node visit counts, memo hit ratio, slowest-entries list, bisection result, correlation
   observation). — ✅ done, analysis.md §5.2.1–§5.2.4.
2. **Ranked list of root causes** by estimated contribution to the 7.4s, e.g. "~60% attributable
   to A2 (accumulator spread cost), ~30% to A1 (missing identity memoization on non-reference
   nodes), ~10% to A3 (irreducible entry count)" — rough attribution is fine, exact profiling
   percentages are not required, but must be backed by the counters above, not guesswork. —
   ✅ done, analysis.md §5.2.6 (actual finding: ~99% A1, inside the `domainAction`/`modelAction`
   subtree specifically — the original rough-attribution example above turned out wrong in its
   details, corrected in §5.2.6).
3. **Any hypothesis in analysis.md that turned out to be wrong** — update analysis.md §5
   accordingly rather than leaving stale claims. — ✅ done: A3 refined (§5.2.1), A4 partially
   refuted (§5.2.3), A7 downgraded from primary to secondary candidate (§9 table).
4. Confirm whether the fresh dependency-set sizes (§1.3) still match 34/56/212, and update
   analysis.md §3/§8 if they've drifted. — ✅ done in Step 1 (§1.3), reconfirmed unchanged.

**Still open before this step can be marked fully done**: a short explicit sign-off note in
analysis.md stating the report is final and ready for the §4 decision gate (currently the data
is complete but scattered across §5.2's subsections — a future pass could consolidate into a
single top-of-document summary if that would help a next agent orient faster).

---

## 4. Decision gate — when to move to "ways of action #3" (refactor)

Do **not** start implementing fixes until:

- [x] Every A1–A6 hypothesis in analysis.md has a Confirmed/Refuted verdict backed by data
      (§3 of this guide). — done, analysis.md §5.2.1–§5.2.4.
- [x] You have a ranked list of root causes (§3.2) — this determines refactor priority order. —
      done, analysis.md §5.2.6.
- [x] `jzodToJzod.unit.test.ts` and `jzodToJzod_Summary.unit.test.ts` are still green (no
      accidental behavior change from instrumentation). — confirmed green before instrumentation,
      after adding it, and after reverting it.
- [x] All temporary instrumentation is either removed or fully gated behind
      `MIROIR_SCHEMA_PROFILE` with zero cost when unset (confirm by re-running the baseline
      timing from analysis.md §3.1 without the flag and checking it hasn't regressed). — removed
      entirely (`git checkout --`, verified zero diff); baseline not yet re-timed post-revert
      (low risk, since the change is a pure revert to the pre-instrumentation file content).
- [ ] You (or the next agent) have proposed which candidate(s) from analysis.md §9 "Way 3" to
      pursue first, and flagged which of analysis.md §11's open questions need a user decision
      before implementation starts (in particular: acceptable cold-path target ceiling, and
      whether a persisted build-time cache is in scope). — **§9's table now has a clear #1
      candidate** (identity-based memoization scoped to `domainAction`/`modelAction`'s recursive
      walk), but this checkbox is left unchecked deliberately: picking the target ceiling and
      committing to an approach is a **user decision**, not something to decide unilaterally
      mid-investigation.

Once the gate is satisfied, the next document to write (not part of this guideline's scope) is a
`tdd-implementation-plan.md` mirroring the structure used for #199 — red/green slices, one
proposal at a time, with the cold-path timing test (analysis.md §7 gap) added as the very first
slice so that all subsequent refactor work is measured against a real regression guard.

---

## 5. Quick command reference

| Command | Purpose |
|---|---|
| `cd packages/miroir-core && npm run generate-ts-types` | Reproduce build-time baseline + phase timings |
| `MIROIR_SCHEMA_PROFILE=1 npm run generate-ts-types` | Same, with §2 instrumentation active |
| `npm run testByFile -- tests/1_core/jzod/jzodToJzod.unit.test.ts` | Correctness gate for `applyLimitedCarryOnSchema` — must stay green |
| `npm run testByFile -- tests/1_core/jzod/jzodToJzod_Summary.unit.test.ts` | Correctness gate (summary/aggregate cases) — must stay green |
| `npm run testByFile -- tests/1_core/schemaForDeployment.unit.test.ts` | Runtime cold/warm path (Library); Phase 2.9 + Phase 199 describes |
| `npm run testByFile -- tests/1_core/schemaResolutionMode.unit.test.ts` | Static-mode timing guard (unaffected by this investigation) |
| `MIROIR_SCHEMA_MODE=frozen npm run testByFile -- tests/1_core/modelEnvironment.unit.test.ts` | Confirms frozen/static default envs unaffected |

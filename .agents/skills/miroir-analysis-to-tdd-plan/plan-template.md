# Issue #<NNN> — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real <DomainController / local cache / emulated server / store profile>,
> through <the applicative interface — name it: endpoint / runner / report / transformer / public TS API>.
> No mocks. <One line on what the tracer bullet proves.>

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/<NNN>
Prerequisite: [`../<NNN>-<slug>/`](../<NNN>-<slug>/) ✅ <or remove>
Working branch: `<branch>`

**Resume note:** <filled as slices land, e.g. "Slices 0–3 DONE">

---

## Scope

<What's in, 3–6 bullets.>

This plan does **not** <excluded work> (owned by #<NNN> / deferred).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize <current contracts> | ⬜ | <test file / suite> |
| 1 | <tracer bullet behavior> | ⬜ | <test + observable result> |
| … | | | |
| N | Nonreg, docs, cleanup, AC | ⬜ | nonreg step + tracer narrative |

---

## Locked implementation defaults

<Copied from the analysis decision record; binding for this plan. Deviations go into the slice's Realization.>

| Decision | Choice |
|---|---|
| <decision 1> | <choice> |
| <decision 2> | <choice> |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| <new model element> | `<uuid>` |
| MiroirTest suite | `<uuid>` / `<suite_key>` |
| Nonreg step | `<step-name>` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| <suite> (MiroirTest unit) | `npm run testMiroir -w miroir-core -- --suites <suite> --mode unit` |
| <suite> (MiroirTest integ) | `npm run testMiroir -w miroir-standalone-app -- --suites <suite> --mode integration` |
| <internal> vitest | `RUN_TEST=<name> npm run testByFile -w <pkg> -- <name>` |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-<app> -- tests/modelValidation.unit.test.ts` |
| Schema rebuild (if schemas touched) | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |

---

## Slice 0 — Characterize <what exists>

### Goal

Lock current contracts / fixtures / asset layout so later refactors have a safety net.

### 0.1 RED → GREEN — <contract characterization>

**Test:** `<tests/<layer>/issues/<NNN>-<slug>/<feature>.<NNN>.phase0.unit.test.ts>` or MiroirTest suite `<key>`

Behavior asserted:
- <current behavior / shape locked, incl. known misalignments from the analysis>

### Validation

```bash
<commands>
```

---

## Slice 1 — <tracer bullet: first observable behavior>

### Goal

<One sentence: who can do what after this slice that they could not before.>

**Layers cut:** <JSON asset → schema/type → domain/controller → view — list only those touched>

### 1.1 RED

**Test:** <vehicle per the skill's test-type table — MiroirTest type or justified vitest>

Behavior asserted:
- <observable behavior through the applicative / public interface>

### 1.2 GREEN

<Minimal implementation notes — no speculative features. Schema rebuild step here if assets changed.>

### 1.3 Refactor checkpoint

- <duplication / deepening / dead code revealed by this slice; map analysis misalignments here>

### Validation

```bash
<commands>
```

### Realization

<Filled after completion: what was actually done, deviations from plan, problems met & solved.>

---

<repeat per slice>

---

## Slice N — Nonreg, docs, cleanup, AC

### N.1 Nonreg

- Add `<step-name>` to `scripts/nonreg-manifest.json`.

### N.2 Docs

- `analysis.md` status → implemented; progress table DONE; testing docs note new suite keys.

### N.3 Issue-directory cleanup

- Migrate still-valuable assertions from `tests/**/issues/<NNN>-*/` into feature-named suites; delete the issue directory (per `docs/contributing/testing.md`, #238 rule).

### N.4 Tracer bullet (narrative)

1. <manual end-to-end path, numbered>

Automated equivalent: <suite / test proving the same path>.

### AC checklist (#<NNN>)

| Criterion | Proven by | Status |
|---|---|---|
| <criterion from issue> | <test / suite> | ⬜ |

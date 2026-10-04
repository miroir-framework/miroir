---
name: miroir-code-quality
description: Code smells of the Miroir codebase and their remedies. Use when reviewing a change, when refactoring code under packages/, and before writing new code there.
---

# Miroir code quality

A **smell** here is code that compiles and passes its tests but behaves wrong in use, or makes the next change costly. Each smell has an id (`swallowed-error`, `pub-sub`, …) shared by this skill, the reference files and the output of `npm run smells`.

Rules already stated elsewhere stay there, and this skill points to them: [AGENTS.md](../../../AGENTS.md) (layers, React, actions, loggers, tests), [`docs/contributing/code-style.md`](../../../docs/contributing/code-style.md) (logger setup and presets), [`docs/reference/ml-nomenclature.md`](../../../docs/reference/ml-nomenclature.md) (ML names), [`docs/contributing/testing.md`](../../../docs/contributing/testing.md) (MiroirTest).

## Branches

### Review a change

1. Run `npm run smells -- --diff` from the repository root. It lists the smells on lines added since the merge base with `origin/_integration`, commits, working tree and untracked files included; pass `--diff <base>` for another base. Lines the change moves from elsewhere are only counted: that code is not new.
2. Take each finding in report order. Open its smell in the checklist below, then its entry in the reference file, and classify it: **fix** (apply the remedy), **propose** (the remedy is larger than the change; write it in the review), or **sanctioned** (the entry's "Leave it" case applies; say which).
3. Walk the checklist rows marked *manual* against the diff: the runner cannot see them.

Done when every finding and every manual row has a verdict, and each **fix** is applied or listed.

### Refactor an area

1. Run `npm run smells -- <files or folders>` on the code you will touch. The report covers the whole files.
2. Fix wrong-behaviour smells first, then cost-of-change smells. Pin current behaviour with a test before each fix (skill `tdd`), one smell per commit.
3. Keep to the area: list the findings outside it rather than fixing them.

Done when no wrong-behaviour finding is left in the touched code, or each one left has a written reason.

### Write new code

Read the checklist once, top to bottom, before writing; copy the sanctioned forms named in the reference files. When the code is written, run **Review a change** on it.

## Checklist

Most harmful first. *Lens*: a warn-level ESLint check reported by `npm run smells`. *Lint*: an error in `npm run lint`. *Runner*: a text check of `npm run smells`. *Manual*: no detector.

**Wrong behaviour:** the code passes its tests and fails in use.

| # | Smell | Look for | Detect | Detail |
|---|---|---|---|---|
| 1 | `swallowed-error` | a `catch` that only logs; an empty `.catch` | lens | [typescript.md](typescript.md#swallowed-error) |
| 2 | `action-result` | a `throw` or `return … as any` where an action result is declared | lens | [miroir.md](miroir.md#action-result) |
| 3 | `precedence-trap` | `??` mixed with `==`, `<` … without parentheses | lens | [typescript.md](typescript.md#precedence-trap) |
| 4 | `positional-mixup` | two `Uuid` parameters in one positional list | lens | [typescript.md](typescript.md#positional-mixup) |
| 5 | `module-state` | module-level `let`, `Map`, `Set`, filled objects; mutable static fields; `…ForTests` resets | lens | [typescript.md](typescript.md#module-state) |
| 6 | `hooks-order` | a hook called conditionally or in a callback | lint | [react.md](react.md#hooks-order) |
| 7 | `effect-derived-state` | `setState` in an effect or in `useMemo` to compute a value | lens | [react.md](react.md#effect-derived-state) |
| 8 | `state-from-props` | `useState(props.x)` | lens | [react.md](react.md#state-from-props) |
| 9 | `timing` | debounce, `setTimeout(…, 0)`, a timer in an effect | lens | [typescript.md](typescript.md#timing) |
| 10 | `theme-bypass` | a color literal (`"#333"`, `rgba(…)`) in a component | lens | [miroir.md](miroir.md#theme-bypass) |

**Cost of change:** the code works and makes the next change slower.

| # | Smell | Look for | Detect | Detail |
|---|---|---|---|---|
| 11 | `upward-import` | an implementation import from a higher layer | lint | [layering.md](layering.md#upward-import) |
| 12 | `global-environment` | `process.env` read outside a composition root | lens | [layering.md](layering.md#global-environment) |
| 13 | `wiring` | a core service built outside a composition root | lens | [layering.md](layering.md#wiring) |
| 14 | `component-io` | `fetch` in a component or hook | lens | [react.md](react.md#component-io) |
| 15 | `pub-sub` | `.subscribe(…)` called in a component or hook | lens | [react.md](react.md#pub-sub) |
| 16 | `service-read-in-render` | `useMemo` around a service call | lens | [react.md](react.md#service-read-in-render) |
| 17 | `unstable-deps` | a serialisation or a missing entry in a dependency list | lens | [react.md](react.md#unstable-deps) |
| 18 | `prop-drilling` | a prop passed on as is (`x={x}`) through many components | runner | [react.md](react.md#prop-drilling) |
| 19 | `mocked-own-module` | `vi.mock` of Miroir code | lens | [miroir.md](miroir.md#mocked-own-module) |
| 20 | `logic-in-code` | transformers, queries or composite actions written in TypeScript | manual | [miroir.md](miroir.md#logic-in-code) |
| 21 | `duplicated-logic` | a near-identical file in another package | runner | [typescript.md](typescript.md#duplicated-logic) |
| 22 | `logger` | a logger not named after its file; two loggers in a file | runner, lens | [miroir.md](miroir.md#logger) |

**Readability:** the code is harder to read than it needs to be.

| # | Smell | Look for | Detect | Detail |
|---|---|---|---|---|
| 23 | `type-escape` | `any`, `as unknown as`, `as any as` | lens | [typescript.md](typescript.md#type-escape) |
| 24 | `magic-value` | a uuid literal in code | lens | [miroir.md](miroir.md#magic-value) |
| 25 | `ml-naming` | `Jzod` in the name of an ML construct | `npm run check:ml` | [miroir.md](miroir.md#ml-naming) |
| 26 | `long-parameter-list` | more than 5 parameters | lens | [typescript.md](typescript.md#long-parameter-list) |
| 27 | `boolean-flag` | a boolean parameter next to others | lens | [typescript.md](typescript.md#boolean-flag) |
| 28 | `deep-nesting` | blocks nested more than 4 deep | lens | [typescript.md](typescript.md#deep-nesting) |
| 29 | `dead-code` | commented-out code, unused variables, files nothing imports | runner, lens | [typescript.md](typescript.md#dead-code) |

## Tools

- `npm run smells -- --diff [base]` or `npm run smells -- <paths>`: a Markdown report, one section per smell in checklist order, each message stating the remedy. It exits 0 whatever it finds, and 2 on a path that is missing or outside the repository. `--limit N` lists N findings per smell (default 25).
- `npm run lint` blocks a PR; `npm run smells` informs a review. How the lens works, how to add a detector and how to make one blocking: [lens.md](lens.md).
- Repository examples and counts for every smell, measured on 2026-10-04: [`code-helpers/features/340-FEATURE-code-quality-skill/analysis.md`](../../../code-helpers/features/340-FEATURE-code-quality-skill/analysis.md).

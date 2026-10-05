# Issue #340 — TDD Implementation Plan: graduating smell detectors to lint errors

> Vertical slices (RED → GREEN each). Each graduated detector is proven through the public interface of the lint
> setup: ESLint run with `eslint.config.mjs` on sample files (an error), and with the smell lens (a warning, so a
> whole-file review still lists the counted violations). The precedence-trap fix is proven by a MiroirTest
> `functionCallTest` against the real transformer engine. No mocks.
> The tracer bullet makes `action-result` a `npm run lint` error with its 87 existing violations counted.

Analysis: [`./analysis.md`](./analysis.md) (decision D7) · Issue: https://github.com/miroir-framework/miroir/issues/340 · Defects found on the way: #481
Working branch: `claude/340-0b1k4d` (PR #476)

**Resume note:** Slices 0 and 1 DONE.

---

## Scope

A's answers on PR #476 (2026-10-05): keep `theme-bypass` and `prop-drilling` (D9), file section 6 of the analysis as one checklist issue (#481), and make the detectors whose findings are nearly all true lint errors in #476 (D7). This plan covers the last one: the candidates that section 5 of the analysis marks "Graduate".

This plan does **not** fix the counted violations (they stay in `eslint-suppressions.json`, so the counts only go down), nor the other defects of #481.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize: counts per candidate on the merged branch | ✅ | the table below |
| 1 | `action-result` is a lint error (tracer) | ✅ | `eslint-rules/graduated-smells.test.mjs`, `npm run lint` |
| 2 | Double cast (`type-escape`) is a lint error | ⬜ | same |
| 3 | `process.env` outside roots (`global-environment`) is a lint error | ⬜ | same |
| 4 | Subscriptions and `fetch` in views (`pub-sub`, `component-io`) are lint errors | ⬜ | same |
| 5 | `set-state-in-effect` and `max-depth` 4 are lint errors | ⬜ | same |
| 6 | `preserve-caught-error` is a lint error, its 5 sites fixed | ⬜ | same, core typecheck |
| 7 | The 2 precedence traps fixed; `no-mixed-operators` is a lint error | ⬜ | MiroirTest `query.virtualAttributes` > composite transformer value |
| 8 | `miroir/logger`: one logger per file, named after it; 43 loggers renamed | ⬜ | `graduated-smells.test.mjs`, presets updated |
| 9 | Skill, analysis and PR text; gate and nonreg | ⬜ | pre-push gate, `nonreg:unit` |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| D7. Graduation | A detector becomes an error in `eslint.config.mjs`; its existing violations are fixed in the slice or counted per file in `eslint-suppressions.json` | G4 |
| Rule per smell | A graduated `no-restricted-syntax` or `no-restricted-globals` detector runs under its own id, `miroir/<smell-id>`: the same ESLint rule registered under the smell's name. The suppressions file then counts each smell apart, and the lint output names the skill entry | G4 |
| One definition | The graduated selectors and the file sets (`SRC`, `TESTS`, `ROOTS`, views) move from the lens to `eslint-rules/smells.mjs`, imported by both configs | G4 |
| Lens shows everything | The lens reports graduated rules as warnings. Bulk suppressions count errors only, so `npm run smells -- <paths>` still lists the counted violations, and `--diff` still compares with the base | G1, G2 |
| Fix when small | `preserve-caught-error` (5 sites), the 2 precedence traps and the 43 logger names are fixed rather than counted | G3 |

---

## Test execution conventions

| What | Command |
|---|---|
| Lint config tests | `node --test eslint-rules/*.test.mjs` |
| Lint gate | `npm run lint` (exit 0: no new violation, no unused suppression) |
| Count a rule's violations | `npx eslint packages --suppress-rule <rule>` |
| Runner tests | `python -m pytest scripts/tests -q` |
| MiroirTest | `npm run build -w miroir-app-miroir`, then `npm run testMiroir -w miroir-core -- --suites query.virtualAttributes --mode unit` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |

---

## Slice 0: counts on the merged branch

**Status:** ✅ DONE

Lens run on `packages/` after merging `_integration` at `1243b612`:

| Smell | Detector | Findings | Files |
|---|---|---|---|
| `action-result` | 2 selectors | 87 | 14 |
| `type-escape` | double cast selector | 111 | 54 |
| `global-environment` | `process.env` outside roots | 30 | 18 |
| `component-io` | `fetch` in views | 5 | 2 |
| `pub-sub` | `.subscribe(` in views | 3 | 3 |
| `effect-derived-state` | `react-hooks/set-state-in-effect` | 14 | 12 |
| `deep-nesting` | `max-depth` 4 | 39 | 9 |
| `swallowed-error` | `preserve-caught-error` | 5 | 5 |
| `precedence-trap` | `no-mixed-operators` (`??` and comparisons) | 4 (2 sites, reported on both operators) | 1 |
| `logger` | name is not the file name / second logger | 43 / 0 | 43 |

## Slice 1: `action-result` is a lint error (tracer)

**Status:** ✅ DONE

- **RED:** `eslint-rules/graduated-smells.test.mjs`: with `eslint.config.mjs`, a function returning `Promise<Action2VoidReturnType>` that throws gets a `miroir/action-result` error; one returning `new Action2Error("NotImplemented")` gets none. With the lens, the same throw is a warning.
- **GREEN:** `eslint-rules/smells.mjs` (file sets, `smell()`, the `action-result` selectors); `miroir/action-result` registered in `eslint.config.mjs`; the lens drops its own copy and lists the graduated rules as warnings; `smell_of` in the runner reads the bracketed id of `miroir/*` messages; suppressions for the 87.
- **Refactor checkpoint:** the lens test helper and the runner read smell ids the same way.
- **Validation:** `node --test eslint-rules/*.test.mjs`, `npm run lint`, `python -m pytest scripts/tests -q`.

## Slices 2 to 5: the other counted detectors

**Status:** ⬜ pending

One slice each: double cast (`miroir/type-escape`, 111), `process.env` outside roots (`miroir/global-environment`, 30), subscriptions and `fetch` in views (`miroir/pub-sub` 3, `miroir/component-io` 5), and the stock rules `react-hooks/set-state-in-effect` (14) and `max-depth` 4 (39). RED: a flags and a spares case per rule in `graduated-smells.test.mjs`. GREEN: the rule in `eslint.config.mjs`, its count in `eslint-suppressions.json`. Validation as slice 1.

## Slice 6: `preserve-caught-error`

**Status:** ⬜ pending

RED: an error rethrown without `{ cause }` fails lint. GREEN: the 5 sites pass `{ cause: error }` (lib `es2022` has `ErrorOptions`). Validation as slice 1, plus `tsc` for miroir-core, miroir-cli and miroir-mcp.

## Slice 7: the precedence traps

**Status:** ⬜ pending

- **RED:** MiroirTest `query.virtualAttributes`, suite `evaluate`, new `functionCallTest` "composite transformer value": a virtual attribute computed by `entityDefinition_extractAttributes` (a composite transformer) with `interpolation: "runtime"` holds the attribute entries. Before the fix it holds `{ transformerType: "returnValue", value: … }`: `TransformersForRuntime.ts:4243` reads `(interpolation ?? ("build" == "build"))`, so every composite transformer's result is wrapped when build transformers resolve to constants.
- **GREEN:** parenthesise both sites as their correct sibling at line 3951 does: `((transformer as any)["interpolation"] ?? "build") == step` and `… == "build"`. `no-mixed-operators` becomes an error with no count.
- **Validation:** `npm run build -w miroir-app-miroir`, the MiroirTest command, `npm run test -w miroir-core -- ''`, `npm run nonreg:filesystem -- --runner shared --scope smoke,core`.

## Slice 8: `miroir/logger`

**Status:** ⬜ pending

- **RED:** `graduated-smells.test.mjs`: a logger named after another file, or a second logger, is a `miroir/logger` error; a logger named after its file (stem or full name) is not.
- **GREEN:** `eslint-rules/miroir-logger.mjs`; the 43 loggers renamed after their file; the log presets that named the old loggers (`scope-persistence`, `scope-query`, `scope-query-local`, `scope-transformers`, `scope-ui`, `catch-all-detailed`) follow the rename; the runner's text check for logger names goes, since the lens now reports it.
- **Validation:** as slice 1, plus `RUN_TEST=logConfigPresets npm run testByFile -w miroir-standalone-app -- logConfigPresets`.

## Slice 9: skill, analysis, PR text, gate

**Status:** ⬜ pending

The "Lint" lines of the graduated smells in the skill, `lens.md` ("Make a smell blocking" now describes the rule per smell), section 5 and D7 of the analysis, section 6 pointing at #481, the header of `eslint.config.mjs`, the PR description. Validation: the pre-push gate of AGENTS.md and `npm run nonreg:unit -- --runner shared`.

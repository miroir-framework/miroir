# 340: Trial of the skill on PR #457

> Acceptance criterion of #340: the skill tried on one recent PR, with its findings recorded next to the [analysis](analysis.md).

**PR:** #457, "Transformer type display" (#453), merged into `_integration` on 2026-10-04 (`64dc752a`). Diff `73d071d7..aca33678`: 28 files, +2,238 / −93, 21 of them TypeScript files under `packages/`.

**Method:** the skill's branch "Review a change", in a worktree at the PR head. `python scripts/code_smells.py --diff 73d071d7` with this branch's lens and runner, then a verdict on each finding (fix, propose, sanctioned), then the checklist read against the diff for what the runner cannot see.

## 1. First run: 5 findings, none to act on

| Finding | Smell | Verdict |
|---|---|---|
| `transformerTypesDisplay.unit.test.tsx:41` | `mocked-own-module` | Sanctioned, but the entry did not say so. The factory returns `{ ...actual, registerComponentTests: vi.fn(actual.registerComponentTests) }`: a spy over the real export, and the test runs the real code |
| `useAdminViewParams.ts:36` | `type-escape` | Not new. `queryResults?.["viewParams"] as unknown as ViewParamsData` moved from `ComponentTestSandbox.tsx` when the PR extracted `useAdminViewParams` |
| `ComponentTestSandbox.tsx:199`, `:345`; `TransformerTypesDisplay.ts:39` | `boolean-flag` | False positives. `(showTransformerTypes: boolean) => …`: a setter's only parameter is the value it sets |

## 2. Reading the diff: what the runner missed

| Where | Smell | Verdict |
|---|---|---|
| `transformerTypeBadges` passed on as is at 16 places in 6 files (`MlElementEditor` 6, `MlArrayEditor` 3, `MlObjectEditor` 3, `TypedValueObjectEditor` 2, `MlAnyEditor`, `componentTestTools`), plus 5 prop declarations | none in the catalogue: new `prop-drilling` | Propose: one annotations context for the value editors. It is the sixth per-path annotation to take this route after `compatibilityWarnings`, `showMlSchemaTypes`, `mlSchemaTypeAnnotations`, `environmentAnnotations` and `transformerTypeRestrictions`, which are passed on at 15 or 16 places each |
| `TransformerTypeAnnotation.tsx:233-234`: `TransformerTypeBadgeChip` writes its green and red as hex (`#2e7d32`, `#66bb6a`, `#c62828`, `#ef5350`), next to a third status read from the theme | none in the catalogue: new `theme-bypass` | Fix: `currentTheme.colors.success` and `.error`, which the dark theme defines for its own background |
| `useAdminViewParams.ts:42-45`: `ViewParamsUpdateQueue.getInstance(config, domainController)` | `module-state` (a lazy singleton), moved code | Propose, not for this PR: the first call's config and controller stay for the life of the page. The lens missed it: it only knew static fields built with `new` |
| `ComponentTestSandbox.tsx:195-199`: `ComponentTestTransformerTypesSetting` writes two refs during render, to hand the value to the runner | render purity, outside the catalogue (`react-hooks/refs` flags it) | Sanctioned here: the writes are idempotent and React 18 commits every render. Analysis D9 |
| `TransformerTypesDisplay.ts:34-37`: `useShowTransformerTypes` adjusts its state during render when the saved value moves | `effect-derived-state` | Sanctioned: the pattern React documents, with a comment linking it |
| `useAdminViewParams.ts` replaces two copies of the ViewParams query and save | `duplicated-logic` | The PR removes a smell |

The other manual row, `logic-in-code`, finds nothing: the MiroirTest literals in the test are fixtures.

## 3. What changed in the skill and its tools

| Lesson | Change | Test |
|---|---|---|
| Moved code reads as new in a diff | The runner asks git for moved blocks (`--color-moved=blocks`, re-indentation allowed) and only counts the findings on them | `test_diff_scope_covers_commits_working_tree_and_untracked_files` moves a hook to a new file; `test_parse_added_lines_tells_moved_lines_from_new_ones` |
| A setter's boolean is its value | `boolean-flag` only in functions of two or more parameters: 179 findings become 152 | the lens spares `setShowTypes(show: boolean)` |
| A spy keeps the real code | `mocked-own-module` skips a factory whose properties are all `vi.fn(actual.f)`: 95 become 90 | the lens spares the spy, flags a spy next to a stub, flags an automock |
| Drilled props make each new value cost every hop | New smell `prop-drilling`, row 18: a runner check for a prop passed on as is in 5 or more files | `test_drilled_props_are_props_passed_on_as_is_in_many_files` |
| Colors written in components ignore the theme | New smell `theme-bypass`, row 10: a lens check in views outside `Themes/` | the lens flags hex and `rgb()` colors; spares fallbacks after a theme value, translucent tints and theme files |
| Lazy singletons escaped `module-state` | `module-state` covers every mutable static field | the lens flags `private static instance: Q \| null = null` |
| A detect command of the skill printed nothing | In a `git grep` pathspec, `'packages/*/src'` matches no file. The commands now end in `/**`, and lens.md says to try a command on a known case first | run by hand |

## 4. Second run on the same diff

```
## Smells: 18 findings in 7 files (lines added since 73d071d7)

1 more on lines the change moves from elsewhere, not listed: that code is not new.

| Smell | Findings |
|---|---:|
| theme-bypass | 2 |
| prop-drilling | 16 |
```

All 18 are true: the two hex lines of `TransformerTypeBadgeChip` and the 16 places that pass `transformerTypeBadges` on.

## 5. Lessons

- **A catalogue drawn from old code misses what new code repeats.** The survey counted what the code base had piled up. The trial, on a careful recent PR, found two smells the survey had no row for: a sixth annotation threaded through the value editors, and status colors typed by hand.
- **Noise trains reviewers to skip the report.** The first run gave five findings and nothing to act on. Each kind of false positive was one selector condition away from silence.
- **Count moved code apart rather than hide it.** An extracted hook takes its old smells along. They deserve a line in the review, not a demand on the PR that moved them.
- **Try a search on a case you know before trusting its silence.** The skill's own `git grep` command printed nothing over the whole repository, which looks exactly like a clean result.

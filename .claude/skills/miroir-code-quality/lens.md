# The smell lens and the runner

Read this to add a detector, to tune one that reports false positives, or to make a smell blocking.

## How they fit

| Piece | Role |
|---|---|
| `eslint-rules/smell-lens.config.mjs` | The **lens**: `eslint.config.mjs` plus warn-level rules. Custom messages start with `[smell-id]`. It shows the errors whose existing violations `eslint-suppressions.json` counts as warnings: bulk suppressions count errors only, so the lens lists every violation, counted or not |
| `eslint-rules/smells.mjs` | The file sets (`SRC`, `TESTS`, `ROOTS`, views) and the detectors that graduated to `npm run lint`, shared by `eslint.config.mjs` and the lens |
| `eslint-rules/graduated-smells.test.mjs` | One test per graduated detector: an error in `npm run lint`, a warning in the lens. Part of `npm run lint` |
| `eslint-rules/smell-lens.test.mjs` | One test per smell family: each detector flags its pattern and spares the sanctioned form. Part of `npm run lint` |
| `scripts/code_smells.py` (`npm run smells`) | The **runner**: ESLint with the lens, plus three text checks (commented-out code, twin files, props passed on as is); `--diff` keeps the findings on what the branch changes (see [Diff scope](#diff-scope)); prints the findings grouped by smell in checklist order |
| `scripts/tests/test_code_smells.py` | The runner's tests, and a check that its smell order matches this skill's checklist |

## Add or tune a detector

1. Write the selector in the list that matches where the smell applies: `anywhereInSrc`, `outsideCompositionRoots`, `outsideThemes` or `inTests`. The message starts with `[smell-id]`, then says why it hurts and what to do, in one or two sentences.
2. Add a `flags` case and a `spares` case (the sanctioned form, or the false positive you are fixing) to `smell-lens.test.mjs`; run `node --test eslint-rules/smell-lens.test.mjs`.
3. Measure precision: `npm run smells -- packages --limit 200`, then read at least 10 findings of the smell in the code. Narrow the selector until nearly all are true.
4. For a new smell id: add a row to the checklist in `SKILL.md`, an entry in the reference file, and the id to `SMELL_ORDER` in `scripts/code_smells.py` at the same rank; a rule whose messages cannot carry the id goes in `RULE_SMELLS`. `python -m pytest scripts/tests/test_code_smells.py` checks the order.

Gotchas:

- A rule configured in two config blocks is replaced, not merged. That is why the roots and views blocks repeat the shared `no-restricted-syntax` lists. A severity alone (`"warn"`) keeps the options of the earlier block: that is how the lens turns an error of `eslint.config.mjs` into a warning without repeating its selectors.
- `react-hooks/set-state-in-effect` runs the React Compiler on every file: about 13 of the 25 seconds of `npm run lint`. Limiting it to views saves nothing; the time goes into the components. The plugin's other compiler rules would share that compilation.
- The React Compiler rules of `eslint-plugin-react-hooks` (`set-state-in-effect` …) only analyse functions that return JSX.
- Selectors cannot see comments: a policy written in a comment does not silence a finding. The reviewer reads it.
- `-c <config>` resolves the `files` globs from the current directory: run from the repository root.
- In a `git grep` pathspec, a `*` needs a trailing `/**`: `'packages/*/src'` matches no file, and the empty result reads as "no smell". Check a detect command on a case you know before trusting its silence.

## Diff scope

`npm run smells -- --diff` keeps a finding when the branch adds or cuts a line inside the span ESLint reports, so the span has to cover the construct the smell is about:

- Most selectors report the node they judge: a catch block, a subscription call, a parameter.
- `max-params` reports the function head and `exhaustive-deps` the dependency list. A sixth parameter added on its own line, or a value newly read in a hook body, would not count, so the lens runs copies (`spanning` in the lens) that report the parameter list and the whole hook call. The `max-params` copy is `lens/max-params`; the `exhaustive-deps` copy keeps its id. Both still honour an `eslint-disable-next-line` comment on the line the stock rule reports.
- A finding the branch only edits inside, without adding its first line, can be older than the branch: an 870-line `useMemo` that already missed a dependency. The runner lints the base version of that file from a temporary copy and lists the finding only when the file now has more findings with that smell and message.

Lines git marks as moved (`--color-moved=blocks`, re-indentation allowed) are counted apart: that code is not new.

## Make a smell blocking

When nearly every finding is true (analysis D7):

1. Move the detector to `eslint-rules/smells.mjs` and enable it in `eslint.config.mjs` as `"error"`. A `no-restricted-syntax` or `no-restricted-globals` detector runs under its own id, `miroir/<smell-id>`: the stock rule registered again under the smell's name, so `eslint-suppressions.json` counts each smell apart and the lint output names the skill entry. A stock rule (`max-depth`, `react-hooks/set-state-in-effect`) keeps its id, and `RULE_SMELLS` in the runner maps it to its smell.
2. Add the rule id to the lens's list of errors shown as warnings (`ERRORS_IN_SOURCES`, or `ERRORS_IN_SOURCES_AND_TESTS` when the rule also covers tests), and remove the detector from the lens's own lists.
3. Fix the existing violations, or count them: `npx eslint packages --suppress-rule <rule>` writes per-file counts to `eslint-suppressions.json`. A new violation then fails `npm run lint`; a fixed one asks for `npx eslint packages --prune-suppressions`, so the counts only go down. The runner passes `--pass-on-unpruned-suppressions`, since the lens leaves the counts of the rules it downgrades unused.
4. Add a flags and a spares case to `graduated-smells.test.mjs`, and change the smell's "Lint" line in its reference file and its "Detect" cell in the checklist.

The graduated smells and their counts are in section 5 of the [analysis](../../../code-helpers/features/340-FEATURE-code-quality-skill/analysis.md#5-remedies-and-lint-verdicts).

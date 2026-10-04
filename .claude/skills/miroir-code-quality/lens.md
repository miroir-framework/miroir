# The smell lens and the runner

Read this to add a detector, to tune one that reports false positives, or to make a smell blocking.

## How they fit

| Piece | Role |
|---|---|
| `eslint-rules/smell-lens.config.mjs` | The **lens**: `eslint.config.mjs` plus warn-level rules. Custom messages start with `[smell-id]`. Bulk suppressions (`eslint-suppressions.json`) apply, so blocking rules show only new violations |
| `eslint-rules/smell-lens.test.mjs` | One test per smell family: each detector flags its pattern and spares the sanctioned form. Part of `npm run lint` |
| `scripts/code_smells.py` (`npm run smells`) | The **runner**: ESLint with the lens, plus three text checks (commented-out code, logger names, twin files); `--diff` keeps added lines and counts apart the lines git marks as moved; prints the findings grouped by smell in checklist order |
| `scripts/tests/test_code_smells.py` | The runner's tests, and a check that its smell order matches this skill's checklist |

## Add or tune a detector

1. Write the selector in the list that matches where the smell applies: `anywhereInSrc`, `outsideCompositionRoots`, `inViews` or `inTests`. The message starts with `[smell-id]`, then says why it hurts and what to do, in one or two sentences.
2. Add a `flags` case and a `spares` case (the sanctioned form, or the false positive you are fixing) to `smell-lens.test.mjs`; run `node --test eslint-rules/smell-lens.test.mjs`.
3. Measure precision: `npm run smells -- packages --limit 200`, then read at least 10 findings of the smell in the code. Narrow the selector until nearly all are true.
4. For a new smell id: add a row to the checklist in `SKILL.md`, an entry in the reference file, and the id to `SMELL_ORDER` in `scripts/code_smells.py` at the same rank; a rule whose messages cannot carry the id goes in `RULE_SMELLS`. `python -m pytest scripts/tests/test_code_smells.py` checks the order.

Gotchas:

- A rule configured in two config blocks is replaced, not merged. That is why the roots and views blocks repeat the shared `no-restricted-syntax` lists.
- The React Compiler rules of `eslint-plugin-react-hooks` (`set-state-in-effect` …) only analyse functions that return JSX.
- Selectors cannot see comments: a policy written in a comment does not silence a finding. The reviewer reads it.
- `-c <config>` resolves the `files` globs from the current directory: run from the repository root.
- In a `git grep` pathspec, a `*` needs a trailing `/**`: `'packages/*/src'` matches no file, and the empty result reads as "no smell". Check a detect command on a case you know before trusting its silence.

## Make a smell blocking

When nearly every finding is true (analysis D7):

1. Move the rule to `eslint.config.mjs` as `"error"`, with a comment naming the smell.
2. Fix the existing violations, or count them: `npx eslint packages --suppress-rule <rule>` writes per-file counts to `eslint-suppressions.json`. A new violation then fails `npm run lint`; a fixed one asks for `npx eslint packages --prune-suppressions`, so the counts only go down.
3. Remove the detector from the lens if `eslint.config.mjs` now covers it, and change the smell's "Lint" line in its reference file.

The candidates and their counts are in section 5 of the [analysis](../../../code-helpers/features/340-FEATURE-code-quality-skill/analysis.md#5-remedies-and-lint-verdicts).

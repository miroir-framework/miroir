# 251 — Review: gaps and inconsistencies with the codebase

Reviewed against the codebase including staged uncommitted changes.
Tests run green: `TransformerMlSchemaCheck.unit` 15/15, `ListTransformerPanel.unit` 15/15.

## Status inconsistencies

- **Issue is OPEN but fully implemented** in uncommitted staged changes (`analysis.md` says "Status: implemented"). The body reads as future work; no PR/commit yet.
- **Prerequisites mismatch**: #250 closed, but #249 and #88 remain OPEN while their code is on master (`TransformerInterfaceCheck.ts`, `resolveTransformerResultSchema`). "Prerequisites" is misleading.

## Spec vs implementation deviations

1. **Input schema source** — ~~implementation preferred `applyTo` / result-schema constraints~~ **fixed**: `getDeclaredInputMlSchema` lifts `inputOutput.input` only (piped input). Named parameters and `addAttributesToContextBeingSubtypeOf` are out of scope for that function. Characterization tests record walker holes for `case.whens` / `concatLists.lists`.
2. **Output rule** — issue step 3 says `returns === "mlSchema"` → use definition. But `resolveTransformerResultSchema` runs per-type switch cases (mapList, filterList, case, …) that derive dynamically even for static-result definitions; `resolveOutputSchema` silently falls back to the static definition on resolver failure (`TransformerMlSchemaCheck.ts:125-140`) — failures are never surfaced in the tooltip (the issue allows either behavior, but the silent fallback can hide real mismatches).
3. **Value parameters unchecked** — issue engine step 2 mentions "other value parameters checked the same way"; only piped input (applyTo) and output are checked.

## Gaps vs acceptance criteria

4. **"Every typed node" not met** — ~~hardcoded key list missed `case.whens` / `concatLists.lists` / `filterList.predicate`~~ **fixed**: structural walk of nested typed transformers (tests for `case`, `concatLists`, `filterList`). `dataflowSequence` still depends on runtime shape (no stock definition in this checkout).
5. **`dataflowSequence` adjacency** — explicitly named in the issue ("dataflowObject / dataflowSequence"), but neither the walker (arrays skipped) nor `resolveTransformerResultSchema` (no case) handles it. Only `definition`-record transformers (dataflowObject) get the step-to-step check.
6. **Transformer Builder not wired** — the issue says "same control on Transformer Builder if the editor is shared". The shared editors now accept `compatibilityWarnings`/`showMlSchemaTypes`, but only `ListTransformerPanel` passes them; `TransformerEditor.tsx` doesn't.
7. **Per-node border untested** — acceptance wants "nested mismatch borders the inner node"; the panel test asserts the panel's node-list data attribute, not the actual `JzodElementEditor` pathWarning border (TVOE is mocked). No Settings switch test either.
8. **`createObject` context threading** — the walker threads step outputs into context for any `definition` record, but the resolver uses `threadContext=false` for `createObject` (`Transformer_ResultSchema.ts:1053`), so checker and runtime can disagree on sibling-step references.

## Working-tree hygiene

9. `admin_data/…/441cb6fd….json` has `mlSchemaTransformerCompatibility: true` unstaged (staged value is `false`) — committing it flips the default ON, contradicting D1 default-off. Untracked `packages/miroir-job-tracker/` and stray admin_data test assets are unrelated to #251.

## Minor

- `nodePathKey` exported from miroir-core but unused (the panel computes its own key).
- `interfaceCompatibility` is computed even in mlSchema mode (harmless waste).

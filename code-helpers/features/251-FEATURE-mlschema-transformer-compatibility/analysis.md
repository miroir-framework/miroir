# 251 — mlSchema-based transformer compatibility (per-level)

> When the feature switch is on, walk every typed transformer node and compare given vs declared input / derived vs expected output with `isMlSchemaSubtype` (#250). Off keeps the coarse #249 `inputOutput` path unchanged.

Related issue: https://github.com/miroir-framework/miroir/issues/251  
Related: [#250](https://github.com/miroir-framework/miroir/issues/250) (subtyping), [#249](https://github.com/miroir-framework/miroir/issues/249) (`inputOutput`), [#88](https://github.com/miroir-framework/miroir/issues/88) (typed transformers), Proposal B in `docs/proposals/dependent-types-for-transformer-composition.md`

**Status:** implemented.

## Decision record

| Decision | Choice |
|---|---|
| D1 — Gate | **ViewParams `mlSchemaTransformerCompatibility`** (default `false`) plus a session-local **mlSchema types** switch on `ListTransformerPanel`. Off = #249 only. |
| D2 — Piped input | **`inputOutput.input` only** (`getDeclaredInputMlSchema`). Named parameters (`applyTo`, `left`, `right`, `args`) and `addAttributesToContextBeingSubtypeOf` are not “the input”. |
| D3 — Piped input | Skip when accepted input is `undefined` or `any` (`getFromContext` / `returnValue` do not consume the pipe) |
| D4 — Output | `resolveTransformerResultSchema` (Proposal B). On failure, fall back to static `returns: "mlSchema"` definition |
| D5 — Nesting | Structural walk of every nested typed transformer. Slot names only change the pipe (`applyTo` expected = parent piped input; `elementTransformer` / `predicate` unwrap the list element; `then`/`else` inherit expected output). `definition` **records** keep Proposal B adjacency. |
| D6 — UI | Per-node in/out labels; orange `#ff9800` on incompatible nodes (panel wrapper + TVOE path-matched borders) |

## Goals

1. **Per-node check** — A designer can see which nested transformer is inadequate, not only the root.
2. **No #249 regression** — With the switch off, existing `inputOutput` adequacy behavior is unchanged.

## Key reuse

| Piece | Location |
|---|---|
| Subtype check | `packages/miroir-core/src/1_core/jzod/mlSchemaSubtype.ts` |
| Compatibility walker | `packages/miroir-core/src/2_domain/TransformerMlSchemaCheck.ts` |
| Unit tests | `packages/miroir-core/tests/2_domain/TransformerMlSchemaCheck.unit.test.ts` |
| Panel + Settings | `ListTransformerPanel.tsx`, `SettingsPage.tsx`, ViewParams `mlSchemaTransformerCompatibility` |

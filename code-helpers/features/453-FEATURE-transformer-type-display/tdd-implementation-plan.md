# Issue #453 — TDD Implementation Plan

> Testing posture: integration-first, no mocks. The core rules (value typing, `returnValue`
> typing and contradiction, literal reports, badge status) are MiroirTest `functionCallTest`
> cases of `fn.transformer.interfaceWalk` over the real stock definitions. The UI is proven by
> `ui.transformerEditor` MiroirTest cases rendering the real TransformerEditor, and by a vitest
> test of the component test runner with a fake sandbox host.

**Resume note:** read the progress table, then the first slice whose Status is not ✅ DONE.

## Scope

In: analysis goals G1 (compare types while composing), G2 (follow types during a test run), G3 (quiet by default).

Out: ML schemas in badges; slot expectations other than `applyTo` (#454); runtime trace (#455); ListTransformerPanel display; #88 changes.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/453
- Analysis: [`analysis.md`](./analysis.md)
- Branch: `claude/453-transformer-type-display`, PR against `_integration`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize | ✅ DONE | baseline of the touched suites |
| 1 | Value typing (D15) | ✅ DONE | `inputOutputTypeOfValue` cases, literal `applyTo` case |
| 2 | `returnValue` typing, contradiction, literals, status (D6, D12, D13, D16, D17) | ✅ DONE | walk cases |
| 3 | Badges and switch in the TransformerEditor (D1, D3, D7, D18, D19) | ⬜ | `ui.transformerEditor` cases |
| 4 | Switch value in ViewParams and through sandbox cases (D2) | ⬜ | runner test with a fake host |
| 5 | Nonreg, docs, AC check | ⬜ | full `nonreg:filesystem` |

## Locked implementation defaults

| Decision | Default |
|---|---|
| D15 | `inputOutputTypeOfValue`: `null` / `undefined` → `any`; `[]` → `"array"`; non-empty array → `{ type: "array", payload: P }` with `P` the common element type (primitive kind or entity uuid), else `"any"`; object with string `parentUuid` → `parentUuid`; other object → `"object"`; primitives → their kind |
| D12 | `returnValue` without `mlSchema`: output = `inputOutputTypeOfValue(value)`, schema lifted from it |
| D13 | `returnValue` with `mlSchema`: failure `{ direction: "value", given: inputOutputTypeOfValue(value), declared: inferTransformerOutputTypeFromSchema(mlSchema) }` when `inputOutputTypesCompatible(given, declared)` is false |
| D16 | Walk result field `literals: { path: [...nodePath, "applyTo"], type }[]` for each literal `applyTo` |
| D17 | `transformerNodeTypeStatus(node)`: `"mismatch"` when `failures.length > 0`; `"unknown"` when `declared` is undefined, `declared.input` is `"any"` or `"undefined"`, or `consumedInput` is `"any"`; else `"match"` |
| D18 | Label: entity uuid → entity name; unknown uuid → its first 8 characters; arrays `array<P>` |
| D2 | ViewParams attribute `showTransformerTypes?: boolean` (admin ViewParams entity `b9765b7c-b614-4126-a0e2-634463f99937`, tag id 15) |

## Allocated keys

| Element | Value |
|---|---|
| Badge test id | `transformer-type-badge-<path joined by ".">`, attribute `data-transformer-type-status` = `match` / `mismatch` / `unknown` |
| Switch test id | `transformer-editor-show-types-switch` |
| Context | `TransformerTypesDisplayContext` (`{ initial: boolean; save: (value: boolean) => void }`) |
| Host controls | `ComponentTestSandboxHost.showTransformerTypes?(): boolean`, `saveShowTransformerTypes?(value: boolean): void` |

## Test execution conventions

| Purpose | Command |
|---|---|
| Rebuild the deployment after MiroirTest JSON changes | `npm run build -w miroir-app-miroir` |
| Walk suite | `npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceWalk --mode unit` |
| Regressions core | `npm run testMiroir -w miroir-core -- --suites fn.transformer.interfaceCheck,fn.transformer.resultSchema --mode unit` |
| Editor UI suite | `npm run testMiroir -w miroir-standalone-app -- --suites ui.transformerEditor` |
| Runner test | `npm run testByFile -w miroir-standalone-app -- transformerTypesDisplay` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json`, same for `miroir-standalone-app` |

## Slice 0 — Characterize

**Status:** ✅ DONE

- Run the walk suite, the two core regression suites and `ui.transformerEditor` on the branch base; record counts.

### Realization

The container's builds predated `_integration` (miroir-env failed to build against the old miroir-core dist); `npm ci` and `./build-all.sh` first. Baseline taken as the RED run of slices 1-2: the new suite on the base code fails exactly the 17 new or changed cases (44 pass).

## Slice 1 — Value typing (D15)

**Status:** ⬜

**RED**
- `inputOutputTypeOfValue` cases: `[1]` → `array<number>`; `[1, "a"]` → `array<any>`; `[]` → `array`; `[{parentUuid: Book}]` → `array<Book>`; `{parentUuid: Book}` → Book; `{a: 1}` → `object` (existing case kept).
- `a literal applyTo gives the kind of its value`: consumed input `array<number>`.

**GREEN**
- `inputOutputTypeOfValue` per D15. `transformerEditorRootInputType` uses it for both modes.

### Realization

Committed together with slice 2 (the same MiroirTest file and walk). Extra cases: an array of plain objects gives `array<any>`; an object whose `parentUuid` is not a uuid stays `object`. Element payloads reuse the walk's `payloadOf`.

## Slice 2 — `returnValue`, literals, status

**Status:** ⬜

**RED** (walk cases)
- `returnValue` `value: "a"` without `mlSchema` → output `string`; `value: [1, 2]` → `array<number>`.
- `returnValue` with `mlSchema: {type: "string"}`, `value: 3` → failure `value`, status `incompatible`; with `value: "x"` → no failure.
- Literal `applyTo: [1, 2]` under `aggregate` → `literals[0]` = `{ path: ["applyTo"], type: array<number> }`.
- `transformerNodeTypeStatus`: a matching `aggregate` over `array<number>` → `match`; `getFromContext` → `unknown`; a node with a failure → `mismatch`.

**GREEN**
- `nodeOutput` and `walkNode` per D12, D13; `literals` per D16; `transformerNodeTypeStatus`; interface changes; whitelist and export.

### Realization

- `fn.transformer.interfaceWalk`: 61 tests pass; on the base code 17 of them fail (the new and changed cases), so the assertions are live. Extra cases: a `returnValue` feeding an `aggregate` through `applyTo`; a nested contradiction is reported at its own path (`ifThenElse.if`).
- Regressions: `fn.transformer.interfaceCheck` + `fn.transformer.resultSchema` 121/121.
- `TransformerInterfaceMismatch.direction` gained `"value"`; `TransformerInterfaceTreeCompatibility.literals` is required (only the walk builds it).

## Slice 3 — Badges and switch

**Status:** ⬜

**RED** (`ui.transformerEditor` cases)
- Switch off (default): no `transformer-type-badge-*` element.
- Switch on, nested tree with a reference, a constant and a `mapList`: a badge per node with the expected labels and statuses.
- A mismatch node: badge status `mismatch`.

**GREEN**
- `formatInputOutputTypeLabel` exported from a shared module (D18); `TransformerTypeBadge` type; `transformerTypeBadges` drilled next to `mlSchemaTypeAnnotations`; badge chip in `TransformerTitleRowAnnotations`; switch with local state.

## Slice 4 — Switch value (D2)

**Status:** ⬜

**RED**
- Runner test: with a host whose `showTransformerTypes()` returns true, a case rendering the TransformerEditor shows the switch on; toggling it calls `saveShowTransformerTypes(false)`, and the next case starts off.

**GREEN**
- ViewParams attribute `showTransformerTypes` (admin entity, `ViewParams.ts`); `TransformerTypesDisplayContext`; runner wraps each case; sandbox passes the controls (ref + ViewParams save); `useShowTransformerTypes` in the editor.

## Slice 5 — Nonreg, docs, AC

**Status:** ⬜

- Full `npm run nonreg:filesystem -- --runner shared`; nonreg step for the runner test if the manifest needs one; AC check against the issue.

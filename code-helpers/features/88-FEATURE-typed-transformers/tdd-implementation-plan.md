# Issue #88 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise **`resolveTransformerResultSchema`** through MiroirTest **`functionCallTest`**
> (pure schema inference — no transformer runtime evaluation, no mocks).
> Applicative contracts live on each **`TransformerDefinition.transformerResultSchema`**; code
> interprets them. Later slices add **`mlSchemaTransformer`** assets and composition rules.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Issue: https://github.com/miroir-framework/miroir/issues/88  
Design reference: [`docs/proposals/dependent-types-for-transformer-composition.md`](../../../docs/proposals/dependent-types-for-transformer-composition.md) (Proposal B — schema derivation, incremental)  
Working branch: *(current feature branch)*

**Resume note:** Slices 1–12 ✅ (2026-08-24). Issue #88 implementation complete; optional asset tightening remains backlog.

---

## Scope

In scope:

- **`resolveTransformerResultSchema(transformer, context)`** in `miroir-core` — returns the Jzod schema of a transformer's output **without evaluating** it for values.
- **`context`**: `Record<string, JzodElement>` — schemas already resolved for names referenced inside the transformer (`getFromContext.referenceName`, `dataflowObject` step keys, etc.).
- Driving metadata: each built-in transformer's **`transformerInterface.transformerResultSchema`** (`returns: "mlSchema" | "mlSchemaTransformer"`).
- MiroirTest **`functionCallTest`** suite **`transformerResultSchema`** + nonreg step **`unit-transformerResultSchema`**.
- Progressive tightening of **`transformerResultSchema` assets** where definitions currently lie (`{ type: "any" }` on `returnValue`, `pickFromList`, `ifThenElse`, …).

Out of scope (this plan / separate issues):

- **Proposal A** (`jzodTypeVar` / `jzodForAll`) — full parametric polymorphism in Jzod core.
- **UI editor** transformer picker filtering (depends on this API; own slice/issue when composition rules stabilize).
- Replacing **`inputOutput`** enum on definitions (cleanup after structural schemas are trustworthy).
- SQL-side schema inference.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize `transformerResultSchema` on built-ins | ✅ | inventory vitest lock |
| 1 | Tracer: static-output transformers (`currentDate`, `boolExpr`) | ✅ | `transformerResultSchema` MiroirTest |
| 2 | All static `mlSchema` built-ins (no context) | ✅ | suite `staticOutput` expanded |
| 3 | `returnValue` reads instance `mlSchema` | ✅ | functionCallTest |
| 4 | `getFromContext` resolves from `context` | ✅ | functionCallTest |
| 5 | `mlSchemaTransformer` evaluation + `pickFromList` asset | ✅ | asset + functionCallTest |
| 6 | `applyTo`-input dependents (`mapList`, `pickFromList` element) | ✅ | functionCallTest |
| 7 | `dataflowObject` record composition | ✅ | functionCallTest |
| 8 | `ifThenElse` branch union | ✅ | functionCallTest |
| 9 | `createObject` structural output | ✅ | functionCallTest |
| 10 | Remaining core transformers (17) | ✅ | MiroirTest sub-suites + vitest failures |
| 11 | Export, docs, nonreg, AC | ✅ | export + `transformer-result-schema.md` + nonreg |
| 12 | Structured failures (`FailedTransformerInterfaceFromDefinition`) | ✅ | vitest + MiroirTest `failures` sub-suite |

---

## Locked implementation defaults

Decisions from design review (2026-08-24); binding for this plan. Deviations go into the slice's Realization.

| Decision | Choice |
|---|---|
| Function signature | `(transformer: CoreTransformerForBuildPlusRuntime, context: Record<string, JzodElement>, transformerDefinitions?: Record<string, TransformerDefinition>) → JzodElement` |
| Definition lookup | Default registry: `applicationTransformerDefinitions` in `TransformersForRuntime.ts`; optional override for app-specific transformers later |
| Test vehicle | **`functionCallTest`** (not `transformerTest`) — no runtime evaluation |
| Slice 1 static outputs | Ignore `_context` and nested operand transformers; return static `transformerResultSchema.definition` only |
| `mlSchemaTransformer` | Slice 5+: recursively run **`resolveTransformerResultSchema`** on the derivation transformer (schema-level evaluation, still no value evaluation) |
| Errors | Return `FailedTransformerInterfaceFromDefinition` (`status: "error"`, `failureKind`, …); use `isFailedTransformerInterfaceFromDefinition` guard. Message prefix `resolveTransformerResultSchema:` preserved on `error` field (Slice 12+) |
| Module location | `packages/miroir-core/src/2_domain/Transformer_ResultSchema.ts` |
| UUID policy | RFC 4122 **v4 only** for new model elements |
| Nonreg | Dedicated `unit-transformerResultSchema` step **plus** inclusion in `unit-miroir-core` registry sweep |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| MiroirTest entity | `0d3bd258-a8f9-4a0c-8cd9-bcf5607b50ad` |
| MiroirTest suite key | `transformerResultSchema` |
| Vitest loader | `packages/miroir-core/tests/2_domain/transformerResultSchema.test.ts` |
| Nonreg step | `unit-transformerResultSchema` |
| `pickFromList` asset migration (Slice 5) | *allocate v4 uuid if new derivation helper transformer instance is needed* |

Reused definition uuids (reference): `currentDate` `f8987008-3709-4a5b-9c87-beaa65dc0c84`, `boolExpr` `15fc6e49-62cf-4b2a-9a4d-b09df76ed58f`, `pickFromList` `64685ad7-1324-4080-9c41-504fcc1972c9`.

---

## Public interface under test

```typescript
// packages/miroir-core/src/2_domain/Transformer_ResultSchema.ts

export type TransformerResultSchemaContext = Record<string, JzodElement>;

export function resolveTransformerResultSchema(
  transformer: CoreTransformerForBuildPlusRuntime,
  context: TransformerResultSchemaContext,
  transformerDefinitions?: Record<string, TransformerDefinition>,
): JzodElement;
```

**Context key conventions (Slices 4+):**

| Mechanism | Context key |
|---|---|
| `getFromContext.referenceName` | `referenceName` string |
| `dataflowObject.definition` step | each step's object key |
| Nested `applyTo` (future) | `"applyTo"` or caller-provided binding name |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Suite (direct) | `RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema` |
| Suite (MiroirTest CLI) | `npm run testMiroir -w miroir-core -- --suites transformerResultSchema --mode unit` |
| Failure cases (vitest) | `RUN_TEST=Transformer_ResultSchema.failures npm run testByFile -w miroir-core -- Transformer_ResultSchema.failures` |
| Inventory lock | `RUN_TEST=transformerResultSchema.inventory npm run testByFile -w miroir-core -- transformerResultSchema.inventory` |
| Nonreg (targeted) | `npm run nonreg -- --only unit-transformerResultSchema` |
| Deployment validation (when assets change) | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` |
| Schema rebuild (when meta-model assets change) | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` |

---

## Known misalignments (refactor backlog)

Map from codebase audit — each must land in a slice or explicit non-goal:

| Transformer | Declared `transformerResultSchema` | Actual output dependency |
|---|---|---|
| `returnValue` | `{ type: "any" }` | Instance `mlSchema` when present |
| `pickFromList`, `find`, `mapList`, … | `{ type: "any" }` or coarse array | ✅ Slice 10 — operand-aware inference for remaining list/object transformers |
| `getFromContext` | `{ type: "any" }` | ✅ Slice 4 — schema at `referencePath` in `context` |
| `ifThenElse` | `{ type: "any" }` | ✅ Slice 8 — union of `then` / `else` branch schemas |
| `dataflowObject` | `record(any)` | ✅ Slice 7 — record of per-step resolved schemas |
| `createObject` | `record(any)` | ✅ Slice 9 — object with keys from `definition` |
| `pickFromList` | was static `{ type: "any" }` | ✅ Slice 5 — `mlSchemaTransformer` + `accessDynamicPath` derivation |
| 17 core transformers (see Slice 10) | Coarse static `mlSchema` | ✅ Slice 10 |

---

## Slice 0 — Characterize `transformerResultSchema` inventory

**Status:** ✅ DONE

### Realization

- Added `packages/miroir-core/tests/2_domain/transformerResultSchema.inventory.unit.test.ts` with baseline key presence, non-`any` static schema count, inline snapshot of `{ type: "any" }` transformers, and `mlSchemaTransformer` tracking (`pickFromList`). Four tests green (2026-08-24).

---

## Slice 1 — Tracer: static-output transformers

**Status:** ✅ DONE

### Goal

Callers can obtain `{ type: "string" }` for `currentDate` and `{ type: "boolean" }` for `boolExpr` without running transformers.

**Layers cut:** domain helper → MiroirTest asset → FunctionCallTestRegistry whitelist → nonreg step.

### 1.1 RED

**Test:** MiroirTest suite `transformerResultSchema` / sub-suite `staticOutput`

- `currentDate` + `{}` → `{ type: "string" }`
- `boolExpr` (with nested `returnValue` operands) + `{}` → `{ type: "boolean" }`
- Sub-suite `errors`: unknown `transformerType` → throws (message contains `unknown transformerType`)

### 1.2 GREEN

- Implemented `resolveTransformerResultSchema` in `Transformer_ResultSchema.ts`.
- Lookup via `applicationTransformerDefinitions`.
- Reject `mlSchemaTransformer` with explicit throw.
- Whitelisted in `FunctionCallTestRegistry`.
- Registered in `miroirCoreTestSuiteRegistry`.

### 1.3 Refactor checkpoint

- Keep module separate from `Transformer_tools.ts` (codegen vs inference concerns).

### Validation

```bash
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
npm run nonreg -- --only unit-transformerResultSchema
```

### Realization

- Added `Transformer_ResultSchema.ts`, MiroirTest asset `0d3bd258-a8f9-4a0c-8cd9-bcf5607b50ad`, vitest loader, registry wiring, nonreg step `unit-transformerResultSchema`.
- `_context` intentionally unused in slice 1 (static schemas only).
- All three functionCallTests green (2026-08-24).

---

## Slice 2 — All static `mlSchema` built-ins

**Status:** ✅ DONE

### Realization

- Added `generateUuid`, `currentTimestamp`, `numericOp`, `+` cases to `staticOutput` sub-suite. No code changes required — assets already truthful. All 6 static-output tests green (2026-08-24).

---

## Slice 3 — `returnValue` reads instance `mlSchema`

**Status:** ✅ DONE

### Goal

`returnValue` with `mlSchema: { type: "number" }` on the instance resolves to `{ type: "number" }`, not `{ type: "any" }`.

**Layers cut:** domain inference logic; optional asset fix on `returnValue` definition if we document fallback-to-`any` when `mlSchema` absent.

### 3.1 RED

**Test:** suite `returnValue`

- Instance with `mlSchema: { type: "string" }` → `{ type: "string" }`
- Instance without `mlSchema` → `{ type: "any" }` *(matches current asset default)*

### 3.2 GREEN

- In `resolveTransformerResultSchema`, branch on `transformerType === "returnValue"`: prefer `(transformer as any).mlSchema` when present; else fall back to definition's static schema.

### Refactor checkpoint

- Consider updating `returnValue` TransformerDefinition `transformerResultSchema` to `mlSchemaTransformer` in a follow-up asset slice (avoid double source of truth long-term).

### Validation

```bash
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

- `returnValue` branch prefers instance `mlSchema`; falls back to static `{ type: "any" }`. Two functionCallTests green (2026-08-24).

---

## Slice 4 — `getFromContext` from `context`

**Status:** ✅ DONE

### Goal

`getFromContext` with `referenceName: "foo"` returns `context.foo` when present.

**Layers cut:** domain inference; tests prove context threading.

### 4.1 RED

**Test:** suite `getFromContext`

- `{ transformerType: "getFromContext", referenceName: "price", … }` + `context: { price: { type: "number" } }` → `{ type: "number" }`
- Missing key → throws (`context missing reference "price"` or similar)

*(Optional same slice: `referencePath` through nested context object — only if needed by next slices.)*

### 4.2 GREEN

- Resolve `referenceName` / `referencePath` against `context` before falling back to definition static schema.

### Refactor checkpoint

- Share path-walking with `resolvePathOnObject` / existing jzod context utilities if duplication appears.

### Validation

```bash
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
```

### Realization

- `getFromContext` resolves `referenceName` / `referencePath` from context; throws on missing key. Two functionCallTests green (2026-08-24).

---

## Slice 5 — `mlSchemaTransformer` evaluation + `pickFromList` asset

**Status:** ✅ DONE

### Goal

When a definition declares `returns: "mlSchemaTransformer"`, the function runs the **derivation transformer** through `resolveTransformerResultSchema` (schema-level recursion) instead of throwing.

**Layers cut:** applicative asset (`pickFromList` migration) → domain recursion → MiroirTest.

### 5.1 RED

**Test:** suite `mlSchemaTransformer`

- After asset migration: `pickFromList` with `applyTo` bound in context as `{ type: "array", definition: { type: "string" } }` → `{ type: "string" }`
- Until migration: RED test expects throw `mlSchemaTransformer not supported yet` *(currently green for throw — flip when asset lands)*

### 5.2 GREEN

1. **Asset:** change `pickFromList` `transformerResultSchema` to:

   ```json
   {
     "returns": "mlSchemaTransformer",
     "definition": {
       "transformerType": "…",
       "interpolation": "runtime",
       "…": "derivation that unwraps one array level from applyTo input schema"
     }
   }
   ```

   Implement derivation using existing MLS transformers (`unfoldSchemaOnce`, `resolveSchemaReferenceInContext`, or a small dedicated composite) — exact transformer graph decided at RED time against real schemas.

2. **Code:** on `mlSchemaTransformer`, build derivation context (include `applyTo` input schema from resolved nested transformer or context), call `resolveTransformerResultSchema(definition, derivationContext)`.

3. Rebuild: `npm run build -w miroir-test-app_deployment-miroir` (+ `devBuild` if meta-model touched).

### Refactor checkpoint

- Guard against infinite recursion (cycle detection on derivation chain).
- Single entry point for schema-level vs value-level transformer evaluation must remain distinct.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
```

### Realization

- Migrated `pickFromList` `transformerResultSchema` to `mlSchemaTransformer` with `accessDynamicPath` derivation (`getFromContext applyTo` → `"definition"`). Implemented `mlSchemaTransformer` recursion, `accessDynamicPath`, and `applyTo` binding in derivation context. One functionCallTest green (2026-08-24).

---

## Slice 6 — `applyTo` dependents (`mapList`, list element typing)

**Status:** ✅ DONE

### Goal

`mapList` with element transformer `T` and `applyTo` list schema `array(X)` yields `array(Y)` where `Y = resolveTransformerResultSchema(T, …)`.

**Layers cut:** assets (optional `mlSchemaTransformer` on `mapList`) + domain composition rules + tests.

### 6.1 RED

**Test:** suite `mapList`

- `applyTo` context / nested transformer resolves to `array(string)`; element transformer `returnValue` with `mlSchema: { type: "number" }` → output `{ type: "array", definition: { type: "number" } }`

### 6.2 GREEN

- Resolve nested `elementTransformer` and `applyTo` schemas; compose per Proposal B catalog row `mapList: array(X) → array(Y)`.

### Validation

```bash
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
```

### Realization

- `mapList` composes `{ type: "array", definition: elementSchema }` from resolved `elementTransformer`. One functionCallTest green (2026-08-24).

---

## Slice 7 — `dataflowObject` record composition

**Status:** ✅ DONE

### Goal

`dataflowObject` output schema is an object whose keys match `definition` keys and whose attribute schemas are the resolved result schemas of each step (using step names as `context` entries for downstream steps).

**Layers cut:** domain walk of `definition` in dependency order; tests mirror runtime dataflow naming.

### 7.1 RED

**Test:** suite `dataflowObject`

- Two-step object: `date: currentDate`, `len: stringOp length on getFromContext "date"` → `{ type: "object", definition: { date: { type: "string" }, len: { type: "number" } } }` *(adjust to match actual `stringOp` result schema)*

### 7.2 GREEN

- Topological walk: for each key in `definition`, resolve nested transformer with context = previously resolved step schemas.

### Validation

```bash
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
```

### Realization

- `dataflowObject` walks `definition` in key order, threading each step schema into context for downstream steps. **Deviation:** `stringOp` `length` uses static `{ type: "string" }` result schema (not number). One functionCallTest green (2026-08-24).

---

## Slice 8 — `ifThenElse` branch union

**Status:** ✅ DONE

### Goal

Output schema is a **union** (or least upper bound) of `then` and `else` branch schemas when both present; defaults `boolean` when branches omitted (matches runtime defaults).

### 8.1 RED

**Test:** suite `ifThenElse`

- `then` → `{ type: "string" }`, `else` → `{ type: "number" }` → union schema
- Only `then` provided → `then` schema

### 8.2 GREEN

- Resolve branch transformers; compose with `jzod` union helper or `{ type: "union", definition: [...] }`.

### Validation

```bash
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
```

### Realization

- Both branches present → union; only `then` → `then` schema; neither → `{ type: "boolean" }`. Two functionCallTests green (2026-08-24).

---

## Slice 9 — `createObject` structural output

**Status:** ✅ DONE

### Goal

Output object schema has fixed keys from `definition`; each value schema from resolving the nested transformer at that key.

### 9.1 RED

**Test:** suite `createObject`

- `definition: { a: returnValue string, b: returnValue number }` → object schema with typed attributes

### 9.2 GREEN

- Mirror `dataflowObject` key walk without sequential context threading (unless keys reference each other — defer cross-key refs).

### Validation

```bash
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
```

### Realization

- `createObject` builds `{ type: "object", definition: { key: resolvedSchema } }` without cross-key context threading. One functionCallTest green (2026-08-24).

---

## Slice 10 — Remaining core transformers (catalog completion)

**Status:** ✅ DONE

### Goal

Every compositional transformer in `miroirCoreTransformers` that still **falls through** to a coarse static `transformerResultSchema.definition` gets operand-aware inference in `resolveTransformerResultSchema`, with **≥1 success** and **≥2 failure** tests per compositional transformer (MiroirTest + vitest, same pattern as Slice 12).

**Out of scope for this slice:** admin / MLS / meta transformers (`getActiveDeployment`, `resolveConditionalSchema`, …), `dataflowSequence` (structural container only), and static-only built-ins (`+`, `generateUuid`, `currentDate`, `currentTimestamp`) — already covered by Slice 2.

**Layers cut:** domain resolver branches → MiroirTest `functionCallTest` sub-suites → vitest failure inventory → optional `transformerResultSchema` asset tightening where static `{ type: "any" }` can be replaced by truthful coarse schema or `mlSchemaTransformer`.

### Catalog gap (baseline — Slice 0 inventory, 2026-08-24)

| Transformer | Current declared result | Target inference rule |
|---|---|---|
| `filterList` | `array(any)` | `array(X) → array(X)`; `predicate` must resolve to `boolean` |
| `sortList` | `array(any)` | `array(X) → array(X)` |
| `concatLists` | `array(any)` | `array(X) + array(Y) → array(union(X,Y))` when both operands typed; else `array(any)` |
| `listLength` | `number` | `array(?) → number`; `applyTo` must be `array` |
| `find` | `any` | `array(X) → X` (element schema of `applyTo`); `predicate` boolean |
| `getObjectEntries` | `array(any)` | `object/record → array(tuple(string, attrSchema))` per Proposal B |
| `getObjectValues` | `array(any)` | `object/record → array(attrSchemaUnion)` |
| `getUniqueValues` | `array(any)` | `array(object) → array(scalarTypeOfAttribute)` — defer precise attribute typing to static `array(any)` if attribute path unknown |
| `indexListBy` | `record(any)` | `array(object) → record(objectElementSchema)` |
| `listReducerToSpreadObject` | `record(any)` | `array(object) → record(objectElementSchema)` |
| `object_fromEntries` | `record(any)` | `array(tuple) → record(valueSchemaUnion)` — start with `record(any)` keyed inference when entries typed |
| `mergeIntoObject` | `record(any)` | base `applyTo` object schema merged with keys from nested `definition` transformer |
| `createObjectFromPairs` | `record(any)` | like `createObject` over pair `definition` entries + `applyTo` list context |
| `case` | `any` | union of all `then` branch schemas + optional `else` (mirror Slice 8 `ifThenElse`) |
| `mustacheStringTemplate` | `string` | static `{ type: "string" }` — validate referenced context keys exist when inferrable |
| `constantAsExtractor` | `any` | prefer instance `valueJzodSchema` when present; else static `any` |
| `aggregate` | `array(object{aggregate:number})` | validate `applyTo` is `array`; refine group row schema by `function` when feasible (`count/sum/…`) — minimum: array shape check |

### 10.0 Characterize gap (RED lock)

**Test:** extend `transformerResultSchema.inventory.unit.test.ts`

- Add inline snapshot `coreTransformersWithoutCustomResolver` listing the 17 keys above (sorted).
- After each sub-cycle below, shrink the snapshot as transformers move to `handled`.

### 10.1 RED → GREEN — list-preserving

**MiroirTest sub-suite `listPreserving`** (new section in asset `0d3bd258-…`):

| Test | Transformer | Input context / instance | Expected schema |
|---|---|---|---|
| filter preserves element type | `filterList` | `applyTo` via context: `{ type: "array", definition: { type: "string" } }` | `{ type: "array", definition: { type: "string" } }` |
| sort preserves element type | `sortList` | same | same |
| concat homogeneous lists | `concatLists` | two `getFromContext` refs both `array(number)` in context | `{ type: "array", definition: { type: "number" } }` |
| listLength static number | `listLength` | `applyTo` `array(string)` | `{ type: "number" }` |

**Vitest failures** (`Transformer_ResultSchema.failures.unit.test.ts`), ≥2 each:

- `filterList`: `applyTo` not array; `predicate` resolves to non-boolean
- `sortList`: `applyTo` not array
- `concatLists`: operand not array
- `listLength`: `applyTo` not array

**GREEN:** shared helper `resolveApplyToArrayElementSchema(...)` (reuse `validateApplyToSchemaShape` + unwrap `definition`); add `switch` cases; propagate failures with `transformerPath`.

### 10.2 RED → GREEN — list element projection

**MiroirTest sub-suite `listProjection`:**

| Test | Expected |
|---|---|
| `find` on `array({ type: "object", definition: { id: number, name: string } })` | element object schema (not `any`) |
| `getUniqueValues` on array of objects + `attribute: "code"` | `{ type: "array", definition: { type: "any" } }` until attribute schema walk lands — document in Realization |

**Vitest failures:** `find` applyTo not array; predicate non-boolean. `getUniqueValues` applyTo not array.

**GREEN:** `find` returns `applyToSchema.definition` when root is `array`; predicate boolean validation mirrors `filterList`.

### 10.3 RED → GREEN — object ↔ array

**MiroirTest sub-suite `objectArray`:**

| Test | Expected |
|---|---|
| `getObjectValues` on `{ type: "object", definition: { a: string, b: number } }` | `{ type: "array", definition: { type: "union", definition: [string, number] } }` or ordered union per implementation choice — lock in test |
| `getObjectEntries` on same object | `{ type: "array", definition: { type: "tuple", … } }` or pragmatic `{ type: "array", definition: { type: "any" } }` if tuple not in Jzod subset — **decide at RED**, document deviation |

**Vitest failures:** applyTo not object/record (×2 each).

**GREEN:** resolve `applyTo` schema; require root `object` or `record`; derive value/entry schemas from `definition` map.

### 10.4 RED → GREEN — list → record

**MiroirTest sub-suite `listToRecord`:**

| Test | Expected |
|---|---|
| `indexListBy` on `array(object{…})` | `{ type: "record", definition: objectElementSchema }` |
| `listReducerToSpreadObject` on same | same |
| `object_fromEntries` on `array` of `[string, value]` pairs | `{ type: "record", definition: valueUnion }` — minimum `{ type: "record", definition: { type: "any" } }` if pair typing deferred |

**Vitest failures:** applyTo not array (×2 each).

### 10.5 RED → GREEN — record merge / pairs

**MiroirTest sub-suite `recordMerge`:**

| Test | Expected |
|---|---|
| `mergeIntoObject` base object `{ x: number }` + definition adding `{ y: string }` | merged object schema with both keys |
| `createObjectFromPairs` with pair definition mirroring Slice 9 `createObject` | object schema from resolved pair attribute transformers |

**Vitest failures:** applyTo not object when required; nested definition resolution failure propagation.

**GREEN:** walk nested transformers; for `mergeIntoObject`, spread base `applyTo` definition with overlay keys (same semantics as runtime shallow merge at schema level).

### 10.6 RED → GREEN — branch union (`case`)

**MiroirTest sub-suite `case`:**

| Test | Expected |
|---|---|
| two `then` branches `string` / `number`, no `else` | union schema |
| with `else` boolean | union of three |

**Vitest failures:** (none required if no operand shape constraints beyond nested resolution — optional: empty `whens` array returns static `any`)

**GREEN:** mirror Slice 8 `ifThenElse` union builder over `whens[i].then` + `else`.

### 10.7 RED → GREEN — instance schema readers

**MiroirTest sub-suite `instanceSchema`:**

| Test | Expected |
|---|---|
| `constantAsExtractor` with `valueJzodSchema: { type: "boolean" }` | `{ type: "boolean" }` |
| `mustacheStringTemplate` | `{ type: "string" }` regardless of template holes |

**Vitest failures:** `constantAsExtractor` without `valueJzodSchema` → static `any` (success path, not failure). Optional: missing context key for mustache ref when testable without runtime.

### 10.8 RED → GREEN — `aggregate`

**MiroirTest sub-suite `aggregate`:**

| Test | Expected |
|---|---|
| `aggregate` + `function: "count"` + `applyTo` `array(object)` | declared static group schema `{ type: "array", definition: { type: "object", definition: { aggregate: number } } }` |
| `applyTo` not array | structured failure |

**Non-goal (document in Realization):** full `groupBy` / `attributeObject` row-shape inference — defer to follow-up issue if RED reveals combinatorial explosion.

### Refactor checkpoint

- Extract shared **`resolveApplyToSchema`** / **`unwrapArrayElementSchema`** helpers used by `mapList`, `pickFromList`, `filterList`, `find`, `sortList`, `listLength`, `concatLists`, `getUniqueValues`, `indexListBy`, …
- Consider migrating `filterList` / `find` assets to `mlSchemaTransformer` (like `pickFromList`) only if resolver logic duplicates derivation transformers — prefer code-first in this slice, asset migration optional.
- Update inventory inline snapshot; shrink `mlSchemaAnyNames` list.
- Extend MiroirTest asset `description` to `#88 slices 1–10`.

### Validation

```bash
RUN_TEST=transformerResultSchema.inventory npm run testByFile -w miroir-core -- transformerResultSchema.inventory
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
RUN_TEST=Transformer_ResultSchema.failures npm run testByFile -w miroir-core -- Transformer_ResultSchema.failures
npm run testMiroir -w miroir-core -- --suites transformerResultSchema --mode unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run nonreg -- --only unit-transformerResultSchema
```

### Realization

- Added shared helpers (`resolveApplyToArrayElementSchema`, `resolveApplyToObjectSchema`, `buildUnionSchema`, `mergeObjectSchemas`, …) and `switch` branches for all 17 remaining core transformers.
- MiroirTest sub-suites: `listPreserving`, `listProjection`, `objectArray`, `listToRecord`, `recordMerge`, `case`, `instanceSchema`, `aggregate` — 15 new functionCallTests (37 total in suite).
- Vitest failures extended for `filterList`, `sortList`, `listLength`, `find`, `concatLists`, `getObjectValues`, `aggregate` — 41 failure tests total.
- Inventory test locks full core catalog as handled. All green (2026-08-24).

---

## Slice 11 — Export, docs, nonreg, AC

**Status:** ✅ DONE

### 11.1 Export

- Export `resolveTransformerResultSchema` and `TransformerResultSchemaContext` from `packages/miroir-core/src/index.ts` when editor/MCP consumers need it.

### 11.2 Docs

- Short reference blurb in `docs/reference/testing.md` (suite key) and/or new `docs/reference/transformer-result-schema.md` describing `context` conventions and slice coverage (Slices 1–10 catalog table).
- Link from `docs/proposals/dependent-types-for-transformer-composition.md` to this plan.

### 11.3 Nonreg

- ✅ `unit-transformerResultSchema` already in `scripts/nonreg-manifest.json`.
- Confirm full `npm run nonreg:unit` green after all slices.

### 11.4 Tracer bullet (narrative)

1. Open MiroirTest UI → run **`transformerResultSchema`** suite (unit).
2. Add a `dataflowObject` in the transformer editor (future): each step's inferred output type constrains the next step's picker.

Automated equivalent: full `transformerResultSchema` MiroirTest suite + `unit-transformerResultSchema` nonreg step.

### AC checklist (#88)

| Criterion | Proven by | Status |
|---|---|---|
| Transformers have inferable output ML schemas without runtime evaluation | `resolveTransformerResultSchema` + MiroirTest | ✅ Slice 10 (full core catalog) |
| Static built-ins (`currentDate`, `boolExpr`, …) return correct Jzod | suite `staticOutput` | ✅ |
| Context-aware resolution for composition | slices 4–10 | ✅ |
| `transformerResultSchema` on definitions is source of truth | asset migrations slice 5+ | ⬜ optional asset tightening (non-blocking) |
| Operand validation failures are structured, not throws | Slice 12 + Slice 10 failures | ✅ |
| Nonreg coverage | `unit-transformerResultSchema` | ✅ |

### Validation

```bash
npm run nonreg -- --only unit-transformerResultSchema
npm run nonreg:unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

- Exported `resolveTransformerResultSchema`, `TransformerResultSchemaContext`, failure types, and `isFailedTransformerInterfaceFromDefinition` from `packages/miroir-core/src/index.ts`.
- Added [`docs/reference/transformer-result-schema.md`](../../../docs/reference/transformer-result-schema.md) (API, context conventions, catalog coverage, failure kinds, test commands).
- Updated [`docs/reference/testing.md`](../../../docs/reference/testing.md) suite registry (36 suites, `transformerResultSchema` blurb).
- Linked proposal doc to reference + TDD plan.
- Nonreg step `unit-transformerResultSchema` title updated; step green (2026-08-24).

---

## Slice 12 — Structured failures (`FailedTransformerInterfaceFromDefinition`)

**Status:** ✅ DONE

### Goal

Return structured failures instead of throws from `resolveTransformerResultSchema`; propagate operand shape mismatches with `failureKind`, `typePath`, `transformerPath`, and `innerError`.

### Realization

- Added `FailedTransformerInterfaceFromDefinition` type and `isFailedTransformerInterfaceFromDefinition` guard in `TransformerResultSchemaInterface.ts`.
- Operand validation for `boolExpr`, `ifThenElse`, `numericOp`, `pickFromList`, `mapList`, `stringOp`, nested `dataflowObject` / `createObject` propagation.
- `packages/miroir-core/tests/2_domain/Transformer_ResultSchema.failures.unit.test.ts` — 27 tests initially; extended to 41 in Slice 10.
- MiroirTest `failures` sub-suite — 6 cases. All green (2026-08-24).

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

**Resume note:** Slice 1 ✅ (2026-08-24). Slices 2–N pending.

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
| 0 | Characterize `transformerResultSchema` on built-ins | ⬜ | inventory `functionCallTest` or vitest lock |
| 1 | Tracer: static-output transformers (`currentDate`, `boolExpr`) | ✅ | `transformerResultSchema` MiroirTest |
| 2 | All static `mlSchema` built-ins (no context) | ⬜ | suite `staticOutput` expanded |
| 3 | `returnValue` reads instance `mlSchema` | ⬜ | functionCallTest |
| 4 | `getFromContext` resolves from `context` | ⬜ | functionCallTest |
| 5 | `mlSchemaTransformer` evaluation + `pickFromList` asset | ⬜ | asset + functionCallTest |
| 6 | `applyTo`-input dependents (`mapList`, `pickFromList` element) | ⬜ | functionCallTest |
| 7 | `dataflowObject` record composition | ⬜ | functionCallTest |
| 8 | `ifThenElse` branch union | ⬜ | functionCallTest |
| 9 | `createObject` structural output | ⬜ | functionCallTest |
| 10 | Export, docs, nonreg, AC | ⬜ | `miroir-core` export + docs + AC table |

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
| Errors | Throw `Error` with message prefix `resolveTransformerResultSchema:` (design-time helper, not `TransformerFailure`) |
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
| `pickFromList`, `find`, `mapList`, … | `{ type: "any" }` or coarse array | Element type of `applyTo` input |
| `getFromContext` | `{ type: "any" }` | Schema at `referencePath` in `context` |
| `ifThenElse` | `{ type: "any" }` | Union of `then` / `else` branch schemas |
| `dataflowObject` | `record(any)` | Record of per-step resolved schemas |
| `createObject` | `record(any)` | Object with keys from `definition`, values from nested transformers |
| All built-ins | No deployment uses `returns: "mlSchemaTransformer"` yet | Meta-model supports it; Proposal B expects derivation transformers |

---

## Slice 0 — Characterize `transformerResultSchema` inventory

**Status:** ⬜ pending

### Goal

Lock a baseline inventory of built-in transformers: which already declare truthful static schemas vs `{ type: "any" }`, so asset-tightening slices have a diff target.

### 0.1 RED → GREEN

**Test:** vitest `packages/miroir-core/tests/2_domain/transformerResultSchema.inventory.unit.test.ts` *(justified: one-shot structural audit, not ML-reachable)*

Behavior asserted:

- `applicationTransformerDefinitions` contains `currentDate`, `boolExpr`, `returnValue`, `pickFromList`.
- Count of definitions with `transformerResultSchema.returns === "mlSchema"` and `definition.type !== "any"` is ≥ 2 (locks that static schemas exist and the inventory helper works).
- Count with `definition.type === "any"` is documented via snapshot or explicit minimum (captures misalignment scale).

### Refactor checkpoint

- None (characterization only).

### Validation

```bash
RUN_TEST=transformerResultSchema.inventory npm run testByFile -w miroir-core -- transformerResultSchema.inventory
```

### Realization

*(pending)*

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

**Status:** ⬜ pending

### Goal

Every built-in whose output type does **not** depend on inputs or context returns its declared static schema.

**Layers cut:** MiroirTest cases only (definitions already correct in assets).

### 2.1 RED

**Test:** expand suite `staticOutput` with one `functionCallTest` per transformer:

| Transformer | Expected schema (from asset) |
|---|---|
| `generateUuid` | `{ type: "uuid" }` |
| `currentTimestamp` | `{ type: "string" }` *(or documented ISO timestamp shape)* |
| `numericOp` | `{ type: "number" }` |
| `+` (`plus`) | union `number \| string \| bigint` |
| `boolExpr` | *(already covered)* |
| `currentDate` | *(already covered)* |

Add cases incrementally RED → GREEN in one slice (grouped helper expansion per skill §4).

### 2.2 GREEN

- No code change expected if assets are already truthful — tests prove it.
- If any asset `transformerResultSchema` is wrong, fix the **asset** first, then rebuild deployment.

### Refactor checkpoint

- Extract shared `functionCallTest` JSON pattern into sub-suite per transformer family if the suite grows large.

### Validation

```bash
RUN_TEST=transformerResultSchema.test npm run testByFile -w miroir-core -- transformerResultSchema
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
```

### Realization

*(pending)*

---

## Slice 3 — `returnValue` reads instance `mlSchema`

**Status:** ⬜ pending

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

*(pending)*

---

## Slice 4 — `getFromContext` from `context`

**Status:** ⬜ pending

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

*(pending)*

---

## Slice 5 — `mlSchemaTransformer` evaluation + `pickFromList` asset

**Status:** ⬜ pending

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

*(pending)*

---

## Slice 6 — `applyTo` dependents (`mapList`, list element typing)

**Status:** ⬜ pending

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

*(pending)*

---

## Slice 7 — `dataflowObject` record composition

**Status:** ⬜ pending

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

*(pending)*

---

## Slice 8 — `ifThenElse` branch union

**Status:** ⬜ pending

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

*(pending)*

---

## Slice 9 — `createObject` structural output

**Status:** ⬜ pending

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

*(pending)*

---

## Slice 10 — Export, docs, nonreg, AC

**Status:** ⬜ pending *(nonreg step partially done in Slice 1)*

### 10.1 Export

- Export `resolveTransformerResultSchema` and `TransformerResultSchemaContext` from `packages/miroir-core/src/index.ts` when editor/MCP consumers need it.

### 10.2 Docs

- Short reference blurb in `docs/reference/testing.md` (suite key) and/or new `docs/reference/transformer-result-schema.md` describing `context` conventions and slice coverage.
- Link from `docs/proposals/dependent-types-for-transformer-composition.md` to this plan.

### 10.3 Nonreg

- ✅ `unit-transformerResultSchema` already in `scripts/nonreg-manifest.json`.
- Confirm full `npm run nonreg:unit` green after all slices.

### 10.4 Tracer bullet (narrative)

1. Open MiroirTest UI → run **`transformerResultSchema`** suite (unit).
2. Add a `dataflowObject` in the transformer editor (future): each step's inferred output type constrains the next step's picker.

Automated equivalent: full `transformerResultSchema` MiroirTest suite + `unit-transformerResultSchema` nonreg step.

### AC checklist (#88)

| Criterion | Proven by | Status |
|---|---|---|
| Transformers have inferable output ML schemas without runtime evaluation | `resolveTransformerResultSchema` + MiroirTest | ✅ slice 1; ⬜ full catalog |
| Static built-ins (`currentDate`, `boolExpr`, …) return correct Jzod | suite `staticOutput` | ✅ partial |
| Context-aware resolution for composition | slices 4–9 | ⬜ |
| `transformerResultSchema` on definitions is source of truth | asset migrations slice 5+ | ⬜ |
| Nonreg coverage | `unit-transformerResultSchema` | ✅ |

### Validation

```bash
npm run nonreg -- --only unit-transformerResultSchema
npm run nonreg:unit
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

*(pending)*

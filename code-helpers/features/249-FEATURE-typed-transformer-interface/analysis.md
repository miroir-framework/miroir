# 249 — Typed transformer interface: entity-uuid `inputOutput` types + adequacy check in the list transformer panel

> Analysis: extend `TransformerDefinition.transformerInterface.inputOutput` with entity-uuid types and
> object/array payload types, then consume it in the #246 list transformer panel to border the
> transformer editor orange when the seized transformer is inadequate for the given input/output types.

Related issue: https://github.com/miroir-framework/miroir/issues/249
Follow-up of: #246 ✅ (list transformer panel) · Related: #88 ✅ (typed transformers / `resolveTransformerResultSchema`), #99 (Transformer Editor, simplified `inputOutput` descriptions)
Related analyses: [`../246-FEATURE-list-display-by-transformer/analysis.md`](../246-FEATURE-list-display-by-transformer/analysis.md)

Key sources:
- [`packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a557419d-a288-4fb8-8a1e-971c86c113b8.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a557419d-a288-4fb8-8a1e-971c86c113b8.json) (TransformerDefinition entity, `inputOutput` schema source of truth)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ListTransformerPanel.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ListTransformerPanel.tsx)
- [`packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.tsx)
- [`packages/miroir-core/src/2_domain/Transformer_ResultSchema.ts`](../../../packages/miroir-core/src/2_domain/Transformer_ResultSchema.ts)

**Document role:** analysis and architectural decision record.
**Status:** decisions confirmed with the user (2026-08-27). TDD plan to be written per the `miroir-analysis-to-tdd-plan` skill.

---

## Decision record

| Decision | Choice |
|---|---|
| D1 — Representation of entity-uuid types | **String union `enum[8] | uuid`** — literal → primitive type, otherwise entity uuid; no structured restructure |
| D2 — object/array payload | **Object-form union member** `{type:"object"\|"array", payload?}`; payload ∈ {any,bigint,number,string,boolean} + entity uuid; absent = `any`; no nesting |
| D3 — Entity-uuid semantics | **"Is an instance of"** the entity — uuid *references* stay `string` |
| D4 — Compatibility relation | **Lenient-`any` + entity ⊂ object subtyping, sound output direction** — declared `object` output does not satisfy an entity-uuid expectation |
| D5 — Check scope | **Outermost transformerType's definition only**; absent `inputOutput` = `any/any`, never flagged |
| D6 — Panel UX | **Fixed input = row entity uuid; user-chosen output (default = input); non-blocking `#ff9800` border on the editor field; panel-local state** |

**Rationale:** backward compatibility drives D1/D2 — all 45 stock instances stay valid (only the already-invalid `metaModel` needs fixing). D3 keeps the type honest: the list panel's rows *are* entity instances, which is the case that matters. D4's leniency on `any` avoids flagging the majority of stock transformers (`any/any`) while still catching real mismatches; the sound output direction makes "this transformer does not guarantee you get a User back" visible. D5 keeps the check static and cheap — no inference machinery. D6 matches #246's ephemeral-panel philosophy (D3 there) and treats inadequacy as a warning, not an error.

### D1 — Representation of entity-uuid types

**Status:** Accepted — string union (D1-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. String union** ★ | Jzod `union[enum[8 literals], {type:"uuid"}]` → zod `z.union([z.enum([...]), z.string().uuid()])`; semantics by value: literal → primitive, else entity uuid | All existing instances stay valid; matches the issue wording ("a uuid (string) not in the enum"); union precedents generate cleanly (`entityAttributeType`, `reportUuid`, §3.1) | Generated TS type collapses to `string` (loses literal autocomplete); malformed strings caught only by uuid validation |
| D1-b. Structured object | `{kind:"primitive",type:…} | {kind:"entity",entityUuid:…} | …` | Explicit, self-documenting | Breaks all 45 existing instances; verbose JSON; migration for zero behavioral gain |

**Decision:** D1-a.

### D2 — object/array payload representation

**Status:** Accepted — object-form union member (D2-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D2-a. Object-form union member** ★ | The type value becomes `union[enum[8], uuid, {type: enum["object","array"], payload?: union[enum[any,bigint,number,string,boolean], uuid]}]`; bare `"object"`/`"array"` stay valid; absent payload = `any` | Backward compatible; no invalid combos (`payload` only exists on object/array forms) | Two syntactic forms for bare `object`/`array` |
| D2-b. Sibling fields | `inputOutput` gains `inputPayload?`/`outputPayload?` next to `input`/`output` | Flat JSON | Permits nonsense combos (`input:"string"` + `inputPayload`); weaker schema validation |

Payload value space: `any|bigint|number|string|boolean` **plus entity uuid** (the issue's list extended by user confirmation — "array of Book" is the motivating case). **No nesting**: payloads cannot be `object`/`array` (no "array of array of string").

**Decision:** D2-a. Nesting rejected to keep the space flat; may be revisited if a real case appears (unscheduled).

### D3 — Entity-uuid semantics

**Status:** Accepted — instance semantics (D3-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Instance semantics** ★ | uuid X = "is an instance of entity X" | Matches the panel use case (rows *are* instances) and the issue's example; honest typing | Cannot express "uuid referencing X" — no current need |
| D3-b. Reference-inclusive | uuid X also covers bare uuid references; `getActiveDeployment` would become `SelfApplication-uuid → Deployment-uuid` | More expressive for FK-style contracts | Conflates instance and reference; weakens the adequacy check |

**Decision:** D3-a. `getActiveDeployment` stays `string → string`.

### D4 — Compatibility relation

**Status:** Accepted — lenient-`any` + subtyping, sound output direction (D4-a).

Rules: input check = declared input must *accept* the given type; output check = declared output must be *assignable to* the expected type. `any` is compatible with everything in both directions. Identical literals match. An entity uuid matches only itself, **but** entity uuid ⊂ `object`: a declared `object` input accepts an entity instance; a declared entity-uuid output satisfies an `object` expectation; a declared `object` output does **not** satisfy an entity-uuid expectation (→ orange). Absent payload = `any` payload, compatible with any expected payload; otherwise payloads must match exactly. `undefined` matches only `undefined`.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Lenient-`any`, sound subtyping** ★ | Rules above | `any/any` stock transformers never flagged (no noise); real mismatches caught (e.g. `mustacheStringTemplate` string→string on User rows); "object output ≠ User" is the intended signal, escapable via the output chooser | Object-output transformers (`createObject`, `mergeIntoObject`, …) show orange against the default entity-uuid expected output until the user relaxes it to `object`/`any` — accepted as informative |
| D4-b. Strict exact-match, no `any` leniency | Only identical types match | Simplest relation | Most stock transformers (`any/any`) flagged immediately — pure noise |
| D4-c. Fully lenient both ways | `object` satisfies entity-uuid expectations too | Least friction | Unsound; misses the exact mismatch the feature exists to show |

**Decision:** D4-a.

### D5 — Check scope

**Status:** Accepted — outermost only (D5-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D5-a. Outermost transformerType** ★ | Look up the seized transformer's outermost `transformerType` in `applicationTransformerDefinitions`, match its `inputOutput` against the given types; absent `inputOutput` or anonymous body → `any/any` (never flagged) | Static, cheap, no inference; exactly "the `inputOutput` of the transformer's definition" | Nested mismatches (e.g. inside a `mapList` elementTransformer) not checked |
| D5-b. Recursive checking | Walk the seized transformer tree, infer intermediate types via `resolveTransformerResultSchema` | Precise | Costly, complex; overlaps #88 machinery; overkill for a warning affordance |

**Decision:** D5-a. D5-b deferred (unscheduled).

### D6 — Panel UX

**Status:** Accepted — D6-a.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D6-a. Warning + chooser** ★ | Input type fixed = row entity uuid (`objectListReportSection.definition.parentUuid` / `currentReportTargetEntity.uuid`, fallback `"any"`); expected output = `<select>` (8 literals + deployment entities as name→uuid; payload sub-select on `object`/`array`), default = input, panel-local `useState`; inadequacy → `#ff9800` border on the transformer editor field frame (mirroring the `displayError` prop pattern), transformer still runs | Non-destructive; consistent with #246 D3 (ephemeral panel state); orange = warning vs red = error convention already present | Chosen output lost on unmount (accepted) |
| D6-b. Blocking | Disable execution while inadequate | Hard guarantee | The result may still be inspectable; warning suffices for an exploration tool |
| D6-c. Persisted expected output | Store choice in the report definition | Survives sessions | Meta-model change + migration; belongs with #246's deferred persisted-panel follow-up |

**Decision:** D6-a. D6-b rejected. D6-c deferred (converges with the `transformerRunnerReportSection` stub, see #246 §3.4).

---

## 1. Goals

1. **Explicit transformer contracts** — In order to know what a transformer accepts and produces without reading its handler code, as a transformer author, I can declare entity-uuid and payload-typed input/output types on its TransformerDefinition.
2. **Immediate adequacy feedback** — In order to avoid running ill-fitting transformers on list rows, as a report viewer, I can see the transformer editor bordered orange when the seized transformer does not match the list's row type or my chosen expected output type.
3. **Trustworthy stock metadata** — In order to rely on declared transformer interfaces, as an application maintainer, I can have every stock TransformerDefinition validate against the enhanced schema, with precise entity-uuid types where a transformer operates on entity instances.

## 2. Non-goals

- Recursive / nested transformer checking (rejected D5-b; later, unscheduled).
- Blocking transformer execution on inadequacy (rejected D6-b).
- Persisting the chosen expected output type (deferred D6-c; converges with #246's persisted-panel follow-up and the `transformerRunnerReportSection` stub).
- Driving the result display schema from the chosen output type — the result viewer keeps #88's `resolveTransformerResultSchema` + `{type:"any"}` fallback.
- Applying the adequacy check to the standalone Transformer Builder page (`TransformerEditor.tsx`) — list panel only (later, unscheduled).
- SQL / Postgres-side typing — `inputOutput` remains runtime-agnostic metadata.

---

## 3. Current state

### 3.1 The `inputOutput` schema (**misaligned — dead metadata**)

`TransformerDefinition` entity (uuid `a557419d-a288-4fb8-8a1e-971c86c113b8`), `mlSchema.definition.transformerInterface.definition.inputOutput` — optional, declared via a local `schemaReference` context ([entity JSON](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a557419d-a288-4fb8-8a1e-971c86c113b8.json), lines ~96-137):

```json
"inputOutput": {
  "type": "schemaReference",
  "optional": true,
  "context": {
    "inputOutputType": { "type": "enum", "definition": ["any","undefined","bigint","number","string","boolean","object","array"] },
    "inputOutputObject": {
      "type": "object",
      "definition": {
        "input":  { "type": "schemaReference", "definition": { "relativePath": "inputOutputType" } },
        "output": { "type": "schemaReference", "definition": { "relativePath": "inputOutputType" } }
      }
    }
  },
  "definition": { "relativePath": "inputOutputObject" }
}
```

The same block is mirrored in the TransformerDefinition EntityVersion snapshot ([`miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_modelVersion/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json), lines ~98-136 — the only modelVersion snapshot containing it).

Generated artefacts (via `npm run devBuild -w miroir-core` → `scripts/generate-ts-types.ts` using `@miroir-framework/jzod-ts`):

- [`miroirFundamentalType.ts:2342-2346`](../../../packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts) — `InputOutputType` / `InputOutputObject` TS types; zod schemas at lines 9859-9861; consumed by `TransformerDefinition` at line 2359.
- [`miroirFundamentalJzodSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema.ts) — same block at lines 5512-5541 (top-level context) and 5619-5657 (inside `transformerDefinition`).
- [`getMiroirFundamentalJzodSchema.ts:981-982`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts) spreads `...inputOutput.context` into the fundamental schema context — a generic spread, untouched as long as context keys are kept.

**No runtime consumer exists**: a repo-wide search for `inputOutput` / `InputOutputType` / `InputOutputObject` outside `assets/` and `preprocessor-generated/` finds only the bootstrap spread above. The field is metadata nothing reads.

Union-type precedents that generate cleanly (for D1-a):

- `entityAttributeType` — union of enum + object reference, hand-written in `getMiroirFundamentalJzodSchema.ts:993-1008` → generates `EntityInstance | ("ENTITY_INSTANCE_UUID" | "ARRAY")` and `z.union([z.lazy(() => entityInstance), z.enum([...])])`.
- `reportUuid` (Report entity `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916`) — union of `uuid` + transformer schemaReference → generates `string | CoreTransformerForBuildPlusRuntime` and `z.union([z.string().uuid(), z.lazy(...)])`.

### 3.2 Stock instance inventory (45 files, enumerated programmatically)

All TransformerDefinition instances live in [`packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8). Enumeration (Python, 2026-08-27) of all 45 files:

| input → output | count | definitions |
|---|---|---|
| `array → array` | 6 | `mapList`, `filterList`, `aggregate`, `concatLists`, `getUniqueValues`, `sortList` |
| `array → object` | 3 | `listReducerToSpreadObject`, `ansiColumnsToJzodSchema`, `indexListBy` |
| `array → any` | 3 | `pickFromList`, `object_fromEntries`, `find` |
| `array → number` | 1 | `listLength` |
| `any → boolean` | 1 | `boolExpr` |
| `any → object` | 2 | `createObjectFromPairs`, `mergeIntoObject` |
| `any → any` | 5 | `stringOp`, `ifThenElse`, `case`, `plus`, `getObjectEntries` |
| `any → number` | 1 | `numericOp` |
| `object → any` | 2 | `defaultValueForSchema`, `accessDynamicPath` |
| `object → object` | 7 | `resolveConditionalSchema`, `jzodTypeCheck`, `resolveSchemaReferenceInContext`, `unfoldSchemaOnce`, `resolveTransformerResultSchema`, `dataflowObject`, `transformer_menu_addItem` |
| `object → array` | 1 | `getObjectValues` |
| `undefined → any` | 4 | `returnValue`, `constantAsExtractor`, `getFromParameters`, `getFromContext` |
| `undefined → object` | 1 | `createObject` |
| `undefined → string` | 3 | `generateUuid`, `currentTimestamp`, `currentDate` |
| `string → string` | 2 | `mustacheStringTemplate`, `getActiveDeployment` |
| **`metaModel → metaModel` (out-of-enum, invalid)** | 1 | `duplicateApplicationModel` |
| **`inputOutput` absent** | 2 | `entityDefinition_extractAttributes`, `spreadSheetToJzodSchema` (both `transformerImplementationType: "transformer"` composites) |

Total 45. **No instance uses a payload form** (none existed in the schema). Every instance carries `transformerResultSchema`.

Exceptions to fix:

- `duplicateApplicationModel` ([`e709496c-7deb-4759-bec3-b31caf3a909d.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/e709496c-7deb-4759-bec3-b31caf3a909d.json)) — `metaModel` is out-of-enum even today. Its handler (`handleTransformer_duplicateApplicationModel`, [`TransformersForRuntime.ts:890`](../../../packages/miroir-core/src/2_domain/TransformersForRuntime.ts)) takes and returns a `MetaModel` object; `MetaModel` is a context schema, **not** an entity, so no entity uuid exists → target `object → object`. Its `transformerResultSchema` (`{returns:"mlSchema", definition:{type:"string"}}`) is also wrong (returns an object) → fix to the `metaModel` schemaReference in the same pass (confirmed with user).
- `entityDefinition_extractAttributes` (`1bbed895-7d5a-4541-97bd-4d5cf22b128c`) — composite reading `entityDefinition.mlSchema.definition`; target input = EntityVersion uuid `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd`, output `array` (of [name, attributeSchema] tuples — not payload-expressible).
- `transformer_menu_addItem` (`685440be-7f3f-4774-b90d-bafa82d6832b`) — adds an item to a Menu instance, result schema already references `menu`; target input/output = Menu uuid `dde4c883-ae6d-47c3-b6df-26bc6e3c1842`.
- `spreadSheetToJzodSchema` (`e44300e8-ed02-40fb-a9ee-d83d08cb1f25`) — input shape unclear; stays absent (honest `any/any`).
- The 8 Jzod-schema-value transformers (`defaultValueForSchema`, `unfoldSchemaOnce`, `resolveConditionalSchema`, `resolveSchemaReferenceInContext`, `jzodTypeCheck`, `ansiColumnsToJzodSchema`, `spreadSheetToJzodSchema`, `resolveTransformerResultSchema`) handle schema *values*, not MlSchema *instances* → keep `object`/`any`.

No TransformerDefinition instances exist in other deployment trees (`library_model/a557419d-…/` holds only a `dummy.txt` placeholder; electron `release/*-unpacked/` copies are gitignored build artifacts). One MiroirTest fixture ([`miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/d7e9f81b-c23d-4f68-b9a0-6e7f8091a2b3.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/d7e9f81b-c23d-4f68-b9a0-6e7f8091a2b3.json)) embeds two `any/any` TransformerDefinition fixtures — they stay valid under the new schema.

### 3.3 List transformer panel (#246) (**aligned, reusable**)

[`ListTransformerPanel.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ListTransformerPanel.tsx) — own nested Formik, single field `elementTransformer` rendered by `TypedValueObjectEditor` over the `coreTransformerForBuildPlusRuntime` schemaReference (exported at lines 26-32). Props: `instancesToDisplay`, `application`, `applicationDeploymentMap`, `deploymentUuid`, `sectionLabel?`, `rowMlSchema?: JzodElement`. Failures render via `ThemedOnScreenHelper`; results via a read-only `TypedValueObjectEditorWithFormik`.

Call site ([`ReportSectionListDisplay.tsx:865-874`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionListDisplay.tsx)):

```typescript
{transformerPanelEnabled ? (
  <ListTransformerPanel
    instancesToDisplay={instancesForTransformerPanel}
    application={props.application}
    applicationDeploymentMap={props.applicationDeploymentMap}
    deploymentUuid={props.deploymentUuid}
    sectionLabel={defaultLabel ?? currentReportTargetEntity?.name}
    rowMlSchema={instancesToDisplayJzodSchema}
  />
) : null}
```

The row **entity uuid** is in scope there as `currentReportTargetEntity?.uuid` and `objectListReportSection.definition.parentUuid` (`currentReportTargetEntity` computed at line 262 from `context.deploymentUuidToReportsEntitiesMapping`); the row `mlSchema` already flows as `rowMlSchema`. The deployment's entity list (`entities`, same source) is equally in scope for the output-type chooser.

### 3.4 Design-time machinery (#88) (**aligned, reusable**)

`resolveTransformerResultSchema` ([`Transformer_ResultSchema.ts:765`](../../../packages/miroir-core/src/2_domain/Transformer_ResultSchema.ts)) already performs design-time lookup of `TransformerDefinition`s (default `applicationTransformerDefinitions` from `TransformersForRuntime.ts`) keyed by `transformerType` — the exact lookup pattern the adequacy matcher needs. The panel already uses it for result-display typing via `resolveListTransformationResultDisplaySchema` ([`listDisplayByTransformer.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/listDisplayByTransformer.ts), line 151).

### 3.5 Styling precedents (**aligned, reusable**)

- Error border: `displayError?: { errorPath; errorMessage }` prop → red `#f44336` frame border in [`JzodElementEditor.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/JzodElementEditor.tsx) (border computation lines 711-713, applied 1908-1918); forwarded by `TypedValueObjectEditor.tsx:96-98`.
- Orange warning box: `border: '1px solid #ff9800'`, `backgroundColor: '#fff3e0'` in [`TypedValueObjectEditor.tsx:201`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditor.tsx) (zoom-path error).
- Theme warning color: `miroirTheme.currentTheme.colors.warningLight || "orange"` in `AppBar.tsx`.

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Transformer input schema fragment (`schemaReference` → `coreTransformerForBuildPlusRuntime`) | `ListTransformerPanel.tsx:26-32` |
| Transformer definition lookup by `transformerType` (`applicationTransformerDefinitions`) | `miroir-core/src/2_domain/TransformersForRuntime.ts`; pattern in `Transformer_ResultSchema.ts:765` |
| `displayError` border-prop pattern | `JzodElementEditor.tsx:711-713, 1908-1918`; `TypedValueObjectEditor.tsx:96-98` |
| Union schema precedents (enum+ref, uuid+ref) | `getMiroirFundamentalJzodSchema.ts:993-1008`; Report entity `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| Row entity uuid source | `ReportSectionListDisplay.tsx:262` (`currentReportTargetEntity`), `objectListReportSection.definition.parentUuid` |
| Menu entity | uuid `dde4c883-ae6d-47c3-b6df-26bc6e3c1842` |
| EntityVersion entity | uuid `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd` |
| #246 test rigs | `tests/4_view/helpers/listTransformerIntegRig.tsx`, `listDisplayByTransformer.integ.test.tsx` |

## 5. Target design (confirmed)

### 5.1 Schema change (Part 1)

In the TransformerDefinition entity JSON (source of truth) and its EntityVersion snapshot, the `inputOutput` context becomes:

```json
"context": {
  "inputOutputPayloadType": {
    "type": "union",
    "definition": [
      { "type": "enum", "definition": ["any","bigint","number","string","boolean"] },
      { "type": "uuid" }
    ]
  },
  "inputOutputType": {
    "type": "union",
    "definition": [
      { "type": "enum", "definition": ["any","undefined","bigint","number","string","boolean","object","array"] },
      { "type": "uuid" },
      { "type": "object", "definition": {
          "type": { "type": "enum", "definition": ["object","array"] },
          "payload": { "type": "schemaReference", "optional": true, "definition": { "relativePath": "inputOutputPayloadType" } }
      } }
    ]
  },
  "inputOutputObject": { "type": "object", "definition": { "input": "…", "output": "…" } }
}
```

Files touched: the two asset JSONs (hand-edited, context keys unchanged so the bootstrap spread at `getMiroirFundamentalJzodSchema.ts:981-982` keeps working), then build `miroir-test-app_deployment-miroir` + `npm run devBuild -w miroir-core` regenerates `miroirFundamentalType.ts` / `miroirFundamentalJzodSchema.ts`. Instance sweep per §3.2 (3 files changed, 42 unchanged). New MiroirTest unit test: every stock TransformerDefinition validates against the new schema.

### 5.2 Matching function (Part 2, core)

New pure function in `miroir-core` `2_domain` (e.g. `TransformerInterfaceCheck.ts`): given `{ input: InputOutputType-ish, output: … }` and a definition's optional `inputOutput`, return `ok | { inputMismatch?, outputMismatch? }` implementing the D4 relation; absent `inputOutput` → `any/any`. Unit-tested via MiroirTest (per-type truth table, payload cases, uuid ⊂ object cases).

### 5.3 Panel wiring (Part 2, surface)

`ReportSectionListDisplay` passes `rowEntityUuid` (+ deployment entity list) into `ListTransformerPanel`. The panel holds the expected output type in `useState` (default = input type), renders the chooser select next to the transformer field label (payload sub-select on `object`/`array`), resolves the seized transformer's outermost `transformerType` → definition `inputOutput`, and calls §5.2. On mismatch: orange `#ff9800` border on the transformer editor field frame via a `displayError`-style prop — non-blocking; execution and result display unchanged. Integration coverage extends the #246 rig (`listTransformerIntegRig.tsx`).

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md) (to be written following the `miroir-analysis-to-tdd-plan` skill).

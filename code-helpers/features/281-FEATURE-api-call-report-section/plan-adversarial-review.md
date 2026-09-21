# 281 — Adversarial review of the TDD implementation plan

> Attack of `tdd-implementation-plan.md` against `analysis.md` (post R1–R14), `.agents/skills/miroir-analysis-to-tdd-plan/SKILL.md`, `.agents/skills/tdd/tests.md`, GitHub issue #281 AC, and the current codebase (`ReportViewWithEditor`, `ReportSectionViewWithEditor`, `ReportTools`, `syncExternalServiceSchema`, `Spotify.ts`, `spotifyApp.integ.test.tsx`, `externalServiceSync` / `externalServiceSyncExecute`, `externalServiceHttpStoreSkip`, `nonreg-manifest.json`, deployment `modelValidation`, `testByFile`). Design choices D1–D16 are not relitigated.

**Verdict.** The plan is a strong post-analysis translation: vertical Slice 1 (schema + view + Spotify report + integ tracer), locked defaults, no commit steps, vitest exceptions justified like #267, AC table, and explicit `useCurrentModelEnvironment` / report-inline extractor binding. It is **not implementation-ready**. Slice 1 RED contradicts its own fixture story; Endpoint lookup GREEN assumes Redux endpoint indexing without a documented boot contract; the HTTP-not-cached assert is underspecified and drifts toward HOW; Slice 3 leaves re-sync / multi-store Entity proof as optional leftovers while GitHub AC and analysis D15 require it; Slice 4’s RED/GREEN ordering is muddled; Slice 0 vs Slice 1 characterization flips are acknowledged but not operationalized. Fix blockers before Slice 1 GREEN.

---

**Dispositions (all 21 applied in tdd-implementation-plan.md):** P1 → Slice 1 in-test report clone. P2 → `spotifyApp` boot contract + child-section lookup + `currentModel.endpoints.find` fallback. P3 → mandatory filesystem **and** postgres `externalServiceSyncExecute` re-sync. P4 → `pre-281 inventory` describe deleted in Slice 1. P5 → no-data-directory WHAT assert. P6 → MiroirTest/vitest `appModel` carries `operationSync` before deleting constants. P7 → Slice 4 RED is failing export/count asserts. P8 → AC split Slice 1 vs 4. P9 → Slice 5 rewrites GitHub AC #8. P10 → Slice 2 Validation matches Slice 1 subset. P11 → standalone-app `tsc` on Slice 3. P12 → `reportSectionsFormSchema` RED. P13 → primary RED = missing playlist name. P14 → progress table labels Slice 1 first behavioral. P15 → Slice 0 miroir `modelValidation`. P16 → full UUIDs. P17 → sibling nonreg step if overflow. P18 → D9 omit-scope RED. P19 → Slice 1 uses pre-sync `responseSchema`. P20 → no commit steps (confirmed). P21 → commands verified.

## Recommendations

- [x] **P1** [blocker] — Slice 1 RED mixes committed package report with `apiCallReportSection` assertions: §1.1 says render `reportSpotifyPlaylist` and assert section `definition` has `apiCallReportSection` (`10ce3252-…` asset today is `inputReportSection` + `objectInstanceReportSection` + `jsonReportSection` in `packages/miroir-test-app_deployment-spotify/assets/spotify_model/3f2baa83-…/10ce3252-….json`). On day one those assertions cannot both use the imported asset and describe the target shape. → RED must pass a **structural clone** of the report (in-test or issue-scoped JSON) with `apiCallReportSection` before GREEN mutates the committed asset; drop the contradiction or split “asset inventory” (phase0) from “tracer report fixture” (phase1 only).

- [x] **P2** [blocker] — `ReportViewWithEditor` never reads `endpointsByUuid`; the plan’s lookup lives only on a new `ReportSectionViewWithEditor` arm via `useCurrentModelEnvironment` (`ReduxHooks.ts:268-336`). That hook builds `endpointsByUuid` from `useEndpointsOfApplications` (`278-281`, `394-412`) — Redux **Endpoint instance index**, not `defaultSpotifyAppModel.endpoints` (`Spotify.ts:94-100`). `ReportViewWithEditor` still seeds Formik with `defaultMiroirModelEnvironment` (`ReportViewWithEditor.tsx:278,301`); only the child section can resolve HTTP schema. `spotifyApp.integ.test.tsx` boots via `resetAndInitApplicationDeployment` + `SeedSpotifyDeploymentMapping` (`339-349`, `468-509`) so endpoints usually land in Redux, but the plan never copies that **fixture contract** (#267 P14 class). → Slice 1 RED/GREEN must name the same boot path as `spotifyApp` (or shared helper) and assert playlist name (WHAT). Allow `currentModel.endpoints.find` fallback like `objectListReportSection` (`ReportSectionViewWithEditor.tsx:201`) if Redux index is empty — analysis §5.3 permits `currentModel.endpoints.find`.

- [x] **P3** [blocker] — Slice 3 defers D15 / issue AC re-sync proof: §3.1 cycle 7 and §Validation “Prove postgres/indexedDb Entity `createEntity` upsert **or** document leftover” while GitHub AC requires re-sync with `entity` set updates existing `mlSchema` and several entity keys emit several actions; analysis D15 explicitly requires postgres/indexedDb in the TDD plan (`analysis.md` D15). `externalServiceSyncExecute` (`394242e7-…`) today expects `createSpotifyPlaylist` / uuid `56166585-…` (`394242e7-….json:225-237`) — flipping sync is not enough without an **execute** case that runs composite twice and asserts refreshed `mlSchema`. → Add a mandatory RED (MiroirTest integ and/or vitest profile) for filesystem **and** at least one other store, or move re-sync AC to an explicit non-goal and shrink the issue AC table; do not leave cycle 7 as “if cannot boot.”

- [x] **P4** [blocker] — Slice 0 vs Slice 1 characterization flip is not executable as written: §0.1 locks “15 members, **no** `apiCallReportSection`” and three section types; §1 Validation re-runs phase0 after GREEN but only “prefer” moving section asserts to phase1 (`226-227`). Mid-Slice-1, phase0 **must fail** until edited. → Split phase0 into stable asserts (sync constants, asset count, `getReportsAndEntitiesForDeploymentUuid` shape) vs **post-tracer** asserts in phase1; or gate phase0 section-type tests behind a single explicit “pre-281 inventory” describe block deleted at end of Slice 1.

- [x] **P5** [major] — Slice 1 “HTTP not cached” assert is HOW-lean and weaker than existing precedent: §1.1 suggests spying `loadNewInstancesInLocalCache` or vague `getInstances` with no cited public test API (no `getInstances` usage in standalone-app external-service tests). `spotifyApp.integ.test.tsx` already proves the D5 story WHAT-style: Entity present in model but **no** filesystem data directory (`556-581`, `externalServiceHttpStoreSkip.unit.test.ts:60-67`). → Assert absent storage folder / no instance rows via `domainController.currentModelEnvironment(…).currentModel` + filesystem path (same as spotifyApp), or document query stash only via rendered typed fields without Redux spy; align AC row with that test, not DomainController internals.

- [x] **P6** [major] — Slice 3 MiroirTest unit env vs `appModel` (#267 P11 class): Unit runner always passes `defaultMetaModelEnvironment` (`packages/miroir-core/tests/miroir-core-tests.unit.test.ts:51`). Handler already uses `transformerParams.appModel` (`syncExternalServiceSchema.ts:453-476`) and `f4e5dde0-…` embeds inline `appModel.endpoints[]` (`f4e5dde0-….json:331-358`) — viable **if** RED updates that inline endpoint with `operationSync.get-playlist.boundPaths` **before** GREEN deletes `DEFAULT_BOUNDED_PATHS` (`syncExternalServiceSchema.ts:44-60`). Plan orders Spotify asset boundPaths in GREEN but does not require MiroirTest JSON / vitest `appModel` to carry `operationSync` in the same commit. → State explicitly: extended `externalServiceSync` and phase3 vitest case 3 inject `operationSync` on the param endpoint; unit `defaultMetaModelEnvironment` is irrelevant for those tests.

- [x] **P7** [major] — Slice 4 RED/GREEN order violates vertical TDD: §4.1 lists `spotifyApp` “still renders” and `externalServiceHttpStoreSkip` “still passes **after** the example file is gone” under **RED**, but deleting the Entity is §4.2 GREEN; `spotifyApp.integ.test.tsx` still imports `entitySpotifyPlaylist` (`71-72`, `564-647`) — pre-delete tests pass, they are not RED. Characterization “JSON count is **6**” belongs after delete. → RED: failing assertions that **require** removed package Entity (e.g. import gone, `defaultSpotifyAppModel.entities === []`, modelValidation spotify inventory); keep spotifyApp/phase1 as regression in Validation after GREEN.

- [x] **P8** [major] — AC table conflates “typed UI without Entity uuid” with Slice 1: GitHub AC #1 is render without Entity `56166585-…` in the **model**; Slice 1 explicitly keeps the Entity file and `defaultSpotifyAppModel.entities` (`205-206`, AC row 425). Slice 1 only removes `parentUuid` from the report section. → Split AC mapping: Slice 1 → typed UI without `objectInstanceReportSection`; Slice 4 → package no longer ships Entity; do not claim Slice 1 satisfies AC #1 wording.

- [x] **P9** [major] — Issue AC #8 vs locked D15 / plan AC row: GitHub issue body still says “create if absent, **update** `mlSchema` if present”; locked D15 and analysis R4 require **`createEntity` upsert only** (filesystem `FileSystemEntityStoreSectionMixin.ts:77-93`), not `updateInstance`. Plan AC table does not flag the drift (unlike #267 P24 for stale issue text). → Slice 5 docs must rewrite issue AC #8 to match D15; until then AC checklist should note “issue text stale.”

- [x] **P10** [major] — Slice 2 Validation is thin for a binding slice: §Validation runs only phase2 + phase1 integ (`266-269`) — no `modelValidation`, no `tsc`, no `externalServiceReport` / `spotifyApp` regression, no rebuild (Slice 2 is view-only but touches shared resolver). → Match Slice 1 validation subset at minimum (`spotify` + `miroir` modelValidation, both `tsc` packages).

- [x] **P11** [major] — Slice 3 Validation omits `miroir-standalone-app` `tsc` and phase1 regression: §318-329 typechecks `miroir-core` only after sync + view tracer; Endpoint/`operationSync` dual-write touches generated types consumed by standalone-app. → Add `npx tsc … -p packages/miroir-standalone-app/tsconfig.json` and `RUN_TEST=apiCallReport.281.phase1` to Slice 3 Validation (Slice 1 already has both).

- [x] **P12** [major] — `reportSectionsFormSchema` closed switch: Slice 1 GREEN lists `reportSectionsFormValue` + schema arm but RED does not fail closed on dialog path — unknown types hit `default` **throw** (`ReportTools.ts:111-116`); `jsonReportSection` already throws though render uses `{}` in form value (`268-273`). Missing explicit RED that `JsonObjectEditFormDialog` / schema generation succeeds for `apiCallReportSection` (analysis R7). → Add one WHAT assert (open report section editor without throw) or document as Slice 1 GREEN-only with Validation via phase1 render in designer mode if available.

- [x] **P13** [major] — Slice 1 combines schema dual-write + tracer (skill-acceptable) but RED can pass schema-only gates without behavior if tests are written wrong: Jzod union rejection happens at asset validation / modelValidation, not necessarily at React render — unknown leaf types render **no** typed UI (no arm in `ReportSectionViewWithEditor.tsx:432-696`; only debug `JsonDisplayHelper`). → Require phase1 RED primary failure mode: **missing playlist name** (and no `report target entity not found`), not union parse errors alone; keep rebuild-first in Validation (plan §213-216 — compliant with #267 P13).

- [x] **P14** [minor] — Skill tracer-first vs Slice 0: Override 4 wants thinnest E2E first; Slice 0 is valid characterization (#234). Slice 1 is the real tracer — OK — but Progress table labels Slice 0 as safety net without stating Slice 1 is the **first behavioral slice** (wording only).

- [x] **P15** [minor] — Slice 0 lacks Refactor checkpoint (template allows omission) and skips `miroir-test-app_deployment-miroir` `modelValidation` in §Validation (`148-149`) though §0.1 reads Report Entity union from miroir assets — acceptable while unchanged, but inconsistent with “pure-data slices prove modelValidation” skill rule for later slices.

- [x] **P16** [minor] — Allocated UUIDs truncate Report/Endpoint Entity ids (`3f2baa83-…`, `3d8da4d4-…`) while analysis cites full paths (`3d8da4d4-8f76-4bb4-9212-14869d81c00c/0e5cb172-….json`) — copy-paste risk during dual-write.

- [x] **P17** [minor] — Slice 5 nonreg: extending `externalServices-spotify` (`scripts/nonreg-manifest.json:898-905`) with long `apiCallReport.281.phaseN` names may overflow the step; plan allows new step but does not size-check — mirror #267 manifest hygiene.

- [x] **P18** [minor] — Slice 3 vitest case 5 (D9 scope default) is new behavior vs today’s fail-closed `scope` (`syncExternalServiceSchema.ts:459-461`) — plan notes D9 in locked table but MiroirTest `externalServiceSync` still passes explicit `scope` (`f4e5dde0-….json:360-363`); add RED that omits `scope` with `enabledOperations: ["get-playlist"]` on param endpoint.

- [x] **P19** [minor] — `endpointDefinition.ts` has no `operationSync` on `EndpointExternalService` yet (`endpointDefinition.ts:39+`) — expected; Slice 3 GREEN must dual-write **before** deleting `DEFAULT_BOUNDED_PATHS` (plan §287-288 — correct sequencing); call out that Slice 1 tracer intentionally uses **pre-sync** bounded `responseSchema` already on Endpoint JSON (§205-206).

- [x] **P20** [minor] — Commit steps: none found — compliant with skill execution model.

- [x] **P21** [minor] — Test commands verified: `testByFile` exists on `miroir-core`, `miroir-standalone-app`, `miroir-test-app_deployment-spotify` (`package.json`); `RUN_TEST=apiCallReport.281.phaseN` targets not yet on disk — expected; `--profile emulatedServer-filesystem` matches `spotifyApp` header comment.

---

## Verticality (vector A) — per slice

| Slice | Observable behavior? | Layers cut? | Verdict |
|---|---|---|---|
| 0 | Characterization (allowed) | Inventory / contracts | OK if P4 splits flipping asserts |
| 1 | Typed playlist without `parentUuid` | Report union + view + report JSON + integ | Real tracer; RED fixture broken (P1); lookup contract (P2) |
| 2 | Hard-fail binding messages | Deepens Slice 1 arm | Vertical OK; thin Validation (P10) |
| 3 | Sync without forced Entity | Endpoint schema + handler + assets + MiroirTest/vitest | Right layers; D15 proof gap (P3, P6) |
| 4 | Example package drops Entity | Assets + exports + tests | Right goal; RED order wrong (P7) |
| 5 | Nonreg / docs / AC | Final slice | Template-compliant |

Slice 1 is not a shallow schema-only slice (unlike #267 Slice 1) — it cuts view + asset + test together. Skill helper-grouping for Slice 3’s seven cycles inside one slice is correct.

---

## Test vehicles (vector B)

Vitest for React + fake server (`spotifyApp.integ.test.tsx`, `fakeExternalServiceServer.ts`) matches plan justification. MiroirTest `externalServiceSync` / `externalServiceSyncExecute` exist with allocated uuids; extending them is the right vehicle for composite shape. Direct vitest of `handleTransformer_syncExternalServiceSchema` (`syncExternalServiceSchema.281.phase3.unit.test.ts`) is justified for fail-closed params awkward in JSON — **if** tests use real OpenAPI excerpt + param `appModel`, not cloned bounded schema (plan §295-296 — compliant with skill).

---

## Feasibility notes that are *not* findings

- `useCurrentModelEnvironment` is available to child report sections (`TypedValueObjectEditor.tsx:244`, `useCurrentModelEnvironment.unit.test.tsx`) — plan choice of hook over `deploymentUuidToReportsEntitiesMapping` matches analysis R1.
- `getReportsAndEntitiesForDeploymentUuid` returns no endpoints (`Model.ts:226-276`) — phase0 assert is correct.
- `syncExternalServiceSchema` Spotify constants at `syncExternalServiceSchema.ts:38-60,475,577-581` — phase0 assert correct.
- `externalServiceHttpStoreSkip` does **not** import package Entity JSON (inline `httpEntity` at `:22-33`) — Slice 4 “must not import spotify Entity asset” is already satisfied; only uuid constant is shared.
- Slice 4 after Slice 1 does not block tracer: Slice 1 does not require `entitySpotifyPlaylist` import in phase1 if report uses Endpoint `responseSchema` only; `spotifyApp` Entity import is Slice 4 blast radius (order OK).
- No `**Commit:**` lines — skill compliant.

---

## Coverage vs issue AC (vector G)

| GitHub AC (issue #281) | Plan slice | Gap |
|---|---|---|
| Typed UI without Entity `56166585-…` | 1 + 4 | P8 — Slice 1 ≠ no Entity in model |
| `objectInstanceReportSection` + HTTP Entity regression | 4 phase4 | OK if fixture spelled out |
| Extractor mismatch hard fail | 2 | OK |
| Unknown endpoint / missing op / missing extractor | 2 | OK |
| HTTP not in instance cache | 1 + 0 | P5 — assert mechanism |
| Sync no `createEntity` without `operationSync.entity`; no Spotify constants | 3 | OK if MiroirTest JSON updated (P6) |
| Missing `boundPaths` fail closed | 3 vitest + MiroirTest | OK |
| Re-sync / several entity keys | 3 | **P3** — deferred |
| `operationSync` survives upsert | 3 | OK (spread L403-411 cited) |
| Spotify package drops Entity; menu/home report | 4 | P7 RED order |
| `modelValidation` miroir + spotify | 1, 3, 4 | Slice 2/0 partial (P15) |

Issue body AC #8 “update mlSchema” vs D15 `createEntity` upsert — **P9**.

---

## What the plan got right

- Locked D1–D16 and lookup via `useCurrentModelEnvironment(…).endpointsByUuid`, forbidding reports-entities mapping — implements analysis R1/R2 in GREEN notes.
- Slice 1 cuts Report dual-write, bootstrap filter (`getMiroirFundamentalJzodSchema.ts` ~L1582-1601), `ReportTools` both switches, `readonly={true}`, Spotify report migration, and integ tracer in **one** vertical slice (avoids #267-style schema-only front slice).
- Slice 2 deepens the same view arm (skill “deepen, not widen”); R14 disabled-operation vs binding split is called out.
- Slice 3 orders `operationSync` on Endpoint asset before removing `DEFAULT_BOUNDED_PATHS` (analysis R6); groups handler cycles in one slice.
- Test conventions table, rebuild-before-test in Slice 1/3 Validation, emulated profile, and extension of existing nonreg step `externalServices-spotify`.
- Execution model: no commits; Realization placeholders; AC checklist present; prerequisite #267 explicit.
- Phase0 locks sync constants and parallel Query `371aed0c-…` vs report embed drift — good safety net.
- Vitest exception sentence mirrors #267 `externalServiceReport` / `spotifyApp` pattern.

---

## Suggested repair order (not new product decisions)

1. Fix P1 + P2 + P5 in Slice 1 RED/GREEN (report clone, boot contract, cache WHAT assert).
2. Fix P4 before starting Slice 1 (phase0/phase1 assert split).
3. Fix P3 + P6 in Slice 3 (mandatory re-sync proof, `operationSync` in MiroirTest/vitest `appModel`).
4. Fix P7 Slice 4 RED ordering; P8/P9 AC table honesty.
5. P10/P11 Validation gaps; P12 form-schema RED optional.

**Counts:** 4 blockers (P1–P4), 9 majors (P5–P13). **File:** `code-helpers/features/281-FEATURE-api-call-report-section/plan-adversarial-review.md`.

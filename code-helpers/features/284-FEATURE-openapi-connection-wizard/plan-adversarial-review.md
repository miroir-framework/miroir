# 284 — Adversarial review of the TDD implementation plan

> Attack of `tdd-implementation-plan.md` against `analysis.md` (post R1–R17), `.agents/skills/miroir-analysis-to-tdd-plan/SKILL.md`, `.agents/skills/tdd/tests.md`, GitHub issue #284 acceptance criteria, and the current codebase (`MultistepReportHost.tsx`, `DomainController.ts`, `ExternalServiceClient.ts`, `SecretStore.ts`, `ReportViewWithEditor.tsx`, `29ef8018-….json`, Report Entity `3f2baa83-….json` L161–169, `fakeExternalServiceServer.ts`, `multistepProcess.274`, `externalService.unit.test.ts`, `testByFile`). Design choices D1–D23 are not relitigated.

**Dispositions (all 18 applied in tdd-implementation-plan.md):** P1 → `phase0 stable` vs `pre-284 inventory` deleted in Slice 6. P2 → Test harness. P3 → Slice 4 cycles 4.1–4.4. P4 → Slice 5 resolves `inputSchemaFromBag`. P5 → Formik dump in wizard cycle 5. P6 → Spotify-shaped `get-playlist` in 4.3. P7 → `discogsPublic` and `discogsToken`. P8 → parser and private-host alert strings. P9 → `handleAction` case and invocation shape. P10 → Slice 3 re-runs phase1 and phase2 plus `tsc`. P11 → Slice 2 re-runs phase0 stable, phase1, and `tsc`. P12 → Slice 6 cycles. P13 → phase0 stable stays green for `libraryImplementation`. P14 → cited as integ parity with `externalService.unit.test.ts`. P15 → Slice 0 `modelValidation` and an empty refactor checkpoint. P16 → full uuids in the allocation table. P17 → nonreg auth step named. P18 → profile flag order noted. No command change.

**Verdict.** The plan tracks the revised analysis well: action-first tracer (Slice 1), branching host before wizard UI (5 → 6), locked defaults, vitest justification, no commit steps, AC table, and line-accurate logging targets in `DomainController.ts` (L4795–4803, L4846–4855, L4992–4998) and `MultistepReportHost.tsx` (L63–69, L170–191, L360–381, L461–463). It is **not implementation-ready**. Slice 0 inventory asserts flip at Slices 5–6 without an executable split; UI/action integ tests omit the `#274` / `#270` fixture boot contract; Slice 4 violates vertical RED→GREEN inside the slice; several GitHub AC rows lack a named failing assertion or message-level proof. Fix blockers before Slice 1 GREEN.

---

## Recommendations

- [x] **P1** [blocker] — Slice 0 vs later slices: §0.1 locks `MiroirWebAppOrDesktopHome` (`29ef8018-43fc-4ee9-a736-6f9d625be7b7.json`) to three sections with **no** `openReportSection`, and Report Entity `listReportSection.definition` items as a single `reportSection` ref only (`3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json` L161–169). Slice 5 dual-writes `reportSection | multistepStep` on that array; Slice 6 adds the home launcher. Re-running `connectExternalService.284.phase0` after those slices **must fail** until phase0 is edited, yet §1/§4 Validation still re-run phase0 and §7.1 keeps phase0 in nonreg “if pure inventory”. → Split phase0 into **stable** describes (Spotify `0e5cb172-12ea-4467-8598-5889338ae454.json` hash, Bearer/`executeExternalServiceOperation`, `allGatedStepsAllowFinish` on a synthetic two-step list, optional `libraryImplementation` rejection) vs **post-change** asserts moved to phase5/phase6 or a `pre-284-inventory` describe deleted at end of Slice 6; document when nonreg drops phase0.

- [x] **P2** [blocker] — Fixture boot contract missing for `wizardWalk.284` and action integ: analysis D22 requires a **fixture application** on `applicationDeploymentMap` (`defaultSelfApplicationDeploymentMap` today is Miroir + Admin only, `Deployment.ts` L79–82). `multistepProcess.274.integ.test.tsx` shows the pattern: extend `applicationDeploymentMap`, optional `wireLocalCacheCompositeAction: true`, cache upsert helpers, router mocks, and `ReportPage` mount — not named for #284. §6.1 “Render `MiroirWebAppOrDesktopHome`” does not say **ReportPage vs HomePage** (HomePage auto-navigates via `homePageUrl`, `HomePage.tsx` L132–149). §1.1 “fixture application on `applicationDeploymentMap`” has no shared helper or teardown. → Add a “Test harness” subsection (reuse `JzodElementEditorTestTools` / `IntegrationTestSession` / `secretsHydrate.270` / `externalServiceDispatch` patterns): seed deployment uuid, map entry, model-section endpoints/reports visibility, `allowInsecureBaseUrlsForTests` + `fakeExternalServiceServer`, and assert writes via `domainController` + target app model — not `props.application` from Miroir host.

- [x] **P3** [blocker] — Slice 4 horizontal TDD: §4 intro claims “Three RED → GREEN cycles” but §4.1 is **one** RED file with four scenarios (custom token, client credentials, auth code, log redaction) and §4.2 is **one** GREEN block. That violates the skill and `tdd/tests.md` (“never write all tests first”; one behavior RED → GREEN). Pre-GREEN, scenarios 2–4 are not failing for the stated reason if scenario 1 is skipped. → Restructure §4 as 4.1a–d with each cycle’s own failing assertion (or one scenario per `it` with shared server fixture), minimal GREEN, then refactor once; keep Validation after the last cycle.

- [x] **P4** [major] — `inputSchemaFromBag` and envelope-aware bag keys: analysis D15/R7 requires the host to evaluate `inputSchemaFromBag` on step open and use the **resolved** schema in `currentStepAllowsNext` / `collectStepBagKeys` (`MultistepReportHost.tsx` L244–276, L107–134; `ReportSectionViewWithEditor.tsx` L738–747). Slice 5 GREEN lists `visitedStepIds`, `onNext`, and `getMultistepChildSections` but **not** dynamic schema plumbing or updating `collectStepBagKeys` / `collectInputPrefixes` when list children are `multistepStep` envelopes. Slice 6 RED asserts operations/probe rules and `wizardWalk` masked secrets — impossible if §6.2 alone adds `inputSchemaFromBag` without Slice 5 host/editor context. → Either extend Slice 5 GREEN with host context + resolved schema + bag-key collection, with a minimal fixture step using `inputSchemaFromBag`, or narrow Slice 6 RED until that plumbing exists (explicit dependency gate in the plan).

- [x] **P5** [major] — Secret redaction AC gap: issue AC #10 and analysis §5.4 include `ReportViewWithEditor.tsx` Formik debug dump (`L517–520`, live `formik.values` while the wizard is mounted). Slice 4/5 GREEN cover `runMultistepFinish`, composite logs, and hidden `<pre data-testid="multistep-step-bag">` but **never** Formik debug or a RED that typed secrets absent from that panel. → Add RED in `wizardWalk.284` or `multistepBranch.284` (debug panel visible in test mode) and GREEN to omit denylisted keys or disable dump for multistep host routes.

- [x] **P6** [major] — Issue AC #11 Spotify-shaped run underspecified: §4.1 item 3 is generic “Authorization code” with refresh grant; it does not require `get-playlist`, OpenAPI excerpt without convertible `oneOf` track paths, or `playlist_id` parameter naming (analysis §5.5). RED can pass with any three-field OAuth fixture. → Add phase4 scenario: Spotify-shaped document, probe `get-playlist`, assert `boundPaths` excludes `tracks.items.track.*` (or equivalent), and API call succeeds on fake server.

- [x] **P7** [major] — Issue AC #11 two Discogs names: table maps “Discogs-shaped public” to phase1 and “Discogs-shaped token” to phase4, but §4.1 custom-token scenario does not require a **second endpoint name** (analysis D19). One name reused fails the acceptance story. → phase1 and phase4 RED must use distinct `endpointName` values and assert two endpoint uuids coexist; phase0 Spotify hash lock unchanged.

- [x] **P8** [major] — Issue AC #2 message-level failures: §6.1 RED says invalid document “stays on the document step” and private URL alert “names the private-host refusal”, but does not require the **action’s own error message** for parse/fetch failures (analysis D15 / issue design §7). → Assert visible alert text matches probe/parse/SSRF messages (not generic “Required fields are missing”), after `unwrapAction2ErrorMessage` exists (Slice 5).

- [x] **P9** [major] — `connectExternalService` registration path thin in GREEN: §1.2 says “domain-action union (Entity + EntityVersion)” and `handleAction` branch; Finish uses `compositeActionSequence` with sub-action `connectExternalService` (`analysis.md` §5.2). Today unknown types hit `handleAction` `default` (`DomainController.ts` L3659–3664). Plan does not list generated `miroirFundamentalType.ts` / `handleAction` `case "connectExternalService":` or composite template resolution shape (contrast #274 `1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5` pattern). → Slice 1 GREEN checklist: Jzod union + `devBuild`, controller case, minimal bag payload schema, and phase1 RED invocation shape (domain action object fields): RED failure must be “unknown actionType”, not “invalid payload”.

- [x] **P10** [major] — Slice 3 Validation thin: §Validation runs only `phase3` after upsert/idempotency work touching the same handler as phases 1–2. No `phase1`/`phase2` regression, no `tsc` on standalone-app (Slice 1 includes both). → Match Slice 1 validation subset at minimum.

- [x] **P11** [major] — Slice 2 Validation: only phase2 + phase1 (`§226–229`); no `modelValidation`, no `tsc`, after `SecretStore` API change (`unregisterProcessSecret`). → Add rebuild if schema touched, both `tsc` packages, and phase0 stable subset.

- [x] **P12** [major] — Slice 6 is a wide GREEN surface without staged RED: one RED block covers home button, picker, paste/upload/URL, branch skip secrets, masked inputs, **and** Finish tracer — many independent failure modes. Skill prefers one primary RED failure (“no button / no report `dbd94bfe-…`”) with others added in the same slice only after GREEN milestones. → Order §6.1 as nested cycles (launcher RED → report asset → document onNext → public path to review → Finish) or split tracer Finish assert to reuse phase1 with UI bag assembly only in the last cycle.

- [x] **P13** [minor] — §1.2 “phase0 must stay **red** for `libraryImplementation`” is inverted: phase0 should stay **green** for that rejection (same as `externalService.unit.test.ts` L115–150 synthetic endpoint). Wording fix only.

- [x] **P14** [minor] — Phase0 `handleApplicationAction` / `libraryImplementation` duplicates existing unit coverage; integ phase0 adds boot cost without new seam. → Drop from phase0 or cite “integ parity with unit” explicitly.

- [x] **P15** [minor] — Slice 0 lacks `modelValidation` and Refactor checkpoint; later slices require it for schema touches. Acceptable for unchanged assets, but inconsistent with skill “pure-data slices prove modelValidation”. → Optional `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` in §0 Validation.

- [x] **P16** [minor] — Allocated UUIDs truncate (`360fcf1f-…`, `3d8da4d4-…`) while tests/hash locks need full paths (`0e5cb172-12ea-4467-8598-5889338ae454.json`). → Copy full uuids in Allocated table for deployment edits.

- [x] **P17** [minor] — §7.1 nonreg `unit-284` + long `RUN_TEST=connectExternalService.284.phaseN` list may overflow manifest step ( #281 P17 class). Plan allows split but no sibling step name. → Pre-size or name overflow step in §7.1.

- [x] **P18** [minor] — `testByFile` profile flag order varies in repo comments (`externalServiceDispatch.integ.test.ts` header vs plan); `prepareTestByFileLaunch` accepts both. → No change required; note in conventions for copy-paste.

---

## Verticality (per slice)

| Slice | Observable behavior? | Layers cut? | Verdict |
|---|---|---|---|
| 0 | Characterization (allowed) | Home JSON, sync, host gate, Bearer | OK after P1 split |
| 1 | Public Finish → endpoint + report | Domain action, client, walker, upsert | Real tracer; P2 harness, P9 registration |
| 2 | Failed probe / clash | Handler + SecretStore | Vertical OK; P11 Validation |
| 3 | Second Finish upsert | Handler | OK; P10 Validation |
| 4 | Authenticated finishes + logs | Client + secrets + composite logs | Right scope; **P3** RED order |
| 5 | Branching host | Schema + host + fixture report | OK; P4 envelope/schema |
| 6 | Wizard walk + UI Finish | Report + home + onNext + host | OK goal; P2 boot, P12 RED granularity |
| 7 | Nonreg / docs / AC | Final | Template-compliant; P1 nonreg phase0 |

Action-before-UI tracer (Slice 1) matches analysis proposal #1 and avoids #274’s “host not ready” trap for Finish semantics.

---

## Coverage vs GitHub issue #284

| AC (issue body) | Plan proof | Gap |
|---|---|---|
| Home button + picker | `wizardWalk.284` | P2 harness; P1 phase0 flip |
| Paste / upload / URL; private URL refused; parse/fetch failure on document step | `wizardWalk.284` | P8 messages; server fetch path in test profile |
| Public, auth-code, client-credentials, custom token | phase1, phase4 | P3/P6/P7; Spotify shape |
| Convertible GETs, `boundPaths`, `enabledOperations` | phase1 | OK if walker RED is explicit |
| Failed probe, no rows, map restored | phase2 | OK; `unregisterProcessSecret` GREEN |
| Success upserts secrets, endpoint, report; no Entity | phase1, phase4 | P2 Admin secret row query pattern (#270) |
| Second Finish updates endpoint/report | phase3 | P10 regression |
| Foreign name refuse | phase2 | OK |
| Back / branch / failed Next | `multistepBranch.284` | P4 host completeness |
| Secrets absent from logs + hidden bag | phase4, branch, wizard | P5 Formik dump |
| Discogs ×2 + Spotify + failed probe + second Finish; `0e5cb172` unchanged | phase0 hash, phase1–4 | P6, P7 |
| `modelValidation` miroir green | Slices 1,4,5,6 Validation | P15 Slice 0 |

---

## What the plan got right

- Slice order respects dependencies: **connectExternalService** tracer (1) → probe failure/idempotency (2–3) → auth + composite logging (4) → **multistepStep** host (5) → wizard asset + home (6), matching analysis §5 and D5-a without relitigating D1–D23.
- Slice 1 is a true vertical slice (schema, handler, client `none`/`extraHeaders`, walker, model-section upsert), not a schema-only front slice.
- Vitest exception paragraph matches `#267` / `#274` precedent (`fakeExternalServiceServer`, emulated filesystem profile, real `DomainController`).
- Locked defaults table, allocated wizard report `dbd94bfe-b803-4bfd-8bb2-70a5932d5d1a`, composite endpoint `1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5`, and explicit out-of-scope list (D20, D21, D23).
- Slice 5 re-runs `multistepProcess.274` and library `modelValidation`; Slice 7 AC checklist maps issue rows to tests.
- Execution model: no commit steps, Realization placeholders, Validation blocks on most slices, Resume note.
- Phase0 Spotify byte hash lock and Bearer characterization align with `ExternalServiceClient.ts` and `0e5cb172-….json` `oauth2AuthorizationCode` today.
- Slice 4 refactor explicitly wires composite-template logging before the wizard host slice, so Finish-path redaction is not deferred entirely to Slice 6.

---

## Suggested repair order

1. P1 phase0 split before Slice 1; P9 connectExternalService registration checklist in Slice 1 GREEN.
2. P2 shared integ harness for phase1–4 and `wizardWalk.284`.
3. P3 (and P6/P7) restructure Slice 4 RED→GREEN cycles.
4. P4 Slice 5 host/schema completeness for envelopes and `inputSchemaFromBag`.
5. P5, P8, P12 tighten wizard RED; P10/P11 Validation gaps.

**Counts:** 3 blockers (P1–P3), 9 majors (P4–P12). **File:** `code-helpers/features/284-FEATURE-openapi-connection-wizard/plan-adversarial-review.md`.

# UI architecture review: second-round validation log

Date: 2026-10-06. Code base: `_integration` at `9838983`, unchanged since revision 1. This log lists what the second round changed in `analysis.md`; everything not listed was re-checked and holds.

Paths are relative to `packages/miroir-standalone-app/src/miroir-fwk/4_view/` unless a package path is given.

## How it was checked

- Three independent read-only passes, each told to try to prove the claims of one part wrong: editors and structure (§2.2-2.5, U9-U19); dependencies, dead code, CI and metrics (§2.1, U20-U29, appendix); agent guidance (§4, §5.3). I re-checked the data-flow findings (U1-U8) and the read and write paths (§2.6-2.8) against `DomainController.ts`, `CallUtils.ts`, `PersistenceReduxSaga.ts` and the selector code.
- `tsc --noEmit` on the app, `miroir-react`, `miroir-diagram-class` and both local caches. The first run gave 57 app errors, 25 of them because this container's `miroir-core/dist` predated #449 and #472; after `npm run build -w miroir-core` the app gives 36 (32 MUI + 4 unlinked workspace packages in this container) and the libraries 0.
- Every Mermaid block rendered in headless Chromium with Mermaid 11.12.3: all parse. Diagram 2.5 was redrawn because its edges were unreadable, and 2.1 was regrouped.
- Behaviour claims were checked by reading code; nothing was measured in a running app.

## Withdrawn

| ID | Revision 1 said | Why withdrawn | Evidence |
|---|---|---|---|
| U7 | `LocalCacheMonitorSummary` and `RenderInsightSummary` poll "where a subscription exists" | `RenderInsightSummary` polls on purpose: notifying subscribers on flush would loop. The cache monitor has no subscription API. Both run only when their diagnostic setting is on. | `tools/renderInsightRegistry.ts:123-125` |

## Corrected

| Where | Revision 1 said | Now | Evidence |
|---|---|---|---|
| Reply to A | "Eight Mermaid diagrams" | Seven diagrams and a table (§2.8) | `analysis.md` |
| Summary 2, U1 | re-renders "the 71 components that use `useMiroirContextService`"; interface 126-240, deps 790-839 | 71 call sites in 63 files, plus the hooks on the same context (about 70 app files, every editor node among them); interface 126-237, value 695-843, deps 800-843 | `MiroirContextReactProvider.tsx`, `ReduxHooks.ts:272` |
| U2 | "one render late" acknowledged in `useReportQueryLoadService.ts:13-21` | "One render late" is stated in the code-quality skill (`react.md:187`); the hook's comment is about identity churn, now dampened by a shallow compare in `RootComponent.tsx:273-286`. The map is also drilled as a prop through 22 files. | as cited |
| Summary 3, U3 | "selector maps … so reselect's cache never hits; queries re-run on each render" | All 10 sites subscribe to the whole deployments state through `extractState`; a query re-runs on every render in 3 of them (`MlLiteralEditor`, `RunnerView`, `Runner_CreateApplication`), because both the selector and the params are new | `DomainStateMemoizedSelectors.ts:45-130`, `ReduxHooks.ts:136-157`, `viewParams.ts:14` |
| U4 | `presentModelSnapshot.current` read in 10 components | 13 view files; the whole-store subscription is used by two test buttons and the MiroirTest section | `grep presentModelSnapshot`; `useSelectedApplicationMiroirTestSuiteRegistries.ts:24-78` |
| Summary 4, U5 | 16 view files; evidence included `HomePage.tsx:211,227`; "endpoint uuids in 7 view files" | 13 files in live code (3 more only in comments); `HomePage.tsx:211,227` are inside comment blocks; 42 endpoint-uuid literals for 6 endpoints in 11 files | grep of `handle*(` calls and `endpoint: "<uuid>"` on non-comment lines |
| U6 | "memoized in `MiroirEventTimeline`" | `getAllActivities()` returns a new array on every call, so the memo recomputes on every render; the tracker's `subscribe` is commented out | `MiroirActivityTracker.ts:93-95, 152` |
| U8 | "about half of 17 sampled effects" | All 70 classified: about 30 copy values, 8 load data, 6 subscribe or poll, 22 DOM/cleanup, 2 debounce timers | per-effect reading |
| §2.2 | router at `index.tsx:154-161`; "Formik (10 instances)"; deeper contexts listed as production | router 154-164, mounted at 441, errorElement `ErrorPage`; 8 live Formik roots; 3 of the listed contexts are provided only by the test harness; a second `ReportPageContextProvider` in TransformerBuilder and Runners; `GlobalFeedbackGlow` and a second Snackbar added | `runReactComponentTest.tsx:198-205`, `runReportTest.tsx:360-378` |
| §2.3 | lazy pages 36-46; legacy switch 201-261; home renders the app's `homePageUrl` | lazy pages 37-47; legacy switch 201-251; home renders the Miroir home report and an effect redirects to `homePageUrl`; auth gate (133-156) and legacy `ai` case added | `PageDispatcher.tsx`, `routes/HomePage.tsx:132-166` |
| §2.4 | `ReportDisplay.tsx:94-218`; "if-chain l.401-750"; `input` among leaf views | 52-222; 2 if-returns + 14 `&&` blocks, l.401-767; `input` renders a `TypedValueObjectEditor`; `openReport` reaches `ReportDisplay` only as a modal; `ListTransformerPanel` (own Formik) and the lazy `ReportDisplay` from the list display added | `ReportInputSection.tsx:106`, `ReportSectionViewWithEditor.tsx:130-147` |
| §2.5 | fold state → `MlElementEditor`; Redux → object, array and leaf editors only; `MlAnyEditor` a leaf; switch 1087-1731; type check 321-360 | fold → object and array editors (and fold buttons); Redux → every node, `MlElementEditor` included; `MlAnyEditor` renders `MlElementEditor`; switch 1087-1761; type check 321-363. Diagram redrawn. | `MlElementEditor.tsx:111,226,231-234,452`, `MlAnyEditor.tsx:333` |
| §2.7 | one linear sequence: local cache transaction, then persistence, then "saga dispatches result" | two branches. Instance actions: persistence first, then the DomainController applies the result to the cache. Model actions: local cache transaction, then commit replays it to persistence. The saga does not write to the cache. | `DomainController.ts:1304-1425, 1890-1935, 2238-2405` |
| U9 | `{}` fallback at 694 | fallbacks at 618 and 694; the memo depends on `formik.values` of the whole report | `TypedValueObjectEditor.tsx:357` |
| U10 | "consumed by all editors" | consumed by every object and array editor and the fold buttons; `MlObjectEditor`'s attribute memo depends on `formik` and recomputes on every keystroke | `MlObjectEditor.tsx:1248-1350` |
| U11 | keys at 231, 741; "remounts subtrees" | effective key at 741; index keys reuse components by position, so local state shows on the wrong item | `MlArrayEditor.tsx:741` |
| U12 | 29 props passed, 23 unchanged | 31 props passed, 25 unchanged | `MlElementEditor.tsx:1090-1122` |
| U13 | hooks at 251, 321 | also 261, 273, 374, 378; 8 of the app's 70 `rules-of-hooks` suppressions are in this file | `eslint-suppressions.json` |
| U15 | two cycles | plus `MlElementEditor` ↔ object, array and any editors | static import graph |
| U16 | "ten pages in `routes/`" | 8 dispatched pages, plus `ReportDisplay` (shared) and `ReportPage` (unrouted) | `PageDispatcher.tsx` |
| U17 | 8 files import `4-tests` | plus a dynamic import from `ComponentTestSandbox.tsx:361,393` that leads back to `PageDispatcher` | `runReportTest.tsx:32` |
| Summary 5, U20 | "The 32 MUI 9 typecheck errors in the app are a consequence" of the library typing | They are app code still written for MUI 5 (mostly Grid `item`). The library pinning comes from dependabot commit `df011eb` (2026-09-30), which bumped the app and pinned the peers to 5.17.1 in the same commit. `miroir-sandbox` also uses `miroir-react`. | `tsc`, `git show df011eb` |
| U21 | importers of the local theme copies | add `MiroirThemeSelector.tsx:15` (live), `TableStyleGenerators.ts:1`, `resolveMiroirIconColor.ts:2` | grep |
| U22 | 56 `Themed*` files, 417 `style={{`, `sx` in 25 files, 58 `styled`/`css` | 48 files import `Themed*` (outside `Themes/`), 398 `style={{`, `sx` in 22 files, 41 `` css` ``/`css(` and 51 `css={` (non-comment lines; 58 could not be reproduced) | grep on non-comment lines |
| U23 | `react-hook-form` declared by the app | also declared by `miroir-react` | `miroir-react/package.json:32` |
| U24 | "every grid feature is written twice" | data, columns, themes and pagination are shared; render paths and handlers are doubled; features not at parity | `ValueObjectGrid.tsx:256-298` vs `413-454` |
| Summary 6, U25 | "about 6k lines"; list of orphans | 6.7k lines, about 3k of them code; `Graph/index.ts`, `ViewParamsUpdateQueueTestUtils.ts`, `src/IconTest.tsx` added; the `Runner_*` files are statically imported and bundled; a unit test imports through `Runner_CreateApplication.tsx:55`; `ErrorLogsPageDEFUNCT` is also in the AppBar menu | reachability from `src/index.tsx` |
| U26 | `miroir-example-library` "with no import" in the local caches | only their tests import it (move to devDependencies); `miroir-localcache` has 460 lines of tests and is still built; unused dependencies of the app and `miroir-react` added | `package.json` files |
| Summary 7, U27 | the libraries are "never typechecked" | `miroir-react`, `miroir-diagram-class` and `miroir-localcache-redux` are typechecked through `tsup dts` in the bundle job; the app and `miroir-localcache-zustand` never are | `pr-checks.yml:46, 104-108` |
| Summary 7, §4 | AGENTS.md has "four React bullets (one with a wrong path)" | No React bullet has a path. The layer list's `4_views/` is right for `miroir-core`; it just doesn't describe the app's `miroir-fwk/4_view` | AGENTS.md:43-51, 93-96 |
| §4 | code-quality skill: 10 React smells | 8 in `react.md` plus `theme-bypass` and `mocked-own-module` in `miroir.md`; a few placement rules exist | skill files |
| §4 | `miroir/layers` "covers `4_view` but not `4-tests`" | inert for every app file (new finding U34) | `eslint-rules/miroir-layers.mjs:6-15` |
| §4 | `report-display.md` "current (2026-09-28)", "linked only from an empty placeholder", "23 key files" | content from 2026-09-10, last touched 2026-09-26; also linked from `docs/index.md` (via the placeholder) and the #246 analysis and plan; 22 rows naming 23 files | GitHub commit history (the local clone is shallow) |
| §4 | "one Formik per report" listed as undocumented | `report-display.md:51-53` documents it; "Formik is the only form library" is what's missing | as cited |
| §4 | missing sources | added `docs/guides/advanced/performance.md`, `interaction-glow.md`, `docs/reference/api/reports.md`, `docs/guides/developer/testing.md`, `BlobEditing.md`, `.github/skills/README.md`; `code-style.md` has four placeholder sections, not three | file listing |
| Appendix | files > 500 lines 39; `useMemo` 320; `memo` 9; `createContext` 11; `useMiroirTheme` 167; Formik 10 / 20 | 43; 326; 11 (10 live); 10 live; 112 calls in 36 files; 8 live roots / 19 live files | counts on non-comment lines |

## New findings

| ID | Finding | Evidence | Status |
|---|---|---|---|
| U30 | Every toast is shown twice (two Snackbars on the same state) | `MiroirContextReactProvider.tsx:849-863`, `Page/RootComponent.tsx:138-142, 947-956` | read in code |
| U31 | The outline's fold action can stop working after a visit to TransformerBuilder or Runners (stale setter left in the main context) | `Reports/ReportPageContext.tsx:92-97`, `InstanceEditorOutline.tsx:227-234` | inferred, not reproduced |
| U32 | Product routes import example fixtures from `miroir-example-library` | `routes/SearchPage.tsx:24`, `routes/TransformerBuilderPage.tsx:35` | read in code |
| U33 | `miroir-sandbox` aliases the app's `src` and is built only on push to `main` | `miroir-sandbox/vite.config.js:10,32`, `build-sandbox-for-github-pages.yml:4-6` | read in code |
| U34 | `miroir/layers` never applies to app files | `eslint-rules/miroir-layers.mjs:6-15` | read in code |

# Issue #633 — TDD Implementation Plan

> Vertical slices (RED → GREEN each), integration first, no new mocks. The tests render the moved modules through the `miroir-react` package entry, with the real local cache and the `RestClientStub` emulated server of the standalone app's test rig (`tests/4_view`, `componentTestTools.tsx`, `MIROIR_ENV=test-filesystem`), and build the sandbox with Vite. The applicative surfaces are the existing Reports and Runners (a `storedRunner` section, the model diagram section, the `?page=` routes). The tracer bullet proves that a client service moved to `miroir-react` still feeds the app's load timings and the sandbox through the package entry.
>
> **Execution model:** each slice ends with its Validation commands; on success its Realization is appended and its Status flips to ✅ DONE. The user asked for the whole issue through to a PR ready to merge, so commits follow each green slice on the working branch.
>
> **Resume note:** slices 0 to 4 DONE; slice 5 next.
>
> **Plan history:** revised after an adversarial review (2026-10-31): shims at the old app paths keep pages lazy mid-way (slices 2 to 5); moved modules' `from "miroir-react"` imports become relative, with a guard; Emotion pragma for `SequenceEditor`; corrected `check_bundle_policy.py`, `--only`, auth test and route test commands; slice 1 RED moved to `loadTimingWriter.integ`; every source-text guard named in its slice; `tsc` and lint in every move slice; `defaultReportSectionRenderers` export for the AC.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/633
Prerequisite: [`../627-FEATURE-endpoint-surfaces/`](../627-FEATURE-endpoint-surfaces/) ✅ (#629)
Epic plan: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md), I2 rows. Its slice I2.1 "break the reports / component-tests cycle" is already done by #610 and #612 (analysis §4.1).
Working branch: `claude/633-app-shell-to-react`, PR against `_integration`.

---

## Scope

In, from [analysis.md](analysis.md): G1 a client from libraries, G2 same app, G3 same sandbox, G4 pluggable host features, G5 tests that survive the move.

Out (analysis §2): the MiroirTest runtime and its displays, the d3 graph renderers, the browser load-timing recorder, one startup call (epic I4), package renaming and the publication of `miroir-diagram-class` (epic I6), a consumer-owned shell and a `pages` host slot (epic D5).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize: sandbox build, failing guard, mocks, import surface, bundle baseline | ✅ | `build-633-sandbox`, `mcpToolRunner.253.phase0` green, `list_moved_imports.py` |
| 1 | Tracer: client services and the load-timing sink from `miroir-react` | ✅ | `loadTimingSink.633.phase1.unit`, `loadTimingWriter.integ`, sandbox build |
| 2 | Runners from `miroir-react`, MCP call injected, stored runner built in | ✅ | `storedRunnerDefault.633.phase2.unit`, `ui.blockEditing` |
| 3 | Login from `miroir-react`, Electron login injected | ✅ | `loginTransport.633.phase3.unit`, `electronIpcProxyAuth.263.phase6` |
| 4 | Generic pages from `miroir-react`; search opens on the current application | ✅ | `toolPageDefaults.633.phase4.unit`, `homePageLoad.unit` |
| 5 | Model diagram page through the registry; view in `miroir-diagram-class` | ⬜ | `modelDiagramPage.633.phase5.integ` |
| 6 | Shell from `miroir-react`, assistant injected; sandbox without the alias | ⬜ | `test_shell_package_boundaries.py`, sandbox build and page smoke |
| 7 | Lint boundary rule, nonreg, bundle guard, docs, cleanup, AC | ⬜ | lint, full `nonreg:filesystem`, bundle guards |

---

## Locked implementation defaults

Copied from the analysis decision record; binding. Deviations go in a slice's Realization.

| Decision | Default | Serves |
|---|---|---|
| D1 | 29 `4_view` modules move (analysis §5.1); `ReportPage`, MiroirTest displays, graph, CopilotKit, `runMcpToolRunner`, Electron IPC, `reportSectionRenderers.tsx`, `src/loadTimings/` stay | G1, G2, G3 |
| D2 | `MiroirShellHostContext` with `assistantPanel`, `requestLoginToken`, `runMcpTool`; the app fills them with `import()` wrappers; `McpToolRunnerEnvelope` moves to `miroir-react`; no `pages` slot | G4, G5 |
| D3 | `ModelDiagramPage` in `miroir-react`, rendering `modelDiagramReportSection` from the registry; `ModelDiagramReportSectionView` in `miroir-diagram-class`, registered lazily by the app and the sandbox | G1, G3, G4 |
| D4 | Search and transformer builder default to the current application, then Miroir | G1 |
| D5 | Browser login in `miroir-react`; Electron through `requestLoginToken`; the app's browser branch delegates | G2, G4 |
| D6 | `setLoadTimingMarkSink` / `loadTimingMark` in `miroir-react`, no-op default; the app registers its recorder | G1, G2, G4 |
| D7 | `git mv` to the same relative path; loggers per #592 D3; lazy pages stay lazy; every symbol used outside the package exported from `index.ts`; tests import from `"miroir-react"`; suppressions and the `VIEW` glob follow the files | G2, G5 |
| D8 | `storedRunner` is a built-in lazy default renderer, in the context default and merged under the provider's renderers; exported as `defaultReportSectionRenderers` | G1, G3 |

### Rules for every move slice

These follow from the review and apply to slices 1 to 6.

- **Relative imports inside the package.** A moved module's `from "miroir-react"` imports (112 in the moved set) become relative imports of the module that defines the symbol. `scripts/tests/test_shell_package_boundaries.py` (added in slice 1) fails on any `from "miroir-react"` under `packages/miroir-react/src`.
- **Shims while the app still routes.** Until slice 6 moves `PageDispatcher`, a moved page keeps a one-line shim at its old app path (`export { RunnersPage } from "miroir-react";`), and `PageDispatcher` keeps lazy-importing the shim. `bundle-policy.json` has `defeatedDynamicImports: []`, so a lazy `import("miroir-react")` from the app fails the guard (#13 D16). The shim relies on `sideEffects: false` and tsup's one-module-per-file output to keep the page out of the eager chunks; the bundle guard in each slice checks it. Slice 6 deletes the shims.
- **Emotion.** A moved `.tsx` that uses the `css=` prop gets `/** @jsxImportSource @emotion/react */`, as the other `miroir-react` files do (the app's Vite config sets it globally, tsup does not).
- **Source-text guards.** `list_moved_imports.py` names the readers of `4_view/<path>`; a `grep` for the moved file's base name finds the guards that join a directory and a name. Each slice lists and updates the guards on the files it moves.
- **Validation in every move slice:** `npm run build -w miroir-react`, `tsc` for `miroir-react`, `miroir-standalone-app` and `miroir-sandbox`, `npm run lint`, the sandbox build, the bundle guard, and a scoped nonreg.

---

## Allocated keys

| Artefact | Value |
|---|---|
| Issue test directory | `packages/miroir-standalone-app/tests/4_view/issues/633-app-shell-to-react/` |
| Nonreg step: sandbox build | `build-633-sandbox` (tier `unit`, scopes `ui`, `tooling`) |
| Nonreg step: issue tests | `unit-633-app-shell` (tier `default`, scopes `ui`; app issue tests and the new `miroir-react` tests), folded into feature suites in slice 7 |
| Package boundary guard | `scripts/tests/test_shell_package_boundaries.py` |
| Export surface check | `packages/miroir-react/tests/shellExports.unit.test.ts` |
| Host context module | `packages/miroir-react/src/contexts/MiroirShellHostContext.tsx` |
| Load-timing sink | `packages/miroir-react/src/loadTimings/loadTimingMarkSink.ts`; app side `src/loadTimings/registerLoadTimingSink.ts` |
| Browser login module | `packages/miroir-react/src/auth/httpLogin.ts` |
| Boundary lint fixture | `eslint-rules/react-package-boundary.test.mjs` |

No model element and no MiroirTest asset is added: the behaviours are React rendering and build wiring, which MiroirTest reaches only once the shell is built (vitest exception, one sentence per file below).

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Rebuild after a move | `npm run build -w miroir-react` (and `-w miroir-diagram-class` from slice 5) |
| App test by file | `MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- <name>` |
| Package test by file | `npm run testByFile -w miroir-react -- <name>` |
| Core test by file | `npm run testByFile -w miroir-core -- <name>` |
| Sandbox build | `npm run build -w miroir-sandbox` |
| Bundle guard | `npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json` |
| Electron bundle guard | `npm run build -w miroir-standalone-app-electron && python scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Lint | `npm run lint` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,ui[,runners,tooling] [--only id1,id2]` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

`unit-435` and `unit-443` test the MiroirTest Component Test Sandbox UI of the app, not `miroir-sandbox`; they prove G2. `miroir-sandbox` (G3) is proved by `build-633-sandbox` and the page smoke of slice 6.

---

## Slice 0 — Characterize

**Status:** ✅ DONE

### Goal

A safety net before any move: the sandbox build is fixed and checked, the guard that already fails is fixed, the effect of the mocks that the move changes is known, the import surface of the moved modules is listed, and the bundle baseline is recorded.

### Steps

1. **Sandbox build.** `import { ErrorPage } from "miroir-react"` in `miroir-sandbox/src/index.tsx`; nonreg step `build-633-sandbox`. RED: the build fails on `_integration` (analysis §4.5).
2. **Failing guard.** `mcpToolRunner.253.phase0` "exactly 10 Runner instances" compares a `.sort()`ed list with an expected list written library-first; sort the expected list. Its MCP import assertion is reworded to the #627 state (`resolveMcpToolAction.ts` imports no `miroir-mcp` subpath).
3. **Mock measurement.** Run the 9 `JsonDisplayHelper` mock files with and without the mock (scratch script, not committed). Record results in the Realization. If all pass without it, slice 1 removes the mocks; otherwise the slice that moves an affected module keeps the mock at the consumer, and the Realization says which.
4. **Import surface.** `list_moved_imports.py` lists, per moved module, the symbols imported from outside the moved set, the importers, the path mocks and the source-text readers.
5. **Bundle baseline.** Record the guard's summary line.

### Validation

```bash
npm run build -w miroir-sandbox
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253.phase0
python -m pytest scripts/tests -q
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run nonreg:filesystem -- --runner shared --scope smoke --only build-633-sandbox,unit-610-report-section-renderers
```

### Realization

- Sandbox fix and `build-633-sandbox` committed; the build passes.
- `mcpToolRunner.253.phase0`: 8/8 pass after sorting the expected runner list (the MCP import assertion already passed; the review corrected the first diagnosis).
- Import surface (`list_moved_imports.py`): only 13 symbols are imported from outside the moved set: `PageDispatcher`, `reportPageParamsFromSearchParams`, `RootComponent`, `FeedbackGlowAppBarButton`, `buildCreateApplicationStorageSchema`, `resolveMcpToolAction`, `SequenceEditor`, `fetchMiroirAndAppConfigurations`, `markPageConfigurationsLoaded`, `usePageConfiguration`, the four `miroirAiBackend` functions/constants and `agentBackendLabel`, `agentRequestProperties`; plus `RunnerView` through `reportSectionRenderers.tsx` (dynamic). Most "test imports" counted in the analysis are source-text readers (10 files name a `4_view/<path>` literally).
- Scoped nonreg (`smoke` + `build-633-sandbox`, `unit-610`): all pass (snapshot `20261031T134405Z`).
- Bundle baseline: 0 violations; 71 eager chunks, 842,027 bytes gzipped (baseline 841,981).
- Mock measurement (`MIROIR_ENV=test-filesystem`): all 9 files pass with and without the `JsonDisplayHelper` mock, within 1 s of each other (6 to 16 s per file). The mock is dead weight; slice 1 removes it from the 9 files.

---

## Slice 1 — Tracer: client services and the load-timing sink from miroir-react

**Status:** ✅ DONE

### Goal

`services/ConfigurationService`, `services/usePageConfiguration` and `services/index` live in `miroir-react` and are imported from its entry by the app, `4-tests`, the tests and the sandbox's `DemoInitializer.tsx`. The app's load timings still record `configurationsLoaded`.

### RED

- `packages/miroir-react/tests/loadTimingSink.633.phase1.unit.test.ts` (vitest: package-internal module state that no Report reaches): `loadTimingMark("x")` before any sink is a no-op; after `setLoadTimingMarkSink(fn)` it calls `fn("x")` once.
- `tests/4_view/loadTimings/loadTimingWriter.integ.test.ts` (already calls `fetchMiroirAndAppConfigurations`): after `registerLoadTimingSink()`, a call through `"miroir-react"` records the `configurationsLoaded` mark in the recorder. Fails until the sink exists.
- `scripts/tests/test_shell_package_boundaries.py::test_no_self_import`: no `from "miroir-react"` under `packages/miroir-react/src` (passes today; it guards the rewrite rule).

### GREEN

- Add `loadTimings/loadTimingMarkSink.ts`; export both functions.
- App: `src/loadTimings/registerLoadTimingSink.ts` (`setLoadTimingMarkSink(loadTimingMark)`), called by `index.tsx` right after the `loadTimingBrowser` import.
- `git mv` the three services; rewrite their `miroir-react` imports to relative; `ConfigurationService` calls the package's `loadTimingMark`; loggers per D7.
- Repoint importers (app, `4-tests`, `loadTimingWriter.integ`, `DemoInitializer.tsx`) to `"miroir-react"`; export `usePageConfiguration`, `fetchMiroirAndAppConfigurations`, `useConfigurationService`, `markPageConfigurationsLoaded`.
- Move the `ConfigurationService` entry of `eslint-suppressions.json`; add `packages/miroir-react/src/{services,loadTimings,auth}/**/*.ts` to the `VIEW` glob.
- Add nonreg step `unit-633-app-shell`.
- Apply slice 0's mock decision.

### Refactor checkpoint

`services/index.ts` re-exports only; if `index.ts` exports the names directly, delete it.

### Validation

```bash
npm run build -w miroir-react
npm run testByFile -w miroir-react -- loadTimingSink.633.phase1
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- loadTimingWriter.integ loadTimingContract loadTimingRecorder loadTimingsSwitch
python -m pytest scripts/tests -q
npm run build -w miroir-sandbox
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-sandbox/tsconfig.json
npm run lint
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,tooling
```

### Realization

- `services/ConfigurationService.ts` and `usePageConfiguration.ts` moved with `git mv`; `services/index.ts` deleted (the package `index.ts` exports the names). Their `from "miroir-react"` imports were rewritten by [`rewrite_self_imports.mjs`](rewrite_self_imports.mjs) (TypeScript checker, follows the re-exports of `index.ts`), which the next slices reuse.
- `loadTimings/loadTimingMarkSink.ts` added; the app's `index.tsx` calls `setLoadTimingMarkSink(loadTimingMark)` right after its imports. **Deviation:** no `registerLoadTimingSink.ts` module: the test registers its own sink through `setLoadTimingMarkSink`, so a one-line app module would only wrap the call.
- RED → GREEN: `loadTimingWriter.integ` failed with `setLoadTimingMarkSink is not a function`, then passed (marks contain `configurationsLoaded`); `loadTimingSink.633.phase1.unit` 3/3.
- Importers repointed to `"miroir-react"`: 13 app modules, `DemoInitializer.tsx` (sandbox), `loadTimingWriter.integ`.
- The 9 dead `JsonDisplayHelper` mocks removed (slice 0 measurement).
- `scripts/tests/test_shell_package_boundaries.py::test_no_self_import` added; nonreg step `unit-633-app-shell` added.
- Lint: the `ConfigurationService` suppression moved; `VIEW` gains `packages/miroir-react/src/services/**/*.ts`.
- Checks: `tsc` miroir-react clean; the app and the sandbox keep the 27 MUI typing errors they have on `_integration` (counted on a stash of the branch), none in a changed line. Lint, pytest (339), sandbox build pass. Bundle guard: 0 violations, 69 eager chunks, 841,405 bytes (2 chunks fewer than the baseline).
- Scoped nonreg (`smoke,ui,tooling`, snapshot `20261031T135730Z`): 122 pass, 2 fail on stale builds of `miroir-env` and `miroir-example-library` (dist from before #632). After rebuilding them both pass (snapshot `20261031T140526Z`).

---

## Slice 2 — Runners from miroir-react, MCP call injected, stored runner built in

**Status:** ✅ DONE

### Goal

A report with a `storedRunner` section shows the runner in a client that registers no renderer (D8). An MCP-tool runner submits through the host's `runMcpTool` and reports `FeatureUnavailable` without it (D2).

### RED

- `tests/4_view/issues/633-app-shell-to-react/storedRunnerDefault.633.phase2.integ.test.tsx` (vitest: React rendering of a Report section):
  - with no `ReportSectionRenderersProvider`, and with `renderers={{}}`, the Report that holds a `storedRunner` section shows the runner's form, not `unsupported-report-section`. Fails today (the default is `{}`).
  - with `processCapabilities.mcp === true` (`StoredRunnerView` renders nothing otherwise, `RunnerView.tsx` line 359), submitting an MCP-tool runner without `MiroirShellHostContext` shows the `FeatureUnavailable` action error; with a `runMcpTool` slot, submit calls the slot once with the runner's arguments.

### GREEN

- Add `contexts/MiroirShellHostContext.tsx` (provider, hook, defaults, `McpToolRunnerEnvelope`); `runMcpToolRunner.ts` imports the type from `"miroir-react"`.
- `git mv` `RunnerView`, `RunnersList`, the five `Runner_*`, `resolveMcpToolAction`, `SequenceEditor` and `routes/Runners`; relative imports; Emotion pragma on `SequenceEditor.tsx`; `RunnerView`'s submit uses `useMiroirShellHost().runMcpTool`.
- Context default and provider merge carry `storedRunner: lazy(() => import("../components/Runners/RunnerView.js"))`; export `defaultReportSectionRenderers`; the app's registry drops `storedRunner`.
- App `index.tsx` and the MiroirTest providers (`componentTestTools.tsx`) provide `runMcpTool: async (...a) => (await import(".../runMcpToolRunner.js")).runMcpToolRunner(...a)`.
- Shim `routes/Runners.tsx` in the app; repoint `TransformerBuilderPage.tsx` (still in the app), `4-tests/componentTests/sequenceEditorForTest.tsx` and `4-tests` users of `buildCreateApplicationStorageSchema` and `resolveMcpToolAction`.
- Move the `RunnerView` suppression; update the guards on these files (`mcpToolRunner.253.*`, `processCapabilitiesMcp.273.phase6` and the rest found by the base-name grep).

### Refactor checkpoint

Update the registry comment in `ReportSectionRenderersContext.tsx` (three app-provided kinds). `miroir-mcp/client` stays out of the eager chunks.

### Validation

```bash
npm run build -w miroir-react
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- storedRunnerDefault.633.phase2 mcpToolRunner.253 processCapabilitiesMcp.273
npm run testMiroir -w miroir-standalone-app -- --suites ui.blockEditing --mode integration
npm run build -w miroir-sandbox
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-sandbox/tsconfig.json
npm run lint && python -m pytest scripts/tests -q
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,runners --only unit-610-report-section-renderers
```

### Realization

- Moved with `git mv`: `RunnerView`, `RunnersList`, the five `Runner_*`, `resolveMcpToolAction`, `SequenceEditor` (already carried the Emotion pragma), `routes/Runners` (shim left in the app). Logger constants rewritten by [`fix_moved_constants.py`](fix_moved_constants.py), self-imports by `rewrite_self_imports.mjs` (now follows re-exports of dependency symbols to the package module that re-exports them, and writes nothing when a name does not resolve).
- `contexts/MiroirShellHostContext.tsx`: `MiroirShellHostProvider`, `useMiroirShellHost`, `mcpToolUnavailable`, `McpToolRunnerEnvelope`, `RunMcpTool`. `RunnerView` submits through `useMiroirShellHost().runMcpTool`; `browserMcpServerUrl` comes from `miroir-core`.
- `defaultReportSectionRenderers` (stored runner) is the context default and the base the provider merges the application's renderers over. The app's `appReportSectionRenderers` drops `storedRunner`; the app's `appShellHost` (in `reportSectionRenderers.tsx`) fills `runMcpTool` with an `import()` of `runMcpToolRunner`, provided in `index.tsx` and `componentTestTools.tsx`.
- **Deviation:** the RED test is a `miroir-react` unit test, `storedRunnerDefault.633.phase2.unit.test.tsx` (3 of 5 cases failed before the change, 5/5 after): the context wiring is the new behaviour, and a stored runner inside a Report is already rendered by `multistepProcess.274.integ` and the `ui.blockEditing` suite, which now go through the default.
- Repointed: `TransformerBuilderPage`, `sequenceEditorForTest`, `processCapabilitiesPicker.273.phase4`, `mcpToolRunner.253.phase0` (import and source path), `processCapabilitiesMcp.273.phase6` (source path). `RunnerTestSession` keeps calling the app's `runMcpToolRunner`.
- Checks: app runner tests 42/42 (`mcpToolRunner.253`, `processCapabilities*.273`, `multistep*.274`), `ui.blockEditing` 56/56, `tsc` (miroir-react clean, app unchanged at 27), lint, pytest 339, sandbox build. Bundle guard 0 violations, 70 eager chunks, 842,765 bytes (+1.4 kB, the host context and the registry default); `miroir-mcp/client` stays in the lazy `runMcpToolRunner` chunk and `RunnerView` in a lazy chunk.
- Scoped nonreg (`smoke,ui,runners` + `unit-610`, `unit-633`): 53/53 pass (snapshot `20261031T142215Z`).

---

## Slice 3 — Login from miroir-react, Electron login injected

**Status:** ✅ DONE

### Goal

`LoginPage` lives in `miroir-react` and logs in over HTTP by default; the app's Electron build logs in through `requestLoginToken` (D5).

### RED

- `tests/4_view/issues/633-app-shell-to-react/loginTransport.633.phase3.integ.test.tsx` (vitest: React page with a host slot): `LoginPage` from `"miroir-react"` with a `requestLoginToken` slot calls the slot with the typed credentials and stores the token; without the slot it posts to `/auth/login` (the test stubs `globalThis.fetch` itself and restores it).

### GREEN

- Add `auth/httpLogin.ts` (`requestLoginTokenOverHttp`, `fetchAuthenticationEnabledOverHttp`); `git mv routes/LoginPage` with a shim; relative imports.
- `authTransport.ts` keeps the Electron branch and delegates the browser branch to `miroir-react`; the app fills `requestLoginToken`.
- Update the guards: `electronIpcProxyAuth.263.phase6` (app), `authentication.71.*` (miroir-core) where they read moved paths; move the `authTransport` suppression to whichever file keeps the lines.

### Refactor checkpoint

No browser login code left in `authTransport.ts`.

### Validation

```bash
npm run build -w miroir-react
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- loginTransport.633.phase3 electronIpcProxyAuth.263
npm run testByFile -w miroir-core -- authentication.71
npm run build -w miroir-sandbox
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-sandbox/tsconfig.json
npm run lint
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,tooling --only unit-345-electron
```

### Realization

- `auth/httpLogin.ts` (`requestLoginTokenOverHttp`, `fetchAuthenticationEnabledOverHttp`) in `miroir-react`; `authTransport.ts` keeps the Electron branch and delegates the browser one, so the fetch calls exist once. Its `component-io` suppression (the two fetch calls) is pruned.
- `MiroirShellHostContext` gains `requestLoginToken` (default: over HTTP). `LoginPage` moved (shim left in the app) and logs in through `useMiroirShellHost().requestLoginToken`; the app's `appShellHost` gives its `requestLoginToken` (IPC in Electron, HTTP otherwise).
- **Deviation:** the RED test is a `miroir-react` unit test, `loginTransport.633.phase3.unit.test.tsx` (2 of 3 failed with the previous context, 3/3 after), on the host hook rather than a rendered page: rendering `LoginPage` adds only the form, which did not change.
- Checks: `electronIpcProxyAuth.263.phase6` 5/5, `authentication.71` (miroir-core) 45/45, `tsc` unchanged, lint, sandbox and app builds; bundle guard 0 violations, 69 eager chunks, 842,900 bytes.
- Scoped nonreg (`smoke,ui,tooling` + `unit-345-electron`, `unit-633`, snapshot `20261031T143347Z`): 62 pass, 1 fail: `appstack-uiIntegrationTestLauncher.integ` "runner.returnDocument Return Book", which fails fast (13 s) when it runs after other steps on the shared `test-filesystem` store and passes alone (snapshot `20261031T144147Z`) and in slice 2's run. It touches no moved module; the full nonreg of slice 4 checks it on its own order.

---

## Slice 4 — Generic pages from miroir-react; search opens on the current application

**Status:** ✅ DONE

### Goal

Home, settings, search, transformer builder, check, events and error-log pages, `EventTimelineContainer` and `InstanceEditorOutline` live in `miroir-react`, with no dependency on `miroir-example-library` (D4).

### RED

- `tests/4_view/issues/633-app-shell-to-react/searchPageDefault.633.phase4.integ.test.tsx` (vitest: React page state): with no application selected the search page opens on Miroir's `Entity` (fails today: it opens on `entityBook`); with the Library selected it opens on the Library's first entity. `TransformerBuilderPage` with Miroir selected opens on `Entity`.

### GREEN

- `git mv` the pages and the two components, each page with a shim; relative imports; replace the Library constants per D4.
- `homePageLoad.unit.test.ts` (#337 home-page budget) uses the manifest key `miroir-fwk/4_view/routes/HomePage.tsx`; it follows the new key.
- Move suppressions (`ErrorLogsPageDEFUNCT`, `InstanceEditorOutline`); update the source-text guards on the pages (`externalService.unit`, `SettingsPage` and `HomePage` readers from `list_moved_imports.py`).
- Apply slice 0's mock decision for tests that render these pages.

### Refactor checkpoint

No `miroir-example-library` import under `packages/miroir-react/src`.

### Validation

```bash
npm run build -w miroir-react
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- searchPageDefault.633.phase4 externalService.unit
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run testByFile -w miroir-standalone-app -- homePageLoad.unit
npm run build -w miroir-sandbox
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-sandbox/tsconfig.json
npm run lint
npm run nonreg:filesystem -- --runner shared
```

### Realization

- Moved with `git mv`, a shim left at each old path: `HomePage`, `SettingsPage`, `SearchPage`, `TransformerBuilderPage`, `Check`, `pages/MiroirEventsPage`, `ErrorLogsPageDEFUNCT`, `EventTimelineContainer`, `InstanceEditorOutline`; all exported from `index.ts`.
- D4: `routes/applicationDefaults.ts` (`defaultToolApplication`, `defaultToolEntity`). The search page opens on its own selection, then the current application, then Miroir, with that application's deployment and its first entity by name (`Entity` for Miroir); the transformer builder opens on `TransformerDefinition` for Miroir and on the first entity by name otherwise (Library: `Author`, was `Book`). No `miroir-example-library` import is left under `miroir-react/src`.
- **Deviation:** the RED test is a helper test, `toolPageDefaults.633.phase4.unit.test.ts` (5 cases, on the Library's real Entity assets), written with the helper: the pages only pass the helper's result to `EntityInstanceSelectorPanel`, and rendering them needs no new behaviour beyond it.
- **Found:** `miroir-react`'s `tsc` (and its DTS build) reported the MUI 9 type errors the app already had in these files (`Grid item xs=…`, `Typography paragraph`, `ListItem button`, `TextField InputProps`, `Switch inputProps`: v5 props that MUI 9 dropped, so they had no effect at run time). Migrated to the MUI 9 API: `Grid size={{ … }}`, `sx={{ alignItems }}`, `sx={{ mb: 2 }}`, `ListItemButton`, `slotProps`. The app's `tsc` errors fall from 27 to 2 (the two CopilotKit forms, which stay).
- Guards: `processCapabilitiesAi.273.phase5` reads the moved `SettingsPage`; `homePageLoad.unit` keeps the manifest key of the shim (`routes/HomePage.tsx`) and passes (the shim imports the page chunk statically). Suppressions of `ErrorLogsPageDEFUNCT` and `InstanceEditorOutline` moved.
- Checks: `miroir-react` tests 16/16, `homePageLoad` 2/2, `processCapabilitiesAi.273`, `componentTestChunk.286` pass; lint, pytest 339, sandbox build; bundle guard 0 violations, 70 eager chunks, 843,243 bytes. `externalService.unit` and `ReportPage.integ` fail with and without this slice (`reportCountryList is not defined`, a "not supported yet" message): no nonreg step runs them.
- Full nonreg (snapshot `20261031T144853Z`): 118 pass, 2 fail. `apiCallReport-281` passes on rerun (a vitest teardown error, snapshot `20261031T145750Z`). `unit-31-store-section-clear` failed on a stale `miroir-store-indexedDb` build (dist from before #31's fix); it passes after rebuilding that package.

---

## Slice 5 — Model diagram page through the registry

**Status:** ⬜ pending

### Goal

`?page=model` shows the diagram in the app, and `UnsupportedReportSection` in a client that registers no model diagram renderer (D3).

### RED

- `tests/4_view/issues/633-app-shell-to-react/modelDiagramPage.633.phase5.integ.test.tsx` (vitest: React page through the registry): `ModelDiagramPage` from `"miroir-react"` with `renderers={{}}` shows `unsupported-report-section`; with the app's registry it renders the registered view. `miroir-diagram-class` is mocked at its entry with a factory, replacing the 9 path mocks (happy-dom cannot load `svg-toolbelt`).

### GREEN

- `git mv routes/ModelDiagramPage` to `miroir-react` with a shim; it renders `useReportSectionRenderers().modelDiagramReportSection`.
- `git mv components/Reports/ModelDiagramReportSectionView` to `miroir-diagram-class/src/`; export it; its `packageName`/`cleanLevel` come from `miroir-diagram-class`.
- App registry: `modelDiagramReportSection: lazy(async () => ({ default: (await import("miroir-diagram-class")).ModelDiagramReportSectionView }))`.
- The 9 tests mock `"miroir-diagram-class"` instead of the path. Move the `ModelDiagramPage` suppression.

### Refactor checkpoint

`miroir-diagram-class`, `mermaid` and `svg-toolbelt` stay out of the eager chunks.

### Validation

```bash
npm run build -w miroir-react && npm run build -w miroir-diagram-class
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- modelDiagramPage.633.phase5
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-diagram-class/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-sandbox/tsconfig.json
npm run lint
npm run build -w miroir-sandbox
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

### Realization

_(to fill)_

---

## Slice 6 — Shell from miroir-react; sandbox without the alias

**Status:** ⬜ pending

### Goal

`RootComponent`, `AppBar`, `PageDispatcher` and the AI pick helpers live in `miroir-react`; the app mounts the assistant through `assistantPanel`; the sandbox builds from library packages, registers the model diagram from `miroir-diagram-class`, and has no `@miroir-app` alias (G1, G3).

### RED

- `scripts/tests/test_shell_package_boundaries.py::test_sandbox_has_no_app_alias` (pytest: a build-configuration fact): no `@miroir-app` alias in `miroir-sandbox/vite.config.js`, no `@miroir-app` path in its `tsconfig.json`, no `@miroir-app` import in `src/`. Fails today.
- `tests/4_view/issues/633-app-shell-to-react/assistantPanel.633.phase6.integ.test.tsx` (vitest: React shell): `RootComponent` without `assistantPanel` mounts no assistant when the AI AppBar button is used; with the slot it mounts the slot's component.

### GREEN

- `git mv` `PageDispatcher`, `RootComponent`, `AppBar`, `routes/ai/miroirAiBackend`, `routes/ai/agentBackendPick`; relative imports; lazy page imports become relative inside the package; delete the shims; `RootComponent` reads `assistantPanel` instead of importing `AgentsCopilotKit`.
- App `index.tsx`: `assistantPanel: lazy(() => import("./miroir-fwk/4_view/routes/ai/AgentsCopilotKit.js"))`.
- Sandbox: imports from `"miroir-react"`, provides `ReportSectionRenderersProvider` with `modelDiagramReportSection` from `miroir-diagram-class`, adds `miroir-diagram-class` to its dependencies, drops the alias and the path.
- Repoint the importers from slice 0's list; move the `RootComponent` suppression; update the guards on these files, including `secrets.270.phase0` (miroir-core, reads `PageDispatcher.tsx`), `cursorSdk.275.*`, `processCapabilities*.273.*` and the `AppBar` readers (6 files).
- `packages/miroir-react/tests/shellExports.unit.test.ts`: every symbol of slice 0's list, plus `ErrorPage` and `defaultReportSectionRenderers`, is exported from `miroir-react`.

### Refactor checkpoint

`4_view` holds only the modules of analysis §5.3 (`survey_shell_modules.py`).

### Validation

```bash
npm run build -w miroir-react
python -m pytest scripts/tests -q
npm run testByFile -w miroir-react -- shellExports
MIROIR_ENV=test-filesystem npm run testByFile -w miroir-standalone-app -- assistantPanel.633.phase6
npm run test -w miroir-core -- ''
npm run build -w miroir-sandbox
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-sandbox/tsconfig.json
npm run lint
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run testByFile -w miroir-standalone-app -- homePageLoad.unit
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,tooling --only unit-435-test-sandbox-header,unit-443-test-sandbox-play-pause
```

Sandbox page smoke (tracer check, Playwright from Python): `vite preview` of the sandbox build, then load home, settings, search, runners, events, check and `?page=model`; each renders without an error boundary. The script lives in this folder (`sandbox_page_smoke.py`) and its output goes in the Realization.

### Realization

_(to fill)_

---

## Slice 7 — Lint boundary rule, nonreg, bundle guard, docs, cleanup, AC

**Status:** ⬜ pending

### Goal

The package boundary is enforced by lint, the issue tests are folded into feature suites, and the docs follow the paths.

### RED

- `eslint-rules/react-package-boundary.test.mjs` (`node --test`, added to the root `lint` script, which lists its test files): a file under `packages/miroir-react/src/` importing `@copilotkit/react-core`, `electron`, `miroir-mcp`, `miroir-mcp/client`, `miroir-diagram-class` or a path into `miroir-standalone-app` is an error; a `@miroir-framework/jzod` import there is still an error.

### GREEN

- `eslint.config.mjs`: a `no-restricted-imports` block for `packages/miroir-react/src/**` with those names and patterns. Flat config replaces a rule's options per file, so the block repeats the `@miroir-framework/jzod` restrictions (`ml-adapter-imports.test.mjs` asserts them on `packages/miroir-react/src`).
- `bundle-policy.json` `forbiddenEager` gains `d3*`, `diff`, `miroir-mcp`, `miroir-diagram-class`, `mermaid`, `svg-toolbelt`.
- Fold `tests/4_view/issues/633-app-shell-to-react/` into feature-named tests (`storedRunnerDefault` beside the report section renderer tests, `loginTransport` beside `electronIpcProxyAuth`, `searchPageDefault` and `modelDiagramPage` under `tests/4_view/`, `assistantPanel` beside the `AppBar` tests); delete the directory; point `unit-633-app-shell` at them.
- Docs: `docs/internals/application-startup.md`, `code-splitting.md`, `report-display.md`, `docs/reference/load-timings.md` (sink); the epic plan's I2 rows; the #13 Q1-a revision note.

### Validation

```bash
npm run lint
python scripts/sync_agent_skills.py --check && python -m pytest scripts/tests -q && python scripts/check_dependency_policy.py
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json && npm run test -w miroir-core -- ''
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run build -w miroir-standalone-app-electron && python scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json
npm run nonreg:filesystem -- --runner shared
```

### Tracer narrative

Manual: `npm run dev -w miroir-sandbox`, open home, settings, search, runners and `?page=model`; each renders. Automated equivalent: `build-633-sandbox` and `sandbox_page_smoke.py`.

### AC checklist

| Acceptance criterion (#633) | Proof |
|---|---|
| `miroir-react` exports `RootComponent`, `ErrorPage`, `PageDispatcher`, the route pages and `reportSectionRenderers` | `shellExports.unit.test.ts`. `reportSectionRenderers` is exported as `defaultReportSectionRenderers` (the built-in `storedRunner`); the app's graph and MiroirTest renderers stay in the app (D1, D8) |
| No module of `miroir-react` imports `4-tests/componentTests`, Electron, the auth transport or `@copilotkit/*`; a lint rule enforces it | slice 7 lint block and `react-package-boundary.test.mjs` |
| `miroir-sandbox` has no `@miroir-app` alias or path and builds | `test_shell_package_boundaries.py`, `build-633-sandbox` |
| The app and Electron behave as before: UI suites, `unit-435`, `unit-443`, `unit-610` pass; bundle within the #337 budget | full `nonreg:filesystem`, both bundle guards, `homePageLoad.unit` |
| ag-grid, d3 and `diff` stay out of the eager chunks | bundle guard: `ag-grid-*` already in `forbiddenEager`; slice 7 adds `d3*` and `diff` (they are not in the `eager` allowlist today, so an eager load already fails) |

### Realization

_(to fill)_

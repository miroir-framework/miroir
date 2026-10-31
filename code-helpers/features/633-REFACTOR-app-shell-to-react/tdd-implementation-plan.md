# Issue #633 — TDD Implementation Plan

> Vertical slices (RED → GREEN each), integration first, no new mocks. The tests render the moved modules through the `miroir-react` package entry, with the real local cache and the `RestClientStub` emulated server of the standalone app's test rig (`tests/4_view`, `componentTestTools.tsx`), and build the sandbox with Vite. The applicative surfaces are the existing Reports and Runners (a `storedRunner` section, the model diagram section, the `?page=` routes). The tracer bullet proves that a client service moved to `miroir-react` still feeds the app's load timings and the sandbox through the package entry.
>
> **Execution model:** each slice ends with its Validation commands; on success its Realization is appended and its Status flips to ✅ DONE. The user asked for the whole issue through to a PR ready to merge, so commits follow each green slice on the working branch.
>
> **Resume note:** slices run in order. Slice 0 first.

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
| 0 | Characterize: sandbox build, failing guard, mocks, export surface, bundle baseline | ⬜ | `sandboxBuild.633.phase0` nonreg step, `mcpToolRunner.253.phase0` green, mock measurement in Realization |
| 1 | Tracer: client services and the load-timing sink from `miroir-react` | ⬜ | `loadTimingSink.633.phase1.unit`, `loadTimingContract.unit`, sandbox build |
| 2 | Runners from `miroir-react`, MCP call injected, stored runner built in | ⬜ | `storedRunnerDefault.633.phase2.integ`, `mcpToolRunner.253.*` |
| 3 | Login from `miroir-react`, Electron login injected | ⬜ | `loginTransport.633.phase3.integ`, `authentication.71.*` |
| 4 | Generic pages from `miroir-react`; search opens on the current application | ⬜ | `searchPageDefault.633.phase4.integ` |
| 5 | Model diagram page through the registry; view in `miroir-diagram-class` | ⬜ | `modelDiagramPage.633.phase5.integ` |
| 6 | Shell from `miroir-react`, assistant injected; sandbox without the alias | ⬜ | `sandboxNoAppAlias` guard, sandbox build, `unit-435`, `unit-443` |
| 7 | Lint layer rule, nonreg, bundle guard, docs, cleanup, AC | ⬜ | lint, full `nonreg:filesystem`, `check_bundle_policy.py` |

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
| D8 | `storedRunner` is a built-in lazy default renderer of `ReportSectionRenderersProvider` | G1, G3 |

---

## Allocated keys

| Artefact | Value |
|---|---|
| Issue test directory | `packages/miroir-standalone-app/tests/4_view/issues/633-app-shell-to-react/` |
| Nonreg step: sandbox build | `build-633-sandbox` (tier `default`, scopes `ui`, `tooling`) |
| Nonreg step: issue tests | `unit-633-app-shell` (tier `default`, scopes `ui`), folded into feature suites in slice 7 |
| Sandbox source guard | `scripts/tests/test_sandbox_sources.py` |
| Export surface check | `packages/miroir-react/tests/shellExports.unit.test.ts` |
| Host context module | `packages/miroir-react/src/contexts/MiroirShellHostContext.tsx` |
| Load-timing sink module | `packages/miroir-react/src/loadTimings/loadTimingMarkSink.ts` |
| Browser login module | `packages/miroir-react/src/auth/httpLogin.ts` |

No model element and no MiroirTest asset is added: the behaviours are React rendering and build wiring, which MiroirTest cannot reach without the shell being built (vitest exception, one sentence per file below).

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Rebuild after a move | `npm run build -w miroir-react` (and `-w miroir-diagram-class` in slice 5) |
| App UI test by file | `RUN_TEST=<name> npm run testByFile -w miroir-standalone-app -- <name>` |
| Package unit test | `npm run testByFile -w miroir-react -- <name>` |
| Sandbox build | `npm run build -w miroir-sandbox` |
| Sandbox tests | `npm run nonreg:filesystem -- --runner shared --only unit-435-test-sandbox-header --only unit-443-test-sandbox-play-pause` |
| Bundle guard | `npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` (miroir-react, miroir-standalone-app, miroir-sandbox, miroir-diagram-class) |
| Lint | `npm run lint` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,ui[,runners,tooling]` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

---

## Slice 0 — Characterize

**Status:** ⬜ pending

### Goal

A safety net before any move: the sandbox build is fixed and checked, the guard that already fails is fixed, the effect of the mocks that the move changes is known, and the bundle baseline is recorded.

### Steps

1. **Sandbox build.** Commit `import { ErrorPage } from "miroir-react"` in `miroir-sandbox/src/index.tsx`. Add nonreg step `build-633-sandbox` running `npm run build -w miroir-sandbox` (needs built packages; scopes `ui`, `tooling`). The step is the regression proof: it fails on `_integration` (analysis §4.5) and passes here.
2. **Failing guard.** `mcpToolRunner.253.phase0.unit.test.ts` expects `resolveMcpToolAction.ts` to import `miroir-mcp/client`; #627 removed that import. Change the assertion to what #627 made true (`resolveMcpToolAction.ts` imports no `miroir-mcp` subpath; `runMcpToolRunner.ts` imports `miroir-mcp/client`). RED is today's failure.
3. **Mock measurement.** Run the 9 `JsonDisplayHelper` mock files (analysis §4.6) once with the mock removed, without committing. Record pass or fail and duration for each in the Realization. If all pass within their timeout, slice 1 removes the mocks; otherwise the slice that moves the affected module replaces the mock with a mock of the same `"miroir-react"` export at the consumer (the app keeps `ReportPage` and `AiActionsProvider`), and the Realization says which.
4. **Export surface.** Generate, with a Python helper in this folder (`list_moved_imports.py`), the list of symbols that modules outside the moved set (app `src`, `tests`, the sandbox, Electron) import from each moved module. The list feeds the `index.ts` exports of each slice and `shellExports.unit.test.ts`.
5. **Bundle baseline.** Build the standalone app and keep the `check_bundle_policy.py` report and the eager chunk list in the Realization.

### Validation

```bash
npm run build -w miroir-sandbox
RUN_TEST=mcpToolRunner.253.phase0 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253.phase0
python -m pytest scripts/tests -q
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py
```

### Realization

_(to fill)_

---

## Slice 1 — Tracer: client services and the load-timing sink from miroir-react

**Status:** ⬜ pending

### Goal

`services/ConfigurationService`, `services/usePageConfiguration` and `services/index` live in `miroir-react` and are imported from its entry by the app, `4-tests`, the tests and the sandbox's `DemoInitializer.tsx`. The app's load timings still record `configurationsLoaded`.

### RED

- `packages/miroir-react/tests/loadTimingSink.633.phase1.unit.test.ts` (vitest: package-internal module state, no Report reaches it): `loadTimingMark("x")` before any sink is a no-op; after `setLoadTimingMarkSink(fn)` it calls `fn("x")` once.
- `tests/4_view/loadTimings/loadTimingContract.unit.test.ts` gains a case: the app's startup module registers its `loadTimingMark` as the `miroir-react` sink, and a `fetchMiroirAndAppConfigurations` call through `"miroir-react"` records `configurationsLoaded`. Fails until the sink exists.

### GREEN

- Add `loadTimings/loadTimingMarkSink.ts`; export both functions.
- `git mv` the three services; `ConfigurationService` calls the package's `loadTimingMark`; loggers per D7.
- App `index.tsx`: `setLoadTimingMarkSink(loadTimingMark)` right after the `loadTimingBrowser` import, before the first configuration fetch.
- Repoint importers (app, `4-tests`, tests, `DemoInitializer.tsx`) to `"miroir-react"`; export `usePageConfiguration`, `fetchMiroirAndAppConfigurations`, `useConfigurationService`, `markPageConfigurationsLoaded` and the rest of slice 0's list for these modules.
- Move the `ConfigurationService` entry of `eslint-suppressions.json`; add `packages/miroir-react/src/services/**/*.ts` to the `VIEW` glob.
- Update the source-text guards that read these files.

### Refactor checkpoint

`services/index.ts` re-exports only; if the package `index.ts` exports the same names directly, delete it.

### Validation

```bash
npm run build -w miroir-react
npm run testByFile -w miroir-react -- loadTimingSink.633.phase1
RUN_TEST=loadTimingContract npm run testByFile -w miroir-standalone-app -- loadTimingContract
npm run build -w miroir-sandbox
npx tsc --noEmit --skipLibCheck -p packages/miroir-react/tsconfig.json && npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run lint
npm run nonreg:filesystem -- --runner shared --scope smoke,ui,tooling
```

### Realization

_(to fill)_

---

## Slice 2 — Runners from miroir-react, MCP call injected, stored runner built in

**Status:** ⬜ pending

### Goal

A report with a `storedRunner` section shows the runner in a client that registers no renderer (D8). Runners that call an MCP tool use the host's `runMcpTool` and answer `FeatureUnavailable` without it (D2).

### RED

- `tests/4_view/issues/633-app-shell-to-react/storedRunnerDefault.633.phase2.integ.test.tsx` (vitest: React rendering of a Report section): a `ReportSectionRenderersProvider` with `renderers={{}}` around the Report that holds a `storedRunner` section shows the runner's form, not `unsupported-report-section`. Fails today (the default is `{}`).
- Same file: an MCP-tool runner rendered without `MiroirShellHostContext` returns the `FeatureUnavailable` envelope; with a `runMcpTool` slot it calls the slot once with the runner's arguments.

### GREEN

- Add `contexts/MiroirShellHostContext.tsx` (provider, hook, defaults, `McpToolRunnerEnvelope`); `runMcpToolRunner.ts` imports the type from `"miroir-react"`.
- `git mv` `RunnerView`, `RunnersList`, the five `Runner_*`, `resolveMcpToolAction`, `SequenceEditor` and `routes/Runners`; `RunnerView` reads `runMcpTool` from the context.
- `ReportSectionRenderersProvider` merges its `renderers` over the built-in `storedRunner` default; the app's registry drops `storedRunner`.
- App `index.tsx` and the MiroirTest providers (`componentTestTools.tsx`) provide `runMcpTool: async (...a) => (await import(".../runMcpToolRunner.js")).runMcpToolRunner(...a)`.
- `PageDispatcher` (still in the app) imports `Runners` lazily from `"miroir-react"` for this slice only; slice 6 makes the import relative again.
- Move the `RunnerView` suppression; update guards (`mcpToolRunner.253.*`, `processCapabilities*.273.*`).

### Refactor checkpoint

Update the registry comment in `ReportSectionRenderersContext.tsx` (three app-provided kinds). Check that `miroir-mcp/client` is absent from the eager chunks.

### Validation

```bash
npm run build -w miroir-react
RUN_TEST=storedRunnerDefault.633.phase2 npm run testByFile -w miroir-standalone-app -- storedRunnerDefault.633.phase2
RUN_TEST=mcpToolRunner.253 npm run testByFile -w miroir-standalone-app -- mcpToolRunner.253
npm run nonreg:filesystem -- --runner shared --only unit-610-report-section-renderers --scope smoke,ui,runners
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py
```

### Realization

_(to fill)_

---

## Slice 3 — Login from miroir-react, Electron login injected

**Status:** ⬜ pending

### Goal

`LoginPage` lives in `miroir-react` and logs in over HTTP by default; the app's Electron build logs in through `requestLoginToken` (D5).

### RED

- `tests/4_view/issues/633-app-shell-to-react/loginTransport.633.phase3.integ.test.tsx` (vitest: React page with a host slot): `LoginPage` from `"miroir-react"` with a `requestLoginToken` slot calls the slot with the typed credentials and stores the token; without the slot it posts to `/auth/login` (the test rig's fetch stub of `authentication.71`).

### GREEN

- Add `auth/httpLogin.ts` (`requestLoginTokenOverHttp`, `fetchAuthenticationEnabledOverHttp`); `git mv routes/LoginPage`.
- `authTransport.ts` keeps the Electron branch and delegates the browser branch to `miroir-react`; the app fills `requestLoginToken` with its `requestLoginToken`.
- Update `authentication.71.*` guards; move the `authTransport` suppression to whichever file keeps the lines.

### Refactor checkpoint

No browser login code left in `authTransport.ts`.

### Validation

```bash
npm run build -w miroir-react
RUN_TEST=loginTransport.633.phase3 npm run testByFile -w miroir-standalone-app -- loginTransport.633.phase3
RUN_TEST=authentication.71 npm run testByFile -w miroir-standalone-app -- authentication.71
npm run nonreg:filesystem -- --runner shared --only unit-345-electron --scope smoke,ui,tooling
```

### Realization

_(to fill)_

---

## Slice 4 — Generic pages from miroir-react; search opens on the current application

**Status:** ⬜ pending

### Goal

Home, settings, search, transformer builder, check, events and error-log pages, `EventTimelineContainer` and `InstanceEditorOutline` live in `miroir-react`, with no dependency on `miroir-example-library` (D4).

### RED

- `tests/4_view/issues/633-app-shell-to-react/searchPageDefault.633.phase4.integ.test.tsx` (vitest: React page state): with the Library deployed and selected as current application, the search page opens on the Library's first entity; with no application selected it opens on Miroir's `Entity`. The second case fails today (it opens on `entityBook`).
- Same file: `TransformerBuilderPage` with the Miroir application selected opens on `Entity`.

### GREEN

- `git mv` the pages and the two components; replace the Library constants per D4.
- `PageDispatcher` imports them lazily from `"miroir-react"` until slice 6.
- Repoint the 13 route-test imports (except `ReportPage`); move suppressions (`ErrorLogsPageDEFUNCT`, `InstanceEditorOutline`).
- Apply slice 0's mock decision for the tests that render these pages.

### Refactor checkpoint

`grep` for `miroir-example-library` in `packages/miroir-react/src`: none. Drop `miroir-example-library` from `miroir-react` dev dependencies if a test only needed it there.

### Validation

```bash
npm run build -w miroir-react
RUN_TEST=searchPageDefault.633.phase4 npm run testByFile -w miroir-standalone-app -- searchPageDefault.633.phase4
npm run test -w miroir-standalone-app -- tests/4_view/routes
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

Full nonreg after this slice (slices 2 to 4).

### Realization

_(to fill)_

---

## Slice 5 — Model diagram page through the registry

**Status:** ⬜ pending

### Goal

`?page=model` shows the diagram in the app, and `UnsupportedReportSection` in a client that registers no model diagram renderer (D3).

### RED

- `tests/4_view/issues/633-app-shell-to-react/modelDiagramPage.633.phase5.integ.test.tsx` (vitest: React page through the registry): `ModelDiagramPage` from `"miroir-react"` with `renderers={{}}` shows `unsupported-report-section`; with the app's registry it renders the registered view. `miroir-diagram-class` is mocked at its entry, the replacement for the 9 path mocks (happy-dom cannot load `svg-toolbelt`).

### GREEN

- `git mv routes/ModelDiagramPage` to `miroir-react`; it renders `useReportSectionRenderers().modelDiagramReportSection`.
- `git mv components/Reports/ModelDiagramReportSectionView` to `miroir-diagram-class/src/`; export it; its `packageName`/`cleanLevel` come from `miroir-diagram-class`.
- App registry: `modelDiagramReportSection: lazy(async () => ({ default: (await import("miroir-diagram-class")).ModelDiagramReportSectionView }))`.
- The 9 tests change their path mock to `vi.mock("miroir-diagram-class", …)`.
- Move the `ModelDiagramPage` suppression.

### Refactor checkpoint

`miroir-diagram-class` stays out of the eager chunks (bundle guard).

### Validation

```bash
npm run build -w miroir-react && npm run build -w miroir-diagram-class
RUN_TEST=modelDiagramPage.633.phase5 npm run testByFile -w miroir-standalone-app -- modelDiagramPage.633.phase5
npx tsc --noEmit --skipLibCheck -p packages/miroir-diagram-class/tsconfig.json
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

### Realization

_(to fill)_

---

## Slice 6 — Shell from miroir-react; sandbox without the alias

**Status:** ⬜ pending

### Goal

`RootComponent`, `AppBar`, `PageDispatcher` and the AI pick helpers live in `miroir-react`; the app mounts the assistant through `assistantPanel`; the sandbox builds from library packages with its graph-free renderer registry (model diagram from `miroir-diagram-class`) and no `@miroir-app` alias (G1, G3).

### RED

- `scripts/tests/test_sandbox_sources.py` (pytest: a build-configuration fact): `miroir-sandbox` has no `@miroir-app` alias in `vite.config.js`, no `@miroir-app` path in `tsconfig.json`, and no `@miroir-app` import in `src/`. Fails today.
- `tests/4_view/issues/633-app-shell-to-react/assistantPanel.633.phase6.integ.test.tsx` (vitest: React shell): `RootComponent` without `assistantPanel` renders no assistant panel when the AI AppBar button is used; with the slot it mounts the slot's component.

### GREEN

- `git mv` `PageDispatcher`, `RootComponent`, `AppBar`, `routes/ai/miroirAiBackend`, `routes/ai/agentBackendPick`; lazy page imports become relative inside the package; `RootComponent` reads `assistantPanel` from the context instead of importing `AgentsCopilotKit`.
- App `index.tsx`: `assistantPanel: lazy(() => import("./miroir-fwk/4_view/routes/ai/AgentsCopilotKit.js"))`.
- Sandbox: imports from `"miroir-react"`, provides `ReportSectionRenderersProvider` with `modelDiagramReportSection` from `miroir-diagram-class`, adds `miroir-diagram-class` to its dependencies, drops the alias and the path.
- Repoint `AppBar` (7), `PageDispatcher` (2), `RootComponent` (1), `routes/ai` (3) test imports; move the `RootComponent` suppression; update `cursorSdk.275.*`, `processCapabilities*.273.*` and the other guards on these files.
- `shellExports.unit.test.ts` asserts every symbol of slice 0's list is exported from `miroir-react`.

### Refactor checkpoint

`4_view` holds only the modules of analysis §5.3; the survey script's output confirms it.

### Validation

```bash
npm run build -w miroir-react
python -m pytest scripts/tests/test_sandbox_sources.py -q
npm run build -w miroir-sandbox
npm run testByFile -w miroir-react -- shellExports
RUN_TEST=assistantPanel.633.phase6 npm run testByFile -w miroir-standalone-app -- assistantPanel.633.phase6
npm run nonreg:filesystem -- --runner shared --only unit-435-test-sandbox-header --only unit-443-test-sandbox-play-pause --scope smoke,ui,tooling
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py
```

### Realization

_(to fill)_

---

## Slice 7 — Lint layer rule, nonreg, bundle guard, docs, cleanup, AC

**Status:** ⬜ pending

### Goal

The package boundary is enforced by lint, the issue tests are folded into feature suites, and the docs follow the paths.

### RED

- A lint fixture test in `eslint-rules/` (the repo's existing pattern, `*.test.mjs`): a file under `packages/miroir-react/src/` importing `@copilotkit/react-core`, `electron`, `miroir-mcp`, `miroir-mcp/client`, `miroir-diagram-class` or a path into `miroir-standalone-app` is an error.

### GREEN

- `eslint.config.mjs`: a `no-restricted-imports` block for `packages/miroir-react/src/**` with those names and patterns. Flat config replaces a rule's options per file, so the block also repeats the `@miroir-framework/jzod` restrictions.
- Fold `tests/4_view/issues/633-app-shell-to-react/` into feature-named tests (`storedRunnerDefault` next to the report section renderer tests, `loginTransport` next to `authentication`, `searchPageDefault` and `modelDiagramPage` under `tests/4_view/routes/`, `assistantPanel` next to the `AppBar` tests); delete the directory; point `unit-633-app-shell` at them or fold it into `unit-610`.
- Docs: `docs/internals/application-startup.md`, `code-splitting.md`, `report-display.md`, `docs/reference/load-timings.md` (sink); epic plan I2 rows and #13 Q1-a note.

### Validation

```bash
npm run lint
python scripts/sync_agent_skills.py --check && python -m pytest scripts/tests -q && python scripts/check_dependency_policy.py
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json && npm run test -w miroir-core -- ''
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py
npm run nonreg:filesystem -- --runner shared
```

### Tracer narrative

Manual: `npm run dev -w miroir-sandbox`, open home, settings, search, runners and `?page=model`; each renders. Automated equivalent: `build-633-sandbox`, `unit-435`, `unit-443`.

### AC checklist

| Acceptance criterion (#633) | Proof |
|---|---|
| `miroir-react` exports `RootComponent`, `ErrorPage`, `PageDispatcher`, the route pages and `reportSectionRenderers` | `shellExports.unit.test.ts`. **Interpretation:** the app's `reportSectionRenderers.tsx` (graph, MiroirTest) stays in the app (D1); `miroir-react` exports the registry provider with its built-in `storedRunner` default (D8) |
| No module of `miroir-react` imports `4-tests/componentTests`, Electron, the auth transport or `@copilotkit/*`; a lint rule enforces it | slice 7 lint block and its fixture test |
| `miroir-sandbox` has no `@miroir-app` alias or path and builds | `test_sandbox_sources.py`, `build-633-sandbox` |
| The app and Electron behave as before: UI suites, `unit-435`, `unit-443`, `unit-610` pass; bundle within budget | full `nonreg:filesystem`, `check_bundle_policy.py` |
| ag-grid, d3 and `diff` stay out of the eager chunks | `check_bundle_policy.py`: `ag-grid-*` is in `forbiddenEager`; d3 and `diff` are not in the `eager` allowlist, so an eager load fails the guard. Slice 7 adds `d3*`, `diff`, `miroir-mcp`, `miroir-diagram-class`, `mermaid` and `svg-toolbelt` to `forbiddenEager` to make the rule explicit |

### Realization

_(to fill)_

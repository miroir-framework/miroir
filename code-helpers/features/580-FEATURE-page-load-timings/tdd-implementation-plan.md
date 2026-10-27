# Issue #580 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> the writer's tests run the real DomainController, local cache and emulated filesystem server of
> `test-filesystem`; the Report is proven by a MiroirTest on fixed instances; the browser wiring is
> proven in a real Chromium on the production build. No mocks. The only injected fakes are the
> clock, the browser event sources and the idle scheduler of the recorder core (time is a boundary).
> The tracer bullet proves that a step record reaches the Meta deployment through the
> DomainController and reads back as a valid `PageLoadMeasurement`.
>
> **Execution model:** A asked for the whole flow without waiting ("implement the slices and add a
> PR for the issue, apply remarks from the greptile review, until the PR is ready to merge. all on
> your own"), so commits are made per slice on the working branch. Each slice ends with its Validation commands; on success
> its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/580
Prerequisite: [`../473-FEATURE-bundle-size-history/`](../473-FEATURE-bundle-size-history/) ✅ · [`../487-FEATURE-client-self-test/`](../487-FEATURE-client-self-test/) ✅
Working branch: `claude/580-page-load-timings`

**Resume note:** see the progress table; Realization notes below each slice.

---

## Adversarial review, round 1

| # | Finding | Change |
|---|---|---|
| 1 | The test seed copies a developer's gitignored rows into `.miroir/test-filesystem` | the writer test counts only the rows of its own `pageLoad` |
| 2 | Copy path is `.miroir/test-filesystem/meta/data/…` | the test reads the folder from the client configuration |
| 3 | The "Meta not loaded" failure case depends on test order | dropped from Slice 1; the stop-after-failure rule is a recorder cycle (Slice 2); "configuration does not list Meta" is a switch case (Slice 3) |
| 4, 5 | Slice 5 misses `reportTestLauncher.unit.test.ts` (report suites regex), `index.d.ts`, `defaultMetaAppModel.reports`, the MiroirTest folder, `docs/reference/testing.md` | added to Slice 5 GREEN |
| 6 | The ML schema lives in miroir-core: only `devBuild -w miroir-core`; zod objects are strict | Slice 3 validation |
| 7 | The tour must wait for `initialLoad` and navigate inside the app | Slice 4 RED |
| 8 | Paths and the first-only `configurationsLoaded` mark | Slice 4 GREEN |
| 9 | Cleanup renames files the manifest names | Slice 6: cleanup before the manifest steps |
| 11 | Resume note; dangling details Report until Slice 5 | resume note; the Report lands in Slice 5 of the same PR |
| 12 | `package-lock.json` changed by a local `npm install` | reverted |
| 13 | Commits per slice | A's request quoted above |

## Scope

- G1 initial load time with milestones (Slices 2, 4)
- G2 first display of each route (Slices 2, 4)
- G3 chunks and data requests per step (Slices 2, 4)
- G4 switch: environment `client.loadTimings`, URL override, off in self-test (Slice 3)
- G5 history in the Meta app: Entity (Slice 1), Report and menu (Slice 5)
- G6 recording does not bias: write rules (Slices 1, 2), lazy Entity (Slice 1), eager footprint (Slices 4, 6)

This plan does **not** measure the Electron main process, gate CI on timings, measure every navigation, or replay past commits (analysis §2).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Lock the Meta contract: Entity, uuids, data folder | ✅ | Meta `modelValidation`; `loadTimingContract.unit` |
| 1 | Tracer: a step record is written to the Meta deployment | ✅ | `loadTimingWriter.integ` |
| 2 | Recorder core: steps, settle, chunks, write window | ✅ | `loadTimingRecorder.unit` |
| 3 | Switch: `client.loadTimings`, URL override, self-test off | ✅ | `loadTimingsSwitch.unit`; miroir-env client config test |
| 4 | Browser wiring: observers, router, marks, Electron | ✅ | `scripts/load-timings.mjs` on the production build; `loadTimingsTour.integ` |
| 5 | Meta Report `PageLoadHistory`, details, menu | ✅ | MiroirTest `report.pageLoadHistory` |
| 6 | Bundle guard, docs, nonreg, AC | ✅ | bundle guard; full `nonreg:filesystem` |

---

## Locked implementation defaults

From the analysis decision record (binding).

| Decision | Choice | Serves |
|---|---|---|
| D1 switch | `client.loadTimings: { enabled, record?, quietWindowMs?, maxStepMs? }` in the environment, copied into `MiroirConfigClient.loadTimings`; `?loadTimings=on\|off` per tab in `sessionStorage` (`miroirLoadTimings`); off by default; off when `selfTest.enabled` | G4 |
| D2 steps | `initialLoad`, `route:<page>` on the first display of a page kind; navigation rules table of analysis D2 | G1, G2 |
| D3 end of step | settle: no DOM mutation on `document.body` (outside `[data-miroir-load-timing-ignore]`), no resource, no request in flight, no `[data-miroir-loading]` element, for 1500 ms; cap 30 s; end = last activity | G1, G2 |
| D4 chunks | Resource Timing entries starting in the step; `.js/.mjs/.css` (+ `/src/**.ts(x)` in dev) chunks; `fetch`/`xmlhttprequest` data requests | G3 |
| D5 storage | Meta Entity `PageLoadMeasurement`, one instance per step, `cacheAllInstancesOnRefresh: false`, folder `.gitkeep`, instance files gitignored | G5, G6 |
| D6 writes | queue; one `createInstance` with all queued steps, when no step is open and after `configurationsLoaded`, 2 s after the last step, in `requestIdleCallback`; `overlapsWrite` on a step that starts during a write; `pagehide` last write | G6 |
| D7 footprint | recorder: no imports, no React; writer: dynamic import; Meta uuids as constants checked against `miroir-app-meta` JSON | G4, G6 |
| D8 target | Meta deployment, when the client configuration lists it; one-entry application map; after `configurationsLoaded`; a failed write stops writing for the session | G4, G5 |
| D9 report | `PageLoadHistory` + `PageLoadMeasurementDetails` + Meta menu item; MiroirTest on fixed instances | G5 |

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Entity `PageLoadMeasurement` | `0266c0b8-4dc8-4a14-bcef-239a85a5de2d` |
| Report `PageLoadHistory` | `02dd2ead-7b8d-4160-99c9-9f4e9a1c051b` |
| Report `PageLoadMeasurementDetails` | `193c3dea-792d-471a-88a0-546e4b5e81cf` |
| MiroirTest | `24f5c213-c384-47b3-9648-0f91ddaa89ee` / `report.pageLoadHistory` |
| TestConfiguration `testConfiguration_metaPageLoadSeed` | `a8dd8a49-97de-426c-beb7-c32d0f1beb26` |
| Seed instances | `8a7af0c0-caca-4d40-8a6c-83ac95992411` (initialLoad), `691c8330-7349-467b-9d28-6e06b7e707ec` (route:report), `36b38f70-b4e9-46cb-85f8-119d77210eb5` (route:model) |
| Seed `pageLoad` | `4278911b-c1cc-46be-8207-e58682e06694` |
| Nonreg steps | `unit-580-load-timings`, `integ-580-load-timing-writer`, `integ-report.pageLoadHistory` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Recorder core, switch (vitest unit) | `npm run testByFile -w miroir-standalone-app -- loadTimingRecorder.580 loadTimingsSwitch.580 loadTimingContract.580` |
| Writer (vitest integ, test-filesystem) | `npm run testByFile -w miroir-standalone-app -- loadTimingWriter.580` |
| Report (MiroirTest integ) | `npm run testMiroir -w miroir-standalone-app -- --suites report.pageLoadHistory --mode integ` |
| Meta deployment validation | `npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts` |
| Schema rebuild | `npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core` |
| Rebuild Meta | `npm run build -w miroir-app-meta` |
| Browser tour | `npm run build -w miroir-standalone-app && npm run build:release -w miroir-server && npm run loadTimings -w miroir-standalone-app -- --serve` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |
| Full nonreg | `npm run nonreg:filesystem -- --runner shared` |

Vitest files live in `packages/miroir-standalone-app/tests/4_view/issues/580-load-timings/`.

---

## Slice 0 — Lock the Meta contract

**Status:** ✅ DONE

### Goal

The `PageLoadMeasurement` Entity exists in the Meta model with its fields (analysis D5 table), `cacheAllInstancesOnRefresh: false`, and its data folder exists on a fresh clone while its instance files stay out of git. The standalone app's Meta constants match the JSON.

### RED

- `tests/4_view/issues/580-load-timings/loadTimingContract.580.unit.test.ts`: imports `miroir-app-meta`'s `entityPageLoadMeasurement` and `selfApplicationMeta`, `deployment_Meta_DO_NOT_USE`, and the standalone constants module `src/loadTimings/loadTimingConstants.ts`; asserts the Entity, SelfApplication and Deployment uuids are equal; asserts the Entity's `cache.cacheAllInstancesOnRefresh` is `false`; asserts a fixture step record (all fields) passes `checkModelValidationInstance` against the Entity's `mlSchema`, and a record without `step` fails.
  Not reachable through MiroirTest: it compares a TypeScript constant of the client with a model asset.
- Meta `modelValidation` (existing test) must still pass with the new Entity.

### GREEN

- `packages/miroir-app-meta/assets/meta_model/16dbfe28-…/0266c0b8-….json` (Entity), added to `Meta.ts` (`entityPageLoadMeasurement`, `defaultMetaAppModel.entities`) and `index.ts`.
- `packages/miroir-app-meta/assets/meta_data/0266c0b8-…/.gitkeep`; `.gitignore`: `packages/miroir-app-meta/assets/meta_data/0266c0b8-4dc8-4a14-bcef-239a85a5de2d/*.json`.
- `src/loadTimings/loadTimingConstants.ts` in the standalone app.

### Refactor checkpoint

The Entity's `viewAttributes` and tag ids follow `BundleSizeMeasurement`; no shared helper needed yet.

### Validation

```bash
npm run build -w miroir-app-meta
npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- loadTimingContract.580
git check-ignore -v packages/miroir-app-meta/assets/meta_data/0266c0b8-4dc8-4a14-bcef-239a85a5de2d/x.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core
```

### Realization

Entity `PageLoadMeasurement` (0266c0b8-…) in the Meta model, lazy (`cacheAllInstancesOnRefresh: false`); data folder kept by a `.gitkeep`, recorded rows gitignored. `loadTimingContract.unit` checks the recorder's step type against the Entity's fields.

---

## Slice 1 — Tracer: a step record reaches the Meta deployment

**Status:** ✅ DONE

### Goal

`writeLoadTimingSteps(domainController, steps)` (writer module `src/loadTimings/loadTimingWriter.ts`) turns finished steps into `PageLoadMeasurement` instances and writes them in one `createInstance` action on the Meta deployment through `DomainController.handleAction`, with the one-entry application map. A failing write returns the error, writes nothing more.

### RED

`tests/4_view/issues/580-load-timings/loadTimingWriter.integ.test.ts` on the test-filesystem platform (pattern of `selfTestPlatform.ts`: `openTestEnvironment("test-filesystem")`, `setupMiroirTest`, `bootEnvironment`, then `fetchMiroirAndAppConfigurations`):

1. writing two steps returns ok, and a `getInstances` on the Meta deployment for the Entity returns both, with their `step`, `durationMs` and `chunks`;
2. the written files are in `.miroir/test-filesystem/…/meta_data/0266c0b8-…/`, one per step;
3. with the Meta deployment removed from the configuration (`applications` filter without Meta), the write returns an `Action2Error` and the writer reports `stopped`.

Not reachable through MiroirTest: the writer is a client module called by the browser recorder, not a model element.

### GREEN

Writer module: instance builder (step → instance with `uuid`, `parentName`, `parentUuid`), `createInstance` action on endpoint `ed520de4-55a9-4550-ac50-b1b713b72a89`, data section, map `{ [META_SELF_APPLICATION]: META_DEPLOYMENT }`.

### Refactor checkpoint

Keep the instance builder pure and exported for the recorder's console output (one shape for both).

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- loadTimingWriter.580
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,actions,ui
```

### Realization

`loadTimingWriter(domainController)` does one `createInstance` per batch on the Meta deployment and returns `{ok}` or `{ok:false,error}`. The integration test filters on its own `page` value, so rows a developer left in the folder do not break it.

---

## Slice 2 — Recorder core

**Status:** ✅ DONE

### Goal

`createLoadTimingRecorder({ now, schedule, write, options })` (`src/loadTimings/loadTimingRecorder.ts`, no imports) takes events (`activity(t)`, `resource(entry)`, `requestStart/End`, `loadingMarker(present)`, `navigate({ page, url, action })`, `mark(name, t)`, `configure(switch)`) and produces finished steps and write calls according to D2, D3, D4, D6. Helper-only coverage: the cycles are grouped in this one slice.

### RED (one cycle each, in `loadTimingRecorder.unit.test.ts`)

1. initial step: settles 1500 ms after the last activity following `firstRender`; `durationMs` = last activity; milestones relative to 0;
2. no settle before `firstRender`, nor while a request is in flight, nor while a loading marker is present;
3. resources starting inside the step are its chunks (`file` without origin or query) or data requests; outside the step are ignored;
4. navigation rules: same page kind → nothing; new page kind → `route:<page>`; seen page kind → open step ends `settled: false`; `REPLACE` during an open step → same step, page updated;
5. cap: a step with activity every 500 ms ends at `maxStepMs` with `settled: false`;
6. write window: no write while a step is open; one write with all queued steps 2 s after the last step and after `configurationsLoaded`, through `schedule`; a step starting during a write has `overlapsWrite: true`;
7. off: with the switch off, `configure` drops the buffered step and nothing is written or exposed; with `record: false`, steps are exposed and not written;
8. a write error stops later writes.

Not reachable through MiroirTest: browser timing events.

### GREEN

Pure state machine; time from `now()`, timers through `schedule(fn, ms)` so tests advance a fake clock.

### Refactor checkpoint

One `Step` type shared with the writer's instance builder; remove any duplicate field mapping from Slice 1.

### Validation

```bash
npm run testByFile -w miroir-standalone-app -- loadTimingRecorder.580
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,ui
```

### Realization

`createLoadTimingRecorder(host)` with injected clock, scheduler and idle callback. The cap ends a step at `start + maxStepMs` exactly. Writes wait until no step is open, `configurationsLoaded` is marked and the page is idle; the first failure stops writing.

---

## Slice 3 — Switch

**Status:** ✅ DONE

### Goal

An environment with `client.loadTimings` gives `MiroirConfigClient.loadTimings` in both client configurations and Electron's; `resolveLoadTimingsSwitch(config, search, storage)` applies the URL override and keeps it per tab, and returns off when `selfTest.enabled`.

### RED

- `packages/miroir-env/tests/loadTimingsClientConfig.unit.test.ts`: a fixture environment with `client.loadTimings` resolves to client configurations (`environmentClientConfig`, `environmentRealServerClientConfig`) that carry it; the shipped environments do not; an invalid value (`enabled: "yes"`) is rejected by `miroir-env check`.
- `tests/4_view/issues/580-load-timings/loadTimingsSwitch.unit.test.ts`: config off + `?loadTimings=on` → on, and stored; later call without the parameter → still on; `?loadTimings=off` → off; config on + self-test → off; defaults of `record`, `quietWindowMs`, `maxStepMs`.

### GREEN

- ML schema: `miroirLoadTimingsConfig` next to `miroirSelfTestConfig`; referenced from `miroirEnvironment.client` and `miroirConfigClient` (`getMiroirFundamentalMlSchema.ts`); schema rebuild.
- `environmentState.ts`: `loadTimingsConfig(resolved)` next to `selfTestConfig`, in both builders.
- Switch function in the recorder module (no imports).

### Refactor checkpoint

`selfTestConfig` and `loadTimingsConfig` become one `clientSwitches(resolved)` copy if the two stay identical in shape.

### Validation

```bash
npm run build -w miroir-app-miroir && npm run devBuild -w miroir-core
npm run build -w miroir-env
npm run testByFile -w miroir-env -- loadTimingsClientConfig
npm run testByFile -w miroir-standalone-app -- loadTimingsSwitch.580
npm run miroir-env -- check --strict
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-env/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

`client.loadTimings` (`miroirLoadTimingsConfig`) in the core schema; miroir-env passes it to the client with `clientSwitches`. `resolveLoadTimingsSwitch`: URL `loadTimings=on|off`, kept in sessionStorage; a self-test run is never measured.

---

## Slice 4 — Browser wiring

**Status:** ✅ DONE

### Goal

With `?loadTimings=on` on the production build served with `dev`, a real Chromium session that opens the home page, then a Library report, then the model page, leaves on `window.__miroirLoadTimings` three settled steps (`initialLoad`, `route:report`, `route:model`) with milestones and chunks, and the Meta deployment holds them.

### RED

- `packages/miroir-standalone-app/scripts/load-timings.mjs`, npm script `loadTimings` (pattern of `self-test.mjs` / `coverage-tour.mjs`, through `serveBuiltClient.mjs`): `--serve`, `--url`, `--pages`, `--out`; prints a table per step; exits 1 when a step is missing or unsettled. It waits until `initialLoad` is settled before it navigates, navigates inside the app (`pushState` + `popstate`, as `coverage-tour.mjs` does; a `page.goto` would start a new page load), and waits for the write before it reads the Meta folder.
- `tests/0_build/loadTimingsTour.integ.test.ts`, on demand (`MIROIR_LOAD_TIMINGS_TOUR=1`, like `coverageTour.integ`): runs the script, asserts the three steps, `route:report` has at least one chunk, `initialLoad.milestones` has `entryScript < configReady < firstRender <= configurationsLoaded`, and the steps landed in the Meta data folder (then removes the files it created).

Not reachable through MiroirTest: real browser timing APIs on the production build.

### GREEN

- `src/loadTimings/loadTimingBrowser.ts` (no package imports): `performance.setResourceTimingBufferSize`, `PerformanceObserver` (resource, buffered), `MutationObserver` on `document.body`, `fetch` wrapper, loading marker check, `requestIdleCallback`, `pagehide`, `window.__miroirLoadTimings`, console line per step; exports `loadTimingMark`, `trackLoadTimingRequest`, `startLoadTimingNavigation(router)`, `configureLoadTimings(config, domainController)`.
- `index.tsx`: first import; marks `configReady` and `firstRender`; `router.subscribe`; configure after `setupClient` with the writer as a dynamic import.
- `CenteredSpinner`: `data-miroir-loading`; `RenderInsightSummary`, `LocalCacheMonitorSummary`: `data-miroir-load-timing-ignore`; `fetchMiroirAndAppConfigurations` (runs more than once: the recorder keeps the first mark): `loadTimingMark("configurationsLoaded")`; both Electron clients are in `src/miroir-fwk/4_view/services/ElectronIpcProxy.ts`: `ElectronRestClient`, `ElectronServerDomainControllerProxy`: `trackLoadTimingRequest`.

### Refactor checkpoint

`chunkLoadTrace.ts` and the recorder both observe resources: keep them separate (different switches), note it in the module comment.

### Validation

```bash
npm run build -w miroir-standalone-app && npm run build:release -w miroir-server
MIROIR_LOAD_TIMINGS_TOUR=1 MIROIR_TOUR_BROWSER=/opt/pw-browsers/chromium npm run testByFile -w miroir-standalone-app -- loadTimingsTour.integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app-electron/tsconfig.json
npm run nonreg:filesystem -- --runner shared
```

### Realization

`loadTimingBrowser.ts` is the first import of `index.tsx`. Navigation is identified by location key + path + search, because a history entry pushed outside the router has the key "default". The tour (`npm run loadTimings -- --serve`) measured initialLoad ~1000 ms, route:report ~2500 ms, route:model ~100 ms, all recorded.

---

## Slice 5 — Meta Report

**Status:** ✅ DONE

### Goal

The Meta menu links `PageLoadHistory`: a line graph of `durationMs` for `initialLoad`, the list of initial loads, a line graph for `route:report`, the list of route steps; `PageLoadMeasurementDetails` shows one step with its chunks.

### RED

MiroirTest `report.pageLoadHistory` (`24f5c213-…`, tags `integ`, `ui`, `report`, issue 580) on `testConfiguration_metaPageLoadSeed` (three seed instances): graphs `graph-line-initialLoads`, `graph-line-reportRoutes`; list labels; the `route:model` seed appears once (route list only); the details Report shows a chunk file name of the seed.

### GREEN

Report JSONs added to `defaultMetaAppModel.reports`, menu item (`icon: "speed"`), the MiroirTest JSON in `meta_model/a311f363-e238-4203-bdfc-29e8c160c26b/` (`issue: "580"`, `testbedInitApplicationParameters: "metaTestbedInitParams"`), `Meta.ts` seed and test configuration, exports in `index.ts` and `index.d.ts`, registration in `testConfigurationInstanceIndex.ts`, the report suites regex of `tests/4_view/reportTestLauncher.unit.test.ts`, the suite line of `docs/reference/testing.md`.

### Refactor checkpoint

The seed builder of `Meta.ts` stays a list of literal records, as for bundle sizes.

### Validation

```bash
npm run build -w miroir-app-meta
npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --suites report.pageLoadHistory --mode integ
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

Reports `PageLoadHistory` (two graphs, two lists) and `PageLoadMeasurementDetails`, menu item "Page load history". MiroirTest `report.pageLoadHistory` runs on a 3-row seed (`pageLoadMeasurementSeed`).

---

## Slice 6 — Bundle guard, docs, nonreg, AC

**Status:** ✅ DONE

### Goal

The page stays within the bundle guard (or the baseline is recorded with the reason); the switch and the Report are documented; nonreg runs the new tests.

### Steps

- Bundle report and guard: `npm run build -w miroir-standalone-app` then `python scripts/check_bundle_policy.py …`; when over the tolerance, `npm run bundle-size:record -w miroir-app-meta -- … --reason "#580 …"`.
- Docs: `docs/reference/environments.md` (`client.loadTimings` row), `docs/reference/load-timings.md` (switch, steps, fields, rules that keep writes out, the tour script), link from `docs/internals/code-splitting.md`.
- Nonreg manifest: `unit-580-load-timings` (tooling, ui), `integ-580-load-timing-writer` (actions, ui), `integ-report.pageLoadHistory` (ui, shared group `standalone-app-report-suites`).
- Cleanup first, then the manifest steps: the `issues/580-load-timings` vitest files move to `tests/4_view/loadTimings/` named after the feature (testing.md #238 rule).

### AC checklist

| Acceptance (issue #580) | Proof |
|---|---|
| initial load time with milestones | Slice 2 cycle 1; tour (Slice 4) |
| first display of each route | Slice 2 cycle 4; tour |
| chunks and data requests per step | Slice 2 cycle 3; tour |
| switch off by default, per environment | Slice 3 |
| recorded in the Meta app, with a Report | Slices 1, 5 |
| recording does not change the measurements | Slice 2 cycle 6; Entity lazy on refresh (Slice 0) |
| small eager footprint | bundle guard (Slice 6) |

### Validation

```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:filesystem -- --runner shared
```

### Realization

Bundle guard passes: +4.2 kB gzip eager (loadTimingBrowser chunk 3.5 kB), within the 2% tolerance. Docs: `docs/reference/load-timings.md`, environments row, code-splitting subsection. Nonreg steps `integ-report.pageLoadHistory` and `unit-580-load-timings`. Tests moved to `tests/4_view/loadTimings/`.

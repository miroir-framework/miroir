# 580 — Page load timings, recorded in miroir-app-meta

> The bundle guard (#326) and the bundle size history (#473) count the gzip bytes of the chunks
> loaded with the page. They do not say how long the page takes to show something, nor what the
> page loads later, route by route. This analysis frames a switchable measurement of real load
> times in the browser: the initial page load and the first display of each route, with the lazy
> chunks fetched at each step, recorded in the Meta application without changing what it measures.

Related issue: https://github.com/miroir-framework/miroir/issues/580
Prerequisites: [#473 bundle size history](../473-FEATURE-bundle-size-history/analysis.md) ✅ (the Meta app, `BundleSizeMeasurement`) · [#326 build hardening](../326-BUILD-build-hardening/analysis.md) ✅ (bundle guard) · [#337](../337-BUILD-bundle-size-cuts/analysis.md) ✅ / #370 ✅ (lazy routes and chunks) · [#487 self-test](../487-FEATURE-client-self-test/analysis.md) ✅ (`client.selfTest`, the precedent for a client-side switch in an environment)
Related analyses: [#576 feature switches](../576-DESIGN-feature-switches/analysis.md) (survey, no decision yet)
Key sources: [`index.tsx`](../../../packages/miroir-standalone-app/src/index.tsx) · [`chunkLoadTrace.ts`](../../../packages/miroir-standalone-app/src/chunkLoadTrace.ts) · [`PageDispatcher.tsx`](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/PageDispatcher.tsx) · [`bundleSizeHistory.ts`](../../../packages/miroir-app-meta/src/bundleSizeHistory.ts) · [`environmentState.ts`](../../../packages/miroir-env/src/environmentState.ts) · [`getMiroirFundamentalMlSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts) · [`cacheRefreshPolicy.ts`](../../../packages/miroir-core/src/1_core/localCache/cacheRefreshPolicy.ts)

**Document role:** analysis and decision record.
**Status:** decisions taken by Claude on A's instruction to work end to end without waiting (2026-10-27). Each decision lists the rejected options so that A can revisit them on the PR.

**Document history:** first version 2026-10-27; revised the same day after an adversarial review (§6 lists the findings and what changed). Line numbers are those of `_integration` at 71d64b0.

---

## 1. Goals

| Id | Story |
|---|---|
| G1 | **Initial load time.** In order to see when a change makes the first page slower, as a Miroir maintainer, I can read how long the page took from navigation start until the first page is displayed, with the milestones in between (HTML received, entry script run, client configuration ready, first render). |
| G2 | **First display of a route.** In order to see what the first report page or the first model page costs, as a Miroir maintainer, I can read how long the first display of each route took in a page session. |
| G3 | **Chunks per step.** In order to know which bundles a step waits for, as a Miroir maintainer, I can read the JavaScript and CSS files fetched during each step, with their size and fetch time, and the number of data requests of the step. |
| G4 | **Switchable.** In order to pay nothing when I do not measure, as an environment author or a developer, I turn the measurement on in an environment, or for one browser tab with a URL parameter, and it is off everywhere else. |
| G5 | **History in the Meta app.** In order to follow the trend next to the bundle size history, as a Miroir maintainer, I find the recorded steps in a Report of the Meta app, with graphs of the initial load and of the first report display. |
| G6 | **Recording does not bias.** In order to trust the numbers, as a Miroir maintainer, I know that recording a measurement did not slow down the step it measured, and a step that overlapped a write says so. |

## 2. Non-goals

| Excluded | Owner |
|---|---|
| Electron main process start time (window creation, store opening) | later, unscheduled; the renderer is measured like the web page |
| A CI gate or alert on load times (timings vary with the machine; the bundle guard stays the gate) | later, unscheduled |
| Measuring every navigation (only the first display of each route) | later, unscheduled; D2 keeps the step key open for it |
| Replaying load timings across past commits (a benchmark script) | later, unscheduled |
| Reducing the load time itself | follow-up issues, informed by the measurements |
| A general feature switch module | #576 |

## 3. Decision record

| Id | Decision | Serves |
|---|---|---|
| D1 | Switch: `client.loadTimings` in the environment definition, carried to `MiroirConfigClient.loadTimings`; a per-tab override with the URL parameter `loadTimings=on\|off`, kept in `sessionStorage`. Off by default. | G4 |
| D2 | Steps: `initialLoad` (navigation start to the first page settled) and `route:<page>` (the first display of a page kind in the page session, page kind from the `page` URL parameter). A step starts only when the page kind changes to one not seen yet; the page shown by the initial load counts as seen. | G1, G2 |
| D3 | End of a step: settle detection. A step ends at its last activity (DOM mutation under `document.body`, resource fetched) once there was no activity, no request in flight and no `<Suspense>` fallback mounted for a quiet window (1500 ms). A step that does not settle within 30 s, or that a navigation to another page kind interrupts, is recorded with `settled: false`. | G1, G2 |
| D4 | Chunks of a step: Resource Timing entries that start inside the step; `.js` / `.mjs` / `.css` are chunks, `fetch` / `xmlhttprequest` are data requests. | G3 |
| D5 | Storage: a new Meta Entity `PageLoadMeasurement`, one instance per step, `cacheAllInstancesOnRefresh: false`; its data folder is tracked with a `.gitkeep`, its instance files are gitignored. | G5, G6 |
| D6 | Write path: queue finished steps in memory; write them in one `createInstance` action when no step is open and the configurations are loaded, in an idle callback; a step that overlaps a write gets `overlapsWrite: true`. | G6 |
| D7 | Footprint: the eager recorder imports no package and has no React code; the writer is a dynamic import, loaded only when recording is on. | G4, G6 |
| D8 | Target deployment: the Meta deployment, written only when the client configuration lists it; otherwise, or when the write fails, steps stay in the console and on `window.__miroirLoadTimings`. Off in self-test runs. | G4, G5 |
| D9 | Meta Report `PageLoadHistory`, reachable from the Meta menu, with a MiroirTest on fixed instances like `report.bundleSizeHistory`. | G5 |

### D1 — where the switch lives

**Status:** Accepted — D1-a. **Serves:** G4.

The measurement must start before the first render, and the initial step needs Resource Timing entries from navigation start. The browser buffers those entries (raised with `performance.setResourceTimingBufferSize`), so the switch can be read when the client configuration is known, as long as that is before `root.render`. In the web client the configuration is a module constant (`__MIROIR_CLIENT_CONFIG__`, `index.tsx:129-131`); in Electron it comes from `electronRestClient.getClientConfig()` (`index.tsx:405-407`), also before `setupClient` and `root.render`. So the recorder always starts its observers at module load (they cost a timestamp per event) and the switch, read once the configuration is known, decides whether the steps are kept. `performance.setResourceTimingBufferSize(1000)` runs at module load, before the default 250-entry buffer can fill.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. `client.loadTimings` in the environment** ★ | same path as `client.selfTest` (#487): ML schema `miroirEnvironment.client`, `miroirConfigClient`, `selfTestConfig`-like copy in `environmentRealServerClientConfig` and `environmentClientConfig` | the precedent for a client-side switch; Electron gets it with its client configuration; no server round trip | one more ML schema entry (two places, plus generated types) |
| D1-b. `features.loadTimings` process capability | `ProcessCapabilities`, served by `GET /capabilities` | the "official" switch shape | known only after `fetchProcessCapabilities` (`index.tsx:330`), after the store setup; seven places to edit (#576 §4.2); a capability gates actions, not a client measurement |
| D1-c. Build-time `VITE_MIROIR_LOAD_TIMINGS` | `import.meta.env` | smallest | needs a rebuild; #576 §4.8 classes these as diagnostics outside switches |

The URL parameter override (`?loadTimings=on`, or `off`) is read by the recorder at module load and kept in `sessionStorage` (`miroirLoadTimings`), so that later navigations in the tab keep it. It measures a build whose environment has the switch off (a release build, the docker image) without a rebuild. It does not turn recording on where the Meta deployment is absent (D8).

`client.loadTimings` shape: `{ enabled: boolean, record?: boolean, quietWindowMs?: number, maxStepMs?: number }`. `record` (default true) lets an environment measure without writing; `quietWindowMs` (default 1500) and `maxStepMs` (default 30000) tune D3.

`extends` merges definitions (`packages/miroir-env/src/Environment.ts:79-81`): a switch set in `dev` also reaches `cloud-agent`, `self-test` and `self-test-integ`. No shipped environment turns it on; the self-test page never renders the router (`index.tsx:458-468`), so the recorder is off whenever `selfTest.enabled` is true. The key is documented in `docs/reference/environments.md` next to `client.selfTest`.

### D2 — what a step is

**Status:** Accepted — D2-a. **Serves:** G1, G2.

| Option | Pros | Cons |
|---|---|---|
| **D2-a. Initial load + first display per page kind** ★ | what the issue asks; small history (one row per page kind per session) | a second report page in the session is not measured, even when it loads new chunks |
| D2-b. Every navigation | complete | most navigations load nothing new; noisy history |
| D2-c. First display per report (per `reportUuid`) | catches report-specific chunks | many rows; the page kind gives the chunk cost, the report the data cost |

The page kind is the `page` URL parameter (`home`, `report`, `model`, `settings`, `transformerBuilder`, …, `PageDispatcher.tsx:166-213`), or the first path segment in the legacy path mode (`PageDispatcher.tsx:216-254`), `home` by default. The step also records the URL (path and query) so that the report shown is known. The initial step records the page kind it ended on.

Navigation rules, because `router.subscribe` fires on every router state change (react-router 6.30.3), pages rewrite their own query string (`navigate(` / `setSearchParams(` calls in `4_view`), and `PageContent` redirects with `<Navigate replace>` (auth gate, access gate, unknown page, `PageDispatcher.tsx:139-159, 212`):

| Router event | Effect |
|---|---|
| location changes, same page kind as the open step or as the last displayed page | nothing |
| location changes to a page kind already seen | the open step, if any, ends `settled: false`; no new step |
| location changes to a page kind not seen yet, `REPLACE` while a step is open | the open step continues and takes the new page kind (a redirect, e.g. to `login`) |
| location changes to a page kind not seen yet, otherwise | the open step ends `settled: false`; `route:<page>` starts |

The initial page counts as seen: a session that opens on a report page records `initialLoad` with `page: "report"` and no `route:report`.

### D3 — when a step ends

**Status:** Accepted — D3-a. **Serves:** G1, G2.

"Displayed" has no single signal in the code: `ReportDisplay` renders its sections once the local cache holds the data, then sections load their own lazy components (grids, editors), and graph sections draw after that.

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D3-a. Settle detection** ★ | a `MutationObserver` on `document.body` (subtree, child list, attributes, text; MUI portals render outside `#root`) and the Resource Timing observer record the time of the last activity; a step ends when there was no activity, no request in flight and no Suspense fallback mounted for 1500 ms; its end is the last activity | one generic mechanism for every route; page components only get two marker attributes; counts the lazy components a page loads after its route chunk | a page that changes its DOM on a timer never settles (30 s cap, `settled: false`) unless the changing part is marked as ignored |
| D3-b. A ready signal from each page (`useLoadTimingReady`) | the page says when it is done | exact for the pages that call it | a hook per page, and an effect per page (repo rule: ask before `useEffect`); every new page needs it |
| D3-c. Web Vitals (LCP, `largest-contentful-paint`) | browser metric | standard | Chromium only, initial load only, no SPA route |

Three activity sources keep a step open besides DOM mutations, because each can last longer than the quiet window without changing the DOM:

| Source | How the recorder sees it |
|---|---|
| A data request | the recorder wraps `window.fetch` at module load; `setupClient` binds `window.fetch` later (`index.tsx:369`, used at 252), and `authTransport` calls the global `fetch`, so both go through the wrapper. Electron calls go over IPC, which has no Resource Timing entry and a frozen `contextBridge` object: `ElectronRestClient` and `ElectronServerDomainControllerProxy` count their calls through the recorder's `trackRequest` function |
| A lazy chunk being fetched (`import()`, no `fetch`, its Resource Timing entry arrives at `responseEnd`) | the Suspense fallback is mounted: `CenteredSpinner` (`PageDispatcher.tsx:257`, a CSS animation with no DOM change) carries `data-miroir-loading`, and a step does not settle while such an element is in the document |
| Background DOM updates on a timer | `RenderInsightSummary` and `LocalCacheMonitorSummary` poll every 1000 ms (`ReportDisplay.tsx:187-188`), only when their toggles (`showPerformanceDisplay`, `showLocalCacheMonitor`) are on; their root carries `data-miroir-load-timing-ignore`, and mutations inside such a subtree are not activity |

Background writes on a timer (`ViewParamsUpdateQueue`, 5 s, `RootComponent.tsx:676-680`) are data requests of the step they fall in; they are part of what the page does.

The initial step does not settle before the first render milestone: `startWebApp` awaits authentication, the client configuration and `setupClient` before `root.render` (`index.tsx:377-471`), with no DOM change for that time. After the first render, `fetchMiroirAndAppConfigurations` (`4_view/services/ConfigurationService.ts:66`) opens every deployment the Admin rows list and rolls them back, which loads their instances into the local cache: those requests are inside the initial step, and the end of that function is the `configurationsLoaded` milestone.

Navigation starts a step from a router subscription (`router.subscribe`, react-router 6.30 data router, created at `index.tsx:162`), not from a component: no hook, no effect. D2 gives the rules.

### D4 — which resources belong to a step

**Status:** Accepted. **Serves:** G3.

A Resource Timing entry belongs to the open step whose interval contains its `startTime`. Chunks are entries whose URL path ends in `.js`, `.mjs` or `.css` (Vite dev serves `.tsx` modules too: the step also counts `.ts` / `.tsx` / `.jsx` under `/src/` in dev, recorded as `buildMode: "development"`). For each chunk the step keeps the file name (no origin, no query), `startMs` relative to the step start, `durationMs`, `transferBytes` (`transferSize`, 0 when cached) and `encodedBytes` (`encodedBodySize`). Data requests (`initiatorType` `fetch` or `xmlhttprequest`) are counted with their transferred bytes. `chunkLoadTrace.ts` already maps script URLs to manual vendor chunk names (`resolveChunkLabelFromScriptUrl`); the recorder keeps the file name, which is more precise, and does not import that module's logging side effect.

### D5 — how measurements are stored

**Status:** Accepted — D5-a. **Serves:** G5, G6.

| Option | Pros | Cons |
|---|---|---|
| **D5-a. New Meta Entity `PageLoadMeasurement`, one instance per step** ★ | same shape as `BundleSizeMeasurement` (D2 of #473); a Report filters on `step` | one file per step on filesystem stores |
| D5-b. One instance per page load, steps as an array | one write per session | a graph of "first report display" needs a transformer over nested arrays |
| D5-c. Extend `BundleSizeMeasurement` | one Entity | different grain (per commit vs per session), different fields |

Two distortion risks come from the storage itself:

- **Later startups get heavier.** `BundleSizeMeasurement` has `cacheAllInstancesOnRefresh: true`, so the client loads every instance when it refreshes the Meta deployment. Page load rows grow with every session. `PageLoadMeasurement` sets `cacheAllInstancesOnRefresh: false` (`cacheRefreshPolicy.ts:35-37`, `isLazyCacheOnRefreshEntity`): its instances load when the Report asks for them.
- **The git tree changes on every session.** In `dev` the Meta deployment is `live` on the filesystem (`environments/dev.json:51-57`), so instances land in `packages/miroir-app-meta/assets/meta_data/<entity uuid>/`, a tracked folder, and `miroir-env check --tracked-clean` (pre-push gate) fails on changed asset files. The bundle size history is tracked on purpose (#473 D6): one row per baseline change, the same on every machine. Load timings depend on the machine and the session, so the instance files of the Entity are gitignored. The folder itself stays tracked with a `.gitkeep`: the filesystem store lists the entities of a data section from its folders (`FileSystemStoreSection.ts:75-79`), and `PersistenceStoreController.upsertInstance` refuses an instance of an entity it does not list (`PersistenceStoreController.ts:961-974`), so a fresh clone without the folder would refuse every write. A maintainer who wants to share a measurement commits it with `git add -f`. `--tracked-clean` uses `git status`, which skips ignored files.

Local rows are read by a local `modelValidation` of the Meta deployment; to keep old rows valid, every field added later is optional.

Fields of `PageLoadMeasurement`:

| Field | Type | Meaning |
|---|---|---|
| `pageLoad` | uuid | the page load (session) the step belongs to; groups the steps of one load |
| `measuredAt` | date | wall clock time of the step start (`performance.timeOrigin` + start) |
| `step` | string | `initialLoad`, or `route:<page>` |
| `page` | string | page kind displayed at the end of the step |
| `url` | string | path and query at the end of the step |
| `durationMs` | number | end minus start |
| `settled` | boolean | false when cut by the 30 s cap or by a navigation |
| `overlapsWrite` | boolean, optional | true when a recording write ran during the step |
| `milestones` | record of number, optional | ms from the step start: `responseEnd`, `domContentLoaded`, `entryScript`, `configReady`, `firstRender`, `configurationsLoaded` (initial step); `routeChunk` when the step fetched the route's own chunk |
| `chunkCount`, `chunkTransferBytes`, `chunkEncodedBytes` | number | totals of the chunks of the step |
| `chunks` | array of `{ file, startMs, durationMs, transferBytes, encodedBytes }` | the chunks fetched during the step |
| `dataRequestCount`, `dataTransferBytes` | number | data requests of the step |
| `environment` | string, optional | environment name (`MiroirConfigClient.environment.name`) |
| `client` | string | `webApp` or `electron` |
| `buildMode` | string | `production` or `development` (Vite dev serves unbundled modules: not comparable with a build) |
| `miroirVersion` | string, optional | version of `miroir-standalone-app` |

### D6 — how writes stay out of the measurement

**Status:** Accepted. **Serves:** G6.

| Rule | Why |
|---|---|
| Collection is passive: browser timing buffers, one `PerformanceObserver`, one `MutationObserver` whose callback stores a timestamp, one router subscription, a `fetch` wrapper that counts | no work proportional to the page beyond a timestamp per mutation batch |
| Nothing is written while a step is open | the write's request, its local cache update and the React renders it causes fall outside every step |
| Finished steps queue in memory and are written together, in one `createInstance` action with all queued objects (one action carries one Entity's instances, `PersistenceStoreController.ts:338-350`, which is the case here), 2 s after the last step ended and after `configurationsLoaded`, inside `requestIdleCallback` (`setTimeout` where it is missing) | one request per page load in the common case, at a moment the page is idle |
| A step that starts while a write is running is marked `overlapsWrite: true` | the Report can filter those rows; the rule is visible, not silent |
| The writer module is a dynamic import done at the first write | its parse time is outside the initial step |
| The Entity is lazy on refresh (D5) | recording does not slow down the next start |

The write goes through `DomainController.handleAction` with a data-section `createInstance` (`DomainController.handleInstanceAction`, `DomainController.ts:1312-1427`: persistence first, then the local cache). Its side effects in the UI: `handleAction` tracks the action in the activity tracker (`DomainController.ts:3194`, visible in the action timeline), and `handleInstanceAction` notifies the instance listeners (`DomainController.ts:1415`) and updates the local cache, which re-runs selectors. These happen outside every step, which is the point of the rules above.

Rows queued and not yet written are lost when the tab closes or reloads; a `pagehide` handler starts a last write, which may not finish. `navigator.sendBeacon` is rejected: it would bypass the DomainController and the store.

### D7 — eager footprint

**Status:** Accepted. **Serves:** G4, G6.

The recorder is imported first in `index.tsx`, next to `chunkLoadTrace.js` (`index.tsx:1`), so that the `entryScript` milestone is taken before the big imports run. It imports nothing (no `miroir-core`, no React), so it adds a few kB to the entry chunk and nothing to the vendor chunks. When the switch is off it only reads the switch (configuration constant, URL, `sessionStorage`). The bundle guard (`bundle-policy.json`, `eagerGzipBaseline` 824806, tolerance 2%) checks the size.

The writer imports `miroir-core` types and builds the action; it is a separate chunk. The Meta Entity uuid and the Meta deployment and application uuids are constants in the standalone app, checked against `miroir-app-meta`'s JSON by a unit test: importing `miroir-app-meta` would pull the Meta model into the page, which the bundle policy keeps lazy ("miroir-app-meta loads on demand with the MiroirTest configurations (#473)", bundle size history row of 2026-10-05).

### D8 — where measurements go

**Status:** Accepted. **Serves:** G4, G5.

The writer targets the Meta deployment `40b74910-4c63-4bd9-8e7d-2bc051342908` of SelfApplication `9ff432a9-89a1-460b-a263-1672d084a9e0`. `dev` and `test-filesystem` install the Meta app, and with `extends` so do `cloud-agent`, `self-test`, `self-test-integ` (from `dev`) and `test-indexedDb`, `test-mongodb`, `test-sql` (from `test-filesystem`); `desktop` and `docker` do not. The writer writes only when the client configuration lists that deployment: in `client.serverConfig.storeSectionConfiguration` (real server, the web client: `vite/environmentConfig.js:46-48` refuses emulated-server environments) or `client.deploymentStorageConfig` (emulated server, Electron only; `desktop` has no Meta app today).

What the write needs, and where it comes from:

| Need | Source |
|---|---|
| the DomainController | `index.tsx` hands `domainControllerForClient` to the recorder after `setupClient` |
| the application-to-deployment map | the writer's own one-entry map `{ [Meta SelfApplication]: Meta deployment }`: `handleInstanceAction` only reads the entry of the action's application (`DomainController.ts:1351`) |
| the Meta model in the local cache (keyless and virtual-attribute checks, `DomainController.ts:1340-1350`) | the write waits for `configurationsLoaded`, after which the Meta deployment is loaded when the Admin rows list it |

When the write fails (Meta not listed in Admin, store error), the writer logs the error once, stops writing for the page session and keeps the steps on `window.__miroirLoadTimings`. Elsewhere, and when `record` is false, each step is logged to the console (`[miroir-load-timing]`) and kept on `window.__miroirLoadTimings`, which Playwright and the DevTools console can read.

### D9 — Report

**Status:** Accepted. **Serves:** G5.

`PageLoadHistory` Report of the Meta app, on the model of `BundleSizeHistory` (`e8c6faa5-a117-4afd-b7ae-4a40c6111f95`): a line graph of `durationMs` for `initialLoad`, a list of initial loads, a line graph for `route:report`, a list of route steps; plus a details Report for one measurement, listing its chunks. A Meta menu item links it. A MiroirTest `report.pageLoadHistory` renders it on fixed instances, like `report.bundleSizeHistory` (`d13c9b9e-36fa-4ef0-975b-53751862300a`) with `testConfiguration_metaBundleSizeSeed`.

---

## 4. Current state

### 4.1 What measures loading today

| Mechanism | Where | What it gives | Gap for this issue |
|---|---|---|---|
| Bundle guard | `scripts/check_bundle_policy.py`, `packages/miroir-standalone-app/bundle-policy.json` | gzip bytes of the chunks `index.html` preloads (`eagerGzipBaseline` 824806) | bytes, not time; no route chunks |
| Home page cap | `tests/0_build/homePageLoad.unit.test.ts` (`homePageMaxGzipBytes` 1 335 000) | gzip bytes of the entry plus the `HomePage` route chunk and its static imports | bytes; one route |
| Bundle size history | `miroir-app-meta`, `BundleSizeMeasurement` (`90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b`), Report `BundleSizeHistory` | the guard's numbers per baseline change | same numbers over time |
| Chunk load trace | `src/chunkLoadTrace.ts`, `vite/chunkLoadLoggerPlugin.js` | a `console.info` when a manual vendor chunk executes or appears in Resource Timing, on by default (`VITE_MIROIR_LOG_CHUNK_LOADS !== "false"`) | console only, vendor chunks only, wall clock only, no step |
| Performance config | `src/miroir-fwk/4_view/tools/performanceConfig.ts` (`VITE_PERFORMANCE_TRACKING`) | render insight of components | render cost, not load |

The "Web page: eager gzip bytes" graph (the Meta Report) went from 2 709 170 bytes (2026-09-28) down to 746 687 (#370 slice 5, 2026-10-01) and back up to 824 806 (2026-10-24, Vite 8 / Rolldown splitting shared modules into 53 eager chunks instead of 4). The count of eager chunks is in the bundle report but not in the graph; the time of 53 requests vs 4 is in no tool.

### 4.2 Startup sequence of the web client

`index.tsx`, in order (line numbers of `_integration` at 71d64b0):

| # | Step | Line |
|---|---|---|
| 1 | `import "./chunkLoadTrace.js"` (first import) | 1 |
| 2 | module body: loggers, `webMiroirConfig` from `__MIROIR_CLIENT_CONFIG__`, `createBrowserRouter` | 115-170 |
| 3 | `startWebApp`: `fetchAuthenticationEnabled()` (HTTP or IPC) | 383 |
| 4 | Electron only: `getClientConfig()` over IPC | 405-407 |
| 5 | `setupClient` → `setupMiroirPlatform`: DomainController, stores (emulated server), `fetchProcessCapabilities` | 423-428, 203-345 |
| 6 | self-test branch (dynamic import) or `root.render(withProviders(<RouterProvider router={router} />))` | 458-471 |
| 7 | `RootComponent` shell, then `PageDispatcher` inside `<Suspense>`, which loads the route chunk with `React.lazy` | `PageDispatcher.tsx:36-47, 255-261` |
| 8 | the pages call `fetchMiroirAndAppConfigurations` (through `usePageConfiguration`): open and roll back every deployment | `4_view/services/ConfigurationService.ts:66` |

Every route component is `React.lazy` (11 routes, `PageDispatcher.tsx:36-47`); `ReportDisplay` is also imported statically by `HomePage`, `SettingsPage` and `ReportSectionViewWithEditor` (`bundle-policy.json` `defeatedDynamicImports` comment). The first report page fetches `ReportDisplay`'s chunk unless the home page loaded it, then the section components (grids, CodeMirror) on demand (`LazyGrids.tsx`).

### 4.3 Meta app

- Deployment `40b74910-4c63-4bd9-8e7d-2bc051342908` (`MetaApplicationFilesystemDeployment`), SelfApplication `9ff432a9-89a1-460b-a263-1672d084a9e0` (`Meta`), model in `miroir-app-meta/assets/meta_model`, data in `miroir-app-meta/assets/meta_data`.
- One Entity (`BundleSizeMeasurement`), two Reports (`BundleSizeHistory` `e8c6faa5-…`, `BundleSizeMeasurementDetails` `85077493-0fea-4969-96c8-b994272de284`), one Menu (`MetaMenu` `c95bfb70-62bd-4f40-ac2b-04857124f133`, one item), one MiroirTest (`report.bundleSizeHistory`).
- `Meta.ts` builds `defaultMetaAppModel` from those JSON files and `testConfiguration_metaBundleSizeSeed` (`8b8dfbd9-66e9-4afb-87e3-90aa07ccd11b`), registered in `miroir-standalone-app/src/miroir-fwk/4-tests/testConfigurationInstanceIndex.ts:39-40`.
- Installed in `environments/dev.json` (`mode: "live"`, filesystem) and `environments/test-filesystem.json`, and through `extends` in the environments derived from them (D8); not in `desktop`, `docker`.

### 4.4 Client switches with the same shape

`client.selfTest` (#487): `miroirEnvironment.client.selfTest` and `miroirConfigClient.selfTest` both reference `miroirSelfTestConfig` (`getMiroirFundamentalMlSchema.ts:1894-1900, 1973-1980, 2194-2201`); `selfTestConfig(resolved)` copies it into both client configurations (`environmentState.ts:320-323`, used at 315 and 351); Electron passes its client configuration to the renderer (`ipcServerSetup.ts:202`). `client.loadTimings` follows the same three steps.

---

## 5. Key reuse

| Piece | Location |
|---|---|
| Client switch path (schema, resolver copy) | `miroirSelfTestConfig`, `selfTestConfig` (§4.4) |
| Meta Entity, Report, menu, MiroirTest and seed pattern | `packages/miroir-app-meta/assets/meta_model/…`, `Meta.ts` (`testConfiguration_metaBundleSizeSeed`) |
| Lazy cache policy | `cacheRefreshPolicy.ts` `isLazyCacheOnRefreshEntity` |
| Data-section create | `DomainController.handleAction` → `handleInstanceAction`; instance endpoint `ed520de4-55a9-4550-ac50-b1b713b72a89` (`saveInstanceFromUI.ts:18`) |
| Router outside React | `router` in `index.tsx:162` (`createBrowserRouter`, `router.subscribe`) |
| Resource observer pattern | `chunkLoadTrace.ts` `startPerformanceObserver` |
| Instance validation in tests | `checkModelValidationInstance` (`bundleSizeHistory.ts` `measurementErrors`) |

## 6. Adversarial review, round 1

| # | Finding | Change |
|---|---|---|
| 1 | A gitignored folder makes the filesystem store refuse writes on a fresh clone | D5: tracked folder with `.gitkeep`, ignored `*.json` |
| 2 | The writer had no source for the map, the model and the DomainController | D8: table of needs and sources; write after `configurationsLoaded` |
| 3 | A step could settle on a Suspense spinner or during an IPC call | D3: `data-miroir-loading` on the fallback, `trackRequest` in the Electron clients |
| 4 | `router.subscribe` fires on every state change; redirects and query rewrites | D2: navigation rules table |
| 5 | Polling summaries at 1000 ms, portals outside `#root` | D3: 1500 ms window, `document.body`, `data-miroir-load-timing-ignore` |
| 6 | `handleAction` also tracks the action | D6: side effects listed |
| 7 | `extends` installs Meta in more environments | D1, D8, §4.3 corrected; off in self-test |
| 8, 9 | Wrong line numbers | corrected |
| 10 | Emulated-server path is Electron only | D8 |
| 11 | Docs, Electron decision timing, resource buffer | D1 |
| 12 | Local model validation of old rows | D5: later fields optional |
| 13 | One Entity per action, unload loss, configurable windows, `measuredAt` | D6, D1 |

## Next step

`tdd-implementation-plan.md` in this folder (skill `miroir-analysis-to-tdd-plan`).

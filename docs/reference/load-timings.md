# Load timings

The standalone web page and the Electron renderer can measure how long they take to load, and record the measurements in the `devData` section of the Miroir application (#580, #647). The bundle guard counts the bytes loaded with the page ([code-splitting.md](../internals/code-splitting.md#bundle-report-and-guards-326)); load timings measure the time the user waits, step by step, and the files each step fetches.

## Turning it on

The measurement is off by default.

| Where | How |
|---|---|
| An environment | `"client": { "loadTimings": { "enabled": true } }` in `environments/<name>.json` ([environments.md](environments.md)). The web client gets it at build time (`vite/environmentConfig.js`), Electron from its main process. |
| One browser tab | add `loadTimings=on` to the page URL, e.g. `https://localhost:3080/?page=home&loadTimings=on`. The tab keeps the choice in `sessionStorage` (`miroirLoadTimings`) until `loadTimings=off`. |

`client.loadTimings` also takes `record` (default `true`; `false` measures without recording), `quietWindowMs` (default 1500) and `maxStepMs` (default 30000). A self-test page never measures.

## Steps

| Step | Starts | Ends |
|---|---|---|
| `initialLoad` | navigation start | the first page settled |
| `route:<page>` | the first navigation to a page kind (`home`, `report`, `model`, …: the `page` URL parameter) in the page load | that page settled |

A page settles at its last activity (a DOM change, a file or a request that finished) once nothing happened for `quietWindowMs`, no request is in flight and no loading spinner (`data-miroir-loading`) is displayed. A step that reaches `maxStepMs`, or that a navigation to another page kind interrupts, is recorded with `settled: false`. A query change on the same page kind, a page kind already displayed, and a redirect (`replace`) while a step is open start no step. The initial step does not end before the first render.

Parts of the page that change on a timer carry `data-miroir-load-timing-ignore` (the render insight and local cache monitors); their changes are not activity.

Each step has milestones (initial load: `responseEnd`, `domContentLoaded`, `entryScript`, `configReady`, `platformReady`, `firstRender`, `configurationsLoaded`, in ms from navigation start), the JavaScript and CSS files fetched during the step (start, duration, transferred and encoded bytes; `transferBytes` is 0 for a file from the browser cache), and the count and bytes of its data requests (`fetch`; Electron IPC calls keep a step open but are not counted). `buildMode` says whether the page came from a build or from the Vite dev server, whose unbundled modules make timings not comparable with a build.

`configurationsLoaded` is marked by `usePageConfiguration`, in `miroir-react`, through `loadTimingMark`. The package records nothing itself: the client registers its recorder with `setLoadTimingMarkSink` (the standalone app does it in `src/index.tsx`); without a sink, a mark does nothing (#633).

## Where measurements go

Every finished step is printed in the browser console (`[miroir-load-timing]`) and kept on `window.__miroirLoadTimings`. When the client configuration gives the Miroir deployment a `devData` section (`dev` does), the steps are also recorded as `PageLoadMeasurement` instances in that section, shown by the `Page load history` Report of the `Dev data` group of the Miroir menu.

A development build and a production build are not comparable, nor are the web page and Electron (#583). The history draws one initial load graph and one first report display graph per pair of build mode (`production`, `development`) and client (`webApp`, `electron`); a pair without rows shows "No data available". Its lists show every row with its build mode and client, and the details of a step show its environment too. The graphs select their rows on `series`, a virtual attribute of `PageLoadMeasurement` (`<step>/<buildMode>/<client>`, computed, not stored). It is computed by the client's local cache, which the Report uses, and in SQL; a query run by a filesystem, IndexedDB or MongoDB store itself (`runBoxedQueryAction` on the storage) does not compute it, so a filter on it there selects nothing.

Recording does not run while a step is measured:

- nothing is written while a step is open;
- the steps of a page load are written together, in one `createInstance` action, once the configurations are loaded, 2 s after the last step ended, when the browser is idle;
- the writer module is loaded at the first write;
- `PageLoadMeasurement` is not loaded when the client refreshes the Miroir deployment (`cacheAllInstancesOnRefresh: false`), so the history does not slow down the next start;
- a step that starts while a write runs has `overlapsWrite: true`.

Steps still queued when the tab closes are written by a last attempt on `pagehide`, which may not finish. A write that fails stops recording for the page load.

The instance files are gitignored (`packages/miroir-app-miroir/assets/miroir_devData/0266c0b8-4dc8-4a14-bcef-239a85a5de2d/*.json`): timings depend on the machine. `git add -f` shares one.

## Load timings tour

On demand, after `npm run build -w miroir-standalone-app` and `npm run build:release -w miroir-server`:

```bash
npm run loadTimings -w miroir-standalone-app -- --serve
```

It opens the home page with `loadTimings=on`, waits for the initial load, opens the Library Books report and the model page inside the app, prints the build mode and client it measured, then each step with its milestones and files, and waits for the steps to be recorded in the devData section of the Miroir application. `--clean` removes the instances it recorded, `--out <file>` writes the steps as JSON, `--dev-data-folder none` skips the recording check. The same options as the coverage tour apply (`--url`, `--browser`, `--headed`). It fails when a step is missing, did not settle, or measured another build mode than expected.

### Dev mode

The Vite dev client loads hundreds of unbundled modules, transformed on request, with React's development build. To measure it, after `npm run build:release -w miroir-server` (no production build needed):

```bash
npm run loadTimings -w miroir-standalone-app -- --dev --serve
```

`--serve` checks that ports 3080 and 5173 are free, starts the server release for its API only (development mode), then the Vite dev server at https://localhost:5173 with the server's certificate, and stops both at the end. Without `--serve`, `--dev` uses a Vite dev server and a server already running (`npm run dev -w miroir-standalone-app`), at `http(s)://localhost:5173` (https when Vite has a certificate, as `vite.config.js` decides) or `--url`.

Before the measured run, the tour runs once with `loadTimings=off` in a browser context of its own: Vite has then transformed the modules, as when a developer reloads the page, and its dependency optimizer has found the dependencies of the lazy pages. The measured run starts with an empty browser cache, as the production tour does.

`index.html` raises the browser's resource timing buffer (250 entries by default) before the entry module loads, so a dev initial load lists all its files.

`tests/0_build/loadTimingsTour.integ.test.ts` runs the production tour when `MIROIR_LOAD_TIMINGS_TOUR=1` and the dev tour when `MIROIR_LOAD_TIMINGS_TOUR_DEV=1`, one per run (both use port 3080).

## Sources

| Piece | File |
|---|---|
| Recorder (steps, settle, files, write window; no browser API) | `packages/miroir-standalone-app/src/loadTimings/loadTimingRecorder.ts` |
| Browser adapter (observers, router, `fetch` count) | `packages/miroir-standalone-app/src/loadTimings/loadTimingBrowser.ts` |
| Switch | `packages/miroir-standalone-app/src/loadTimings/loadTimingSwitch.ts` |
| Writer | `packages/miroir-standalone-app/src/loadTimings/loadTimingWriter.ts` |
| Entity, Reports | `packages/miroir-app-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/` (`PageLoadMeasurement` `0266c0b8-4dc8-4a14-bcef-239a85a5de2d`), `packages/miroir-app-miroir/assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/` (`PageLoadHistory` `02dd2ead-7b8d-4160-99c9-9f4e9a1c051b`) |
| Tour, servers | `packages/miroir-standalone-app/scripts/load-timings.mjs`, `serveBuiltClient.mjs` |
| Analysis and plan | `code-helpers/features/580-FEATURE-page-load-timings/`, `code-helpers/features/583-FEATURE-page-load-history-by-build-mode/` |

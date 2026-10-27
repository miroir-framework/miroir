# Load timings

The standalone web page and the Electron renderer can measure how long they take to load, and record the measurements in the Meta app (#580). The bundle guard counts the bytes loaded with the page ([code-splitting.md](../internals/code-splitting.md#bundle-report-and-guards-326)); load timings measure the time the user waits, step by step, and the files each step fetches.

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

## Where measurements go

Every finished step is printed in the browser console (`[miroir-load-timing]`) and kept on `window.__miroirLoadTimings`. When the client configuration lists the Meta deployment (`dev` installs it), the steps are also recorded as `PageLoadMeasurement` instances of the Meta app, shown by the `Page load history` Report of the Meta menu.

Recording does not run while a step is measured:

- nothing is written while a step is open;
- the steps of a page load are written together, in one `createInstance` action, once the configurations are loaded, 2 s after the last step ended, when the browser is idle;
- the writer module is loaded at the first write;
- `PageLoadMeasurement` is not loaded when the client refreshes the Meta deployment (`cacheAllInstancesOnRefresh: false`), so the history does not slow down the next start;
- a step that starts while a write runs has `overlapsWrite: true`.

Steps still queued when the tab closes are written by a last attempt on `pagehide`, which may not finish. A write that fails stops recording for the page load.

The instance files are gitignored (`packages/miroir-app-meta/assets/meta_data/0266c0b8-4dc8-4a14-bcef-239a85a5de2d/*.json`): timings depend on the machine. `git add -f` shares one.

## Load timings tour

On demand, after `npm run build -w miroir-standalone-app` and `npm run build:release -w miroir-server`:

```bash
npm run loadTimings -w miroir-standalone-app -- --serve
```

It opens the home page with `loadTimings=on`, waits for the initial load, opens the Library Books report and the model page inside the app, prints each step with its milestones and files, and waits for the steps to be recorded in the Meta app. `--clean` removes the instances it recorded, `--out <file>` writes the steps as JSON, `--meta-folder none` skips the recording check. The same options as the coverage tour apply (`--url`, `--browser`, `--headed`). `tests/0_build/loadTimingsTour.integ.test.ts` runs it when `MIROIR_LOAD_TIMINGS_TOUR=1`.

## Sources

| Piece | File |
|---|---|
| Recorder (steps, settle, files, write window; no browser API) | `packages/miroir-standalone-app/src/loadTimings/loadTimingRecorder.ts` |
| Browser adapter (observers, router, `fetch` count) | `packages/miroir-standalone-app/src/loadTimings/loadTimingBrowser.ts` |
| Switch | `packages/miroir-standalone-app/src/loadTimings/loadTimingSwitch.ts` |
| Writer | `packages/miroir-standalone-app/src/loadTimings/loadTimingWriter.ts` |
| Entity, Reports | `packages/miroir-app-meta/assets/meta_model/` (`PageLoadMeasurement` `0266c0b8-4dc8-4a14-bcef-239a85a5de2d`, `PageLoadHistory` `02dd2ead-7b8d-4160-99c9-9f4e9a1c051b`) |
| Analysis and plan | `code-helpers/features/580-FEATURE-page-load-timings/` |

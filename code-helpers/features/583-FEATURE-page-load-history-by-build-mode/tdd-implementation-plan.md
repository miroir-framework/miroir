# Issue #583 — TDD Implementation Plan

> Integration first, no mocks. The Report split is proven by the MiroirTest `report.pageLoadHistory` (the real Report JSON rendered on a fixed seed, through the real query and transformer machinery); the dev-mode tour by the real Vite dev server, the real server release and a real browser (`loadTimingsTour.integ.test.ts`, on demand).

**Resume note:** update the progress table and each slice's Status / Realization as slices land.

## Adversarial review, round 1

| # | Finding | Outcome |
|---|---|---|
| 1 | `VITE_TEST_MODE` from the test runner reaches Vite and turns the measurement off | Slice 3: explicit child env |
| 2 | mustache needs `interpolation: "runtime"` to read the instance | Slice 1 GREEN |
| 3 | `byText development` matches 2 rows, and is not RED | Slice 2: count 2, characterization; RED is `electron` |
| 4 | modelValidation command filtered by name | conventions: `testByFile` on the file |
| 5 | `loadTimingBrowser.ts` lowers the buffer back to 1000 | Slice 3 GREEN |
| 6 | port 3080 race between the two tour describes | `stop` waits for exit; one flag per run |
| 7 | `--url` default hides an explicit one | Slice 3 GREEN |
| 8 | warm-up cannot use `__miroirLoadTimings` | DOM signals |
| 9 | mustache HTML-escapes values | triple braces |
| 10 | store-side in-memory runner does not compute virtual attributes | documented limit (Report path loads into the local cache) |
| 11 | details checks already green | characterization |
| 12 | `attribute.value` is a string | Slice 1 |
| 13 | `present: false` checks once | no timeout, after positives |
| 14 | `issue` is one number; description stale | `583`, description rewritten |
| 15 | incomplete validation blocks | completed |
| 16 | Vite heap flag; work dir lifetime | Slice 3 GREEN |

## Scope

In: G1 (a graph per step and (build mode, client) pair), G2 (`buildMode` / `client` in the lists, `buildMode` / `client` / `environment` in the details), G3 (tour `--dev`), G4 (two-mode seed, isolation check), from [analysis.md](analysis.md).

Out: dev mode speed, warm browser cache tour, the tour on Electron, dynamic sections, a multi-attribute extractor filter (analysis § 2).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/583
- [analysis.md](analysis.md); #580 [plan](../580-FEATURE-page-load-timings/tdd-implementation-plan.md)
- Branch: `claude/583-page-load-build-mode`, from `_integration`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the Report test on the current seed | ⬜ pending | `report.pageLoadHistory` green before changes |
| 1 | Graphs split by (build mode, client) | ⬜ pending | `report.pageLoadHistory`: `data-point-count` per graph |
| 2 | Lists and details show build mode and client | ⬜ pending | `report.pageLoadHistory`: `client` column, details values |
| 3 | Tour `--dev` against the Vite dev client | ⬜ pending | `loadTimingsTour.integ.test.ts` dev describe |
| 4 | Docs, nonreg, AC | ⬜ pending | `nonreg:filesystem` |

## Locked implementation defaults

| Id | Default | Goals |
|---|---|---|
| D1 | Virtual attribute `series` on `PageLoadMeasurement` (`mustacheStringTemplate` `{{step}}/{{buildMode}}/{{client}}`, `optional`, not editable, not in `viewAttributes`); 8 extractors `initialLoads<Pair>` / `reportRoutes<Pair>` (`Pair` ∈ `ProductionWebApp`, `ProductionElectron`, `DevelopmentWebApp`, `DevelopmentElectron`) filtering `series` with an anchored regex, ordered by `measuredAt`; `initialLoads` and `routes` stay for the lists, `reportRoutes` goes | G1 |
| D2 | Section order: 4 initial load graphs, initial load list, 4 first report display graphs, route list; pair order as above; labels `Initial page load, <build> build, <client>: duration (ms)` | G1 |
| D3 | `client` added to `PageLoadMeasurement.viewAttributes` after `buildMode`; lists unfiltered | G2 |
| D4 | Details Report unchanged unless its test fails | G2 |
| D5 | `--dev`: default URL `localhost:5173`, scheme from the certificate Vite gets; no production build check; `--serve --dev` checks 3080 and 5173 are free, starts the server release API-only (`NODE_ENV=development`, no copy of `dist/`, polled at `https://localhost:3080`) and Vite's bin with the server's certificate (`MIROIR_TLS_CERT` / `MIROIR_TLS_KEY`); warm-up of the whole tour in a throwaway context with `loadTimings=off`; resource timing buffer raised by an inline script in `index.html`; output line `build mode: …, client: … (<url>)`; exit 1 on a step of another build mode | G3 |
| D6 | Seed loads A (production web, 3 steps, #580 uuids), B (production web, initial load), C (development web, initial load + report), D (production Electron, initial load), one `pageLoad` uuid each; `data-point-count` on the graph container; empty graphs checked `present: false`; MiroirTest `issue` `580, 583` | G4 |

## Allocated UUIDs / keys

| Element | Value |
|---|---|
| Seed page load B / C / D | allocated in Slice 1 with `uuidgen`, recorded in Realization |
| Seed rows of B, C, D | same |
| MiroirTest suite | `report.pageLoadHistory` (existing, `24f5c213-c384-47b3-9648-0f91ddaa89ee`) |
| Report keys | `initialLoads<Pair>`, `reportRoutes<Pair>` |

## Test execution conventions

| What | Command |
|---|---|
| Report MiroirTest | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.pageLoadHistory --mode integ` |
| Rebuild Meta after JSON / seed change | `npm run build -w miroir-app-meta` |
| Meta model validation | `npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts` (manifest `default-meta-modelValidation`) |
| Transformers in assets | `npm run nonreg:unit -- --runner shared --only unit-498-block-model` (or its argv from the manifest) |
| Load timing unit tests | `npm run testByFile -w miroir-standalone-app -- 4_view/loadTimings/` |
| Bundle guard | `npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py` |
| Tour prerequisites | `npm run build:release -w miroir-server`; production tour also `npm run build -w miroir-standalone-app`. One tour flag per run. |
| Tour, production | `MIROIR_LOAD_TIMINGS_TOUR=1 MIROIR_TOUR_BROWSER=/opt/pw-browsers/chromium npm run testByFile -w miroir-standalone-app -- loadTimingsTour.integ` |
| Tour, dev | `MIROIR_LOAD_TIMINGS_TOUR_DEV=1 MIROIR_TOUR_BROWSER=/opt/pw-browsers/chromium npm run testByFile -w miroir-standalone-app -- loadTimingsTour.integ` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json`, same for `miroir-app-meta` |

## Slice 0 — Characterize

**Status:** ⬜ pending

### Goal
The current `report.pageLoadHistory` passes on the current seed, so later failures are ours.

### Validation
Report MiroirTest command above: green.

## Slice 1 — Graphs split by (build mode, client)

**Status:** ⬜ pending

### Goal
A maintainer sees one initial load graph and one first report display graph per pair, each with its own rows only (G1, G4).

### RED
In `24f5c213-…json`, PageLoadHistory test: replace the 2 graph test id checks (`graph-line-initialLoads`, `graph-line-reportRoutes`) by `expectElement` on `graph-line-<key>` with `attribute: {name: "data-point-count", value}` (string values): `initialLoadsProductionWebApp` 2, `initialLoadsProductionElectron` 1, `initialLoadsDevelopmentWebApp` 1, `reportRoutesProductionWebApp` 1, `reportRoutesDevelopmentWebApp` 1; then, without timeout (checked once), `present: false` for `initialLoadsDevelopmentElectron`, `reportRoutesProductionElectron`, `reportRoutesDevelopmentElectron`. Seed in `Meta.ts`: `pageLoadSeedRecord` takes `{ pageLoad, buildMode, client }`; add loads B, C, D. `initialLoad` text count becomes 4, `route:model` stays 1. `issue` becomes `583`; `description` rewritten. Rebuild `miroir-app-meta`. Expected red: no `graph-line-initialLoadsProductionWebApp`.

### GREEN
- `0266c0b8-…json`: `series` virtual attribute (D1), next free tag id, `virtualAttribute: {interpolation: "runtime", transformerType: "mustacheStringTemplate", definition: "{{{step}}}/{{{buildMode}}}/{{{client}}}"}` (runtime interpolation reads the instance fields; triple braces: no HTML escaping).
- Report `02dd2ead-…json`: 8 extractors, 8 graph sections (D2) replacing the 2; `reportRoutes` removed.
- `GraphComponent.tsx`: `data-point-count={graphData.data.length}` next to `data-testid`.

### Refactor checkpoint
Seed: one record function, loads as data. Report graph `config` blocks are identical: no reuse mechanism in Report JSON, keep them flat.

### Validation
`npm run build -w miroir-app-meta`; Report MiroirTest; Meta `modelValidation`; typecheck `miroir-app-meta`, `miroir-standalone-app`; `npm run nonreg:filesystem -- --runner shared --scope smoke,ui,core`.

## Slice 2 — Lists and details show build mode and client

**Status:** ⬜ pending

### Goal
Every list row and the details show which build and client measured it (G2).

### RED
PageLoadHistory test: `byText` `electron` count 1 (row D's `client` cell): the RED. Characterization (already green): `byText` `development` count 2 (load C's two rows' `buildMode` cells); PageLoadMeasurementDetails `byDisplayValue` `production`, `webApp`, `dev`.

### GREEN
`client` in `viewAttributes` of `0266c0b8-…json`. Details: only if its checks fail.

### Refactor checkpoint
None expected.

### Validation
`npm run build -w miroir-app-meta`; Report MiroirTest; Meta `modelValidation`; `npm run nonreg:filesystem -- --runner shared --scope smoke,ui,core`.

## Slice 3 — Tour `--dev`

**Status:** ⬜ pending

### Goal
A framework developer runs `npm run loadTimings -w miroir-standalone-app -- --dev --serve` and gets the 3 steps measured on the Vite dev client, stated as `development` (G3).

### RED
`loadTimingsTour.integ.test.ts`: second `describe`, skipped unless `MIROIR_LOAD_TIMINGS_TOUR_DEV=1`, spawns `scripts/load-timings.mjs --dev --serve --clean --out <file>`; checks: the 3 steps settled (message carries the durations), every step `buildMode: "development"`, stdout has `build mode: development, client: webApp`, the initial load fetched `.tsx` modules and more than 250 files, 3 of 3 recorded, exit 0. Red: `--dev` is an unknown option (`parseArgs` strict), so no `--out` file: `beforeAll` fails on ENOENT. The production describe also checks `build mode: production, client: webApp`.

### GREEN
- `serveBuiltClient.mjs`: `startServer({ url, name, apiOnly })`: `apiOnly` skips the copy and runs `NODE_ENV=development`; returns `{ stop, certsDir }` (callers `coverage-tour.mjs`, `self-test.mjs`, `load-timings.mjs` adapted); `startViteDevServer({ url, certsDir })` spawns `node <root>/node_modules/vite/bin/vite.js --port 5173 --strictPort` in the package with `MIROIR_TLS_CERT` / `MIROIR_TLS_KEY`, its log in the work dir, polls until it answers, returns stop. The child env is explicit: `VITE_*` (`VITE_TEST_MODE` would turn the measurement off), `MIROIR_TEST_PROFILE`, `MIROIR_TEST_STORAGE` removed, `NODE_ENV=development`, `--max-old-space-size=8192` as the `build` script. `startViteDevServer` gets the work dir (the server's `stop` deletes it). `stop` waits for the process exit; Vite stops before the server. `answers()` handles http and https.
- `load-timings.mjs`: `--dev`; `--url` without a parseArgs default, computed from `--dev`; port checks; skip `requireProductionBuild`; warm-up tour with `loadTimings=off`, each page waited on a DOM signal (spinner `[data-miroir-loading]` gone, then the page's own marker), tolerating a Vite optimizer reload; build mode line and check.
- `src/index.html`: inline `<script>` before the module entry raising `performance.setResourceTimingBufferSize` to 10000 (guarded); `loadTimingBrowser.ts` l.71 no longer lowers it.

### Refactor checkpoint
One `waitUntilAnswers(url, timeoutMs, onExit)` for both starters; tour navigation shared by warm-up and measured run.

### Validation
Both tour commands (one flag per run); load timing unit tests; bundle guard (`index.html` change); `npm run miroir-env -- check --strict --tracked-clean` after the tour; `npm run nonreg:filesystem -- --runner shared --scope smoke,tooling,ui`.

## Slice 4 — Docs, nonreg, AC

**Status:** ⬜ pending

### Steps
- `docs/reference/load-timings.md`: Report split, `series` (computed in the local cache and in SQL, not by the in-memory store runner: a `runBoxedQueryAction` on storage filtering on it returns nothing), `--dev`, warm-up, the env flag of the dev test.
- `docs/reference/testing.md`: seed note.
- Nonreg manifest: no new step (same suite); the tour stays on demand.

### AC checklist

| Issue goal | Proof |
|---|---|
| a graph per (build mode, client) for initial load and first report display | Slice 1 MiroirTest |
| lists show `buildMode` and `client` | Slice 2 MiroirTest |
| details show `buildMode`, `client`, `environment` | Slice 2 MiroirTest |
| tour measures dev mode, output states it | Slice 3 integ test |
| seed of both modes, graphs isolated | Slice 1 MiroirTest |

### Validation
Pre-push gate (AGENTS.md); `npm run nonreg:filesystem -- --runner shared`.

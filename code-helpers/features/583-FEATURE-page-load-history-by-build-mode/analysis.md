# 583 — Page load history split by build mode and client, and a dev-mode tour

> Follow-up of #580. The `PageLoadHistory` Report mixes production and development rows, and web page and Electron rows, in the same graphs; the load timings tour only measures the production build. This analysis frames how the Report separates the series and how the tour measures the Vite dev client.

- Issue: https://github.com/miroir-framework/miroir/issues/583
- Prerequisite: #580 (PR #581), [analysis](../580-FEATURE-page-load-timings/analysis.md), [plan](../580-FEATURE-page-load-timings/tdd-implementation-plan.md)
- Reference: [docs/reference/load-timings.md](../../../docs/reference/load-timings.md)
- Key sources: [load-timings.mjs](../../../packages/miroir-standalone-app/scripts/load-timings.mjs), [serveBuiltClient.mjs](../../../packages/miroir-standalone-app/scripts/serveBuiltClient.mjs), [Meta.ts](../../../packages/miroir-app-meta/src/Meta.ts), [GraphReportSectionView.tsx](../../../packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Graph/GraphReportSectionView.tsx)

## 1. Goals

| Id | Story |
|---|---|
| G1 | **Read one trend at a time.** In order to see whether a change made loading slower, as an application maintainer reading the Page load history, I can see the initial load and the first report display of each (build mode, client) pair in its own graph, without dev rows in the production graph. |
| G2 | **Know what a row measured.** In order to compare rows that are comparable, as an application maintainer, I can read the build mode and the client of each row in the history lists, and the build mode, client and environment of one measurement in its details. |
| G3 | **Measure dev mode on demand.** In order to explain why the app feels slow in development, as a framework developer, I can run the load timings tour against the Vite dev client (https://localhost:5173, API server on 3080) and get the same steps, with the build mode it measured stated in the output. |
| G4 | **Keep the split tested.** In order to change the Report without breaking the split, as a framework developer, I have the MiroirTest `report.pageLoadHistory` seeded with rows of both build modes (and of both clients) that checks each graph shows only its own rows. |

## 2. Non-goals

| Excluded | Owner |
|---|---|
| Making dev mode faster | out of scope (#583) |
| A warm browser cache run of the tour | later option (#583 "Out of scope") |
| Running the tour on Electron | not asked; Electron rows come from real use |
| A dynamic Report section per pair found in the data | Reports have a fixed section list; not needed for 4 known pairs |
| A multi-attribute extractor `filter` in the core schema | rejected below (D1); its own issue if another Report needs it |

## 3. Decision record

### D1 — How a graph selects its (step, build mode, client) rows (G1)

The `extractorInstancesByEntity` `filter` takes one `attributeName` (`miroirFundamentalType.ts`, `ExtractorInstancesByEntity.filter`). A graph needs three conditions.

| Option | Pros | Cons | Status |
|---|---|---|---|
| A. One extractor per step, one Report `runtimeTransformers` `filterList` per (step, pair), predicate `buildMode == X && client == Y` | No Entity change; runtime transformers reach the graph (`ReportViewWithEditor.tsx` l.131-147, results spread into the form values l.288, graph reads `formik.values` in `ReportSectionViewWithEditor.tsx` l.617) | About 300 lines of repeated predicate JSON; a failing transformer is stored as data (`TransformerFailure` is not `Domain2ElementFailed`, `QuerySelectors.ts` l.1229) and drawn as a bogus graph | Rejected (review finding 12) |
| B. Extend the extractor `filter` to a list of conditions | Short Report JSON | Core schema change, every store must implement it | Rejected: too wide for one Report |
| C. Record a combined key and filter on it with a regex | One extractor per graph | New stored attribute; existing rows lack it | Rejected |
| D. One graph per step with a `colorField` per pair | 2 graphs | The issue asks a graph per pair | Rejected |
| E. A **virtual attribute** `series` on `PageLoadMeasurement`, `mustacheStringTemplate` `{{{step}}}/{{{buildMode}}}/{{{client}}}` (runtime interpolation); one extractor per graph, `filter: {attributeName: "series", value: "^initialLoad/production/webApp$"}`, `orderBy: measuredAt` | Same Report shape as `BundleSizeHistory` (`e8c6faa5-…`); computed from the stored fields before `filter` / `orderBy` in the local cache selectors (`ExtractorVirtualAttributes.ts` `overlayAndFilterExtractorInstances`), which the Report path uses, so existing rows are covered (the store-side in-memory runner does not compute it: a storage query filtering on `series` returns nothing); never stored (stripped on create/update, `docs/reference/api/entity.md` "Virtual attributes"); compiles to SQL if the Meta store is ever Postgres | One more read-only field in the details form | **Accepted** |

`series` is `optional: true`, `display: {editable: false, modifiable: false}`, as Book `citation` (Library `e8ba151b-…`). It is not in `viewAttributes`.

### D2 — Which pairs, in which order (G1)

`buildMode` is `production | development`, `client` is `webApp | electron` (`loadTimingTypes.ts` l.35-36); Electron in dev loads the Vite dev server, so all 4 pairs occur.

| Option | Status |
|---|---|
| All 4 pairs, fixed, grouped by step: initial load graphs (production web page, production Electron, development web page, development Electron), the initial load list, the 4 first report display graphs, the route list | **Accepted**: keeps the #580 layout, a step's 4 graphs sit together for comparison |
| Grouped by pair | Rejected: the lists would sit between unrelated graphs |
| Only the pairs with rows | Rejected: needs dynamic sections (non-goal) |

A pair without rows shows the existing empty state of `GraphReportSectionView` ("No data available for graph: <label>", l.167-182) and has no `graph-line-*` test id.

Extractor keys: `initialLoads<Pair>` and `reportRoutes<Pair>` with `<Pair>` in `ProductionWebApp`, `ProductionElectron`, `DevelopmentWebApp`, `DevelopmentElectron`; test ids `graph-line-initialLoadsProductionWebApp`, … The #580 `reportRoutes` extractor goes (only its graph used it); `initialLoads` and `routes` stay for the lists.

### D3 — Lists (G2)

| Option | Status |
|---|---|
| Keep the 2 lists, unfiltered, with `buildMode` and `client` columns | **Accepted** |
| One list per pair (8 lists) | Rejected: noise; the columns are enough to tell rows apart |

The list columns are the Entity's `viewAttributes` (`getColumnDefinitionsFromEntityAttributes.ts` l.161-162). `PageLoadMeasurement` has `buildMode` and lacks `client` (programmatic listing of `viewAttributes`: `measuredAt, step, page, durationMs, settled, chunkCount, chunkTransferBytes, dataRequestCount, buildMode`). Add `client` after `buildMode`. `environment` stays in the details only.

### D4 — Details (G2)

`PageLoadMeasurementDetails` (`193c3dea-792d-471a-88a0-546e4b5e81cf`) has one `objectInstanceReportSection` with no attribute list, which renders the whole instance. Whether `buildMode`, `client` and `environment` are displayed is checked by the MiroirTest (`byDisplayValue`), not assumed; the Report changes only if the test fails.

### D5 — Dev-mode tour (G3)

| Choice | Decision |
|---|---|
| Switch | `--dev` on `load-timings.mjs`. Without it nothing changes. |
| URL | `--url` keeps naming the page; default `https://localhost:3080`, and with `--dev` `<scheme>://localhost:5173`, the scheme following the certificate Vite gets: with `--serve`, the one `startServer` uses (repo `certs/` or its self-signed one), so always https; without `--serve`, https when `MIROIR_TLS_CERT`/`MIROIR_TLS_KEY` or `certs/localhost*.pem` exist, as `vite.config.js` l.21-24 decides. The page origin is `localhost`, which the `dev` environment's `server.corsAllowedOrigins` allows (http and https `localhost:5173`). |
| Production build | not required with `--dev` |
| `--serve --dev` | checks ports 3080 and 5173 are free; starts the server release for the API only: no copy of `dist/`, `NODE_ENV=development` (in `prod` mode the server throws without `release/client/index.html`, `server.ts` l.853-862; the mode only changes SPA serving), polled at `https://localhost:3080`, not at the page URL; then Vite through its bin (`node <root>/node_modules/vite/bin/vite.js --port 5173 --strictPort`, as the package's `build` script calls Vite), with `MIROIR_TLS_CERT` / `MIROIR_TLS_KEY` set to the server's certificate; polls 5173 with the scheme's client; stops both at the end. A Vite serve seeds `.miroir/test-*` copies (`vite.config.js` l.52-56): ignored files, `miroir-env check --tracked-clean` must stay clean. |
| Warm-up | the whole tour (home, report, model) once in a throwaway browser context with `loadTimings=off` explicitly (the `dev` environment turns the measurement on, `environments/dev.json` l.13; `--clean` only removes the measured page load), waiting for each page to render. Vite transforms modules on first request and its dependency optimizer may reload the page when a lazy route brings a new dependency, which would wipe `window.__miroirLoadTimings` mid-tour. The measured run is a fresh context, as in production. |
| Resource buffer | the browser keeps 250 resource timing entries by default; `configureLoadTimings` raises it (`loadTimingBrowser.ts` l.71) after the static module graph of `index.tsx` was fetched, which in dev is hundreds of modules. Fix in the page: an inline script in `index.html`, before the module entry, sets `performance.setResourceTimingBufferSize`, so a dev initial load counts all its files. |
| Output | a first line `build mode: <buildMode>, client: <client> (<url>)` from the measured steps; exit 1 when a step's `buildMode` is not the expected one (`development` with `--dev`, `production` otherwise) |
| Integration test | `loadTimingsTour.integ.test.ts` gets a second `describe`, skipped unless `MIROIR_LOAD_TIMINGS_TOUR_DEV=1`, that runs `--dev --serve --clean --out`: 3 steps settled, every step `buildMode: "development"`, the output line, the initial load fetched source modules (`.tsx` files: Vite's `root` is `src`, so URLs have no `/src/` prefix) and more than 250 files. A step cut at `maxStepMs` (30 s, environment only) fails the test with the step's duration in the message. |

### D6 — Seed and test (G4)

| Choice | Decision |
|---|---|
| Seed | `pageLoadSeedRecord` takes the page load uuid, build mode and client (it hard-codes one page load today, `Meta.ts` l.152). Rows: production web page load A (initial load, report, model: the 3 #580 rows, unchanged uuids), production web page load B (initial load), development web page load C (initial load, report), production Electron load D (initial load). |
| Isolation check | each rendered graph carries `data-point-count`. Expected: `initialLoadsProductionWebApp` 2, `initialLoadsProductionElectron` 1, `initialLoadsDevelopmentWebApp` 1, `reportRoutesProductionWebApp` 1, `reportRoutesDevelopmentWebApp` 1; the 3 other graphs absent (`expectElement` `present: false`, after the others appeared). A missing build mode condition gives 3 in the production web page graph; a missing client condition gives 3 there too. |
| Why an attribute | the points are D3 SVG; test targets have no CSS selector (`componentTestTargets.ts` l.208-238), so an attribute on the graph container (`GraphComponent.tsx` l.664-668), checked with `expectElement` `attribute` (`runComponentTestSteps.ts` l.402-404), is the cheapest exact count. |
| Lists | `byText` `development` and `electron` (cells of rows C and D). The `client` column is the 10th of an ag-grid without `suppressColumnVirtualisation`: verify it renders under happy-dom in the first RED run; if not, check the column header. |
| Details | `PageLoadMeasurementDetails` test adds `byDisplayValue` checks for `production`, `webApp` and `dev`. |
| Metadata | the MiroirTest `issue` becomes `580, 583`; the replaced `graph-line-initialLoads` / `graph-line-reportRoutes` steps go. |
| Other checks of the JSON | `miroir-app-meta/tests/modelValidation.unit.test.ts` (meta_model and meta_data against the schemas), `transformerBlockModelAssets.unit.test.ts` (nonreg `unit-498-block-model`, every transformer in assets). `Meta.ts` reaches the test through the built package: `npm run build -w miroir-app-meta` after a seed change. |

## 4. Current state

| Piece | State | Aligned |
|---|---|---|
| `PageLoadMeasurement` Entity `0266c0b8-4dc8-4a14-bcef-239a85a5de2d` | `buildMode`, `client` (required strings), `environment` (optional) recorded on every step | yes |
| `PageLoadHistory` Report `02dd2ead-7b8d-4160-99c9-9f4e9a1c051b` | extractors `initialLoads` (`step ^initialLoad$`), `reportRoutes` (`^route:report$`), `routes` (`^route:`); 2 graphs on `initialLoads`/`reportRoutes`, 2 lists on `initialLoads`/`routes` | no: no build mode / client condition |
| `PageLoadMeasurementDetails` Report `193c3dea-792d-471a-88a0-546e4b5e81cf` | one `objectInstanceReportSection` | to check (D4) |
| MiroirTest `report.pageLoadHistory` `24f5c213-c384-47b3-9648-0f91ddaa89ee` | seed `testConfiguration_metaPageLoadSeed` `a8dd8a49-97de-426c-beb7-c32d0f1beb26`: 3 rows of one production web page load; checks graph test ids, list labels, `route:model` and `initialLoad` counts of 1 | no: one build mode |
| `load-timings.mjs` | production build only (`requireProductionBuild`), default URL `https://localhost:3080`, `--serve` copies `dist/` into the server release | no |
| `loadTimingsTour.integ.test.ts` | production tour under `MIROIR_LOAD_TIMINGS_TOUR=1` | partly |
| `buildMode` at record time | `import.meta.env?.DEV ? "development" : "production"` (`loadTimingBrowser.ts` l.251) | yes |

The existing count assertions of the test (`route:model` once, `initialLoad` once) change with the new seed: `initialLoad` appears in the initial load list once per initial load row (4).

## 5. Key reuse

| Piece | Location |
|---|---|
| Virtual attribute, mustache | Library Book `citation` (`e8ba151b-d68e-4cc3-9a83-3459d309ccf5`); `VirtualAttributes.ts`, `ExtractorVirtualAttributes.ts` |
| Graph empty state, test id | `GraphReportSectionView.tsx` l.167-196 |
| `startServer`, `launchBrowser`, `answers` | `serveBuiltClient.mjs` (callers: `coverage-tour.mjs`, `load-timings.mjs`, `self-test.mjs`) |
| Vite TLS from env | `vite.config.js` l.21-24 (`MIROIR_TLS_CERT`, `MIROIR_TLS_KEY`) |
| BundleSizeHistory split by application (same Report shape) | `e8c6faa5-a117-4afd-b7ae-4a40c6111f95` |

## 6. Adversarial review, round 1

An independent reviewer checked every citation and attacked the design. Findings and outcome:

| # | Finding | Outcome |
|---|---|---|
| 1 | `--serve --dev` server in `NODE_ENV=production` needs a copied client | D5: `NODE_ENV=development` for the API-only server |
| 2 | `startServer` polls the page URL, HTTPS only | D5: API URL polled separately, ports checked, Vite polled with its scheme, Vite bin spawned |
| 3 | Home-only warm-up leaves routes cold; optimizer reload | D5: warm-up runs the whole tour |
| 4 | Resource timing buffer (250) cuts the dev initial load file list | D5: buffer raised by an inline script in `index.html`; integ check > 250 files |
| 5 | Warm-up records rows (`dev` turns the measurement on) | D5: warm-up URL carries `loadTimings=off` |
| 6 | Default dev scheme ignores the self-signed certificate and the env vars | D5: scheme follows the certificate Vite gets |
| 7 | A failing `filterList` is drawn as a bogus graph; its `orderBy` can throw | moot: D1 option E |
| 8 | `present: false` exists | D6: empty graphs checked with it |
| 9 | CORS comes from `environments/dev.json` | D5 cites it; origin must be `localhost` |
| 10 | List columns citation | corrected (D3) |
| 11 | G2 lists untested; ag-grid virtualisation | D6 "Lists" |
| 12 | A virtual attribute is simpler than 8 runtime transformers | D1: option E accepted |
| 13 | Name the validation tests; rebuild Meta after the seed change | D6 "Other checks" |
| 14 | Source module URLs have no `/src/`; `maxStepMs` flake | D5 integration test row |
| 15 | Vite serve seeds `.miroir/test-*` | D5 |
| 16 | `issue` metadata, replaced test ids, per-load `pageLoad` | D6 |

## Next step

`tdd-implementation-plan.md` in this folder.

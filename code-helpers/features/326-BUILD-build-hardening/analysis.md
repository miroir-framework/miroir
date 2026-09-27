# 326 — Build hardening before release

> Clears every critical and high `npm audit` advisory, removes floating version ranges so that only reviewed versions enter the build, and makes the content of every standalone-app and Electron sub-bundle traceable to the dependency that brought it in, with CI guards that keep bundle size under control over time. An immediate size reduction is secondary.

Related issue: https://github.com/miroir-framework/miroir/issues/326
Related issues: #321 (environment configuration, deletes Jenkins-era `ci/build`, leaves `ci/release` alone), #325 (linting, adds a lint step to `pr-checks.yml`), #286 (component-test bundle guard), #244 (CopilotKit kept out of the entry)
Related docs: [`docs/internals/code-splitting.md`](../../../docs/internals/code-splitting.md)
Key sources: [`packages/miroir-standalone-app/vite.config.js`](../../../packages/miroir-standalone-app/vite.config.js), [`packages/miroir-standalone-app/vite/`](../../../packages/miroir-standalone-app/vite/), [`packages/miroir-standalone-app-electron/package.json`](../../../packages/miroir-standalone-app-electron/package.json), [`.github/workflows/`](../../../.github/workflows/), [`ci/release/release_lib/lerna_ops.py`](../../../ci/release/release_lib/lerna_ops.py)

**Document role:** analysis and decision record. The decisions were settled with A in two grilling rounds (Q1 to Q26) in the project thread on 2026-09-27; `D<n>` below is `Q<n>` there.
**Status:** decisions confirmed, D4 revised after grilling (see D4). Implementation per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

All measurements below were taken on 2026-09-27 in a cloud container, after `./build-all.sh devBuild` on `_integration` (`a4a17be` for the tree, `576bec5` for the build); sizes did not change between the two.

---

## Decision record

| # | Decision | Choice |
|---|---|---|
| D1 | What blocks the release | **Critical/high fixes, exact pinning and lockfile enforcement.** Bundle tracing and guards land in this issue but do not block. Size cuts found by tracing get their own issues. |
| D2 | Audit scope | **Dev tooling and shipped code, in every workspace package** (including `miroir-homepage`, `miroir-sandbox`). |
| D3 | Lerna | **Upgrade 9 → 10, keep it** (`ci/release` uses `lerna version`, `lerna ls --since`). |
| D4 | xlsx (no fixed version on npm) | **Revised after grilling, pending A's pick**: remove `xlsx` with its two unused files (recommended), or SheetJS 0.20.3 as a CDN or vendored tarball. See D4 below. |
| D5 | undici 5.29 under `@cursor/sdk` | **Root `overrides` to a fixed undici**, verify the Cursor path; if it breaks, a dated audit exception rather than dropping the SDK. |
| D6 | Third-party specs | **Exact versions** in `dependencies`, `devDependencies`, root `overrides`; `save-exact=true` in a root `.npmrc`. **Peer dependencies keep ranges.** |
| D7 | Internal `miroir-*` specs | **`*` at dev time; the release rewrites them to the exact version** instead of `^<version>`. |
| D8 | Catching new advisories | **Blocking `npm audit --audit-level=high` in `pr-checks.yml`** plus a Python spec check (no `^`, `~`, `*`, `>`, `x` ranges for third-party deps). Unfixable advisories go into a reviewed exceptions file with a reason and an expiry date. |
| D9 | Lockfile | **`npm ci` in every workflow**, after regenerating the lockfile once so it carries every platform's optional packages. |
| D10 | Upgrades after pinning | **Dependabot on `_integration`**: weekly grouped minor/patch PRs, security PRs as they come, 7-day cooldown on new releases. |
| D11 | Standalone build output | **A Vite plugin** prints one table per build (chunk, raw and gzip size, load kind, top packages) and writes a full JSON report (per chunk, every package with bytes and the import chain from the first Miroir file); an HTML treemap next to it. Vendor sourcemaps fixed. |
| D12 | Finding unused features | **Import chains first, then an on-demand runtime coverage report** (Playwright + Chrome coverage, bytes executed vs shipped per package). |
| D13 | Long-term control | **Two guards against a committed baseline**: an eager/lazy package allowlist (a new third-party package, or a lazy → eager move, fails until listed in the same PR) and a gzip size budget on the eager closure. The #286 guard becomes an allowlist rule. |
| D14 | Electron packaging | **Bundle the main process with esbuild** (`electron` and native modules external); the package holds the bundled main plus the Vite `dist`. The esbuild metafile feeds the same report and guards. |
| D15 | Store drivers in Electron | **Keep all four** (filesystem, IndexedDB, MongoDB, Postgres); the report shows their cost. |
| D16 | Other bundles | **Audit and pinning everywhere; tracing for standalone and Electron now.** The plugin is written so `miroir-sandbox` can reuse it; the `miroir-server` bundle later. |
| D17 | Delivery | **Two PRs to `_integration`**: PR 1 dependencies (D2 to D10) on `claude/build-hardening-81mz9d`, PR 2 bundles (D11 to D16, D18 to D22, D25, D26) on `claude/build-hardening-bundles`. |
| D18 | Budget measure | **Gzip bytes of the eager closure, fail above baseline + 2%**; a PR that shrinks it by more than 2% must lower the committed baseline (ratchet). |
| D19 | Starting baseline | **Today's numbers.** The eager CopilotKit and meta-model loads go to a separate issue, with the report's import chains as evidence. |
| D20 | Where the bundle guard runs | **A second `pr-checks.yml` job**, parallel to the core job, only when `packages/**` or `package-lock.json` change: `./build-all.sh`, Electron main bundle, report, guards. |
| D21 | Sourcemaps | **Still generated; left out of the Electron package** (and any release artefact carrying the standalone `dist`); kept as a CI build artifact. |
| D22 | Chunk-load logger | **Keep it, make it preserve sourcemaps** (preamble through Rollup's `banner`, no new dependency). |
| D23 | GitHub Actions | **Pinned to full commit SHAs** (tag in a comment), bumped by Dependabot's `github-actions` ecosystem with the same cooldown. |
| D24 | Moderate and low advisories | **Listed by the PR check, not blocking.** |
| D25 | Build warnings | **Become report findings with their import chain**: Node modules externalized for the browser, and dynamic imports defeated by static ones. A leaked Node module counts in the allowlist like any package. |
| D26 | Coverage tour | **Playwright script, on demand, against a production build with the Library deployment**: home page, a report with a grid, an instance editor, Runners, the MiroirTest page, the model diagram, the Copilot sidebar. Unexecuted code becomes a removal candidate, reviewed by hand. Playwright is a pinned devDependency. |

**Rationale:** the shared driver is "nothing enters the build unless someone chose it". Exact pins, an enforced lockfile and a cooled-down update bot control *which versions* enter; the audit gate controls *which advisories* are tolerated; the package allowlist and the eager budget control *which code* reaches users. Each mechanism fails a PR at the moment the choice is made, instead of relying on periodic clean-ups.

### D4 — xlsx

**Status:** Accepted in grilling as D4-b, then reopened with A on 2026-09-27 (decision card in the thread) because of two facts found while writing this analysis (§3.1).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D4-a. Remove** ★ | Delete `xlsx` from `miroir-standalone-app`, `Importer.tsx` and `ImportEntityFromSpreadsheetRunner.tsx` | Nothing ships or runs this code today (§3.1); no network or binary added | Spreadsheet import must re-add SheetJS when revived |
| D4-b. CDN tarball | `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"` | Official SheetJS distribution, same API | The cloud-session proxy returns 403 for `cdn.sheetjs.com`, so `npm ci` fails in agent sessions until the environment's network policy allows it |
| D4-c. Vendored tarball | Commit the 0.20.3 tarball, `"xlsx": "file:…"` | Works in every environment | Binary in git; manual upgrades |
| D4-d. Replace library | `exceljs` or `read-excel-file` | Maintained on npm | Rewrites a disabled feature for no current user |

**Decision:** D4-a recommended; the implementation plan follows whichever option A picks.

### D6 / D7 — Version specifications

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **Exact third-party pins + enforced lockfile + cooled-down bot** ★ | `1.2.3` specs, `save-exact`, `npm ci`, Dependabot with `cooldown` | Every version change is a reviewed diff; transitive versions fixed by the lockfile | Update PR volume (mitigated by grouping) |
| Tilde (`~1.2.3`) | Patch updates float | Fewer PRs | A compromised patch release still enters on the next install |
| Pins on direct deps only, `npm install` in CI | — | Simple | Transitive deps float; this is today's gap in `build-linux-runnables.yml` |

Peer ranges stay (`react: >=18.0.0`, `@mui/material: >=5.0.0` in `miroir-react` and `miroir-diagram-class`): they state compatibility for consumers, not what the workspace installs. Internal deps stay `*` because npm workspaces always link the local package; exact pins there would force a manifest edit in 28 packages at every version bump.

### D11 / D13 — Report and guards

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **Custom Vite plugin on Rollup's module graph** ★ (`generateBundle`: `chunk.modules[id].renderedLength`, `this.getModuleInfo(id).importers`) | Rendered (post tree-shaking) bytes per module; import chains; load kind from the chunk graph; output shape we control for the guards | Code to maintain (~200 lines JS in `vite/`) | Adopt |
| `rollup-plugin-visualizer` | Mature HTML treemap | No import chains, no guard-friendly JSON | Adopt **as the HTML view only** |
| `source-map-explorer` on `dist` | No build change | Works from sourcemaps (empty for vendor chunks today, §3.5); no import chains | Reject |
| Vite's built-in size table | Free | Per file only, no package attribution | Reject |

| Guard option | Verdict |
|---|---|
| **Package allowlist split eager/lazy** ★ | Adopt: catches the cause (a new dependency or a lost lazy boundary), independent of byte noise |
| **Eager gzip budget with ratchet** ★ | Adopt: catches growth inside already-allowed packages |
| Per-chunk byte budgets | Reject: chunk names and boundaries change with every refactor (§3.5, misnamed chunk) |
| Total `dist` budget | Reject: dominated by lazy grammars and fonts nobody loads up front |

### D14 — Electron packaging

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **esbuild bundle of `src/main.ts` + `src/preload.ts`** ★ | Only reachable code ships; metafile gives the same attribution as the Vite report; esbuild already in the tree (Vite dependency), added as a pinned devDependency | Native/optional modules of store drivers must be marked external and shipped | Adopt |
| `@vercel/ncc` (as `miroir-server`) | Already used in the repo | The server build keeps every `miroir-*` package external, so it would not shrink `node_modules`; attribution needs webpack stats | Reject |
| Keep `tsc` + prune `dependencies` | Smallest change | Still ships whole packages, no attribution | Reject |

---

## 1. Goals

1. **Clean audit** — In order to release without known serious vulnerabilities as the release maintainer, I can run `npm install` and see no critical or high advisory other than dated, reviewed exceptions.
2. **Chosen versions only** — In order to never ship a dependency version nobody reviewed as a Miroir maintainer, I can rely on exact pins, a lockfile that CI enforces, and new versions arriving only through reviewed Dependabot PRs at least seven days after their release.
3. **Caught on the PR** — In order to keep the audit and the pins clean as a contributor, I get a failing PR check when my change brings a critical or high advisory or a floating version range.
4. **Readable build output** — In order to know what each sub-bundle holds as a developer building the standalone app, I can read in the build output each chunk's size, how it loads and its top packages, and open a full report with the import chain that brought each package in.
5. **Unused features found** — In order to remove code the app never runs as a maintainer, I can run a coverage tour and see bytes shipped versus executed per package.
6. **Size under control** — In order to stop the initial load from creeping up as a maintainer, my PR fails when a new third-party package enters the bundle or moves from lazy to eager without being allowlisted, or when the eager gzip size grows more than 2%.
7. **Lean desktop package** — In order to ship a desktop app with only the code it runs as the release maintainer, I can build an Electron package holding a bundled main process and the Vite `dist`, traced by the same report and guards.

## 2. Non-goals

- Cutting bundle size now: the eager CopilotKit load, the eager meta-model deployment, the defeated `ReportDisplay` lazy route and the Node-only store drivers in the browser build (§3.5) go to a separate issue opened from the first report (D19).
- Linting (#325).
- Environment and deployment configuration, deletion of Jenkins-era `ci/build` and `ci/tests/config` (#321).
- Bundle tracing for `miroir-sandbox` and the `miroir-server` release (later; D16).
- Blocking on moderate and low advisories (D24).
- Pinning the Node.js toolchain version (not raised; workflows use Node 22 and 24 today).

## 3. Current state

### 3.1 Vulnerabilities (misaligned)

`npm audit` at the repo root: **98 vulnerabilities: 4 critical, 50 high, 25 moderate, 19 low.** `npm audit --omit=dev` still reports 1 critical and 39 high, because several workspace packages list build tools in `dependencies` (§3.2), so the flag does not isolate shipped code.

| Severity | Package | Installed | Reaches the tree through | Fix |
|---|---|---|---|---|
| critical | `handlebars` | ≤ 4.7.8 | transitive | available |
| critical | `shell-quote` | ≤ 1.8.4 | transitive | available |
| critical | `tar` | ≤ 7.5.20 | `lerna` 9.0.5 (`@lerna/create`, `pacote`) | `lerna` 10 (major) |
| critical | `vitest` | 3.2.4 | direct devDependency of 17 packages | available |
| high | `electron` | 40.6.1 | `miroir-standalone-app`, `-electron` | 40.10.6 |
| high | `electron-builder` | 26.8.1 | same | 26.15.3 |
| high | `vite` | 7.3.1 | several packages, plus nested copies in `miroir-homepage`, `miroir-sandbox` | 7.3.6 |
| high | `sequelize` | 6.37.7 | `miroir-store-postgres`, standalone devDeps (SQL injection via JSON cast) | available |
| high | `happy-dom` | 20.7.0 | standalone, Electron `dependencies` | 20.14.5 |
| high | `http-proxy-middleware` | 3.0.5 | standalone, Electron | 3.0.7 |
| high | `lodash`, `postcss`, `axios`, `ws`, `hono`, `nx`, `path-to-regexp`, `picomatch`, … | | transitive | available |
| high | `undici` | 5.29.0 | `miroir-ai` → `@cursor/sdk` 1.0.31 → `@connectrpc/connect-node` 1.7.0 | **none compatible** (D5) |
| high | `xlsx` | 0.18.5 | `miroir-standalone-app` | **none on npm** (D4) |

`xlsx` facts behind the D4 revision:
- It is imported only by `src/miroir-fwk/4_view/Importer.tsx` and `src/miroir-fwk/4_view/components/Runners/ImportEntityFromSpreadsheetRunner.tsx`. The runner's entry in `RunnersList.tsx` (lines 55–58) is commented out and nothing imports `Importer.tsx`, so no chunk of the production build contains `xlsx` (checked on the sourcemaps of every chunk).
- `curl https://cdn.sheetjs.com/…` from a cloud session fails with `CONNECT tunnel failed, response 403`.

### 3.2 Version specifications (misaligned)

Across the root and 27 workspace `package.json` files (programmatic count over `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`):

| Spec style | Count | Notes |
|---|---|---|
| `^x.y.z` | 343 | every package; `miroir-standalone-app` alone has 65 |
| `*` or `>=` | 120 | internal `miroir-*` deps (106 are `*`), `mermaid: *` in `miroir-diagram-class`, peer ranges `react: >=18.0.0` and `@mui/material: >=5.0.0` in `miroir-react` and `miroir-diagram-class` |
| exact | 37 | e.g. `diff`, `http-proxy-middleware`, `electron-builder` in some packages |
| `npm:` alias | 2 | root `typescript`, `@typescript/native` (both `^` inside the alias) |

- Root `overrides`: `"yaml": "^2.4.2"`, `"rxjs": "^7.8.1"`.
- No `.npmrc` at the root or in any package, so `npm install x` writes `^`.
- Two internal deps use `^0.5.0-rc.1` instead of `*` (`miroir-diagram-class`, `miroir-localcache-redux` in `miroir-standalone-app`).
- Build and test tools sit in `dependencies` of runtime packages: `electron` in `miroir-localcache`, `miroir-localcache-redux`, `miroir-server`, `miroir-store-filesystem`; `electron-builder` and `happy-dom` in `miroir-localcache`, `miroir-localcache-redux`, `miroir-server`; `vite` in `miroir-core`, `miroir-server`, `miroir-store-filesystem`, `miroir-standalone-app-electron`; `sequelize` in `miroir-store-filesystem`. `miroir-ai`, `miroir-cli`, `miroir-mcp`, `miroir-server` and `miroir-standalone-app` are not `private`, so a consumer install would pull these tools.
- At release, `ci/release/release_lib/lerna_ops.py` rewrites every internal `*` or `file:` edge to `f"^{plan.product_version}"` (line 129).

### 3.3 Lockfile, installs and update process (misaligned)

| Workflow / action | Install command |
|---|---|
| `pr-checks.yml` | `npm ci`, then `npm install --no-save @rollup/rollup-linux-x64-gnu@<rollup version>` because the lockfile omits it (npm/cli#4828) |
| `build-linux.yml`, `build-mac.yml` | `npm ci`, then `npx lerna run devBuild --scope=miroir-standalone-app` |
| `build-linux-runnables.yml` (6 jobs), `.github/actions/build-artefacts-linux`, `.github/actions/checkout` | `npm install --no-audit --prefer-dedupe` ("so Linux/macOS optional deps resolve correctly") |
| `build-sandbox-for-github-pages.yml` | `npm install` |
| `release-tree.yml` | `npm ci --ignore-scripts` |

- No `.github/dependabot.yml`; no other update bot.
- Actions are referenced by floating tags: `actions/download-artifact@v4` (14), `checkout@v6` (11) and `@v4` (1), `setup-node@v6` (10) and `@v4` (1), `upload-artifact@v4` (9), `cache@v4` (6), `upload-pages-artifact@v3`, `setup-python@v5`, `deploy-pages@v4`.

### 3.4 Lerna and nx

- `lerna` 9.0.5 and `nx` 22.5.3 (root devDependency and its dependency). `lerna.json` holds `"version": "0.5.0-rc.2"` while packages are at `0.5.0-rc.1`.
- Users: `ci/release/release_lib/lerna_ops.py` (`npx lerna version`), `ci/release/release_lib/plan.py:64` (`npx lerna ls --since`), the two `build-*.yml` workflows above, and the `watch` script of `miroir-localcache`. The root `package.json` `nx.targets` block serves `lerna run`.

### 3.5 Standalone app bundle (misaligned)

Configuration (`vite.config.js`): `build.sourcemap: true`, `build.manifest: true`, `rollupOptions.output.manualChunks: resolveManualChunk` from `vite/manualChunks.js` (5 names: `vendor-react`, `vendor-copilotkit`, `vendor-d3`, `vendor-ag-grid`, `vendor-mui`), plugins `miroirManualChunkLoadLogger()`, `nodePolyfills({ include: ["crypto"] })`, `react(...)`. `optimizeDeps.exclude` lists the Node store drivers, which affects the dev server only.

Build output (`npm run build -w miroir-standalone-app`, 1m49s; full `./build-all.sh devBuild` 3m10s):

| Measure | Value |
|---|---|
| JS chunks | 387 files, 27.07 MB raw, 6.23 MB gzip |
| Sourcemaps | 53.6 MB |
| KaTeX fonts | 60 files, 4.39 MB |
| Eager closure (`index.html` entry + static `imports`, from `dist/.vite/manifest.json`) | 7 chunks, **10.40 MB raw, 2.71 MB gzip** |
| Distinct sources in chunk sourcemaps, grouped by npm package or workspace package | 520 |

The 7 eager chunks: `index-*.js` (3.16 MB), `vendor-copilotkit` (3.06 MB), `mermaid-VLURNSYL-*.js` (1.95 MB), `vendor-ag-grid` (1.03 MB), a second `index-*.js` (0.63 MB), `vendor-mui` (0.34 MB), `vendor-react` (0.23 MB). `index.html` modulepreloads all of them.

Findings the report must make visible (measured with the logger disabled so that vendor sourcemaps exist; bytes are source bytes from `sourcesContent`, not rendered bytes):

1. **Vendor sourcemaps are empty.** `vite/chunkLoadLoggerPlugin.js` returns `{ code: preamble + code }` from `renderChunk` with no `map`; Vite warns "Sourcemap is likely to be incorrect: a plugin (miroir-manual-chunk-load-logger) was used to transform files, but didn't generate a sourcemap" and the five `vendor-*.js.map` files have 0 sources. With `VITE_MIROIR_LOG_CHUNK_LOADS=false` they have 3 (`ag-grid`), 2882 (`copilotkit`), 212 (`d3`), 382 (`mui`), 14 (`react`) sources. Consequence: the #286 guard (`componentTestChunk.286.phase4.unit.test.ts`), which reads sources from the maps, cannot see inside vendor chunks.
2. **CopilotKit is eager**, contrary to `docs/internals/code-splitting.md` ("CopilotKit is not imported from the entry (#244)"). The entry chunk imports about 25 symbols from `vendor-copilotkit`. The chunk holds 2882 modules, of which `@copilotkit/*` is a minority: `refractor` 886 KB, `lucide` 786 KB, `katex` 603 KB, `parse5` 275 KB, `micromark*`, `rxjs` 154 KB, `zod` 149 KB, `marked`, `date-fns`, `highlight.js`, `vite-plugin-node-polyfills` 74 KB. Rollup moves the dependencies of a manual chunk's modules into that chunk, so shared packages the entry needs (`zod`, `rxjs`, the polyfills) land there and drag the whole chunk into the eager set (inferred from the chunk content and the entry's import list).
3. **The chunk named `mermaid-VLURNSYL-*` is not mermaid**: its only source is `packages/miroir-test-app_deployment-miroir/dist/index.js` (the meta-model deployment, 3.8 MB source). Chunk names cannot be trusted for attribution.
4. **Lazy loading of `ReportDisplay` is defeated**: Vite reports it is "dynamically imported by `PageDispatcher.tsx`, `ReportSectionListDisplay.tsx` but also statically imported by `ReportSectionViewWithEditor.tsx`, `HomePage.tsx`, …". Same for `4-tests/uiIntegrationTestRunState.ts`.
5. **Node-only code in the browser build**: 46 "Module X has been externalized for browser compatibility" warnings. Importers: `mongodb` (28), `node-fetch` (4), `socks` (3), `sequelize` (3), `pg-connection-string`, `asn1.js`, `cipher-base`, `hash-base`, `colors`, and workspace `miroir-store-filesystem` (2), `miroir-store-indexedDb` (1). Lazy chunks hold `miroir-store-mongodb` (2.9 MB source), `mongodb` (1.1 MB), `sequelize` (0.9 MB), `@mongodb-js/saslprep` (0.6 MB), `bson` (0.2 MB), reached through `IntegrationTestSession.ts` (`await import("miroir-store-postgres")` line 484, `await import("miroir-store-mongodb")` line 488). The `crypto` polyfill puts `bn.js` (618 KB), `asn1.js`, `cipher-base` in eager chunks.
6. **Unused-feature candidates among lazy chunks**: `@shikijs/langs` (7.95 MB source, one chunk per language: `emacs-lisp`, `cpp`, `wasm`, `wolfram`, `vue-vine`, …) and `@shikijs/themes` (1.45 MB) through `@copilotkit/react-core` → `streamdown` 1.6.11 → `shiki` 3.23.0; `mermaid` (1.98 MB) and `cytoscape` (1.1 MB) through `miroir-diagram-class` (`mermaid: *`) and streamdown; `langium` / `chevrotain` through mermaid.

### 3.6 Electron app (misaligned)

- Main and preload are compiled with `npx tsc src/main.ts --ignoreConfig …` (`build-main`, `build-preload` scripts), not bundled. `ipcServerSetup.ts` imports `express`, `miroir-ai`, `miroir-mcp`, `miroir-localcache-redux` and the four `miroir-store-*` packages.
- electron-builder packs `dist/**/*`, `package.json` and the production `node_modules` of `dependencies`: `diff`, `electron-squirrel-startup`, `happy-dom`, `express`, `http-proxy-middleware`, `miroir-ai`, `miroir-core`, `miroir-mcp`, `miroir-localcache-redux`, **`miroir-standalone-app`** (whose own `dependencies` include React, MUI, CopilotKit, ag-grid, d3, xlsx, …), `miroir-store-*` (4), `miroir-test-app_deployment-admin`, **`vite`**.
- `extraResources` copies `../miroir-standalone-app/dist` (`**/*`, sourcemaps included) to `app`, plus deployment assets.
- No packaged build was measured (electron-builder is not run in PR checks; `build-linux-runnables.yml` builds it on demand).

### 3.7 Other bundles (aligned enough for now)

- `miroir-sandbox`: Vite build aliasing `@miroir-app` to the standalone `src`, `sourcemap` only when `VITE_SOURCEMAP=true`; deployed by `build-sandbox-for-github-pages.yml`.
- `miroir-server`: `@vercel/ncc build src/server.ts` with every `miroir-*` package and `json-diff` external; `release/index.js` is 1.38 MB. The Docker image copies `packages/miroir-server/release`.

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Vite manifest with the chunk graph | `dist/.vite/manifest.json` (`build.manifest: true`) |
| Manual chunk names and resolver | `packages/miroir-standalone-app/vite/manualChunks.js` |
| Chunk-load logger (to fix, D22) | `packages/miroir-standalone-app/vite/chunkLoadLoggerPlugin.js` |
| Runtime chunk-load observer | `packages/miroir-standalone-app/src/chunkLoadTrace.ts` |
| Existing bundle guard (becomes an allowlist rule) | `packages/miroir-standalone-app/tests/4_view/issues/286-react-component-miroir-tests/componentTestChunk.286.phase4.unit.test.ts` |
| Repo check scripts pattern (Python + pytest) | `scripts/check_ml_nomenclature.py`, `scripts/check_bare_console.py`, `scripts/tests/` |
| PR checks workflow | `.github/workflows/pr-checks.yml` (job `core`; #325 adds a lint step) |
| Release rewrite of internal deps | `ci/release/release_lib/lerna_ops.py` (line 129) |
| Ordered full build | `build-all.sh` |
| Chromium for Playwright in cloud sessions | `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH`) |
| esbuild (for the Electron main bundle) | already in `node_modules` through Vite; to be declared as a pinned devDependency |
| Code-splitting reference to update | `docs/internals/code-splitting.md` |

## 5. Proposals / options

Settled in the decision record; the implementation routes per decision are compared there (D4, D6/D7, D11/D13, D14). Remaining implementation defaults, not user decisions:

| # | Default | Reason |
|---|---|---|
| 1 | Policy files: `dependency-policy/audit-exceptions.json` (root), `packages/miroir-standalone-app/bundle-policy.json` and `packages/miroir-standalone-app-electron/bundle-policy.json` (allowlist + eager baseline) | Next to what they govern; reviewed in the same PR as the change |
| 2 | Checkers in Python (`scripts/check_dependency_specs.py`, `scripts/check_audit.py`), the bundle report in JS (`vite/bundleReportPlugin.js`) | AGENTS.md: Python for repo scripts, JS only inside the Vite workflow |
| 3 | Exceptions carry `advisory` (GHSA id), `package`, `reason`, `expires` (at most 90 days ahead) | An expired exception fails the check, forcing a review |
| 4 | Lockfile regenerated once from a clean `node_modules` with `npm install --package-lock-only` on npm 10, then verified by `npm ci` on Linux | Removes the `@rollup/rollup-linux-x64-gnu` workaround in `pr-checks.yml` if the lockfile then carries it |
| 5 | Build and test tools listed in `dependencies` (§3.2) move to `devDependencies` in the pinning slice | Same package.json edit; keeps them out of `--omit=dev` audits, of the Electron `node_modules` and of consumer installs |

---

## Next step

Implementation proceeds per [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).

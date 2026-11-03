# Issue #672 — TDD Implementation Plan

> Testing posture: integration first, no mocks. The behaviour of this issue is visible in two running apps, so the
> main proof is a Playwright smoke run against the **built sandbox** (the same script CI runs, D5), driving the real
> Miroir Tests report. The move of the runtime (D1) is a refactor: the standalone app's existing tests of the runtime
> are its safety net, characterized in Slice 0. New vitest files only for what the smoke run cannot see (profile
> catalog rules, package boundaries).

**Resume note:** slices run in order; each slice's Status and Realization record where the work stopped.

**Document history:** reshaped after an adversarial review (2026-11-03): the move split into Slices 1 to 5 so the
tree stays green between them; smoke markers, build lists, bundle guards and the sandbox bundle report added.

## Scope

In: G1 unit MiroirTests in the sandbox, G2 integ MiroirTests on IndexedDB in the sandbox, G3 one runtime package for
both apps, G4 no fixture apps or testing-library before a run starts, G5 the CI smoke job. Out: the non-goals of
[`analysis.md`](analysis.md) § 2 (other storages in the sandbox, moving the app's tests, publishing the package).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/672
- Analysis: [`analysis.md`](analysis.md)
- Branch: `claude/project-thread-tp3rvw` (from `_integration`)

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize the runtime's tests and the sandbox | ✅ done | per-file baseline of the app's runtime tests; sandbox shows "No renderer" |
| 1 | `runMcpToolRunner` in `@miroir-framework/mcp/client` (D6) | ✅ done | mcp unit test; app tests of the MCP runner unchanged |
| 2 | Test providers take the host's renderers and shell host (D7, in the app) | ✅ done | component test with custom renderers |
| 3 | Only bundled realServer profiles are offered (D4, in the app) | ✅ done | `integrationTestProfileCatalog` unit test |
| 4 | Package scaffold in every build path | ✅ done | package builds; build lists, policies, lockfile |
| 5 | The runtime moves into the package | ✅ done | Slice 0 baseline, same results; bundle guards; self-test |
| 6 | The sandbox runs unit suites | ✅ done | smoke: `fn`, `tr`, `ui` suites pass on the built sandbox |
| 7 | The sandbox runs an integ suite on IndexedDB | ✅ done | smoke: `action` suite passes; sandbox data unchanged |
| 8 | Fixture apps and testing-library load at run start only | ✅ done | smoke guard on the sandbox's bundle report |
| 9 | CI smoke workflow, docs, full nonreg | 🟡 in progress | workflow run on the PR; nonreg |

## Locked implementation defaults

The analysis's decision record (D1 to D11) is binding:

| Decision | Default | Serves |
|---|---|---|
| D1 | private package `miroir-react-testing` in `packages/miroir-react-testing`, tsup one module per source module, `"sideEffects": false` | G1, G2, G3 |
| D2 | keep the run-start dynamic imports; subpath `./report-section` for registering the renderer | G4 |
| D3 | component tests in scope; testing-library loads at run start | G1, G4 |
| D4 | a realServer profile is offered and launchable only when `__MIROIR_TEST_CLIENT_CONFIGS__` holds its config | G2 |
| D5 | separate `sandbox-smoke.yml` workflow, read-only, runner's Chrome via `playwright-core` | G5 |
| D6 | `runMcpToolRunner` moves to `@miroir-framework/mcp/client`; the app file re-exports it | G3 |
| D7 | `shellHost` and `reportSectionRenderers` injected through the component test host | G1, G3 |
| D8 | the app's tests stay; vitest maps every package subpath and `src/*` to the package's `src/` | G3 |
| D9 | package layout `src/4-tests/**`, `src/4_view/**`, moved with `git mv` | G3 |
| D10 | Node stores: optional peers of the package; the sandbox stubs them and polyfills `stream` | G2, G4 |
| D11 | suites a static site cannot pass are documented; the smoke picks passing ones | G1, G2 |

## Allocated UUIDs / keys

No model element and no new MiroirTest. The smoke run uses existing suites of `miroir-app-miroir`, picked in Slice 6
and 7 (unit: one `fn`, one `tr` without testbed, one `ui`; integ: one `action`). DOM markers added for the smoke run:
`data-testid="miroir-test-run-unit"`, `data-testid="miroir-test-run-integ"`, and `data-miroir-test-status`
(`running` | `passed` | `failed`) on the single-test display.

## Test execution conventions

| What | Command |
|---|---|
| App tests, per file, no bail | `npx vitest run --reporter=json --outputFile.json=<file> <files>` in `packages/miroir-standalone-app` |
| One app test | `npm run testByFile -w miroir-standalone-app -- <name>` |
| mcp tests | `npm run test -w @miroir-framework/mcp -- <name>` |
| Build | `npm run build -w miroir-react-testing`, `npm run build -w miroir-standalone-app`, `npm run build -w miroir-sandbox` |
| Smoke | `node packages/miroir-sandbox/scripts/smoke.mjs [--suite <name>] [--integ <name>]` (`vite preview` on `dist/`) |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` (react-testing, standalone-app, sandbox, mcp); `-p packages/miroir-standalone-app/tsconfig.tests.json` for the app's tests |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |

The smoke script is JavaScript: it drives Chromium through `playwright-core` (AGENTS.md: Node when the script needs the
package's Node tooling).

## Slice 0 — Characterize

**Status:** ✅ done

- Run the 79 test files of the app that import the moved modules (no bail, JSON reporter) and record pass / fail per
  file: the bar for Slice 5.
- Build the sandbox, open the Miroir Tests report, record the "No renderer" message and the size of the chunks
  `index.html` loads (G4 baseline).

### Validation

The two commands above.

### Realization

Per-file baseline of the 79 app test files that import the runtime (vitest JSON): 7 tests already fail on `_integration` with `MIROIR_ENV=test-filesystem` (MiroirTestDisplayIntegrationLaunch, MiroirTestListIntegrationLaunch, reportTestInApp, uiIntegrationTestLauncher.integ ×3, uiIntegrationTestLauncher.unit ×1). The sandbox shows "No renderer for report sections of type miroirTestReportSection"; its page loads 5,430,185 bytes in 53 JS files. `mcpToolRunner.253.phase0` already failed (its guard still named `miroir-mcp`).

## Slice 1 — `runMcpToolRunner` in the MCP client

**Status:** ✅ done

**RED:** `packages/miroir-mcp/tests/mcpToolRunner.unit.test.ts`: `runMcpToolRunner` of `@miroir-framework/mcp/client`
returns the FeatureUnavailable envelope when `mcp` is off and the parsed tool answer through an injected `fetch`
(vitest: not reachable through MiroirTest, it is HTTP plumbing; no mock, a fetch function is a parameter).

**GREEN:** `src/mcpToolRunner.ts`, exported by `src/client.ts`; the app's `runMcpToolRunner.ts` re-exports it.

**Refactor checkpoint:** none expected.

### Validation

The RED test; `tests/4_view/issues/253-generic-mcp-tool-runner/mcpToolRunner.253.phase0.unit.test.ts` and
`processCapabilitiesMcp.273.phase6.unit.test.ts` in the app; typecheck mcp.

### Realization

`packages/miroir-mcp/src/mcpToolRunner.ts`, exported by `@miroir-framework/mcp/client`; `tests/unit/mcpToolRunner.unit.test.ts` RED (3 failed) then GREEN. The app's `runMcpToolRunner.ts` re-exports it; `mcpToolRunner.253.phase0` updated to the `@miroir-framework/mcp` names (it was stale since the rename) and passes with `processCapabilitiesMcp.273.phase6`.

## Slice 2 — Test providers take the host's renderers

**Status:** ✅ done

**RED:** a case in `tests/4_view/reportTestActionsIdle.unit.test.ts`'s folder (new
`tests/4_view/miroirTestProvidersRenderers.unit.test.tsx`): `MiroirTestProviders` given a `reportSectionRenderers`
with a custom `miroirTestReportSection` renders it for a Report holding such a section; without it, the outer
providers' renderers apply.

**GREEN:** `shellHost?`, `reportSectionRenderers?` on `ComponentTestRunControls`, `BuildComponentTestWrapperOptions`,
`MiroirTestProvidersProps`; `ComponentTestSandbox` passes the context values; `reportTestEntry.ts` and the component
test helpers pass the app's; `componentTestTools.tsx` stops importing `reportSectionRenderers.tsx`.

**Refactor checkpoint:** one helper reads both contexts in `ComponentTestSandbox`.

### Validation

The RED test; `miroir-component-tests.unit.test.tsx`, `reportTestInApp.integ.test.tsx`; scoped nonreg
`--scope smoke,ui`.

### Realization

`ComponentTestRunControls`, `BuildComponentTestWrapperOptions` and `MiroirTestProvidersProps` take `reportSectionRenderers` and `shellHost`; `MiroirTestProviders` no longer imports the app. `ComponentTestSandbox` passes the raw context values, read with `useReportSectionRenderers()` and the new `useProvidedMiroirShellHost()` of miroir-react (stable across renders). `tests/helpers/reportTestEntry.ts` passes the app's. RED: `tests/4_view/miroirTestProvidersRenderers.unit.test.tsx` (2 failed), then GREEN.

## Slice 3 — Only bundled realServer profiles are offered

**Status:** ✅ done

**RED:** new cases in `tests/helpers/integrationTestProfileCatalog.unit.test.ts`: with no realServer client configs,
`listUiIntegrationProfileCatalogForPicker("webApp")` holds only `emulatedServer-indexedDb` and no realServer profile is
launchable; with the four configs, today's lists.

**GREEN:** `realServerTestClientConfigs.ts` reads the define once; the catalog takes the configured profile names
(default: from the define); picker and launch gate use it.

**Refactor checkpoint:** `integrationTestProfileAssets.ts` reads the configs from the same module.

### Validation

The RED test; `tests/4_view/UiIntegrationTestRunControls.unit.test.tsx`; scoped nonreg `--scope smoke,ui`.

### Realization

`realServerTestClientConfigs.ts` holds the `__MIROIR_TEST_CLIENT_CONFIGS__` define; `BROWSER_LAUNCHABLE_REAL_SERVER_PROFILES` derives from it; `listUiIntegrationProfileCatalogForPicker` and `isUiIntegrationProfileLaunchableInBrowser` take the bundled list (default: this bundle's). Two RED cases in `integrationTestProfileCatalog.unit.test.ts`, then 7/7 pass.

## Slice 4 — Package scaffold in every build path

**Status:** ✅ done

**RED:** `npm run build -w miroir-react-testing` fails (no package).

**GREEN:** `packages/miroir-react-testing` with `package.json` (private, `"sideEffects": false`, exports `.`,
`./report-section`; dependencies exact; optional peers for the Node stores), `tsup.config.js` (as
`@miroir-framework/react`), `tsconfig.json`, an empty `src/index.ts`; `npm install` (lockfile); `build-all.sh` new
stage after `STAGE_UI_SERVICES` and `STAGE_STANDALONE_DEPS`; `pr-checks.yml`, `self-test.yml`,
`build-linux-runnables.yml`, `build-artefacts-linux` (plus `miroir-example-github`, `miroir-fixture-appForTest`);
`bundle-policy.json` lists it `lazy`; a typecheck step in `pr-checks.yml`.

### Validation

Build; `python scripts/check_dependency_policy.py`; `python scripts/rename_packages.py --check`;
`python -m pytest scripts/tests -q`.

### Realization

Package `miroir-react-testing` (private): tsup per-module output, entries `.` and `./report-section`, `sideEffects: false`, Node stores as optional peers. `build-all.sh` stage `test-ui`, `pr-checks.yml` build and typecheck, `self-test.yml`, `build-linux-runnables.yml`, `build-artefacts-linux` action; `.gitignore`; lockfile from `npm install`. `check_dependency_policy`, `rename_packages --check`, `sync_agent_skills --check`, pytest `scripts/tests` (595 passed) pass.

## Slice 5 — The runtime moves into the package

**Status:** ✅ done

**RED:** the Slice 0 files keep their results only if the move is complete; `componentTestChunk.286.phase4` updated
first to look up the package's `componentTests/index` module fails until the move.

**GREEN:** script (`git mv` the 70 files, rewrite their app-relative imports, rewrite the 107 importers to
`miroir-react-testing/src/...`, app `src/` to the package entries); package `constants.ts`, `4_view/constants.ts`,
`loglevelnextImporter.ts`, `config/logging/catch-all.json`, `index.ts`, `reportSection.ts`; app vitest aliases and
`tsconfig.tests.json` paths; dependencies from the moved imports; log presets.

**Refactor checkpoint:** drop app files left empty by the move; no other cleanup.

### Validation

Slice 0 files (same results); builds of the package and the app; typechecks (package, app, app tests);
`check_bundle_policy`; `npm run selfTest -w miroir-standalone-app -- --serve` if a server release builds here;
full `npm run nonreg:filesystem -- --runner shared`.

### Realization

71 files moved with `git mv` (the script rewrote 109 importers; app `src` imports the package entries, tests use `miroir-react-testing/src/...` through vitest aliases and `tsconfig.tests.json` paths). Package typecheck clean; app typecheck: only the 2 errors that predate the change (AI proposal forms); `tsconfig.tests.json`: 576 errors before, the same ones after. The 79 baseline files plus the new and path-reading tests: 727 passed, the same 7 failures as Slice 0, none new. Lint roots (`eslint-rules/smells.mjs`) and suppressions follow the move. Bundle guards: app policy lists `miroir-react-testing` eager (only `selectTestLocalCache`, about 1 kB), page gzip 827,739 bytes (baseline 827,963); Electron policy passes; `componentTestChunk.286.phase4` keys on the package's component test entry and passes.

## Slice 6 — The sandbox runs unit suites

**Status:** ✅ done

**RED:** `packages/miroir-sandbox/scripts/smoke.mjs` serves `dist/`, opens the MiroirTest report of a suite by URL
(`#/?page=report&...&instanceUuid=<suite>`), clicks `miroir-test-run-unit`, and waits for
`data-miroir-test-status`; exits 1 on `failed`, 2 when it cannot run. Fails: "No renderer".

**GREEN:** the markers in `MiroirTestDisplay` / `RunMiroirTestSuiteButton`; the sandbox depends on the package and
registers `miroirTestReportSection` from `miroir-react-testing/report-section`; its `vite.config.js` gets the Node store
stub, `optimizeDeps.exclude` and the `stream` polyfill (D10); `playwright-core` devDependency.

**Refactor checkpoint:** the Node store stub shared by the app and the sandbox (exported by the package).

### Validation

Smoke on an `fn`, a `tr` and a `ui` suite; a deliberately failing run (unknown suite) exits non-zero; scoped nonreg
`--scope smoke,ui,tooling`.

### Realization

Run markers on `MiroirTestDisplay` (`data-miroir-test-suite`, `data-miroir-test-status`, `data-miroir-test-summary`; buttons `miroir-test-run-unit` / `-integ`), `runStatusOfResults` unit-tested. The sandbox registers the renderer and calls `selectTestLocalCache` at startup (without it the `ui` cases failed: "no local cache selected"). Smoke picks: `fn.mustache.extractDoubleBracePatterns` (6 passed), `tr.core` (261 passed; `tr.mlsTypeCheck` and the other small `tr` suites have no unit leaves), `ui.mlElementEditor.literal` (3 passed). Negative runs: the `ui` failure above exited 1; an unknown suite exits 2.

## Slice 7 — The sandbox runs an integ suite on IndexedDB

**Status:** ✅ done

**RED:** smoke `--integ <action suite>`: integration mode on `emulatedServer-indexedDb`, passes; the `sandbox-admin*`
databases have the same stores and record counts before and after; the picker offers one profile.

**GREEN:** what the run needs, found by running it.

**Refactor checkpoint:** as found.

### Validation

Smoke; scoped nonreg `--scope smoke,ui,actions`.

### Realization

`action.domainController.dataCrud` passes in integration mode on `emulatedServer-indexedDb` (6 passed, about 6 s). The picker offers that profile alone; the 3 `sandbox-admin*` databases (named `level-js-…/sandbox-admin-*`) keep their stores and record counts. No other change was needed.

## Slice 8 — Fixture apps and testing-library load at run start only

**Status:** ✅ done

**Guard, not RED** (D2 already holds if the move kept the boundaries): the sandbox builds with `build.manifest` and the
app's `miroirBundleReport` plugin; the smoke script reads `dist/.vite/bundle-report.json`, records the JS requests up
to the click on Run, and fails when one of them is a chunk holding `miroir-example-*`, `miroir-fixture-*` or
`@testing-library/*`.

### Validation

Smoke; initial sizes compared with Slice 0.

### Realization

The sandbox builds with `build.manifest` and the `miroirBundleReport` plugin; `packages/miroir-sandbox/bundle-policy.json` forbids `@testing-library/*`, `miroir-example-*`, `miroir-fixture-*`, the MCP client and `diff` on the page, checked with `--no-history` (no sandbox size history). Page load: 5,470,096 bytes in 63 chunks (Slice 0: 5,430,185 bytes): +40 kB, of which 1 kB is `miroir-react-testing` and the rest the `stream` polyfill and chunking. The renderer chunk (78 kB), component tests (testing-library, 205 kB), the fixture apps and the integ launcher are lazy. The guard is the bundle policy rather than request recording in the smoke script: it reads the same report, before a browser starts.

## Slice 9 — CI smoke workflow, docs, full nonreg

**Status:** 🟡 in progress (CI run and nonreg pending)

- `.github/workflows/sandbox-smoke.yml` (D5).
- AGENTS.md build order and package list; `docs/reference/testing.md` (running MiroirTests in the sandbox, D11 list);
  `packages/miroir-sandbox/README.md`.
- Pre-push gate of AGENTS.md, `npm run nonreg:unit -- --runner shared`, `npm run nonreg:filesystem -- --runner shared`.

### Validation

The workflow run on the PR; the commands above.

### Realization

`.github/workflows/sandbox-smoke.yml`: builds as the Pages workflow does, runs the sandbox bundle guard and `npm run smoke -w miroir-sandbox`; the Pages workflow drops `dist/.vite` from the site. Docs: AGENTS.md build order, `docs/reference/testing.md` ("In the sandbox"), `docs/internals/code-splitting.md`, the two READMEs. Gate: lint, pytest (595 passed), policy checks, `miroir-env check`, core typecheck pass. `nonreg --tier default --storage filesystem --runner shared`: 123 steps passed, 7 failed only because `python` had no pytest module in the container; the 7 rerun with it: all pass. Adversarial review of the diff (fixed): AGENTS.md over its size cap, the Dockerfile not building the package, the app not declaring it, a run of only skipped tests read as passed, a narrow path filter on the workflow; the smoke now compares a digest of the sandbox databases' records, not only their counts. The CI run of the workflow is on the PR.

## AC checklist (issue #672)

| AC | Proof |
|---|---|
| The new package exists, has its own build and typecheck, and sits in the build order after `@miroir-framework/react` | Slice 4 (build, `pr-checks.yml` typecheck step, `build-all.sh` stage) |
| `miroir-standalone-app` uses the renderer from the new package; `nonreg:unit` and `nonreg:filesystem` pass | Slice 5; Slice 9 nonreg |
| The sandbox runs a unit `fn` suite, a `tr` suite and a `ui` component test | Slice 6 smoke |
| The sandbox runs an integ `action` or `runner` suite on `emulatedServer-indexedDb` | Slice 7 smoke |
| Integ runs leave `sandbox-admin*` untouched | Slice 7 smoke check |
| Fixture apps and testing-library load at run start only; sizes recorded | Slice 8 guard; sizes in its Realization |
| The sandbox picker shows only `emulatedServer-indexedDb` | Slice 3 test; Slice 7 smoke |
| The sandbox workflow runs the smoke and fails when a suite fails | Slice 9 workflow; Slice 6 failing run exits non-zero |

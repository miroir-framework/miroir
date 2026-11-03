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
| 0 | Characterize the runtime's tests and the sandbox | ⬜ pending | per-file baseline of the app's runtime tests; sandbox shows "No renderer" |
| 1 | `runMcpToolRunner` in `@miroir-framework/mcp/client` (D6) | ⬜ pending | mcp unit test; app tests of the MCP runner unchanged |
| 2 | Test providers take the host's renderers and shell host (D7, in the app) | ⬜ pending | component test with custom renderers |
| 3 | Only bundled realServer profiles are offered (D4, in the app) | ⬜ pending | `integrationTestProfileCatalog` unit test |
| 4 | Package scaffold in every build path | ⬜ pending | package builds; build lists, policies, lockfile |
| 5 | The runtime moves into the package | ⬜ pending | Slice 0 baseline, same results; bundle guards; self-test |
| 6 | The sandbox runs unit suites | ⬜ pending | smoke: `fn`, `tr`, `ui` suites pass on the built sandbox |
| 7 | The sandbox runs an integ suite on IndexedDB | ⬜ pending | smoke: `action` suite passes; sandbox data unchanged |
| 8 | Fixture apps and testing-library load at run start only | ⬜ pending | smoke guard on the sandbox's bundle report |
| 9 | CI smoke workflow, docs, full nonreg | ⬜ pending | workflow run on the PR; nonreg |

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

**Status:** ⬜ pending

- Run the 79 test files of the app that import the moved modules (no bail, JSON reporter) and record pass / fail per
  file: the bar for Slice 5.
- Build the sandbox, open the Miroir Tests report, record the "No renderer" message and the size of the chunks
  `index.html` loads (G4 baseline).

### Validation

The two commands above.

### Realization

(pending)

## Slice 1 — `runMcpToolRunner` in the MCP client

**Status:** ⬜ pending

**RED:** `packages/miroir-mcp/tests/mcpToolRunner.unit.test.ts`: `runMcpToolRunner` of `@miroir-framework/mcp/client`
returns the FeatureUnavailable envelope when `mcp` is off and the parsed tool answer through an injected `fetch`
(vitest: not reachable through MiroirTest, it is HTTP plumbing; no mock, a fetch function is a parameter).

**GREEN:** `src/mcpToolRunner.ts`, exported by `src/client.ts`; the app's `runMcpToolRunner.ts` re-exports it.

**Refactor checkpoint:** none expected.

### Validation

The RED test; `tests/4_view/issues/253-generic-mcp-tool-runner/mcpToolRunner.253.phase0.unit.test.ts` and
`processCapabilitiesMcp.273.phase6.unit.test.ts` in the app; typecheck mcp.

### Realization

(pending)

## Slice 2 — Test providers take the host's renderers

**Status:** ⬜ pending

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

(pending)

## Slice 3 — Only bundled realServer profiles are offered

**Status:** ⬜ pending

**RED:** new cases in `tests/helpers/integrationTestProfileCatalog.unit.test.ts`: with no realServer client configs,
`listUiIntegrationProfileCatalogForPicker("webApp")` holds only `emulatedServer-indexedDb` and no realServer profile is
launchable; with the four configs, today's lists.

**GREEN:** `realServerTestClientConfigs.ts` reads the define once; the catalog takes the configured profile names
(default: from the define); picker and launch gate use it.

**Refactor checkpoint:** `integrationTestProfileAssets.ts` reads the configs from the same module.

### Validation

The RED test; `tests/4_view/UiIntegrationTestRunControls.unit.test.tsx`; scoped nonreg `--scope smoke,ui`.

### Realization

(pending)

## Slice 4 — Package scaffold in every build path

**Status:** ⬜ pending

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

(pending)

## Slice 5 — The runtime moves into the package

**Status:** ⬜ pending

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

(pending)

## Slice 6 — The sandbox runs unit suites

**Status:** ⬜ pending

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

(pending)

## Slice 7 — The sandbox runs an integ suite on IndexedDB

**Status:** ⬜ pending

**RED:** smoke `--integ <action suite>`: integration mode on `emulatedServer-indexedDb`, passes; the `sandbox-admin*`
databases have the same stores and record counts before and after; the picker offers one profile.

**GREEN:** what the run needs, found by running it.

**Refactor checkpoint:** as found.

### Validation

Smoke; scoped nonreg `--scope smoke,ui,actions`.

### Realization

(pending)

## Slice 8 — Fixture apps and testing-library load at run start only

**Status:** ⬜ pending

**Guard, not RED** (D2 already holds if the move kept the boundaries): the sandbox builds with `build.manifest` and the
app's `miroirBundleReport` plugin; the smoke script reads `dist/.vite/bundle-report.json`, records the JS requests up
to the click on Run, and fails when one of them is a chunk holding `miroir-example-*`, `miroir-fixture-*` or
`@testing-library/*`.

### Validation

Smoke; initial sizes compared with Slice 0.

### Realization

(pending)

## Slice 9 — CI smoke workflow, docs, full nonreg

**Status:** ⬜ pending

- `.github/workflows/sandbox-smoke.yml` (D5).
- AGENTS.md build order and package list; `docs/reference/testing.md` (running MiroirTests in the sandbox, D11 list);
  `packages/miroir-sandbox/README.md`.
- Pre-push gate of AGENTS.md, `npm run nonreg:unit -- --runner shared`, `npm run nonreg:filesystem -- --runner shared`.

### Validation

The workflow run on the PR; the commands above.

### Realization

(pending)

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

# 317 — UI integration launcher: suite kind from the definition, not the name

> The Miroir Tests UI launcher picks a suite's kind (`runnerTest`, `domainControllerTest`, `actionTest`, `reportTest`) partly from its name (`startsWith("action.domainController.")`). This analysis records why the name check can go, and how the kind is derived from the MiroirTest definition alone.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/317
- Origin: #316 (MiroirTest naming, PR #320), which switched the prefix to `action.domainController.` as a stopgap: [316 analysis](../316-REFACTOR-miroirtest-naming/analysis.md)
- `packages/miroir-core/src/5_tests/applicationMiroirTestCatalog.ts` (`inferUiIntegrationRunnerSuiteKind`)
- `packages/miroir-core/src/5_tests/inferIntegrationSessionKind.ts` (`inferIntegrationSessionKind`, `miroirTestSuiteMountsReport`)
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.ts` (entry types, legacy registry)
- `packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationTestLauncher.ts` (launcher)

## Goals

- **G1 — Rename without side effects.** In order to name MiroirTests for readers only, as a test author, I can rename a suite (or name a new one any way) without changing how the Miroir Tests UI runs it.
- **G2 — Kind visible in the definition.** In order to predict how a suite runs, as a test author, I can read its kind from its leaves, not from a naming convention I have to know.

## Non-goals

- Deleting the deprecated `UI_INTEGRATION_RUNNER_SUITE_REGISTRY_LEGACY` and its launcher fallback (separate cleanup).
- Removing the `suiteKey` parameter of `inferUiIntegrationRunnerSuiteKind`: A wants to assess first whether it is useful to identify tests (grilling Q3). It stays in the signature and no longer affects the result.

## Decision record (grilling with A, 2026-10-02)

| # | Decision | Options | Chosen | Goals |
|---|---|---|---|---|
| D1 | How the kind is derived | a) merge `domainControllerTest` into `actionTest`, kind from leaf types only; b) explicit attribute on `MiroirTestSuite` (schema + regeneration); c) infer from leaf content (action types run) | **a** | G1, G2 |
| D2 | Hardcoded legacy registry | a) keep, build it from its MiroirTest instances with the catalog function; b) delete it; c) keep, edit the hardcoded kinds | **a** | G1 |
| D3 | `suiteKey` parameter | drop / keep | **keep, unused for the kind** (A to assess) | — |
| D4 | Naming test "UI launch kinds follow the name" | keep / delete | **delete** (the "name is its kind" test already ties names to leaf types) | G2 |
| D5 | Guard against name checks returning | a) source scan; b) behaviour test: same definition, different names, same kind | **b** | G1 |

Rationale for D1: the two kinds behave identically (see truth table below). (b) adds schema surface for a label that drives nothing, (c) a heuristic. If a real difference appears later, (b) is the way to reintroduce it. Rejected for D2: (b) widens the change into the deprecation cleanup; (c) keeps hand-written kinds that can drift from the definitions.

## Current state

`inferUiIntegrationRunnerSuiteKind` (`applicationMiroirTestCatalog.ts:55-74`):

```ts
const sessionKind = inferIntegrationSessionKind(suite);
if (sessionKind === "runner") return "runnerTest";
if (sessionKind === "action") {
  if (miroirTestSuiteMountsReport(suite)) return "reportTest";
  // #316 stopgap: recognised by name until #317 derives it from the definition.
  if (suiteKey?.startsWith("action.domainController.")) return "domainControllerTest";
  return "actionTest";
}
return undefined;
```

This is the only `startsWith` / `endsWith` on a suite key in `packages/*/src` (grep of both calls under `packages/*/src`, 2026-10-02).

### What each kind changes at launch

| Consumer (standalone-app) | `runnerTest` | `domainControllerTest` | `actionTest` | `reportTest` |
|---|---|---|---|---|
| `resolveUiIntegrationOrchestratorSessionKind` (registry `:121`) | runner | action | action | action |
| `buildUiIntegrationOrchestratorCreateSessionParams` (registry `:136`) | runner branch | action branch | action branch | action branch |
| `launchUiIntegrationTest` (launcher `:398-418`): pinned run target, `prepareReportTests` | no | no | no | yes |
| `isUiIntegrationDomainControllerTestSuiteEntry` / `isUiIntegrationActionTestSuiteEntry` | not called anywhere outside their definitions | | | |

`domainControllerTest` and `actionTest` columns are identical: the distinction carries no behaviour.

### Hardcoded kinds

`UI_INTEGRATION_RUNNER_SUITE_REGISTRY_LEGACY` (registry `:271-352`) lists 16 suites with hand-written kinds: 7 `runnerTest`, 8 `domainControllerTest`, 1 `actionTest`. The launcher falls back to it (`uiIntegrationTestLauncher.ts:392`); tests in `uiIntegrationRunnerRegistry.unit.test.ts`, `uiIntegrationTestLauncher.unit.test.ts`, `uiIntegrationTestLauncher.integ.test.ts`, `uiIntegrationTestLauncher.realServer.integ.test.ts`, `integrationTestProfileCatalog.unit.test.ts` read it.

### Tests asserting the name-based kind

- `miroir-core/tests/5-tests/applicationMiroirTestCatalog.unit.test.ts`: "infers runner vs domain-controller vs action kinds".
- `miroir-core/tests/5-tests/miroirTestNaming.unit.test.ts`: "UI launch kinds follow the name".
- `miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.unit.test.ts`: "registry entries use discriminated union kinds".

## Key reuse

| Piece | Location |
|---|---|
| `inferIntegrationSessionKind`, `miroirTestSuiteMountsReport` | `miroir-core/src/5_tests/inferIntegrationSessionKind.ts` |
| `buildApplicationMiroirTestCatalog`, `buildUiIntegrationRunnerSuiteRegistryFromCatalog` | `miroir-core/src/5_tests/applicationMiroirTestCatalog.ts` |
| Deployment exports `miroirTest_*` (MiroirTestDefinition instances) | `miroir-app-miroir`, `miroir-example-library` |

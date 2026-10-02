# 317 — TDD implementation plan

> From [analysis.md](analysis.md). Two slices, one green commit each, on `claude/317-ui-suite-kind`.

Gate per slice: `npx tsc --noEmit --skipLibCheck -p` on touched packages, `npm run lint`, the touched test files. End: AGENTS.md pre-push gate and `npm run nonreg:unit -- --runner shared`.

## Slice 1 — miroir-core: kind from leaf types only

**Goal:** G1, G2. `inferUiIntegrationRunnerSuiteKind` returns `runnerTest`, `reportTest` or `actionTest` from the definition; `domainControllerTest` no longer exists.

Red:
- `applicationMiroirTestCatalog.unit.test.ts`: replace "infers runner vs domain-controller vs action kinds" with "infers runner, report and action kinds from leaves"; a DomainController suite yields `actionTest`.
- New: the same action / runner / report definition under several names (`action.domainController.x`, `action.scenario.x`, `anything`, no name) yields the same kind (D5).

Green:
- Remove the `startsWith` branch and the `domainControllerTest` member of `UiIntegrationRunnerSuiteKind`. Keep `suiteKey?: string` in the signature, documented as not affecting the kind (D3).
- `miroirTestNaming.unit.test.ts`: delete "UI launch kinds follow the name" (D4).

## Slice 2 — standalone-app: registry without hand-written kinds

**Goal:** G1. No `kind:` literal in `UI_INTEGRATION_RUNNER_SUITE_REGISTRY_LEGACY`; it is built from its MiroirTest instances.

Red:
- `uiIntegrationTestLauncher.unit.test.ts` "registry entries use discriminated union kinds": `action.domainController.dataCrud` is `actionTest`.
- `uiIntegrationRunnerRegistry.unit.test.ts`: each legacy entry's kind equals `inferUiIntegrationRunnerSuiteKind` of its definition.

Green:
- Remove `UiIntegrationDomainControllerTestSuiteEntry` and `isUiIntegrationDomainControllerTestSuiteEntry`.
- Build the legacy registry with `buildUiIntegrationRunnerSuiteRegistryFromCatalog(buildApplicationMiroirTestCatalog([...16 instances]))` (D2). Same 16 keys.
- `grep -rn "domainControllerTest" packages/*/src packages/*/tests` returns nothing.

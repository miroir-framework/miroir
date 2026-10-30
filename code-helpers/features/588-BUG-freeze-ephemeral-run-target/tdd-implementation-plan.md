# 588 — TDD implementation plan

> Slices for [analysis.md](analysis.md): rebind the testbed seed to the run target in `resetIntegTestbed`.

## Slice 1 (tracer bullet): the freeze suite passes on an ephemeral run target

- **Behavior:** an integ suite launched on an ephemeral run target finds its seeded SelfApplication; `action.domainController.freezeApplicationVersion` passes all 10 leaves.
- **RED:** `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.integ.test.ts`, new case running the suite through `runUiIntegrationTestSuiteInNode` with `runTargetMode: "ephemeral"`. Vitest, not MiroirTest: the run target mode belongs to the launcher, which a MiroirTest cannot select. Fails with `SelfApplication <uuid> not found in current model`.
- **GREEN:** `resetIntegTestbed` rebinds `{ testbedInitApplicationParameters, testbedEntitiesAndInstances, testbedModel }` to `librarySelfApplicationUuid` before `resetAndinitializeDeploymentCompositeAction`.
- **Run:** `MIROIR_ENV=test-indexedDb npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher.integ --profile emulatedServer-indexedDb`.

## Slice 2: the rebinding contract

- **Behavior:** `rebindIntegTestbedResetParamsToApplication(resetParams, applicationUuid)` returns the input itself when it already targets the application; otherwise a copy where every occurrence of the seeded SelfApplication uuid (SelfApplication, branch, version, Entities) is the target uuid; never mutates its input.
- **RED/GREEN:** `packages/miroir-core/tests/5_tests/composeIntegTestbedResetParams.unit.test.ts` (vitest: an internal test helper, not reachable through the ML).
- **Refactor:** `deepReplaceUuidStrings` moves out of `ActionTestTools.ts` into `5_tests/deepReplaceUuidStrings.ts`, shared by the leaf remap and the seed rebind.

## Acceptance

- `MIROIR_ENV=self-test-integ npm run selfTest -w miroir-standalone-app -- --serve`: the freeze suite passes; remaining failures only #589 and #495.
- `npm run nonreg:filesystem -- --runner shared` green.

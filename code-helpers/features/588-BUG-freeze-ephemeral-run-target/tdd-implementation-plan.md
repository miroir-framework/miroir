# 588 — TDD implementation plan

> Slices for [analysis.md](analysis.md): move the whole testbed seed onto the ephemeral run target in `RunnerTestSession.beforeEach`.

## Slice 1 (tracer bullet): the freeze suite passes on an ephemeral run target

- **Behavior:** an integ suite launched on an ephemeral run target finds its seeded SelfApplication; `action.domainController.freezeApplicationVersion` passes all 10 leaves.
- **RED:** `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.integ.test.ts`, new case running the suite through `runUiIntegrationTestSuiteInNode` with `runTargetMode: "ephemeral"`. Vitest, not MiroirTest: the run target mode belongs to the launcher, which a MiroirTest cannot select. Fails with `SelfApplication <uuid> not found in current model`.
- **GREEN:** `RunnerTestSession.beforeEach` passes `remapIntegTestbedResetParamsForRunTarget(resetParams, canonicalApplication, canonicalDeployment, runTarget)` to `beforeEachTest`, instead of remapping the model only.
- **Run:** `MIROIR_ENV=test-indexedDb npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher.integ --profile emulatedServer-indexedDb`.

## Slice 2: the rebinding contract

- **Behavior:** `remapIntegTestbedResetParamsForRunTarget` returns the input itself on the canonical run target; otherwise the model goes through `remapLibraryAppModelForRunTarget` and the init params (SelfApplication, branch, version) and instances get the run target's application and deployment uuids; non-plain values (Date) are kept; the input is not mutated.
- **RED/GREEN:** `packages/miroir-core/tests/5_tests/composeIntegTestbedResetParams.unit.test.ts` (vitest: an internal test helper, not reachable through the ML).
- **Refactor:** `deepReplaceUuidStrings` moves out of `ActionTestTools.ts` into `5_tests/deepReplaceUuidStrings.ts`, shared by the leaf remap, the seed remap and `RunMiroirTestAction.ts` (whose copy `deepReplaceStrings` is removed); it walks plain objects only.

## Acceptance

- `MIROIR_ENV=self-test-integ npm run selfTest -w miroir-standalone-app -- --serve`: the freeze suite passes; remaining failures only #589 and #495.
- `npm run nonreg:filesystem -- --runner shared` green.

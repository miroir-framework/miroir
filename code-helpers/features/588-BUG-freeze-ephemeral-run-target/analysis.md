# 588 — freezeApplicationVersion fails on an ephemeral run target (browser self-test)

> Why `action.domainController.freezeApplicationVersion` passes in Node and fails 9 of 10 leaves in the browser self-test, and where the fix goes. Bug analysis: no design choice beyond where to apply the uuid remap.

## Related

- Issue: https://github.com/miroir-framework/miroir/issues/588 (found while checking #487)
- #585 / #577: the suite seeds Library as `versioned-internal` (`libraryVersionedTestbedInitParams`).
- Out of scope, same self-test run: #589 (`action.scenario.evolutionTrace`, `MIROIR_EVOLUTION_TRACE` off), #495 (`runner.deployApplication`, `deleteStore`).
- Suite: `packages/miroir-app-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/d7e9f81b-c23d-4f68-b9a0-6e7f8091a2b3.json` (the issue names `2427ef3a-…`, which is `action.scenario.evolutionTrace`).

## Goals / Non-goals

- **G1: Self-test covers freezing.** In order to trust the browser self-test as an application maintainer, I can run `self-test-integ` and see `action.domainController.freezeApplicationVersion` pass as it does in Node.
- **G2: Ephemeral runs see a consistent testbed.** In order to run any integ suite on an ephemeral run target as a test author, I can rely on the seeded SelfApplication carrying the run target's uuid, like the remapped action leaves.
- Non-goals: #589 and #495 (other failing suites of the same run); changing how freeze finds its application.

## What the browser does (reproduced on `_integration` 4ba651da)

`self-test-integ` run in Chromium (driver capturing the page console): 1535 tests, 11 failed: the 9 freeze leaves named in the issue, plus `action.scenario.evolutionTrace` and `runner.deployApplication`. Every freeze leaf fails at its first `freezeApplicationVersion` action:

```
DomainController handleModelAction caught error:freezeApplicationVersion:
SelfApplication 8e202b48-09d4-4657-84ab-1593f833529b not found in current model
```

The 10th leaf, "Commit without freeze does not create freeze tip or Cross set", never freezes, so it passes.

## Current state

| Step | Node `testMiroir` | Browser self-test |
|---|---|---|
| Run target | suite `runTarget`: Library `5af03c98-…`, deployment `f714bb2f-…` (pinned) | `runIntegrationMiroirTestBatch` → `DEFAULT_UI_INTEGRATION_RUN_TARGET_MODE = "ephemeral"` (`integrationTestProfileAssets.ts`): `getTestbedUuidsForTestSuite` without `runTarget` mints fresh uuids |
| Action leaves | unchanged | `remapActionTestLeafForRunTarget` (`miroir-core/src/5_tests/ActionTestTools.ts`) replaces Library's application and deployment uuids by the run target's |
| Seed model | unchanged | `RunnerTestSession.beforeEach` remaps `testbedModel` only (`remapLibraryAppModelForRunTarget`); init params and instances pass through |
| Testbed seed | `resetIntegTestbed` (`LibraryPlayfield.ts`) → `resetAndinitializeDeploymentCompositeAction(librarySelfApplicationUuid, …, testbedInitApplicationParameters, …)` | same call; `librarySelfApplicationUuid` is the ephemeral uuid but `testbedInitApplicationParameters.selfApplication.uuid` is still `5af03c98-…` |
| Freeze lookup | `planFreezeApplicationVersionFromMetaModel` (`applicationVersionFreeze.ts`): `metaModel.applications.find((a) => a.uuid === payload.application)` finds Library | the ephemeral application's model holds a SelfApplication row with uuid `5af03c98-…`, none with the run target uuid: throws |

`initModel` writes `params.selfApplication` as given (`PersistenceStoreController.ts`), so nothing downstream rebinds it. The seeded branch (`selfApplicationModelBranchLibraryMasterBranch`) and version (`selfApplicationVersionLibraryInitialVersion`) and the playfield Entities also carry `selfApplication: 5af03c98-…`.

The mismatch is reproducible in Node: `runUiIntegrationTestSuiteInNode` with `runTargetMode: "ephemeral"` on `emulatedServer-indexedDb` fails the same way (`SelfApplication <uuid> not found in current model`).

## Decision record

| # | Decision | Options | Chosen | Serves |
|---|---|---|---|---|
| D1 | Where to move the seed onto the run target | (a) `RunnerTestSession.beforeEach`, which already remaps the seed's model with `remapLibraryAppModelForRunTarget` and knows the canonical application and deployment; (b) `resetIntegTestbed` in miroir-core, for every caller, keyed on the seeded SelfApplication uuid; (c) make freeze tolerate a mismatched SelfApplication | **(a) Accepted.** The ephemeral run target is chosen there, next to the existing model remap, and the canonical deployment uuid is known, so deployment references move too. (b) Rejected after review: it only knows the application uuid (the seeded deployment uuid stays), and it would silently rewrite any caller pairing a seed with another application. (c) Rejected: hides a broken testbed and weakens a production check. | G1, G2 |
| D2 | What to move | (a) `selfApplication.uuid` only; (b) every occurrence of the canonical application and deployment uuids in init params and instances, plus the existing model remap | **(b) Accepted**, same rule as `remapActionTestLeafForRunTarget` (exact-string replacement). Branch, version and instances point at the application and deployment too; (a) leaves dangling references. | G2 |

## Key reuse

| Piece | Location |
|---|---|
| `deepReplaceUuidStrings` (moved to its own module, shared with `RunMiroirTestAction.ts`, which had a copy) | `packages/miroir-core/src/5_tests/deepReplaceUuidStrings.ts` |
| `IntegTestbedResetParams`, new `remapIntegTestbedResetParamsForRunTarget` | `packages/miroir-core/src/5_tests/composeIntegTestbedResetParams.ts` |
| `remapLibraryAppModelForRunTarget` | `packages/miroir-core/src/1_core/model/cloneApplication/remapApplicationModelAtPaths.ts` |
| `RunnerTestSession.beforeEach` (resets the testbed of runner and action sessions) | `packages/miroir-standalone-app/src/miroir-fwk/4-tests/RunnerTestSession.ts` |
| `runUiIntegrationTestSuiteInNode` (runs the browser launcher path in Node) | `packages/miroir-standalone-app/tests/helpers/runUiIntegrationTestSuiteInNode.ts` |

Implementation: [tdd-implementation-plan.md](tdd-implementation-plan.md).

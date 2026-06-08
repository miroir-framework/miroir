# Unit test catalog (Phase 0)

Generated: 2026-06-08T20:28:30.805Z

Regenerate:
```bash
node "code-helpers/features/195-FEATURE- enable execution of miroir-core unit tests in UI/generate-unit-test-catalog.mjs"
```

Machine-readable source: [`catalog.json`](./catalog.json)

## Summary

| Metric | Value |
|--------|-------|
| Total test files | 55 |
| Included in catalog | 53 |
| Excluded (experiments / deprecated) | 2 |
| Vitest-only (Classes E, F) | 8 |
| UI-migratable | 45 |
| Cases in vitest files (estimated) | 401 |
| Entity-backed loader files (Class A) | 8 |

> Entity-backed files load test cases from `TransformerTestDefinition` store JSON; case counts are not in the vitest file.

## By class

| Class | Kind | Files | Vitest cases | Entity-backed loaders |
|-------|------|-------|--------------|----------------------|
| B | functionCallTest | 34 | 275 | 0 |
| E | statefulBehaviorTest | 5 | 86 | 0 |
| A | transformerTest | 9 | 25 | 8 |
| F | schemaValidationTest | 3 | 15 | 0 |
| C | queryRunnerTest | 1 | 0 | 0 |
| A+G | transformerTest (integration) | 1 | 0 | 0 |

## By target `unitTestKind`

| Kind | Files | Vitest cases | Entity-backed |
|------|-------|--------------|---------------|
| functionCallTest | 34 | 275 | 0 |
| transformerTest | 10 | 25 | 8 |
| queryRunnerTest | 1 | 0 | 0 |

## File index

| File | Class | Kind | Cases | Vitest only | Notes |
|------|-------|------|-------|-------------|-------|
| `1_core/EntityPrimaryKey.unit.test.ts` | B | functionCallTest | 27 | no |  |
| `1_core/alterObject.unit.test.ts` | B | functionCallTest | 1 | no |  |
| `1_core/ansiColumnsToJzodSchema.unit.test.ts` | B | functionCallTest | 9 | no | unlisted file; default Class B — review mapping |
| `1_core/blobUtils.unit.test.ts` | E | — | 37 | yes | FileReader mock in beforeAll, async blob I/O |
| `1_core/defaultValueForJzodSchema.unit.test.ts` | A | transformerTest | *(entity)* | no |  |
| `1_core/getAttributeTypesFromJzodSchema.unit.test.ts` | B | functionCallTest | 4 | no | unlisted file; default Class B — review mapping |
| `1_core/jzod/JzodSchemaReferencesList.unit.test.ts` | B | functionCallTest | 9 | no | jzod utility; default Class B |
| `1_core/jzod/JzodSchemaReferencesSet.unit.test.ts` | B | functionCallTest | 9 | no | jzod utility; default Class B |
| `1_core/jzod/jzod.buildAnyKeyMap.unit.test.ts` | B | functionCallTest | 11 | no | jzod utility; default Class B |
| `1_core/jzod/jzod.localizeReferenceContext.unit.test.ts` | B | functionCallTest | 1 | no | jzod utility; default Class B |
| `1_core/jzod/jzod.selectUnionBranchFromDiscriminator.unit.test.ts` | B | functionCallTest | 15 | no | jzod utility; default Class B |
| `1_core/jzod/jzod.typeCheckToFail.unit.test.ts` | B | functionCallTest | 24 | no | candidate migration to transformerTest via jzodTypeCheck |
| `1_core/jzod/jzod.typeCheckToPass.unit.test.ts` | A | transformerTest | 25 | no | target: migrate to jzodTypeCheck transformer entity; 12k-line file |
| `1_core/jzod/jzod.unionObjectChoices.test.ts` | B | functionCallTest | 4 | no | jzod utility; default Class B |
| `1_core/jzod/jzod.unionResolvedTypeForArray.unit.test.ts` | B | functionCallTest | 2 | no | jzod utility; default Class B |
| `1_core/jzod/jzod.unionResolvedTypeForObject.unit.test.ts` | B | functionCallTest | 2 | no | jzod utility; default Class B |
| `1_core/jzod/jzodObjectFlatten.test.ts` | B | functionCallTest | 8 | no | jzod utility; default Class B |
| `1_core/jzod/jzodReferencesGraphConnectedComponents.unit.test.ts` | B | functionCallTest | 6 | no | jzod utility; default Class B |
| `1_core/jzod/jzodToCopilotKitParameter.unit.test.ts` | B | functionCallTest | 17 | no | jzod utility; default Class B |
| `1_core/jzod/jzodToJsonSchema.unit.test.ts` | B | functionCallTest | 0 | no |  |
| `1_core/jzod/jzodToJzod.unit.test.ts` | B | functionCallTest | 1 | no | jzod utility; default Class B |
| `1_core/jzod/jzodToJzod_Summary.unit.test.ts` | B | functionCallTest | 26 | no | jzod utility; default Class B |
| `1_core/jzod/jzodTransitiveDependencySet.unit.test.ts` | B | functionCallTest | 8 | no | jzod utility; default Class B |
| `1_core/jzod/jzodTypeCheck.test.ts` | A | transformerTest | *(entity)* | no | entity transformerTestSuite_jzodTypeCheck |
| `1_core/jzod/jzodUnion_RecursiveUnfold.test.ts` | B | functionCallTest | 12 | no | jzod utility; default Class B |
| `1_core/jzod/mergePositionBased.unit.test.ts` | B | functionCallTest | 18 | no | jzod utility; default Class B |
| `1_core/jzod/resolveConditionalSchema.test.ts` | A | transformerTest | *(entity)* | no | entity transformerTest_resolveConditionalSchema; dedicated UI report |
| `1_core/jzod/resolveSchemaReferenceInContext.test.ts` | A | transformerTest | *(entity)* | no |  |
| `1_core/jzod/unfoldSchemaOnce.test.ts` | A | transformerTest | *(entity)* | no |  |
| `1_core/jzod/unionArrayChoices.test.ts` | B | functionCallTest | 2 | no | jzod utility; default Class B |
| `1_core/modelUpdates.unit.test.ts` | B | functionCallTest | 0 | no | unlisted file; default Class B — review mapping |
| `1_core/mustache.unit.test.ts` | B | functionCallTest | 0 | no |  |
| `1_core/zodParseActions.test.ts` | F | — | 0 | yes | TypeScript compile-time type assignment checks |
| `1_core/zodParseCheckMiroirTransformerDefinitions.test.ts` | F | — | 0 | yes |  |
| `1_core/zodParseError.test.ts` | F | — | 15 | yes |  |
| `2_domain/adminTransformers.unit.test.ts` | A | transformerTest | *(entity)* | no | entity transformerTest_adminTransformers |
| `2_domain/domainStateToDeploymentEntityState.unit.test.ts` | B | functionCallTest | 1 | no |  |
| `2_domain/export-query-runner-suite.unit.test.ts` | B | functionCallTest | 0 | no | unlisted file; default Class B — review mapping |
| `2_domain/menu.unit.test.ts` | A | transformerTest | *(entity)* | no | inline TransformerTestSuite; not yet a store instance |
| `2_domain/queries.unit.test.ts` | C | queryRunnerTest | 0 | no | testExtractorParams table-driven; domainState.json fixture |
| `2_domain/resolveCompositeActionTemplate.unit.test.ts` | B | functionCallTest | 2 | no | Unit test of resolveTestCompositeActionTemplate / resolveTestCompositeActionTemplateSuite — NOT TestCompositeAction* integration tests (those live in standalone-app Test entity; out of scope) |
| `2_domain/resolveQueryTemplates.unit.test.ts` | B | functionCallTest | 1 | no |  |
| `2_domain/transformer_tools.substituteTranformerReferencesInJzodElement.unit.test.ts` | B | functionCallTest | 3 | no |  |
| `2_domain/transformer_tools.transformerInterfaceFromDefinition.unit.test.ts` | B | functionCallTest | 2 | no |  |
| `2_domain/transformers.unit.test.ts` | A | transformerTest | *(entity)* | no | RUN_TEST=transformers.unit.test; entity transformerTest_miroirCoreTransformers |
| `3_controllers/MiroirEventTracker.unit.test.ts` | E | — | 16 | yes |  |
| `3_controllers/RunActionTracker.unit.test.ts` | E | — | 8 | yes |  |
| `3_controllers/TestTracker.unit.test.ts` | E | — | 14 | yes |  |
| `4_services/transformers.integ.test.ts` | A+G | transformerTest | 0 | no | runTransformerIntegrationTest + Postgres |
| `4_services/unitTest.pilot.unit.test.ts` | B | functionCallTest | 0 | no | unlisted file; default Class B — review mapping |
| `4_services/unitTest.tools.unit.test.ts` | B | functionCallTest | 15 | no | unlisted file; default Class B — review mapping |
| `4_views/ViewParams.integ.test.ts` | E | — | 11 | yes | misnamed .integ — pure class state tests |
| `tools.test.ts` | B | functionCallTest | 35 | no |  |

## Excluded files

- `1_core/jzod/jzod.resolveReferenceInContext.OLD.unit.test.ts` — superseded; do not migrate
- `experiments/discriminatedOpt-inUnions.test.ts` — exploratory; not production

# Feature 204 — Classify tests for MiroirTest migration

GitHub issue: [miroir-framework/miroir#204](https://github.com/miroir-framework/miroir/issues/204)

**Follow-up to:** [#197](https://github.com/miroir-framework/miroir/issues/197) (run integration tests in the UI)

**Related:** [#196](https://github.com/miroir-framework/miroir/issues/196) (MiroirTest entity — entity-backed suites migrated)

**Status:** Draft classification for review (no migrations in this PR)

---

## Goal

Classify existing vitest files in `miroir-core` and `miroir-standalone-app` into:

| Class | Meaning |
|-------|---------|
| **DONE** | Behavior already has a MiroirTest instance; vitest file is a thin loader (keep) |
| **MIGRATE** | Product/feature of Miroir; should become MiroirTest |
| **UI_COMPONENT** | Product UI worth keeping; blocked until in-UI enactment exists (RTL/jsdom/heavy mocks keep them here) |
| **PLATFORM** | Infra / harness / store backends / CLI / MiroirTest UI itself — keep as vitest; not MiroirTest; not disposable |
| **DISPOSABLE** | Ad-hoc experiment/scaffold, or **legacy twin** of a DONE MiroirTest (cutover leftover) |
| **UNCLEAR** | Needs human judgment (one-line reason) |

## Locked criteria (grill session)

| # | Decision |
|---|----------|
| 1 | Overall criterion ≈ **product/features of Miroir** vs ad-hoc experiment/scaffold that will vanish |
| 2 | **DONE** stays DONE even if it would fail today’s product-surface test |
| 3 | New harness leaf type **irrelevant** to migrate/don’t; **mocks / RTL / jsdom** → not MiroirTest yet |
| 4 | **jzod type-check / transform** = product core (not “internal glue”) |
| 5 | Feature litmus **D**: authorable artifact by default; demote if clearly experimental / test-only / to-delete |
| 6 | React/RTL/jsdom/heavy-mocks product UI → **UI_COMPONENT**, not DISPOSABLE |
| 7 | Infra/harness/CLI/store drivers → **PLATFORM** |
| 8 | Scope: **miroir-core + miroir-standalone-app** only; other packages later |
| 9 | Grain: **per file**; split rows only when classes diverge |
| 10 | DONE = **MiroirTest instance exists**; legacy twin file → usually **DISPOSABLE** |
| 11 | No priority column; classification only |
| 12 | **UNCLEAR** allowed with one-line why |

## Out of scope

- Performing migrations
- Other packages (`miroir-react`, stores, server, …)
- Priority ordering of MIGRATE rows

## Counts (draft)

Total vitest files in scope: **166**

- **DONE:** 34
- **MIGRATE:** 23
- **UI_COMPONENT:** 33
- **PLATFORM:** 65
- **DISPOSABLE:** 10
- **UNCLEAR:** 1

DONE MiroirTest **instances** (behaviors): **46** (see below)

---

## DONE — MiroirTest instances

Source of truth: deployment exports + `miroirCoreTestSuiteRegistry` / UI integ runner registries.

| Suite key | Package | Notes |
|-----------|---------|-------|
| `EntityPrimaryKey` | `miroir-test-app_deployment-miroir` | vitest loader |
| `JzodSchemaReferencesList` | `miroir-test-app_deployment-miroir` | vitest loader |
| `JzodSchemaReferencesSet` | `miroir-test-app_deployment-miroir` | vitest loader |
| `adminTransformers` | `miroir-test-app_deployment-miroir` | vitest loader |
| `alterObject` | `miroir-test-app_deployment-miroir` | vitest loader |
| `ansiColumnsToJzodSchema` | `miroir-test-app_deployment-miroir` | vitest loader |
| `buildAnyKeyMap` | `miroir-test-app_deployment-miroir` | vitest loader |
| `defaultValueForMLSchema` | `miroir-test-app_deployment-miroir` | vitest loader (file: defaultValueForJzodSchema) |
| `domain_controller_composite_pk_crud` | `miroir-test-app_deployment-miroir` | UI integ registry; legacy vitest twin |
| `domain_controller_data_crud` | `miroir-test-app_deployment-miroir` | UI integ registry; legacy vitest twin |
| `domain_controller_model_crud` | `miroir-test-app_deployment-miroir` | UI integ registry; legacy vitest twin |
| `domain_controller_model_undo_redo` | `miroir-test-app_deployment-miroir` | UI integ registry; legacy vitest twin |
| `domain_controller_no_parent_uuid_crud` | `miroir-test-app_deployment-miroir` | UI integ registry; legacy vitest twin |
| `domain_controller_non_uuid_pk_data_crud` | `miroir-test-app_deployment-miroir` | UI integ registry; legacy vitest twin |
| `domain_controller_non_uuid_pk_model_crud` | `miroir-test-app_deployment-miroir` | UI integ registry; legacy vitest twin |
| `getAttributeTypesFromJzodSchema` | `miroir-test-app_deployment-miroir` | vitest loader |
| `jzodObjectFlatten` | `miroir-test-app_deployment-miroir` | vitest loader |
| `jzodReferencesGraphConnectedComponents` | `miroir-test-app_deployment-miroir` | instance only (no dedicated vitest file in scope) |
| `jzodToCopilotKitParameter` | `miroir-test-app_deployment-miroir` | vitest loader |
| `jzodToJsonSchema` | `miroir-test-app_deployment-miroir` | vitest loader |
| `jzodToJzod_Summary` | `miroir-test-app_deployment-miroir` | vitest loader; full jzodToJzod.unit still imperative |
| `jzodTransitiveDependencySet` | `miroir-test-app_deployment-miroir` | vitest loader |
| `jzodTypeCheck` | `miroir-test-app_deployment-miroir` | vitest loader |
| `jzodUnionResolvedTypeForArray` | `miroir-test-app_deployment-miroir` | vitest loader |
| `jzodUnionResolvedTypeForObject` | `miroir-test-app_deployment-miroir` | vitest loader |
| `jzodUnion_RecursiveUnfold` | `miroir-test-app_deployment-miroir` | vitest loader |
| `localizeJzodSchemaReferenceContext` | `miroir-test-app_deployment-miroir` | vitest loader |
| `menu` | `miroir-test-app_deployment-miroir` | vitest loader |
| `mergePositionBased` | `miroir-test-app_deployment-miroir` | vitest loader |
| `metaModelTransformers` | `miroir-test-app_deployment-miroir` | instance in registry; no dedicated vitest file name match |
| `miroirCoreTransformers` | `miroir-test-app_deployment-miroir` | vitest loader + UI transformer integ |
| `modelUpdates` | `miroir-test-app_deployment-miroir` | vitest loader |
| `mustache` | `miroir-test-app_deployment-miroir` | vitest loader in miroir-core |
| `pilot_transformer_plus` | `miroir-test-app_deployment-miroir` | vitest loader (unitTest.pilot) |
| `queries_library` | `miroir-test-app_deployment-miroir` | vitest loader (queries.unit.test) |
| `resolveConditionalSchema` | `miroir-test-app_deployment-miroir` | vitest loader |
| `resolveQueryTemplates` | `miroir-test-app_deployment-miroir` | vitest loader |
| `resolveSchemaReferenceInContext` | `miroir-test-app_deployment-miroir` | vitest loader |
| `runner_create_entity` | `miroir-test-app_deployment-miroir` | UI integ registry; legacy vitest twin |
| `runner_drop_entity` | `miroir-test-app_deployment-miroir` | UI integ registry; legacy vitest twin |
| `runner_library` | `miroir-test-app_deployment-library` | UI integ registry; legacy Runner_Miroir twin |
| `selectUnionBranchFromDiscriminator` | `miroir-test-app_deployment-miroir` | vitest loader |
| `tools` | `miroir-test-app_deployment-miroir` | vitest loader |
| `unfoldSchemaOnce` | `miroir-test-app_deployment-miroir` | vitest loader |
| `unionArrayChoices` | `miroir-test-app_deployment-miroir` | vitest loader |
| `unionObjectChoices` | `miroir-test-app_deployment-miroir` | vitest loader |

---

## Inventory by class

### DONE (34)

| File | Notes |
|------|-------|
| `packages/miroir-core/tests/1_core/alterObject.unit.test.ts` | Thin vitest loader for `alterObject` |
| `packages/miroir-core/tests/1_core/ansiColumnsToJzodSchema.unit.test.ts` | Thin vitest loader for `ansiColumnsToJzodSchema` |
| `packages/miroir-core/tests/1_core/defaultValueForJzodSchema.unit.test.ts` | Thin vitest loader for `defaultValueForMLSchema` |
| `packages/miroir-core/tests/1_core/EntityPrimaryKey.unit.test.ts` | Thin vitest loader for `EntityPrimaryKey` |
| `packages/miroir-core/tests/1_core/getAttributeTypesFromJzodSchema.unit.test.ts` | Thin vitest loader for `getAttributeTypesFromJzodSchema` |
| `packages/miroir-core/tests/1_core/jzod/jzod.buildAnyKeyMap.unit.test.ts` | Thin vitest loader for `buildAnyKeyMap` |
| `packages/miroir-core/tests/1_core/jzod/jzod.localizeReferenceContext.unit.test.ts` | Thin vitest loader for `localizeJzodSchemaReferenceContext` |
| `packages/miroir-core/tests/1_core/jzod/jzod.selectUnionBranchFromDiscriminator.unit.test.ts` | Thin vitest loader for `selectUnionBranchFromDiscriminator` |
| `packages/miroir-core/tests/1_core/jzod/jzod.unionObjectChoices.test.ts` | Thin vitest loader for `unionObjectChoices` |
| `packages/miroir-core/tests/1_core/jzod/jzod.unionResolvedTypeForArray.unit.test.ts` | Thin vitest loader for `jzodUnionResolvedTypeForArray` |
| `packages/miroir-core/tests/1_core/jzod/jzod.unionResolvedTypeForObject.unit.test.ts` | Thin vitest loader for `jzodUnionResolvedTypeForObject` |
| `packages/miroir-core/tests/1_core/jzod/jzodObjectFlatten.test.ts` | Thin vitest loader for `jzodObjectFlatten` |
| `packages/miroir-core/tests/1_core/jzod/JzodSchemaReferencesList.unit.test.ts` | Thin vitest loader for `JzodSchemaReferencesList` |
| `packages/miroir-core/tests/1_core/jzod/JzodSchemaReferencesSet.unit.test.ts` | Thin vitest loader for `JzodSchemaReferencesSet` |
| `packages/miroir-core/tests/1_core/jzod/jzodToCopilotKitParameter.unit.test.ts` | Thin vitest loader for `jzodToCopilotKitParameter` |
| `packages/miroir-core/tests/1_core/jzod/jzodToJsonSchema.unit.test.ts` | Thin vitest loader for `jzodToJsonSchema` |
| `packages/miroir-core/tests/1_core/jzod/jzodToJzod_Summary.unit.test.ts` | Thin vitest loader for `jzodToJzod_Summary` |
| `packages/miroir-core/tests/1_core/jzod/jzodTransitiveDependencySet.unit.test.ts` | Thin vitest loader for `jzodTransitiveDependencySet` |
| `packages/miroir-core/tests/1_core/jzod/jzodTypeCheck.test.ts` | Thin vitest loader for `jzodTypeCheck` |
| `packages/miroir-core/tests/1_core/jzod/jzodUnion_RecursiveUnfold.test.ts` | Thin vitest loader for `jzodUnion_RecursiveUnfold` |
| `packages/miroir-core/tests/1_core/jzod/mergePositionBased.unit.test.ts` | Thin vitest loader for `mergePositionBased` |
| `packages/miroir-core/tests/1_core/jzod/resolveConditionalSchema.test.ts` | Thin vitest loader for `resolveConditionalSchema` |
| `packages/miroir-core/tests/1_core/jzod/resolveSchemaReferenceInContext.test.ts` | Thin vitest loader for `resolveSchemaReferenceInContext` |
| `packages/miroir-core/tests/1_core/jzod/unfoldSchemaOnce.test.ts` | Thin vitest loader for `unfoldSchemaOnce` |
| `packages/miroir-core/tests/1_core/jzod/unionArrayChoices.test.ts` | Thin vitest loader for `unionArrayChoices` |
| `packages/miroir-core/tests/1_core/modelUpdates.unit.test.ts` | Thin vitest loader for `modelUpdates` |
| `packages/miroir-core/tests/1_core/mustache.unit.test.ts` | Thin vitest loader for `mustache` |
| `packages/miroir-core/tests/2_domain/adminTransformers.unit.test.ts` | Thin vitest loader for `adminTransformers` |
| `packages/miroir-core/tests/2_domain/menu.unit.test.ts` | Thin vitest loader for `menu` |
| `packages/miroir-core/tests/2_domain/queries.unit.test.ts` | Thin vitest loader for `queries_library` |
| `packages/miroir-core/tests/2_domain/resolveQueryTemplates.unit.test.ts` | Thin vitest loader for `resolveQueryTemplates` |
| `packages/miroir-core/tests/2_domain/transformers.unit.test.ts` | Thin vitest loader for `miroirCoreTransformers` |
| `packages/miroir-core/tests/4_services/unitTest.pilot.unit.test.ts` | Thin vitest loader for `pilot_transformer_plus` |
| `packages/miroir-core/tests/tools.test.ts` | Thin vitest loader for `tools` |

### MIGRATE (23)

| File | Notes |
|------|-------|
| `packages/miroir-core/tests/1_core/blobUtils.unit.test.ts` | Blob handling used by entity/report editors at runtime |
| `packages/miroir-core/tests/1_core/createDeploymentCompositeAction.unit.test.ts` | Deployment composite action — authorable action surface |
| `packages/miroir-core/tests/1_core/jzod/jzodToJzod.unit.test.ts` | Full jzod→jzod carry-on suite; only Summary is MiroirTest today — consolidate or migrate remainder |
| `packages/miroir-core/tests/1_core/listSelfApplicationUuidPaths.unit.test.ts` | Model/path utilities for application remapping — authorable model ops |
| `packages/miroir-core/tests/1_core/modelEnvironment.unit.test.ts` | MiroirModelEnvironment construction — core product runtime concept |
| `packages/miroir-core/tests/1_core/remapApplicationModelAtPaths.unit.test.ts` | Application model remapping — product model operation |
| `packages/miroir-core/tests/1_core/schemaChangeKind.unit.test.ts` | Schema evolution kind — product metamodel behavior |
| `packages/miroir-core/tests/1_core/schemaForDeployment.unit.test.ts` | Fundamental schema per deployment — product; has mocks → confirm mock weight in review |
| `packages/miroir-core/tests/1_core/schemaResolutionMode.unit.test.ts` | Schema resolution modes — product; has mocks → confirm mock weight in review |
| `packages/miroir-core/tests/1_core/zodParseActions.test.ts` | Zod parse of Action definitions — product language surface |
| `packages/miroir-core/tests/1_core/zodParseCheckMiroirTransformerDefinitions.test.ts` | Validates Transformer definitions — product language |
| `packages/miroir-core/tests/1_core/zodParseError.test.ts` | Parse/error reporting for fundamental types — product feedback |
| `packages/miroir-core/tests/2_domain/domainStateToDeploymentEntityState.unit.test.ts` | Domain→deployment entity state mapping — runtime product path |
| `packages/miroir-core/tests/2_domain/resolveCompositeActionTemplate.unit.test.ts` | CompositeAction template resolution — authorable Actions |
| `packages/miroir-core/tests/2_domain/transformer_tools.substituteTranformerReferencesInJzodElement.unit.test.ts` | Transformer reference substitution in jzod — product transformer tooling |
| `packages/miroir-core/tests/2_domain/transformer_tools.transformerInterfaceFromDefinition.unit.test.ts` | Transformer interface from definition — product transformer tooling |
| `packages/miroir-standalone-app/tests/3_controllers/applicative.Library.BuildPlusRuntimeCompositeAction.integ.test.tsx` | Library Build+Runtime CompositeAction — authorable Actions; no MiroirTest instance yet |
| `packages/miroir-standalone-app/tests/3_controllers/applicative.Library.RuntimeCompositeAction.integ.test.tsx` | Library Runtime CompositeAction — authorable Actions |
| `packages/miroir-standalone-app/tests/3_controllers/applicative.Library.Template.integ.test.tsx` | Library Action templates — authorable Actions |
| `packages/miroir-standalone-app/tests/4_view/Runner_ExternalEntity.integ.test.tsx` | External entity install/query — product storage feature; no MiroirTest yet |
| `packages/miroir-standalone-app/tests/4_view/typedValueObjectEditorSchema.unit.test.ts` | Schema resolution for TypedValueObjectEditor against Library model — product; pure asserts (imports runner_library as data) |
| `packages/miroir-standalone-app/tests/4_view/utils/foreignKeyAttributeAnalyzer.unit.test.ts` | FK attribute analysis for editors — product schema logic; pure (no RTL) |
| `packages/miroir-standalone-app/tests/getObjectUniondiscriminatorValuesFromResolvedSchema.test.ts` | Union discriminator from resolved schema — jzod product core; pure (no RTL) |

### UI_COMPONENT (33)

| File | Notes |
|------|-------|
| `packages/miroir-standalone-app/tests/4_view/adaptiveColumnWidths.unit.test.ts` | Editor column width chrome — pure but UI-only |
| `packages/miroir-standalone-app/tests/4_view/BlobEditorField.integ.test.tsx` | Blob editor field; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/exclusivelyUnfoldPath.unit.test.ts` | Fold/unfold path chrome |
| `packages/miroir-standalone-app/tests/4_view/getItemsOrder.unit.test.ts` | UI ordering helper |
| `packages/miroir-standalone-app/tests/4_view/GraphComponent.test.tsx` | Graph component; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/GraphReportSectionView.renderInsight.unit.test.tsx` | Graph report section; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/GraphReportSectionView.test.tsx` | Graph report section; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/isNodeFolded.unit.test.ts` | Fold state chrome |
| `packages/miroir-standalone-app/tests/4_view/jzodEditorRenderInsight.unit.test.ts` | Editor RenderInsight wiring |
| `packages/miroir-standalone-app/tests/4_view/JzodElementEditor.test.tsx` | JzodElementEditor — product UI; needs in-UI enactment path |
| `packages/miroir-standalone-app/tests/4_view/JzodElementEditorReactCodeMirror.test.tsx` | CodeMirror path of JzodElementEditor; RTL |
| `packages/miroir-standalone-app/tests/4_view/JzodObjectEditor.BlobIntegration.integ.test.tsx` | JzodObjectEditor blob integ; RTL |
| `packages/miroir-standalone-app/tests/4_view/MarkdownEditorModal.test.tsx` | Markdown editor modal; RTL |
| `packages/miroir-standalone-app/tests/4_view/performanceDisplayGate.unit.test.ts` | Perf display gate chrome |
| `packages/miroir-standalone-app/tests/4_view/progressiveRenderConfig.unit.test.ts` | Progressive render config chrome |
| `packages/miroir-standalone-app/tests/4_view/renderInsightChrome.unit.test.ts` | RenderInsight chrome |
| `packages/miroir-standalone-app/tests/4_view/renderInsightFootprint.acceptance.unit.test.tsx` | RenderInsight footprint; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/RenderInsightHeader.unit.test.tsx` | RenderInsight chrome; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/renderInsightMaxDepth.unit.test.ts` | RenderInsight depth chrome |
| `packages/miroir-standalone-app/tests/4_view/renderInsightRegistry.unit.test.ts` | RenderInsight registry |
| `packages/miroir-standalone-app/tests/4_view/renderInsightSummarize.unit.test.ts` | RenderInsight summarize |
| `packages/miroir-standalone-app/tests/4_view/RenderInsightSummary.unit.test.tsx` | RenderInsight chrome; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/ReportPage.integ.test.tsx` | Report page; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/ReportSectionMarkdown.test.tsx` | Report markdown section; RTL |
| `packages/miroir-standalone-app/tests/4_view/setNodeFoldedState.unit.test.ts` | Fold state chrome |
| `packages/miroir-standalone-app/tests/4_view/TransformerEditor.test.tsx` | TransformerEditor; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/useCurrentModelEnvironment.unit.test.tsx` | React hook for model env; RTL |
| `packages/miroir-standalone-app/tests/4_view/useRenderInsight.unit.test.tsx` | React hook; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/useViewportReveal.unit.test.tsx` | React hook; RTL+mocks |
| `packages/miroir-standalone-app/tests/extractValuesFromRenderedElements.test.tsx` | DOM extraction helper for editors; RTL+mocks |
| `packages/miroir-standalone-app/tests/formValuesToJSON.test.ts` | Form values→JSON; RTL-coupled |
| `packages/miroir-standalone-app/tests/view/AiProposalForms.unit.test.tsx` | AI proposal forms; RTL |
| `packages/miroir-standalone-app/tests/view/ReportComponent.test.tsx` | ReportComponent; RTL |

### PLATFORM (65)

| File | Notes |
|------|-------|
| `packages/miroir-core/tests/3_controllers/MiroirEventTracker.unit.test.ts` | Activity/event tracking harness for diagnostics |
| `packages/miroir-core/tests/3_controllers/RunActionTracker.unit.test.ts` | Action run tracker — infra for observability |
| `packages/miroir-core/tests/3_controllers/TestTracker.unit.test.ts` | Test tracker — MiroirTest/platform glue |
| `packages/miroir-core/tests/4_services/inferIntegrationSessionKind.unit.test.ts` | Integ session kind classifier for MiroirTest runners |
| `packages/miroir-core/tests/4_services/miroirTest.tools.unit.test.ts` | MiroirTestTools unit coverage |
| `packages/miroir-core/tests/4_services/miroirTestTools.unit.test.ts` | MiroirTestTools unit coverage |
| `packages/miroir-core/tests/4_services/MiroirTransformerTestTools.unit.test.ts` | Transformer test harness helpers |
| `packages/miroir-core/tests/4_services/runMiroirTestSuiteInProcess.unit.test.ts` | In-process MiroirTest runner |
| `packages/miroir-core/tests/4_services/runnerLibraryTestRegistry.unit.test.ts` | Runner library registry wiring |
| `packages/miroir-core/tests/4_services/runnerTest.tools.unit.test.ts` | RunnerTest tools harness |
| `packages/miroir-core/tests/4_services/runnerTestRunTarget.unit.test.ts` | Runner test run-target resolution |
| `packages/miroir-core/tests/5-tests/ActionTestTools.unit.test.ts` | Action test harness |
| `packages/miroir-core/tests/5-tests/CompositeActionTestTools.unit.test.ts` | CompositeAction test harness |
| `packages/miroir-core/tests/5-tests/IntegrationTestBootstrap.unit.test.ts` | Integ bootstrap |
| `packages/miroir-core/tests/5-tests/LibraryPlayfield.unit.test.ts` | Library playfield fixture; mocks |
| `packages/miroir-core/tests/5-tests/MiroirPlatformPlayfield.unit.test.ts` | Platform playfield fixture; mocks |
| `packages/miroir-core/tests/5-tests/miroirTestFilter.unit.test.ts` | MiroirTest filter CLI/helper |
| `packages/miroir-core/tests/5-tests/MiroirTestIntegrationOrchestrator.unit.test.ts` | MiroirTest integ orchestrator; mocks |
| `packages/miroir-core/tests/5-tests/miroirTestSuiteRegistry.unit.test.ts` | Suite registry |
| `packages/miroir-core/tests/5-tests/parseMiroirTestCliConfig.unit.test.ts` | CLI config parser |
| `packages/miroir-core/tests/5_tests/FunctionCallTestFixtures.unit.test.ts` | functionCallTest fixtures |
| `packages/miroir-core/tests/miroir-core-tests.unit.test.ts` | CLI vitest entry for all MiroirTest unit suites |
| `packages/miroir-standalone-app/tests/4-tests/testApplicationStoreTeardown.unit.test.ts` | Store teardown helper |
| `packages/miroir-standalone-app/tests/4_storage/ExtractorPersistenceStoreRunner.integ.test.tsx` | Persistence extractor runner — store backend |
| `packages/miroir-standalone-app/tests/4_storage/ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` | Persistence extractor template runner — store backend |
| `packages/miroir-standalone-app/tests/4_storage/PersistenceStoreController.integ.test.tsx` | PersistenceStoreController — store backend |
| `packages/miroir-standalone-app/tests/4_view/MiroirTestDisplay.unit.test.tsx` | MiroirTest details UI; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/MiroirTestDisplayIntegrationLaunch.integ.test.tsx` | MiroirTest details integ launch; RTL |
| `packages/miroir-standalone-app/tests/4_view/MiroirTestListDisplay.unit.test.tsx` | MiroirTest list UI; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/MiroirTestListIntegrationLaunch.integ.test.tsx` | MiroirTest list integ launch; RTL |
| `packages/miroir-standalone-app/tests/4_view/RunAllMiroirTestsButton.unit.test.tsx` | Run-all button; RTL+mocks |
| `packages/miroir-standalone-app/tests/4_view/RunnerIntegTestTools.unit.test.ts` | Legacy runner integ tools |
| `packages/miroir-standalone-app/tests/4_view/UiIntegrationTestRunControls.unit.test.tsx` | Integ run controls UI; RTL |
| `packages/miroir-standalone-app/tests/helpers/appStackIntegrationBootstrap.unit.test.ts` | App-stack bootstrap; mocks |
| `packages/miroir-standalone-app/tests/helpers/assertMiroirServerReachable.unit.test.ts` | Server reachability assert |
| `packages/miroir-standalone-app/tests/helpers/buildIntegrationTestRunInspectorModel.unit.test.ts` | Run inspector model builder |
| `packages/miroir-standalone-app/tests/helpers/deriveTestSessionDefaultsFromMiroirConfig.unit.test.ts` | Session defaults from config |
| `packages/miroir-standalone-app/tests/helpers/DomainControllerIntegrationTestSession.unit.test.ts` | Integ session helper; mocks |
| `packages/miroir-standalone-app/tests/helpers/embeddedIntegrationBootstrap.unit.test.ts` | Embedded bootstrap; mocks |
| `packages/miroir-standalone-app/tests/helpers/integrationTestProfileAssets.unit.test.ts` | Profile assets |
| `packages/miroir-standalone-app/tests/helpers/integrationTestProfileCatalog.unit.test.ts` | Profile catalog |
| `packages/miroir-standalone-app/tests/helpers/integrationTestProfiles.unit.test.ts` | Profiles |
| `packages/miroir-standalone-app/tests/helpers/IntegrationTestSession.unit.test.ts` | Integ session helper; mocks |
| `packages/miroir-standalone-app/tests/helpers/integTestRunCoordinator.unit.test.ts` | Integ run coordinator |
| `packages/miroir-standalone-app/tests/helpers/libraryPlayfieldSeeds.unit.test.ts` | Playfield seeds |
| `packages/miroir-standalone-app/tests/helpers/miroirCoreIntegTestLaunch.unit.test.ts` | CLI/launch helper |
| `packages/miroir-standalone-app/tests/helpers/miroirTestSuiteUiExecution.unit.test.ts` | UI execution capability classifier |
| `packages/miroir-standalone-app/tests/helpers/resolveRealServerUiIntegrationProfile.unit.test.ts` | Real-server profile resolve |
| `packages/miroir-standalone-app/tests/helpers/resolveTransformerTestSessionOptions.unit.test.ts` | Transformer session options |
| `packages/miroir-standalone-app/tests/helpers/RunnerTestSession.unit.test.ts` | Runner session helper; mocks |
| `packages/miroir-standalone-app/tests/helpers/runRealServerClientBootstrap.unit.test.ts` | Real-server client bootstrap; mocks |
| `packages/miroir-standalone-app/tests/helpers/setupMiroirTestWrappers.unit.test.ts` | setupMiroirTest wrappers; mocks |
| `packages/miroir-standalone-app/tests/helpers/StandaloneAppIntegrationOrchestrator.unit.test.ts` | Orchestrator; mocks |
| `packages/miroir-standalone-app/tests/helpers/test-by-file.profile.unit.test.ts` | testByFile profile |
| `packages/miroir-standalone-app/tests/helpers/test-miroir-runner.profile.unit.test.ts` | testMiroir runner profile |
| `packages/miroir-standalone-app/tests/helpers/testSessionModelEnvironment.unit.test.ts` | Session model environment |
| `packages/miroir-standalone-app/tests/helpers/transformerTestApplicationPlayfield.unit.test.ts` | Transformer playfield |
| `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.integ.test.ts` | UI integ launcher |
| `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.realServer.integ.test.ts` | UI integ launcher real server |
| `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.realServer.transformer.integ.test.ts` | UI integ launcher transformer real server |
| `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.unit.test.ts` | UI integ launcher unit |
| `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncherTypes.unit.test.ts` | Launcher types |
| `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestRunPreferences.unit.test.ts` | Run preferences |
| `packages/miroir-standalone-app/tests/miroir-core-tests.integ.test.ts` | CLI integ entry for MiroirTest |
| `packages/miroir-standalone-app/tests/miroir-runner-tests.integ.test.ts` | CLI runner integ entry |

### DISPOSABLE (10)

| File | Notes |
|------|-------|
| `packages/miroir-standalone-app/tests/2_domain/Mustache.unit.test.tsx` | Mostly commented experiment; canonical coverage is miroir-core `mustache` MiroirTest |
| `packages/miroir-standalone-app/tests/3_controllers/DomainController.integ.compositePK.CRUD.test.tsx` | @deprecated / cutover leftover; behavior covered by MiroirTest `domain_controller_composite_pk_crud` |
| `packages/miroir-standalone-app/tests/3_controllers/DomainController.integ.Data.CRUD.test.tsx` | @deprecated / cutover leftover; behavior covered by MiroirTest `domain_controller_data_crud` |
| `packages/miroir-standalone-app/tests/3_controllers/DomainController.integ.Model.CRUD.test.tsx` | @deprecated / cutover leftover; behavior covered by MiroirTest `domain_controller_model_crud` |
| `packages/miroir-standalone-app/tests/3_controllers/DomainController.integ.nonUuidPK.CRUD.test.tsx` | @deprecated / cutover leftover; behavior covered by MiroirTest `domain_controller_non_uuid_pk_{model,data}_crud` |
| `packages/miroir-standalone-app/tests/3_controllers/DomainController.integ.noParentUuid.CRUD.test.tsx` | @deprecated / cutover leftover; behavior covered by MiroirTest `domain_controller_no_parent_uuid_crud` |
| `packages/miroir-standalone-app/tests/3_controllers/DomainController.React.Model.undo-redo.test.tsx` | @deprecated / cutover leftover; behavior covered by MiroirTest `domain_controller_model_undo_redo` |
| `packages/miroir-standalone-app/tests/4_view/Runner_CreateEntity.integ.test.tsx` | @deprecated / cutover leftover; behavior covered by MiroirTest `runner_create_entity` |
| `packages/miroir-standalone-app/tests/4_view/Runner_DropEntity.integ.test.tsx` | @deprecated / cutover leftover; behavior covered by MiroirTest `runner_drop_entity` |
| `packages/miroir-standalone-app/tests/4_view/Runner_Miroir.integ.test.tsx` | @deprecated / cutover leftover; behavior covered by MiroirTest `runner_library` |

### UNCLEAR (1)

| File | Notes |
|------|-------|
| `packages/miroir-core/tests/4_views/ViewParams.integ.test.ts` | ViewParams feels UI-session state; not React/RTL — product vs chrome? |

---

## Review checklist

- [ ] Confirm MIGRATE rows are truly authorable product surface (litmus D)
- [ ] Confirm DISPOSABLE cutover leftovers can be deleted only after G8-style parity acceptance
- [ ] Resolve UNCLEAR rows
- [ ] Spot-check UI_COMPONENT vs PLATFORM (especially MiroirTest chrome vs product editors)
- [ ] Spot-check schemaForDeployment / schemaResolutionMode mock weight (MIGRATE vs PLATFORM)


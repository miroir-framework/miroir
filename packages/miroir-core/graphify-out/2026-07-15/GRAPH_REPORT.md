# Graph Report - packages\miroir-core  (2026-07-15)

## Corpus Check
- 287 files · ~332,127 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2487 nodes · 7129 edges · 103 communities (85 shown, 18 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 120 edges (avg confidence: 0.65)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f6618279`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- miroirFundamentalType.ts
- index.ts
- TransformersForRuntime.ts
- LoggerInterface.ts
- jzodTypeCheck.ts
- Uuid
- Deployment.ts
- ExtractorRunnerInterface.ts
- ApplicationDeploymentMap
- QueryRunnerTestTools.ts
- Transformers.ts
- runMiroirCoreTestSuite.ts
- MiroirActivityTracker
- getMiroirFundamentalJzodSchema.ts
- Action2ReturnType
- MiroirActivityTrackerInterface
- PersistenceStoreControllerInterface.ts
- Action2VoidReturnType
- parseMiroirTestCliConfig.ts
- DomainElement.ts
- DomainController.ts
- Model.ts
- devDependencies
- ReduxDeploymentsStateQuerySelectors.ts
- MiroirTestTools.ts
- compilerOptions
- tools.ts
- RunnerTestTools.ts
- DomainControllerInterface.ts
- PersistenceStoreController
- MiroirTestIntegrationOrchestrator.ts
- MiroirTransformerTestTools.ts
- ConfigurationService.ts
- dependencies
- DomainStateQuerySelectors.ts
- EntityDefinition.ts
- JzodElement
- Templates.ts
- zodParseCheckMiroirTransformerDefinitions.test.ts
- FunctionCallTestRegistry.ts
- EntityInstance
- RestClientCallReturnType
- TestTools.ts
- schemaForDeployment.ts
- QuerySelectors.ts
- ViewParams
- resolveApplyTo_legacy
- package.json
- StorageConfiguration.ts
- DomainControllerInterface
- transformer_extended_apply
- JzodUnfoldSchemaOnce.ts
- MiroirEventService.ts
- JzodToJzod_CarryOn.ts
- LocalCacheInterface.ts
- PersistenceStoreAdminSectionInterface
- LoggerGlobalContext
- inferIntegrationSessionKind.ts
- MiroirLogger
- ExtractorByEntityReturningObjectListTools
- MiroirEventService
- DomainDataAccess.ts
- Datastore.ts
- Endpoint.ts
- TransformerEventServiceInterface
- test-expect.ts
- files
- scripts
- MiroirConfigClient
- PersistenceStoreEntitySectionAbstractInterface
- Transformer_tools.ts
- ReduxDeploymentsStateInterface.ts
- tools.ts
- MiroirEventServiceInterface
- PersistenceStoreAbstractSectionInterface
- TestInterface.ts
- getDefaultValueForJzodSchema.ts
- transformer_InnerReference_resolve
- ViewParams.ts
- MlSchema
- handleCountTransformer
- MonitoringService
- ReportRenderer
- miroir-test-app_deployment-library
- sequelize
- tinyrainbow
- tsx
- @types/json-diff
- vitest
- transformersTests_spreadsheet.data.ts
- unitTestPilotTransformerPlus.ts
- manual_tests.sh
- vite.config.js

## God Nodes (most connected - your core abstractions)
1. `Action2VoidReturnType` - 109 edges
2. `ApplicationDeploymentMap` - 92 edges
3. `MiroirModelEnvironment` - 80 edges
4. `MiroirActivityTracker` - 70 edges
5. `LoggerInterface` - 66 edges
6. `MiroirActivityTrackerInterface` - 65 edges
7. `EntityInstance` - 58 edges
8. `MiroirLoggerFactory` - 58 edges
9. `Uuid` - 57 edges
10. `Action2ReturnType` - 57 edges

## Surprising Connections (you probably didn't know these)
- `ApplyCarryOnSchemaOnLevelReturnType` --references--> `JzodElement`  [EXTRACTED]
  packages/miroir-core/src/1_core/jzod/JzodToJzod_CarryOn.ts → packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts
- `TestCase` --references--> `JzodElement`  [EXTRACTED]
  packages/miroir-core/tests/1_core/jzod/jzodToJzod.unit.test.ts → packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts
- `getDomainStateExtractorRunnerMap()` --indirect_call--> `applyExtractorTransformerInMemory()`  [INFERRED]
  packages/miroir-core/src/2_domain/DomainStateQuerySelectors.ts → packages/miroir-core/src/2_domain/QuerySelectors.ts
- `getDomainStateExtractorRunnerMap()` --indirect_call--> `extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList()`  [INFERRED]
  packages/miroir-core/src/2_domain/DomainStateQuerySelectors.ts → packages/miroir-core/src/2_domain/QuerySelectors.ts
- `getSelectorMapForTemplate()` --indirect_call--> `applyExtractorTransformerInMemory()`  [INFERRED]
  packages/miroir-core/src/2_domain/DomainStateQueryTemplateSelector.ts → packages/miroir-core/src/2_domain/QuerySelectors.ts

## Import Cycles
- 3-file cycle: `packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts`
- 3-file cycle: `packages/miroir-core/src/2_domain/QuerySelectors.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/QuerySelectors.ts`
- 3-file cycle: `packages/miroir-core/src/1_core/jzod/jzodTypeCheck.ts -> packages/miroir-core/src/1_core/jzod/resolveConditionalSchema.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/1_core/jzod/jzodTypeCheck.ts`
- 3-file cycle: `packages/miroir-core/src/0_interfaces/2_domain/DomainControllerInterface.ts -> packages/miroir-core/src/0_interfaces/4-services/PersistenceInterface.ts -> packages/miroir-core/src/0_interfaces/4-services/PersistenceStoreControllerManagerInterface.ts -> packages/miroir-core/src/0_interfaces/2_domain/DomainControllerInterface.ts`
- 4-file cycle: `packages/miroir-core/src/2_domain/QuerySelectors.ts -> packages/miroir-core/src/2_domain/Templates.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/QuerySelectors.ts`
- 4-file cycle: `packages/miroir-core/src/2_domain/QueryTemplateSelectors.ts -> packages/miroir-core/src/2_domain/Templates.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/QueryTemplateSelectors.ts`
- 4-file cycle: `packages/miroir-core/src/2_domain/QuerySelectors.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts -> packages/miroir-core/src/2_domain/QuerySelectors.ts`
- 4-file cycle: `packages/miroir-core/src/2_domain/QuerySelectors.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/QueryTemplateSelectors.ts -> packages/miroir-core/src/2_domain/QuerySelectors.ts`
- 5-file cycle: `packages/miroir-core/src/2_domain/QuerySelectors.ts -> packages/miroir-core/src/2_domain/Templates.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/QueryTemplateSelectors.ts -> packages/miroir-core/src/2_domain/QuerySelectors.ts`
- 5-file cycle: `packages/miroir-core/src/2_domain/QuerySelectors.ts -> packages/miroir-core/src/2_domain/Templates.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts -> packages/miroir-core/src/2_domain/QuerySelectors.ts`
- 5-file cycle: `packages/miroir-core/src/2_domain/QueryTemplateSelectors.ts -> packages/miroir-core/src/2_domain/Templates.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts -> packages/miroir-core/src/2_domain/QueryTemplateSelectors.ts`
- 5-file cycle: `packages/miroir-core/src/2_domain/QuerySelectors.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts -> packages/miroir-core/src/2_domain/QueryTemplateSelectors.ts -> packages/miroir-core/src/2_domain/QuerySelectors.ts`
- 5-file cycle: `packages/miroir-core/src/1_core/jzod/jzodTypeCheck.ts -> packages/miroir-core/src/1_core/jzod/resolveConditionalSchema.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQuerySelectors.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/1_core/jzod/jzodTypeCheck.ts`
- 5-file cycle: `packages/miroir-core/src/1_core/jzod/jzodTypeCheck.ts -> packages/miroir-core/src/1_core/jzod/resolveConditionalSchema.ts -> packages/miroir-core/src/2_domain/ReduxDeploymentsStateQueryExecutor.ts -> packages/miroir-core/src/2_domain/QuerySelectors.ts -> packages/miroir-core/src/2_domain/TransformersForRuntime.ts -> packages/miroir-core/src/1_core/jzod/jzodTypeCheck.ts`

## Communities (103 total, 18 thin omitted)

### Community 0 - "miroirFundamentalType.ts"
Cohesion: 0.01
Nodes (311): AccordionReportSection, ______________________________________________actions_____________________________________________, ActionsArray, ActionsUnion, ___________________________________applicative_transformers______________________________________, ______________________________________________basic_____________________________________________, ______________________________________________bootstrap_____________________________________________, BuildPlusRuntimeDomainAction (+303 more)

### Community 1 - "index.ts"
Cohesion: 0.02
Nodes (114): BlobContents, BlobUploadResult, BlobValidationResult, HttpMethod, HttpMethodsArray, HttpMethodsObject, DeploymentMode, MiroirConfigRoot (+106 more)

### Community 2 - "TransformersForRuntime.ts"
Cohesion: 0.03
Nodes (58): CoreTransformerForBuildPlusRuntime_accessDynamicPath, CoreTransformerForBuildPlusRuntime_aggregate, CoreTransformerForBuildPlusRuntime_boolExpr, CoreTransformerForBuildPlusRuntime_constantAsExtractor, CoreTransformerForBuildPlusRuntime_createObject, CoreTransformerForBuildPlusRuntime_createObjectFromPairs, CoreTransformerForBuildPlusRuntime_currentDate, CoreTransformerForBuildPlusRuntime_currentTimestamp (+50 more)

### Community 3 - "LoggerInterface.ts"
Cohesion: 0.07
Nodes (28): Factory, FactoryLevels, LoggerFactoryAsyncInterface, LoggerFactoryInterface, LoggerInterface, LoggerOptions, LogLevelOptions, LogTopic (+20 more)

### Community 4 - "jzodTypeCheck.ts"
Cohesion: 0.06
Nodes (51): JzodSchemaDefinition, jzodSchemaDefinitionSchema, TODO: DEFUNCT???, SelectUnionBranchFromDiscriminatorReturnType, JzodBaseObject, JzodReference, JzodUnion_RecursivelyUnfold_ReturnType, KeyMapEntry (+43 more)

### Community 5 - "Uuid"
Cohesion: 0.07
Nodes (20): Uuid, DataStoreType, MetaModel, StoreUnitConfiguration, LocalCacheInterface, InitApplicationParameters, PersistenceStoreControllerManagerInterface, TODO: remove these getters and setters, only there to circumvent technical diffi (+12 more)

### Community 6 - "Deployment.ts"
Cohesion: 0.06
Nodes (44): LIBRARY_TMP, ActionTemplate, AdminApplication, ApplicationModelBranch, ApplicationVersion, BuildPlusRuntimeCompositeAction, CompositeAction, CompositeRunTestAssertion (+36 more)

### Community 7 - "ExtractorRunnerInterface.ts"
Cohesion: 0.10
Nodes (37): BoxedExtractorOrCombinerReturningObject, BoxedExtractorOrCombinerReturningObjectList, BoxedExtractorOrCombinerReturningObjectOrObjectList, BoxedQueryWithExtractorCombinerTransformer, CombinerOneToOne, DomainElementSuccess, EntityInstancesUuidIndex, ExtractorByPrimaryKey (+29 more)

### Community 8 - "ApplicationDeploymentMap"
Cohesion: 0.13
Nodes (9): CompositeActionSequence, CompositeActionTemplate, DomainAction, RunBoxedQueryAction, MiroirModelEnvironment, HttpRequestBodyFormat, ApplicationDeploymentMap, EndpointApplicationMap (+1 more)

### Community 9 - "QueryRunnerTestTools.ts"
Cohesion: 0.08
Nodes (41): MiroirTestForFunctionCall, MiroirTestForQuery, defaultMetaModelEnvironment, jsonify(), getQueryTemplateRunnerParamsForReduxDeploymentsState, removeUndefinedProperties(), FUNCTION_CALL_ENVIRONMENTS, FUNCTION_CALL_META_MODEL_ENVIRONMENTS (+33 more)

### Community 10 - "Transformers.ts"
Cohesion: 0.04
Nodes (49): adminTransformers, coreBuildPlusRuntimeReferenceMap, metaModelTransformers, miroirTransformers, spreadsheetTransformers, transformer_accessDynamicPath, transformer_aggregate, transformer_ansiColumnsToJzodSchema (+41 more)

### Community 11 - "runMiroirCoreTestSuite.ts"
Cohesion: 0.10
Nodes (14): MiroirTestSuite, vitestArgs, dummyMlSchema, shouldSkip, vitestArgs, vitestArgs, shouldSkip, vitestArgs (+6 more)

### Community 12 - "MiroirActivityTracker"
Cohesion: 0.08
Nodes (4): TestSuiteResult, MiroirActivity, TestAssertionPath, MiroirActivityTracker

### Community 13 - "getMiroirFundamentalJzodSchema.ts"
Cohesion: 0.08
Nodes (42): build(), fileExists(), generateSchemas(), generateTsTypeFileFromJzod(), TODO: do deep equal, writeFile(), clientEnvironment, entityDefinitionRoot (+34 more)

### Community 14 - "Action2ReturnType"
Cohesion: 0.08
Nodes (20): DomainElementType, LocalCacheAction, PersistenceAction, RunBoxedQueryTemplateAction, StoreOrBundleAction, Action2Error, Action2ReturnType, ErrorLogServiceInterface (+12 more)

### Community 15 - "MiroirActivityTrackerInterface"
Cohesion: 0.06
Nodes (9): TestAssertionResult, TestAssertionsResults, TestResult, MiroirActivity_Root, MiroirActivityTrackerInterface, activityTypeToTopicMap, getActivityTopic(), TransformerGlobalContext (+1 more)

### Community 16 - "PersistenceStoreControllerInterface.ts"
Cohesion: 0.08
Nodes (25): entityDefinitionWithResolvedMLSchema(), ApplicationSection, EntityInstanceCollection, ModelActionInitModel, ModelActionInitModelParams, SelfApplication, Action2EntityInstanceReturnType, DataStoreApplicationType (+17 more)

### Community 17 - "Action2VoidReturnType"
Cohesion: 0.11
Nodes (8): Entity, EntityDefinition, Action2EntityInstanceCollection, Action2EntityInstanceSuccess, Action2VoidReturnType, StorageSpaceHandlerInterface, EntityDefinitionCouple, ErrorModelStore

### Community 18 - "parseMiroirTestCliConfig.ts"
Cohesion: 0.09
Nodes (35): argv, config, env, packageRoot, result, scriptDir, vitestArgs, listMiroirTestSuiteKeys() (+27 more)

### Community 19 - "DomainElement.ts"
Cohesion: 0.08
Nodes (29): ComplexMenu, CoreTransformerForBuildPlusRuntime, Menu, MiroirMenuItem, QueryFailed, TransformerForBuildPlusRuntime_menu_addItem, ActionErrorType, Domain2ElementFailed (+21 more)

### Community 20 - "DomainController.ts"
Cohesion: 0.07
Nodes (36): CompositeRunBoxedQueryAction, CompositeRunBoxedQueryTemplateAction, ModelActionResetModel, RestPersistenceAction, TestAssertion, TestCompositeAction, TestCompositeActionSuite, TestCompositeActionTemplate (+28 more)

### Community 21 - "Model.ts"
Cohesion: 0.06
Nodes (33): ApplicationSectionOpposite(), EntityInstanceWithName, EntityInstanceWithNameSchema, ApplicationVersionCrossEntityDefinitionSchema, DeploymentUuidToReportsEntitiesDefinitions, DeploymentUuidToReportsEntitiesDefinitionsMapping, foldableElementTypes, MiroirModel (+25 more)

### Community 22 - "devDependencies"
Cohesion: 0.06
Nodes (35): @babel/plugin-syntax-import-attributes, @babel/preset-typescript, copyfiles, jest, @miroir-framework/jzod-ts, miroir-store-postgres, devDependencies, @babel/plugin-syntax-import-attributes (+27 more)

### Community 23 - "ReduxDeploymentsStateQuerySelectors.ts"
Cohesion: 0.17
Nodes (31): defaultApplicationSection, SyncBoxedExtractorOrQueryRunnerMap, SyncQueryRunner, SyncQueryRunnerExtractorAndParams, ReduxDeploymentsState, getApplicationSection(), applyExtractorTransformerInMemory(), extractEntityInstanceListWithObjectListExtractorInMemory() (+23 more)

### Community 24 - "MiroirTestTools.ts"
Cohesion: 0.12
Nodes (24): MiroirTestRunFilter, TestSuiteListFilter, isMiroirTestLeafSelected(), resolveSuiteInnerFilter(), SuiteInnerFilterResult, miroirTestLeafLabel(), miroirTestNodeLabel(), runMiroirTestSuiteWalk() (+16 more)

### Community 25 - "compilerOptions"
Cohesion: 0.06
Nodes (32): dist, jest, ../miroir-standalone-app/src/miroir-fwk/4-tests/setupMiroirTest.ts, node, ./node_modules/**, ./scripts/**/*, ./src/**/*.js, ./src/**/*.json (+24 more)

### Community 26 - "tools.ts"
Cohesion: 0.08
Nodes (29): ClientEnvironment, getLocalCacheIndexDeploymentSection(), getLocalCacheIndexDeploymentUuid(), getLocalCacheIndexEntityUuid(), AbsolutePath, alterObjectAtPath(), alterObjectAtPath2(), alterObjectAtPathWithCreate() (+21 more)

### Community 27 - "RunnerTestTools.ts"
Cohesion: 0.12
Nodes (22): MiroirTestDefinition, MiroirTestForRunner, Runner, resolveRunnerFromRegistry(), buildRunnerTestSessionParamBank(), isRunnerTestRunTargetUuid(), mergeRunnerTestParamBank(), resolveRunnerTestRunTarget() (+14 more)

### Community 28 - "DomainControllerInterface.ts"
Cohesion: 0.08
Nodes (21): ModelAction, TransactionalInstanceAction, CRUDActionName, CRUDActionNamesArray, CRUDActionNamesArrayString, CRUDActionNameSchema, CUDActionName, CUDActionNamesArray (+13 more)

### Community 29 - "PersistenceStoreController"
Cohesion: 0.18
Nodes (4): PersistenceStoreDataSectionInterface, PersistenceStoreModelSectionInterface, resolveInstanceParentUuid(), PersistenceStoreController

### Community 30 - "MiroirTestIntegrationOrchestrator.ts"
Cohesion: 0.14
Nodes (21): describeIntegrationTestSession(), DomainControllerSessionProfile, getBootstrapPhasesForDomainControllerProfile(), getBootstrapPhasesForSessionKind(), getDefaultHostModeForSessionKind(), getEmbeddedCapableForSessionKind(), getPlayfieldForDomainControllerProfile(), getPlayfieldForSessionKind() (+13 more)

### Community 31 - "MiroirTransformerTestTools.ts"
Cohesion: 0.13
Nodes (20): MiroirTestForTransformer, Action2Success, defaultSelfApplicationDeploymentMap, ignorePostgresExtraAttributes(), ignorePostgresExtraAttributesOnList(), ignorePostgresExtraAttributesOnObject(), ignorePostgresExtraAttributesOnRecord(), isJson() (+12 more)

### Community 32 - "ConfigurationService.ts"
Cohesion: 0.10
Nodes (17): StorageType, TestImplementation, TestImplementationExpect, AdminStoreFactoryRegister, PersistenceStoreAdminSectionFactory, PersistenceStoreSectionFactory, StoreSectionFactoryRegister, cacheFetchPolicy (+9 more)

### Community 33 - "dependencies"
Cohesion: 0.07
Nodes (27): chalk, diff, fast-deep-equal, fast-json-stable-stringify, json-diff, @miroir-framework/jzod, miroir-test-app_deployment-admin, miroir-test-app_deployment-miroir (+19 more)

### Community 34 - "DomainStateQuerySelectors.ts"
Cohesion: 0.14
Nodes (23): BoxedQueryTemplateWithExtractorCombinerTransformer, ExtractorOrCombinerReturningObject, Domain2Element, AsyncQueryTemplateRunnerParams, SyncBoxedExtractorRunner, SyncQueryTemplateRunnerParams, emptyDomainObject, getDomainStateExtractorRunnerMap() (+15 more)

### Community 35 - "EntityDefinition.ts"
Cohesion: 0.09
Nodes (20): entityDefinitionMLSchema(), InstanceDictionary, InstanceDictionaryNum, MetaEntity, MetaEntitySchema, UuidSchema, ActionError, ExtractorOrCombinerTemplate (+12 more)

### Community 36 - "JzodElement"
Cohesion: 0.18
Nodes (20): JzodUnionResolvedTypeForArrayReturnTypeOK, JzodUnionResolvedTypeForObjectReturnTypeOK, JzodUnionResolvedTypeReturnType, JzodUnionResolvedTypeReturnTypeError, KeyMapEntry, ResolvedJzodSchemaReturnTypeError, ResolvedJzodSchemaReturnTypeOK, SelectUnionBranchFromDiscriminatorReturnTypeError (+12 more)

### Community 37 - "Templates.ts"
Cohesion: 0.12
Nodes (22): Extractor, ExtractorOrCombiner, ExtractorOrCombinerRecord, ExtractorOrCombinerReturningObjectOrObjectList, ExtractorOrCombinerTemplateRecord, ExtractorTemplateByExtractorWrapper, ExtractorTemplateByExtractorWrapperReturningList, ExtractorTemplateByExtractorWrapperReturningObject (+14 more)

### Community 38 - "zodParseCheckMiroirTransformerDefinitions.test.ts"
Cohesion: 0.13
Nodes (19): ZodParseError, ZodParseErrorIssue, ZodParseErrorIssueInvalidUnion, zodParseErrorIssueJzodSchema, zodParseErrorJzodSchema, mergeIfUnique(), pushIfUnique(), zodErrorDeepestIssueLeaves() (+11 more)

### Community 39 - "FunctionCallTestRegistry.ts"
Cohesion: 0.17
Nodes (19): entityHasCompositePrimaryKey(), entityHasUuidPrimaryKey(), escapeKeyComponent(), getEntityPrimaryKeyAttribute(), getEntityPrimaryKeyAttributes(), getInstancePrimaryKeyValue(), instanceMatchesForeignKey(), parseCompositeKeyValue() (+11 more)

### Community 40 - "EntityInstance"
Cohesion: 0.10
Nodes (3): EntityInstance, DeploymentConfiguration, ErrorDataStore

### Community 41 - "RestClientCallReturnType"
Cohesion: 0.16
Nodes (4): RestClientCallReturnType, RestClientInterface, RestClient, RestClientStub

### Community 42 - "TestTools.ts"
Cohesion: 0.11
Nodes (17): compareFailureAttributes, displayTestSuiteResultsDetails(), ignoreFailureAttributes, log, RunTransformerTest, RunTransformerTests, RunTransformerTestSuite, testSuites() (+9 more)

### Community 43 - "schemaForDeployment.ts"
Cohesion: 0.19
Nodes (17): miroirFundamentalJzodSchema, Action, JzodLiteral, actionTypeKeyFromDomainActionBranch(), actionTypeKeyFromLiteral(), buildAppActionBranches(), buildExtendedSchema(), cacheKey() (+9 more)

### Community 44 - "QuerySelectors.ts"
Cohesion: 0.15
Nodes (17): ExtractorInstancesByEntity, getForeignKeyValue(), applyExtractorFilterAndOrderBy(), applyFilter(), applyOrderBy(), ExtractorFilter, ExtractorOrderBy, instanceMatchesFilter() (+9 more)

### Community 46 - "resolveApplyTo_legacy"
Cohesion: 0.11
Nodes (18): ansiColumnsToJzodSchema(), InformationSchemaColumn, postgresDataTypeToJzodTypeMap, handleListPickElementTransformer(), handleTransformer_ansiColumnsToJzodSchema(), handleTransformer_filterList(), handleTransformer_find(), handleTransformer_getObjectEntries() (+10 more)

### Community 47 - "package.json"
Cohesion: 0.13
Nodes (15): author, browser, os, path, description, exports, ./package.json, import (+7 more)

### Community 48 - "StorageConfiguration.ts"
Cohesion: 0.12
Nodes (15): AdminApplicationDeploymentConfiguration, AdminApplicationDeploymentConfigurationSchema, ApplicationModelLevel, ApplicationModelLevelSchema, ClientFileStorage, ClientServerDistributionModeSchema, DeploymentSide, FileStorage (+7 more)

### Community 49 - "DomainControllerInterface"
Cohesion: 0.18
Nodes (8): DomainControllerInterface, queryActionHandler(), deployMiroirPlatform(), DeployMiroirStrategy, ensureMiroirPlatform(), EnsureMiroirPlatformParams, MiroirPlatformEnsureMode, miroirPlatformExists()

### Community 50 - "transformer_extended_apply"
Cohesion: 0.14
Nodes (16): handleTransformer_boolExpr(), handleTransformer_case(), handleTransformer_concatLists(), handleTransformer_createObjectFromPairs(), handleTransformer_dataflowObject(), handleTransformer_duplicateApplicationModel(), handleTransformer_FreeObjectTemplate(), handleTransformer_getActiveDeployment() (+8 more)

### Community 51 - "JzodUnfoldSchemaOnce.ts"
Cohesion: 0.15
Nodes (13): Action2VoidSuccess, ACTION_OK, localizeJzodSchemaReferenceContext(), log, TODO: RETURN AN ERROR ResolvedJzodSchemaReturnTypeError, TODO: inheritance!!!, TODO: resolve extend clause, unfoldJzodSchemaOnce() (+5 more)

### Community 52 - "MiroirEventService.ts"
Cohesion: 0.15
Nodes (13): MiroirActivity_Action, MiroirActivity_Test, MiroirActivity_Transformer, LogLevel, ActionEvent, EventFilter, LogCounts, MiroirEvent (+5 more)

### Community 53 - "JzodToJzod_CarryOn.ts"
Cohesion: 0.20
Nodes (12): ApplyCarryOnSchemaOnLevelReturnType, applyLimitedCarryOnSchema(), applyLimitedCarryOnSchemaOnLevel(), JzodReferenceResolutionFunction, log, mergePositionBased(), normalize(), TODO: accumulate returned environment into getUniqueValues object (+4 more)

### Community 54 - "LocalCacheInterface.ts"
Cohesion: 0.16
Nodes (13): Commit, ModelActionReplayableAction, LocalCacheSliceState, LocalCacheSliceStateZone, QueriesResultsCache, ReduxStateChanges, ReduxStateWithUndoRedo, ReduxStoreWithUndoRedo (+5 more)

### Community 55 - "PersistenceStoreAdminSectionInterface"
Cohesion: 0.23
Nodes (3): StoreSectionConfiguration, PersistenceStoreAdminSectionInterface, ErrorAdminStore

### Community 57 - "inferIntegrationSessionKind.ts"
Cohesion: 0.29
Nodes (9): MiroirTestLeaf, classifyMiroirTestSuiteExecutionCapabilities(), inferIntegrationSessionKind(), miroirTestLeafRequiresIntegrationExecution(), miroirTestLeafSupportsUnitExecution(), MiroirTestSuiteExecutionCapabilities, MiroirTestSuiteUiExecutionMode, transformerTestLeafRequiresIntegration() (+1 more)

### Community 59 - "ExtractorByEntityReturningObjectListTools"
Cohesion: 0.15
Nodes (12): `applyExtractorFilterAndOrderBy(instances, extractor)`, `applyFilter(instances, filter)`, `applyOrderBy(instances, orderBy)`, ExtractorByEntityReturningObjectListTools, Filter Behavior, Filter Type Definition, Functions, `instanceMatchesFilter(instance, filter)` (+4 more)

### Community 61 - "DomainDataAccess.ts"
Cohesion: 0.21
Nodes (10): JzodPlainAttribute, EntitiesDomainState, EntitiesDomainStateEntityInstanceArraySelector, EntitiesDomainStateInstanceSelector, DomainInstanceUuidIndexToArray(), log, selectEntityInstances(), selectEntityInstancesFromJzodAttribute() (+2 more)

### Community 62 - "Datastore.ts"
Cohesion: 0.18
Nodes (10): Datastore, DatastoreGitRepo, DatastoreIndexedDb, DatastoreJSONfile, DatastoreNoSQL, DatastoreSQL, DatastoreType, datastoreTypeArray (+2 more)

### Community 63 - "Endpoint.ts"
Cohesion: 0.25
Nodes (6): EndpointDefinition, InstanceAction, EndpointInterfaceNOTUSED, coreEndpoints, coreEndpointsUuidList, log

### Community 64 - "TransformerEventServiceInterface"
Cohesion: 0.18
Nodes (4): TransformerEntry, TransformerEvent, TransformerEventFilter, TransformerEventServiceInterface

### Community 65 - "test-expect.ts"
Cohesion: 0.20
Nodes (7): describe, DescribeEachFunction, expect, ExpectResult, formatMessage(), Test, TestFramework

### Community 66 - "files"
Cohesion: 0.20
Nodes (9): files, dist/index.cjs, dist/index.cjs.map, dist/index.d.cts, dist/index.d.ts, dist/index.js, dist/index.js.map, dist/src/worker.js (+1 more)

### Community 67 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, copy-files, devBuild, generate-ts-types, test, testByFile, testByFileBailOut (+2 more)

### Community 68 - "MiroirConfigClient"
Cohesion: 0.42
Nodes (5): MiroirConfigClient, MiroirConfigServer, MiroirContextInterface, MiroirContextServiceInterface, MiroirContext

### Community 69 - "PersistenceStoreEntitySectionAbstractInterface"
Cohesion: 0.20
Nodes (3): ModelActionAlterEntityAttribute, ModelActionRenameEntity, PersistenceStoreEntitySectionAbstractInterface

### Community 70 - "Transformer_tools.ts"
Cohesion: 0.31
Nodes (6): TransformerDefinition, substituteTransformerReferencesInJzodElement(), transformerInterfaceFromDefinition(), transformerDefinition, buildReferenceMap, runtimeReferenceMap

### Community 71 - "ReduxDeploymentsStateInterface.ts"
Cohesion: 0.20
Nodes (9): jzodDictionarySchema, jzodEntityIdSchema, jzodEntityStateSchema, jzodReduxDeploymentState, MiroirDictionary, zDictionarySchema, zEntityIdSchema, ZEntityState (+1 more)

### Community 72 - "tools.ts"
Cohesion: 0.31
Nodes (7): base64ToBlob(), BlobValidationResult, fileToBase64(), formatFileSize(), formatYYYYMMDD_HHMMSS(), getBlobFileIcon(), validateMimeType()

### Community 75 - "TestInterface.ts"
Cohesion: 0.25
Nodes (7): innerTestSuitesResults, testAssertionResult, testAssertionsResults, testResult, testsResults, testSuiteResult, testSuitesResults

### Community 76 - "getDefaultValueForJzodSchema.ts"
Cohesion: 0.29
Nodes (7): log, NOTE: The main functions have been moved to TransformersForRuntime.ts to avoid c, NOTE: removed circular dependency import of transformer_extended_apply_wrapper, ResolveConditionalSchemaError, ResolveConditionalSchemaResult, defaultValueForMLSchemaTransformer(), getDefaultValueForJzodSchemaWithResolutionNonHook()

### Community 77 - "transformer_InnerReference_resolve"
Cohesion: 0.25
Nodes (8): handleTransformer_generateUuid(), handleTransformer_getFromContext(), handleTransformer_getFromParameters(), transformer_dynamicObjectAccess_apply(), transformer_InnerReference_resolve(), transformer_mustacheStringTemplate_apply(), transformer_resolveReference(), safeResolvePathOnObject()

### Community 78 - "ViewParams.ts"
Cohesion: 0.43
Nodes (5): JzodEnum, AppTheme, GridType, ToolsPageState, ViewParamsData

### Community 79 - "MlSchema"
Cohesion: 0.53
Nodes (5): MlSchema, buildBase(), jzodToJzod_Summary(), minimalSummary(), stripTagValue()

### Community 80 - "handleCountTransformer"
Cohesion: 0.40
Nodes (6): accumulateAggValue(), finalizeAggValue(), handleCountTransformer(), initAggValue(), initAggValueForEmpty(), isNullOrAllNull()

## Knowledge Gaps
- **616 isolated node(s):** `name`, `private`, `version`, `description`, `author` (+611 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MiroirActivityTrackerInterface` connect `MiroirActivityTrackerInterface` to `index.ts`, `TransformersForRuntime.ts`, `MiroirConfigClient`, `MiroirEventServiceInterface`, `TestTools.ts`, `QueryRunnerTestTools.ts`, `MiroirActivityTracker`, `DomainElement.ts`, `MiroirEventService.ts`, `MiroirTestTools.ts`, `MiroirLogger`, `RunnerTestTools.ts`, `MiroirEventService`, `MiroirTransformerTestTools.ts`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`, `miroir-test-app_deployment-library`, `sequelize`, `tinyrainbow`, `tsx`, `@types/json-diff`, `vitest`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `Action2VoidReturnType` connect `Action2VoidReturnType` to `index.ts`, `PersistenceStoreEntitySectionAbstractInterface`, `Uuid`, `ApplicationDeploymentMap`, `EntityInstance`, `PersistenceStoreAbstractSectionInterface`, `PersistenceStoreControllerInterface.ts`, `DomainElement.ts`, `DomainController.ts`, `PersistenceStoreAdminSectionInterface`, `DomainControllerInterface.ts`, `PersistenceStoreController`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _616 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `miroirFundamentalType.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.00641025641025641 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.01910310256062864 - nodes in this community are weakly interconnected._
- **Should `TransformersForRuntime.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.031746031746031744 - nodes in this community are weakly interconnected._
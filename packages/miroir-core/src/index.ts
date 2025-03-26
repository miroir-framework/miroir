export {
  miroirFundamentalJzodSchemaUuid,
  getMiroirFundamentalJzodSchema,
} from "../src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema"

console.log("miroir-core: loading miroirFundamentalType.js");
export {
  ActionError,
  ActionEntityInstanceReturnType,
  ActionEntityInstanceSuccess,
  ActionEntityInstanceCollectionReturnType,
  ActionEntityInstanceCollectionSuccess,
  ActionVoidSuccess,
  ActionSuccess,
  ActionReturnType,
  ActionTransformer,
  SelfApplication,
  ApplicationVersion,
  // ApplicationSection,
  Commit,
  // CompositeInstanceActionTemplate,
  // compositeInstanceActionTemplate,
  DomainAction,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  QueryByEntityUuidGetEntityDefinition,
  QueryByQuery2GetParamJzodSchema,
  QueryByTemplateGetParamJzodSchema,
  QueryByQueryGetParamJzodSchema,
  QueryByQueryTemplateGetParamJzodSchema,
  QueryJzodSchemaParams,
  DomainModelQueryTemplateJzodSchemaParams,
  MiroirQueryTemplate,
  // ===
  ExtractorWrapper,
  ExtractorWrapperReturningList,
  ExtractorWrapperReturningObject,
  LocalCacheExtractor,
  MiroirQuery,
  // ===
  ConceptLevel,
  StoreManagementAction,
  Entity,
  EntityArrayAttribute,
  EntityAttribute,
  EntityForeignKeyAttribute,
  EntityAttributePartial,
  EntityAttributeCore,
  EntityAttributeExpandedType,
  EntityAttributeType,
  EntityAttributeUntypedCore,
  MetaModel,
  InstanceAction,
  DeploymentStorageConfig,
  CompositeAction,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  EntityInstanceCollection,
  DomainElementType,
  JzodSchema,
  JzodArray,
  JzodPlainAttribute,
  JzodAttributeDateValidations,
  JzodAttributePlainDateWithValidations,
  JzodAttributeNumberValidations,
  JzodAttributePlainNumberWithValidations,
  JzodAttributeStringValidations,
  JzodAttributePlainStringWithValidations,
  JzodBaseObject,
  JzodElement,
  JzodEnum,
  JzodEnumAttributeTypes,
  JzodEnumElementTypes,
  JzodFunction,
  JzodIntersection,
  JzodLazy,
  JzodLiteral,
  JzodMap,
  JzodObject,
  JzodObjectOrReference,
  JzodPromise,
  JzodRecord,
  JzodReference,
  JzodSet,
  JzodTuple,
  JzodUnion,
  LocalCacheAction,
  StoreOrBundleAction,
  Menu,
  MiroirMenuItem,
  MiroirConfigForClientStub,
  MiroirConfigForRestClient,
  MiroirConfigClient,
  MiroirConfigServer,
  MiroirConfig,
  // MiroirCustomQueryParams,
  // miroirCustomQueryParams,
  MiroirFundamentalType,
  MiroirAllFundamentalTypesUnion,
  ExtendedTransformerForRuntime,
  ExtractorOrCombinerRecord,
  ExtractorOrCombinerTemplate,
  ExtractorOrCombinerTemplateRecord,
  ModelAction,
  ModelActionReplayableAction,
  ModelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  ModelActionCreateEntity,
  ModelActionDropEntity,
  Transformer_InnerReference,
  TransformerForBuild,
  ActionHandler,
  PersistenceAction,
  RestPersistenceAction,
  ExtractorOrCombinerReturningObject,
  ExtractorOrCombinerReturningObjectList,
  ExtractorForObjectByDirectReference,
  Extractor,
  RunBoxedExtractorAction,
  RunBoxedQueryAction,
  RunBoxedExtractorOrQueryAction,
  RunBoxedExtractorTemplateAction,
  RunBoxedQueryTemplateAction,
  ExtractorTemplateReturningObject,
  ExtractorTemplateReturningObjectList,
  // ExtractorTemplateReturningObjectOrObjectList,
  // extractorTemplateReturningObjectOrObjectList,
  RunBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  ServerConfigForClientConfig,
  SqlDbStoreSectionConfiguration,
  IndexedDbStoreSectionConfiguration,
  FilesystemDbStoreSectionConfiguration,
  SelfApplicationDeploymentConfiguration,
  StoreBasedConfiguration,
  StoreSectionConfiguration,
  StoreUnitConfiguration,
  TransactionalInstanceAction,
  UndoRedoAction,
  GridReportSection,
  ListReportSection,
  ObjectInstanceReportSection,
  ObjectListReportSection,
  QueryFailed,
  Report,
  ReportSection,
  Test,
  DomainElementEntityInstance,
  DomainElementEntityInstanceCollectionOrFailed,
  DomainElementEntityInstanceOrFailed,
  DomainElementFailed,
  DomainElementInstanceArrayOrFailed,
  DomainElementObject,
  DomainElementSuccess,
  DomainElementVoid,
  DomainElement,
  RootReport,
  BoxedExtractorOrCombinerReturningObject,
  BoxedExtractorOrCombinerReturningObjectList,
  BoxedExtractorOrCombinerReturningObjectOrObjectList,
  BoxedExtractorTemplateReturningObject,
  BoxedExtractorTemplateReturningObjectList,
  BoxedExtractorTemplateReturningObjectOrObjectList,
  ExtractorTemplateByExtractorWrapper,
  ExtractorTemplateByExtractorWrapperReturningList,
  ExtractorTemplateByExtractorWrapperReturningObject,
  // TransformerForRuntime_constants,
  TransformerForRuntime_InnerReference,
  TransformerForRuntime_object_fullTemplate,
  TransformerForRuntime_freeObjectTemplate,
  TransformerForRuntime_object_alter,
  TransformerForRuntime_count,
  TransformerForRuntime_list_listPickElement,
  TransformerForRuntime_list_listMapperToList,
  TransformerForRuntime_mapper_listToObject,
  TransformerForRuntime_mustacheStringTemplate,
  TransformerForRuntime_objectValues,
  TransformerForRuntime_objectEntries,
  TransformerForRuntime_object_listReducerToSpreadObject,
  TransformerForRuntime_unique,
  TransformerForRuntime_innerFullObjectTemplate,
  TransformerForRuntime,
  TransformerForBuildOrRuntime,
  Transformer_menu_addItem,
  CarryOnObject,
  CompositeActionTemplate,
  CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration,
  CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction,
  ExtractorOrCombiner,
  TestAction_runTestCompositeAction,
  TestCompositeAction,
  TestCompositeActionSuite,
  TestCompositeActionTemplateSuite,
  TestCompositeActionTemplate,
  DomainElementInstanceUuidIndex,
} from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType"
console.log("miroir-core: loading miroirFundamentalType.js DONE");
export {
  ApplicationSection,
  applicationSection,
  // ExtendedTypes,
  // extendedTypes,
  ExtractorOrCombinerRoot,
  extractorOrCombinerRoot,
  ExtractorTemplateRoot,
  extractorTemplateRoot,
  ShippingBox,
  shippingBox,
  TransformerForBuild_objectEntries_root,
  transformerForBuild_objectEntries_root,
  TransformerForBuild_objectValues_root,
  transformerForBuild_objectValues_root,
  TransformerForBuild_object_fullTemplate_root,
  transformerForBuild_object_fullTemplate_root,
  TransformerForBuild_object_listPickElement_root,
  transformerForBuild_object_listPickElement_root,
  TransformerForBuild_object_listReducerToIndexObject_root,
  transformerForBuild_object_listReducerToIndexObject_root,
  TransformerForBuild_unique_root,
  transformerForBuild_unique_root,
  TransformerForRuntime_Abstract,
  transformerForRuntime_Abstract,
  TransformerForRuntime_orderedTransformer,
  transformerForRuntime_orderedTransformer,
  // Transformer_InnerReference,
  transformer_InnerReference,
  Transformer_constant,
  transformer_constant,
  Transformer_constantListAsExtractor,
  transformer_constantListAsExtractor,
  Transformer_constantObject,
  transformer_constantObject,
  Transformer_constantString,
  transformer_constantString,
  Transformer_constantUuid,
  transformer_constantUuid,
  transformer_contextOrParameterReferenceTO_REMOVE,
  TransformerForRuntime_contextReference,
  transformerForRuntime_contextReference,
  Transformer_extractors,
  transformer_extractors,
  Transformer_label,
  transformer_label,
  Transformer_mustacheStringTemplate,
  transformer_mustacheStringTemplate,
  Transformer_newUuid,
  transformer_newUuid,
  Transformer_objectDynamicAccess,
  transformer_objectDynamicAccess,
  Transformer_orderBy,
  transformer_orderBy,
  Transformer_parameterReference,
  transformer_parameterReference,
} from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType"
export {
  actionError,
  actionEntityInstanceReturnType,
  actionEntityInstanceSuccess,
  actionEntityInstanceCollectionReturnType,
  actionEntityInstanceCollectionSuccess,
  actionVoidReturnType,
  actionVoidSuccess,
  actionSuccess,
  actionReturnType,
  actionTransformer,
  selfApplication,
  applicationVersion,
  // applicationSection,
  boxedQueryTemplateWithExtractorCombinerTransformer,
  boxedQueryWithExtractorCombinerTransformer,
  queryByEntityUuidGetEntityDefinition,
  queryByQuery2GetParamJzodSchema,
  queryByTemplateGetParamJzodSchema,
  queryByQueryGetParamJzodSchema,
  queryByQueryTemplateGetParamJzodSchema,
  queryJzodSchemaParams,
  domainModelQueryTemplateJzodSchemaParams,
  miroirQueryTemplate,
  // ===
  extractorWrapper,
  extractorWrapperReturningList,
  extractorWrapperReturningObject,
  miroirQuery,
  // ===
  storeManagementAction,
  entity,
  entityArrayAttribute,
  entityAttribute,
  entityForeignKeyAttribute,
  entityAttributePartial,
  entityAttributeCore,
  entityAttributeExpandedType,
  entityAttributeType,
  entityAttributeUntypedCore,
  metaModel,
  deploymentStorageConfig,
  compositeAction,
  entityDefinition,
  entityInstance,
  entityInstancesUuidIndex,
  entityInstanceCollection,
  domainElementType,
  jzodSchema,
  jzodArray,
  jzodPlainAttribute,
  jzodAttributeDateValidations,
  jzodAttributePlainDateWithValidations,
  jzodAttributeNumberValidations,
  jzodAttributePlainNumberWithValidations,
  jzodAttributeStringValidations,
  jzodAttributePlainStringWithValidations,
  jzodBaseObject,
  jzodElement,
  jzodEnum,
  jzodEnumAttributeTypes,
  jzodEnumElementTypes,
  jzodFunction,
  jzodIntersection,
  jzodLazy,
  jzodLiteral,
  jzodMap,
  jzodObject,
  jzodObjectOrReference,
  jzodPromise,
  jzodRecord,
  jzodReference,
  jzodSet,
  jzodTuple,
  jzodUnion,
  menu,
  miroirMenuItem,
  miroirConfigForClientStub,
  miroirConfigForRestClient,
  extractorOrCombinerTemplate,
  extractorOrCombinerTemplateRecord,
  modelAction,
  modelActionReplayableAction,
  modelActionAlterEntityAttribute,
  modelActionRenameEntity,
  modelActionCreateEntity,
  modelActionDropEntity,
  // transformer_InnerReference,
  transformerForBuild,
  actionHandler,
  extractorOrCombinerReturningObject,
  extractorOrCombinerReturningObjectList,
  extractorForObjectByDirectReference,
  extractor,
  runBoxedExtractorAction,
  runBoxedQueryAction,
  runBoxedExtractorOrQueryAction,
  runBoxedExtractorTemplateAction,
  runBoxedQueryTemplateAction,
  extractorTemplateReturningObject,
  extractorTemplateReturningObjectList,
  runBoxedQueryTemplateOrBoxedExtractorTemplateAction,
  serverConfigForClientConfig,
  selfApplicationDeploymentConfiguration,
  storeBasedConfiguration,
  storeSectionConfiguration,
  storeUnitConfiguration,
  transactionalInstanceAction,
  undoRedoAction,
  gridReportSection,
  listReportSection,
  objectInstanceReportSection,
  objectListReportSection,
  report,
  reportSection,
  test,
  domainElementInstanceUuidIndexOrFailed,
  domainElementEntityInstance,
  domainElementEntityInstanceCollectionOrFailed,
  domainElementEntityInstanceOrFailed, 
  domainElementFailed,
  domainElementInstanceArrayOrFailed,
  domainElementObject,
  domainElementObjectOrFailed,
  domainElementSuccess,
  domainElementVoid,
  domainElement,
  rootReport,
  boxedExtractorOrCombinerReturningObject,
  boxedExtractorOrCombinerReturningObjectList,
  boxedExtractorOrCombinerReturningObjectOrObjectList,
  boxedExtractorTemplateReturningObject,
  boxedExtractorTemplateReturningObjectList,
  boxedExtractorTemplateReturningObjectOrObjectList,
  transformerForBuild_unique,
  extractorTemplateByExtractorWrapper,
  extractorTemplateByExtractorWrapperReturningList,
  extractorTemplateByExtractorWrapperReturningObject,
  transformerForRuntime_innerFullObjectTemplate,
  transformerForRuntime,
  transformerForBuildOrRuntime,
  transformer_menu_addItem,
  carryOnObject,
  compositeActionTemplate,
  carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_storeUnitConfiguration,
  carryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_domainAction,
  extractorOrCombiner,
  testAction_runTestCompositeAction,
  testCompositeAction,
  testCompositeActionSuite,
  testCompositeActionTemplateSuite,
  testCompositeActionTemplate,
} from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType"

export {
  InstanceDictionaryNum,
  InstanceDictionary,
  MetaEntitySchema,
  MetaEntity,
  UuidSchema,
  Uuid,
} from './0_interfaces/1_core/EntityDefinition.js';
export {
  ApplicationSectionOpposite,
  EntityInstanceWithNameSchema,
  EntityInstanceWithName,
} from './0_interfaces/1_core/Instance.js';
export {
  HttpMethod,
  HttpMethodsArray,
  HttpMethodsObject,
} from './0_interfaces/1_core/Http.js';
export {
  JzodSchemaDefinition,
  jzodSchemaDefinitionSchema,
} from './0_interfaces/1_core/JzodSchemaDefinition.js';
export {
  DeploymentMode,
  // StoreBasedConfigurationSchema,
  // StoreBasedConfiguration,
} from './0_interfaces/1_core/MiroirConfig.js';
export {
  DeploymentUuidToReportsEntitiesDefinitionsMapping
} from './0_interfaces/1_core/Model.js';
export {
  ClientFileStorage,
  // SelfApplicationDeploymentConfigurationSchema,
  // SelfApplicationDeploymentConfiguration,
  AdminApplicationDeploymentConfiguration,
  ApplicationModelLevelSchema,
  ApplicationModelLevel,
  DeploymentSide,
  FileStorage,
  ModelStorageLocationSchema,
  ModelStorageLocation,
  ServerFileStorage,
  ServerSqlStorage,
  ServerStorageLocation,
  StorageLocation,
  StorageTypeSchema,
  ClientServerDistributionModeSchema,
} from './0_interfaces/1_core/StorageConfiguration.js';
export {
  TestImplementationExpect,
  TestImplementation,
} from './0_interfaces/1_core/TestImplementation.js';
export {
  EntityDefinitionEntityDefinition,
  EntityDefinitionEntityDefinitionAttribute,
  EntityDefinitionEntityDefinitionAttributeNew, 
  entityDefinitionEntityDefinitionAttributeNewSchema,
  entityDefinitionEntityDefinitionAttributeSchema,
  entityDefinitionEntityDefinitionSchema
} from './0_interfaces/1_core/writtenByHandSchema.js';
export {
  LocalCacheInfo,
  CRUDActionNameSchema,
  CRUDActionName,
  CRUDActionNamesArray,
  CRUDActionNamesArrayString,
  DeploymentSectionDomainState,
  DomainState,
  DomainStateMetaModelSelector,
  EntityInstancesUuidIndexEntityInstanceArraySelector,
  DomainControllerInterface,
  EntitiesDomainState,
  EntitiesDomainStateInstanceSelector,
  EntitiesDomainStateReducer,
  EntitiesDomainStateEntityInstanceArraySelector,
  EntitiesDomainStateTransformer,
  CUDActionNameSchema,
  CUDActionName,
  CUDActionNamesArray,
} from './0_interfaces/2_domain/DomainControllerInterface.js';
export {
  Action2EntityInstanceCollection,
  Action2EntityInstanceCollectionOrFailure,
  Action2EntityInstanceReturnType,
  Action2EntityInstanceSuccess,
  Action2Success,
  Action2VoidReturnType,
  Action2VoidSuccess,
  Action2Error,
  Action2ReturnType,
  Domain2Element,
  Domain2QueryReturnType,
  Domain2ElementFailed,
  domain2ElementObjectZodSchema
} from './0_interfaces/2_domain/DomainElement.js';
export {
  RecordOfJzodElement,
  RecordOfJzodObject,
} from './0_interfaces/2_domain/DomainStateQuerySelectorInterface.js';
export {
  JzodSchemaQueryTemplateSelector,
  ExtractorTemplatePersistenceStoreRunner,
  QueryTemplateRunnerMapForJzodSchema,
  ExtractorTemplateRunnerParamsForJzodSchema,
  AsyncExtractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  AsyncBoxedExtractorRunner,
  AsyncBoxedExtractorRunnerParams,
  SyncBoxedExtractorRunner,
  SyncBoxedExtractorRunnerParams,
  SyncBoxedExtractorTemplateRunner,
  SyncBoxedExtractorTemplateRunnerParams,
  SyncExtractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
  SyncQueryRunnerParams,
  SyncQueryRunner,
  SyncQueryTemplateRunner,
  SyncQueryTemplateRunnerParams,
  ExtractorOrQueryPersistenceStoreRunner,
  JzodSchemaQuerySelector,
  QueryRunnerMapForJzodSchema,
  ExtractorRunnerParamsForJzodSchema,
  AsyncBoxedExtractorOrQueryRunnerMap,
  AsyncQueryRunner,
  AsyncQueryRunnerParams,
  AsyncQueryTemplateRunner,
  AsyncQueryTemplateRunnerParams,
  AsyncBoxedExtractorTemplateRunner,
  AsyncBoxedExtractorTemplateRunnerParams,
  SyncBoxedExtractorOrQueryRunnerMap,
  ExtractorOrQueryRunnerMap,
  BoxedExtractorTemplateRunner,
} from './0_interfaces/2_domain/ExtractorRunnerInterface.js';
export {
  ZEntityState,
  ZEntityStateSchema,
  DeploymentEntityState,
} from './0_interfaces/2_domain/DeploymentStateInterface.js';
export {
  DataStoreApplicationTypeSchema,
  DataStoreApplicationType,
} from './0_interfaces/3_controllers/ApplicationControllerInterface.js';
export {
  EndpointInterface
} from './0_interfaces/3_controllers/EndpointInterface.js';
export {
  ErrorLogServiceInterface, MError
} from './0_interfaces/3_controllers/ErrorLogServiceInterface.js';
export {
  MiroirContextInterface
} from './0_interfaces/3_controllers/MiroirContextInterface.js';
export {
  LoggerFactoryInterface,
  LoggerFactoryAsyncInterface,
  LoggerInterface,
  LogLevelOptions,
  defaultLevels,
  SpecificLoggerOptionsMap,
  LoggerOptions,
} from "./0_interfaces/4-services/LoggerInterface";
export {
  PersistenceStoreControllerManagerInterface
} from "./0_interfaces/4-services/PersistenceStoreControllerManagerInterface";
export {
  LocalCacheInterface,
} from './0_interfaces/4-services/LocalCacheInterface.js';
export {
  HttpRequestBodyFormat,
  HttpResponseBodyFormat,
  PersistenceStoreLocalOrRemoteInterface,
  RemoteStoreActionReturnType,
  RestPersistenceClientAndRestClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
  RestMethodHandler,
  RestServiceHandler,
  StoreInterface,
} from "./0_interfaces/4-services/PersistenceInterface";
export {
  AdminStoreFactoryRegister,
  InitApplicationParameters,
  PersistenceStoreAbstractInterface,
  PersistenceStoreAbstractSectionInterface,
  PersistenceStoreAdminSectionInterface,
  PersistenceStoreAdminSectionFactory,
  PersistenceStoreDataSectionInterface,
  PersistenceStoreModelSectionInterface,
  PersistenceStoreEntitySectionAbstractInterface,
  PersistenceStoreInstanceSectionAbstractInterface,
  StorageSpaceHandlerInterface,
  PersistenceStoreDataOrModelSectionInterface,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerAction,
  PersistenceStoreSectionFactory,
  StoreSectionFactoryRegister,
} from "./0_interfaces/4-services/PersistenceStoreControllerInterface";
export {
  TestResult,
  TestSuiteResult,
} from "./0_interfaces/4-services/TestInterface";
export {
  getApplicationSection
} from './1_core/AdminApplication.js';
export { } from "./1_core/Report";
export { ACTION_OK } from './1_core/constants.js';
export { DomainInstanceUuidIndexToArray } from './1_core/DomainState.js';
export {
  getDefaultValueForJzodSchema,
  getDefaultValueForJzodSchemaWithResolution,
} from './1_core/jzod/getDefaultValueForJzodSchema.js';
export {
  // getReportSectionTargetEntityUuid,
  resolveJzodSchemaReference,
  resolveReferencesForJzodSchemaAndValueObject,
  resolveJzodSchemaReferenceInContext,
  ResolvedJzodSchemaReturnType,
  ResolvedJzodSchemaReturnTypeError,
  ResolvedJzodSchemaReturnTypeOK,
} from './1_core/jzod/JzodUnfoldSchemaForValue.js';
export {
  unfoldJzodSchemaOnce
} from './1_core/jzod/JzodUnfoldSchemaOnce.js';
export {
  alterObjectAtPath,
  deleteObjectAtPath,
} from './1_core/alterObjectAtPath.js';
export {
  applicationModelEntities,
  defaultMiroirMetaModel,
  // getCurrentEntityDefinition,
  getReportsAndEntitiesDefinitionsForDeploymentUuid,
  metaModelEntities,
  miroirModelEntities,
} from './1_core/Model.js';
export {
  // getReportSectionTargetEntityUuid,
} from './1_core/Report.js';
export {
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
} from './2_domain/Deployment.js';
export {
  extractEntityJzodSchemaFromDeploymentEntityState,
  selectEntityInstanceFromDeploymentEntityState,
  selectEntityInstanceUuidIndexFromDeploymentEntityState,
  selectEntityInstanceListFromDeploymentEntityState,
  getDeploymentEntityStateJzodSchemaSelectorMap,
  getDeploymentEntityStateSelectorMap,
  GetQueryRunnerParamsForDeploymentEntityState,
  getQueryRunnerParamsForDeploymentEntityState,
  runQueryFromDeploymentEntityState,
  GetExtractorRunnerParamsForDeploymentEntityState,
  getExtractorRunnerParamsForDeploymentEntityState
} from './2_domain/DeploymentEntityStateQuerySelectors.js';
export {
  getDeploymentEntityStateJzodSchemaSelectorTemplateMap,
  getDeploymentEntityStateSelectorTemplateMap,
  getExtractorTemplateRunnerParamsForDeploymentEntityState,
  GetExtractorTemplateRunnerParamsForDeploymentEntityState,
  getQueryTemplateRunnerParamsForDeploymentEntityState,
  GetQueryTemplateRunnerParamsForDeploymentEntityState,
  runQueryTemplateFromDeploymentEntityState,
} from './2_domain/DeploymentEntityStateQueryTemplateSelectors.js';
export {
  selectEntityInstances,
  selectEntityInstancesFromJzodAttribute,
  selectEntityUuidFromJzodAttribute,
  selectCurrentDeploymentModel,
  selectReportDefinitionFromReportUuid,
} from './2_domain/DomainDataAccess.js';
export {
  dummyDomainManyQueryWithDeploymentUuid,
  dummyDomainManyQueryTemplateWithDeploymentUuid,
  dummyDomainModelGetFetchParamJzodSchemaQueryParams,
  getDomainStateJzodSchemaExtractorRunnerMap,
  getDomainStateExtractorRunnerMap,
  getExtractorRunnerParamsForDomainState,
  GetQueryRunnerParamsForDomainState,
  getQueryRunnerParamsForDomainState,
  GetExtractorRunnerParamsForDomainState,
  extractWithExtractorOrCombinerReturningObjectOrObjectListFromDomainState,
  innerSelectElementFromQueryAndDomainState,
  selectJzodSchemaByDomainModelQueryFromDomainStateNew,
  selectEntityJzodSchemaFromDomainStateNew,
  selectEntityInstanceUuidIndexFromDomainState,
  selectEntityInstanceListFromDomainState,
  selectEntityInstanceFromObjectQueryAndDomainState,
  extractEntityInstanceUuidIndexFromListQueryAndDomainState,
  extractEntityInstanceListFromListQueryAndDomainState,
  selectFetchQueryJzodSchemaFromDomainStateNew,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNew,
  runQueryFromDomainState,
} from './2_domain/DomainStateQuerySelectors.js';
export {
  getSelectorMapForTemplate,
  runQueryTemplateFromDomainState,
  selectJzodSchemaBySingleSelectQueryFromDomainStateNewForTemplate,
  selectFetchQueryJzodSchemaFromDomainStateNewForTemplate,
  selectJzodSchemaByDomainModelQueryFromDomainStateNewForTemplate,
  selectEntityJzodSchemaFromDomainStateNewForTemplate,
  getQueryTemplateRunnerParamsForDomainState,
  GetSelectorParamsForQueryTemplateOnDomainStateType,
  getExtractorTemplateRunnerParamsForDomainState,
  ExtractorTemplateRunnerForDomainState,
  GetSelectorParamsForExtractorTemplateOnDomainStateType,
  QueryTemplateRunnerForDomainState,
  extractorTemplateRunnerForDomainState,
  queryTemplateRunnerForDomainState,
} from './2_domain/DomainStateQueryTemplateSelector.js';
export {
  ExtractorTemplateRunnerInMemory
} from './2_domain/ExtractorTemplateRunnerInMemory.js';
export {
  ExtractorRunnerInMemory
} from './2_domain/ExtractorRunnerInMemory.js';
export {
  handleBoxedExtractorTemplateOrQueryTemplateAction,
  handleBoxedExtractorTemplateAction,
  handleQueryTemplateAction,
  runQueryTemplateWithExtractorCombinerTransformer,
  extractWithBoxedExtractorTemplate,
  extractFetchQueryTemplateJzodSchema,
  extractJzodSchemaForDomainModelQueryTemplate,
} from './2_domain/QueryTemplateSelectors.js';
export {
  domainElementToPlainObjectDEFUNCT,
  plainObjectToDomainElementDEFUNCT,
  extractEntityInstanceUuidIndexWithObjectListExtractorInMemory,
  extractEntityInstanceListWithObjectListExtractorInMemory,
  extractFetchQueryJzodSchema,
  extractJzodSchemaForDomainModelQuery,
  extractzodSchemaForSingleSelectQuery,
  runQuery,
  extractWithBoxedExtractorOrCombinerReturningObjectOrObjectList,
} from './2_domain/QuerySelectors.js';
export {
  asyncApplyExtractorTransformerInMemory,
  asyncExtractEntityInstanceUuidIndexWithObjectListExtractor,
  asyncExtractEntityInstanceListWithObjectListExtractor,
  asyncExtractWithExtractor,
  asyncRunQuery,
  asyncInnerSelectElementFromQuery,
} from './2_domain/AsyncQuerySelectors.js';
export{
  getLocalCacheIndexDeploymentSection,
  getLocalCacheIndexDeploymentUuid,
  getLocalCacheIndexEntityUuid,
  getDeploymentEntityStateIndex,
} from './2_domain/DeploymentEntityState.js';
export {
  ModelEntityActionTransformer
} from './2_domain/ModelEntityActionTransformer.js';
export { 
  transformer_spreadSheetToJzodSchema
} from "./2_domain/Spreadsheet";
export { 
  applicationTransformerDefinitions,
  ActionTemplate,
  resolveApplyTo_legacy,
  transformer_resolveReference,
  transformer_apply,
  transformer_extended_apply,
  transformer_InnerReference_resolve,
  transformer_mustacheStringTemplate_apply,
} from "./2_domain/TransformersForRuntime";
export {
  resolveExtractorTemplate,
  resolveQueryTemplateWithExtractorCombinerTransformer,
  resolveQueryTemplateSelectExtractorWrapper,
  resolveExtractorTemplateForExtractorOrCombinerReturningObjectOrObjectList,
  resolveExtractorOrQueryTemplate,
} from "./2_domain/Templates";
export {
  cacheFetchPolicy,
  cacheInvalidationPolicy,
  ConfigurationService,
  PackageConfiguration,
  undoRedoHistorization,
} from "./3_controllers/ConfigurationService";
export {
  resetAndInitApplicationDeployment,
  DeploymentConfiguration,
  DomainController,
} from "./3_controllers/DomainController";
export {
  Endpoint
} from './3_controllers/Endpoint.js';
export {
  ErrorAdminStore
} from './3_controllers/ErrorHandling/ErrorAdminStore.js';
export {
  ErrorDataStore
} from './3_controllers/ErrorHandling/ErrorDataStore.js';
export {
  ErrorModelStore
} from './3_controllers/ErrorHandling/ErrorModelStore.js';
export {
  storeActionOrBundleActionStoreRunner,
  modelActionStoreRunnerNotUsed,
} from './3_controllers/ActionRunner.js';
export {
  modelInitialize,
} from './3_controllers/ModelInitializer.js';
export { ErrorLogService } from './3_controllers/ErrorHandling/ErrorLogService.js';
export { CallUtils } from './3_controllers/ErrorHandling/CallUtils.js';
export { MiroirContext } from './3_controllers/MiroirContext.js';
export {
  MiroirLoggerFactory,
  testLogger,
} from './4_services/LoggerFactory.js';
export {
  PersistenceStoreController,
  PersistenceStoreControllerFactoryReturnType,
} from './4_services/PersistenceStoreController.js';
export {
  RestClient
} from './4_services/RestClient.js';
export {
  RestClientStub
} from './4_services/RestClientStub';
export {
  restServerDefaultHandlers
} from './4_services/RestServer.js';
export {
  // createPersistenceStoreControllers,
  startLocalPersistenceStoreControllers,
} from './4_services/PersistenceStoreControllerTools.js';
export {
  PersistenceStoreControllerManager
} from './4_services/PersistenceStoreControllerManager.js';
export {
  generateRestServiceResponse,
} from './4_services/RestTools.js';
export {
  TestSuiteContext
} from './4_services/TestSuiteContext.js';

export {
  displayTestSuiteResults,
  displayTestSuiteResultsDetails,
  ignorePostgresExtraAttributesOnList,
  ignorePostgresExtraAttributesOnObject,
  ignorePostgresExtraAttributesOnRecord,
  ignorePostgresExtraAttributes,
} from './4_services/otherTools.js';
export { miroirCoreStartup } from './startup.js';
export {
  stringTuple,
  circularReplacer,
  safeResolvePathOnObject,
  resolvePathOnObject,
  ResultAccessPath,
  domainStateToDeploymentEntityState,
} from "./tools";

console.log("miroir-core: DONE exports");

console.log("miroir-core: loading MIROIR json files");
const entityAdminApplication = require("../src/assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/25d935e7-9e93-42c2-aade-0472b883492b.json") //assert { type: "json" };
const entityEndpointVersion = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3d8da4d4-8f76-4bb4-9212-14869d81c00c.json');
const entityEntity = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json');
const entityEntityDefinition = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json');
const entityJzodSchema = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/5e81e1b9-38be-487c-b3e5-53796c57fccf.json');
const entityMenu = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/dde4c883-ae6d-47c3-b6df-26bc6e3c1842.json');
const entityReport = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json');
const entitySelfApplication = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json');
const entitySelfApplicationDeploymentConfiguration = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/35c5608a-7678-4f07-a4ec-76fc5bc35424.json');
const entitySelfApplicationVersion = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json');
const entitySelfApplicationModelBranch = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/cdb0aec6-b848-43ac-a058-fe2dbe5811f1.json');
const entityStoreBasedConfiguration = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json');
const entityQueryVersion = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e4320b9e-ab45-4abe-85d8-359604b3c62f.json');
const entityTest = require('./assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c37625c7-0b35-4d6a-811d-8181eb978301.json');

const entityDefinitionAdminApplication = require("../src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/3fb6203e-f639-4b2a-afe1-e1fb45d6b2ea.json");
const entityDefinitionEndpoint = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json');
const entityDefinitionEntity = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json');
const entityDefinitionEntityDefinition = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json');
const entityDefinitionMenu = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json');
const entityDefinitionJzodSchema = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json');
const entityDefinitionQuery = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json');
const entityDefinitionReport = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json');
const entityDefinitionSelfApplication = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json');
const entityDefinitionSelfApplicationDeploymentConfiguration = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json');
const entityDefinitionSelfApplicationVersion = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json');
const entityDefinitionSelfApplicationModelBranch = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/69bf7c03-a1df-4d1c-88c1-44363feeea87.json');
const entityDefinitionTest = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/d2842a84-3e66-43ee-ac58-7e13b95b01e8.json');

const selfApplicationMiroir = require('./assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/21840247-b5b1-4344-baec-f818f4797d92.json');
const selfApplicationDeploymentMiroir = require('./assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json');
const selfApplicationModelBranchMiroirMasterBranch = require('./assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json');
const selfApplicationVersionInitialMiroirVersion = require('./assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json');
const selfApplicationStoreBasedConfigurationMiroir = require('./assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json');
const reportApplicationList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0e4cf674-3a26-422a-8618-09e32302ac0c.json');
const reportApplicationDeploymentConfigurationList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/df0a9a8f-e0f6-4f9f-8635-c8460e638e1b.json');
const reportApplicationModelBranchList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/60648b22-e2c6-4b74-8031-53884f597d63.json');
const reportApplicationVersionList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json');
const reportConfigurationList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/43f04807-8f96-43f9-876f-9a0210f7b99c.json');
const reportEndpointVersionList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/ace3d5c9-b6a7-43e6-a277-595329e7532a.json');
const reportEntityDefinitionList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json');
const reportEntityDefinitionDetails = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/acd55b04-84df-427e-b219-cf0e01a6881b.json');
const reportEntityList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json');
const reportEntityDetails = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/074d1de9-594d-42d6-8848-467baeb6f3e0.json');
const reportMenuList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/ecfd8787-09cc-417d-8d2c-173633c9f998.json');
const reportJzodSchemaList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/8b22e84e-9374-4121-b2a7-d13d947a0ba2.json');
const reportQueryVersionList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7aed09a9-8a2d-4437-95ab-62966e38352c.json');
const reportReportList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855.json');
const reportTestList = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/683ba925-835e-4f9d-845b-7fae500316ad.json');
const reportTestDetails = require('./assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/d65d8dc8-2a7f-4111-81b1-0324e816c1a8.json');

const queryVersionBundleProducerV1 = require('./assets/miroir_data/e4320b9e-ab45-4abe-85d8-359604b3c62f/e8c15587-af5d-4c08-b5b7-22f959447690.json');

const applicationEndpointV1 = require('./assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ddd9c928-2ceb-4f67-971b-5898090412d6.json');
const deploymentEndpointV1 = require('./assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json');
const instanceEndpointV1 = require('./assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json');
const modelEndpointV1 = require('./assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json');

const menuDefaultMiroir = require('./assets/miroir_data/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/eaac459c-6c2b-475c-8ae4-c6c3032dae00.json');

const entityDefinitionStoreBasedConfiguration = require('./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/f93af951-ea13-4815-a2e3-ec0cab1fadd2.json');
const entityDefinitionTransformerDefinition = require("./assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/54a16d69-c1f0-4dd7-aba4-a2cda883586c.json");

const miroirJzodSchemaBootstrap = require('./assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json');
const transformerJzodSchema = require("./assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/a97756cf-dd93-42b9-a021-91a629b187b9.json");


// const entityDefinitionSelfApplicationV1 = require("../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json"); //assert { type: "json" };
// const entityDefinitionSelfApplicationVersionV1 = require("../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json"); //assert { type: "json" };
const entityDefinitionBundleV1 = require("../src/assets/miroirAdmin/model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/01a051d8-d43c-430d-a98e-739048f54942.json"); //assert { type: "json" };
const entityDefinitionCommit = require("../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b17d5e9e-12f2-4ed8-abdb-2576c01514a4.json"); //assert { type: "json" };
// const entityDefinitionEntityDefinitionV1 = require("../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json"); //assert { type: "json" };
// const entityDefinitionJzodSchemaV1 = require("../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json"); //assert { type: "json" };
const entityDefinitionQueryVersionV1 = require("../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json"); //assert { type: "json" };
// const entityDefinitionReportV1 = require("../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json"); //assert { type: "json" };
const domainEndpointVersionV1 = require("../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5.json"); //assert { type: "json" };
const testEndpointVersionV1 = require("../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a9139e2d-a714-4c9c-bdee-c104488e2eaa.json"); //assert { type: "json" };
const storeManagementEndpoint = require("../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json"); //assert { type: "json" };
const instanceEndpointVersionV1 = require("../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json"); //assert { type: "json" };
const undoRedoEndpointVersionV1 = require("../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/71c04f8e-c687-4ea7-9a19-bc98d796c389.json"); //assert { type: "json" };
const localCacheEndpointVersionV1 = require("../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9e404b3c-368c-40cb-be8b-e3c28550c25e.json"); //assert { type: "json" };
const queryEndpointVersionV1 = require("../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0faae143-0d7b-4a8a-a950-4fc3df943bde.json"); //assert { type: "json" };
const persistenceEndpointVersionV1 = require("../src/assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a93598b3-19b6-42e8-828c-f02042d212d4.json"); //assert { type: "json" };
const jzodSchemajzodMiroirBootstrapSchema = require("../src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json"); //assert { type: "json" };
// const entityDefinitionEntity = require("../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json"); //assert { type: "json" };
// const entityDefinitionMenu  = require("../src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/0f421b2f-2fdc-47ee-8232-62121ea46350.json"); //assert { type: "json" };

// const transformerMenuV1 = require("../src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json"); //assert { type: "json" };
const transformerMenuV1 = require("../src/assets/miroir_data/a557419d-a288-4fb8-8a1e-971c86c113b8/685440be-7f3f-4774-b90d-bafa82d6832b.json"); //assert { type: "json" };

console.log("miroir-core: loading MIROIR json files DONE");

export {
  selfApplicationMiroir,
  selfApplicationDeploymentMiroir,
  selfApplicationModelBranchMiroirMasterBranch,
  selfApplicationStoreBasedConfigurationMiroir,
  selfApplicationVersionInitialMiroirVersion,
  
  entityAdminApplication,
  entitySelfApplication,
  entitySelfApplicationDeploymentConfiguration,
  entitySelfApplicationModelBranch,
  entitySelfApplicationVersion,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  entityMenu,
  entityJzodSchema,
  // entityQuery,
  entityQueryVersion,
  entityReport,
  entityStoreBasedConfiguration,
  entityTest,
  
  // entityDefinitionSelfApplicationV1,
  domainEndpointVersionV1,
  // entityDefinitionSelfApplicationVersionV1,
  entityDefinitionAdminApplication,
  entityDefinitionBundleV1,
  entityDefinitionCommit,
  // entityDefinitionEntityDefinitionV1,
  // entityDefinitionJzodSchemaV1,
  entityDefinitionQueryVersionV1,
  // entityDefinitionReportV1,
  entityDefinitionSelfApplication,
  entityDefinitionSelfApplicationDeploymentConfiguration,
  entityDefinitionSelfApplicationModelBranch,
  entityDefinitionSelfApplicationVersion,
  entityDefinitionEndpoint,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionJzodSchema,
  entityDefinitionMenu,
  entityDefinitionStoreBasedConfiguration,
  // entityDefinitionQuery,
  entityDefinitionQuery,
  entityDefinitionReport,
  entityDefinitionTest,
  entityDefinitionTransformerDefinition,
  
  miroirJzodSchemaBootstrap,
  
  // queryBundleProducer,
  queryVersionBundleProducerV1,
  
  // applicationEndpoint,
  // deploymentEndpoint,
  // instanceEndpoint,
  // modelEndpoint,
  applicationEndpointV1,
  deploymentEndpointV1,
  instanceEndpointV1,
  modelEndpointV1,
  testEndpointVersionV1,
  menuDefaultMiroir,

  storeManagementEndpoint,
  instanceEndpointVersionV1,
  undoRedoEndpointVersionV1,
  localCacheEndpointVersionV1,
  queryEndpointVersionV1,
  persistenceEndpointVersionV1,
  jzodSchemajzodMiroirBootstrapSchema,

  reportApplicationDeploymentConfigurationList,
  reportApplicationList,
  reportApplicationModelBranchList,
  reportApplicationVersionList,
  reportConfigurationList,
  reportEndpointVersionList,
  reportEntityList,
  reportEntityDetails,
  reportEntityDefinitionList,
  reportEntityDefinitionDetails,
  reportMenuList,
  reportJzodSchemaList,
  reportReportList,
  // reportQueryList,
  reportQueryVersionList,
  reportTestList,
  reportTestDetails,
  // 
  transformerJzodSchema,
  transformerMenuV1,
};

// ################################################################################################
// LIBRARY APPLICATION
// ################################################################################################
// import adminApplicationLibrary from "./assets/admin_model/a659d350-dd97-4da9-91de-524fa01745dc/55af124e-8c05-4bae-a3ef-0933d41daa92.json" //assert { type: "json" };
console.log("miroir-core: loading APP json files");
const adminApplicationLibrary = require("./assets/admin_data/25d935e7-9e93-42c2-aade-0472b883492b/dbabc841-b1fb-48f6-a31a-b8ce294127da.json");
const selfApplicationLibrary = require("./assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json");
const selfApplicationStoreBasedConfigurationLibrary = require("./assets/library_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/2e5b7948-ff33-4917-acac-6ae6e1ef364f.json");
const selfApplicationVersionLibraryInitialVersion = require("./assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json");
const selfApplicationModelBranchLibraryMasterBranch = require("./assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json");

const selfApplicationDeploymentLibrary = require("./assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json");

const entityPublisher = require("./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json");
const entityAuthor = require("./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json");
const entityBook = require("./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json");
const entityCountry = require("./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json");

const reportAuthorList = require("./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json");
const reportBookList = require("./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json");
const reportBookInstance = require("./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json");
const reportPublisherList = require("./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json");

const entityDefinitionBook = require("./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json");
const entityDefinitionPublisher = require("./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json");
const entityDefinitionAuthor = require("./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json");
const entityDefinitionCountry = require("./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json");

const menuDefaultLibrary = require("./assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json");

const reportAuthorDetails = require("./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json");
const reportBookDetails = require("./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json");
const reportCountryList = require("./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json");

const folio = require("./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json");
const penguin = require("./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json");
const springer = require("./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json");
const author1 = require("./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json");
const author2 = require("./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json");
const author3 = require("./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json");
const author4 = require("./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json");
const book1 = require("./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json");
const book2 = require("./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json");
const book3 = require("./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json");
const book4 = require("./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json");
const book5 = require("./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json");
const book6 = require("./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json");
const Country1 = require("./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json");
const Country2 = require("./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json");
const Country3 = require("./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json");
const Country4 = require("./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json");
const publisher1 = require("./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json");
const publisher2 = require("./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json");
const publisher3 = require("./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json");

console.log("miroir-core: loading APP json files DONE");
export {
  entityPublisher,
  entityAuthor,
  entityBook,
  entityCountry,
  // entityTest,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionCountry,
  entityDefinitionPublisher,
  // entityDefinitionTest,
  menuDefaultLibrary,
  // 
  reportAuthorList,
  reportAuthorDetails,
  reportBookList,
  reportBookDetails,
  reportBookInstance,
  reportCountryList,
  reportPublisherList,
  // reportTestList,
  selfApplicationLibrary,
  selfApplicationStoreBasedConfigurationLibrary,
  selfApplicationVersionLibraryInitialVersion,
  selfApplicationModelBranchLibraryMasterBranch,
  // 
  selfApplicationDeploymentLibrary,
  // 
  folio,
  penguin,
  springer,
  author1,
  author2,
  author3,
  author4,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  // test1,
  Country1,
  Country2,
  Country3,
  Country4,
  publisher1,
  publisher2,
  publisher3,
};


const menuDefaultAdmin = require("./assets/admin_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json"); //assert { type: "json" };
const adminConfigurationDeploymentAdmin = require("./assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/18db21bf-f8d3-4f6a-8296-84b69f6dc48b.json"); //assert { type: "json" };
const adminConfigurationDeploymentMiroir = require("./assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json"); //assert { type: "json" };
const adminConfigurationDeploymentLibrary = require("./assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json"); //assert { type: "json" };
// const adminConfigurationDeploymentTest1 = require("./assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/15e2004a-e7a0-4b9e-8acd-6d3500a6c9ad.json"); //assert { type: "json" };
const entityApplicationForAdmin = require("./assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/25d935e7-9e93-42c2-aade-0472b883492b.json"); //assert { type: "json" };
const entityDeployment = require("./assets/admin_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7959d814-400c-4e80-988f-a00fe582ab98.json"); //assert { type: "json" };
const entityDefinitionDeployment = require("./assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/c50240e7-c451-46c2-b60a-07b3172a5ef9.json"); //assert { type: "json" };
const test1SelfApplication = require("./assets/test1_model/a659d350-dd97-4da9-91de-524fa01745dc/70a866bd-a645-41be-8ec5-814451f12337.json"); //assert { type: "json" };
const menuDefaultTest1 = require("./assets/test1_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/84c178cc-1b1b-497a-a035-9b3d756bb085.json"); //assert { type: "json" };

export {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  // adminConfigurationDeploymentTest1,
  entityApplicationForAdmin,
  entityDeployment,
  entityDefinitionDeployment,
  menuDefaultAdmin,
}

export {
  test1SelfApplication,
  menuDefaultTest1,
}

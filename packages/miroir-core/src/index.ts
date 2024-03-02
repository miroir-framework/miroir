// export {miroirFundamentalJzodSchema} from "./0_interfaces/1_core/bootstrapJzodSchemas/miroirFundamentalJzodSchema";

export {
  ActionError,
  actionError,
  ActionEntityInstanceReturnType,
  actionEntityInstanceReturnType,
  ActionEntityInstanceSuccess,
  actionEntityInstanceSuccess,
  ActionEntityInstanceCollectionReturnType,
  actionEntityInstanceCollectionReturnType,
  ActionEntityInstanceCollectionSuccess,
  actionEntityInstanceCollectionSuccess,
  ActionVoidReturnType,
  actionVoidReturnType,
  ActionVoidSuccess,
  actionVoidSuccess,
  ActionSuccess,
  actionSuccess,
  ActionReturnType,
  actionReturnType,
  ActionTransformer,
  actionTransformer,
  Application,
  application,
  ApplicationVersion,
  applicationVersion,
  ApplicationSection,
  applicationSection,
  Commit,
  DomainAction,
  ConceptLevel,
  StoreManagementAction,
  storeManagementAction,
  Entity,
  entity,
  EntityArrayAttribute,
  entityArrayAttribute,
  EntityAttribute,
  entityAttribute,
  EntityForeignKeyAttribute,
  entityForeignKeyAttribute,
  EntityAttributePartial,
  entityAttributePartial,
  EntityAttributeCore,
  entityAttributeCore,
  EntityAttributeExpandedType,
  entityAttributeExpandedType,
  EntityAttributeType,
  entityAttributeType,
  EntityAttributeUntypedCore,
  entityAttributeUntypedCore,
  MetaModel,
  metaModel,
  InstanceAction,
  EntityDefinition,
  entityDefinition,
  EntityInstance,
  entityInstance,
  EntityInstancesUuidIndex,
  entityInstancesUuidIndex,
  EntityInstanceCollection,
  entityInstanceCollection,
  DomainElementType,
  domainElementType,
  JzodSchema,
  jzodSchema,
  JzodArray,
  jzodArray,
  JzodAttribute,
  jzodAttribute,
  JzodAttributeDateValidations,
  jzodAttributeDateValidations,
  JzodAttributeDateWithValidations,
  jzodAttributeDateWithValidations,
  JzodAttributeNumberValidations,
  jzodAttributeNumberValidations,
  JzodAttributeNumberWithValidations,
  jzodAttributeNumberWithValidations,
  JzodAttributeStringValidations,
  jzodAttributeStringValidations,
  JzodAttributeStringWithValidations,
  jzodAttributeStringWithValidations,
  JzodBaseObject,
  jzodBaseObject,
  JzodElement,
  jzodElement,
  JzodEnum,
  jzodEnum,
  JzodEnumAttributeTypes,
  jzodEnumAttributeTypes,
  JzodEnumElementTypes,
  jzodEnumElementTypes,
  JzodFunction,
  jzodFunction,
  JzodIntersection,
  jzodIntersection,
  JzodLazy,
  jzodLazy,
  JzodLiteral,
  jzodLiteral,
  JzodMap,
  jzodMap,
  JzodObject,
  jzodObject,
  JzodObjectOrReference,
  jzodObjectOrReference,
  JzodPromise,
  jzodPromise,
  JzodRecord,
  jzodRecord,
  JzodReference,
  jzodReference,
  JzodSet,
  jzodSet,
  JzodTuple,
  jzodTuple,
  JzodUnion,
  jzodUnion,
  LocalCacheAction,
  StoreOrBundleAction,
  MiroirConfigForMswClient,
  miroirConfigForMswClient,
  MiroirConfigForRestClient,
  miroirConfigForRestClient,
  MiroirConfigClient,
  MiroirConfigServer,
  MiroirConfig,
  MiroirCustomQueryParams,
  miroirCustomQueryParams,
  MiroirFundamentalType,
  MiroirAllFundamentalTypesUnion,
  MiroirCrossJoinQuery,
  miroirCrossJoinQuery,
  MiroirFetchQuery,
  miroirFetchQuery,
  MiroirSelectQuery,
  miroirSelectQuery,
  MiroirSelectQueriesRecord,
  miroirSelectQueriesRecord,
  ModelAction,
  modelAction,
  ModelActionAlterEntityAttribute,
  modelActionAlterEntityAttribute,
  ModelActionRenameEntity,
  modelActionRenameEntity,
  ModelActionCreateEntity,
  modelActionCreateEntity,
  ModelActionDropEntity,
  modelActionDropEntity,
  SelectObjectQuery,
  selectObjectQuery,
  SelectObjectListQuery,
  selectObjectListQuery,
  ServerConfigForClientConfig,
  serverConfigForClientConfig,
  SqlDbStoreSectionConfiguration,
  IndexedDbStoreSectionConfiguration,
  FilesystemDbStoreSectionConfiguration,
  StoreBasedConfiguration,
  storeBasedConfiguration,
  StoreSectionConfiguration,
  storeSectionConfiguration,
  StoreUnitConfiguration,
  storeUnitConfiguration,
  TransactionalInstanceAction,
  transactionalInstanceAction,
  UndoRedoAction,
  undoRedoAction,
  GridReportSection,
  gridReportSection,
  ListReportSection,
  listReportSection,
  ObjectInstanceReportSection,
  objectInstanceReportSection,
  ObjectListReportSection,
  objectListReportSection,
  Report,
  report,
  ReportSection,
  reportSection,
  DomainElementObject,
  domainElementObject,
  DomainElement,
  domainElement,
  RootReportSection,
  rootReportSection,
}
from "./0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js"

export {
  miroirJzodSchemaBootstrapZodSchema,
  // EntityAttributeCoreSchema,
  // EntityAttributeCore,
  // EntityArrayAttributeSchema,
  // EntityArrayAttribute,
  // EntityAttributeExpandedType,
  // EntityAttributeExpandedTypeSchema,
  // EntityAttributeSchema,
  // EntityAttribute,
  // EntityAttributeTypeSchema,
  // EntityAttributeType,
  // EntityAttributePartialSchema,
  // EntityAttributePartial,
  InstanceDictionaryNum,
  InstanceDictionary,
  MetaEntitySchema,
  MetaEntity,
  UuidSchema,
  Uuid,
} from './0_interfaces/1_core/EntityDefinition.js';
export {
  // ApplicationConceptLevelSchema,
  // ApplicationConceptLevel,
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
} from './0_interfaces/1_core/MiroirConfig';
// export {
//   ApplicationModelSchema,
//   MiroirApplicationModel,
// } from './0_interfaces/1_core/Model.js';
// export {
//   MiroirApplicationVersionOLD_DO_NOT_USE,
// } from './0_interfaces/1_core/ModelVersion.js';
export {
  ClientFileStorage,
  ApplicationDeploymentSchema,
  ApplicationDeploymentConfiguration,
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
  DomainManyQueriesWithDeploymentUuid,
  DomainModelGetEntityDefinitionQueryParams,
  DomainModelGetFetchParamJzodSchemaQueryParams,
  DomainModelGetSingleSelectQueryJzodSchemaQueryParams,
  DomainSingleSelectObjectListQueryWithDeployment,
  DomainSingleSelectObjectQueryWithDeployment,
  DomainSingleSelectQueryWithDeployment,
  DomainModelQueryJzodSchemaParams,
  DomainStateSelector,
  LocalCacheEntityInstancesSelectorParams,
  LocalCacheQueryParams,
  MiroirSelectorQueryParams,
  RecordOfJzodElement,
  RecordOfJzodObject,
} from './0_interfaces/2_domain/DomainSelectorInterface.js';
// export {
//   // WrappedTransactionalEntityUpdateWithCUDUpdateSchema,
//   // WrappedTransactionalEntityUpdateWithCUDUpdate,
// } from './0_interfaces/2_domain/ModelUpdateInterface.js';
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
} from './0_interfaces/3_controllers/MiroirContextInterface';
export {
  LoggerFactoryInterface,
  LoggerFactoryAsyncInterface,
  LoggerInterface,
  LogLevelOptions,
  defaultLevels,
  SpecificLoggerOptionsMap,
} from "./0_interfaces/4-services/LoggerInterface.js";
export {
  StoreControllerManagerInterface
} from "./0_interfaces/4-services/StoreControllerManagerInterface.js";
export {
  LocalCacheInterface,
} from './0_interfaces/4-services/LocalCacheInterface.js';
export {
  HttpRequestBodyFormat,
  HttpResponseBodyFormat,
  RemoteStoreInterface,
  RemoteStoreAction,
  RemoteStoreCRUDAction,
  RemoteStoreActionReturnType,
  // RemoteStoreOLDModelAction,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
  RestMethodHandler,
  RestServiceHandler,
} from "./0_interfaces/4-services/RemoteStoreInterface.js";
export {
  AbstractStoreInterface,
  AbstractStoreSectionInterface,
  AdminStoreInterface,
  AdminStoreFactory,
  AdminStoreFactoryRegister,
  StoreDataSectionInterface,
  StoreModelSectionInterface,
  AbstractEntityStoreSectionInterface,
  AbstractInstanceStoreSectionInterface,
  StorageSpaceHandlerInterface,
  DataOrModelStoreInterface,
  StoreControllerInterface,
  StoreSectionFactory,
  StoreSectionFactoryRegister,
} from "./0_interfaces/4-services/StoreControllerInterface.js";
export { } from './1_core/Report.js';
export { ACTION_OK } from './1_core/constants.js';
export { DomainController } from './3_controllers/DomainController';
export { DomainInstanceUuidIndexToArray } from './1_core/DomainState.js';
export {
  defaultMiroirMetaModel,
  getCurrentEntityDefinition,
 } from './1_core/Model.js';
export {
  // getReportSectionTargetEntityUuid,
} from './1_core/Report.js';
export {
  selectEntityInstances,
  selectEntityInstancesFromJzodAttribute,
  selectEntityUuidFromJzodAttribute,
  selectCurrentDeploymentModel,
  selectReportDefinitionFromReportUuid,
} from './2_domain/DomainDataAccess.js';
export {
  cleanupResultsFromQuery,
  selectByDomainManyQueriesFromDomainState,
  selectJzodSchemaByDomainModelQueryFromDomainState,
  selectEntityJzodSchemaFromDomainState,
  selectEntityInstanceUuidIndexFromDomainState,
  selectEntityInstanceFromObjectQueryAndDomainState,
  selectEntityInstanceListFromListQueryAndDomainState as selectEntityInstancesFromListQueryAndDomainState,
  selectFetchQueryJzodSchemaFromDomainState,
  selectJzodSchemaBySingleSelectQueryFromDomainState,
} from './2_domain/DomainSelector.js';
export {
  ModelEntityActionTransformer
} from './2_domain/ModelEntityActionTransformer.js';
export {
  cacheFetchPolicy,
  cacheInvalidationPolicy,
  ConfigurationService,
  PackageConfiguration,
  undoRedoHistorization,
} from "./3_controllers/ConfigurationService.js";
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
  resetAndInitMiroirAndApplicationDatabase,
  resetMiroirAndApplicationDatabases,
} from './3_controllers/resetApplicationDatabase.js';
export {
  restActionStoreRunnerImplementation,
  modelActionStoreRunner,
} from './3_controllers/ActionRunner.js';
export {
  modelInitialize,
  applicationModelEntities,
  metaModelEntities,
  miroirModelEntities,
} from './3_controllers/ModelInitializer.js';
export { ErrorLogService } from './3_controllers/ErrorHandling/ErrorLogService.js';
export { CallUtils } from './3_controllers/ErrorHandling/CallUtils.js';
export { MiroirContext } from './3_controllers/MiroirContext.js';
export { RemoteDataStoreController } from './3_controllers/RemoteDataStoreController.js';
export {
  MiroirLoggerFactory,
  templateLoggerOptionsFactory,
  testLogger
} from './4_services/Logger.js';
export {
  StoreController,
  StoreControllerFactoryReturnType,
} from './4_services/StoreController.js';
export {
  RestClient
} from './4_services/RestClient.js';
export {
  restServerDefaultHandlers
} from './4_services/RestServer.js';
export {
  // createStoreControllers,
  startLocalStoreControllers,
} from './4_services/storeControllerTools.js';
export {
  StoreControllerManager
} from './4_services/StoreControllerManager.js';
export {
  generateRestServiceResponse,
} from './4_services/RestTools.js';
export { miroirCoreStartup } from './startup.js';
export { stringTuple, circularReplacer, getLoggerName } from './tools.js';

export {applicationDeploymentLibrary} from "./ApplicationDeploymentLibrary.js"

import entityApplication from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json';
import entityApplicationDeploymentConfiguration from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/35c5608a-7678-4f07-a4ec-76fc5bc35424.json';
import entityApplicationVersion from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityApplicationModelBranch from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/cdb0aec6-b848-43ac-a058-fe2dbe5811f1.json';
import entityEntity from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import entityJzodSchema from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/5e81e1b9-38be-487c-b3e5-53796c57fccf.json';
import entityReport from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import entityStoreBasedConfiguration from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json';
import entityQueryVersion from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e4320b9e-ab45-4abe-85d8-359604b3c62f.json';
import entityEndpointVersion from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e4320b9e-ab45-4abe-85d8-359604b3c62f.json';

import entityDefinitionApplication from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json';
import entityDefinitionApplicationDeploymentConfiguration from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json';
import entityDefinitionApplicationVersion from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionApplicationModelBranch from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/69bf7c03-a1df-4d1c-88c1-44363feeea87.json';
import entityDefinitionEntity from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';
import entityDefinitionEntityDefinition from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import entityDefinitionJzodSchema from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/15407b85-f2c8-4a34-bfa7-89f044ba2407.json';
import entityDefinitionReport from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json';
import entityDefinitionEndpoint from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/e3c1cc69-066d-4f52-beeb-b659dc7a88b9.json';
import entityDefinitionQuery from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/359f1f9b-7260-4d76-a864-72c839b9711b.json';

import applicationMiroir from './assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/21840247-b5b1-4344-baec-f818f4797d92.json';
import applicationDeploymentMiroir from './assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
import applicationModelBranchMiroirMasterBranch from './assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json';
import applicationVersionInitialMiroirVersion from './assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import applicationStoreBasedConfigurationMiroir from './assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';
import reportApplicationList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0e4cf674-3a26-422a-8618-09e32302ac0c.json';
import reportApplicationDeploymentConfigurationList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/df0a9a8f-e0f6-4f9f-8635-c8460e638e1b.json';
import reportApplicationModelBranchList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/60648b22-e2c6-4b74-8031-53884f597d63.json';
import reportApplicationVersionList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json';
import reportConfigurationList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/43f04807-8f96-43f9-876f-9a0210f7b99c.json';
import reportEndpointVersionList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/ace3d5c9-b6a7-43e6-a277-595329e7532a.json';
import reportEntityDefinitionList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json';
import reportEntityList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json';
import reportJzodSchemaList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/8b22e84e-9374-4121-b2a7-d13d947a0ba2.json';
import reportQueryVersionList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7aed09a9-8a2d-4437-95ab-62966e38352c.json';
import reportReportList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855.json';

import queryVersionBundleProducerV1 from './assets/miroir_data/e4320b9e-ab45-4abe-85d8-359604b3c62f/e8c15587-af5d-4c08-b5b7-22f959447690.json';

import applicationEndpointV1 from './assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ddd9c928-2ceb-4f67-971b-5898090412d6.json';
import deploymentEndpointV1 from './assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json';
import instanceEndpointV1 from './assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json';
import modelEndpointV1 from './assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json';


import entityDefinitionStoreBasedConfiguration from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/f93af951-ea13-4815-a2e3-ec0cab1fadd2.json';

import miroirJzodSchemaBootstrap from '..//src/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json';


export {
  applicationMiroir,
  applicationDeploymentMiroir,
  applicationModelBranchMiroirMasterBranch,
  applicationStoreBasedConfigurationMiroir,
  applicationVersionInitialMiroirVersion,

  entityApplication,
  entityApplicationDeploymentConfiguration,
  entityApplicationModelBranch,
  entityApplicationVersion,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  entityJzodSchema,
  // entityQuery,
  entityQueryVersion,
  entityReport,
  entityStoreBasedConfiguration,

  entityDefinitionApplication,
  entityDefinitionApplicationDeploymentConfiguration,
  entityDefinitionApplicationModelBranch,
  entityDefinitionApplicationVersion,
  entityDefinitionEndpoint,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionJzodSchema,
  entityDefinitionStoreBasedConfiguration,
  // entityDefinitionQuery,
  entityDefinitionQuery,
  entityDefinitionReport,
  
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

  reportApplicationDeploymentConfigurationList,
  reportApplicationList,
  reportApplicationModelBranchList,
  reportApplicationVersionList,
  reportConfigurationList,
  reportEndpointVersionList,
  reportEntityList,
  reportEntityDefinitionList,
  reportJzodSchemaList,
  reportReportList,
  // reportQueryList,
  reportQueryVersionList,
};


// import applicationDeploymentLibraryDeployment from "assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/ab4c13c3-f476-407c-a30c-7cb62275a352.json";
import entityPublisher from "./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
import entityAuthor from "./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import entityCountry from "./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json";
// import entityTest from "./assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/9ad64893-5f8f-4eaf-91aa-ffae110f88c8.json";
import reportAuthorList from "./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json";
import reportBookList from "./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import reportBookInstance from "./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";
import reportPublisherList from "./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json";
// import reportTestList from "./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/931dd036-dfce-4e47-868e-36dba3654816.json";
import entityDefinitionBook from "./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionPublisher from "./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
import entityDefinitionAuthor from "./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import entityDefinitionCountry from "./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json";
// import entityDefinitionTest from "./assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/83872519-ce34-4a24-b1db-b7bf604ebd3a.json";
import applicationLibrary from "./assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
import applicationStoreBasedConfigurationLibrary from "./assets/library_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/2e5b7948-ff33-4917-acac-6ae6e1ef364f.json";
import applicationVersionLibraryInitialVersion from "./assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json";
import applicationModelBranchLibraryMasterBranch from "./assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json";

import reportAuthorDetails from "./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json";
import reportBookDetails from "./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";
import reportCountryList from "./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json";

import folio from "./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import penguin from "./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import springer from "./assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
import author1 from "./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import author4 from "./assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json";
import book1 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import book3 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book5 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book6 from "./assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json";
// import test1 from "./assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json";
import Country1 from "./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json";
import Country2 from "./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json";
import Country3 from "./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json";
import Country4 from "./assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json";

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
  reportAuthorList,
  reportAuthorDetails,
  reportBookList,
  reportBookDetails,
  reportBookInstance,
  reportCountryList,
  reportPublisherList,
  // reportTestList,
  applicationLibrary,
  applicationStoreBasedConfigurationLibrary,
  applicationVersionLibraryInitialVersion,
  applicationModelBranchLibraryMasterBranch,
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
};



// const myDefaultExport = "Miroir-core default export"
export default {
  // myDefaultExport
}

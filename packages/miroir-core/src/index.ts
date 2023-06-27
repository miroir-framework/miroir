export {
  Application,
  ApplicationSchema,
} from './0_interfaces/1_core/Application.js';
export {
  EntityAttributeCoreSchema,
  EntityAttributeCore,
  EntityAttributeUntypedCoreSchema,
  EntityAttributeUntypedCore,
  EntityArrayAttributeSchema,
  EntityArrayAttribute,
  EntityAttributeExpandedType,
  EntityAttributeExpandedTypeSchema,
  EntityAttributeSchema,
  EntityAttribute,
  EntityAttributeTypeSchema,
  EntityAttributeType,
  EntityAttributePartialSchema,
  EntityAttributePartial,
  EntityDefinitionSchema,
  EntityDefinition,
  InstanceDictionaryNum,
  InstanceDictionary,
  MetaEntitySchema,
  MetaEntity,
  UuidSchema,
  Uuid,
} from './0_interfaces/1_core/EntityDefinition.js';
export {
  ClientFileStorage,
  ApplicationDeploymentSchema,
  ApplicationDeployment,
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
  HttpMethod,
  HttpMethodsArray,
  HttpMethodsObject,
} from './0_interfaces/1_core/Http.js';
export {
  ApplicationConceptLevelSchema,
  ApplicationConceptLevel,
  ApplicationSectionSchema,
  ApplicationSection,
  ApplicationSectionOpposite,
  EntityInstanceSchema,
  EntityInstance,
  EntityInstanceCollectionSchema,
  EntityInstanceCollection,
  EntityInstanceWithNameSchema,
  EntityInstanceWithName,
} from './0_interfaces/1_core/Instance.js';
export {
  MiroirMetaModelSchema,
  MiroirMetaModel,
} from './0_interfaces/1_core/Model.js';
export {
  MiroirApplicationVersion,
} from './0_interfaces/1_core/ModelVersion.js';
export {
} from './0_interfaces/1_core/ZodSchema.js';
export {
  DeploymentMode,
  EmulatedPartitionedServerConfig,
  EmulatedServerConfig,
  EmulatedServerConfigFileSystem,
  EmulatedServerConfigIndexedDb,
  EmulatedServerConfigSql,
  MiroirConfigForMsw,
  MiroirConfigForRest,
  MiroirConfig,
  ServerConfig,
  StoreBasedConfigurationSchema,
  StoreBasedConfiguration,
} from './0_interfaces/1_core/MiroirConfig';
export {
  ReportSchema,
  Report,
  ReportGridType,
  ReportGridTypeSchema,
  ReportListType,
  ReportListTypeSchema,
  ReportSectionObjectDetails,
  ReportSectionObjectDetailsSchema,
  ReportSectionListDefinitionSchema,
  ReportSectionListDefinition,
  ReportSection,
  ReportSectionList,
  ReportSectionListSchema,
  ReportSectionSchema,
} from './0_interfaces/1_core/Report.js';
export {
  CRUDActionNameSchema,
  CRUDActionName,
  CRUDActionNamesArray,
  CRUDActionNamesArrayString,
  DomainActionSchema,
  DomainActionWithDeploymentSchema,
  DomainAncillaryActionSchema,
  DomainAncillaryOrReplayableActionSchema,
  DomainAncillaryOrReplayableActionWithDeploymentSchema,
  DomainDataActionSchema,
  DomainModelInitAction,
  DomainModelInitActionParams,
  DomainModelInitActionParamsSchema,
  DomainModelInitActionSchema,
  DomainTransactionalActionSchema,
  DomainTransactionalAncillaryOrReplayableActionSchema,
  DomainTransactionalCUDActionSchema,
  DomainTransactionalCommitActionSchema,
  DomainTransactionalEntityUpdateActionSchema,
  DomainTransactionalReplaceLocalCacheActionSchema,
  DomainTransactionalReplayableActionSchema,
  DomainTransactionalReplayableEntityUpdateActionSchema,
  DomainTransactionalResetModelActionSchema,
  DomainTransactionalResetDataActionSchema,
  DomainTransactionalRollbackActionSchema,
  DomainTransactionalUndoRedoActionSchema,
  ModelEntityUpdateActionNameSchema,
  remoteStoreActionNamesSchema,
  DomainAction,
  DomainActionWithDeployment,
  DomainControllerInterface,
  DomainDataAction,
  DomainTransactionalAction,
  DomainAncillaryOrReplayableAction,
  DomainAncillaryOrReplayableActionWithDeployment,
  DomainAncillaryAction,
  DomainTransactionalAncillaryOrReplayableAction,
  DomainTransactionalCommitAction,
  DomainTransactionalCUDAction,
  DomainTransactionalEntityUpdateAction,
  DomainTransactionalReplaceLocalCacheAction,
  DomainTransactionalReplayableAction,
  DomainTransactionalReplayableEntityUpdateAction,
  DomainTransactionalResetModelAction,
  DomainTransactionalRollbackAction,
  DomainTransactionalUndoRedoAction,
  EntitiesDomainState,
  DomainStateReducer,
  DomainStateSelector,
  DomainStateTransformer,
  DomainInstancesUuidIndex,
  UndoRedoActionNamesSchema,
  UndoRedoActionName,
  UndoRedoActionNamesArray,
  // undoRedoActionNamesObject,
  ModelEntityUpdateActionName,
  ModelEntityUpdateActionNamesArray,
  ModelEntityUpdateActionNamesArrayString,
  // ModelEntityUpdateActionNamesObject,
  RemoteStoreActionName,
  remoteStoreActionNamesArray,
  // remoteStoreActionNamesObject,
} from './0_interfaces/2_domain/DomainControllerInterface.js';
export {
  CUDActionNameSchema,
  CUDActionName,
  CUDActionNamesArray,
  ModelEntityUpdateAlterEntityAttributeSchema,
  ModelEntityUpdateAlterEntityAttribute,
  ModelEntityUpdateCreateMetaModelInstanceSchema,
  ModelEntityUpdateCreateMetaModelInstance,
  ModelEntityUpdateDeleteMetaModelInstanceSchema,
  ModelEntityUpdateDeleteMetaModelInstance,
  ModelEntityUpdateRenameEntitySchema,
  ModelEntityUpdateRenameEntity,
  ModelCUDInstanceUpdateSchema,
  ModelCUDInstanceUpdate,
  ModelEntityUpdateSchema,
  ModelEntityUpdate,
  ModelReplayableUpdateSchema,
  ModelReplayableUpdate,
  // ModelResetUpdateSchema,
  // ModelResetUpdate,
  ModelUpdateSchema,
  ModelUpdate,
  WrappedTransactionalEntityUpdateSchema,
  WrappedTransactionalEntityUpdate,
  WrappedTransactionalEntityUpdateWithCUDUpdateSchema,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
} from './0_interfaces/2_domain/ModelUpdateInterface.js';
export {
  DataStoreApplicationTypeSchema,
  DataStoreApplicationType,
} from './0_interfaces/3_controllers/ApplicationControllerInterface.js';
export {
  selectReportSectionInstances,
  selectEntityInstances,
} from './2_domain/ReportDisplay';
export {
  ModelEntityUpdateConverter
} from './2_domain/ModelUpdateConverter.js';
export {
  LocalAndRemoteControllerInterface
} from './0_interfaces/3_controllers/LocalAndRemoteControllerInterface.js';
export {
  ErrorLogServiceInterface, MError
} from './0_interfaces/3_controllers/ErrorLogServiceInterface.js';
export {
  MiroirContextInterface
} from './0_interfaces/3_controllers/MiroirContextInterface';
export {
  LocalCacheInterface,
  LocalCacheInfo,
} from './0_interfaces/4-services/localCache/LocalCacheInterface.js';
export {
  RemoteDataStoreInterface,
  RemoteStoreAction,
  RemoteStoreCRUDAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
} from "./0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
export {
  IAbstractStore,
  IDataSectionStore,
  IModelSectionStore,
  IAbstractEntityStore,
  IAbstractInstanceStore,
  IStorageSpaceHandler,
  IStoreController,
} from "./0_interfaces/4-services/remoteStore/IStoreController.js";
export { } from './1_core/Report.js';
export { DomainController } from './3_controllers/DomainController';
export { DomainInstanceUuidIndexToArray } from './1_core/DomainState.js';
export {
  defaultMiroirMetaModel,
  getCurrentEntityDefinition,
 } from './1_core/Model.js';
 export {
  getZodSimpleType,
} from './1_core/ZodSchema.js';
export {
  cacheFetchPolicy,
  cacheInvalidationPolicy,
  ConfigurationService,
  PackageConfiguration,
  undoRedoHistorization,
  StoreFactory,
  StoreFactoryRegister,
} from "./3_controllers/ConfigurationService.js";
export {
  ErrorDataStore
} from './3_controllers/ErrorDataStore.js';
export {
  ErrorModelStore
} from './3_controllers/ErrorModelStore.js';
export {
  initApplicationDeployment,
  modelActionRunner,
  applyModelEntityUpdate,
} from './3_controllers/ModelActionRunner.js';
export {
  modelInitialize,
  applicationModelEntities,
  metaModelEntities,
  miroirModelEntities,
} from './3_controllers/ModelInitializer.js';
export { LocalAndRemoteController } from './3_controllers/LocalAndRemoteController.js';
export { ErrorLogService } from './3_controllers/ErrorLogService.js';
export { throwExceptionIfError } from './3_controllers/ErrorUtils.js';
export { MiroirContext } from './3_controllers/MiroirContext.js';
export { RemoteDataStoreController } from './3_controllers/RemoteDataStoreController.js';
export {
  StoreController,
  StoreControllerFactory,
  StoreControllerFactoryReturnType,
} from './4_services/StoreController.js';
export {
  RestClient
} from './4_services/RestClient.js';
export {
  generateHandlerBody
} from './RestTools.js';
export {
  RestServerStub,
  getHandler,
  postPutDeleteHandler,
} from './4_services/RestServerStub.js';
export { miroirCoreStartup } from './startup.js';
export { stringTuple, circularReplacer } from './tools.js';

import entityApplication from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a659d350-dd97-4da9-91de-524fa01745dc.json';
import entityApplicationDeployment from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/35c5608a-7678-4f07-a4ec-76fc5bc35424.json';
import entityApplicationVersion from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityApplicationModelBranch from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/cdb0aec6-b848-43ac-a058-fe2dbe5811f1.json';
import entityDefinitionApplication from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/9460420b-f176-4918-bd45-894ab195ffe9.json';
import entityDefinitionApplicationDeployment from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bd303ae8-6bce-4b44-a63c-815b9ebf728b.json';
import entityDefinitionApplicationVersion from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionApplicationModelBranch from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/69bf7c03-a1df-4d1c-88c1-44363feeea87.json';
import reportApplicationList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0e4cf674-3a26-422a-8618-09e32302ac0c.json';
import reportApplicationDeploymentList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/df0a9a8f-e0f6-4f9f-8635-c8460e638e1b.json';
import reportApplicationModelBranchList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/60648b22-e2c6-4b74-8031-53884f597d63.json';
import reportApplicationVersionList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/0810de28-fdab-4baf-8935-7e04a8f779a9.json';
import applicationMiroir from './assets/miroir_data/a659d350-dd97-4da9-91de-524fa01745dc/21840247-b5b1-4344-baec-f818f4797d92.json';
import applicationDeploymentMiroir from './assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
import applicationModelBranchMiroirMasterBranch from './assets/miroir_data/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json';
import applicationVersionInitialMiroirVersion from './assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
import applicationStoreBasedConfigurationMiroir from './assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';

// import entityModelVersion from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24.json';
import entityReport from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import entityEntity from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad.json';
import entityEntityDefinition from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import entityStoreBasedConfiguration from './assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/7990c0c9-86c3-40a1-a121-036c91b55ed7.json';
import entityDefinitionEntityDefinition from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/bdd7ad43-f0fc-4716-90c1-87454c40dd95.json';
import entityDefinitionEntity from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/381ab1be-337f-4198-b1d3-f686867fc1dd.json';
import EntityDefinitionReport from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json';
// import entityDefinitionModelVersion from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/27046fce-742f-4cc4-bb95-76b271f490a5.json';
import entityDefinitionStoreBasedConfiguration from './assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/f93af951-ea13-4815-a2e3-ec0cab1fadd2.json';
import reportConfigurationList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/43f04807-8f96-43f9-876f-9a0210f7b99c.json';
import reportEntityList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c9ea3359-690c-4620-9603-b5b402e4a2b9.json';
import reportEntityDefinitionList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/f9aff35d-8636-4519-8361-c7648e0ddc68.json';
import reportReportList from './assets/miroir_data/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855.json';
// import applicationVersionInitialMiroirVersion from './assets/miroir_data/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/695826c2-aefa-4f5f-a131-dee46fe21c1.json';
// import instanceConfigurationReference from './assets/miroir_data/7990c0c9-86c3-40a1-a121-036c91b55ed7/360fcf1f-f0d4-4f8a-9262-07886e70fa15.json';


export {
  applicationMiroir,
  applicationDeploymentMiroir,
  applicationModelBranchMiroirMasterBranch,
  applicationStoreBasedConfigurationMiroir,
  applicationVersionInitialMiroirVersion,
  entityApplication,
  entityApplicationDeployment,
  entityApplicationModelBranch,
  entityApplicationVersion,
  entityDefinitionApplication,
  entityDefinitionApplicationDeployment,
  entityDefinitionApplicationModelBranch,
  entityDefinitionApplicationVersion,
  reportApplicationDeploymentList,
  reportApplicationList,
  reportApplicationModelBranchList,
  entityDefinitionEntity,

  entityDefinitionEntityDefinition,
  entityDefinitionStoreBasedConfiguration,
  // entityDefinitionModelVersion,
  EntityDefinitionReport,
  // entityModelVersion,
  entityReport,
  entityEntity,
  entityEntityDefinition,
  entityStoreBasedConfiguration,
  // instanceConfigurationReference,
  // applicationVersionInitialMiroirVersion,
  reportConfigurationList,
  reportEntityList,
  reportEntityDefinitionList,
  reportApplicationVersionList,
  reportReportList,
};
// const myDefaultExport = "Miroir-core default export"
export default {
  // myDefaultExport
}

export {
  EntityAttribute,
  EntityAttributeType,
  EntityAttributeTypeNameArray,
  EntityAttributeTypeObject,
  EntityDefinition,
  MetaEntity,
  InstanceDictionary,
} from './0_interfaces/1_core/EntityDefinition.js';
export {
  EntityInstance,
  EntityInstanceCollection,
  EntityInstanceWithName,
  ApplicationConceptLevel,
} from './0_interfaces/1_core/Instance.js';
export {
  HttpMethod,
  HttpMethodsArray,
  HttpMethodsObject,
} from './0_interfaces/1_core/Http.js';
export {
  MiroirReport,
  MiroirReportDefinition
} from './0_interfaces/1_core/Report.js';
export {
  MiroirMetaModel,
} from './0_interfaces/1_core/Model.js';
export {
  MiroirModelVersion,
  MiroirModelHistory,
} from './0_interfaces/1_core/ModelVersion.js';
export {
  DeploymentMode,
  MiroirConfig,
  ServerConfig,
  StoreBasedConfiguration,
} from './0_interfaces/1_core/MiroirConfig';
export {
  CRUDActionName,
  CRUDActionNamesArray,
  CRUDActionNamesObject,
  CRUDActionNamesArrayString,
  CUDActionName,
  CUDActionNamesArray,
  CUDActionNamesArrayString,
  CUDActionNamesObject,
  DomainAction,
  DomainControllerInterface,
  DomainDataAction,
  DomainModelAction,
  DomainAncillaryOrReplayableAction,
  DomainModelAncillaryAction,
  DomainModelAncillaryOrReplayableAction,
  DomainModelReplayableEntityUpdateAction,
  DomainModelResetAction,
  DomainModelCommitAction,
  DomainModelCUDAction,
  DomainModelEntityUpdateAction,
  DomainModelUndoRedoAction,
  DomainModelReplayableAction,
  DomainModelRollbackAction,
  DomainState,
  DomainStateReducer,
  DomainStateSelector,
  DomainStateTransformer,
  DomainInstancesUuidIndex,
  UndoRedoActionName,
  undoRedoActionNamesArray,
  undoRedoActionNamesObject,
  ModelEntityUpdateActionName,
  ModelEntityUpdateActionNamesArray,
  ModelEntityUpdateActionNamesArrayString,
  ModelEntityUpdateActionNamesObject,
  RemoteStoreActionName,
  remoteStoreActionNamesArray,
  remoteStoreActionNamesObject,
} from './0_interfaces/2_domain/DomainControllerInterface.js';
export {
  ModelEntityUpdateAlterEntityAttribute,
  ModelEntityUpdateCreateMetaModelInstance,
  ModelEntityUpdateDeleteMetaModelInstance,
  ModelEntityUpdateRenameEntity,
  ModelCUDInstanceUpdate,
  ModelEntityUpdate,
  WrappedModelEntityUpdateWithCUDUpdate,
  WrappedModelEntityUpdate,
  ModelResetUpdate,
  ModelUpdate,
  ModelReplayableUpdate,
} from './0_interfaces/2_domain/ModelUpdateInterface.js';
export {
  selectReportInstances,
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
  DataStoreInterface,
  RemoteDataStoreInterface,
  RemoteStoreAction,
  RemoteStoreCRUDAction,
  RemoteStoreCRUDActionReturnType,
  RemoteStoreModelAction,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
} from "./0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js";
export { } from './1_core/Report.js';
export { DomainInstanceUuidIndexToArray } from './1_core/DomainState.js';
export { DomainController } from './3_controllers/DomainController';
export {
  modelInitialize,
} from './3_controllers/ModelInitializer.js';
export {
  modelActionRunner,
  applyModelEntityUpdate,
} from './3_controllers/ModelActionRunner.js';
export {
  cacheFetchPolicy,
  cacheInvalidationPolicy,
  ConfigurationService,
  DeploymentModes,
  PackageConfiguration,
  serverStorageKind,
  undoRedoHistorization,
} from "./3_controllers/ConfigurationService.js";
export { LocalAndRemoteController } from './3_controllers/LocalAndRemoteController.js';
export { ErrorLogService } from './3_controllers/ErrorLogService.js';
export { throwExceptionIfError } from './3_controllers/ErrorUtils.js';
export { MiroirContext } from './3_controllers/MiroirContext.js';
export { RemoteDataStoreController } from './3_controllers/RemoteDataStoreController.js';
export {
  RestClient
} from './4_services/RestClient.js';
export {
  IndexedDbDataStore,
} from './4_services/IndexedDbDataStore.js';
export {
  IndexedDb
} from './4_services/indexedDb.js';
export {
  generateHandlerBody
} from './4_services/RestTools.js';
export { miroirCoreStartup } from './startup.js';
export { stringTuple, circularReplacer } from './tools.js';

import entityModelVersion from './assets/entities/EntityModelVersion.json';
import entityReport from './assets/entities/EntityReport.json';
import entityEntity from './assets/entities/EntityEntity.json';
import entityEntityDefinition from './assets/entities/EntityEntityDefinition.json';
import entityStoreBasedConfiguration from './assets/entities/EntityStoreBasedConfiguration.json';
import entityDefinitionEntityDefinition from './assets/entityDefinitions/EntityDefinitionEntityDefinition.json';
import entityDefinitionEntity from './assets/entityDefinitions/EntityDefinitionEntity.json';
import EntityDefinitionReport from './assets/entityDefinitions/EntityDefinitionReport.json';
import entityDefinitionModelVersion from './assets/entityDefinitions/EntityDefinitionModelVersion.json';
import entityDefinitionStoreBasedConfiguration from './assets/entityDefinitions/StoreBasedConfiguration.json';
import reportConfigurationList from './assets/reports/ConfigurationList.json';
import reportEntityList from './assets/reports/entityList.json';
import reportEntityDefinitionList from './assets/reports/entityDefinitionList.json';
import reportReportList from './assets/reports/ReportList.json';
import reportModelVersionList from './assets/reports/ModelVersionList.json';
import instanceModelVersionInitial from './assets/instances/ModelVersion - initial.json';
import instanceConfigurationReference from './assets/instances/StoreBasedConfiguration - reference.json';

export {
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionStoreBasedConfiguration,
  entityDefinitionModelVersion,
  EntityDefinitionReport,
  entityModelVersion,
  entityReport,
  entityEntity,
  entityEntityDefinition,
  entityStoreBasedConfiguration,
  instanceConfigurationReference,
  instanceModelVersionInitial,
  reportConfigurationList,
  reportEntityList,
  reportEntityDefinitionList,
  reportModelVersionList,
  reportReportList,
};
// const myDefaultExport = "Miroir-core default export"
export default {
  // myDefaultExport
}

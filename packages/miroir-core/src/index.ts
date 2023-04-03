export {
  EntityAttribute,
  EntityAttributeType,
  EntityAttributeTypeNameArray,
  EntityAttributeTypeObject,
  EntityDefinition,
} from './0_interfaces/1_core/EntityDefinition.js';
export {
  Instance,
  InstanceCollection,
  InstanceWithName,
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
  MiroirModel,
  MiroirCUDModelMigration,
  MiroirModelHistory,
  MiroirModelVersion,
  MiroirStructureModelMigration,
} from './0_interfaces/1_core/ModelInterface.js';
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
  // DomainDataActionName,
  // domainDataActionNamesArray,
  // domainDataActionNamesObject,
  DomainControllerInterface,
  DomainDataAction,
  DomainModelAction,
  DomainModelCommitAction,
  DomainModelCUDAction,
  DomainModelLocalCacheAndTransactionAction,
  DomainModelStructureUpdateAction,
  DomainModelUpdateActionName,
  domainModelUpdateActionNamesArray,
  domainModelUpdateActionNamesObject,
  DomainState,
  DomainStateReducer,
  DomainStateSelector,
  DomainStateTransformer,
  DomainInstancesUuidIndex,
  LocalCacheOnlyActionName,
  localCacheOnlyActionNamesArray,
  localCacheOnlyActionNamesObject,
  ModelStructureUpdateActionName,
  ModelStructureUpdateActionNamesArray,
  ModelStructureUpdateActionNamesArrayString,
  ModelStructureUpdateActionNamesObject,
  RemoteStoreActionName,
  remoteStoreActionNamesArray,
  remoteStoreActionNamesObject,
} from './0_interfaces/2_domain/DomainControllerInterface.js';
export {
  ModelCUDUpdate,
  ModelStructureCreateUpdate,
  ModelStructureAlterEntityAttributeUpdate,
  ModelStructureAlterMetaModelInstanceUpdate,
  ModelStructureDeleteMetaModelInstanceUpdate,
  ModelStructureRenameEntityUpdate,
  ModelStructureUpdate,
  ModelUpdateWithCUDUpdate,
  ModelUpdateActionName,
  ModelUpdateActionNamesArray,
  ModelUpdateActionNamesObject,
} from './0_interfaces/2_domain/ModelUpdateInterface.js';
export {
  selectReportInstances,
  selectEntityInstances,
} from './2_domain/ReportDisplay';
export {
  ModelStructureUpdateConverter
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

import entityStoreBasedConfiguration from './assets/entities/StoreBasedConfiguration.json';
import entityEntity from './assets/entities/Entity.json';
import entityReport from './assets/entities/Report.json';
import entityModelVersion from './assets/entities/ModelVersion.json';
import reportConfigurationList from './assets/reports/ConfigurationList.json';
import reportEntityList from './assets/reports/entityList.json';
import reportReportList from './assets/reports/ReportList.json';
import reportModelVersionList from './assets/reports/ModelVersionList.json';
import instanceModelVersionInitial from './assets/instances/ModelVersion - initial.json';
import instanceConfigurationReference from './assets/instances/StoreBasedConfiguration - reference.json';

export {
  entityEntity,
  entityStoreBasedConfiguration,
  entityModelVersion,
  entityReport,
  instanceConfigurationReference,
  instanceModelVersionInitial,
  reportConfigurationList,
  reportEntityList,
  reportModelVersionList,
  reportReportList,
};
// const myDefaultExport = "Miroir-core default export"
export default {
  // myDefaultExport
}

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
  MiroirReport,
  MiroirReportDefinition
} from './0_interfaces/1_core/Report.js';
export {
  MiroirConfig
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
  DomainDataActionName,
  domainDataActionNamesArray,
  domainDataActionNamesObject,
  DomainControllerInterface,
  DomainDataAction,
  DomainModelAction,
  DomainModelActionName,
  domainModelActionNamesArray,
  domainModelActionNamesObject,
  DomainState,
  DomainStateReducer,
  DomainStateSelector,
  DomainStateTransformer,
  DomainInstancesUuidIndex,
  LocalCacheOnlyActionName,
  localCacheOnlyActionNamesArray,
  localCacheOnlyActionNamesObject,
  ModelActionName,
  ModelActionNamesArray,
  ModelActionNamesArrayString,
  ModelActionNamesObject,
  RemoteStoreActionName,
  remoteStoreActionNamesArray,
  remoteStoreActionNamesObject,
} from './0_interfaces/2_domain/DomainControllerInterface.js';
export {
  selectReportInstances,
  selectEntityInstances,
} from './2_domain/ReportDisplay';
export {
  DataControllerInterface
} from './0_interfaces/3_controllers/DataControllerInterface.js';
export {
  ErrorLogServiceInterface, MError
} from './0_interfaces/3_controllers/ErrorLogServiceInterface.js';
export {
  MiroirContextInterface
} from './0_interfaces/3_controllers/MiroirContextInterface';
export {
  LocalCacheAction,
  LocalCacheDataAction,
  LocalCacheInterface,
  LocalCacheInfo,
  LocalCacheModelAction,
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
export { DataController } from './3_controllers/DataController.js';
export { ErrorLogService } from './3_controllers/ErrorLogService.js';
export { throwExceptionIfError } from './3_controllers/ErrorUtils.js';
export { MiroirContext } from './3_controllers/MiroirContext.js';
export { RemoteDataStoreController } from './3_controllers/RemoteDataStoreController.js';
export {
  RestClient
} from './4_services/RestClient.js';
export {
  IndexedDbDataStore as IndexedDbServer,
} from './4_services/IndexedDbDataStore.js';
export {
  IndexedDb
} from './4_services/indexedDb.js';
export { miroirCoreStartup } from './startup.js';
export { stringTuple } from './tools.js';
export { entityEntity, entityReport, reportEntityList, reportReportList };

import entityEntity from './assets/entities/Entity.json';
import entityReport from './assets/entities/Report.json';
import reportEntityList from './assets/reports/entityList.json';
import reportReportList from './assets/reports/ReportList.json';

// const myDefaultExport = "Miroir-core default export"
export default {
  // myDefaultExport
}

export {
  EntityAttribute,
  EntityDefinition
} from './0_interfaces/1_core/EntityDefinition.js';
export {
  Instance,
  InstanceCollection,
  InstanceWithName
} from './0_interfaces/1_core/Instance.js';
export {
  MiroirReport,
  MiroirReportDefinition
} from './0_interfaces/1_core/Report.js';
export {
  CRUDActionName,
  CRUDActionNamesArray,
  CRUDActionNamesObject,
  DomainAction,
  DomainActionName,
  domainActionNamesArray,
  domainActionNamesObject,
  DomainControllerInterface,
  DomainState,
  DomainStateReducer,
  DomainStateSelector,
  DomainStateTransformer,
  DomainInstancesUuidIndex,
} from './0_interfaces/2_domain/DomainControllerInterface.js';
export {
  selectReportInstances
} from './2_domain/ReportDisplay';
export {
  DataControllerInterface
} from './0_interfaces/3_controllers/DataControllerInterface.js';
export {
  ErrorLogServiceInterface, MError
} from './0_interfaces/3_controllers/ErrorLogServiceInterface.js';
export {
  LocalCacheAction,
  LocalCacheInterface
} from './0_interfaces/4-services/localCache/LocalCacheInterface.js';
export {
  RemoteDataStoreInterface,
  RemoteStoreAction,
  RemoteStoreActionReturnType,
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
export { MiroirContext, MiroirContextInterface } from './3_controllers/MiroirContext.js';
export { RemoteDataStoreController } from './3_controllers/RemoteDataStoreController.js';
export {
  RestClient
} from './4_services/RestClient.js';
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

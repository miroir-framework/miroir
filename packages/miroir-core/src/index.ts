export {
  DomainActionInterface,
} from './0_interfaces/2_domain/instanceDomainInterface.js';

export {
  CRUDActionName,
  CRUDActionNamesArray,
  CRUDActionNamesObject,
  DomainAction,
  DomainActionName,
  domainActionNamesArray,
  domainActionNamesObject,
} from './0_interfaces/2_domain/DomainLanguageInterface.js';

export {
  EntityAttribute,
  EntityDefinition,
} from './0_interfaces/1_core/EntityDefinition.js';

export {
  Instance,
  InstanceCollection,
  InstanceWithName,
} from './0_interfaces/1_core/Instance.js';

export {
  MiroirReport,
  MiroirReportDefinition,
} from './0_interfaces/1_core/Report.js';

export {
  DataControllerInterface,
} from './0_interfaces/3_controllers/DataControllerInterface.js';

export {
  MError,
  ErrorLogServiceInterface,
} from './0_interfaces/3_controllers/ErrorLogServiceInterface.js';


export {
  LocalCacheAction,
  LocalStoreInterface,
} from './0_interfaces/4-services/localStore/LocalStoreInterface.js';

export {
  RemoteStoreAction,
  RemoteDataStoreInterface,
  RemoteStoreActionReturnType,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
} from './0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js';

export {
  RestClient
} from './4_services/RestClient.js';


export {ReportGetInstancesToDispay} from './1_core/Report.js';

export { DomainController } from './2_domain/DomainController'

export {throwExceptionIfError} from './3_controllers/ErrorUtils.js'

export {DataController as DataStoreController} from './3_controllers/DataController.js'

export {RemoteDataStoreController} from './3_controllers/RemoteDataStoreController.js'

export {ConfigurationService, PackageConfiguration} from './3_controllers/ConfigurationService.js'

export {MiroirContextInterface, MiroirContext} from './3_controllers/MiroirContext.js'

export {ErrorLogService} from './3_controllers/ErrorLogService.js'


export { stringTuple } from './tools.js'
export { miroirCoreStartup } from './startup.js'

import entityEntity from './assets/entities/Entity.json';
import entityReport from './assets/entities/Report.json';
import reportEntityList from './assets/reports/entityList.json';

export {entityEntity, entityReport, reportEntityList}
// const myDefaultExport = "Miroir-core default export"
export default {
  // myDefaultExport
}

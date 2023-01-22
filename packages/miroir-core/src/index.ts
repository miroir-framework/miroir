export {
  MInstanceDomainInputActionsI,
  MEntityDomainInputActionsI
} from './0_interfaces/2_domain/instanceDomainInterface.js';

export {
  EntityAttribute,
  EntityDefinition,
} from './0_interfaces/1_core/Entity.js';

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
  EntityDefinitionLocalStoreInputActionsI,
  InstanceLocalStoreInputActionsI,
  LocalStoreInterface,
  StoreReturnType,
} from './0_interfaces/4-services/localStore/LocalStoreInterface.js';

export {
  EntityDefinitionRemoteDataStoreInputActionsI,
  InstanceRemoteDataStoreInputActionsI,
  RemoteDataStoreInterface,
} from './0_interfaces/4-services/remoteStore/RemoteDataStoreInterface.js';

// export {Report};
// export {ReportGetInstancesToDispay} from './1_core/Report.js';

// export {
//   ReportGetInstancesToDispay
// } from './1_core/Report.js';
// export {default.ReportGetInstancesToDispay as ReportGetInstancesToDispay} from './1_core/Report.js';
// import stringTuple from './1_core/utils/utils.js';
// export * from './1_core/Report.js';
// export * from './1_core/utils/utils.js';

// import * as utils from './1_core/utils/utils.js';
// export {utils};


// import stringTuple from './1_core/utils/utils.js';

export {ReportGetInstancesToDispay} from './1_core/Report.js';
// import * as ReportGetInstancesToDispay from './1_core/Report.js';



// import Report from './1_core/Report.js';
// const ReportGetInstancesToDispay = Report.ReportGetInstancesToDispay;

// console.log("miroir-core ReportGetInstancesToDispay",ReportGetInstancesToDispay);

// export {
//   ReportGetInstancesToDispay
// };

export default {}

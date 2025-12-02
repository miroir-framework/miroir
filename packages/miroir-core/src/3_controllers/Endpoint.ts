import type { Uuid } from "../0_interfaces/1_core/EntityDefinition";
import { InstanceAction } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { EndpointInterfaceNOTUSED } from "../0_interfaces/3_controllers/EndpointInterface";
import { LocalCacheInterface } from "../0_interfaces/4-services/LocalCacheInterface";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface";
import { MiroirLoggerFactory } from "../4_services/MiroirLoggerFactory";
import { packageName } from "../constants";
import { cleanLevel } from "./constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Endpoint")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
const applicationEndpointV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ddd9c928-2ceb-4f67-971b-5898090412d6.json");
const deploymentEndpointV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json");
const instanceEndpointV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json");
const modelEndpointV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/7947ae40-eb34-4149-887b-15a9021e714e.json");
const domainEndpointVersionV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5.json"); //assert { type: "json" };
const testEndpointVersionV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a9139e2d-a714-4c9c-bdee-c104488e2eaa.json"); //assert { type: "json" };
const storeManagementEndpoint = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/bbd08cbb-79ff-4539-b91f-7a14f15ac55f.json"); //assert { type: "json" };
const instanceEndpointVersionV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/ed520de4-55a9-4550-ac50-b1b713b72a89.json"); //assert { type: "json" };
const undoRedoEndpointVersionV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/71c04f8e-c687-4ea7-9a19-bc98d796c389.json"); //assert { type: "json" };
const localCacheEndpointVersionV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9e404b3c-368c-40cb-be8b-e3c28550c25e.json"); //assert { type: "json" };
const queryEndpointVersionV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/0faae143-0d7b-4a8a-a950-4fc3df943bde.json"); //assert { type: "json" };
const persistenceEndpointVersionV1 = require("../assets/miroir_data/3d8da4d4-8f76-4bb4-9212-14869d81c00c/a93598b3-19b6-42e8-828c-f02042d212d4.json"); //assert { type: "json" };

export const coreEndpoints: Record<string, Endpoint> = {
  [applicationEndpointV1.uuid]: applicationEndpointV1,
  [deploymentEndpointV1.uuid]: deploymentEndpointV1,
  [instanceEndpointV1.uuid]: instanceEndpointV1,
  [modelEndpointV1.uuid]: modelEndpointV1,
  [domainEndpointVersionV1.uuid]: domainEndpointVersionV1,
  [testEndpointVersionV1.uuid]: testEndpointVersionV1,
  [storeManagementEndpoint.uuid]: storeManagementEndpoint,
  [instanceEndpointVersionV1.uuid]: instanceEndpointVersionV1,
  [undoRedoEndpointVersionV1.uuid]: undoRedoEndpointVersionV1,
  [localCacheEndpointVersionV1.uuid]: localCacheEndpointVersionV1,
  [queryEndpointVersionV1.uuid]: queryEndpointVersionV1,
  [persistenceEndpointVersionV1.uuid]: persistenceEndpointVersionV1,
};

export const coreEndpointsUuidList = Object.keys(coreEndpoints);

export const libraryEndpointUuid: Uuid = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";

// ################################################################################################
export class Endpoint implements EndpointInterfaceNOTUSED {
  constructor(private localCache: LocalCacheInterface) {

  }

  handleActionNOTUSED(action: InstanceAction): void {
    log.info("Endpoint.handleAction called", JSON.stringify(action, null, 2))
    // return this.localCache.handleEndpointAction(action);
    switch (action.actionType) {
      case "createInstance": {
        // this.localCache.createInstance(action.deploymentUuid, action.applicationSection, action.objects);
        // log.info("Endpoint.handleAction called", action)
        this.localCache.handleLocalCacheAction(action);
        break
      }
      case "getInstance": {
        // TODO
        break;
      }
      default:
        break;
    }
  }

  async handleAsyncActionNOTUSED(action: InstanceAction): Promise<void> {
    return Promise.resolve();
  }
}
// ################################################################################################
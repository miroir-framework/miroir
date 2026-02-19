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
import {
  applicationEndpointV1,
  storeManagementEndpoint as deploymentEndpointV1,
  instanceEndpointV1,
  modelEndpointV1,
  domainEndpointVersionV1,
  testEndpointVersionV1,
  storeManagementEndpoint,
  instanceEndpointVersionV1,
  undoRedoEndpointVersionV1,
  localCacheEndpointVersionV1,
  queryEndpointVersionV1,
  persistenceEndpointVersionV1,
} from "miroir-test-app_deployment-miroir";

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

// export const libraryEndpointUuid: Uuid = "212f2784-5b68-43b2-8ee0-89b1c6fdd0de";

// ################################################################################################
export class Endpoint implements EndpointInterfaceNOTUSED {
  constructor(private localCache: LocalCacheInterface) {

  }

  handleActionNOTUSED(action: InstanceAction): void {
    log.info("Endpoint.handleAction called", JSON.stringify(action, null, 2))
    // // return this.localCache.handleEndpointAction(action);
    // switch (action.actionType) {
    //   case "createInstance": {
    //     // this.localCache.createInstance(action.deploymentUuid, action.applicationSection, action.objects);
    //     // log.info("Endpoint.handleAction called", action)
    //     this.localCache.handleLocalCacheAction(action);
    //     break
    //   }
    //   case "getInstance": {
    //     // TODO
    //     break;
    //   }
    //   default:
    //     break;
    // }
  }

  async handleAsyncActionNOTUSED(action: InstanceAction): Promise<void> {
    return Promise.resolve();
  }
}
// ################################################################################################
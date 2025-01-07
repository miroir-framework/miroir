import { InstanceAction } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { EndpointInterface } from "../0_interfaces/3_controllers/EndpointInterface.js";
import { LocalCacheInterface } from "../0_interfaces/4-services/LocalCacheInterface.js";
import { LoggerInterface } from "../0_interfaces/4-services/LoggerInterface.js";
import { MiroirLoggerFactory } from "../4_services/LoggerFactory.js";
import { packageName } from "../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Endpoint")
).then((logger: LoggerInterface) => {log = logger});


export class Endpoint implements EndpointInterface {
  constructor(private localCache: LocalCacheInterface) {

  }

  handleAction(action: InstanceAction): void {
    log.info("Endpoint.handleAction called", JSON.stringify(action, null, 2))
    // return this.localCache.handleEndpointAction(action);
    switch (action.actionName) {
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

  async handleAsyncAction(action: InstanceAction): Promise<void> {
    return Promise.resolve();
  }
}
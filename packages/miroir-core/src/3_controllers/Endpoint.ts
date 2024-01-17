import { InstanceAction } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { EndpointInterface } from "../0_interfaces/3_controllers/EndpointInterface";
import { LocalCacheInterface } from "../0_interfaces/4-services/LocalCacheInterface";

export class Endpoint implements EndpointInterface {
  constructor(private localCache: LocalCacheInterface) {

  }

  handleAction(action: InstanceAction): void {
    // return this.localCache.handleEndpointAction(action);
    switch (action.actionName) {
      case "createInstance": {
        this.localCache.createInstance(action.deploymentUuid, action.applicationSection, action.objects);
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
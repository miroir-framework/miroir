import {
  RemoteStoreAction,
  RemoteStoreNetworkClientInterface,
  RestClientCallReturnType,
  RestClientInterface,
} from "miroir-core";
import miroirConfig from "miroir-fwk/assets/miroirConfig.json";

/**
 * Facade / decorator for restClient and GraphQL client.
 * Resolves a DomainAction into a network query, using the proper protocol / address.
 *
 */
export class RemoteStoreClient implements RemoteStoreNetworkClientInterface {
  // const entityEndpoint ={
  //   "Entity": "Entity"
  // }
  constructor(private restClient: RestClientInterface) {}

  // ##################################################################################
  handleNetworkAction(networkAction: RemoteStoreAction): Promise<RestClientCallReturnType> {
    //TODO: return type must be independent of actually called client
    console.log("RemoteStoreNetworkClient handleAction", networkAction);
    if (networkAction.actionName === "read") {
      return this.get(miroirConfig.rootApiUrl + "/" + networkAction.entityName + "/all");
    } else {
      throw new Error(
        "RemoteStoreNetworkClient handleNetworkAction does not know how to handle action in networkAction " +
          JSON.stringify(networkAction)
      );
    }
  }

  // ##################################################################################
  async get(endpoint: string, customConfig: any = {}): Promise<RestClientCallReturnType> {
    console.log("RemoteStoreClient get", endpoint);
    return this.restClient.get(endpoint, customConfig);
  }

  // ##################################################################################
  async post(endpoint: string, body: any, customConfig = {}): Promise<RestClientCallReturnType> {
    return this.restClient.post(endpoint, customConfig);
  }
}

export default RemoteStoreClient;

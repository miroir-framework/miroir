import { DomainAction, RemoteStoreClientInterface, RestClientCallReturnType, RestClientInterface } from "miroir-core";
import miroirConfig from "miroir-fwk/assets/miroirConfig.json";

/**
 * Facade / decorator for restClient and GraphQL client.
 * Resolves a DomainAction into a network query, using the proper protocol / address.
 * 
 */
export class RemoteStoreClient implements RestClientInterface, RemoteStoreClientInterface {
  // const entityEndpoint ={
  //   "Entity": "Entity" 
  // }
  constructor(
    private restClient: RestClientInterface,
  ) {
    
  }

  resolveAction(domainAction:DomainAction):Promise<RestClientCallReturnType>{
    //TODO: return type must be independent of actually called client
    console.log("RemoteStoreClient handleAction",domainAction);
    return this.get(miroirConfig.rootApiUrl + "/" +domainAction.entityName + '/all');
  }; 

  async get(endpoint:string, customConfig:any = {}): Promise<RestClientCallReturnType> {
    console.log("RemoteStoreClient get",endpoint);
    return this.restClient.get(endpoint,customConfig);
  }

  async post(endpoint:string, body:any, customConfig = {}): Promise<RestClientCallReturnType> {
    return this.restClient.post(endpoint,customConfig);
  }

}

export default RemoteStoreClient;
import {
  DataControllerInterface,
  DataController,
  DomainControllerInterface,
  DomainController, MiroirContext, RestClient, MiroirConfig
} from "miroir-core";
import {
  IndexedDbRestServer,
  RemoteStoreAccessReduxSaga,
  ReduxStore,
  RemoteStoreNetworkRestClient,
} from "miroir-redux";


export function createMswStore(
  miroirConfig:MiroirConfig,
  fetch:(input: RequestInfo | URL, init?: RequestInit)=> Promise<Response>,
  createWorkerFromHandlers:(...handlers)=>any
) {
  const mServer: IndexedDbRestServer = miroirConfig.serverConfig.emulateServer?new IndexedDbRestServer(miroirConfig.serverConfig.rootApiUrl):undefined;
  const worker = miroirConfig.serverConfig.emulateServer?createWorkerFromHandlers(...mServer.handlers):undefined;

  const client:RestClient = new RestClient(fetch);
  const remoteStoreNetworkRestClient = new RemoteStoreNetworkRestClient(miroirConfig.serverConfig.rootApiUrl, client);
  const instanceSagas: RemoteStoreAccessReduxSaga = new RemoteStoreAccessReduxSaga(miroirConfig.serverConfig.rootApiUrl, remoteStoreNetworkRestClient);

  const reduxStore:ReduxStore = new ReduxStore(instanceSagas);
  reduxStore.run();
  const miroirContext = new MiroirContext();

  const dataController: DataControllerInterface = new DataController(miroirContext, reduxStore, reduxStore);
  const domainController:DomainControllerInterface = new DomainController(dataController);

  
  return {mServer, worker, reduxStore, dataController, domainController, miroirContext}
}
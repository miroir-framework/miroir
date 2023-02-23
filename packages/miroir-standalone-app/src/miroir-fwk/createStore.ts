import {
  DataControllerInterface,
  DataController,
  DomainControllerInterface,
  DomainController, MiroirContext, RestClient
} from "miroir-core";
import {
  IndexedDbRestServer,
  RemoteStoreAccessReduxSaga,
  ReduxStore,
  RemoteStoreNetworkRestClient,
} from "miroir-redux";


export function createMswStore(
  rootApiUrl:string,
  fetch:(input: RequestInfo | URL, init?: RequestInit)=> Promise<Response>,
  createWorkerFromHandlers:(...handlers)=>any
) {
  const mServer: IndexedDbRestServer = new IndexedDbRestServer(rootApiUrl);
  // const worker = setupServer(...mServer.handlers);
  const worker = createWorkerFromHandlers(...mServer.handlers);

  const client:RestClient = new RestClient(fetch);
  const remoteStoreNetworkRestClient = new RemoteStoreNetworkRestClient(rootApiUrl, client);
  const instanceSagas: RemoteStoreAccessReduxSaga = new RemoteStoreAccessReduxSaga(rootApiUrl, remoteStoreNetworkRestClient);

  const reduxStore:ReduxStore = new ReduxStore(instanceSagas);
  reduxStore.run();
  const miroirContext = new MiroirContext();

  const dataController: DataControllerInterface = new DataController(miroirContext, reduxStore, reduxStore);
  const domainController:DomainControllerInterface = new DomainController(dataController);

  
  return {mServer, worker, reduxStore, dataController, domainController, miroirContext}
}
import {
  DataControllerInterface,
  DataStoreController,
  DomainActionInterface,
  DomainController, MiroirContext, RestClient
} from "miroir-core";
import {
  IndexedDbObjectStore,
  InstanceRemoteAccessReduxSaga,
  ReduxStore,
  RemoteStoreNetworkRestClient,
} from "miroir-redux";


export function createMswStore(
  rootApiUrl:string,
  fetch:(input: RequestInfo | URL, init?: RequestInit)=> Promise<Response>,
  createWorkerFromHandlers:(...handlers)=>any
) {
  const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(rootApiUrl);
  // const worker = setupServer(...mServer.handlers);
  const worker = createWorkerFromHandlers(...mServer.handlers);

  const client:RestClient = new RestClient(fetch);
  const remoteStoreNetworkRestClient = new RemoteStoreNetworkRestClient(rootApiUrl, client);
  const instanceSagas: InstanceRemoteAccessReduxSaga = new InstanceRemoteAccessReduxSaga(rootApiUrl, remoteStoreNetworkRestClient);

  const reduxStore:ReduxStore = new ReduxStore(instanceSagas);
  reduxStore.run();
  const miroirContext = new MiroirContext();

  const dataController: DataControllerInterface = new DataStoreController(miroirContext, reduxStore, reduxStore);
  const domainController:DomainActionInterface = new DomainController(dataController);

  
  return {mServer, worker, reduxStore, dataController, domainController, miroirContext}
}
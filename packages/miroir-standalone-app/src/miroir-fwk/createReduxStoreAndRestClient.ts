import {
  DomainController,
  DomainControllerInterface,
  MiroirConfig,
  MiroirContext,
  RestClient
} from "miroir-core";
import {
  ReduxStore,
  RemoteStoreAccessReduxSaga,
  RemoteStoreNetworkRestClient,
} from "miroir-redux";

  // #############################################################################################
  export function createReduxStoreAndRestClient(
  miroirConfig: MiroirConfig,
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
):{
  miroirContext:MiroirContext,
  reduxStore: ReduxStore,
  domainController: DomainControllerInterface,
} {
  const miroirContext = new MiroirContext();

  const rootApiUrl: string = miroirConfig.emulateServer ? miroirConfig.rootApiUrl : miroirConfig["serverConfig"].rootApiUrl;
    
  const client: RestClient = new RestClient(fetch);
  const remoteStoreNetworkRestClient = new RemoteStoreNetworkRestClient(
    // rootApiUrl,
    miroirConfig.emulateServer ? miroirConfig.rootApiUrl : miroirConfig["serverConfig"].rootApiUrl,
    client
  );

  const instanceSagas: RemoteStoreAccessReduxSaga = new RemoteStoreAccessReduxSaga(
    remoteStoreNetworkRestClient
  );

  const reduxStore: ReduxStore = new ReduxStore(instanceSagas);
  reduxStore.run();

  const domainController: DomainControllerInterface = new DomainController(
    miroirContext,
    reduxStore, // implements LocalCacheInterface
    reduxStore, // implements RemoteDataStoreInterface
  );

  return {miroirContext, reduxStore,  domainController}
  
}
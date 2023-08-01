import { RequestHandler, SetupWorkerApi } from "msw";
import { SetupServerApi } from "msw/node";
import process from "process";

import {
  DomainController,
  DomainControllerInterface,
  LocalAndRemoteController,
  LocalAndRemoteControllerInterface,
  MiroirConfig,
  MiroirContext,
  RestClient,
  RestServerStub,
  IStoreController
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
  localAndRemoteController:LocalAndRemoteControllerInterface,
  domainController: DomainControllerInterface,
} {
  const miroirContext = new MiroirContext();

  const rootApiUrl: string = miroirConfig.emulateServer ? miroirConfig.rootApiUrl : miroirConfig["serverConfig"].rootApiUrl;
    
  const client: RestClient = new RestClient(fetch);
  const remoteStoreNetworkRestClient = new RemoteStoreNetworkRestClient(
    miroirConfig.emulateServer ? miroirConfig.rootApiUrl : miroirConfig["serverConfig"].rootApiUrl,
    client
  );

  const instanceSagas: RemoteStoreAccessReduxSaga = new RemoteStoreAccessReduxSaga(
    rootApiUrl,
    remoteStoreNetworkRestClient
  );

  const reduxStore: ReduxStore = new ReduxStore(instanceSagas);
  reduxStore.run();

  const localAndRemoteController: LocalAndRemoteControllerInterface = new LocalAndRemoteController(
    miroirContext,
    reduxStore, // implements LocalCacheInterface
    reduxStore, // implements RemoteDataStoreInterface
  );
  const domainController: DomainControllerInterface = new DomainController(localAndRemoteController);

  return {miroirContext, reduxStore, localAndRemoteController,domainController}
  
}
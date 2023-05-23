import { detect } from "detect-browser";
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
  StoreControllerInterface
} from "miroir-core";
import {
  ReduxStore,
  RemoteStoreAccessReduxSaga,
  RemoteStoreNetworkRestClient,
} from "miroir-redux";

const browserInfo = detect();
console.log('browserInfo',browserInfo);

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
    reduxStore,
    reduxStore
  );
  const domainController: DomainControllerInterface = new DomainController(localAndRemoteController);

  return {miroirContext, reduxStore, localAndRemoteController,domainController}
  
}

export interface CreateMswRestServerReturnType {
  // localMiroirStoreController: StoreControllerInterface | undefined,
  // localAppStoreController: StoreControllerInterface | undefined,
  localDataStoreWorker: SetupWorkerApi | undefined,
  localDataStoreServer: SetupServerApi | undefined,
}
export async function createMswRestServer(
  miroirConfig: MiroirConfig,
  platformType: "browser" | "nodejs",
  localMiroirStoreController: StoreControllerInterface,
  localAppStoreController: StoreControllerInterface,
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any
):Promise<CreateMswRestServerReturnType>  {
  console.log("createMswRestServer", "platformType", platformType, "miroirConfig", miroirConfig);
  console.log("createMswRestServer process.browser", process["browser"]);

  if (miroirConfig.emulateServer) {
    // create server query interceptor. Scope is extruded because interceptor needs to be started / stopped
    console.warn("createMswRestServer emulating server on", miroirConfig.rootApiUrl);
    const restServerStub: RestServerStub = new RestServerStub(miroirConfig.rootApiUrl, localMiroirStoreController, localAppStoreController);

    let localDataStoreWorker: SetupWorkerApi | undefined = undefined;
    let localDataStoreServer: SetupServerApi | undefined = undefined;
    if (platformType == "browser") {
      localDataStoreWorker = createRestServiceFromHandlers(...restServerStub.handlers);
    }
    if (platformType == "nodejs") {
      localDataStoreServer = createRestServiceFromHandlers(...restServerStub.handlers);
    }

    return Promise.resolve({
      localDataStoreWorker,
      localDataStoreServer,
    });
  } else {
    console.warn("createMswRestServer non-emulated server will be queried on", miroirConfig["serverConfig"].rootApiUrl);
    return Promise.resolve({
      localMiroirStoreController: undefined,
      localAppStoreController: undefined,
      localDataStoreWorker: undefined,
      localDataStoreServer: undefined,
    });
  }
}

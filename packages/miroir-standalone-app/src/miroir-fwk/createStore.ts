import { RequestHandler, SetupWorkerApi } from "msw";
import { SetupServerApi } from "msw/node";
import { detect } from "detect-browser";
import process from "process";

import {
  LocalAndRemoteControllerInterface,
  LocalAndRemoteController,
  DomainControllerInterface,
  DomainController,
  MiroirContext,
  RestClient,
  MiroirConfig,
  DataStoreInterface,
  IndexedDb,
  IndexedDbDataStore,
} from "miroir-core";
import { createServer } from "miroir-datastore-postgres";
import {
  RestServerStub,
  RemoteStoreAccessReduxSaga,
  ReduxStore,
  RemoteStoreNetworkRestClient,
} from "miroir-redux";

const browserInfo = detect();
console.log('browserInfo',browserInfo);

export function createReduxStore(
  // emulateServer:boolean,
  rootApiUrl: string,
  remoteStoreNetworkRestClient: RemoteStoreNetworkRestClient,
  miroirContext:MiroirContext,
) {
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

  return {reduxStore,localAndRemoteController,domainController}
  
}
export async function createMswStore(
  miroirConfig: MiroirConfig,
  platformType: 'browser' | 'nodejs',
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any,
  // createServerFromHandlers: (...handlers: Array<RequestHandler>) => SetupServerApi
) {
  console.log('createMswStore','platformType',platformType,'miroirConfig',miroirConfig);
  console.log('createMswStore process.browser',process['browser']);
  

  const client: RestClient = new RestClient(fetch);
  const remoteStoreNetworkRestClient = new RemoteStoreNetworkRestClient(miroirConfig.emulateServer?miroirConfig.rootApiUrl:miroirConfig['serverConfig'].rootApiUrl, client);

  const miroirContext = new MiroirContext();
  const {reduxStore,localAndRemoteController,domainController} = createReduxStore(
    miroirConfig.emulateServer?miroirConfig.rootApiUrl:miroirConfig['serverConfig'].rootApiUrl,
    remoteStoreNetworkRestClient,
    miroirContext
  )

  if (miroirConfig.emulateServer) { // create server query interceptor. Scope is extruded because interceptor needs to be started / stopped
    console.warn('createMswStore emulating server on',miroirConfig.rootApiUrl);
    if (miroirConfig.emulatedServerConfig.emulatedServerType == 'indexedDb') {
      const localUuidIndexedDb: IndexedDb = new IndexedDb(miroirConfig.emulatedServerConfig.indexedDbName);
      const localDataStore: DataStoreInterface = new IndexedDbDataStore(localUuidIndexedDb);
      // const restServerStub: RestServerStub = new RestServerStub(miroirConfig.rootApiUrl,miroirConfig.emulatedServerConfig.indexedDbName,localUuidIndexedDb,localDataStore);
      const restServerStub: RestServerStub = new RestServerStub(miroirConfig.rootApiUrl,localDataStore);
      
      let localDataStoreWorker:SetupWorkerApi = undefined;
      let localDataStoreServer:SetupServerApi = undefined;
      if (platformType == 'browser') {localDataStoreWorker = createRestServiceFromHandlers(...restServerStub.handlers);}
      if (platformType == 'nodejs') {localDataStoreServer = createRestServiceFromHandlers(...restServerStub.handlers);}
  
      return { localDataStore, localDataStoreWorker, localDataStoreServer, reduxStore, localAndRemoteController, domainController, miroirContext };
    } else {
      // if (browserInfo.type == 'browser') {
      // if (platformType == 'browser') {
        
      if (process['browser']) {
        console.error('createMswStore cannot connect browser directly to database, please use local indexed DB instead, or access database through a REST server');
        return { localDataStore: undefined, localDataStoreWorker:undefined, localDataStoreServer:undefined, reduxStore, localAndRemoteController, domainController, miroirContext };
      } else {
        console.warn('createMswStore loading miroir-datastore-postgres!',process['browser']);
        // const lib = await import("miroir-datastore-postgres");
        // const createServer = lib.createServer;
        const localDataStore: DataStoreInterface = await createServer(miroirConfig.emulatedServerConfig.connectionString);
        const restServerStub: RestServerStub = new RestServerStub(miroirConfig.rootApiUrl,localDataStore);
  
        let localDataStoreWorker:SetupWorkerApi = undefined;
        let localDataStoreServer:SetupServerApi = undefined;
        localDataStoreServer = createRestServiceFromHandlers(...restServerStub.handlers);

        return { localDataStore, localDataStoreWorker:undefined, localDataStoreServer, reduxStore, localAndRemoteController, domainController, miroirContext };
        // return { localDataStore: undefined, localDataStoreWorker:undefined, localDataStoreServer:undefined, reduxStore, localAndRemoteController, domainController, miroirContext };
      }
    }
  } else {
    console.warn('createMswStore server will be queried on',miroirConfig['serverConfig'].rootApiUrl);
    return { localDataStore: undefined, localDataStoreWorker:undefined, localDataStoreServer:undefined, reduxStore, localAndRemoteController, domainController, miroirContext };
  }


}

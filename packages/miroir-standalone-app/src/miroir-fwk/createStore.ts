import { RequestHandler, SetupWorkerApi } from "msw";
import { SetupServerApi } from "msw/node";
import { detect } from "detect-browser";
import process from "process";

import {
  DomainControllerInterface,
  DomainController,
  StoreFacadeInterface,
  IndexedDb,
  IndexedDbDataStore,
  LocalAndRemoteControllerInterface,
  LocalAndRemoteController,
  MiroirContext,
  MiroirConfig,
  RestClient,
  RestServerStub,
} from "miroir-core";
import { createSqlServerProxy } from "miroir-datastore-postgres";
import {
  RemoteStoreAccessReduxSaga,
  ReduxStore,
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
  localMiroirDataStore: StoreFacadeInterface | undefined,
  localAppDataStore: StoreFacadeInterface | undefined,
  localDataStoreWorker: SetupWorkerApi | undefined,
  localDataStoreServer: SetupServerApi | undefined,
}
export async function createMswRestServer(
  miroirConfig: MiroirConfig,
  platformType: "browser" | "nodejs",
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any
):Promise<CreateMswRestServerReturnType>  {
  console.log("createMswRestServer", "platformType", platformType, "miroirConfig", miroirConfig);
  console.log("createMswRestServer process.browser", process["browser"]);

  if (miroirConfig.emulateServer) {
    // create server query interceptor. Scope is extruded because interceptor needs to be started / stopped
    console.warn("createMswRestServer emulating server on", miroirConfig.rootApiUrl);
    if (miroirConfig.miroirServerConfig.model.emulatedServerType == "indexedDb" && miroirConfig.appServerConfig.model.emulatedServerType == "indexedDb") {
      // TODO: allow mixed mode? (indexedDb / sqlDb emulated miroir/app servers)
      // const localUuidIndexedDb: IndexedDb = new IndexedDb(miroirConfig.ServerConfig.indexedDbName);
      const localMiroirDataStore: StoreFacadeInterface = new IndexedDbDataStore('miroir', 'miroir',new IndexedDb(miroirConfig.miroirServerConfig.model.indexedDbName));
      const localAppDataStore: StoreFacadeInterface = new IndexedDbDataStore('library', 'app', new IndexedDb(miroirConfig.appServerConfig.model.indexedDbName));
      const restServerStub: RestServerStub = new RestServerStub(miroirConfig.rootApiUrl, localMiroirDataStore, localAppDataStore);

      let localDataStoreWorker: SetupWorkerApi | undefined = undefined;
      let localDataStoreServer: SetupServerApi | undefined = undefined;
      if (platformType == "browser") {
        localDataStoreWorker = createRestServiceFromHandlers(...restServerStub.handlers);
      }
      if (platformType == "nodejs") {
        localDataStoreServer = createRestServiceFromHandlers(...restServerStub.handlers);
      }

      return Promise.resolve({
        localMiroirDataStore,
        localAppDataStore,
        localDataStoreWorker,
        localDataStoreServer,
      });
    } else {
      if (process["browser"]) {
        console.error(
          "createMswRestServer cannot connect browser directly to database, please use local indexed DB instead, or access database through a REST server"
        );
        return Promise.resolve({
          localMiroirDataStore: undefined,
          localAppDataStore: undefined,
          localDataStoreWorker: undefined,
          localDataStoreServer: undefined,
        });
      } else {
        if (miroirConfig.miroirServerConfig.model.emulatedServerType == "Sql" && miroirConfig.appServerConfig.model.emulatedServerType == "Sql") {
          console.warn("createMswRestServer loading miroir-datastore-postgres!", process["browser"]);
          console.log("createMswRestServer sql mirroir datastore schema", miroirConfig.miroirServerConfig.model.schema,'library datastore schema',miroirConfig.appServerConfig.model.schema);
          const localMiroirDataStore: StoreFacadeInterface = await createSqlServerProxy(
            'miroir',
            'miroir',
            miroirConfig.miroirServerConfig.model.connectionString,
            miroirConfig.miroirServerConfig.model.schema,
            miroirConfig.miroirServerConfig.model.connectionString,
            miroirConfig.miroirServerConfig.model.schema,
          );
          const localAppDataStore: StoreFacadeInterface = await createSqlServerProxy(
            'library',
            'app',
            miroirConfig.appServerConfig.model.connectionString,
            miroirConfig.appServerConfig.model.schema,
            miroirConfig.appServerConfig.model.connectionString,
            miroirConfig.appServerConfig.model.schema,
          );

          const restServerStub: RestServerStub = new RestServerStub(miroirConfig.rootApiUrl, localMiroirDataStore, localAppDataStore);

          let localDataStoreServer: SetupServerApi | undefined = undefined;
          localDataStoreServer = createRestServiceFromHandlers(...restServerStub.handlers);

          return Promise.resolve({
            localMiroirDataStore,
            localAppDataStore,
            localDataStoreWorker: undefined,
            localDataStoreServer,
          });
        } else {
          console.warn("createMswRestServer mixed mode not allowed!");
          return Promise.resolve({
            localMiroirDataStore: undefined,
            localAppDataStore: undefined,
            localDataStoreWorker: undefined,
            localDataStoreServer: undefined,
          });
        }
      }
    }
  } else {
    console.warn("createMswRestServer non-emulated server will be queried on", miroirConfig["serverConfig"].rootApiUrl);
    return Promise.resolve({
      localMiroirDataStore: undefined,
      localAppDataStore: undefined,
      localDataStoreWorker: undefined,
      localDataStoreServer: undefined,
    });
  }
}

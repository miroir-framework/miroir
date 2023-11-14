import {
  DomainController,
  DomainControllerInterface,
  LoggerInterface,
  MiroirConfig,
  MiroirContext,
  MiroirLoggerFactory,
  RestClient,
  getLoggerName
} from "miroir-core";

import { packageName } from "../constants";
import { cleanLevel } from "./constants";
import { RemoteStoreRestAccessReduxSaga } from "../4_services/remoteStore/RemoteStoreRestAccessSaga";
import { ReduxStore } from "./ReduxStore";
import RemoteStoreNetworkRestClient from "./remoteStore/RemoteStoreNetworkRestClient";


const loggerName: string = getLoggerName(packageName, cleanLevel,"createReduxStoreAndRestClient");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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

  const instanceSagas: RemoteStoreRestAccessReduxSaga = new RemoteStoreRestAccessReduxSaga(
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
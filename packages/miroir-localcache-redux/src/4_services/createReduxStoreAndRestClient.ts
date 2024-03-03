import {
  LoggerInterface,
  MiroirConfigClient,
  MiroirContext,
  MiroirLoggerFactory,
  RestClient,
  getLoggerName
} from "miroir-core";

import { PersistenceReduxSaga } from "./persistence/PersistenceActionReduxSaga";
import { packageName } from "../constants";
import { ReduxStore } from "./ReduxStore";
import { cleanLevel } from "./constants";
import RemoteStoreNetworkRestClient from "./persistence/PersistenceRestClient";


const loggerName: string = getLoggerName(packageName, cleanLevel,"createReduxStoreAndRestClient");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// #############################################################################################
export function createReduxStoreAndRestClient(
  miroirConfig: MiroirConfigClient,
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
):{
  miroirContext:MiroirContext,
  reduxStore: ReduxStore,
  // domainController: DomainControllerInterface,
} {
  const miroirContext = new MiroirContext(miroirConfig);

    
  const client: RestClient = new RestClient(fetch);
  const remoteStoreNetworkRestClient = new RemoteStoreNetworkRestClient(
    miroirConfig.client.emulateServer ? miroirConfig.client.rootApiUrl : miroirConfig.client["serverConfig"].rootApiUrl,
    client
  );

  const instanceSagas: PersistenceReduxSaga = new PersistenceReduxSaga(
    remoteStoreNetworkRestClient
  );

  const reduxStore: ReduxStore = new ReduxStore(instanceSagas);
  reduxStore.run();


  return { miroirContext, reduxStore }
  
}
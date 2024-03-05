import {
  LoggerInterface,
  MiroirLoggerFactory,
  RestClient,
  PersistenceStoreControllerManagerInterface,
  getLoggerName
} from "miroir-core";

import { packageName } from "../constants";
import { LocalCache } from "./LocalCache";
import { cleanLevel } from "./constants";
import { PersistenceReduxSaga } from "./persistence/PersistenceReduxSaga";
import RestPersistenceClientAndRestClient from "./persistence/RestPersistenceClientAndRestClient";


const loggerName: string = getLoggerName(packageName, cleanLevel,"createReduxStoreAndPersistenceClient");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// #############################################################################################
export function createReduxStoreAndPersistenceClient(
  rootApiUrl: string,
  fetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  persistenceStoreControllerManager?: PersistenceStoreControllerManagerInterface
):{
  localCache: LocalCache,
} {
  const client: RestClient = new RestClient(fetch);
  const persistenceClientAndRestClient = new RestPersistenceClientAndRestClient(rootApiUrl, client);

  // let instanceSagas: PersistenceReduxSaga
  // if (persistenceStoreControllerManager) {
  //   instanceSagas = new PersistenceReduxSaga(
  //     undefined,
  //     persistenceStoreControllerManager
  //   );
  // } else {
  //   instanceSagas = new PersistenceReduxSaga(
  //     persistenceClientAndRestClient
  //   );
  // }

  // const localCache: LocalCache = new LocalCache(instanceSagas);
  const localCache: LocalCache = new LocalCache();
  // localCache.run();


  return { localCache }
  
}
import {
  LoggerInterface,
  MiroirLoggerFactory,
  RestClient,
  StoreControllerManagerInterface,
  getLoggerName
} from "miroir-core";

import { packageName } from "../constants";
import { ReduxStore } from "./ReduxStore";
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
  storeControllerManager?: StoreControllerManagerInterface
):{
  reduxStore: ReduxStore,
} {
  const client: RestClient = new RestClient(fetch);
  const persistenceClientAndRestClient = new RestPersistenceClientAndRestClient(rootApiUrl, client);

  // let instanceSagas: PersistenceReduxSaga
  // if (storeControllerManager) {
  //   instanceSagas = new PersistenceReduxSaga(
  //     undefined,
  //     storeControllerManager
  //   );
  // } else {
  //   instanceSagas = new PersistenceReduxSaga(
  //     persistenceClientAndRestClient
  //   );
  // }

  // const reduxStore: ReduxStore = new ReduxStore(instanceSagas);
  const reduxStore: ReduxStore = new ReduxStore();
  // reduxStore.run();


  return { reduxStore }
  
}
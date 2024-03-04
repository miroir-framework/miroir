import {
  LoggerInterface,
  MiroirLoggerFactory,
  RestClient,
  getLoggerName
} from "miroir-core";

import { packageName } from "../constants";
import { ReduxStore } from "./ReduxStore";
import { cleanLevel } from "./constants";
import { PersistenceReduxSaga } from "./persistence/PersistenceActionReduxSaga";
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
):{
  reduxStore: ReduxStore,
} {
  const client: RestClient = new RestClient(fetch);
  const persistenceClientAndRestClient = new RestPersistenceClientAndRestClient(rootApiUrl, client);

  const instanceSagas: PersistenceReduxSaga = new PersistenceReduxSaga(
    persistenceClientAndRestClient
  );

  const reduxStore: ReduxStore = new ReduxStore(instanceSagas);
  reduxStore.run();


  return { reduxStore }
  
}
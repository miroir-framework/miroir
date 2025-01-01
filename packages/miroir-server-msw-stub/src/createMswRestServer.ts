import { RequestHandler } from "msw";
import { SetupWorkerApi } from "msw/browser";
import process from "process";

import {
  LoggerInterface,
  MiroirConfigClient,
  MiroirLoggerFactory,
  RestServiceHandler,
  PersistenceStoreControllerManagerInterface,
  getLoggerName,
  LocalCacheInterface,
  DomainControllerInterface
} from "miroir-core";

import { RestMswServerStub } from "./RestMswServerStub.js";
import { cleanLevel, packageName } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"createMswRestServer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

// TODO: MOVE TO miroir-server-msw-stub
// ################################################################################################
export interface CreateMswRestServerReturnType {
  localDataStoreWorker: SetupWorkerApi | undefined,
  localDataStoreServer: any /**SetupServerApi*/ | undefined,
}

// ################################################################################################
export async function createMswRestServer(
  miroirConfig: MiroirConfigClient,
  platformType: "browser" | "nodejs",
  restServerHandlers: RestServiceHandler[],
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any
):Promise<CreateMswRestServerReturnType>  {
  log.info("createMswRestServer", "platformType", platformType, "miroirConfig", miroirConfig);
  log.info("createMswRestServer process.browser", (process as any)["browser"]);

  if (miroirConfig.client.emulateServer) {

    // const restServerStub: RestMswServerStub = new RestMswServerStub(
    //   miroirConfig.client.rootApiUrl,
    //   restServerHandlers,
    //   persistenceStoreControllerManager,
    //   domainController,
    //   miroirConfig,
    // );
    // log.warn("######################### createMswRestServer handling operations", restServerHandlers);

    // let localDataStoreWorker: SetupWorkerApi | undefined = undefined;
    // let localDataStoreServer: any /*SetupServerApi*/ | undefined = undefined;
    // if (platformType == "browser") {
    //   localDataStoreWorker = createRestServiceFromHandlers(...restServerStub.handlers);
    // }
    // if (platformType == "nodejs") {
    //   localDataStoreServer = createRestServiceFromHandlers(...restServerStub.handlers);
    // }

    // return Promise.resolve({
    //   localDataStoreWorker,
    //   localDataStoreServer,
    // });
    return Promise.resolve({
      localDataStoreWorker: undefined,
      localDataStoreServer: undefined,
    });
  } else {
    // log.warn("createMswRestServer non-emulated server will be queried on", miroirConfig.client.serverConfig.rootApiUrl);
    throw new Error("createMswRestServer called for non-emulated server, this is a bug." + JSON.stringify(miroirConfig));
    // return Promise.resolve({
    //   localMiroirPersistenceStoreController: undefined,
    //   localAppPersistenceStoreController: undefined,
    //   localDataStoreWorker: undefined,
    //   localDataStoreServer: undefined,
    // });
  }
}

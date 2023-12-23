import { RequestHandler } from "msw";
import { SetupWorkerApi } from "msw/browser";
import process from "process";

import {
  IStoreController,
  LoggerInterface,
  MiroirConfigClient,
  MiroirLoggerFactory,
  RestServiceHandler,
  StoreControllerManagerInterface,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  getLoggerName,
} from "miroir-core";

import { packageName, cleanLevel } from "./constants";
import { RestServerStub } from "./RestServerStub";

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
  storeControllerManager: StoreControllerManagerInterface,
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any
):Promise<CreateMswRestServerReturnType>  {
  log.log("createMswRestServer", "platformType", platformType, "miroirConfig", miroirConfig);
  log.log("createMswRestServer process.browser", (process as any)["browser"]);

  if (miroirConfig.client.emulateServer) {

    const restServerStub: RestServerStub = new RestServerStub(
      miroirConfig.client.rootApiUrl,
      restServerHandlers,
      storeControllerManager,
      miroirConfig,
    );
    log.warn("######################### createMswRestServer handling operations", restServerHandlers);

    let localDataStoreWorker: SetupWorkerApi | undefined = undefined;
    let localDataStoreServer: any /*SetupServerApi*/ | undefined = undefined;
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
    log.warn("createMswRestServer non-emulated server will be queried on", miroirConfig.client.serverConfig.rootApiUrl);
    return Promise.resolve({
      localMiroirStoreController: undefined,
      localAppStoreController: undefined,
      localDataStoreWorker: undefined,
      localDataStoreServer: undefined,
    });
  }
}

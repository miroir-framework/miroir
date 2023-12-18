import { RequestHandler } from "msw";
import { SetupWorkerApi } from "msw/browser";
import process from "process";

import {
  IStoreController,
  LoggerInterface,
  MiroirConfig,
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
  localMiroirStoreController: IStoreController | undefined,
  localAppStoreController: IStoreController | undefined,
  localDataStoreWorker: SetupWorkerApi | undefined,
  localDataStoreServer: any /**SetupServerApi*/ | undefined,
}

// ################################################################################################
export async function createMswRestServer(
  miroirConfig: MiroirConfig,
  platformType: "browser" | "nodejs",
  restServerHandlers: RestServiceHandler[],
  storeControllerManager: StoreControllerManagerInterface,
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any
):Promise<CreateMswRestServerReturnType>  {
  log.log("createMswRestServer", "platformType", platformType, "miroirConfig", miroirConfig);
  log.log("createMswRestServer process.browser", (process as any)["browser"]);

  if (miroirConfig.emulateServer) {
    // create server query interceptor. Scope is extruded because interceptor needs to be started / stopped
    log.warn("######################### createMswRestServer emulating server on", miroirConfig.rootApiUrl, "##########################################");
    const localMiroirStoreController = storeControllerManager.getStoreController(applicationDeploymentMiroir.uuid);
    const localAppStoreController = storeControllerManager.getStoreController(applicationDeploymentLibrary.uuid);
    if (!localMiroirStoreController || !localAppStoreController) {
      throw new Error("could not find controller:" + localMiroirStoreController + " " + localAppStoreController);
    } 

    const restServerStub: RestServerStub = new RestServerStub(
      miroirConfig.rootApiUrl,
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
      localMiroirStoreController,
      localAppStoreController,
      localDataStoreWorker,
      localDataStoreServer,
    });
  } else {
    log.warn("createMswRestServer non-emulated server will be queried on", miroirConfig["serverConfig"].rootApiUrl);
    return Promise.resolve({
      localMiroirStoreController: undefined,
      localAppStoreController: undefined,
      localDataStoreWorker: undefined,
      localDataStoreServer: undefined,
    });
  }
}

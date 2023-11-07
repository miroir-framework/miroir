import { RequestHandler } from "msw";
import { SetupWorkerApi } from "msw/browser";
// import { SetupServerApi } from "msw/lib/node";
import process from "process";

import {
  IStoreController,
  MiroirConfig,
} from "miroir-core";
import { RestServerStub } from "miroir-server-msw-stub";

// ################################################################################################
export interface CreateMswRestServerReturnType {
  localDataStoreWorker: SetupWorkerApi | undefined,
  localDataStoreServer: any /**SetupServerApi*/ | undefined,
}

// ################################################################################################
export async function createMswRestServer(
  miroirConfig: MiroirConfig,
  platformType: "browser" | "nodejs",
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any
):Promise<CreateMswRestServerReturnType>  {
  console.log("createMswRestServer", "platformType", platformType, "miroirConfig", miroirConfig);
  console.log("createMswRestServer process.browser", (process as any)["browser"]);

  if (miroirConfig.emulateServer) {
    // create server query interceptor. Scope is extruded because interceptor needs to be started / stopped
    console.warn("######################### createMswRestServer emulating server on", miroirConfig.rootApiUrl, "##########################################");
    const restServerStub: RestServerStub = new RestServerStub(miroirConfig.rootApiUrl, localMiroirStoreController, localAppStoreController);

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
    console.warn("createMswRestServer non-emulated server will be queried on", miroirConfig["serverConfig"].rootApiUrl);
    return Promise.resolve({
      localMiroirStoreController: undefined,
      localAppStoreController: undefined,
      localDataStoreWorker: undefined,
      localDataStoreServer: undefined,
    });
  }
}

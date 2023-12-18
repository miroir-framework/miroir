import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { RequestHandler } from 'msw';
import { SetupWorkerApi } from 'msw/browser';
import { SetupServerApi, setupServer } from 'msw/node';
import * as React from 'react';
import { FC, PropsWithChildren, createContext, useState } from 'react';
import { Provider } from 'react-redux';
// import { SetupServerApi } from 'msw/lib/node';

// As a basic setup, import your same slice reducers
import {
  ConfigurationService,
  DomainController,
  DomainControllerInterface,
  Endpoint,
  IStoreController,
  LoggerInterface,
  MiroirConfig,
  MiroirContext,
  MiroirLoggerFactory,
  StoreControllerManager,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  applicationLibrary,
  applicationMiroir,
  applicationModelBranchLibraryMasterBranch,
  applicationModelBranchMiroirMasterBranch,
  applicationStoreBasedConfigurationLibrary,
  applicationStoreBasedConfigurationMiroir,
  applicationVersionInitialMiroirVersion,
  applicationVersionLibraryInitialVersion,
  createStoreControllers,
  defaultMiroirMetaModel,
  getLoggerName,
  resetAndInitMiroirAndApplicationDatabase,
  restServerDefaultHandlers,
  startLocalStoreControllers
} from "miroir-core";
import { ReduxStore, ReduxStoreWithUndoRedo, createReduxStoreAndRestClient } from 'miroir-localcache-redux';
import { CreateMswRestServerReturnType, createMswRestServer } from 'miroir-server-msw-stub';
import path from 'path';
import { packageName } from '../../src/constants';
import { cleanLevel } from '../../src/miroir-fwk/4_view/constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"tests-utils");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

export interface BeforeAllReturnType {
  reduxStore: ReduxStore,
  miroirContext: MiroirContext,
  domainController: DomainControllerInterface,
  localMiroirStoreController: IStoreController | undefined,
  localAppStoreController: IStoreController | undefined,
  localDataStoreWorker: SetupWorkerApi | undefined,
  localDataStoreServer: any /**SetupServerApi*/ | undefined,
}


// ################################################################################################
export interface MiroirIntegrationTestEnvironment {
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  localDataStoreWorker?: SetupWorkerApi,
  localDataStoreServer?: any /**SetupServerApi*/,
  reduxStore: ReduxStore,
  domainController: DomainControllerInterface,
  miroirContext: MiroirContext,
}


// ################################################################################################
// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  store: ReduxStoreWithUndoRedo | undefined,
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    store,
    ...renderOptions
  }: ExtendedRenderOptions
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return store?<Provider store={store}>{children}</Provider>:<div>{children}</div>
  }

  // Return an object with the store and all of RTL's query functions
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export class LoadingStateInterface {
  loaded: boolean;
  step: number;
}

const loadingStateContext = createContext<{loadingStateService:LoadingStateInterface}>({loadingStateService:{loaded:false,step:0}});

export const DisplayLoadingInfo:FC<{reportUuid?:string}> = (props:{reportUuid?:string}) => {
  const [step,setStep] = useState(0);
  const [loaded,setLoaded] = useState(false);
  return (
    <div>
      <button onClick={()=>setStep(step+1)} name={'next step '+props.reportUuid  + ' step=' + step} role='button'>{'next step '+props.reportUuid + ' step=' + step}</button>
      <span role={"step:" + step}>loaded step:{step}</span>
      <span>loaded:{loaded ? "finished" : "not"}</span>
    </div>
  );
}


// ############################################################################################################
// ############################################################################################################
// ############################################################################################################
// ############################################################################################################
// ############################################################################################################
// ############################################################################################################
// ############################################################################################################
export async function miroirIntegrationTestEnvironmentFactory(miroirConfig: MiroirConfig) {
  let result:MiroirIntegrationTestEnvironment = {} as MiroirIntegrationTestEnvironment;

    // Establish requests interception layer before all tests.
    const wrapped = await miroirBeforeAll(
      miroirConfig as MiroirConfig,
      setupServer,
    );
    if (wrapped) {
      result.localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
      result.localDataStoreServer = wrapped.localDataStoreServer as SetupServerApi;
    }
  // }

  return result;
}

// ################################################################################################
export async function miroirBeforeAll(
  miroirConfig: MiroirConfig,
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any,
):Promise< BeforeAllReturnType | undefined > {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll');
  try {

    const wrappedReduxStore = await createReduxStoreAndRestClient(
      miroirConfig as MiroirConfig,
      fetch,
    );

    const domainController = new DomainController(
      wrappedReduxStore.miroirContext,
      wrappedReduxStore.reduxStore, // implements LocalCacheInterface
      wrappedReduxStore.reduxStore, // implements RemoteStoreInterface
      new Endpoint(wrappedReduxStore.reduxStore)
    );

    if (!miroirConfig.emulateServer) {
      console.warn('miroirBeforeAll: emulateServer is true in miroirConfig, a real server is used, tests results depend on the availability of the server.');
      // creating localStoreControllers
      const remoteStore = domainController.getRemoteStore();
      await remoteStore.handleRemoteAction("",{
        actionType: "deploymentAction",
        actionName: "deployApplication",
        endpointVersion: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        applicationUuid: applicationDeploymentMiroir.uuid,
      })

      return Promise.resolve({
        domainController,
        miroirContext: wrappedReduxStore.miroirContext,
        reduxStore: wrappedReduxStore.reduxStore,
        localMiroirStoreController: undefined,
        localAppStoreController: undefined,
        localDataStoreWorker: undefined,
        localDataStoreServer: undefined,
      });
    } else {
      let localMiroirStoreController, localAppStoreController;

      const storeControllerManager = new StoreControllerManager(ConfigurationService.storeFactoryRegister)

      await createStoreControllers(storeControllerManager, miroirConfig);

      const localMiroirStoreControllerTmp = storeControllerManager.getStoreController(applicationDeploymentMiroir.uuid);
      const localAppStoreControllerTmp = storeControllerManager.getStoreController(applicationDeploymentLibrary.uuid);

      if (!localMiroirStoreControllerTmp || !localAppStoreControllerTmp) {
        throw new Error("could not find controller:" + localMiroirStoreController + " " + localAppStoreController);
      } else {
        localMiroirStoreController = localMiroirStoreControllerTmp;
        localAppStoreController = localAppStoreControllerTmp;
      }

      const {
        localDataStoreWorker,
        localDataStoreServer,
      } = await createMswRestServer(
        miroirConfig,
        'nodejs',
        restServerDefaultHandlers,
        storeControllerManager,
        createRestServiceFromHandlers
      );
  

      localDataStoreServer?.listen();
      await startLocalStoreControllers(localMiroirStoreController, localAppStoreController)

      // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.open',JSON.stringify(localMiroirStoreController, circularReplacer()));
      return Promise.resolve({
        domainController,
        miroirContext: wrappedReduxStore.miroirContext,
        reduxStore: wrappedReduxStore.reduxStore,
        localMiroirStoreController,
        localAppStoreController,
        localDataStoreWorker,
        localDataStoreServer,
      });
    }
    
  } catch (error) {
    console.error('Error beforeAll',error);
    throw error;
  }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll DONE');
  // return Promise.resolve(undefined);
}

// ###############################################################################################
export async function miroirBeforeEach(
  miroirConfig: MiroirConfig,
  domainController: DomainControllerInterface | undefined,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
):Promise<void> {
  
  if (!miroirConfig.emulateServer) {
    // throw new Error('emulateServer must be true in miroirConfig, tests must be independent of server.'); // TODO: really???
    if (domainController) {
      await resetAndInitMiroirAndApplicationDatabase(domainController);
    } else {
      throw new Error("miroirBeforeEach could not send commands to reset remote datastore because no domain controller has been provided.");
    }
  } else {
    try {
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach');
      await localAppStoreController.clear();
      await localMiroirStoreController.clear();
      try {
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach initApplication miroir START');
        await localMiroirStoreController.initApplication(
          defaultMiroirMetaModel,
          'miroir',
          applicationMiroir,
          applicationDeploymentMiroir,
          applicationModelBranchMiroirMasterBranch,
          applicationVersionInitialMiroirVersion,
          applicationStoreBasedConfigurationMiroir,
        );
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach initApplication miroir END');
      } catch (error) {
        console.error('could not initApplication for miroir datastore, can not go further!');
        throw(error);
      }
      try {
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach initApplication app START');
        await localAppStoreController.initApplication(
          defaultMiroirMetaModel,
          'app',
          applicationLibrary,
          applicationDeploymentLibrary,
          applicationModelBranchLibraryMasterBranch,
          applicationVersionLibraryInitialVersion,
          applicationStoreBasedConfigurationLibrary,
        );
        console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach initApplication app END');
      } catch (error) {
        console.error('could not initApplication for app datastore, can not go further!');
        throw(error);
      }
    } catch (error) {
      console.error('beforeEach',error);
      throw(error);
    }
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirBeforeEach');
    console.trace("miroirBeforeEach miroir model state", await localMiroirStoreController.getModelState());
    console.trace("miroirBeforeEach miroir data state", await localMiroirStoreController.getDataState());
    console.trace("miroirBeforeEach library app model state", await localAppStoreController.getModelState());
    console.trace("miroirBeforeEach library app data state", await localAppStoreController.getDataState());
  }

  document.body.innerHTML = '';

  return Promise.resolve();
}

// #################################################################################################################
export async function miroirAfterEach(
  miroirConfig: MiroirConfig,
  domainController: DomainControllerInterface | undefined,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
):Promise<void> {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterEach');
  if (!miroirConfig.emulateServer) {
    console.log('miroirAfterAll emulateServer is false in miroirConfig, a real server is used, nothing to do on client side.'); // TODO: empty clear / reset datastore
  } else {
    try {
      // await localDataStore?.close();
      await localMiroirStoreController.clear();
      await localAppStoreController.clear();
    } catch (error) {
      console.error('Error afterEach',error);
    }
  }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterEach');
  return Promise.resolve();
}

export async function miroirAfterAll(
  miroirConfig: MiroirConfig,
  domainController: DomainControllerInterface | undefined,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  localDataStoreServer?: any /*SetupServerApi*/,
) {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterAll');
  if (!miroirConfig.emulateServer) {
    console.log('miroirAfterAll emulateServer is false in miroirConfig, a real server is used, nothing to do on client side.'); // TODO: really???
    if (!domainController) {
      throw new Error("miroirAfterAll could not close store controller: DomainController is undefined");
    } else {
      console.log('miroirAfterAll closing deployment:', applicationDeploymentMiroir.uuid); // TODO: really???
      const remoteStore = domainController.getRemoteStore();
      await remoteStore.handleRemoteAction("",{
        actionType: "deploymentAction",
        actionName: "closeDeployment",
        endpointVersion: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: applicationDeploymentMiroir.uuid,
      })
      console.log('miroirAfterAll closing deployment:', applicationDeploymentMiroir.uuid, "DONE!"); // TODO: really???
    }
  } else {
    try {
      await (localDataStoreServer as any)?.close();
      await localMiroirStoreController.close();
      await localAppStoreController.close();
    } catch (error) {
      console.error('Error afterAll',error);
    }
  }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterAll');
  return Promise.resolve();
}

// ################################################################################################
export async function loadTestSingleConfigFile( fileName:string): Promise<MiroirConfig> {
  const pwd = process.env["PWD"]??""
  log.log("@@@@@@@@@@@@@@@@@@ loadTestConfigFile pwd", pwd, "fileName", fileName);
  // log.log("@@@@@@@@@@@@@@@@@@ env", process.env["npm_config_env"]);
  // const configFilePath = path.join(pwd, "./packages/miroir-standalone-app/tests/" + fileName + ".json")
  const configFilePath = path.join(pwd, fileName + ".json")
  log.log("@@@@@@@@@@@@@@@@@@ configFilePath", configFilePath);
  const configFileContents = await import(configFilePath);
  log.log("@@@@@@@@@@@@@@@@@@ configFileContents", configFileContents);

  const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

  log.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);
  return miroirConfig;
}
// ################################################################################################
// export async function loadTestConfigFiles(env:any, loglevelnext: any, defaultLevels: any) {
export async function loadTestConfigFiles(env:any) {
  let miroirConfig:MiroirConfig
  if (env.VITE_MIROIR_TEST_CONFIG_FILENAME) {
    miroirConfig = await loadTestSingleConfigFile(env.VITE_MIROIR_TEST_CONFIG_FILENAME??"");
    console.log("@@@@@@@@@@@@@@@@@@ config file contents:", miroirConfig)
  } else {
    throw new Error("Environment variable VITE_MIROIR_TEST_CONFIG_FILENAME not found. Tests must find this variable, pointing to a valid test configuration file");
  }
  
  let logConfig:any
  if (env.VITE_MIROIR_LOG_CONFIG_FILENAME) {
    logConfig = await loadTestSingleConfigFile(env.VITE_MIROIR_LOG_CONFIG_FILENAME??"specificLoggersConfig_warn");
    console.log("@@@@@@@@@@@@@@@@@@ log config file contents:", miroirConfig)
  
    // MiroirLoggerFactory.setEffectiveLoggerFactory(
    //   loglevelnext,
    //   defaultLevels[logConfig.defaultLevel],
    //   logConfig.defaultTemplate,
    //   logConfig.specificLoggerOptions
    // );
    
    
  } else {
    throw new Error("Environment variable VITE_MIROIR_LOG_CONFIG_FILENAME not found. Tests must find this variable, pointing to a valid test configuration file");
  }
  return {miroirConfig,logConfig}
}


import * as React from 'react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { FC, PropsWithChildren, createContext, useState } from 'react';
import { Provider } from 'react-redux';
import { RequestHandler } from 'msw';
import { SetupWorkerApi } from 'msw/browser';
import { setupServer } from 'msw/node';
// import { SetupServerApi } from 'msw/lib/node';

// As a basic setup, import your same slice reducers
import {
  ApplicationDeployment,
  ConfigurationService,
  DomainControllerInterface,
  IStoreController,
  LocalAndRemoteControllerInterface,
  MiroirConfig,
  MiroirContext,
  StoreControllerFactory,
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
  defaultMiroirMetaModel,
  resetAndInitMiroirAndApplicationDatabase
} from "miroir-core";
import { createReduxStoreAndRestClient, ReduxStore, ReduxStoreWithUndoRedo } from 'miroir-localcache-redux';
import { CreateMswRestServerReturnType, createMswRestServer } from 'miroir-server-msw-stub';
import { log } from 'console';



// ################################################################################################
export interface MiroirIntegrationTestEnvironment {
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  localDataStoreWorker?: SetupWorkerApi,
  localDataStoreServer?: any /**SetupServerApi*/,
  reduxStore: ReduxStore,
  localAndRemoteController: LocalAndRemoteControllerInterface,
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
      <button onClick={()=>setStep(step+1)} name={'next step '+props.reportUuid} role='button'>{'next step '+props.reportUuid}</button>
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

  const wrappedReduxStore = createReduxStoreAndRestClient(
    miroirConfig as MiroirConfig,
    fetch as any as (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  );

  const {
    localMiroirStoreController:a,localAppStoreController:b
  } = await StoreControllerFactory(
    ConfigurationService.storeFactoryRegister,
    miroirConfig,
    // sqlDbStoreControllerFactory,
  );
  result.localMiroirStoreController = a;
  result.localAppStoreController = b;

  // Establish requests interception layer before all tests.
  const wrapped = await miroirBeforeAll(
    miroirConfig as MiroirConfig,
    setupServer,
    result.localMiroirStoreController,
    result.localAppStoreController,
  );

  if (wrappedReduxStore) {
    result.reduxStore = wrappedReduxStore.reduxStore;
    result.domainController = wrappedReduxStore.domainController;
    result.miroirContext = wrappedReduxStore.miroirContext;
  }
  if (wrapped) {
    result.localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
    result.localDataStoreServer = wrapped.localDataStoreServer;
  }
  return result;
}

// ################################################################################################
export async function miroirBeforeAll(
  miroirConfig: MiroirConfig,
  createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
):Promise<CreateMswRestServerReturnType|undefined> {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll');
  try {
    
    if (!miroirConfig.emulateServer) {
      console.warn('miroirBeforeAll: emulateServer is true in miroirConfig, tests depend on the availability of a server.');
    } else {
      // if (miroirConfig.miroirServerConfig.model.emulatedServerType == "indexedDb" && miroirConfig.appServerConfig.model.emulatedServerType == "indexedDb") {
        // TODO: allow mixed mode? (indexedDb / sqlDb emulated miroir/app servers)
      // }
      // const wrapped = await createMswRestServer(
      const {
        localDataStoreWorker,
        localDataStoreServer,
      } = await createMswRestServer(
        miroirConfig,
        'nodejs',
        localMiroirStoreController,
        localAppStoreController,
        createRestServiceFromHandlers
      );
  
      localDataStoreServer?.listen();
      // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.open',JSON.stringify(localMiroirStoreController, circularReplacer()));
      await localMiroirStoreController?.open();
      await localAppStoreController?.open();
      try {
        await localMiroirStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
      } catch (error) {
        console.log('miroirBeforeAll: could not load persisted state from localMiroirStoreController, datastore could be empty (this is not a problem)');
      }
      try {
        await localAppStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
      } catch (error) {
        console.log('miroirBeforeAll: could not load persisted state from localAppStoreController, datastore could be empty (this is not a problem)');
      }
      return Promise.resolve({
        localMiroirStoreController,
        localAppStoreController,
        localDataStoreWorker,
        localDataStoreServer,
      });
    }

  } catch (error) {
    console.error('Error beforeAll',error);
  }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll DONE');
  return Promise.resolve(undefined);
}

// ###############################################################################################
export async function miroirBeforeEach(
  miroirConfig: MiroirConfig,
  domainController: DomainControllerInterface,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
):Promise<void> {
  
  if (!miroirConfig.emulateServer) {
    // throw new Error('emulateServer must be true in miroirConfig, tests must be independent of server.'); // TODO: really???
    await resetAndInitMiroirAndApplicationDatabase(domainController);
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
    console.log("miroirBeforeEach miroir model state", await localMiroirStoreController.getModelState());
    console.log("miroirBeforeEach miroir data state", await localMiroirStoreController.getDataState());
    console.log("miroirBeforeEach library app model state", await localAppStoreController.getModelState());
    console.log("miroirBeforeEach library app data state", await localAppStoreController.getDataState());
  }

  return Promise.resolve();
}

// #################################################################################################################
export async function miroirAfterEach(
  miroirConfig: MiroirConfig,
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
):Promise<void> {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterEach');
  if (!miroirConfig.emulateServer) {
    console.log('miroirAfterAll emulateServer is true in miroirConfig, nothing to do on client side.'); // TODO: empty clear / reset datastore
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
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  localDataStoreServer?: any /*SetupServerApi*/,
) {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterAll');
  if (!miroirConfig.emulateServer) {
    console.log('miroirAfterAll emulateServer is true in miroirConfig, nothing to do on client side.'); // TODO: really???
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


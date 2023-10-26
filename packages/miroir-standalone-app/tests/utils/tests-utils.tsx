import * as React from 'react';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { FC, PropsWithChildren, createContext, useState } from 'react';
import { Provider } from 'react-redux';

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
  applicationMiroir,
  applicationModelBranchMiroirMasterBranch,
  applicationStoreBasedConfigurationMiroir,
  applicationVersionInitialMiroirVersion,
  defaultMiroirMetaModel
} from "miroir-core";
import { ReduxStore, ReduxStoreWithUndoRedo } from 'miroir-redux';
import { RequestHandler } from 'msw';
import { SetupWorkerApi } from 'msw/browser';
import { SetupServerApi, setupServer } from 'msw/node';
import { CreateMswRestServerReturnType, createMswRestServer } from '../../src/miroir-fwk/createMswRestServer';


import applicationLibrary from "../../src/assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
// import applicationDeploymentLibrary from '../../src/assets/35c5608a-7678-4f07-a4ec-76fc5bc35424/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json';
import applicationStoreBasedConfigurationLibrary from "../../src/assets/library_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/2e5b7948-ff33-4917-acac-6ae6e1ef364f.json";
import applicationVersionLibraryInitialVersion from "../../src/assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json";
import applicationModelBranchLibraryMasterBranch from "../../src/assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json";
import { createReduxStoreAndRestClient } from '../../src/miroir-fwk/createReduxStoreAndRestClient';

// ################################################################################################
const fetch = require('node-fetch');


// ################################################################################################
export interface MiroirIntegrationTestEnvironment {
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  localDataStoreWorker?: SetupWorkerApi,
  localDataStoreServer?: typeof SetupServerApi,
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
    fetch,
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

  if (wrappedReduxStore && wrapped) {
    // localMiroirStoreController = wrapped.localMiroirStoreController as IStoreController;
    // localAppStoreController = wrapped.localAppStoreController as IStoreController;
    result.localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
    result.localDataStoreServer = wrapped.localDataStoreServer as typeof SetupServerApi;
    result.reduxStore = wrappedReduxStore.reduxStore;
    result.domainController = wrappedReduxStore.domainController;
    result.miroirContext = wrappedReduxStore.miroirContext;
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
      throw new Error('emulateServer must be true in miroirConfig, tests must be independent of server.'); // TODO: really???
    }

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
      console.log('could not load persisted state from localMiroirStoreController, datastore could be empty (this is not a problem)');
    }
    try {
      await localAppStoreController?.bootFromPersistedState(defaultMiroirMetaModel.entities,defaultMiroirMetaModel.entityDefinitions);
    } catch (error) {
      console.log('could not load persisted state from localAppStoreController, datastore could be empty (this is not a problem)');
    }
    return Promise.resolve({
      localMiroirStoreController,
      localAppStoreController,
      localDataStoreWorker,
      localDataStoreServer,
    });
  } catch (error) {
    console.error('Error beforeAll',error);
  }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll DONE');
  return Promise.resolve(undefined);
}

// ###############################################################################################
export async function miroirBeforeEach(
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
):Promise<void> {
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
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done beforeEach');
  return Promise.resolve();
}

// #################################################################################################################
export async function miroirAfterEach(
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
):Promise<void> {
  try {
    // await localDataStore?.close();
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterEach');
    await localMiroirStoreController.clear();
    await localAppStoreController.clear();
  } catch (error) {
    console.error('Error afterEach',error);
  }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterEach');
  return Promise.resolve();
}

export async function miroirAfterAll(
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  localDataStoreServer?: typeof SetupServerApi,
) {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterAll');
  try {
    await (localDataStoreServer as any)?.close();
    await localMiroirStoreController.close();
    await localAppStoreController.close();
  } catch (error) {
    console.error('Error afterAll',error);
  }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterAll');
  return Promise.resolve();
}


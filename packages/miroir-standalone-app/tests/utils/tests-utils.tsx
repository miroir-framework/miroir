import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import { expect } from 'vitest';

import { SetupWorkerApi } from 'msw/browser';
import * as React from 'react';
import { FC, PropsWithChildren, createContext, useState } from 'react';
import { Provider } from 'react-redux';
// import { SetupServerApi } from 'msw/lib/node';

// As a basic setup, import your same slice reducers
import {
  ActionReturnType,
  ConfigurationService,
  DeploymentConfiguration,
  DomainAction,
  DomainController,
  DomainControllerInterface,
  DomainElementType,
  Endpoint,
  EntityDefinition,
  EntityInstance,
  InstanceAction,
  LoggerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirContext,
  MiroirContextInterface,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManager,
  PersistenceStoreControllerManagerInterface,
  RestClient,
  SelfApplicationDeploymentConfiguration,
  StoreOrBundleAction,
  StoreUnitConfiguration,
  TestCompositeAction,
  TestCompositeActionSuite,
  TestCompositeActionTemplate,
  Uuid,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  getLoggerName,
  resetAndInitMiroirAndApplicationDatabaseNew,
  restServerDefaultHandlers,
  selfApplicationDeploymentLibrary,
  selfApplicationDeploymentMiroir
} from "miroir-core";
import {
  LocalCache,
  PersistenceReduxSaga,
  ReduxStoreWithUndoRedo,
  RestPersistenceClientAndRestClient,
} from "miroir-localcache-redux";
import { createMswRestServer } from 'miroir-server-msw-stub';
import { setupServer } from 'msw/node';
import path from 'path';
import { packageName } from '../../src/constants';
import { MiroirContextReactProvider } from '../../src/miroir-fwk/4_view/MiroirContextReactProvider';
import { cleanLevel } from '../../src/miroir-fwk/4_view/constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"tests-utils");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);



// ################################################################################################
// ################################################################################################
export type TestActionParams = {
  testActionType: "testCompositeActionSuite",
  deploymentUuid: Uuid,
  testCompositeAction: TestCompositeActionSuite,
} 
| {
  testActionType: "testCompositeAction",
  deploymentUuid: Uuid,
  testCompositeAction: TestCompositeAction,
} 
| {
  testActionType: "testCompositeActionTemplate",
  deploymentUuid: Uuid,
  compositeTestActionTemplate: TestCompositeActionTemplate,
} 



// ################################################################################################
// ################################################################################################
const deployments = [adminConfigurationDeploymentMiroir, adminConfigurationDeploymentLibrary ];

export const deploymentConfigurations: DeploymentConfiguration[] = [
  {
    adminConfigurationDeployment: adminConfigurationDeploymentMiroir,
    selfApplicationDeployment: selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
  },
  {
    adminConfigurationDeployment: adminConfigurationDeploymentLibrary,
    selfApplicationDeployment: selfApplicationDeploymentLibrary  as SelfApplicationDeploymentConfiguration,
  },
];



// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################


// ################################################################################################
export interface MiroirIntegrationTestEnvironment {
  localMiroirPersistenceStoreController: PersistenceStoreControllerInterface,
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
  localDataStoreWorker?: SetupWorkerApi,
  localDataStoreServer?: any /**SetupServerApi*/,
  localCache: LocalCache,
  domainController: DomainControllerInterface,
  miroirContext: MiroirContext,
}


// ################################################################################################
// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  store: ReduxStoreWithUndoRedo | undefined,
}
interface ExtendedRenderOptionsWithContextProvider extends Omit<RenderOptions, 'queries'> {
  store: ReduxStoreWithUndoRedo | undefined,
  miroirContext: MiroirContextInterface,
  domainController: DomainControllerInterface,
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    store,
    ...renderOptions
  }: ExtendedRenderOptions
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return store ? (
    <Provider store={store}>
      {children}
      </Provider>
    ) : <div>{children}</div>;
  }

  // Return an object with the store and all of RTL's query functions
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export function renderWithProvidersWithContextProvider(
  ui: React.ReactElement,
  {
    store,
    miroirContext,
    domainController,
    ...renderOptions
  }: ExtendedRenderOptionsWithContextProvider
) {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return store ? (
      <Provider store={store}> 
        <MiroirContextReactProvider miroirContext={miroirContext} domainController={domainController}>
          {children}
        </MiroirContextReactProvider>
      </Provider>
    ) : <div>{children}</div>;
  }

  // Return an object with the store and all of RTL's query functions
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export interface LoadingStateInterface {
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

// ################################################################################################
export async function addEntitiesAndInstancesForEmulatedServer(
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
  entities: { entity: MetaEntity, entityDefinition: EntityDefinition, instances: EntityInstance[] }[],
  reportBookList: EntityInstance,
) {
  for (const entity of entities) {
    await localAppPersistenceStoreController.createEntity(entity.entity as MetaEntity, entity.entityDefinition as EntityDefinition);
  }
  await localAppPersistenceStoreController?.upsertInstance('model', reportBookList as EntityInstance);
  for (const entityInstances of entities) {
    for (const instance of entityInstances.instances) {
      await localAppPersistenceStoreController?.upsertInstance('data', instance as EntityInstance);
    }
  }
}

export async function addEntitiesAndInstancesForRealServer(
  domainController: DomainControllerInterface,
  localCache: LocalCache,
  adminConfigurationDeploymentLibrary: EntityInstance,
  entities: { entity: MetaEntity, entityDefinition: EntityDefinition, instances: EntityInstance[] }[],
  act?: unknown,
) {
  const createAction: DomainAction = {
    actionType: "modelAction",
    actionName: "createEntity",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    entities: entities
  };

  if (act) {
    await (act as any)(async () => {
      await domainController.handleAction(createAction, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
      await domainController.handleAction(
        {
          actionName: "commit",
          actionType: "modelAction",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        },
        localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
      );
    });
  } else {
    await domainController.handleAction(createAction, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
    await domainController.handleAction(
      {
        actionName: "commit",
        actionType: "modelAction",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      },
      localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
    );
  }

  const createInstancesAction: InstanceAction = {
    actionType: "instanceAction",
    actionName: "createInstance",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    applicationSection: "data",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    objects: entities.map((e) => {
      return {
        parentName: e.entity.name,
        parentUuid: e.entity.uuid,
        applicationSection: "data",
        instances: e.instances,
      };
    })
  };

  if (act) {
    await (act as any)(async () => {
      await domainController.handleAction(createInstancesAction);
    });
  } else {
    await domainController.handleAction(createInstancesAction);
  }
}

// ################################################################################################
export async function addEntitiesAndInstances(
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
  domainController: DomainControllerInterface,
  localCache: LocalCache,
  miroirConfig: MiroirConfigClient,
  adminConfigurationDeploymentLibrary: EntityInstance,
  entities: { entity: MetaEntity, entityDefinition: EntityDefinition, instances: EntityInstance[] }[],
  reportBookList: EntityInstance,
  act?: unknown,
) {
  if (miroirConfig.client.emulateServer) {
    await addEntitiesAndInstancesForEmulatedServer(
      localAppPersistenceStoreController,
      entities,
      reportBookList,
    );
  } else {
    await addEntitiesAndInstancesForRealServer(
      domainController,
      localCache,
      adminConfigurationDeploymentLibrary,
      entities,
      act,
    );
  }
}

// ################################################################################################
export async function createLibraryTestStore(
  miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
) {
  const configurationLibrary = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentLibrary.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentLibrary.uuid];
  console.log("createLibraryTestStore: real server, sending remote storeManagementAction to server for test store creation")
  const openMiroirStore = await domainController.handleAction(
    {
      actionType: "storeManagementAction",
      actionName: "openStore",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      configuration: {
        [adminConfigurationDeploymentLibrary.uuid]:configurationLibrary
      }
    }
  )
const createdApplicationLibraryStore = await domainController?.handleAction(
    {
      actionType: "storeManagementAction",
      actionName: "createStore",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      configuration: configurationLibrary
    }
  )
  if (createdApplicationLibraryStore?.status != "ok") {
    console.error('Error createLibraryTestStore',JSON.stringify(createdApplicationLibraryStore, null, 2));
    throw new Error(
      "Error createLibraryTestStore could not create Library Store: " +
        JSON.stringify(createdApplicationLibraryStore, null, 2)
    );
  }
}

// ################################################################################################
export async function setupMiroirTest(
  miroirConfig: MiroirConfigClient,
) {

  const miroirContext = new MiroirContext(miroirConfig);

  const client: RestClient = new RestClient(fetch);
  const persistenceClientAndRestClient = new RestPersistenceClientAndRestClient(
    miroirConfig.client.emulateServer
      ? miroirConfig.client.rootApiUrl
      : miroirConfig.client.serverConfig.rootApiUrl,
    client
  );
  
  const localCache: LocalCache = new LocalCache();
  
  
  const persistenceStoreControllerManager = new PersistenceStoreControllerManager(
    ConfigurationService.adminStoreFactoryRegister,
    ConfigurationService.StoreSectionFactoryRegister,
  );
  
  
  persistenceStoreControllerManager.setLocalCache(localCache);
  
  const persistenceSaga: PersistenceReduxSaga = new PersistenceReduxSaga(
    // even for emulateServer, we use remote persistence store, since MSW makes it appear as if we are using a remote server.
    {
      persistenceStoreAccessMode: "remote",
      remotePersistenceStoreRestClient: persistenceClientAndRestClient,
    }
  );
  
  persistenceSaga.run(localCache)
  persistenceStoreControllerManager.setPersistenceStoreLocalOrRemote(persistenceSaga); // useless?
  
  const domainController = new DomainController(
    "client", // we are on the client, we have to use persistenceStore to execute (remote) Queries
    miroirContext,
    localCache, // implements LocalCacheInterface
    persistenceSaga, // implements PersistenceStoreLocalOrRemoteInterface
    new Endpoint(localCache)
  );
  
  if (miroirConfig.client.emulateServer) {
    let localDataStoreWorker: SetupWorkerApi | undefined;
    let localDataStoreServer: any /**SetupServerApi | undefined */;
  
    try {
      const {
        localDataStoreWorker: localDataStoreWorkertmp, // browser
        localDataStoreServer: localDataStoreServertmp, // nodejs
      } = await createMswRestServer(
        miroirConfig,
        'nodejs',
        restServerDefaultHandlers,
        persistenceStoreControllerManager,
        localCache,
        setupServer
      );
      localDataStoreWorker = localDataStoreWorkertmp as any
      localDataStoreServer = localDataStoreServertmp
    } catch (error) {
      console.error("tests-utils miroirBeforeAll could not create MSW Rest server: " + error)
      throw(error)
    }
    if (localDataStoreServer) {
      console.warn(
        "tests-utils localDataStoreServer starting",
        // "tests-utils localDataStoreServer starting, listHandlers",
        // localDataStoreServer.listHandlers().map((h) => h.info.header)
      );
      // await localDataStoreServer.listen();
      localDataStoreServer.listen();
      console.warn(
        "tests-utils localDataStoreServer STARTED, listHandlers",
        localDataStoreServer.listHandlers().map((h: any) => h.info.header)
      );
    } else {
      throw new Error("tests-utils localDataStoreServer not found.");
    }
  }

  return {
    persistenceStoreControllerManager,
    domainController,
    localCache,
    miroirContext
  }
}


// ################################################################################################
export interface BeforeAllReturnType {
  localMiroirPersistenceStoreController: PersistenceStoreControllerInterface | undefined,
  localAppPersistenceStoreController: PersistenceStoreControllerInterface | undefined,
}
export async function miroirBeforeAll(
  miroirConfig: MiroirConfigClient,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
):Promise< BeforeAllReturnType | undefined > {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll started');
  let result:any = undefined;
  // let domainController: DomainControllerInterface = undefined as any;

  try {


    if (!miroirConfig.client.emulateServer) {
      console.warn('miroirBeforeAll: emulateServer is true in miroirConfig, a real server is used, tests results depend on the availability of the server.');
      for (const c of Object.entries(miroirConfig.client.serverConfig.storeSectionConfiguration)) {
        const openStoreAction: StoreOrBundleAction = {
          actionType: "storeManagementAction",
          actionName: "openStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          configuration: {
            [c[0]]: c[1] as StoreUnitConfiguration,
          },
          deploymentUuid: c[0],
        };
        await domainController.handleAction(openStoreAction)
      }
      

      // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll DONE');
      result = {
        localMiroirPersistenceStoreController: undefined,
        localAppPersistenceStoreController: undefined,
      };
    } else {
      console.log("EMULATED SERVER, DATASTORE WILL BE ACCESSED DIRECTLY FROM NODEJS TEST ENVIRONMENT, NO SERVER WILL BE USED")

      log.info("miroirBeforeAll emulated server miroirConfig",JSON.stringify(miroirConfig, null, 2));

      // console.warn('miroirBeforeAll: emulateServer is true in miroirConfig, no server is used, persistent store layer is accessed directly by the client.');
      // TODO: send openStore action instead?
      for (const deployment of Object.entries(miroirConfig.client.deploymentStorageConfig)) {
        log.info("miroirBeforeAll setting persistenceStoreController on manager",deployment[0])
        await persistenceStoreControllerManager.addPersistenceStoreController(
          deployment[0],
          deployment[1]
        );
        log.info("miroirBeforeAll setting persistenceStoreController DONE on manager",deployment[0])
      }

      log.info("miroirBeforeAll set persistenceStoreControllerManager on manager DONE");
      const localMiroirPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
        adminConfigurationDeploymentMiroir.uuid
      );
      const localAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
        adminConfigurationDeploymentLibrary.uuid
      );

      if (!localMiroirPersistenceStoreController || !localAppPersistenceStoreController) {
        throw new Error(
          "could not find controller:" +
            localMiroirPersistenceStoreController +
            " " +
            localAppPersistenceStoreController
        );
      } else {
        // await startLocalPersistenceStoreControllers(localMiroirPersistenceStoreController, localAppPersistenceStoreController)

        log.info("miroirBeforeAll localMiroirPersistenceStoreController ok",adminConfigurationDeploymentMiroir.uuid)
        log.info("miroirBeforeAll localAppPersistenceStoreController ok",adminConfigurationDeploymentLibrary.uuid)
      }

      // console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.open',JSON.stringify(localMiroirPersistenceStoreController, circularReplacer()));
      result = {
        localMiroirPersistenceStoreController,
        localAppPersistenceStoreController,
      };
    }

    const configurationMiroir = miroirConfig.client.emulateServer
      ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
      : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid];
    log.info(
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! miroirBeforeAll OPENING miroir store",
      JSON.stringify(configurationMiroir, null, 2)
    );
    const openMiroirStore = await domainController.handleAction(
      {
        actionType: "storeManagementAction",
        actionName: "openStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        configuration: {
          [adminConfigurationDeploymentMiroir.uuid]:configurationMiroir
        }
      }
    )
    log.info(
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! miroirBeforeAll creating miroir store",
      JSON.stringify(configurationMiroir, null, 2)
    );
    const createdMiroirStore = await domainController.handleAction(
      {
        actionType: "storeManagementAction",
        actionName: "createStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
        configuration: configurationMiroir
      }
    )
    if (createdMiroirStore?.status != "ok") {
      console.error('Error miroirBeforeAll',JSON.stringify(createdMiroirStore, null, 2));
      throw new Error('Error miroirBeforeAll could not create Miroir Store: ' + JSON.stringify(createdMiroirStore, null, 2));
    }
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll DONE');

    return Promise.resolve(result);
  } catch (error) {
    console.error('Error beforeAll',error);
    throw error;
  }
  // return Promise.resolve(undefined);
}

// ###############################################################################################
export async function miroirBeforeEach(
  miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
  deploymentConfigurations: DeploymentConfiguration[],
  // localMiroirPersistenceStoreController: PersistenceStoreControllerInterface,
  // localAppPersistenceStoreController: PersistenceStoreControllerInterface,
):Promise<void> {
  
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach');
    await resetAndInitMiroirAndApplicationDatabaseNew(domainController, deploymentConfigurations);
    // console.trace("miroirBeforeEach miroir model state", await localMiroirPersistenceStoreController.getModelState());
    // console.trace("miroirBeforeEach miroir data state", await localMiroirPersistenceStoreController.getDataState());
    // console.trace("miroirBeforeEach library app model state", await localAppPersistenceStoreController.getModelState());
    // console.trace("miroirBeforeEach library app data state", await localAppPersistenceStoreController.getDataState());
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirBeforeEach');
  document.body.innerHTML = '';

  return Promise.resolve();
}

// #################################################################################################################
export async function miroirAfterEach(
  miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
  deploymentConfigurations: DeploymentConfiguration[],
  localCache: LocalCache
):Promise<void> {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterEach');
  for (const d of deploymentConfigurations) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "resetModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: d.adminConfigurationDeployment.uuid,
    }, localCache.currentModel(d.adminConfigurationDeployment.uuid));
  }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterEach');
  return Promise.resolve();
}

// ################################################################################################
export async function miroirAfterAll(
  miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
  deploymentConfigurations: DeploymentConfiguration[],
  // localMiroirPersistenceStoreController: PersistenceStoreControllerInterface,
  // localAppPersistenceStoreController: PersistenceStoreControllerInterface,
  // localRestServer?: any /*SetupServerApi*/,
) {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirAfterAll');
  console.log('miroirAfterAll delete test stores.');
  for (const d of deploymentConfigurations) {
    const storeUnitConfiguration = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[d.adminConfigurationDeployment.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[d.adminConfigurationDeployment.uuid];
    const deletedStore = await domainController.handleAction({
      actionType: "storeManagementAction",
      actionName: "deleteStore",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      deploymentUuid: d.adminConfigurationDeployment.uuid,
      configuration: storeUnitConfiguration
    });
    if (deletedStore?.status != "ok") {
      console.error('Error afterEach',JSON.stringify(deletedStore, null, 2));
    }
  
  }

  // if (!miroirConfig.client.emulateServer) {
    console.log('miroirAfterAll closing deployment:', adminConfigurationDeploymentMiroir.uuid); // TODO: really???
    // const remoteStore:PersistenceStoreLocalOrRemoteInterface = domainController.getRemoteStore();
    for (const d of deploymentConfigurations) {
      // const storeUnitConfiguration = miroirConfig.client.emulateServer
      // ? miroirConfig.client.deploymentStorageConfig[d.adminConfigurationDeployment.uuid]
      // : miroirConfig.client.serverConfig.storeSectionConfiguration[d.adminConfigurationDeployment.uuid];
      const deletedStore = await domainController.handleAction({
        actionType: "storeManagementAction",
        actionName: "closeStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: d.adminConfigurationDeployment.uuid,
        });
      if (deletedStore?.status != "ok") {
        console.error('Error afterAll',JSON.stringify(deletedStore, null, 2));
      } else {
        console.log('miroirAfterAll closing deployment:', d.adminConfigurationDeployment.uuid, "DONE!"); // TODO: really???
      }
    }
  
    // await domainController.handleAction({
    //   actionType: "storeManagementAction",
    //   actionName: "closeStore",
    //   endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
    //   deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    // })
    // await domainController.handleAction({
    //   actionType: "storeManagementAction",
    //   actionName: "closeStore",
    //   endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
    //   deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
    // })
    // console.log('miroirAfterAll closing deployment:', adminConfigurationDeploymentMiroir.uuid, "DONE!"); // TODO: really???

  // } else { // EMULATED SERVER, USING LOCAL DATASTORE
  //   console.log('miroirAfterAll a emulated server is used, delete and close test stores.'); // TODO: really???

  //   console.log('miroirAfterAll emulated server closing deployments:', adminConfigurationDeploymentMiroir.uuid, adminConfigurationDeploymentLibrary.uuid); // TODO: really???
  //   await (localRestServer as any)?.close();
  //   await localMiroirPersistenceStoreController.close();
  //   await localAppPersistenceStoreController.close();
  //   console.log('miroirAfterAll closing deployments:', adminConfigurationDeploymentMiroir.uuid, adminConfigurationDeploymentLibrary.uuid, "DONE!"); // TODO: really???
  // }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterAll');
  return Promise.resolve();
}

// ################################################################################################
export async function loadTestSingleConfigFile( fileName:string): Promise<MiroirConfigClient> {
  const pwd = process.env["PWD"]??""
  log.info("@@@@@@@@@@@@@@@@@@ loadTestConfigFile pwd", pwd, "fileName", fileName);
  // log.info("@@@@@@@@@@@@@@@@@@ env", process.env["npm_config_env"]);
  // const configFilePath = path.join(pwd, "./packages/miroir-standalone-app/tests/" + fileName + ".json")
  const configFilePath = path.join(pwd, fileName + ".json")
  log.info("@@@@@@@@@@@@@@@@@@ configFilePath", configFilePath);
  const configFileContents = await import(configFilePath);
  log.info("@@@@@@@@@@@@@@@@@@ configFileContents", configFileContents);

  const miroirConfig:MiroirConfigClient = configFileContents as MiroirConfigClient;

  log.info("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);
  return miroirConfig;
}
// ################################################################################################
export async function loadTestConfigFiles(env:any) {
  let miroirConfig:MiroirConfigClient
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

// ################################################################################################
export const chainVitestSteps = async (
  stepName: string,
  context: {[k:string]: any},
  functionCallingActionToTest: () => Promise<ActionReturnType>,
  resultTransformation?: (a:ActionReturnType,p:{[k:string]: any}) => any,
  addResultToContextAsName?: string,
  expectedDomainElementType?: DomainElementType,
  expectedValue?: any,
): Promise<{[k:string]: any}> => {
  console.log(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "previousResult:",
    JSON.stringify(context, undefined, 2)
  );
  const domainElement = await functionCallingActionToTest();
  console.log(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "result:",
    JSON.stringify(domainElement, undefined, 2)
  );
  let testResult
  if (domainElement.status == "ok") {
    testResult = resultTransformation
      ? resultTransformation(domainElement, context)
      : domainElement.status == "ok"
      ? domainElement?.returnedDomainElement?.elementValue
      : undefined;

    console.log(
      "########################################### chainTestAsyncDomainCalls",
      stepName,
      "testResult that will be compared",
      JSON.stringify(testResult, null, 2)
    );
    if (expectedDomainElementType) {
      if (domainElement.returnedDomainElement?.elementType != expectedDomainElementType) {
        expect(
          domainElement.returnedDomainElement?.elementType,
          stepName + "received wrong type for result: " + domainElement.returnedDomainElement?.elementType + " expected: " + expectedDomainElementType
        ).toEqual(expectedDomainElementType); // fails
      } else {
        // const testResult = ignorePostgresExtraAttributes(domainElement?.returnedDomainElement.elementValue)
        if (expectedValue) {
          expect(testResult).toEqual(expectedValue);
        } else {
          // no test to be done
        }
      }
    } else {
     // no test to be done 
     console.log(
       "########################################### chainTestAsyncDomainCalls",
       stepName,
       "no test done because expectedDomainElementType is undefined",
       expectedDomainElementType
     );
    }
  } else {
    console.log(
      "########################################### chainTestAsyncDomainCalls",
      stepName,
      "error:",
      JSON.stringify(domainElement.error, undefined, 2)
    );
    expect(
      domainElement.status,
      domainElement.error?.errorType ?? "no errorType" + ": " + domainElement.error?.errorMessage ?? "no errorMessage"
    ).toEqual("ok");
  }
  console.log(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "testResult:",
    JSON.stringify(testResult, undefined, 2)
  );
  if (testResult && addResultToContextAsName) {
    return {...context, [addResultToContextAsName]: testResult}
  } else {
    return context
  }
}

import * as fs from "fs";

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
  CompositeAction,
  ConfigurationService,
  DeploymentConfiguration,
  DomainAction,
  DomainControllerInterface,
  DomainElementType,
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
  RestClientInterface,
  RestPersistenceClientAndRestClientInterface,
  SelfApplicationDeploymentConfiguration,
  TestCompositeAction,
  TestCompositeActionSuite,
  TestCompositeActionTemplate,
  Uuid,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  defaultMiroirMetaModel,
  resetAndInitApplicationDeploymentNew,
  selfApplicationDeploymentLibrary,
  selfApplicationDeploymentMiroir
} from "miroir-core";
import { RestClientStub } from 'miroir-core/src/4_services/RestClientStub';
import {
  LocalCache,
  ReduxStoreWithUndoRedo,
  setupMiroirDomainController
} from "miroir-localcache-redux";
import path from 'path';
import { RestPersistenceClientAndRestClient } from '../../../miroir-localcache-redux/dist';
import { packageName } from '../../src/constants';
import { MiroirContextReactProvider } from '../../src/miroir-fwk/4_view/MiroirContextReactProvider';
import { cleanLevel } from '../../src/miroir-fwk/4_view/constants';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "tests-utils")
).then((logger: LoggerInterface) => {log = logger});




// ################################################################################################
// ################################################################################################
export type TestActionParams = {
  testActionType: "testCompositeActionSuite",
  testActionLabel: string,
  deploymentUuid: Uuid,
  testCompositeAction: TestCompositeActionSuite,
} 
| {
  testActionType: "testCompositeAction",
  testActionLabel: string,
  deploymentUuid: Uuid,
  testCompositeAction: TestCompositeAction,
} 
| {
  testActionType: "testCompositeActionTemplate",
  testActionLabel: string,
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
export function createDeploymentCompositeAction(
  miroirConfig: MiroirConfigClient,
  deploymentUuid: Uuid,
): CompositeAction {
  const deploymentConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deploymentUuid];

  if (!deploymentConfiguration) {
    throw new Error(`Configuration for deployment ${deploymentUuid} not found in ${JSON.stringify(miroirConfig, null, 2)}`);
  };

  log.info("createDeploymentCompositeAction deploymentConfiguration", deploymentUuid, deploymentConfiguration);
  return {
    actionType: "compositeAction",
    actionLabel: "beforeAll",
    actionName: "sequence",
    definition: [
      // TODO: openStore first!
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "openStore",
        domainAction: {
          actionType: "storeManagementAction",
          actionName: "openStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          deploymentUuid: deploymentUuid,
          configuration: {
            [deploymentUuid]:deploymentConfiguration
          }
        }
      },
      {
        compositeActionType: "domainAction",
        compositeActionStepLabel: "createStore",
        domainAction: {
          actionType: "storeManagementAction",
          actionName: "createStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          deploymentUuid: deploymentUuid,
          configuration: deploymentConfiguration,
        },
      },
    ],
  };
}


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

// ################################################################################################
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
export async function createLibraryDeploymentDEFUNCT(
  miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
) {

  const action = createDeploymentCompositeAction(miroirConfig, adminConfigurationDeploymentLibrary.uuid);
  const result = await domainController.handleCompositeAction(action, defaultMiroirMetaModel);
}

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

// // ################################################################################################
// export async function createRestServerStub(
//   miroirConfig: MiroirConfigClient,
//   platformType: "browser" | "nodejs",
//   restServerHandlers: RestServiceHandler[],
//   persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
//   domainController: DomainControllerInterface,
//   // createRestServiceFromHandlers: (...handlers: Array<RequestHandler>) => any
// ):Promise<{restServerStub: RestServerStub}>  {
//   log.info("createMswRestServer", "platformType", platformType, "miroirConfig", miroirConfig);
//   log.info("createMswRestServer process.browser", (process as any)["browser"]);

//   if (miroirConfig.client.emulateServer) {

//     const restServerStub: RestServerStub = new RestMswServerStub(
//       miroirConfig.client.rootApiUrl,
//       restServerHandlers,
//       persistenceStoreControllerManager,
//       domainController,
//       miroirConfig,
//     );
//     log.warn("######################### createMswRestServer handling operations", restServerHandlers);

//     let localDataStoreWorker: SetupWorkerApi | undefined = undefined;
//     let localDataStoreServer: any /*SetupServerApi*/ | undefined = undefined;
//     if (platformType == "browser") {
//       localDataStoreWorker = createRestServiceFromHandlers(...restServerStub.handlers);
//     }
//     if (platformType == "nodejs") {
//       localDataStoreServer = createRestServiceFromHandlers(...restServerStub.handlers);
//     }

//     return Promise.resolve({
//       localDataStoreWorker,
//       localDataStoreServer,
//     });
//   } else {
//     // log.warn("createMswRestServer non-emulated server will be queried on", miroirConfig.client.serverConfig.rootApiUrl);
//     throw new Error("createMswRestServer called for non-emulated server, this is a bug." + JSON.stringify(miroirConfig));
//     // return Promise.resolve({
//     //   localMiroirPersistenceStoreController: undefined,
//     //   localAppPersistenceStoreController: undefined,
//     //   localDataStoreWorker: undefined,
//     //   localDataStoreServer: undefined,
//     // });
//   }
// }

// ################################################################################################
/**
 * @param miroirConfig 
 * @returns 
 */
export async function setupMiroirTest(
  miroirConfig: MiroirConfigClient,
) {
  const miroirContext = new MiroirContext(miroirConfig);
  console.log("setupMiroirTest miroirConfig", JSON.stringify(miroirConfig, null, 2));
  let client: RestClientInterface | undefined = undefined;
  let remotePersistenceStoreRestClient: RestPersistenceClientAndRestClientInterface | undefined = undefined;
  if (miroirConfig.client.emulateServer) {
    client = new RestClientStub(
      miroirConfig.client.rootApiUrl,
    );
    remotePersistenceStoreRestClient = new RestPersistenceClientAndRestClient(
      miroirConfig.client.rootApiUrl,
      client
    );

  } else {
    client = new RestClient(fetch);
    remotePersistenceStoreRestClient = new RestPersistenceClientAndRestClient(
      miroirConfig.client.serverConfig.rootApiUrl,
      client
    );
  }

  if (!client) {
    throw new Error("tests-utils setupMiroirTest could not create client");
  }
  if (!remotePersistenceStoreRestClient) {
    throw new Error("tests-utils setupMiroirTest could not create remotePersistenceStoreRestClient");
  }

  const persistenceStoreControllerManagerForClient = new PersistenceStoreControllerManager(
    ConfigurationService.adminStoreFactoryRegister,
    ConfigurationService.StoreSectionFactoryRegister
  );

  const domainControllerForClient = await setupMiroirDomainController(
    miroirContext, 
    {
      persistenceStoreAccessMode: "remote",
      localPersistenceStoreControllerManager: persistenceStoreControllerManagerForClient,
      remotePersistenceStoreRestClient,
    }
  ); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

  if (miroirConfig.client.emulateServer) {
    // let localDataStoreWorker: SetupWorkerApi | undefined;
    // let localDataStoreServer: any /**SetupServerApi | undefined */;
    const persistenceStoreControllerManagerForServer = new PersistenceStoreControllerManager(
      ConfigurationService.adminStoreFactoryRegister,
      ConfigurationService.StoreSectionFactoryRegister
    );

    const domainControllerForServer = await setupMiroirDomainController(
      miroirContext, 
      {
        persistenceStoreAccessMode: "local",
        localPersistenceStoreControllerManager: persistenceStoreControllerManagerForServer,
      }
    ); // even when emulating server, we use remote persistence store, since MSW makes it appear as if we are using a remote server.

    (client as RestClientStub).setServerDomainController(domainControllerForServer);
    (client as RestClientStub).setPersistenceStoreControllerManager(persistenceStoreControllerManagerForServer);

    // TODO: this creates a msw server, which is not needed for RestClientStub
    // try {
    //   const {
    //     localDataStoreWorker: localDataStoreWorkertmp, // browser
    //     localDataStoreServer: localDataStoreServertmp, // nodejs
    //   } = await createMswRestServer(
    //     miroirConfig,
    //     "nodejs",
    //     restServerDefaultHandlers,
    //     persistenceStoreControllerManagerForServer,
    //     domainControllerForServer,
    //     setupServer
    //   );
    //   localDataStoreWorker = localDataStoreWorkertmp as any;
    //   localDataStoreServer = localDataStoreServertmp;
    // } catch (error) {
    //   console.error(
    //     "tests-utils createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT could not create MSW Rest server: " +
    //       error
    //   );
    //   throw error;
    // }
    // if (localDataStoreServer) {
    //   console.warn(
    //     "tests-utils localDataStoreServer starting"
    //     // "tests-utils localDataStoreServer starting, listHandlers",
    //     // localDataStoreServer.listHandlers().map((h) => h.info.header)
    //   );
    //   // localDataStoreServer.listen({ onUnhandledRequest: 'bypass' });
    //   localDataStoreServer.listen();
    //   console.warn(
    //     "tests-utils localDataStoreServer STARTED, listHandlers",
    //     localDataStoreServer.listHandlers().map((h: any) => h.info.header)
    //   );
    // } else {
    //   throw new Error("tests-utils localDataStoreServer not found.");
    // }
  }

  return {
    persistenceStoreControllerManager: persistenceStoreControllerManagerForClient,
    domainController: domainControllerForClient,
    localCache: domainControllerForClient.getLocalCache(),
    miroirContext,
  };
}


// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export interface BeforeAllReturnType {
  localMiroirPersistenceStoreController: PersistenceStoreControllerInterface | undefined,
  localAppPersistenceStoreController: PersistenceStoreControllerInterface | undefined,
}
export async function createDeploymentGetPersistenceStoreController(
  miroirConfig: MiroirConfigClient,
  deploymentUuid: Uuid,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
):Promise< PersistenceStoreControllerInterface > {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createDeploymentGetPersistenceStoreController started');
  let result:any = undefined;
  try {
    const createLocalDeploymentCompositeAction = createDeploymentCompositeAction(miroirConfig, deploymentUuid);
    const createDeploymentResult = await domainController.handleCompositeAction(createLocalDeploymentCompositeAction, defaultMiroirMetaModel);

    if (createDeploymentResult.status != "ok") {
      console.error('Error createDeploymentGetPersistenceStoreController',JSON.stringify(createDeploymentResult, null, 2));
      throw new Error('Error createDeploymentGetPersistenceStoreController could not create Miroir Deployment: ' + JSON.stringify(createDeploymentResult, null, 2));
    }
    log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll_createDeploymentGetPersistenceController DONE');
    log.info("createDeploymentGetPersistenceStoreController set persistenceStoreControllerManager on manager DONE");

    const localPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
      deploymentUuid
    );
    if (!localPersistenceStoreController) {
      throw new Error(
        "could not find controller:" +
          localPersistenceStoreController
      );
    } else {
      log.info("createDeploymentGetPersistenceStoreController localPersistenceStoreController ok",deploymentUuid)
    }
    return Promise.resolve(localPersistenceStoreController);
  } catch (error) {
    console.error('Error createDeploymentGetPersistenceStoreController',error);
    throw error;
  }
  // return Promise.resolve(undefined);
}

// ################################################################################################
export async function createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT(
  miroirConfig: MiroirConfigClient,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
):Promise< BeforeAllReturnType | undefined > {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT started');
  let result:any = undefined;
  const localMiroirPersistenceStoreController = await createDeploymentGetPersistenceStoreController(
    miroirConfig,
    adminConfigurationDeploymentMiroir.uuid,
    persistenceStoreControllerManager,
    domainController
  );
  return Promise.resolve({localMiroirPersistenceStoreController, localAppPersistenceStoreController:undefined});
}

// ###############################################################################################
export async function miroirBeforeEach_resetAndInitApplicationDeployments(
  // miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
  deploymentConfigurations: DeploymentConfiguration[],
):Promise<void> {
  
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach_resetAndInitApplicationDeployments');
    await resetAndInitApplicationDeploymentNew(domainController, deploymentConfigurations);
    // console.trace("miroirBeforeEach_resetAndInitApplicationDeployments miroir model state", await localMiroirPersistenceStoreController.getModelState());
    // console.trace("miroirBeforeEach_resetAndInitApplicationDeployments miroir data state", await localMiroirPersistenceStoreController.getDataState());
    // console.trace("miroirBeforeEach_resetAndInitApplicationDeployments library app model state", await localAppPersistenceStoreController.getModelState());
    // console.trace("miroirBeforeEach_resetAndInitApplicationDeployments library app data state", await localAppPersistenceStoreController.getDataState());
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirBeforeEach_resetAndInitApplicationDeployments');
  document.body.innerHTML = '';

  return Promise.resolve();
}

// #################################################################################################################
export async function resetApplicationDeployments(
  deploymentConfigurations: DeploymentConfiguration[],
  domainController: DomainControllerInterface,
  localCache: LocalCache,
):Promise<void> {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ resetApplicationDeployments');
  for (const d of deploymentConfigurations) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "resetModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: d.adminConfigurationDeployment.uuid,
    }, localCache?localCache.currentModel(d.adminConfigurationDeployment.uuid):defaultMiroirMetaModel);
  }
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterEach');
  return Promise.resolve();
}

// ################################################################################################
export async function deleteAndCloseApplicationDeployments(
  miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
  deploymentConfigurations: DeploymentConfiguration[],
) {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments');
  log.info('deleteAndCloseApplicationDeployments delete test stores.');
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
    log.info('deleteAndCloseApplicationDeployments closing deployment:', adminConfigurationDeploymentMiroir.uuid); // TODO: really???
    for (const d of deploymentConfigurations) {
      const deletedStore = await domainController.handleAction({
        actionType: "storeManagementAction",
        actionName: "closeStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: d.adminConfigurationDeployment.uuid,
        });
      if (deletedStore?.status != "ok") {
        console.error('Error afterAll',JSON.stringify(deletedStore, null, 2));
      } else {
        log.info('deleteAndCloseApplicationDeployments closing deployment:', d.adminConfigurationDeployment.uuid, "DONE!"); // TODO: really???
      }
    }
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterAll');
  return Promise.resolve();
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export async function loadTestSingleConfigFile( fileName:string): Promise<MiroirConfigClient> {
  try {
    const pwd = process.env["PWD"]??""
    console.log("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile pwd", pwd, "fileName", fileName);
    // log.info("@@@@@@@@@@@@@@@@@@ env", process.env["npm_config_env"]);
    // const configFilePath = path.join(pwd, "./packages/miroir-standalone-app/tests/" + fileName + ".json")
    const configFilePath = path.join(pwd, fileName + ".json")
    console.log("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile configFilePath", configFilePath);
    const configFileContents = await import(configFilePath);
    // const configFileContents = JSON.parse(fs.readFileSync(new URL(configFilePath, import.meta.url)).toString());
    // const configFileContents = JSON.parse(fs.readFileSync(new URL(configFilePath)).toString());
    console.log("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile configFileContents", configFileContents);
  
    const miroirConfig:MiroirConfigClient = configFileContents as MiroirConfigClient;
  
    console.log("@@@@@@@@@@@@@@@@@@ loadTestSingleConfigFile miroirConfig", JSON.stringify(miroirConfig, null, 2));
    return Promise.resolve(miroirConfig);
  } catch (error) {
    console.error("@@@@@@@@@@@@@@@@@@ loadTestConfigFile error", error);
    throw error;
  }

}
// ################################################################################################
export async function loadTestConfigFiles(env:any) {
  try {
    console.log("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles started", JSON.stringify(env, null, 2));
    let miroirConfig:MiroirConfigClient
    if (env.VITE_MIROIR_TEST_CONFIG_FILENAME) {
      miroirConfig = await loadTestSingleConfigFile(env.VITE_MIROIR_TEST_CONFIG_FILENAME??"");
      // log.info("@@@@@@@@@@@@@@@@@@ config file contents:", miroirConfig)
    } else {
      throw new Error("Environment variable VITE_MIROIR_TEST_CONFIG_FILENAME not found. Tests must find this variable, pointing to a valid test configuration file");
    }
    
    let logConfig:any
    if (env.VITE_MIROIR_LOG_CONFIG_FILENAME) {
      logConfig = await loadTestSingleConfigFile(env.VITE_MIROIR_LOG_CONFIG_FILENAME ?? "specificLoggersConfig_warn");
      // console.info("@@@@@@@@@@@@@@@@@@ log config file contents:", miroirConfig)
    
      // MiroirLoggerFactory.setEffectiveLoggerFactoryWithLogLevelNext(
      //   loglevelnext,
      //   defaultLevels[logConfig.defaultLevel],
      //   logConfig.defaultTemplate,
      //   logConfig.specificLoggerOptions
      // );
      
      
    } else {
      throw new Error("Environment variable VITE_MIROIR_LOG_CONFIG_FILENAME not found. Tests must find this variable, pointing to a valid test configuration file");
    }
    console.log("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles config file contents:", JSON.stringify(miroirConfig, null, 2));
    return Promise.resolve({miroirConfig,logConfig})
  } catch (error) {
    console.error("@@@@@@@@@@@@@@@@@@ loadTestConfigFiles error", error);
    throw error;    
  }
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
  log.info(
    "########################################### chainTestAsyncDomainCalls",
    stepName,
    "previousResult:",
    JSON.stringify(context, undefined, 2)
  );
  const domainElement = await functionCallingActionToTest();
  log.info(
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

    log.info(
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
     log.info(
       "########################################### chainTestAsyncDomainCalls",
       stepName,
       "no test done because expectedDomainElementType is undefined",
       expectedDomainElementType
     );
    }
  } else {
    log.info(
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
  log.info(
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

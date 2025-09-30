import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
// import { expect } from 'vitest';


// import { SetupWorkerApi } from 'msw/browser';
// import { SetupServerApi } from 'msw/lib/node';
import * as React from 'react';
import { FC, PropsWithChildren, createContext, useState } from 'react';
import { Provider } from 'react-redux';

// As a basic setup, import your same slice reducers
import {
  Action2Error,
  Action2ReturnType,
  AdminApplicationDeploymentConfiguration,
  CompositeAction,
  ConfigurationService,
  ConsoleInterceptor,
  DeploymentConfiguration,
  DomainAction,
  DomainControllerInterface,
  DomainElementType,
  EntityDefinition,
  EntityInstance,
  InitApplicationParameters,
  InstanceAction,
  LocalCacheInterface,
  LoggerInterface,
  MetaEntity,
  MiroirActivityTracker,
  MiroirConfigClient,
  MiroirContext,
  MiroirContextInterface,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManager,
  PersistenceStoreControllerManagerInterface,
  RestClient,
  RestClientInterface,
  RestClientStub,
  RestPersistenceClientAndRestClientInterface,
  SelfApplicationDeploymentConfiguration,
  StoreUnitConfiguration,
  TestCompositeAction,
  TestCompositeActionSuite,
  TestCompositeActionTemplate,
  TestCompositeActionTemplateSuite,
  Uuid,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  defaultMiroirMetaModel,
  selfApplicationDeploymentLibrary,
  selfApplicationDeploymentMiroir,
  type MiroirEventTrackerInterface
} from "miroir-core";
import {
  LocalCache,
  ReduxStoreWithUndoRedo,
  RestPersistenceClientAndRestClient,
  setupMiroirDomainController
} from "miroir-localcache-redux";
import { packageName } from '../../constants';
import { MiroirContextReactProvider } from '../4_view/MiroirContextReactProvider';
import { cleanLevel } from '../4_view/constants';
import { ApplicationEntitiesAndInstances } from "./tests-utils-testOnLibrary";
import {
  JzodElement,
  TestBuildPlusRuntimeCompositeAction,
  TestBuildPlusRuntimeCompositeActionSuite,
  TestCompositeActionParams,
  TestRuntimeCompositeAction,
  TestRuntimeCompositeActionSuite,
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "tests-utils")
).then((logger: LoggerInterface) => {log = logger});


// ################################################################################################
// export type TestCompositeActionParams =
//   | {
//       testActionType: "testCompositeActionSuite";
//       testActionLabel: string;
//       deploymentUuid: Uuid;
//       testCompositeAction: TestCompositeActionSuite;
//     }
//   | {
//       testActionType: "testCompositeAction";
//       testActionLabel: string;
//       deploymentUuid: Uuid;
//       testCompositeAction: TestCompositeAction;
//     }
//   | {
//       testActionType: "testRuntimeCompositeActionSuite";
//       testActionLabel: string;
//       deploymentUuid: Uuid;
//       testCompositeAction: TestRuntimeCompositeActionSuite;
//     }
//   | {
//       testActionType: "testRuntimeCompositeAction";
//       testActionLabel: string;
//       deploymentUuid: Uuid;
//       testCompositeAction: TestRuntimeCompositeAction;
//     }
//   | {
//       testActionType: "testBuildPlusRuntimeCompositeActionSuite";
//       testActionLabel: string;
//       deploymentUuid: Uuid;
//       testParams?: Record<string, any>;
//       testCompositeAction: TestBuildPlusRuntimeCompositeActionSuite;
//     }
//   | {
//       testActionType: "testBuildPlusRuntimeCompositeAction";
//       testActionLabel: string;
//       deploymentUuid: Uuid;
//       testParams?: Record<string, any>;
//       testCompositeAction: TestBuildPlusRuntimeCompositeAction;
//     }
//   | {
//       testActionType: "testCompositeActionTemplate";
//       testActionLabel: string;
//       deploymentUuid: Uuid;
//       compositeTestActionTemplate: TestCompositeActionTemplate;
//     }
//   | {
//       testActionType: "testCompositeActionTemplateSuite";
//       testActionLabel: string;
//       deploymentUuid: Uuid;
//       testCompositeActionSuite: TestCompositeActionTemplateSuite;
//     }; 



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
    selfApplicationDeployment: selfApplicationDeploymentLibrary as SelfApplicationDeploymentConfiguration,
  },
];

export const selfApplicationDeploymentConfigurations: SelfApplicationDeploymentConfiguration[] = [
    selfApplicationDeploymentMiroir as SelfApplicationDeploymentConfiguration,
    selfApplicationDeploymentLibrary  as SelfApplicationDeploymentConfiguration,
];

export const adminApplicationDeploymentConfigurations: AdminApplicationDeploymentConfiguration[] = [
    adminConfigurationDeploymentMiroir as AdminApplicationDeploymentConfiguration,
    adminConfigurationDeploymentLibrary as AdminApplicationDeploymentConfiguration,
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
  deploymentUuid: Uuid,
  deploymentConfiguration: StoreUnitConfiguration,
): CompositeAction {
  log.info("createDeploymentCompositeAction deploymentConfiguration", deploymentUuid, deploymentConfiguration);
  return {
    actionType: "compositeAction",
    actionLabel: "beforeAll",
    actionName: "sequence",
    definition: [
      {
        // actionType: "storeManagementAction",
        actionType: "storeManagementAction_openStore",
        actionLabel: "storeManagementAction_openStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: deploymentUuid,
        configuration: {
          [deploymentUuid]: deploymentConfiguration,
        },
      },
      {
        // actionType: "storeManagementAction",
        actionType: "storeManagementAction_createStore",
        actionLabel: "storeManagementAction_createStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: deploymentUuid,
        configuration: deploymentConfiguration,
      },
    ],
  };
}

// ################################################################################################
export function resetAndinitializeDeploymentCompositeAction(
  adminApplicationDeploymentUuid: Uuid,
  initApplicationParameters: InitApplicationParameters,
  appEntitesAndInstances: ApplicationEntitiesAndInstances
): CompositeAction {
  // const typedAdminConfigurationDeploymentLibrary:AdminApplicationDeploymentConfiguration = adminConfigurationDeploymentLibrary as any;

  // const deploymentUuid = initApplicationParameters.selfApplicationDeploymentConfiguration.uuid;
  const deploymentUuid = adminApplicationDeploymentUuid;

  log.info("createDeploymentCompositeAction deploymentConfiguration", adminApplicationDeploymentUuid);
  return {
    actionType: "compositeAction",
    actionLabel: "beforeEach",
    actionName: "sequence",
    definition: [
      {
        actionType: "resetModel",
        actionLabel: "resetApplicationStore",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: deploymentUuid,
      },
      {
        actionType: "initModel",
        actionLabel: "initStore",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: deploymentUuid,
        payload: {
          params: initApplicationParameters,
        }
      },
      {
        actionType: "rollback",
        actionLabel: "refreshLocalCacheForLibraryStore",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: deploymentUuid,
      },
      {
        actionType: "createEntity",
        actionLabel: "CreateLibraryStoreEntities",
        deploymentUuid: deploymentUuid,
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          entities: appEntitesAndInstances,
        }
      },
      {
        actionType: "commit",
        actionLabel: "CommitLibraryStoreEntities",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        deploymentUuid: deploymentUuid,
      },
      {
        actionType: "createInstance",
        actionLabel: "CreateLibraryStoreInstances",
        endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
        deploymentUuid: deploymentUuid,
        payload: {
          applicationSection: "data",
          objects: appEntitesAndInstances.map((e) => {
            return {
              parentName: e.entity.name,
              parentUuid: e.entity.uuid,
              applicationSection: "data",
              instances: e.instances,
            };
          }),
        }
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
  localCache: LocalCacheInterface,
  adminConfigurationDeploymentLibrary: EntityInstance,
  entities: { entity: MetaEntity, entityDefinition: EntityDefinition, instances: EntityInstance[] }[],
  act?: unknown,
) {
  const createAction: DomainAction = {
    actionType: "createEntity",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    payload: {
      entities: entities
    }
  };

  if (act) {
    await (act as any)(async () => {
      await domainController.handleAction(createAction, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
      await domainController.handleAction(
        {
          actionType: "commit",
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
        actionType: "commit",
        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      },
      localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
    );
  }

  const createInstancesAction: InstanceAction = {
    // actionType: "instanceAction",
    actionType: "createInstance",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    payload: {
      applicationSection: "data",
      objects: entities.map((e) => {
        return {
          parentName: e.entity.name,
          parentUuid: e.entity.uuid,
          applicationSection: "data",
          instances: e.instances,
        };
      })
    }
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
  localCache: LocalCacheInterface,
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
// ################################################################################################
export interface MiroirIntegrationTestEnvironment {
  localMiroirPersistenceStoreController: PersistenceStoreControllerInterface,
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
  localDataStoreWorker?: any /* SetupWorkerApi still useful? */,
  localDataStoreServer?: any /**SetupServerApi*/,
  localCache: LocalCache,
  domainController: DomainControllerInterface,
  miroirContext: MiroirContext,
}

// ################################################################################################
/**
 * @param miroirConfig 
 * @returns 
 */
export async function setupMiroirTest(
  miroirConfig: MiroirConfigClient,
  customfetch?: any,
) {
  const miroirActivityTracker = new MiroirActivityTracker();
  const miroirEventService = new MiroirEventService(miroirActivityTracker);
  const miroirContext = new MiroirContext(
    miroirActivityTracker,
    miroirEventService,
    miroirConfig
  );
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
    client = new RestClient(customfetch??fetch);
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

  let persistenceStoreControllerManagerForServer: PersistenceStoreControllerManager | undefined = undefined;
  if (miroirConfig.client.emulateServer) {
    persistenceStoreControllerManagerForServer = new PersistenceStoreControllerManager(
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
  }

  return {
    persistenceStoreControllerManagerForClient: persistenceStoreControllerManagerForClient,
    persistenceStoreControllerManagerForServer: persistenceStoreControllerManagerForServer,
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
  storeUnitConfiguration: StoreUnitConfiguration,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
):Promise< PersistenceStoreControllerInterface > {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createDeploymentGetPersistenceStoreController started');
  let result:any = undefined;
  try {
    const createLocalDeploymentCompositeAction = createDeploymentCompositeAction(
      deploymentUuid,
      storeUnitConfiguration
    );
    const createDeploymentResult = await domainController.handleCompositeAction(
      createLocalDeploymentCompositeAction,
      defaultMiroirMetaModel
    );

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
export async function createMiroirDeploymentGetPersistenceStoreController(
  miroirConfig: MiroirConfigClient,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
):Promise< BeforeAllReturnType | undefined > {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT started');
  const localMiroirPersistenceStoreController = await createDeploymentGetPersistenceStoreController(
    miroirConfig,
    adminConfigurationDeploymentMiroir.uuid,
    miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid],
    persistenceStoreControllerManager,
    domainController
  );
  return Promise.resolve({localMiroirPersistenceStoreController, localAppPersistenceStoreController:undefined});
}


// #################################################################################################################
export async function resetApplicationDeployments(
  deploymentConfigurations: DeploymentConfiguration[],
  domainController: DomainControllerInterface,
  localCache: LocalCacheInterface,
):Promise<void> {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ resetApplicationDeployments');
  for (const d of deploymentConfigurations) {
    await domainController.handleAction({
      actionType: "resetModel",
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
  // deploymentConfigurations: DeploymentConfiguration[],
  deploymentConfigurations: AdminApplicationDeploymentConfiguration[],
) {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments');
  log.info('deleteAndCloseApplicationDeployments delete test stores.');
  for (const d of deploymentConfigurations) {
    const storeUnitConfiguration = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[d.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[d.uuid];
    const deletedStore = await domainController.handleAction({
      // actionType: "storeManagementAction",
      actionType: "storeManagementAction_deleteStore",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      deploymentUuid: d.uuid,
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
        // actionType: "storeManagementAction",
        actionType: "storeManagementAction_closeStore",
        endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
        deploymentUuid: d.uuid,
        });
      if (deletedStore?.status != "ok") {
        console.error('Error afterAll',JSON.stringify(deletedStore, null, 2));
      } else {
        log.info('deleteAndCloseApplicationDeployments closing deployment:', d.uuid, "DONE!"); // TODO: really???
      }
    }
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterAll');
  return Promise.resolve();
}



// ################################################################################################
export async function runTestOrTestSuite(
  // localCache: LocalCacheInterface,
  domainController: DomainControllerInterface,
  testAction: TestCompositeActionParams,
  miroirActivityTracker: MiroirEventTrackerInterface, // Optional unified tracker for test execution tracking
  testActionParamValues?: {[k:string]: any},
) {
  const fullTestName = testAction.testActionLabel??testAction.testActionType;
  log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ STARTING test:", fullTestName, );
  // log.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ STARTING test:", fullTestName, "testAction", testAction, );

  try {
    switch (testAction.testActionType) {
      case 'testBuildPlusRuntimeCompositeActionSuite':
      case "testRuntimeCompositeActionSuite": 
      case "testCompositeActionSuite": {
        const newParams = {...testActionParamValues??{}, ...(testAction.testCompositeAction as any)["testActionParams"]??{}};
        log.info(
          "running test testCompositeActionSuite",
          fullTestName,
          "with params",
          JSON.stringify(newParams, null, 2)
        );
        const queryResult: Action2ReturnType = await domainController.handleTestCompositeActionSuite(
          testAction.testCompositeAction as any, // TODO: remove cast
          newParams,
          domainController.currentModel(testAction.deploymentUuid)
        );
        log.info(
          "received results for test testCompositeActionSuite",
          fullTestName,
          ": queryResult=",
          JSON.stringify(queryResult, null, 2),
          "TestContextResults",
          JSON.stringify(miroirActivityTracker.getTestAssertionsResults([{testSuite: testAction.testActionLabel}]), null, 2)
        );
        // log.info(
        //   "received results for test testCompositeActionSuite",
        //   fullTestName,
        //   ": queryResult=",
        //   JSON.stringify(queryResult, null, 2)
        // );
        return queryResult;
      }
      case 'testBuildPlusRuntimeCompositeAction':
      case "testRuntimeCompositeAction": 
      case "testCompositeAction": {
        const queryResult: Action2ReturnType = await domainController.handleTestCompositeAction(
          testAction.testCompositeAction as any, // TODO: remove cast
          {},
          domainController.currentModel(testAction.deploymentUuid)
        );
        log.info(
          "test testCompositeAction",
          fullTestName,
          ": queryResult=",
          JSON.stringify(queryResult, null, 2)
        );
        return queryResult;
      }
      // case "testRuntimeCompositeActionTemplateSuite": {
      case "testCompositeActionTemplateSuite": {
        // throw new Error("testCompositeActionTemplateSuite not implemented yet!");
        log.info("testCompositeActionTemplateSuite", fullTestName, "running for testActionParamValues", testActionParamValues);
        const queryResult: Action2ReturnType = await domainController.handleTestCompositeActionTemplateSuite(
          testAction.testCompositeActionSuite,
          // testAction.TestCompositeActionSuite,
          testActionParamValues??{},
          domainController.currentModel(testAction.deploymentUuid)
        );
        log.info(
          "received results for test testCompositeActionSuite",
          fullTestName,
          ": queryResult=",
          JSON.stringify(queryResult, null, 2),
          "TestContextResults",
          JSON.stringify(miroirActivityTracker.getTestAssertionsResults([{testSuite: testAction.testActionLabel}]), null, 2)
        );
        return queryResult;
      }
      case "testCompositeActionTemplate": {
        throw new Error("testCompositeActionTemplate not implemented yet!");
      }
    }
  } catch (error) {
    log.error(
      "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ERROR test:",
      fullTestName,
      "error",
      error
    );
  }
}



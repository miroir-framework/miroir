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
  TestCompositeAction,
  TestCompositeActionSuite,
  TestCompositeActionTemplate,
  Uuid,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  defaultMiroirMetaModel,
  getLoggerName,
  resetAndInitApplicationDeploymentNew,
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
import { createDeploymentCompositeAction } from './tests-utils-testOnLibrary';

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

  return {
    actionType: "compositeAction",
    actionLabel: "beforeAll",
    actionName: "sequence",
    definition: [
      // TODO: openStore first!jy
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
      console.error("tests-utils createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT could not create MSW Rest server: " + error)
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
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createDeploymentGetPersistenceStoreController started');
  let result:any = undefined;
  try {
    const createLocalDeploymentCompositeAction = createDeploymentCompositeAction(miroirConfig, deploymentUuid);
    const createDeploymentResult = await domainController.handleCompositeAction(createLocalDeploymentCompositeAction, defaultMiroirMetaModel);

    if (createDeploymentResult.status != "ok") {
      console.error('Error createDeploymentGetPersistenceStoreController',JSON.stringify(createDeploymentResult, null, 2));
      throw new Error('Error createDeploymentGetPersistenceStoreController could not create Miroir Deployment: ' + JSON.stringify(createDeploymentResult, null, 2));
    }
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll_createDeploymentGetPersistenceController DONE');
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
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT started');
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
  
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeEach_resetAndInitApplicationDeployments');
    await resetAndInitApplicationDeploymentNew(domainController, deploymentConfigurations);
    // console.trace("miroirBeforeEach_resetAndInitApplicationDeployments miroir model state", await localMiroirPersistenceStoreController.getModelState());
    // console.trace("miroirBeforeEach_resetAndInitApplicationDeployments miroir data state", await localMiroirPersistenceStoreController.getDataState());
    // console.trace("miroirBeforeEach_resetAndInitApplicationDeployments library app model state", await localAppPersistenceStoreController.getModelState());
    // console.trace("miroirBeforeEach_resetAndInitApplicationDeployments library app data state", await localAppPersistenceStoreController.getDataState());
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done miroirBeforeEach_resetAndInitApplicationDeployments');
  document.body.innerHTML = '';

  return Promise.resolve();
}

// #################################################################################################################
export async function resetApplicationDeployments(
  deploymentConfigurations: DeploymentConfiguration[],
  domainController: DomainControllerInterface,
  localCache: LocalCache,
):Promise<void> {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ resetApplicationDeployments');
  for (const d of deploymentConfigurations) {
    await domainController.handleAction({
      actionType: "modelAction",
      actionName: "resetModel",
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      deploymentUuid: d.adminConfigurationDeployment.uuid,
    }, localCache?localCache.currentModel(d.adminConfigurationDeployment.uuid):defaultMiroirMetaModel);
  }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterEach');
  return Promise.resolve();
}

// ################################################################################################
export async function deleteAndCloseApplicationDeployments(
  miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
  deploymentConfigurations: DeploymentConfiguration[],
) {
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments');
  console.log('deleteAndCloseApplicationDeployments delete test stores.');
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
    console.log('deleteAndCloseApplicationDeployments closing deployment:', adminConfigurationDeploymentMiroir.uuid); // TODO: really???
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
        console.log('deleteAndCloseApplicationDeployments closing deployment:', d.adminConfigurationDeployment.uuid, "DONE!"); // TODO: really???
      }
    }
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterAll');
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

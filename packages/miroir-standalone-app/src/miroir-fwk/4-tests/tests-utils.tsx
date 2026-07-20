import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import * as React from 'react';
import { FC, PropsWithChildren, useState } from 'react';

// As a basic setup, import your same slice reducers
import {
  AdminApplicationDeploymentConfiguration,
  DeploymentConfiguration,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  EntityInstance,
  LocalCacheInterface,
  LoggerInterface,
  MiroirConfigClient,
  MiroirContext,
  MiroirContextInterface,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  // Deployment,
  StoreUnitConfiguration,
  Uuid,
  // deployment_Library_DO_NO_USE,
  createDeploymentCompositeAction,
  defaultMiroirModelEnvironment,
  type ApplicationDeploymentMap,
  type Deployment
} from "miroir-core";
import {
  deployment_Miroir
} from "miroir-test-app_deployment-admin";
import {
  selfApplicationDeploymentMiroir,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";

import {
  selfApplicationDeploymentLibrary,
} from "miroir-test-app_deployment-library";

import {
  LocalCache,
  LocalCacheProvider,
  MiroirContextReactProvider,
  ReduxStoreWithUndoRedo,
} from 'miroir-react';
import { packageName } from '../../constants';
import { cleanLevel } from '../4_view/constants';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "tests-utils")
).then((logger: LoggerInterface) => {log = logger});


// const deployment_Library_DO_NO_USE: Deployment = {
const deployment_Library_DO_NO_USE: AdminApplicationDeploymentConfiguration = {
  uuid: "f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  parentName: "Deployment",
  parentUuid: "35c5608a-7678-4f07-a4ec-76fc5bc35424",
  name: "LibraryApplicationFilesystemDeployment",
  defaultLabel: "LibraryApplicationFilesystemDeployment",
  selfApplication: "5af03c98-fe5e-490b-b08f-e1230971c57f",
  description: "The default Filesystem Deployment for SelfApplication Library",
  type: "singleNode",
  applicationModelLevel: "model",
  configuration: {
    admin: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "miroirAdmin",
    },
    model: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "library",
    },
    data: {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      schema: "library",
    },
  },
};


// ################################################################################################
// ################################################################################################
// const deployments = [deployment_Miroir, deployment_Library_DO_NO_USE ];

export const deploymentConfigurations: DeploymentConfiguration[] = [
  {
    adminConfigurationDeployment: deployment_Miroir,
    selfApplicationDeployment: selfApplicationDeploymentMiroir as Deployment,
  },
  {
    adminConfigurationDeployment: deployment_Library_DO_NO_USE,
    selfApplicationDeployment: selfApplicationDeploymentLibrary as Deployment,
  },
];

export const selfApplicationDeploymentConfigurations: Deployment[] = [
    selfApplicationDeploymentMiroir as Deployment,
    selfApplicationDeploymentLibrary  as Deployment,
];

export const adminApplicationDeploymentConfigurations: AdminApplicationDeploymentConfiguration[] = [
    deployment_Miroir as AdminApplicationDeploymentConfiguration,
    deployment_Library_DO_NO_USE as AdminApplicationDeploymentConfiguration,
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
    <LocalCacheProvider store={store}>
      {children}
      </LocalCacheProvider>
    ) : <div>{children}</div>;
  }

  // Return an object with the store and all of RTL's query functions
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// ################################################################################################
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
      <LocalCacheProvider store={store}> 
        <MiroirContextReactProvider miroirContext={miroirContext} domainController={domainController}>
          {children}
        </MiroirContextReactProvider>
      </LocalCacheProvider>
    ) : <div>{children}</div>;
  }

  // Return an object with the store and all of RTL's query functions
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

export interface LoadingStateInterface {
  loaded: boolean;
  step: number;
}

// const loadingStateContext = createContext<{loadingStateService:LoadingStateInterface}>({loadingStateService:{loaded:false,step:0}});

export const DisplayLoadingInfo:FC<{reportUuid?:string}> = (props:{reportUuid?:string}) => {
  const [step,setStep] = useState(0);
  const [loaded,setLoaded] = useState(false);
  return (
    <div>
      <button
        onClick={() => setStep(step + 1)}
        name={"next step " + props.reportUuid + " step=" + step}
        role="button"
      >
        {"next step " + props.reportUuid + " step=" + step}
      </button>
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
async function seedEntitiesAndInstancesOnEmulatedServer(
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
  entities: { entity: Entity; entityDefinition: EntityDefinition; instances: EntityInstance[] }[],
  reportBookList: EntityInstance,
) {
  for (const entity of entities) {
    await localAppPersistenceStoreController.createEntity(
      entity.entity as Entity,
      entity.entityDefinition as EntityDefinition,
    );
  }
  await localAppPersistenceStoreController.upsertInstance("model", reportBookList as EntityInstance);
  for (const entityInstances of entities) {
    for (const instance of entityInstances.instances) {
      await localAppPersistenceStoreController.upsertInstance("data", instance as EntityInstance);
    }
  }
}

// ################################################################################################
export async function addEntitiesAndInstances(
  localAppPersistenceStoreController: PersistenceStoreControllerInterface,
  domainController: DomainControllerInterface,
  localCache: LocalCacheInterface,
  miroirConfig: MiroirConfigClient,
  deployment_Library_DO_NO_USE: EntityInstance,
  applicationDeploymentMap: ApplicationDeploymentMap,
  entities: { entity: Entity; entityDefinition: EntityDefinition; instances: EntityInstance[] }[],
  reportBookList: EntityInstance,
  act?: unknown,
) {
  if (!miroirConfig.client.emulateServer) {
    throw new Error(
      "addEntitiesAndInstances: real-server seeding was removed; use emulateServer: true",
    );
  }
  await seedEntitiesAndInstancesOnEmulatedServer(
    localAppPersistenceStoreController,
    entities,
    reportBookList,
  );
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
  applicationName: string,
  miroirConfig: MiroirConfigClient,
  adminConfigurationDeploymentUuid: Uuid,
  selfApplicationUuid: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  adminDeployment: Deployment,
  storeUnitConfiguration: StoreUnitConfiguration,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
):Promise< PersistenceStoreControllerInterface > {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createDeploymentGetPersistenceStoreController started');
  let result:any = undefined;
  try {
    const createLocalDeploymentCompositeAction = createDeploymentCompositeAction(
      applicationName,
      adminConfigurationDeploymentUuid, // adminConfigurationDeploymentUuid
      selfApplicationUuid,
      adminDeployment,
      storeUnitConfiguration
    );
    const createDeploymentResult = await domainController.handleCompositeAction(
      createLocalDeploymentCompositeAction,
      applicationDeploymentMap,
      defaultMiroirModelEnvironment,
      {}
    );

    if (createDeploymentResult.status != "ok") {
      console.error(
        "Error createDeploymentGetPersistenceStoreController",
        JSON.stringify(createDeploymentResult, null, 2)
      );
      throw new Error(
        "Error createDeploymentGetPersistenceStoreController could not create Miroir Deployment: " +
          JSON.stringify(createDeploymentResult, null, 2)
      );
    }
    log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ miroirBeforeAll_createDeploymentGetPersistenceController DONE');
    log.info("createDeploymentGetPersistenceStoreController set persistenceStoreControllerManager on manager DONE");

    const localPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
      adminConfigurationDeploymentUuid
    );
    if (!localPersistenceStoreController) {
      throw new Error(
        "could not find controller:" +
          localPersistenceStoreController
      );
    } else {
      log.info("createDeploymentGetPersistenceStoreController localPersistenceStoreController ok",adminConfigurationDeploymentUuid)
    }
    return Promise.resolve(localPersistenceStoreController);
  } catch (error) {
    console.error('Error createDeploymentGetPersistenceStoreController',error);
    throw error;
  }
  // return Promise.resolve(undefined);
}

// ################################################################################################
// creates the meta-model Miroi app deployment
export async function createMiroirDeploymentGetPersistenceStoreController(
  miroirConfig: MiroirConfigClient,
  persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface,
  domainController: DomainControllerInterface,
  applicationDeploymentMap: ApplicationDeploymentMap,
  adminDeployment: Deployment,
):Promise< BeforeAllReturnType | undefined > {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT started');
  const localMiroirPersistenceStoreController = await createDeploymentGetPersistenceStoreController(
    "miroir",
    miroirConfig,
    deployment_Miroir.uuid,
    selfApplicationMiroir.uuid,
    applicationDeploymentMap,
    adminDeployment,
    miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid],
    persistenceStoreControllerManager,
    domainController
  );
  return Promise.resolve({localMiroirPersistenceStoreController, localAppPersistenceStoreController:undefined});
}



// #################################################################################################################
export async function resetApplicationDeployments(
  deploymentConfigurations: DeploymentConfiguration[],
  applicationDeploymentMap: ApplicationDeploymentMap,
  domainController: DomainControllerInterface,
  localCache: LocalCacheInterface,
):Promise<void> {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ resetApplicationDeployments');
  for (const d of deploymentConfigurations) {
    await domainController.handleAction(
      {
        actionType: "resetModel",
        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        payload: {
          application: d.selfApplicationDeployment.selfApplication,
          // deploymentUuid: d.adminConfigurationDeployment.uuid,
        },
      },
      applicationDeploymentMap,
      localCache
        ? localCache.currentModelEnvironment(
            d.selfApplicationDeployment.selfApplication,
            applicationDeploymentMap,
            // d.adminConfigurationDeployment.uuid
          )
        : defaultMiroirModelEnvironment
    );
  }
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterEach');
  return Promise.resolve();
}

// ################################################################################################
export async function deleteAndCloseApplicationDeployments(
  miroirConfig: MiroirConfigClient,
  domainController: DomainControllerInterface,
  // deploymentConfigurations: DeploymentConfiguration[],
  applicationDeploymentMap: ApplicationDeploymentMap,
  deploymentConfigurations: AdminApplicationDeploymentConfiguration[],
) {
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments');
  log.info('deleteAndCloseApplicationDeployments delete test stores.');
  for (const d of deploymentConfigurations) {
    const storeUnitConfiguration = miroirConfig.client.emulateServer
    ? miroirConfig.client.deploymentStorageConfig[d.uuid!]
    : miroirConfig.client.serverConfig.storeSectionConfiguration[d.uuid!];
    const deletedStore = await domainController.handleAction({
      actionType: "storeManagementAction_deleteStore",
      endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
      payload: {
        application: d.selfApplication,
        deploymentUuid: d.uuid,
        configuration: storeUnitConfiguration
      }
    }, applicationDeploymentMap);
    if (deletedStore?.status != "ok") {
      console.error('Error afterEach',JSON.stringify(deletedStore, null, 2));
    }
  
  }

  // if (!miroirConfig.client.emulateServer) {
    log.info('deleteAndCloseApplicationDeployments closing deployment:', deployment_Miroir.uuid); // TODO: really???
    for (const d of deploymentConfigurations) {
      const deletedStore = await domainController.handleAction(
        {
          actionType: "storeManagementAction_closeStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: d.selfApplication,
            // deploymentUuid: d.uuid,
          },
        },
        applicationDeploymentMap
      );
      if (deletedStore?.status != "ok") {
        console.error('Error afterAll',JSON.stringify(deletedStore, null, 2));
      } else {
        log.info('deleteAndCloseApplicationDeployments closing deployment:', d.uuid, "DONE!"); // TODO: really???
      }
    }
  log.info('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done afterAll');
  return Promise.resolve();
}




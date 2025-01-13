import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect } from 'vitest';

import {
  ConfigurationService,
  DomainAction,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  LoggerInterface,
  MiroirContextInterface,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  StoreUnitConfiguration,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  defaultMiroirMetaModel,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityEntity,
  entityReport,
  miroirCoreStartup
} from "miroir-core";

import { TestUtilsTableComponent } from "../utils/TestUtilsTableComponent.js";
import {
  DisplayLoadingInfo,
  createDeploymentCompositeAction,
  deleteAndCloseApplicationDeployments,
  deploymentConfigurations,
  loadTestConfigFiles,
  miroirBeforeEach_resetAndInitApplicationDeployments,
  renderWithProviders,
  resetApplicationDeployments,
  selfApplicationDeploymentConfigurations,
  setupMiroirTest
} from "../utils/tests-utils.js";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";

import { LoggerOptions } from "miroir-core/src/0_interfaces/4-services/LoggerInterface.js";
import { LocalCache } from "miroir-localcache-redux";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { cleanLevel, packageName } from "./constants.js";



const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
const fileName = "DomainController.React.Model.test";
myConsoleLog(fileName, "received env", JSON.stringify(env, null, 2));

let miroirConfig:any;
let loggerOptions:LoggerOptions;
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName)
).then((logger: LoggerInterface) => {log = logger});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();
ConfigurationService.registerTestImplementation({expect: expect as any});

const {miroirConfig: miroirConfigParam, logConfig} = await loadTestConfigFiles(env)
miroirConfig = miroirConfigParam;
loggerOptions = logConfig;
myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog(
  "received miroirConfig.client",
  JSON.stringify(miroirConfig.client, null, 2)
);
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
MiroirLoggerFactory.startRegisteredLoggers(
  loglevelnext,
  loggerOptions,
);
myConsoleLog("started registered loggers DONE");

const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid];

const testApplicationDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;
const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
let domainController: DomainControllerInterface;
let localCache: LocalCache;
let miroirContext: MiroirContextInterface;

beforeAll(
  async () => {
    const {
      persistenceStoreControllerManagerForClient: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      localCache: locallocalCache,
      miroirContext: localmiroirContext,
    } = await setupMiroirTest(miroirConfig);

    persistenceStoreControllerManager = localpersistenceStoreControllerManager;
    domainController = localdomainController;
    localCache = locallocalCache;
    miroirContext = localmiroirContext;

    const createMiroirDeploymentCompositeAction = createDeploymentCompositeAction(
      adminConfigurationDeploymentMiroir.uuid,
      miroirtDeploymentStorageConfiguration,
    );
    const createDeploymentResult = await domainController.handleCompositeAction(createMiroirDeploymentCompositeAction, defaultMiroirMetaModel);
    if (createDeploymentResult.status !== "ok") {
      throw new Error("Failed to create Miroir deployment: " + JSON.stringify(createDeploymentResult));
    }

    const action = createDeploymentCompositeAction(adminConfigurationDeploymentLibrary.uuid, libraryDeploymentStorageConfiguration);
    const result = await domainController.handleCompositeAction(action, defaultMiroirMetaModel);

  }
)

beforeEach(
  async () => {
    await miroirBeforeEach_resetAndInitApplicationDeployments(
      domainController,
      // deploymentConfigurations,
      selfApplicationDeploymentConfigurations,
    );
  }
)

afterAll(
  async () => {
    await deleteAndCloseApplicationDeployments(
      miroirConfig,
      domainController,
      deploymentConfigurations, 
    );
  }
)

afterEach(
  async () => {
    await resetApplicationDeployments(
      deploymentConfigurations,
      domainController,
      localCache,
    );
  }
)

describe.sequential(
  'DomainController.Model.undo-redo.React',
  () => {
    // ###########################################################################################
    it(
      'Add 2 entity definitions then undo one then commit',
      async () => {
        try {
          
          console.log('Add 2 entity definitions then undo one then commit start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = (userEvent as any).setup()

          // await localDataStore.clear();
          // await localDataStore.initModel();

          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityEntity.name}
              entityUuid={entityEntity.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:localCache.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 1: loading initial configuration, entities must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
              }, defaultMiroirMetaModel);
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
              }, defaultMiroirMetaModel);
            }
          );

          await act(()=>user.click(screen.getByRole('button')));
 
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() // Author entity
              // expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 2: adding entities, they must then be present in the local cache Entity list.')
          const createAuthorAction: DomainAction = {
            actionType: "modelAction",
            actionName: "createEntity",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
            entities: [
              {
                entity: entityAuthor as Entity,
                entityDefinition: entityDefinitionAuthor as EntityDefinition,
              }
            ]
          };
          const createBookAction: DomainAction = {
            actionType: "modelAction",
            actionName: "createEntity",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
            entities: [
              {
                entity: entityBook as Entity,
                entityDefinition: entityDefinitionBook as EntityDefinition,
              }
            ]
          };
  
          await act(
            async () => {
              await domainController.handleAction(
                createAuthorAction,
                defaultMiroirMetaModel
              );
              await domainController.handleAction(
                createBookAction,
                defaultMiroirMetaModel
              );
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          // transaction contents comparison depends on implementation
          // expect(
          //   (domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate)
          //     .modelEntityUpdate
          // ).toEqual(createAuthorAction.update.modelEntityUpdate);
          // expect(
          //   (domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate)
          //     .modelEntityUpdate
          // ).toEqual(createBookAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 3: undo 1 Entity creation, one Entity must still be present in the entity list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "undo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // transaction contents comparison depends on implementation
          // expect(
          //   (domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate)
          //     .modelEntityUpdate
          // ).toEqual(createAuthorAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
            }
          );

          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 4: redo 1 Entity creation, two Entities must be present in the entity list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "redo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          // transaction contents comparison depends on implementation
          // expect(
          //   (domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate)
          //     .modelEntityUpdate
          // ).toEqual(createAuthorAction.update.modelEntityUpdate);
          // expect(
          //   (domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate)
          //     .modelEntityUpdate
          // ).toEqual(createBookAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              getAllByRole(/step:4/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(getByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy() // Book Entity
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 5: undo 2 then redo 1 Entity creation, one Entity must be present in the entity list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "undo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "undo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "redo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
            }
          );
      
          await act(()=>user.click(screen.getByRole('button')));
      
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // transaction contents comparison depends on implementation
          // expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      
          await waitFor(
            () => {
              getAllByRole(/step:5/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
            }
          );
          // putting state back to where it was when test section started
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "redo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel );
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 6: undo 3 times, show that the extra undo is igored.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "undo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "undo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              },  defaultMiroirMetaModel);
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "undo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "redo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
            }
          );
      
          await act(()=>user.click(screen.getByRole('button')));
      
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // transaction contents comparison depends on implementation
          // expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      
          await waitFor(
            () => {
              getAllByRole(/step:6/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
            }
          );
          // putting state back to where it was when test section started
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "redo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 7: redo 1 time, show that the extra redo is igored. Commit then see that current transaction has no undo/redo')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "undoRedoAction",
                actionName: "redo",
                endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid
              }, defaultMiroirMetaModel);
            }
          );
      
          await act(()=>user.click(screen.getByRole('button')));
      
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          // transaction contents comparison depends on implementation
          // expect(
          //   (domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate)
          //     .modelEntityUpdate
          // ).toEqual(createAuthorAction.update.modelEntityUpdate);
          // expect(
          //   (domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate)
          //     .modelEntityUpdate
          // ).toEqual(createBookAction.update.modelEntityUpdate);

          await act(
            async () => {
              await domainController.handleAction(
                {
                  actionName: "commit",
                  actionType: "modelAction",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                },
                defaultMiroirMetaModel
              );
            }
          );
  
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:7/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(getByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy() // Book Entity
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )
  }
)

import { act, getAllByText, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import React from "react";

import { SetupWorkerApi } from "msw/browser";
// import { SetupServerApi } from "msw/lib/node";
import { setupServer } from "msw/node";

import {
  ConfigurationService,
  DomainAction,
  DomainControllerInterface,
  DomainDataAction,
  EntityDefinition,
  EntityInstance,
  IStoreController,
  LocalAndRemoteControllerInterface,
  MetaEntity,
  MiroirConfig,
  MiroirContext,
  StoreControllerFactory,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityEntity,
  entityReport,
  miroirCoreStartup,
  reportBookList
} from "miroir-core";
import {
  ReduxStore
} from "miroir-redux";

import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import { createReduxStoreAndRestClient } from "../../src/miroir-fwk/createReduxStoreAndRestClient";
import {
  DisplayLoadingInfo,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders
} from "../utils/tests-utils";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirStoreFileSystemStartup } from "miroir-store-filesystem";
import { miroirStoreIndexedDbStartup } from "miroir-store-indexedDb";
import { miroirStorePostgresStartup } from "miroir-store-postgres";
import { loadConfigFile } from "./DomainController.Data.CRUD.functions";

// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_filesystem-sql.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_sql-indexedDb.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_indexedDb-sql.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json";


// const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

console.log("@@@@@@@@@@@@@@@@@@ env", process.env["PWD"]);
console.log("@@@@@@@@@@@@@@@@@@ env", process.env["npm_config_env"]);
const miroirConfig:MiroirConfig = await loadConfigFile(process.env["PWD"]??"",process.env["npm_config_env"]??"");

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

miroirAppStartup();
miroirCoreStartup();
miroirStoreFileSystemStartup();
miroirStoreIndexedDbStartup();
miroirStorePostgresStartup();

let localMiroirStoreController: IStoreController;
let localAppStoreController: IStoreController;
let localDataStoreWorker: SetupWorkerApi | undefined;
let localDataStoreServer: any /**SetupServerApi | undefined */;
let reduxStore: ReduxStore;
let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;

beforeAll(
  async () => {
    const wrappedReduxStore = createReduxStoreAndRestClient(
      miroirConfig as MiroirConfig,
      fetch as any,
    );

    if (wrappedReduxStore) {
      reduxStore = wrappedReduxStore.reduxStore;
      domainController = wrappedReduxStore.domainController;
      miroirContext = wrappedReduxStore.miroirContext;
    }

    if (miroirConfig.emulateServer) {
      const {
        localMiroirStoreController:a,localAppStoreController:b
      } = await StoreControllerFactory(
        ConfigurationService.storeFactoryRegister,
        miroirConfig,
      );
      localMiroirStoreController = a;
      localAppStoreController = b;
  
      // Establish requests interception layer before all tests.
      const wrapped = await miroirBeforeAll(
        miroirConfig as MiroirConfig,
        setupServer,
        localMiroirStoreController,
        localAppStoreController,
      );

      if (wrapped) {
        localDataStoreWorker = wrapped.localDataStoreWorker;
        localDataStoreServer = wrapped.localDataStoreServer;
      }
    }
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach(miroirConfig, domainController, localMiroirStoreController,localAppStoreController);
  }
)

afterAll(
  async () => {
    await miroirAfterAll(miroirConfig, localMiroirStoreController,localAppStoreController,localDataStoreServer);
  }
)

afterEach(
  async () => {
    await miroirAfterEach(miroirConfig, localMiroirStoreController,localAppStoreController);
  }
)

describe(
  'DomainController.Model.CRUD',
  () => {
    // ###########################################################################################
    it(
      'Refresh all Entity definitions',
      async () => {
        console.log('Refresh all Entity definitions start');
        const displayLoadingInfo=<DisplayLoadingInfo/>
        const user = userEvent.setup()

        try {
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityEntity.name}
              entityUuid={entityEntity.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={applicationDeploymentMiroir.uuid}
              instancesApplicationSection="model"
            />
            ,
            {store:reduxStore.getInnerStore()}
          );
  
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityReport.uuid}`,'i'))).toBeTruthy() // Report
              expect(getByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy() // Entity
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
        expect(true).toBeTruthy() // Entity
      }
    )

    // ###########################################################################################
    it(
      'Add Entity then rollback',
      async () => {
        try {
          console.log('Add Entity then rollback start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.uuid}/>
          const user = userEvent.setup()
  
          // await localDataStore.clear();
          // await localDataStore.initModel(defaultMiroirMetaModel);
  
          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityEntity.name}
              entityUuid={entityEntity.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={applicationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('add Entity step 1: loading initial configuration, entity Author must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));

          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('add Entity definition step 2: adding entity Author, it must then be present in the local cache report list.')
          const createAction: DomainAction = {
            actionType:"DomainTransactionalAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedTransactionalEntityUpdate",
              modelEntityUpdate: {
                updateActionType: "ModelEntityUpdate",
                updateActionName: "createEntity",
                // parentName: entityDefinitionEntityDefinition.name,
                // parentUuid: entityDefinitionEntityDefinition.uuid,
                entities: [
                  {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
                ],
              },
            }
          };
  
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          console.log("createAction", createAction);
          expect(domainController.currentTransaction().length).toEqual(1);
          expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              // getAllByText(container,/finished/)
              getAllByText(container,/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('add Entity step 3: rollbacking/refreshing report list from remote store, Author Entity must be absent in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )

    // ###########################################################################################
    it(
      'Add entity then commit',
      async () => {
        try {
          console.log('Add Report definition then commit start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.uuid}/>
          const user = userEvent.setup()

          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityEntity.name}
              entityUuid={entityEntity.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={applicationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('add Entity Author step 1: loading initial configuration, Author entity must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
              // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
              // expect(absentReport).toBeNull() 
              // expect(screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
            }
          );

          // ##########################################################################################################
          console.log('add Entity step 2: adding Author entity, it must then be present in the local cache entity list.')
          const createAction: DomainAction = {
            actionType:"DomainTransactionalAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedTransactionalEntityUpdate",
              modelEntityUpdate: {
                updateActionType: "ModelEntityUpdate",
                updateActionName: "createEntity",
                entities: [
                  {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
                ],
              },
            }
          };
  
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction,reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAction.update.modelEntityUpdate);
  

          await waitFor(
            () => {
              // getAllByText(container,/finished/)
              getAllByText(container,/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('add Entity step 3: committing Author Entity to remote store, Author Entity must be present in the Entity list afterwards.')
          // console.log('reduxStore.currentModel(applicationDeploymentLibrary.uuid)',reduxStore.currentModel(applicationDeploymentLibrary.uuid))
          await act(
            async () => {
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid,
                { actionName: "commit", actionType: "DomainTransactionalAction" },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
              );
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('add Entity step step 4: rollbacking/refreshing Entity list from remote store after the first commit, Author Entity must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {actionName: "rollback",actionType:"DomainTransactionalAction"},reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:4/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
          // #####
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )

    // ###########################################################################################
    it(
      'Remove Entity then commit',
      async () => {
        try {
          console.log('remove Author entity start');
          const displayLoadingInfo=<DisplayLoadingInfo/>
          const user = userEvent.setup()

          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );

          const createAction: DomainAction = {
            actionType:"DomainTransactionalAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedTransactionalEntityUpdate",
              modelEntityUpdate: {
                updateActionType: "ModelEntityUpdate",
                updateActionName: "createEntity",
                entities: [
                  {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
                ],
              },
            }
          };

          console.log('remove Author entity setup: adding Author entity locally.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );

          console.log('remove Author entity setup: adding Author entity remotely by commit.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {actionName: "commit",actionType:"DomainTransactionalAction"},reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );

          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
              <TestUtilsTableComponent
                entityName={entityEntity.name}
                entityUuid={entityEntity.uuid}
                DisplayLoadingInfo={displayLoadingInfo}
                deploymentUuid={applicationDeploymentLibrary.uuid}
                instancesApplicationSection="model"
              />,
            {store:reduxStore.getInnerStore()}
            // {store:reduxStore.getInnerStore(),loadingStateService:loadingStateService}
          );
          
  
  
          // ##########################################################################################################
          console.log('remove Author entity step  1: refreshing entity list from remote store, Author entity must be present in the entity list.')
  
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByText(container,/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() 
            }
          );
  
          // ##########################################################################################################
          console.log('remove Entity step 2: removing Author entity from local store, it must be absent from the entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid, 
                {
                  actionType: "DomainTransactionalAction",
                  actionName: "updateEntity",
                  update: {
                    updateActionName: "WrappedTransactionalEntityUpdate",
                    modelEntityUpdate: {
                      updateActionType: "ModelEntityUpdate",
                      updateActionName: "DeleteEntity",
                      entityName: entityAuthor.name,
                      entityUuid: entityAuthor.uuid,
                    },
                  }
                  },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
              );
            }
          );
          
          await act(()=>user.click(screen.getByRole('button')));
          await waitFor(
            () => {
              getAllByText(container,/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
            }
          );
  
          // ##########################################################################################################
          console.log('remove Entity step 3: commit to remote store, Author entity must still be absent from the report list.')
          await act(
            async () => {
              await domainController.handleDomainTransactionalAction(
                applicationDeploymentLibrary.uuid,
                { actionName: "commit", actionType: "DomainTransactionalAction" },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
              );
            }
          );
          await act(()=>user.click(screen.getByRole('button')));
          await waitFor(
            () => {
              getAllByText(container,/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
            }
          );
  
          // ##########################################################################################################
          console.log('remove Entity step 4: rollbacking/refreshing entity list from remote store after the first commit, Author entity must still be absent in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:4/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )

    // ###########################################################################################
    it(
      'Update Entity then commit',
      async () => {
        try {
          console.log('update Author definition start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()
  
          if (miroirConfig.emulateServer) {
            await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
            await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
            // await localAppStoreController?.upsertInstance('model', reportBookList as EntityInstance);
            await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', author2 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', author3 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', book1 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', book2 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', book4 as EntityInstance);
          } else {  // remote server, cannot use localAppStoreController to initiate store, using DomainController
            const createAction: DomainAction = {
              actionType:"DomainTransactionalAction",
              actionName: "updateEntity",
              update: {
                updateActionName:"WrappedTransactionalEntityUpdate",
                modelEntityUpdate: {
                  updateActionType: "ModelEntityUpdate",
                  updateActionName: "createEntity",
                  // parentName: entityDefinitionEntityDefinition.name,
                  // parentUuid: entityDefinitionEntityDefinition.uuid,
                  entities: [
                    {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
                    {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
                  ],
                },
              }
            };

            await act(
              async () => {
                await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
              }
            );
              
            const createInstancesAction: DomainDataAction = {
              actionName: "create",
              actionType: "DomainDataAction",
              objects: [
                {
                  parentName: entityAuthor.name,
                  parentUuid: entityAuthor.uuid,
                  applicationSection: "data",
                  instances: [
                    author1 as EntityInstance,
                    author2 as EntityInstance,
                    author3 as EntityInstance,
                  ],
                },
                {
                  parentName: entityBook.name,
                  parentUuid: entityBook.uuid,
                  applicationSection: "data",
                  instances: [
                    book1 as EntityInstance,
                    book2 as EntityInstance,
                    book4 as EntityInstance,
                  ],
                },
              ],
            };
    
            await act(
              async () => {
                await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createInstancesAction);
              }
            );
  
          }
    
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );

          const createAction: DomainAction = {
            actionType:"DomainTransactionalAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedTransactionalEntityUpdate",
              modelEntityUpdate: {
                updateActionType: "ModelEntityUpdate",
                updateActionName: "createEntity",
                entities: [
                  {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
                ],
              },
            }
          };

          console.log('update Author entity setup: adding Author entity locally.');
          console.log('reduxStore',reduxStore);
          console.log('reduxStore.currentModel(applicationDeploymentLibrary.uuid).',reduxStore.currentModel(applicationDeploymentLibrary.uuid));
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction,reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );

          console.log('update Author entity setup: adding Author entity remotely by commit.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {actionName: "commit",actionType:"DomainTransactionalAction"},reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
  
          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityEntity.name}
              entityUuid={entityEntity.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={applicationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Update Author definition step 1: loading initial configuration, Author entity must be present in report list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() 
            }
          );
  
          // ##########################################################################################################
          console.log('Update Report definition step 2: update reportReportList, modified version must then be present in the report list.')
          // const updatedReport = 
          const updateAction: DomainAction = 
            {
              actionType: "DomainTransactionalAction",
              actionName: "updateEntity",
              update: {
                updateActionName:"WrappedTransactionalEntityUpdate",
                modelEntityUpdate:{
                  updateActionType:"ModelEntityUpdate",
                  updateActionName: "renameEntity",
                  entityName: entityAuthor.name,
                  entityUuid: entityAuthor.uuid,
                  targetValue: "Authorsss",
                },
              }
            }
          ;
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, updateAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))
  
          expect(domainController.currentTransaction().length).toEqual(1);
          expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(updateAction.update.modelEntityUpdate);
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Authorsss/i)).toBeTruthy() // Report List
            }
          );

          // ##########################################################################################################
          console.log('Update Author entity definition step 3: committing entity list to remote store, modified entity must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleDomainTransactionalAction(applicationDeploymentLibrary.uuid, {actionName: "commit",actionType:"DomainTransactionalAction"},reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByText(container,/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Authorsss/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('update Author entity definition step 4: rollbacking/refreshing entity list from remote store after the first commit, modified entity must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:4/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Authorsss/i)).toBeTruthy() // Report List
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      },
      10000
    )
  }
)

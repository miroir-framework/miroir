import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { SetupWorkerApi } from "msw/browser";
// import { SetupServerApi } from "msw/lib/node";
import { SetupServerApi, setupServer } from "msw/node";

import {
  DomainAction,
  DomainControllerInterface,
  EntityDefinition,
  EntityInstance,
  PersistenceStoreControllerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirContext,
  MiroirLoggerFactory,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book4,
  defaultLevels,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityEntity,
  entityReport,
  miroirCoreStartup,
  JzodElement,
  entityEntityDefinition,
  Entity,
  InstanceAction,
  reportReportList
} from "miroir-core";

import { LocalCache } from "miroir-localcache-redux";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import {
  DisplayLoadingInfo,
  loadTestConfigFiles,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders
} from "../utils/tests-utils.js";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import { loglevelnext } from '../../src/loglevelnextImporter';

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);

MiroirLoggerFactory.setEffectiveLoggerFactory(
  loglevelnext,
  (defaultLevels as any)[loggerOptions.defaultLevel],
  loggerOptions.defaultTemplate,
  loggerOptions.specificLoggerOptions
);

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();


let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let localDataStoreWorker: SetupWorkerApi | undefined;
let localDataStoreServer: any /**SetupServerApi | undefined */;
let localCache: LocalCache;
let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;

beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    const wrapped = await miroirBeforeAll(
      miroirConfig as MiroirConfigClient,
      setupServer,
    );

    if (wrapped) {
      if (wrapped.localMiroirPersistenceStoreController && wrapped.localAppPersistenceStoreController) {
        localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
        localAppPersistenceStoreController = wrapped.localAppPersistenceStoreController;
      }
      localCache = wrapped.localCache;
      miroirContext = wrapped.miroirContext;
      domainController = wrapped.domainController;
      localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
      localDataStoreServer = wrapped.localDataStoreServer as SetupServerApi;
    } else {
      throw new Error("beforeAll failed initialization!");
    }
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach(
      miroirConfig,
      domainController,
      localMiroirPersistenceStoreController,
      localAppPersistenceStoreController
    );
  }
)

afterAll(
  async () => {
    await miroirAfterAll(
      miroirConfig,
      domainController,
      localMiroirPersistenceStoreController,
      localAppPersistenceStoreController,
      localDataStoreServer
    );
  }
)

afterEach(
  async () => {
    await miroirAfterEach(miroirConfig, domainController, localMiroirPersistenceStoreController,localAppPersistenceStoreController);
  }
)

describe.sequential(
  'DomainController.Model.CRUD',
  () => {

    // ###########################################################################################
    it('Refresh all Entity definitions',
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
              deploymentUuid={adminConfigurationDeploymentMiroir.uuid}
              instancesApplicationSection="model"
            />
            ,
            {store:localCache.getInnerStore()}
          );
  
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
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
              // expect(getByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy() // Entity
              // expect(false,'success during test ' +  expect.getState().currentTestName).toBeTruthy();
            }
          );
        } catch (error) {
          // console.error('error during test',expect.getState().currentTestName,"ERROR:", error);
          // expect(true).toBeTruthy();
          expect(false,'error during test ' +  expect.getState().currentTestName + " ERROR: " + error).toBeTruthy();
        }
        expect(true).toBeTruthy() // Entity
      }
    )

    // ###########################################################################################
    it('Add Entity then rollback',
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
              deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:localCache.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('add Entity step 1: loading initial configuration, entity Author must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
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
          console.log('add Entity step 2: adding entity Author, it must then be present in the local cache report list.')
          const createAction: DomainAction = {
                actionType: "modelAction",
                actionName: "createEntity",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                entities: [
                  {
                    entity: entityAuthor as Entity,
                    entityDefinition: entityDefinitionAuthor as EntityDefinition,
                  }
                ]
          };
  
          await act(
            async () => {
              await domainController.handleAction(
                createAction,
                localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
              );
            }
          );

          await act(()=>user.click(screen.getByRole('button')));

          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          console.log("createAction", createAction);
          expect(domainController.currentTransaction().length).toEqual(1);
          // testing for transaction contents is implementation-dependent!
          // expect(
          //   (
          //     (domainController.currentTransaction()[0] as DomainTransactionalActionWithCUDUpdate)
          //       .update as WrappedTransactionalEntityUpdateWithCUDUpdate
          //   ).modelEntityUpdate
          // ).toEqual(createAction.update.modelEntityUpdate);

          await waitFor(
            () => {
              // getAllByText(container,/finished/)
              getAllByRole(/step:2/)
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
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:3/)
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
    it('Add entity then commit',
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
              deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:localCache.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('add Entity Author step 1: loading initial configuration, Author entity must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
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
            actionType: "modelAction",
            actionName: "createEntity",
            deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            entities: [
              {
                entity: entityAuthor as MetaEntity,
                entityDefinition: entityDefinitionAuthor as EntityDefinition,
              }
            ]
          };
  
          await act(
            async () => {
              await domainController.handleAction(createAction,localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // IMPLEMENTATION-SPECIFIC DETAILS
          // expect(domainController.currentTransaction()[0].actionType).toEqual("DomainTransactionalInstanceAction");
          // expect(
          //   (
          //     (domainController.currentTransaction()[0] as DomainTransactionalActionWithCUDUpdate)
          //       .update as WrappedTransactionalEntityUpdateWithCUDUpdate
          //   ).modelEntityUpdate
          // ).toEqual(createAction.update.modelEntityUpdate);
  

          await waitFor(
            () => {
              // getAllByText(container,/finished/)
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('add Entity step 3: committing Author Entity to remote store, Author Entity must be present in the Entity list afterwards.')
          // log.info('localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)',localCache.currentModel(adminConfigurationDeploymentLibrary.uuid))
          await act(
            async () => {
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
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:3/)
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
              await domainController.handleAction(
                {
                  actionType: "modelAction",
                  actionName: "rollback",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                },
                localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
              );
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:4/)
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
    it('Remove Entity then commit',
      async () => {
        try {
          console.log('remove Author entity start');
          const displayLoadingInfo=<DisplayLoadingInfo/>
          const user = userEvent.setup()

          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );

          const createAction: DomainAction = {
            actionType: "modelAction",
            actionName: "createEntity",
            deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            entities: [
              {
                entity: entityAuthor as MetaEntity,
                entityDefinition: entityDefinitionAuthor as EntityDefinition,
              }
            ]
          };

          console.log('remove Author entity setup: adding Author entity locally.')
          await act(
            async () => {
              await domainController.handleAction(
                createAction,
                localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
              );
            }
          );

          console.log('remove Author entity setup: adding Author entity remotely by commit.')
          await act(
            async () => {
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
          );
          console.log('remove Author entity setup: adding Author entity remotely by commit DONE.')

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
            {store:localCache.getInnerStore()}
            // {store:localCache.getInnerStore(),loadingStateService:loadingStateService}
          );
          
  
  
          // ##########################################################################################################
          console.log('remove Author entity step  1: refreshing entity list from remote store, Author entity must be present in the entity list.')
  
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
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
          console.log('remove Author entity step 1 DONE.')
  
          // ##########################################################################################################
          console.log('remove Author entity step 2: removing Author entity from local store, it must be absent from the entity list.')
          await act(
            async () => {
              await domainController.handleAction(
                {
                  actionType: "modelAction",
                  actionName: "dropEntity",
                  deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  // entityName: entityAuthor.name,
                  entityUuid: entityAuthor.uuid,
                  entityDefinitionUuid: entityDefinitionAuthor.uuid,
                },
                localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
              );
              console.log("remove Author entity step 2: removing Author entity from local store DONE")
            }
          );
          
          console.log("remove Author entity step 2: before clicking button")
          await act(()=>user.click(screen.getByRole('button')));
          console.log("remove Author entity step 2: wait for screen refresh")
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              console.log("remove Author entity step 2: screen refresh done, testing now.")
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              console.log("remove Author entity step 2: testing DONE.")
            }
          );
          console.log("remove Author entity step 2 DONE.")
  
          // ##########################################################################################################
          console.log('remove Author entity step 3: commit to remote store, Author entity must still be absent from the report list.')
          await act(
            async () => {
              await domainController.handleAction(
                {
                  actionName: "commit",
                  actionType: "modelAction",
                  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                },
                localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
              );
              console.log("remove Author entity step 3: commit to remote store DONE")
            }
          );
          await act(()=>user.click(screen.getByRole('button')));
          await waitFor(
            () => {
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
            }
          );
          console.log("remove Author entity step 3 DONE.")
  
          // ##########################################################################################################
          console.log('remove Entity step 4: rollbacking/refreshing entity list from remote store after the first commit, Author entity must still be absent in the report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:4/)
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
    it('Rename Entity then commit',
      async () => {
        try {
          console.log('update Author definition start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()
  
          if (miroirConfig.client.emulateServer) {
            await localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
            await localAppPersistenceStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
            // await localAppPersistenceStoreController?.upsertInstance('model', reportBookList as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', author1 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', author2 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', author3 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', book1 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', book2 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', book4 as EntityInstance);
          } else {  // remote server, cannot use localAppPersistenceStoreController to initiate store, using DomainController
            const createActionAuthor: DomainAction = {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entities: [
                {
                  entity: entityAuthor as Entity,
                  entityDefinition: entityDefinitionAuthor as EntityDefinition,
                }
              ]
            };
            const createActionBook: DomainAction = {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
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
                  createActionAuthor,
                  localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
                );
                await domainController.handleAction(
                  createActionBook,
                  localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
                );
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
            );
              
            const createInstancesAction: InstanceAction = {
              actionType: "instanceAction",
              actionName: "createInstance",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              applicationSection: "data",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                await domainController.handleAction(createInstancesAction);
              }
            );
          } // end if (miroirConfig.client.emulateServer)
    
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
          console.log('Update Author definition step 1: loading initial configuration, Author entity must be present in report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
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
              actionType:"modelAction",
              actionName: "renameEntity",
              deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entityName: entityAuthor.name,
              entityUuid: entityAuthor.uuid,
              entityDefinitionUuid: entityDefinitionAuthor.uuid,
              targetValue: "Authorsss",
            }
          ;
          await act(
            async () => {
              await domainController.handleAction(updateAction, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
            }
          );
  
          console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))
  
          expect(domainController.currentTransaction().length).toEqual(1);
          // testing transaction contents is implementation dependent!
          // expect(domainController.currentTransaction()[0].actionType).toEqual("DomainTransactionalInstanceAction");
          // expect(
          //   (
          //     (domainController.currentTransaction()[0] as DomainTransactionalActionWithCUDUpdate)
          //       .update as WrappedTransactionalEntityUpdateWithCUDUpdate
          //   ).modelEntityUpdate
          // ).toEqual(createAction.update.modelEntityUpdate);
  
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
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:3/)
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
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:4/)
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

    // ###########################################################################################
    // TODO
    it('Alter Entity definition then commit',
      async () => {
        try {
          console.log('update Author definition start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()
  
          if (miroirConfig.client.emulateServer) {
            await localAppPersistenceStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
            await localAppPersistenceStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
            // await localAppPersistenceStoreController?.upsertInstance('model', reportBookList as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', author1 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', author2 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', author3 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', book1 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', book2 as EntityInstance);
            await localAppPersistenceStoreController?.upsertInstance('data', book4 as EntityInstance);
          } else {  // remote server, cannot use localAppPersistenceStoreController to initiate store, using DomainController
            const createActionAuthor: DomainAction = {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entities: [
                {
                  entity: entityAuthor as Entity,
                  entityDefinition: entityDefinitionAuthor as EntityDefinition,
                }
              ]
            };
            const createActionBook: DomainAction = {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
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
                  createActionAuthor,
                  localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
                );
                await domainController.handleAction(
                  createActionBook,
                  localCache.currentModel(adminConfigurationDeploymentLibrary.uuid)
                );
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
            );
              
            const createInstancesAction: InstanceAction = {
              actionType: "instanceAction",
              actionName: "createInstance",
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              applicationSection: "data",
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
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
                await domainController.handleAction(createInstancesAction);
              }
            );
          } // end if (miroirConfig.client.emulateServer)
    
          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityEntityDefinition.name}
              entityUuid={entityEntityDefinition.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:localCache.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Update Author definition step 1: loading initial configuration, Author entity must be present in report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityDefinitionAuthor.uuid}`,'i'))).toBeTruthy() 
            }
          );
  
          // ##########################################################################################################
          console.log('Update Report definition step 2: update reportReportList, modified version must then be present in the report list.')
          // const updatedReport = 
          const iconsDefinition: JzodElement = {
            "type": "number", "optional": true, "tag": { "value": { "id":6, "defaultLabel": "Gender (narrow-minded)", "editable": true }}
          };
      
          const updateAction: DomainAction = 
            {
              actionType:"modelAction",
              actionName: "alterEntityAttribute",
              deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entityName: entityAuthor.name,
              entityUuid: entityAuthor.uuid,
              entityDefinitionUuid: entityDefinitionAuthor.uuid,
              // targetValue: "Authorsss",
              addColumns: [
                {
                  "name": "aNewColumnForTest",
                  "definition": iconsDefinition
                }
              ],
            }
          ;
          await act(
            async () => {
              await domainController.handleAction(updateAction, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
            }
          );
  
          console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))
  
          expect(domainController.currentTransaction().length).toEqual(1);
          // testing transaction contents is implementation dependent!
          // expect(domainController.currentTransaction()[0].actionType).toEqual("DomainTransactionalInstanceAction");
          // expect(
          //   (
          //     (domainController.currentTransaction()[0] as DomainTransactionalActionWithCUDUpdate)
          //       .update as WrappedTransactionalEntityUpdateWithCUDUpdate
          //   ).modelEntityUpdate
          // ).toEqual(createAction.update.modelEntityUpdate);
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/aNewColumnForTest/i)).toBeTruthy() // Report List
            }
          );

          // ##########################################################################################################
          console.log('Update Author entity Attribute definition step 3: committing entity definition to remote store, modified entity must still be present in the report list.')
          await act(
            async () => {
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
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/icons/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('update Author entity definition step 4: rollbacking/refreshing entity definition list from remote store after the first commit, modified entity must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:4/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/icons/i)).toBeTruthy() // Entity Definition List
            }
          );

          // end test
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      },
      10000
    )

    // ###########################################################################################
    // TODO
    it('Alter Miroir Model Report definition then commit',
      async () => {
        try {
          console.log('Alter Miroir Model Report definition start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()
  
          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityReport.name}
              entityUuid={entityReport.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={adminConfigurationDeploymentMiroir.uuid}
              instancesApplicationSection="data"
            />,
            {store:localCache.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Alter Miroir Model Report definition step 1: loading initial configuration, Author entity must be present in report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${reportReportList.uuid}`,'i'))).toBeTruthy() 
            }
          );
  
          // ##########################################################################################################
          console.log('Alter Miroir Model Report definition step 2: update reportReportList, modified version must then be present in the report list.')
          // const updatedReport = 
          // const iconsDefinition: JzodElement = {
          //   "type": "number", "optional": true, "extra": { "id":6, "defaultLabel": "Gender (narrow-minded)", "editable": true }
          // };

          const updateAction: DomainAction = {
            actionType: "transactionalInstanceAction",
            instanceAction: {
              actionType: "instanceAction",
              actionName: "updateInstance",
              applicationSection: "data",
              deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              objects: [
                {
                  parentName: reportReportList.parentName,
                  parentUuid: reportReportList.parentUuid,
                  applicationSection: "data",
                  instances: [
                    Object.assign({}, reportReportList, {
                      name: "Report2List",
                      defaultLabel: "Modified List of Reports",
                    }) as EntityInstance,
                  ],
                },
              ],
            }
          };

          await act(
            async () => {
              await domainController.handleAction(updateAction, localCache.currentModel(adminConfigurationDeploymentMiroir.uuid));
            }
          );
  
          console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))
  
          expect(domainController.currentTransaction().length).toEqual(1);
          // testing transaction contents is implementation dependent!
          // expect(domainController.currentTransaction()[0].actionType).toEqual("DomainTransactionalInstanceAction");
          // expect(
          //   (
          //     (domainController.currentTransaction()[0] as DomainTransactionalActionWithCUDUpdate)
          //       .update as WrappedTransactionalEntityUpdateWithCUDUpdate
          //   ).modelEntityUpdate
          // ).toEqual(createAction.update.modelEntityUpdate);
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
            }
          );

          // ##########################################################################################################
          console.log('Alter Miroir Model Report definition step 3: committing entity definition to remote store, modified entity must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleAction(
                {
                  actionName: "commit",
                  actionType: "modelAction",
                  deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                },
                localCache.currentModel(adminConfigurationDeploymentMiroir.uuid)
              );
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('Alter Miroir Model Report definition step 4: rollbacking/refreshing entity definition list from remote store after the first commit, modified entity must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:4/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Entity Definition List
            }
          );

          // end test
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      },
      10000
    )

  }
)

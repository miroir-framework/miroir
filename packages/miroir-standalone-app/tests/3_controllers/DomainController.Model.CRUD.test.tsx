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
  DomainNonTransactionalInstanceAction,
  EntityDefinition,
  EntityInstance,
  StoreControllerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirContext,
  MiroirLoggerFactory,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
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
  Entity
} from "miroir-core";

import { ReduxStore } from "miroir-localcache-redux";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import {
  DisplayLoadingInfo,
  loadTestConfigFiles,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders
} from "../utils/tests-utils";

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


let localMiroirStoreController: StoreControllerInterface;
let localAppStoreController: StoreControllerInterface;
let localDataStoreWorker: SetupWorkerApi | undefined;
let localDataStoreServer: any /**SetupServerApi | undefined */;
let reduxStore: ReduxStore;
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
      if (wrapped.localMiroirStoreController && wrapped.localAppStoreController) {
        localMiroirStoreController = wrapped.localMiroirStoreController;
        localAppStoreController = wrapped.localAppStoreController;
      }
      reduxStore = wrapped.reduxStore;
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
    await miroirBeforeEach(miroirConfig, domainController, localMiroirStoreController,localAppStoreController);
  }
)

afterAll(
  async () => {
    await miroirAfterAll(miroirConfig, domainController, localMiroirStoreController,localAppStoreController,localDataStoreServer);
  }
)

afterEach(
  async () => {
    await miroirAfterEach(miroirConfig, domainController, localMiroirStoreController,localAppStoreController);
  }
)

describe.sequential(
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid,
                createAction,
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction,reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // IMPLEMENTATION-SPECIFIC DETAILS
          // expect(domainController.currentTransaction()[0].actionType).toEqual("DomainTransactionalAction");
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
          // log.info('reduxStore.currentModel(applicationDeploymentLibrary.uuid)',reduxStore.currentModel(applicationDeploymentLibrary.uuid))
          await act(
            async () => {
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid,
                { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
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
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid,
                { actionType: "modelAction", actionName: "rollback", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
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
    it(
      'Remove Entity then commit',
      async () => {
        try {
          console.log('remove Author entity start');
          const displayLoadingInfo=<DisplayLoadingInfo/>
          const user = userEvent.setup()

          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );

          const createAction: DomainAction = {
            actionType: "modelAction",
            actionName: "createEntity",
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
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid,
                createAction,
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
              );
            }
          );

          console.log('remove Author entity setup: adding Author entity remotely by commit.')
          await act(
            async () => {
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid,
                { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid, 
                {
                  actionType: "modelAction",
                  actionName: "dropEntity",
                  endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  // entityName: entityAuthor.name,
                  entityUuid: entityAuthor.uuid,
                  entityDefinitionUuid: entityDefinitionAuthor.uuid,
                },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
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
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid,
                { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
    it(
      'Rename Entity then commit',
      async () => {
        try {
          console.log('update Author definition start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()
  
          if (miroirConfig.client.emulateServer) {
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
            const createActionAuthor: DomainAction = {
              actionType: "modelAction",
              actionName: "createEntity",
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
                await domainController.handleDomainAction(
                  applicationDeploymentLibrary.uuid,
                  createActionAuthor,
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
                await domainController.handleDomainAction(
                  applicationDeploymentLibrary.uuid,
                  createActionBook,
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
                await domainController.handleDomainAction(
                  applicationDeploymentLibrary.uuid,
                  { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", },
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
              }
            );
              
            const createInstancesAction: DomainNonTransactionalInstanceAction = {
              actionType: "DomainNonTransactionalInstanceAction",
              instanceAction: {
                actionType: "instanceAction",
                actionName: "createInstance",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                applicationSection: "data",
                deploymentUuid: applicationDeploymentLibrary.uuid,
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
              }
            };
    
            await act(
              async () => {
                await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createInstancesAction);
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
              deploymentUuid={applicationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Update Author definition step 1: loading initial configuration, Author entity must be present in report list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entityName: entityAuthor.name,
              entityUuid: entityAuthor.uuid,
              entityDefinitionUuid: entityDefinitionAuthor.uuid,
              targetValue: "Authorsss",
            }
          ;
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, updateAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))
  
          expect(domainController.currentTransaction().length).toEqual(1);
          // testing transaction contents is implementation dependent!
          // expect(domainController.currentTransaction()[0].actionType).toEqual("DomainTransactionalAction");
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
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid,
                { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
    it(
      'Alter Entity definition then commit',
      async () => {
        try {
          console.log('update Author definition start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()
  
          if (miroirConfig.client.emulateServer) {
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
            const createActionAuthor: DomainAction = {
              actionType: "modelAction",
              actionName: "createEntity",
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
                await domainController.handleDomainAction(
                  applicationDeploymentLibrary.uuid,
                  createActionAuthor,
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
                await domainController.handleDomainAction(
                  applicationDeploymentLibrary.uuid,
                  createActionBook,
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
                await domainController.handleDomainAction(
                  applicationDeploymentLibrary.uuid,
                  { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", },
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
              }
            );
              
            const createInstancesAction: DomainNonTransactionalInstanceAction = {
              actionType: "DomainNonTransactionalInstanceAction",
              instanceAction: {
                actionType: "instanceAction",
                actionName: "createInstance",
                endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
                applicationSection: "data",
                deploymentUuid: applicationDeploymentLibrary.uuid,
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
              }
            };
    
            await act(
              async () => {
                await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createInstancesAction);
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
              deploymentUuid={applicationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Update Author definition step 1: loading initial configuration, Author entity must be present in report list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
            "type": "simpleType", "definition": "number", "optional": true, "extra": { "id":6, "defaultLabel": "Gender (narrow-minded)", "editable": true }
          };
      
          const updateAction: DomainAction = 
            {
              actionType:"modelAction",
              actionName: "alterEntityAttribute",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entityName: entityAuthor.name,
              entityUuid: entityAuthor.uuid,
              entityDefinitionUuid: entityDefinitionAuthor.uuid,
              // targetValue: "Authorsss",
              addColumns: [
                {
                  "name": "icons",
                  "definition": iconsDefinition
                }
              ],
            }
          ;
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, updateAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))
  
          expect(domainController.currentTransaction().length).toEqual(1);
          // testing transaction contents is implementation dependent!
          // expect(domainController.currentTransaction()[0].actionType).toEqual("DomainTransactionalAction");
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
              expect(screen.queryByText(/icons/i)).toBeTruthy() // Report List
            }
          );

          // ##########################################################################################################
          console.log('Update Author entity Attribute definition step 3: committing entity definition to remote store, modified entity must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid,
                { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e" },
                reduxStore.currentModel(applicationDeploymentLibrary.uuid)
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
                actionType: "modelAction",
                actionName: "rollback",
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
  }
)

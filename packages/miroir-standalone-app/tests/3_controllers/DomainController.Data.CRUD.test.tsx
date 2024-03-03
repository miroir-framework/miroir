import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupWorkerApi } from "msw/browser";
import { setupServer, SetupServerApi } from "msw/node";
import React from "react";
import { describe, expect } from 'vitest';

// import process from "process";

import {
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  defaultLevels,
  DomainAction,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  EntityInstance,
  StoreControllerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirContext,
  miroirCoreStartup,
  MiroirLoggerFactory,
  reportBookList,
  InstanceAction
} from "miroir-core";

import {
  DisplayLoadingInfo,
  loadTestConfigFiles,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders
} from "miroir-standalone-app/tests/utils/tests-utils";


import { refreshAllInstancesTest } from "./DomainController.Data.CRUD.functions";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import { ReduxStore } from "miroir-localcache-redux";
import { TestUtilsTableComponent } from "../utils/TestUtilsTableComponent";

import { loglevelnext } from '../../src/loglevelnextImporter';


// jest intercepts logs, only console.log will produce test output
// const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController.Data.CRUD");
// let log:LoggerInterface = console as any as LoggerInterface;
// MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
//   (value: LoggerInterface) => {
//     log = value;
//   }
// );


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
let localDataStoreServer: any /**SetupServerApi | undefined */;
let localDataStoreWorker: SetupWorkerApi | undefined;
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

    return Promise.resolve();
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
    await miroirAfterEach(miroirConfig, domainController, localMiroirStoreController, localAppStoreController);
  }
)

describe.sequential('DomainController.Data.CRUD',
  () => {

    // ###########################################################################################
    it('Refresh all Instances',
      async() => {
        await refreshAllInstancesTest(
          miroirConfig,
          localMiroirStoreController,
          localAppStoreController,
          reduxStore,
          domainController,
          miroirContext,
        );
        return Promise.resolve();
      }
    )

    // ###########################################################################################
    it('Add Book instance then rollback',
      async () => {
        try {
          console.log('Add Book instance then rollback start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = userEvent.setup()
  
          // await localDataStore.clear();
          // await localDataStore.initModel();
          if (miroirConfig.client.emulateServer) {
            await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
            await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
            await localAppStoreController?.upsertInstance('model', reportBookList as EntityInstance);
            await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', author2 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', author3 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', book1 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', book2 as EntityInstance);
            // await localAppStoreController?.upsertInstance('data',book3.parentUuid, book3 as Instance);
            await localAppStoreController?.upsertInstance('data', book4 as EntityInstance);
          } else {
            const createAction: DomainAction = {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid:applicationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entities: [
                {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
                {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
              ],
            };

            await act(
              async () => {
                await domainController.handleAction(
                  createAction,
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
                await domainController.handleAction(
                  {
                    actionName: "commit",
                    actionType: "modelAction",
                    deploymentUuid: applicationDeploymentLibrary.uuid,
                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  },
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
              }
            );
              
            const createInstancesAction: InstanceAction = {
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
            };
    
            await act(
              async () => {
                await domainController.handleAction(createInstancesAction);
              }
            );
  
          }

          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={applicationDeploymentLibrary.uuid}
            />
            ,
            {store:reduxStore.getInnerStore()}
          );
  
          // ##########################################################################################################
          console.log('add Book step 1: the Book must be absent in the local cache report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:applicationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:applicationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );
          console.log('add Book step 1: done replace.')
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );

          // ##########################################################################################################
          console.log('add Book instance step 2: the Book must then be present in the local cache report list.')
          const createAction: InstanceAction = {
            actionType: "instanceAction",
            actionName: "createInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            applicationSection: "data",
            deploymentUuid: applicationDeploymentLibrary.uuid,
            objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,applicationSection:'data',instances:[book3 as EntityInstance]}]
          };

          await act(
            async () => {
              await domainController.handleAction(createAction);
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          // data operations are not transactional
          expect(domainController.currentTransaction().length).toEqual(0);
          // expect(domainController.currentTransaction()[0]).toEqual(createAction);
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );

          // ##########################################################################################################
          console.log('add Book instance step 3: rollbacking/refreshing report list from remote store, added book must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:applicationDeploymentLibrary.uuid,
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
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )

    // ###########################################################################################
    it('Remove Book instance then rollback',
      async () => {

        try {
          
          console.log('Remove Book instance then rollback start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = userEvent.setup()

          if (miroirConfig.client.emulateServer) {
            await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
            await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
            await localAppStoreController.upsertInstance('model', reportBookList as EntityInstance);
            await localAppStoreController.upsertInstance('data', author1 as EntityInstance);
            await localAppStoreController.upsertInstance('data', author2 as EntityInstance);
            await localAppStoreController.upsertInstance('data', author3 as EntityInstance);
            await localAppStoreController.upsertInstance('data', book1 as EntityInstance);
            await localAppStoreController.upsertInstance('data', book2 as EntityInstance);
            await localAppStoreController.upsertInstance('data', book3 as EntityInstance);
            await localAppStoreController.upsertInstance('data', book4 as EntityInstance);
          } else {
            const createAction: DomainAction = {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid:applicationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entities: [
                {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
                {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
              ],
            };

            await act(
              async () => {
                await domainController.handleAction(createAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
                await domainController.handleAction(
                  {
                    actionName: "commit",
                    actionType: "modelAction",
                    deploymentUuid: applicationDeploymentLibrary.uuid,
                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  },
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
              }
            );
              
            const createInstancesAction: InstanceAction = {
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
                    book3 as EntityInstance,
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
          }
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              // parentName="Book"
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={applicationDeploymentLibrary.uuid}
            />
            ,
            {store:reduxStore.getInnerStore()}
          );
  
          // ##########################################################################################################
          console.log('Remove Book instance step 1: the Book must be present in the local cache report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:applicationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:applicationDeploymentLibrary.uuid,
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
              // expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );
  
          // ##########################################################################################################
          console.log('remove Book instance step 2: the Book must then be absent from the local cache report list.')
          const deleteAction: InstanceAction = {
            actionType: "instanceAction",
            actionName: "deleteInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            applicationSection: "data",
            deploymentUuid: applicationDeploymentLibrary.uuid,
            objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,applicationSection:'data', instances:[book3 as EntityInstance]}]
          };
  
          await act(
            async () => {
              await domainController.handleAction(deleteAction);
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          // data operations are not transactional
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );

          // ##########################################################################################################
          console.log('Remove Book instance step 3: rollbacking/refreshing book list from remote store, removed book must still be absent from the report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid: applicationDeploymentLibrary.uuid,
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
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )

    // ###########################################################################################
    it('Update Book instance then commit',
      async () => {
        try {
          
          console.log('update Book instance start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = userEvent.setup()

          // await localDataStore.clear();
          // await localDataStore.initModel();
          if (miroirConfig.client.emulateServer) {
            await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
            await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
            await localAppStoreController?.upsertInstance('model', reportBookList as EntityInstance);
            await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', author2 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', author3 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', book1 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', book2 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', book3 as EntityInstance);
            await localAppStoreController?.upsertInstance('data', book4 as EntityInstance);
          } else {
            const createAction: DomainAction = {
              actionType: "modelAction",
              actionName: "createEntity",
              deploymentUuid:applicationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              entities: [
                {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
                {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
              ],
            };

            await act(
              async () => {
                await domainController.handleAction(createAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
                await domainController.handleAction(
                  {
                    actionName: "commit",
                    actionType: "modelAction",
                    deploymentUuid: applicationDeploymentLibrary.uuid,
                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                  },
                  reduxStore.currentModel(applicationDeploymentLibrary.uuid)
                );
              }
            );
              
            const createInstancesAction: InstanceAction = {
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
                    book3 as EntityInstance,
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
          }

          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              // parentName="Book"
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={applicationDeploymentLibrary.uuid}
            />
            ,
            {store:reduxStore.getInnerStore()}
          );
  
          // ##########################################################################################################
          console.log('Update Book instance step 1: loading initial configuration, book must be present in report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:applicationDeploymentLibrary.uuid,
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
              // expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );
  
          // ##########################################################################################################
          console.log('Update Book instance step 2: update reportReportList, modified version must then be present in the report list.')
          const updateAction: InstanceAction = {
            actionType: "instanceAction",
            actionName: "updateInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            applicationSection: "data",
            deploymentUuid: applicationDeploymentLibrary.uuid,
            objects: [
              {
                parentName: book4.parentName,
                parentUuid: book4.parentUuid,
                applicationSection:'data',
                instances: [
                  Object.assign({},book4,{"name":"Tthe Bride Wore Blackk", "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"}) as EntityInstance
                ],
              },
            ],
          };
          await act(
            async () => {
              await domainController.handleAction(updateAction);
            }
          );
  
          // update does not generate any redo / undo
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Tthe Bride Wore Blackk/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('Update Book instance step 3: refreshing book list from remote store, modified bool must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:applicationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              });
            }
          );

          await act(()=>user.click(screen.getByRole('button')));

          await waitFor(
            () => {
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Tthe Bride Wore Blackk/i)).toBeTruthy() // Report List
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )
  } //  end describe('DomainController.Data.CRUD',
)

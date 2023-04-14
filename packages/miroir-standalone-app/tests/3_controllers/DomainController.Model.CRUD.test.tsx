/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { act, getAllByText, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import React from "react";

const fetch = require('node-fetch');


import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

import { SetupWorkerApi } from "msw";
import { SetupServerApi } from "msw/node";

import {
  DataStoreInterface,
  DomainAction,
  DomainControllerInterface,
  EntityDefinition,
  LocalAndRemoteControllerInterface,
  MetaEntity,
  MiroirConfig,
  MiroirContext,
  WrappedModelEntityUpdateWithCUDUpdate,
  entityEntity,
  entityReport,
  miroirCoreStartup
} from "miroir-core";
import {
  ReduxStore
} from "miroir-redux";

import entityAuthor from "miroir-standalone-app/src/assets/entities/EntityAuthor.json";
import entityDefinitionAuthor from "miroir-standalone-app/src/assets/entityDefinitions/Author.json";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import config from "miroir-standalone-app/tests/miroirConfig.test.json";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import { DisplayLoadingInfo, miroirAfterAll, miroirAfterEach, miroirBeforeAll, miroirBeforeEach, renderWithProviders } from "miroir-standalone-app/tests/utils/tests-utils";

miroirAppStartup();
miroirCoreStartup();

let localDataStore: DataStoreInterface;
let localDataStoreWorker: SetupWorkerApi;
let localDataStoreServer: SetupServerApi;
let reduxStore: ReduxStore;
let localAndRemoteController: LocalAndRemoteControllerInterface;
let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;

beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    const wrapped = await miroirBeforeAll(
      config as MiroirConfig,
      'nodejs',
      fetch,
      setupServer
    );
    if (wrapped) {
      localDataStore = wrapped.localDataStore as DataStoreInterface;
      localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
      localDataStoreServer = wrapped.localDataStoreServer as SetupServerApi;
      reduxStore = wrapped.reduxStore;
      domainController = wrapped.domainController;
      miroirContext = wrapped.miroirContext;
    }
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach(localDataStore);
  }
)

afterAll(
  async () => {
    await miroirAfterAll(localDataStore,localDataStoreServer);
  }
)

afterEach(
  async () => {
    await miroirAfterEach(localDataStore);
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

        // console.log('localDataStore?.clear()');
        // await localDataStore?.clear();
        try {
          await localDataStore.dropModel();
          await localDataStore.initModel();
  
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityEntity.name}
              entityUuid={entityEntity.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
            />
            ,
            {store:reduxStore.getInnerStore()}
          );
  
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
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
      }
    )

    // ###########################################################################################
    it(
      'Add Report definition then rollback',
      async () => {
        try {
          console.log('Add Report definition then rollback start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.uuid}/>
          const user = userEvent.setup()
  
          await localDataStore.dropModel();
          await localDataStore.initModel();
          // await localDataStore?.upsertInstance(entityDefinitionEntityDefinition.parentUuid, entityDefinitionEntityDefinition as Instance);
          // await localDataStore?.upsertInstance(entityReport.parentUuid, entityReport as Instance);
          // await localDataStore?.upsertInstance(reportReportList.parentUuid, reportReportList as Instance);

          // await localDataStore?.upsertInstance(entityDefinitionEntityDefinition.parentUuid, entityDefinitionEntityDefinition as EntityInstance);
          // await localDataStore?.upsertInstance(entityReport.parentUuid, entityReport as EntityInstance);
          // await localDataStore?.upsertInstance(entityStoreBasedConfiguration.parentUuid, entityStoreBasedConfiguration as EntityInstance);
          // await localDataStore?.upsertInstance(entityModelVersion.parentUuid, entityModelVersion as EntityInstance);
          // // await localDataStore?.upsertInstance(reportEntityList.parentUuid, reportEntityList as Instance);
          // await localDataStore?.upsertInstance(reportReportList.parentUuid, reportReportList as EntityInstance);
          // await localDataStore?.upsertInstance(instanceModelVersionInitial.parentUuid, instanceModelVersionInitial as EntityInstance);
          // await localDataStore?.upsertInstance(instanceConfigurationReference.parentUuid, instanceConfigurationReference as EntityInstance);
  
          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
            entityName={entityEntity.name}
            entityUuid={entityEntity.uuid}
            DisplayLoadingInfo={displayLoadingInfo}
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('add Report definition step 1: loading initial configuration, entity Author must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );
  
          await user.click(screen.getByRole('button'))

          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('add Report definition step 2: adding reportEntityList, it must then be present in the local cache report list.')
          // console.log('add Report definition step 2: reduxStore.currentModel()',reduxStore.currentModel())
          const createAction: DomainAction = {
            actionType:"DomainModelAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedModelEntityUpdate",
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
              await domainController.handleDomainAction(createAction,reduxStore.currentModel());
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          console.log("createAction", createAction);
          expect(domainController.currentTransaction().length).toEqual(1);
          expect((domainController.currentTransaction()[0].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              // getAllByText(container,/finished/)
              getAllByText(container,/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('add Report definition step 3: rollbacking/refreshing report list from remote store, reportEntityList be absent in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
              // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
              // expect(absentReport).toBeNull() 
              // expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
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
      'Add Report definition then commit',
      async () => {
        try {
          console.log('Add Report definition then commit start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.uuid}/>
          const user = userEvent.setup()

          await localDataStore.dropModel();
          await localDataStore.initModel();
  
  
          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityEntity.name}
              entityUuid={entityEntity.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('add Report definition step 1: loading initial configuration, Author entity must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
              // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
              // expect(absentReport).toBeNull() 
              // expect(screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('add Report definition step 2: adding Author entity, it must then be present in the local cache entity list.')
          const createAction: DomainAction = {
            actionType:"DomainModelAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedModelEntityUpdate",
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
              await domainController.handleDomainAction(createAction,reduxStore.currentModel());
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          expect((domainController.currentTransaction()[0].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAction.update.modelEntityUpdate);
  

          await waitFor(
            () => {
              // getAllByText(container,/finished/)
              getAllByText(container,/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('add Report definition step 3: committing report list to remote store, reportEntityList must be present in the report list afterwards.')
          console.log('reduxStore.currentModel()',reduxStore.currentModel())
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('add Report definition step 4: rollbacking/refreshing report list from remote store after the first commit, reportEntityList must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"},reduxStore.currentModel());
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:4/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
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
      'Remove Author entity then commit',
      async () => {
        try {
          console.log('remove Author entity start');
          const displayLoadingInfo=<DisplayLoadingInfo/>
          const user = userEvent.setup()

          await localDataStore.dropModel();
          await localDataStore.initModel();
          // await localDataStore?.clear();
          // await localDataStore?.upsertInstance(entityDefinitionEntityDefinition.parentUuid, entityDefinitionEntityDefinition as EntityInstance);
          // await localDataStore?.upsertInstance(entityReport.parentUuid, entityReport as EntityInstance);
          // await localDataStore?.upsertInstance(entityStoreBasedConfiguration.parentUuid, entityStoreBasedConfiguration as EntityInstance);
          // await localDataStore?.upsertInstance(entityModelVersion.parentUuid, entityModelVersion as EntityInstance);
          // await localDataStore?.upsertInstance(reportEntityList.parentUuid, reportEntityList as EntityInstance);
          // await localDataStore?.upsertInstance(reportReportList.parentUuid, reportReportList as EntityInstance);
          // await localDataStore?.upsertInstance(instanceModelVersionInitial.parentUuid, instanceModelVersionInitial as EntityInstance);
          // await localDataStore?.upsertInstance(instanceConfigurationReference.parentUuid, instanceConfigurationReference as EntityInstance);
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );

          const createAction: DomainAction = {
            actionType:"DomainModelAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedModelEntityUpdate",
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
              await domainController.handleDomainAction(createAction,reduxStore.currentModel());
            }
          );

          console.log('remove Author entity setup: adding Author entity remotely by commit.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
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
              />,
            {store:reduxStore.getInnerStore()}
            // {store:reduxStore.getInnerStore(),loadingStateService:loadingStateService}
          );
          
  
  
          // ##########################################################################################################
          console.log('remove Author entity step  1: refreshing entity list from remote store, Author entity must be present in the entity list.')
  
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );
          await user.click(screen.getByRole('button'))
  
          await waitFor(
            () => {
              getAllByText(container,/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() 
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('remove Report definition step 2: removing Author entity from local store, it must be absent from the entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(
                {
                  actionType: "DomainModelAction",
                  actionName: "updateEntity",
                  update: {
                    updateActionName: "WrappedModelEntityUpdate",
                    modelEntityUpdate: {
                      updateActionType: "ModelEntityUpdate",
                      updateActionName: "DeleteEntity",
                      entityName: entityAuthor.name,
                      entityUuid: entityAuthor.uuid,
                    },
                  }
                  },
                reduxStore.currentModel()
              );
            }
          );
          
          await user.click(screen.getByRole('button'))
          await waitFor(
            () => {
              getAllByText(container,/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
              // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
              // // console.log("absentReport", absentReport);
              // expect(absentReport).toBeNull()
              // expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('remove Report definition step 3: commit to remote store, Author entity must still be absent from the report list.')
          await act(
            async () => {
              await domainController.handleDomainModelAction({actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
            }
          );
          await user.click(screen.getByRole('button'))
          await waitFor(
            () => {
              getAllByText(container,/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
              // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
              // expect(absentReport).toBeNull()
              // expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('remove Report definition step 4: rollbacking/refreshing entity list from remote store after the first commit, Author entity must still be absent in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:4/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() 
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
              // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
              // expect(absentReport).toBeNull()
              // expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
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
      'Update Author definition then commit',
      async () => {
        try {
          console.log('update Author definition start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()
  
          await localDataStore.dropModel();
          await localDataStore.initModel();

          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );

          const createAction: DomainAction = {
            actionType:"DomainModelAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedModelEntityUpdate",
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
          console.log('reduxStore.currentModel().',reduxStore.currentModel());
          await act(
            async () => {
              await domainController.handleDomainAction(createAction,reduxStore.currentModel());
            }
          );

          console.log('update Author entity setup: adding Author entity remotely by commit.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
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
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Update Autor definition step 1: loading initial configuration, Author entity must be present in report list.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() 
              expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('Update Report definition step 2: update reportReportList, modified version must then be present in the report list.')
          // const updatedReport = 
          const updateAction: DomainAction = 
            {
              actionType: "DomainModelAction",
              actionName: "updateEntity",
              update: {
                updateActionName:"WrappedModelEntityUpdate",
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
              await domainController.handleDomainAction(updateAction, reduxStore.currentModel());
            }
          );
  
          console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))
  
          expect(domainController.currentTransaction().length).toEqual(1);
          expect((domainController.currentTransaction()[0].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(updateAction.update.modelEntityUpdate);
  
          await user.click(screen.getByRole('button'))
  
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
          console.log('Update Author entity definition step 3: committin entity list from remote store, modified entity must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleDomainModelAction({actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
            }
          );
  
          await user.click(screen.getByRole('button'))
  
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
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
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
      }
    )
  }
)

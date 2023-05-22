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
global.TextDecoder = TextDecoder as any

import { SetupWorkerApi } from "msw";
import { SetupServerApi } from "msw/node";

import {
  StoreControllerInterface,
  DomainAction,
  DomainControllerInterface,
  EntityDefinition,
  LocalAndRemoteControllerInterface,
  MetaEntity,
  MiroirConfig,
  MiroirContext,
  WrappedModelEntityUpdateWithCUDUpdate,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel,
  entityEntity,
  entityReport,
  miroirCoreStartup,
  IndexedDb,
  EmulatedServerConfigIndexedDb,
  ApplicationSection,
  DataStoreApplicationType,
  EntityInstance,
} from "miroir-core";
import {
  ReduxStore
} from "miroir-redux";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import {
  DisplayLoadingInfo,
  StoreControllerFactory,
  applicationDeploymentLibrary,
  indexedDbStoreControllerFactory,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders,
  // sqlDbStoreControllerFactory,
} from "miroir-standalone-app/tests/utils/tests-utils";
import { createReduxStoreAndRestClient } from "../../src/miroir-fwk/createMswRestServer";

import entityAuthor from "miroir-standalone-app/src/assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "miroir-standalone-app/src/assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import reportBookList from "miroir-standalone-app/src/assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import entityDefinitionBook from "miroir-standalone-app/src/assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionAuthor from "miroir-standalone-app/src/assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import config from "miroir-standalone-app/tests/miroirConfig.test.json";
import author1 from "../../src/assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../src/assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../src/assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import book3 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book1 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";


// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed-sql-indexedDb.json";
import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed-inversed-sql-indexedDb.json";

// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb.json";


const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

miroirAppStartup();
miroirCoreStartup();

let localMiroirStoreController: StoreControllerInterface;
let localAppStoreController: StoreControllerInterface;
let localDataStoreWorker: SetupWorkerApi;
let localDataStoreServer: SetupServerApi;
let reduxStore: ReduxStore;
let localAndRemoteController: LocalAndRemoteControllerInterface;
let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;

beforeAll(
  async () => {
    const wrappedReduxStore = createReduxStoreAndRestClient(
      miroirConfig as MiroirConfig,
      fetch,
    );

    const {
      localMiroirStoreController:a,localAppStoreController:b
    } = await StoreControllerFactory(
      miroirConfig,
      indexedDbStoreControllerFactory,
      // sqlDbStoreControllerFactory,
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

    if (wrappedReduxStore && wrapped) {
      // localMiroirStoreController = wrapped.localMiroirStoreController as StoreControllerInterface;
      // localAppStoreController = wrapped.localAppStoreController as StoreControllerInterface;
      localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
      localDataStoreServer = wrapped.localDataStoreServer as SetupServerApi;
      reduxStore = wrappedReduxStore.reduxStore;
      domainController = wrappedReduxStore.domainController;
      miroirContext = wrappedReduxStore.miroirContext;
    }
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach(localMiroirStoreController,localAppStoreController);
  }
)

afterAll(
  async () => {
    await miroirAfterAll(localMiroirStoreController,localAppStoreController,localDataStoreServer);
  }
)

afterEach(
  async () => {
    await miroirAfterEach(localMiroirStoreController,localAppStoreController);
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
          // await localDataStore.dropModelAndData();
          // await localDataStore.initModel(defaultMiroirMetaModel);
  
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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
  
          // await localDataStore.dropModelAndData();
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
              deploymentUuid={applicationDeploymentMiroir.uuid}
              instancesApplicationSection="model"
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('add Report definition step 1: loading initial configuration, entity Author must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, createAction, reduxStore.currentModel());
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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

          // await localDataStore.dropModelAndData();
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
              deploymentUuid={applicationDeploymentMiroir.uuid}
              instancesApplicationSection="model"
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('add Report definition step 1: loading initial configuration, Author entity must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, createAction,reduxStore.currentModel());
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid, {actionName: "rollback",actionType:"DomainModelAction"},reduxStore.currentModel());
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

          // await localDataStore.dropModelAndData();
          // await localDataStore.initModel();
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction, reduxStore.currentModel());
            }
          );

          console.log('remove Author entity setup: adding Author entity remotely by commit.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          console.log('remove Report definition step 2: removing Author entity from local store, it must be absent from the entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(
                applicationDeploymentLibrary.uuid, 
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
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
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
              await domainController.handleDomainModelAction(applicationDeploymentLibrary.uuid, {actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
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
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
              // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
              // expect(absentReport).toBeNull()
              // expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('remove Report definition step 4: rollbacking/refreshing entity list from remote store after the first commit, Author entity must still be absent in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
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
  
          // await localDataStore.dropModelAndData();
          // await localDataStore.initModel();
          await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
          await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
          await localAppStoreController?.upsertModelInstance(reportBookList.parentUuid, reportBookList as EntityInstance);
          await localAppStoreController?.upsertDataInstance(author1.parentUuid, author1 as EntityInstance);
          await localAppStoreController?.upsertDataInstance(author2.parentUuid, author2 as EntityInstance);
          await localAppStoreController?.upsertDataInstance(author3.parentUuid, author3 as EntityInstance);
          await localAppStoreController?.upsertDataInstance(book1.parentUuid, book1 as EntityInstance);
          await localAppStoreController?.upsertDataInstance(book2.parentUuid, book2 as EntityInstance);
          // await localappDataStore?.upsertDataInstance(book3.parentUuid, book3 as Instance);
          await localAppStoreController?.upsertDataInstance(book4.parentUuid, book4 as EntityInstance);
    
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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
          console.log('reduxStore.currentModel(applicationDeploymentLibrary.uuid).',reduxStore.currentModel(applicationDeploymentLibrary.uuid));
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction,reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );

          console.log('update Author entity setup: adding Author entity remotely by commit.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel(applicationDeploymentLibrary.uuid));
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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
              // expect(screen.queryByText(new RegExp(`${entityEntity.uuid}`,'i'))).toBeTruthy();
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, updateAction, reduxStore.currentModel(applicationDeploymentLibrary.uuid));
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
          console.log('Update Author entity definition step 3: committing entity list from remote store, modified entity must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleDomainModelAction(applicationDeploymentLibrary.uuid, {actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel(applicationDeploymentLibrary.uuid));
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
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

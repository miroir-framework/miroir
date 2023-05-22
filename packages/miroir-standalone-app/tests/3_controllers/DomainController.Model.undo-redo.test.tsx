/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { act, getAllByText, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupServerApi, setupServer } from "msw/node";
import React from "react";

const fetch = require('node-fetch');


import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;


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
  entityEntity,
  entityReport,
  miroirCoreStartup
} from "miroir-core";
import {
  ReduxStore
} from "miroir-redux";

import entityAuthor from "miroir-standalone-app/src/assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "miroir-standalone-app/src/assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import entityDefinitionAuthor from "miroir-standalone-app/src/assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import entityDefinitionBook from "miroir-standalone-app/src/assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import {
  DisplayLoadingInfo,
  StoreControllerFactory,
  indexedDbStoreFactory,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders,
  // sqlDbStoreControllerFactory,
} from "miroir-standalone-app/tests/utils/tests-utils";
import { SetupWorkerApi } from "msw";
import { createReduxStoreAndRestClient } from "../../src/miroir-fwk/createMswRestServer";

// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test.json";
import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json";
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
      indexedDbStoreFactory,
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
  'DomainController.Model.undo-redo',
  () => {
    // ###########################################################################################
    it(
      'Add 2 entity definitions then undo one then commit',
      async () => {
        try {
          
          console.log('Add 2 entity definitions then undo one then commit start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()

          // await localDataStore.dropModelAndData();
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
              deploymentUuid={applicationDeploymentMiroir.uuid}
              instancesApplicationSection="model"
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 1: loading initial configuration, entities must be absent from entity list.')
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
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() // Author entity
              // expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 2: adding entities, they must then be present in the local cache Entity list.')
          const createAuthorAction: DomainAction = {
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
          const createBookAction: DomainAction = {
            actionType:"DomainModelAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedModelEntityUpdate",
              modelEntityUpdate: {
                updateActionType: "ModelEntityUpdate",
                updateActionName: "createEntity",
                entities: [
                  {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
                ],
              },
            }
          };
  
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,createAuthorAction,reduxStore.currentModel());
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,createBookAction,reduxStore.currentModel());
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          // expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
          expect((domainController.currentTransaction()[0].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
          expect((domainController.currentTransaction()[1].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createBookAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              // getAllByText(container,/finished/)
              getAllByText(container,/step:2/)
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "undo", actionType: 'DomainModelAction'});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          expect((domainController.currentTransaction()[0].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              getAllByText(container,/step:3/)
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "redo", actionType: 'DomainModelAction'});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          // expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
          expect((domainController.currentTransaction()[0].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
          expect((domainController.currentTransaction()[1].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createBookAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              getAllByText(container,/step:4/)
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "redo", actionType: 'DomainModelAction'});
            }
          );
      
          await user.click(screen.getByRole('button'))
      
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          expect((domainController.currentTransaction()[0].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      
          await waitFor(
            () => {
              getAllByText(container,/step:5/)
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "redo", actionType: 'DomainModelAction'});
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 6: undo 3 times, show that the extra undo is igored.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "redo", actionType: 'DomainModelAction'});
            }
          );
      
          await user.click(screen.getByRole('button'))
      
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          expect((domainController.currentTransaction()[0].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      
          await waitFor(
            () => {
              getAllByText(container,/step:6/)
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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "redo", actionType: 'DomainModelAction'});
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 7: redo 1 time, show that the extra redo is igored. Commit then see that current transaction has no undo/redo')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionName: "redo", actionType: 'DomainModelAction'});
            }
          );
      
          await user.click(screen.getByRole('button'))
      
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          // expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
          expect((domainController.currentTransaction()[0].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
          expect((domainController.currentTransaction()[1].update as WrappedModelEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createBookAction.update.modelEntityUpdate);
  
          await act(
            async () => {
              await domainController.handleDomainModelAction(applicationDeploymentMiroir.uuid,{actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
            }
          );
  
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:7/)
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

/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupWorkerApi } from "msw";
import { setupServer, SetupServerApi } from "msw/node";
import React from "react";

const fetch = require('node-fetch');


import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder as any


import {
  applicationDeploymentMiroir,
  DomainControllerInterface,
  DomainDataAction,
  EntityDefinition,
  EntityInstance,
  MetaEntity,
  MiroirConfig, miroirCoreStartup,
  StoreControllerInterface
} from "miroir-core";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import {
  applicationDeploymentLibrary,
  DisplayLoadingInfo,
  indexedDbStoreControllerFactory,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders,
  // sqlDbStoreControllerFactory,
  StoreControllerFactory,
} from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";

import entityAuthor from "miroir-standalone-app/src/assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "miroir-standalone-app/src/assets/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import reportBookList from "miroir-standalone-app/src/assets/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import entityDefinitionBook from "miroir-standalone-app/src/assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionAuthor from "miroir-standalone-app/src/assets/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import author1 from "../../src/assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../src/assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../src/assets/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import book3 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book1 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../src/assets/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import { createReduxStoreAndRestClient } from "../../src/miroir-fwk/createMswRestServer";
import { refreshAllInstancesTest } from "./DomainController.Data.CRUD.functions";

// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json";
import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed-sql-indexedDb.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb.json";

const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

miroirAppStartup();
miroirCoreStartup();

let 
  localMiroirStoreController: StoreControllerInterface,
  localAppStoreController: StoreControllerInterface,
  localDataStoreWorker,
  localDataStoreServer,
  reduxStore,
  domainController: DomainControllerInterface,
  miroirContext
;

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

    console.log('DomainController.Data.CRUD.test beforeAll StoreControllerFactory returned',localAppStoreController);
    
    // Establish requests interception layer before all tests.
    const wrapped = await miroirBeforeAll(
      miroirConfig as MiroirConfig,
      setupServer,
      localMiroirStoreController,
      localAppStoreController
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
    return Promise.resolve();
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
  'DomainController.Data.CRUD',
  () => {

    // ###########################################################################################
    it(
      'Refresh all Instances',
      async() => {
        await refreshAllInstancesTest(
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
    it(
      'Add Book instance then rollback',
      async () => {
        try {
          console.log('Add Book instance then rollback start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = userEvent.setup()
  
          // await localDataStore.dropModelAndData();
          // await localDataStore.initModel();

          await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
          await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
          await localAppStoreController?.upsertInstance('model', reportBookList as EntityInstance);
          await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
          await localAppStoreController?.upsertInstance('data', author2 as EntityInstance);
          await localAppStoreController?.upsertInstance('data', author3 as EntityInstance);
          await localAppStoreController?.upsertInstance('data', book1 as EntityInstance);
          await localAppStoreController?.upsertInstance('data', book2 as EntityInstance);
          // await localAppStoreController?.upsertDataInstance(book3.parentUuid, book3 as Instance);
          await localAppStoreController?.upsertInstance('data', book4 as EntityInstance);

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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
            }
          );
          console.log('add Book step 1: done replace.')
  
          await user.click(screen.getByRole('button'))
  
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
          const createAction: DomainDataAction = {
            actionName:'create',
            actionType:"DomainDataAction",
            objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,applicationSection:'data',instances:[book3 as EntityInstance]}]
          };
  
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction);
            }
          );
  
          await user.click(screen.getByRole('button'))
  
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
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
    it(
      'Remove Book instance then rollback',
      async () => {

        try {
          
          console.log('Remove Book instance then rollback start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = userEvent.setup()

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
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
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
        // }
  
          // ##########################################################################################################
          console.log('remove Book instance step 2: the Book must then be absent from the local cache report list.')
          const createAction: DomainDataAction = {
            actionName:'delete',
            actionType:"DomainDataAction",
            objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,applicationSection:'data', instances:[book3 as EntityInstance]}]
          };
  
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction);
            }
          );
  
          await user.click(screen.getByRole('button'))
  
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
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
    it(
      'Update Book instance then commit',
      async () => {
        try {
          
          console.log('update Book instance start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = userEvent.setup()

          // await localDataStore.dropModelAndData();
          // await localDataStore.initModel();

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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
            }
          );
  
          await user.click(screen.getByRole('button'))

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
          const updateAction: DomainDataAction = {
            actionName: "update",
            actionType:"DomainDataAction",
            objects: [
              {
                parentName: book4.parentName,
                parentUuid: book4.parentUuid,
                applicationSection:'data',
                instances: [
                  Object.assign({},book4,{"name":"Tthe Bride Wore Blackk", "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"}) as EntityInstance
                  // {
                  //   "uuid": "c97be567-bd70-449f-843e-cd1d64ac1ddd",
                  //   "parentName":"Book",
                  //   "name":"RRear WindowW",
                  //   "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"
                  // } as Instance,
                ],
              },
            ],
          };
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, updateAction);
            }
          );
  
          // update does not generate any redo / undo
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await user.click(screen.getByRole('button'))
  
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
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainModelAction",actionName: "rollback"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
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

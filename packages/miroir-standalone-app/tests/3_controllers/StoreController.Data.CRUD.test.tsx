import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer, SetupServerApi } from "msw/node";
import { SetupWorkerApi } from "msw/browser";
import React from "react";


import {
  applicationDeploymentMiroir,
  ConfigurationService,
  DomainControllerInterface,
  DomainDataAction,
  EntityDefinition,
  EntityInstance,
  MetaEntity,
  MiroirConfig, miroirCoreStartup,
  StoreControllerFactory,
  IStoreController,
  LocalAndRemoteControllerInterface,
  MiroirContext,
  applicationDeploymentLibrary,
  entityEntity,
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
  reportBookList
} from "miroir-core";

import {
  DisplayLoadingInfo,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders,
} from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";

import { createReduxStoreAndRestClient } from "../../src/miroir-fwk/createReduxStoreAndRestClient";
import { loadConfigFile, refreshAllInstancesTest } from "./DomainController.Data.CRUD.functions";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirStoreFileSystemStartup } from "miroir-store-filesystem";
import { miroirStoreIndexedDbStartup } from "miroir-store-indexedDb";
import { miroirStorePostgresStartup } from "miroir-store-postgres";

import { ReduxStore } from "miroir-redux";

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
let localDataStoreServer: any /**SetupServerApi | undefined */;
let localDataStoreWorker: SetupWorkerApi | undefined;
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
      ConfigurationService.storeFactoryRegister,
      miroirConfig,
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
      // localMiroirStoreController = wrapped.localMiroirStoreController as IStoreController;
      // localAppStoreController = wrapped.localAppStoreController as IStoreController;
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
    await miroirBeforeEach(miroirConfig, domainController,localMiroirStoreController,localAppStoreController);
  }
)

afterAll(
  async () => {
    await miroirAfterAll(miroirConfig,localMiroirStoreController,localAppStoreController,localDataStoreServer);
  }
)

afterEach(
  async () => {
    await miroirAfterEach(miroirConfig, localMiroirStoreController,localAppStoreController);
  }
)

// describe.each([])(
describe(
  'StoreController.Data.CRUD',
  () => {

    // ###########################################################################################
    it(
      'create application Entity',
      async() => {
        await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
        await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);

        const entities = await localAppStoreController.getInstances("model", entityEntity.uuid);

        expect(Array.isArray(entities) && entities.length == 2);
        return Promise.resolve();
      }
    )
    
    // ###########################################################################################
    it(
      'insert data Instances',
      async() => {
        await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
        await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
        await localAppStoreController?.upsertInstance('model', reportBookList as EntityInstance);
        await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
        await localAppStoreController?.upsertInstance('data', author2 as EntityInstance);
        await localAppStoreController?.upsertInstance('data', author3 as EntityInstance);
        await localAppStoreController?.upsertInstance('data', book1 as EntityInstance);
        await localAppStoreController?.upsertInstance('data', book2 as EntityInstance);
        // await localAppStoreController?.upsertInstance('data', book3 as Instance);
        await localAppStoreController?.upsertInstance('data', book4 as EntityInstance);

        const authors = await localAppStoreController.getInstances("data", entityAuthor.uuid);
        const books = await localAppStoreController.getInstances("data", entityBook.uuid);

        expect(Array.isArray(authors) && authors.length == 3);
        expect(Array.isArray(books) && books.length == 3);
        return Promise.resolve();
      }
    )

    // // ###########################################################################################
    // it(
    //   'Add Book instance then rollback',
    //   async () => {
    //     try {
    //       console.log('Add Book instance then rollback start');
  
    //       const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
    //       const user = userEvent.setup()
  
    //       // await localDataStore.clear();
    //       // await localDataStore.initModel();

    //       await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
    //       await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
    //       await localAppStoreController?.upsertInstance('model', reportBookList as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', author2 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', author3 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', book1 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', book2 as EntityInstance);
    //       // await localAppStoreController?.upsertInstance('data',book3.parentUuid, book3 as Instance);
    //       await localAppStoreController?.upsertInstance('data', book4 as EntityInstance);

    //       const {
    //         getByText,
    //         getAllByRole,
    //         // container
    //       } = renderWithProviders(
    //         <TestUtilsTableComponent
    //           entityUuid={entityBook.uuid}
    //           DisplayLoadingInfo={displayLoadingInfo}
    //           deploymentUuid={applicationDeploymentLibrary.uuid}
    //         />
    //         ,
    //         {store:reduxStore.getInnerStore()}
    //       );
  
    //       // ##########################################################################################################
    //       console.log('add Book step 1: the Book must be absent in the local cache report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
    //           await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
    //         }
    //       );
    //       console.log('add Book step 1: done replace.')
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:1/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
  
    //       // ##########################################################################################################
    //       console.log('add Book instance step 2: the Book must then be present in the local cache report list.')
    //       const createAction: DomainDataAction = {
    //         actionName:'create',
    //         actionType:"DomainDataAction",
    //         objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,applicationSection:'data',instances:[book3 as EntityInstance]}]
    //       };
  
    //       await act(
    //         async () => {
    //           await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction);
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //       // data operations are not transactional
    //       expect(domainController.currentTransaction().length).toEqual(0);
    //       // expect(domainController.currentTransaction()[0]).toEqual(createAction);
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:2/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );

    //       // ##########################################################################################################
    //       console.log('add Book instance step 3: rollbacking/refreshing report list from remote store, added book must still be present in the report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //       expect(domainController.currentTransaction().length).toEqual(0);
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:3/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )

    // // ###########################################################################################
    // it(
    //   'Remove Book instance then rollback',
    //   async () => {

    //     try {
          
    //       console.log('Remove Book instance then rollback start');
  
    //       const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
    //       const user = userEvent.setup()

    //       await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
    //       await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
    //       await localAppStoreController.upsertInstance('model', reportBookList as EntityInstance);
    //       await localAppStoreController.upsertInstance('data', author1 as EntityInstance);
    //       await localAppStoreController.upsertInstance('data', author2 as EntityInstance);
    //       await localAppStoreController.upsertInstance('data', author3 as EntityInstance);
    //       await localAppStoreController.upsertInstance('data', book1 as EntityInstance);
    //       await localAppStoreController.upsertInstance('data', book2 as EntityInstance);
    //       await localAppStoreController.upsertInstance('data', book3 as EntityInstance);
    //       await localAppStoreController.upsertInstance('data', book4 as EntityInstance);

    //       const {
    //         getByText,
    //         getAllByRole,
    //         // container
    //       } = renderWithProviders(
    //         <TestUtilsTableComponent
    //           // parentName="Book"
    //           entityUuid={entityBook.uuid}
    //           DisplayLoadingInfo={displayLoadingInfo}
    //           deploymentUuid={applicationDeploymentLibrary.uuid}
    //         />
    //         ,
    //         {store:reduxStore.getInnerStore()}
    //       );
  
    //       // ##########################################################################################################
    //       console.log('Remove Book instance step 1: the Book must be present in the local cache report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
    //           await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:1/)
    //         },
    //       ).then(
    //         ()=> {
    //           // expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
    //     // }
  
    //       // ##########################################################################################################
    //       console.log('remove Book instance step 2: the Book must then be absent from the local cache report list.')
    //       const createAction: DomainDataAction = {
    //         actionName:'delete',
    //         actionType:"DomainDataAction",
    //         objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,applicationSection:'data', instances:[book3 as EntityInstance]}]
    //       };
  
    //       await act(
    //         async () => {
    //           await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, createAction);
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //       // data operations are not transactional
    //       expect(domainController.currentTransaction().length).toEqual(0);
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:2/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
  
    //       // ##########################################################################################################
    //       console.log('Remove Book instance step 3: rollbacking/refreshing book list from remote store, removed book must still be absent from the report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //       expect(domainController.currentTransaction().length).toEqual(0);
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:3/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )

    // // ###########################################################################################
    // it(
    //   'Update Book instance then commit',
    //   async () => {
    //     try {
          
    //       console.log('update Book instance start');

    //       const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
    //       const user = userEvent.setup()

    //       // await localDataStore.clear();
    //       // await localDataStore.initModel();

    //       await localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
    //       await localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
    //       await localAppStoreController?.upsertInstance('model', reportBookList as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', author2 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', author3 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', book1 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', book2 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', book3 as EntityInstance);
    //       await localAppStoreController?.upsertInstance('data', book4 as EntityInstance);

    //       const {
    //         getByText,
    //         getAllByRole,
    //         // container
    //       } = renderWithProviders(
    //         <TestUtilsTableComponent
    //           // parentName="Book"
    //           entityUuid={entityBook.uuid}
    //           DisplayLoadingInfo={displayLoadingInfo}
    //           deploymentUuid={applicationDeploymentLibrary.uuid}
    //         />
    //         ,
    //         {store:reduxStore.getInnerStore()}
    //       );
  
    //       // ##########################################################################################################
    //       console.log('Update Book instance step 1: loading initial configuration, book must be present in report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));

    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:1/)
    //         },
    //       ).then(
    //         ()=> {
    //           // expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
    //           expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
    //           expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
    //           expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
    //         }
    //       );
  
    //       // ##########################################################################################################
    //       console.log('Update Book instance step 2: update reportReportList, modified version must then be present in the report list.')
    //       const updateAction: DomainDataAction = {
    //         actionName: "update",
    //         actionType:"DomainDataAction",
    //         objects: [
    //           {
    //             parentName: book4.parentName,
    //             parentUuid: book4.parentUuid,
    //             applicationSection:'data',
    //             instances: [
    //               Object.assign({},book4,{"name":"Tthe Bride Wore Blackk", "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"}) as EntityInstance
    //               // {
    //               //   "uuid": "c97be567-bd70-449f-843e-cd1d64ac1ddd",
    //               //   "parentName":"Book",
    //               //   "name":"RRear WindowW",
    //               //   "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"
    //               // } as Instance,
    //             ],
    //           },
    //         ],
    //       };
    //       await act(
    //         async () => {
    //           await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, updateAction);
    //         }
    //       );
  
    //       // update does not generate any redo / undo
    //       expect(domainController.currentTransaction().length).toEqual(0);
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:2/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(screen.queryByText(/Tthe Bride Wore Blackk/i)).toBeTruthy() // Report List
    //         }
    //       );
  
    //       // ##########################################################################################################
    //       console.log('Update Book instance step 3: refreshing book list from remote store, modified bool must still be present in the report list.')
    //       await act(
    //         async () => {
    //           await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
    //         }
    //       );
  
    //       await act(()=>user.click(screen.getByRole('button')));
  
    //       await waitFor(
    //         () => {
    //           getAllByRole(/step:3/)
    //         },
    //       ).then(
    //         ()=> {
    //           expect(screen.queryByText(/Tthe Bride Wore Blackk/i)).toBeTruthy() // Report List
    //         }
    //       );
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )
  } //  end describe('DomainController.Data.CRUD',
)

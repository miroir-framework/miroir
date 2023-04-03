/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import React from "react";

const fetch = require('node-fetch');


import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder


import {
  circularReplacer,
  DomainDataAction,
  entityEntity,
  entityReport, Instance, miroirCoreStartup,
  reportEntityList
} from "miroir-core";

import { createMswStore } from "miroir-standalone-app/src/miroir-fwk/createStore";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { DisplayLoadingInfo, renderWithProviders } from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";

import entityAuthor from "miroir-standalone-app/src/assets/entities/Author.json";
import entityBook from "miroir-standalone-app/src/assets/entities/Book.json";
import author1 from "miroir-standalone-app/src/assets/instances/Author - Cornell Woolrich.json";
import author2 from "miroir-standalone-app/src/assets/instances/Author - Don Norman.json";
import author3 from "miroir-standalone-app/src/assets/instances/Author - Paul Veyne.json";
import book1 from "miroir-standalone-app/src/assets/instances/Book - The Bride Wore Black.json";
import book2 from "miroir-standalone-app/src/assets/instances/Book - The Design of Everyday Things.json";
import book3 from "miroir-standalone-app/src/assets/instances/Book - Et dans l'éternité.json";
import book4 from "miroir-standalone-app/src/assets/instances/Book - Rear Window.json";
import reportBookList from "miroir-standalone-app/src/assets/reports/BookList.json";

miroirAppStartup();
miroirCoreStartup();

let localDataStore, localDataStoreWorker, localDataStoreServer, reduxStore, domainController, miroirContext;
// const {localDataStore, localDataStoreWorker, localDataStoreServer, reduxStore, domainController, miroirContext} = 

beforeAll(
  async () => {
    try {
      // Establish requests interception layer before all tests.
      const wrapped = await createMswStore(
        {
          // "emulateServer":false, 
          // "serverConfig":{
          //   "rootApiUrl":"http://localhost:3080"
          // },
          // "emulateServer":true, 
          // "rootApiUrl":"http://localhost/fakeApi",
          //   "emulatedServerConfig":{
          //   "emulatedServerType": "Sql",
          //   "connectionString":"postgres://postgres:postgres@localhost:5432/postgres"
          // },
          "emulateServer":true, 
          "rootApiUrl":"http://localhost/fakeApi",
          "emulatedServerConfig":{
            "emulatedServerType": "indexedDb",
            "indexedDbName":"miroir-uuid-indexedDb"
          },
          "deploymentMode":"monoUser",
          "monoUserAutentification": false,
          "monoUserVersionControl": false,
          "versionControlForDataConceptLevel": false
        },
        'nodejs',
        fetch,
        setupServer
      );
  
      localDataStore = wrapped.localDataStore;
      localDataStoreWorker = wrapped.localDataStoreWorker;
      localDataStoreServer = wrapped.localDataStoreServer;
      reduxStore = wrapped.reduxStore;
      domainController = wrapped.domainController;
      miroirContext = wrapped.miroirContext;

      localDataStoreServer?.listen();
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.open',JSON.stringify(localDataStore, circularReplacer()));
      await localDataStore.open();
    } catch (error) {
      console.error('Error beforeAll',error);
    }
    console.log('Done beforeAll');
  }
)

beforeEach(
  async () => {
    // Establish requests interception layer before all tests.
    // localDataStoreServer?.listen();
    try {
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.init');
      await localDataStore.init();
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.clear');
      await localDataStore.clear();
    } catch (error) {
      console.error('beforeEach',error);
    }
    console.log('Done beforeEach');
  }
)

afterAll(
  async () => {
    try {
      localDataStoreServer?.close();
      localDataStore.close();
    } catch (error) {
      console.error('Error afterAll',error);
    }
    console.log('Done afterAll');
  }
)

afterEach(
  async () => {
    try {
      // await localDataStore?.close();
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.clear');
      await localDataStore.clear();
    } catch (error) {
      console.error('Error afterEach',error);
    }
    console.log('Done afterEach');
  }
)

describe(
  'DomainController.Data.CRUD',
  () => {
    // ###########################################################################################
    it(
      'Refresh all Instances',
      async () => {
        try {
          console.log('Refresh all Instances start');
          const displayLoadingInfo=<DisplayLoadingInfo/>
          const user = userEvent.setup()

          await localDataStore?.upsertInstanceUuid(entityEntity.entityUuid, entityEntity as Instance);
          await localDataStore?.upsertInstanceUuid(entityReport.entityUuid, entityReport as Instance);
          // await localDataStore?.upsertInstanceUuid(reportReportList.entityUuid, reportReportList as Instance);
          await localDataStore?.upsertInstanceUuid(reportEntityList.entityUuid, reportEntityList as Instance);
          await localDataStore?.upsertInstanceUuid(entityAuthor.entityUuid, entityAuthor as Instance);
          await localDataStore?.upsertInstanceUuid(entityBook.entityUuid, entityBook as Instance);
          await localDataStore?.upsertInstanceUuid(reportBookList.entityUuid, reportBookList as Instance);
          await localDataStore?.upsertInstanceUuid(author1.entityUuid, author1 as Instance);
          await localDataStore?.upsertInstanceUuid(author2.entityUuid, author2 as Instance);
          await localDataStore?.upsertInstanceUuid(author3.entityUuid, author3 as Instance);
          await localDataStore?.upsertInstanceUuid(book1.entityUuid, book1 as Instance);
          await localDataStore?.upsertInstanceUuid(book2.entityUuid, book2 as Instance);
          // await localDataStore?.upsertInstanceUuid(book3.entityUuid, book3 as Instance);
          await localDataStore?.upsertInstanceUuid(book4.entityUuid, book4 as Instance);

          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityBook.name}
              entityUuid={entityBook.uuid}
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
              expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
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
      'Add Book definition then rollback',
      async () => {
        try {
          console.log('Add Book definition then rollback start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = userEvent.setup()
  
          await localDataStore?.upsertInstanceUuid(entityEntity.entityUuid, entityEntity as Instance);
          await localDataStore?.upsertInstanceUuid(entityReport.entityUuid, entityReport as Instance);
          // await localDataStore?.upsertInstanceUuid(reportReportList.entityUuid, reportReportList as Instance);
          await localDataStore?.upsertInstanceUuid(reportEntityList.entityUuid, reportEntityList as Instance);
          await localDataStore?.upsertInstanceUuid(entityAuthor.entityUuid, entityAuthor as Instance);
          await localDataStore?.upsertInstanceUuid(entityBook.entityUuid, entityBook as Instance);
          await localDataStore?.upsertInstanceUuid(reportBookList.entityUuid, reportBookList as Instance);
          await localDataStore?.upsertInstanceUuid(author1.entityUuid, author1 as Instance);
          await localDataStore?.upsertInstanceUuid(author2.entityUuid, author2 as Instance);
          await localDataStore?.upsertInstanceUuid(author3.entityUuid, author3 as Instance);
          await localDataStore?.upsertInstanceUuid(book1.entityUuid, book1 as Instance);
          await localDataStore?.upsertInstanceUuid(book2.entityUuid, book2 as Instance);
          // await localDataStore?.upsertInstanceUuid(book3.entityUuid, book3 as Instance);
          await localDataStore?.upsertInstanceUuid(book4.entityUuid, book4 as Instance);
  
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
            />
            ,
            {store:reduxStore.getInnerStore()}
          );
  
          // ##########################################################################################################
          console.log('add Book step 1: the Book must be absent in the local cache report list.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
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
              expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
            }
          );
  
          // ##########################################################################################################
          console.log('add Book step 2: the Book must then be present in the local cache report list.')
          const createAction: DomainDataAction = {
            actionName:'create',
            actionType:"DomainDataAction",
            objects:[{entity:book3.entity,entityUuid:book3.entityUuid,instances:[book3 as Instance]}]
          };
  
          await act(
            async () => {
              await domainController.handleDomainAction(createAction);
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
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
            }
          );
  
          // ##########################################################################################################
          console.log('add Book definition step 3: rollbacking/refreshing report list from remote store, added book must still be present in the report list.')
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
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
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
      'Remove Book definition then rollback',
      async () => {

        try {
          
          console.log('Remove Book definition then rollback start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = userEvent.setup()
          // const loadingStateService = new LoadingStateService();
  
          await localDataStore?.upsertInstanceUuid(entityEntity.entityUuid, entityEntity as Instance);
          await localDataStore?.upsertInstanceUuid(entityReport.entityUuid, entityReport as Instance);
          // await localDataStore?.upsertInstanceUuid(reportReportList.entityUuid, reportReportList as Instance);
          await localDataStore?.upsertInstanceUuid(reportEntityList.entityUuid, reportEntityList as Instance);
          await localDataStore?.upsertInstanceUuid(entityAuthor.entityUuid, entityAuthor as Instance);
          await localDataStore?.upsertInstanceUuid(entityBook.entityUuid, entityBook as Instance);
          await localDataStore?.upsertInstanceUuid(reportBookList.entityUuid, reportBookList as Instance);
          await localDataStore?.upsertInstanceUuid(author1.entityUuid, author1 as Instance);
          await localDataStore?.upsertInstanceUuid(author2.entityUuid, author2 as Instance);
          await localDataStore?.upsertInstanceUuid(author3.entityUuid, author3 as Instance);
          await localDataStore?.upsertInstanceUuid(book1.entityUuid, book1 as Instance);
          await localDataStore?.upsertInstanceUuid(book2.entityUuid, book2 as Instance);
          await localDataStore?.upsertInstanceUuid(book3.entityUuid, book3 as Instance);
          await localDataStore?.upsertInstanceUuid(book4.entityUuid, book4 as Instance);
  
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              // entityName="Book"
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
            />
            ,
            {store:reduxStore.getInnerStore()}
          );
  
          // ##########################################################################################################
          console.log('Remove Book step 1: the Book must be present in the local cache report list.')
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
              // expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );
        // }
  
          // ##########################################################################################################
          console.log('remove Book step 2: the Book must then be absent from the local cache report list.')
          const createAction: DomainDataAction = {
            actionName:'delete',
            actionType:"DomainDataAction",
            objects:[{entity:book3.entity,entityUuid:book3.entityUuid,instances:[book3 as Instance]}]
          };
  
          await act(
            async () => {
              await domainController.handleDomainAction(createAction);
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
              expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
            }
          );
  
          // ##########################################################################################################
          console.log('Remove Book definition step 3: rollbacking/refreshing report list from remote store, removed book must still be absent from the report list.')
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
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
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
      'Update Book definition then commit',
      async () => {
        try {
          
          console.log('update Book definition start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = userEvent.setup()
  
          await localDataStore?.upsertInstanceUuid(entityEntity.entityUuid, entityEntity as Instance);
          await localDataStore?.upsertInstanceUuid(entityReport.entityUuid, entityReport as Instance);
          // await localDataStore?.upsertInstanceUuid(reportReportList.entityUuid, reportReportList as Instance);
          await localDataStore?.upsertInstanceUuid(reportEntityList.entityUuid, reportEntityList as Instance);
          await localDataStore?.upsertInstanceUuid(entityAuthor.entityUuid, entityAuthor as Instance);
          await localDataStore?.upsertInstanceUuid(entityBook.entityUuid, entityBook as Instance);
          await localDataStore?.upsertInstanceUuid(reportBookList.entityUuid, reportBookList as Instance);
          await localDataStore?.upsertInstanceUuid(author1.entityUuid, author1 as Instance);
          await localDataStore?.upsertInstanceUuid(author2.entityUuid, author2 as Instance);
          await localDataStore?.upsertInstanceUuid(author3.entityUuid, author3 as Instance);
          await localDataStore?.upsertInstanceUuid(book1.entityUuid, book1 as Instance);
          await localDataStore?.upsertInstanceUuid(book2.entityUuid, book2 as Instance);
          await localDataStore?.upsertInstanceUuid(book3.entityUuid, book3 as Instance);
          await localDataStore?.upsertInstanceUuid(book4.entityUuid, book4 as Instance);
  
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              // entityName="Book"
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
            />
            ,
            {store:reduxStore.getInnerStore()}
          );
  
          // ##########################################################################################################
          console.log('Update Bool definition step 1: loading initial configuration, book must be present in report list.')
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
              // expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
            }
          );
  
          // ##########################################################################################################
          console.log('Update Report definition step 2: update reportReportList, modified version must then be present in the report list.')
          const updateAction: DomainDataAction = {
            actionName: "update",
            actionType:"DomainDataAction",
            objects: [
              {
                entity: book4.entity,
                entityUuid: book4.entityUuid,
                instances: [
                  Object.assign({},book4,{"name":"RRear WindowW", "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"}) as Instance
                  // {
                  //   "uuid": "c97be567-bd70-449f-843e-cd1d64ac1ddd",
                  //   "entity":"Book",
                  //   "name":"RRear WindowW",
                  //   "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"
                  // } as Instance,
                ],
              },
            ],
          };
          await act(
            async () => {
              await domainController.handleDomainAction(updateAction);
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
              expect(screen.queryByText(/RRear WindowW/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('Update Book definition step 3: refreshing book list from remote store, modified bool must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "replace", actionType:"DomainModelAction"});
            }
          );
  
          await user.click(screen.getByRole('button'))
  
          await waitFor(
            () => {
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/RRear WindowW/i)).toBeTruthy() // Report List
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

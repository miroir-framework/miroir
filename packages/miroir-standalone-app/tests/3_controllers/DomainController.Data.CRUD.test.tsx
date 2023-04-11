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
  entityDefinitionEntityDefinition,
  entityReport, EntityInstance, MiroirConfig, miroirCoreStartup,
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
import config from "miroir-standalone-app/tests/miroirConfig.test.json"

miroirAppStartup();
miroirCoreStartup();

let localDataStore, localDataStoreWorker, localDataStoreServer, reduxStore, domainController, miroirContext;

beforeAll(
  async () => {
    try {
      const wrapped = await createMswStore(
        config as MiroirConfig,
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

          await localDataStore?.upsertInstance(entityDefinitionEntityDefinition.parentUuid, entityDefinitionEntityDefinition as EntityInstance);
          await localDataStore?.upsertInstance(entityReport.parentUuid, entityReport as EntityInstance);
          // await localDataStore?.upsertInstance(reportReportList.parentUuid, reportReportList as Instance);
          await localDataStore?.upsertInstance(reportEntityList.parentUuid, reportEntityList as EntityInstance);
          await localDataStore?.upsertInstance(entityAuthor.parentUuid, entityAuthor as EntityInstance);
          await localDataStore?.upsertInstance(entityBook.parentUuid, entityBook as EntityInstance);
          await localDataStore?.upsertInstance(reportBookList.parentUuid, reportBookList as EntityInstance);
          await localDataStore?.upsertInstance(author1.parentUuid, author1 as EntityInstance);
          await localDataStore?.upsertInstance(author2.parentUuid, author2 as EntityInstance);
          await localDataStore?.upsertInstance(author3.parentUuid, author3 as EntityInstance);
          await localDataStore?.upsertInstance(book1.parentUuid, book1 as EntityInstance);
          await localDataStore?.upsertInstance(book2.parentUuid, book2 as EntityInstance);
          // await localDataStore?.upsertInstance(book3.parentUuid, book3 as Instance);
          await localDataStore?.upsertInstance(book4.parentUuid, book4 as EntityInstance);

          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              parentName={entityBook.name}
              parentUuid={entityBook.uuid}
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
  
          await localDataStore?.upsertInstance(entityDefinitionEntityDefinition.parentUuid, entityDefinitionEntityDefinition as EntityInstance);
          await localDataStore?.upsertInstance(entityReport.parentUuid, entityReport as EntityInstance);
          // await localDataStore?.upsertInstance(reportReportList.parentUuid, reportReportList as Instance);
          await localDataStore?.upsertInstance(reportEntityList.parentUuid, reportEntityList as EntityInstance);
          await localDataStore?.upsertInstance(entityAuthor.parentUuid, entityAuthor as EntityInstance);
          await localDataStore?.upsertInstance(entityBook.parentUuid, entityBook as EntityInstance);
          await localDataStore?.upsertInstance(reportBookList.parentUuid, reportBookList as EntityInstance);
          await localDataStore?.upsertInstance(author1.parentUuid, author1 as EntityInstance);
          await localDataStore?.upsertInstance(author2.parentUuid, author2 as EntityInstance);
          await localDataStore?.upsertInstance(author3.parentUuid, author3 as EntityInstance);
          await localDataStore?.upsertInstance(book1.parentUuid, book1 as EntityInstance);
          await localDataStore?.upsertInstance(book2.parentUuid, book2 as EntityInstance);
          // await localDataStore?.upsertInstance(book3.parentUuid, book3 as Instance);
          await localDataStore?.upsertInstance(book4.parentUuid, book4 as EntityInstance);
  
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              parentUuid={entityBook.uuid}
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
            objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,instances:[book3 as EntityInstance]}]
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
  
          await localDataStore?.upsertInstance(entityDefinitionEntityDefinition.parentUuid, entityDefinitionEntityDefinition as EntityInstance);
          await localDataStore?.upsertInstance(entityReport.parentUuid, entityReport as EntityInstance);
          // await localDataStore?.upsertInstance(reportReportList.parentUuid, reportReportList as Instance);
          await localDataStore?.upsertInstance(reportEntityList.parentUuid, reportEntityList as EntityInstance);
          await localDataStore?.upsertInstance(entityAuthor.parentUuid, entityAuthor as EntityInstance);
          await localDataStore?.upsertInstance(entityBook.parentUuid, entityBook as EntityInstance);
          await localDataStore?.upsertInstance(reportBookList.parentUuid, reportBookList as EntityInstance);
          await localDataStore?.upsertInstance(author1.parentUuid, author1 as EntityInstance);
          await localDataStore?.upsertInstance(author2.parentUuid, author2 as EntityInstance);
          await localDataStore?.upsertInstance(author3.parentUuid, author3 as EntityInstance);
          await localDataStore?.upsertInstance(book1.parentUuid, book1 as EntityInstance);
          await localDataStore?.upsertInstance(book2.parentUuid, book2 as EntityInstance);
          await localDataStore?.upsertInstance(book3.parentUuid, book3 as EntityInstance);
          await localDataStore?.upsertInstance(book4.parentUuid, book4 as EntityInstance);
  
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              // parentName="Book"
              parentUuid={entityBook.uuid}
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
            objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,instances:[book3 as EntityInstance]}]
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
  
          await localDataStore?.upsertInstance(entityDefinitionEntityDefinition.parentUuid, entityDefinitionEntityDefinition as EntityInstance);
          await localDataStore?.upsertInstance(entityReport.parentUuid, entityReport as EntityInstance);
          // await localDataStore?.upsertInstance(reportReportList.parentUuid, reportReportList as Instance);
          await localDataStore?.upsertInstance(reportEntityList.parentUuid, reportEntityList as EntityInstance);
          await localDataStore?.upsertInstance(entityAuthor.parentUuid, entityAuthor as EntityInstance);
          await localDataStore?.upsertInstance(entityBook.parentUuid, entityBook as EntityInstance);
          await localDataStore?.upsertInstance(reportBookList.parentUuid, reportBookList as EntityInstance);
          await localDataStore?.upsertInstance(author1.parentUuid, author1 as EntityInstance);
          await localDataStore?.upsertInstance(author2.parentUuid, author2 as EntityInstance);
          await localDataStore?.upsertInstance(author3.parentUuid, author3 as EntityInstance);
          await localDataStore?.upsertInstance(book1.parentUuid, book1 as EntityInstance);
          await localDataStore?.upsertInstance(book2.parentUuid, book2 as EntityInstance);
          await localDataStore?.upsertInstance(book3.parentUuid, book3 as EntityInstance);
          await localDataStore?.upsertInstance(book4.parentUuid, book4 as EntityInstance);
  
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              // parentName="Book"
              parentUuid={entityBook.uuid}
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
                parentName: book4.parentName,
                parentUuid: book4.parentUuid,
                instances: [
                  Object.assign({},book4,{"name":"RRear WindowW", "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"}) as EntityInstance
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

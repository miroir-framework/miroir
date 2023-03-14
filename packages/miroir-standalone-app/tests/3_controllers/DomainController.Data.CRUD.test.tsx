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

const {mServer, worker, reduxStore, domainController, miroirContext} = 
  createMswStore(
    {
      "serverConfig":{emulateServer:true, "rootApiUrl":"http://localhost/fakeApi"},
      "deploymentMode":"monoUser",
      "monoUserAutentification": false,
      "monoUserVersionControl": false,
      "versionControlForDataConceptLevel": false
    },
    fetch,
    setupServer
  )
;

beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    worker.listen();
    await mServer.openObjectStore();
    console.log('Done beforeAll');
  }
)

afterAll(
  async () => {
    worker.close();
    await mServer.closeObjectStore();
    console.log('Done afterAll');
  }
)

describe(
  'DomainController.Data.CRUD',
  () => {
    // ###########################################################################################
    // it(
    //   'Refresh all Instances',
    //   async () => {
    //     console.log('Refresh all Instances start');
    //     const displayLoadingInfo=<DisplayLoadingInfo/>
    //     const user = userEvent.setup()

    //     await mServer.createObjectStore(["Entity","Instance","Report","Author","Book"]);
    //     await mServer.clearObjectStore();
    //     await mServer.localIndexedDb.putValue("Entity",entityReport);
    //     await mServer.localIndexedDb.putValue("Entity",entityEntity);
    //     await mServer.localIndexedDb.putValue("Report",reportEntityList);
    //     await mServer.localIndexedDb.putValue("Entity", entityAuthor);
    //     await mServer.localIndexedDb.putValue("Entity", entityBook);
    //     await mServer.localIndexedDb.putValue("Report", reportBookList);
    //     await mServer.localIndexedDb.putValue("Author", author1);
    //     await mServer.localIndexedDb.putValue("Author", author2);
    //     await mServer.localIndexedDb.putValue("Author", author3);
    //     await mServer.localIndexedDb.putValue("Book", book1);
    //     await mServer.localIndexedDb.putValue("Book", book2);
    //     // await mServer.localIndexedDb.putValue("Book", book3);
    //     await mServer.localIndexedDb.putValue("Book", book4);

    //     const {
    //       getByText,
    //       getAllByRole,
    //       // container
    //     } = renderWithProviders(
    //       <TestUtilsTableComponent
    //         entityName="Book"
    //         DisplayLoadingInfo={displayLoadingInfo}
    //       />
    //       ,
    //       {store:reduxStore.getInnerStore()}
    //     );

    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
    //       }
    //     );

    //     await user.click(screen.getByRole('button'))

    //     await waitFor(
    //       () => {
    //         getAllByRole(/step:1/)
    //       },
    //     ).then(
    //       ()=> {
    //         expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
    //         expect(getByText(/6fefa647-7ecf-4f83-b617-69d7d5094c37/i)).toBeTruthy() // The Bride Wore Black
    //         expect(getByText(/c97be567-bd70-449f-843e-cd1d64ac1ddd/i)).toBeTruthy() // Rear Window
    //         expect(getByText(/e20e276b-619d-4e16-8816-b7ec37b53439/i)).toBeTruthy() // The Design of Everyday Things
    //       }
    //     );
    //   }
    // )

    // ###########################################################################################
    it(
      'Add Book definition then rollback',
      async () => {
        console.log('Add Book definition then rollback start');

        const displayLoadingInfo=<DisplayLoadingInfo reportName="Book"/>
        const user = userEvent.setup()
        // const loadingStateService = new LoadingStateService();

        await mServer.createObjectStore(["Entity","Instance","Report","Author","Book"]);
        await mServer.clearObjectStore();
        await mServer.localIndexedDb.putValue("Entity",entityReport);
        await mServer.localIndexedDb.putValue("Entity",entityEntity);
        await mServer.localIndexedDb.putValue("Report",reportEntityList);
        await mServer.localIndexedDb.putValue("Entity", entityAuthor);
        await mServer.localIndexedDb.putValue("Entity", entityBook);
        await mServer.localIndexedDb.putValue("Report", reportBookList);
        await mServer.localIndexedDb.putValue("Author", author1);
        await mServer.localIndexedDb.putValue("Author", author2);
        await mServer.localIndexedDb.putValue("Author", author3);
        await mServer.localIndexedDb.putValue("Book", book1);
        await mServer.localIndexedDb.putValue("Book", book2);
        // await mServer.localIndexedDb.putValue("Book", book3);
        await mServer.localIndexedDb.putValue("Book", book4);

        const {
          getByText,
          getAllByRole,
          // container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName="Book"
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
            expect(getByText(/6fefa647-7ecf-4f83-b617-69d7d5094c37/i)).toBeTruthy() // The Bride Wore Black
            expect(getByText(/c97be567-bd70-449f-843e-cd1d64ac1ddd/i)).toBeTruthy() // Rear Window
            expect(getByText(/e20e276b-619d-4e16-8816-b7ec37b53439/i)).toBeTruthy() // The Design of Everyday Things
          }
        );

        // ##########################################################################################################
        console.log('add Book step 2: the Book must then be present in the local cache report list.')
        const createAction: DomainDataAction = {
          actionName:'create',
          actionType:"DomainDataAction",
          objects:[{entity:'Book',instances:[book3 as Instance]}]
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
            expect(getByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
            expect(getByText(/6fefa647-7ecf-4f83-b617-69d7d5094c37/i)).toBeTruthy() // The Bride Wore Black
            expect(getByText(/c97be567-bd70-449f-843e-cd1d64ac1ddd/i)).toBeTruthy() // Rear Window
            expect(getByText(/e20e276b-619d-4e16-8816-b7ec37b53439/i)).toBeTruthy() // The Design of Everyday Things
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
            expect(getByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
            expect(getByText(/6fefa647-7ecf-4f83-b617-69d7d5094c37/i)).toBeTruthy() // The Bride Wore Black
            expect(getByText(/c97be567-bd70-449f-843e-cd1d64ac1ddd/i)).toBeTruthy() // Rear Window
            expect(getByText(/e20e276b-619d-4e16-8816-b7ec37b53439/i)).toBeTruthy() // The Design of Everyday Things
          }
        );
      }
    )

    // ###########################################################################################
    it(
      'Remove Book definition then rollback',
      async () => {
        console.log('Remove Book definition then rollback start');

        const displayLoadingInfo=<DisplayLoadingInfo reportName="Book"/>
        const user = userEvent.setup()
        // const loadingStateService = new LoadingStateService();

        await mServer.createObjectStore(["Entity","Instance","Report","Author","Book"]);
        await mServer.clearObjectStore();
        await mServer.localIndexedDb.putValue("Entity",entityReport);
        await mServer.localIndexedDb.putValue("Entity",entityEntity);
        await mServer.localIndexedDb.putValue("Report",reportEntityList);
        await mServer.localIndexedDb.putValue("Entity", entityAuthor);
        await mServer.localIndexedDb.putValue("Entity", entityBook);
        await mServer.localIndexedDb.putValue("Report", reportBookList);
        await mServer.localIndexedDb.putValue("Author", author1);
        await mServer.localIndexedDb.putValue("Author", author2);
        await mServer.localIndexedDb.putValue("Author", author3);
        await mServer.localIndexedDb.putValue("Book", book1);
        await mServer.localIndexedDb.putValue("Book", book2);
        await mServer.localIndexedDb.putValue("Book", book3);
        await mServer.localIndexedDb.putValue("Book", book4);

        const {
          getByText,
          getAllByRole,
          // container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName="Book"
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
            // expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
            expect(getByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
            expect(getByText(/6fefa647-7ecf-4f83-b617-69d7d5094c37/i)).toBeTruthy() // The Bride Wore Black
            expect(getByText(/c97be567-bd70-449f-843e-cd1d64ac1ddd/i)).toBeTruthy() // Rear Window
            expect(getByText(/e20e276b-619d-4e16-8816-b7ec37b53439/i)).toBeTruthy() // The Design of Everyday Things
          }
        );
      // }

        // ##########################################################################################################
        console.log('remove Book step 2: the Book must then be absent from the local cache report list.')
        const createAction: DomainDataAction = {
          actionName:'delete',
          actionType:"DomainDataAction",
          objects:[{entity:'Book',instances:[book3 as Instance]}]
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
            expect(getByText(/6fefa647-7ecf-4f83-b617-69d7d5094c37/i)).toBeTruthy() // The Bride Wore Black
            expect(getByText(/c97be567-bd70-449f-843e-cd1d64ac1ddd/i)).toBeTruthy() // Rear Window
            expect(getByText(/e20e276b-619d-4e16-8816-b7ec37b53439/i)).toBeTruthy() // The Design of Everyday Things
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
            expect(getByText(/6fefa647-7ecf-4f83-b617-69d7d5094c37/i)).toBeTruthy() // The Bride Wore Black
            expect(getByText(/c97be567-bd70-449f-843e-cd1d64ac1ddd/i)).toBeTruthy() // Rear Window
            expect(getByText(/e20e276b-619d-4e16-8816-b7ec37b53439/i)).toBeTruthy() // The Design of Everyday Things
          }
        );
      }
    )

    // ###########################################################################################
    it(
      'Update Book definition then commit',
      async () => {
        console.log('update Book definition start');

        const displayLoadingInfo=<DisplayLoadingInfo reportName="Book"/>
        const user = userEvent.setup()

        await mServer.createObjectStore(["Entity","Instance","Report","Author","Book"]);
        await mServer.clearObjectStore();
        await mServer.localIndexedDb.putValue("Entity",entityReport);
        await mServer.localIndexedDb.putValue("Entity",entityEntity);
        await mServer.localIndexedDb.putValue("Report",reportEntityList);
        await mServer.localIndexedDb.putValue("Entity", entityAuthor);
        await mServer.localIndexedDb.putValue("Entity", entityBook);
        await mServer.localIndexedDb.putValue("Report", reportBookList);
        await mServer.localIndexedDb.putValue("Author", author1);
        await mServer.localIndexedDb.putValue("Author", author2);
        await mServer.localIndexedDb.putValue("Author", author3);
        await mServer.localIndexedDb.putValue("Book", book1);
        await mServer.localIndexedDb.putValue("Book", book2);
        await mServer.localIndexedDb.putValue("Book", book3);
        await mServer.localIndexedDb.putValue("Book", book4);

        const {
          getByText,
          getAllByRole,
          // container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName="Book"
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
            expect(getByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
            expect(getByText(/6fefa647-7ecf-4f83-b617-69d7d5094c37/i)).toBeTruthy() // The Bride Wore Black
            expect(getByText(/c97be567-bd70-449f-843e-cd1d64ac1ddd/i)).toBeTruthy() // Rear Window
            expect(getByText(/e20e276b-619d-4e16-8816-b7ec37b53439/i)).toBeTruthy() // The Design of Everyday Things
          }
        );

        // ##########################################################################################################
        console.log('Update Report definition step 2: update reportReportList, modified version must then be present in the report list.')
        const updateAction: DomainDataAction = {
          actionName: "update",
          actionType:"DomainDataAction",
          objects: [
            {
              entity: "Book",
              instances: [
                {
                  "uuid": "c97be567-bd70-449f-843e-cd1d64ac1ddd",
                  "entity":"Book",
                  "name":"RRear WindowW",
                  "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"
                } as Instance,
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
      }
    )
  } //  end describe('DomainController.Data.CRUD',
)

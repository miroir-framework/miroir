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


import {
  DomainDataAction,
  entityEntity,
  entityReport, Instance, miroirCoreStartup,
  reportEntityList,
  reportReportList
} from "miroir-core";

import { createMswStore } from "miroir-standalone-app/src/miroir-fwk/createStore";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { DisplayLoadingInfo, renderWithProviders } from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import entityAuthor from "miroir-standalone-app/src/assets/entities/Author.json";
import entityBook from "miroir-standalone-app/src/assets/entities/Book.json";
import book1 from "miroir-standalone-app/src/assets/instances/Book - The Bride Wore Black.json";


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
  'DomainController.Model.undo-redo',
  () => {
    // ###########################################################################################
    it(
      'Add 2 entity definitions then undo one then commit',
      async () => {
        console.log('Add 2 entity definitions then undo one then commit start');

        const displayLoadingInfo=<DisplayLoadingInfo reportName="Entity"/>
        const user = userEvent.setup()

        await mServer.createObjectStore(["Entity","Report",]);
        await mServer.clearObjectStore();
        await mServer.localIndexedDb.putValue("Entity", entityReport);
        await mServer.localIndexedDb.putValue("Entity", entityEntity);
        await mServer.localIndexedDb.putValue("Report", reportReportList);
        await mServer.localIndexedDb.putValue("Report", reportEntityList);


        const {
          getByText,
          getAllByRole,
          container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName="Entity"
            DisplayLoadingInfo={displayLoadingInfo}
          />,
          {store:reduxStore.getInnerStore(),}
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 1: loading initial configuration, entities must be absent from report list.')
        await act(
          async () => {
            await domainController.handleDomainDataAction({actionName: "replace"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:1/)
          },
        ).then(
          ()=> {
            expect(screen.queryByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeNull() // Book entity
            expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeNull() // Author entity
            // expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 2: adding entities, they must then be present in the local cache Entity list.')
        const createAuthorAction: DomainDataAction = {
          actionName:'create',
          objects:[{entity:'Entity',instances:[entityAuthor as Instance]}]
        };
        const createBookAction: DomainDataAction = {
          actionName:'create',
          objects:[{entity:'Entity',instances:[entityBook as Instance]}]
        };

        await act(
          async () => {
            await domainController.handleDomainDataAction(createAuthorAction);
            await domainController.handleDomainDataAction(createBookAction);
          }
        );

        await user.click(screen.getByRole('button'))

        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(2);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
        expect(domainController.currentTransaction()[1]).toEqual(createBookAction);

        await waitFor(
          () => {
            // getAllByText(container,/finished/)
            getAllByText(container,/step:2/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(getByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeTruthy() // Book Entity
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 3: undo 1 Entity creation, one Entity must still be present in the entity list.')
        await act(
          async () => {
            await domainController.handleDomainDataAction({actionName: "undo"});
          }
        );

        await user.click(screen.getByRole('button'))

        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(1);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);

        await waitFor(
          () => {
            getAllByText(container,/step:3/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(screen.queryByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeNull() // Book entity
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 4: redo 1 Entity creation, two Entities must be present in the entity list.')
        await act(
          async () => {
            await domainController.handleDomainDataAction({actionName: "redo"});
          }
        );

        await user.click(screen.getByRole('button'))

        console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(2);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
        expect(domainController.currentTransaction()[1]).toEqual(createBookAction);

        await waitFor(
          () => {
            getAllByText(container,/step:4/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(getByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeTruthy() // Book Entity
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 5: undo 2 then redo 1 Entity creation, one Entity must be present in the entity list.')
        await act(
          async () => {
            await domainController.handleDomainDataAction({actionName: "undo"});
            await domainController.handleDomainDataAction({actionName: "undo"});
            await domainController.handleDomainDataAction({actionName: "redo"});
          }
        );
    
        await user.click(screen.getByRole('button'))
    
        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(1);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
    
        await waitFor(
          () => {
            getAllByText(container,/step:5/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(screen.queryByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeNull() // Book entity
          }
        );
        // putting state back to where it was when test section started
        await act(
          async () => {
            await domainController.handleDomainDataAction({actionName: "redo"});
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 6: undo 3 times, show that the extra undo is igored.')
        await act(
          async () => {
            await domainController.handleDomainDataAction({actionName: "undo"});
            await domainController.handleDomainDataAction({actionName: "undo"});
            await domainController.handleDomainDataAction({actionName: "undo"});
            await domainController.handleDomainDataAction({actionName: "redo"});
          }
        );
    
        await user.click(screen.getByRole('button'))
    
        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(1);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
    
        await waitFor(
          () => {
            getAllByText(container,/step:6/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(screen.queryByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeNull() // Book entity
          }
        );
        // putting state back to where it was when test section started
        await act(
          async () => {
            await domainController.handleDomainDataAction({actionName: "redo"});
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 7: redo 1 time, show that the extra redo is igored. Commit then see that current transaction has no undo/redo')
        await act(
          async () => {
            await domainController.handleDomainDataAction({actionName: "redo"});
          }
        );
    
        await user.click(screen.getByRole('button'))
    
        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(2);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
        expect(domainController.currentTransaction()[1]).toEqual(createBookAction);

        await act(
          async () => {
            await domainController.handleDomainDataAction({actionName: "commit"});
          }
        );

        expect(domainController.currentTransaction().length).toEqual(0);

        await waitFor(
          () => {
            getAllByText(container,/step:7/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(getByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeTruthy() // Book Entity
          }
        );
      }
    )

  }
)

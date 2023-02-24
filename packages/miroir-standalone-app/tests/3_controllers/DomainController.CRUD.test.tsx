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
  DomainAction,
  entityEntity,
  entityReport, Instance, miroirCoreStartup,
  reportEntityList,
  reportReportList
} from "miroir-core";

import miroirConfig from 'miroir-standalone-app/src/assets/miroirConfig.json';
import { createMswStore } from "miroir-standalone-app/src/miroir-fwk/createStore";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { DisplayLoadingInfo, renderWithProviders } from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";

miroirAppStartup();
miroirCoreStartup();

const {mServer, worker, reduxStore, domainController, miroirContext} = createMswStore(miroirConfig.rootApiUrl,fetch,setupServer)
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
  'DomainController.CRUD',
  () => {
    // ###########################################################################################
    it(
      'Refresh all Entity definitions',
      async () => {
        console.log('Refresh all Entity definitions start');
        const displayLoadingInfo=<DisplayLoadingInfo/>
        const user = userEvent.setup()

        await mServer.createObjectStore(["Entity","Instance","Report"]);
        await mServer.clearObjectStore();
        await mServer.localIndexedDb.putValue("Entity",entityReport);
        await mServer.localIndexedDb.putValue("Entity",entityEntity);
        await mServer.localIndexedDb.putValue("Report",reportEntityList);

        const {
          getByText,
          getAllByRole,
          // container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName="Entity"
            DisplayLoadingInfo={displayLoadingInfo}
          />
          ,
          {store:reduxStore.getInnerStore()}
        );

        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:1/)
          },
        ).then(
          ()=> {
            expect(getByText(/952d2c65-4da2-45c2-9394-a0920ceedfb6/i)).toBeTruthy() // Report
            expect(getByText(/bdd7ad43-f0fc-4716-90c1-87454c40dd95/i)).toBeTruthy() // Entity
          }
        );
      }
    )

    // ###########################################################################################
    it(
      'Add Report definition',
      async () => {
        console.log('add Report definition start');

        const displayLoadingInfo=<DisplayLoadingInfo/>
        const user = userEvent.setup()
        // const loadingStateService = new LoadingStateService();

        await mServer.createObjectStore(["Entity","Instance","Report"]);
        await mServer.clearObjectStore();
        await mServer.localIndexedDb.putValue("Entity", entityReport);
        await mServer.localIndexedDb.putValue("Entity", entityEntity);
        await mServer.localIndexedDb.putValue("Report", reportReportList);
        // Entity List Report is not added.
        // await mServer.localIndexedDb.putValue("Report", reportEntityList);


        const {
          getByText,
          getAllByRole,
          container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName="Report"
            DisplayLoadingInfo={displayLoadingInfo}
          />,
          {store:reduxStore.getInnerStore(),}
        );

        // ##########################################################################################################
        console.log('add Report definition step 1: loading initial configuration, reportEntityList must be absent from report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:1/)
          },
        ).then(
          ()=> {
            const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            // console.log("absentReport", absentReport);
            expect(absentReport).toBeNull() 
            // const presentReport = screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i); // Report List
            expect(screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
            console.log('end test 1')
          }
        );

        // ##########################################################################################################
        console.log('add Report definition step 2: adding reportEntityList, it must then be present in the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({
              actionName:'create',
              objects:[{entity:'Report',instances:[reportEntityList]}]
            });
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            // getAllByText(container,/finished/)
            getAllByText(container,/step:2/)
          },
        ).then(
          ()=> {
            expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('add Report definition step 3: refreshing report list from remote store, reportEntityList must still be present in the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByText(container,/step:3/)
          },
        ).then(
          ()=> {
            expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );
      }
    )

    // ###########################################################################################
    it(
      'Remove Report definition',
      async () => {
        console.log('remove Report definition start');
        await mServer.createObjectStore(["Entity","Instance","Report"]);
        await mServer.clearObjectStore();
        await mServer.localIndexedDb.putValue("Entity", entityReport);
        await mServer.localIndexedDb.putValue("Entity", entityEntity);
        await mServer.localIndexedDb.putValue("Report", reportEntityList);
        await mServer.localIndexedDb.putValue("Report", reportReportList);

        const displayLoadingInfo=<DisplayLoadingInfo/>
        const user = userEvent.setup()

        const {
          getByText,
          getAllByRole,
          container
        } = renderWithProviders(
            <TestUtilsTableComponent
              entityName="Report"
              DisplayLoadingInfo={displayLoadingInfo}
            />,
          {store:reduxStore.getInnerStore()}
          // {store:reduxStore.getInnerStore(),loadingStateService:loadingStateService}
        );

        // ##########################################################################################################
        console.log('remove Report definition step  1: refreshing report list from remote store, reportEntityList must still be present in the report list.')

        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace"});
          }
        );
        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByText(container,/step:1/)
          },
        ).then(
          ()=> {
            expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('remove Report definition step 2: removing reportEntityList from local store, it must be absent from the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({
              actionName:'delete',
              objects:[{entity:'Report',instances:[reportEntityList]}]
            });
          }
        );
        
        await user.click(screen.getByRole('button'))
        await waitFor(
          () => {
            getAllByText(container,/step:2/)
          },
        ).then(
          ()=> {
            const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            // console.log("absentReport", absentReport);
            expect(absentReport).toBeNull()
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('remove Report definition step 3: refreshing local store from remote store, reportEntityList must still be absent from the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace"});
          }
        );
        await user.click(screen.getByRole('button'))
        await waitFor(
          () => {
            getAllByText(container,/step:3/)
          },
        ).then(
          ()=> {
            const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            expect(absentReport).toBeNull()
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );
      }
    )

    // ###########################################################################################
    it(
      'Update Report definition',
      async () => {
        console.log('update Report definition start');

        const displayLoadingInfo=<DisplayLoadingInfo/>
        const user = userEvent.setup()

        await mServer.createObjectStore(["Entity","Instance","Report"]);
        await mServer.clearObjectStore();
        await mServer.localIndexedDb.putValue("Entity", entityReport);
        await mServer.localIndexedDb.putValue("Entity", entityEntity);
        await mServer.localIndexedDb.putValue("Report", reportReportList);
        // Entity List Report is not added.
        // await mServer.localIndexedDb.putValue("Report", reportEntityList);


        const {
          getByText,
          getAllByRole,
          container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName="Report"
            DisplayLoadingInfo={displayLoadingInfo}
          />,
          {store:reduxStore.getInnerStore(),}
        );

        // ##########################################################################################################
        console.log('Update Report definition step 1: loading initial configuration, reportEntityList must be present in report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:1/)
          },
        ).then(
          ()=> {
            // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            // // console.log("absentReport", absentReport);
            // expect(absentReport).toBeNull() 
            // const presentReport = screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i); // Report List
            expect(screen.queryByText(/ReportList/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('Update Report definition step 2: update reportReportList, modified version must then be present in the report list.')
        const updateAction: DomainAction = {
          actionName: "update",
          objects: [
            {
              entity: "Report",
              instances: [
                {
                  "uuid": "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
                  "entity":"Report",
                  "name":"Report2List",
                  "defaultLabel": "List of Reports",
                  "type": "list",
                  "definition": {
                    "entity": "Report"
                  }
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

        console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))

        expect(domainController.currentTransaction()[0]['action']['payload']).toEqual(updateAction);
        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:2/)
          },
        ).then(
          ()=> {
            expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('Update Report definition step 3: refreshing report list from remote store, modified reportReportList must still be present in the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByText(container,/step:3/)
          },
        ).then(
          ()=> {
            expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
          }
        );
      }
    )
    
  }  
)

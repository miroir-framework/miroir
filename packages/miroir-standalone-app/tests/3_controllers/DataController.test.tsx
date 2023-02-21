/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { getAllByText, screen, waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import React from "react";

const fetch = require('node-fetch');


import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder


import {
  entityEntity,
  entityReport, miroirCoreStartup,
  reportEntityList,
  reportReportList
} from "miroir-core";

import miroirConfig from 'miroir-standalone-app/src/miroir-fwk/assets/miroirConfig.json';
import { createMswStore } from "miroir-standalone-app/src/miroir-fwk/createStore";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { LoadingStateService, renderWithProviders } from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";

miroirAppStartup();
miroirCoreStartup();

const {mServer, worker, reduxStore, dataController, domainController, miroirContext} = createMswStore(miroirConfig.rootApiUrl,fetch,setupServer)
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

// ###########################################################################################
// it(
//   'DataController: Refresh all Entity definitions',
//   async () => {
//     console.log('Refresh all Entity definitions start');
//     await mServer.createObjectStore(["Entity","Instance","Report"]);
//     await mServer.localIndexedDb.putValue("Entity",entityReport);
//     await mServer.localIndexedDb.putValue("Entity",entityEntity);
//     await mServer.localIndexedDb.putValue("Report",reportEntityList);

//     dataController.loadConfigurationFromRemoteDataStore();

//     const {
//       getByText,
//       getAllByRole,
//       // container
//     } = renderWithProviders(
//       <TestUtilsTableComponent/>,
//       {store:reduxStore.getInnerStore()}
//     );

//     await waitFor(
//       () => {
//         getAllByRole(/gridcell/)
//       },
//     ).then(
//       ()=> {
//         expect(getByText(/952d2c65-4da2-45c2-9394-a0920ceedfb6/i)).toBeTruthy() // Report
//         expect(getByText(/bdd7ad43-f0fc-4716-90c1-87454c40dd95/i)).toBeTruthy() // Entity
//       }
//     );
//   }
// )

// ###########################################################################################
it(
  'DataController: add Report definition',
  async () => {
    console.log('add Report definition start');

    const loadingStateService = new LoadingStateService();

    await mServer.createObjectStore(["Entity","Instance","Report"]);
    await mServer.clearObjectStore();
    await mServer.localIndexedDb.putValue("Entity", entityReport);
    await mServer.localIndexedDb.putValue("Entity", entityEntity);
    await mServer.localIndexedDb.putValue("Report", reportEntityList);
    // report List Report is not added.
    // await mServer.localIndexedDb.putValue("Report", reportReportList);

    await dataController.loadConfigurationFromRemoteDataStore();

    await domainController.handleDomainAction({
      actionName:'create',
      objects:[{entity:'Report',instances:[reportReportList]}]
    });

    loadingStateService.setLoaded(true);

    const {
      getByText,
      getAllByRole,
      container
    } = renderWithProviders(
      <TestUtilsTableComponent
      entityName="Report"
      />,
      {store:reduxStore.getInnerStore(),loadingStateService:loadingStateService}
    );

    await waitFor(
      () => {
        getAllByText(container,/finished/)
      },
    ).then(
      ()=> {
        expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Report
        expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Entity
      }
    );
  }
)

// ###########################################################################################
it(
  'DataController: remove Report definition',
  async () => {
    console.log('remove Report definition start');
    await mServer.createObjectStore(["Entity","Instance","Report"]);
    await mServer.clearObjectStore();
    await mServer.localIndexedDb.putValue("Entity", entityReport);
    await mServer.localIndexedDb.putValue("Entity", entityEntity);
    await mServer.localIndexedDb.putValue("Report", reportEntityList);
    await mServer.localIndexedDb.putValue("Report", reportReportList);

    const loadingStateService = new LoadingStateService();

    await dataController.loadConfigurationFromRemoteDataStore();

    await domainController.handleDomainAction({
      actionName:'delete',
      objects:[{entity:'Report',instances:[reportEntityList]}]
    });

    loadingStateService.setLoaded(true);

    const {
      getByText,
      getAllByRole,
      container
    } = renderWithProviders(
        <TestUtilsTableComponent
          entityName="Report"
        />,
      {store:reduxStore.getInnerStore(),loadingStateService:loadingStateService}
    );

    await waitFor(
      () => {
        getAllByText(container,/finished/)
      },
    ).then(
      ()=> {
        const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i);
        console.log("absentReport", absentReport);
        expect(absentReport).toBeNull() // Report
        expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Entity
      }
    );
  }
)
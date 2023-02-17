/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import React from "react";

const fetch = require('node-fetch');


import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder


import {
  DataControllerInterface,
  DataStoreController,
  DomainActionInterface,
  DomainController,
  entityEntity,
  entityReport,
  MiroirContext,
  miroirCoreStartup,
  reportEntityList,
  RestClient,
} from "miroir-core";
import { IndexedDbObjectStore, InstanceRemoteAccessReduxSaga, ReduxStore } from "miroir-redux";

import { RemoteStoreNetworkRestClient } from "miroir-redux";
import miroirConfig from 'miroir-standalone-app/src/miroir-fwk/assets/miroirConfig.json';
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { renderWithProviders } from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import { createMswStore } from "miroir-standalone-app/src/miroir-fwk/createStore";

miroirAppStartup();
miroirCoreStartup();

// const mServer: IndexedDbObjectStore = new IndexedDbObjectStore(miroirConfig.rootApiUrl);
// const worker = setupServer(...mServer.handlers)

// const client:RestClient = new RestClient(fetch);
// const remoteStoreNetworkRestClient = new RemoteStoreNetworkRestClient(miroirConfig.rootApiUrl, client);
// const instanceSagas: InstanceRemoteAccessReduxSaga = new InstanceRemoteAccessReduxSaga(miroirConfig.rootApiUrl, remoteStoreNetworkRestClient);

// const mReduxStore:ReduxStore = new ReduxStore(instanceSagas);
// mReduxStore.run();
// const miroirContext = new MiroirContext();

// const dataController: DataControllerInterface = new DataStoreController(miroirContext, mReduxStore, mReduxStore);
// const domainController:DomainActionInterface = new DomainController(dataController);

const {mServer, worker, reduxStore, dataController, domainController} = createMswStore(miroirConfig.rootApiUrl,fetch,setupServer)
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
  }
)

it(
  'LocalStoreController: Refresh all Entity definitions',
  async () => {
    console.log('Refresh all Entity definitions start');
    await mServer.createObjectStore(["Entity","Instance","Report"]);
    await mServer.localIndexedDb.putValue("Entity",entityReport);
    await mServer.localIndexedDb.putValue("Entity",entityEntity);
    await mServer.localIndexedDb.putValue("Report",reportEntityList);

    dataController.loadConfigurationFromRemoteDataStore();

    const {
      getByText,
      getAllByRole,
      // container
    } = renderWithProviders(
      <TestUtilsTableComponent/>,
      {store:reduxStore.getInnerStore()}
    );

    await waitFor(
      () => {
        getAllByRole(/gridcell/)
      },
    ).then(
      ()=> {
        expect(getByText(/952d2c65-4da2-45c2-9394-a0920ceedfb6/i)).toBeTruthy() // Report
        expect(getByText(/bdd7ad43-f0fc-4716-90c1-87454c40dd95/i)).toBeTruthy() // Entity
      }
    );

  }
)
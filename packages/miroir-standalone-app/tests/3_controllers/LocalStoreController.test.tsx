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
  DataStoreController,
  entityEntity,
  entityReport, MiroirContext,
  miroirCoreStartup,
  reportEntityList,
  RestClient
} from "miroir-core";

import { DataControllerInterface } from 'miroir-core';
import { ReduxStore } from 'miroir-standalone-app/src/miroir-fwk/4_services/localStore/ReduxStore';
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { renderWithProviders } from "miroir-standalone-app/tests/tests-utils";
import { TestTableComponent } from "miroir-standalone-app/tests/view/TestTableComponent";
import { IndexedDbObjectStore } from "../../src/miroir-fwk/4_services/remoteStore/IndexedDbObjectStore";
import InstanceRemoteAccessReduxSaga from "../../src/miroir-fwk/4_services/remoteStore/InstanceRemoteAccessReduxSaga";
import RemoteStoreClient from "../../src/miroir-fwk/4_services/remoteStore/RemoteStoreNetworkClient";


miroirAppStartup();
miroirCoreStartup();

const mServer: IndexedDbObjectStore = new IndexedDbObjectStore();
const worker = setupServer(...mServer.handlers)

const client:RestClient = new RestClient(fetch);
const remoteStoreClient = new RemoteStoreClient(client);
// const entitySagas: EntityRemoteAccessReduxSaga = new EntityRemoteAccessReduxSaga(remoteStoreClient);
const instanceSagas: InstanceRemoteAccessReduxSaga = new InstanceRemoteAccessReduxSaga(remoteStoreClient);

const mReduxStore:ReduxStore = new ReduxStore(instanceSagas);
mReduxStore.run();
const miroirContext = new MiroirContext();

const dataController: DataControllerInterface = new DataStoreController(miroirContext, mReduxStore, mReduxStore);

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
    // const saga:ExpectApi = expectSaga(mReduxStore.rootSaga, mReduxStore);
    console.log('Refresh all Entity definitions start');
    await mServer.createObjectStore(["Entity","Instance","Report"]);
    await mServer.localIndexedStorage.putValue("Entity",entityReport);
    await mServer.localIndexedStorage.putValue("Entity",entityEntity);
    await mServer.localIndexedStorage.putValue("Report",reportEntityList);

    dataController.loadConfigurationFromRemoteDataStore();

    const {
      getByText,
      getAllByRole,
      // container
    } = renderWithProviders(
      <TestTableComponent/>,
      {store:mReduxStore.getInnerStore()}
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
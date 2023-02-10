/**
 * jest-environment ./tests/custom-test-env
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */

import { TextDecoder, TextEncoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

import { waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import React from 'react'

// import fetch from "node-fetch";
const fetch = require('node-fetch');

import { IndexedDbObjectStore } from 'miroir-standalone-app/src/miroir-fwk/4_services/remoteStore/IndexedDbObjectStore'
import RemoteStoreClient from 'miroir-standalone-app/src/miroir-fwk/4_services/remoteStore/RemoteStoreNetworkClient'
import { DataControllerInterface, DataStoreController, MiroirContext, RestClient } from 'miroir-core'
import { ReduxStore } from 'miroir-standalone-app/src/miroir-fwk/4_services/localStore/ReduxStore'
import { MReportComponent } from 'miroir-standalone-app/src/miroir-fwk/4_view/MReportComponent'
import { EntityRemoteAccessReduxSaga } from "miroir-standalone-app/src/miroir-fwk/4_services/remoteStore/EntityRemoteAccessReduxSaga"
import { InstanceRemoteAccessReduxSaga } from "miroir-standalone-app/src/miroir-fwk/4_services/remoteStore/InstanceRemoteAccessReduxSaga"
import { renderWithProviders } from 'miroir-standalone-app/tests/tests-utils'

import { miroirAppStartup } from "miroir-standalone-app/src/startup"


import { entityEntity, entityReport, miroirCoreStartup, reportEntityList } from "miroir-core"
// import { pushError } from 'miroir-standalone-app/src/miroir-fwk/3_controllers/ErrorLogService'

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

miroirAppStartup();
miroirCoreStartup();

const mServer: IndexedDbObjectStore = new IndexedDbObjectStore();
const worker = setupServer(...mServer.handlers)
// const mClient:RemoteStoreNetworkClientInterface = new RemoteStoreClient(Fetch);

// const entitySagas: EntitySagas = new EntitySagas(mClient);
// const instanceSagas: InstanceSagas = new InstanceSagas(mClient);
const client:RestClient = new RestClient(fetch);
const remoteStoreClient = new RemoteStoreClient(client);
const entitySagas: EntityRemoteAccessReduxSaga = new EntityRemoteAccessReduxSaga(remoteStoreClient);
const instanceSagas: InstanceRemoteAccessReduxSaga = new InstanceRemoteAccessReduxSaga(remoteStoreClient);

const mReduxStore:ReduxStore = new ReduxStore(entitySagas,instanceSagas);
mReduxStore.run();

// const dataController: DataControllerInterface = new LocalDataStoreController(mReduxStore,mReduxStore,pushError);
const miroirContext = new MiroirContext();

const dataController: DataControllerInterface = new DataStoreController(miroirContext,mReduxStore, mReduxStore); // ReduxStore implements both local and remote Data Store access.

// Enable API mocking before tests.
beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    worker.listen();
    await mServer.openObjectStore();
  }
)

// Reset any runtime request handlers we may add during the tests.
// afterEach(() => worker.resetHandlers())

// Disable API mocking after the tests are done.
afterAll(
  async () => {
    worker.close();
    await mServer.closeObjectStore();
  }
)

it(
  'MReportComponent: test loading sequence for Report displaying Entity list',
  async () => {
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
      <MReportComponent
        reportName="EntityList"
      />,
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
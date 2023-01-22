/**
 * jest-environment ./tests/custom-test-env
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */

import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

import { setupServer } from 'msw/node'
import React from 'react'
import { waitFor } from '@testing-library/react'
import fetch from 'node-fetch'


import MClient, { MclientI } from 'src/miroir-fwk/4_services/remoteStore/MClient'
import { MDevServer } from 'src/miroir-fwk/4_services/remoteStore/MDevServer'
import { EntitySagas } from 'src/miroir-fwk/4_services/remoteStore/EntitySagas'
import InstanceSagas from 'src/miroir-fwk/4_services/remoteStore/InstanceSagas'
import { ReduxStore } from 'src/miroir-fwk/4_services/localStore/ReduxStore'
import { MReportComponent } from 'src/miroir-fwk/4_view/MReportComponent'
import { DataControllerInterface } from 'miroir-core'
import { LocalDataStoreController } from 'src/miroir-fwk/3_controllers/LocalDataStoreController'
import { renderWithProviders } from 'tests/tests-utils'

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json"
import entityReport from "src/miroir-fwk/assets/entities/Report.json"
import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json"

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

const mServer: MDevServer = new MDevServer();
const worker = setupServer(...mServer.handlers)
const mClient:MclientI = new MClient(fetch);

const entitySagas: EntitySagas = new EntitySagas(mClient);
const instanceSagas: InstanceSagas = new InstanceSagas(mClient);
const mReduxStore:ReduxStore = new ReduxStore(entitySagas,instanceSagas);
mReduxStore.run();

const dataController: DataControllerInterface = new LocalDataStoreController(mReduxStore,mReduxStore);

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

test(
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
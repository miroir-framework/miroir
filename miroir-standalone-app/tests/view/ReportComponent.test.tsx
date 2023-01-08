/**
 * jest-environment-options {"url": "http://localhost/"}
 * jest-environment ./tests/custom-test-env
 * @jest-environment jsdom
 */

import { TextEncoder, TextDecoder } from 'util'
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

import { setupServer } from 'msw/node'
import React from 'react'
import { waitFor } from '@testing-library/react'
import fetch from 'node-fetch'
import MClient, { MclientI } from 'src/miroir-fwk/4_storage/remote/MClient'
import { MDevServer } from 'src/miroir-fwk/4_storage/remote/MDevServer'
import { EntitySagas } from 'src/miroir-fwk/4_storage/remote/EntitySagas'
import InstanceSagas from 'src/miroir-fwk/4_storage/remote/InstanceSagas'
import { MreduxStore } from 'src/miroir-fwk/4_storage/local/MReduxStore'
import { MReportComponent } from 'src/miroir-fwk/4_view/MReportComponent'
import { renderWithProviders } from 'tests/tests-utils'

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json"
import entityReport from "src/miroir-fwk/assets/entities/Report.json"
import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json"

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

const mServer: MDevServer = new MDevServer();
const mClient:MclientI = new MClient(fetch);
const entitySagas: EntitySagas = new EntitySagas(mClient);
const instanceSagas: InstanceSagas = new InstanceSagas(mClient);
const mReduxStore:MreduxStore = new MreduxStore(entitySagas,instanceSagas);

const worker = setupServer(...mServer.handlers)

mReduxStore.sagaMiddleware.run(
  mReduxStore.rootSaga, mReduxStore
);


// Enable API mocking before tests.
beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    worker.listen();
    await mServer.openObjectStore();
  }
)

// Reset any runtime request handlers we may add during the tests.
afterEach(() => worker.resetHandlers())

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

    // await mStore.dispatch(entitySagas.mEntitySagaActionsCreators.fetchMiroirEntities())
    await mReduxStore.fetchFromApiAndReplaceInstancesForAllEntities();

    const {
      getByText,
      getAllByRole,
      container
    } = renderWithProviders(
      <MReportComponent
        reportName="EntityList"
      />,
      {store:mReduxStore.store}
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
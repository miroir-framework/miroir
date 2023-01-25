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

// const fetch = require('node-fetch');

import MClient, { MclientI } from 'miroir-standalone-app/src/miroir-fwk/4_services/remoteStore/MClient'
import { MDevServer } from 'miroir-standalone-app/src/miroir-fwk/4_services/remoteStore/MDevServer'
import { EntitySagas } from 'miroir-standalone-app/src/miroir-fwk/4_services/remoteStore/EntitySagas'
import { InstanceSagas } from 'miroir-standalone-app/src/miroir-fwk/4_services/remoteStore/InstanceSagas'
import { ReduxStore } from 'miroir-standalone-app/src/miroir-fwk/4_services/localStore/ReduxStore'
import { MReportComponent } from 'miroir-standalone-app/src/miroir-fwk/4_view/MReportComponent'
import { DataControllerInterface } from 'miroir-core'
import { LocalDataStoreController } from 'miroir-core'
import { renderWithProviders } from 'miroir-standalone-app/tests/tests-utils'

import {entityEntity} from "miroir-core"
import {entityReport} from "miroir-core"
import {reportEntityList} from "miroir-core"
import { pushError } from 'miroir-standalone-app/src/miroir-fwk/3_controllers/ErrorLogService'

import Fetch from "node-fetch";

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

const mServer: MDevServer = new MDevServer();
const worker = setupServer(...mServer.handlers)
const mClient:MclientI = new MClient(Fetch);

const entitySagas: EntitySagas = new EntitySagas(mClient);
const instanceSagas: InstanceSagas = new InstanceSagas(mClient);
const mReduxStore:ReduxStore = new ReduxStore(entitySagas,instanceSagas);
mReduxStore.run();

const dataController: DataControllerInterface = new LocalDataStoreController(mReduxStore,mReduxStore,pushError);

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
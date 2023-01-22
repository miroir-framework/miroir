/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { waitFor } from "@testing-library/react";
import { setupServer } from "msw/node";
import fetch from 'node-fetch';

import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
import entityReport from "src/miroir-fwk/assets/entities/Report.json";
import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json";

import { DataControllerInterface } from 'miroir-core';
import { LocalDataStoreController } from 'src/miroir-fwk/3_controllers/LocalDataStoreController';
import ReduxStore from 'src/miroir-fwk/4_services/localStore/ReduxStore';
import { EntitySagas } from 'src/miroir-fwk/4_services/remoteStore/EntitySagas';
import { InstanceSagas } from 'src/miroir-fwk/4_services/remoteStore/InstanceSagas';
import MClient, { MclientI } from 'src/miroir-fwk/4_services/remoteStore/MClient';
import { MDevServer } from 'src/miroir-fwk/4_services/remoteStore/MDevServer';
import { renderWithProviders } from "tests/tests-utils";
import { TestTableComponent } from "tests/view/TestTableComponent";
import React from "react";

const mServer: MDevServer = new MDevServer();
const worker = setupServer(...mServer.handlers)
const mClient:MclientI = new MClient(fetch);

const entitySagas: EntitySagas = new EntitySagas(mClient);
const instanceSagas: InstanceSagas = new InstanceSagas(mClient);
const mReduxStore:ReduxStore = new ReduxStore(entitySagas,instanceSagas);
mReduxStore.run();

const dataController: DataControllerInterface = new LocalDataStoreController(mReduxStore,mReduxStore);

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
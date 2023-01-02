import { ExpectApi, expectSaga } from 'redux-saga-test-plan';
// import MClient, { MclientI } from '../../src/api/MClient';
import MClient, { MclientI } from 'src/api/MClient';
import { EntitySagas } from 'src/miroir-fwk/entities/EntitySagas';
import { InstanceSagas, mInstanceSliceActionNames } from 'src/miroir-fwk/entities/InstanceSagas';
import { MreduxStore } from 'src/miroir-fwk/state/store';
import { setupServer } from "msw/node";

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
import entityReport from "src/miroir-fwk/assets/entities/Report.json";
import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json"

import fetch from 'node-fetch';
import { MServer } from 'src/api/server';
import InstanceSlice, { mInstanceSliceStoreActionNames } from 'src/miroir-fwk/entities/InstanceSlice';
import { mEntitySliceStoreActionNames } from 'src/miroir-fwk/entities/EntitySlice';
const delay = (time:number) => new Promise((resolve) => {
  setTimeout(resolve, time);
});

const miroirEntitiesActions = {
  fetchMiroirEntities:"entities/fetchMiroirEntities"
}

const mServer: MServer = new MServer();
const mClient:MclientI = new MClient(fetch);
const entitySlice: EntitySagas = new EntitySagas(mClient);
const instanceSlice: InstanceSagas = new InstanceSagas(mClient);
const store:MreduxStore = new MreduxStore(entitySlice,instanceSlice);

const worker = setupServer(...mServer.handlers)

beforeAll(() => {
  // Establish requests interception layer before all tests.
  worker.listen();
})

afterAll(async () => {
  worker.close();
  await mServer.closeObjectStore();
})

it.skip(
  'Refresh all Entity definitions',
  async () => {
    const saga:ExpectApi = expectSaga(store.rootSaga, store);
    await mServer.createObjectStore(["Entity","Instance","Report"]);
    await mServer.localIndexedStorage.putValue("Entity",entityReport);
    await mServer.localIndexedStorage.putValue("Entity",entityEntity);
    await mServer.localIndexedStorage.putValue("Report",reportEntityList);
    
    saga
    // intermediate observations, entities definitions and corresponding instances are stored
    .put.like({action: {type: 'entities/' + mEntitySliceStoreActionNames.storeEntities, payload:[entityReport,entityEntity]}})
    .put.like({action: {type: 'instance/' + mInstanceSliceStoreActionNames.storeInstancesReceivedFromAPIForEntity, payload:{entity:"Entity"}}})
    .put.like({action: {type: 'instance/' + mInstanceSliceStoreActionNames.storeInstancesReceivedFromAPIForEntity, payload:{entity:"Report"}}})
    // end result, we should observe all instances have been refreshed
    .put.like({action: {type: mInstanceSliceActionNames.allInstancesRefreshed}})
    ;

    // initial stimulation, we demand the refresh of all entity definitions.
    saga.dispatch(entitySlice.mEntityActionsCreators.fetchMiroirEntities())
    
    return (
      saga.run()
    );
  }
)
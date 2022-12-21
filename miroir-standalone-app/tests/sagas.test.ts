import { ExpectApi, expectSaga } from 'redux-saga-test-plan';
import MClient, { MclientI } from '../src/api/MClient';
import { EntitySlice, mEntitySliceStoreActionNames } from '../src/miroir-fwk/entities/entitySlice';
import { InstanceSlice, mInstanceSliceActionNames, mInstanceSliceStoreActionNames } from '../src/miroir-fwk/entities/instanceSlice';
import { MreduxStore } from '../src/miroir-fwk/state/store';
import { setupServer } from "msw/node";

import * as entityEntity from "C:/Users/nono/Documents/devhome/miroir-app/miroir-standalone-app/src/miroir-fwk/assets/entities/Entity.json";
import * as entityReport from "C:/Users/nono/Documents/devhome/miroir-app/miroir-standalone-app/src/miroir-fwk/assets/entities/Report.json";
// import reportEntityList from "C:/Users/nono/Documents/devhome/miroir-app/miroir-standlone-app/src/miroir-fwk/assets/reports/entityList.json"

import fetch from 'node-fetch';
import { MServer } from '../src/api/server';
const delay = (time:number) => new Promise((resolve) => {
  setTimeout(resolve, time);
});

const miroirEntitiesActions = {
  fetchMiroirEntities:"entities/fetchMiroirEntities"
}


// export default server;
// jest.mock("../src/api/MClient");
const data:any = [entityReport,entityEntity]; 
// MClient.prototype.get = jest.fn().mockResolvedValue({data: data});


const mServer: MServer = new MServer();

const mockedMclient:MclientI = new MClient(fetch);

const entitySlice: EntitySlice = new EntitySlice(mockedMclient);
const instanceSlice: InstanceSlice = new InstanceSlice(mockedMclient);

const store:MreduxStore = new MreduxStore(entitySlice,instanceSlice);


const worker = setupServer(...mServer.handlers)

beforeAll(() => {
  // Establish requests interception layer before all tests.
  worker.listen();
})

afterAll(async () => {
  // Establish requests interception layer before all tests.
  worker.close();
  await mServer.closeObjectStore();
})

it(
  'incrementAsync Saga test',
  async () => {
    const saga:ExpectApi = expectSaga(store.rootSaga, store);
    await mServer.createObjectStore(["Entity","Instance","Report"]);
    await mServer.localIndexedStorage.putValue("Entity",entityReport);
    await mServer.localIndexedStorage.putValue("Entity",entityEntity);
    
    saga
    // intermediate observations, entities definitions and corresponding instances are stored
    .put.like({action: {type: 'entities/' + mEntitySliceStoreActionNames.storeEntities, payload:data}})
    .put.like({action: {type: 'instance/' + mInstanceSliceStoreActionNames.storeEntityInstancesReceivedFromAPI, payload:{entity:"Entity"}}})
    .put.like({action: {type: 'instance/' + mInstanceSliceStoreActionNames.storeEntityInstancesReceivedFromAPI, payload:{entity:"Report"}}})
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
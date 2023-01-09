import { ExpectApi, expectSaga } from 'redux-saga-test-plan';
import { setupServer } from "msw/node";
import MClient, { MclientI } from 'src/miroir-fwk/4_storage/remote/MClient';
import { EntitySagas } from 'src/miroir-fwk/4_storage/remote/EntitySagas';
import { InstanceSagas, mInstanceSagaOutputActionNames } from 'src/miroir-fwk/4_storage/remote/InstanceSagas';
import { MreduxStore } from 'src/miroir-fwk/4_storage/local/MReduxStore';

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
import entityReport from "src/miroir-fwk/assets/entities/Report.json";
import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json";

import fetch from 'node-fetch';
import { MDevServer } from 'src/miroir-fwk/4_storage/remote/MDevServer';
import { mEntitySliceInputActionNames } from 'src/miroir-fwk/4_storage/local/EntitySlice';
import { mInstanceSliceInputActionNames } from 'src/miroir-fwk/4_storage/local/MInstanceSlice';
import { MDataControllerI } from 'src/miroir-fwk/0_interfaces/3_controllers/MDataControllerI';
import { MDataController } from 'src/miroir-fwk/3_controllers/MDataController';
const delay = (time:number) => new Promise((resolve) => {
  setTimeout(resolve, time);
});

const mServer: MDevServer = new MDevServer();
const worker = setupServer(...mServer.handlers)
const client:MclientI = new MClient(fetch);
// const entitySagas: EntitySagas = new EntitySagas(mClient);
// const instanceSagas: InstanceSagas = new InstanceSagas(mClient);
// const store:MreduxStore = new MreduxStore(entitySagas,instanceSagas);
const entitySagas: EntitySagas = new EntitySagas(client);
const instanceSagas: InstanceSagas = new InstanceSagas(client);

const mReduxStore:MreduxStore = new MreduxStore(entitySagas, instanceSagas);
mReduxStore.run();
const dataController: MDataControllerI = new MDataController(mReduxStore);
dataController.loadDataFromDataStore();


beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    worker.listen();
    await mServer.openObjectStore();
  }
)

afterAll(
  async () => {
    worker.close();
    await mServer.closeObjectStore();
  }
)

// it(
//   'Refresh all Entity definitions',
//   async () => {
//     const saga:ExpectApi = expectSaga(mReduxStore.rootSaga, mReduxStore);
//     await mServer.createObjectStore(["Entity","Instance","Report"]);
//     await mServer.localIndexedStorage.putValue("Entity",entityReport);
//     await mServer.localIndexedStorage.putValue("Entity",entityEntity);
//     await mServer.localIndexedStorage.putValue("Report",reportEntityList);
    
//     saga
//     // intermediate observations, entities definitions and corresponding instances are stored
//     .put.like({action: {type: 'entities/' + mEntitySliceInputActionNames.replaceEntities, payload:[entityReport,entityEntity]}})
//     .put.like({action: {type: 'instance/' + mInstanceSliceInputActionNames.ReplaceInstancesForEntity, payload:{entity:"Entity"}}})
//     .put.like({action: {type: 'instance/' + mInstanceSliceInputActionNames.ReplaceInstancesForEntity, payload:{entity:"Report"}}})
//     // end result, we should observe all instances have been refreshed
//     .put.like({action: {type: mInstanceSagaOutputActionNames.allInstancesRefreshed}})
//     ;

//     // initial stimulation, we demand the refresh of all entity definitions.
//     saga.dispatch(entitySagas.mEntitySagaActionsCreators.fetchAllMEntitiesFromDatastore())
    
//     return (
//       saga.run()
//     );
//   }
// )
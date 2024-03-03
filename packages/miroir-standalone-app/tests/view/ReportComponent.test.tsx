// import { TextDecoder, TextEncoder } from 'util'
// global.TextEncoder = TextEncoder
// global.TextDecoder = TextDecoder

// import { waitFor } from '@testing-library/react'
// import { setupServer } from 'msw/node'
// import React from 'react'

// import {
//   LocalAndRemoteController,
//   DomainControllerInterface,
//   DomainController,
//   entityDefinitionEntityDefinition,
//   entityReport,
//   MiroirContext,
//   miroirCoreStartup,
//   reportEntityList,
//   RestClient,
// } from "miroir-core";
// import {
//   RestServerStub,
//   PersistenceReduxSaga,
//   ReduxStore,
//   RemoteStoreNetworkRestClient,
// } from "miroir-localcache-redux";

// import { ReportComponent } from 'miroir-standalone-app/src/miroir-fwk/4_view/ReportComponent'
// import { renderWithProviders } from 'miroir-standalone-app/tests/utils/tests-utils'

// import miroirConfig from 'miroir-standalone-app/src/assets/miroirConfig.json'
// import { miroirAppStartup } from "miroir-standalone-app/src/startup"


// // import { pushError } from 'miroir-standalone-app/src/miroir-fwk/3_controllers/ErrorLogService'

// export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))

// miroirAppStartup();
// miroirCoreStartup();

// const mServer: RestServerStub = new RestServerStub(miroirConfig.rootApiUrl);
// const worker = setupServer(...mServer.handlers)

// const client:RestClient = new RestClient(fetch);
// const remoteStoreNetworkRestClient = new RemoteStoreNetworkRestClient(miroirConfig.rootApiUrl, client);
// // const remoteStoreClient = new RemoteStoreClient(miroirConfig.rootApiUrl, client);
// const instanceSagas: PersistenceReduxSaga = new PersistenceReduxSaga(miroirConfig.rootApiUrl, remoteStoreNetworkRestClient);

// const mReduxStore:ReduxStore = new ReduxStore(instanceSagas);
// mReduxStore.run();

// const miroirContext = new MiroirContext();

// const domainController:DomainControllerInterface = new DomainController(dataController);

// // Enable API mocking before tests.
// beforeAll(
//   async () => {
//     // Establish requests interception layer before all tests.
//     worker.listen();
//     await mServer.openObjectStore();
//     console.log('ReportComponent: Done beforeAll');
//   }
// )

// // Reset any runtime request handlers we may add during the tests.
// // afterEach(() => worker.resetHandlers())

// // Disable API mocking after the tests are done.
// afterAll(
//   async () => {
//     worker.close();
//     await mServer.closeObjectStore();
//   }
// )

// it.skip(
//   'ReportComponent: test loading sequence for Report displaying Entity list',
//   async () => {
//     await mServer.createObjectStore(["Entity","Instance","Report"]);
//     await mServer.localIndexedDb.putValue("Entity",entityReport);
//     await mServer.localIndexedDb.putValue("Entity",entityDefinitionEntityDefinition);
//     await mServer.localIndexedDb.putValue("Report",reportEntityList);

//     dataController.loadConfigurationFromRemoteDataStore();

//     const {
//       getByText,
//       getAllByRole,
//       // container
//     } = renderWithProviders(
//       <ReportComponent
//         reportName="EntityList"
//       />,
//       {store:mReduxStore.getInnerStore()}
//     );

//     await waitFor(
//       () => {
//         getAllByRole(/gridcell/)
//       },
//     ).then(
//       ()=> {
//         expect(getByText(/952d2c65-4da2-45c2-9394-a0920ceedfb6/i)).toBeTruthy() // Report
//         expect(getByText(/bdd7ad43-f0fc-4716-90c1-87454c40dd95/i)).toBeTruthy() // Entity
//       }
//     );
//   }
// )
/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { act, getAllByText, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import React from "react";

const fetch = require('node-fetch');


import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder


import {
  DomainAction,
  DomainDataAction,
  entityEntity,
  entityReport, Instance, miroirCoreStartup,
  reportEntityList,
  reportReportList
} from "miroir-core";

import { createMswStore } from "miroir-standalone-app/src/miroir-fwk/createStore";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { DisplayLoadingInfo, renderWithProviders } from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";

miroirAppStartup();
miroirCoreStartup();

const {indexedDbRestServer, worker, reduxStore, domainController, miroirContext} = 
  createMswStore(
    {
      "serverConfig":{emulateServer:true, "rootApiUrl":"http://localhost/fakeApi"},
      "deploymentMode":"monoUser",
      "monoUserAutentification": false,
      "monoUserVersionControl": false,
      "versionControlForDataConceptLevel": false
    },
    fetch,
    setupServer
  )
;

beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    worker.listen();
    await indexedDbRestServer.openObjectStore();
    console.log('Done beforeAll');
  }
)

afterAll(
  async () => {
    worker.close();
    await indexedDbRestServer.closeObjectStore();
    console.log('Done afterAll');
  }
)

describe(
  'DomainController.Model.CRUD',
  () => {
    // ###########################################################################################
    it(
      'Refresh all Entity definitions',
      async () => {
        console.log('Refresh all Entity definitions start');
        const displayLoadingInfo=<DisplayLoadingInfo/>
        const user = userEvent.setup()

        await indexedDbRestServer.createObjectStore([entityEntity.uuid,entityReport.uuid]);
        await indexedDbRestServer.clearObjectStore();
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityReport.entityUuid, entityReport);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityEntity.entityUuid, entityEntity);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(reportReportList.entityUuid, reportReportList);

        const {
          getByText,
          getAllByRole,
          // container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName={entityEntity.name}
            entityUuid={entityEntity.uuid}
            DisplayLoadingInfo={displayLoadingInfo}
          />
          ,
          {store:reduxStore.getInnerStore()}
        );

        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:1/)
          },
        ).then(
          ()=> {
            expect(getByText(/952d2c65-4da2-45c2-9394-a0920ceedfb6/i)).toBeTruthy() // Report
            expect(getByText(/bdd7ad43-f0fc-4716-90c1-87454c40dd95/i)).toBeTruthy() // Entity
          }
        );
      }
    )

    // ###########################################################################################
    it(
      'Add Report definition then rollback',
      async () => {
        console.log('Add Report definition then rollback start');

        const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.uuid}/>
        const user = userEvent.setup()
        // const loadingStateService = new LoadingStateService();

        await indexedDbRestServer.createObjectStore([entityEntity.uuid,entityReport.uuid]);
        await indexedDbRestServer.clearObjectStore();
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityReport.entityUuid, entityReport);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityEntity.entityUuid, entityEntity);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(reportReportList.entityUuid, reportReportList);

        const {
          getByText,
          getAllByRole,
          container
        } = renderWithProviders(
          <TestUtilsTableComponent
          entityName={entityReport.name}
          entityUuid={entityReport.uuid}
          DisplayLoadingInfo={displayLoadingInfo}
          />,
          {store:reduxStore.getInnerStore(),}
        );

        // ##########################################################################################################
        console.log('add Report definition step 1: loading initial configuration, reportEntityList must be absent from report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:1/)
          },
        ).then(
          ()=> {
            const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            expect(absentReport).toBeNull() 
            expect(screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('add Report definition step 2: adding reportEntityList, it must then be present in the local cache report list.')
        const createAction: DomainAction = {
          actionName:'create',
          actionType:"DomainModelAction",
          objects:[{entity:reportEntityList.entity,entityUuid:reportEntityList.entityUuid,instances:[reportEntityList as Instance]}]
        };

        await act(
          async () => {
            await domainController.handleDomainAction(createAction);
          }
        );

        await user.click(screen.getByRole('button'))

        console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(1);
        expect(domainController.currentTransaction()[0]).toEqual(createAction);

        await waitFor(
          () => {
            // getAllByText(container,/finished/)
            getAllByText(container,/step:2/)
          },
        ).then(
          ()=> {
            expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('add Report definition step 3: rollbacking/refreshing report list from remote store, reportEntityList be absent in the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(0);

        await waitFor(
          () => {
            getAllByText(container,/step:3/)
          },
        ).then(
          ()=> {
            const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            expect(absentReport).toBeNull() 
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );
      }
    )

    // ###########################################################################################
    it(
      'Add Report definition then commit',
      async () => {
        console.log('Add Report definition then commit start');

        const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.uuid}/>
        const user = userEvent.setup()
        // const loadingStateService = new LoadingStateService();

        await indexedDbRestServer.createObjectStore([entityEntity.uuid,entityReport.uuid]);
        await indexedDbRestServer.clearObjectStore();
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityReport.entityUuid, entityReport);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityEntity.entityUuid, entityEntity);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(reportReportList.entityUuid, reportReportList);


        const {
          getByText,
          getAllByRole,
          container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName={entityReport.name}
            entityUuid={entityReport.uuid}
            DisplayLoadingInfo={displayLoadingInfo}
          />,
          {store:reduxStore.getInnerStore(),}
        );

        // ##########################################################################################################
        console.log('add Report definition step 1: loading initial configuration, reportEntityList must be absent from report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:1/)
          },
        ).then(
          ()=> {
            const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            expect(absentReport).toBeNull() 
            expect(screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('add Report definition step 2: adding reportEntityList, it must then be present in the local cache report list.')
        const createAction: DomainAction = {
          actionName:'create',
          actionType: "DomainModelAction",
          objects:[{entity:reportEntityList.entity,entityUuid:reportEntityList.entityUuid,instances:[reportEntityList as Instance]}]
        };

        await act(
          async () => {
            await domainController.handleDomainAction(createAction);
          }
        );

        await user.click(screen.getByRole('button'))

        console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(1);
        expect(domainController.currentTransaction()[0]).toEqual(createAction);

        await waitFor(
          () => {
            // getAllByText(container,/finished/)
            getAllByText(container,/step:2/)
          },
        ).then(
          ()=> {
            expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('add Report definition step 3: committing report list to remote store, reportEntityList must be present in the report list afterwards.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "commit",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(0);

        await waitFor(
          () => {
            getAllByText(container,/step:3/)
          },
        ).then(
          ()=> {
            expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('add Report definition step 4: rollbacking/refreshing report list from remote store after the first commit, reportEntityList must still be present in the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(0);

        await waitFor(
          () => {
            getAllByText(container,/step:4/)
          },
        ).then(
          ()=> {
            expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );
        
      }
    )


    // ###########################################################################################
    it(
      'Remove Report definition then commit',
      async () => {
        console.log('remove Report definition start');
        await indexedDbRestServer.createObjectStore([entityEntity.uuid,entityReport.uuid]);
        await indexedDbRestServer.clearObjectStore();
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityReport.entityUuid, entityReport);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityEntity.entityUuid, entityEntity);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(reportReportList.entityUuid, reportReportList);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(reportEntityList.entityUuid, reportEntityList);

        const displayLoadingInfo=<DisplayLoadingInfo/>
        const user = userEvent.setup()

        const {
          getByText,
          getAllByRole,
          container
        } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityReport.name}
              entityUuid={entityReport.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
            />,
          {store:reduxStore.getInnerStore()}
          // {store:reduxStore.getInnerStore(),loadingStateService:loadingStateService}
        );

        // ##########################################################################################################
        console.log('remove Report definition step  1: refreshing report list from remote store, reportEntityList must still be present in the report list.')

        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
          }
        );
        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByText(container,/step:1/)
          },
        ).then(
          ()=> {
            expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('remove Report definition step 2: removing reportEntityList from local store, it must be absent from the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({
              actionName:'delete',
              actionType: 'DomainModelAction',
              objects:[{entity:reportEntityList.entity,entityUuid:reportEntityList.entityUuid,instances:[reportEntityList as Instance]}]
            });
          }
        );
        
        await user.click(screen.getByRole('button'))
        await waitFor(
          () => {
            getAllByText(container,/step:2/)
          },
        ).then(
          ()=> {
            const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            // console.log("absentReport", absentReport);
            expect(absentReport).toBeNull()
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('remove Report definition step 3: commit to remote store, reportEntityList must still be absent from the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "commit",actionType:"DomainModelAction"});
          }
        );
        await user.click(screen.getByRole('button'))
        await waitFor(
          () => {
            getAllByText(container,/step:3/)
          },
        ).then(
          ()=> {
            const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            expect(absentReport).toBeNull()
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('remove Report definition step 4: rollbacking/refreshing report list from remote store after the first commit, reportEntityList must still be absent in the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(0);

        await waitFor(
          () => {
            getAllByText(container,/step:4/)
          },
        ).then(
          ()=> {
            const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            expect(absentReport).toBeNull()
            expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
          }
        );
        
      }
    )

    // ###########################################################################################
    it(
      'Update Report definition then commit',
      async () => {
        console.log('update Report definition start');

        const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
        const user = userEvent.setup()

        await indexedDbRestServer.createObjectStore([entityEntity.uuid,entityReport.uuid]);
        await indexedDbRestServer.clearObjectStore();
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityReport.entityUuid, entityReport);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(entityEntity.entityUuid, entityEntity);
        await indexedDbRestServer.getLocalUuidIndexedDb().putValue(reportReportList.entityUuid, reportReportList);
        // await indexedDbRestServer.getLocalUuidIndexedDb().putValue(reportEntityList.entityUuid, reportEntityList);


        const {
          getByText,
          getAllByRole,
          container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName={entityReport.name}
            entityUuid={entityReport.uuid}
            DisplayLoadingInfo={displayLoadingInfo}
          />,
          {store:reduxStore.getInnerStore(),}
        );

        // ##########################################################################################################
        console.log('Update Report definition step 1: loading initial configuration, reportEntityList must be present in report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:1/)
          },
        ).then(
          ()=> {
            // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
            // // console.log("absentReport", absentReport);
            // expect(absentReport).toBeNull() 
            // const presentReport = screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i); // Report List
            expect(screen.queryByText(/ReportList/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('Update Report definition step 2: update reportReportList, modified version must then be present in the report list.')
        // const updatedReport = 
        const updateAction: DomainAction = {
          actionName: "update",
          actionType: 'DomainModelAction',
          objects: [
            {
              entity: reportReportList.entity,
              entityUuid:reportReportList.entityUuid,
              instances: [
                Object.assign({},reportReportList,{"name":"Report2List", "defaultLabel": "Modified List of Reports"}) as Instance
              ],
            },
          ],
        };
        await act(
          async () => {
            await domainController.handleDomainAction(updateAction);
          }
        );

        console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))

        expect(domainController.currentTransaction().length).toEqual(1);
        expect(domainController.currentTransaction()[0]).toEqual(updateAction);

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:2/)
          },
        ).then(
          ()=> {
            expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('Update Report definition step 3: refreshing report list from remote store, modified reportReportList must still be present in the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "commit",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByText(container,/step:3/)
          },
        ).then(
          ()=> {
            expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('update Report definition step 4: rollbacking/refreshing report list from remote store after the first commit, modified reportEntityList must still be present in the report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace",actionType:"DomainModelAction"});
          }
        );

        await user.click(screen.getByRole('button'))

        console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(0);

        await waitFor(
          () => {
            getAllByText(container,/step:4/)
          },
        ).then(
          ()=> {
            expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
          }
        );
        
      }
    )
  }
)

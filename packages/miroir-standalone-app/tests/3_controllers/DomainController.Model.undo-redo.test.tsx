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
  entityEntity,
  entityReport, Instance, miroirCoreStartup,
  reportEntityList,
  reportReportList
} from "miroir-core";

import { createMswStore } from "miroir-standalone-app/src/miroir-fwk/createStore";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { DisplayLoadingInfo, renderWithProviders } from "miroir-standalone-app/tests/utils/tests-utils";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import entityAuthor from "miroir-standalone-app/src/assets/entities/Author.json";
import entityBook from "miroir-standalone-app/src/assets/entities/Book.json";
import book1 from "miroir-standalone-app/src/assets/instances/Book - The Bride Wore Black.json";


miroirAppStartup();
miroirCoreStartup();

const {mServer, worker, reduxStore, domainController, miroirContext} = 
  createMswStore(
    {
      "rootApiUrl":"http://localhost/fakeApi",
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
    await mServer.openObjectStore();
    console.log('Done beforeAll');
  }
)

afterAll(
  async () => {
    worker.close();
    await mServer.closeObjectStore();
    console.log('Done afterAll');
  }
)

describe(
  'DomainController.Model.undo-redo',
  () => {
    // ###########################################################################################
    it(
      'Add 2 entity definitions then undo one then commit',
      async () => {
        console.log('Add 2 entity definitions then undo one then commit start');

        const displayLoadingInfo=<DisplayLoadingInfo reportName="Entity"/>
        const user = userEvent.setup()

        await mServer.createObjectStore(["Entity","Report",]);
        await mServer.clearObjectStore();
        await mServer.localIndexedDb.putValue("Entity", entityReport);
        await mServer.localIndexedDb.putValue("Entity", entityEntity);
        await mServer.localIndexedDb.putValue("Report", reportReportList);
        await mServer.localIndexedDb.putValue("Report", reportEntityList);


        const {
          getByText,
          getAllByRole,
          container
        } = renderWithProviders(
          <TestUtilsTableComponent
            entityName="Entity"
            DisplayLoadingInfo={displayLoadingInfo}
          />,
          {store:reduxStore.getInnerStore(),}
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 1: loading initial configuration, entities must be absent from report list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "replace"});
          }
        );

        await user.click(screen.getByRole('button'))

        await waitFor(
          () => {
            getAllByRole(/step:1/)
          },
        ).then(
          ()=> {
            expect(screen.queryByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeNull() // Book entity
            expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeNull() // Author entity
            // expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Report List
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 2: adding entities, they must then be present in the local cache Entity list.')
        const createAuthorAction: DomainAction = {
          actionName:'create',
          objects:[{entity:'Entity',instances:[entityAuthor as Instance]}]
        };
        const createBookAction: DomainAction = {
          actionName:'create',
          objects:[{entity:'Entity',instances:[entityBook as Instance]}]
        };

        await act(
          async () => {
            await domainController.handleDomainAction(createAuthorAction);
            await domainController.handleDomainAction(createBookAction);
          }
        );

        await user.click(screen.getByRole('button'))

        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(2);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
        expect(domainController.currentTransaction()[1]).toEqual(createBookAction);

        await waitFor(
          () => {
            // getAllByText(container,/finished/)
            getAllByText(container,/step:2/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(getByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeTruthy() // Book Entity
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 3: undo 1 Entity creation, one Entity must still be present in the entity list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "undo"});
          }
        );

        await user.click(screen.getByRole('button'))

        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(1);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);

        await waitFor(
          () => {
            getAllByText(container,/step:3/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(screen.queryByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeNull() // Book entity
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 4: redo 1 Entity creation, two Entities must be present in the entity list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "redo"});
          }
        );

        await user.click(screen.getByRole('button'))

        console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(2);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
        expect(domainController.currentTransaction()[1]).toEqual(createBookAction);

        await waitFor(
          () => {
            getAllByText(container,/step:4/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(getByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeTruthy() // Book Entity
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 5: undo 2 then redo 1 Entity creation, one Entity must be present in the entity list.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "undo"});
            await domainController.handleDomainAction({actionName: "undo"});
            await domainController.handleDomainAction({actionName: "redo"});
          }
        );
    
        await user.click(screen.getByRole('button'))
    
        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(1);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
    
        await waitFor(
          () => {
            getAllByText(container,/step:5/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(screen.queryByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeNull() // Book entity
          }
        );
        // putting state back to where it was when test section started
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "redo"});
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 6: undo 3 times, show that the extra undo is igored.')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "undo"});
            await domainController.handleDomainAction({actionName: "undo"});
            await domainController.handleDomainAction({actionName: "undo"});
            await domainController.handleDomainAction({actionName: "redo"});
          }
        );
    
        await user.click(screen.getByRole('button'))
    
        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(1);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
    
        await waitFor(
          () => {
            getAllByText(container,/step:6/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(screen.queryByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeNull() // Book entity
          }
        );
        // putting state back to where it was when test section started
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "redo"});
          }
        );

        // ##########################################################################################################
        console.log('Add 2 entity definitions then undo one then commit step 7: redo 1 time, show that the extra redo is igored. Commit then see that current transaction has no undo/redo')
        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "redo"});
          }
        );
    
        await user.click(screen.getByRole('button'))
    
        // console.log("domainController.currentTransaction()", domainController.currentTransaction());
        expect(domainController.currentTransaction().length).toEqual(2);
        expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
        expect(domainController.currentTransaction()[1]).toEqual(createBookAction);

        await act(
          async () => {
            await domainController.handleDomainAction({actionName: "commit"});
          }
        );

        expect(domainController.currentTransaction().length).toEqual(0);

        await waitFor(
          () => {
            getAllByText(container,/step:7/)
          },
        ).then(
          ()=> {
            expect(getByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Author Entity
            expect(getByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeTruthy() // Book Entity
          }
        );
      }
    )


    // // ###########################################################################################
    // it(
    //   'Add Report definition then commit',
    //   async () => {
    //     console.log('Add Report definition then commit start');

    //     const displayLoadingInfo=<DisplayLoadingInfo/>
    //     const user = userEvent.setup()
    //     // const loadingStateService = new LoadingStateService();

    //     await mServer.createObjectStore(["Entity","Instance","Report"]);
    //     await mServer.clearObjectStore();
    //     await mServer.localIndexedDb.putValue("Entity", entityReport);
    //     await mServer.localIndexedDb.putValue("Entity", entityEntity);
    //     await mServer.localIndexedDb.putValue("Report", reportReportList);
    //     // Entity List Report is not added.
    //     // await mServer.localIndexedDb.putValue("Report", reportEntityList);


    //     const {
    //       getByText,
    //       getAllByRole,
    //       container
    //     } = renderWithProviders(
    //       <TestUtilsTableComponent
    //         entityName="Report"
    //         DisplayLoadingInfo={displayLoadingInfo}
    //       />,
    //       {store:reduxStore.getInnerStore(),}
    //     );

    //     // ##########################################################################################################
    //     console.log('add Report definition step 1: loading initial configuration, reportEntityList must be absent from report list.')
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "replace"});
    //       }
    //     );

    //     await user.click(screen.getByRole('button'))

    //     await waitFor(
    //       () => {
    //         getAllByRole(/step:1/)
    //       },
    //     ).then(
    //       ()=> {
    //         const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
    //         expect(absentReport).toBeNull() 
    //         expect(screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
    //       }
    //     );

    //     // ##########################################################################################################
    //     console.log('add Report definition step 2: adding reportEntityList, it must then be present in the local cache report list.')
    //     const createAction: DomainAction = {
    //       actionName:'create',
    //       objects:[{entity:'Report',instances:[reportEntityList as Instance]}]
    //     };

    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction(createAction);
    //       }
    //     );

    //     await user.click(screen.getByRole('button'))

    //     console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //     expect(domainController.currentTransaction().length).toEqual(1);
    //     expect(domainController.currentTransaction()[0]).toEqual(createAction);

    //     await waitFor(
    //       () => {
    //         // getAllByText(container,/finished/)
    //         getAllByText(container,/step:2/)
    //       },
    //     ).then(
    //       ()=> {
    //         expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
    //         expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
    //       }
    //     );

    //     // ##########################################################################################################
    //     console.log('add Report definition step 3: committing report list to remote store, reportEntityList must be present in the report list afterwards.')
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "commit"});
    //       }
    //     );

    //     await user.click(screen.getByRole('button'))

    //     console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //     expect(domainController.currentTransaction().length).toEqual(0);

    //     await waitFor(
    //       () => {
    //         getAllByText(container,/step:3/)
    //       },
    //     ).then(
    //       ()=> {
    //         expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
    //         expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
    //       }
    //     );

    //     // ##########################################################################################################
    //     console.log('add Report definition step 4: rollbacking/refreshing report list from remote store after the first commit, reportEntityList must still be present in the report list.')
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "replace"});
    //       }
    //     );

    //     await user.click(screen.getByRole('button'))

    //     console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //     expect(domainController.currentTransaction().length).toEqual(0);

    //     await waitFor(
    //       () => {
    //         getAllByText(container,/step:4/)
    //       },
    //     ).then(
    //       ()=> {
    //         expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
    //         expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
    //       }
    //     );
        
    //   }
    // )


    // // ###########################################################################################
    // it(
    //   'Remove Report definition then commit',
    //   async () => {
    //     console.log('remove Report definition start');
    //     await mServer.createObjectStore(["Entity","Instance","Report"]);
    //     await mServer.clearObjectStore();
    //     await mServer.localIndexedDb.putValue("Entity", entityReport);
    //     await mServer.localIndexedDb.putValue("Entity", entityEntity);
    //     await mServer.localIndexedDb.putValue("Report", reportEntityList);
    //     await mServer.localIndexedDb.putValue("Report", reportReportList);

    //     const displayLoadingInfo=<DisplayLoadingInfo/>
    //     const user = userEvent.setup()

    //     const {
    //       getByText,
    //       getAllByRole,
    //       container
    //     } = renderWithProviders(
    //         <TestUtilsTableComponent
    //           entityName="Report"
    //           DisplayLoadingInfo={displayLoadingInfo}
    //         />,
    //       {store:reduxStore.getInnerStore()}
    //       // {store:reduxStore.getInnerStore(),loadingStateService:loadingStateService}
    //     );

    //     // ##########################################################################################################
    //     console.log('remove Report definition step  1: refreshing report list from remote store, reportEntityList must still be present in the report list.')

    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "replace"});
    //       }
    //     );
    //     await user.click(screen.getByRole('button'))

    //     await waitFor(
    //       () => {
    //         getAllByText(container,/step:1/)
    //       },
    //     ).then(
    //       ()=> {
    //         expect(getByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i)).toBeTruthy() // Entity List
    //         expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
    //       }
    //     );

    //     // ##########################################################################################################
    //     console.log('remove Report definition step 2: removing reportEntityList from local store, it must be absent from the report list.')
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({
    //           actionName:'delete',
    //           objects:[{entity:'Report',instances:[reportEntityList as Instance]}]
    //         });
    //       }
    //     );
        
    //     await user.click(screen.getByRole('button'))
    //     await waitFor(
    //       () => {
    //         getAllByText(container,/step:2/)
    //       },
    //     ).then(
    //       ()=> {
    //         const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
    //         // console.log("absentReport", absentReport);
    //         expect(absentReport).toBeNull()
    //         expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
    //       }
    //     );

    //     // ##########################################################################################################
    //     console.log('remove Report definition step 3: commit to remote store, reportEntityList must still be absent from the report list.')
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "commit"});
    //       }
    //     );
    //     await user.click(screen.getByRole('button'))
    //     await waitFor(
    //       () => {
    //         getAllByText(container,/step:3/)
    //       },
    //     ).then(
    //       ()=> {
    //         const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
    //         expect(absentReport).toBeNull()
    //         expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
    //       }
    //     );

    //     // ##########################################################################################################
    //     console.log('remove Report definition step 4: rollbacking/refreshing report list from remote store after the first commit, reportEntityList must still be absent in the report list.')
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "replace"});
    //       }
    //     );

    //     await user.click(screen.getByRole('button'))

    //     console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //     expect(domainController.currentTransaction().length).toEqual(0);

    //     await waitFor(
    //       () => {
    //         getAllByText(container,/step:4/)
    //       },
    //     ).then(
    //       ()=> {
    //         const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
    //         expect(absentReport).toBeNull()
    //         expect(getByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i)).toBeTruthy() // Report List
    //       }
    //     );
        
    //   }
    // )

    // // ###########################################################################################
    // it(
    //   'Update Report definition then commit',
    //   async () => {
    //     console.log('update Report definition start');

    //     const displayLoadingInfo=<DisplayLoadingInfo/>
    //     const user = userEvent.setup()

    //     await mServer.createObjectStore(["Entity","Instance","Report"]);
    //     await mServer.clearObjectStore();
    //     await mServer.localIndexedDb.putValue("Entity", entityReport);
    //     await mServer.localIndexedDb.putValue("Entity", entityEntity);
    //     await mServer.localIndexedDb.putValue("Report", reportReportList);
    //     // Entity List Report is not added.
    //     // await mServer.localIndexedDb.putValue("Report", reportEntityList);


    //     const {
    //       getByText,
    //       getAllByRole,
    //       container
    //     } = renderWithProviders(
    //       <TestUtilsTableComponent
    //         entityName="Report"
    //         DisplayLoadingInfo={displayLoadingInfo}
    //       />,
    //       {store:reduxStore.getInnerStore(),}
    //     );

    //     // ##########################################################################################################
    //     console.log('Update Report definition step 1: loading initial configuration, reportEntityList must be present in report list.')
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "replace"});
    //       }
    //     );

    //     await user.click(screen.getByRole('button'))

    //     await waitFor(
    //       () => {
    //         getAllByRole(/step:1/)
    //       },
    //     ).then(
    //       ()=> {
    //         // const absentReport = screen.queryByText(/c9ea3359-690c-4620-9603-b5b402e4a2b9/i); // Entity List
    //         // // console.log("absentReport", absentReport);
    //         // expect(absentReport).toBeNull() 
    //         // const presentReport = screen.queryByText(/1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855/i); // Report List
    //         expect(screen.queryByText(/ReportList/i)).toBeTruthy() // Report List
    //       }
    //     );

    //     // ##########################################################################################################
    //     console.log('Update Report definition step 2: update reportReportList, modified version must then be present in the report list.')
    //     const updateAction: DomainAction = {
    //       actionName: "update",
    //       objects: [
    //         {
    //           entity: "Report",
    //           instances: [
    //             {
    //               "uuid": "1fc7e12e-90f2-4c0a-8ed9-ed35ce3a7855",
    //               "entity":"Report",
    //               "name":"Report2List",
    //               "defaultLabel": "List of Reports",
    //               "type": "list",
    //               "definition": {
    //                 "entity": "Report"
    //               }
    //             } as Instance,
    //           ],
    //         },
    //       ],
    //     };
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction(updateAction);
    //       }
    //     );

    //     console.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXX domainController.currentTransaction()',JSON.stringify(domainController.currentTransaction()))

    //     expect(domainController.currentTransaction().length).toEqual(1);
    //     expect(domainController.currentTransaction()[0]).toEqual(updateAction);

    //     await user.click(screen.getByRole('button'))

    //     await waitFor(
    //       () => {
    //         getAllByRole(/step:2/)
    //       },
    //     ).then(
    //       ()=> {
    //         expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
    //       }
    //     );

    //     // ##########################################################################################################
    //     console.log('Update Report definition step 3: refreshing report list from remote store, modified reportReportList must still be present in the report list.')
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "commit"});
    //       }
    //     );

    //     await user.click(screen.getByRole('button'))

    //     await waitFor(
    //       () => {
    //         getAllByText(container,/step:3/)
    //       },
    //     ).then(
    //       ()=> {
    //         expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
    //       }
    //     );

    //     // ##########################################################################################################
    //     console.log('update Report definition step 4: rollbacking/refreshing report list from remote store after the first commit, modified reportEntityList must still be present in the report list.')
    //     await act(
    //       async () => {
    //         await domainController.handleDomainAction({actionName: "replace"});
    //       }
    //     );

    //     await user.click(screen.getByRole('button'))

    //     console.log("domainController.currentTransaction()", domainController.currentTransaction());
    //     expect(domainController.currentTransaction().length).toEqual(0);

    //     await waitFor(
    //       () => {
    //         getAllByText(container,/step:4/)
    //       },
    //     ).then(
    //       ()=> {
    //         expect(screen.queryByText(/Report2List/i)).toBeTruthy() // Report List
    //       }
    //     );
        
    //   }
    // )
    
  }  
)

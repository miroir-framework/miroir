/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { act, fireEvent, getAllByText, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupServerApi, setupServer } from "msw/node";
import React, { useState } from "react";

const fetch = require('node-fetch');


import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;


import {
  ConfigurationService,
  DomainAction,
  DomainControllerInterface,
  EntityDefinition,
  IStoreController,
  LocalAndRemoteControllerInterface,
  MetaEntity,
  MiroirConfig,
  MiroirContext,
  StoreControllerFactory,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
  applicationDeploymentMiroir,
  entityEntity,
  entityReport,
  miroirCoreStartup
} from "miroir-core";
import {
  ReduxStore, ReduxStoreWithUndoRedo
} from "miroir-redux";

import entityAuthor from "miroir-standalone-app/src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "miroir-standalone-app/src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import entityDefinitionBook from "miroir-standalone-app/src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionAuthor from "miroir-standalone-app/src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
// import author1 from "../../src/assets/library_model/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
// import author2 from "../../src/assets/library_model/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
// import author3 from "../../src/assets/library_model/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
// import book1 from "../../src/assets/library_model/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
// import book2 from "../../src/assets/library_model/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
// import book3 from "../../src/assets/library_model/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
// import book4 from "../../src/assets/library_model/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import {
  DisplayLoadingInfo,
  applicationDeploymentLibrary,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders
} from "miroir-standalone-app/tests/utils/tests-utils";
import { SetupWorkerApi } from "msw";
import { createReduxStoreAndRestClient } from "../../src/miroir-fwk/createMswRestServer";
import { JzodObjectFormEditor, JzodObjectFormEditorProps } from "../../src/miroir-fwk/4_view/JzodObjectFormEditor";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirStoreFileSystemStartup } from "miroir-store-filesystem";
import { miroirStoreIndexedDbStartup } from "miroir-store-indexedDb";
import { miroirStorePostgresStartup } from "miroir-store-postgres";

// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json";
import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_filesystem-sql.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_sql-indexedDb.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_indexedDb-sql.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json";

const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

// miroirAppStartup();
// miroirCoreStartup();
// miroirStoreFileSystemStartup();
// miroirStoreIndexedDbStartup();
// miroirStorePostgresStartup();

// let localMiroirStoreController: IStoreController;
// let localAppStoreController: IStoreController;
// let localDataStoreWorker: SetupWorkerApi;
// let localDataStoreServer: SetupServerApi;
// let reduxStore: ReduxStore;
// let localAndRemoteController: LocalAndRemoteControllerInterface;
// let domainController: DomainControllerInterface;
// let miroirContext: MiroirContext;

beforeAll(
  async () => {
    // const wrappedReduxStore = createReduxStoreAndRestClient(
    //   miroirConfig as MiroirConfig,
    //   fetch,
    // );

    // const {
    //   localMiroirStoreController:a,localAppStoreController:b
    // } = await StoreControllerFactory(
    //   ConfigurationService.storeFactoryRegister,
    //   miroirConfig,
    //   // sqlDbStoreControllerFactory,
    // );
    // localMiroirStoreController = a;
    // localAppStoreController = b;

    // // Establish requests interception layer before all tests.
    // const wrapped = await miroirBeforeAll(
    //   miroirConfig as MiroirConfig,
    //   setupServer,
    //   localMiroirStoreController,
    //   localAppStoreController,
    // );

    // if (wrappedReduxStore && wrapped) {
    //   // localMiroirStoreController = wrapped.localMiroirStoreController as IStoreController;
    //   // localAppStoreController = wrapped.localAppStoreController as IStoreController;
    //   localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
    //   localDataStoreServer = wrapped.localDataStoreServer as SetupServerApi;
    //   reduxStore = wrappedReduxStore.reduxStore;
    //   domainController = wrappedReduxStore.domainController;
    //   miroirContext = wrappedReduxStore.miroirContext;
    // }
  }
)

beforeEach(
  async () => {
    // await miroirBeforeEach(localMiroirStoreController,localAppStoreController);
  }
)

afterAll(
  async () => {
    // await miroirAfterAll(localMiroirStoreController,localAppStoreController,localDataStoreServer);
  }
)

afterEach(
  async () => {
    // await miroirAfterEach(localMiroirStoreController,localAppStoreController);
  }
)

function JzodObjectFormEditorWrapper(props: JzodObjectFormEditorProps) {
  const [result, setResult] = useState(undefined);

  return (
    <div>
    <JzodObjectFormEditor
      label={props.label}
      initialValuesObject={props.initialValuesObject}
      showButton={props.showButton}
      jzodSchema={props.jzodSchema}
      onSubmit={(data:any,event:any)=>{console.log("JzodObjectFormEditorWrapper onSubmit!");setResult(data); return props.onSubmit(data,event)}}
    ></JzodObjectFormEditor>
    {
      result?<div>received result: {JSON.stringify(result)}</div>:<div>no result yet</div>
    }
    </div>
  )
}
describe(
  'JzodObjectFormEditor',
  () => {
    // ###########################################################################################
    it(
      'edit simpleType string form',
      async () => {
        try {
          console.log('edit string attribute');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()

          // await localDataStore.clear();
          // await localDataStore.initModel();

          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <JzodObjectFormEditorWrapper
              label="toto"
              initialValuesObject={{a:"tata"}}
              showButton={true}
              jzodSchema={{type:"object", definition:{"a":{type:"simpleType", definition:"string"}}}}
              onSubmit={(data:any,event:any)=>{console.log("onSubmit called", data, event)}}
            ></JzodObjectFormEditorWrapper>,
            {store:undefined}
          );
  
          // ##########################################################################################################
          console.log('string edition.')
          // await act(
          //   async () => {
          //     await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
          //     await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
          //   }
          // );

          // await act(()=>user.click(screen.getByRole('button')));
 
          const formInput = screen.getByRole('textbox', {name:""})

          console.log('selecting input field');
          
          await act(()=>user.click(formInput));
          console.log('using keyboard');
          await act(()=>user.keyboard('b'));
          // await act(()=>fireEvent.change(formInput,'bbbbbbbbbbbb'));
          
          console.log('submitting');
          await act(()=>user.click(screen.getByRole('button', {name:"Submit"})));
          
          await act(
            async () =>
              await waitFor(() => {
                // getAllByRole(/toto/)
                // screen.queryByText(new RegExp(`toto`,'i'))
                getByText(new RegExp(`received result`, "i"));
              }).then(() => {
                expect(screen.queryByText(new RegExp(`received result: {"a":"tatab"}`, "i"))).toBeTruthy(); // Book entity
                // expect(screen.queryByText(new RegExp(`tata`,'i'))).toBeNull() // Author entity
              })
          );
  
      //     // ##########################################################################################################
      //     console.log('Add 2 entity definitions then undo one then commit step 2: adding entities, they must then be present in the local cache Entity list.')
      //     const createAuthorAction: DomainAction = {
      //       actionType:"DomainTransactionalAction",
      //       actionName: "updateEntity",
      //       update: {
      //         updateActionName:"WrappedTransactionalEntityUpdate",
      //         modelEntityUpdate: {
      //           updateActionType: "ModelEntityUpdate",
      //           updateActionName: "createEntity",
      //           entities: [
      //             {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
      //           ],
      //         },
      //       }
      //     };
      //     const createBookAction: DomainAction = {
      //       actionType:"DomainTransactionalAction",
      //       actionName: "updateEntity",
      //       update: {
      //         updateActionName:"WrappedTransactionalEntityUpdate",
      //         modelEntityUpdate: {
      //           updateActionType: "ModelEntityUpdate",
      //           updateActionName: "createEntity",
      //           entities: [
      //             {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
      //           ],
      //         },
      //       }
      //     };
  
      //     await act(
      //       async () => {
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,createAuthorAction,reduxStore.currentModel(applicationDeploymentLibrary.uuid));
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,createBookAction,reduxStore.currentModel(applicationDeploymentLibrary.uuid));
      //       }
      //     );
  
      //     await act(()=>user.click(screen.getByRole('button')));
  
      //     // console.log("domainController.currentTransaction()", domainController.currentTransaction());
      //     expect(domainController.currentTransaction().length).toEqual(2);
      //     // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
      //     // expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
      //     expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      //     expect((domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createBookAction.update.modelEntityUpdate);
  
      //     await waitFor(
      //       () => {
      //         // getAllByText(container,/finished/)
      //         getAllByText(container,/step:2/)
      //       },
      //     ).then(
      //       ()=> {
      //         expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
      //         expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy();
      //       }
      //     );
  
      //     // ##########################################################################################################
      //     console.log('Add 2 entity definitions then undo one then commit step 3: undo 1 Entity creation, one Entity must still be present in the entity list.')
      //     await act(
      //       async () => {
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
      //       }
      //     );
  
      //     await act(()=>user.click(screen.getByRole('button')));
  
      //     // console.log("domainController.currentTransaction()", domainController.currentTransaction());
      //     expect(domainController.currentTransaction().length).toEqual(1);
      //     // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
      //     expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
  
      //     await waitFor(
      //       () => {
      //         getAllByText(container,/step:3/)
      //       },
      //     ).then(
      //       ()=> {
      //         expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
      //         expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
      //       }
      //     );

      //     // ##########################################################################################################
      //     console.log('Add 2 entity definitions then undo one then commit step 4: redo 1 Entity creation, two Entities must be present in the entity list.')
      //     await act(
      //       async () => {
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
      //       }
      //     );
  
      //     await act(()=>user.click(screen.getByRole('button')));
  
      //     console.log("domainController.currentTransaction()", domainController.currentTransaction());
      //     expect(domainController.currentTransaction().length).toEqual(2);
      //     // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
      //     // expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
      //     expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      //     expect((domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createBookAction.update.modelEntityUpdate);
  
      //     await waitFor(
      //       () => {
      //         getAllByText(container,/step:4/)
      //       },
      //     ).then(
      //       ()=> {
      //         expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
      //         expect(getByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy() // Book Entity
      //       }
      //     );
  
      //     // ##########################################################################################################
      //     console.log('Add 2 entity definitions then undo one then commit step 5: undo 2 then redo 1 Entity creation, one Entity must be present in the entity list.')
      //     await act(
      //       async () => {
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
      //       }
      //     );
      
      //     await act(()=>user.click(screen.getByRole('button')));
      
      //     // console.log("domainController.currentTransaction()", domainController.currentTransaction());
      //     expect(domainController.currentTransaction().length).toEqual(1);
      //     // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
      //     expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      
      //     await waitFor(
      //       () => {
      //         getAllByText(container,/step:5/)
      //       },
      //     ).then(
      //       ()=> {
      //         expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
      //         expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
      //       }
      //     );
      //     // putting state back to where it was when test section started
      //     await act(
      //       async () => {
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
      //       }
      //     );
  
      //     // ##########################################################################################################
      //     console.log('Add 2 entity definitions then undo one then commit step 6: undo 3 times, show that the extra undo is igored.')
      //     await act(
      //       async () => {
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
      //       }
      //     );
      
      //     await act(()=>user.click(screen.getByRole('button')));
      
      //     // console.log("domainController.currentTransaction()", domainController.currentTransaction());
      //     expect(domainController.currentTransaction().length).toEqual(1);
      //     // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
      //     expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      
      //     await waitFor(
      //       () => {
      //         getAllByText(container,/step:6/)
      //       },
      //     ).then(
      //       ()=> {
      //         expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
      //         expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
      //       }
      //     );
      //     // putting state back to where it was when test section started
      //     await act(
      //       async () => {
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
      //       }
      //     );
  
      //     // ##########################################################################################################
      //     console.log('Add 2 entity definitions then undo one then commit step 7: redo 1 time, show that the extra redo is igored. Commit then see that current transaction has no undo/redo')
      //     await act(
      //       async () => {
      //         await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
      //       }
      //     );
      
      //     await act(()=>user.click(screen.getByRole('button')));
      
      //     // console.log("domainController.currentTransaction()", domainController.currentTransaction());
      //     expect(domainController.currentTransaction().length).toEqual(2);
      //     // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
      //     // expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
      //     expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      //     expect((domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createBookAction.update.modelEntityUpdate);
  
      //     await act(
      //       async () => {
      //         await domainController.handleDomainTransactionalAction(applicationDeploymentLibrary.uuid,{actionName: "commit",actionType:"DomainTransactionalAction"},reduxStore.currentModel(applicationDeploymentLibrary.uuid));
      //       }
      //     );
  
      //     expect(domainController.currentTransaction().length).toEqual(0);
  
      //     await waitFor(
      //       () => {
      //         getAllByText(container,/step:7/)
      //       },
      //     ).then(
      //       ()=> {
      //         expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
      //         expect(getByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy() // Book Entity
      //       }
      //     );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )
  }
)

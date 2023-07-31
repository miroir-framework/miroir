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
  EntityInstance,
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
import reportBookList from "miroir-standalone-app/src/assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import entityDefinitionBook from "miroir-standalone-app/src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionAuthor from "miroir-standalone-app/src/assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import author1 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../src/assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import book1 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import book3 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book4 from "../../src/assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";

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
import { createReduxStoreAndRestClient } from "../../src/miroir-fwk/createReduxStoreAndRestClient";
import { JzodElementFormEditor, JzodElementFormEditorProps } from "../../src/miroir-fwk/4_view/JzodElementFormEditor";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirStoreFileSystemStartup } from "miroir-store-filesystem";
import { miroirStoreIndexedDbStartup } from "miroir-store-indexedDb";
import { miroirStorePostgresStartup } from "miroir-store-postgres";

// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem.json";
import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb.json";
import { JzodAttributeStringValidations } from "@miroir-framework/jzod";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_filesystem-sql.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_sql-indexedDb.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-mixed_indexedDb-sql.json";
// import configFileContents from "miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql.json";

const miroirConfig:MiroirConfig = configFileContents as MiroirConfig;

miroirAppStartup();
miroirCoreStartup();
miroirStoreFileSystemStartup();
miroirStoreIndexedDbStartup();
// miroirStorePostgresStartup();

// let localMiroirStoreController: IStoreController;
// let localAppStoreController: IStoreController;
// let localDataStoreWorker: SetupWorkerApi;
// let localDataStoreServer: SetupServerApi;
// let reduxStore: ReduxStore;
// let localAndRemoteController: LocalAndRemoteControllerInterface;
// let domainController: DomainControllerInterface;
// let miroirContext: MiroirContext;

export interface MiroirIntegrationTestEnvironment {
  localMiroirStoreController: IStoreController,
  localAppStoreController: IStoreController,
  localDataStoreWorker?: SetupWorkerApi,
  localDataStoreServer?: SetupServerApi,
  reduxStore: ReduxStore,
  localAndRemoteController: LocalAndRemoteControllerInterface,
  domainController: DomainControllerInterface,
  miroirContext: MiroirContext,
}

let testEnvironment:MiroirIntegrationTestEnvironment;

export async function miroirIntegrationTestEnvironmentFactory() {
  let result:MiroirIntegrationTestEnvironment = {} as MiroirIntegrationTestEnvironment;

  const wrappedReduxStore = createReduxStoreAndRestClient(
    miroirConfig as MiroirConfig,
    fetch,
  );

  const {
    localMiroirStoreController:a,localAppStoreController:b
  } = await StoreControllerFactory(
    ConfigurationService.storeFactoryRegister,
    miroirConfig,
    // sqlDbStoreControllerFactory,
  );
  result.localMiroirStoreController = a;
  result.localAppStoreController = b;

  // Establish requests interception layer before all tests.
  const wrapped = await miroirBeforeAll(
    miroirConfig as MiroirConfig,
    setupServer,
    result.localMiroirStoreController,
    result.localAppStoreController,
  );

  if (wrappedReduxStore && wrapped) {
    // localMiroirStoreController = wrapped.localMiroirStoreController as IStoreController;
    // localAppStoreController = wrapped.localAppStoreController as IStoreController;
    result.localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
    result.localDataStoreServer = wrapped.localDataStoreServer as SetupServerApi;
    result.reduxStore = wrappedReduxStore.reduxStore;
    result.domainController = wrappedReduxStore.domainController;
    result.miroirContext = wrappedReduxStore.miroirContext;
  }
  return result;
}

beforeAll(
  async () => {
    testEnvironment = await miroirIntegrationTestEnvironmentFactory()
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach(testEnvironment.localMiroirStoreController, testEnvironment.localAppStoreController);
  }
)

afterAll(
  async () => {
    await miroirAfterAll(
      testEnvironment.localMiroirStoreController,
      testEnvironment.localAppStoreController,
      testEnvironment.localDataStoreServer
    );
  }
)

afterEach(
  async () => {
    await miroirAfterEach(testEnvironment.localMiroirStoreController,testEnvironment.localAppStoreController);
  }
)

// ################################################################################################
function JzodObjectFormEditorWrapper(props: JzodElementFormEditorProps) {
  const [result, setResult] = useState(undefined);

  return (
    <div>
    <JzodElementFormEditor
      label={props.label}
      initialValuesObject={props.initialValuesObject}
      currentDeploymentUuid={props.currentDeploymentUuid}
      currentApplicationSection={props.currentApplicationSection}
      showButton={props.showButton}
      jzodSchema={props.jzodSchema}
      // getData={props.getData}
      onSubmit={(data:any,event:any,error:any)=>{console.log("JzodObjectFormEditorWrapper onSubmit!");setResult(data); return props.onSubmit(data,event,error)}}
    ></JzodElementFormEditor>
    {
      result?<div>received result: {JSON.stringify(result)}</div>:<div>no result yet</div>
    }
    </div>
  )
}
describe(
  'JzodObjectFormEditor',
  () => {
    // // ###########################################################################################
    // it(
    //   'edit simpleType string form',
    //   async () => {
    //     try {
    //       console.log('edit string attribute');
    //       const user = userEvent.setup()

    //       const label = 'simpleElementString' 
    //       const {
    //         getByText,
    //         getAllByRole,
    //         container
    //       } = renderWithProviders(
    //         <JzodObjectFormEditorWrapper
    //           label={label}
    //           initialValuesObject={""}
    //           showButton={true}
    //           jzodSchema={{type:"simpleType", definition:"string"}}
    //            getData={()=>undefined}
    //           onSubmit={(data:any,event:any)=>{console.log("onSubmit called", data, event)}}
    //         ></JzodObjectFormEditorWrapper>,
    //         {store:undefined}
    //       );
  
    //       // ##########################################################################################################
    //       const formInput = screen.getByRole('textbox', {name:""})

    //       console.log('selecting input field');
          
    //       await act(()=>user.click(formInput));
    //       await act(()=>user.keyboard('b'));
    //       await act(()=>user.click(screen.getByRole('button', {name:"Submit"})));
          
    //       await act(
    //         async () =>
    //           await waitFor(() => {
    //             getByText(new RegExp(`received result`, "i"));
    //           }).then(() => {
    //             expect(screen.queryByText(new RegExp(`received result: {"${label}":"b"}`, "i"))).toBeTruthy(); // Book entity
    //           })
    //       );
    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )

    // // ###########################################################################################
    // it(
    //   'edit simpleType string form with validation',
    //   async () => {
    //     try {
    //       console.log('edit simpleType string form with validation');
    //       const user = userEvent.setup()

    //       const label = 'simpleElementString' 
    //       const {
    //         getByText,
    //         getAllByRole,
    //         container
    //       } = renderWithProviders(
    //         <JzodObjectFormEditorWrapper
    //           label={label}
    //           initialValuesObject={""}
    //           showButton={true}
    //           currentDeploymentUuid={undefined}
    //           currentApplicationSection="data"
    //           jzodSchema={{type:"simpleType", definition:"string", validations:[{type:"min",parameter:7}]}}
    //           // getData={()=>undefined}
    //           // jzodSchema={{type:"simpleType", definition:"string"}}
    //           onSubmit={(data:any,event:any,error:any)=>{console.log("onSubmit called", data, event,error)}}
    //         ></JzodObjectFormEditorWrapper>,
    //         {store:undefined}
    //       );
  
    //       // ##########################################################################################################
    //       const formInput = screen.getByRole('textbox', {name:""})
    //       await act(async ()=>user.click(formInput));
    //       await act(async ()=>user.keyboard('abcdef'));

    //       try {
    //       await act(async ()=>user.click(screen.getByRole('button', {name:"Submit"})));
    //       } catch (error) {
    //         console.error('caught expected validation error during test',expect.getState().currentTestName,error);
    //       }

    //       await act(
    //         async () =>
    //           await waitFor(() => {
    //             getByText(new RegExp(/(received result)|(received error)/, "i"));
    //           }).then(() => {
    //             // expect(screen.queryByText(new RegExp(`received result: {"${label}":"abcdef"}`, "i"))).toBeFalsy(); // Book entity
    //             expect(screen.queryByText(new RegExp(/received result/, "i"))).toBeNull(); // Book entity
    //             expect(screen.queryByText(new RegExp(/received error: String must contain at least 7 character\(s\)/, "i"))).toBeTruthy(); // Book entity
    //           })
    //       );

    //     } catch (error) {
    //       console.error('error during test',expect.getState().currentTestName,error);
    //       expect(false).toBeTruthy();
    //     }
    //   }
    // )

    // ###########################################################################################
    it(
      'edit simpleType uuid string as foreign key',
      async () => {
        try {
          console.log(expect.getState().currentTestName);
          const user = userEvent.setup()
          await testEnvironment.localAppStoreController.createEntity(entityAuthor as MetaEntity, entityDefinitionAuthor as EntityDefinition);
          await testEnvironment.localAppStoreController.createEntity(entityBook as MetaEntity, entityDefinitionBook as EntityDefinition);
          await testEnvironment.localAppStoreController?.upsertInstance('model', reportBookList as EntityInstance);
          await testEnvironment.localAppStoreController?.upsertInstance('data', author1 as EntityInstance);
          await testEnvironment.localAppStoreController?.upsertInstance('data', author2 as EntityInstance);
          await testEnvironment.localAppStoreController?.upsertInstance('data', author3 as EntityInstance);
          await testEnvironment.localAppStoreController?.upsertInstance('data', book1 as EntityInstance);
          await testEnvironment.localAppStoreController?.upsertInstance('data', book2 as EntityInstance);
          await testEnvironment.localAppStoreController?.upsertInstance('data', book3 as EntityInstance);
          await testEnvironment.localAppStoreController?.upsertInstance('data', book4 as EntityInstance);


          const label = 'simpleElementString' 
          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <JzodObjectFormEditorWrapper
              label={label}
              initialValuesObject={""}
              showButton={true}
              currentDeploymentUuid={applicationDeploymentLibrary.uuid}
              currentApplicationSection="data"
              jzodSchema={{type:"simpleType", definition:"uuid", extra:{targetEntity:entityAuthor.uuid}}}
              // jzodSchema={{type:"simpleType", definition:"string"}}
              onSubmit={(data:any,event:any,error:any)=>{console.log("onSubmit called", data, event,error)}}
            ></JzodObjectFormEditorWrapper>,
            {store:testEnvironment.reduxStore.getInnerStore()}
          );
  
          await act(
            async () => {
              await testEnvironment.domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
              await testEnvironment.domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );

          // ##########################################################################################################
          const formInput = screen.getByRole('combobox', {name:""})
          await act(async ()=>user.click(formInput));
          await act(async ()=>user.keyboard('{ArrowDown}'));
          await act(async ()=>user.keyboard('{Enter}'));

          try {
          await act(async ()=>user.click(screen.getByRole('button', {name:"Submit"})));
          } catch (error) {
            console.error('caught expected validation error during test',expect.getState().currentTestName,error);
          }

          await act(
            async () =>
              await waitFor(() => {
                getByText(new RegExp(/(received result)|(received error)/, "i"));
              }).then(() => {
                expect(screen.queryByText(new RegExp(`received result: { value: 'ce7b601d-be5f-4bc6-a5af-14091594046a', label: 'Paul Veyne' }`, "i"))).toBeFalsy(); // Book entity
                // expect(screen.queryByText(new RegExp(/received result/, "i"))).toBeNull(); // Book entity
                // expect(screen.queryByText(new RegExp(/received error: String must contain at least 7 character\(s\)/, "i"))).toBeTruthy(); // Book entity
                expect(screen.queryByText(new RegExp(/received error/, "i"))).toBeNull(); // Book entity
              })
          );

        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )
  }
)

/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "http://localhost/"}
 */
import { act, getAllByText, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupServerApi, setupServer } from "msw/node";
import React from "react";

const fetch = require('node-fetch');


import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder


import {
  DataStoreInterface,
  DomainAction,
  DomainControllerInterface,
  EntityInstance,
  LocalAndRemoteControllerInterface,
  MiroirConfig,
  MiroirContext,
  circularReplacer,
  entityDefinitionEntityDefinition,
  entityModelVersion,
  entityReport,
  entityStoreBasedConfiguration,
  instanceConfigurationReference,
  instanceModelVersionInitial,
  miroirCoreStartup,
  reportEntityList,
  reportReportList
} from "miroir-core";
import {
  ReduxStore
} from "miroir-redux";

import entityAuthor from "miroir-standalone-app/src/assets/entities/Author.json";
import entityBook from "miroir-standalone-app/src/assets/entities/Book.json";
import { createMswStore } from "miroir-standalone-app/src/miroir-fwk/createStore";
import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import { DisplayLoadingInfo, renderWithProviders } from "miroir-standalone-app/tests/utils/tests-utils";
import { SetupWorkerApi } from "msw";
import config from "miroir-standalone-app/tests/miroirConfig.test.json"


miroirAppStartup();
miroirCoreStartup();

let localDataStore: DataStoreInterface;
let localDataStoreWorker: SetupWorkerApi;
let localDataStoreServer: SetupServerApi;
let reduxStore: ReduxStore;
let localAndRemoteController: LocalAndRemoteControllerInterface;
let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;

beforeAll(
  async () => {
    // Establish requests interception layer before all tests.

    try {
      const wrapped = await createMswStore(
        config as MiroirConfig,
        'nodejs',
        fetch,
        setupServer
      );

      localDataStore = wrapped.localDataStore as DataStoreInterface;
      localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
      localDataStoreServer = wrapped.localDataStoreServer as SetupServerApi;
      reduxStore = wrapped.reduxStore;
      domainController = wrapped.domainController;
      miroirContext = wrapped.miroirContext;
  
      localDataStoreServer?.listen();
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.open',JSON.stringify(localDataStore, circularReplacer()));
      await localDataStore.open();
    } catch (error) {
      console.error('Error beforeAll',error);
    }
    console.log('Done beforeAll');
  }
)

beforeEach(
  async () => {
    // Establish requests interception layer before all tests.
    // localDataStoreServer?.listen();
    try {
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.init');
      await localDataStore.init();
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.clear');
      await localDataStore.clear();
    } catch (error) {
      console.error('beforeEach',error);
    }
    console.log('Done beforeEach');
  }
)

afterAll(
  async () => {
    try {
      localDataStoreServer?.close();
      localDataStore.close();
    } catch (error) {
      console.error('Error afterAll',error);
    }
    console.log('Done afterAll');
  }
)

afterEach(
  async () => {
    try {
      // await localDataStore?.close();
      console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ localDataStore.clear');
      await localDataStore.clear();
    } catch (error) {
      console.error('Error afterEach',error);
    }
    console.log('Done afterEach');
  }
)

describe(
  'DomainController.Model.undo-redo',
  () => {
    // ###########################################################################################
    it(
      'Add 2 entity definitions then undo one then commit',
      async () => {
        try {
          
          console.log('Add 2 entity definitions then undo one then commit start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()
  
          await localDataStore?.upsertInstanceUuid(entityDefinitionEntityDefinition.entityUuid, entityDefinitionEntityDefinition as EntityInstance);
          await localDataStore?.upsertInstanceUuid(entityReport.entityUuid, entityReport as EntityInstance);
          await localDataStore?.upsertInstanceUuid(entityStoreBasedConfiguration.entityUuid, entityStoreBasedConfiguration as EntityInstance);
          await localDataStore?.upsertInstanceUuid(entityModelVersion.entityUuid, entityModelVersion as EntityInstance);
          await localDataStore?.upsertInstanceUuid(reportEntityList.entityUuid, reportEntityList as EntityInstance);
          await localDataStore?.upsertInstanceUuid(reportReportList.entityUuid, reportReportList as EntityInstance);
          await localDataStore?.upsertInstanceUuid(instanceModelVersionInitial.entityUuid, instanceModelVersionInitial as EntityInstance);
          await localDataStore?.upsertInstanceUuid(instanceConfigurationReference.entityUuid, instanceConfigurationReference as EntityInstance);
  
          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityDefinitionEntityDefinition.entityName}
              entityUuid={entityDefinitionEntityDefinition.entityUuid}
              DisplayLoadingInfo={displayLoadingInfo}
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 1: loading initial configuration, entities must be absent from report list.')
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
              expect(screen.queryByText(/797dd185-0155-43fd-b23f-f6d0af8cae06/i)).toBeNull() // Book entity
              expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeNull() // Author entity
              // expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 2: adding entities, they must then be present in the local cache Entity list.')
          const createAuthorAction: DomainAction = {
            actionType: 'DomainModelAction',
            actionName:'UpdateMetaModelInstance',
            update: {
              updateActionType:"ModelCUDUpdate",
              updateActionName: 'create',
              objects: [
                {
                  entity:entityAuthor.entityName,entityUuid:entityAuthor.entityUuid,
                  instances:[entityAuthor as EntityInstance]
                }
              ]
            }
          };
          const createBookAction: DomainAction = {
            actionType: 'DomainModelAction',
            actionName:'UpdateMetaModelInstance',
            update: {
              updateActionType:"ModelCUDUpdate",
              updateActionName: 'create',
              objects: [
                {
                  entity:entityBook.entityName,entityUuid:entityBook.entityUuid,
                  instances:[entityBook as EntityInstance]
                }
              ]
            }
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
              await domainController.handleDomainAction({actionName: "undo", actionType: 'DomainModelAction'});
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
              await domainController.handleDomainAction({actionName: "redo", actionType: 'DomainModelAction'});
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
              await domainController.handleDomainAction({actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction({actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction({actionName: "redo", actionType: 'DomainModelAction'});
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
              await domainController.handleDomainAction({actionName: "redo", actionType: 'DomainModelAction'});
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 6: undo 3 times, show that the extra undo is igored.')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction({actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction({actionName: "undo", actionType: 'DomainModelAction'});
              await domainController.handleDomainAction({actionName: "redo", actionType: 'DomainModelAction'});
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
              await domainController.handleDomainAction({actionName: "redo", actionType: 'DomainModelAction'});
            }
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 7: redo 1 time, show that the extra redo is igored. Commit then see that current transaction has no undo/redo')
          await act(
            async () => {
              await domainController.handleDomainAction({actionName: "redo", actionType: 'DomainModelAction'});
            }
          );
      
          await user.click(screen.getByRole('button'))
      
          // console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
  
          await act(
            async () => {
              await domainController.handleDomainModelAction({actionName: "commit",actionType:"DomainModelAction"},reduxStore.currentModel());
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
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )
  }
)

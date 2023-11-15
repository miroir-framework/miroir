import { act, getAllByText, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupWorkerApi } from "msw/browser";
import { setupServer } from "msw/node";
import React from "react";

import {
  ConfigurationService,
  DomainAction,
  DomainControllerInterface,
  EntityDefinition,
  IStoreController,
  LocalAndRemoteControllerInterface,
  LoggerFactoryInterface,
  LoggerInterface,
  MetaEntity,
  MiroirConfig,
  MiroirContext,
  MiroirLoggerFactory,
  SpecificLoggerOptionsMap,
  StoreControllerFactory,
  WrappedTransactionalEntityUpdateWithCUDUpdate,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultLevels,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityEntity,
  entityReport,
  getLoggerName,
  miroirCoreStartup
} from "miroir-core";
import { createReduxStoreAndRestClient, ReduxStore } from "miroir-localcache-redux";

import { TestUtilsTableComponent } from "miroir-standalone-app/tests/utils/TestUtilsTableComponent";
import {
  DisplayLoadingInfo,
  miroirAfterAll,
  miroirAfterEach,
  miroirBeforeAll,
  miroirBeforeEach,
  renderWithProviders
} from "miroir-standalone-app/tests/utils/tests-utils";

import { miroirAppStartup } from "miroir-standalone-app/src/startup";
import { miroirStoreFileSystemStartup } from "miroir-store-filesystem";
import { miroirStoreIndexedDbStartup } from "miroir-store-indexedDb";
import { miroirStorePostgresStartup } from "miroir-store-postgres";
import { loadConfigFile } from "./DomainController.Data.CRUD.functions";

import { loglevelnext } from '../../src/loglevelnextImporter';
import { packageName } from "../../src/constants";
import { cleanLevel } from "./constants";

const specificLoggerOptions: SpecificLoggerOptionsMap = {
  // "5_miroir-core_DomainController": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) BBBBB-"},
  // "5_miroir-core_DomainController": {level:defaultLevels.TRACE},
  // "4_miroir-redux_LocalCacheSlice": {level:defaultLevels.INFO, template:"[{{time}}] {{level}} ({{name}}) CCCCC-"},
  // "4_miroir-redux_LocalCacheSlice": {level:undefined, template:undefined}
  // "4_miroir-redux_LocalCacheSlice": {template:"[{{time}}] {{level}} ({{name}}) -"},
}

MiroirLoggerFactory.setEffectiveLoggerFactory(
  loglevelnext,
  defaultLevels.INFO,
  "[{{time}}] {{level}} ({{name}})# ",
  specificLoggerOptions
);

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController.Model.undo-redo");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

log.log("@@@@@@@@@@@@@@@@@@ env", process.env["PWD"]);
log.log("@@@@@@@@@@@@@@@@@@ env", process.env["npm_config_env"]);
const miroirConfig:MiroirConfig = await loadConfigFile(process.env["PWD"]??"",process.env["npm_config_env"]??"");

log.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);


miroirAppStartup();
miroirCoreStartup();
miroirStoreFileSystemStartup();
miroirStoreIndexedDbStartup();
miroirStorePostgresStartup();

let localMiroirStoreController: IStoreController;
let localAppStoreController: IStoreController;
let localDataStoreServer: any /**SetupServerApi | undefined */;
let localDataStoreWorker: SetupWorkerApi | undefined;
let reduxStore: ReduxStore;
let localAndRemoteController: LocalAndRemoteControllerInterface;
let domainController: DomainControllerInterface;
let miroirContext: MiroirContext;

beforeAll(
  async () => {
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
    localMiroirStoreController = a;
    localAppStoreController = b;

    // Establish requests interception layer before all tests.
    const wrapped = await miroirBeforeAll(
      miroirConfig as MiroirConfig,
      setupServer,
      localMiroirStoreController,
      localAppStoreController,
    );

    if (wrappedReduxStore && wrapped) {
      // localMiroirStoreController = wrapped.localMiroirStoreController as IStoreController;
      // localAppStoreController = wrapped.localAppStoreController as IStoreController;
      localDataStoreWorker = wrapped.localDataStoreWorker as SetupWorkerApi;
      localDataStoreServer = wrapped.localDataStoreServer /*as SetupServerApi*/;
      reduxStore = wrappedReduxStore.reduxStore;
      domainController = wrappedReduxStore.domainController;
      miroirContext = wrappedReduxStore.miroirContext;
    }
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach(miroirConfig, domainController,localMiroirStoreController,localAppStoreController);
  }
)

afterAll(
  async () => {
    await miroirAfterAll(miroirConfig, localMiroirStoreController,localAppStoreController,localDataStoreServer);
  }
)

afterEach(
  async () => {
    await miroirAfterEach(miroirConfig, localMiroirStoreController,localAppStoreController);
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
          
          log.log('Add 2 entity definitions then undo one then commit start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = userEvent.setup()

          // await localDataStore.clear();
          // await localDataStore.initModel();

          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityEntity.name}
              entityUuid={entityEntity.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={applicationDeploymentLibrary.uuid}
              instancesApplicationSection="model"
            />,
            {store:reduxStore.getInnerStore(),}
          );
  
          // ##########################################################################################################
          log.log('Add 2 entity definitions then undo one then commit step 1: loading initial configuration, entities must be absent from entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentMiroir.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionType:"DomainTransactionalAction",actionName: "rollback"});
            }
          );

          await act(()=>user.click(screen.getByRole('button')));
 
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() // Author entity
              // expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          log.log('Add 2 entity definitions then undo one then commit step 2: adding entities, they must then be present in the local cache Entity list.')
          const createAuthorAction: DomainAction = {
            actionType:"DomainTransactionalAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedTransactionalEntityUpdate",
              modelEntityUpdate: {
                updateActionType: "ModelEntityUpdate",
                updateActionName: "createEntity",
                entities: [
                  {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
                ],
              },
            }
          };
          const createBookAction: DomainAction = {
            actionType:"DomainTransactionalAction",
            actionName: "updateEntity",
            update: {
              updateActionName:"WrappedTransactionalEntityUpdate",
              modelEntityUpdate: {
                updateActionType: "ModelEntityUpdate",
                updateActionName: "createEntity",
                entities: [
                  {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
                ],
              },
            }
          };
  
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,createAuthorAction,reduxStore.currentModel(applicationDeploymentLibrary.uuid));
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,createBookAction,reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          // log.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          // expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
          expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
          expect((domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createBookAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              // getAllByText(container,/finished/)
              getAllByText(container,/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy();
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy();
            }
          );
  
          // ##########################################################################################################
          log.log('Add 2 entity definitions then undo one then commit step 3: undo 1 Entity creation, one Entity must still be present in the entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          // log.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              getAllByText(container,/step:3/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
            }
          );

          // ##########################################################################################################
          log.log('Add 2 entity definitions then undo one then commit step 4: redo 1 Entity creation, two Entities must be present in the entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          log.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          // expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
          expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
          expect((domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createBookAction.update.modelEntityUpdate);
  
          await waitFor(
            () => {
              getAllByText(container,/step:4/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(getByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy() // Book Entity
            }
          );
  
          // ##########################################################################################################
          log.log('Add 2 entity definitions then undo one then commit step 5: undo 2 then redo 1 Entity creation, one Entity must be present in the entity list.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
            }
          );
      
          await act(()=>user.click(screen.getByRole('button')));
      
          // log.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      
          await waitFor(
            () => {
              getAllByText(container,/step:5/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
            }
          );
          // putting state back to where it was when test section started
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
            }
          );
  
          // ##########################################################################################################
          log.log('Add 2 entity definitions then undo one then commit step 6: undo 3 times, show that the extra undo is igored.')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "undo", actionType: 'DomainTransactionalAction'});
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
            }
          );
      
          await act(()=>user.click(screen.getByRole('button')));
      
          // log.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(1);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
      
          await waitFor(
            () => {
              getAllByText(container,/step:6/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
            }
          );
          // putting state back to where it was when test section started
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
            }
          );
  
          // ##########################################################################################################
          log.log('Add 2 entity definitions then undo one then commit step 7: redo 1 time, show that the extra redo is igored. Commit then see that current transaction has no undo/redo')
          await act(
            async () => {
              await domainController.handleDomainAction(applicationDeploymentLibrary.uuid,{actionName: "redo", actionType: 'DomainTransactionalAction'});
            }
          );
      
          await act(()=>user.click(screen.getByRole('button')));
      
          // log.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(2);
          // expect(domainController.currentTransaction()[0]).toEqual(createAuthorAction);
          // expect(domainController.currentTransaction()[1]).toEqual(createBookAction);
          expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
          expect((domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createBookAction.update.modelEntityUpdate);
  
          await act(
            async () => {
              await domainController.handleDomainTransactionalAction(applicationDeploymentLibrary.uuid,{actionName: "commit",actionType:"DomainTransactionalAction"},reduxStore.currentModel(applicationDeploymentLibrary.uuid));
            }
          );
  
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByText(container,/step:7/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
              expect(getByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy() // Book Entity
            }
          );
        } catch (error) {
          log.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )
  }
)

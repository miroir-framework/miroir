import React from "react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect } from 'vitest';

import {
  ConfigurationService,
  DomainAction,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  LocalCacheInterface,
  LoggerInterface,
  LoggerOptions,
  MiroirActivityTracker,
  MiroirContextInterface,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  StoreUnitConfiguration,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  entityDefinitionEntity,
  entityEntity,
  entityReport,
  miroirCoreStartup,
  resetLibraryPlayfield,
  selfApplicationMiroir,
  type ApplicationDeploymentMap,
  type Deployment
} from "miroir-core";

import {
  deployment_Library_DO_NO_USE,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  selfApplicationLibrary,
} from "miroir-test-app_deployment-library";

import {
  DisplayLoadingInfo,
  renderWithProviders,
  selfApplicationDeploymentConfigurations,
} from "../../src/miroir-fwk/4-tests/tests-utils";
import { TestUtilsTableComponent } from "../utils/TestUtilsTableComponent";

import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";
import { miroirAppStartup } from "../../src/startup.js";

import {
  deployment_Admin,
  deployment_Miroir,
} from "miroir-test-app_deployment-admin";
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { loadTestConfigFiles } from "../utils/fileTools.js";
import { cleanLevel, packageName } from "./constants.js";
import { DomainControllerIntegrationTestSession } from "../helpers/DomainControllerIntegrationTestSession.js";


const env:any = process.env

const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
const fileName = "DomainController.React.Model.test";
myConsoleLog(fileName, "received env", JSON.stringify(env, null, 2));

let miroirConfig:any;
let loggerOptions:LoggerOptions;
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName)
).then((logger: LoggerInterface) => {log = logger});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup(ConfigurationService.configurationService);
miroirIndexedDbStoreSectionStartup(ConfigurationService.configurationService);
miroirPostgresStoreSectionStartup(ConfigurationService.configurationService);
ConfigurationService.configurationService.registerTestImplementation({expect: expect as any});

const {miroirConfig: miroirConfigParam, logConfig} = await loadTestConfigFiles(env)
miroirConfig = miroirConfigParam;
loggerOptions = logConfig;
myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog(
  "received miroirConfig.client",
  JSON.stringify(miroirConfig.client, null, 2)
);
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  loggerOptions,
);
myConsoleLog("started registered loggers DONE");

const applicationDeploymentMap: ApplicationDeploymentMap = {
  ...defaultSelfApplicationDeploymentMap,
  [selfApplicationLibrary.uuid]: deployment_Library_DO_NO_USE.uuid,
}

const miroirtDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Miroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Miroir.uuid];
const adminDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[deployment_Admin.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[deployment_Admin.uuid];

const testApplicationDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

  const adminDeployment: Deployment = {
  ...deployment_Admin,
  configuration: adminDeploymentStorageConfiguration,
};

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
// let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;
let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
// let miroirContext: MiroirContextInterface;

beforeAll(
  async () => {
    const session = new DomainControllerIntegrationTestSession(
      miroirConfig,
      {
        applicationDeploymentMap,
        adminDeployment,
        miroirDeploymentStorageConfiguration: miroirtDeploymentStorageConfiguration,
        libraryDeploymentStorageConfiguration,
      },
      "miroirAndLibrary",
    );
    const executionEnvironment = await session.initSession();
    domainController = executionEnvironment.domainController;
  }
)

beforeEach(
  async () => {
    await resetLibraryPlayfield({
      domainController,
      applicationDeploymentMap,
      libraryDeploymentUuid: deployment_Library_DO_NO_USE.uuid,
      librarySelfApplicationUuid: selfApplicationLibrary.uuid,
      deploymentsToReset: selfApplicationDeploymentConfigurations,
    });
    document.body.innerHTML = '';
  }
)

// afterAll(
//   async () => {
//     await deleteAndCloseApplicationDeployments(
//       miroirConfig,
//       domainController,
//       applicationDeploymentMap,
//       adminApplicationDeploymentConfigurations,
//     );
//   }
// )

// afterEach(
//   async () => {
//     await resetApplicationDeployments(
//       deploymentConfigurations,
//       applicationDeploymentMap,
//       domainController,
//       localCache,
//     );
//   }
// )

describe.sequential(
  'DomainController.Model.undo-redo.React',
  () => {
    // ###########################################################################################
    it(
      'Add 2 entity definitions then undo one then commit',
      async () => {
        try {
          
          console.log('Add 2 entity definitions then undo one then commit start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityReport.name}/>
          const user = (userEvent as any).setup()

          // await localDataStore.clear();
          // await localDataStore.initModel();

          const {
            getByText,
            getAllByRole,
            container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entity={entityEntity as Entity}
              entityDefinition={entityDefinitionEntity as EntityDefinition}
              DisplayLoadingInfo={displayLoadingInfo}
              application={selfApplicationLibrary.uuid}
              applicationDeploymentMap={applicationDeploymentMap}
              instancesApplicationSection="model"
            />,
            {store:domainController.getLocalCache().getInnerStore(),}
          );
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 1: loading initial configuration, entities must be absent from entity list.')
          {
            await act(
              async () => {
                await domainController.handleAction(
                  {
                    actionType: "rollback",
                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    payload: {
                      application: selfApplicationMiroir.uuid,
                    },
                  },
                  applicationDeploymentMap,
                  defaultMiroirModelEnvironment,
                );
                await domainController.handleAction(
                  {
                    actionType: "rollback",
                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                    },
                  },
                  applicationDeploymentMap,
                  defaultMiroirModelEnvironment
                );
              }
            );
  
            await act(()=>user.click(screen.getByRole('button')));
   
            await waitFor(
              () => {
                // getAllByRole(/step:1/)
                getAllByRole("step:1")
              },
            ).then(
              ()=> {
                // screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
                expect(screen.queryByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeNull() // Book entity
                expect(screen.queryByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeNull() // Author entity
                // expect(screen.queryByText(/b30b7180-f7dc-4cca-b4e8-e476b77fe61d/i)).toBeTruthy() // Report List
              }
            );
          }
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 2: adding entities, they must then be present in the local cache Entity list.')
          const createAuthorAction: DomainAction = {
            actionType: "createEntity",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: selfApplicationLibrary.uuid,
              entities: [
                {
                  entity: entityAuthor as Entity,
                  entityDefinition: entityDefinitionAuthor as EntityDefinition,
                },
              ],
            },
          };
          const createBookAction: DomainAction = {
            actionType: "createEntity",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: selfApplicationLibrary.uuid,
              entities: [
                {
                  entity: entityBook as Entity,
                  entityDefinition: entityDefinitionBook as EntityDefinition,
                },
              ],
            },
          };

          {
            await act(
              async () => {
                await domainController.handleAction(
                  createAuthorAction,
                  applicationDeploymentMap,
                  defaultMiroirModelEnvironment
                );
                await domainController.handleAction(
                  createBookAction,
                  applicationDeploymentMap,
                  defaultMiroirModelEnvironment
                );
              }
            );
    
            await act(()=>user.click(screen.getByRole('button')));
    
            const transaction = domainController.currentTransaction();
            console.log(
              "domainController.currentTransaction()",
              JSON.stringify(transaction, null, 2),
            );
            expect(transaction.length).toEqual(2);
            expect(transaction[0]).toEqual(createAuthorAction);
            expect(transaction[1]).toEqual(createBookAction);
            // transaction contents comparison depends on implementation
            // expect(
            //   (domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate)
            //     .modelEntityUpdate
            // ).toEqual(createAuthorAction.update.modelEntityUpdate);
            // expect(
            //   (domainController.currentTransaction()[1].update as WrappedTransactionalEntityUpdateWithCUDUpdate)
            //     .modelEntityUpdate
            // ).toEqual(createBookAction.update.modelEntityUpdate);
    
            // do not use UI to determine transaction contents
            await waitFor(
              () => {
                getAllByRole("step:2")
              },
            ).then(
              ()=> {
                screen.debug(undefined, Infinity); // Prints entire DOM with no size limit
                expect(screen.queryByText(new RegExp(`"${entityAuthor.uuid}"`,'i'))).toBeTruthy();
                expect(screen.queryByText(new RegExp(`"${entityBook.uuid}"`,'i'))).toBeTruthy();
              }
            );
          }
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 3: undo 1 Entity creation, one Entity must still be present in the entity list.')
          {
            await act(
              async () => {
                await domainController.handleAction({
                  actionType: "undo",
                  endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                  payload: {
                    application: selfApplicationLibrary.uuid,
                    // deploymentUuid:deployment_Library_DO_NO_USE.uuid,
                  }
                }, applicationDeploymentMap,  defaultMiroirModelEnvironment);
              }
            );
    
            await act(()=>user.click(screen.getByRole('button')));
    
            const transaction = domainController.currentTransaction();
            console.log("domainController.currentTransaction()", JSON.stringify(transaction, null, 2));
            expect(transaction.length).toEqual(1);
            expect(transaction[0]).toEqual(createAuthorAction);
            // console.log("domainController.currentTransaction()", domainController.currentTransaction());
    
            await waitFor(
              () => {
                // getAllByRole(/step:3/)
                getAllByRole("step:3")
              },
            ).then(
              ()=> {
                expect(getByText(new RegExp(`"${entityAuthor.uuid}"`,'i'))).toBeTruthy() // Author Entity
                expect(screen.queryByText(new RegExp(`"${entityBook.uuid}"`,'i'))).toBeNull() // Book entity
              }
            );
          }

          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 4: redo 1 Entity creation, two Entities must be present in the entity list.')
          {
            await act(
              async () => {
                await domainController.handleAction(
                  {
                    actionType: "redo",
                    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                    }
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
              }
            );
    
            await act(()=>user.click(screen.getByRole('button')));
    
            const transaction = domainController.currentTransaction();
            console.log("domainController.currentTransaction()", JSON.stringify(transaction, null, 2));
            expect(transaction.length).toEqual(2);
            expect(transaction[0]).toEqual(createAuthorAction);
            expect(transaction[1]).toEqual(createBookAction);
    
            await waitFor(
              () => {
                // getAllByRole(/step:4/)
                getAllByRole("step:4")
              },
            ).then(
              ()=> {
                expect(getByText(new RegExp(`"${entityAuthor.uuid}"`,'i'))).toBeTruthy() // Author Entity
                expect(getByText(new RegExp(`"${entityBook.uuid}"`,'i'))).toBeTruthy() // Book Entity
              }
            );
          }
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 5: undo 2 then redo 1 Entity creation, one Entity must be present in the entity list.')
          {

            await act(
              async () => {
                await domainController.handleAction(
                  {
                    actionType: "undo",
                    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                    }
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
                await domainController.handleAction({
                  actionType: "undo",
                  endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                  payload: {
                    application: selfApplicationLibrary.uuid,
                  }
                }, applicationDeploymentMap, defaultMiroirModelEnvironment);
                await domainController.handleAction({
                  actionType: "redo",
                  endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                  payload: {
                    application: selfApplicationLibrary.uuid,
                  }
                }, applicationDeploymentMap, defaultMiroirModelEnvironment);
              }
            );
        
            await act(()=>user.click(screen.getByRole('button')));
        
            // console.log("domainController.currentTransaction()", domainController.currentTransaction());
            const transaction = domainController.currentTransaction();
            console.log("domainController.currentTransaction()", JSON.stringify(transaction, null, 2));
            expect(transaction.length).toEqual(1);
            expect(transaction[0]).toEqual(createAuthorAction);
            // transaction contents comparison depends on implementation
            // expect((domainController.currentTransaction()[0].update as WrappedTransactionalEntityUpdateWithCUDUpdate).modelEntityUpdate).toEqual(createAuthorAction.update.modelEntityUpdate);
        
            await waitFor(
              () => {
                // getAllByRole(/step:5/)
                getAllByRole("step:5")
              },
            ).then(
              ()=> {
                expect(getByText(new RegExp(`"${entityAuthor.uuid}"`,'i'))).toBeTruthy() // Author Entity
                expect(screen.queryByText(new RegExp(`"${entityBook.uuid}"`,'i'))).toBeNull() // Book entity
              }
            );
            // putting state back to where it was when test section started
            await act(
              async () => {
                await domainController.handleAction(
                  {
                    actionType: "redo",
                    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                      // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                    }
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
              }
            );
          }
  
          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 6: undo 3 times, show that the extra undo is igored.')
          {

            await act(
              async () => {
                await domainController.handleAction(
                  {
                    actionType: "undo",
                    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                      // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                    }
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
                await domainController.handleAction(
                  {
                    actionType: "undo",
                    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                      // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                    }
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
                await domainController.handleAction(
                  {
                    actionType: "undo",
                    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                      // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                    }
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
                await domainController.handleAction(
                  {
                    actionType: "redo",
                    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                      // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                    }
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
              }
            );
        
            await act(()=>user.click(screen.getByRole('button')));
        
            const transaction = domainController.currentTransaction();
            // console.log("domainController.currentTransaction()", domainController.currentTransaction());
            expect(transaction.length).toEqual(1);
            expect(transaction[0]).toEqual(createAuthorAction);
        
            await waitFor(
              () => {
                // getAllByRole(/step:6/)
                getAllByRole("step:6")
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
                await domainController.handleAction(
                  {
                    actionType: "redo",
                    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                    }
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
              }
            );
          }

          // ##########################################################################################################
          console.log('Add 2 entity definitions then undo one then commit step 7: redo 1 time, show that the extra redo is igored. Commit then see that current transaction has no undo/redo')
          {

            await act(
              async () => {
                await domainController.handleAction(
                  {
                    actionType: "redo",
                    endpoint: "71c04f8e-c687-4ea7-9a19-bc98d796c389",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                      // deploymentUuid: deployment_Library_DO_NO_USE.uuid,
                    }
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
              }
            );
        
            await act(()=>user.click(screen.getByRole('button')));
        
            // console.log("domainController.currentTransaction()", domainController.currentTransaction());
            const transaction = domainController.currentTransaction();
            expect(transaction.length).toEqual(2);
            expect(transaction[0]).toEqual(createAuthorAction);
            expect(transaction[1]).toEqual(createBookAction);
  
            await act(
              async () => {
                await domainController.handleAction(
                  {
                    actionType: "commit",
                    endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                    payload: {
                      application: selfApplicationLibrary.uuid,
                    },
                  },
                  applicationDeploymentMap,  defaultMiroirModelEnvironment
                );
              }
            );
    
            expect(domainController.currentTransaction().length).toEqual(0);
    
            await waitFor(
              () => {
                getAllByRole("step:7")
              },
            ).then(
              ()=> {
                expect(getByText(new RegExp(`${entityAuthor.uuid}`,'i'))).toBeTruthy() // Author Entity
                expect(getByText(new RegExp(`${entityBook.uuid}`,'i'))).toBeTruthy() // Book Entity
              }
            );
          }
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )
  }
)

import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect } from 'vitest';

// import process from "process";

import {
  ActionReturnType,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  CompositeAction,
  defaultLevels,
  defaultMiroirMetaModel,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  EntityInstance,
  entityPublisher,
  getLoggerName,
  InstanceAction,
  LoggerInterface,
  MetaEntity,
  MiroirConfigClient,
  MiroirContextInterface,
  miroirCoreStartup,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  publisher1,
  publisher2,
  publisher3,
  selfApplicationDeploymentLibrary,
  selfApplicationMiroir,
  selfApplicationModelBranchMiroirMasterBranch,
  selfApplicationStoreBasedConfigurationMiroir,
  selfApplicationVersionInitialMiroirVersion
} from "miroir-core";

import {
  createLibraryDeploymentDEFUNCT,
  deploymentConfigurations,
  DisplayLoadingInfo,
  loadTestConfigFiles,
  deleteAndCloseApplicationDeployments,
  resetApplicationDeployments,
  createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT,
  miroirBeforeEach_resetAndInitApplicationDeployments,
  renderWithProviders,
  setupMiroirTest
} from "../utils/tests-utils.js"



import { miroirAppStartup } from "../../src/startup.js";
import { miroirFileSystemStoreSectionStartup } from "miroir-store-filesystem";
import { miroirIndexedDbStoreSectionStartup } from "miroir-store-indexedDb";
import { miroirPostgresStoreSectionStartup } from "miroir-store-postgres";

import { LocalCache } from "miroir-localcache-redux";
import { TestUtilsTableComponent } from "../utils/TestUtilsTableComponent.js";

import { loglevelnext } from '../../src/loglevelnextImporter.js';
import { packageName } from "../../src/constants.js";
import { cleanLevel } from "./constants.js";


// jest intercepts logs, only console.log will produce test output
// const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController.Data.CRUD.React");
// let log:LoggerInterface = console as any as LoggerInterface;
// MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
//   (value: LoggerInterface) => {
//     log = value;
//   }
// );


const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);

MiroirLoggerFactory.setEffectiveLoggerFactory(
  loglevelnext,
  (defaultLevels as any)[loggerOptions.defaultLevel],
  loggerOptions.defaultTemplate,
  loggerOptions.specificLoggerOptions
);

const loggerName: string = getLoggerName(packageName, cleanLevel,"DomainController.Data.CRUD.React");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then(
  (value: LoggerInterface) => {
    log = value;
  }
);

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();


let domainController: DomainControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let localCache: LocalCache;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContextInterface;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface;

beforeAll(
  async () => {
    // Establish requests interception layer before all tests.
    const {
      persistenceStoreControllerManager: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      localCache: locallocalCache,
      miroirContext: localmiroirContext,
    } = await setupMiroirTest(miroirConfig);

    persistenceStoreControllerManager = localpersistenceStoreControllerManager;
    domainController = localdomainController;
    localCache = locallocalCache;
    miroirContext = localmiroirContext;

    const wrapped = await createMiroirDeploymentGetPersistenceStoreControllerDEFUNCT(
      miroirConfig as MiroirConfigClient,
      // setupServer,
      persistenceStoreControllerManager,
      domainController,
    );
    if (wrapped) {
      if (wrapped.localMiroirPersistenceStoreController && wrapped.localAppPersistenceStoreController) {
        localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
        localAppPersistenceStoreController = wrapped.localAppPersistenceStoreController;
      }
    } else {
      throw new Error("beforeAll failed initialization!");
    }
    await createLibraryDeploymentDEFUNCT(
      miroirConfig,
      domainController
    )

    return Promise.resolve();
  }
)

beforeEach(
  async () => {
    await miroirBeforeEach_resetAndInitApplicationDeployments(
      miroirConfig,
      domainController,
      deploymentConfigurations,
    );
    const libraryEntitesAndInstances = [
      {
        entity: entityAuthor as MetaEntity,
        entityDefinition: entityDefinitionAuthor as EntityDefinition,
        instances: [
          author1,
          author2,
          author3 as EntityInstance,
        ]
      },
      {
        entity: entityBook as MetaEntity,
        entityDefinition: entityDefinitionBook as EntityDefinition,
        instances: [
          book1 as EntityInstance,
          book2 as EntityInstance,
          // book3 as EntityInstance,
          book4 as EntityInstance,
          book5 as EntityInstance,
          book6 as EntityInstance,
        ]
      },
      {
        entity: entityPublisher as MetaEntity,
        entityDefinition: entityDefinitionPublisher as EntityDefinition,
        instances: [
          publisher1 as EntityInstance,
          publisher2 as EntityInstance,
          publisher3 as EntityInstance,
        ]
      }
    ];
    
    const beforeEachCompositeAction: CompositeAction = {
      actionType: "compositeAction",
      actionLabel: "beforeEach",
      actionName: "sequence",
      definition: [
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "resetLibraryStore",
          domainAction: {
            actionType: "modelAction",
            actionName: "resetModel",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          },
        },
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "initLibraryStore",
          domainAction: {
            actionType: "modelAction",
            actionName: "initModel",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: selfApplicationDeploymentLibrary.uuid,
            params: {
              dataStoreType:
                adminConfigurationDeploymentLibrary.uuid == adminConfigurationDeploymentMiroir.uuid
                  ? "miroir"
                  : "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
              metaModel: defaultMiroirMetaModel,
              application: selfApplicationMiroir,
              selfApplicationDeploymentConfiguration: selfApplicationDeploymentLibrary,
              applicationModelBranch: selfApplicationModelBranchMiroirMasterBranch,
              applicationStoreBasedConfiguration: selfApplicationStoreBasedConfigurationMiroir,
              applicationVersion: selfApplicationVersionInitialMiroirVersion,
            },
          },
        },
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "initLibraryStore",
          domainAction: {
            actionType: "modelAction",
            actionName: "rollback",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          },
        },
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "CreateLibraryStoreEntities",
          domainAction: {
            actionType: "modelAction",
            actionName: "createEntity",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            entities: libraryEntitesAndInstances,
          },
        },
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "CommitLibraryStoreEntities",
          domainAction: {
            actionType: "modelAction",
            actionName: "commit",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          },
        },
        {
          compositeActionType: "domainAction",
          compositeActionStepLabel: "CreateLibraryStoreInstances",
          domainAction: {
            actionType: "instanceAction",
            actionName: "createInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            applicationSection: "data",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            objects: libraryEntitesAndInstances.map((e) => {
              return {
                parentName: e.entity.name,
                parentUuid: e.entity.uuid,
                applicationSection: "data",
                instances: e.instances,
              };
            }),
          },
        },
      ],
    };
    const queryResult:ActionReturnType = await domainController.handleCompositeAction(
      beforeEachCompositeAction,
      {},
      defaultMiroirMetaModel
    );

  }
)

afterAll(
  async () => {
    await deleteAndCloseApplicationDeployments(
      miroirConfig,
      domainController,
      deploymentConfigurations,
    );
  }
)

afterEach(
  async () => {
    await resetApplicationDeployments(
      // miroirConfig,
      deploymentConfigurations,
      domainController,
      localCache,
    );
  }
)

const globalTimeOut = 10000;


describe.sequential('DomainController.Data.CRUD.React',
  () => {

    // ###########################################################################################
    it('Refresh all Instances',
      async() => {
        // await refreshAllInstancesTest(
        //   miroirConfig,
        //   localMiroirPersistenceStoreController,
        //   localAppPersistenceStoreController,
        //   localCache,
        //   domainController,
        //   miroirContext,
        // );
        // return Promise.resolve();
        try {
          log.info("Refresh all Instances start");
          const displayLoadingInfo = <DisplayLoadingInfo />;
          const user = (userEvent as any).setup();
      
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityName={entityBook.name}
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
            />,
            { store: localCache.getInnerStore() }
          );
      
          log.info("Refresh all Instances setup is finished.")
      
          await act(async () => {
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "rollback",
              deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            }, defaultMiroirMetaModel);
            await domainController.handleAction({
              actionType: "modelAction",
              actionName: "rollback",
              deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            }, defaultMiroirMetaModel);
          });
      
          log.info("Refresh all Instances start test", JSON.stringify(localCache.getState()));
          
          await act(()=>user.click(screen.getByRole("button")));
      
          await waitFor(() => {
            getAllByRole(/step:1/);
          }).then(() => {
            expect(screen.queryByText(new RegExp(`${book3.uuid}`, "i"))).toBeNull(); // Et dans l'éternité je ne m'ennuierai pas
            expect(getByText(new RegExp(`${book1.uuid}`, "i"))).toBeTruthy(); // The Bride Wore Black
            expect(getByText(new RegExp(`${book2.uuid}`, "i"))).toBeTruthy(); // The Design of Everyday Things
            expect(getByText(new RegExp(`${book4.uuid}`, "i"))).toBeTruthy(); // Rear Window
          });
        } catch (error) {
          log.error("error during test", expect.getState().currentTestName, error);
          expect(false).toBeTruthy();
        }
        return Promise.resolve();
      
      },
      globalTimeOut
    )

    // ###########################################################################################
    it('Add Book instance then rollback',
      async () => {
        try {
          console.log('Add Book instance then rollback start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = (userEvent as any).setup()
  
          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
            />
            ,
            {store:localCache.getInnerStore()}
          );
  
          // ##########################################################################################################
          console.log('add Book step 1: the Book must be absent in the local cache report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              }, localCache.currentModel(adminConfigurationDeploymentMiroir.uuid));
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              }, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
            }
          );
          console.log('add Book step 1: done replace.')
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );

          // ##########################################################################################################
          console.log('add Book instance step 2: the Book must then be present in the local cache report list.')
          const createAction: InstanceAction = {
            actionType: "instanceAction",
            actionName: "createInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            applicationSection: "data",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            objects:[{parentName:book3.parentName,parentUuid:book3.parentUuid,applicationSection:'data',instances:[book3 as EntityInstance]}]
          };

          await act(
            async () => {
              await domainController.handleAction(createAction);
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          // data operations are not transactional
          expect(domainController.currentTransaction().length).toEqual(0);
          // expect(domainController.currentTransaction()[0]).toEqual(createAction);
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );

          // ##########################################################################################################
          console.log('add Book instance step 3: rollbacking/refreshing report list from remote store, added book must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              }, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )

    // ###########################################################################################
    it('Remove Book instance then rollback',
      async () => {

        try {
          
          console.log('Remove Book instance then rollback start');
  
          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = (userEvent as any).setup()

          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              // parentName="Book"
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
            />
            ,
            {store:localCache.getInnerStore()}
          );
  
          // ##########################################################################################################
          console.log('Remove Book instance step 1: the Book must be present in the local cache report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentMiroir.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              }, localCache.currentModel(adminConfigurationDeploymentMiroir.uuid));
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              }, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              // expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              // expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );
  
          // ##########################################################################################################
          console.log('remove Book instance step 2: the Book must then be absent from the local cache report list.')
          const deleteAction: InstanceAction = {
            actionType: "instanceAction",
            actionName: "deleteInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            applicationSection: "data",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            objects:[{parentName:book2.parentName,parentUuid:book2.parentUuid,applicationSection:'data', instances:[book2 as EntityInstance]}]
          };
  
          await act(
            async () => {
              await domainController.handleAction(deleteAction);
            }
          );
  
          await act(()=>user.click(screen.getByRole('button')));
  
          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          // data operations are not transactional
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              // expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(screen.queryByText(new RegExp(`${book2.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );

          // ##########################################################################################################
          console.log('Remove Book instance step 3: rollbacking/refreshing book list from remote store, removed book must still be absent from the report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              }, defaultMiroirMetaModel);
            }
          );

          await act(()=>user.click(screen.getByRole('button')));

          console.log("domainController.currentTransaction()", domainController.currentTransaction());
          expect(domainController.currentTransaction().length).toEqual(0);

          await waitFor(
            () => {
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              // expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              expect(screen.queryByText(new RegExp(`${book2.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )

    // ###########################################################################################
    it('Update Book instance then commit',
      async () => {
        try {
          
          console.log('update Book instance start');

          const displayLoadingInfo=<DisplayLoadingInfo reportUuid={entityBook.uuid}/>
          const user = (userEvent as any).setup()

          const {
            getByText,
            getAllByRole,
            // container
          } = renderWithProviders(
            <TestUtilsTableComponent
              // parentName="Book"
              entityUuid={entityBook.uuid}
              DisplayLoadingInfo={displayLoadingInfo}
              deploymentUuid={adminConfigurationDeploymentLibrary.uuid}
            />
            ,
            {store:localCache.getInnerStore()}
          );
  
          // ##########################################################################################################
          console.log('Update Book instance step 1: loading initial configuration, book must be present in report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              }, localCache.currentModel(adminConfigurationDeploymentLibrary.uuid));
            }
          );

          await act(()=>user.click(screen.getByRole('button')));

          await waitFor(
            () => {
              getAllByRole(/step:1/)
            },
          ).then(
            ()=> {
              // expect(screen.queryByText(/caef8a59-39eb-48b5-ad59-a7642d3a1e8f/i)).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book1.uuid}`,'i'))).toBeTruthy() // The Bride Wore Black
              expect(getByText(new RegExp(`${book2.uuid}`,'i'))).toBeTruthy() // The Design of Everyday Things
              // expect(getByText(new RegExp(`${book3.uuid}`,'i'))).toBeTruthy() // Et dans l'éternité je ne m'ennuierai pas
              expect(screen.queryByText(new RegExp(`${book3.uuid}`,'i'))).toBeNull() // Et dans l'éternité je ne m'ennuierai pas
              expect(getByText(new RegExp(`${book4.uuid}`,'i'))).toBeTruthy() // Rear Window
            }
          );
  
          // ##########################################################################################################
          console.log('Update Book instance step 2: update reportReportList, modified version must then be present in the report list.')
          const updateAction: InstanceAction = {
            actionType: "instanceAction",
            actionName: "updateInstance",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            applicationSection: "data",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            objects: [
              {
                parentName: book4.parentName,
                parentUuid: book4.parentUuid,
                applicationSection:'data',
                instances: [
                  Object.assign({},book4,{"name":"Tthe Bride Wore Blackk", "author": "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17"}) as EntityInstance
                ],
              },
            ],
          };
          await act(
            async () => {
              await domainController.handleAction(updateAction);
            }
          );
  
          // update does not generate any redo / undo
          expect(domainController.currentTransaction().length).toEqual(0);
  
          await act(()=>user.click(screen.getByRole('button')));
  
          await waitFor(
            () => {
              getAllByRole(/step:2/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Tthe Bride Wore Blackk/i)).toBeTruthy() // Report List
            }
          );
  
          // ##########################################################################################################
          console.log('Update Book instance step 3: refreshing book list from remote store, modified bool must still be present in the report list.')
          await act(
            async () => {
              await domainController.handleAction({
                actionType: "modelAction",
                actionName: "rollback",
                deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
                endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              }, defaultMiroirMetaModel);
            }
          );

          await act(()=>user.click(screen.getByRole('button')));

          await waitFor(
            () => {
              getAllByRole(/step:3/)
            },
          ).then(
            ()=> {
              expect(screen.queryByText(/Tthe Bride Wore Blackk/i)).toBeTruthy() // Report List
            }
          );
        } catch (error) {
          console.error('error during test',expect.getState().currentTestName,error);
          expect(false).toBeTruthy();
        }
      }
    )
  } //  end describe('DomainController.Data.CRUD.React',
)

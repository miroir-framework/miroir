import { describe } from 'vitest';

// import { miroirFileSystemStoreSectionStartup } from "../dist/bundle";
import {
  Action2ReturnType,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  ApplicationSection,
  author1,
  author2,
  author3,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  ConfigurationService,
  defaultLevels,
  defaultMiroirMetaModel,
  DomainControllerInterface,
  entityAuthor,
  entityBook,
  EntityDefinition,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPublisher,
  entityEndpointVersion,
  entityEntity,
  entityEntityDefinition,
  EntityInstance,
  entityMenu,
  entityPublisher,
  ignorePostgresExtraAttributesOnList,
  ignorePostgresExtraAttributesOnObject,
  LoggerInterface,
  MetaEntity,
  MiroirActivityTracker,
  MiroirConfigClient,
  miroirCoreStartup,
  MiroirEventService,
  MiroirLoggerFactory,
  PersistenceStoreControllerInterface,
  PersistenceStoreControllerManagerInterface,
  publisher1,
  publisher2,
  publisher3,
  Report,
  reportBookList,
  resetAndInitApplicationDeployment,
  StoreUnitConfiguration
} from "miroir-core";


import { LocalCacheInterface, MiroirContext } from 'miroir-core';
import { miroirFileSystemStoreSectionStartup } from 'miroir-store-filesystem';
import { miroirIndexedDbStoreSectionStartup } from 'miroir-store-indexedDb';
import { miroirPostgresStoreSectionStartup } from 'miroir-store-postgres';
import { cleanLevel, packageName } from '../../src/constants.js';
import { loglevelnext } from "../../src/loglevelnextImporter.js";
import { miroirAppStartup } from '../../src/startup.js';
import {
  addEntitiesAndInstances,
  // chainVitestSteps,
  createDeploymentCompositeAction,
  createMiroirDeploymentGetPersistenceStoreController,
  deploymentConfigurations,
  // loadTestConfigFiles,
  resetApplicationDeployments,
  selfApplicationDeploymentConfigurations,
  setupMiroirTest
} from "../../src/miroir-fwk/4-tests/tests-utils.js";
import { loadTestConfigFiles } from '../utils/fileTools.js';
import { chainVitestSteps } from '../../src/miroir-fwk/4-tests/vitest-utils.js';

let domainController: DomainControllerInterface;
let localCache: LocalCacheInterface;
let localMiroirPersistenceStoreController: PersistenceStoreControllerInterface;
let localAppPersistenceStoreController: PersistenceStoreControllerInterface;
let miroirContext: MiroirContext;
let persistenceStoreControllerManager: PersistenceStoreControllerManagerInterface | undefined;

const env:any = (import.meta as any).env
console.log("@@@@@@@@@@@@@@@@@@ env", env);

const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);

const myConsoleLog = (...args: any[]) => console.log(fileName, ...args);
// const {miroirConfig, logConfig:loggerOptions} = await loadTestConfigFiles(env);
const fileName = "ExtractorPersistenceStoreRunner.integ.test";
myConsoleLog(fileName, "received env", JSON.stringify(env, null, 2));

let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, fileName)
).then((logger: LoggerInterface) => {log = logger});

miroirAppStartup();
miroirCoreStartup();
miroirFileSystemStoreSectionStartup();
miroirIndexedDbStoreSectionStartup();
miroirPostgresStoreSectionStartup();
ConfigurationService.registerTestImplementation({expect: expect as any});

myConsoleLog("received miroirConfig", JSON.stringify(miroirConfig, null, 2));
myConsoleLog(
  "received miroirConfig.client",
  JSON.stringify(miroirConfig.client, null, 2)
);
myConsoleLog("received loggerOptions", JSON.stringify(loggerOptions, null, 2));
const miroirActivityTracker = new MiroirActivityTracker();
const miroirEventService = new MiroirEventService(miroirActivityTracker);
MiroirLoggerFactory.startRegisteredLoggers(
  miroirActivityTracker,
  miroirEventService,
  loglevelnext,
  (defaultLevels as any)[loggerOptions.defaultLevel],
);
myConsoleLog("started registered loggers DONE");

const miroirDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[adminConfigurationDeploymentMiroir.uuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[adminConfigurationDeploymentMiroir.uuid];

const testApplicationDeploymentUuid = adminConfigurationDeploymentLibrary.uuid;
const libraryDeploymentStorageConfiguration: StoreUnitConfiguration = miroirConfig.client.emulateServer
  ? miroirConfig.client.deploymentStorageConfig[testApplicationDeploymentUuid]
  : miroirConfig.client.serverConfig.storeSectionConfiguration[testApplicationDeploymentUuid];

console.log("@@@@@@@@@@@@@@@@@@ miroirConfig", miroirConfig);

// ################################################################################################
beforeAll(
  async () => {
    if (!miroirConfig.client.emulateServer) {
      throw new Error(
        "LocalPersistenceStoreController state do not make sense for real server configurations! Please use only 'emulateServer: true' configurations for this test."
      );
    }

    const {
      persistenceStoreControllerManagerForServer: localpersistenceStoreControllerManager,
      domainController: localdomainController,
      localCache: locallocalCache,
      miroirContext: localmiroirContext,
    } = await setupMiroirTest(miroirConfig);

    if (!localpersistenceStoreControllerManager) {
      throw new Error("localpersistenceStoreControllerManager not defined");
    }

    persistenceStoreControllerManager = localpersistenceStoreControllerManager;
    domainController = localdomainController;
    localCache = locallocalCache;
    miroirContext = localmiroirContext;


    const wrapped = await createMiroirDeploymentGetPersistenceStoreController(
      miroirConfig as MiroirConfigClient,
      persistenceStoreControllerManager,
      domainController
    );
    if (wrapped) {
      if (wrapped.localMiroirPersistenceStoreController) {
        localMiroirPersistenceStoreController = wrapped.localMiroirPersistenceStoreController;
      } else {
        throw new Error("beforeAll failed localMiroirPersistenceStoreController initialization!");
      }
    } else {
      throw new Error("beforeAll failed initialization!");
    }

    const createLibraryDeploymentAction = createDeploymentCompositeAction(adminConfigurationDeploymentLibrary.uuid, libraryDeploymentStorageConfiguration);
    const result = await domainController.handleCompositeAction(createLibraryDeploymentAction, defaultMiroirMetaModel);

    if (result.status !== "ok") {
      throw new Error("beforeAll failed createLibraryDeploymentAction!");
    }

    const tmplocalAppPersistenceStoreController = persistenceStoreControllerManager.getPersistenceStoreController(
      adminConfigurationDeploymentLibrary.uuid
    );
    if (!tmplocalAppPersistenceStoreController) {
      throw new Error("beforeAll failed localAppPersistenceStoreController initialization!");
    }
    localAppPersistenceStoreController = tmplocalAppPersistenceStoreController;

    return Promise.resolve();
  }
)

// ################################################################################################
beforeEach(
  async  () => {
    await resetAndInitApplicationDeployment(domainController, selfApplicationDeploymentConfigurations);
    document.body.innerHTML = '';
    await addEntitiesAndInstances(
      localAppPersistenceStoreController,
      domainController,
      localCache,
      miroirConfig,
      adminConfigurationDeploymentLibrary,
      [
        // authors
        {
          entity: entityAuthor as MetaEntity,
          entityDefinition: entityDefinitionAuthor as EntityDefinition,
          instances: [
            author1,
            author2,
            author3 as EntityInstance,
          ],
        },
        // books
        {
          entity: entityBook as MetaEntity,
          entityDefinition: entityDefinitionBook as EntityDefinition,
          instances: [
            book1 as EntityInstance,
            book2 as EntityInstance,
            book3 as EntityInstance,
            book4 as EntityInstance,
            book5 as EntityInstance,
            book6 as EntityInstance,
          ]
        },
        // publishers
        {
          entity: entityPublisher as MetaEntity,
          entityDefinition: entityDefinitionPublisher as EntityDefinition,
          instances: [
            publisher1,
            publisher2,
            publisher3 as EntityInstance,
          ]
        }
      ],
      reportBookList as Report,
    )
  }
)

// ################################################################################################
afterEach(
  async () => {
    await resetApplicationDeployments(deploymentConfigurations, domainController, localCache);
  }
)

// ################################################################################################
afterAll(
  async () => {
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ deleteAndCloseApplicationDeployments")
    try {
      await localMiroirPersistenceStoreController.close();
      await localAppPersistenceStoreController.close();
    } catch (error) {
      console.error('Error afterAll',error);
    }
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ Done deleteAndCloseApplicationDeployments")
  }
)


// ##############################################################################################
// ##############################################################################################
// ##############################################################################################

describe.sequential("ExtractorTemplatePersistenceStoreRunner.integ.test", () => {

  // ################################################################################################
  it("get Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectEntityInstance_selectObjectByDirectReference",
      {},
      async () => {
        const applicationSection:ApplicationSection = "model";
        const queryResult: Action2ReturnType =
          await localMiroirPersistenceStoreController.handleBoxedExtractorTemplateActionForServerONLY({
            actionType: "runBoxedExtractorTemplateAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
            // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              applicationSection: applicationSection,
              query: {
                queryType: "boxedExtractorTemplateReturningObject",
                pageParams: {},
                queryParams: {},
                contextResults: {},
                deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                // deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                select: {
                  extractorTemplateType: "extractorForObjectByDirectReference",
                  applicationSection: "model",
                  parentName: "Entity",
                  parentUuid: {
            transformerType: "constant",
            mlSchema: { type: "uuid" },
                    interpolation: "build",
                    value: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  },
                  instanceUuid: {
            transformerType: "constant",
            mlSchema: { type: "uuid" },
                    interpolation: "build",
                    value: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                  },
                },
              },
            }
          });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => ignorePostgresExtraAttributesOnObject((a as any).returnedDomainElement, ["author"]),
      // undefined, // expected result transformation
      undefined, // name to give to result
      undefined,
      {
        uuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        parentName: "Entity",
        parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
        parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
        name: "Entity",
        selfApplication: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
        conceptLevel: "MetaModel",
        description: "The Metaclass for entities.",
      }
    );
  });
  
  
  // ################################################################################################
  it("get Library Entities", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectEntityInstanceUuidIndex",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult: Action2ReturnType =
          await localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY({
            actionType: "runBoxedQueryTemplateAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
                pageParams: {},
                queryParams: {},
                contextResults: {},
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                extractorTemplates: {
                  entities: {
                    extractorTemplateType: "extractorTemplateForObjectListByEntity",
                    applicationSection: applicationSection,
                    parentName: entityEntity.name,
                    parentUuid: {
            transformerType: "constant",
            mlSchema: { type: "uuid" },
                      interpolation: "build",
                      value: entityEntity.uuid,
                    },
                  },
                },
              },
            }
          });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult; // == "ok" ? queryResult : {status: "error", error: queryResult.error};
      },
      (a) =>
        ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.entities.sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ["author"]
        ),
      undefined, // name to give to result
      undefined,
      [entityAuthor, entityBook, entityPublisher].sort((a, b) => a.name.localeCompare(b.name))
    );
  });
  
  // ################################################################################################
  it("get Filtered Entity Entity from Miroir", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectObjectListByEntity_filtered",
      {},
      async () => {
        const applicationSection: ApplicationSection = "model";
        const queryResult =
          await localMiroirPersistenceStoreController.handleQueryTemplateActionForServerONLY({
            actionType: "runBoxedQueryTemplateAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
                pageParams: {},
                queryParams: {},
                contextResults: {},
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                extractorTemplates: {
                  entities: {
                    extractorTemplateType: "extractorTemplateForObjectListByEntity",
                    applicationSection: applicationSection,
                    parentName: "Entity",
                    parentUuid: {
            transformerType: "constant",
            mlSchema: { type: "uuid" },
                      interpolation: "build",
                      value: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                    },
                    filter: {
                      attributeName: "name",
                      value: {
            transformerType: "constant",
            mlSchema: { type: "string" },
                        interpolation: "build",
                        // value: "or",
                        value: "en",
                      },
                    },
                  },
                },
              },
            }
          });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) =>
        ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.entities.sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ["author"]
        ),
      undefined, // name to give to result
      undefined,
      [entityEndpointVersion, entityEntity, entityEntityDefinition, entityMenu].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
      // [entityReport, entityStoreBasedConfiguration].sort((a, b) => a.name.localeCompare(b.name))
    );
  });
  
  // ################################################################################################
  it("get Unique Authors from Books in Library with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult =
          await localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY({
            actionType: "runBoxedQueryTemplateAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
                pageParams: {},
                queryParams: {},
                contextResults: {},
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                extractorTemplates: {
                  books: {
                    extractorTemplateType: "extractorTemplateForObjectListByEntity",
                    applicationSection: applicationSection,
                    parentName: "Book",
                    parentUuid: {
            transformerType: "constant",
            mlSchema: { type: "uuid" },
                      interpolation: "build",
                      // value: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
                      value: entityBook.uuid,
                    },
                  },
                },
                runtimeTransformers: {
                  uniqueAuthors: {
                    transformerType: "unique",
                    interpolation: "runtime",
                    applyTo: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "books",
                    },
                    attribute: "author",
                    orderBy: "author",
                  },
                },
              },
            },
          });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => (a as any).returnedDomainElement.uniqueAuthors,
      undefined, // name to give to result
      undefined,
      [
        { author: "4441169e-0c22-4fbc-81b2-28c87cf48ab2" },
        { author: "ce7b601d-be5f-4bc6-a5af-14091594046a" },
        { author: "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17" },
        { author: "e4376314-d197-457c-aa5e-d2da5f8d5977" },
      ]
    );
  });
  
  // ################################################################################################
  it("get count books with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY({
          actionType: "runBoxedQueryTemplateAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            applicationSection: applicationSection,
            query: {
              queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
              pageParams: {},
              queryParams: {},
              contextResults: {},
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              extractorTemplates: {
                books: {
                  extractorTemplateType: "extractorTemplateForObjectListByEntity",
                  applicationSection: applicationSection,
                  parentName: "Book",
                  parentUuid: {
            transformerType: "constant",
            mlSchema: { type: "uuid" },
                    interpolation: "build",
                    value: entityBook.uuid,
                  },
                },
              },
              runtimeTransformers: {
                uniqueAuthors: {
                  interpolation: "runtime",
                  transformerType: "count",
                  applyTo: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "books",
                  },
                },
              },
            },
          }
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => (a as any).returnedDomainElement.uniqueAuthors,
      undefined, // name to give to result
      undefined,
      [{count: 6}],
    );
  });
  
  // ################################################################################################
  it("get count books by author uuid with actionRuntimeTransformer", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult = await localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY({
          actionType: "runBoxedQueryTemplateAction",
          actionName: "runQuery",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            applicationSection: applicationSection,
            query: {
              queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
              pageParams: {},
              queryParams: {},
              contextResults: {},
              deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
              extractorTemplates: {
                books: {
                  extractorTemplateType: "extractorTemplateForObjectListByEntity",
                  applicationSection: applicationSection,
                  parentName: "Book",
                  parentUuid: {
            transformerType: "constant",
            mlSchema: { type: "uuid" },
                    interpolation: "build",
                    value: entityBook.uuid,
                  },
                },
              },
              runtimeTransformers: {
                countBooksByAuthors: {
                  transformerType: "count",
                  interpolation: "runtime",
                  groupBy: "author",
                  applyTo: {
                    transformerType: "contextReference",
                    interpolation: "runtime",
                    referenceName: "books",
                  },
                  // orderBy: "author",
                },
              },
            },
          }
        });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      (a) => (a as any).returnedDomainElement.countBooksByAuthors,
      undefined, // name to give to result
      undefined,
      [
        {
          "4441169e-0c22-4fbc-81b2-28c87cf48ab2": 1,
          "ce7b601d-be5f-4bc6-a5af-14091594046a": 2,
          "d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17": 2,
          "e4376314-d197-457c-aa5e-d2da5f8d5977": 1,
        },
      ]
    );
  });
  
  // // ################################################################################################
  // // TODO: migrate to new action format
  // it("get country list with new uuids with actionRuntimeTransformer", async () => {
  //   await chainVitestSteps(
  //     "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
  //     {},
  //     async () => {
  //       const applicationSection: ApplicationSection = "data";
  //       const queryResult = await localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY({
  //         actionType: "runBoxedQueryTemplateAction",
  //         actionName: "runQuery",
  //         deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //         endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
  //         applicationSection: applicationSection,
  //         query: {
  //           queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
  //           pageParams: {},
  //           queryParams: {},
  //           contextResults: {},
  //           // pageParams: { elementType: "object", elementValue: {} },
  //           // queryParams: { elementType: "object", elementValue: {} },
  //           // contextResults: { elementType: "object", elementValue: {} },
  //           deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  //           extractorTemplates: {
  //             books: {
  //               extractorTemplateType: "extractorTemplateForObjectListByEntity",
  //               applicationSection: applicationSection,
  //               parentName: "Book",
  //               parentUuid: {
  //                 transformerType: "constantUuid",
  //                 value: entityBook.uuid,
  //               },
  //             },
  //           },
  //           runtimeTransformers: {
  //             countries: {
  //               transformerType: "mapperListToList",
  //               interpolation: "runtime",
  //               referencedTransformer: "books",
  //               orderBy: "name",
  //               elementTransformer: {
  //                 transformerType: "innerFullObjectTemplate",
  //                 interpolation: "runtime",
  //                 referenceToOuterObject: "book",
  //                 definition: [
  //                   {
  //                     attributeKey: {
  //                       interpolation: "runtime",
  //                       transformerType: "constantUuid",
  //                       value: "uuid",
  //                     },
  //                     attributeValue: {
  //                       interpolation: "runtime",
  //                       transformerType: "newUuid",
  //                     },
  //                   },
  //                   {
  //                     attributeKey: {
  //                       interpolation: "runtime",
  //                       transformerType: "constantUuid",
  //                       value: "name",
  //                     },
  //                     attributeValue: {
  //                       transformerType: "mustacheStringTemplate",
  //                       interpolation: "runtime",
  //                       definition: "{{book.name}}",
  //                     },
  //                   },
  //                 ],
  //               },
  //             },
  //           },
  //         },
  //       });
  //       console.log("queryResult", JSON.stringify(queryResult, null, 2));
  //       return queryResult;
  //     },
  //     (a) =>
  //       ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.countries, [
  //       // ignorePostgresExtraAttributesOnList((a as any).returnedDomainElement.countries, [
  //         "uuid",
  //       ]),
  //     undefined, // name to give to result
  //     undefined,
  //     [
  //       {
  //         name: "Et dans l&#39;éternité je ne m&#39;ennuierai pas",
  //       },
  //       {
  //         name: "Le Pain et le Cirque",
  //       },
  //       {
  //         name: "Rear Window",
  //       },
  //       {
  //         name: "Renata n&#39;importe quoi",
  //       },
  //       {
  //         name: "The Bride Wore Black",
  //       },
  //       {
  //         name: "The Design of Everyday Things",
  //       },
  //     ]
  //   );
  // });

  // ################################################################################################
  it("get books of an author with combiner", async () => {
    await chainVitestSteps(
      "ExtractorTemplatePersistenceStoreRunner_selectUniqueEntityApplication",
      {},
      async () => {
        const applicationSection: ApplicationSection = "data";
        const queryResult =
          await localAppPersistenceStoreController.handleQueryTemplateActionForServerONLY({
            actionType: "runBoxedQueryTemplateAction",
            actionName: "runQuery",
            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              applicationSection: applicationSection,
              query: {
                queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
                pageParams: {},
                queryParams: {
                  instanceUuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
                },
                contextResults: {},
                deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                extractorTemplates: {
                  book: {
                    extractorTemplateType: "extractorForObjectByDirectReference",
                    parentName: "Book",
                    parentUuid: {
                      transformerType: "constant",
                      mlSchema: { type: "uuid" },
                      interpolation: "build",
                      value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                    },
                    instanceUuid: {
                      transformerType: "parameterReference",
                      referenceName: "instanceUuid",
                    },
                  },
                },
                combinerTemplates: {
                  author: {
                    extractorTemplateType: "combinerForObjectByRelation",
                    parentName: "Author",
                    parentUuid: {
                      transformerType: "constant",
                      mlSchema: { type: "uuid" },
                      interpolation: "build",
                      value: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
                    },
                    objectReference: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "book",
                    },
                    AttributeOfObjectToCompareToReferenceUuid: "author",
                  },
                  booksOfAuthor: {
                    extractorTemplateType: "combinerByRelationReturningObjectList",
                    parentName: "Book",
                    parentUuid: {
                      transformerType: "constant",
                      mlSchema: { type: "uuid" },
                      interpolation: "build",
                      value: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
                    },
                    objectReference: {
                      transformerType: "contextReference",
                      interpolation: "runtime",
                      referenceName: "author",
                    },
                    AttributeOfListObjectToCompareToReferenceUuid: "author",
                  },
                },
              },
            },
          });
        console.log("queryResult", JSON.stringify(queryResult, null, 2));
        return queryResult;
      },
      // (a) => (a as any).returnedDomainElement.booksOfAuthor,
      (a) => {
        // console.log("ICI!!!");
        const result = ignorePostgresExtraAttributesOnList(
          (a as any).returnedDomainElement.booksOfAuthor.sort((a: any, b: any) => a.name.localeCompare(b.name))
        );
        console.log("CORRECTED result", JSON.stringify(result, null, 2));
        return result;
      },
      undefined, // name to give to result
      undefined,
      Object.values({
        "c6852e89-3c3c-447f-b827-4b5b9d830975": {
          author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
          conceptLevel: "Data",
          name: "Le Pain et le Cirque",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
          uuid: "c6852e89-3c3c-447f-b827-4b5b9d830975",
        },
        "caef8a59-39eb-48b5-ad59-a7642d3a1e8f": {
          author: "ce7b601d-be5f-4bc6-a5af-14091594046a",
          conceptLevel: "Data",
          name: "Et dans l'éternité je ne m'ennuierai pas",
          parentName: "Book",
          parentUuid: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
          publisher: "516a7366-39e7-4998-82cb-80199a7fa667",
          uuid: "caef8a59-39eb-48b5-ad59-a7642d3a1e8f",
        },
      }).sort((a, b) => a.name.localeCompare(b.name))
    );
  });
  
});

import { useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';

import type {
  ApplicationDeploymentMap,
  CompositeActionSequence,
  CompositeActionTemplate,
  CoreTransformerForBuildPlusRuntime,
  Deployment,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstancesUuidIndex,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirModelEnvironment,
  ReduxDeploymentsState,
  ReduxStateWithUndoRedo,
  Runner,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  Uuid,
  ViewParams
} from "miroir-core";
import {
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  defaultViewParamsFromAdminStorageFetchQueryParams,
  devRelativePathPrefix,
  formatYYYYMMDD_HHMMSS,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  MiroirLoggerFactory,
  noValue,
  prodRelativePathPrefix,
  selfApplicationMiroir,
  transformer_extended_apply_wrapper
} from "miroir-core";
import {
  type AdminApplication
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getMemoizedReduxDeploymentsStateSelectorMap, useMiroirContextService, useSelector } from "miroir-react";
import {
  entityDeployment
} from "miroir-test-app_deployment-admin";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useCurrentModelEnvironment, useReduxDeploymentsStateQuerySelectorForCleanedResult } from "../../ReduxHooks.js";
import type { FormMLSchema } from "./RunnerInterface.js";
import { RunnerView } from "./RunnerView.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_CreateApplication"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
const prefix =
  process.env.NODE_ENV === "development" ? devRelativePathPrefix : prodRelativePathPrefix;

export interface CreateApplicationToolProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}

export const Runner_CreateApplication_formMLSchema: FormMLSchema = {
  formMLSchemaType: "transformer",
  transformer: {
    type: "object",
    definition: {
      createApplicationAndDeployment: {
        type: "object",
        definition: {
          applicationStorage: {
            type: "schemaReference",
            context: {
              indexedDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "indexedDb" },
                },
              },
              filesystemDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "filesystem" },
                },
              },
              sqlDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "sql" },
                  connectionString: {
                    type: "string",
                    tag: {
                      value: {
                        defaultLabel: "SQL Connection String",
                        display: { editable: false },
                        initializeTo: {
                          initializeToType: "transformer",
                          transformer: {
                            transformerType: "getFromParameters",
                            interpolation: "runtime",
                            referencePath: ["viewParams", "postgresConnectionString"],
                          },
                        },
                      },
                    },
                  },
                },
              },
              mongoDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "mongodb" },
                  connectionString: {
                    type: "string",
                    tag: {
                      value: {
                        defaultLabel: "MongoDB Connection String",
                        display: { editable: false },
                        initializeTo: {
                          initializeToType: "transformer",
                          transformer: {
                            transformerType: "getFromParameters",
                            interpolation: "runtime",
                            referencePath: ["viewParams", "mongoConnectionString"],
                          },
                        },
                      },
                    },
                  },
                },
              },
              storeSectionConfiguration: {
                type: "union",
                discriminator: "emulatedServerType",
                definition: {
                  transformerType: "concatLists",
                  lists: [
                    [
                      {
                        type: "schemaReference",
                        definition: { relativePath: "indexedDbStoreSectionConfiguration" },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          relativePath: "filesystemDbStoreSectionConfiguration",
                        },
                      },
                    ],
                    {
                      transformerType: "ifThenElse",
                      if: {
                        transformerType: "boolExpr",
                        operator: "==",
                        left: {
                          transformerType: "getFromParameters",
                          referencePath: ["viewParams", "postgresConnectionString"],
                        },
                        right: {
                          transformerType: "returnValue",
                          value: null,
                        },
                      },
                      then: [],
                      else: [
                        {
                          type: "schemaReference",
                          definition: { relativePath: "sqlDbStoreSectionConfiguration" },
                        },
                      ],
                    },
                    {
                      transformerType: "ifThenElse",
                      if: {
                        transformerType: "boolExpr",
                        operator: "==",
                        left: {
                          transformerType: "getFromParameters",
                          referencePath: ["viewParams", "mongoConnectionString"],
                        },
                        right: {
                          transformerType: "returnValue",
                          value: null,
                        },
                      },
                      then: [],
                      else: [
                        {
                          type: "schemaReference",
                          definition: { relativePath: "mongoDbStoreSectionConfiguration" },
                        },
                      ],
                    },
                  ],
                } as any,
              },
            },
            definition: {
              relativePath: "storeSectionConfiguration",
            },
          },
          deploymentUuid: {
            type: "uuid",
            tag: {
              value: {
                defaultLabel: "Deployment UUID",
                display: { editable: false },
              },
            },
          },
          newApplicationUuid: {
            type: "uuid",
            tag: {
              value: {
                defaultLabel: "New Application UUID",
                display: { editable: false },
              },
            },
          },
          applicationName: {
            type: "string",
            tag: {
              value: {
                defaultLabel: "Application Name or Folder Path",
              },
            },
          },
        },
      },
    },
  },
};

// ################################################################################################
function getCreateApplicationActionTemplate(
  prefix: string,
  testSelfApplicationUuid: Uuid,
  testDeploymentUuid: Uuid,
  testApplicationName: string,
  selectedMetaModel: MetaModel | undefined,
): CompositeActionTemplate {
  // const testApplicationModelBranchUuid = uuidv4();
  // const testApplicationVersionUuid = uuidv4();
  const defaultDirectory = "tmp/miroir_data_storage";

  // const sqltestDeploymentStorageConfigurationTemplate: TransformerForBuildPlusRuntime = {
  //   transformerType: "case",
  //   discriminator: {
  //     transformerType: "getFromParameters",
  //     referencePath: ["createApplicationAndDeployment", "applicationStorage", "emulatedServerType"],
  //   },
  //   whens: [
  //     // mongodb
  //     {
  //       when: "mongodb",
  //       then: {
  //         admin: {
  //           emulatedServerType: "mongodb",
  //           connectionString: {
  //             transformerType: "getFromParameters",
  //             referencePath: [
  //               "createApplicationAndDeployment",
  //               "applicationStorage",
  //               "connectionString",
  //             ],
  //           },
  //           database: "miroirAdmin",
  //         },
  //         model: {
  //           emulatedServerType: "mongodb",
  //           connectionString: {
  //             transformerType: "getFromParameters",
  //             referencePath: [
  //               "createApplicationAndDeployment",
  //               "applicationStorage",
  //               "connectionString",
  //             ],
  //           },
  //           database: {
  //             transformerType: "+",
  //             args: [
  //               {
  //                 transformerType: "mustacheStringTemplate",
  //                 definition:
  //                   "{{createApplicationAndDeployment.applicationName}}",
  //               },
  //               "_model",
  //             ],
  //           },
  //         },
  //         data: {
  //           emulatedServerType: "mongodb",
  //           connectionString: {
  //             transformerType: "getFromParameters",
  //             referencePath: [
  //               "createApplicationAndDeployment",
  //               "applicationStorage",
  //               "connectionString",
  //             ],
  //           },
  //           database: {
  //             transformerType: "+",
  //             args: [
  //               {
  //                 transformerType: "mustacheStringTemplate",
  //                 definition:
  //                   "{{createApplicationAndDeployment.applicationName}}",
  //               },
  //               "_data",
  //             ],
  //           },
  //         },
  //       },
  //     },
  //     // sql
  //     {
  //       when: "sql",
  //       then: {
  //         admin: {
  //           emulatedServerType: "sql",
  //           connectionString: {
  //             transformerType: "getFromParameters",
  //             referencePath: [
  //               "createApplicationAndDeployment",
  //               "applicationStorage",
  //               "connectionString",
  //             ],
  //           },
  //           schema: "miroirAdmin",
  //         },
  //         model: {
  //           emulatedServerType: "sql",
  //           connectionString: {
  //             transformerType: "getFromParameters",
  //             referencePath: [
  //               "createApplicationAndDeployment",
  //               "applicationStorage",
  //               "connectionString",
  //             ],
  //           },
  //           schema: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{createApplicationAndDeployment.applicationName}}",
  //           }, // TODO: separate model and data schemas
  //         },
  //         data: {
  //           emulatedServerType: "sql",
  //           connectionString: {
  //             transformerType: "getFromParameters",
  //             referencePath: [
  //               "createApplicationAndDeployment",
  //               "applicationStorage",
  //               "connectionString",
  //             ],
  //           },
  //           schema: {
  //             transformerType: "mustacheStringTemplate",
  //             definition: "{{createApplicationAndDeployment.applicationName}}",
  //           }, // TODO: separate model and data schemas
  //         },
  //       },
  //     },
  //     // indexedDb
  //     {
  //       when: "indexedDb",
  //       then: {
  //         admin: {
  //           emulatedServerType: "indexedDb",
  //           indexedDbName: {
  //             transformerType: "+",
  //             args: [
  //               "admin",
  //             ],
  //           },
  //         },
  //         model: {
  //           emulatedServerType: "indexedDb",
  //           indexedDbName: {
  //             transformerType: "+",
  //             args: [
  //               {
  //                 transformerType: "getFromParameters",
  //                 referencePath: [
  //                   "createApplicationAndDeployment",
  //                   "applicationStorage",
  //                   "applicationName",
  //                 ],
  //               },
  //               "_model",
  //             ],
  //           },
  //         },
  //         data: {
  //           emulatedServerType: "indexedDb",
  //           indexedDbName: {
  //             transformerType: "+",
  //             args: [
  //               {
  //                 transformerType: "getFromParameters",
  //                 referencePath: [
  //                   "createApplicationAndDeployment",
  //                   "applicationStorage",
  //                   "applicationName",
  //                 ],
  //               },
  //               "_data",
  //             ],
  //           },
  //         },
  //       },
  //     },
  //     // filesystem
  //     {
  //       when: "filesystem",
  //       then: {
  //         admin: {
  //           emulatedServerType: "filesystem",
  //           directory: {
  //             transformerType: "+",
  //             args: [prefix, "/admin"],
  //           },
  //         },
  //         model: {
  //           emulatedServerType: "filesystem",
  //           directory: {
  //             transformerType: "+",
  //             args: [
  //               prefix,
  //               {
  //                 transformerType: "getFromParameters",
  //                 referencePath: [
  //                   "createApplicationAndDeployment",
  //                   "applicationStorage",
  //                   "applicationName",
  //                 ],
  //               },
  //               "_model",
  //             ],
  //           },
  //         },
  //         data: {
  //           emulatedServerType: "filesystem",
  //           directory: {
  //             transformerType: "+",
  //             args: [
  //               prefix,
  //               {
  //                 transformerType: "getFromParameters",
  //                 referencePath: [
  //                   "createApplicationAndDeployment",
  //                   "applicationStorage",
  //                   "applicationName",
  //                 ],
  //               },
  //               "_data",
  //             ],
  //           },
  //         },
  //       },
  //     },
  //   ],
  //   else: {
  //     // default: filesystem
  //     admin: {
  //       emulatedServerType: "filesystem",
  //       directory: defaultDirectory,
  //     },
  //     model: {
  //       emulatedServerType: "filesystem",
  //       directory: defaultDirectory,
  //     },
  //     data: {
  //       emulatedServerType: "filesystem",
  //       directory: defaultDirectory,
  //     },
  //   },
  // };
  // const initParametersForTest: InitApplicationParameters = {
  //   dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
  //   metaModel: defaultMiroirMetaModel,
  //   selfApplication: {
  //     ...selfApplicationLibrary,
  //     uuid: {
  //       transformerType: "getFromParameters",
  //       referenceName: "testSelfApplicationUuid"
  //     } as any,
  //     name: {
  //       transformerType: "mustacheStringTemplate",
  //       definition: "{{createApplicationAndDeployment.applicationName}}",
  //     } as any,
  //     defaultLabel: {
  //       transformerType: "mustacheStringTemplate",
  //       definition:
  //         "The {{createApplicationAndDeployment.applicationName}} selfApplication",
  //     } as any,
  //     description: {
  //       transformerType: "mustacheStringTemplate",
  //       definition:
  //         "The model and data of the {{createApplicationAndDeployment.applicationName}} selfApplication",
  //     } as any,
  //   },
  //   applicationModelBranch: { // NOT USED!!
  //     ...selfApplicationModelBranchLibraryMasterBranch,
  //     uuid: {
  //       transformerType: "getFromParameters",
  //       referenceName: "testApplicationModelBranchUuid"
  //     },
  //     selfApplication: {
  //       transformerType: "getFromParameters",
  //       referenceName: "testSelfApplicationUuid"
  //     },
  //     headVersion: {
  //       transformerType: "getFromParameters",
  //       referenceName: "testApplicationVersionUuid"
  //     },
  //     description: {
  //       transformerType: "mustacheStringTemplate",
  //       definition:
  //         "The master branch of the {{createApplicationAndDeployment.applicationName}} SelfApplication",
  //     },
  //   } as any,
  //   applicationVersion: { // NOT USED!!
  //     ...selfApplicationVersionLibraryInitialVersion,
  //     uuid: {
  //       transformerType: "getFromParameters",
  //       referenceName: "testApplicationVersionUuid"
  //     },
  //     selfApplication: {
  //       transformerType: "getFromParameters",
  //       referenceName: "testSelfApplicationUuid"
  //     },
  //     branch: {
  //       transformerType: "getFromParameters",
  //       referenceName: "testApplicationModelBranchUuid"
  //     },
  //     description: {
  //       transformerType: "mustacheStringTemplate",
  //       definition:
  //         "Initial {{createApplicationAndDeployment.applicationName}} selfApplication version",
  //     },
  //   } as any,
  // };

  // const localCreateApplicationCompositeActionTemplate: CompositeActionSequence = {
  const localCreateApplicationCompositeActionTemplate: CompositeActionTemplate = {
    actionType: "compositeActionSequence",
    actionLabel: "createApplicationForAdminAction",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "createInstance",
          actionLabel: "createApplicationForAdminAction_instances",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: "55af124e-8c05-4bae-a3ef-0933d41daa92",
            applicationSection: "data",
            objects: [
              {
                uuid: {
                  transformerType: "getFromParameters",
                  referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
                } as any,
                parentName: "AdminApplication",
                parentUuid: "25d935e7-9e93-42c2-aade-0472b883492b",
                name: {
                  transformerType: "mustacheStringTemplate",
                  definition: `{{createApplicationAndDeployment.applicationName}}`,
                } as any,
                defaultLabel: {
                  transformerType: "mustacheStringTemplate",
                  definition: `The {{createApplicationAndDeployment.applicationName}} Application.`,
                } as any,
                description: {
                  transformerType: "mustacheStringTemplate",
                  definition: `This Application contains the {{createApplicationAndDeployment.applicationName}} model and data.`,
                } as any,
                selfApplication: {
                  transformerType: "getFromParameters",
                  referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
                } as any,
              } as AdminApplication, // TODO: this is actually a template of AdminApplication, hence the individual casts at attribute-level
            ],
          },
        },
      ],
    },
  };

  const localCreateDeploymentCompositeActionTemplate: CompositeActionSequence = {
    actionType: "compositeActionSequence",
    actionLabel: "createDeployment",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "storeManagementAction_openStore",
          actionLabel: "storeManagementAction_openStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            } as any,
            deploymentUuid: testDeploymentUuid,
            configuration: {
              // [testDeploymentUuid]: sqltestDeploymentStorageConfigurationTemplate as any,
              [testDeploymentUuid]: {
                  transformerType: "getFromParameters",
                  referenceName: "sqltestDeploymentStorageConfigurationTemplate",
                } as any,
            },
          },
        },
        {
          actionType: "storeManagementAction_createStore",
          actionLabel: "storeManagementAction_createStore",
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            } as any,
            deploymentUuid: testDeploymentUuid,
            // configuration: sqltestDeploymentStorageConfigurationTemplate as any,
            configuration: {
              transformerType: "getFromParameters",
              referenceName: "sqltestDeploymentStorageConfigurationTemplate",
            } as any,
          },
        },
        {
          actionType: "createInstance",
          actionLabel: "CreateDeploymentInstances",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: "55af124e-8c05-4bae-a3ef-0933d41daa92",
            applicationSection: "data",
            objects: [
              {
                uuid: testDeploymentUuid,
                parentName: "Deployment",
                parentUuid: entityDeployment.uuid,
                name: {
                  transformerType: "mustacheStringTemplate",
                  definition: `Deployment of application {{createApplicationAndDeployment.applicationName}}`,
                } as any,
                defaultLabel: {
                  transformerType: "mustacheStringTemplate",
                  definition: `The deployment of application {{createApplicationAndDeployment.applicationName}}`,
                } as any,
                description: {
                  transformerType: "mustacheStringTemplate",
                  definition: `The description of deployment of application {{createApplicationAndDeployment.applicationName}}`,
                } as any,
                selfApplication: {
                  transformerType: "getFromParameters",
                  referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
                } as any,
                // configuration: sqltestDeploymentStorageConfigurationTemplate as any,
                configuration: {
                  transformerType: "getFromParameters",
                  referenceName: "sqltestDeploymentStorageConfigurationTemplate",
                } as any,
              } as Deployment, // TODO: this is actually a template of Deployment, hence the individual casts at attribute-level
            ],
          },
        },
      ],
    },
  };

  const appEntitesAndInstances: any[] = [];
  const localResetAndinitializeDeploymentCompositeActionTemplate: CompositeActionTemplate = {
    actionType: "compositeActionSequence",
    actionLabel: "resetAndInitializeDeployment",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      actionSequence: [
        {
          actionType: "resetModel",
          actionLabel: "resetApplicationStore",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            } as any,
            ...(selectedMetaModel
              ? {
                  model: {
                    transformerType: "returnValue",
                    label: "customMetaModel",
                    interpolation: "runtime",
                    value: selectedMetaModel,
                  } as any, // TODO: fix type
                }
              : {}),
          },
        },
        {
          actionType: "initModel",
          actionLabel: {
            transformerType: "mustacheStringTemplate",
            definition: "resetAndInitializeDeployment_initModel_{{createApplicationAndDeployment.newApplicationUuid}}"
          } as any,
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            } as any,
            // params: {
            //   transformerType: "returnValue",
            //   label: "initParametersForTest",
            //   "interpolation": "runtime",
            //   value: initParametersForTest,
            // } as any, // TODO: fix type
            params: {
              transformerType: "createObject",
              label: "initParametersForTest",
              definition: {
                // transformerType: "returnValue",
                // "interpolation": "runtime",
                // value: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referenceName: "initParametersForTest",
                // },
              }
            } as any, // TODO: fix type
            // params: {
            //   transformerType: "getFromParameters",
            //   label: "initParametersForTest",
            //   // value: initParametersForTest,
            //   referenceName: "initParametersForTest",
            // } as any, // TODO: fix type
          },
        },
        {
          actionType: "commit", // in the case where initModel has a model attribute
          actionLabel: "refreshLocalCacheForApplication",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            },
          },
        },
        {
          actionType: "rollback",
          actionLabel: "refreshLocalCacheForApplication",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            },
          },
        },
        {
          actionType: "createEntity",
          actionLabel: "CreateApplicationStoreEntities",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            },
            entities: appEntitesAndInstances,
          },
        },
        {
          actionType: "commit",
          actionLabel: "CommitApplicationStoreEntities",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            },
          },
        },
        {
          actionType: "createInstance",
          actionLabel: "CreateApplicationStoreInstances",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            } as any,
            applicationSection: "data",
            objects: appEntitesAndInstances,
          },
        },
      ],
    },
  };

  // Combine all three composite actions into one
  const combinedCompositeActionTemplate: CompositeActionTemplate = {
    actionType: "compositeActionSequence",
    actionLabel: "createApplicationAndDeployment",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      templates: {
        testSelfApplicationUuid,
        testApplicationUuid: testSelfApplicationUuid, // for backward compatibility with the original version of initParametersForTest
        testApplicationModelBranchUuid: {
          transformerType: "generateUuid",
        },
        testApplicationVersionUuid: {
          transformerType: "generateUuid",
        },
        prefix: {
          transformerType: "ifThenElse",
          if: {
            transformerType: "boolExpr",
            operator: "==",
            left: {
              transformerType: "getFromParameters",
              safe: true,
              referencePath: ["env", "NODE_ENV"],
            },
            right: "development",
          },
          then: {
            transformerType: "getFromParameters",
            referencePath: ["devRelativePathPrefix"],
          },
          else: {
            transformerType: "getFromParameters",
            referencePath: ["prodRelativePathPrefix"],
          },
        },
        testSelfApplication: {
          transformerType: "createObject",
          definition: {
            uuid: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            },
            parentName: "AdminApplication",
            parentUuid: "a659d350-dd97-4da9-91de-524fa01745dc",
            name: {
              transformerType: "mustacheStringTemplate",
              definition: `{{createApplicationAndDeployment.applicationName}}`,
            },
            defaultLabel: {
              transformerType: "mustacheStringTemplate",
              definition: `The {{createApplicationAndDeployment.applicationName}} Application.`,
            },
            description: {
              transformerType: "mustacheStringTemplate",
              definition: `This Application contains the {{createApplicationAndDeployment.applicationName}} model and data.`,
            },
            selfApplication: {
              transformerType: "getFromParameters",
              referencePath: ["createApplicationAndDeployment", "newApplicationUuid"],
            },
          },
        },
        initParametersForTest: {
          transformerType: "createObject",
          definition: {
            dataStoreType: "app",
            selfApplication: {
              transformerType: "getFromContext",
              interpolation: "runtime",
              referencePath: ["testSelfApplication"],
            },
            applicationModelBranch: {
              transformerType: "createObject",
              definition: {
                parentName: "ApplicationModelBranch",
                parentUuid: "cdb0aec6-b848-43ac-a058-fe2dbe5811f1",
                uuid: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["testApplicationModelBranchUuid"],
                },
                name: "master",
                selfApplication: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["testApplicationUuid"],
                },
                headVersion: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["testApplicationVersionUuid"],
                },
                description: {
                  transformerType: "mustacheStringTemplate",
                  interpolation: "build",
                  definition:
                    "The master branch of the {{createApplicationAndDeployment.applicationName}} SelfApplication",
                },
              },
            },
            applicationVersion: {
              transformerType: "createObject",
              definition: {
                parentName: "ApplicationVersion",
                parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
                name: "Initial",
                uuid: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["testApplicationVersionUuid"],
                },
                selfApplication: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["testApplicationUuid"],
                },
                branch: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["testApplicationModelBranchUuid"],
                },
                description: {
                  transformerType: "mustacheStringTemplate",
                  interpolation: "build",
                  definition:
                    "Initial {{createApplicationAndDeployment.applicationName}} selfApplication version",
                },
                modelStructureMigration: {
                  transformerType: "returnValue",
                  value: [],
                },
                modelCUDMigration: {
                  transformerType: "returnValue",
                  value: [],
                },
              },
            },
          },
        },
        sqltestDeploymentStorageConfigurationTemplate: {
          transformerType: "case",
          discriminator: {
            transformerType: "getFromParameters",
            referencePath: [
              "createApplicationAndDeployment",
              "applicationStorage",
              "emulatedServerType",
            ],
          },
          whens: [
            {
              when: "mongodb",
              then: {
                transformerType: "createObject",
                definition: {
                  admin: {
                    emulatedServerType: "mongodb",
                    connectionString: {
                      transformerType: "getFromParameters",
                      referencePath: [
                        "createApplicationAndDeployment",
                        "applicationStorage",
                        "connectionString",
                      ],
                    },
                    database: "miroirAdmin",
                  },
                  model: {
                    emulatedServerType: "mongodb",
                    connectionString: {
                      transformerType: "getFromParameters",
                      referencePath: [
                        "createApplicationAndDeployment",
                        "applicationStorage",
                        "connectionString",
                      ],
                    },
                    database: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromParameters",
                          referencePath: [
                            "createApplicationAndDeployment",
                            "applicationName",
                          ],
                        },
                      ],
                    },
                  },
                  data: {
                    emulatedServerType: "mongodb",
                    connectionString: {
                      transformerType: "getFromParameters",
                      referencePath: [
                        "createApplicationAndDeployment",
                        "applicationStorage",
                        "connectionString",
                      ],
                    },
                    database: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromParameters",
                          referencePath: [
                            "createApplicationAndDeployment",
                            "applicationName",
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
            {
              when: "sql",
              then: {
                transformerType: "createObject",
                definition: {
                  admin: {
                    emulatedServerType: "sql",
                    connectionString: {
                      transformerType: "getFromParameters",
                      referencePath: [
                        "createApplicationAndDeployment",
                        "applicationStorage",
                        "connectionString",
                      ],
                    },
                    schema: "miroirAdmin",
                  },
                  model: {
                    emulatedServerType: "sql",
                    forceNullOptionalAttributeToUndefined: true,
                    connectionString: {
                      transformerType: "getFromParameters",
                      referencePath: [
                        "createApplicationAndDeployment",
                        "applicationStorage",
                        "connectionString",
                      ],
                    },
                    schema: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromParameters",
                          referencePath: [
                            "createApplicationAndDeployment",
                            "applicationName",
                          ],
                        },
                      ],
                    },
                  },
                  data: {
                    emulatedServerType: "sql",
                    forceNullOptionalAttributeToUndefined: true,
                    connectionString: {
                      transformerType: "getFromParameters",
                      referencePath: [
                        "createApplicationAndDeployment",
                        "applicationStorage",
                        "connectionString",
                      ],
                    },
                    schema: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromParameters",
                          referencePath: [
                            "createApplicationAndDeployment",
                            "applicationName",
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
            {
              when: "indexedDb",
              then: {
                transformerType: "createObject",
                definition: {
                  admin: {
                    emulatedServerType: "indexedDb",
                    indexedDbName: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromContext",
                          interpolation: "runtime",
                          referencePath: ["prefix"],
                        },
                        "admin",
                      ],
                    },
                  },
                  model: {
                    emulatedServerType: "indexedDb",
                    indexedDbName: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromContext",
                          interpolation: "runtime",
                          referencePath: ["prefix"],
                        },
                        {
                          transformerType: "getFromParameters",
                          referencePath: [
                            "createApplicationAndDeployment",
                            "applicationName",
                          ],
                        },
                      ],
                    },
                  },
                  data: {
                    emulatedServerType: "indexedDb",
                    indexedDbName: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromContext",
                          interpolation: "runtime",
                          referencePath: ["prefix"],
                        },
                        {
                          transformerType: "getFromParameters",
                          referencePath: [
                            "createApplicationAndDeployment",
                            "applicationName",
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
            {
              when: "filesystem",
              then: {
                transformerType: "createObject",
                definition: {
                  admin: {
                    emulatedServerType: "filesystem",
                    directory: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromContext",
                          interpolation: "runtime",
                          referencePath: ["prefix"],
                        },
                        "admin",
                      ],
                    },
                  },
                  model: {
                    emulatedServerType: "filesystem",
                    directory: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromContext",
                          interpolation: "runtime",
                          referencePath: ["prefix"],
                        },
                        {
                          transformerType: "getFromParameters",
                          referencePath: [
                            "createApplicationAndDeployment",
                            "applicationName",
                          ],
                        },
                      ],
                    },
                  },
                  data: {
                    emulatedServerType: "filesystem",
                    directory: {
                      transformerType: "+",
                      args: [
                        {
                          transformerType: "getFromContext",
                          interpolation: "runtime",
                          referencePath: ["prefix"],
                        },
                        {
                          transformerType: "getFromParameters",
                          referencePath: [
                            "createApplicationAndDeployment",
                            "applicationName",
                          ],
                        },
                      ],
                    },
                  },
                },
              },
            },
          ],
          else: {
            transformerType: "createObject",
            definition: {
              admin: {
                emulatedServerType: "filesystem",
                directory: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["prefix"],
                },
              },
              model: {
                emulatedServerType: "filesystem",
                directory: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["prefix"],
                },
              },
              data: {
                emulatedServerType: "filesystem",
                directory: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["prefix"],
                },
              },
            },
          },
        },
        // sqltestDeploymentStorageConfigurationTemplate: {
        //   transformerType: "case",
        //   discriminator: {
        //     transformerType: "getFromParameters",
        //     referencePath: [
        //       "createApplicationAndDeployment",
        //       "applicationStorage",
        //       "emulatedServerType",
        //     ],
        //   },
        //   whens: [
        //     // mongodb
        //     {
        //       when: "mongodb",
        //       then: {
        //         admin: {
        //           emulatedServerType: "mongodb",
        //           connectionString: {
        //             transformerType: "getFromParameters",
        //             referencePath: [
        //               "createApplicationAndDeployment",
        //               "applicationStorage",
        //               "connectionString",
        //             ],
        //           },
        //           database: "miroirAdmin",
        //         },
        //         model: {
        //           emulatedServerType: "mongodb",
        //           connectionString: {
        //             transformerType: "getFromParameters",
        //             referencePath: [
        //               "createApplicationAndDeployment",
        //               "applicationStorage",
        //               "connectionString",
        //             ],
        //           },
        //           database: {
        //             transformerType: "+",
        //             args: [
        //               {
        //                 transformerType: "mustacheStringTemplate",
        //                 definition:
        //                   "{{createApplicationAndDeployment.applicationName}}",
        //               },
        //             ],
        //           },
        //         },
        //         data: {
        //           emulatedServerType: "mongodb",
        //           connectionString: {
        //             transformerType: "getFromParameters",
        //             referencePath: [
        //               "createApplicationAndDeployment",
        //               "applicationStorage",
        //               "connectionString",
        //             ],
        //           },
        //           database: {
        //             transformerType: "+",
        //             args: [
        //               {
        //                 transformerType: "mustacheStringTemplate",
        //                 definition:
        //                   "{{createApplicationAndDeployment.applicationName}}",
        //               },
        //             ],
        //           },
        //         },
        //       },
        //     },
        //     // sql
        //     {
        //       when: "sql",
        //       then: {
        //         admin: {
        //           emulatedServerType: "sql",
        //           connectionString: {
        //             transformerType: "getFromParameters",
        //             referencePath: [
        //               "createApplicationAndDeployment",
        //               "applicationStorage",
        //               "connectionString",
        //             ],
        //           },
        //           schema: "miroirAdmin",
        //         },
        //         model: {
        //           emulatedServerType: "sql",
        //           connectionString: {
        //             transformerType: "getFromParameters",
        //             referencePath: [
        //               "createApplicationAndDeployment",
        //               "applicationStorage",
        //               "connectionString",
        //             ],
        //           },
        //           schema: {
        //             transformerType: "mustacheStringTemplate",
        //             definition:
        //               "{{createApplicationAndDeployment.applicationName}}",
        //           }, // TODO: separate model and data schemas
        //         },
        //         data: {
        //           emulatedServerType: "sql",
        //           connectionString: {
        //             transformerType: "getFromParameters",
        //             referencePath: [
        //               "createApplicationAndDeployment",
        //               "applicationStorage",
        //               "connectionString",
        //             ],
        //           },
        //           schema: {
        //             transformerType: "mustacheStringTemplate",
        //             definition:
        //               "{{createApplicationAndDeployment.applicationName}}",
        //           }, // TODO: separate model and data schemas
        //         },
        //       },
        //     },
        //     // indexedDb
        //     {
        //       when: "indexedDb",
        //       then: {
        //         admin: {
        //           emulatedServerType: "indexedDb",
        //           indexedDbName: {
        //             transformerType: "+",
        //             args: ["admin"],
        //           },
        //         },
        //         model: {
        //           emulatedServerType: "indexedDb",
        //           indexedDbName: {
        //             transformerType: "+",
        //             args: [
        //               {
        //                 transformerType: "getFromParameters",
        //                 referencePath: [
        //                   "createApplicationAndDeployment",
        //                   "applicationStorage",
        //                   "applicationName",
        //                 ],
        //               },
        //             ],
        //           },
        //         },
        //         data: {
        //           emulatedServerType: "indexedDb",
        //           indexedDbName: {
        //             transformerType: "+",
        //             args: [
        //               {
        //                 transformerType: "getFromParameters",
        //                 referencePath: [
        //                   "createApplicationAndDeployment",
        //                   "applicationStorage",
        //                   "applicationName",
        //                 ],
        //               },
        //             ],
        //           },
        //         },
        //       },
        //     },
        //     // filesystem
        //     {
        //       when: "filesystem",
        //       then: {
        //         admin: {
        //           emulatedServerType: "filesystem",
        //           directory: {
        //             transformerType: "+",
        //             args: [prefix, "/admin"],
        //           },
        //         },
        //         model: {
        //           emulatedServerType: "filesystem",
        //           directory: {
        //             transformerType: "+",
        //             args: [
        //               prefix,
        //               {
        //                 transformerType: "getFromParameters",
        //                 referencePath: [
        //                   "createApplicationAndDeployment",
        //                   "applicationStorage",
        //                   "applicationName",
        //                 ],
        //               },
        //             ],
        //           },
        //         },
        //         data: {
        //           emulatedServerType: "filesystem",
        //           directory: {
        //             transformerType: "+",
        //             args: [
        //               prefix,
        //               {
        //                 transformerType: "getFromParameters",
        //                 referencePath: [
        //                   "createApplicationAndDeployment",
        //                   "applicationStorage",
        //                   "applicationName",
        //                 ],
        //               },
        //             ],
        //           },
        //         },
        //       },
        //     },
        //   ],
        //   else: {
        //     // default: filesystem
        //     admin: {
        //       emulatedServerType: "filesystem",
        //       directory: defaultDirectory,
        //     },
        //     model: {
        //       emulatedServerType: "filesystem",
        //       directory: defaultDirectory,
        //     },
        //     data: {
        //       emulatedServerType: "filesystem",
        //       directory: defaultDirectory,
        //     },
        //   },
        // },
      },
      actionSequence: [
        ...(localCreateApplicationCompositeActionTemplate.payload.actionSequence as any),
        ...localCreateDeploymentCompositeActionTemplate.payload.actionSequence,
        ...localResetAndinitializeDeploymentCompositeActionTemplate.payload.actionSequence,
      ],
    },
  };
  return combinedCompositeActionTemplate;
}

// ################################################################################################

export function getRunner_CreateApplication(
  testSelfApplicationUuid: Uuid,
  testDeploymentUuid: Uuid,
  testApplicationName: string,
  initialMetaModel: MetaModel | undefined = undefined,
): Runner {
  return {
    uuid: uuidv4(),
    name: testApplicationName,
    defaultLabel: "Create Application (and Deployment)",
    parentUuid: "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd",
    application: testSelfApplicationUuid,
    definition: {
      runnerType: "customRunner",
      formMLSchema: Runner_CreateApplication_formMLSchema,
      actionTemplate: getCreateApplicationActionTemplate(
        prefix,
        testSelfApplicationUuid,
        testDeploymentUuid,
        testApplicationName,
        initialMetaModel,
      ),
    },
  };
};

export const runnerName: string = "createApplicationAndDeployment";

// ################################################################################################
export const Runner_CreateApplication: React.FC<CreateApplicationToolProps> = ({
  applicationDeploymentMap,
}) => {

  // State for MetaModel file upload
  // const [selectedMetaModel, setSelectedMetaModel] = useState<MetaModel | undefined>(undefined);
  const context = useMiroirContextService();

  // ##############################################################################################
  const runnerDeploymentUuid = useMemo(() => {
    // Find deployment UUID from applicationDeploymentMap
    const deploymentUuid = applicationDeploymentMap[applicationDeploymentMap ? Object.keys(applicationDeploymentMap)[0] : ""];
    return deploymentUuid || "";
  }, [applicationDeploymentMap]);
  // File selection handler

  // ##############################################################################################
  const miroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    selfApplicationMiroir.uuid,
    defaultSelfApplicationDeploymentMap
  );
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
        getMemoizedReduxDeploymentsStateSelectorMap();
  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        defaultSelfApplicationDeploymentMap,
        () => ({}),
        miroirModelEnvironment,
      )
  );

  const testSelfApplicationUuid = uuidv4();
  const testDeploymentUuid = uuidv4();

  const runner = useMemo(
    () => getRunner_CreateApplication(testSelfApplicationUuid, testDeploymentUuid, "shouldGetApplicationNameFromFormik"),
    [testSelfApplicationUuid, testDeploymentUuid],
  );


  const defaultViewParamsFromAdminStorageFetchQueryResults: Record<string, EntityInstancesUuidIndex> =
    useReduxDeploymentsStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        ReduxDeploymentsState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      defaultViewParamsFromAdminStorageFetchQueryParams(deploymentEntityStateSelectorMap),
      applicationDeploymentMap,
    );
  
  const viewParams: ViewParams | undefined = defaultViewParamsFromAdminStorageFetchQueryResults?.[
    "viewParams"
  ] as any;
  // const formMLSchema: FormMLSchema = (runner.definition as any).formMLSchema as FormMLSchema;
  const formMLSchema: FormMLSchema = (runner.definition as any).formMLSchema.formMLSchemaType === "transformer"
      ? {
        formMLSchemaType: "mlSchema",
        mlSchema: transformer_extended_apply_wrapper(
          context.miroirContext?.miroirActivityTracker,
          "build",
          [],
          "resolving formMLSchema transformer",
          (runner.definition as any).formMLSchema.transformer as CoreTransformerForBuildPlusRuntime,
        defaultMiroirModelEnvironment,
        {
          // ...(viewParams || {}),
          // viewParams: viewParams || {},
        },
        {
          // viewParams: viewParams || {},
        },
        "value",
      ) as JzodObject}
      : (runner.definition as any).formMLSchema;

  const initialFormValue = useMemo(
    () => ({
      createApplicationAndDeployment: {
        applicationStorage: {
          ...getDefaultValueForJzodSchemaWithResolutionNonHook(
            "build",
            // (formMLSchema as any).mlSchema,
            formMLSchema.formMLSchemaType === "mlSchema" ? formMLSchema.mlSchema : { type: "object", definition: {} },
            undefined, // rootObject
            "", // rootLessListKey,
            undefined, // No need to pass currentDefaultValue here
            [], // currentPath on value is root
            false, // forceOptional
            noValue.uuid, // storedRunner.application,
            defaultSelfApplicationDeploymentMap,
            runnerDeploymentUuid,
            miroirModelEnvironment,
            {}, // transformerParams
            {}, // contextResults
            deploymentEntityState, // TODO: keep this? improve so that it does not depend on entire deployment state
          // ),
          // ).createApplicationAndDeployment,
          ).createApplicationAndDeployment.applicationStorage,
        },
        newApplicationUuid: testSelfApplicationUuid,
        deploymentUuid: testDeploymentUuid,
        applicationName: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
      },
    }),
    [testSelfApplicationUuid],
  );

  let applicationDeploymentMapWithNewApplication: ApplicationDeploymentMap = {};


  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  const createApplicationActionTemplate = useMemo(
    (): CompositeActionTemplate =>
      (runner.definition as any).actionTemplate as CompositeActionTemplate,
    [runner],
  );

  applicationDeploymentMapWithNewApplication = {
    ...applicationDeploymentMap,
    [testSelfApplicationUuid]: testDeploymentUuid,
  };

  // // ##############################################################################################
  // // Validation transformer: checks that applicationName is defined and non-empty
  // const validationTransformer: TransformerForBuildPlusRuntime = useMemo(
  //   () => ({
  //     // transformerType: "returnValue",
  //     // label: "createApplicationAndDeploymentValidation",
  //     // value: "this is an error message that should be replaced by the actual validation logic",
  //     // value: false
  //     transformerType: "!=",
  //     label: "createApplicationAndDeploymentValidation",
  //     left: {
  //       transformerType: "getFromParameters",
  //       referencePath: [
  //         "createApplicationAndDeployment",
  //         "applicationStorage",
  //         "applicationName",
  //       ],
  //     },
  //     right: {
  //       transformerType: "returnValue",
  //       value: "",
  //     },
  //     then: true,
  //     else: "Application Name must not be empty",
  //     // else: true,
  //   }), 
  //   []
  // );

  return (
    <>
      {/* Model File Upload Section */}
      {/* <FileSelector
        title="Optional: Load Custom Model"
        description="Upload a JSON file containing an Application Model to install. If no file is selected, the Model will be empty."
        buttonLabel="Select Model JSON"
        accept=".json"
        setSelectedFileContents={setSelectedMetaModel}
        setSelectedFileError={setFileError}
        setSelectedFileName={setSelectedFileName}
        selectedFileName={selectedFileName}
        error={fileError}
        successMessage={
          selectedMetaModel
            ? `MetaModel loaded successfully with ${selectedMetaModel?.entities?.length || 0} entities and ${selectedMetaModel?.entityDefinitions?.length || 0} entity definitions.`
            : undefined
        }
      /> */}

      <RunnerView
        runnerName={runnerName}
        applicationDeploymentMap={applicationDeploymentMapWithNewApplication}
        formMLSchema={formMLSchema}
        initialFormValue={initialFormValue}
        action={{
          actionType: "compositeActionTemplate",
          compositeActionTemplate: createApplicationActionTemplate,
        }}
        formikValuePathAsString="createApplicationAndDeployment"
        formLabel="Create Application (and Deployment)"
        displaySubmitButton="onFirstLine"
        useActionButton={false}
      />
    </>
  );
};

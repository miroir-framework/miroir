import { useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';

import type {
  ApplicationDeploymentMap,
  CompositeActionSequence,
  CompositeActionTemplate,
  Deployment,
  InitApplicationParameters,
  LoggerInterface,
  MetaModel,
  MiroirModelEnvironment,
  ReduxDeploymentsState,
  ReduxStateWithUndoRedo,
  Runner,
  SyncBoxedExtractorOrQueryRunnerMap,
  TransformerForBuildPlusRuntime,
  Uuid
} from "miroir-core";
import {
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  formatYYYYMMDD_HHMMSS,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  MiroirLoggerFactory,
  noValue,
  selfApplicationMiroir
} from "miroir-core";
import {
  transformer,
  type AdminApplication
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getMemoizedReduxDeploymentsStateSelectorMap, useSelector } from "miroir-react";
import {
  entityDeployment
} from "miroir-test-app_deployment-admin";
import {
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-test-app_deployment-library";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { devRelativePathPrefix, prodRelativePathPrefix } from '../Themes/FileSelector.js';
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
  formMLSchemaType: "mlSchema",
  mlSchema: {
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
                  applicationName: {
                    type: "string",
                    tag: {
                      value: {
                        defaultLabel: "Application Folder Path",
                        editorButton: {
                          label: "generate name with timestamp",
                          // transformer: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
                          transformer: {
                            transformerType: "returnValue",
                            value: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
                            // definition: {
                            //   transformerType: "mapList",
                            //   elementTransformer: {
                            //     transformerType: "getFromContext",
                            //     referenceName: "originTransformer",
                            //   },
                            // },
                          },
                        },
                        // display: {
                        //   string: {
                        //     format: "folder",
                        //   }
                        // }
                      },
                    },
                  },
                },
              },
              filesystemDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "filesystem" },
                  applicationName: {
                    type: "string",
                    tag: {
                      value: {
                        defaultLabel: "Application Folder Path",
                        display: {
                          string: {
                            format: "folder",
                          },
                        },
                      },
                    },
                  },
                },
              },
              sqlDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "sql" },
                  connectionString: { type: "string" },
                  applicationName: {
                    type: "string",
                    tag: {
                      value: {
                        defaultLabel: "Application Schema Name",
                        initializeTo: {
                          initializeToType: "value",
                          value: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
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
                  connectionString: { type: "string" },
                  applicationName: {
                    type: "string",
                    tag: {
                      value: {
                        defaultLabel: "Database Name",
                        initializeTo: {
                          initializeToType: "value",
                          value: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
                        },
                      },
                    },
                  },
                },
              },
              storeSectionConfiguration: {
                type: "union",
                discriminator: "emulatedServerType",
                definition: [
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath: "indexedDbStoreSectionConfiguration",
                    },
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath: "filesystemDbStoreSectionConfiguration",
                    },
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath: "sqlDbStoreSectionConfiguration",
                    },
                  },
                  {
                    type: "schemaReference",
                    definition: {
                      relativePath: "mongoDbStoreSectionConfiguration",
                    },
                  },
                ],
              },
            },
            definition: {
              relativePath: "storeSectionConfiguration",
            },
          },
          // applicationName: {
          //   type: "string",
          //   tag: {
          //     value: {
          //       defaultLabel: "Application Name or Folder Path",
          //     },
          //   },
          // },
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
  //                   "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
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
  //                   "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
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
  //             definition: "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
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
  //             definition: "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
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
  //       definition: "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
  //     } as any,
  //     defaultLabel: {
  //       transformerType: "mustacheStringTemplate",
  //       definition:
  //         "The {{createApplicationAndDeployment.applicationStorage.applicationName}} selfApplication",
  //     } as any,
  //     description: {
  //       transformerType: "mustacheStringTemplate",
  //       definition:
  //         "The model and data of the {{createApplicationAndDeployment.applicationStorage.applicationName}} selfApplication",
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
  //         "The master branch of the {{createApplicationAndDeployment.applicationStorage.applicationName}} SelfApplication",
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
  //         "Initial {{createApplicationAndDeployment.applicationStorage.applicationName}} selfApplication version",
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
                  referenceName: "testSelfApplicationUuid",
                } as any,
                parentName: "AdminApplication",
                parentUuid: "25d935e7-9e93-42c2-aade-0472b883492b",
                name: {
                  transformerType: "mustacheStringTemplate",
                  definition: `{{createApplicationAndDeployment.applicationStorage.applicationName}}`,
                } as any,
                defaultLabel: {
                  transformerType: "mustacheStringTemplate",
                  definition: `The {{createApplicationAndDeployment.applicationStorage.applicationName}} Application.`,
                } as any,
                description: {
                  transformerType: "mustacheStringTemplate",
                  definition: `This Application contains the {{createApplicationAndDeployment.applicationStorage.applicationName}} model and data.`,
                } as any,
                selfApplication: {
                  transformerType: "getFromParameters",
                  referenceName: "testSelfApplicationUuid",
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
              referenceName: "testSelfApplicationUuid",
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
              referenceName: "testSelfApplicationUuid",
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
                  definition: `Deployment of application {{createApplicationAndDeployment.applicationStorage.applicationName}}`,
                } as any,
                defaultLabel: {
                  transformerType: "mustacheStringTemplate",
                  definition: `The deployment of application {{createApplicationAndDeployment.applicationStorage.applicationName}}`,
                } as any,
                description: {
                  transformerType: "mustacheStringTemplate",
                  definition: `The description of deployment of application {{createApplicationAndDeployment.applicationStorage.applicationName}}`,
                } as any,
                selfApplication: {
                  transformerType: "getFromParameters",
                  referenceName: "testSelfApplicationUuid",
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
              referenceName: "testSelfApplicationUuid",
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
            definition: "resetAndInitializeDeployment_initModel_{{testSelfApplicationUuid}}"
          } as any,
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: {
              transformerType: "getFromParameters",
              referenceName: "testSelfApplicationUuid",
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
                transformerType: "returnValue",
                "interpolation": "runtime",
                value: {
                  transformerType: "getFromParameters",
                  referenceName: "initParametersForTest",
                },
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
              referenceName: "testSelfApplicationUuid",
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
              referenceName: "testSelfApplicationUuid",
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
              referenceName: "testSelfApplicationUuid",
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
              referenceName: "testSelfApplicationUuid",
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
              referenceName: "testSelfApplicationUuid",
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
        testApplicationModelBranchUuid: {
          transformerType: "generateUuid",
        },
        testApplicationVersionUuid: {
          transformerType: "generateUuid",
        },
        initParametersForTest: {
          dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
          // metaModel: {
          //   transformerType: "returnValue",
          //   value: defaultMiroirMetaModel,
          // },
          selfApplication: {
            ...selfApplicationLibrary,
            uuid: {
              // transformerType: "getFromParameters",
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "testSelfApplicationUuid",
            } as any,
            name: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
            } as any,
            defaultLabel: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition:
                "The {{createApplicationAndDeployment.applicationStorage.applicationName}} selfApplication",
            } as any,
            description: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition:
                "The model and data of the {{createApplicationAndDeployment.applicationStorage.applicationName}} selfApplication",
            } as any,
          },
          applicationModelBranch: {
            // NOT USED!!
            ...selfApplicationModelBranchLibraryMasterBranch,
            uuid: {
              // transformerType: "getFromParameters",
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "testApplicationModelBranchUuid",
            },
            selfApplication: {
              // transformerType: "getFromParameters",
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "testSelfApplicationUuid",
            },
            headVersion: {
              // transformerType: "getFromParameters",
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "testApplicationVersionUuid",
            },
            description: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition:
                "The master branch of the {{createApplicationAndDeployment.applicationStorage.applicationName}} SelfApplication",
            },
          } as any,
          applicationVersion: {
            // NOT USED!!
            ...selfApplicationVersionLibraryInitialVersion,
            uuid: {
              // transformerType: "getFromParameters",
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "testApplicationVersionUuid",
            },
            selfApplication: {
              // transformerType: "getFromParameters",
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "testSelfApplicationUuid",
            },
            branch: {
              // transformerType: "getFromParameters",
              transformerType: "getFromContext",
              interpolation: "runtime",
              referenceName: "testApplicationModelBranchUuid",
            },
            description: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition:
                "Initial {{createApplicationAndDeployment.applicationStorage.applicationName}} selfApplication version",
            },
          } as any,
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
            // mongodb
            {
              when: "mongodb",
              then: {
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
                        transformerType: "mustacheStringTemplate",
                        definition:
                          "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
                      },
                      "_model",
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
                        transformerType: "mustacheStringTemplate",
                        definition:
                          "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
                      },
                      "_data",
                    ],
                  },
                },
              },
            },
            // sql
            {
              when: "sql",
              then: {
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
                  connectionString: {
                    transformerType: "getFromParameters",
                    referencePath: [
                      "createApplicationAndDeployment",
                      "applicationStorage",
                      "connectionString",
                    ],
                  },
                  schema: {
                    transformerType: "mustacheStringTemplate",
                    definition:
                      "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
                  }, // TODO: separate model and data schemas
                },
                data: {
                  emulatedServerType: "sql",
                  connectionString: {
                    transformerType: "getFromParameters",
                    referencePath: [
                      "createApplicationAndDeployment",
                      "applicationStorage",
                      "connectionString",
                    ],
                  },
                  schema: {
                    transformerType: "mustacheStringTemplate",
                    definition:
                      "{{createApplicationAndDeployment.applicationStorage.applicationName}}",
                  }, // TODO: separate model and data schemas
                },
              },
            },
            // indexedDb
            {
              when: "indexedDb",
              then: {
                admin: {
                  emulatedServerType: "indexedDb",
                  indexedDbName: {
                    transformerType: "+",
                    args: ["admin"],
                  },
                },
                model: {
                  emulatedServerType: "indexedDb",
                  indexedDbName: {
                    transformerType: "+",
                    args: [
                      {
                        transformerType: "getFromParameters",
                        referencePath: [
                          "createApplicationAndDeployment",
                          "applicationStorage",
                          "applicationName",
                        ],
                      },
                      "_model",
                    ],
                  },
                },
                data: {
                  emulatedServerType: "indexedDb",
                  indexedDbName: {
                    transformerType: "+",
                    args: [
                      {
                        transformerType: "getFromParameters",
                        referencePath: [
                          "createApplicationAndDeployment",
                          "applicationStorage",
                          "applicationName",
                        ],
                      },
                      "_data",
                    ],
                  },
                },
              },
            },
            // filesystem
            {
              when: "filesystem",
              then: {
                admin: {
                  emulatedServerType: "filesystem",
                  directory: {
                    transformerType: "+",
                    args: [prefix, "/admin"],
                  },
                },
                model: {
                  emulatedServerType: "filesystem",
                  directory: {
                    transformerType: "+",
                    args: [
                      prefix,
                      {
                        transformerType: "getFromParameters",
                        referencePath: [
                          "createApplicationAndDeployment",
                          "applicationStorage",
                          "applicationName",
                        ],
                      },
                      "_model",
                    ],
                  },
                },
                data: {
                  emulatedServerType: "filesystem",
                  directory: {
                    transformerType: "+",
                    args: [
                      prefix,
                      {
                        transformerType: "getFromParameters",
                        referencePath: [
                          "createApplicationAndDeployment",
                          "applicationStorage",
                          "applicationName",
                        ],
                      },
                      "_data",
                    ],
                  },
                },
              },
            },
          ],
          else: {
            // default: filesystem
            admin: {
              emulatedServerType: "filesystem",
              directory: defaultDirectory,
            },
            model: {
              emulatedServerType: "filesystem",
              directory: defaultDirectory,
            },
            data: {
              emulatedServerType: "filesystem",
              directory: defaultDirectory,
            },
          },
        },
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

  const formMLSchema: FormMLSchema = (runner.definition as any).formMLSchema as FormMLSchema;

  const initialFormValue = useMemo(
    () => ({
      createApplicationAndDeployment: {
        applicationStorage: {
          ...getDefaultValueForJzodSchemaWithResolutionNonHook(
            "build",
            (formMLSchema as any).mlSchema,
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
          ).createApplicationAndDeployment.applicationStorage,
          // applicationName: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
        }
      },
    }),
    [],
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

import { useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';

import type {
  ApplicationDeploymentMap,
  CompositeActionSequence,
  CompositeActionTemplate,
  Deployment,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstancesUuidIndex,
  InitApplicationParameters,
  LoggerInterface,
  MiroirModelEnvironment,
  ReduxDeploymentsState,
  ReduxStateWithUndoRedo,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  TransformerForBuildPlusRuntime,
  ViewParams
} from "miroir-core";
import {
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  defaultViewParamsFromAdminStorageFetchQueryParams,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  MiroirLoggerFactory,
  noValue,
  selfApplicationMiroir
} from "miroir-core";
import {
  type AdminApplication
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { getMemoizedReduxDeploymentsStateSelectorMap, useSelector } from "miroir-react";
import {
  adminSelfApplication,
  entityApplicationForAdmin,
  entityDeployment,
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
import { DebugHelper } from "../Page/DebugHelper.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_CreateApplication"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
function formatYYYYMMDD_HHMMSS(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${MM}${dd}_${HH}${mm}${ss}`;
}

// ################################################################################################
export interface DeployApplicationRunnerProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}

// ################################################################################################
export const Runner_InstallApplication: React.FC<DeployApplicationRunnerProps> = ({
  applicationDeploymentMap,
}) => {
  const runnerName: string = "deployApplication";

  // ##############################################################################################
  const runnerDeploymentUuid = useMemo(() => {
    // Find deployment UUID from applicationDeploymentMap
    const deploymentUuid =
      applicationDeploymentMap[
        applicationDeploymentMap ? Object.keys(applicationDeploymentMap)[0] : ""
      ];
    return deploymentUuid || "";
  }, [applicationDeploymentMap]);

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

  const formMLSchema: FormMLSchema = useMemo(
    () => ({
      formMLSchemaType: "mlSchema",
      mlSchema: {
        type: "object",
        definition: {
          deployApplication: {
            type: "object",
            definition: {
              applicationBundle: {
                type: "any",
                optional: true,
                tag: {
                  value: {
                    defaultLabel: "Application Bundle",
                    display: {
                      any: {
                        format: "file",
                      },
                    },
                    initializeTo: {
                      initializeToType: "value",
                      value: "",
                    },
                    formValidation: {
                      transformer: {
                        // Application bundle required: must be present with applicationName, entities, and entityDefinitions.
                        transformerType: "ifThenElse",
                        label: "applicationBundleValidation",
                        if: {
                          transformerType: "boolExpr",
                          operator: "&&",
                          left: {
                            transformerType: "boolExpr",
                            operator: "&&",
                            left: {
                              transformerType: "boolExpr",
                              operator: "&&",
                              left: {
                                transformerType: "boolExpr",
                                operator: "isNotNull",
                                left: {
                                  transformerType: "getFromParameters",
                                  safe: true,
                                  referencePath: ["deployApplication", "applicationBundle"],
                                },
                              },
                              right: {
                                transformerType: "boolExpr",
                                operator: "!=",
                                left: {
                                  transformerType: "getFromParameters",
                                  safe: true,
                                  referencePath: ["deployApplication", "applicationBundle", "applicationName"],
                                },
                                right: {
                                  transformerType: "returnValue",
                                  value: "",
                                },
                              },
                            },
                            right: {
                              transformerType: "boolExpr",
                              operator: "isNotNull",
                              left: {
                                transformerType: "getFromParameters",
                                safe: true,
                                referencePath: ["deployApplication", "applicationBundle", "entities"],
                              },
                            },
                          },
                          right: {
                            transformerType: "boolExpr",
                            operator: "isNotNull",
                            left: {
                              transformerType: "getFromParameters",
                              safe: true,
                              referencePath: ["deployApplication", "applicationBundle", "entityDefinitions"],
                            },
                          },
                        },
                        then: true,
                        else: "Provide a valid application bundle (applicationName, entities, entityDefinitions required).",
                      },
                    },
                  },
                },
              },
              deploymentData: {
                type: "any",
                optional: true,
                tag: {
                  value: {
                    defaultLabel: "Deployment Data",
                    display: {
                      any: {
                        format: "file",
                      },
                    },
                    initializeTo: {
                      initializeToType: "value",
                      value: "",
                    },
                    formValidation: {
                      transformer: {
                        // Data file is optional: null/empty passes; if present, instances and parentUuid required.
                        transformerType: "ifThenElse",
                        label: "deploymentDataValidation",
                        if: {
                          transformerType: "boolExpr",
                          operator: "||",
                          left: {
                            transformerType: "boolExpr",
                            operator: "isNull",
                            left: {
                              transformerType: "getFromParameters",
                              safe: true,
                              referencePath: ["deployApplication", "deploymentData"],
                            },
                          },
                          right: {
                            transformerType: "boolExpr",
                            operator: "&&",
                            left: {
                              transformerType: "boolExpr",
                              operator: "isNotNull",
                              left: {
                                transformerType: "getFromParameters",
                                safe: true,
                                referencePath: ["deployApplication", "deploymentData", "instances"],
                              },
                            },
                            right: {
                              transformerType: "boolExpr",
                              operator: "isNotNull",
                              left: {
                                transformerType: "getFromParameters",
                                safe: true,
                                referencePath: [
                                  "deployApplication",
                                  "deploymentData",
                                  "instances",
                                  "0",
                                  "parentUuid",
                                ],
                              },
                            },
                          },
                        },
                        then: true,
                        else: "If deployment data is provided, it must contain instances with parentUuid.",
                      },
                    },
                  },
                },
              },
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
                              initializeToType: "value",
                              value:
                                viewParams?.postgresConnectionString ||
                                "NO POSTGRES CONNECTION STRING IN VIEW PARAMS",
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
                              initializeToType: "value",
                              value:
                                viewParams?.mongoConnectionString ||
                                "NO MONGODB CONNECTION STRING IN VIEW PARAMS",
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
                      ...(viewParams?.postgresConnectionString
                        ? [
                            {
                              type: "schemaReference",
                              definition: {
                                relativePath: "sqlDbStoreSectionConfiguration",
                              },
                            },
                          ]
                        : []),
                      ...(viewParams?.mongoConnectionString
                        ? [
                            {
                              type: "schemaReference",
                              definition: {
                                relativePath: "mongoDbStoreSectionConfiguration",
                              },
                            },
                          ]
                        : []),
                    ] as any,
                  },
                },
                definition: {
                  relativePath: "storeSectionConfiguration",
                },
              },
            },
          },
        },
      },
    }),
    [],
  );

  const initialFormValue = useMemo(
    () => ({
      deployApplication: {
        ...getDefaultValueForJzodSchemaWithResolutionNonHook(
          "build",
          (formMLSchema as any).mlSchema,
          undefined, // rootObject
          "", // rootLessListKey,
          undefined, // No need to pass currentDefaultValue here
          [], // currentPath on value is root
          true, // forceOptional
          noValue.uuid, // storedRunner.application,
          defaultSelfApplicationDeploymentMap,
          runnerDeploymentUuid,
          miroirModelEnvironment,
          {}, // transformerParams
          {}, // contextResults
          deploymentEntityState, // TODO: keep this? improve so that it does not depend on entire deployment state
        ).deployApplication,
        applicationBundle: undefined,
        deploymentData: undefined,
      },
    }),
    [],
  );

  let applicationDeploymentMapWithNewApplication: ApplicationDeploymentMap = {};
  const testSelfApplicationUuid = selfApplicationLibrary.uuid;
  const testDeploymentUuid = uuidv4();
  const testApplicationModelBranchUuid = uuidv4();
  const testApplicationVersionUuid = uuidv4();
  applicationDeploymentMapWithNewApplication = {
    ...applicationDeploymentMap,
    [testSelfApplicationUuid]: testDeploymentUuid,
  };

  const prefix =
          process.env.NODE_ENV === "development" ? devRelativePathPrefix : prodRelativePathPrefix;

  const createApplicationActionTemplate = useMemo((): CompositeActionTemplate => {

  const defaultDirectory = "tmp/miroir_data_storage";

  const sqltestDeploymentStorageConfigurationTemplate: TransformerForBuildPlusRuntime = {
    transformerType: "case",
    discriminator: {
      transformerType: "getFromParameters",
      referencePath: ["deployApplication", "applicationStorage", "emulatedServerType"],
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
              referencePath: ["deployApplication", "applicationStorage", "connectionString"],
            },
            database: "miroirAdmin",
          },
          model: {
            emulatedServerType: "mongodb",
            connectionString: {
              transformerType: "getFromParameters",
              referencePath: ["deployApplication", "applicationStorage", "connectionString"],
            },
            database: {
              transformerType: "+",
              args: [
                {
                  transformerType: "getFromParameters",
                  referencePath: ["deployApplication", "applicationBundle", "applicationName"],
                },
                "_model",
              ],
            },
          },
          data: {
            emulatedServerType: "mongodb",
            connectionString: {
              transformerType: "getFromParameters",
              referencePath: ["deployApplication", "applicationStorage", "connectionString"],
            },
            database: {
              transformerType: "+",
              args: [
                {
                  transformerType: "getFromParameters",
                  referencePath: ["deployApplication", "applicationBundle", "applicationName"],
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
              referencePath: ["deployApplication", "applicationStorage", "connectionString"],
            },
            schema: "miroirAdmin",
          },
          model: {
            emulatedServerType: "sql",
            connectionString: {
              transformerType: "getFromParameters",
              referencePath: ["deployApplication", "applicationStorage", "connectionString"],
            },
            schema: {
              transformerType: "getFromParameters",
              referencePath: ["deployApplication", "applicationBundle", "applicationName"],
            }, // TODO: separate model and data schemas
          },
          data: {
            emulatedServerType: "sql",
            connectionString: {
              transformerType: "getFromParameters",
              referencePath: ["deployApplication", "applicationStorage", "connectionString"],
            },
            schema: {
              transformerType: "getFromParameters",
              referencePath: ["deployApplication", "applicationBundle", "applicationName"],
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
              args: [
                prefix,
                "admin",
              ],
            },
          },
          model: {
            emulatedServerType: "indexedDb",
            indexedDbName: {
              transformerType: "+",
              args: [
                prefix,
                {
                  transformerType: "getFromParameters",
                  referencePath: ["deployApplication", "applicationBundle", "applicationName"],
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
                // {
                //   transformerType: "getFromParameters",
                //   referencePath: [
                //     "deployApplication",
                //     "applicationStorage",
                //     "indexedDbName",
                //   ],
                // },
                // "/",
                prefix,
                {
                  transformerType: "getFromParameters",
                  referencePath: ["deployApplication", "applicationBundle", "applicationName"],
                },
                // {
                //   transformerType: "getFromParameters",
                //   referencePath: ["deployApplication", "applicationName"],
                // },
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
              args: [prefix, "admin"],
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
                  referencePath: ["deployApplication", "applicationBundle", "applicationName"],
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
                  referencePath: ["deployApplication", "applicationBundle", "applicationName"],
                },
                // {
                //   transformerType: "getFromParameters",
                //   referencePath: ["deployApplication", "applicationName"],
                // },
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
  };

    // const effectiveSelfApplication = {
    //   ...selfApplicationLibrary,
    //   uuid: testSelfApplicationUuid,
    //   name: {
    //     transformerType: "getFromParameters",
    //     referencePath: ["deployApplication", "applicationBundle", "applicationName"],
    //   } as any,
    //   defaultLabel: {
    //     transformerType: "mustacheStringTemplate",
    //     interpolation: "build",
    //     definition: "The {{deployApplication.applicationBundle.applicationName}} selfApplication",
    //   } as any,
    //   description: {
    //     transformerType: "mustacheStringTemplate",
    //     interpolation: "build",
    //     definition:
    //       "The model and data of the {{deployApplication.applicationBundle.applicationName}} selfApplication",
    //   } as any,
    // };
    const initParametersForTest: InitApplicationParameters = {
      dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
      // metaModel: defaultMiroirMetaModel,
      metaModel: {
        transformerType: "returnValue",
        label: "initParametersForTest",
        interpolation: "runtime",
        value: defaultMiroirMetaModel,
      } as any,
      // selfApplication: effectiveSelfApplication,
      selfApplication: {
        ...selfApplicationLibrary,
        uuid: testSelfApplicationUuid,
        name: {
          transformerType: "getFromParameters",
          referencePath: ["deployApplication", "applicationBundle", "applicationName"],
        } as any,
        defaultLabel: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition: "The {{deployApplication.applicationBundle.applicationName}} selfApplication",
        } as any,
        description: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition:
            "The model and data of the {{deployApplication.applicationBundle.applicationName}} selfApplication",
        } as any,
      },
      applicationModelBranch: {
        ...selfApplicationModelBranchLibraryMasterBranch,
        uuid: testApplicationModelBranchUuid,
        selfApplication: testSelfApplicationUuid,
        headVersion: testApplicationVersionUuid,
        description: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition:
            "The master branch of the {{deployApplication.applicationBundle.applicationName}} SelfApplication",
        },
      } as any,
      applicationVersion: {
        ...selfApplicationVersionLibraryInitialVersion,
        uuid: testApplicationVersionUuid,
        selfApplication: testSelfApplicationUuid,
        branch: testApplicationModelBranchUuid,
        description: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition:
            "Initial {{deployApplication.applicationBundle.applicationName}} selfApplication version",
        },
      } as any,
    };

    const localCreateApplicationCompositeActionTemplate: CompositeActionSequence = {
      actionType: "compositeActionSequence",
      actionLabel: "createApplicationForAdminAction",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: "NOT_USED_HERE",
        definition: [
          {
            actionType: "createInstance",
            actionLabel: "createApplicationForAdminAction_instances",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: adminSelfApplication.uuid,
              applicationSection: "data",
              parentUuid: entityApplicationForAdmin.uuid,
              objects: [
                {
                  parentName: entityApplicationForAdmin.name,
                  parentUuid: entityApplicationForAdmin.uuid,
                  applicationSection: "data",
                  instances: [
                    {
                      uuid: testSelfApplicationUuid,
                      parentName: entityApplicationForAdmin.name,
                      parentUuid: entityApplicationForAdmin.uuid,
                      name: {
                        transformerType: "getFromParameters",
                        referencePath: [
                          "deployApplication",
                          "applicationBundle",
                          "applicationName",
                        ],
                      } as any,
                      defaultLabel: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `The {{deployApplication.applicationBundle.applicationName}} Admin Application.`,
                      } as any,
                      description: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `This Admin Application contains the {{deployApplication.applicationBundle.applicationName}} model and data.`,
                      } as any,
                      selfApplication: testSelfApplicationUuid,
                    } as AdminApplication,
                  ],
                },
              ],
            },
          },
        ],
      },
    };

    const localCreateDeploymentCompositeActionTemplate: CompositeActionSequence = {
      actionType: "compositeActionSequence",
      actionLabel: "createDeployment",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: "NOT_USED_HERE",
        definition: [
          {
            actionType: "storeManagementAction_openStore",
            actionLabel: "storeManagementAction_openStore",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            payload: {
              application: testSelfApplicationUuid,
              deploymentUuid: testDeploymentUuid,
              configuration: {
                [testDeploymentUuid]: sqltestDeploymentStorageConfigurationTemplate as any,
              },
            },
          },
          {
            actionType: "storeManagementAction_createStore",
            actionLabel: "storeManagementAction_createStore",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            payload: {
              application: testSelfApplicationUuid,
              deploymentUuid: testDeploymentUuid,
              configuration: sqltestDeploymentStorageConfigurationTemplate as any,
            },
          },
          {
            actionType: "createInstance",
            actionLabel: "CreateDeploymentInstances",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: adminSelfApplication.uuid,
              applicationSection: "data",
              parentUuid: entityDeployment.uuid,
              objects: [
                {
                  parentName: "Deployment",
                  parentUuid: entityDeployment.uuid,
                  applicationSection: "data",
                  instances: [
                    {
                      uuid: testDeploymentUuid,
                      parentName: "Deployment",
                      parentUuid: entityDeployment.uuid,
                      name: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `Deployment of application {{deployApplication.applicationBundle.applicationName}}`,
                      } as any,
                      defaultLabel: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `The deployment of application {{deployApplication.applicationBundle.applicationName}}`,
                      } as any,
                      description: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `The description of deployment of application {{deployApplication.applicationBundle.applicationName}}`,
                      } as any,
                      selfApplication: testSelfApplicationUuid,
                      configuration: sqltestDeploymentStorageConfigurationTemplate as any,
                    } as Deployment,
                  ],
                },
              ],
            },
          },
        ],
      },
    };

    const appEntitesAndInstances: any[] = [];
    const localResetAndinitializeDeploymentCompositeActionTemplate: CompositeActionSequence = {
      actionType: "compositeActionSequence",
      actionLabel: "resetAndInitializeDeployment",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: "NOT_USED_IN_compositeActionSequence",
        definition: [
          {
            actionType: "resetModel",
            actionLabel: "resetApplicationStore",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              // TODO: remove!!
              transformerType: "mergeIntoObject",
              interpolation: "runtime",
              applyTo: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["deployApplication", "applicationBundle"],
              },
              definition: {
                transformerType: "createObject",
                definition: {
                  application: testSelfApplicationUuid,
                },
              },
            } as any,
          },
          {
            actionType: "initModel",
            actionLabel: "resetAndInitializeDeployment_initModel_" + testSelfApplicationUuid,
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: testSelfApplicationUuid,
              model: {
                transformerType: "returnValue",
                interpolation: "build",
                value: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
                  referencePath: ["deployApplication", "applicationBundle"],
                },
              } as any,
              params: initParametersForTest
              // params: {
              //   transformerType: "returnValue",
              //   label: "initParametersForTest",
              //   interpolation: "runtime",
              //   value: initParametersForTest,
              // } as any, // TODO: fix type
            },
          },
          {
            actionType: "commit", // in the case where initModel has a model attribute
            actionLabel: "commitApplicationModelToPersistentStore",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: testSelfApplicationUuid,
            },
          },
          {
            actionType: "rollback",
            actionLabel: "refreshLocalCacheForApplication",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: testSelfApplicationUuid,
            },
          },
          {
            actionType: "createEntity",
            actionLabel: "CreateApplicationStoreEntities",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: testSelfApplicationUuid,
              entities: appEntitesAndInstances,
            },
          },
          {
            actionType: "commit",
            actionLabel: "CommitApplicationStoreEntities",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: testSelfApplicationUuid,
            },
          },
          {
            actionType: "createInstance",
            actionLabel: "CreateApplicationStoreInstances",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: testSelfApplicationUuid,
              applicationSection: "data",
              parentUuid: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["deployApplication", "deploymentData", "instances", "parentUuid"],
              } as any,
              objects: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["deployApplication", "deploymentData", "instances"],
              } as any, // TODO: fix type
            },
          },
        ],
      },
    };

    // Combine all three composite actions into one
    const createApplicationActionTemplate: CompositeActionTemplate = {
      actionType: "compositeActionSequence",
      actionLabel: "deployApplication",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        application: "NOT_USED_IN_TEMPLATE",
        definition: [
          ...(localCreateApplicationCompositeActionTemplate.payload.definition as any),
          ...localCreateDeploymentCompositeActionTemplate.payload.definition,
          ...localResetAndinitializeDeploymentCompositeActionTemplate.payload.definition,
        ],
      },
    };

    return createApplicationActionTemplate;
  }, [
    applicationDeploymentMap,
    testApplicationModelBranchUuid,
    testDeploymentUuid,
    testSelfApplicationUuid,
    testApplicationVersionUuid,
  ]);

  // ##############################################################################################
  // Validation transformer: lightweight shape checks for uploaded files
  const validationTransformer: TransformerForBuildPlusRuntime = useMemo(
    () => ({
      // Model file required: bundle must be present with applicationName, entities, and entityDefinitions.
      // Data file optional: pass when null; if provided, must have valid instances with parentUuid.
      transformerType: "ifThenElse",
      label: "deployApplicationAndDeploymentDataValidation",
      if: true,
      // left: true,
        operator: "&&",
          operator: "&&",
            operator: "&&",
              operator: "isNotNull",
              operator: "!=",
            operator: "isNotNull",
          operator: "isNotNull",
      // // left: {
      // //   // All bundle fields must be valid (inner &&/!= return boolean directly, no then/else needed)
      // //   transformerType: "&&",
      // //   label: "applicationBundleValidation",
      // //   left: {
      // //     transformerType: "&&",
      // //     left: {
      // //       transformerType: "&&",
      // //       left: {
      // //         transformerType: "isNotNull",
      // //         left: {
      // //           transformerType: "getFromParameters",
      // //           safe: true,
      // //           referencePath: ["deployApplication", "applicationBundle"],
      // //         },
      // //       },
      // //       right: {
      // //         transformerType: "!=",
      // //         left: {
      // //           transformerType: "getFromParameters",
      // //           safe: true,
      // //           referencePath: ["deployApplication", "applicationBundle", "applicationName"],
      // //         },
      // //         right: {
      // //           transformerType: "returnValue",
      // //           value: "",
      // //         },
      // //       },
      // //     },
      // //     right: {
      // //       transformerType: "isNotNull",
      // //       left: {
      // //         transformerType: "getFromParameters",
      // //         safe: true,
      // //         referencePath: ["deployApplication", "applicationBundle", "entities"],
      // //       },
      // //     },
      // //   },
      // //   right: {
      // //     transformerType: "isNotNull",
      // //     left: {
      // //       transformerType: "getFromParameters",
      // //       safe: true,
      // //       referencePath: ["deployApplication", "applicationBundle", "entityDefinitions"],
      // //     },
      // //   },
      // // },
      // right: true,
      // // right: {
      // //   // Data file is optional: null deploymentData passes; if present, instances and parentUuid required.
      // //   // transformerType: "||",
      // //   // label: "deploymentDataValidation",
      // //   // left: {
      // //     transformerType: "isNotNull",
      // //     left: {
      // //       transformerType: "getFromParameters",
      // //       safe: true,
      // //       referencePath: ["deployApplication", "deploymentData"],
      // //     },
      // //   // },
      // //   // right: {
      // //   //   transformerType: "&&",
      // //   //   left: {
      // //   //     transformerType: "isNotNull",
      // //   //     left: {
      // //   //       transformerType: "getFromParameters",
      // //   //       safe: true,
      // //   //       referencePath: ["deployApplication", "deploymentData", "instances"],
      // //   //     },
      // //   //   },
      // //   //   right: {
      // //   //     transformerType: "isNotNull",
      // //   //     left: {
      // //   //       transformerType: "getFromParameters",
      // //   //       safe: true,
      // //   //       referencePath: ["deployApplication", "deploymentData", "instances", "0", "parentUuid"],
      // //   //     },
      // //   //   },
      // //   // },
      // // },
        then: true,
        else: "Validation failed: if deployment data is provided, it must contain instances with parentUuid.",
      },
      // else: "Validation failed: provide a valid application bundle (applicationName, entities, entityDefinitions required); deployment data is optional but must contain instances with parentUuid if provided.",
      else: "Validation failed: provide a valid application bundle (applicationName, entities, entityDefinitions required)",
    }),
    [],
  );

  return (
    <>
      <DebugHelper
        componentName="Create Application and Deployment"
        elements={[
          {
            label: "Form Values",
            data: {
              formMLSchema,
              initialFormValue,
              applicationDeploymentMapWithNewApplication,
              createApplicationActionTemplate,
              validationTransformer,
            },
          },
        ]}
      />
      <RunnerView
        runnerName={runnerName}
        applicationDeploymentMap={applicationDeploymentMapWithNewApplication}
        formMLSchema={formMLSchema}
        initialFormValue={initialFormValue}
        action={{
          actionType: "compositeActionTemplate",
          compositeActionTemplate: createApplicationActionTemplate,
        }}
        formikValuePathAsString="deployApplication"
        formLabel="Install Existing Application"
        displaySubmitButton="onFirstLine"
        useActionButton={false}
        validationTransformer={validationTransformer}
      />
    </>
  );
};

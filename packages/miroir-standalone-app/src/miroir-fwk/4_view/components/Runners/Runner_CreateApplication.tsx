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
  SyncBoxedExtractorOrQueryRunnerMap,
  TransformerForBuildPlusRuntime
} from "miroir-core";
import {
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  MiroirLoggerFactory,
  noValue,
  selfApplicationMiroir
} from "miroir-core";
import {
  type AdminApplication
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import {
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-test-app_deployment-library";
import { packageName } from "../../../../constants.js";
import { getMemoizedReduxDeploymentsStateSelectorMap, useSelector } from "../../../miroir-localcache-imports.js";
import { cleanLevel } from "../../constants.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { devRelativePathPrefix, FileSelector, prodRelativePathPrefix } from '../Themes/FileSelector.js';
import type { FormMLSchema } from "./RunnerInterface.js";
import { RunnerView } from "./RunnerView.js";
import {
  adminSelfApplication,
  entityApplicationForAdmin,
  entityDeployment,
} from "miroir-test-app_deployment-admin";

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
export interface CreateApplicationToolProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}

// ################################################################################################
export const Runner_CreateApplication: React.FC<CreateApplicationToolProps> = ({
  applicationDeploymentMap,
}) => {
  const runnerName: string = "createApplicationAndDeployment";

  // State for MetaModel file upload
  const [selectedMetaModel, setSelectedMetaModel] = useState<MetaModel | undefined>(undefined);
  const [selectedFileName, setSelectedFileName] = useState<string | undefined>(undefined);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  // const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // const [selectedFileNameAndContents, setSelectedFileName] = useState<string | null>(null);

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


  const formMLSchema: FormMLSchema = useMemo(
    () => ({
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
                      // indexedDbName: { type: "string" },
                    },
                  },
                  filesystemDbStoreSectionConfiguration: {
                    type: "object",
                    definition: {
                      emulatedServerType: { type: "literal", definition: "filesystem" },
                      // directory: {
                      //   type: "string",
                      //   tag: {
                      //     value: {
                      //       defaultLabel: "Directory Path",
                      //       display: {
                      //         string: {
                      //           format: "folder",
                      //         },
                      //       },
                      //     },
                      //   },
                      // },
                    },
                  },
                  sqlDbStoreSectionConfiguration: {
                    type: "object",
                    definition: {
                      emulatedServerType: { type: "literal", definition: "sql" },
                      connectionString: { type: "string" },
                      // schema: { type: "string" },
                    },
                  },
                  mongoDbStoreSectionConfiguration: {
                    type: "object",
                    definition: {
                      emulatedServerType: { type: "literal", definition: "mongodb" },
                      connectionString: { type: "string" },
                      // database: { type: "string" },
                    },
                  },
                  storeSectionConfiguration: {
                    type: "union",
                    discriminator: "emulatedServerType",
                    definition: [
                      {
                        type: "schemaReference",
                        definition: {
                          // absolutePath: miroirFundamentalJzodSchemaUuid,
                          relativePath: "indexedDbStoreSectionConfiguration",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          // absolutePath: miroirFundamentalJzodSchemaUuid,
                          relativePath: "filesystemDbStoreSectionConfiguration",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          // absolutePath: miroirFundamentalJzodSchemaUuid,
                          relativePath: "sqlDbStoreSectionConfiguration",
                        },
                      },
                      {
                        type: "schemaReference",
                        definition: {
                          // absolutePath: miroirFundamentalJzodSchemaUuid,
                          relativePath: "mongoDbStoreSectionConfiguration",
                        },
                      },
                    ],
                  },
                },
                definition: {
                  // absolutePath: miroirFundamentalJzodSchemaUuid,
                  relativePath: "storeSectionConfiguration",
                },
              },
              applicationName: {
                type: "string",
                tag: {
                  value: {
                    defaultLabel: "Application Name",
                  },
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
      createApplicationAndDeployment: {
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
        ).createApplicationAndDeployment,
        applicationName: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
      },
    }),
    [],
  );

  let applicationDeploymentMapWithNewApplication: ApplicationDeploymentMap = {};
  const testSelfApplicationUuid = uuidv4();
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
              // connectionString: "mongodb://localhost:27017",
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
                    definition: "{{createApplicationAndDeployment.applicationName}}",
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
                    definition: "{{createApplicationAndDeployment.applicationName}}",
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
                definition: "{{createApplicationAndDeployment.applicationName}}",
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
                definition: "{{createApplicationAndDeployment.applicationName}}",
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
                  // {
                  //   transformerType: "getFromParameters",
                  //   referencePath: [
                  //     "createApplicationAndDeployment",
                  //     "applicationStorage",
                  //     "indexedDbName",
                  //   ],
                  // },
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
                  // {
                  //   transformerType: "getFromParameters",
                  //   referencePath: [
                  //     "createApplicationAndDeployment",
                  //     "applicationStorage",
                  //     "indexedDbName",
                  //   ],
                  // },
                  // "/",
                  prefix,
                  {
                    transformerType: "getFromParameters",
                    referencePath: ["createApplicationAndDeployment", "applicationName"],
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
                  //     "createApplicationAndDeployment",
                  //     "applicationStorage",
                  //     "indexedDbName",
                  //   ],
                  // },
                  // "/",
                  prefix,
                  {
                    transformerType: "getFromParameters",
                    referencePath: ["createApplicationAndDeployment", "applicationName"],
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
                    referencePath: ["createApplicationAndDeployment", "applicationName"],
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
                    referencePath: ["createApplicationAndDeployment", "applicationName"],
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
    };
    const initParametersForTest: InitApplicationParameters = {
      dataStoreType: "app", // TODO: comparison between deployment and selfAdminConfigurationDeployment
      metaModel: defaultMiroirMetaModel,
      selfApplication: {
        ...selfApplicationLibrary,
        uuid: testSelfApplicationUuid,
        name: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition: "{{createApplicationAndDeployment.applicationName}}",
        } as any,
        defaultLabel: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition: "The {{createApplicationAndDeployment.applicationName}} selfApplication",
        } as any,
        description: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition:
            "The model and data of the {{createApplicationAndDeployment.applicationName}} selfApplication",
        } as any,
      },
      // deployment: {
      //   ...selfApplicationDeploymentLibrary,
      //   selfApplication: selfApplicationUuid,
      //   uuid: adminConfigurationDeploymentUuid,
      // },
      applicationModelBranch: {
        ...selfApplicationModelBranchLibraryMasterBranch,
        uuid: testApplicationModelBranchUuid,
        selfApplication: testSelfApplicationUuid,
        headVersion: testApplicationVersionUuid,
        description: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition:
            "The master branch of the {{createApplicationAndDeployment.applicationName}} SelfApplication",
        },
      } as any,
      // applicationStoreBasedConfiguration: {
      //   ...selfApplicationStoreBasedConfigurationLibrary,
      //   defaultLabel: `The reference configuration for the ${applicationName} selfApplication storage`,
      // } as any,
      applicationVersion: {
        ...selfApplicationVersionLibraryInitialVersion,
        uuid: testApplicationVersionUuid,
        selfApplication: testSelfApplicationUuid,
        branch: testApplicationModelBranchUuid,
        description: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition:
            "Initial {{createApplicationAndDeployment.applicationName}} selfApplication version",
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
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `{{createApplicationAndDeployment.applicationName}}`,
                      } as any,
                      defaultLabel: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `The {{createApplicationAndDeployment.applicationName}} Admin Application.`,
                      } as any,
                      description: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `This Admin Application contains the {{createApplicationAndDeployment.applicationName}} model and data.`,
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
                        definition: `Deployment of application {{createApplicationAndDeployment.applicationName}}`,
                      } as any,
                      defaultLabel: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `The deployment of application {{createApplicationAndDeployment.applicationName}}`,
                      } as any,
                      description: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `The description of deployment of application {{createApplicationAndDeployment.applicationName}}`,
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
              application: testSelfApplicationUuid,
              ...(selectedMetaModel ? {
                model: {
                  transformerType: "returnValue",
                  label: "customMetaModel",
                  interpolation: "runtime",
                  value: selectedMetaModel,
                } as any // TODO: fix type
              } : {}),
            },
          },
          {
            actionType: "initModel",
            actionLabel: "resetAndInitializeDeployment_initModel_" + testSelfApplicationUuid,
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: testSelfApplicationUuid,
              params: {
                transformerType: "returnValue",
                label: "initParametersForTest",
                interpolation: "runtime",
                value: initParametersForTest,
              } as any, // TODO: fix type
            },
          },
          {
            actionType: "commit", // in the case where initModel has a model attribute
            actionLabel: "refreshLocalCacheForApplication",
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
              parentUuid: appEntitesAndInstances.length > 0 ? appEntitesAndInstances[0].entity.uuid : noValue.uuid,
              objects: appEntitesAndInstances.map((e) => {
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
      },
    };

    // Combine all three composite actions into one
    const combinedCompositeActionTemplate: CompositeActionTemplate = {
      actionType: "compositeActionSequence",
      actionLabel: "createApplicationAndDeployment",
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

    return combinedCompositeActionTemplate;
  }, [
    applicationDeploymentMap,
    testApplicationModelBranchUuid,
    testDeploymentUuid,
    testSelfApplicationUuid,
    testApplicationVersionUuid,
    selectedMetaModel,
  ]);

  return (
    <>
      {/* Model File Upload Section */}
      <FileSelector
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
        formikValuePathAsString="createApplicationAndDeployment"
        formLabel="Create Application (and Deployment)"
        displaySubmitButton="onFirstLine"
        useActionButton={false}
      />
    </>
  );
};

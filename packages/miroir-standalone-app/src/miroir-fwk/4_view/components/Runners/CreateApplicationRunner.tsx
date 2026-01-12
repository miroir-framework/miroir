import { useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';

import type {
  ApplicationDeploymentMap,
  CompositeActionSequence,
  CompositeActionTemplate,
  Deployment,
  InitApplicationParameters,
  LoggerInterface,
  TransformerForBuildPlusRuntime,
  Uuid
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  adminSelfApplication,
  defaultMiroirMetaModel,
  defaultSelfApplicationDeploymentMap,
  entityApplicationForAdmin,
  entityDeployment,
  MiroirLoggerFactory,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion
} from "miroir-core";
import {
  type AdminApplication
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import type { FormMLSchema } from "./RunnerInterface.js";
import { RunnerView } from "./RunnerView.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "CreateApplicationRunner"), "UI",
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
  application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
  // deploymentUuid: string;
}

// ################################################################################################
export const CreateApplicationRunner: React.FC<CreateApplicationToolProps> = ({
  application,
  applicationDeploymentMap,
}) => {
  const runnerName: string = "createApplicationAndDeployment";
  // const domainController: DomainControllerInterface = useDomainControllerService();
  // const currentMiroirModelEnvironment: MiroirModelEnvironment =
  //   useCurrentModelEnvironment(deploymentUuid);

  const deploymentUuid: Uuid = applicationDeploymentMap[application] ?? "";
  
  const formMLSchema: FormMLSchema = useMemo(
    () => ({
      formMLSchemaType: "mlSchema",
      mlSchema: {
        type: "object",
        definition: {
          createApplicationAndDeployment: {
            type: "object",
            definition: {
              applicationName: {
                type: "string",
                tag: {
                  value: {
                    defaultLabel: "Application Name",
                    editable: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    []
  );

  const initialFormValue = useMemo(
    () => ({
      createApplicationAndDeployment: {
        applicationName: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
      },
    }),
    []
  );

  // const createApplicationAction = useMemo((): CompositeActionSequence => {
  //   const testSelfApplicationUuid = uuidv4();
  //   const testDeploymentUuid = uuidv4();
  //   const testApplicationModelBranchUuid = uuidv4();
  //   const testApplicationVersionUuid = uuidv4();

  //   // The applicationName will come from form values at runtime
  //   // For now, we use a placeholder that will be replaced by RunnerView
  //   const placeholderApplicationName = "PLACEHOLDER_APP_NAME";

  //   const testDeploymentStorageConfiguration: StoreUnitConfiguration =
  //     getBasicStoreUnitConfiguration(placeholderApplicationName, {
  //       emulatedServerType: "sql",
  //       connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  //     });

  //   const initParametersForTest: InitApplicationParameters = getBasicApplicationConfiguration(
  //     placeholderApplicationName,
  //     testSelfApplicationUuid,
  //     testDeploymentUuid,
  //     testApplicationModelBranchUuid,
  //     testApplicationVersionUuid
  //   );

  //   const localCreateApplicationCompositeAction = createApplicationCompositeAction(
  //     adminConfigurationDeploymentAdmin.uuid,
  //     testSelfApplicationUuid,
  //     testSelfApplicationUuid,
  //     placeholderApplicationName,
  //     testDeploymentStorageConfiguration
  //   );

  //   const localCreateDeploymentCompositeAction = createDeploymentCompositeAction(
  //     placeholderApplicationName,
  //     testDeploymentUuid,
  //     testSelfApplicationUuid,
  //     testDeploymentStorageConfiguration
  //   );

  //   const localResetAndinitializeDeploymentCompositeAction =
  //     resetAndinitializeDeploymentCompositeAction(testDeploymentUuid, initParametersForTest, []);

  //   // Combine all three composite actions into one
  //   const combinedCompositeAction: CompositeActionSequence = {
  //     actionType: "compositeActionSequence",
  //     actionLabel: "createApplicationAndDeployment",
  //     application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
  //     endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
  //     payload: {
  //       definition: [
  //         ...localCreateApplicationCompositeAction.payload.definition,
  //         ...localCreateDeploymentCompositeAction.payload.definition,
  //         ...localResetAndinitializeDeploymentCompositeAction.payload.definition,
  //       ],
  //     },
  //   };

  //   return combinedCompositeAction;
  // }, []);

  const createApplicationActionTemplate = useMemo((): CompositeActionTemplate => {
    const testSelfApplicationUuid = uuidv4();
    const testDeploymentUuid = uuidv4();
    const testApplicationModelBranchUuid = uuidv4();
    const testApplicationVersionUuid = uuidv4();

    const serverConfig: any = {
      emulatedServerType: "sql",
      connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
    };

    let testDeploymentStorageConfiguration: TransformerForBuildPlusRuntime = {} as any;
    switch (serverConfig.emulatedServerType as any) {
      case "filesystem": {
        testDeploymentStorageConfiguration = {
          admin: {
            emulatedServerType: "filesystem",
            directory: `${serverConfig.rootDirectory}/admin`,
          },
          model: {
            emulatedServerType: "filesystem",
            directory: {
              transformerType: "mustacheStringTemplate",
              interpolation: "build",
              definition: `${serverConfig.rootDirectory}/{{createApplicationAndDeployment.applicationName}}_model`,
            },
          },
          data: {
            emulatedServerType: "filesystem",
            directory: {
              transformerType: "mustacheStringTemplate",
              interpolation: "build",
              definition: `${serverConfig.rootDirectory}/{{createApplicationAndDeployment.applicationName}}_data`,
            },
          },
        };
        break;
      }
      case "sql": {
        testDeploymentStorageConfiguration = {
          admin: {
            emulatedServerType: "sql",
            connectionString: serverConfig.connectionString,
            schema: "miroirAdmin",
          },
          model: {
            emulatedServerType: "sql",
            connectionString: serverConfig.connectionString,
            schema: {
              transformerType: "mustacheStringTemplate",
              interpolation: "build",
              definition: "{{createApplicationAndDeployment.applicationName}}",
            }, // TODO: separate model and data schemas
          },
          data: {
            emulatedServerType: "sql",
            connectionString: serverConfig.connectionString,
            schema: {
              transformerType: "mustacheStringTemplate",
              interpolation: "build",
              definition: "{{createApplicationAndDeployment.applicationName}}",
            }, // TODO: separate model and data schemas
          },
        };
        break;
      }
      case "indexedDb": {
        testDeploymentStorageConfiguration = {
          admin: {
            emulatedServerType: "indexedDb",
            indexedDbName: `${serverConfig.rootIndexDbName}_admin`,
          },
          model: {
            emulatedServerType: "indexedDb",
            indexedDbName: `${serverConfig.rootIndexDbName}_model`,
          },
          data: {
            emulatedServerType: "indexedDb",
            indexedDbName: `${serverConfig.rootIndexDbName}_data`,
          },
        };
        break;
      }
    }
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
        },
        defaultLabel: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition: "The {{createApplicationAndDeployment.applicationName}} selfApplication",
        },
        description: {
          transformerType: "mustacheStringTemplate",
          interpolation: "build",
          definition:
            "The model and data of the {{createApplicationAndDeployment.applicationName}} selfApplication",
        },
      },
      // selfApplicationDeploymentConfiguration: {
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
              deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
              applicationSection: "data",
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
                [testDeploymentUuid]: testDeploymentStorageConfiguration as any,
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
              configuration: testDeploymentStorageConfiguration as any,
            },
          },
          {
            actionType: "createInstance",
            actionLabel: "CreateDeploymentInstances",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: adminSelfApplication.uuid,
              // application: testSelfApplicationUuid,
              deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
              applicationSection: "data",
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
                      adminApplication: testSelfApplicationUuid,
                      configuration: testDeploymentStorageConfiguration,
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
    const localResetAndinitializeDeploymentCompositeActionTemplate = {
      actionType: "compositeActionSequence",
      actionLabel: "resetAndInitializeDeployment",
      application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        definition: [
          {
            actionType: "resetModel",
            actionLabel: "resetApplicationStore",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              deploymentUuid: testDeploymentUuid,
            },
          },
          {
            actionType: "initModel",
            actionLabel: "initStore",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: testSelfApplicationUuid,
              deploymentUuid: testDeploymentUuid,
              // params: initParametersForTest
              params: {
                transformerType: "returnValue",
                label: "initParametersForTest",
                interpolation: "runtime",
                value: initParametersForTest,
              },
            },
          },
          {
            actionType: "rollback",
            actionLabel: "refreshLocalCacheForApplication",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: testSelfApplicationUuid,
              deploymentUuid: testDeploymentUuid,
            },
          },
          {
            actionType: "createEntity",
            actionLabel: "CreateApplicationStoreEntities",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              application: testSelfApplicationUuid,
              deploymentUuid: testDeploymentUuid,
              entities: appEntitesAndInstances,
            },
          },
          {
            actionType: "commit",
            actionLabel: "CommitApplicationStoreEntities",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            payload: {
              application: testSelfApplicationUuid,
              deploymentUuid: testDeploymentUuid,
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            },
          },
          {
            actionType: "createInstance",
            actionLabel: "CreateApplicationStoreInstances",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              application: testSelfApplicationUuid,
              deploymentUuid: testDeploymentUuid,
              applicationSection: "data",
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
  }, []);

  return (
    <RunnerView
      runnerName={runnerName}
      applicationDeploymentMap={defaultSelfApplicationDeploymentMap}
      deploymentUuid={deploymentUuid}
      formMLSchema={formMLSchema}
      initialFormValue={initialFormValue}
      action={{
        actionType: "compositeActionTemplate",
        compositeActionTemplate: createApplicationActionTemplate,
      }}
      // labelElement={<h2>Application Creator</h2>}
      formikValuePathAsString="createApplicationAndDeployment"
      formLabel="Create Application & Deployment"
      displaySubmitButton="onFirstLine"
      useActionButton={false}
    />
  );
};

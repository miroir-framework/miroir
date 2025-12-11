import { useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';

import type {
  CompositeAction,
  CompositeActionTemplate,
  Deployment,
  DomainControllerInterface,
  InitApplicationParameters,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirModelEnvironment,
  StoreUnitConfiguration,
  TransformerForBuildPlusRuntime,
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  createApplicationCompositeAction,
  createDeploymentCompositeAction,
  defaultMiroirMetaModel,
  entityApplicationForAdmin,
  entityDeployment,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  MiroirLoggerFactory,
  resetAndinitializeDeploymentCompositeAction,
  selfApplicationLibrary,
  selfApplicationModelBranchLibraryMasterBranch,
  selfApplicationVersionLibraryInitialVersion,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { InnerRunnerView } from "./InnerRunnerView.js";
import {
  transformer,
  type AdminApplication,
  type CarryOn_fe9b7d99$f216$44de$bb6e$60e1a1ebb739_compositeAction,
} from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { OuterRunnerView } from "./OuterRunnerView.js";

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
  deploymentUuid: string;
}

// ################################################################################################
export const CreateApplicationRunner: React.FC<CreateApplicationToolProps> = ({ deploymentUuid }) => {
  const runnerName: string = "createApplicationAndDeployment";
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentMiroirModelEnvironment: MiroirModelEnvironment =
    useCurrentModelEnvironment(deploymentUuid);

  const formMlSchema: JzodObject = useMemo(
    () => ({
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

  const createApplicationAction = useMemo((): CompositeAction => {
    const testSelfApplicationUuid = uuidv4();
    const testDeploymentUuid = uuidv4();
    const testApplicationModelBranchUuid = uuidv4();
    const testApplicationVersionUuid = uuidv4();

    // The applicationName will come from form values at runtime
    // For now, we use a placeholder that will be replaced by RunnerView
    const placeholderApplicationName = "PLACEHOLDER_APP_NAME";

    const testDeploymentStorageConfiguration: StoreUnitConfiguration =
      getBasicStoreUnitConfiguration(placeholderApplicationName, {
        emulatedServerType: "sql",
        connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      });

    const initParametersForTest: InitApplicationParameters = getBasicApplicationConfiguration(
      placeholderApplicationName,
      testSelfApplicationUuid,
      testDeploymentUuid,
      testApplicationModelBranchUuid,
      testApplicationVersionUuid
    );

    const localCreateApplicationCompositeAction = createApplicationCompositeAction(
      adminConfigurationDeploymentAdmin.uuid,
      testSelfApplicationUuid,
      testSelfApplicationUuid,
      placeholderApplicationName,
      testDeploymentStorageConfiguration
    );

    const localCreateDeploymentCompositeAction = createDeploymentCompositeAction(
      placeholderApplicationName,
      testDeploymentUuid,
      testSelfApplicationUuid,
      testDeploymentStorageConfiguration
    );

    const localResetAndinitializeDeploymentCompositeAction =
      resetAndinitializeDeploymentCompositeAction(testDeploymentUuid, initParametersForTest, []);

    // Combine all three composite actions into one
    const combinedCompositeAction: CompositeAction = {
      actionType: "compositeAction",
      actionLabel: "createApplicationAndDeployment",
      actionName: "sequence",
      application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        definition: [
          ...localCreateApplicationCompositeAction.payload.definition,
          ...localCreateDeploymentCompositeAction.payload.definition,
          ...localResetAndinitializeDeploymentCompositeAction.payload.definition,
        ],
      },
    };

    return combinedCompositeAction;
  }, []);

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

    const localCreateApplicationCompositeActionTemplate = {
      actionType: "compositeAction",
      actionLabel: "beforeAll",
      actionName: "sequence",
      application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        definition: [
          {
            actionType: "createInstance",
            actionLabel: "createApplicationForAdminAction",
            deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
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
                      // name: placeholderApplicationName,
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

    const localCreateDeploymentCompositeActionTemplate = {
      actionType: "compositeAction",
      actionLabel: "beforeAll",
      actionName: "sequence",
      application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        definition: [
          {
            // actionType: "storeManagementAction",
            actionType: "storeManagementAction_openStore",
            actionLabel: "storeManagementAction_openStore",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            deploymentUuid: testDeploymentUuid,
            configuration: {
              [testDeploymentUuid]: testDeploymentStorageConfiguration as any,
            },
          },
          {
            // actionType: "storeManagementAction",
            actionType: "storeManagementAction_createStore",
            actionLabel: "storeManagementAction_createStore",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            deploymentUuid: testDeploymentUuid,
            configuration: testDeploymentStorageConfiguration as any,
          },
          {
            actionType: "createInstance",
            actionLabel: "CreateDeploymentInstances",
            deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
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
      actionType: "compositeAction",
      actionLabel: "beforeEach",
      actionName: "sequence",
      application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        definition: [
          {
            actionType: "resetModel",
            actionLabel: "resetApplicationStore",
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: testDeploymentUuid,
          },
          {
            actionType: "initModel",
            actionLabel: "initStore",
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: testDeploymentUuid,
            payload: {
              params: initParametersForTest,
            },
          },
          {
            actionType: "rollback",
            actionLabel: "refreshLocalCacheForApplication",
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: testDeploymentUuid,
          },
          {
            actionType: "createEntity",
            actionLabel: "CreateApplicationStoreEntities",
            deploymentUuid: testDeploymentUuid,
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            payload: {
              entities: appEntitesAndInstances,
            },
          },
          {
            actionType: "commit",
            actionLabel: "CommitApplicationStoreEntities",
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: testDeploymentUuid,
          },
          {
            actionType: "createInstance",
            actionLabel: "CreateApplicationStoreInstances",
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            deploymentUuid: testDeploymentUuid,
            payload: {
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
      actionType: "compositeAction",
      actionLabel: "createApplicationAndDeployment",
      actionName: "sequence",
      application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
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
    <OuterRunnerView
      runnerName={runnerName} 
      deploymentUuid={deploymentUuid}
      formMlSchema={formMlSchema}
      initialFormValue={initialFormValue}
      action={{
        actionType: "compositeActionTemplate",
        compositeActionTemplate: createApplicationActionTemplate,
      }}
      labelElement={<h2>Application Creator</h2>}
      formikValuePathAsString="createApplicationAndDeployment"
      formLabel="Create Application & Deployment"
      displaySubmitButton="onFirstLine"
      useActionButton={true}
    />
  );
};

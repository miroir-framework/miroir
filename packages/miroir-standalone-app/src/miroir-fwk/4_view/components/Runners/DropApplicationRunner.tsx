import { useMemo } from "react";

import type {
  CompositeActionTemplate,
  JzodObject,
  LoggerInterface
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  entityApplicationForAdmin,
  entityDeployment,
  MiroirLoggerFactory,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { RunnerView } from "./RunnerView.js";
import type { FormMLSchema } from "./RunnerInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DropApplicationRunner"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface DropApplicationToolProps {
  deploymentUuid: string;
}

// ################################################################################################
export const DropApplicationRunner: React.FC<DropApplicationToolProps> = ({
  deploymentUuid,
}) => {
  const runnerName: string = "dropApplication";

  const formMLSchema: FormMLSchema = useMemo(
    () => ({
      formMLSchemaType: "mlSchema",
      mlSchema: {
        type: "object",
        definition: {
          dropApplicationAndDeployment: {
            type: "object",
            definition: {
              application: {
                type: "uuid",
                nullable: true,
                tag: {
                  value: {
                    defaultLabel: "Application",
                    editable: true,
                    selectorParams: {
                      targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      targetEntity: entityApplicationForAdmin.uuid,
                      targetEntityOrderInstancesBy: "name",
                    },
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

  const initialFormValue = useMemo(() => {
    return {
      dropApplicationAndDeployment: {
        application: noValue.uuid,
      },
    };
  }, []);

  const dropApplicationActionTemplate = useMemo((): CompositeActionTemplate => {
    return {
      actionType: "compositeActionSequence",
      actionLabel: "dropApplicationAndDeployment",
      application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: {
        definition: [
          // Step 1: Query to get the deployment UUID from the selected application
          {
            actionType: "compositeRunBoxedExtractorOrQueryAction",
            actionLabel: "getDeploymentForApplication",
            nameGivenToResult: "deploymentInfo",
            query: {
              actionType: "runBoxedExtractorOrQueryAction",
              application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
              payload: {
                applicationSection: "data",
                query: {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                  pageParams: {},
                  queryParams: {},
                  contextResults: {},
                  extractors: {
                    deployments: {
                      label: "deployments of the application",
                      extractorOrCombinerType: "extractorByEntityReturningObjectList",
                      parentUuid: entityDeployment.uuid,
                      parentName: entityDeployment.name,
                      applicationSection: "data",
                      filter: {
                        attributeName: "adminApplication",
                        value: {
                          transformerType: "mustacheStringTemplate",
                          interpolation: "build",
                          definition: "{{dropApplicationAndDeployment.application}}",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          // Step 2: Delete the store
          {
            actionType: "storeManagementAction_deleteStore",
            actionLabel: "deleteStore",
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
            payload: {
              deploymentUuid: {
                transformerType: "mustacheStringTemplate",
                interpolation: "runtime",
                definition: "{{deploymentInfo.deployments.0.uuid}}",
              } as any,
              configuration: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["deploymentInfo", "deployments", 0, "configuration"],
              } as any,
            },
          },
          // Step 3: Delete the Deployment instance from admin
          {
            actionType: "deleteInstance",
            actionLabel: "deleteDeployment",
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
              applicationSection: "data",
              objects: [
                {
                  parentUuid: entityDeployment.uuid,
                  applicationSection: "data",
                  instances: [
                    {
                      parentUuid: entityDeployment.uuid,
                      uuid: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "runtime",
                        definition: "{{deploymentInfo.deployments.0.uuid}}",
                      } as any,
                    },
                  ],
                },
              ],
            } as any,
          },
          // Step 4: Delete the AdminApplication instance
          {
            actionType: "deleteInstance",
            actionLabel: "deleteAdminApplication",
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
            payload: {
              deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
              applicationSection: "data",
              objects: [
                {
                  parentUuid: entityApplicationForAdmin.uuid,
                  applicationSection: "data",
                  instances: [
                    {
                      parentUuid: entityApplicationForAdmin.uuid,
                      uuid: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: "{{dropApplicationAndDeployment.application}}",
                      } as any,
                    },
                  ],
                },
              ],
            } as any,
          },
        ],
      },
    };
  }, []);

  return (
    <RunnerView
      runnerName={runnerName}
      deploymentUuid={deploymentUuid}
      formMLSchema={formMLSchema}
      initialFormValue={initialFormValue}
      action={{
        actionType: "compositeActionTemplate",
        compositeActionTemplate: dropApplicationActionTemplate,
      }}
      labelElement={<h2>Delete Application & Deployment</h2>}
      formikValuePathAsString="dropApplicationAndDeployment"
      formLabel="Delete Application & Deployment"
      displaySubmitButton="onFirstLine"
      useActionButton={true}
    />
  );
};

import { useMemo } from "react";

import type {
  CompositeActionTemplate,
  DomainControllerInterface,
  JzodObject,
  LoggerInterface,
  MiroirModelEnvironment,
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  entityApplicationForAdmin,
  entityDeployment,
  MiroirLoggerFactory,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { RunnerView } from "./RunnerView.js";
import { OuterRunnerView } from "./OuterRunnerView.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "DeleteApplicationTool"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface DeleteApplicationToolProps {
  deploymentUuid: string;
}

// ################################################################################################
export const DeleteApplicationTool: React.FC<DeleteApplicationToolProps> = ({
  deploymentUuid,
}) => {
  const runnerName: string = "deleteApplication";
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);

  const formMlSchema: JzodObject = useMemo(
    () => ({
      type: "object",
      definition: {
        deleteApplicationAndDeployment: {
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
          }
        }
      },
    }),
    []
  );

  const initialFormValue = useMemo(() => {
    return {
      deleteApplicationAndDeployment: {
        application: noValue.uuid,
      },
    };
  }, []);

  const deleteApplicationActionTemplate = useMemo((): CompositeActionTemplate => {
    return {
      actionType: "compositeAction",
      actionLabel: "deleteApplicationAndDeployment",
      actionName: "sequence",
      definition: [
        // Step 1: Query to get the deployment UUID from the selected application
        {
          actionType: "compositeRunBoxedExtractorOrQueryAction",
          actionLabel: "getDeploymentForApplication",
          nameGivenToResult: "deploymentInfo",
          query: {
            actionType: "runBoxedExtractorOrQueryAction",
            actionName: "runQuery",
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
                        definition: "{{deleteApplicationAndDeployment.application}}",
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
          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
          deploymentUuid: {
            transformerType: "mustacheStringTemplate",
            interpolation: "runtime",
            definition: "{{deploymentInfo.deployments.0.uuid}}",
          } as any,
          configuration: {
            transformerType: "getFromContext",
            interpolation: "runtime",
            // definition: "{{deploymentInfo.deployments.0.configuration}}",
            referencePath: ["deploymentInfo","deployments",0,"configuration"],
          } as any,
        },
        // Step 3: Delete the Deployment instance from admin
        {
          actionType: "deleteInstance",
          actionLabel: "deleteDeployment",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
          payload: {
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
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
          payload: {
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
                      definition: "{{deleteApplicationAndDeployment.application}}",
                    } as any,
                  },
                ],
              },
            ],
          } as any,
        },
      ],
    };
  }, []);

  return (
    <OuterRunnerView
      runnerName={runnerName}
      deploymentUuid={deploymentUuid}
      formMlSchema={formMlSchema}
      initialFormValue={initialFormValue}
      action={{
        actionType: "compositeActionTemplate",
        compositeActionTemplate: deleteApplicationActionTemplate,
      }}
      labelElement={<h2>Delete Application & Deployment</h2>}
      formikValuePathAsString="deleteApplicationAndDeployment"
      formLabel="Delete Application & Deployment"
      displaySubmitButton="onFirstLine"
      useActionButton={true}
    />
  );
};

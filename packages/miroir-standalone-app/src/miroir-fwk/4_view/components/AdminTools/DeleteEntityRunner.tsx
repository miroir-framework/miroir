import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import type {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  CompositeActionTemplate,
  LoggerInterface
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  entityApplicationForAdmin,
  entityDeployment,
  entityEntity,
  MiroirLoggerFactory
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { ThemedOnScreenHelper } from "../Themes/BasicComponents.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { OuterRunnerView } from "./OuterRunnerView.js";
import type { FormMlSchema } from "./RunnerInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "CreateEntityTool"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface CreateEntityToolProps {
  deploymentUuid: string;
}

// ################################################################################################
export const DeleteEntityRunner: React.FC<CreateEntityToolProps> = ({
  deploymentUuid,
}) => {
  const runnerName: string = "deleteEntity";
  const runnerLabel: string = "Delete Entity";
  // const domainController: DomainControllerInterface = useDomainControllerService();
  // const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);

  // const localDeploymentUuid = deploymentUuid;
  // const localDeploymentUuid = "1b3f973b-a000-4a85-9d42-2639ecd0c473"; // WRONG, it's the application's uuid
  const localDeploymentUuid = "c0569263-bf2e-428a-af4b-37b7d3953f4b";
  const formMlSchema: FormMlSchema = useMemo(
    () => ({
      // formMlSchemaType: "mlSchema",
      formMlSchemaType: "transformer",
      transformer: {
        type: "object",
        definition: {
          [runnerName]: {
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
              entity: {
                type: "uuid",
                nullable: true,
                tag: {
                  value: {
                    defaultLabel: "Entity",
                    editable: true,
                    selectorParams: {
                      // targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      targetDeploymentUuid: {
                        transformerType: "mustacheStringTemplate",
                        interpolation: "build",
                        definition: `{{${runnerName}.deploymentUuidQuery.deployments.0.uuid}}`,
                      },
                      targetEntity: entityEntity.uuid,
                      targetEntityApplicationSection: "model",
                      targetEntityOrderInstancesBy: "name",
                    },
                  },
                },
              },
            },
          },
        },
      }
    }),
    []
  );

  const initialFormValue = useMemo(() => {
    const entityUuid = uuidv4();
    return {
      deleteEntity: {
        application: noValue.uuid,
        entity: noValue.uuid,
      },
    };
  }, []);

  const deploymentUuidQuery:
    | BoxedQueryWithExtractorCombinerTransformer
    | BoxedQueryTemplateWithExtractorCombinerTransformer
    | undefined = {
    queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
    deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
    pageParams: {},
    queryParams: {},
    contextResults: {},
    extractorTemplates: {
      deployments: {
        label: "deployments of the application",
        // extractorOrCombinerType: "extractorByEntityReturningObjectList",
        extractorTemplateType: "extractorTemplateForObjectListByEntity",
        parentUuid: entityDeployment.uuid,
        parentName: entityDeployment.name,
        applicationSection: "data",
        filter: {
          attributeName: "adminApplication",
          value: {
            transformerType: "mustacheStringTemplate",
            interpolation: "build",
            definition: `{{${runnerName}.application}}`,
          },
        },
      },
    },
  } as BoxedQueryTemplateWithExtractorCombinerTransformer;

  const deleteEntityActionTemplate = useMemo((): CompositeActionTemplate => {
    return {
      actionType: "compositeAction",
      actionLabel: runnerLabel,
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
                        definition: `{{${runnerName}.application}}`,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        // // createEntity action
        // {
        //   actionType: "deleteEntity",
        //   actionLabel: "deleteEntity",
        //   endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //   deploymentUuid: {
        //     transformerType: "mustacheStringTemplate",
        //     interpolation: "runtime",
        //     definition: "{{deploymentInfo.deployments.0.uuid}}",
        //   } as any,
        //   payload: {
        //     entities: [
        //       {
        //         entity: {
        //           transformerType: "getFromParameters",
        //           interpolation: "build",
        //           referencePath: ["createEntity", "entity"],
        //         } as any,
        //         entityDefinition: {
        //           transformerType: "getFromParameters",
        //           interpolation: "build",
        //           referencePath: ["createEntity", "entityDefinition"],
        //         } as any,
        //       },
        //     ],
        //   } as any,
        // },
        // {
        //   actionType: "commit",
        //   actionLabel: "commit",
        //   endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
        //   // deploymentUuid: localDeploymentUuid,
        //   deploymentUuid: {
        //     transformerType: "mustacheStringTemplate",
        //     interpolation: "runtime",
        //     definition: "{{deploymentInfo.deployments.0.uuid}}",
        //   } as any,
        // },
      ],
    };
  }, [localDeploymentUuid]);

  return (
    <>
      {/* <ThemedOnScreenHelper
        label={`DeleteEntityRunner for ${runnerName} initialFormValue`}
        data={initialFormValue}
      />
      <ThemedOnScreenHelper
        label={`DeleteEntityRunner for ${runnerName} deploymentUuidQuery`}
        data={deploymentUuidQuery}
      /> */}
      <OuterRunnerView
        runnerName={runnerName}
        deploymentUuid={deploymentUuid}
        deploymentUuidQuery={deploymentUuidQuery}
        formMlSchema={formMlSchema}
        initialFormValue={initialFormValue}
        action={{
          actionType: "compositeActionTemplate",
          compositeActionTemplate: deleteEntityActionTemplate,
        }}
        labelElement={<h2>{runnerLabel}</h2>}
        formikValuePathAsString={runnerName}
        formLabel={runnerLabel}
        displaySubmitButton="onFirstLine"
        useActionButton={true}
      />
    </>
  );
};

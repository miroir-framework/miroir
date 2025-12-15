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
  entityEntityDefinition,
  MiroirLoggerFactory
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { RunnerView } from "./RunnerView.js";
import type { FormMlSchema } from "./RunnerInterface.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "CreateEntityRunner"),
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
  // const localDeploymentUuid = "c0569263-bf2e-428a-af4b-37b7d3953f4b";
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
                      targetDeploymentUuid: {
                        transformerType: "!=",
                        interpolation: "build",
                        left: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          safe: true,
                          referencePath: [
                            runnerName,
                            "deploymentUuidQuery",
                            "deployments",
                            "0",
                            "uuid",
                          ],
                        },
                        right: {transformerType: "returnValue", value: undefined},
                        then: {
                          transformerType: "getFromParameters",
                          interpolation: "build",
                          safe: true,
                          referencePath: [
                            runnerName,
                            "deploymentUuidQuery",
                            "deployments",
                            "0",
                            "uuid",
                          ],
                        },
                        else: noValue.uuid,
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
      },
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
      actionType: "compositeActionSequence",
      actionLabel: runnerLabel,
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
                          definition: `{{${runnerName}.application}}`,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          // infer entityDefintion from entity uuid
          {
            actionType: "compositeRunBoxedExtractorOrQueryAction",
            // actionType: "",
            actionLabel: "getEntityDefinitionForEntity",
            nameGivenToResult: "entityDefinitionInfo",
            query: {
              actionType: "runBoxedExtractorOrQueryAction",
              application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
              endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
              deploymentUuid: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                // definition: "{{deploymentInfo.deployments.0.uuid}}",
                referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
              } as any,
              payload: {
                applicationSection: "model",
                query: {
                  queryType: "boxedQueryWithExtractorCombinerTransformer",
                  deploymentUuid: {
                    transformerType: "getFromContext",
                    interpolation: "runtime",
                    // definition: "{{deploymentInfo.deployments.0.uuid}}",
                    referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
                  } as any,
                  pageParams: {},
                  queryParams: {},
                  contextResults: {},
                  extractors: {
                    entityDefinitions: {
                      label: "entityDefinitions of the deployment",
                      extractorOrCombinerType: "extractorByEntityReturningObjectList",
                      parentUuid: entityEntityDefinition.uuid,
                      parentName: entityEntityDefinition.name,
                      applicationSection: "model",
                      filter: {
                        attributeName: "entityUuid",
                        value: {
                          transformerType: "mustacheStringTemplate",
                          interpolation: "build",
                          definition: `{{${runnerName}.entity}}`,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          // createEntity action
          {
            actionType: "dropEntity",
            actionLabel: runnerName,
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{deploymentInfo.deployments.0.uuid}}",
            } as any,
            payload: {
              entityUuid: {
                transformerType: "getFromParameters",
                interpolation: "build",
                referencePath: [runnerName, "entity"],
              } as any,
              entityDefinitionUuid: {
                transformerType: "getFromContext",
                interpolation: "runtime",
                referencePath: ["entityDefinitionInfo", "entityDefinitions", "0", "uuid"],
              } as any,
            },
          },
          {
            actionType: "commit",
            actionLabel: "commit",
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{deploymentInfo.deployments.0.uuid}}",
            } as any,
          },
        ],
      },
    };
  }, [runnerName, runnerLabel]);

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
      <RunnerView
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

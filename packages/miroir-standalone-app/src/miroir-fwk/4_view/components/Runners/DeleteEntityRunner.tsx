import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import type {
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  BoxedQueryWithExtractorCombinerTransformer,
  CompositeActionTemplate,
  JzodElement,
  LoggerInterface,
  TransformerForBuildPlusRuntime
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  entity,
  entityApplicationForAdmin,
  entityDeployment,
  entityEntity,
  entityEntityDefinition,
  entityRunner,
  MiroirLoggerFactory,
  selfApplicationLibrary,
  selfApplicationMiroir
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { RunnerView } from "./RunnerView.js";
import type { FormMlSchema } from "./RunnerInterface.js";
import { useRunner } from "../Reports/ReportHooks.js";
import { ThemedOnScreenDebug } from "../Themes/BasicComponents.js";

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
// custom action runner definition
const runnerDefinition = {
  application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15", //selfApplicationMiroir.uuid,
  runnerName: "dropEntity",
  runnerLabel: "Drop Entity",
  // currentEndpointUuid : "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
  // domainActionType : "dropEntity",
  formMLSchema: {
    formMLSchemaType: "transformer",
    transformer: {
      type: "object",
      definition: {
        ["dropEntity"]: {
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
                          "dropEntity",
                          "deploymentUuidQuery",
                          "deployments",
                          "0",
                          "uuid",
                        ],
                      },
                      right: { transformerType: "returnValue", value: undefined },
                      then: {
                        transformerType: "getFromParameters",
                        interpolation: "build",
                        safe: true,
                        referencePath: [
                          "dropEntity",
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
  } as FormMlSchema,
  actionTemplate: {
    actionType: "compositeActionSequence",
    actionLabel: "Drop Entity",
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
                        definition: `{{dropEntity.application}}`,
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
              referencePath: ["deploymentInfo", "deployments", "0", "uuid"],
            } as any,
            payload: {
              applicationSection: "model",
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                deploymentUuid: {
                  transformerType: "getFromContext",
                  interpolation: "runtime",
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
                        definition: `{{dropEntity.entity}}`,
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
          actionLabel: "dropEntity",
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
              referencePath: ["dropEntity", "entity"],
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
  } as CompositeActionTemplate,
};

// ################################################################################################
export const DeleteEntityRunner: React.FC<CreateEntityToolProps> = ({
  deploymentUuid,
}) => {
  const runnerName: string = runnerDefinition.runnerName;
  const runnerLabel: string = runnerDefinition.runnerLabel;

  // const runnerDefinitionFromLocalCache = useRunner("4bbd7008-bd2b-4ef1-bd54-c10af9005819", "44313751-b0e5-4132-bb12-a544806e759b");
  // const runnerDefinitionFromLocalCache = useRunner(adminConfigurationDeploymentMiroir.uuid, entityRunner.uuid);
  const runnerDefinitionFromLocalCache: any = useRunner(adminConfigurationDeploymentMiroir.uuid, "44313751-b0e5-4132-bb12-a544806e759b");

  const initialFormValue = useMemo(() => {
    return {
      [runnerName]: {
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


  return runnerDefinitionFromLocalCache?(
    <>
      {/* <ThemedOnScreenHelper
        label={`DeleteEntityRunner for ${runnerName} initialFormValue`}
        data={initialFormValue}
      />
      <ThemedOnScreenHelper
        label={`DeleteEntityRunner for ${runnerName} deploymentUuidQuery`}
        data={deploymentUuidQuery}
      /> */}
      <ThemedOnScreenDebug
        label={`DeleteEntityRunner for ${runnerName} runnerDefinitionFromLocalCache`}
        data={runnerDefinitionFromLocalCache}
        initiallyUnfolded={false}
      />

      <RunnerView
        runnerName={runnerName}
        deploymentUuid={deploymentUuid}
        deploymentUuidQuery={deploymentUuidQuery}
        // formMLSchema={runnerDefinition.formMLSchema}
        formMLSchema={runnerDefinitionFromLocalCache.formMLSchema as FormMlSchema}
        initialFormValue={initialFormValue}
        action={{
          actionType: "compositeActionTemplate",
          compositeActionTemplate: runnerDefinitionFromLocalCache.actionTemplate,
        }}
        // action={{
        //   actionType: "compositeActionTemplate",
        //   compositeActionTemplate: runnerDefinition.actionTemplate,
        // }}
        labelElement={<h2>{runnerLabel}</h2>}
        formikValuePathAsString={runnerName}
        formLabel={runnerLabel}
        displaySubmitButton="onFirstLine"
        useActionButton={false}
      />
    </>
  ): (<div>DeleteEntityRunner: loading runner definition...</div>
  );
};

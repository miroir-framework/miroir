import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import type {
  CompositeActionTemplate,
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  JzodObject,
  LoggerInterface,
  MiroirModelEnvironment,
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  entityApplicationForAdmin,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDeployment,
  MiroirLoggerFactory,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { InnerRunnerView } from "./InnerRunnerView.js";
import { RunnerView } from "./RunnerView.js";

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
export function getCreateEntityActionTemplate(
  actionName: string,
  actionLabel: string
): CompositeActionTemplate {
  return {
    actionType: "compositeActionSequence",
    actionLabel,
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
                        definition: "{{createEntity.application}}",
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
          actionType: "createEntity",
          actionLabel,
          application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          deploymentUuid: {
            transformerType: "mustacheStringTemplate",
            interpolation: "runtime",
            definition: "{{deploymentInfo.deployments.0.uuid}}",
          } as any,
          payload: {
            entities: [
              {
                entity: {
                  transformerType: "getFromParameters",
                  referencePath: [actionName, "entity"],
                } as any,
                entityDefinition: {
                  transformerType: "getFromParameters",
                  referencePath: [actionName, "entityDefinition"],
                } as any,
              },
            ],
          } as any,
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
}


// ################################################################################################
export const CreateEntityRunner: React.FC<CreateEntityToolProps> = ({
  deploymentUuid,
}) => {
  const runnerName: string = "createEntity";
  // const domainController: DomainControllerInterface = useDomainControllerService();
  // const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);

  // const localDeploymentUuid = deploymentUuid;
  // const localDeploymentUuid = "1b3f973b-a000-4a85-9d42-2639ecd0c473"; // WRONG, it's the application's uuid
  // const localDeploymentUuid = "c0569263-bf2e-428a-af4b-37b7d3953f4b";
  const formMLSchema: JzodObject = useMemo(
    () => ({
      type: "object",
      definition: {
        createEntity: {
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
            entity: entityDefinitionEntity.jzodSchema,
            entityDefinition: entityDefinitionEntityDefinition.jzodSchema,
          },
        },
      },
    }),
    []
  );

  const initialFormValue = useMemo(() => {
    const entityUuid = uuidv4();
    return {
      createEntity: {
        application: noValue.uuid,
        entity: {
          uuid: entityUuid,
          parentUuid: "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad",
          parentName: "Entity",
          parentDefinitionVersionUuid: "381ab1be-337f-4198-b1d3-f686867fc1dd",
          name: "",
        } as Entity,
        entityDefinition: {
          uuid: uuidv4(),
          parentName: "EntityDefinition",
          parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
          parentDefinitionVersionUuid: "c50240e7-c451-46c2-b60a-07b3172a5ef9",
          name: "",
          entityUuid: entityUuid,
          jzodSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "uuid",
                tag: {
                  value: {
                    id: 1,
                    defaultLabel: "Uuid",
                    editable: false,
                  },
                },
              },
              parentName: {
                type: "string",
                optional: true,
                tag: {
                  value: {
                    id: 2,
                    defaultLabel: "Entity Name",
                    editable: false,
                  },
                },
              },
              parentUuid: {
                type: "uuid",
                tag: {
                  value: {
                    id: 3,
                    defaultLabel: "Entity Uuid",
                    editable: false,
                  },
                },
              },
              parentDefinitionVersionUuid: {
                type: "uuid",
                optional: true,
                tag: {
                  value: {
                    id: 4,
                    defaultLabel: "Entity Definition Version Uuid",
                    editable: false,
                  },
                },
              },
              name: {
                type: "string",
                tag: {
                  value: {
                    defaultLabel: "Name",
                    editable: true,
                  },
                },
              },
            },
          },
        } as EntityDefinition,
      },
    };
  }, []);

  const createEntityActionTemplate = useMemo(() => getCreateEntityActionTemplate(runnerName, "Create Entity"), []);

  return (
    <RunnerView
      runnerName={runnerName}
      deploymentUuid={deploymentUuid}
      formMLSchema={formMLSchema}
      initialFormValue={initialFormValue}
      action={{
        actionType: "compositeActionTemplate",
        compositeActionTemplate: createEntityActionTemplate,
      }}
      labelElement={<h2>Entity Creator</h2>}
      formikValuePathAsString="createEntity"
      formLabel="Create Entity"
      displaySubmitButton="onFirstLine"
      useActionButton={true}
    />
  );
};

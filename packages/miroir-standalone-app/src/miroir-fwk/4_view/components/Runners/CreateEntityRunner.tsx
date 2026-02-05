import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import type {
  ApplicationDeploymentMap,
  CompositeActionTemplate,
  Entity,
  EntityDefinition,
  JzodObject,
  LoggerInterface
} from "miroir-core";
import {
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  MiroirLoggerFactory,
  noValue
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import type { FormMLSchema } from "./RunnerInterface.js";
import { RunnerView } from "./RunnerView.js";
import { adminSelfApplication, entityDeployment } from "miroir-deployment-admin";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "CreateEntityRunner"),
  "UI"
).then((logger: LoggerInterface) => {
  log = logger;
});

// ################################################################################################
export interface CreateEntityToolProps {
  // application: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
}


// ################################################################################################
export function getCreateEntityActionTemplate(
  actionName: string,
  actionLabel: string
): CompositeActionTemplate {
  return {
    actionType: "compositeActionSequence",
    actionLabel,
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: {
      application: "NOT_USED_IN_COMPOSITE_ACTION_TEMPLATE",
      definition: [
        // Step 1: Query to get the deployment UUID from the selected application
        {
          actionType: "compositeRunBoxedExtractorOrQueryAction",
          actionLabel: "getDeploymentForApplication",
          nameGivenToResult: "deploymentInfo",
          query: {
            actionType: "runBoxedExtractorOrQueryAction",
            application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
            payload: {
              application: adminSelfApplication.uuid,
              applicationSection: "data",
              query: {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: adminSelfApplication.uuid,
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
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: {
              transformerType: "mustacheStringTemplate",
              definition: "{{createEntity.application}}",
            } as any,
            deploymentUuid: {
              transformerType: "mustacheStringTemplate",
              interpolation: "runtime",
              definition: "{{deploymentInfo.deployments.0.uuid}}",
            } as any,
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
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
          payload: {
            application: {
              transformerType: "mustacheStringTemplate",
              definition: "{{createEntity.application}}",
            } as any,
          },
        },
      ],
    },
  };
}


// ################################################################################################
export const CreateEntityRunner: React.FC<CreateEntityToolProps> = ({
  applicationDeploymentMap,
}) => {
  const runnerName: string = "createEntity";

  const formMLSchema: FormMLSchema = useMemo(
    () => ({
      formMLSchemaType: "mlSchema",
      mlSchema: {
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
                    foreignKeyParams: {
                      targetApplicationUuid: "55af124e-8c05-4bae-a3ef-0933d41daa92",
                      targetEntity: "25d935e7-9e93-42c2-aade-0472b883492b",
                      targetEntityOrderInstancesBy: "name",
                    },
                  },
                },
              },
              entity: entityDefinitionEntity.mlSchema,
              entityDefinition: entityDefinitionEntityDefinition.mlSchema,
            },
          },
        },
      } as JzodObject,
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
          mlSchema: {
            type: "object",
            definition: {
              uuid: {
                type: "uuid",
                tag: {
                  value: {
                    id: 1,
                    defaultLabel: "Uuid",
                    display: { editable: false },
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
                    display: { editable: false },
                  },
                },
              },
              parentUuid: {
                type: "uuid",
                tag: {
                  value: {
                    id: 3,
                    defaultLabel: "Entity Uuid",
                    display: { editable: false },
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
                    display: { editable: false },
                  },
                },
              },
              name: {
                type: "string",
                tag: {
                  value: {
                    defaultLabel: "Name",
                    display: { editable: true },
                  },
                },
              },
            },
          },
        } as EntityDefinition,
      },
    };
  }, []);

  const createEntityActionTemplate = useMemo(
    () => getCreateEntityActionTemplate(runnerName, "Create Entity"),
    []
  );

  return (
    <RunnerView
      runnerName={runnerName}
      applicationDeploymentMap={applicationDeploymentMap}
      formMLSchema={formMLSchema}
      initialFormValue={initialFormValue}
      action={{
        actionType: "compositeActionTemplate",
        compositeActionTemplate: createEntityActionTemplate,
      }}
      formikValuePathAsString="createEntity"
      formLabel="Create Entity"
      displaySubmitButton="onFirstLine"
      useActionButton={false}
    />
  );
};

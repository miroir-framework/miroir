import { Formik } from "formik";
import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

import type {
  DomainControllerInterface,
  Entity,
  EntityDefinition,
  JzodElement,
  LoggerInterface,
  MiroirModelEnvironment,
  ModelAction,
} from "miroir-core";
import {
  defaultMiroirModelEnvironment,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  MiroirLoggerFactory,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { TypedValueObjectEditor } from "../Reports/TypedValueObjectEditor.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService } from "../../MiroirContextReactProvider.js";

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
  currentMiroirModelEnvironment: MiroirModelEnvironment;
}

// ################################################################################################
export const CreateEntityTool: React.FC<CreateEntityToolProps> = ({
  deploymentUuid,
  currentMiroirModelEnvironment,
}) => {
  const domainController: DomainControllerInterface = useDomainControllerService();

  const formMlSchema: JzodElement = useMemo(
    () => ({
      type: "object",
      definition: {
        createEntity: {
          type: "object",
          definition: {
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

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialFormValue}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        try {
          const createAction: ModelAction = {
            actionType: "createEntity",
            actionLabel: "createEntity",
            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
            deploymentUuid: deploymentUuid,
            payload: {
              entities: [
                {
                  entity: values.createEntity.entity,
                  entityDefinition: values.createEntity.entityDefinition,
                },
              ],
            },
          };
          log.info("CreateEntityTool onSubmit formik values", values, createAction);

          await domainController.handleAction(createAction, defaultMiroirModelEnvironment);
          await domainController.handleAction(
            {
              actionType: "commit",
              actionLabel: "commit",
              endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
              deploymentUuid,
            },
            defaultMiroirModelEnvironment
          );
        } catch (e) {
          log.error(e);
        } finally {
          setSubmitting(false);
        }
      }}
      validateOnChange={false}
      validateOnBlur={false}
    >
      <TypedValueObjectEditor
        labelElement={<h2>Entity Creator</h2>}
        deploymentUuid={deploymentUuid}
        applicationSection="model"
        formValueMLSchema={formMlSchema}
        formikValuePathAsString="createEntity"
        formLabel="Create Entity"
        zoomInPath=""
        maxRenderDepth={Infinity}
        useActionButton={true}
      />
    </Formik>
  );
};

import { Formik } from "formik";
import { useMemo } from "react";
import { useSelector } from "react-redux";

import type {
  BoxedQueryWithExtractorCombinerTransformer,
  CompositeAction,
  DomainControllerInterface,
  InstanceAction,
  JzodElement,
  LoggerInterface,
  MiroirModelEnvironment,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerParams,
  Uuid,
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  defaultMiroirModelEnvironment,
  deleteApplicationAndDeploymentCompositeAction,
  Domain2ElementFailed,
  entityApplicationForAdmin,
  entityDeployment,
  getQueryRunnerParamsForReduxDeploymentsState,
  MiroirLoggerFactory,
  runQuery,
} from "miroir-core";
import {
  getMemoizedReduxDeploymentsStateSelectorMap,
  selectCurrentReduxDeploymentsStateFromReduxState,
  type ReduxStateWithUndoRedo,
} from "miroir-localcache-redux";
import { packageName } from "../../../../constants.js";
import { TypedValueObjectEditor } from "../Reports/TypedValueObjectEditor.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService } from "../../MiroirContextReactProvider.js";

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
  currentMiroirModelEnvironment: MiroirModelEnvironment;
}

// ################################################################################################
export const DeleteApplicationTool: React.FC<DeleteApplicationToolProps> = ({
  deploymentUuid,
  currentMiroirModelEnvironment,
}) => {
  const domainController: DomainControllerInterface = useDomainControllerService();

  const formMlSchema: JzodElement = useMemo(
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
          },
        },
      },
    }),
    []
  );

  const reduxState: ReduxDeploymentsState = useSelector<
    ReduxStateWithUndoRedo,
    ReduxDeploymentsState
  >(selectCurrentReduxDeploymentsStateFromReduxState);

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);

  const initialFormValue = useMemo(() => {
    return reduxState && Object.keys(reduxState).length > 0
      ? {
          deleteApplicationAndDeployment: {
            application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5" as Uuid,
          },
        }
      : {
          deleteApplicationAndDeployment: {
            application: undefined,
          },
        };
  }, [reduxState]);

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialFormValue}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        try {
          const applicationUuid = values.deleteApplicationAndDeployment?.application;

          log.info(
            "DeleteApplicationTool onSubmit formik values",
            values,
            applicationUuid
          );
          if (!applicationUuid) {
            throw new Error("No application selected to delete");
          }

          const deleteApplicationAndDeploymentCompositeAction_deploymentUuidQuery: BoxedQueryWithExtractorCombinerTransformer =
            {
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
                    value: applicationUuid,
                  },
                },
              },
            };

          const deploymentEntityStateFetchQueryParams: SyncQueryRunnerParams<ReduxDeploymentsState> =
            getQueryRunnerParamsForReduxDeploymentsState(
              deleteApplicationAndDeploymentCompositeAction_deploymentUuidQuery,
              deploymentEntityStateSelectorMap
            );
          const deployments = runQuery(
            reduxState,
            deploymentEntityStateFetchQueryParams,
            defaultMiroirModelEnvironment // TODO: use real environment
          );
          log.info(
            "DeleteApplicationTool onSubmit deployments for application",
            applicationUuid,
            "reduxState",
            reduxState,
            "deployments",
            deployments
          );

          if (deployments instanceof Domain2ElementFailed) {
            throw deployments;
          }
          if (deployments.deployments.length !== 1) {
            throw new Error(
              `Expected exactly one deployment for application ${applicationUuid}, but found ${deployments.deployments.length}`
            );
          }

          const dropStorageAction: CompositeAction =
            deleteApplicationAndDeploymentCompositeAction(
              {
                miroirConfigType: "client",
                client: {
                  emulateServer: false,
                  serverConfig: {
                    rootApiUrl: "http://localhost:3000/api",
                    storeSectionConfiguration: {
                      [deployments.deployments[0].uuid]:
                        deployments.deployments[0].configuration,
                    },
                  },
                },
              },
              deployments.deployments[0].uuid
            );

          log.info(
            "DeleteApplicationTool onSubmit dropStorageAction",
            JSON.stringify(dropStorageAction, null, 2)
          );

          const deleteAdminApplication: InstanceAction = {
            actionType: "deleteInstance",
            actionLabel: "deleteDeployment",
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
                      uuid: applicationUuid,
                    },
                  ],
                },
              ],
            },
          };

          log.info(
            "DeleteApplicationTool onSubmit deleteAdminApplication action",
            deleteAdminApplication
          );

          const deleteDeploymentAction: InstanceAction = {
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
                      uuid: deployments.deployments[0].uuid,
                    },
                  ],
                },
              ],
            },
          };

          log.info(
            "DeleteApplicationTool onSubmit deleteDeploymentAction action",
            deleteDeploymentAction
          );

          // run actions
          await domainController.handleCompositeAction(
            dropStorageAction,
            currentMiroirModelEnvironment,
            {}
          );

          await domainController.handleAction(
            deleteDeploymentAction,
            currentMiroirModelEnvironment
          );
          await domainController.handleAction(
            deleteAdminApplication,
            currentMiroirModelEnvironment
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
        labelElement={<h2>Delete Application & Deployment</h2>}
        deploymentUuid={deploymentUuid}
        applicationSection="model"
        formValueMLSchema={formMlSchema}
        formikValuePathAsString="deleteApplicationAndDeployment"
        formLabel="Delete Application & Deployment"
        zoomInPath=""
        maxRenderDepth={Infinity}
        useActionButton={true}
      />
    </Formik>
  );
};

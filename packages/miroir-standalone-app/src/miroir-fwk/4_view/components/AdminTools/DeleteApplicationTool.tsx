import { useMemo } from "react";
import { useSelector } from "react-redux";

import type {
  BoxedQueryWithExtractorCombinerTransformer,
  CompositeAction,
  DomainControllerInterface,
  InstanceAction,
  JzodObject,
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
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { noValue } from "../ValueObjectEditor/JzodElementEditorInterface.js";
import { ActionPad } from "./ActionPad.js";

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

  const reduxState: ReduxDeploymentsState = useSelector<
    ReduxStateWithUndoRedo,
    ReduxDeploymentsState
  >(selectCurrentReduxDeploymentsStateFromReduxState);

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);

  const initialFormValue = useMemo(() => {
    return {
      deleteApplicationAndDeployment: {
        application: noValue.uuid,
      },
    };
  }, []);

  const onSubmit = async (values: typeof initialFormValue, { setSubmitting, setErrors, setFieldValue }: any) => {
    const applicationUuid = values.deleteApplicationAndDeployment?.application;
    // const applicationUuid = values.application;

    log.info("DeleteApplicationTool onSubmit formik values", values, applicationUuid);
    
    if (!applicationUuid || applicationUuid === noValue.uuid) {
      throw new Error("DeleteApplicationTool: No application selected to delete");
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

    const dropStorageAction: CompositeAction = deleteApplicationAndDeploymentCompositeAction(
      {
        miroirConfigType: "client",
        client: {
          emulateServer: false,
          serverConfig: {
            rootApiUrl: "http://localhost:3000/api",
            storeSectionConfiguration: {
              [deployments.deployments[0].uuid]: deployments.deployments[0].configuration,
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

    // Reset form after successful deletion
    setFieldValue("deleteApplicationAndDeployment.application", noValue.uuid);
  };

  return (
    <ActionPad
      deploymentUuid={deploymentUuid}
      formMlSchema={formMlSchema}
      initialFormValue={initialFormValue}
      action={{
        actionType: "onSubmit",
        onSubmit,
      }}
      labelElement={<h2>Delete Application & Deployment</h2>}
      formikValuePathAsString="deleteApplicationAndDeployment"
      formLabel="Delete Application & Deployment"
      useActionButton={true}
    />
  );
};

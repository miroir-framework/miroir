import { useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';

import type {
  DomainControllerInterface,
  InitApplicationParameters,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirModelEnvironment,
  StoreUnitConfiguration,
} from "miroir-core";
import {
  adminConfigurationDeploymentAdmin,
  createApplicationCompositeAction,
  createDeploymentCompositeAction,
  getBasicApplicationConfiguration,
  getBasicStoreUnitConfiguration,
  MiroirLoggerFactory,
  resetAndinitializeDeploymentCompositeAction,
} from "miroir-core";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useDomainControllerService } from "../../MiroirContextReactProvider.js";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { ActionPad } from "./ActionPad.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "CreateApplicationTool"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
function formatYYYYMMDD_HHMMSS(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const HH = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${MM}${dd}_${HH}${mm}${ss}`;
}

// ################################################################################################
export interface CreateApplicationToolProps {
  deploymentUuid: string;
}

// ################################################################################################
export const CreateApplicationTool: React.FC<CreateApplicationToolProps> = ({
  deploymentUuid,
}) => {
  const domainController: DomainControllerInterface = useDomainControllerService();
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(deploymentUuid);

  const formMlSchema: JzodObject = useMemo(() => ({
    type: "object",
    definition: {
      createApplicationAndDeployment: {
        type: "object",
        definition: {
          applicationName: {
            type: "string",
            tag: {
              value: {
                defaultLabel: "Application Name",
                editable: true,
              },
            },
          },
        }
      }
    }
  }), []);

  const initialFormValue = useMemo(() => ({
    createApplicationAndDeployment: {
      applicationName: "test_application_" + formatYYYYMMDD_HHMMSS(new Date()),
    }
  }), []);

  const onSubmit = async (values: typeof initialFormValue, { setSubmitting, setErrors }: any) => {
    try {
      const newApplicationName = values.createApplicationAndDeployment.applicationName;

      log.info(
        "CreateApplicationTool onSubmit formik values",
        values,
        newApplicationName
      );

      const testSelfApplicationUuid = uuidv4();
      const testDeploymentUuid = uuidv4();
      const testApplicationModelBranchUuid = uuidv4();
      const testApplicationVersionUuid = uuidv4();

      const testDeploymentStorageConfiguration: StoreUnitConfiguration =
        getBasicStoreUnitConfiguration(newApplicationName, {
          emulatedServerType: "sql",
          connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
        });

      log.info(
        "CreateApplicationTool onSubmit testDeploymentStorageConfiguration",
        testDeploymentStorageConfiguration
      );
      const initParametersForTest: InitApplicationParameters =
        getBasicApplicationConfiguration(
          newApplicationName,
          testSelfApplicationUuid,
          testDeploymentUuid,
          testApplicationModelBranchUuid,
          testApplicationVersionUuid
        );

      log.info(
        "CreateApplicationTool onSubmit initParametersForTest",
        initParametersForTest
      );

      // create application in the admin store
      const localCreateApplicationCompositeAction = createApplicationCompositeAction(
        adminConfigurationDeploymentAdmin.uuid,
        testSelfApplicationUuid,
        testSelfApplicationUuid,
        newApplicationName,
        testDeploymentStorageConfiguration
      );
      log.info(
        "CreateApplicationTool onSubmit localCreateApplicationCompositeAction",
        localCreateApplicationCompositeAction
      );
      // create deployment
      const localCreateDeploymentCompositeAction = createDeploymentCompositeAction(
        newApplicationName,
        testDeploymentUuid,
        testSelfApplicationUuid,
        testDeploymentStorageConfiguration
      );
      log.info(
        "CreateApplicationTool onSubmit localCreateDeploymentCompositeAction",
        localCreateDeploymentCompositeAction
      );
      const localResetAndinitializeDeploymentCompositeAction =
        resetAndinitializeDeploymentCompositeAction(
          testDeploymentUuid,
          initParametersForTest,
          []
        );
      log.info(
        "CreateApplicationTool onSubmit localResetAndinitializeDeploymentCompositeAction",
        localResetAndinitializeDeploymentCompositeAction
      );

      // run actions
      await domainController.handleCompositeAction(
        localCreateApplicationCompositeAction,
        currentMiroirModelEnvironment,
        {}
      );

      await domainController.handleCompositeAction(
        localCreateDeploymentCompositeAction,
        currentMiroirModelEnvironment,
        {}
      );
      await domainController.handleCompositeAction(
        localResetAndinitializeDeploymentCompositeAction,
        currentMiroirModelEnvironment,
        {}
      );
    } catch (e) {
      log.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ActionPad
      deploymentUuid={deploymentUuid}
      formMlSchema={formMlSchema}
      initialFormValue={initialFormValue}
      onSubmit={onSubmit}
      labelElement={<h2>Application Creator</h2>}
      formikValuePathAsString="createApplicationAndDeployment"
      formLabel="Create Application & Deployment"
      displaySubmitButton="onFirstLine"
      useActionButton={true}
    />
  );
};

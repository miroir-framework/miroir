import { useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';

import type {
  CompositeAction,
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

  const createApplicationAction = useMemo((): CompositeAction => {
    const testSelfApplicationUuid = uuidv4();
    const testDeploymentUuid = uuidv4();
    const testApplicationModelBranchUuid = uuidv4();
    const testApplicationVersionUuid = uuidv4();

    // The applicationName will come from form values at runtime
    // For now, we use a placeholder that will be replaced by ActionPad
    const placeholderApplicationName = "PLACEHOLDER_APP_NAME";

    const testDeploymentStorageConfiguration: StoreUnitConfiguration =
      getBasicStoreUnitConfiguration(placeholderApplicationName, {
        emulatedServerType: "sql",
        connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
      });

    const initParametersForTest: InitApplicationParameters =
      getBasicApplicationConfiguration(
        placeholderApplicationName,
        testSelfApplicationUuid,
        testDeploymentUuid,
        testApplicationModelBranchUuid,
        testApplicationVersionUuid
      );

    const localCreateApplicationCompositeAction = createApplicationCompositeAction(
      adminConfigurationDeploymentAdmin.uuid,
      testSelfApplicationUuid,
      testSelfApplicationUuid,
      placeholderApplicationName,
      testDeploymentStorageConfiguration
    );

    const localCreateDeploymentCompositeAction = createDeploymentCompositeAction(
      placeholderApplicationName,
      testDeploymentUuid,
      testSelfApplicationUuid,
      testDeploymentStorageConfiguration
    );

    const localResetAndinitializeDeploymentCompositeAction =
      resetAndinitializeDeploymentCompositeAction(
        testDeploymentUuid,
        initParametersForTest,
        []
      );

    // Combine all three composite actions into one
    const combinedCompositeAction: CompositeAction = {
      actionType: "compositeAction",
      actionLabel: "createApplicationAndDeployment",
      actionName: "sequence",
      definition: [
        ...localCreateApplicationCompositeAction.definition,
        ...localCreateDeploymentCompositeAction.definition,
        ...localResetAndinitializeDeploymentCompositeAction.definition,
      ],
    };

    return combinedCompositeAction;
  }, []);

  return (
    <ActionPad
      deploymentUuid={deploymentUuid}
      formMlSchema={formMlSchema}
      initialFormValue={initialFormValue}
      action={{
        actionType: "compositeAction",
        compositeAction: createApplicationAction,
      }}
      labelElement={<h2>Application Creator</h2>}
      formikValuePathAsString="createApplicationAndDeployment"
      formLabel="Create Application & Deployment"
      displaySubmitButton="onFirstLine"
      useActionButton={true}
    />
  );
};

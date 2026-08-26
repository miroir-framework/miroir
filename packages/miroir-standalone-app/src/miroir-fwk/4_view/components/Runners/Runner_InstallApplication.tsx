import { useCallback } from "react";

import type {
  ApplicationDeploymentMap,
  LoggerInterface
} from "miroir-core";
import { defaultSelfApplicationDeploymentMap, MiroirLoggerFactory } from "miroir-core";
import { runnerDeployApplication, selfApplicationMiroir } from "miroir-test-app_deployment-miroir";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { StoredRunnerView } from "./RunnerView.js";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_CreateApplication");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export interface DeployApplicationRunnerProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const Runner_InstallApplication: React.FC<DeployApplicationRunnerProps> = ({
  applicationDeploymentMap,
}) => {

  const runnerApplicationDeploymentMap = useCallback(
    (values: any) => ({
      ...applicationDeploymentMap,
      [(values.deployApplication?.duplicateApplication
        ? values.deployApplication?.newApplicationUuid
        : values.deployApplication?.applicationBundle?.applicationUuid) ?? "NO_APPLICATION_UUID"]:
        values.deployApplication?.deploymentUuid ?? "NO_DEPLOYMENT_UUID",
    }),
    [applicationDeploymentMap],
  );

  // Bundle validation lives on the deployApplication Runner formMLSchema
  // (miroir_data/.../4f3cd0b1-...json): applicationName + entities required;
  // entityVersions optional (historized apps only).

  return (
    <>
      {/* <JsonDisplayHelper debug={true}
        componentName="Create Application and Deployment"
        elements={[
          {
            label: "FormMLSchema",
            data: formMLSchema,
          },
          {
            label: "Resolved FormMLSchema",
            data: resolvedSchema,
          },
          {
            label: "Initial Form Value",
            data: initialFormValue,
          },
          {
            label: "Create Application Action Template",
            data: createApplicationActionTemplate,
          },
          // {
          //   label: "Validation Transformer",
          //   data: validationTransformer,
          // },
        ]}
      /> */}
      <StoredRunnerView
        applicationUuid={selfApplicationMiroir.uuid}
        applicationDeploymentMap={applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
        runnerApplicationDeploymentMap={runnerApplicationDeploymentMap}
        runnerUuid={runnerDeployApplication.uuid}
      />
    </>
  );
};

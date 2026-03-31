import { useCallback } from "react";

import type {
  ApplicationDeploymentMap,
  LoggerInterface
} from "miroir-core";
import {
  defaultSelfApplicationDeploymentMap,
  MiroirLoggerFactory,
  selfApplicationMiroir
} from "miroir-core";
import { runnerDeployApplication } from "miroir-test-app_deployment-miroir";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { StoredRunnerView } from "./RunnerView.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_CreateApplication"), "UI",
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
      [values.deployApplication?.applicationBundle?.applicationUuid ?? "NO_APPLICATION_UUID"]:
        values.deployApplication?.deploymentUuid ?? "NO_DEPLOYMENT_UUID",
    }),
    [applicationDeploymentMap],
  );

  // ##############################################################################################
  // // Validation transformer: lightweight shape checks for uploaded files
  // const validationTransformer: TransformerForBuildPlusRuntime = useMemo(
  //   () => ({
  //     // Model file required: bundle must be present with applicationName, entities, and entityDefinitions.
  //     // Data file optional: pass when null; if provided, must have valid instances with parentUuid.
  //     transformerType: "ifThenElse",
  //     label: "deployApplicationAndDeploymentDataValidation",
  //     // left: false,
  //     if: {
  //       // All bundle fields must be valid (inner &&/!= return boolean directly, no then/else needed)
  //       transformerType: "boolExpr",
  //       operator: "&&",
  //       label: "applicationBundleValidation",
  //       left: {
  //         transformerType: "boolExpr",
  //         operator: "&&",
  //         left: {
  //           transformerType: "boolExpr",
  //           operator: "&&",
  //           left: {
  //             transformerType: "boolExpr",
  //             operator: "isNotNull",
  //             left: {
  //               transformerType: "getFromParameters",
  //               safe: true,
  //               referencePath: ["deployApplication", "applicationBundle"],
  //             },
  //           },
  //           right: {
  //             transformerType: "boolExpr",
  //             operator: "!=",
  //             left: {
  //               transformerType: "getFromParameters",
  //               safe: true,
  //               referencePath: ["deployApplication", "applicationBundle", "applicationName"],
  //             },
  //             right: {
  //               transformerType: "returnValue",
  //               value: "",
  //             },
  //           },
  //         },
  //         right: {
  //           transformerType: "boolExpr",
  //           operator: "isNotNull",
  //           left: {
  //             transformerType: "getFromParameters",
  //             safe: true,
  //             referencePath: ["deployApplication", "applicationBundle", "entities"],
  //           },
  //         },
  //       },
  //       right: {
  //         transformerType: "boolExpr",
  //         operator: "isNotNull",
  //         left: {
  //           transformerType: "getFromParameters",
  //           safe: true,
  //           referencePath: ["deployApplication", "applicationBundle", "entityDefinitions"],
  //         },
  //       },
  //     },
  //     then: {
  //       transformerType: "ifThenElse",
  //       if: {
  //         // Data file is optional: null deploymentData passes; if present, instances and parentUuid required.
  //         transformerType: "boolExpr",
  //         operator: "||",
  //         label: "deploymentDataValidation",
  //         left: {
  //           transformerType: "boolExpr",
  //           operator: "isNull",
  //           left: {
  //             transformerType: "getFromParameters",
  //             safe: true,
  //             referencePath: ["deployApplication", "deploymentData"],
  //           },
  //         },
  //         right: {
  //           transformerType: "boolExpr",
  //           operator: "&&",
  //           left: {
  //             transformerType: "boolExpr",
  //             operator: "isNotNull",
  //             left: {
  //               transformerType: "getFromParameters",
  //               safe: true,
  //               referencePath: ["deployApplication", "deploymentData", "instances"],
  //             },
  //           },
  //           right: {
  //             transformerType: "boolExpr",
  //             operator: "isNotNull",
  //             left: {
  //               transformerType: "getFromParameters",
  //               safe: true,
  //               referencePath: ["deployApplication", "deploymentData", "instances", "0", "parentUuid"],
  //             },
  //           },
  //         },
  //       },
  //       then: true,
  //       else: "Validation failed: if deployment data is provided, it must contain instances with parentUuid.",
  //     },
  //     // else: "Validation failed: provide a valid application bundle (applicationName, entities, entityDefinitions required); deployment data is optional but must contain instances with parentUuid if provided.",
  //     else: "Validation failed: provide a valid application bundle (applicationName, entities, entityDefinitions required)",
  //   }),
  //   [],
  // );

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

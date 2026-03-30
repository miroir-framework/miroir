import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';

import type {
  ApplicationDeploymentMap,
  CompositeActionTemplate,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstancesUuidIndex,
  JzodObject,
  LoggerInterface,
  MiroirModelEnvironment,
  ReduxDeploymentsState,
  ReduxStateWithUndoRedo,
  Runner,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  TransformerForBuildPlusRuntime,
  Uuid,
  ViewParams
} from "miroir-core";
import {
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  defaultViewParamsFromAdminStorageFetchQueryParams,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  MiroirLoggerFactory,
  noValue,
  selfApplicationMiroir,
  transformer_extended_apply_wrapper
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap, JsonDisplayHelper, useMiroirContextService, useSelector } from "miroir-react";
import {
  selfApplicationLibrary
} from "miroir-test-app_deployment-library";
import { runnerDeployApplication } from "miroir-test-app_deployment-miroir";
import { packageName } from "../../../../constants.js";
import { cleanLevel } from "../../constants.js";
import { useCurrentModelEnvironment, useReduxDeploymentsStateQuerySelectorForCleanedResult } from "../../ReduxHooks.js";
// import { devRelativePathPrefix, prodRelativePathPrefix } from '../Themes/FileSelector.js';
import type { FormMLSchema } from "./RunnerInterface.js";
import { RunnerView, StoredRunnerView } from "./RunnerView.js";

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
  // const runnerName: string = "deployApplication";
  const runnerName: string = runnerDeployApplication.name;

  const context = useMiroirContextService();

  // ##############################################################################################
  const runnerDeploymentUuid = useMemo(() => {
    const deploymentUuid =
      applicationDeploymentMap[
        applicationDeploymentMap ? Object.keys(applicationDeploymentMap)[0] : ""
      ];
    return deploymentUuid || "";
  }, [applicationDeploymentMap]);

  // ##############################################################################################
  const miroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    selfApplicationMiroir.uuid,
    defaultSelfApplicationDeploymentMap
  );
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
        getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        defaultSelfApplicationDeploymentMap,
        () => ({}),
        miroirModelEnvironment,
      )
  );

  const defaultViewParamsFromAdminStorageFetchQueryResults: Record<string, EntityInstancesUuidIndex> =
    useReduxDeploymentsStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        ReduxDeploymentsState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      defaultViewParamsFromAdminStorageFetchQueryParams(deploymentEntityStateSelectorMap),
      applicationDeploymentMap,
    );
  
  const viewParams: ViewParams | undefined = defaultViewParamsFromAdminStorageFetchQueryResults?.[
    "viewParams"
  ] as any;

  const formMLSchema: FormMLSchema = {
    ...runnerDeployApplication?.definition.formMLSchema,
    transformer: {
      type: "object",
      definition: {
        [runnerName]: runnerDeployApplication?.definition.formMLSchema.transformer,
      },
    },
  } as FormMLSchema;
            
  // runnerDeployApplication.definition.formMLSchema as FormMLSchema;
  
  const resolvedSchema: JzodObject = useMemo(
    () => formMLSchema.formMLSchemaType == "transformer"
      ? transformer_extended_apply_wrapper(
          context.miroirContext?.miroirActivityTracker,
          "build",
          [],
          "resolving formMLSchema transformer",
          formMLSchema.transformer as TransformerForBuildPlusRuntime,
        defaultMiroirModelEnvironment,
        {
          viewParams: viewParams || {},
        },
        {
          // viewParams: viewParams || {},
        },
        "value",
      )
      : formMLSchema,
    [formMLSchema],
  );
  log.info("Resolved formMLSchema for Runner_InstallApplication:", resolvedSchema);

  const initialFormValue = useMemo(
    () => getDefaultValueForJzodSchemaWithResolutionNonHook(
          "build", // step
          resolvedSchema, // mlSchema,
          // (formMLSchema as any).mlSchema,
          undefined, // rootObject
          "", // rootLessListKey,
          undefined, // currentDefaultValue
          [], // currentValuePath
          true, // forceOptional
          noValue.uuid, // storedRunner.application,
          defaultSelfApplicationDeploymentMap,
          runnerDeploymentUuid,
          miroirModelEnvironment,
          {
            viewParams: viewParams || {},
          }, // transformerParams
          {
            // viewParams: viewParams || {},
          }, // contextResults
          deploymentEntityState, // TODO: keep this? improve so that it does not depend on entire deployment state
        ),
        // ).deployApplication,
        // applicationBundle: undefined,
        // deploymentData: undefined,
      // },
    [viewParams, resolvedSchema, deploymentEntityState, runnerDeploymentUuid, miroirModelEnvironment],
  );

  const testSelfApplicationUuid = selfApplicationLibrary.uuid; // ############################################

  const testApplicationModelBranchUuid = uuidv4();
  const testApplicationVersionUuid = uuidv4();

  const runnerApplicationDeploymentMap = useCallback(
    (values: any) => ({
      ...applicationDeploymentMap,
      [values.deployApplication?.applicationBundle?.applicationUuid ?? "NO_APPLICATION_UUID"]:
        values.deployApplication?.deploymentUuid ?? "NO_DEPLOYMENT_UUID",
    }),
    [applicationDeploymentMap],
  );

  const createApplicationActionTemplate = useMemo((): CompositeActionTemplate => {
    return {
      actionType: "compositeActionSequence",
      actionLabel: "deployApplication",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      payload: runnerDeployApplication.definition.actionTemplate.payload as any,
    };
  }, [
    testApplicationModelBranchUuid,
    testSelfApplicationUuid,
    testApplicationVersionUuid,
  ]);

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
      <JsonDisplayHelper debug={true}
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
      />
      <StoredRunnerView
        applicationUuid={selfApplicationMiroir.uuid}
        applicationDeploymentMap={applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
        runnerApplicationDeploymentMap={runnerApplicationDeploymentMap}
        runnerUuid={runnerDeployApplication.uuid}
      />
  
      {/* <RunnerView
        runnerName={runnerName}
        applicationDeploymentMap={applicationDeploymentMap}
        runnerApplicationDeploymentMap={runnerApplicationDeploymentMap}
        formMLSchema={formMLSchema}
        // formMLSchema={resolvedSchema}
        initialFormValue={initialFormValue}
        action={{
          actionType: "compositeActionTemplate",
          compositeActionTemplate: createApplicationActionTemplate,
        }}
        formikValuePathAsString="deployApplication"
        formLabel="Install Existing Application"
        displaySubmitButton="onFirstLine"
        useActionButton={false}
        // validationTransformer={validationTransformer}
      /> */}
    </>
  );
};

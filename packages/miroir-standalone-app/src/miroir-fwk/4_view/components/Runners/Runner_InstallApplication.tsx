import { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from 'uuid';

import type {
  ApplicationDeploymentMap,
  CompositeActionTemplate,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstancesUuidIndex,
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
import { RunnerView } from "./RunnerView.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Runner_CreateApplication"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export interface DeployApplicationRunnerProps {
  applicationDeploymentMap: ApplicationDeploymentMap;
}

// ################################################################################################
// Static form schema for tests (no viewParams dependency)
export const Runner_InstallApplication_formMLSchema: FormMLSchema = {
  // formMLSchemaType: "mlSchema",
  formMLSchemaType: "transformer",
  // mlSchema: {
  transformer: {
    type: "object",
    definition: {
      deployApplication: {
        type: "object",
        definition: {
          applicationBundle: {
            type: "any",
            optional: true,
            tag: {
              value: {
                defaultLabel: "Application Bundle",
                display: {
                  any: {
                    format: "file",
                  },
                },
                initializeTo: {
                  initializeToType: "value",
                  value: "",
                },
                formValidation: {
                  transformer: {
                    // Application bundle required: must be present with applicationName, entities, and entityDefinitions.
                    transformerType: "ifThenElse",
                    interpolation: "runtime",
                    label: "applicationBundleValidation",
                    if: {
                      transformerType: "boolExpr",
                      interpolation: "runtime",
                      operator: "&&",
                      left: {
                        transformerType: "boolExpr",
                        interpolation: "runtime",
                        operator: "&&",
                        left: {
                          transformerType: "boolExpr",
                          interpolation: "runtime",
                          operator: "&&",
                          left: {
                            transformerType: "boolExpr",
                            interpolation: "runtime",
                            operator: "isNotNull",
                            left: {
                              transformerType: "getFromParameters",
                              interpolation: "runtime",
                              safe: true,
                              referencePath: ["deployApplication", "applicationBundle"],
                            },
                          },
                          right: {
                            transformerType: "boolExpr",
                            interpolation: "runtime",
                            operator: "!=",
                            left: {
                              transformerType: "getFromParameters",
                              interpolation: "runtime",
                              safe: true,
                              referencePath: [
                                "deployApplication",
                                "applicationBundle",
                                "applicationName",
                              ],
                            },
                            right: {
                              transformerType: "returnValue",
                              interpolation: "runtime",
                              value: "",
                            },
                          },
                        },
                        right: {
                          transformerType: "boolExpr",
                          interpolation: "runtime",
                          operator: "isNotNull",
                          left: {
                            transformerType: "getFromParameters",
                            interpolation: "runtime",
                            safe: true,
                            referencePath: ["deployApplication", "applicationBundle", "entities"],
                          },
                        },
                      },
                      right: {
                        transformerType: "boolExpr",
                        interpolation: "runtime",
                        operator: "isNotNull",
                        left: {
                          transformerType: "getFromParameters",
                          interpolation: "runtime",
                          safe: true,
                          referencePath: [
                            "deployApplication",
                            "applicationBundle",
                            "entityDefinitions",
                          ],
                        },
                      },
                    },
                    then: true,
                    else: "Provide a valid application bundle (applicationName, entities, entityDefinitions required).",
                  },
                },
              },
            },
          },
          deploymentData: {
            type: "any",
            optional: true,
            tag: {
              value: {
                defaultLabel: "Deployment Data",
                display: {
                  any: {
                    format: "file",
                  },
                },
                initializeTo: {
                  initializeToType: "value",
                  value: "",
                },
                formValidation: {
                  transformer: {
                    // Data file is optional: null/empty passes; if present, instances and parentUuid required.
                    transformerType: "ifThenElse",
                    label: "deploymentDataValidation",
                    if: {
                      transformerType: "boolExpr",
                      operator: "||",
                      left: {
                        transformerType: "boolExpr",
                        operator: "isNull",
                        left: {
                          transformerType: "getFromParameters",
                          safe: true,
                          referencePath: ["deployApplication", "deploymentData"],
                        },
                      },
                      right: {
                        transformerType: "boolExpr",
                        operator: "&&",
                        left: {
                          transformerType: "boolExpr",
                          operator: "isNotNull",
                          left: {
                            transformerType: "getFromParameters",
                            safe: true,
                            referencePath: ["deployApplication", "deploymentData", "instances"],
                          },
                        },
                        right: {
                          transformerType: "boolExpr",
                          operator: "isNotNull",
                          left: {
                            transformerType: "getFromParameters",
                            safe: true,
                            referencePath: [
                              "deployApplication",
                              "deploymentData",
                              "instances",
                              "0",
                              "parentUuid",
                            ],
                          },
                        },
                      },
                    },
                    then: true,
                    else: "If deployment data is provided, it must contain instances with parentUuid.",
                  },
                },
              },
            },
          },
          applicationStorage: {
            type: "schemaReference",
            context: {
              indexedDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "indexedDb" },
                },
              },
              filesystemDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "filesystem" },
                },
              },
              sqlDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "sql" },
                  connectionString: {
                    type: "string",
                    tag: {
                      value: {
                        defaultLabel: "SQL Connection String",
                        display: { editable: false },
                        initializeTo: {
                          initializeToType: "transformer",
                          transformer: {
                            transformerType: "getFromParameters",
                            interpolation: "runtime",
                            referencePath: ["viewParams", "postgresConnectionString"],
                          }
                        },
                      },
                    },
                  },
                },
              },
              mongoDbStoreSectionConfiguration: {
                type: "object",
                definition: {
                  emulatedServerType: { type: "literal", definition: "mongodb" },
                  connectionString: {
                    type: "string",
                    tag: {
                      value: {
                        defaultLabel: "MongoDB Connection String",
                        display: { editable: false },
                        initializeTo: {
                          initializeToType: "transformer",
                          transformer: {
                            transformerType: "getFromParameters",
                            interpolation: "runtime",
                            referencePath: ["viewParams", "mongoConnectionString"],
                          },
                        },
                      },
                    },
                  },
                },
              },
              storeSectionConfiguration: {
                type: "union",
                discriminator: "emulatedServerType",
                definition: {
                  transformerType: "concatLists",
                  lists: [
                    [
                      {
                        type: "schemaReference",
                        definition: { relativePath: "indexedDbStoreSectionConfiguration" },
                      },
                      {
                        type: "schemaReference",
                        definition: { relativePath: "filesystemDbStoreSectionConfiguration" },
                      },
                    ],
                    {
                      transformerType: "ifThenElse",
                      if: {
                        transformerType: "boolExpr",
                        operator: "==",
                        left: {
                          transformerType: "getFromContext",
                          referencePath: ["viewParams", "postgresConnectionString"],
                        },
                        right: {
                          transformerType: "returnValue",
                          value: undefined,
                        },
                      },
                      then: [],
                      else: [
                        {
                          type: "schemaReference",
                          definition: { relativePath: "sqlDbStoreSectionConfiguration" },
                        },
                      ],
                    },
                    {
                      transformerType: "ifThenElse",
                      if: {
                        transformerType: "boolExpr",
                        operator: "==",
                        left: {
                          transformerType: "getFromContext",
                          referencePath: ["viewParams", "mongoConnectionString"],
                        },
                        right: {
                          transformerType: "returnValue",
                          value: undefined,
                        },
                      },
                      then: [],
                      else: [
                        {
                          type: "schemaReference",
                          definition: { relativePath: "mongoDbStoreSectionConfiguration" },
                        },
                      ],
                    },
                  ],
                } as any,
              },
            },
            definition: {
              relativePath: "storeSectionConfiguration",
            },
          },
          deploymentUuid: {
            type: "uuid",
            tag: {
              value: {
                defaultLabel: "Deployment UUID",
                display: { editable: false },
              },
            },
          },
        },
      },
    },
  },
};

// ################################################################################################
export function getDeployApplicationActionTemplate(
  // testDeploymentUuid: Uuid,
): CompositeActionTemplate {
  const testApplicationModelBranchUuid = runnerDeployApplication.definition.actionTemplate.payload.templates.testApplicationModelBranchUuid;

  if (testApplicationModelBranchUuid.transformerType !== "generateUuid") {
    log.error("Expected testApplicationModelBranchUuid to be a generateUuid transformer, got:", testApplicationModelBranchUuid);
    throw new Error("Expected testApplicationModelBranchUuid to be a generateUuid transformer");
  }

  const createApplicationActionTemplate: CompositeActionTemplate = {
    actionType: "compositeActionSequence",
    actionLabel: "deployApplication",
    endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
    payload: runnerDeployApplication.definition.actionTemplate.payload as any,
  };

  return createApplicationActionTemplate;
}

// ################################################################################################
export function getRunner_InstallApplication(
  testSelfApplicationUuid: Uuid,
  runnerName: string,
): Runner {
  return {
    uuid: uuidv4(),
    name: runnerName,
    defaultLabel: "Install Existing Application",
    parentUuid: "e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd",
    application: testSelfApplicationUuid,
    definition: {
      runnerType: "customRunner",
      formMLSchema: Runner_InstallApplication_formMLSchema,
      actionTemplate: {
        actionType: "compositeActionSequence",
        actionLabel: "deployApplication",
        endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
        payload: runnerDeployApplication.definition.actionTemplate.payload as any,
      },
    },
  };
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
  const runnerName: string = "deployApplication";

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

  const formMLSchema: FormMLSchema = Runner_InstallApplication_formMLSchema;
  
  const resolvedSchema = useMemo(
    () => transformer_extended_apply_wrapper(
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
          viewParams: viewParams || {},
        },
        "value",
      ),
    [formMLSchema],
  );
  log.info("Resolved formMLSchema for Runner_InstallApplication:", resolvedSchema);

  const initialFormValue = useMemo(
    () => ({
      deployApplication: {
        ...getDefaultValueForJzodSchemaWithResolutionNonHook(
          "build",
          resolvedSchema,
          // (formMLSchema as any).mlSchema,
          undefined, // rootObject
          "", // rootLessListKey,
          undefined, // No need to pass currentDefaultValue here
          [], // currentPath on value is root
          true, // forceOptional
          noValue.uuid, // storedRunner.application,
          defaultSelfApplicationDeploymentMap,
          runnerDeploymentUuid,
          miroirModelEnvironment,
          {
            viewParams: viewParams || {},
          }, // transformerParams
          {
            viewParams: viewParams || {},
          }, // contextResults
          deploymentEntityState, // TODO: keep this? improve so that it does not depend on entire deployment state
        ).deployApplication,
        applicationBundle: undefined,
        deploymentData: undefined,
      },
    }),
    [viewParams, resolvedSchema, deploymentEntityState, runnerDeploymentUuid, miroirModelEnvironment],
  );

  // let applicationDeploymentMapWithNewApplication: ApplicationDeploymentMap = {};

  const testSelfApplicationUuid = selfApplicationLibrary.uuid; // ############################################

  const testApplicationModelBranchUuid = uuidv4();
  const testApplicationVersionUuid = uuidv4();

  const runnerApplicationDeploymentMap = useCallback((values: any) => ({
    ...applicationDeploymentMap,
    [values.deployApplication?.applicationBundle?.applicationUuid ?? "NO_APPLICATION_UUID"]: values.deployApplication?.deploymentUuid ?? "NO_DEPLOYMENT_UUID",
  }), [applicationDeploymentMap]);

  const createApplicationActionTemplate = useMemo((): CompositeActionTemplate => {
    const createApplicationActionTemplate: CompositeActionTemplate =
      getDeployApplicationActionTemplate();

    return createApplicationActionTemplate;
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
      <RunnerView
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
      />
    </>
  );
};

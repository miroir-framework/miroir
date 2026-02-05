import {
  Box,
  Typography
} from '@mui/material';

import { Formik, type FormikProps } from 'formik';
import {
  // adminConfigurationDeploymentAdmin,
  // adminConfigurationDeploymentLibrary,
  // adminConfigurationDeploymentMiroir,
  defaultAdminApplicationDeploymentMapNOTGOOD,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  DomainControllerInterface,
  // entityApplicationForAdmin,
  entityEndpointVersion,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  noValue,
  ReduxDeploymentsState,
  resolvePathOnObject,
  selfApplicationMiroir,
  SyncBoxedExtractorOrQueryRunnerMap,
  transformer_extended_apply_wrapper,
  type Action,
  type MiroirModelEnvironment,
  type TransformerForBuildPlusRuntime
} from 'miroir-core';
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo, useSelector } from '../../miroir-localcache-imports.js';
import { FC, useEffect, useMemo, useState } from 'react';
import { packageName } from '../../../constants.js';
import { useDomainControllerService, useMiroirContextService, useSnackbar } from '../MiroirContextReactProvider.js';
import { useCurrentModel, useCurrentModelEnvironment } from '../ReduxHooks.js';
import { cleanLevel } from '../constants.js';
// import { useReportPageContext } from './Reports/ReportPageContext.js';
import { TypedValueObjectEditor } from './Reports/TypedValueObjectEditor.js';
import { ThemedOnScreenDebug } from './Themes/BasicComponents.js';
import { ThemedPaper } from './Themes/index.js';
import { selfApplicationLibrary } from 'miroir-example-library';
import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  entityApplicationForAdmin,
} from "miroir-deployment-admin";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "EndpointActionCaller"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface EndpointActionCallerProps {}



const formikPath_EndpointActionCaller = "EndpointActionCaller";

const runnerDefinition = {
  application: selfApplicationMiroir.uuid,
  runnerName: "EndpointActionCaller",
  runnerLabel: "Call Endpoint Action",
  // currentEndpointUuid : "212f2784-5b68-43b2-8ee0-89b1c6fdd0de",
  // domainActionType : "lendDocument",
  transformer: {
    transformerType: "dataflowObject",
    label: "Get Actions for Endpoint",
    definition: {
      actions: {
        transformerType: "getFromParameters",
        referencePath: ["currentEndpoint", "definition", "actions"],
      },
      actionTypes: {
        transformerType: "mapList",
        elementTransformer: {
          transformerType: "getFromContext",
          referencePath: [
            "defaultInput",
            "actionParameters",
          ],
        },
        applyTo: {
          transformerType: "getFromContext",
          referenceName: "actions",
        },
      },
    },
  } as TransformerForBuildPlusRuntime
}

// #################################################################################################
export const EndpointActionCaller: FC<EndpointActionCallerProps> = () => {

  // const formikPath_actionDefinition = formikPath_EndpointActionCaller + "actionDefinition";
  const [actionFormInitialValues, setActionFormInitialValues] = useState<Record<string, any>>({
    [formikPath_EndpointActionCaller]: {
      applicationUuid: selfApplicationLibrary.uuid,
      endpointUuid: noValue.uuid,
      action: "",
      actionCaller: undefined,
    },
  });

  const [innerSelectedApplicationUuid, setInnerSelectedApplicationUuid] = useState<string>(
    // adminConfigurationDeploymentLibrary.uuid
    selfApplicationLibrary.uuid
  );
  // const [innerSelectedDeploymentUuid, setInnerSelectedDeploymentUuid] = useState<string>(
  //   adminConfigurationDeploymentLibrary.uuid
  // );

  const domainController: DomainControllerInterface = useDomainControllerService();
  // const reportContext = useReportPageContext();
  const context = useMiroirContextService();
  const { showSnackbar } = useSnackbar();

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    innerSelectedApplicationUuid,
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
        currentMiroirModelEnvironment
      )
  );


  // ######################################################################################
  const handleSubmit = async (values: any) => {

    try {
      // Extract action type from the current action parameters
      const formValues = values
      const currentAction = formValues.actionCaller as any;

      log.info("EndpointActionCaller: Submitting action", currentAction);

      // Call the domain controller with the action
      const result = await domainController.handleAction(
        currentAction as any, // Cast to any since we're dynamically constructing the action
        defaultSelfApplicationDeploymentMap,
        currentMiroirModelEnvironment
      );

      log.info("EndpointActionCaller: Action result", result);

      if (result.status === "error") {
        // Handle server errors with snackbar
        // if (result.isServerError && result.errorMessage) {
        if (result.errorMessage) {
          showSnackbar(`Server error: ${result.errorMessage}`, "error");
        } else {
          showSnackbar(`Action failed: ${result.errorMessage || "Unknown error"}`, "error");
        }
      } else {
        showSnackbar("Action submitted successfully!", "success");
        log.info("Action submitted successfully! Check console for details.");
      }
    } catch (error) {
      log.error("EndpointActionCaller: Error submitting action", error);

      // Check if the error has structured server error data
      if (error && typeof error === "object" && (error as any).isServerError) {
        showSnackbar(
          `Server error: ${
            (error as any).errorMessage || (error as any).message || "Unknown server error"
          }`,
          "error"
        );
      } else {
        showSnackbar("Error submitting action. Check console for details.", "error");
      }
    }
  };

  return (
    <Formik
      enableReinitialize={true}
      initialValues={actionFormInitialValues as any}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        try {
          log.info("onSubmit formik values", values);
          // await handleTransformerDefinitionSubmit(values);
          await handleSubmit(values[formikPath_EndpointActionCaller]);
        } catch (e) {
          log.error(e);
        } finally {
          setSubmitting(false);
        }
      }}
      validateOnChange={false}
      validateOnBlur={false}
    >
      {
        (
          formikContext: FormikProps<typeof actionFormInitialValues>
        ) => {

          // const selectedDeploymentUuid =
          //   defaultAdminApplicationDeploymentMapNOTGOOD[
          //     resolvePathOnObject(formikContext.values, [
          //       formikPath_EndpointActionCaller,
          //       "applicationUuid",
          //     ])
          //   ]
          // ;
          const selectedApplicationUuid = resolvePathOnObject(formikContext.values, [
                formikPath_EndpointActionCaller,
                "applicationUuid",
              ]);
          const selectedDeploymentUuid = defaultSelfApplicationDeploymentMap[selectedApplicationUuid];
          log.info(
            "EndpointActionCaller: selectedDeploymentUuid",
            selectedDeploymentUuid,
            "selectedApplicationUuid",
            selectedApplicationUuid
          );
          const currentInnerModel: MetaModel = useCurrentModel(
            selectedApplicationUuid != noValue.uuid
              ? selectedApplicationUuid
              : adminConfigurationDeploymentMiroir.uuid,
            defaultSelfApplicationDeploymentMap
          );
          // const currentInnerModel: MetaModel = useCurrentModel(
          //   selectedDeploymentUuid != noValue.uuid? selectedDeploymentUuid : adminConfigurationDeploymentMiroir.uuid
          // );

          const selectedEndpointUuid =
            formikContext.values[formikPath_EndpointActionCaller].endpointUuid;

          // Get available endpoints for selected deployment
          const availableEndpoints = currentInnerModel.endpoints;

          const currentEndpoint = useMemo(() => {
            if (!selectedEndpointUuid) return [];
            const endpoint = availableEndpoints.find((e) => e.uuid === selectedEndpointUuid);
            return endpoint;
          }, [selectedEndpointUuid, availableEndpoints]);

          log.info("EndpointActionCaller: currentEndpoint", currentEndpoint);
          // Get available actions for selected endpoint
          const availableActionsAndActionTypes: {
            actions: Action[];
            actionTypes: Action["actionParameters"][];
          } = useMemo(() => {
            return currentEndpoint
              ? transformer_extended_apply_wrapper(
                  context.miroirContext.miroirActivityTracker, // activityTracker
                  "runtime", // step
                  ["rootTransformer"], // transformerPath
                  "TransformerEditor", // label
                  runnerDefinition.transformer, // transformer
                  defaultMiroirModelEnvironment, // currentMiroirModelEnvironment, // TODO: effectively get the currentMiroirModelEnvironment from the deploymentUuid selected as input
                  {
                    defaultInput: currentEndpoint || { actions: [] },
                    currentEndpoint: currentEndpoint || { actions: [] },
                  }, // transformerParams
                  {}, // contextResults - pass the input to transform
                  "value" // resolveBuildTransformersTo
                )
              : { actions: [], actionTypes: [] };
          }, [
            currentEndpoint,
            runnerDefinition.transformer,
            context.miroirContext.miroirActivityTracker,
          ]);
          log.info("EndpointActionCaller: availableActionsAndActionTypes", availableActionsAndActionTypes);

          const selectedActionName = formikContext.values[formikPath_EndpointActionCaller].action;
          const currentAction = availableActionsAndActionTypes.actions.find(
            (action) => action.actionParameters.actionType.definition === selectedActionName
          );

          const currentActionParametersMMLSchema:JzodObject = useMemo(() => {
            return {
              type: 'object',
              definition: currentAction?.actionParameters || {}
            } as JzodObject;
          }, [currentAction]);

          log.info('EndpointActionCaller: currentActionParametersMMLSchema', currentActionParametersMMLSchema);
          const endpointActionCallerFormikSchema: JzodObject = useMemo(() => ({
            type: "object",
            definition: {
              [formikPath_EndpointActionCaller]: {
                type: "object",
                tag: {
                  value: {
                    defaultLabel: "Application Selector",
                    display: {
                      objectHideOptionalButton: true,
                      objectWithoutHeader: true,
                      objectOrArrayWithoutFrame: true,
                      objectAttributesNoIndent: true,
                    },
                  },
                },
                definition: {
                  applicationUuid: {
                    type: "uuid",
                    tag: {
                      value: {
                        defaultLabel: "Application",
                        editable: true,
                        foreignKeyParams: {
                          targetDeploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                          targetEntity: entityApplicationForAdmin.uuid,
                          targetEntityOrderInstancesBy: "name",
                        },
                        display: {
                          objectUuidAttributeLabelPosition: "hidden",
                          uuid: { selector: "muiSelector" },
                        },
                        initializeTo: {
                          initializeToType: "value",
                          value: noValue.uuid,
                        },
                      },
                    },
                  },
                  endpointUuid: {
                    type: "uuid",
                    optional: true,
                    tag: {
                      value: {
                        defaultLabel: "Endpoint",
                        editable: true,
                        foreignKeyParams: {
                          targetDeploymentUuid: {
                            transformerType: "getActiveDeployment",
                            label: "endpointUuid: Get Active Deployment for selected Application",
                            application: {
                              transformerType: "getFromParameters",
                              referencePath: [
                                formikPath_EndpointActionCaller,
                                "applicationUuid",
                              ],
                            }
                          } as any,
                          targetEntityApplicationSection: "model",
                          targetEntity: entityEndpointVersion.uuid,
                          targetEntityOrderInstancesBy: "name",
                        },
                        display: {
                          objectUuidAttributeLabelPosition: "hidden",
                          uuid: { selector: "muiSelector" },
                          hidden: {
                            transformerType: "==",
                            label: "Hide Endpoint selector if Application not selected",
                            left: {
                              transformerType: "getFromContext",
                              interpolation: "runtime",
                              referencePath: ["rootValueObject", "applicationUuid"],
                            },
                            right: noValue.uuid,
                            then: true,
                            else: false,
                          },
                        },
                        initializeTo: {
                          initializeToType: "value",
                          value: noValue.uuid,
                        },
                      },
                    },
                  },
                  action: {
                    type: "enum",
                    optional: true,
                    tag: {
                      value: {
                        defaultLabel: "Action",
                        editable: true,
                        display: {
                          hidden: {
                            transformerType: "==",
                            label: "Hide Action if Endpoint not selected",
                            left: {
                              transformerType: "getFromContext",
                              interpolation: "runtime",
                              referencePath: ["rootValueObject", "endpointUuid"],
                            },
                            right: noValue.uuid,
                            then: true,
                            else: false,
                          },
                        },
                        initializeTo: {
                          initializeToType: "value",
                          value: noValue.uuid,
                        },
                      },
                    },
                    definition: availableActionsAndActionTypes.actions.map(
                      (action, index) => action.actionParameters.actionType.definition
                    ),
                  },
                  actionCaller: currentActionParametersMMLSchema
                },
              },
            },
          }), [availableActionsAndActionTypes, currentActionParametersMMLSchema]);

          useEffect(() => {
            const initialFormState: Record<string, any> =
              !currentAction?.actionParameters ||
              !context.miroirFundamentalJzodSchema ||
              !selectedApplicationUuid
                ? {}
                : getDefaultValueForJzodSchemaWithResolutionNonHook(
                    "build",
                    currentActionParametersMMLSchema,
                    undefined, // rootObject
                    "", // rootLessListKey,
                    undefined, // No need to pass currentDefaultValue here
                    [], // currentPath on value is root
                    false, // forceOptional
                    selectedApplicationUuid,
                    defaultSelfApplicationDeploymentMap,
                    selectedDeploymentUuid,
                    currentMiroirModelEnvironment,
                    {}, // transformerParams
                    {}, // contextResults
                    deploymentEntityState,
                    {} // relativeReferenceJzodContext
                  );
            log.info(
              "EndpointActionCaller useEffect: handleActionChange Initial form state",
              initialFormState,
              "currentAction",
              currentAction
            );

            log.info(
              "EndpointActionCaller useEffect: updating action caller w<ith currentActionParametersMMLSchema",
              currentActionParametersMMLSchema,
              "initialFormState",
              initialFormState
            );
            // formikContext.setFieldValue(formikPath_EndpointActionCaller+ ".actionCaller", initialFormState);
            setActionFormInitialValues({
              ...formikContext.values,
              [formikPath_EndpointActionCaller]: {
                ...formikContext.values[formikPath_EndpointActionCaller],
                actionCaller: initialFormState,
              },
            });
          }, [currentActionParametersMMLSchema]);

          // ######################################################################################
          return (
            <ThemedPaper elevation={3} sx={{ p: 3, m: 2 }}>
              <Typography variant="h5" gutterBottom>
                Endpoint Action Caller
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Use JzodElementEditor for dynamic form generation based on action parameters schema
              </Typography>

              {/* ThemedOnScreenDebug */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <ThemedOnScreenDebug
                  label="EndpointActionCallerHelp selectedDeploymentUuid"
                  data={selectedDeploymentUuid}
                  initiallyUnfolded={false}
                />
                <ThemedOnScreenDebug
                  label="EndpointActionCallerHelp currentInnerModel"
                  data={currentInnerModel}
                  initiallyUnfolded={false}
                  useCodeBlock
                />
                <ThemedOnScreenDebug
                  label="EndpointActionCallerHelp formikContext values"
                  data={formikContext.values}
                  initiallyUnfolded={false}
                />
                <ThemedOnScreenDebug
                  label="EndpointActionCallerHelp availableEndpoints"
                  data={availableEndpoints.map((e) => ({ uuid: e.uuid, name: e.name }))}
                  initiallyUnfolded={false}
                />
                <ThemedOnScreenDebug
                  label="EndpointActionCallerHelp selectedEndpointUuid"
                  data={selectedEndpointUuid}
                  initiallyUnfolded={false}
                />
                <ThemedOnScreenDebug
                  label="EndpointActionCallerHelp availableActionsAndActionTypes"
                  data={availableActionsAndActionTypes}
                  initiallyUnfolded={false}
                />
                <ThemedOnScreenDebug
                  label="EndpointActionCallerHelp currentAction"
                  data={currentAction}
                  useCodeBlock
                  initiallyUnfolded={false}
                />
                <ThemedOnScreenDebug
                  label="EndpointActionCallerHelp currentActionParametersMMLSchema"
                  data={currentActionParametersMMLSchema}
                  useCodeBlock
                  initiallyUnfolded={false}
                />
                <ThemedOnScreenDebug
                  label="EndpointActionCallerHelp endpointActionCallerFormikSchema"
                  data={endpointActionCallerFormikSchema}
                  useCodeBlock
                  initiallyUnfolded={false}
                />
                {/* {formikContext.values[formikPath_EndpointActionCaller] && (
                  <TypedValueObjectEditor
                    labelElement={<span>select Application</span>}
                    formValueMLSchema={endpointActionCallerFormikSchema}
                    formikValuePathAsString={formikPath_EndpointActionCaller}
                    deploymentUuid={adminConfigurationDeploymentMiroir.uuid} // dummy deployment for application selection
                    applicationSection={"data"}
                    formLabel={"Submit Action"}
                    mode="create" // Readonly viewer mode, not relevant here
                    displaySubmitButton="onTop"
                    />
                  )} */}
              </Box>
              {/* EndpointActionCaller */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {formikContext.values[formikPath_EndpointActionCaller] && (
                  <TypedValueObjectEditor
                    labelElement={<span>select Application</span>}
                    formValueMLSchema={endpointActionCallerFormikSchema}
                    formikValuePathAsString={formikPath_EndpointActionCaller}
                    deploymentUuid={adminConfigurationDeploymentMiroir.uuid} // dummy deployment for application selection
                    application={innerSelectedApplicationUuid}
                    applicationDeploymentMap={defaultSelfApplicationDeploymentMap}
                    applicationSection={"data"}
                    formLabel={"Submit Action"}
                    valueObjectEditMode="create" // Readonly viewer mode, not relevant here
                    displaySubmitButton="onTop"
                    />
                  )}
              </Box>
            </ThemedPaper>
          );
      }

      }
    </Formik>
  );
};

import {
  Box,
  Typography
} from '@mui/material';

import { useSelector } from "react-redux";


import { Formik, type FormikProps } from 'formik';
import {
  adminApplicationLibrary,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  defaultAdminApplicationDeploymentMap,
  DomainControllerInterface,
  entityApplicationForAdmin,
  entityEndpointVersion,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodObject,
  LoggerInterface,
  MetaModel,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  resolvePathOnObject,
  SyncBoxedExtractorOrQueryRunnerMap,
  type JzodSchema,
  type MiroirModelEnvironment
} from 'miroir-core';
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo } from 'miroir-localcache-redux';
import { FC, useEffect, useMemo, useState } from 'react';
import { packageName } from '../../../constants.js';
import { useDomainControllerService, useMiroirContextService, useSnackbar } from '../MiroirContextReactProvider.js';
import { useCurrentModel } from '../ReduxHooks.js';
import { cleanLevel } from '../constants.js';
// import { useReportPageContext } from './Reports/ReportPageContext.js';
import { TypedValueObjectEditor } from './Reports/TypedValueObjectEditor.js';
import { ThemedOnScreenDebug } from './Themes/BasicComponents.js';
import { ThemedPaper } from './Themes/index.js';
import { noValue } from './ValueObjectEditor/JzodElementEditorInterface.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "EndpointActionCaller"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface EndpointActionCallerProps {}



const formikPath_EndpointActionCaller = "EndpointActionCaller";
// #################################################################################################
export const EndpointActionCaller: FC<EndpointActionCallerProps> = () => {

  // const formikPath_actionDefinition = formikPath_EndpointActionCaller + "actionDefinition";
  const [actionFormInitialValues, setActionFormInitialValues] = useState<Record<string, any>>({
    [formikPath_EndpointActionCaller]: {
      applicationUuid: adminApplicationLibrary.uuid,
      endpointUuid: noValue.uuid,
      action: "",
      actionCaller: undefined,
    },
  });

  const [innerSelectedDeploymentUuid, setInnerSelectedDeploymentUuid] = useState<string>(
    adminConfigurationDeploymentLibrary.uuid
  );

  const domainController: DomainControllerInterface = useDomainControllerService();
  // const reportContext = useReportPageContext();
  const context = useMiroirContextService();
  const { showSnackbar } = useSnackbar();
  const currentModel: MetaModel = useCurrentModel(innerSelectedDeploymentUuid);
    // context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  // const adminAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentAdmin.uuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const deploymentMetaModel: MetaModel = useCurrentModel(innerSelectedDeploymentUuid);
  // const [initialFormState, setInitialFormState] = useState<Record<string, any>>({});
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
      currentModel,
      miroirMetaModel: miroirMetaModel,
    };
  }, [context.miroirFundamentalJzodSchema, currentModel, miroirMetaModel]);


  // const libraryAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentLibrary.uuid);



  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
      getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
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

          const selectedDeploymentUuid =
            defaultAdminApplicationDeploymentMap[
              resolvePathOnObject(formikContext.values, [
                formikPath_EndpointActionCaller,
                "applicationUuid",
              ])
            ]
          ;
          const currentInnerModel: MetaModel = useCurrentModel(
            selectedDeploymentUuid != noValue.uuid? selectedDeploymentUuid : adminConfigurationDeploymentMiroir.uuid
          );

          const selectedEndpointUuid =
            formikContext.values[formikPath_EndpointActionCaller].endpointUuid;

          // Get available endpoints for selected deployment
          const availableEndpoints = currentInnerModel.endpoints;

          // Get available actions for selected endpoint
          const availableActions = useMemo(() => {
            if (!selectedEndpointUuid) return [];
            const endpoint = availableEndpoints.find((e) => e.uuid === selectedEndpointUuid);
            return endpoint?.definition?.actions || [];
          }, [selectedEndpointUuid, availableEndpoints]);

          const selectedActionName = formikContext.values[formikPath_EndpointActionCaller].action;
          const currentAction = availableActions.find(action => action.actionParameters.actionType.definition === selectedActionName)

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
                        selectorParams: {
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
                        selectorParams: {
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
                          // objectUuidAttributeLabelPosition: "hidden",
                          // uuid: { selector: "muiSelector" },
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
                    definition: availableActions.map(
                      (action, index) => action.actionParameters.actionType.definition
                    ),
                  },
                  actionCaller: currentActionParametersMMLSchema
                },
              },
            },
          }), [selectedDeploymentUuid, availableActions, currentActionParametersMMLSchema]);

          useEffect(() => {
            const initialFormState: Record<string, any> =
              !currentAction?.actionParameters ||
              !context.miroirFundamentalJzodSchema ||
              !selectedDeploymentUuid
                ? {}
                : getDefaultValueForJzodSchemaWithResolutionNonHook(
                    "build",
                    currentActionParametersMMLSchema,
                    undefined, // rootObject
                    "", // rootLessListKey,
                    undefined, // No need to pass currentDefaultValue here
                    [], // currentPath on value is root
                    false, // forceOptional
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
                  label="EndpointActionCallerHelp availableActions"
                  data={availableActions}
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

                {/* EndpointActionCaller */}
                {formikContext.values[formikPath_EndpointActionCaller] && (
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
                )}


              </Box>
            </ThemedPaper>
          );
      }

      }
    </Formik>
  );
};

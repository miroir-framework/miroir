import {
  Box,
  Divider,
  MenuItem,
  SelectChangeEvent,
  Typography
} from '@mui/material';

import { useSelector } from "react-redux";


import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  defaultMiroirMetaModel,
  defaultMiroirModelEnvironment,
  DomainControllerInterface,
  EndpointDefinition,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  instanceEndpointVersionV1,
  JzodObject,
  LoggerInterface,
  MetaModel,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  queryEndpointVersionV1,
  ReduxDeploymentsState,
  SelfApplicationDeploymentConfiguration,
  SyncBoxedExtractorOrQueryRunnerMap,
  type JzodSchema,
  type MiroirModelEnvironment
} from 'miroir-core';
import { Action } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js';
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo } from 'miroir-localcache-redux';
import { FC, useMemo, useState } from 'react';
import { deployments, packageName } from '../../../constants.js';
import { useDomainControllerService, useMiroirContextService, useSnackbar } from '../MiroirContextReactProvider.js';
import { useCurrentModel } from '../ReduxHooks.js';
import { cleanLevel } from '../constants.js';
import { TypedValueObjectEditorWithFormik } from './Reports/TypedValueObjectEditorWithFormik.js';
import { ThemedFormControl, ThemedInputLabel, ThemedMUISelect, ThemedPaper } from './Themes/index.js';
import { useReportPageContext } from './Reports/ReportPageContext.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "EndpointActionCaller"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export interface EndpointActionCallerProps {}

// interface Endpoint {
//   uuid: string;
//   name: string;
//   definition: {
//     actions: Array<{
//       actionParameters: JzodObject;
//     }>;
//   };
// }

// interface Action {
//   actionParameters: JzodObject;
// }

// Predefined endpoints from Miroir core
const miroirEndpoints: EndpointDefinition[] = [
  instanceEndpointVersionV1,
  queryEndpointVersionV1,
  // {
  //   uuid: modelEndpointV1.uuid,
  //   name: "Model Endpoint",
  //   definition: modelEndpointV1.definition
  // },
  // {
  //   uuid: instanceEndpointVersionV1.uuid, 
  //   name: "Instance Endpoint",
  //   definition: instanceEndpointVersionV1.definition
  // },
  // {
  //   uuid: storeManagementEndpoint.uuid,
  //   name: "Store Management Endpoint", 
  //   definition: storeManagementEndpoint.definition
  // },
  // {
  //   uuid: undoRedoEndpointVersionV1.uuid,
  //   name: "Undo/Redo Endpoint",
  //   definition: undoRedoEndpointVersionV1.definition
  // }
];

// #################################################################################################
export const EndpointActionCaller: FC<EndpointActionCallerProps> = () => {
  const [selectedDeploymentUuid, setSelectedDeploymentUuid] = useState<string>('');
  const [selectedEndpointUuid, setSelectedEndpointUuid] = useState<string>('');
  const [selectedActionIndex, setSelectedActionIndex] = useState<number>(-1);
  const [actionFormInitialValues, setActionFormInitialValues] = useState<Record<string, any>>({});

  const domainController: DomainControllerInterface = useDomainControllerService();
  const reportContext = useReportPageContext();
  const context = useMiroirContextService();
  const { showSnackbar } = useSnackbar();
  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  );
  const adminAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentAdmin.uuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
    return {
      miroirFundamentalJzodSchema:
        context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
      currentModel,
      miroirMetaModel: miroirMetaModel,
    };
  }, [context.miroirFundamentalJzodSchema, currentModel, miroirMetaModel]);


  // const libraryAppModel: MetaModel = useCurrentModel(adminConfigurationDeploymentLibrary.uuid);

  // Get available endpoints for selected deployment
  const availableEndpoints = useMemo(() => {
    if (!selectedDeploymentUuid) return [];
    
    // For all deployments, include the Miroir core endpoints
    let endpoints = [...miroirEndpoints];
    
    // TODO: Add deployment-specific endpoints if they exist
    // This would require querying the deployment's specific endpoints
    
    return endpoints;
  }, [selectedDeploymentUuid]);

  // Get available actions for selected endpoint
  const availableActions = useMemo(() => {
    if (!selectedEndpointUuid) return [];
    
    const endpoint = availableEndpoints.find(e => e.uuid === selectedEndpointUuid);
    return endpoint?.definition?.actions || [];
  }, [selectedEndpointUuid, availableEndpoints]);

  // Get current action
  const currentAction = useMemo(() => {
    if (selectedActionIndex === -1 || !availableActions[selectedActionIndex]) return null;
    return availableActions[selectedActionIndex];
  }, [selectedActionIndex, availableActions]);

  const currentActionParametersMMLSchema:JzodObject | undefined = useMemo(() => {
    if (!currentAction?.actionParameters) return undefined;

    return {
      type: 'object',
      definition: currentAction.actionParameters || {}
    } as JzodObject;
  }, [currentAction]);
  log.info('EndpointActionCaller: currentActionParametersMMLSchema', currentActionParametersMMLSchema);

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

  const handleDeploymentChange = (event: SelectChangeEvent) => {
    setSelectedDeploymentUuid(event.target.value);
    setSelectedEndpointUuid('');
    setSelectedActionIndex(-1);
    reportContext.setFoldedObjectAttributeOrArrayItems({});
  };

  const handleEndpointChange = (event: SelectChangeEvent<string>) => {
    setSelectedEndpointUuid(event.target.value);
    setSelectedActionIndex(-1);
    reportContext.setFoldedObjectAttributeOrArrayItems({});
  };

  const handleActionChange = (event: SelectChangeEvent) => {
    log.info('EndpointActionCaller: handleActionChange', event.target.value);
    setSelectedActionIndex(parseInt(event.target.value));
    reportContext.setFoldedObjectAttributeOrArrayItems({});
    
    const selectedActionIndex = parseInt(event.target.value);
    const currentAction =
      selectedActionIndex === -1 || !availableActions[selectedActionIndex]
        ? null
        : availableActions[selectedActionIndex];

    const initialFormState: Record<string, any> =
      !currentAction?.actionParameters ||
      !context.miroirFundamentalJzodSchema ||
      !selectedDeploymentUuid
        ? {}
        : getDefaultValueForJzodSchemaWithResolutionNonHook(
            "build",
            {
              type: "object",
              definition: currentAction.actionParameters || {},
            },
            undefined, // rootObject
            "", // rootLessListKey,
            undefined, // No need to pass currentDefaultValue here
            [], // currentPath on value is root
            deploymentEntityState,
            false, // forceOptional
            selectedDeploymentUuid,
            currentMiroirModelEnvironment,
            {} // relativeReferenceJzodContext
          );
    log.info(
      "EndpointActionCaller: handleActionChange Initial form state",
      initialFormState,
      "currentAction",
      currentAction
    );
    setActionFormInitialValues(initialFormState);
  };

  const handleSubmit = async (values: any) => {
    if (!currentAction || !selectedDeploymentUuid || !selectedEndpointUuid) {
      log.error('EndpointActionCaller: Missing required fields for submission');
      return;
    }

    try {
      // Extract action type from the current action parameters
      // const actionTypeElement = currentAction.actionParameters?.definition?.actionType as any;
      const actionTypeElement = currentAction.actionParameters?.actionType as any;
      const actionType = actionTypeElement?.definition;
      if (!actionType) {
        log.error('EndpointActionCaller: Could not determine action type from action parameters');
        return;
      }

      // Construct the action object based on the form data
      const actionToSubmit = {
        actionType,
        endpoint: selectedEndpointUuid,
        deploymentUuid: selectedDeploymentUuid,
        ...values // Spread Formik values which should include payload and other fields
      };

      log.info('EndpointActionCaller: Submitting action', actionToSubmit);
      
      // Call the domain controller with the action
      const result = await domainController.handleAction(
        actionToSubmit as any, // Cast to any since we're dynamically constructing the action
        defaultMiroirModelEnvironment
      );

      log.info('EndpointActionCaller: Action result', result);
      
      if (result.status === 'error') {
        // Handle server errors with snackbar
        // if (result.isServerError && result.errorMessage) {
        if (result.errorMessage) {
          showSnackbar(`Server error: ${result.errorMessage}`, "error");
        } else {
          showSnackbar(`Action failed: ${result.errorMessage || 'Unknown error'}`, "error");
        }
      } else {
        showSnackbar('Action submitted successfully!', "success");
        log.info('Action submitted successfully! Check console for details.');
      }
      
    } catch (error) {
      log.error('EndpointActionCaller: Error submitting action', error);
      
      // Check if the error has structured server error data
      if (error && typeof error === 'object' && (error as any).isServerError) {
        showSnackbar(`Server error: ${(error as any).errorMessage || (error as any).message || 'Unknown server error'}`, "error");
      } else {
        showSnackbar('Error submitting action. Check console for details.', "error");
      }
    }
  };

  const getActionLabel = (action: Action, index: number): string => {
    // Try to extract action type from the action parameters
    // const actionTypeElement = action.actionParameters?.definition?.actionType as any;
    log.info('getActionLabel', action, index);
    const actionTypeElement = action.actionParameters?.actionType?.definition as any;
    const actionType = actionTypeElement?.definition;
    if (actionType) {
      return actionType; // Just return the action type without index
    }
    return `Action ${index + 1}`;
  };


  return (
    <ThemedPaper elevation={3} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Endpoint Action Caller
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Use JzodElementEditor for dynamic form generation based on action parameters schema
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Deployment Selection */}
        <ThemedFormControl fullWidth>
          <ThemedInputLabel id="deployment-select-label">Choose a Deployment</ThemedInputLabel>
          <ThemedMUISelect
            labelId="deployment-select-label"
            id="deployment-select"
            value={selectedDeploymentUuid}
            label="Choose a Deployment"
            onChange={handleDeploymentChange}
          >
            {deployments.map((deployment: SelfApplicationDeploymentConfiguration) => (
              <MenuItem key={deployment.uuid} value={deployment.uuid}>
                {deployment.description || deployment.name}
              </MenuItem>
            ))}
          </ThemedMUISelect>
        </ThemedFormControl>

        {/* Endpoint Selection */}
        {selectedDeploymentUuid && (
          <ThemedFormControl fullWidth>
            <ThemedInputLabel id="endpoint-select-label">Choose an Endpoint</ThemedInputLabel>
            <ThemedMUISelect
              labelId="endpoint-select-label"
              id="endpoint-select"
              value={selectedEndpointUuid}
              label="Choose an Endpoint"
              onChange={handleEndpointChange}
            >
              {availableEndpoints.map((endpoint) => (
                // <MenuItem key={endpoint.uuid} value={endpoint.uuid}>
                <MenuItem key={endpoint.uuid} value={endpoint.uuid}>
                  {/* {endpoint.name} */}
                  {endpoint.description || endpoint.name}
                </MenuItem>
              ))}
            </ThemedMUISelect>
          </ThemedFormControl>
        )}

        {/* Action Selection */}
        {selectedEndpointUuid && availableActions.length > 0 && (
          <ThemedFormControl fullWidth>
            <ThemedInputLabel id="action-select-label">Choose an Action</ThemedInputLabel>
            <ThemedMUISelect
              labelId="action-select-label"
              id="action-select"
              value={selectedActionIndex === -1 ? '' : selectedActionIndex.toString()}
              label="Choose an Action"
              onChange={handleActionChange}
            >
              {availableActions.map((action, index) => (
                <MenuItem key={action.actionParameters.actionType.definition} value={index.toString()}>
                  {/* {getActionLabel(action, index)} */}
                  {action.actionParameters.actionType.definition}
                </MenuItem>
              ))}
            </ThemedMUISelect>
          </ThemedFormControl>
        )}

        {/* Dynamic Form with JzodElementEditor */}
        {currentAction && currentActionParametersMMLSchema && (
          <Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Action Parameters
            </Typography>
            <TypedValueObjectEditorWithFormik
              labelElement={<ThemedInputLabel>Action Parameters</ThemedInputLabel>}
              initialValueObject={actionFormInitialValues}
              formikValuesMMLSchema={currentActionParametersMMLSchema}
              deploymentUuid={selectedDeploymentUuid}
              // applicationSection={applicationSection}
              applicationSection="data"
              // 
              formLabel={"formLabel"}
              onSubmit={handleSubmit}
            />
          </Box>
        )}

        {/* Debug Information */}
        {selectedDeploymentUuid && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="caption" display="block">
              Selected Deployment: {deployments.find(d => d.uuid === selectedDeploymentUuid)?.name}
            </Typography>
            {selectedEndpointUuid && (
              <Typography variant="caption" display="block">
                Selected Endpoint: {availableEndpoints.find(e => e.uuid === selectedEndpointUuid)?.name}
              </Typography>
            )}
            currentAction{JSON.stringify(currentAction, null, 2)}
            {currentAction && (
              <Typography variant="caption" display="block">
                {/* Selected Action: {getActionLabel(currentAction, selectedActionIndex)} */}
                Selected Action: {currentAction.actionParameters.actionType.definition}
              </Typography>
            )}
            {currentActionParametersMMLSchema && (
              <Typography variant="caption" display="block">
                Form Schema: {Object.keys(currentActionParametersMMLSchema.definition || {}).join(', ') || 'No parameters'}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </ThemedPaper>
  );
};

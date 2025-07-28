import React, { useState, useMemo, FC } from 'react';
import { Formik, FormikProps } from 'formik';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Button,
  Box,
  Typography,
  Paper,
  Divider
} from '@mui/material';
import {
  SelfApplicationDeploymentConfiguration,
  JzodElement,
  JzodObject,
  DomainControllerInterface,
  modelEndpointV1,
  instanceEndpointVersionV1,
  storeManagementEndpoint,
  undoRedoEndpointVersionV1,
  adminConfigurationDeploymentMiroir,
  LoggerInterface,
  MiroirLoggerFactory,
  defaultMiroirMetaModel
} from 'miroir-core';
import { deployments, packageName } from '../../../constants.js';
import { useDomainControllerService, useMiroirContextService } from '../MiroirContextReactProvider.js';
import { cleanLevel } from '../constants.js';
import { JzodElementEditor } from './ValueObjectEditor/JzodElementEditor.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "EndpointActionCaller")
).then((logger: LoggerInterface) => {log = logger});

export interface EndpointActionCallerProps {}

interface Endpoint {
  uuid: string;
  name: string;
  definition: {
    actions: Array<{
      actionParameters: JzodObject;
    }>;
  };
}

interface Action {
  actionParameters: JzodObject;
}

// Predefined endpoints from Miroir core
const miroirEndpoints: Endpoint[] = [
  {
    uuid: modelEndpointV1.uuid,
    name: "Model Endpoint",
    definition: modelEndpointV1.definition
  },
  {
    uuid: instanceEndpointVersionV1.uuid, 
    name: "Instance Endpoint",
    definition: instanceEndpointVersionV1.definition
  },
  {
    uuid: storeManagementEndpoint.uuid,
    name: "Store Management Endpoint", 
    definition: storeManagementEndpoint.definition
  },
  {
    uuid: undoRedoEndpointVersionV1.uuid,
    name: "Undo/Redo Endpoint",
    definition: undoRedoEndpointVersionV1.definition
  }
];

export const EndpointActionCaller: FC<EndpointActionCallerProps> = () => {
  const [selectedDeploymentUuid, setSelectedDeploymentUuid] = useState<string>('');
  const [selectedEndpointUuid, setSelectedEndpointUuid] = useState<string>('');
  const [selectedActionIndex, setSelectedActionIndex] = useState<number>(-1);
  const [foldedObjectAttributeOrArrayItems, setFoldedObjectAttributeOrArrayItems] = useState<{[k: string]: boolean}>({});
  
  const domainController: DomainControllerInterface = useDomainControllerService();
  const context = useMiroirContextService();

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

  // Create a schema for the form parameters (excluding actionType, endpoint, deploymentUuid)
  const actionParametersSchema = useMemo(() => {
    if (!currentAction?.actionParameters?.definition) return null;
    
    const filteredDefinition = Object.fromEntries(
      Object.entries(currentAction.actionParameters.definition).filter(
        ([key]) => !['actionType', 'endpoint', 'deploymentUuid'].includes(key)
      )
    );
    
    return {
      type: 'object',
      definition: filteredDefinition
    } as JzodObject;
  }, [currentAction]);

  // Initial form state for Formik
  const initialFormState = useMemo(() => {
    if (!actionParametersSchema?.definition) return {};
    
    const initialState: Record<string, any> = {};
    Object.entries(actionParametersSchema.definition).forEach(([key, schema]) => {
      const field = schema as JzodElement;
      // Set default values based on field type
      if (field.type === 'object') {
        initialState[key] = {};
      } else if (field.type === 'array') {
        initialState[key] = [];
      } else if (field.type === 'string' || field.type === 'uuid') {
        initialState[key] = '';
      } else if (field.type === 'number') {
        initialState[key] = 0;
      } else {
        initialState[key] = '';
      }
    });
    
    return initialState;
  }, [actionParametersSchema]);

  const handleDeploymentChange = (event: SelectChangeEvent) => {
    setSelectedDeploymentUuid(event.target.value);
    setSelectedEndpointUuid('');
    setSelectedActionIndex(-1);
    setFoldedObjectAttributeOrArrayItems({});
  };

  const handleEndpointChange = (event: SelectChangeEvent) => {
    setSelectedEndpointUuid(event.target.value);
    setSelectedActionIndex(-1);
    setFoldedObjectAttributeOrArrayItems({});
  };

  const handleActionChange = (event: SelectChangeEvent) => {
    setSelectedActionIndex(parseInt(event.target.value));
    setFoldedObjectAttributeOrArrayItems({});
  };

  const handleSubmit = async (values: any) => {
    if (!currentAction || !selectedDeploymentUuid || !selectedEndpointUuid) {
      log.error('EndpointActionCaller: Missing required fields for submission');
      return;
    }

    try {
      // Extract action type from the current action parameters
      const actionTypeElement = currentAction.actionParameters?.definition?.actionType as any;
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
        defaultMiroirMetaModel
      );

      log.info('EndpointActionCaller: Action result', result);
      
      if (result.status === 'error') {
        alert(`Action failed: ${result.errorMessage || 'Unknown error'}`);
      } else {
        alert('Action submitted successfully! Check console for details.');
      }
      
    } catch (error) {
      log.error('EndpointActionCaller: Error submitting action', error);
      alert('Error submitting action. Check console for details.');
    }
  };

  const getActionLabel = (action: Action, index: number): string => {
    // Try to extract action type from the action parameters
    const actionTypeElement = action.actionParameters?.definition?.actionType as any;
    const actionType = actionTypeElement?.definition;
    if (actionType) {
      return actionType; // Just return the action type without index
    }
    return `Action ${index + 1}`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2 }}>
      <Typography variant="h5" gutterBottom>
        Endpoint Action Caller
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Use JzodElementEditor for dynamic form generation based on action parameters schema
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Deployment Selection */}
        <FormControl fullWidth>
          <InputLabel id="deployment-select-label">Choose a Deployment</InputLabel>
          <Select
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
          </Select>
        </FormControl>

        {/* Endpoint Selection */}
        {selectedDeploymentUuid && (
          <FormControl fullWidth>
            <InputLabel id="endpoint-select-label">Choose an Endpoint</InputLabel>
            <Select
              labelId="endpoint-select-label"
              id="endpoint-select"
              value={selectedEndpointUuid}
              label="Choose an Endpoint"
              onChange={handleEndpointChange}
            >
              {availableEndpoints.map((endpoint) => (
                <MenuItem key={endpoint.uuid} value={endpoint.uuid}>
                  {endpoint.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Action Selection */}
        {selectedEndpointUuid && availableActions.length > 0 && (
          <FormControl fullWidth>
            <InputLabel id="action-select-label">Choose an Action</InputLabel>
            <Select
              labelId="action-select-label"
              id="action-select"
              value={selectedActionIndex === -1 ? '' : selectedActionIndex.toString()}
              label="Choose an Action"
              onChange={handleActionChange}
            >
              {availableActions.map((action, index) => (
                <MenuItem key={index} value={index.toString()}>
                  {getActionLabel(action, index)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Dynamic Form with JzodElementEditor */}
        {currentAction && actionParametersSchema && (
          <Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Action Parameters
            </Typography>
            
            <Formik
              enableReinitialize={true}
              initialValues={initialFormState}
              onSubmit={handleSubmit}
            >
              {(formik: FormikProps<any>) => (
                <form onSubmit={formik.handleSubmit}>
                  <JzodElementEditor
                    name="actionParameters"
                    listKey="ROOT"
                    rootLessListKey=""
                    rootLessListKeyArray={[]}
                    currentDeploymentUuid={context.deploymentUuid}
                    currentApplicationSection="data"
                    foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
                    setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
                    resolvedElementJzodSchema={actionParametersSchema}
                    typeCheckKeyMap={{}}
                    foreignKeyObjects={{}}
                    indentLevel={0}
                  />
                  
                  <Box sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={
                        !selectedDeploymentUuid ||
                        !selectedEndpointUuid ||
                        selectedActionIndex === -1
                      }
                      size="large"
                    >
                      Submit Action
                    </Button>
                  </Box>
                </form>
              )}
            </Formik>
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
            {currentAction && (
              <Typography variant="caption" display="block">
                Selected Action: {getActionLabel(currentAction, selectedActionIndex)}
              </Typography>
            )}
            {actionParametersSchema && (
              <Typography variant="caption" display="block">
                Form Schema: {Object.keys(actionParametersSchema.definition || {}).join(', ') || 'No parameters'}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

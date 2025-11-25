import { Box, Container, Paper, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { MiroirLoggerFactory, type LoggerInterface, adminConfigurationDeploymentAdmin } from "miroir-core";
import { packageName } from "../../../constants.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { cleanLevel } from "../constants.js";
import { usePageConfiguration } from "../services/index.js";
import { MiroirThemeSelector } from '../components/MiroirThemeSelector.js';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';
import { useDomainControllerService, useMiroirContextService } from '../MiroirContextReactProvider.js';
import { useSelector } from 'react-redux';
import {
  defaultViewParamsFromAdminStorageFetchQueryParams,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstancesUuidIndex,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  ViewParamsData
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap } from "miroir-localcache-redux";
import { useReduxDeploymentsStateQuerySelectorForCleanedResult } from '../ReduxHooks.js';
import { useMemo } from 'react';
import { ViewParamsUpdateQueue, ViewParamsUpdateQueueConfig } from '../components/ViewParamsUpdateQueue.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SettingsPage"), "UI",
).then((logger: LoggerInterface) => {log = logger});

const pageLabel = "Settings";

// ################################################################################################
export const SettingsPage: React.FC<any> = (
  props: any
) => {
  const miroirTheme = useMiroirTheme();
  const context = useMiroirContextService();
  const domainController = useDomainControllerService();
  
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Settings page configurations loaded successfully",
    actionName: "settings page configuration fetch"
  });

  // Get viewParams from Redux to access grid type
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);

  const stableQueryParams = useMemo(
    () => defaultViewParamsFromAdminStorageFetchQueryParams(deploymentEntityStateSelectorMap),
    [deploymentEntityStateSelectorMap]
  );

  const defaultViewParamsFromAdminStorageFetchQueryResults: Record<
    string,
    EntityInstancesUuidIndex
  > = useReduxDeploymentsStateQuerySelectorForCleanedResult(
    deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
      ReduxDeploymentsState,
      Domain2QueryReturnType<DomainElementSuccess>
    >,
    stableQueryParams
  );

  const viewParamsData: ViewParamsData | undefined = useMemo(
    () => (defaultViewParamsFromAdminStorageFetchQueryResults?.["viewParams"] as any),
    [defaultViewParamsFromAdminStorageFetchQueryResults]
  );

  const currentGridType = viewParamsData?.gridType || "ag-grid";

  // Initialize the ViewParamsUpdateQueue
  const updateQueue = useMemo(() => {
    if (!viewParamsData) {
      return null;
    }

    const viewParamsInstanceUuid = Object.keys(viewParamsData)[0];

    if (!viewParamsInstanceUuid) {
      return null;
    }

    const config: ViewParamsUpdateQueueConfig = {
      delayMs: 5000,
      deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
      viewParamsInstanceUuid: viewParamsInstanceUuid,
    };

    try {
      return ViewParamsUpdateQueue.getInstance(config, domainController);
    } catch (error) {
      log.error("Failed to initialize ViewParamsUpdateQueue", error);
      return null;
    }
  }, [
    viewParamsData ? Object.keys(viewParamsData)[0] : null,
    domainController,
  ]);

  const handleGridTypeChange = (event: SelectChangeEvent<string>) => {
    const newGridType = event.target.value as "ag-grid" | "glide-data-grid";
    
    if (viewParamsData && updateQueue) {
      updateQueue.queueUpdate(
        {
          currentValue: viewParamsData,
          updates: {
            gridType: newGridType,
          },
        },
        true
      ); // Force immediate processing for grid type changes
      log.info("SettingsPage: Queued grid type change (immediate)", {
        from: currentGridType,
        to: newGridType,
      });
    }
  };

  return (
    <PageContainer>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom
          sx={{ 
            mb: 4,
            color: miroirTheme.currentTheme.colors.text 
          }}
        >
          {pageLabel}
        </Typography>
        
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3,
            backgroundColor: miroirTheme.currentTheme.colors.background,
            color: miroirTheme.currentTheme.colors.text,
            border: `1px solid ${miroirTheme.currentTheme.colors.border}`,
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ mb: 3 }}
          >
            Appearance
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <MiroirThemeSelector 
              size="medium"
              showDescription={true}
              label="App Theme"
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ mb: 2, mt: 3 }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="grid-type-label">Grid Type</InputLabel>
              <Select
                labelId="grid-type-label"
                id="grid-type-select"
                value={currentGridType}
                onChange={handleGridTypeChange}
                label="Grid Type"
                sx={{
                  color: miroirTheme.currentTheme.colors.text,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: miroirTheme.currentTheme.colors.border,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: miroirTheme.currentTheme.colors.primary,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: miroirTheme.currentTheme.colors.primary,
                  },
                }}
              >
                <MenuItem value="ag-grid">AG-Grid</MenuItem>
                <MenuItem value="glide-data-grid">Glide Data Grid</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Typography 
            variant="body2" 
            color="textSecondary"
            sx={{ 
              mt: 2,
              fontStyle: 'italic',
              opacity: 0.8 
            }}
          >
            Customize the appearance and behavior of the application
          </Typography>
        </Paper>
      </Container>
    </PageContainer>
  );
};

export default SettingsPage;

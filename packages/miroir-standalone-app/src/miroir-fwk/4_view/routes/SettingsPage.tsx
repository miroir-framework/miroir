import { Box, Container, Paper, Typography } from '@mui/material';
import { MiroirLoggerFactory, type LoggerInterface } from "miroir-core";
import { packageName } from "../../../constants.js";
import { PageContainer } from "../components/Page/PageContainer.js";
import { cleanLevel } from "../constants.js";
import { usePageConfiguration } from "../services/index.js";
import { MiroirThemeSelector } from '../components/MiroirThemeSelector.js';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';

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
  
  // Auto-fetch configurations when the page loads
  const { fetchConfigurations } = usePageConfiguration({
    autoFetchOnMount: true,
    successMessage: "Settings page configurations loaded successfully",
    actionName: "settings page configuration fetch"
  });

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
          
          <Typography 
            variant="body2" 
            color="textSecondary"
            sx={{ 
              mt: 2,
              fontStyle: 'italic',
              opacity: 0.8 
            }}
          >
            Choose a theme to customize the appearance of the application
          </Typography>
        </Paper>
      </Container>
    </PageContainer>
  );
};

export default SettingsPage;

import React, { useEffect, useState } from 'react';
import { Box, BoxProps } from '@mui/material';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext.js';

interface PageContainerProps extends Omit<BoxProps, 'sx'> {
  children: React.ReactNode;
  /**
   * Whether to account for sidebar width (default: true)
   */
  withSidebar?: boolean;
  /**
   * Whether to account for document outline width (default: true)
   */
  withDocumentOutline?: boolean;
  /**
   * Additional padding (default: 2)
   */
  padding?: number;
  /**
   * Custom sx prop for additional styling
   */
  customSx?: BoxProps['sx'];
}

/**
 * Common page container that prevents overflow and handles sidebar/outline spacing
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  withSidebar = true,
  withDocumentOutline = true,
  padding = 0,
  customSx = {},
  ...boxProps
}) => {
  const theme = useMiroirTheme();
  
  // Simplified: Let RootComponent's ThemedMainPanel handle all width/margin calculations
  // PageContainer just provides basic flex layout and theme styling

  return (
    <Box
      {...boxProps}
      sx={{
        // Theme-based styling
        backgroundColor: theme.currentTheme.colors.background,
        color: theme.currentTheme.colors.text,
        
        // Use full available space - parent (RootComponent) handles sidebar/outline margins
        width: '100%',
        minWidth: '20vw', // Allow shrinking
        height: '100%',
        
        // Box model
        boxSizing: 'border-box',
        padding,
        
        // Flexbox for content management - let content determine overflow behavior
        display: 'flex',
        flexDirection: 'column',
        
        // Ensure content doesn't exceed bounds
        '& > *': {
          maxWidth: '100%',
          boxSizing: 'border-box',
        },
        
        // Handle tables and grids specifically
        '& .ag-root-wrapper, & .ag-root': {
          maxWidth: '100% !important',
        },
        
        '& [data-testid="glide-data-grid"]': {
          maxWidth: '100% !important',
        },
        
        // Responsive breakpoints
        '@media (max-width: 600px)': {
          padding: 0.5,
        },
        
        // Custom styles
        ...customSx,
      }}
    >
      {children}
    </Box>
  );
};

interface ResponsivePageContainerProps {
  children: React.ReactNode;
  customSx?: BoxProps['sx'];
  padding?: number;
}

/**
 * Responsive page container that focuses on overflow prevention
 * Layout margins are handled by RootComponent
 */
export const ResponsivePageContainer: React.FC<ResponsivePageContainerProps> = ({
  children,
  customSx = {},
  padding = 2,
}) => {
  return (
    <PageContainer
      withSidebar={false} // Don't add sidebar margins - handled by RootComponent
      withDocumentOutline={false} // Don't add outline margins - handled by RootComponent
      padding={padding}
      customSx={customSx}
    >
      {children}
    </PageContainer>
  );
};

export default PageContainer;

import React, { useEffect, useState } from 'react';
import { Box, BoxProps } from '@mui/material';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';

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
  padding = 2,
  customSx = {},
  ...boxProps
}) => {
  const theme = useMiroirTheme();
  
  // Calculate dynamic width based on layout elements
  const calculateWidth = () => {
    let width = '100%'; // Use 100% instead of 100vw since margins are already handled by RootComponent
    let marginLeft = '0';
    let marginRight = '0';

    // Don't add additional margins - they're already handled by RootComponent
    // The RootComponent manages sidebar and outline positioning

    return { width, marginLeft, marginRight };
  };

  const { width, marginLeft, marginRight } = calculateWidth();

  return (
    <Box
      {...boxProps}
      sx={{
        // Theme-based styling
        backgroundColor: theme.currentTheme.colors.background,
        color: theme.currentTheme.colors.text,
        
        // Layout constraints - use 100% since RootComponent handles sidebar/outline margins
        width,
        minWidth: '320px', // Minimum width for mobile
        maxWidth: '100%', // Constrain to parent container
        minHeight: '100%', // Use 100% instead of 100vh to prevent overflow
        // Removed fixed height to prevent double scrollbar
        
        // Positioning - let RootComponent handle margins
        marginLeft,
        marginRight,
        
        // Overflow handling - completely prevent all scrollbars
        overflow: 'hidden',
        
        // Box model
        boxSizing: 'border-box',
        padding,
        
        // Flexbox for content management
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
          overflow: 'hidden !important',
        },
        
        '& [data-testid="glide-data-grid"]': {
          maxWidth: '100% !important',
        },
        
        // Responsive breakpoints - use CSS media queries instead
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

// ################################################################################################
// Unified Table Styling Configuration
// 
// This module provides a comprehensive theming system that works uniformly across both 
// AG-Grid and Glide Data Grid implementations. The theme system includes:
//
// 1. TableTheme interface - Defines all styling properties
// 2. defaultTableTheme - Default theme matching current display
// 3. Theme variants - Pre-built themes (dark, compact, material)
// 4. Helper functions - Generate grid-specific styles
//
// Usage Examples:
// 
// // Use default theme
// <MTableComponent {...props} />
//
// // Use a predefined theme variant
// <MTableComponent {...props} theme={darkTableTheme} />
//
// // Custom theme with overrides
// <MTableComponent {...props} theme={{
//   colors: { primary: '#ff0000' },
//   typography: { fontSize: '16px' }
// }} />
//
// // Create a completely custom theme
// const customTheme = createTableTheme({
//   colors: { primary: '#purple' },
//   components: { 
//     header: { background: '#lightgray' }
//   }
// });
// <MTableComponent {...props} theme={customTheme} />
//
// The system automatically generates appropriate styles for both grid types,
// ensuring visual consistency regardless of which grid implementation is used.
// ################################################################################################

export interface TableTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    border: string;
    text: string;
    textSecondary: string;
    textLight: string;
    hover: string;
    selected: string;
    filter: string;
    filterBackground: string;
    error: string;
    warning: string;
    success: string;
    accent: string;
    accentLight: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  typography: {
    fontSize: string;
    fontFamily: string;
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
    headerFontSize: string;
    headerFontWeight: number;
  };
  components: {
    table: {
      borderRadius: string;
      border: string;
      minHeight: string;
      maxHeight: string;
      backgroundColor: string;
      width: string;
      maxWidth: string;
      adaptiveColumnWidths: boolean;
    };
    header: {
      background: string;
      height: string;
      fontSize: string;
      fontWeight: number;
      borderBottom: string;
      textColor: string;
      hoverBackground: string;
    };
    cell: {
      height: string;
      padding: string;
      borderRight: string;
      borderBottom: string;
      fontSize: string;
      backgroundColor: string;
      textColor: string;
    };
    row: {
      hoverBackground: string;
      selectedBackground: string;
      borderBottom: string;
      evenBackground: string;
      oddBackground: string;
    };
    toolbar: {
      background: string;
      padding: string;
      borderBottom: string;
      height: string;
      textColor: string;
    };
    filter: {
      iconColor: string;
      activeIconColor: string;
      clearButtonColor: string;
      clearButtonBackground: string;
      clearButtonBorder: string;
      toolbarBackground: string;
      inputBackground: string;
      inputBorder: string;
    };
    sort: {
      iconColor: string;
      activeIconColor: string;
      ascendingSymbol: string;
      descendingSymbol: string;
    };
  };
}

// Deep partial type for theme overrides
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const defaultTableTheme: TableTheme = {
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e', 
    background: '#ffffff',
    surface: '#f8f8f8',
    border: '#e0e0e0',
    text: '#212121',
    textSecondary: '#757575',
    textLight: '#9e9e9e',
    hover: '#f5f5f5',
    selected: '#e3f2fd',
    filter: '#ff8c00',
    filterBackground: '#fff8f0',
    error: '#d32f2f',
    warning: '#ff8c00',
    success: '#388e3c',
    accent: '#1976d2',
    accentLight: 'rgba(25, 118, 210, 0.1)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontSize: '14px',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
    headerFontSize: '14px',
    headerFontWeight: 600,
  },
  components: {
    table: {
      borderRadius: '4px',
      border: '1px solid #e0e0e0',
      minHeight: '200px',
      maxHeight: '600px',
      backgroundColor: '#ffffff',
      width: '100%',
      maxWidth: '100%',
      adaptiveColumnWidths: true,
    },
    header: {
      background: '#fafafa',
      height: '36px',
      fontSize: '14px',
      fontWeight: 600,
      borderBottom: '1px solid #e0e0e0',
      textColor: '#212121',
      hoverBackground: '#f0f0f0',
    },
    cell: {
      height: '34px',
      padding: '8px 12px',
      borderRight: '1px solid #f0f0f0',
      borderBottom: '1px solid #f0f0f0',
      fontSize: '14px',
      backgroundColor: '#ffffff',
      textColor: '#212121',
    },
    row: {
      hoverBackground: '#f5f5f5',
      selectedBackground: '#e3f2fd',
      borderBottom: '1px solid #f0f0f0',
      evenBackground: '#ffffff',
      oddBackground: '#fafafa',
    },
    toolbar: {
      background: '#f8f8f8',
      padding: '8px',
      borderBottom: '1px solid #e0e0e0',
      height: 'auto',
      textColor: '#212121',
    },
    filter: {
      iconColor: '#757575',
      activeIconColor: '#ff8c00',
      clearButtonColor: '#ff8c00',
      clearButtonBackground: '#fff8f0',
      clearButtonBorder: '1px solid #ff8c00',
      toolbarBackground: '#f8f8f8',
      inputBackground: '#ffffff',
      inputBorder: '1px solid #e0e0e0',
    },
    sort: {
      iconColor: '#757575',
      activeIconColor: '#1976d2',
      ascendingSymbol: '↑',
      descendingSymbol: '↓',
    },
  },
};

// Export the theme configuration for external customization
export const createTableTheme = (overrides: DeepPartial<TableTheme> = {}): TableTheme => {
  return {
    ...defaultTableTheme,
    ...overrides,
    colors: {
      ...defaultTableTheme.colors,
      ...overrides.colors,
    },
    spacing: {
      ...defaultTableTheme.spacing,
      ...overrides.spacing,
    },
    typography: {
      ...defaultTableTheme.typography,
      ...overrides.typography,
      fontWeight: {
        ...defaultTableTheme.typography.fontWeight,
        ...overrides.typography?.fontWeight,
      },
    },
    components: {
      ...defaultTableTheme.components,
      ...overrides.components,
      table: {
        ...defaultTableTheme.components.table,
        ...overrides.components?.table,
      },
      header: {
        ...defaultTableTheme.components.header,
        ...overrides.components?.header,
      },
      cell: {
        ...defaultTableTheme.components.cell,
        ...overrides.components?.cell,
      },
      row: {
        ...defaultTableTheme.components.row,
        ...overrides.components?.row,
      },
      toolbar: {
        ...defaultTableTheme.components.toolbar,
        ...overrides.components?.toolbar,
      },
      filter: {
        ...defaultTableTheme.components.filter,
        ...overrides.components?.filter,
      },
      sort: {
        ...defaultTableTheme.components.sort,
        ...overrides.components?.sort,
      },
    },
  };
};

// Predefined theme variants
export const darkTableTheme = createTableTheme({
  colors: {
    primary: '#90caf9',
    secondary: '#f48fb1',
    background: '#121212',
    surface: '#1e1e1e',
    border: '#333333',
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    textLight: '#999999',
    hover: '#2a2a2a',
    selected: '#1976d2',
    filter: '#ff8c00',
    filterBackground: '#2a2a2a',
    error: '#f44336',
    warning: '#ff9800',
    success: '#4caf50',
    accent: '#90caf9',
    accentLight: 'rgba(144, 202, 249, 0.1)',
  },
  components: {
    table: {
      backgroundColor: '#121212',
      border: '1px solid #333333',
    },
    header: {
      background: '#1e1e1e',
      textColor: '#ffffff',
      hoverBackground: '#2a2a2a',
      borderBottom: '1px solid #333333',
    },
    cell: {
      backgroundColor: '#121212',
      textColor: '#ffffff',
      borderRight: '1px solid #333333',
      borderBottom: '1px solid #333333',
    },
    row: {
      hoverBackground: '#2a2a2a',
      selectedBackground: '#1976d2',
      borderBottom: '1px solid #333333',
      evenBackground: '#121212',
      oddBackground: '#1a1a1a',
    },
    toolbar: {
      background: '#1e1e1e',
      textColor: '#ffffff',
      borderBottom: '1px solid #333333',
    },
    filter: {
      clearButtonBackground: '#2a2a2a',
      clearButtonBorder: '1px solid #ff8c00',
      toolbarBackground: '#1e1e1e',
      inputBackground: '#1e1e1e',
      inputBorder: '1px solid #333333',
    },
  },
});

export const compactTableTheme = createTableTheme({
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  typography: {
    fontSize: '12px',
    headerFontSize: '12px',
  },
  components: {
    header: {
      height: '28px',
      fontSize: '12px',
    },
    cell: {
      height: '24px',
      padding: '4px 8px',
      fontSize: '12px',
    },
  },
});

export const materialTableTheme = createTableTheme({
  colors: {
    primary: '#2196f3',
    secondary: '#ff5722',
    background: '#fafafa',
    surface: '#ffffff',
    border: '#e1e1e1',
    text: '#212121',
    textSecondary: '#757575',
    textLight: '#9e9e9e',
    hover: '#f5f5f5',
    selected: '#e3f2fd',
    filter: '#2196f3',
    filterBackground: '#e3f2fd',
    accent: '#2196f3',
    accentLight: 'rgba(33, 150, 243, 0.1)',
  },
  components: {
    table: {
      borderRadius: '8px',
      border: '1px solid #e1e1e1',
      backgroundColor: '#ffffff',
    },
    header: {
      background: '#f5f5f5',
      textColor: '#212121',
      hoverBackground: '#eeeeee',
    },
    filter: {
      activeIconColor: '#2196f3',
      clearButtonColor: '#2196f3',
      clearButtonBackground: '#e3f2fd',
      clearButtonBorder: '1px solid #2196f3',
    },
    sort: {
      activeIconColor: '#2196f3',
    },
  },
});

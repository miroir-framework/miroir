import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { TableTheme as TableThemeId } from 'miroir-core';
import { 
  defaultTableTheme, 
  darkTableTheme, 
  compactTableTheme, 
  materialTableTheme,
  TableTheme
} from '../themes/TableTheme.js';

// Define the available theme options
export interface TableThemeOption {
  id: TableThemeId;
  name: string;
  description: string;
  theme: TableTheme;
}

export const tableThemeOptions: TableThemeOption[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Standard light theme with balanced spacing',
    theme: defaultTableTheme,
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme with reduced eye strain',
    theme: darkTableTheme,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Space-efficient theme with reduced padding',
    theme: compactTableTheme,
  },
  {
    id: 'material',
    name: 'Material',
    description: 'Google Material Design inspired theme',
    theme: materialTableTheme,
  },
];

// Context interface
interface TableThemeContextType {
  currentTheme: TableTheme;
  currentThemeId: TableThemeId;
  currentThemeOption: TableThemeOption;
  selectTheme: (themeId: TableThemeId) => void;
  availableThemes: TableThemeOption[];
}

// Create the context with a default value
const TableThemeContext = createContext<TableThemeContextType>({
  currentTheme: defaultTableTheme,
  currentThemeId: 'default',
  currentThemeOption: tableThemeOptions[0],
  selectTheme: () => {},
  availableThemes: tableThemeOptions,
});

// Provider component
interface TableThemeProviderProps {
  children: ReactNode;
  defaultThemeId?: TableThemeId;
  // Controlled mode props
  currentThemeId?: TableThemeId;
  onThemeChange?: (themeId: TableThemeId) => void;
}

export const TableThemeProvider: React.FC<TableThemeProviderProps> = ({ 
  children, 
  defaultThemeId = 'default',
  currentThemeId: controlledThemeId,
  onThemeChange: controlledOnThemeChange,
}) => {
  const [internalThemeId, setInternalThemeId] = useState<TableThemeId>(defaultThemeId);
  
  // Determine if we're in controlled mode
  const isControlled = controlledThemeId !== undefined;
  const currentThemeId = isControlled ? controlledThemeId : internalThemeId;

  const selectTheme = useCallback((themeId: TableThemeId) => {
    const validTheme = tableThemeOptions.find(option => option.id === themeId);
    if (validTheme) {
      if (isControlled) {
        // In controlled mode, call the external handler
        controlledOnThemeChange?.(themeId);
      } else {
        // In uncontrolled mode, update internal state and localStorage
        setInternalThemeId(themeId);
        localStorage.setItem('miroir-table-theme', themeId);
      }
    }
  }, [isControlled, controlledOnThemeChange]);

  // Initialize theme from localStorage on first render (only in uncontrolled mode)
  React.useEffect(() => {
    if (!isControlled) {
      const savedTheme = localStorage.getItem('miroir-table-theme') as TableThemeId;
      if (savedTheme && tableThemeOptions.find(option => option.id === savedTheme)) {
        setInternalThemeId(savedTheme);
      }
    }
  }, [isControlled]);

  const currentThemeOption = tableThemeOptions.find(option => option.id === currentThemeId) || tableThemeOptions[0];
  const currentTheme = currentThemeOption.theme;

  const contextValue: TableThemeContextType = {
    currentTheme,
    currentThemeId,
    currentThemeOption,
    selectTheme,
    availableThemes: tableThemeOptions,
  };

  return (
    <TableThemeContext.Provider value={contextValue}>
      {children}
    </TableThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTableTheme = (): TableThemeContextType => {
  const context = useContext(TableThemeContext);
  if (!context) {
    throw new Error('useTableTheme must be used within a TableThemeProvider');
  }
  return context;
};

// Hook specifically for getting just the current theme (for components that only need the theme)
export const useCurrentTableTheme = (): TableTheme => {
  const { currentTheme } = useTableTheme();
  return currentTheme;
};

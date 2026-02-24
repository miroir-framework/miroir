import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";
import {
  MiroirTheme,
  ResolvedMiroirTheme,
  MiroirThemeOption,
  defaultMiroirTheme,
  miroirThemeOptions,
} from "../components/Themes/MiroirTheme.js";
import { resolveThemeColors } from "../components/Themes/ThemeColorDefaults.js";
import type { MiroirThemeFull } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

// Re-export for convenience
export type { MiroirThemeOption };

// Context interface - always provides a ResolvedMiroirTheme
interface MiroirThemeContextType {
  // currentTheme: ResolvedMiroirTheme;
  currentTheme: MiroirThemeFull['definition'];
  currentThemeId: string;
  currentThemeOption: MiroirThemeOption;
  selectTheme: (themeId: string) => void;
  availableThemes: MiroirThemeOption[];
}

// Resolve the default theme once for the default context value
const resolvedDefaultTheme = resolveThemeColors(defaultMiroirTheme);

// Create the context with a default value
const MiroirThemeContext = createContext<MiroirThemeContextType>({
  // currentTheme: resolvedDefaultTheme,
  currentTheme: resolvedDefaultTheme,
  currentThemeId: "default",
  currentThemeOption: miroirThemeOptions[0],
  selectTheme: () => {},
  availableThemes: miroirThemeOptions,
});

// Provider component
interface MiroirThemeProviderProps {
  children: ReactNode;
  defaultThemeId?: string;
  // Support for controlled mode (when parent manages theme state)
  currentThemeId?: string;
  onThemeChange?: (themeId: string) => void;
}

export const MiroirThemeProvider: React.FC<MiroirThemeProviderProps> = ({
  children,
  defaultThemeId = "default",
  currentThemeId: controlledThemeId,
  onThemeChange: controlledOnThemeChange,
}) => {
  const [internalThemeId, setInternalThemeId] = useState<string>(defaultThemeId);

  // Determine if we're in controlled mode
  const isControlled = controlledThemeId !== undefined;
  const currentThemeId = isControlled ? controlledThemeId : internalThemeId;

  // Find the current theme option
  const currentThemeOption =
    miroirThemeOptions.find((option) => option.id === currentThemeId) || miroirThemeOptions[0];

  // Resolve all optional sub-section colors to their root color fallbacks
  const currentTheme = useMemo(
    () => resolveThemeColors(currentThemeOption.theme),
    [currentThemeOption],
  );

  const selectTheme = useCallback(
    (themeId: string) => {
      if (isControlled) {
        // In controlled mode, notify parent
        controlledOnThemeChange?.(themeId);
      } else {
        // In uncontrolled mode, manage state internally
        setInternalThemeId(themeId);
      }
    },
    [isControlled, controlledOnThemeChange],
  );

  const contextValue: MiroirThemeContextType = {
    currentTheme,
    currentThemeId,
    currentThemeOption,
    selectTheme,
    availableThemes: miroirThemeOptions,
  };

  return <MiroirThemeContext.Provider value={contextValue}>{children}</MiroirThemeContext.Provider>;
};

// Hook to use the Miroir theme context
export const useMiroirTheme = (): MiroirThemeContextType => {
  const context = useContext(MiroirThemeContext);
  if (!context) {
    throw new Error("useMiroirTheme must be used within a MiroirThemeProvider");
  }
  return context;
};

// Helper hooks for specific theme parts
export const useMiroirColors = () => {
  const { currentTheme } = useMiroirTheme();
  return currentTheme.colors;
};

export const useMiroirSpacing = () => {
  const { currentTheme } = useMiroirTheme();
  return currentTheme.spacing;
};

export const useMiroirTypography = () => {
  const { currentTheme } = useMiroirTheme();
  return currentTheme.typography;
};

export const useMiroirComponents = () => {
  const { currentTheme } = useMiroirTheme();
  return currentTheme.components;
};

export const useMiroirTableTheme = () => {
  const { currentTheme } = useMiroirTheme();
  return currentTheme.table;
};

/**
 * Hook to get the appropriate nesting background color for JzodElement editors.
 * Provides alternating background shades for nested structures (objects, arrays, tuples, records).
 * Colors cycle through 3 levels: A -> B -> C -> A -> B -> C...
 *
 * @param indentLevel - The nesting level (0-based). Defaults to 0.
 * @returns The appropriate background color for the given nesting level.
 */
export const useMiroirNestingColor = (indentLevel: number = 0): string => {
  const { currentTheme } = useMiroirTheme();

  // Ensure indentLevel is valid and within bounds
  const safeIndentLevel = Math.max(0, Math.floor(indentLevel));

  const nestingLevels = [
    currentTheme.colors.nesting.level0,
    currentTheme.colors.nesting.level1,
    currentTheme.colors.nesting.level2,
  ];

  return nestingLevels[safeIndentLevel % 3];
};

/**
 * Hook to get the appropriate border color for nested JzodElement editors.
 * Provides complementary border colors that work with the nesting background colors.
 *
 * @param indentLevel - The nesting level (0-based). Defaults to 0.
 * @returns The appropriate border color for the given nesting level.
 */
export const useMiroirNestingBorderColor = (indentLevel: number = 0): string => {
  const { currentTheme } = useMiroirTheme();

  // Ensure indentLevel is valid and within bounds
  const safeIndentLevel = Math.max(0, Math.floor(indentLevel));

  // Use a slightly darker variant of the nesting color for borders
  const baseColor = useMiroirNestingColor(safeIndentLevel);

  // For light themes, darken the color; for dark themes, lighten it
  const isDarkTheme = currentTheme.id === "dark";

  if (isDarkTheme) {
    // In dark theme, make borders lighter
    const nestingBorderLevels = ["#404040", "#484848", "#505050"];
    return nestingBorderLevels[safeIndentLevel % 3];
  } else {
    // In light theme, make borders darker
    const nestingBorderLevels = ["#e0e0e0", "#d8d8d8", "#d0d0d0"];
    return nestingBorderLevels[safeIndentLevel % 3];
  }
};

// Export the context for advanced usage
export { MiroirThemeContext };
export type { MiroirThemeContextType, MiroirThemeProviderProps };

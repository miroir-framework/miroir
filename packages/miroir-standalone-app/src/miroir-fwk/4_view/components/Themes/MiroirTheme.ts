// ################################################################################################
// Unified Miroir Application Theming System
// 
// This module provides a comprehensive theming system that extends beyond table themes
// to cover the entire miroir-standalone-app. It builds upon the table theme system and 
// provides a unified approach to styling across all components.
//
// Features:
// - Extends TableTheme with global application theming
// - Component-specific styling definitions
// - Dark mode support
// - Consistent color palettes
// - Typography definitions
// - Spacing and layout constants
//
// Usage:
// import { useMiroirTheme } from '../contexts/MiroirThemeContext';
// const theme = useMiroirTheme();
// 
// ################################################################################################

import {
  TableTheme,
  ResolvedTableTheme,
  defaultTableTheme,
  darkTableTheme,
  compactTableTheme,
  materialTableTheme,
} from "./TableTheme.js";

// Deep partial type for theme overrides
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ################################################################################################
// MiroirTheme: color properties in components sub-sections are optional.
// When not specified, they fall back to the corresponding root color
// from theme.colors via resolveThemeColors().
// See ThemeColorDefaults.ts for the full mapping documentation.
// ################################################################################################
export interface MiroirTheme {
  // Core identification
  id: string;
  name: string;
  description: string;
  
  // Global color palette (always required - this is the single source of truth for colors)
  colors: {
    // Primary brand colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    
    // Background colors
    background: string;
    backgroundPaper: string;
    backgroundOverlay: string;
    surface: string;
    surfaceVariant: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textLight: string;
    textDisabled: string;
    
    // Border and divider colors
    border: string;
    borderLight: string;
    divider: string;
    
    // State colors
    hover: string;
    selected: string;
    focused: string;
    active: string;
    
    // Status colors
    error: string;
    errorLight: string;
    errorSurface: string;
    warning: string;
    warningLight: string;
    success: string;
    successLight: string;
    successSurface: string;
    info: string;
    infoLight: string;
    
    // Special purpose colors
    accent: string;
    accentLight: string;
    shadow: string;
    overlay: string;
    
    // Nesting colors for nested editors (Prettier-like)
    nesting: {
      level0: string;  // Base level (lightest)
      level1: string;  // First nesting level
      level2: string;  // Second nesting level
    };
  };
  
  // Global spacing system
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  
  // Typography system
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      bold: number;
      extraBold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  
  // Elevation and shadows
  elevation: {
    none: string;
    low: string;
    medium: string;
    high: string;
    modal: string;
  };
  
  // Border radius
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  
  // Component-specific theming (color properties are optional, fallback to colors.*)
  components: {
    // Navigation and layout
    appBar: {
      background?: string;    // fallback: colors.primaryDark
      textColor?: string;     // fallback: colors.backgroundPaper
      borderBottom?: string;
      height?: string;
      elevation?: string;
    };
    
    sidebar: {
      background?: string;       // fallback: colors.backgroundPaper
      backgroundHover?: string;  // fallback: colors.hover
      textColor?: string;        // fallback: colors.text
      textColorActive?: string;  // fallback: colors.accent
      borderRight?: string;
      width?: string;
      itemHeight?: string;
    };
    
    drawer: {
      background?: string;  // fallback: colors.backgroundPaper
      backdrop?: string;    // fallback: colors.overlay
      elevation?: string;
    };
    
    // Forms and inputs
    input: {
      background?: string;         // fallback: colors.backgroundPaper
      backgroundHover?: string;    // fallback: colors.surface
      backgroundFocused?: string;  // fallback: colors.backgroundPaper
      borderColor?: string;        // fallback: colors.border
      borderColorHover?: string;   // fallback: colors.textSecondary
      borderColorFocused?: string; // fallback: colors.accent
      textColor?: string;          // fallback: colors.text
      placeholderColor?: string;   // fallback: colors.textLight
      borderRadius?: string;
      height?: string;
    };
    
    button: {
      primary: {
        background?: string;       // fallback: colors.accent
        backgroundHover?: string;  // fallback: colors.active
        backgroundActive?: string; // fallback: colors.active
        textColor?: string;        // fallback: colors.backgroundPaper
        borderColor?: string;      // fallback: colors.accent
        borderRadius?: string;
      };
      secondary: {
        background?: string;       // fallback: colors.secondary
        backgroundHover?: string;  // fallback: colors.secondaryDark
        backgroundActive?: string; // fallback: colors.secondaryDark
        textColor?: string;        // fallback: colors.backgroundPaper
        borderColor?: string;      // fallback: colors.secondary
        borderRadius?: string;
      };
      outlined: {
        background?: string;       // fallback: 'transparent'
        backgroundHover?: string;  // fallback: colors.accentLight
        backgroundActive?: string; // fallback: colors.accentLight
        textColor?: string;        // fallback: colors.accent
        borderColor?: string;      // fallback: colors.accent
        borderRadius?: string;
      };
    };
    
    // Data display
    card: {
      background?: string;    // fallback: colors.backgroundPaper
      borderColor?: string;   // fallback: colors.border
      borderRadius?: string;
      elevation?: string;
      padding?: string;
    };
    
    dialog: {
      background?: string;    // fallback: colors.backgroundPaper
      backdrop?: string;      // fallback: colors.overlay
      borderRadius?: string;
      elevation?: string;
      padding?: string;
    };
    
    tooltip: {
      background?: string;    // fallback: colors.overlay
      textColor?: string;     // fallback: colors.backgroundPaper
      borderRadius?: string;
      fontSize?: string;
    };
    
    // Icons and indicators
    icon: {
      colorPrimary?: string;    // fallback: colors.accent
      colorSecondary?: string;  // fallback: colors.textSecondary
      colorDisabled?: string;   // fallback: colors.textDisabled
      size: {
        sm?: string;
        md?: string;
        lg?: string;
      };
    };
  };
  
  // Table theme integration
  table: TableTheme;
  
  // Responsive breakpoints
  breakpoints: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Animation and transitions
  transitions: {
    duration: {
      short: string;
      medium: string;
      long: string;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

// ################################################################################################
// ResolvedMiroirTheme: fully resolved version where all optional colors are filled in.
// This is what consumers (ThemeUtils, components, etc.) actually receive from the context.
// ################################################################################################
export interface ResolvedMiroirTheme extends Omit<MiroirTheme, 'components' | 'table'> {
  components: {
    appBar: {
      background: string;
      textColor: string;
      borderBottom: string;
      height: string;
      elevation: string;
    };
    sidebar: {
      background: string;
      backgroundHover: string;
      textColor: string;
      textColorActive: string;
      borderRight: string;
      width: string;
      itemHeight: string;
    };
    drawer: {
      background: string;
      backdrop: string;
      elevation: string;
    };
    input: {
      background: string;
      backgroundHover: string;
      backgroundFocused: string;
      borderColor: string;
      borderColorHover: string;
      borderColorFocused: string;
      textColor: string;
      placeholderColor: string;
      borderRadius: string;
      height: string;
    };
    button: {
      primary: {
        background: string;
        backgroundHover: string;
        backgroundActive: string;
        textColor: string;
        borderColor: string;
        borderRadius: string;
      };
      secondary: {
        background: string;
        backgroundHover: string;
        backgroundActive: string;
        textColor: string;
        borderColor: string;
        borderRadius: string;
      };
      outlined: {
        background: string;
        backgroundHover: string;
        backgroundActive: string;
        textColor: string;
        borderColor: string;
        borderRadius: string;
      };
    };
    card: {
      background: string;
      borderColor: string;
      borderRadius: string;
      elevation: string;
      padding: string;
    };
    dialog: {
      background: string;
      backdrop: string;
      borderRadius: string;
      elevation: string;
      padding: string;
    };
    tooltip: {
      background: string;
      textColor: string;
      borderRadius: string;
      fontSize: string;
    };
    icon: {
      colorPrimary: string;
      colorSecondary: string;
      colorDisabled: string;
      size: {
        sm: string;
        md: string;
        lg: string;
      };
    };
  };
  table: ResolvedTableTheme;
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Default light theme
export const defaultMiroirTheme: MiroirTheme = {
  id: 'default',
  name: 'Default Light',
  description: 'Standard light theme with balanced colors and spacing',
  
  colors: {
    primary: '#7c67bcff',
    primaryLight: '#9b8ed6ff',
    // primaryDark: '#5a4a99ff',
    primaryDark: '#4527a0ff',
    secondary: '#dc004e',
    secondaryLight: '#e91e63',
    secondaryDark: '#c2185b',
    
    background: '#ffffff',
    backgroundPaper: '#ffffff',
    backgroundOverlay: 'rgba(255, 255, 255, 0.9)',
    surface: '#f8f8f8',
    surfaceVariant: '#f0f0f0',
    
    text: '#212121',
    textSecondary: '#757575',
    textLight: '#9e9e9e',
    textDisabled: '#bdbdbd',
    
    border: '#e0e0e0',
    borderLight: '#f0f0f0',
    divider: '#e0e0e0',
    
    hover: '#f5f5f5',
    selected: '#e3f2fd',
    focused: '#1976d2',
    active: '#1565c0',
    
    error: '#d32f2f',
    errorLight: '#ffebee',
    errorSurface: '#fff5f5',
    warning: '#ff8c00',
    warningLight: '#f8c68dff',
    success: '#388e3c',
    successLight: '#e8f5e8',
    successSurface: '#f9fff9',
    info: '#1976d2',
    infoLight: '#e3f2fd',
    
    accent: '#1976d2',
    accentLight: 'rgba(25, 118, 210, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Nesting colors for nested editors (Prettier-like)
    nesting: {
      level0: '#f8f8f8',  // Light gray (base level)
      level1: '#f0f0f0',  // Slightly darker gray
      level2: '#e8e8e8',  // Even darker gray
    },
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      bold: 700,
      extraBold: 900,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  
  elevation: {
    none: 'none',
    low: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    medium: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    high: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    modal: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
  },
  
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50%',
  },
  
  components: {
    appBar: {
      // background → primaryDark = '#4527a0ff' ✓ (matches, omit)
      // textColor → backgroundPaper = '#ffffff' ✓ (matches, omit)
      borderBottom: 'none',
      height: '64px',
      elevation: '0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    
    sidebar: {
      // All colors match fallback defaults:
      //   background → backgroundPaper, backgroundHover → hover,
      //   textColor → text, textColorActive → accent,
        // borderRight → computed from border
      width: '200px',
      itemHeight: '48px',
    },
    
    // drawer: all colors match fallback defaults (backgroundPaper, overlay)
    drawer: {},
    
    input: {
      // All colors match fallback defaults:
      //   background → backgroundPaper, backgroundHover → surface,
      //   backgroundFocused → backgroundPaper, borderColor → border,
      //   borderColorHover → textSecondary, borderColorFocused → accent,
      //   textColor → text, placeholderColor → textLight
      borderRadius: '4px',
      height: '40px',
    },
    
    button: {
      primary: {
        // background → accent = '#1976d2' ✓ (matches, omit)
        // backgroundHover → active = '#1565c0' ✓ (matches, omit)
        // backgroundActive → active, but we want '#0d47a1' (deeper)
        backgroundActive: '#0d47a1',
        // textColor → backgroundPaper = '#ffffff' ✓ (matches, omit)
        // borderColor → accent = '#1976d2' ✓ (matches, omit)
        borderRadius: '4px',
      },
      secondary: {
        // background → secondary = '#dc004e' ✓ (matches, omit)
        // backgroundHover → secondaryDark = '#c2185b' ✓ (matches, omit)
        backgroundActive: '#ad1457',
        // textColor → backgroundPaper = '#ffffff' ✓ (matches, omit)
        // borderColor → secondary = '#dc004e' ✓ (matches, omit)
        borderRadius: '4px',
      },
      outlined: {
        // background → 'transparent' ✓ (matches, omit)
        // backgroundHover → accentLight is rgba(25,118,210,0.1), but we want 0.04
        backgroundHover: 'rgba(25, 118, 210, 0.04)',
        backgroundActive: 'rgba(25, 118, 210, 0.08)',
        // textColor → accent = '#1976d2' ✓ (matches, omit)
        // borderColor → accent = '#1976d2' ✓ (matches, omit)
        borderRadius: '4px',
      },
    },
    
    card: {
      // background → backgroundPaper = '#ffffff' ✓ (matches, omit)
      // borderColor → border = '#e0e0e0' ✓ (matches, omit)
      borderRadius: '8px',
      elevation: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      padding: '16px',
    },
    
    dialog: {
      // background → backgroundPaper = '#ffffff' ✓ (matches, omit)
      // backdrop → overlay = 'rgba(0,0,0,0.5)' ✓ (matches, omit)
      borderRadius: '8px',
      elevation: '0 11px 15px rgba(0, 0, 0, 0.2), 0 4px 20px rgba(0, 0, 0, 0.14)',
      padding: '24px',
    },
    
    tooltip: {
      // background → overlay = 'rgba(0,0,0,0.5)', but we want 'rgba(97,97,97,0.9)'
      background: 'rgba(97, 97, 97, 0.9)',
      // textColor → backgroundPaper = '#ffffff' ✓ (matches, omit)
      borderRadius: '4px',
      fontSize: '12px',
    },
    
    icon: {
      // colorPrimary → accent = '#1976d2' ✓ (matches, omit)
      // colorSecondary → textSecondary = '#757575' ✓ (matches, omit)
      // colorDisabled → textDisabled = '#bdbdbd' ✓ (matches, omit)
      size: {
        sm: '16px',
        md: '24px',
        lg: '32px',
      },
    },
  },
  
  table: defaultTableTheme,
  
  breakpoints: {
    xs: '0px',
    sm: '600px',
    md: '960px',
    lg: '1280px',
    xl: '1920px',
  },
  
  transitions: {
    duration: {
      short: '150ms',
      medium: '300ms',
      long: '500ms',
    },
    easing: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Dark theme variant
export const darkMiroirTheme: MiroirTheme = {
  ...defaultMiroirTheme,
  id: 'dark',
  name: 'Dark',
  description: 'Dark theme with reduced eye strain for low-light environments',
  
  colors: {
    ...defaultMiroirTheme.colors,
    primary: '#90caf9',
    primaryLight: '#b3e5fc',
    primaryDark: '#0277bd',
    secondary: '#f48fb1',
    secondaryLight: '#f8bbd9',
    secondaryDark: '#e91e63',
    
    background: '#121212',
    backgroundPaper: '#1e1e1e',
    backgroundOverlay: 'rgba(18, 18, 18, 0.9)',
    surface: '#2a2a2a',
    surfaceVariant: '#333333',
    
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    textLight: '#999999',
    textDisabled: '#666666',
    
    border: '#333333',
    borderLight: '#404040',
    divider: '#333333',
    
    hover: '#2a2a2a',
    selected: '#1976d2',
    focused: '#90caf9',
    active: '#0277bd',
    
    error: '#f44336',
    errorLight: '#ffebee',
    errorSurface: '#2d1b1b',
    warning: '#ff8c00',
    warningLight: '#f8c68dff',
    success: '#4caf50',
    successLight: '#e8f5e8',
    successSurface: '#1b2d1b',
    info: '#90caf9',
    infoLight: 'rgba(144, 202, 249, 0.1)',
    
    accent: '#90caf9',
    accentLight: 'rgba(144, 202, 249, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Nesting colors for nested editors (Prettier-like, dark theme)
    nesting: {
      level0: '#2a2a2a',  // Dark gray (base level)
      level1: '#323232',  // Slightly lighter dark gray
      level2: '#3a3a3a',  // Even lighter dark gray
    },
  },
  
  components: {
    ...defaultMiroirTheme.components,
    appBar: {
      // background defaults to colors.primaryDark, but dark theme uses backgroundPaper
      background: '#1e1e1e',
      // textColor defaults to colors.backgroundPaper = '#1e1e1e', but we want white
      textColor: '#ffffff',
      borderBottom: '1px solid #333333',
      height: '64px',
      elevation: '0 2px 4px rgba(0, 0, 0, 0.3)',
    },
    
    sidebar: {
      // All colors match fallback defaults from dark root colors:
      //   background → backgroundPaper, backgroundHover → hover,
      //   textColor → text, textColorActive → accent,
      //   borderRight → computed from border
      width: '200px',
      itemHeight: '48px',
    },
    
    // drawer: all colors match fallback defaults (backgroundPaper, overlay)
    drawer: {},
    
    input: {
      // background → backgroundPaper would be #1e1e1e, but we want surface #2a2a2a
      background: '#2a2a2a',
      // backgroundHover → surface would be #2a2a2a, but we want surfaceVariant #333333
      backgroundHover: '#333333',
      // backgroundFocused → backgroundPaper would be #1e1e1e, but we want surface #2a2a2a
      backgroundFocused: '#2a2a2a',
      // borderColor → border = '#333333' ✓ (matches, omit)
      // borderColorHover → textSecondary would be #b3b3b3, but we want #666666
      borderColorHover: '#666666',
      // borderColorFocused → accent = '#90caf9' ✓ (matches, omit)
      // textColor → text = '#ffffff' ✓ (matches, omit)
      // placeholderColor → textLight = '#999999' ✓ (matches, omit)
      borderRadius: '4px',
      height: '40px',
    },
    
    button: {
      primary: {
        // background → accent = '#90caf9' ✓ (matches, omit)
        // backgroundHover → active = '#0277bd', but we want '#42a5f5'
        backgroundHover: '#42a5f5',
        backgroundActive: '#1976d2',
        // textColor → backgroundPaper = '#1e1e1e', but we want '#121212'
        textColor: '#121212',
        // borderColor → accent = '#90caf9' ✓ (matches, omit)
        borderRadius: '4px',
      },
      secondary: {
        // background → secondary = '#f48fb1' ✓ (matches, omit)
        // backgroundHover → secondaryDark = '#e91e63' ✓ (matches, omit)
        backgroundActive: '#c2185b',
        textColor: '#121212',
        // borderColor → secondary = '#f48fb1' ✓ (matches, omit)
        borderRadius: '4px',
      },
      outlined: {
        // background → 'transparent' ✓ (matches, omit)
        // backgroundHover → accentLight = 'rgba(144,202,249,0.1)', but we want 0.04
        backgroundHover: 'rgba(144, 202, 249, 0.04)',
        backgroundActive: 'rgba(144, 202, 249, 0.08)',
        // textColor → accent = '#90caf9' ✓ (matches, omit)
        // borderColor → accent = '#90caf9' ✓ (matches, omit)
        borderRadius: '4px',
      },
    },
    
    card: {
      // background → backgroundPaper = '#1e1e1e' ✓ (matches, omit)
      // borderColor → border = '#333333' ✓ (matches, omit)
      borderRadius: '8px',
      elevation: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.4)',
      padding: '16px',
    },
    
    dialog: {
      // background → backgroundPaper = '#1e1e1e' ✓ (matches, omit)
      // backdrop → overlay = 'rgba(0,0,0,0.7)' ✓ (matches, omit)
      borderRadius: '8px',
      elevation: '0 11px 15px rgba(0, 0, 0, 0.4), 0 4px 20px rgba(0, 0, 0, 0.3)',
      padding: '24px',
    },
    
    tooltip: {
      background: 'rgba(97, 97, 97, 0.9)',
      // textColor → backgroundPaper = '#1e1e1e', but we want '#ffffff'
      textColor: '#ffffff',
      borderRadius: '4px',
      fontSize: '12px',
    },
    
    icon: {
      // colorPrimary → accent = '#90caf9' ✓ (matches, omit)
      // colorSecondary → textSecondary = '#b3b3b3' ✓ (matches, omit)
      // colorDisabled → textDisabled = '#666666' ✓ (matches, omit)
      size: {
        sm: '16px',
        md: '24px',
        lg: '32px',
      },
    },
  },
  
  table: darkTableTheme,
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Compact theme variant
export const compactMiroirTheme: MiroirTheme = {
  ...defaultMiroirTheme,
  id: 'compact',
  name: 'Compact',
  description: 'Space-efficient theme with reduced padding and smaller elements',
  
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '24px',
  },
  
  typography: {
    ...defaultMiroirTheme.typography,
    fontSize: {
      xs: '10px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '20px',
    },
  },
  
  // Compact theme only adjusts sizing-related props.
  // All colors fall back to root colors via the resolver.
  // Spreads from defaultMiroirTheme.components to inherit non-color overrides (borderRadius, elevation etc.)
  components: {
    ...defaultMiroirTheme.components,
    appBar: {
      ...defaultMiroirTheme.components.appBar,
      height: '48px',
    },
    
    sidebar: {
      ...defaultMiroirTheme.components.sidebar,
      itemHeight: '36px',
    },
    
    input: {
      ...defaultMiroirTheme.components.input,
      height: '32px',
    },
    
    card: {
      ...defaultMiroirTheme.components.card,
      padding: '12px',
    },
    
    dialog: {
      ...defaultMiroirTheme.components.dialog,
      padding: '16px',
    },
  },
  
  table: compactTableTheme,
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// Material Design theme variant
export const materialMiroirTheme: MiroirTheme = {
  ...defaultMiroirTheme,
  id: 'material',
  name: 'Material Design',
  description: 'Google Material Design inspired theme with modern aesthetics',
  
  colors: {
    ...defaultMiroirTheme.colors,
    primary: '#2196f3',
    primaryLight: '#64b5f6',
    primaryDark: '#1976d2',
    secondary: '#ff5722',
    secondaryLight: '#ff8a65',
    secondaryDark: '#d84315',
    
    background: '#fafafa',
    surface: '#ffffff',
    surfaceVariant: '#f5f5f5',
    
    // Material Design specific nesting colors
    nesting: {
      level0: '#fafafa',  // Material background
      level1: '#f5f5f5',  // Material surface variant
      level2: '#eeeeee',  // Slightly darker
    },
  },
  
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50%',
  },
  
  components: {
    ...defaultMiroirTheme.components,
    appBar: {
      // background: uses #2196f3 (material primary), not primaryDark (#1976d2) → keep
      background: '#2196f3',
      // textColor → backgroundPaper = '#ffffff' ✓ (matches, omit)
      borderBottom: 'none',
      height: '64px',
      elevation: '0 4px 8px rgba(0, 0, 0, 0.12)',
    },
    
    button: {
      primary: {
        // Material uses primary=#2196f3, not accent=#1976d2 → keep explicit colors
        background: '#2196f3',
        backgroundHover: '#1976d2',
        // backgroundActive → active = '#1565c0' ✓ (matches, omit)
        // textColor → backgroundPaper = '#ffffff' ✓ (matches, omit)
        borderColor: '#2196f3',
        borderRadius: '8px',
      },
      secondary: {
        // background → secondary = '#ff5722' ✓ (matches, omit)
        // backgroundHover → secondaryDark = '#d84315' ✓ (matches, omit)
        backgroundActive: '#bf360c',
        // textColor → backgroundPaper = '#ffffff' ✓ (matches, omit)
        // borderColor → secondary = '#ff5722' ✓ (matches, omit)
        borderRadius: '8px',
      },
      outlined: {
        // background → 'transparent' ✓ (matches, omit)
        // Material uses primary=#2196f3, not accent=#1976d2 → keep these
        backgroundHover: 'rgba(33, 150, 243, 0.04)',
        backgroundActive: 'rgba(33, 150, 243, 0.08)',
        textColor: '#2196f3',
        borderColor: '#2196f3',
        borderRadius: '8px',
      },
    },
    
    card: {
      ...defaultMiroirTheme.components.card,
      borderRadius: '12px',
      elevation: '0 2px 4px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.1)',
    },
    
    icon: {
      // Material uses primary=#2196f3, not accent=#1976d2 → keep
      colorPrimary: '#2196f3',
      // colorSecondary → textSecondary = '#757575' ✓ (matches, omit)
      // colorDisabled → textDisabled = '#bdbdbd' ✓ (matches, omit)
      size: {
        sm: '16px',
        md: '24px',
        lg: '32px',
      },
    },
  },
  
  table: materialTableTheme,
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Theme creation utility function
export const createMiroirTheme = (overrides: DeepPartial<MiroirTheme> = {}): MiroirTheme => {
  const baseTheme = defaultMiroirTheme;
  
  return {
    ...baseTheme,
    ...overrides,
    colors: {
      ...baseTheme.colors,
      ...overrides.colors,
      nesting: {
        ...baseTheme.colors.nesting,
        ...overrides.colors?.nesting,
      },
    },
    spacing: {
      ...baseTheme.spacing,
      ...overrides.spacing,
    },
    typography: {
      ...baseTheme.typography,
      ...overrides.typography,
      fontSize: {
        ...baseTheme.typography.fontSize,
        ...overrides.typography?.fontSize,
      },
      fontWeight: {
        ...baseTheme.typography.fontWeight,
        ...overrides.typography?.fontWeight,
      },
      lineHeight: {
        ...baseTheme.typography.lineHeight,
        ...overrides.typography?.lineHeight,
      },
    },
    elevation: {
      ...baseTheme.elevation,
      ...overrides.elevation,
    },
    borderRadius: {
      ...baseTheme.borderRadius,
      ...overrides.borderRadius,
    },
    components: {
      ...baseTheme.components,
      ...overrides.components,
      appBar: {
        ...baseTheme.components.appBar,
        ...overrides.components?.appBar,
      },
      sidebar: {
        ...baseTheme.components.sidebar,
        ...overrides.components?.sidebar,
      },
      drawer: {
        ...baseTheme.components.drawer,
        ...overrides.components?.drawer,
      },
      input: {
        ...baseTheme.components.input,
        ...overrides.components?.input,
      },
      button: {
        ...baseTheme.components.button,
        ...overrides.components?.button,
        primary: {
          ...baseTheme.components.button.primary,
          ...overrides.components?.button?.primary,
        },
        secondary: {
          ...baseTheme.components.button.secondary,
          ...overrides.components?.button?.secondary,
        },
        outlined: {
          ...baseTheme.components.button.outlined,
          ...overrides.components?.button?.outlined,
        },
      },
      card: {
        ...baseTheme.components.card,
        ...overrides.components?.card,
      },
      dialog: {
        ...baseTheme.components.dialog,
        ...overrides.components?.dialog,
      },
      tooltip: {
        ...baseTheme.components.tooltip,
        ...overrides.components?.tooltip,
      },
      icon: {
        ...baseTheme.components.icon,
        ...overrides.components?.icon,
        size: {
          ...baseTheme.components.icon.size,
          ...overrides.components?.icon?.size,
        },
      },
    },
    table: overrides.table ? {
      ...baseTheme.table,
      ...overrides.table,
      colors: {
        ...baseTheme.table.colors,
        ...overrides.table.colors,
      },
      spacing: {
        ...baseTheme.table.spacing,
        ...overrides.table.spacing,
      },
      typography: {
        ...baseTheme.table.typography,
        ...overrides.table.typography,
        fontWeight: {
          ...baseTheme.table.typography.fontWeight,
          ...overrides.table.typography?.fontWeight,
        },
      },
      components: {
        ...baseTheme.table.components,
        ...overrides.table.components,
        table: {
          ...baseTheme.table.components.table,
          ...overrides.table.components?.table,
        },
        header: {
          ...baseTheme.table.components.header,
          ...overrides.table.components?.header,
        },
        cell: {
          ...baseTheme.table.components.cell,
          ...overrides.table.components?.cell,
        },
        row: {
          ...baseTheme.table.components.row,
          ...overrides.table.components?.row,
        },
        toolbar: {
          ...baseTheme.table.components.toolbar,
          ...overrides.table.components?.toolbar,
        },
        filter: {
          ...baseTheme.table.components.filter,
          ...overrides.table.components?.filter,
        },
        sort: {
          ...baseTheme.table.components.sort,
          ...overrides.table.components?.sort,
        },
      },
    } : baseTheme.table,
    breakpoints: {
      ...baseTheme.breakpoints,
      ...overrides.breakpoints,
    },
    transitions: {
      ...baseTheme.transitions,
      ...overrides.transitions,
      duration: {
        ...baseTheme.transitions.duration,
        ...overrides.transitions?.duration,
      },
      easing: {
        ...baseTheme.transitions.easing,
        ...overrides.transitions?.easing,
      },
    },
  };
};

// Available theme options
export interface MiroirThemeOption {
  id: string;
  name: string;
  description: string;
  theme: MiroirTheme;
}

export const miroirThemeOptions: MiroirThemeOption[] = [
  {
    id: 'default',
    name: 'Default Light',
    description: 'Standard light theme with balanced spacing',
    theme: defaultMiroirTheme,
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Dark theme with reduced eye strain',
    theme: darkMiroirTheme,
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Space-efficient theme with reduced padding',
    theme: compactMiroirTheme,
  },
  {
    id: 'material',
    name: 'Material Design',
    description: 'Google Material Design inspired theme',
    theme: materialMiroirTheme,
  },
];

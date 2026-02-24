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
  compactStoredMiroirTheme,
  darkStoredMiroirTheme,
  defaultStoredMiroirTheme,
} from "miroir-test-app_deployment-miroir";
import {
  // TableTheme,
  ResolvedTableTheme,
  // darkTableTheme,
  // compactTableTheme,
  // materialTableTheme,
} from "./TableTheme.js";
import type { StoredMiroirTheme } from "miroir-core";

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
export type MiroirTheme = StoredMiroirTheme["definition"];
// export interface MiroirTheme {
//   // Core identification
//   id: string;
//   name: string;
//   description: string;
  
//   // Global color palette (always required - this is the single source of truth for colors)
//   colors: {
//     // Primary brand colors
//     primary: string;
//     primaryLight: string;
//     primaryDark: string;
//     secondary: string;
//     secondaryLight: string;
//     secondaryDark: string;
    
//     // Background colors
//     background: string;
//     backgroundPaper: string;
//     backgroundOverlay: string;
//     surface: string;
//     surfaceVariant: string;
    
//     // Text colors
//     text: string;
//     textSecondary: string;
//     textLight: string;
//     textDisabled: string;
    
//     // Border and divider colors
//     border: string;
//     borderLight: string;
//     divider: string;
    
//     // State colors
//     hover: string;
//     selected: string;
//     focused: string;
//     active: string;
    
//     // Status colors
//     error: string;
//     errorLight: string;
//     errorSurface: string;
//     warning: string;
//     warningLight: string;
//     success: string;
//     successLight: string;
//     successSurface: string;
//     info: string;
//     infoLight: string;
    
//     // Special purpose colors
//     accent: string;
//     accentLight: string;
//     shadow: string;
//     overlay: string;
    
//     // Nesting colors for nested editors (Prettier-like)
//     nesting: {
//       level0: string;  // Base level (lightest)
//       level1: string;  // First nesting level
//       level2: string;  // Second nesting level
//     };
//   };
  
//   // Global spacing system
//   spacing: {
//     xs: string;
//     sm: string;
//     md: string;
//     lg: string;
//     xl: string;
//     xxl: string;
//   };
  
//   // Typography system
//   typography: {
//     fontFamily: string;
//     fontSize: {
//       xs: string;
//       sm: string;
//       md: string;
//       lg: string;
//       xl: string;
//       xxl: string;
//     };
//     fontWeight: {
//       light: number;
//       normal: number;
//       medium: number;
//       bold: number;
//       extraBold: number;
//     };
//     lineHeight: {
//       tight: number;
//       normal: number;
//       relaxed: number;
//     };
//   };
  
//   // Elevation and shadows
//   elevation: {
//     none: string;
//     low: string;
//     medium: string;
//     high: string;
//     modal: string;
//   };
  
//   // Border radius
//   borderRadius: {
//     none: string;
//     sm: string;
//     md: string;
//     lg: string;
//     xl: string;
//     full: string;
//   };
  
//   // Component-specific theming (color properties are optional, fallback to colors.*)
//   components: {
//     // Navigation and layout
//     appBar: {
//       background?: string;    // fallback: colors.primaryDark
//       textColor?: string;     // fallback: colors.backgroundPaper
//       borderBottom?: string;
//       height?: string;
//       elevation?: string;
//     };
    
//     sidebar: {
//       background?: string;       // fallback: colors.backgroundPaper
//       backgroundHover?: string;  // fallback: colors.hover
//       textColor?: string;        // fallback: colors.text
//       textColorActive?: string;  // fallback: colors.accent
//       borderRight?: string;
//       width?: string;
//       itemHeight?: string;
//     };
    
//     drawer: {
//       background?: string;  // fallback: colors.backgroundPaper
//       backdrop?: string;    // fallback: colors.overlay
//       elevation?: string;
//     };
    
//     // Forms and inputs
//     input: {
//       background?: string;         // fallback: colors.backgroundPaper
//       backgroundHover?: string;    // fallback: colors.surface
//       backgroundFocused?: string;  // fallback: colors.backgroundPaper
//       borderColor?: string;        // fallback: colors.border
//       borderColorHover?: string;   // fallback: colors.textSecondary
//       borderColorFocused?: string; // fallback: colors.accent
//       textColor?: string;          // fallback: colors.text
//       placeholderColor?: string;   // fallback: colors.textLight
//       borderRadius?: string;
//       height?: string;
//     };
    
//     button: {
//       primary: {
//         background?: string;       // fallback: colors.accent
//         backgroundHover?: string;  // fallback: colors.active
//         backgroundActive?: string; // fallback: colors.active
//         textColor?: string;        // fallback: colors.backgroundPaper
//         borderColor?: string;      // fallback: colors.accent
//         borderRadius?: string;
//       };
//       secondary: {
//         background?: string;       // fallback: colors.secondary
//         backgroundHover?: string;  // fallback: colors.secondaryDark
//         backgroundActive?: string; // fallback: colors.secondaryDark
//         textColor?: string;        // fallback: colors.backgroundPaper
//         borderColor?: string;      // fallback: colors.secondary
//         borderRadius?: string;
//       };
//       outlined: {
//         background?: string;       // fallback: 'transparent'
//         backgroundHover?: string;  // fallback: colors.accentLight
//         backgroundActive?: string; // fallback: colors.accentLight
//         textColor?: string;        // fallback: colors.accent
//         borderColor?: string;      // fallback: colors.accent
//         borderRadius?: string;
//       };
//     };
    
//     // Data display
//     card: {
//       background?: string;    // fallback: colors.backgroundPaper
//       borderColor?: string;   // fallback: colors.border
//       borderRadius?: string;
//       elevation?: string;
//       padding?: string;
//     };
    
//     dialog: {
//       background?: string;    // fallback: colors.backgroundPaper
//       backdrop?: string;      // fallback: colors.overlay
//       borderRadius?: string;
//       elevation?: string;
//       padding?: string;
//     };
    
//     tooltip: {
//       background?: string;    // fallback: colors.overlay
//       textColor?: string;     // fallback: colors.backgroundPaper
//       borderRadius?: string;
//       fontSize?: string;
//     };
    
//     // Icons and indicators
//     icon: {
//       colorPrimary?: string;    // fallback: colors.accent
//       colorSecondary?: string;  // fallback: colors.textSecondary
//       colorDisabled?: string;   // fallback: colors.textDisabled
//       size: {
//         sm?: string;
//         md?: string;
//         lg?: string;
//       };
//     };
//   };
  
//   // Table theme integration
//   table: TableTheme;
  
//   // Responsive breakpoints
//   breakpoints: {
//     xs: string;
//     sm: string;
//     md: string;
//     lg: string;
//     xl: string;
//   };
  
//   // Animation and transitions
//   transitions: {
//     duration: {
//       short: string;
//       medium: string;
//       long: string;
//     };
//     easing: {
//       linear: string;
//       easeIn: string;
//       easeOut: string;
//       easeInOut: string;
//     };
//   };
// }

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
export const defaultMiroirTheme = defaultStoredMiroirTheme.definition;
// export const defaultMiroirTheme = defaultStoredMiroirTheme.definition as MiroirTheme;
// export const defaultMiroirTheme: MiroirTheme = defaultStoredMiroirTheme.definition as MiroirTheme;

export const darkMiroirTheme: MiroirTheme = {
  ...darkStoredMiroirTheme.definition,
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Compact theme variant
export const compactMiroirTheme: MiroirTheme = compactStoredMiroirTheme.definition as any; // TODO: fix MiroirTheme, it should be a DeepPartial<MiroirTheme> to allow partial overrides without needing to specify all properties'
// export const compactMiroirTheme: MiroirTheme = {
//   ...defaultMiroirTheme,
//   id: 'compact',
//   name: 'Compact',
//   description: 'Space-efficient theme with reduced padding and smaller elements',
  
//   spacing: {
//     xs: '2px',
//     sm: '4px',
//     md: '8px',
//     lg: '12px',
//     xl: '16px',
//     xxl: '24px',
//   },
  
//   typography: {
//     ...defaultMiroirTheme.typography,
//     fontSize: {
//       xs: '10px',
//       sm: '12px',
//       md: '14px',
//       lg: '16px',
//       xl: '18px',
//       xxl: '20px',
//     },
//   },
  
//   // Compact theme only adjusts sizing-related props.
//   // All colors fall back to root colors via the resolver.
//   // Spreads from defaultMiroirTheme.components to inherit non-color overrides (borderRadius, elevation etc.)
//   components: {
//     ...defaultMiroirTheme.components,
//     appBar: {
//       ...defaultMiroirTheme.components.appBar,
//       height: '48px',
//     },
    
//     sidebar: {
//       ...defaultMiroirTheme.components.sidebar,
//       itemHeight: '36px',
//     },
    
//     input: {
//       ...defaultMiroirTheme.components.input,
//       height: '32px',
//     },
    
//     card: {
//       ...defaultMiroirTheme.components.card,
//       padding: '12px',
//     },
    
//     dialog: {
//       ...defaultMiroirTheme.components.dialog,
//       padding: '16px',
//     },
//   },
  
//   table: {...defaultMiroirTheme.table},  // Compact theme does not change table theme
// };

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
  
  // table: materialTableTheme,
  table: {...defaultMiroirTheme.table},  // Material theme does not change table theme
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// Theme creation utility function
export const createMiroirThemeNOT_USED = (
  // baseTheme: MiroirTheme,
  overrides: DeepPartial<MiroirTheme> = {}): MiroirTheme => {
  // const defaultMiroirTheme = defaultMiroirTheme;
  
  return {
    ...defaultMiroirTheme,
    ...overrides,
    colors: {
      ...defaultMiroirTheme.colors,
      ...overrides.colors,
      nesting: {
        ...defaultMiroirTheme.colors.nesting,
        ...overrides.colors?.nesting,
      },
    },
    spacing: {
      ...defaultMiroirTheme.spacing,
      ...overrides.spacing,
    },
    typography: {
      ...defaultMiroirTheme.typography,
      ...overrides.typography,
      fontSize: {
        ...defaultMiroirTheme.typography.fontSize,
        ...overrides.typography?.fontSize,
      },
      fontWeight: {
        ...defaultMiroirTheme.typography.fontWeight,
        ...overrides.typography?.fontWeight,
      },
      lineHeight: {
        ...defaultMiroirTheme.typography.lineHeight,
        ...overrides.typography?.lineHeight,
      },
    },
    elevation: {
      ...defaultMiroirTheme.elevation,
      ...overrides.elevation,
    },
    borderRadius: {
      ...defaultMiroirTheme.borderRadius,
      ...overrides.borderRadius,
    },
    components: {
      ...defaultMiroirTheme.components,
      ...overrides.components,
      appBar: {
        ...defaultMiroirTheme.components.appBar,
        ...overrides.components?.appBar,
      },
      sidebar: {
        ...defaultMiroirTheme.components.sidebar,
        ...overrides.components?.sidebar,
      },
      drawer: {
        ...defaultMiroirTheme.components.drawer,
        ...overrides.components?.drawer,
      },
      input: {
        ...defaultMiroirTheme.components.input,
        ...overrides.components?.input,
      },
      button: {
        ...defaultMiroirTheme.components.button,
        ...overrides.components?.button,
        primary: {
          ...defaultMiroirTheme.components.button.primary,
          ...overrides.components?.button?.primary,
        },
        secondary: {
          ...defaultMiroirTheme.components.button.secondary,
          ...overrides.components?.button?.secondary,
        },
        outlined: {
          ...defaultMiroirTheme.components.button.outlined,
          ...overrides.components?.button?.outlined,
        },
      },
      card: {
        ...defaultMiroirTheme.components.card,
        ...overrides.components?.card,
      },
      dialog: {
        ...defaultMiroirTheme.components.dialog,
        ...overrides.components?.dialog,
      },
      tooltip: {
        ...defaultMiroirTheme.components.tooltip,
        ...overrides.components?.tooltip,
      },
      icon: {
        ...defaultMiroirTheme.components.icon,
        ...overrides.components?.icon,
        size: {
          ...defaultMiroirTheme.components.icon.size,
          ...overrides.components?.icon?.size,
        },
      },
    },
    table: overrides.table ? {
      ...defaultMiroirTheme.table,
      ...overrides.table,
      colors: {
        ...defaultMiroirTheme.table.colors,
        ...overrides.table.colors,
      },
      spacing: {
        ...defaultMiroirTheme.table.spacing,
        ...overrides.table.spacing,
      },
      typography: {
        ...defaultMiroirTheme.table.typography,
        ...overrides.table.typography,
        fontWeight: {
          ...defaultMiroirTheme.table.typography.fontWeight,
          ...overrides.table.typography?.fontWeight,
        },
      },
      components: {
        ...defaultMiroirTheme.table.components,
        ...overrides.table.components,
        table: {
          ...defaultMiroirTheme.table.components.table,
          ...overrides.table.components?.table,
        },
        header: {
          ...defaultMiroirTheme.table.components.header,
          ...overrides.table.components?.header,
        },
        cell: {
          ...defaultMiroirTheme.table.components.cell,
          ...overrides.table.components?.cell,
        },
        row: {
          ...defaultMiroirTheme.table.components.row,
          ...overrides.table.components?.row,
        },
        toolbar: {
          ...defaultMiroirTheme.table.components.toolbar,
          ...overrides.table.components?.toolbar,
        },
        filter: {
          ...defaultMiroirTheme.table.components.filter,
          ...overrides.table.components?.filter,
        },
        sort: {
          ...defaultMiroirTheme.table.components.sort,
          ...overrides.table.components?.sort,
        },
      },
    } : defaultMiroirTheme.table,
    breakpoints: {
      ...defaultMiroirTheme.breakpoints,
      ...overrides.breakpoints,
    },
    transitions: {
      ...defaultMiroirTheme.transitions,
      ...overrides.transitions,
      duration: {
        ...defaultMiroirTheme.transitions.duration,
        ...overrides.transitions?.duration,
      },
      easing: {
        ...defaultMiroirTheme.transitions.easing,
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
    // theme: createMiroirThemeNOT_USED(darkMiroirTheme),
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

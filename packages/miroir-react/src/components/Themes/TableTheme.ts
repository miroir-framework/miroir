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
// <EntityInstanceGrid {...props} />
//
// // Use a predefined theme variant
// <EntityInstanceGrid {...props} theme={darkTableTheme} />
//
// // Custom theme with overrides
// <EntityInstanceGrid {...props} theme={{
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
// <EntityInstanceGrid {...props} theme={customTheme} />
//
// The system automatically generates appropriate styles for both grid types,
// ensuring visual consistency regardless of which grid implementation is used.
// ################################################################################################

import type { StoredMiroirTheme } from "miroir-core";
import type { MiroirThemeFull } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { defaultStoredMiroirTheme, tableThemeSchemaJson } from "miroir-test-app_deployment-miroir";

// ################################################################################################
// TableTheme: color properties in sub-sections are optional.
// When not specified, they fall back to the corresponding root color
// from theme.colors (parent MiroirTheme) via resolveThemeColors().
// See ThemeColorDefaults.ts for the full mapping documentation.
// ################################################################################################
export type TableTheme = StoredMiroirTheme["definition"]["table"];
// export interface TableTheme {
//   colors: {
//     primary?: string;        // fallback: theme.colors.accent
//     secondary?: string;      // fallback: theme.colors.secondary
//     background?: string;     // fallback: theme.colors.background
//     surface?: string;        // fallback: theme.colors.surface
//     border?: string;         // fallback: theme.colors.border
//     text?: string;           // fallback: theme.colors.text
//     textSecondary?: string;  // fallback: theme.colors.textSecondary
//     textLight?: string;      // fallback: theme.colors.textLight
//     hover?: string;          // fallback: theme.colors.hover
//     selected?: string;       // fallback: theme.colors.selected
//     filter?: string;         // fallback: theme.colors.warning
//     filterBackground?: string; // fallback: theme.colors.warningLight
//     error?: string;          // fallback: theme.colors.error
//     warning?: string;        // fallback: theme.colors.warning
//     success?: string;        // fallback: theme.colors.success
//     accent?: string;         // fallback: theme.colors.accent
//     accentLight?: string;    // fallback: theme.colors.accentLight
//   };
//   spacing: {
//     xs: string;
//     sm: string;
//     md: string;
//     lg: string;
//     xl: string;
//   };
//   typography: {
//     fontSize: string;
//     fontFamily: string;
//     fontWeight: {
//       normal: number;
//       medium: number;
//       bold: number;
//     };
//     headerFontSize: string;
//     headerFontWeight: number;
//   };
//   components: {
//     table: {
//       borderRadius?: string;
//       border?: string;
//       minHeight?: string;
//       maxHeight?: string;
//       backgroundColor?: string;   // fallback: table.colors.background
//       width?: string;
//       maxWidth?: string;
//       adaptiveColumnWidths?: boolean;
//     };
//     header: {
//       background?: string;        // fallback: table.colors.surface
//       height?: string;
//       fontSize?: string;
//       fontWeight?: number;
//       borderBottom?: string;
//       textColor?: string;         // fallback: table.colors.text
//       hoverBackground?: string;   // fallback: table.colors.hover
//     };
//     cell: {
//       height?: string;
//       padding?: string;
//       borderRight?: string;
//       borderBottom?: string;
//       fontSize?: string;
//       backgroundColor?: string;   // fallback: table.colors.background
//       textColor?: string;         // fallback: table.colors.text
//     };
//     row: {
//       hoverBackground?: string;   // fallback: table.colors.hover
//       selectedBackground?: string; // fallback: table.colors.selected
//       borderBottom?: string;
//       evenBackground?: string;    // fallback: table.colors.background
//       oddBackground?: string;     // fallback: table.colors.surface
//     };
//     toolbar: {
//       background?: string;        // fallback: table.colors.surface
//       padding?: string;
//       borderBottom?: string;
//       height?: string;
//       textColor?: string;         // fallback: table.colors.text
//     };
//     filter: {
//       iconColor?: string;         // fallback: table.colors.textSecondary
//       activeIconColor?: string;   // fallback: table.colors.filter
//       clearButtonColor?: string;  // fallback: table.colors.filter
//       clearButtonBackground?: string; // fallback: table.colors.filterBackground
//       clearButtonBorder?: string;
//       toolbarBackground?: string; // fallback: table.colors.surface
//       inputBackground?: string;   // fallback: table.colors.background
//       inputBorder?: string;
//     };
//     sort: {
//       iconColor?: string;         // fallback: table.colors.textSecondary
//       activeIconColor?: string;   // fallback: table.colors.accent
//       ascendingSymbol?: string;
//       descendingSymbol?: string;
//     };
//   };
// }

// ################################################################################################
// ResolvedTableTheme: fully resolved version where all optional colors are filled in.
// This is what consumers (TableStyleGenerators, etc.) actually use.
// ################################################################################################
export type ResolvedTableTheme = MiroirThemeFull['definition']["table"];
// export interface ResolvedTableTheme {
//   colors: {
//     primary: string;
//     secondary: string;
//     background: string;
//     surface: string;
//     border: string;
//     text: string;
//     textSecondary: string;
//     textLight: string;
//     hover: string;
//     selected: string;
//     filter: string;
//     filterBackground: string;
//     error: string;
//     warning: string;
//     success: string;
//     accent: string;
//     accentLight: string;
//   };
//   spacing: {
//     xs: string;
//     sm: string;
//     md: string;
//     lg: string;
//     xl: string;
//   };
//   typography: {
//     fontSize: string;
//     fontFamily: string;
//     fontWeight: {
//       normal: number;
//       medium: number;
//       bold: number;
//     };
//     headerFontSize: string;
//     headerFontWeight: number;
//   };
//   components: {
//     table: {
//       borderRadius: string;
//       border: string;
//       minHeight: string;
//       maxHeight: string;
//       backgroundColor: string;
//       width: string;
//       maxWidth: string;
//       adaptiveColumnWidths: boolean;
//     };
//     header: {
//       background: string;
//       height: string;
//       fontSize: string;
//       fontWeight: number;
//       borderBottom: string;
//       textColor: string;
//       hoverBackground: string;
//     };
//     cell: {
//       height: string;
//       padding: string;
//       borderRight: string;
//       borderBottom: string;
//       fontSize: string;
//       backgroundColor: string;
//       textColor: string;
//     };
//     row: {
//       hoverBackground: string;
//       selectedBackground: string;
//       borderBottom: string;
//       evenBackground: string;
//       oddBackground: string;
//     };
//     toolbar: {
//       background: string;
//       padding: string;
//       borderBottom: string;
//       height: string;
//       textColor: string;
//     };
//     filter: {
//       iconColor: string;
//       activeIconColor: string;
//       clearButtonColor: string;
//       clearButtonBackground: string;
//       clearButtonBorder: string;
//       toolbarBackground: string;
//       inputBackground: string;
//       inputBorder: string;
//     };
//     sort: {
//       iconColor: string;
//       activeIconColor: string;
//       ascendingSymbol: string;
//       descendingSymbol: string;
//     };
//   };
// }

// Deep partial type for theme overrides
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// defaultTableTheme has all fields explicitly set, making it a ResolvedTableTheme.
// This is used as the base for createTableTheme() and ensures type-safe spreading.
export const defaultTableTheme: ResolvedTableTheme = defaultStoredMiroirTheme.definition.table as ResolvedTableTheme;

// //   etc. (see ThemeColorDefaults.ts for full mapping)
// export const createTableTheme = (
//   baseTableTheme: ResolvedTableTheme,
//   overrides: DeepPartial<TableTheme> = {},
// ): ResolvedTableTheme => {
//   // Step 1: Merge colors (defaults + overrides)
//   const colors: ResolvedTableTheme["colors"] = {
//     ...baseTableTheme.colors,
//     ...overrides.colors,
//   };

//   // Step 2: Compute component color defaults from merged colors (not from defaultTableTheme)
//   const derivedComponents: ResolvedTableTheme["components"] = {
//     table: {
//       borderRadius: baseTableTheme.components.table.borderRadius,
//       border: `1px solid ${colors.border}`,
//       minHeight: baseTableTheme.components.table.minHeight,
//       maxHeight: baseTableTheme.components.table.maxHeight,
//       backgroundColor: colors.background,
//       width: baseTableTheme.components.table.width,
//       maxWidth: baseTableTheme.components.table.maxWidth,
//       adaptiveColumnWidths: baseTableTheme.components.table.adaptiveColumnWidths,
//     },
//     header: {
//       background: colors.surface,
//       height: baseTableTheme.components.header.height,
//       fontSize: baseTableTheme.components.header.fontSize,
//       fontWeight: baseTableTheme.components.header.fontWeight,
//       borderBottom: `1px solid ${colors.border}`,
//       textColor: colors.text,
//       hoverBackground: colors.hover,
//     },
//     cell: {
//       height: baseTableTheme.components.cell.height,
//       padding: baseTableTheme.components.cell.padding,
//       borderRight: `1px solid ${colors.border}`,
//       borderBottom: `1px solid ${colors.border}`,
//       fontSize: baseTableTheme.components.cell.fontSize,
//       backgroundColor: colors.background,
//       textColor: colors.text,
//     },
//     row: {
//       hoverBackground: colors.hover,
//       selectedBackground: colors.selected,
//       borderBottom: `1px solid ${colors.border}`,
//       evenBackground: colors.background,
//       oddBackground: colors.surface,
//     },
//     toolbar: {
//       background: colors.surface,
//       padding: baseTableTheme.components.toolbar.padding,
//       borderBottom: `1px solid ${colors.border}`,
//       height: baseTableTheme.components.toolbar.height,
//       textColor: colors.text,
//     },
//     filter: {
//       iconColor: colors.textSecondary,
//       activeIconColor: colors.filter,
//       clearButtonColor: colors.filter,
//       clearButtonBackground: colors.filterBackground,
//       clearButtonBorder: `1px solid ${colors.filter}`,
//       toolbarBackground: colors.surface,
//       inputBackground: colors.background,
//       inputBorder: `1px solid ${colors.border}`,
//     },
//     sort: {
//       iconColor: colors.textSecondary,
//       activeIconColor: colors.accent,
//       ascendingSymbol: baseTableTheme.components.sort.ascendingSymbol,
//       descendingSymbol: baseTableTheme.components.sort.descendingSymbol,
//     },
//   };

//   // Step 3: Apply explicit component overrides on top of derived defaults
//   return {
//     ...baseTableTheme,
//     ...overrides,
//     colors,
//     spacing: {
//       ...baseTableTheme.spacing,
//       ...overrides.spacing,
//     },
//     typography: {
//       ...baseTableTheme.typography,
//       ...overrides.typography,
//       fontWeight: {
//         ...baseTableTheme.typography.fontWeight,
//         ...overrides.typography?.fontWeight,
//       },
//     },
//     components: {
//       table: {
//         ...derivedComponents.table,
//         ...overrides.components?.table,
//       },
//       header: {
//         ...derivedComponents.header,
//         ...overrides.components?.header,
//       },
//       cell: {
//         ...derivedComponents.cell,
//         ...overrides.components?.cell,
//       },
//       row: {
//         ...derivedComponents.row,
//         ...overrides.components?.row,
//       },
//       toolbar: {
//         ...derivedComponents.toolbar,
//         ...overrides.components?.toolbar,
//       },
//       filter: {
//         ...derivedComponents.filter,
//         ...overrides.components?.filter,
//       },
//       sort: {
//         ...derivedComponents.sort,
//         ...overrides.components?.sort,
//       },
//     },
//   };
// };

// Predefined theme variants
// Dark table theme: only colors need to be specified.
// Component colors are auto-derived from these colors by createTableTheme().
// export const darkTableTheme = createTableTheme(defaultTableTheme, {
//   colors: {
//     primary: "#90caf9",
//     secondary: "#f48fb1",
//     background: "#121212",
//     surface: "#1e1e1e",
//     border: "#333333",
//     text: "#ffffff",
//     textSecondary: "#b3b3b3",
//     textLight: "#999999",
//     hover: "#2a2a2a",
//     selected: "#1976d2",
//     filter: "#ff8c00",
//     filterBackground: "#2a2a2a",
//     error: "#f44336",
//     warning: "#ff9800",
//     success: "#4caf50",
//     accent: "#90caf9",
//     accentLight: "rgba(144, 202, 249, 0.1)",
//   },
//   // All component colors are auto-derived from the colors above:
//   //   table.backgroundColor → background (#121212) ✓
//   //   table.border → 1px solid border (#333333) ✓
//   //   header.background → surface (#1e1e1e) ✓
//   //   header.textColor → text (#ffffff) ✓
//   //   header.hoverBackground → hover (#2a2a2a) ✓
//   //   cell.backgroundColor → background (#121212) ✓
//   //   cell.textColor → text (#ffffff) ✓
//   //   row.hoverBackground → hover (#2a2a2a) ✓
//   //   row.selectedBackground → selected (#1976d2) ✓
//   //   toolbar.background → surface (#1e1e1e) ✓
//   //   toolbar.textColor → text (#ffffff) ✓
//   //   filter.clearButtonBackground → filterBackground (#2a2a2a) ✓
//   //   filter.* → derived from colors ✓
//   components: {
//     row: {
//       // oddBackground defaults to surface (#1e1e1e), but we want darker
//       oddBackground: "#1a1a1a",
//     },
//   },
// });

// export const compactTableTheme = createTableTheme(defaultTableTheme, {
//   spacing: {
//     xs: "2px",
//     sm: "4px",
//     md: "8px",
//     lg: "12px",
//     xl: "16px",
//   },
//   typography: {
//     fontSize: "12px",
//     headerFontSize: "12px",
//   },
//   components: {
//     header: {
//       height: "28px",
//       fontSize: "12px",
//     },
//     cell: {
//       height: "24px",
//       padding: "4px 8px",
//       fontSize: "12px",
//     },
//   },
// });

// // Material table theme: specify colors that differ from defaults.
// // Component colors are auto-derived from these colors by createTableTheme().
// export const materialTableTheme = createTableTheme(defaultTableTheme, {
//   colors: {
//     primary: "#2196f3",
//     secondary: "#ff5722",
//     background: "#fafafa",
//     surface: "#ffffff",
//     border: "#e1e1e1",
//     text: "#212121",
//     textSecondary: "#757575",
//     textLight: "#9e9e9e",
//     hover: "#f5f5f5",
//     selected: "#e3f2fd",
//     filter: "#2196f3",
//     filterBackground: "#e3f2fd",
//     accent: "#2196f3",
//     accentLight: "rgba(33, 150, 243, 0.1)",
//   },
//   // Most component colors are auto-derived from the colors above.
//   // Only specify overrides that diverge from the auto-derived values.
//   components: {
//     table: {
//       borderRadius: "8px",
//       // backgroundColor → colors.background (#fafafa), but material wants white surface
//       backgroundColor: "#ffffff",
//     },
//     header: {
//       // hoverBackground → colors.hover (#f5f5f5), but material wants slightly darker
//       hoverBackground: "#eeeeee",
//     },
//     // filter and sort: activeIconColor → colors.filter (#2196f3) ✓ (auto-derived)
//     // No explicit component color overrides needed
//   },
// });

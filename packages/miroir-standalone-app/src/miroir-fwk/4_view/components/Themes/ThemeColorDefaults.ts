// ################################################################################################
// Theme Color Default Resolution
//
// This module provides the explicit mapping from every optional color property 
// in theme.components.* and theme.table.* to its fallback color in theme.colors.*.
//
// When a sub-section color is not defined (undefined), the resolver looks up 
// the corresponding root color from theme.colors as documented in the mapping below.
//
// The resolveThemeColors() function takes a MiroirTheme with optional sub-colors
// and returns a fully-resolved theme where every color property is guaranteed to be set.
//
// ################################################################################################

import type { MiroirThemeFull } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js';
import { defaultMiroirTheme, MiroirTheme, ResolvedMiroirTheme } from './MiroirTheme.js';
import { ResolvedTableTheme, TableTheme } from './TableTheme.js';

// ################################################################################################
// EXPLICIT COLOR MAPPING DOCUMENTATION
//
// Each entry below documents: 
//   SubSection.property  →  colors.fallback  (semantic reason)
//
// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
//
// components.appBar:
//   background           →  colors.primaryDark       (app bar uses dark primary brand)
//   textColor            →  colors.backgroundPaper   (white/light text on dark bar)
//
// components.sidebar:
//   background           →  colors.backgroundPaper   (sidebar paper surface)
//   backgroundHover      →  colors.hover             (standard hover)
//   textColor            →  colors.text              (standard text)
//   textColorActive      →  colors.accent            (active = accent)
//
// components.drawer:
//   background           →  colors.backgroundPaper   (drawer paper surface)
//   backdrop             →  colors.overlay           (standard overlay)
//
// components.input:
//   background           →  colors.backgroundPaper   (input on paper)
//   backgroundHover      →  colors.surface           (slightly raised on hover)
//   backgroundFocused    →  colors.backgroundPaper   (back to paper when focused)
//   borderColor          →  colors.border            (standard border)
//   borderColorHover     →  colors.textSecondary     (darker border on hover)
//   borderColorFocused   →  colors.accent            (accent highlight on focus)
//   textColor            →  colors.text              (standard text)
//   placeholderColor     →  colors.textLight         (light placeholder)
//
// components.button.primary:
//   background           →  colors.accent            (primary action = accent)
//   backgroundHover      →  colors.active            (pressed deeper accent)
//   backgroundActive     →  colors.active            (active state)
//   textColor            →  colors.backgroundPaper   (light text on accent)
//   borderColor          →  colors.accent            (matches background)
//
// components.button.secondary:
//   background           →  colors.secondary         (secondary brand)
//   backgroundHover      →  colors.secondaryDark     (darker secondary on hover)
//   backgroundActive     →  colors.secondaryDark     (darker secondary when active)
//   textColor            →  colors.backgroundPaper   (light text)
//   borderColor          →  colors.secondary         (matches background)
//
// components.button.outlined:
//   background           →  (literal 'transparent')
//   backgroundHover      →  colors.accentLight       (subtle accent hover)
//   backgroundActive     →  colors.accentLight       (subtle accent active)
//   textColor            →  colors.accent            (accent text)
//   borderColor          →  colors.accent            (accent border)
//
// components.card:
//   background           →  colors.backgroundPaper   (card surface)
//   borderColor          →  colors.border            (standard border)
//
// components.dialog:
//   background           →  colors.backgroundPaper   (dialog surface)
//   backdrop             →  colors.overlay           (standard overlay)
//
// components.tooltip:
//   background           →  colors.overlay           (dark tooltip bg)
//   textColor            →  colors.backgroundPaper   (light text on dark)
//
// components.icon:
//   colorPrimary         →  colors.accent            (primary icon = accent)
//   colorSecondary       →  colors.textSecondary     (secondary icon)
//   colorDisabled        →  colors.textDisabled      (disabled icon)
//
// ═══════════════════════════════════════════════════════════════════════════════
// TABLE
// ═══════════════════════════════════════════════════════════════════════════════
//
// table.colors:
//   primary              →  colors.accent            (table primary = accent)
//   secondary            →  colors.secondary         (table secondary)
//   background           →  colors.background        (same background)
//   surface              →  colors.surface           (same surface)
//   border               →  colors.border            (same border)
//   text                 →  colors.text              (same text)
//   textSecondary        →  colors.textSecondary     (same text secondary)
//   textLight            →  colors.textLight         (same text light)
//   hover                →  colors.hover             (same hover)
//   selected             →  colors.selected          (same selected)
//   filter               →  colors.warning           (filter highlight = warning)
//   filterBackground     →  colors.warningLight      (filter bg = warning light)
//   error                →  colors.error             (same error)
//   warning              →  colors.warning           (same warning)
//   success              →  colors.success           (same success)
//   accent               →  colors.accent            (same accent)
//   accentLight          →  colors.accentLight       (same accent light)
//
// table.components.table:
//   backgroundColor      →  table.colors.background  (from resolved table colors)
//
// table.components.header:
//   background           →  table.colors.surface     (header on surface)
//   textColor            →  table.colors.text        (header text)
//   hoverBackground      →  table.colors.hover       (header hover)
//
// table.components.cell:
//   backgroundColor      →  table.colors.background  (cell bg)
//   textColor            →  table.colors.text        (cell text)
//
// table.components.row:
//   hoverBackground      →  table.colors.hover       (row hover)
//   selectedBackground   →  table.colors.selected    (row selected)
//   evenBackground       →  table.colors.background  (even row bg)
//   oddBackground        →  table.colors.surface     (odd row surface)
//
// table.components.toolbar:
//   background           →  table.colors.surface     (toolbar surface)
//   textColor            →  table.colors.text        (toolbar text)
//
// table.components.filter:
//   iconColor            →  table.colors.textSecondary   (filter icon)
//   activeIconColor      →  table.colors.filter          (active filter)
//   clearButtonColor     →  table.colors.filter          (clear btn text)
//   clearButtonBackground → table.colors.filterBackground (clear btn bg)
//   clearButtonBorder    →  (computed from table.colors.filter)
//   toolbarBackground    →  table.colors.surface         (filter toolbar)
//   inputBackground      →  table.colors.background      (filter input bg)
//   inputBorder          →  (computed from table.colors.border)
//
// table.components.sort:
//   iconColor            →  table.colors.textSecondary   (sort icon)
//   activeIconColor      →  table.colors.accent          (active sort)
//
// ################################################################################################

/**
 * Resolves all optional color properties in a component sub-theme,
 * falling back to the corresponding root color from theme.colors.
 * 
 * This function is the single source of truth for color fallbacks.
 * Every optional color in components.* and table.* is resolved here.
 */
// export function resolveThemeColors(theme: MiroirTheme): ResolvedMiroirTheme {
export function resolveThemeColors(theme: MiroirTheme): MiroirThemeFull['definition'] {
const colors = theme.colors ?? defaultMiroirTheme.colors;

  // ──────────────────────────────────────────────────
  // Resolve components
  // ──────────────────────────────────────────────────
  const resolvedComponents: MiroirThemeFull['definition']['components'] = {
    appBar: {
      background: theme?.components?.appBar?.background ?? colors.primaryDark,
      textColor: theme?.components?.appBar?.textColor ?? colors.backgroundPaper,
      borderBottom: theme?.components?.appBar?.borderBottom ?? 'none',
      height: theme?.components?.appBar?.height ?? '64px',
      elevation: theme?.components?.appBar?.elevation ?? '0 2px 4px rgba(0, 0, 0, 0.1)',
    },

    sidebar: {
      background: theme?.components?.sidebar?.background ?? colors.backgroundPaper,
      backgroundHover: theme?.components?.sidebar?.backgroundHover ?? colors.hover,
      textColor: theme?.components?.sidebar?.textColor ?? colors.text,
      textColorActive: theme?.components?.sidebar?.textColorActive ?? colors.accent,
      borderRight: theme?.components?.sidebar?.borderRight ?? `1px solid ${colors.border}`,
      width: theme?.components?.sidebar?.width ?? '200px',
      itemHeight: theme?.components?.sidebar?.itemHeight ?? '48px',
    },

    drawer: {
      background: theme?.components?.drawer?.background ?? colors.backgroundPaper,
      backdrop: theme?.components?.drawer?.backdrop ?? colors.overlay,
      elevation: theme?.components?.drawer?.elevation ?? '0 8px 10px rgba(0, 0, 0, 0.14), 0 3px 14px rgba(0, 0, 0, 0.12)',
    },

    input: {
      background: theme?.components?.input?.background ?? colors.backgroundPaper,
      backgroundHover: theme?.components?.input?.backgroundHover ?? colors.surface,
      backgroundFocused: theme?.components?.input?.backgroundFocused ?? colors.backgroundPaper,
      borderColor: theme?.components?.input?.borderColor ?? colors.border,
      borderColorHover: theme?.components?.input?.borderColorHover ?? colors.textSecondary,
      borderColorFocused: theme?.components?.input?.borderColorFocused ?? colors.accent,
      textColor: theme?.components?.input?.textColor ?? colors.text,
      placeholderColor: theme?.components?.input?.placeholderColor ?? colors.textLight,
      borderRadius: theme?.components?.input?.borderRadius ?? '4px',
      height: theme?.components?.input?.height ?? '40px',
    },

    button: {
      primary: {
        background: theme?.components?.button?.primary?.background ?? colors.accent,
        backgroundHover: theme?.components?.button?.primary?.backgroundHover ?? colors.active,
        backgroundActive: theme?.components?.button?.primary?.backgroundActive ?? colors.active,
        textColor: theme?.components?.button?.primary?.textColor ?? colors.backgroundPaper,
        borderColor: theme?.components?.button?.primary?.borderColor ?? colors.accent,
        borderRadius: theme?.components?.button?.primary?.borderRadius ?? '4px',
      },
      secondary: {
        background: theme?.components?.button?.secondary?.background ?? colors.secondary,
        backgroundHover: theme?.components?.button?.secondary?.backgroundHover ?? colors.secondaryDark,
        backgroundActive: theme?.components?.button?.secondary?.backgroundActive ?? colors.secondaryDark,
        textColor: theme?.components?.button?.secondary?.textColor ?? colors.backgroundPaper,
        borderColor: theme?.components?.button?.secondary?.borderColor ?? colors.secondary,
        borderRadius: theme?.components?.button?.secondary?.borderRadius ?? '4px',
      },
      outlined: {
        background: theme?.components?.button?.outlined?.background ?? 'transparent',
        backgroundHover: theme?.components?.button?.outlined?.backgroundHover ?? colors.accentLight,
        backgroundActive: theme?.components?.button?.outlined?.backgroundActive ?? colors.accentLight,
        textColor: theme?.components?.button?.outlined?.textColor ?? colors.accent,
        borderColor: theme?.components?.button?.outlined?.borderColor ?? colors.accent,
        borderRadius: theme?.components?.button?.outlined?.borderRadius ?? '4px',
      },
    },

    card: {
      background: theme?.components?.card?.background ?? colors.backgroundPaper,
      borderColor: theme?.components?.card?.borderColor ?? colors.border,
      borderRadius: theme?.components?.card?.borderRadius ?? '8px',
      elevation: theme?.components?.card?.elevation ?? '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      padding: theme?.components?.card?.padding ?? '16px',
    },

    dialog: {
      background: theme?.components?.dialog?.background ?? colors.backgroundPaper,
      backdrop: theme?.components?.dialog?.backdrop ?? colors.overlay,
      borderRadius: theme?.components?.dialog?.borderRadius ?? '8px',
      elevation: theme?.components?.dialog?.elevation ?? '0 11px 15px rgba(0, 0, 0, 0.2), 0 4px 20px rgba(0, 0, 0, 0.14)',
      padding: theme?.components?.dialog?.padding ?? '24px',
    },

    tooltip: {
      background: theme?.components?.tooltip?.background ?? colors.overlay,
      textColor: theme?.components?.tooltip?.textColor ?? colors.backgroundPaper,
      borderRadius: theme?.components?.tooltip?.borderRadius ?? '4px',
      fontSize: theme?.components?.tooltip?.fontSize ?? '12px',
    },

    icon: {
      colorPrimary: theme?.components?.icon?.colorPrimary ?? colors.accent,
      colorSecondary: theme?.components?.icon?.colorSecondary ?? colors.textSecondary,
      colorDisabled: theme?.components?.icon?.colorDisabled ?? colors.textDisabled,
      size: {
        sm: theme?.components?.icon?.size?.sm ?? '16px',
        md: theme?.components?.icon?.size?.md ?? '24px',
        lg: theme?.components?.icon?.size?.lg ?? '32px',
      },
    },
  };

  // ──────────────────────────────────────────────────
  // Resolve table theme
  // ──────────────────────────────────────────────────
  const resolvedTable = resolveTableThemeColors(theme.table ?? defaultMiroirTheme.table as any, colors);


  return {
    ...theme,
    colors,
    spacing: theme.spacing ?? defaultMiroirTheme.spacing,
    typography: theme.typography ?? defaultMiroirTheme.typography,
    elevation: theme.elevation ?? defaultMiroirTheme.elevation,
    borderRadius: theme.borderRadius ?? defaultMiroirTheme.borderRadius,
    breakpoints: theme.breakpoints ?? defaultMiroirTheme.breakpoints,
    transitions: theme.transitions ?? defaultMiroirTheme.transitions,
    components: resolvedComponents,
    table: resolvedTable,
  };
}

/**
 * Resolves all optional color properties in a TableTheme,
 * falling back to appropriate root colors from the parent theme.
 */
export function resolveTableThemeColors(
  table: TableTheme,
  rootColors: MiroirTheme['colors']
// ): ResolvedTableTheme {
): MiroirThemeFull['definition']['table'] {
  const colors = rootColors ?? defaultMiroirTheme.colors;
  // First resolve table-level colors
  const resolvedTableColors: ResolvedTableTheme['colors'] = {
    primary: table.colors.primary ?? colors.accent,
    secondary: table.colors.secondary ?? colors.secondary,
    background: table.colors.background ?? colors.background,
    surface: table.colors.surface ?? colors.surface,
    border: table.colors.border ?? colors.border,
    text: table.colors.text ?? colors.text,
    textSecondary: table.colors.textSecondary ?? colors.textSecondary,
    textLight: table.colors.textLight ?? colors.textLight,
    hover: table.colors.hover ?? colors.hover,
    selected: table.colors.selected ?? colors.selected,
    filter: table.colors.filter ?? colors.warning,
    filterBackground: table.colors.filterBackground ?? colors.warningLight,
    error: table.colors.error ?? colors.error,
    warning: table.colors.warning ?? colors.warning,
    success: table.colors.success ?? colors.success,
    accent: table.colors.accent ?? colors.accent,
    accentLight: table.colors.accentLight ?? colors.accentLight,
  };

  // Then resolve table component colors using the resolved table colors
  const tc = resolvedTableColors;

  const resolvedTableComponents: ResolvedTableTheme['components'] = {
    table: {
      borderRadius: table.components.table.borderRadius ?? '4px',
      border: table.components.table.border ?? `1px solid ${tc.border}`,
      minHeight: table.components.table.minHeight ?? '200px',
      maxHeight: table.components.table.maxHeight ?? '600px',
      backgroundColor: table.components.table.backgroundColor ?? tc.background,
      width: table.components.table.width ?? '100%',
      maxWidth: table.components.table.maxWidth ?? '100%',
      adaptiveColumnWidths: table.components.table.adaptiveColumnWidths ?? true,
    },
    header: {
      background: table.components.header.background ?? tc.surface,
      height: table.components.header.height ?? '36px',
      fontSize: table.components.header.fontSize ?? '14px',
      fontWeight: table.components.header.fontWeight ?? 600,
      borderBottom: table.components.header.borderBottom ?? `1px solid ${tc.border}`,
      textColor: table.components.header.textColor ?? tc.text,
      hoverBackground: table.components.header.hoverBackground ?? tc.hover,
    },
    cell: {
      height: table.components.cell.height ?? '34px',
      padding: table.components.cell.padding ?? '8px 12px',
      borderRight: table.components.cell.borderRight ?? `1px solid ${tc.border}`,
      borderBottom: table.components.cell.borderBottom ?? `1px solid ${tc.border}`,
      fontSize: table.components.cell.fontSize ?? '14px',
      backgroundColor: table.components.cell.backgroundColor ?? tc.background,
      textColor: table.components.cell.textColor ?? tc.text,
    },
    row: {
      hoverBackground: table.components.row.hoverBackground ?? tc.hover,
      selectedBackground: table.components.row.selectedBackground ?? tc.selected,
      borderBottom: table.components.row.borderBottom ?? `1px solid ${tc.border}`,
      evenBackground: table.components.row.evenBackground ?? tc.background,
      oddBackground: table.components.row.oddBackground ?? tc.surface,
    },
    toolbar: {
      background: table.components.toolbar.background ?? tc.surface,
      padding: table.components.toolbar.padding ?? '8px',
      borderBottom: table.components.toolbar.borderBottom ?? `1px solid ${tc.border}`,
      height: table.components.toolbar.height ?? 'auto',
      textColor: table.components.toolbar.textColor ?? tc.text,
    },
    filter: {
      iconColor: table.components.filter.iconColor ?? tc.textSecondary,
      activeIconColor: table.components.filter.activeIconColor ?? tc.filter,
      clearButtonColor: table.components.filter.clearButtonColor ?? tc.filter,
      clearButtonBackground: table.components.filter.clearButtonBackground ?? tc.filterBackground,
      clearButtonBorder: table.components.filter.clearButtonBorder ?? `1px solid ${tc.filter}`,
      toolbarBackground: table.components.filter.toolbarBackground ?? tc.surface,
      inputBackground: table.components.filter.inputBackground ?? tc.background,
      inputBorder: table.components.filter.inputBorder ?? `1px solid ${tc.border}`,
    },
    sort: {
      iconColor: table.components.sort.iconColor ?? tc.textSecondary,
      activeIconColor: table.components.sort.activeIconColor ?? tc.accent,
      ascendingSymbol: table.components.sort.ascendingSymbol ?? '↑',
      descendingSymbol: table.components.sort.descendingSymbol ?? '↓',
    },
  };

  return {
    ...table,
    colors: resolvedTableColors,
    components: resolvedTableComponents,
  };
}

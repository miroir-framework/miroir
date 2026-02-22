import { ResolvedTableTheme } from './TableTheme.js';

// Generate CSS styles for AG-Grid
export const generateAgGridStyles = (theme: ResolvedTableTheme): string => `
  /* Container and Root Styles */
  .ag-theme-alpine {
    --ag-background-color: ${theme.colors.background};
    --ag-foreground-color: ${theme.colors.text};
    --ag-border-color: ${theme.colors.border};
    --ag-row-hover-color: ${theme.colors.hover};
    --ag-selected-row-background-color: ${theme.colors.selected};
    --ag-header-background-color: ${theme.components.header.background};
    --ag-header-foreground-color: ${theme.components.header.textColor};
    --ag-header-cell-hover-background-color: ${theme.components.header.hoverBackground};
    --ag-header-cell-moving-background-color: ${theme.colors.surface};
    --ag-font-family: ${theme.typography.fontFamily};
    --ag-font-size: ${theme.typography.fontSize};
    --ag-header-height: ${theme.components.header.height};
    --ag-row-height: ${theme.components.cell.height};
    --ag-cell-horizontal-padding: 12px;
    --ag-grid-size: 8px;
    border-radius: ${theme.components.table.borderRadius};
    border: ${theme.components.table.border};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize};
    background-color: ${theme.components.table.backgroundColor};
  }

  /* Width and Overflow Control */
  .ag-theme-alpine,
  .ag-theme-alpine .ag-root-wrapper,
  .ag-theme-alpine .ag-root,
  .ag-theme-alpine .ag-header,
  .ag-theme-alpine .ag-body-viewport {
    width: 100% !important;
    max-width: 100% !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }

  .ag-theme-alpine .ag-body-viewport {
    overflow: hidden !important;
  }

  /* Header Styles */
  .ag-theme-alpine .ag-header-cell {
    background-color: ${theme.components.header.background};
    font-weight: ${theme.components.header.fontWeight};
    font-size: ${theme.components.header.fontSize};
    border-bottom: ${theme.components.header.borderBottom};
    border-right: ${theme.components.cell.borderRight};
    color: ${theme.components.header.textColor};
  }

  .ag-theme-alpine .ag-header-cell-label {
    font-weight: ${theme.components.header.fontWeight};
    color: ${theme.components.header.textColor};
  }

  .ag-theme-alpine .ag-header-cell:hover {
    background-color: ${theme.components.header.hoverBackground};
  }

  /* Cell Styles */
  .ag-theme-alpine .ag-cell {
    border-right: ${theme.components.cell.borderRight};
    border-bottom: ${theme.components.cell.borderBottom};
    padding: 0 12px;
    display: flex;
    align-items: center;
    font-size: ${theme.components.cell.fontSize};
    background-color: ${theme.components.cell.backgroundColor};
    color: ${theme.components.cell.textColor};
  }

  /* Row Styles */
  .ag-theme-alpine .ag-row {
    border-bottom: ${theme.components.row.borderBottom};
  }

  .ag-theme-alpine .ag-row:nth-child(even) {
    background-color: ${theme.components.row.evenBackground};
  }

  .ag-theme-alpine .ag-row:nth-child(odd) {
    background-color: ${theme.components.row.oddBackground};
  }

  .ag-theme-alpine .ag-row:hover {
    background-color: ${theme.components.row.hoverBackground} !important;
  }

  .ag-theme-alpine .ag-row-selected {
    background-color: ${theme.components.row.selectedBackground} !important;
  }

  /* Filter Icon Styles */
  .ag-theme-alpine .ag-header-icon.ag-filter-icon {
    display: none !important;
  }
  
  .ag-theme-alpine .ag-header-cell-filtered .ag-header-icon.ag-filter-icon,
  .ag-theme-alpine .ag-header-cell-filtered .ag-icon-filter,
  .ag-theme-alpine .ag-header-cell-filtered .ag-icon-menu {
    display: inline-block !important;
    color: ${theme.components.filter.activeIconColor} !important;
    fill: ${theme.components.filter.activeIconColor} !important;
    cursor: pointer !important;
    opacity: 1 !important;
    visibility: visible !important;
    z-index: 1000 !important;
    position: relative !important;
  }
  
  .ag-theme-alpine .ag-header-cell-filtered .ag-header-icon.ag-filter-icon svg,
  .ag-theme-alpine .ag-header-cell-filtered .ag-header-icon.ag-filter-icon svg path,
  .ag-theme-alpine .ag-header-cell-filtered .ag-header-icon.ag-filter-icon path,
  .ag-theme-alpine .ag-header-cell-filtered .ag-header-icon.ag-filter-icon:before,
  .ag-theme-alpine .ag-header-cell-filtered .ag-header-icon.ag-filter-icon:after {
    fill: ${theme.components.filter.activeIconColor} !important;
    stroke: ${theme.components.filter.activeIconColor} !important;
    color: ${theme.components.filter.activeIconColor} !important;
  }

  /* Sort Icon Styles */
  .ag-theme-alpine .ag-icon-asc,
  .ag-theme-alpine .ag-icon-desc {
    color: ${theme.components.sort.activeIconColor} !important;
    fill: ${theme.components.sort.activeIconColor} !important;
  }

  .ag-theme-alpine .ag-header-cell-sortable .ag-icon-none {
    color: ${theme.components.sort.iconColor} !important;
  }
`;

// Generate theme object for Glide Data Grid
export const generateGlideTheme = (theme: ResolvedTableTheme) => ({
  accentColor: theme.colors.primary,
  accentFg: "#ffffff",
  accentLight: theme.colors.accentLight,
  textDark: theme.colors.text,
  textMedium: theme.colors.textSecondary,
  textLight: theme.colors.textLight,
  textBubble: theme.colors.text,
  bgIconHeader: theme.colors.textSecondary,
  fgIconHeader: "#ffffff",
  textHeader: theme.components.header.textColor,
  textHeaderSelected: theme.colors.text,
  bgCell: theme.components.cell.backgroundColor,
  bgCellMedium: theme.colors.surface,
  bgHeader: theme.components.header.background,
  bgHeaderHasFocus: theme.components.header.hoverBackground,
  bgHeaderHovered: theme.components.header.hoverBackground,
  bgBubble: theme.colors.background,
  bgBubbleSelected: theme.colors.selected,
  bgSearchResult: "#fff9c4",
  borderColor: theme.colors.border,
  drilldownBorder: "rgba(0, 0, 0, 0)",
  linkColor: theme.colors.primary,
  headerFontStyle: `${theme.components.header.fontWeight} ${theme.components.header.fontSize}`,
  baseFontStyle: theme.typography.fontSize,
  fontFamily: theme.typography.fontFamily,
  editorFontSize: theme.typography.fontSize,
  lineHeight: 1.4,
  cellHorizontalPadding: parseInt(theme.spacing.md),
  cellVerticalPadding: parseInt(theme.spacing.sm),
  headerHeight: parseInt(theme.components.header.height),
  smoothScrollX: true,
  smoothScrollY: true,
});

// Shared filter toolbar styles
export const getFilterToolbarStyles = (theme: ResolvedTableTheme) => ({
  container: {
    padding: theme.spacing.sm,
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.components.toolbar.background,
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    boxSizing: 'border-box' as const,
  },
  clearAllButton: {
    color: theme.components.filter.clearButtonColor,
    cursor: 'pointer',
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: '16px',
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    border: theme.components.filter.clearButtonBorder,
    borderRadius: theme.components.table.borderRadius,
    backgroundColor: theme.components.filter.clearButtonBackground,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    fontSize: theme.typography.fontSize,
    marginBottom: theme.spacing.sm,
  },
});

// Export helper functions for external use
export const getAgGridStyles = (theme: ResolvedTableTheme) => generateAgGridStyles(theme);
export const getGlideTheme = (theme: ResolvedTableTheme) => generateGlideTheme(theme);

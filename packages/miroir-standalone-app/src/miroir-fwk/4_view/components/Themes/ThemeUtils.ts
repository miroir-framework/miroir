// ################################################################################################
// Theme Utility Functions
// 
// This module provides utility functions to help migrate from @emotion/styled to the unified
// Miroir theme system and to provide styled component alternatives that use the theme.
//
// ################################################################################################

import { css } from '@emotion/react';
import { resolveThemeColors } from './ThemeColorDefaults.js';
import { ResolvedMiroirTheme, type MiroirTheme } from './MiroirTheme.js';

type UtilsTheme = ReturnType<typeof resolveThemeColors> & {
  colors: Record<string, string>;
  spacing: Record<string, string>;
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    fontWeight: Record<string, number | string>;
  };
  transitions: {
    duration: Record<string, string>;
    easing: Record<string, string>;
  };
  elevation: Record<string, string>;
  borderRadius: Record<string, string>;
  components: ResolvedMiroirTheme["components"];
};

const asUtilsTheme = (theme: ResolvedMiroirTheme): UtilsTheme =>
  resolveThemeColors(theme as MiroirTheme) as UtilsTheme;

// Helper to create CSS styles from theme
export const createThemedStyle = (theme: ResolvedMiroirTheme) => {
  const t = asUtilsTheme(theme);
  return ({
  // Common utility styles
  flexCenter: css`
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  
  flexStart: css`
    display: flex;
    align-items: center;
    justify-content: flex-start;
  `,
  
  flexColumn: css`
    display: flex;
    flex-direction: column;
  `,
  
  // Button styles
  buttonPrimary: css`
    background: ${t.components.button.primary.background};
    color: ${t.components.button.primary.textColor};
    border: 1px solid ${t.components.button.primary.borderColor};
    border-radius: ${t.components.button.primary.borderRadius};
    padding: ${t.spacing.sm} ${t.spacing.md};
    font-family: ${t.typography.fontFamily};
    font-size: ${t.typography.fontSize.sm};
    font-weight: ${t.typography.fontWeight.medium};
    cursor: pointer;
    transition: background-color ${t.transitions.duration.short} ${t.transitions.easing.easeOut};
    
    &:hover {
      background: ${t.components.button.primary.backgroundHover};
    }
    
    &:active {
      background: ${t.components.button.primary.backgroundActive};
    }
  `,
  
  buttonSecondary: css`
    background: ${t.components.button.secondary.background};
    color: ${t.components.button.secondary.textColor};
    border: 1px solid ${t.components.button.secondary.borderColor};
    border-radius: ${t.components.button.secondary.borderRadius};
    padding: ${t.spacing.sm} ${t.spacing.md};
    font-family: ${t.typography.fontFamily};
    font-size: ${t.typography.fontSize.sm};
    font-weight: ${t.typography.fontWeight.medium};
    cursor: pointer;
    transition: background-color ${t.transitions.duration.short} ${t.transitions.easing.easeOut};
    
    &:hover {
      background: ${t.components.button.secondary.backgroundHover};
    }
    
    &:active {
      background: ${t.components.button.secondary.backgroundActive};
    }
  `,
  
  buttonOutlined: css`
    background: ${t.components.button.outlined.background};
    color: ${t.components.button.outlined.textColor};
    border: 1px solid ${t.components.button.outlined.borderColor};
    border-radius: ${t.components.button.outlined.borderRadius};
    padding: ${t.spacing.sm} ${t.spacing.md};
    font-family: ${t.typography.fontFamily};
    font-size: ${t.typography.fontSize.sm};
    font-weight: ${t.typography.fontWeight.medium};
    cursor: pointer;
    transition: all ${t.transitions.duration.short} ${t.transitions.easing.easeOut};
    
    &:hover {
      background: ${t.components.button.outlined.backgroundHover};
    }
    
    &:active {
      background: ${t.components.button.outlined.backgroundActive};
    }
  `,
  
  // Input styles
  input: css`
    background: ${t.components.input.background};
    color: ${t.colors.text};
    border: 1px solid ${t.components.input.borderColor};
    border-radius: ${t.components.input.borderRadius};
    height: ${t.components.input.height};
    padding: 0 ${t.spacing.sm};
    font-family: ${t.typography.fontFamily};
    font-size: ${t.typography.fontSize.sm};
    transition: all ${t.transitions.duration.short} ${t.transitions.easing.easeOut};
    
    &:hover {
      background: ${t.components.input.backgroundHover};
      border-color: ${t.components.input.borderColorHover};
    }
    
    &:focus {
      background: ${t.components.input.backgroundFocused};
      border-color: ${t.components.input.borderColorFocused};
      outline: none;
      box-shadow: 0 0 0 2px ${t.colors.accentLight};
    }
    
    &::placeholder {
      color: ${t.components.input.placeholderColor};
    }
  `,
  
  // Card styles
  card: css`
    background: ${t.components.card.background};
    border: 1px solid ${t.components.card.borderColor};
    border-radius: ${t.components.card.borderRadius};
    padding: ${t.components.card.padding};
    box-shadow: ${t.components.card.elevation};
  `,
  
  // Icon styles
  iconSmall: css`
    width: ${t.components.icon.size.sm};
    height: ${t.components.icon.size.sm};
    color: ${t.components.icon.colorSecondary};
  `,
  
  iconMedium: css`
    width: ${t.components.icon.size.md};
    height: ${t.components.icon.size.md};
    color: ${t.components.icon.colorSecondary};
  `,
  
  iconLarge: css`
    width: ${t.components.icon.size.lg};
    height: ${t.components.icon.size.lg};
    color: ${t.components.icon.colorSecondary};
  `,
  
  iconPrimary: css`
    color: ${t.components.icon.colorPrimary};
  `,
  
  // Text styles
  textPrimary: css`
    color: ${t.colors.text};
    font-family: ${t.typography.fontFamily};
  `,
  
  textSecondary: css`
    color: ${t.colors.textSecondary};
    font-family: ${t.typography.fontFamily};
  `,
  
  textLight: css`
    color: ${t.colors.textLight};
    font-family: ${t.typography.fontFamily};
  `,
  
  // Size utilities
  sizeXs: css`
    font-size: ${t.typography.fontSize.xs};
  `,
  
  sizeSm: css`
    font-size: ${t.typography.fontSize.sm};
  `,
  
  sizeMd: css`
    font-size: ${t.typography.fontSize.md};
  `,
  
  sizeLg: css`
    font-size: ${t.typography.fontSize.lg};
  `,
  
  sizeXl: css`
    font-size: ${t.typography.fontSize.xl};
  `,
  
  // Weight utilities
  weightLight: css`
    font-weight: ${t.typography.fontWeight.light};
  `,
  
  weightNormal: css`
    font-weight: ${t.typography.fontWeight.normal};
  `,
  
  weightMedium: css`
    font-weight: ${t.typography.fontWeight.medium};
  `,
  
  weightBold: css`
    font-weight: ${t.typography.fontWeight.bold};
  `,
  
  // Spacing utilities
  spacingXs: css`
    padding: ${t.spacing.xs};
  `,
  
  spacingSm: css`
    padding: ${t.spacing.sm};
  `,
  
  spacingMd: css`
    padding: ${t.spacing.md};
  `,
  
  spacingLg: css`
    padding: ${t.spacing.lg};
  `,
  
  spacingXl: css`
    padding: ${t.spacing.xl};
  `,
  
  // Margin utilities
  marginXs: css`
    margin: ${t.spacing.xs};
  `,
  
  marginSm: css`
    margin: ${t.spacing.sm};
  `,
  
  marginMd: css`
    margin: ${t.spacing.md};
  `,
  
  marginLg: css`
    margin: ${t.spacing.lg};
  `,
  
  marginXl: css`
    margin: ${t.spacing.xl};
  `,
  
  // Elevation utilities
  elevationLow: css`
    box-shadow: ${t.elevation.low};
  `,
  
  elevationMedium: css`
    box-shadow: ${t.elevation.medium};
  `,
  
  elevationHigh: css`
    box-shadow: ${t.elevation.high};
  `,
  
  // Border radius utilities
  radiusSm: css`
    border-radius: ${t.borderRadius.sm};
  `,
  
  radiusMd: css`
    border-radius: ${t.borderRadius.md};
  `,
  
  radiusLg: css`
    border-radius: ${t.borderRadius.lg};
  `,
  
  // Common component patterns
  sizedButton: css`
    height: 1em;
    width: auto;
    min-width: 1em;
    padding: 0px;
    background: ${t.components.button.outlined.background};
    color: ${t.components.button.outlined.textColor};
    border: 1px solid ${t.components.button.outlined.borderColor};
    border-radius: ${t.components.button.outlined.borderRadius};
    font-family: ${t.typography.fontFamily};
    cursor: pointer;
    
    &:hover {
      background: ${t.components.button.outlined.backgroundHover};
    }
  `,
  
  sizedIcon: css`
    height: 1em;
    width: 1em;
    color: ${t.components.icon.colorSecondary};
  `,
  
  lineIconButton: css`
    padding: 0;
    max-height: 1em;
    background: transparent;
    border: none;
    color: ${t.components.icon.colorSecondary};
    cursor: pointer;
    
    &:hover {
      color: ${t.components.icon.colorPrimary};
    }
  `,
  
  styledSelect: css`
    max-height: 1.5em;
    background: ${t.components.input.background};
    color: ${t.colors.text};
    border: 1px solid ${t.components.input.borderColor};
    border-radius: ${t.components.input.borderRadius};
    font-family: ${t.typography.fontFamily};
    font-size: ${t.typography.fontSize.sm};
    
    &:hover {
      border-color: ${t.components.input.borderColorHover};
    }
    
    &:focus {
      border-color: ${t.components.input.borderColorFocused};
      outline: none;
    }
  `,
  
  labeledEditor: css`
    display: flex;
    flex-flow: row;
    justify-content: flex-start;
    align-items: baseline;
    flex-grow: 1;
  `,
  
  styledLabel: css`
    padding-right: ${t.spacing.sm};
    color: ${t.colors.text};
    font-family: ${t.typography.fontFamily};
    font-size: ${t.typography.fontSize.sm};
    font-weight: ${t.typography.fontWeight.medium};
  `,
  });
};

// Helper function to convert MUI theme to custom CSS properties
export const createCSSVariables = (theme: ResolvedMiroirTheme): Record<string, string> => {
  const t = asUtilsTheme(theme);
  const cssVar = (value: string | number | undefined): string =>
    value === undefined ? "" : String(value);
  return {
    // Colors
    '--miroir-color-primary': cssVar(t.colors.primary),
    '--miroir-color-secondary': cssVar(t.colors.secondary),
    '--miroir-color-background': cssVar(t.colors.background),
    '--miroir-color-surface': cssVar(t.colors.surface),
    '--miroir-color-text': cssVar(t.colors.text),
    '--miroir-color-text-secondary': cssVar(t.colors.textSecondary),
    '--miroir-color-border': cssVar(t.colors.border),
    '--miroir-color-hover': cssVar(t.colors.hover),
    '--miroir-color-selected': cssVar(t.colors.selected),
    '--miroir-color-error': cssVar(t.colors.error),
    '--miroir-color-warning': cssVar(t.colors.warning),
    '--miroir-color-success': cssVar(t.colors.success),
    '--miroir-color-accent': cssVar(t.colors.accent),
    
    // Spacing
    '--miroir-spacing-xs': cssVar(t.spacing.xs),
    '--miroir-spacing-sm': cssVar(t.spacing.sm),
    '--miroir-spacing-md': cssVar(t.spacing.md),
    '--miroir-spacing-lg': cssVar(t.spacing.lg),
    '--miroir-spacing-xl': cssVar(t.spacing.xl),
    
    // Typography
    '--miroir-font-family': cssVar(t.typography.fontFamily),
    '--miroir-font-size-xs': cssVar(t.typography.fontSize.xs),
    '--miroir-font-size-sm': cssVar(t.typography.fontSize.sm),
    '--miroir-font-size-md': cssVar(t.typography.fontSize.md),
    '--miroir-font-size-lg': cssVar(t.typography.fontSize.lg),
    '--miroir-font-size-xl': cssVar(t.typography.fontSize.xl),
    '--miroir-font-weight-normal': cssVar(t.typography.fontWeight.normal),
    '--miroir-font-weight-medium': cssVar(t.typography.fontWeight.medium),
    '--miroir-font-weight-bold': cssVar(t.typography.fontWeight.bold),
    
    // Border radius
    '--miroir-border-radius-sm': cssVar(t.borderRadius.sm),
    '--miroir-border-radius-md': cssVar(t.borderRadius.md),
    '--miroir-border-radius-lg': cssVar(t.borderRadius.lg),
    
    // Elevation
    '--miroir-elevation-low': cssVar(t.elevation.low),
    '--miroir-elevation-medium': cssVar(t.elevation.medium),
    '--miroir-elevation-high': cssVar(t.elevation.high),
    
    // Component specific
    '--miroir-button-primary-bg': t.components.button.primary.background,
    '--miroir-button-primary-text': t.components.button.primary.textColor,
    '--miroir-button-primary-border': t.components.button.primary.borderColor,
    '--miroir-input-bg': t.components.input.background,
    '--miroir-input-border': t.components.input.borderColor,
    '--miroir-input-border-focused': t.components.input.borderColorFocused,
    '--miroir-card-bg': t.components.card.background,
    '--miroir-card-border': t.components.card.borderColor,
    '--miroir-icon-size-sm': t.components.icon.size.sm,
    '--miroir-icon-size-md': t.components.icon.size.md,
    '--miroir-icon-size-lg': t.components.icon.size.lg,
  };
};

// Helper to apply CSS variables to document root
export const applyCSSVariables = (theme: ResolvedMiroirTheme): void => {
  const variables = createCSSVariables(theme);
  const root = document.documentElement;
  
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

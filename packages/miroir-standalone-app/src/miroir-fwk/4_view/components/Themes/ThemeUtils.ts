// ################################################################################################
// Theme Utility Functions
// 
// This module provides utility functions to help migrate from @emotion/styled to the unified
// Miroir theme system and to provide styled component alternatives that use the theme.
//
// ################################################################################################

import { css } from '@emotion/react';
import { ResolvedMiroirTheme } from './MiroirTheme.js';

// Helper to create CSS styles from theme
export const createThemedStyle = (theme: ResolvedMiroirTheme) => ({
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
    background: ${theme.components.button.primary.background};
    color: ${theme.components.button.primary.textColor};
    border: 1px solid ${theme.components.button.primary.borderColor};
    border-radius: ${theme.components.button.primary.borderRadius};
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.sm};
    font-weight: ${theme.typography.fontWeight.medium};
    cursor: pointer;
    transition: background-color ${theme.transitions.duration.short} ${theme.transitions.easing.easeOut};
    
    &:hover {
      background: ${theme.components.button.primary.backgroundHover};
    }
    
    &:active {
      background: ${theme.components.button.primary.backgroundActive};
    }
  `,
  
  buttonSecondary: css`
    background: ${theme.components.button.secondary.background};
    color: ${theme.components.button.secondary.textColor};
    border: 1px solid ${theme.components.button.secondary.borderColor};
    border-radius: ${theme.components.button.secondary.borderRadius};
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.sm};
    font-weight: ${theme.typography.fontWeight.medium};
    cursor: pointer;
    transition: background-color ${theme.transitions.duration.short} ${theme.transitions.easing.easeOut};
    
    &:hover {
      background: ${theme.components.button.secondary.backgroundHover};
    }
    
    &:active {
      background: ${theme.components.button.secondary.backgroundActive};
    }
  `,
  
  buttonOutlined: css`
    background: ${theme.components.button.outlined.background};
    color: ${theme.components.button.outlined.textColor};
    border: 1px solid ${theme.components.button.outlined.borderColor};
    border-radius: ${theme.components.button.outlined.borderRadius};
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.sm};
    font-weight: ${theme.typography.fontWeight.medium};
    cursor: pointer;
    transition: all ${theme.transitions.duration.short} ${theme.transitions.easing.easeOut};
    
    &:hover {
      background: ${theme.components.button.outlined.backgroundHover};
    }
    
    &:active {
      background: ${theme.components.button.outlined.backgroundActive};
    }
  `,
  
  // Input styles
  input: css`
    background: ${theme.components.input.background};
    color: ${theme.colors.text};
    border: 1px solid ${theme.components.input.borderColor};
    border-radius: ${theme.components.input.borderRadius};
    height: ${theme.components.input.height};
    padding: 0 ${theme.spacing.sm};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.sm};
    transition: all ${theme.transitions.duration.short} ${theme.transitions.easing.easeOut};
    
    &:hover {
      background: ${theme.components.input.backgroundHover};
      border-color: ${theme.components.input.borderColorHover};
    }
    
    &:focus {
      background: ${theme.components.input.backgroundFocused};
      border-color: ${theme.components.input.borderColorFocused};
      outline: none;
      box-shadow: 0 0 0 2px ${theme.colors.accentLight};
    }
    
    &::placeholder {
      color: ${theme.components.input.placeholderColor};
    }
  `,
  
  // Card styles
  card: css`
    background: ${theme.components.card.background};
    border: 1px solid ${theme.components.card.borderColor};
    border-radius: ${theme.components.card.borderRadius};
    padding: ${theme.components.card.padding};
    box-shadow: ${theme.components.card.elevation};
  `,
  
  // Icon styles
  iconSmall: css`
    width: ${theme.components.icon.size.sm};
    height: ${theme.components.icon.size.sm};
    color: ${theme.components.icon.colorSecondary};
  `,
  
  iconMedium: css`
    width: ${theme.components.icon.size.md};
    height: ${theme.components.icon.size.md};
    color: ${theme.components.icon.colorSecondary};
  `,
  
  iconLarge: css`
    width: ${theme.components.icon.size.lg};
    height: ${theme.components.icon.size.lg};
    color: ${theme.components.icon.colorSecondary};
  `,
  
  iconPrimary: css`
    color: ${theme.components.icon.colorPrimary};
  `,
  
  // Text styles
  textPrimary: css`
    color: ${theme.colors.text};
    font-family: ${theme.typography.fontFamily};
  `,
  
  textSecondary: css`
    color: ${theme.colors.textSecondary};
    font-family: ${theme.typography.fontFamily};
  `,
  
  textLight: css`
    color: ${theme.colors.textLight};
    font-family: ${theme.typography.fontFamily};
  `,
  
  // Size utilities
  sizeXs: css`
    font-size: ${theme.typography.fontSize.xs};
  `,
  
  sizeSm: css`
    font-size: ${theme.typography.fontSize.sm};
  `,
  
  sizeMd: css`
    font-size: ${theme.typography.fontSize.md};
  `,
  
  sizeLg: css`
    font-size: ${theme.typography.fontSize.lg};
  `,
  
  sizeXl: css`
    font-size: ${theme.typography.fontSize.xl};
  `,
  
  // Weight utilities
  weightLight: css`
    font-weight: ${theme.typography.fontWeight.light};
  `,
  
  weightNormal: css`
    font-weight: ${theme.typography.fontWeight.normal};
  `,
  
  weightMedium: css`
    font-weight: ${theme.typography.fontWeight.medium};
  `,
  
  weightBold: css`
    font-weight: ${theme.typography.fontWeight.bold};
  `,
  
  // Spacing utilities
  spacingXs: css`
    padding: ${theme.spacing.xs};
  `,
  
  spacingSm: css`
    padding: ${theme.spacing.sm};
  `,
  
  spacingMd: css`
    padding: ${theme.spacing.md};
  `,
  
  spacingLg: css`
    padding: ${theme.spacing.lg};
  `,
  
  spacingXl: css`
    padding: ${theme.spacing.xl};
  `,
  
  // Margin utilities
  marginXs: css`
    margin: ${theme.spacing.xs};
  `,
  
  marginSm: css`
    margin: ${theme.spacing.sm};
  `,
  
  marginMd: css`
    margin: ${theme.spacing.md};
  `,
  
  marginLg: css`
    margin: ${theme.spacing.lg};
  `,
  
  marginXl: css`
    margin: ${theme.spacing.xl};
  `,
  
  // Elevation utilities
  elevationLow: css`
    box-shadow: ${theme.elevation.low};
  `,
  
  elevationMedium: css`
    box-shadow: ${theme.elevation.medium};
  `,
  
  elevationHigh: css`
    box-shadow: ${theme.elevation.high};
  `,
  
  // Border radius utilities
  radiusSm: css`
    border-radius: ${theme.borderRadius.sm};
  `,
  
  radiusMd: css`
    border-radius: ${theme.borderRadius.md};
  `,
  
  radiusLg: css`
    border-radius: ${theme.borderRadius.lg};
  `,
  
  // Common component patterns
  sizedButton: css`
    height: 1em;
    width: auto;
    min-width: 1em;
    padding: 0px;
    background: ${theme.components.button.outlined.background};
    color: ${theme.components.button.outlined.textColor};
    border: 1px solid ${theme.components.button.outlined.borderColor};
    border-radius: ${theme.components.button.outlined.borderRadius};
    font-family: ${theme.typography.fontFamily};
    cursor: pointer;
    
    &:hover {
      background: ${theme.components.button.outlined.backgroundHover};
    }
  `,
  
  sizedIcon: css`
    height: 1em;
    width: 1em;
    color: ${theme.components.icon.colorSecondary};
  `,
  
  lineIconButton: css`
    padding: 0;
    max-height: 1em;
    background: transparent;
    border: none;
    color: ${theme.components.icon.colorSecondary};
    cursor: pointer;
    
    &:hover {
      color: ${theme.components.icon.colorPrimary};
    }
  `,
  
  styledSelect: css`
    max-height: 1.5em;
    background: ${theme.components.input.background};
    color: ${theme.colors.text};
    border: 1px solid ${theme.components.input.borderColor};
    border-radius: ${theme.components.input.borderRadius};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.sm};
    
    &:hover {
      border-color: ${theme.components.input.borderColorHover};
    }
    
    &:focus {
      border-color: ${theme.components.input.borderColorFocused};
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
    padding-right: ${theme.spacing.sm};
    color: ${theme.colors.text};
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.sm};
    font-weight: ${theme.typography.fontWeight.medium};
  `,
});

// Helper function to convert MUI theme to custom CSS properties
export const createCSSVariables = (theme: ResolvedMiroirTheme): Record<string, string> => {
  return {
    // Colors
    '--miroir-color-primary': theme.colors.primary,
    '--miroir-color-secondary': theme.colors.secondary,
    '--miroir-color-background': theme.colors.background,
    '--miroir-color-surface': theme.colors.surface,
    '--miroir-color-text': theme.colors.text,
    '--miroir-color-text-secondary': theme.colors.textSecondary,
    '--miroir-color-border': theme.colors.border,
    '--miroir-color-hover': theme.colors.hover,
    '--miroir-color-selected': theme.colors.selected,
    '--miroir-color-error': theme.colors.error,
    '--miroir-color-warning': theme.colors.warning,
    '--miroir-color-success': theme.colors.success,
    '--miroir-color-accent': theme.colors.accent,
    
    // Spacing
    '--miroir-spacing-xs': theme.spacing.xs,
    '--miroir-spacing-sm': theme.spacing.sm,
    '--miroir-spacing-md': theme.spacing.md,
    '--miroir-spacing-lg': theme.spacing.lg,
    '--miroir-spacing-xl': theme.spacing.xl,
    
    // Typography
    '--miroir-font-family': theme.typography.fontFamily,
    '--miroir-font-size-xs': theme.typography.fontSize.xs,
    '--miroir-font-size-sm': theme.typography.fontSize.sm,
    '--miroir-font-size-md': theme.typography.fontSize.md,
    '--miroir-font-size-lg': theme.typography.fontSize.lg,
    '--miroir-font-size-xl': theme.typography.fontSize.xl,
    '--miroir-font-weight-normal': theme.typography.fontWeight.normal.toString(),
    '--miroir-font-weight-medium': theme.typography.fontWeight.medium.toString(),
    '--miroir-font-weight-bold': theme.typography.fontWeight.bold.toString(),
    
    // Border radius
    '--miroir-border-radius-sm': theme.borderRadius.sm,
    '--miroir-border-radius-md': theme.borderRadius.md,
    '--miroir-border-radius-lg': theme.borderRadius.lg,
    
    // Elevation
    '--miroir-elevation-low': theme.elevation.low,
    '--miroir-elevation-medium': theme.elevation.medium,
    '--miroir-elevation-high': theme.elevation.high,
    
    // Component specific
    '--miroir-button-primary-bg': theme.components.button.primary.background,
    '--miroir-button-primary-text': theme.components.button.primary.textColor,
    '--miroir-button-primary-border': theme.components.button.primary.borderColor,
    '--miroir-input-bg': theme.components.input.background,
    '--miroir-input-border': theme.components.input.borderColor,
    '--miroir-input-border-focused': theme.components.input.borderColorFocused,
    '--miroir-card-bg': theme.components.card.background,
    '--miroir-card-border': theme.components.card.borderColor,
    '--miroir-icon-size-sm': theme.components.icon.size.sm,
    '--miroir-icon-size-md': theme.components.icon.size.md,
    '--miroir-icon-size-lg': theme.components.icon.size.lg,
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

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';
import {
  FormControl,
  FormControlProps,
  InputLabel,
  InputLabelProps,
  MenuItem,
  MenuItemProps,
  Paper, 
  PaperProps,
  Select,
  SelectProps,
} from "@mui/material";

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

// ################################################################################################
// Themed Material-UI Components
// 
// Wrappers around Material-UI components that properly integrate with the Miroir theme system
// ################################################################################################

// Themed FormControl that applies Miroir theme colors
export const ThemedFormControl: React.FC<FormControlProps & ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  ...props 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const formControlStyles = css({
    '& .MuiInputLabel-root': {
      color: currentTheme.colors.text,
      '&.Mui-focused': {
        color: currentTheme.colors.primary,
      },
    },
    '& .MuiOutlinedInput-root': {
      backgroundColor: currentTheme.colors.surface,
      color: currentTheme.colors.text,
      '& fieldset': {
        borderColor: currentTheme.colors.border,
      },
      '&:hover fieldset': {
        borderColor: currentTheme.colors.primary,
      },
      '&.Mui-focused fieldset': {
        borderColor: currentTheme.colors.primary,
      },
    },
    '& .MuiSelect-select': {
      color: currentTheme.colors.text,
      backgroundColor: currentTheme.colors.surface,
    },
    '& .MuiInputBase-root': {
      color: currentTheme.colors.text,
      backgroundColor: currentTheme.colors.surface,
    },
  });

  return (
    <FormControl css={formControlStyles} className={className} style={style} {...props}>
      {children}
    </FormControl>
  );
};

// Themed InputLabel that applies Miroir theme colors
export const ThemedInputLabel: React.FC<InputLabelProps & ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  ...props 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const inputLabelStyles = css({
    color: `${currentTheme.colors.text} !important`,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.md,
    '&.Mui-focused': {
      color: `${currentTheme.colors.primary} !important`,
    },
    '&.MuiInputLabel-shrink': {
      color: `${currentTheme.colors.textSecondary} !important`,
    },
  });

  return (
    <InputLabel css={inputLabelStyles} className={className} style={style} {...props}>
      {children}
    </InputLabel>
  );
};

// Themed MenuItem that applies Miroir theme colors
export const ThemedMenuItem: React.FC<MenuItemProps & ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  ...props 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const menuItemStyles = css({
    color: `${currentTheme.colors.text} !important`,
    backgroundColor: `${currentTheme.colors.surface} !important`,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.md,
    '&:hover': {
      backgroundColor: `${currentTheme.colors.hover} !important`,
    },
    '&.Mui-selected': {
      backgroundColor: `${currentTheme.colors.selected} !important`,
      '&:hover': {
        backgroundColor: `${currentTheme.colors.primaryLight} !important`,
      },
    },
  });

  return (
    <MenuItem css={menuItemStyles} className={className} style={style} {...props}>
      {children}
    </MenuItem>
  );
};

// Enhanced ThemedMUISelect that wraps Material-UI Select with FormControl and InputLabel
export interface ThemedMUISelectProps extends ThemedComponentProps {
  label?: string;
  labelId?: string;
  fullWidth?: boolean;
  id?: string;
  value?: any;
  onChange?: (event: any) => void;
  name?: string;
  variant?: 'filled' | 'outlined' | 'standard';
  'data-testid'?: string;
  'aria-label'?: string;
  sx?: any; // Allow MUI sx prop
  [key: string]: any; // Allow any other props
}

export const ThemedMUISelect: React.FC<ThemedMUISelectProps> = ({ 
  children, 
  className, 
  style,
  label,
  labelId,
  fullWidth = false,
  variant = 'outlined',
  sx,
  ...props 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const selectStyles = css({
    color: `${currentTheme.colors.text} !important`,
    backgroundColor: `${currentTheme.colors.surface} !important`,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.md,
    '& .MuiSelect-select': {
      color: `${currentTheme.colors.text} !important`,
      backgroundColor: `${currentTheme.colors.surface} !important`,
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: `${currentTheme.colors.border} !important`,
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: `${currentTheme.colors.primary} !important`,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: `${currentTheme.colors.primary} !important`,
    },
    '& .MuiSelect-icon': {
      color: `${currentTheme.colors.text} !important`,
    },
  });

  return (
    <ThemedFormControl fullWidth={fullWidth}>
      {label && <ThemedInputLabel id={labelId}>{label}</ThemedInputLabel>}
      <Select css={selectStyles} labelId={labelId} label={label} variant={variant} sx={sx} className={className} style={style} {...props}>
        {children}
      </Select>
    </ThemedFormControl>
  );
};

export const ThemedPaper: React.FC<PaperProps & ThemedComponentProps> = ({
  children,
  className,
  style,
  elevation = 1,
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();

  const paperStyles = css({
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.md,
    boxShadow: elevation > 0 ? `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)` : 'none',
    overflow: 'hidden',
    fontFamily: currentTheme.typography.fontFamily,
  });

  return (
    <Paper
      css={paperStyles}
      className={className}
      style={style}
      elevation={elevation}
      {...props}
    >
      {children}
    </Paper>
  );
};

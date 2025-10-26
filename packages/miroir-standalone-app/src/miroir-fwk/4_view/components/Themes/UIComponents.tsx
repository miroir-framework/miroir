/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

// ################################################################################################
// UI Components
// 
// Miscellaneous UI components: buttons, tooltips, etc.
// ################################################################################################

export const ThemedStyledButton: React.FC<ThemedComponentProps & {
  variant?: 'contained' | 'outlined' | 'text' | 'transparent';
  type?: 'button' | 'submit' | 'reset';
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
  component?: any;
  to?: string;
}> = ({ 
  children, 
  className, 
  style,
  onClick,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  startIcon,
  endIcon,
  href,
  target,
  rel,
  component: Component = 'button',
  to,
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const getBackgroundColor = () => {
    if (disabled) return currentTheme.colors.surfaceVariant || currentTheme.colors.surface;
    if (variant === 'outlined' || variant === 'text') return 'transparent';
    
    switch (color) {
      case 'secondary': return currentTheme.colors.secondary;
      case 'error': return currentTheme.colors.error || '#f44336';
      case 'warning': return currentTheme.colors.warning || '#ff9800';
      case 'info': return currentTheme.colors.info || '#2196f3';
      case 'success': return currentTheme.colors.success || '#4caf50';
      default: return currentTheme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return currentTheme.colors.textSecondary;
    if (variant === 'outlined' || variant === 'text') {
      switch (color) {
        case 'secondary': return currentTheme.colors.secondary;
        case 'error': return currentTheme.colors.error || '#f44336';
        case 'warning': return currentTheme.colors.warning || '#ff9800';
        case 'info': return currentTheme.colors.info || '#2196f3';
        case 'success': return currentTheme.colors.success || '#4caf50';
        default: return currentTheme.colors.primary;
      }
    }
    return currentTheme.colors.surface; // White/light text on colored backgrounds
  };

  const getPadding = () => {
    switch (size) {
      case 'small': return `${currentTheme.spacing.xs} ${currentTheme.spacing.sm}`;
      case 'large': return `${currentTheme.spacing.md} ${currentTheme.spacing.lg}`;
      default: return `${currentTheme.spacing.sm} ${currentTheme.spacing.md}`;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small': return currentTheme.typography.fontSize.sm;
      case 'large': return currentTheme.typography.fontSize.lg;
      default: return currentTheme.typography.fontSize.md;
    }
  };

  const buttonStyles = css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: currentTheme.spacing.xs,
    padding: getPadding(),
    backgroundColor: getBackgroundColor(),
    color: getTextColor(),
    border: variant === 'outlined' ? `1px solid ${getTextColor()}` : 'none',
    borderRadius: currentTheme.borderRadius.md,
    fontSize: getFontSize(),
    fontFamily: currentTheme.typography.fontFamily,
    fontWeight: currentTheme.typography.fontWeight.medium,
    textDecoration: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    width: fullWidth ? '100%' : 'auto',
    textTransform: 'uppercase',
    letterSpacing: '0.02857em',
    minWidth: '64px',
    boxSizing: 'border-box',
    
    '&:hover': disabled ? {} : {
      backgroundColor: variant === 'contained' 
        ? `${getBackgroundColor()}dd` 
        : `${getTextColor()}10`,
      borderColor: variant === 'outlined' ? getBackgroundColor() : undefined,
    },
    
    '&:active': disabled ? {} : {
      backgroundColor: variant === 'contained' 
        ? `${getBackgroundColor()}bb` 
        : `${getTextColor()}20`,
    },
  });

  const buttonProps = {
    css: buttonStyles,
    className,
    style,
    onClick: disabled ? undefined : onClick,
    disabled,
    href,
    target,
    rel,
    to,
    ...props
  };

  return (
    <Component {...buttonProps}>
      {startIcon && <span>{startIcon}</span>}
      {children}
      {endIcon && <span>{endIcon}</span>}
    </Component>
  );
};

// ################################################################################################
export const ThemedMenuItemOption: React.FC<ThemedComponentProps & {
  value?: any;
  disabled?: boolean;
  divider?: boolean;
  dense?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  onClick,
  value,
  disabled = false,
  divider = false,
  dense = false
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const menuItemStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    padding: dense 
      ? `${currentTheme.spacing.xs} ${currentTheme.spacing.sm}` 
      : `${currentTheme.spacing.sm} ${currentTheme.spacing.md}`,
    backgroundColor: 'transparent',
    color: disabled ? currentTheme.colors.textSecondary : currentTheme.colors.text,
    fontSize: currentTheme.typography.fontSize.md,
    fontFamily: currentTheme.typography.fontFamily,
    border: 'none',
    borderBottom: divider ? `1px solid ${currentTheme.colors.border}` : 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'left',
    textDecoration: 'none',
    opacity: disabled ? 0.6 : 1,
    transition: `background-color ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    
    '&:hover': disabled ? {} : {
      backgroundColor: currentTheme.colors.hover || currentTheme.colors.primaryLight,
    },
    
    '&:active': disabled ? {} : {
      backgroundColor: currentTheme.colors.selected || currentTheme.colors.primary + '20',
    },
  });

  return (
    <div 
      css={menuItemStyles} 
      className={className} 
      style={style}
      onClick={disabled ? undefined : onClick}
      data-value={value}
    >
      {children}
    </div>
  );
};

export const ThemedSwitch: React.FC<ThemedComponentProps & {
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
  color?: 'primary' | 'secondary' | 'default';
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}> = ({ 
  checked = false,
  onChange,
  disabled = false,
  size = 'medium',
  color = 'primary',
  className,
  style,
  name,
  value,
  id,
  inputProps,
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const switchSize = size === 'small' ? 16 : 20;
  const trackWidth = switchSize * 2;
  const trackHeight = switchSize + 4;
  
  const getActiveColor = () => {
    switch (color) {
      case 'secondary': return currentTheme.colors.secondary;
      case 'default': return currentTheme.colors.text;
      default: return currentTheme.colors.primary;
    }
  };

  const switchStyles = css({
    position: 'relative',
    display: 'inline-block',
    width: `${trackWidth}px`,
    height: `${trackHeight}px`,
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  });

  const inputStyles = css({
    opacity: 0,
    width: 0,
    height: 0,
    position: 'absolute',
  });

  const trackStyles = css({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: checked 
      ? `${getActiveColor()}66` 
      : currentTheme.colors.surfaceVariant || currentTheme.colors.border,
    borderRadius: `${trackHeight / 2}px`,
    transition: `background-color ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    border: `1px solid ${currentTheme.colors.border}`,
  });

  const thumbStyles = css({
    position: 'absolute',
    top: '2px',
    left: checked ? `${trackWidth - switchSize - 2}px` : '2px',
    width: `${switchSize}px`,
    height: `${switchSize}px`,
    backgroundColor: checked ? getActiveColor() : currentTheme.colors.text,
    borderRadius: '50%',
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  });

  return (
    <label css={switchStyles} className={className} style={style}>
      <input
        css={inputStyles}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        value={value}
        id={id}
        {...inputProps}
        {...props}
      />
      <span css={trackStyles} />
      <span css={thumbStyles} />
    </label>
  );
};

export const ThemedTextEditor: React.FC<ThemedComponentProps & {
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  multiline?: boolean;
  rows?: number;
  maxRows?: number;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  InputProps?: any;
  inputProps?: any;
}> = ({ 
  value,
  onChange,
  variant = 'outlined',
  size = 'medium',
  fullWidth = false,
  multiline = false,
  rows,
  maxRows,
  placeholder,
  type = 'text',
  disabled = false,
  error = false,
  helperText,
  className,
  style,
  name,
  id,
  InputProps,
  inputProps,
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    width: fullWidth ? '100%' : 'auto',
  });

  const inputStyles = css({
    width: fullWidth ? '100%' : 'auto',
    padding: size === 'small' 
      ? `${currentTheme.spacing.xs} ${currentTheme.spacing.sm}`
      : `${currentTheme.spacing.sm} ${currentTheme.spacing.md}`,
    backgroundColor: disabled 
      ? currentTheme.colors.surfaceVariant || currentTheme.colors.surface 
      : currentTheme.colors.surface,
    color: disabled ? currentTheme.colors.textSecondary : currentTheme.colors.text,
    border: `1px solid ${error ? (currentTheme.colors.error || '#f44336') : currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.sm,
    fontSize: currentTheme.typography.fontSize.md,
    fontFamily: currentTheme.typography.fontFamily,
    outline: 'none',
    resize: multiline ? 'vertical' : 'none',
    minHeight: multiline && rows ? `${rows * 1.5}em` : 'auto',
    maxHeight: multiline && maxRows ? `${maxRows * 1.5}em` : 'auto',
    cursor: disabled ? 'not-allowed' : 'text',
    
    '&:focus': {
      borderColor: error 
        ? (currentTheme.colors.error || '#f44336')
        : currentTheme.colors.primary,
      boxShadow: `0 0 0 2px ${error 
        ? (currentTheme.colors.error || '#f44336') + '20'
        : currentTheme.colors.primary + '20'}`,
    },
    
    '&:hover': disabled ? {} : {
      borderColor: error 
        ? (currentTheme.colors.error || '#f44336')
        : currentTheme.colors.hover || currentTheme.colors.primary,
    },
    
    '&::placeholder': {
      color: currentTheme.colors.textSecondary,
      opacity: 1,
    },
  });

  const helperTextStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
    color: error 
      ? (currentTheme.colors.error || '#f44336')
      : currentTheme.colors.textSecondary,
    marginTop: currentTheme.spacing.xs,
    marginLeft: currentTheme.spacing.xs,
  });

  const Component = multiline ? 'textarea' : 'input';

  return (
    <div css={containerStyles} className={className} style={style}>
      <Component
        css={inputStyles}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={multiline ? undefined : type}
        disabled={disabled}
        name={name}
        id={id}
        rows={multiline ? rows : undefined}
        {...inputProps}
        {...props}
      />
      {helperText && (
        <div css={helperTextStyles}>
          {helperText}
        </div>
      )}
    </div>
  );
};

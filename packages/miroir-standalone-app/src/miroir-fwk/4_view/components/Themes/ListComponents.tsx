/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from 'miroir-react';

// ################################################################################################
// List Components
// 
// Components for lists, list items, and list-related UI elements
// ################################################################################################

export const ThemedList: React.FC<ThemedComponentProps & {
  dense?: boolean;
  disablePadding?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  dense = false,
  disablePadding = false
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const listStyles = css({
    listStyle: 'none',
    margin: 0,
    padding: disablePadding ? 0 : currentTheme.spacing.xs,
    backgroundColor: 'transparent',
    color: currentTheme.colors.text,
  });

  return (
    <ul css={listStyles} className={className} style={style}>
      {children}
    </ul>
  );
};

export const ThemedListItem: React.FC<ThemedComponentProps & {
  disablePadding?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  disablePadding = false
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const itemStyles = css({
    display: 'block',
    padding: disablePadding ? 0 : `${currentTheme.spacing.xs} 0`,
    color: currentTheme.colors.text,
  });

  return (
    <li css={itemStyles} className={className} style={style}>
      {children}
    </li>
  );
};

export const ThemedListItemButton: React.FC<ThemedComponentProps & {
  component?: any;
  to?: string;
  sx?: any;
}> = ({ 
  children, 
  className, 
  style,
  onClick,
  component: Component = 'button',
  to,
  sx
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    padding: sx?.padding !== undefined ? sx.padding : `${currentTheme.spacing.sm} ${currentTheme.spacing.md}`,
    backgroundColor: 'transparent',
    border: 'none',
    color: currentTheme.colors.text,
    textDecoration: 'none',
    cursor: 'pointer',
    borderRadius: currentTheme.borderRadius.sm,
    transition: 'background-color 0.2s',
    textAlign: 'left',
    '&:hover': {
      backgroundColor: currentTheme.colors.hover || currentTheme.colors.primaryLight,
    },
    '&:active': {
      backgroundColor: currentTheme.colors.active || currentTheme.colors.primary,
    },
    ...(sx ? Object.fromEntries(Object.entries(sx).filter(([key]) => key !== 'padding')) : {})
  });

  const props = {
    css: buttonStyles,
    className,
    style,
    onClick,
    ...(to ? { to } : {})
  };

  return (
    <Component {...props}>
      {children}
    </Component>
  );
};

export const ThemedListMiroirIcon: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const iconStyles = css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '40px',
    width: '40px',
    marginRight: currentTheme.spacing.sm,
    color: currentTheme.colors.text,
    fontSize: currentTheme.typography.fontSize.lg,
    flexShrink: 0,
  });

  return (
    <span css={iconStyles} className={className} style={style}>
      {children}
    </span>
  );
};

export const ThemedListItemText: React.FC<ThemedComponentProps & {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
}> = ({ 
  children, 
  className, 
  style,
  primary,
  secondary
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const textStyles = css({
    flex: 1,
    color: currentTheme.colors.text,
    fontSize: currentTheme.typography.fontSize.md,
    textAlign: 'left',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  });

  const secondaryStyles = css({
    color: currentTheme.colors.textSecondary || currentTheme.colors.text,
    fontSize: currentTheme.typography.fontSize.sm,
    marginTop: currentTheme.spacing.xs,
  });

  return (
    <div css={textStyles} className={className} style={style}>
      {primary || children}
      {secondary && <div css={secondaryStyles}>{secondary}</div>}
    </div>
  );
};

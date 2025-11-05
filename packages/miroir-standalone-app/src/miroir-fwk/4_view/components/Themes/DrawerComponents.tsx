/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

// ################################################################################################
// Drawer Components
// 
// Components for sidebars, drawers, and resizable panels
// ################################################################################################

export const ThemedDrawer: React.FC<ThemedComponentProps & { 
  open?: boolean; 
  width?: number; 
  variant?: string;
}> = ({ 
  children, 
  className, 
  style, 
  open, 
  width = 200,
  variant = "permanent" 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const drawerStyles = css({
    width: open ? width : 0,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    backgroundColor: currentTheme.colors.surface,
    borderRight: `1px solid ${currentTheme.colors.border}`,
    transition: 'width 0.2s ease',
    display: open ? 'flex' : 'none',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 1200,
    overflow: 'hidden',
    maxWidth: open ? `${width}px` : '0px',
  });

  return (
    <div css={drawerStyles} className={className} style={style}>
      {children}
    </div>
  );
};

export const ThemedDrawerHeader: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const headerStyles = css({
    display: 'flex',
    alignItems: 'center',
    padding: currentTheme.spacing.sm,
    minHeight: 'auto',
    justifyContent: 'flex-start',
    fontSize: currentTheme.typography.fontSize.md,
    backgroundColor: currentTheme.colors.surface,
    borderBottom: `1px solid ${currentTheme.colors.border}`,
  });

  return (
    <div css={headerStyles} className={className} style={style}>
      {children}
    </div>
  );
};

export const ThemedResizeHandle: React.FC<ThemedComponentProps & {
  onMouseDown?: (e: React.MouseEvent) => void;
  isResizing?: boolean;
}> = ({ 
  className, 
  style, 
  onMouseDown,
  isResizing 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const handleStyles = css({
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '6px',
    backgroundColor: currentTheme.colors.border,
    cursor: 'col-resize',
    zIndex: 1000,
    transition: 'background-color 0.2s',
    borderLeft: `1px solid ${currentTheme.colors.borderLight || currentTheme.colors.border}`,
    '&:hover': {
      backgroundColor: currentTheme.colors.hover || currentTheme.colors.primaryLight,
      borderLeft: `1px solid ${currentTheme.colors.border}`,
    },
    '&:active': {
      backgroundColor: currentTheme.colors.active || currentTheme.colors.primary,
      borderLeft: `1px solid ${currentTheme.colors.border}`,
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      right: '2px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '2px',
      height: '30px',
      backgroundColor: currentTheme.colors.text,
      opacity: 0.3,
      borderRadius: '1px',
    },
  });

  return (
    <div 
      css={handleStyles} 
      className={className} 
      style={style}
      onMouseDown={onMouseDown}
    />
  );
};

export const ThemedDivider: React.FC<ThemedComponentProps> = ({ 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const dividerStyles = css({
    height: '1px',
    backgroundColor: currentTheme.colors.border,
    border: 'none',
    margin: 0,
  });

  return (
    <hr css={dividerStyles} className={className} style={style} />
  );
};

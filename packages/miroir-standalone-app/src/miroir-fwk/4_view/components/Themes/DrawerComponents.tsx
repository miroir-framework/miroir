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
  resizeHandle?: "left" | "right";
  onMouseDown?: (e: React.MouseEvent) => void;
  isResizing?: boolean;
}> = ({ 
  children, 
  className, 
  style, 
  open, 
  width = 200,
  variant = "permanent",
  resizeHandle,
  onMouseDown,
  isResizing
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const drawerStyles = css({
    display: open ? 'flex' : 'none',
    position: 'fixed',
    width: open ? width : 0,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    backgroundColor: currentTheme.colors.surface,
    borderRight: `1px solid ${currentTheme.colors.border}`,
    transition: 'width 0.2s ease',
    flexDirection: 'column',
    // position: 'sticky',
    // position: 'absolute',
    top: 0,
    left: 0,
    // height: '100vh',
    height: '100%',
    // zIndex: 1200,
    overflow: 'hidden',
    // maxWidth: open ? `${width}px` : '0px',
    maxWidth: open ? `calc(${width}px + ${10}px)` : '0px',
  });

  return (
    <div style={{ display: "flex", flexDirection: "row", height: "100vh" }}>
      {open && onMouseDown && (
        <ThemedResizeHandle
          onMouseDown={onMouseDown}
          isResizing={isResizing}
          sidebarOpen={open}
          sidebarWidth={width}
        />
      )}
      <div css={drawerStyles} className={className} style={style}>
        {children}
      </div>
      {/* {open && resizeHandle != "left" && onMouseDown && <ThemedResizeHandle onMouseDown={onMouseDown} isResizing={isResizing} />} */}
    </div>
  );
};

export const ThemedResizeHandleWidth = 6;
// ################################################################################################
// Theme Hooks
// 
// Hooks to access theme properties in drawer components
// ################################################################################################
export const ThemedResizeHandle: React.FC<ThemedComponentProps & {
  sidebarOpen?: boolean;
  sidebarWidth?: number;
  onMouseDown?: (e: React.MouseEvent) => void;
  isResizing?: boolean;
}> = ({ 
  sidebarWidth = 0,
  sidebarOpen,
  className, 
  style, 
  onMouseDown,
  isResizing,
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const handleStyles = css({
    width: `${ThemedResizeHandleWidth}px`,
    position: 'fixed',
    display: sidebarOpen ? 'flex' : 'none',
    left: sidebarWidth,
    height: '100%',
    flexShrink: 0,
    backgroundColor: currentTheme.colors.border,
    cursor: 'col-resize',
    zIndex: 1200,
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

// ################################################################################################
export const ThemedDrawerHeader: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const headerStyles = css({
    display: 'flex',
    flexFlow: 'column nowrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: currentTheme.spacing.sm,
    minHeight: 'auto',
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

// ################################################################################################
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

/** @jsxImportSource @emotion/react */
import { css, type CSSObject, type SerializedStyles } from '@emotion/react';
import React from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';
import type { CSSInterpolation } from '@mui/material';
import { ThemedResizeHandleWidth } from './DrawerComponents';

// ################################################################################################
// Layout Components
// 
// Components for layout: flex containers, grids, boxes, etc.
// ################################################################################################

export const ThemedFlexRow: React.FC<ThemedComponentProps & {
    justify?: "start" | "center" | "end" | "space-between";
    align?: "start" | "center" | "end" | "stretch";
    gap?: string;
    wrap?: boolean;
  }
> = ({ children, className, style, justify = "start", align = "center", gap, wrap = false }) => {
  const { currentTheme } = useMiroirTheme();

  const flexStyles = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: justify === "start" ? "flex-start" : justify === "end" ? "flex-end" : justify,
    alignItems: align === "start" ? "flex-start" : align === "end" ? "flex-end" : align,
    flexWrap: wrap ? "wrap" : "nowrap",
    gap: gap || currentTheme.spacing.sm,
  });

  return (
    <span css={flexStyles} className={className} style={style}>
      {children}
    </span>
  );
};

export const ThemedFlexColumn: React.FC<ThemedComponentProps & {
  justify?: 'start' | 'center' | 'end' | 'space-between';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: string;
}> = ({ 
  children, 
  className, 
  style,
  justify = 'start',
  align = 'start',
  gap
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const flexStyles = css({
    display: "flex",
    flexDirection: "column",
    justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : justify,
    alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align,
    gap: gap || currentTheme.spacing.sm,
  });

  return (
    <span css={flexStyles} className={className} style={style}>
      {children}
    </span>
  );
};

// #################################################################################################
export const ThemedBox: React.FC<ThemedComponentProps & {
  display?: 'flex' | 'inline-flex' | 'block' | 'inline-block';
  position?: 'static' | 'relative' | 'absolute' | 'fixed';
  width?: string;
  height?: string;
  flexGrow?: number;
  flexDirection?: 'row' | 'column';
  marginRight?: string | number;
  transition?: string;
  justifyContent?: string;
  alignItems?: string;
  marginBottom?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  minWidth?: string;
  background?: string;
  backgroundColor?: string;
  boxShadow?: string;
}> = ({ 
  children, 
  className, 
  style,
  display = 'block',
  position,
  width,
  height,
  flexGrow,
  flexDirection,
  marginRight,
  transition,
  justifyContent,
  alignItems,
  marginBottom,
  border,
  borderRadius,
  padding,
  minWidth,
  background,
  backgroundColor,
  boxShadow,
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const boxStyles = css({
    display,
    position,
    width,
    height,
    flexGrow,
    flexDirection,
    marginRight,
    transition,
    justifyContent,
    alignItems,
    marginBottom,
    border,
    borderRadius,
    padding,
    minWidth,
    background,
    backgroundColor,
    boxShadow,
  });

  return (
    <div css={boxStyles} className={className} style={style} {...props}>
      {children}
    </div>
  );
};

// #################################################################################################
export const ThemedFlexContainer: React.FC<ThemedComponentProps & {
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
}> = ({ 
  children, 
  className, 
  style,
  flexDirection = 'row',
  justifyContent = 'flex-start',
  alignItems = 'center',
  gap,
  flexWrap = 'nowrap'
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    display: 'flex',
    flexDirection,
    justifyContent,
    alignItems,
    flexWrap,
    gap: gap || currentTheme.spacing.sm,
  });

  return (
    <div css={containerStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// #################################################################################################
export const ThemedInlineContainer: React.FC<ThemedComponentProps & {
  alignItems?: string;
  gap?: string;
  marginLeft?: string;
  marginRight?: string;
  marginTop?: string;
  marginBottom?: string;
  padding?: string;
  borderLeft?: string;
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
}> = ({ 
  children, 
  className, 
  style,
  alignItems = 'center',
  gap,
  marginLeft,
  marginRight,
  marginTop,
  marginBottom,
  padding,
  borderLeft,
  flexWrap = 'nowrap'
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    display: 'inline-flex',
    alignItems,
    gap: gap || currentTheme.spacing.sm,
    marginLeft,
    marginRight,
    marginTop,
    marginBottom,
    padding,
    borderLeft,
    flexWrap,
  });

  return (
    <div css={containerStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// #################################################################################################
// A simple grid system inspired by Material-UI's Grid, using flexbox and media queries for responsiveness.
export const ThemedGrid: React.FC<ThemedComponentProps & {
  sidebarOpen?: boolean;
  sidebarWidth?: number;
  outlineOpen?: boolean;
  outlineWidth?: number;
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  padding?: number | string;
  minHeight?: string;
  backgroundColor?: string;
  direction?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  zeroMinWidth?: boolean;
}> = ({ 
  sidebarOpen,
  sidebarWidth,
  outlineOpen,
  outlineWidth,
  children, 
  className, 
  style,
  container = false,
  // item = false,
  xs,
  sm,
  md,
  lg,
  xl,
  // spacing = 1,
  // padding,
  // minHeight,
  backgroundColor,
  direction = 'column',
  justifyContent,
  alignItems,
  // wrap = 'wrap',
  // zeroMinWidth = false,
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const totalSidebarWidth = sidebarOpen ? (sidebarWidth || 0) + ThemedResizeHandleWidth : 0;
  const totalOutlineWidth = outlineOpen ? (outlineWidth || 0) : 0;
  const gridStyles = css({
    display: 'flex',
    position: 'relative',
    left: sidebarOpen? `calc(${totalSidebarWidth}px)`: undefined,
    width: `calc(100% - ${totalSidebarWidth}px - ${totalOutlineWidth}px)`,
    // left: `calc(${sideBarWidth}px + 20px)`,
    // display: container ? 'flex' : 'block',
    flexDirection: direction,
    // flexWrap: container ? wrap : 'nowrap',
    justifyContent,
    alignItems: container ? alignItems : undefined,
    // paddingLeft: sideBarWidth,
    // margin: container ? sideBarWidth : undefined,
    // margin: container ? `-${spacing * 4}px` : undefined,
    // width: container && spacing > 0 ? `calc(100% + ${spacing * 8}px)` : undefined,
    // flex: item ? '1 1 0%' : undefined,
    // minWidth: '100%',
    minHeight: '100%',
    // padding: item ? `${spacing * 4}px` : undefined,
    // padding: padding !== undefined ? (typeof padding === 'number' ? `${padding}px` : padding) : undefined,
    // minWidth: zeroMinWidth ? 0 : undefined,
    // minHeight,
    backgroundColor,
    
    // Basic responsive grid system
    ...(xs && {
      flexBasis: `${(xs / 12) * 100}%`,
      maxWidth: `${(xs / 12) * 100}%`,
    }),
    
    [`@media (min-width: ${currentTheme.breakpoints?.sm || '600px'})`]: {
      ...(sm && {
        flexBasis: `${(sm / 12) * 100}%`,
        maxWidth: `${(sm / 12) * 100}%`,
      }),
    },
    
    [`@media (min-width: ${currentTheme.breakpoints?.md || '960px'})`]: {
      ...(md && {
        flexBasis: `${(md / 12) * 100}%`,
        maxWidth: `${(md / 12) * 100}%`,
      }),
    },
    
    [`@media (min-width: ${currentTheme.breakpoints?.lg || '1280px'})`]: {
      ...(lg && {
        flexBasis: `${(lg / 12) * 100}%`,
        maxWidth: `${(lg / 12) * 100}%`,
      }),
    },
    
    [`@media (min-width: ${currentTheme.breakpoints?.xl || '1920px'})`]: {
      ...(xl && {
        flexBasis: `${(xl / 12) * 100}%`,
        maxWidth: `${(xl / 12) * 100}%`,
      }),
    },
  });

  return (
    <div css={gridStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// #################################################################################################
// Context Providers
// 
// Layout-related context providers, e.g. for managing folded state of nodes in the outline.
// #################################################################################################
export const ThemedOptionalAttributeContainer: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    display: "flex",
    flexFlow: "row wrap",
    alignItems: "center",
    gap: currentTheme.spacing.md,
    marginLeft: currentTheme.spacing.md,
  });

  return (
    <span css={containerStyles} className={className} style={style}>
      {children}
    </span>
  );
};

// #################################################################################################
export const ThemedOptionalAttributeItem: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const itemStyles = css({
    display: "inline-flex",
    alignItems: "center",
    gap: currentTheme.spacing.xs,
  });

  return (
    <span css={itemStyles} className={className} style={style}>
      {children}
    </span>
  );
};

// #################################################################################################
export const ThemedDeleteButtonContainer: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    position: "absolute",
    top: "4px",
    right: "4px",
    zIndex: 2,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  });

  return (
    <span css={containerStyles} className={className} style={style}>
      {children}
    </span>
  );
};

// ##################################################################################################
export const ThemedIndentedContainer: React.FC<ThemedComponentProps & {
  indentLevel?: number;
  marginLeft?: string;
  isVisible?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  id,
  indentLevel = 0,
  marginLeft,
  isVisible = true
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    marginLeft: marginLeft || `calc(${indentLevel * 20}px)`,
    display: isVisible ? "block" : "none",
  });

  return (
    <span css={containerStyles} className={className} style={style} id={id}>
      {children}
    </span>
  );
};

export const ThemedScrollableContent: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const scrollableStyles = css({
    flex: 1,
    overflowY: 'scroll',
    overflowX: 'hidden',
    // padding: currentTheme.spacing.md, // no reason for padding something because it is scrollable
    backgroundColor: currentTheme.colors.background,
    
    // Hide scrollbars but keep scroll functionality
    scrollbarWidth: 'none', // Firefox
    msOverflowStyle: 'none', // IE and Edge
    '&::-webkit-scrollbar': {
      display: 'none', // Chrome, Safari, Opera
    },
  });

  return (
    <div css={scrollableStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// #################################################################################################
// Main Panel
// 
// The main content area of the app, which adjusts its layout based on the state of the sidebar and outline.
// #################################################################################################
export const ThemedMainPanel: React.FC<ThemedComponentProps & {
  sidebarOpen: boolean;
  sidebarWidth: number;
  outlineOpen: boolean;
  outlineWidth: number;
}> = ({ 
  children, 
  className, 
  style,
  sidebarOpen,
  sidebarWidth, // SidebarWidth default
  outlineOpen,
  outlineWidth = 300
}) => {
  const { currentTheme } = useMiroirTheme();
  
  // Base styles for all conditions
  const baseStyles: CSSObject = {
    display: 'flex',
    flexDirection: 'column' as const,
    flexGrow: 1,
    // overflow: 'hidden', // Prevent main panel from scrolling, let content handle it
    minWidth: 0, // Allow shrinking
    height: '100%',
    // padding: currentTheme.spacing.md,
    // width: `calc(100% - ${sidebarOpen ? sidebarWidth : 0}px - ${outlineOpen ? outlineWidth : 0}px)`,
    boxSizing: 'border-box' as const,
    // minHeight: 0, // Allow shrinking
    marginTop: 0, // Fix wide gap below the appbar
    paddingTop: 0,
    paddingLeft: 0,
    // Simple transition for all properties
    transition: 'margin 300ms ease-out, width 300ms ease-out',
    backgroundColor: currentTheme.colors.background,
    // Handle overflow - let content determine scrolling behavior
  };

  // Calculate responsive layout based on sidebar and outline states
  const responsiveStyles = css({
    ...baseStyles,
    // // When sidebar is open
    // ...(open && {
    //   width: `calc(100% - ${width}px - ${outlineOpen ? outlineWidth : 0}px)`,
    //   marginLeft: `${width}px`,
    //   marginRight: outlineOpen ? `${outlineWidth}px` : 0,
    //   // Let the element naturally fill remaining space
    //   // width: 'auto',
    // }),
    // // When sidebar is closed but outline is open
    // ...(!open && outlineOpen && {
    //   // width: `calc(100% - ${outlineWidth}px)`,
    //   marginRight: `${outlineWidth}px`,
    //   // width: 'auto',
    // }),
    // // When both sidebar and outline are closed
    // ...(!open && !outlineOpen && {
    //   width: '100%',
    //   marginLeft: 0,
    //   marginRight: 0,
    //   // width: 'auto',
    // }),
    padding: 0,
  });

  return (
    // <div css={responsiveStyles} className={className} style={style}>
    //   {children}
    // </div>
    <main css={responsiveStyles} className={className} style={style}>
      {children}
    </main>
  );
};

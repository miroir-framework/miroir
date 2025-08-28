/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

// ################################################################################################
// Layout Components
// 
// Components for layout: flex containers, grids, boxes, etc.
// ################################################################################################

export const ThemedFlexRow: React.FC<ThemedComponentProps & {
  justify?: 'start' | 'center' | 'end' | 'space-between';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: string;
  wrap?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  justify = 'start',
  align = 'center',
  gap,
  wrap = false
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const flexStyles = css({
    display: "flex",
    flexDirection: "row",
    justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : justify,
    alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align,
    flexWrap: wrap ? 'wrap' : 'nowrap',
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

export const ThemedGrid: React.FC<ThemedComponentProps & {
  container?: boolean;
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  spacing?: number;
  direction?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  zeroMinWidth?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  container = false,
  item = false,
  xs,
  sm,
  md,
  lg,
  xl,
  spacing = 1,
  direction = 'row',
  justifyContent,
  alignItems,
  wrap = 'wrap',
  zeroMinWidth = false
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const gridStyles = css({
    display: container ? 'flex' : 'block',
    flexDirection: direction,
    flexWrap: container ? wrap : 'nowrap',
    justifyContent: container ? justifyContent : undefined,
    alignItems: container ? alignItems : undefined,
    margin: container ? `-${spacing * 4}px` : undefined,
    width: container ? `calc(100% + ${spacing * 8}px)` : undefined,
    flex: item ? '1 1 0%' : undefined,
    maxWidth: item ? '100%' : undefined,
    padding: item ? `${spacing * 4}px` : undefined,
    minWidth: zeroMinWidth ? 0 : undefined,
    
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
    overflow: 'auto',
    padding: currentTheme.spacing.md,
    backgroundColor: currentTheme.colors.background,
    
    // Custom scrollbar styling
    '&::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '&::-webkit-scrollbar-track': {
      background: currentTheme.colors.surface,
      borderRadius: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: currentTheme.colors.border,
      borderRadius: '4px',
      '&:hover': {
        background: currentTheme.colors.textSecondary,
      },
    },
  });

  return (
    <div css={scrollableStyles} className={className} style={style}>
      {children}
    </div>
  );
};

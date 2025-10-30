/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

// ################################################################################################
// Basic Themed Components
// 
// Basic themed components like containers, buttons, text, etc.
// ################################################################################################

// Simple container component that uses the theme
export const ThemedContainer: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    padding: currentTheme.spacing.md,
    backgroundColor: currentTheme.colors.background,
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
  });

  return (
    <div css={containerStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// Simple button component that uses the theme
export const ThemedButton: React.FC<ThemedComponentProps & {
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}> = ({ 
  children, 
  className, 
  style,
  onClick,
  variant = 'primary'
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    padding: `${currentTheme.spacing.sm} ${currentTheme.spacing.md}`,
    backgroundColor: variant === 'primary' ? currentTheme.colors.primary : currentTheme.colors.secondary,
    // Use surface color (white/light) for text on colored button backgrounds for proper contrast
    color: currentTheme.colors.surface,
    border: 'none',
    borderRadius: currentTheme.borderRadius.md,
    cursor: 'pointer',
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.md,
    fontWeight: currentTheme.typography.fontWeight.normal,
    '&:hover': {
      backgroundColor: variant === 'primary' ? currentTheme.colors.primaryDark : currentTheme.colors.secondaryDark,
    },
  });

  return (
    <button css={buttonStyles} className={className} style={style} onClick={onClick}>
      {children}
    </button>
  );
};

// ################################################################################################
// Additional themed components for common UI patterns
export const ThemedHeaderSection: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const headerStyles = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: currentTheme.spacing.md,
    position: "sticky",
    top: 0,
    backgroundColor: currentTheme.colors.background,
    zIndex: 1000,
    padding: `${currentTheme.spacing.sm} 0`,
    boxShadow: currentTheme.elevation.low,
  });

  return (
    <div css={headerStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// ################################################################################################
export const ThemedTitle: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const titleStyles = css({
    margin: 0,
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.xl,
    fontWeight: currentTheme.typography.fontWeight.bold,
  });

  return (
    <h1 css={titleStyles} className={className} style={style}>
      {children}
    </h1>
  );
};

// ################################################################################################
export const ThemedStatusText: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const statusStyles = css({
    color: currentTheme.colors.textSecondary,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.sm,
    marginBottom: currentTheme.spacing.sm,
  });

  return (
    <span css={statusStyles} className={className} style={style}>
      {children}
    </span>
  );
};

// ################################################################################################
export const ThemedCodeBlock: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const preRef = React.useRef<HTMLPreElement>(null);
  const [dynamicHeight, setDynamicHeight] = React.useState<number | undefined>(undefined);

  React.useEffect(() => { // TODO:uselessy complicated, isn't it?
    if (children) {
      // If children is a React element (like ReactCodeMirror), don't try to calculate height
      // as it will manage its own dimensions
      if (React.isValidElement(children)) {
        setDynamicHeight(undefined);
        return;
      }
      
      // Count the number of lines in the content for text content
      const textContent = typeof children === 'string' ? children : String(children);
      const lineCount = textContent.split('\n').length;
      
      // Calculate height based on line height and font size
      // Approximate line height calculation: fontSize * 1.4 (typical line-height ratio)
      const fontSize = parseFloat(currentTheme.typography.fontSize.sm.replace('px', '')) || 14;
      const lineHeight = fontSize * 1.4;
      const padding = parseFloat(currentTheme.spacing.md.replace('px', '')) || 16;
      
      // Calculate content height with padding
      const calculatedHeight = (lineCount * lineHeight) + (padding * 2);
      
      // Set height proportional to content, but clamped to max 400px
      const finalHeight = Math.min(calculatedHeight, 400);
      setDynamicHeight(finalHeight);
    }
  }, [children, currentTheme.typography.fontSize.sm, currentTheme.spacing.md]);

  // For text content, use the original pre-based approach
  const codeStyles = css({
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.md,
    padding: currentTheme.spacing.md,
    fontFamily: 'monospace',
    fontSize: currentTheme.typography.fontSize.sm,
    whiteSpace: 'pre-wrap',
    overflow: dynamicHeight === 400 ? 'auto' : 'hidden',
    height: dynamicHeight ? `${dynamicHeight}px` : 'auto',
    maxHeight: '400px',
    lineHeight: 1.4,
  });

  return (
    <pre ref={preRef} css={codeStyles} className={className} style={style}>
      {children}
    </pre>
  );
};

// ################################################################################################
export const ThemedPreformattedText: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const preformattedStyles = css({
    whiteSpace: 'pre-line',
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    lineHeight: currentTheme.typography.lineHeight.normal,
  });

  return (
    <div css={preformattedStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// ################################################################################################
export const ThemedLabel: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  id 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const labelStyles = css({
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.md,
    fontWeight: 'bold',
  });

  return (
    <span css={labelStyles} className={className} style={style} id={id}>
      {children}
    </span>
  );
};

// ################################################################################################
export const ThemedText: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  id 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const textStyles = css({
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.md,
    lineHeight: currentTheme.typography.lineHeight.normal,
    margin: currentTheme.spacing.sm + ' 0',
  });

  return (
    <p css={textStyles} className={className} style={style} id={id}>
      {children}
    </p>
  );
};

// ################################################################################################
export const ThemedSpan: React.FC<ThemedComponentProps & {
  fontWeight?: 'normal' | 'bold';
  color?: string;
  fontSize?: string;
}> = ({ 
  children, 
  className, 
  style,
  fontWeight = 'normal',
  color,
  fontSize,
  ...otherProps
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const spanStyles = css({
    color: color || currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: fontSize || currentTheme.typography.fontSize.md,
    fontWeight: fontWeight,
  });

  return (
    <span css={spanStyles} className={className} style={style} {...otherProps}>
      {children}
    </span>
  );
};

// ################################################################################################
// On-screen debug/helper component for displaying structured data
export const ThemedOnScreenHelper: React.FC<ThemedComponentProps & {
  label?: string;
  data: any;
}> = ({ 
  label,
  data,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const helperStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.sm,
    padding: currentTheme.spacing.sm,
    margin: `${currentTheme.spacing.sm} 0`,
    fontFamily: 'monospace',
    lineHeight: currentTheme.typography.lineHeight.normal,
  });

  const labelStyles = css({
    fontWeight: currentTheme.typography.fontWeight.bold,
    color: currentTheme.colors.textSecondary,
  });

  return (
    <pre css={helperStyles} className={className} style={style}>
      {label && <span css={labelStyles}>{label}: </span>}
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

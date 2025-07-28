/** @jsxImportSource @emotion/react */
import React from 'react';
import { css } from '@emotion/react';
import { FormControl, FormControlProps, InputLabel, InputLabelProps, MenuItem, MenuItemProps, Select, SelectProps } from '@mui/material';
import { useMiroirTheme } from '../contexts/MiroirThemeContext';

// ################################################################################################
// Simple Themed Components
// 
// Basic themed components to demonstrate the MiroirTheme system.
// These serve as examples and starting points for more complex theming.
// ################################################################################################

interface ThemedComponentProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  onClick?: (event: any) => void;
  value?: any;
  onChange?: (event: any) => void;
  name?: string;
  labelId?: string;
  label?: string;
  variant?: string;
  role?: string;
  'data-testid'?: string;
  'aria-label'?: string;
  title?: string;
}

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

// Demo component to show theme usage
export const ThemeDemo: React.FC = () => {
  const { currentTheme, selectTheme, availableThemes } = useMiroirTheme();

  return (
    <ThemedContainer>
      <h3>Current Theme: {currentTheme.name}</h3>
      <p>This demonstrates the themed components in action.</p>
      
      <div css={css({ display: 'flex', gap: currentTheme.spacing.sm, marginTop: currentTheme.spacing.md })}>
        {availableThemes.map((theme) => (
          <ThemedButton 
            key={theme.id}
            onClick={() => selectTheme(theme.id)}
            variant={theme.id === currentTheme.id ? 'primary' : 'secondary'}
          >
            {theme.name}
          </ThemedButton>
        ))}
      </div>
    </ThemedContainer>
  );
};

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

export const ThemedCodeBlock: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const codeStyles = css({
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.md,
    padding: currentTheme.spacing.md,
    fontFamily: 'monospace',
    fontSize: currentTheme.typography.fontSize.sm,
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    maxHeight: '400px',
  });

  return (
    <pre css={codeStyles} className={className} style={style}>
      {children}
    </pre>
  );
};

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

// Themed versions of components from Style.tsx
export const ThemedLabeledEditor: React.FC<{
  labelElement: JSX.Element;
  editor: JSX.Element;
  className?: string;
  style?: React.CSSProperties;
}> = ({ labelElement, editor, className, style }) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    display: 'flex',
    flexFlow: 'row',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    flexGrow: 1,
    gap: currentTheme.spacing.sm,
  });

  return (
    <span css={containerStyles} className={className} style={style}>
      {labelElement}
      {editor}
    </span>
  );
};

export const ThemedLineIconButton: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  onClick,
  title 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    padding: 0,
    maxHeight: '1em',
    backgroundColor: 'transparent',
    border: 0,
    color: currentTheme.colors.text,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    '&:hover': {
      backgroundColor: currentTheme.colors.hover,
      borderRadius: currentTheme.borderRadius.sm,
    },
  });

  return (
    <button css={buttonStyles} className={className} style={style} onClick={onClick} title={title}>
      {children}
    </button>
  );
};

export const ThemedSmallIconButton: React.FC<ThemedComponentProps & {
  visible?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  onClick,
  title,
  id,
  'aria-label': ariaLabel,
  visible = true
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    padding: currentTheme.spacing.xs,
    backgroundColor: currentTheme.colors.surface,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.sm,
    color: currentTheme.colors.text,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: currentTheme.typography.fontSize.sm,
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    visibility: visible ? 'visible' : 'hidden',
    '&:hover': {
      backgroundColor: currentTheme.colors.hover,
      borderColor: currentTheme.colors.primary,
    },
    '&:active': {
      backgroundColor: currentTheme.colors.primary,
      color: currentTheme.colors.surface,
    },
  });

  return (
    <button 
      css={buttonStyles} 
      className={className} 
      style={style} 
      onClick={onClick} 
      title={title}
      id={id}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export const ThemedSelect: React.FC<ThemedComponentProps & {
  minWidth?: string;
  maxWidth?: string;
  width?: string;
}> = ({ 
  children, 
  className, 
  style,
  value,
  onChange,
  minWidth,
  maxWidth,
  width,
  ...props 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const selectStyles = css`
    /* Basic sizing and layout - increased min-height for better text visibility */
    min-height: 2.2em;
    max-height: 2.5em;
    height: auto;
    min-width: ${minWidth || 'auto'};
    max-width: ${maxWidth || 'auto'};
    width: ${width || 'auto'};
    
    /* Force background and text colors */
    background-color: ${currentTheme.colors.surface} !important;
    background: ${currentTheme.colors.surface} !important;
    color: ${currentTheme.colors.text} !important;
    
    /* Border and spacing */
    border: 1px solid ${currentTheme.colors.border} !important;
    border-radius: ${currentTheme.borderRadius.sm};
    padding: ${currentTheme.spacing.sm};
    
    /* Typography */
    font-family: ${currentTheme.typography.fontFamily};
    font-size: ${currentTheme.typography.fontSize.md};
    font-weight: normal;
    line-height: 1.4;
    
    /* Ensure the select element behaves properly */
    appearance: auto;
    -webkit-appearance: menulist;
    -moz-appearance: menulist;
    
    /* Force text visibility and contrast */
    text-shadow: none !important;
    text-decoration: none !important;
    opacity: 1 !important;
    visibility: visible !important;
    
    /* Ensure the selected value text is visible */
    text-indent: 0 !important;
    text-transform: none !important;
    letter-spacing: normal !important;
    word-spacing: normal !important;
    line-height: normal !important;
    
    /* Override any inherited styles that might interfere */
    box-shadow: none;
    text-overflow: clip;
    white-space: nowrap;
    
    /* Focus and interaction states */
    &:focus {
      border-color: ${currentTheme.colors.primary} !important;
      outline: none !important;
      box-shadow: 0 0 0 2px ${currentTheme.colors.primary}20 !important;
      background-color: ${currentTheme.colors.surface} !important;
      background: ${currentTheme.colors.surface} !important;
      color: ${currentTheme.colors.text} !important;
    }
    
    &:hover {
      background-color: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant} !important;
      background: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant} !important;
      color: ${currentTheme.colors.text} !important;
    }
    
    /* Explicit styling for the selected option display */
    &:not([multiple]) {
      background-color: ${currentTheme.colors.surface} !important;
      color: ${currentTheme.colors.text} !important;
    }
    
    /* Style the dropdown options */
    & option {
      background-color: ${currentTheme.colors.surface} !important;
      background: ${currentTheme.colors.surface} !important;
      color: ${currentTheme.colors.text} !important;
      padding: ${currentTheme.spacing.sm};
      border: none !important;
      outline: none !important;
    }
    
    & option:checked {
      background-color: ${currentTheme.colors.selected || currentTheme.colors.primary} !important;
      background: ${currentTheme.colors.selected || currentTheme.colors.primary} !important;
      color: ${currentTheme.colors.background} !important;
    }
    
    & option:hover {
      background-color: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant} !important;
      background: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant} !important;
      color: ${currentTheme.colors.text} !important;
    }
    
    /* Webkit specific fixes for better cross-browser support */
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: ${currentTheme.colors.surface};
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${currentTheme.colors.border};
      border-radius: 4px;
    }
  `;

  return (
    <select css={selectStyles} className={className} style={style} value={value} onChange={onChange} {...props}>
      {children}
    </select>
  );
};

// Additional themed components for Jzod editors
export const ThemedSizedButton: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  onClick 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    height: '1em',
    width: 'auto',
    minWidth: '1em',
    padding: 0,
    backgroundColor: currentTheme.colors.primary,
    color: currentTheme.colors.background,
    border: `1px solid ${currentTheme.colors.primary}`,
    borderRadius: currentTheme.borderRadius.sm,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: currentTheme.typography.fontSize.sm,
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    '&:hover': {
      backgroundColor: currentTheme.colors.primaryDark,
      borderColor: currentTheme.colors.primaryDark,
    },
  });

  return (
    <button css={buttonStyles} className={className} style={style} onClick={onClick}>
      {children}
    </button>
  );
};

export const ThemedAddIcon: React.FC<ThemedComponentProps> = ({ 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const iconStyles = css({
    height: '0.8em',
    width: '0.8em',
    color: currentTheme.colors.text,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9em',
    lineHeight: '1',
    verticalAlign: 'baseline',
  });

  return (
    <span css={iconStyles} className={className} style={style}>
      +
    </span>
  );
};

// Themed components for JzodObjectEditor card-like elements
export const ThemedEditableInput: React.FC<ThemedComponentProps & {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  'aria-label'?: string;
  minWidth?: number;
  dynamicWidth?: boolean;
}> = ({ 
  value = '',
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  name,
  'aria-label': ariaLabel,
  minWidth = 60,
  dynamicWidth = true,
  className,
  style
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const inputStyles = css({
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.sm,
    padding: `${currentTheme.spacing.xs} ${currentTheme.spacing.sm}`,
    fontSize: 'inherit',
    fontFamily: 'inherit',
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    minWidth: `${minWidth}px`,
    width: dynamicWidth ? `${Math.max(minWidth, value.length * 8 + 16)}px` : 'auto',
    '&:focus': {
      outline: 'none',
      borderColor: currentTheme.colors.primary,
      boxShadow: `0 0 0 2px ${currentTheme.colors.primary}20`,
    },
  });

  return (
    <input
      css={inputStyles}
      className={className}
      style={style}
      name={name}
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
};

export const ThemedLoadingCard: React.FC<ThemedComponentProps & {
  message?: string;
}> = ({ 
  message = 'Loading...',
  className,
  style
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const cardStyles = css({
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    color: currentTheme.colors.textSecondary,
    paddingLeft: currentTheme.spacing.lg,
    backgroundColor: currentTheme.colors.surface,
  });

  const textStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
  });

  return (
    <div css={cardStyles} className={className} style={style}>
      <span css={textStyles}>{message}</span>
    </div>
  );
};

export const ThemedFoldedValueDisplay: React.FC<ThemedComponentProps & {
  value: string;
  title?: string;
  maxLength?: number;
}> = ({ 
  value,
  title,
  maxLength = 30,
  className,
  style
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const displayStyles = css({
    marginLeft: currentTheme.spacing.sm,
    padding: `${currentTheme.spacing.xs} ${currentTheme.spacing.sm}`,
    backgroundColor: currentTheme.colors.surfaceVariant || currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.sm,
    fontSize: currentTheme.typography.fontSize.sm,
    color: currentTheme.colors.textSecondary,
    fontStyle: 'italic',
    border: `1px solid ${currentTheme.colors.border}`,
  });

  const displayValue = typeof value === "string" && value.length > maxLength
    ? `${value.substring(0, maxLength)}...`
    : value;

  return (
    <span 
      css={displayStyles} 
      className={className} 
      style={style}
      title={title || `Folded value: ${value}`}
    >
      {displayValue}
    </span>
  );
};

// ################################################################################################
// Sidebar Themed Components
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
    // Prevent any overflow issues
    // overflow: 'hidden',
    // overflow: 'auto',
    overflow: 'scroll',
    // Ensure drawer doesn't affect main layout
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

export const ThemedIconButton: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style, 
  onClick,
  'aria-label': ariaLabel
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: currentTheme.spacing.xs,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: currentTheme.borderRadius.sm,
    color: currentTheme.colors.text,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: currentTheme.colors.hover || currentTheme.colors.primaryLight,
    },
    '&:active': {
      backgroundColor: currentTheme.colors.active || currentTheme.colors.primary,
    },
  });

  return (
    <button 
      css={buttonStyles} 
      className={className} 
      style={style}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

// ################################################################################################
// JzodObjectEditor Themed Components
// ################################################################################################

export const ThemedAttributeLabel: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  id,
  'data-testid': dataTestId
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const labelStyles = css({
    minWidth: "120px",
    flexShrink: 0,
    textAlign: "left",
    justifyContent: "flex-start",
    display: "flex",
    paddingRight: "1ex",
    color: currentTheme.colors.text,
    fontSize: currentTheme.typography.fontSize.sm,
  });

  return (
    <span 
      css={labelStyles} 
      className={className} 
      style={style}
      id={id}
      data-testid={dataTestId}
    >
      {children}
    </span>
  );
};

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

export const ThemedAttributeName: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const nameStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
    whiteSpace: "nowrap",
    color: currentTheme.colors.textSecondary || currentTheme.colors.text,
  });

  return (
    <span css={nameStyles} className={className} style={style}>
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

// ##############################################################################################
// Additional JzodElementEditor Components
// ##############################################################################################

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

export const ThemedTooltip: React.FC<ThemedComponentProps & {
  title: string;
}> = ({ children, title, className, style }) => {
  const { currentTheme } = useMiroirTheme();
  
  const tooltipStyles = css({
    position: 'relative',
    display: 'inline-block',
    '&:hover::after': {
      content: `"${title}"`,
      position: 'absolute',
      bottom: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: currentTheme.colors.background,
      color: currentTheme.colors.text,
      padding: currentTheme.spacing.xs,
      borderRadius: currentTheme.borderRadius.sm,
      border: `1px solid ${currentTheme.colors.border}`,
      fontSize: currentTheme.typography.fontSize.xs,
      whiteSpace: 'nowrap',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }
  });

  return (
    <span css={tooltipStyles} className={className} style={style} title={title}>
      {children}
    </span>
  );
};

export const ThemedStyledButton: React.FC<ThemedComponentProps & {
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
  variant?: 'transparent' | 'outlined' | 'filled';
  position?: 'static' | 'relative' | 'absolute' | 'fixed';
  top?: string | number;
  right?: string | number;
  left?: string | number;
  bottom?: string | number;
  zIndex?: number;
  cursor?: string;
  fontWeight?: string;
  color?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  background?: string;
  backgroundColor?: string;
}> = ({ 
  children, 
  className, 
  style,
  type = 'button',
  onClick,
  disabled = false,
  ariaLabel,
  title,
  variant = 'filled',
  position,
  top,
  right,
  left,
  bottom,
  zIndex,
  cursor,
  fontWeight,
  color,
  border,
  borderRadius,
  padding,
  background,
  backgroundColor,
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'transparent':
        return {
          border: '0',
          backgroundColor: 'transparent',
        };
      case 'outlined':
        return {
          background: currentTheme.colors.background,
          border: `1px solid ${currentTheme.colors.border}`,
          color: currentTheme.colors.text,
        };
      default:
        return {
          background: currentTheme.colors.background,
          border: `1px solid ${currentTheme.colors.border}`,
          color: currentTheme.colors.text,
        };
    }
  };
  
  const buttonStyles = css({
    ...getVariantStyles(),
    position,
    top,
    right,
    left,
    bottom,
    zIndex,
    cursor: disabled ? 'not-allowed' : cursor || 'pointer',
    fontWeight,
    color: color || currentTheme.colors.text,
    border: border || `1px solid ${currentTheme.colors.border}`,
    borderRadius: borderRadius || currentTheme.borderRadius.sm,
    padding: padding || currentTheme.spacing.xs,
    background,
    backgroundColor,
    opacity: disabled ? 0.5 : 1,
    '&:hover': !disabled ? {
      backgroundColor: currentTheme.colors.hover || currentTheme.colors.primaryLight,
    } : {},
  });

  return (
    <button 
      css={buttonStyles} 
      className={className} 
      style={style}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
};

export const ThemedSpan: React.FC<ThemedComponentProps & {
  border?: string;
  borderRadius?: string;
  padding?: string;
  minWidth?: string;
  position?: 'static' | 'relative' | 'absolute' | 'fixed';
  display?: string;
  marginBottom?: string;
}> = ({ 
  children, 
  className, 
  style,
  border,
  borderRadius,
  padding,
  minWidth,
  position,
  display,
  marginBottom,
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const spanStyles = css({
    border,
    borderRadius,
    padding,
    minWidth,
    position,
    display,
    marginBottom,
  });

  return (
    <span css={spanStyles} className={className} style={style} {...props}>
      {children}
    </span>
  );
};

export const ThemedMenuItemOption: React.FC<ThemedComponentProps & {
  value: string;
  onClick?: () => void;
}> = ({ 
  children, 
  className, 
  style,
  value,
  onClick,
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const optionStyles = css`
    /* Basic styling to match parent select */
    background-color: ${currentTheme.colors.surface} !important;
    background: ${currentTheme.colors.surface} !important;
    color: ${currentTheme.colors.text} !important;
    font-size: ${currentTheme.typography.fontSize.sm};
    font-family: ${currentTheme.typography.fontFamily};
    padding: ${currentTheme.spacing.sm};
    
    /* Ensure options are visible and properly styled */
    border: none !important;
    outline: none !important;
    margin: 0;
    
    /* Force text visibility */
    text-shadow: none !important;
    text-decoration: none !important;
    opacity: 1 !important;
    visibility: visible !important;
    
    /* Typography consistency */
    font-weight: normal;
    text-transform: none;
    letter-spacing: normal;
    word-spacing: normal;
    line-height: normal;
    
    /* States */
    &:checked, &[selected] {
      background-color: ${currentTheme.colors.selected || currentTheme.colors.primary} !important;
      background: ${currentTheme.colors.selected || currentTheme.colors.primary} !important;
      color: ${currentTheme.colors.background} !important;
      font-weight: bold;
    }
    
    &:hover {
      background-color: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant} !important;
      background: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant} !important;
      color: ${currentTheme.colors.text} !important;
    }
    
    &:focus {
      background-color: ${currentTheme.colors.focused || currentTheme.colors.primaryLight} !important;
      background: ${currentTheme.colors.focused || currentTheme.colors.primaryLight} !important;
      color: ${currentTheme.colors.text} !important;
      outline: none !important;
    }
  `;

  return (
    <option 
      css={optionStyles} 
      className={className} 
      style={style}
      value={value}
      {...props}
    >
      {children}
    </option>
  );
};

// ##############################################################################################
// Missing Themed Components for JzodElementEditor
// ##############################################################################################

export const ThemedCard: React.FC<ThemedComponentProps & {
  elevation?: number;
}> = ({ 
  children, 
  className, 
  style,
  elevation = 1
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const cardStyles = css({
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.md,
    boxShadow: elevation > 0 ? `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)` : 'none',
    overflow: 'hidden',
  });

  return (
    <div css={cardStyles} className={className} style={style}>
      {children}
    </div>
  );
};

export const ThemedCardContent: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const contentStyles = css({
    padding: currentTheme.spacing.md,
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
  });

  return (
    <div css={contentStyles} className={className} style={style}>
      {children}
    </div>
  );
};

export const ThemedSwitch: React.FC<ThemedComponentProps & {
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}> = ({ 
  checked = false,
  onChange,
  disabled = false,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const switchStyles = css({
    position: 'relative',
    display: 'inline-block',
    width: '44px',
    height: '24px',
  });

  const inputStyles = css({
    opacity: 0,
    width: 0,
    height: 0,
  });

  const sliderStyles = css({
    position: 'absolute',
    cursor: disabled ? 'not-allowed' : 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: checked ? currentTheme.colors.primary : currentTheme.colors.border,
    transition: '0.4s',
    borderRadius: '24px',
    opacity: disabled ? 0.5 : 1,
    '&:before': {
      position: 'absolute',
      content: '""',
      height: '18px',
      width: '18px',
      left: checked ? '23px' : '3px',
      bottom: '3px',
      backgroundColor: currentTheme.colors.background,
      transition: '0.4s',
      borderRadius: '50%',
    },
  });

  return (
    <label css={switchStyles} className={className} style={style}>
      <input 
        css={inputStyles}
        type="checkbox" 
        checked={checked} 
        onChange={onChange} 
        disabled={disabled}
      />
      <span css={sliderStyles}></span>
    </label>
  );
};

export const ThemedTextField: React.FC<ThemedComponentProps & {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
  fullWidth?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
}> = ({ 
  value = '',
  onChange,
  placeholder,
  disabled = false,
  type = 'text',
  multiline = false,
  rows = 1,
  fullWidth = false,
  width,
  minWidth,
  maxWidth,
  className, 
  style,
  name,
  id,
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const fieldStyles = css({
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.sm,
    padding: currentTheme.spacing.sm,
    fontSize: currentTheme.typography.fontSize.md,
    fontFamily: currentTheme.typography.fontFamily,
    width: fullWidth ? '100%' : width,
    minWidth,
    maxWidth,
    minHeight: multiline ? `${rows * 1.5}em` : 'auto',
    resize: multiline ? 'vertical' : 'none',
    boxSizing: 'border-box',
    '&:focus': {
      outline: 'none',
      borderColor: currentTheme.colors.primary,
      boxShadow: `0 0 0 2px ${currentTheme.colors.primary}20`,
    },
    '&:disabled': {
      backgroundColor: currentTheme.colors.surface,
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    '&::placeholder': {
      color: currentTheme.colors.textSecondary || currentTheme.colors.text,
      opacity: 0.6,
    },
  });

  const Component = multiline ? 'textarea' : 'input';

  return (
    <Component
      css={fieldStyles}
      className={className}
      style={style}
      name={name}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      type={!multiline ? type : undefined}
      rows={multiline ? rows : undefined}
      {...props}
    />
  );
};

export const ThemedFlexContainer: React.FC<ThemedComponentProps & {
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
  wrap?: boolean;
  gap?: string;
  width?: string;
}> = ({ 
  children, 
  className, 
  style,
  direction = 'row',
  align = 'center',
  justify = 'start',
  wrap = false,
  gap,
  width
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    display: 'flex',
    flexDirection: direction,
    alignItems: align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : align,
    justifyContent: justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : justify,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    gap: gap || currentTheme.spacing.sm,
    width,
  });

  return (
    <div css={containerStyles} className={className} style={style}>
      {children}
    </div>
  );
};

export const ThemedInlineContainer: React.FC<ThemedComponentProps & {
  marginLeft?: string;
  marginRight?: string;
  position?: 'relative' | 'absolute' | 'fixed' | 'static';
  backgroundColor?: string;
  border?: string;
  borderRadius?: string;
  padding?: string;
  width?: string;
  height?: string;
}> = ({ 
  children, 
  className, 
  style,
  marginLeft,
  marginRight,
  position,
  backgroundColor,
  border,
  borderRadius,
  padding,
  width,
  height
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    marginLeft,
    marginRight,
    position,
    backgroundColor: backgroundColor || currentTheme.colors.surface,
    border,
    borderRadius,
    padding,
    width,
    height,
  });

  return (
    <div css={containerStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// Themed Grid Component - Material-UI Grid wrapper with theme support
export const ThemedGrid: React.FC<ThemedComponentProps & {
  container?: boolean;
  item?: boolean;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  spacing?: number;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
}> = ({ 
  children, 
  className, 
  style,
  container = false,
  item = false,
  direction = 'row',
  spacing = 0,
  xs,
  sm,
  md,
  lg,
  xl,
  justifyContent,
  alignItems,
  wrap = 'wrap',
  ...props
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const gridStyles = css({
    display: container ? 'flex' : 'block',
    flexDirection: direction,
    flexWrap: container ? wrap : undefined,
    justifyContent: container ? justifyContent : undefined,
    alignItems: container ? alignItems : undefined,
    margin: container && spacing > 0 ? `-${spacing * 4}px` : undefined,
    width: container && spacing > 0 ? `calc(100% + ${spacing * 8}px)` : undefined,
    
    // Item styles
    flexGrow: item ? 1 : undefined,
    flexBasis: item ? 'auto' : undefined,
    padding: item && spacing > 0 ? `${spacing * 4}px` : undefined,
    
    // Responsive breakpoints
    ...(xs && {
      flexBasis: typeof xs === 'number' ? `${(xs / 12) * 100}%` : 'auto',
      maxWidth: typeof xs === 'number' ? `${(xs / 12) * 100}%` : 'none',
    }),
    
    // Background and theming
    backgroundColor: container ? currentTheme.colors.background : 'transparent',
    color: currentTheme.colors.text,
  });

  return (
    <div css={gridStyles} className={className} style={style} {...props}>
      {children}
    </div>
  );
};

// ################################################################################################
// Sidebar List Themed Components
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
    justifyContent: 'flex-start', // Explicitly set left alignment
    width: '100%',
    padding: sx?.padding !== undefined ? sx.padding : `${currentTheme.spacing.sm} ${currentTheme.spacing.md}`,
    backgroundColor: 'transparent',
    border: 'none',
    color: currentTheme.colors.text,
    textDecoration: 'none',
    cursor: 'pointer',
    borderRadius: currentTheme.borderRadius.sm,
    transition: 'background-color 0.2s',
    textAlign: 'left', // Ensure text alignment is left
    '&:hover': {
      backgroundColor: currentTheme.colors.hover || currentTheme.colors.primaryLight,
    },
    '&:active': {
      backgroundColor: currentTheme.colors.active || currentTheme.colors.primary,
    },
    // Handle any additional sx styles (excluding padding since we handled it above)
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

export const ThemedListItemIcon: React.FC<ThemedComponentProps> = ({ 
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
    width: '40px', // Fixed width to ensure consistent spacing
    marginRight: currentTheme.spacing.sm,
    color: currentTheme.colors.text,
    fontSize: currentTheme.typography.fontSize.lg,
    flexShrink: 0, // Prevent icon from shrinking
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
    textAlign: 'left', // Explicitly left-align text
    justifyContent: 'flex-start', // Ensure content starts from left
    alignItems: 'flex-start', // Align items to start
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

export const ThemedIcon: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style
}) => {
  const { currentTheme } = useMiroirTheme();
  
  // Map common icon name variations to valid Material Icons names
  const iconNameMap: Record<string, string> = {
    'savedSearch': 'saved_search',
    'SavedSearch': 'saved_search',
    'autoStories': 'auto_stories',
    'AutoStories': 'auto_stories',
    // Add more mappings as needed
  };
  
  // Get the mapped icon name or use the original if no mapping exists
  const iconName = typeof children === 'string' ? (iconNameMap[children] || children) : children;
  
  const iconStyles = css({
    fontFamily: 'Material Icons',
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontSize: currentTheme.typography.fontSize.lg,
    lineHeight: 1,
    letterSpacing: 'normal',
    textTransform: 'none',
    display: 'inline-block',
    whiteSpace: 'nowrap',
    wordWrap: 'normal',
    direction: 'ltr',
    color: currentTheme.colors.text,
    // Support for ligatures
    fontFeatureSettings: '"liga"',
    WebkitFontFeatureSettings: '"liga"',
    WebkitFontSmoothing: 'antialiased',
    // Make sure icon is visible
    minWidth: '24px',
    textAlign: 'center',
  });

  return (
    <span css={iconStyles} className={`material-icons ${className || ''}`} style={style}>
      {iconName}
    </span>
  );
};

// ################################################################################################
// Scrollable Content Wrapper
// ################################################################################################

export const ThemedScrollableContent: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const scrollableStyles = css({
    flex: '1 1 auto',
    // Completely prevent all scrollbars
    // overflow: 'hidden',
    overflowX: 'hidden',
    overflowY: 'auto',
    // Remove flex display that was causing layout issues
    display: 'block',
    // Ensure content doesn't exceed container width
    height: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    // Custom scrollbar styling
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: currentTheme.colors.surface,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: currentTheme.colors.border,
      borderRadius: '4px',
      '&:hover': {
        backgroundColor: currentTheme.colors.hover || currentTheme.colors.primaryLight,
      },
    },
  });

  return (
    <div css={scrollableStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// ################################################################################################
// Themed Material-UI Components
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

// Enhanced ThemedSelect that wraps Material-UI Select with proper theming
export const ThemedMUISelect: React.FC<SelectProps & ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
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
    <Select css={selectStyles} className={className} style={style} {...props}>
      {children}
    </Select>
  );
};


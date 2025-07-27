/** @jsxImportSource @emotion/react */
import React from 'react';
import { css } from '@emotion/react';
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
    color: currentTheme.colors.text,
    border: 'none',
    borderRadius: currentTheme.borderRadius.md,
    cursor: 'pointer',
    fontFamily: currentTheme.typography.fontFamily,
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
    overflow: 'auto',
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

export const ThemedSmallIconButton: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  onClick,
  title 
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
    <button css={buttonStyles} className={className} style={style} onClick={onClick} title={title}>
      {children}
    </button>
  );
};

export const ThemedSelect: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  value,
  onChange 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const selectStyles = css({
    maxHeight: '1.5em',
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.sm,
    padding: currentTheme.spacing.sm,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.md,
    '&:focus': {
      borderColor: currentTheme.colors.primary,
      outline: 'none',
      boxShadow: `0 0 0 2px ${currentTheme.colors.primary}20`,
    },
  });

  return (
    <select css={selectStyles} className={className} style={style} value={value} onChange={onChange}>
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
    height: '1em',
    width: '1em',
    color: currentTheme.colors.text,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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

export default ThemedContainer;


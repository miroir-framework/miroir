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
  style 
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
    <p css={textStyles} className={className} style={style}>
      {children}
    </p>
  );
};

export default ThemedContainer;


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

export default ThemedContainer;


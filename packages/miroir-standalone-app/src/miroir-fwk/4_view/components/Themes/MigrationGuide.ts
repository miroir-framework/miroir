// ################################################################################################
// MiroirTheme Migration Guide and Examples
// 
// This file provides examples and patterns for migrating from @emotion/styled components
// to the unified MiroirTheme system. Use this as a reference when updating existing code.
// ################################################################################################

// BEFORE: Using @emotion/styled
/*
import styled from '@emotion/styled';
import Button from '@mui/material/Button';

const MyButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  padding: '8px 16px',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const MyComponent = () => (
  <MyButton>Click me</MyButton>
);
*/

// AFTER: Using MiroirTheme
/*
import React from 'react';
import { ThemedButton, useMiroirTheme, useThemedStyles } from '../path/to/theme';

const MyComponent = () => {
  const { currentTheme } = useMiroirTheme();
  const styles = useThemedStyles();
  
  return (
    <ThemedButton variant="primary">
      Click me
    </ThemedButton>
  );
};
*/

// ################################################################################################
// Common Migration Patterns
// ################################################################################################

// 1. BUTTON MIGRATIONS
// ====================

// Before: Custom styled button
/*
const StyledButton = styled(Button)(({ theme }) => ({
  height: '40px',
  backgroundColor: '#1976d2',
  color: 'white',
  borderRadius: '4px',
  '&:hover': {
    backgroundColor: '#1565c0',
  },
}));
*/

// After: Using ThemedButton
/*
<ThemedButton variant="primary" size="md">
  Button Text
</ThemedButton>
*/

// 2. ICON MIGRATIONS
// ===================

// Before: Styled icon
/*
const StyledIcon = styled(Icon)(({ theme }) => ({
  fontSize: '24px',
  color: theme.palette.primary.main,
}));
*/

// After: Using theme styles
/*
import { useMiroirTheme } from '../contexts/MiroirThemeContext';

const MyIcon = () => {
  const { currentTheme } = useMiroirTheme();
  
  return (
    <Icon 
      style={{
        fontSize: currentTheme.components.icon.size.md,
        color: currentTheme.components.icon.colorPrimary,
      }}
    />
  );
};
*/

// 3. CONTAINER MIGRATIONS
// ========================

// Before: Styled container
/*
const StyledContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
}));
*/

// After: Using ThemedContainer
/*
<ThemedContainer 
  variant="card" 
  padding="md" 
  elevation="low"
>
  Content here
</ThemedContainer>
*/

// 4. INPUT MIGRATIONS
// ====================

// Before: Styled input
/*
const StyledInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.default,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.background.paper,
    },
  },
}));
*/

// After: Using ThemedInput
/*
<ThemedInput 
  placeholder="Enter text"
  onChange={handleChange}
/>
*/

// 5. COMPLEX STYLE MIGRATIONS
// =============================

// Before: Complex styled component
/*
const ComplexComponent = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.background.paper,
  borderLeft: `4px solid ${theme.palette.primary.main}`,
  '& .title': {
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  '& .subtitle': {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
}));
*/

// After: Using css prop with theme
/*
import { css } from '@emotion/react';
import { useMiroirTheme } from '../contexts/MiroirThemeContext';

const ComplexComponent = ({ title, subtitle }) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyle = css`
    display: flex;
    align-items: center;
    padding: ${currentTheme.spacing.sm} ${currentTheme.spacing.md};
    background-color: ${currentTheme.colors.backgroundPaper};
    border-left: 4px solid ${currentTheme.colors.primary};
  `;
  
  const titleStyle = css`
    font-weight: ${currentTheme.typography.fontWeight.bold};
    color: ${currentTheme.colors.text};
  `;
  
  const subtitleStyle = css`
    color: ${currentTheme.colors.textSecondary};
    font-size: ${currentTheme.typography.fontSize.sm};
  `;
  
  return (
    <div css={containerStyle}>
      <div css={titleStyle}>{title}</div>
      <div css={subtitleStyle}>{subtitle}</div>
    </div>
  );
};
*/

// ################################################################################################
// Theme-Aware Component Patterns
// ################################################################################################

// 1. Conditional styling based on theme variant
/*
const ThemeAwareComponent = () => {
  const { currentTheme } = useMiroirTheme();
  const isDarkTheme = currentTheme.id === 'dark';
  
  const dynamicStyle = css`
    background: ${isDarkTheme ? currentTheme.colors.surface : currentTheme.colors.background};
    border: 1px solid ${currentTheme.colors.border};
    color: ${currentTheme.colors.text};
    transition: all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeOut};
    
    &:hover {
      background: ${currentTheme.colors.hover};
    }
  `;
  
  return <div css={dynamicStyle}>Content</div>;
};
*/

// 2. Using theme utilities for consistent spacing
/*
const SpacedLayout = ({ children }) => {
  const { currentTheme } = useMiroirTheme();
  
  const layoutStyle = css`
    display: grid;
    gap: ${currentTheme.spacing.md};
    padding: ${currentTheme.spacing.lg};
    
    @media (min-width: ${currentTheme.breakpoints.md}) {
      grid-template-columns: 1fr 1fr;
      gap: ${currentTheme.spacing.lg};
    }
  `;
  
  return <div css={layoutStyle}>{children}</div>;
};
*/

// 3. Creating reusable theme-based mixins
/*
import { useMiroirTheme, createThemedStyle } from '../contexts/MiroirThemeContext';

const useCustomStyles = () => {
  const { currentTheme } = useMiroirTheme();
  const baseStyles = createThemedStyle(currentTheme);
  
  return {
    ...baseStyles,
    
    // Custom style extensions
    highlightBox: css`
      ${baseStyles.card}
      border-left: 4px solid ${currentTheme.colors.accent};
      background: ${currentTheme.colors.accentLight};
    `,
    
    dangerBox: css`
      ${baseStyles.card}
      border-left: 4px solid ${currentTheme.colors.error};
      background: ${currentTheme.colors.errorLight};
    `,
    
    flexBetween: css`
      display: flex;
      justify-content: space-between;
      align-items: center;
    `,
  };
};
*/

// ################################################################################################
// Best Practices for Theme Migration
// ################################################################################################

/*
1. GRADUAL MIGRATION
   - Start with new components using the theme system
   - Gradually migrate existing components one at a time
   - Keep the old Style.tsx for compatibility during transition

2. COMPONENT CONSISTENCY
   - Use ThemedButton, ThemedInput, ThemedContainer for common patterns
   - Create custom themed components for app-specific needs
   - Maintain consistent spacing, colors, and typography

3. PERFORMANCE CONSIDERATIONS
   - Theme context changes trigger re-renders
   - Use useMemo for expensive style calculations
   - Consider memoizing themed components that don't change often

4. TESTING THEME CHANGES
   - Test all theme variants (default, dark, compact, material)
   - Verify responsive behavior across breakpoints
   - Check accessibility with different contrast ratios

5. CUSTOM THEME CREATION
   - Extend existing themes rather than creating from scratch
   - Use createMiroirTheme() for consistent structure
   - Document custom theme properties for team use

6. CSS VARIABLES INTEGRATION
   - Use applyCSSVariables() for global theme application
   - Integrate with existing CSS that can't be easily migrated
   - Maintain consistency between JS and CSS styling

Example of gradual migration approach:

// Phase 1: Add theme providers (already done in RootComponent)
// Phase 2: Update high-traffic components first
// Phase 3: Create themed replacements for common patterns
// Phase 4: Migrate component-by-component
// Phase 5: Remove old styled components
// Phase 6: Add custom themes and advanced features
*/

export {};

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

// ################################################################################################
// Icon and Button Components
// 
// Various button and icon components with different styles and sizes
// ################################################################################################

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

export const ThemedSizedButton: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  onClick,
  id,
  name,
  'aria-label': ariaLabel,
  title
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
    <button 
      css={buttonStyles} 
      className={className} 
      style={style} 
      onClick={onClick}
      id={id}
      name={name}
      aria-label={ariaLabel}
      title={title}
    >
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

export const ThemedIconButton: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  onClick,
  title,
  id,
  'aria-label': ariaLabel
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    padding: currentTheme.spacing.sm,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: currentTheme.borderRadius.sm,
    color: currentTheme.colors.text,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '2.5em',
    minHeight: '2.5em',
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    '&:hover': {
      backgroundColor: currentTheme.colors.hover,
    },
    '&:active': {
      backgroundColor: currentTheme.colors.selected || currentTheme.colors.primary + '20',
    },
    '&:focus': {
      outline: `2px solid ${currentTheme.colors.primary}`,
      outlineOffset: '2px',
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
    'Interests': 'interests',
    'Book': 'book',
    'book': 'menu_book',
    'Books': 'menu_book',
    'books': 'menu_book',
    'south': 'south',
    'error': 'error',
    'category': 'category',
    'list': 'list',
    'location_on': 'location_on',
    // Common fallback icons
    'default': 'menu',
    'fallback': 'menu',
    // Add more mappings as needed
  };
  
  // Get the mapped icon name or use the original if no mapping exists
  const iconName = typeof children === 'string' ? (iconNameMap[children] || children || 'menu') : children;
  
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

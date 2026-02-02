/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';
import { getSpinnerStyles } from './spinner';
import { useMiroirContextService } from '../../MiroirContextReactProvider';
import { CodeBlock_ReadOnly } from '../Reports/CodeBlock_ReadOnly.js';

// ################################################################################################
// Basic Themed Components
// 
// Basic themed components like containers, buttons, text, etc.
// ################################################################################################

// Helper function to get base container styles
const getBaseContainerStyles = (currentTheme: any) => ({
  padding: currentTheme.spacing.md,
  backgroundColor: currentTheme.colors.background,
  color: currentTheme.colors.text,
  fontFamily: currentTheme.typography.fontFamily,
});

// Simple container component that uses the theme
export const ThemedContainer: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css(getBaseContainerStyles(currentTheme));

  return (
    <div css={containerStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// Foldable container component with clickable title
export const ThemedFoldableContainer: React.FC<ThemedComponentProps & {
  title: string | React.ReactNode;
  initiallyFolded?: boolean;
}> = ({ 
  children, 
  title,
  className, 
  style,
  initiallyFolded = false
}) => {
  const { currentTheme } = useMiroirTheme();
  const [isFolded, setIsFolded] = React.useState(initiallyFolded);
  
  const containerStyles = css(getBaseContainerStyles(currentTheme));

  const headerStyles = css({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: isFolded ? 0 : currentTheme.spacing.md,
    position: "sticky",
    top: 0,
    backgroundColor: currentTheme.colors.background,
    zIndex: 1000,
    padding: `${currentTheme.spacing.sm} 0`,
    boxShadow: currentTheme.elevation.low,
    cursor: 'pointer',
    userSelect: 'none',
  });

  const titleWrapperStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: currentTheme.spacing.sm,
    flex: 1,
  });

  const iconStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
    color: currentTheme.colors.textSecondary,
    transition: 'transform 0.2s ease',
    transform: isFolded ? 'rotate(0deg)' : 'rotate(90deg)',
    display: 'inline-block',
    flexShrink: 0,
  });

  const titleElementStyles = css({
    margin: 0,
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.xl,
    fontWeight: currentTheme.typography.fontWeight.bold,
  });

  const handleToggle = () => {
    setIsFolded(!isFolded);
  };

  return (
    <div css={containerStyles} className={className} style={style}>
      <div css={headerStyles} onClick={handleToggle}>
        <div css={titleWrapperStyles}>
          {typeof title === 'string' ? (
            <h1 css={titleElementStyles}>{title}</h1>
          ) : (
            title
          )}
          <span css={iconStyles}>▶</span>
        </div>
      </div>
      {!isFolded && children}
    </div>
  );
};

// Progressive Accordion component with clickable summary
export const ThemedProgressiveAccordion: React.FC<ThemedComponentProps & {
  summary: string | React.ReactNode;
  initiallyExpanded?: boolean;
}> = ({ 
  children, 
  summary,
  className, 
  style,
  initiallyExpanded = false
}) => {
  const { currentTheme } = useMiroirTheme();
  const [isExpanded, setIsExpanded] = React.useState(initiallyExpanded);
  
  const accordionContainerStyles = css({
    backgroundColor: currentTheme.colors.surface,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.md,
    marginBottom: currentTheme.spacing.md,
    overflow: 'hidden',
  });

  const summaryStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: currentTheme.spacing.sm,
    padding: currentTheme.spacing.md,
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: currentTheme.colors.surface,
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: currentTheme.colors.background,
    },
  });

  const iconStyles = css({
    fontSize: currentTheme.typography.fontSize.md,
    color: currentTheme.colors.textSecondary,
    transition: 'transform 0.2s ease',
    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
    display: 'inline-block',
    flexShrink: 0,
  });

  const summaryContentStyles = css({
    flex: 1,
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.md,
    fontWeight: currentTheme.typography.fontWeight.normal,
  });

  const detailsStyles = css({
    padding: `0 ${currentTheme.spacing.md} ${currentTheme.spacing.md} ${currentTheme.spacing.md}`,
    backgroundColor: currentTheme.colors.surface,
  });

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div css={accordionContainerStyles} className={className} style={style}>
      <div css={summaryStyles} onClick={handleToggle}>
        <span css={iconStyles}>▶</span>
        <div css={summaryContentStyles}>{summary}</div>
      </div>
      {isExpanded && (
        <div css={detailsStyles}>
          {children}
        </div>
      )}
    </div>
  );
};

// Simple button component that uses the theme
export const ThemedButton: React.FC<ThemedComponentProps & {
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  onClick,
  variant = 'primary',
  loading = false,
  disabled = false
}) => {
  const { currentTheme } = useMiroirTheme();
  const isDisabled = disabled || loading;
  
  const buttonStyles = css({
    padding: `${currentTheme.spacing.sm} ${currentTheme.spacing.md}`,
    backgroundColor: variant === 'primary' ? currentTheme.colors.primary : currentTheme.colors.secondary,
    // Use surface color (white/light) for text on colored button backgrounds for proper contrast
    color: currentTheme.colors.surface,
    border: 'none',
    borderRadius: currentTheme.borderRadius.md,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.md,
    fontWeight: currentTheme.typography.fontWeight.normal,
    opacity: isDisabled ? 0.6 : 1,
    pointerEvents: isDisabled ? 'none' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: currentTheme.spacing.xs,
    '&:hover': isDisabled ? {} : {
      backgroundColor: variant === 'primary' ? currentTheme.colors.primaryDark : currentTheme.colors.secondaryDark,
    },
  });

  const spinnerStyles = getSpinnerStyles(currentTheme, {
    color: currentTheme.colors.surface, // fallback
    topColor: 'rgba(255,255,255,0.95)',
    sizeEm: 0.9,
    marginRight: currentTheme.spacing.xs,
  });

  return (
    <button css={buttonStyles} className={className} style={style} onClick={isDisabled ? undefined : onClick} disabled={isDisabled}>
      {loading && <span css={spinnerStyles} />}
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
  // const containerRef = React.useRef<HTMLDivElement>(null);
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
export const ThemedOnScreenDebug: React.FC<ThemedComponentProps & {
  label?: string;
  data: any;
  initiallyUnfolded?: boolean;
  useCodeBlock?: boolean;
  copyButton?: boolean;
}> = ({ 
  label,
  data,
  className, 
  style,
  initiallyUnfolded = true,
  useCodeBlock = false,
  copyButton = false
}) => {
  const context = useMiroirContextService();
  const { currentTheme } = useMiroirTheme();
  if (!context.showDebugInfo) {
    return null;
  }
  return (
    <ThemedOnScreenHelper
      label={label}
      data={data}
      className={className}
      style={{...style, background: currentTheme.colors.warningLight}}
      initiallyUnfolded={initiallyUnfolded}
      useCodeBlock={useCodeBlock}
      copyButton={copyButton}
    />
  );
}
// ################################################################################################
// On-screen debug/helper component for displaying structured data
export const ThemedOnScreenHelper: React.FC<ThemedComponentProps & {
  label?: string;
  data: any;
  initiallyUnfolded?: boolean;
  useCodeBlock?: boolean;
  copyButton?: boolean;
}> = ({ 
  label,
  data,
  className, 
  style,
  initiallyUnfolded = true,
  useCodeBlock = false,
  copyButton = false
}) => {
  const { currentTheme } = useMiroirTheme();
  const [isUnfolded, setIsUnfolded] = React.useState(initiallyUnfolded);
  
  const containerStyles = css({
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.sm,
    padding: currentTheme.spacing.sm,
    margin: `${currentTheme.spacing.sm} 0`,
    fontFamily: 'monospace',
    lineHeight: currentTheme.typography.lineHeight.normal,
  });

  const headerStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: currentTheme.spacing.sm,
    cursor: 'pointer',
    userSelect: 'none',
  });

  const iconStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
    color: currentTheme.colors.textSecondary,
    transition: 'transform 0.2s ease',
    transform: isUnfolded ? 'rotate(90deg)' : 'rotate(0deg)',
    display: 'inline-block',
  });

  const labelStyles = css({
    fontWeight: currentTheme.typography.fontWeight.bold,
    color: currentTheme.colors.textSecondary,
  });

  const copyButtonStyles = css({
    marginLeft: 'auto',
    padding: `${currentTheme.spacing.xs || '4px'} ${currentTheme.spacing.sm}`,
    backgroundColor: currentTheme.colors.primary,
    color: currentTheme.colors.surface,
    border: 'none',
    borderRadius: currentTheme.borderRadius.sm,
    cursor: 'pointer',
    fontSize: currentTheme.typography.fontSize.sm,
    fontFamily: currentTheme.typography.fontFamily,
    '&:hover': {
      backgroundColor: currentTheme.colors.primaryDark,
    },
  });

  const dataStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    marginTop: currentTheme.spacing.sm,
  });

  const handleToggle = () => {
    setIsUnfolded(!isUnfolded);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(jsonString);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div css={containerStyles} className={className} style={style}>
      <div css={headerStyles} onClick={handleToggle}>
        <span css={iconStyles}>▶</span>
        {label && <span css={labelStyles}>{label}</span>}
        {copyButton && (
          <button type="button" css={copyButtonStyles} onClick={handleCopy}>
            Copy
          </button>
        )}
      </div>
      {isUnfolded && (
        useCodeBlock ? (
          <CodeBlock_ReadOnly value={jsonString} />
        ) : (
          <pre css={dataStyles}>
            {jsonString}
          </pre>
        )
      )}
    </div>
  );
};

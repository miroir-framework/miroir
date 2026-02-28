/** @jsxImportSource @emotion/react */
// ################################################################################################

import { css } from '@emotion/react';
import React from "react";


import { useMiroirContextService } from "../../contexts/MiroirContextReactProvider";
import { useMiroirTheme } from "../../contexts/MiroirThemeContext";
import type { ThemedComponentProps } from "./BaseTypes";
import { CodeBlock_ReadOnly } from '../CodeBlock_ReadOnly';

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

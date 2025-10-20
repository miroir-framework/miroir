/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { useMemo } from 'react';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

// ################################################################################################
// Display Components
// 
// Components for displaying values, cards, loading states, etc.
// ################################################################################################

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
      title={title || (typeof value === "string" && value.length > maxLength ? value : undefined)}
    >
      {displayValue}
    </span>
  );
};

export const ThemedDisplayValue: React.FC<ThemedComponentProps & {
  value: any;
  type?: string;
  isNull?: boolean;
  isUndefined?: boolean;
}> = ({ 
  value, 
  type, 
  isNull = false,
  isUndefined = false,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const displayValue = useMemo(() => {
    if (isNull || value === null) return 'null';
    if (isUndefined || value === undefined) return 'undefined';
    if (type === 'boolean') return value ? 'true' : 'false';
    if (type === 'bigint') return value.toString();
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }, [value, type, isNull, isUndefined]);

  const displayStyles = css({
    padding: `${currentTheme.spacing.xs} ${currentTheme.spacing.sm}`,
    backgroundColor: currentTheme.colors.surfaceVariant || '#f5f5f5',
    borderRadius: currentTheme.borderRadius.sm,
    fontFamily: 'monospace',
    fontSize: currentTheme.typography.fontSize.sm,
    color: currentTheme.colors.text,
    border: `1px solid ${currentTheme.colors.border}`,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    minHeight: '1.5em',
    display: 'inline-block',
    verticalAlign: 'baseline',
  });

  return (
    <span css={displayStyles} className={className} style={style}>
      {displayValue}
    </span>
  );
};

export const ThemedDisplayLabel: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const labelStyles = css({
    fontWeight: 'medium',
    color: currentTheme.colors.text,
    marginRight: currentTheme.spacing.sm,
    fontSize: currentTheme.typography.fontSize.md,
  });

  return (
    <span css={labelStyles} className={className} style={style}>
      {children}
    </span>
  );
};

export const ThemedDisplayArray: React.FC<ThemedComponentProps & {
  items: any[];
  maxDisplayItems?: number;
}> = ({ 
  items, 
  maxDisplayItems = 5,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const displayStyles = css({
    padding: currentTheme.spacing.sm,
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.sm,
    border: `1px solid ${currentTheme.colors.border}`,
    color: currentTheme.colors.text,
  });

  const itemCount = items?.length || 0;
  const hasMoreItems = itemCount > maxDisplayItems;
  const displayItems = hasMoreItems ? items.slice(0, maxDisplayItems) : items;

  return (
    <div css={displayStyles} className={className} style={style}>
      <div style={{ fontSize: currentTheme.typography.fontSize.sm, marginBottom: currentTheme.spacing.xs }}>
        Array ({itemCount} items)
      </div>
      {displayItems?.map((item, index) => (
        <div key={index} style={{ marginLeft: currentTheme.spacing.md, marginBottom: currentTheme.spacing.xs }}>
          [{index}]: <ThemedDisplayValue value={item} />
        </div>
      ))}
      {hasMoreItems && (
        <div style={{ 
          marginLeft: currentTheme.spacing.md, 
          fontStyle: 'italic',
          color: currentTheme.colors.textSecondary 
        }}>
          ... and {itemCount - maxDisplayItems} more items
        </div>
      )}
    </div>
  );
};

export const ThemedDisplayObject: React.FC<ThemedComponentProps & {
  object: Record<string, any>;
  maxDisplayProperties?: number;
}> = ({ 
  object, 
  maxDisplayProperties = 5,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const displayStyles = css({
    padding: currentTheme.spacing.sm,
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.sm,
    border: `1px solid ${currentTheme.colors.border}`,
    color: currentTheme.colors.text,
  });

  const properties = Object.entries(object || {});
  const hasMoreProperties = properties.length > maxDisplayProperties;
  const displayProperties = hasMoreProperties ? properties.slice(0, maxDisplayProperties) : properties;

  return (
    <div css={displayStyles} className={className} style={style}>
      <div style={{ fontSize: currentTheme.typography.fontSize.sm, marginBottom: currentTheme.spacing.xs }}>
        Object ({properties.length} properties)
      </div>
      {displayProperties.map(([key, value]) => (
        <div key={key} style={{ marginLeft: currentTheme.spacing.md, marginBottom: currentTheme.spacing.xs }}>
          <span style={{ fontWeight: 'bold' }}>{key}</span>: <ThemedDisplayValue value={value} />
        </div>
      ))}
      {hasMoreProperties && (
        <div style={{ 
          marginLeft: currentTheme.spacing.md, 
          fontStyle: 'italic',
          color: currentTheme.colors.textSecondary 
        }}>
          ... and {properties.length - maxDisplayProperties} more properties
        </div>
      )}
    </div>
  );
};

export const ThemedCard: React.FC<ThemedComponentProps & {
  elevation?: number;
  padding?: string;
}> = ({ 
  children, 
  elevation = 1,
  padding,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const cardStyles = css({
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.md,
    padding: padding || currentTheme.spacing.md,
    boxShadow: elevation > 0 ? `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)` : 'none',
    border: `1px solid ${currentTheme.colors.border}`,
    color: currentTheme.colors.text,
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
    padding: `0 ${currentTheme.spacing.md} ${currentTheme.spacing.md}`,
    '&:last-child': {
      paddingBottom: currentTheme.spacing.md,
    },
  });

  return (
    <div css={contentStyles} className={className} style={style}>
      {children}
    </div>
  );
};

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
      fontSize: currentTheme.typography.fontSize.sm,
      whiteSpace: 'nowrap',
      zIndex: 1000,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    },
  });

  return (
    <div css={tooltipStyles} className={className} style={style}>
      {children}
    </div>
  );
};

// ################################################################################################
// Blob Display Components
// 
// Components for displaying and editing blob/file content
// ################################################################################################

export const ThemedBlobContainer: React.FC<ThemedComponentProps & {
  isDragActive?: boolean;
  isClickable?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}> = ({ 
  children, 
  isDragActive = false,
  isClickable = false,
  onClick,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    width: '200px',
    height: '200px',
    border: `2px solid ${isDragActive ? currentTheme.colors.primary : currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.md,
    backgroundColor: currentTheme.colors.surface,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    cursor: isClickable ? 'pointer' : 'default',
    transition: 'border-color 0.2s ease',
    '&:hover': isClickable ? {
      borderColor: currentTheme.colors.primary,
    } : {},
    '@media (max-width: 768px)': {
      width: '150px',
      height: '150px',
    },
  });

  return (
    <div 
      css={containerStyles} 
      className={className} 
      style={style}
      onClick={onClick}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {children}
    </div>
  );
};

export const ThemedBlobPreview: React.FC<ThemedComponentProps & {
  src: string;
  alt?: string;
  onClick?: (e: React.MouseEvent) => void;
}> = ({ 
  src, 
  alt = 'Preview',
  onClick,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const previewStyles = css({
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    cursor: onClick ? 'pointer' : 'default',
  });

  return (
    <img 
      css={previewStyles} 
      src={src} 
      alt={alt}
      onClick={onClick}
      className={className} 
      style={style}
    />
  );
};

export const ThemedBlobEmptyState: React.FC<ThemedComponentProps & {
  icon?: React.ReactNode;
  message?: string;
}> = ({ 
  icon,
  message = 'Upload file',
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const emptyStateStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: currentTheme.spacing.sm,
    color: currentTheme.colors.textSecondary,
    border: `2px dashed ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.md,
    padding: currentTheme.spacing.lg,
    width: '100%',
    height: '100%',
  });

  const iconStyles = css({
    fontSize: '48px',
    color: currentTheme.colors.textSecondary,
  });

  const textStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
    textAlign: 'center',
  });

  return (
    <div css={emptyStateStyles} className={className} style={style}>
      {icon && <div css={iconStyles}>{icon}</div>}
      <div css={textStyles}>{message}</div>
    </div>
  );
};

export const ThemedBlobMetadata: React.FC<ThemedComponentProps & {
  filename?: string;
  mimeType?: string;
}> = ({ 
  filename,
  mimeType,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const metadataStyles = css({
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: currentTheme.spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    fontSize: currentTheme.typography.fontSize.xs,
    textAlign: 'center',
    overflow: 'hidden',
  });

  const filenameStyles = css({
    fontWeight: 'normal',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  const mimeTypeStyles = css({
    fontSize: currentTheme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  });

  return (
    <div css={metadataStyles} className={className} style={style}>
      {filename && <div css={filenameStyles}>{filename}</div>}
      {mimeType && <div css={mimeTypeStyles}>{mimeType}</div>}
    </div>
  );
};

export const ThemedBlobIconDisplay: React.FC<ThemedComponentProps & {
  icon: React.ReactNode;
  filename?: string;
  mimeType?: string;
}> = ({ 
  icon,
  filename,
  mimeType,
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const displayStyles = css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: currentTheme.spacing.sm,
    padding: currentTheme.spacing.md,
    width: '100%',
    height: '100%',
  });

  const iconStyles = css({
    fontSize: '64px',
    color: currentTheme.colors.textSecondary,
  });

  const filenameStyles = css({
    fontSize: currentTheme.typography.fontSize.sm,
    fontWeight: 'normal',
    textAlign: 'center',
    wordBreak: 'break-word',
    maxWidth: '100%',
  });

  const mimeTypeStyles = css({
    fontSize: currentTheme.typography.fontSize.xs,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  });

  return (
    <div css={displayStyles} className={className} style={style}>
      <div css={iconStyles}>{icon}</div>
      {filename && <div css={filenameStyles}>{filename}</div>}
      {mimeType && <div css={mimeTypeStyles}>{mimeType}</div>}
    </div>
  );
};

export const ThemedBlobDropZone: React.FC<ThemedComponentProps & {
  message?: string;
}> = ({ 
  message = 'Drop file here',
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const dropZoneStyles = css({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${currentTheme.colors.primary}20`,
    border: `3px dashed ${currentTheme.colors.primary}`,
    borderRadius: currentTheme.borderRadius.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'none',
  });

  const textStyles = css({
    fontSize: currentTheme.typography.fontSize.md,
    fontWeight: 'bold',
    color: currentTheme.colors.primary,
  });

  return (
    <div css={dropZoneStyles} className={className} style={style}>
      <div css={textStyles}>{message}</div>
    </div>
  );
};

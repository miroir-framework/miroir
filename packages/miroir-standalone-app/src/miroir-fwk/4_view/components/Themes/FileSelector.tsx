/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { useCallback } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import { CloudUploadIcon, CheckCircle as CheckCircleIcon, Clear as ClearIcon } from './MaterialSymbolWrappers';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';
// removed Node 'path' import; use browser-safe string operations instead

// ################################################################################################
export interface FileSelectorProps extends Omit<ThemedComponentProps, 'children'> {
  /** Title for the file selector section */
  title?: string;
  /** Description text shown below the title */
  description?: string;
  /** Button label for file selection */
  buttonLabel?: string;
  /** Accepted file types (e.g., ".json", ".csv", ".json,.txt") */
  accept?: string;
  /** Whether to allow folder selection instead of file selection */
  folder?: boolean;
  /** Callback when a file is selected */
  onFileSelect?: (fileOrPath: File | string) => void;
  /** Callback when file is cleared */
  onFileClear?: () => void;
  /** Current selected file name to display */
  selectedFileName?: string | null;
  /** Error message to display */
  error?: string | null;
  /** Success message to display */
  successMessage?: string | null;
  /** Whether to show the border around the component */
  showBorder?: boolean;
  /** Compact mode for inline form display (single line, minimal padding) */
  compact?: boolean;
}


// export const devRelativePathPrefix = "../tests/tmp/";
export const devRelativePathPrefix = "tests/tmp/";
export const prodRelativePathPrefix = "./deployments/";

const getDirectoryFromWebkitPath = (webkitPath: string) => {
  if (!webkitPath) return "";
  // Normalize backslashes to forward slashes then remove trailing slash if any
  const normalized = webkitPath.replace(/\\/g, "/").replace(/\/$/, "");
  const parts = normalized.split("/");
  if (parts.length <= 1) return "";
  parts.pop(); // remove last element (file name)
  return parts.join("/");
};
// ################################################################################################
/**
 * Reusable File Selector Component
 * 
 * A themable file upload component that provides:
 * - File selection button with icon
 * - Display of selected file name
 * - Error and success feedback
 * - Clear file functionality
 * - Consistent styling with Miroir theme
 */
export const FileSelector: React.FC<FileSelectorProps> = ({
  title = "Select File",
  description,
  buttonLabel = "Select File",
  accept = "*",
  folder = false,
  onFileSelect,
  onFileClear,
  selectedFileName,
  error,
  successMessage,
  showBorder = true,
  compact = false,
  className,
  style,
}) => {
  const { currentTheme } = useMiroirTheme();

  // Helper to extract directory from webkitRelativePath in browser (no Node path module)

  // Handle file input change
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('FileSelector - Selected file:', file, event.target);
    if (file && onFileSelect) {
      if (folder) {
        const prefix =
          process.env.NODE_ENV === "development" ? devRelativePathPrefix : prodRelativePathPrefix;
        console.warn("Folder selection is not fully supported in all browsers.", file.webkitRelativePath);
        const dir = file.webkitRelativePath ? prefix + getDirectoryFromWebkitPath(file.webkitRelativePath) : "";
        onFileSelect(dir || file.name);
      } else {
        onFileSelect(file);
      }
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  }, [onFileSelect, folder]);

  // Handle clear button click
  const handleClear = useCallback(() => {
    if (onFileClear) {
      onFileClear();
    }
  }, [onFileClear]);

  // Container styles
  const containerStyles = css({
    marginBottom: compact ? 0 : currentTheme.spacing.lg,
    padding: compact ? currentTheme.spacing.xs : currentTheme.spacing.md,
    border: showBorder ? `1px solid ${currentTheme.colors.border}` : 'none',
    borderRadius: compact ? 0 : currentTheme.borderRadius.md,
    backgroundColor: compact ? 'transparent' : currentTheme.colors.surface,
  });

  // Title styles
  const titleStyles = css({
    marginBottom: currentTheme.spacing.sm,
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.lg,
    fontWeight: currentTheme.typography.fontWeight.bold,
  });

  // Description styles
  const descriptionStyles = css({
    marginBottom: currentTheme.spacing.md,
    color: currentTheme.colors.textSecondary,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.sm,
    lineHeight: currentTheme.typography.lineHeight.normal,
  });

  // File info container styles
  const fileInfoStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: currentTheme.spacing.sm,
  });

  // File name text styles
  const fileNameStyles = css({
    color: currentTheme.colors.text,
    fontFamily: currentTheme.typography.fontFamily,
    fontSize: currentTheme.typography.fontSize.sm,
  });

  return (
    <Box css={containerStyles} className={className} style={style}>
      {/* Title - hidden in compact mode */}
      {!compact && title && (
        <Typography css={titleStyles} variant="h6" component="h3">
          {title}
        </Typography>
      )}

      {/* Description - hidden in compact mode */}
      {!compact && description && (
        <Typography css={descriptionStyles} variant="body2">
          {description}
        </Typography>
      )}

      {/* File selection controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 1 : 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          component="label"
          size={compact ? "small" : "medium"}
          startIcon={<CloudUploadIcon />}
        >
          {buttonLabel}
          <input
            type="file"
            accept={folder ? undefined : accept}
            hidden
            {...(folder ? { 
              webkitdirectory: "" as any, 
              directory: "" as any,
              mozdirectory: "" as any 
            } : {})}
            onChange={handleFileChange}
          />
        </Button>

        {/* Selected file display */}
        {selectedFileName && (
          <Box css={fileInfoStyles}>
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: compact ? '1rem' : '1.25rem' }} />
            <Typography css={fileNameStyles} variant={compact ? "caption" : "body2"}>
              {selectedFileName}
            </Typography>
            <Button
              size="small"
              variant="text"
              startIcon={<ClearIcon />}
              onClick={handleClear}
            >
              Clear
            </Button>
          </Box>
        )}
      </Box>

      {/* Error message - hidden in compact mode */}
      {!compact && error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Success message - hidden in compact mode */}
      {!compact && successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}
    </Box>
  );
};
